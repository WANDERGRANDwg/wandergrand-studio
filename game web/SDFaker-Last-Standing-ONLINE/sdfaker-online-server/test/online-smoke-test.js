'use strict';

const assert = require('node:assert/strict');
const { WebSocket } = require('ws');
const URL = process.env.TEST_WS_URL || 'ws://127.0.0.1:8080/ws';
let nextRid = 1;

function openSocket() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(URL);
    const timeout = setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
    ws.once('open', () => { clearTimeout(timeout); resolve(ws); });
    ws.once('error', err => { clearTimeout(timeout); reject(err); });
  });
}
function rpc(ws, action, payload = {}) {
  const rid = nextRid++;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      ws.off('message', onMessage);
      reject(new Error(`Timeout on ${action}`));
    }, 5000);
    function onMessage(raw) {
      let message;
      try { message = JSON.parse(raw.toString()); } catch { return; }
      if (message.rid !== rid) return;
      clearTimeout(timeout);
      ws.off('message', onMessage);
      resolve(message.data);
    }
    ws.on('message', onMessage);
    ws.send(JSON.stringify({ rid, action, payload }));
  });
}

(async () => {
  let a, b;
  try {
    a = await openSocket();
    b = await openSocket();

    let status = await rpc(a, 'status');
    assert.equal(status.ok, true, 'health/status should respond');
    assert.equal(status.online, 0, 'fresh server should start with zero players');
    assert.equal(status.maxPlayers, null, 'MAX_PLAYERS=0 should mean no software-level cap');
    assert.equal(status.record, 0, 'a fresh room/server should have no session record');

    const first = await rpc(a, 'join');
    assert.equal(first.ok, true, 'first player should create the session automatically');
    assert.equal(first.created, true, 'the first player should create the one shared room');
    const second = await rpc(b, 'join');
    assert.equal(second.ok, true, 'second real connection should join the same session');
    assert.equal(second.created, false, 'later players should join, not create a second room');
    assert.notEqual(first.id, second.id, 'players must have unique IDs');
    const duplicateJoin = await rpc(a, 'join');
    assert.equal(duplicateJoin.id, first.id, 'one WebSocket must not create duplicate player slots');

    status = await rpc(a, 'status');
    assert.equal(status.online, 2, 'online count must represent two real WebSocket players');
    assert.equal(status.sessionActive, true, 'session should be active');

    const forgedSync = await rpc(b, 'sync', { id:first.id, ev:-1, need:[], acts:[] });
    assert.equal(forgedSync.err, 'unauthorized', 'a connection must not control a different player ID');
    const forgedLeave = await rpc(b, 'leave', { id:first.id });
    assert.equal(forgedLeave.err, 'unauthorized', 'a connection must not disconnect another player');

    const nameA = await rpc(a, 'claim', { id:first.id, name:'OnlineA', code:'' });
    const nameB = await rpc(b, 'claim', { id:second.id, name:'OnlineA', code:'' });
    assert.equal(nameA.ok, true, 'first player should reserve an unused name');
    assert.equal(nameB.err, 'taken', 'duplicate name must be rejected');

    const startA = await rpc(a, 'start', { id:first.id, name:'OnlineA', code:'', app:{gender:'m',size:'normal',body:'#2fbf4f'} });
    const startB = await rpc(b, 'start', { id:second.id, name:'OnlineB', code:'', app:{gender:'f',size:'normal',body:'#2fbf4f'} });
    assert.equal(startA.ok, true, 'first player should enter the match');
    assert.equal(startB.ok, true, 'second player should enter the match');

    const syncA = await rpc(a, 'sync', { id:first.id, ev:-1, need:[], acts:[] });
    const syncB = await rpc(b, 'sync', { id:second.id, ev:-1, need:[], acts:[] });
    assert.equal(syncA.ok, true);
    assert.equal(syncB.ok, true);
    assert.equal(syncA.online, 2);
    assert.equal(syncA.players.length, 2, 'first client must receive the other real player');
    assert.equal(syncB.players.length, 2, 'second client must receive the first real player');

    await rpc(a, 'leave', { id:first.id });
    const releasedName = await rpc(b, 'claim', { id:second.id, name:'OnlineA', code:'' });
    assert.equal(releasedName.ok, true, 'a name must become available when its owner leaves');
    status = await rpc(b, 'status');
    assert.equal(status.online, 1, 'leaving one player must leave the other connected');
    await rpc(b, 'leave', { id:second.id });
    status = await rpc(b, 'status');
    assert.equal(status.online, 0, 'session must have zero players after both leave');
    assert.equal(status.sessionActive, false, 'empty session must close automatically');
    assert.equal(status.record, 0, 'session record must reset when the last player leaves');

    const third = await rpc(b, 'join');
    assert.equal(third.ok, true, 'a later Play must automatically create a fresh room');
    assert.equal(third.created, true);
    status = await rpc(b, 'status');
    assert.equal(status.online, 1);
    assert.equal(status.record, 0, 'fresh room must not retain the previous room record');
    await rpc(b, 'leave', { id:third.id });

    console.log('PASS: auto-create/join, no duplicate slots, name release, player sync, empty-room cleanup and fresh-room reset.');
  } catch (err) {
    console.error('FAIL:', err.stack || err);
    process.exitCode = 1;
  } finally {
    if (a && a.readyState === WebSocket.OPEN) a.close();
    if (b && b.readyState === WebSocket.OPEN) b.close();
  }
})();
