# SDFaker: Last Standing, Most Kills — online backend

This folder contains the separate Node.js WebSocket backend used by `SDFaker-Last-Standing-ONLINE.html`.
The browser client is not the host. The backend owns the online session, the real-player count, names, damage, kills, the top-three list, the session timer and the saved server record.

## Important architecture

The game page can stay on GitHub Pages, but GitHub Pages only serves static files. It cannot run this Node.js WebSocket server. Deploy this folder as a separate, persistent Node.js service that supports WebSocket upgrades. The website connects to it over **WSS**.

The first real `PLAY` connection creates one session automatically. Further connections join that session. The session stays alive while at least one player remains, and closes after the last player leaves or times out. There are no bots in online mode. The default server cap is 32 real connections and can be adjusted with `MAX_PLAYERS`.

## Requirements

- Node.js 20 or newer
- npm
- A persistent Node.js hosting service or VPS with WebSocket support
- One running backend instance for this prototype; do not deploy multiple replicas yet

## Run locally

```bash
cd sdfaker-online-server
npm install
cp .env.example .env
```

Set `ADMIN_NAME_CODE` in the local `.env` or your host's private environment settings. It must be the creator code you chose for the reserved name `Jika`. Do not place this code in the public HTML or commit it to Git.

For a local browser test, use two terminals. In the server terminal, temporarily allow the local page origin:

```bash
ALLOWED_ORIGINS=http://localhost:8000 npm start
```

In the second terminal, serve the game page (do not open it as `file://`):

```bash
cd /path/to/the/folder/containing-the-html
python3 -m http.server 8000
```

For this local test only, change the HTML endpoint to `ws://127.0.0.1:8080/ws`. Open `http://localhost:8000/SDFaker-Last-Standing-ONLINE.html` in two separate browsers. After testing, restore the secure `wss://` URL and the production `ALLOWED_ORIGINS` setting.

For a hosted backend, start it with:

```bash
npm start
```

Health endpoint:

```text
http://127.0.0.1:8080/health
```

WebSocket endpoint:

```text
ws://127.0.0.1:8080/ws
```

When serving the game page over HTTPS, the browser must connect using `wss://` (not `ws://`). A production reverse proxy or hosting provider must terminate TLS and forward WebSocket upgrades to this service.

## Configure the HTML client

Open `SDFaker-Last-Standing-ONLINE.html` and search for this line near the end:

```js
window.SDFAKER_SERVER_URL = window.SDFAKER_SERVER_URL || "wss://YOUR-SDFaker-SERVER-DOMAIN/ws";
```

Replace the placeholder with the real secure URL assigned by your backend host, for example:

```js
window.SDFAKER_SERVER_URL = window.SDFAKER_SERVER_URL || "wss://your-actual-server.example/ws";
```

The example domain is not a live server. Use the real hostname supplied by your hosting provider. Upload the edited HTML to your static website only after the backend is online.

## Environment variables

- `PORT`: port supplied by the host (default 8080)
- `MAX_PLAYERS`: maximum simultaneous real players (default 32, configurable)
- `ADMIN_NAME_CODE`: private code used to claim the reserved name `Jika`
- `ALLOWED_ORIGINS`: comma-separated exact browser origins. The default is `https://wandergrandwg.github.io`; replace it with the exact production site origin(s) when using a different domain. For local browser tests, set `http://localhost:8000` temporarily.
- `DATA_FILE`: location of the saved server record JSON. Use persistent storage/volume if the host's container filesystem is temporary

Use these production settings at minimum:

```text
MAX_PLAYERS=32
ALLOWED_ORIGINS=https://wandergrandwg.github.io
ADMIN_NAME_CODE=<your-private-creator-code>
```

Do not publish the private code. Restrict `ALLOWED_ORIGINS` to the actual website domain(s). Use a persistent disk or a database for the record; otherwise a host restart may erase the saved record.

## Automated two-client smoke test

With the backend running and npm dependencies installed:

```bash
npm test
```

The smoke test connects two independent WebSocket clients and checks:

- the session begins with zero players
- the first connection creates the session automatically
- the second connection joins that same session
- a repeated join on one socket does not create a duplicate player
- one connection cannot control or disconnect another player's ID
- two real players can reserve names and duplicate names are rejected
- both clients receive both player states
- leaving one player keeps the session alive for the other
- leaving the final player closes the session

For the final browser test, open the deployed page on two different devices or in two separate browsers. Join with different names, move both characters, exchange shots, then disconnect one client. A test with only one browser tab does not prove multiplayer works.

## Android touch controls and camera settings

- Touch input is detected automatically on coarse-pointer/touch devices by default.
- Players can also open **OPTIONS → INTERFACE** and use **ENABLE TOUCH CONTROLS / DISABLE TOUCH CONTROLS**. This choice is saved in the browser and applies immediately.
- The same toggle is also available in **CONTROLS**. The on-screen layout includes movement joystick, camera-look area, fire, aim, jump, run, reload, heal and pickup.
- The default vertical camera direction is natural: dragging the mouse/finger upward looks upward. The camera inversion option remains available to players who prefer inverted Y.
- Gamepad menu navigation is handled by one controller-navigation loop to prevent double activation of menu buttons.

## What this prototype validates — and what it does not

- Online players are real WebSocket clients; bots are not created or counted.
- Session creation, real online count, unique names, reloads, healing, health, kills, scores, top-three data, weather state and server record are managed by the backend.
- The server validates basic movement bounds/speed and authoritative shot cooldown and player hit detection.
- The browser still performs detailed movement collision against the generated 3D environment. The backend does **not** yet contain a full shared collider map for every house, tree, rock, roof, ruin and prop. A modified client could exploit some interior collisions.
- Server-side line-of-sight currently checks terrain and the city perimeter walls, not every interior building or decorative object. Some shots may therefore pass through interior props until a shared server collision map is added.
- This is an online prototype, not a fully hardened competitive shooter. Before public competitive release, add full server-side world collision, authentication/rate controls suitable for production, reconnect/session recovery, monitoring, backups and persistent database storage.
- One backend process owns one shared session. Multi-instance scaling requires shared session storage, event distribution and distributed name/record locking.

Do not advertise the game as live multiplayer until the backend has been deployed, the real WSS URL has been inserted into the HTML, and the two-client browser test passes.
