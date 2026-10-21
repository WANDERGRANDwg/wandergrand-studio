/* ==========================================================================
   SDFAKER AI — WANDERGRAND
   Cerveau local à correspondance de mots-clés.
   100 % navigateur · aucun réseau · aucun historique.
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     Le dictionnaire d'intentions
     Chaque intention possède des déclencheurs et trois réponses.
     ------------------------------------------------------------------------ */

  var INTENTS = {
    greeting: {
      triggers: {
        fr: ["bonjour", "salut", "bonsoir", "coucou", "bonne journée", "bonne journee"],
        en: ["hello", "hi", "hey", "good morning", "good evening", "greetings"],
        mg: ["manao ahoana", "manahoana", "manaova", "salama", "tompoko", "ahoana"]
      },
      labels: { fr: "Salutation", en: "Greeting", mg: "Fiarahabana" },
      responses: {
        fr: "Bonjour, je suis SDFAKER AI. Comment puis-je vous aider ?",
        en: "Hello, I am SDFAKER AI. How can I help you?",
        mg: "Manao ahoana, izaho dia SDFAKER AI. Ahoana no ahafahako manampy anao ?"
      }
    },

    identity: {
      triggers: {
        fr: ["qui es-tu", "qui es tu", "qui etes-vous", "qui etes vous", "presente-toi", "presente toi", "tu es qui", "ton identite", "sdfaker ai"],
        en: ["who are you", "what are you", "who r u", "introduce yourself", "your identity", "who is sdfaker ai"],
        mg: ["iza ianao", "inona ianao", "iza moa ianao", "mampahafantatra tena", "iza sdfaker ai"]
      },
      labels: { fr: "Identité", en: "Identity", mg: "Mombamomba" },
      responses: {
        fr: "Je suis une IA locale ultra-légère développée par WANDERGRAND. Je fonctionne sans internet.",
        en: "I am an ultra-light local AI built by WANDERGRAND. I work without an internet connection.",
        mg: "Izaho dia AI eo an-toerana maivana noforonin'ny WANDERGRAND. Miasa tsy misy internet aho."
      }
    },

    game: {
      triggers: {
        fr: ["jeu", "sdfaker rian", "kya", "rpg", "action-rpg", "ile maudite", "pluie", "parle-moi du jeu"],
        en: ["game", "sdfaker rian", "kya", "rpg", "action-rpg", "cursed island", "rain", "tell me about the game"],
        mg: ["lalao", "sdfaker rian", "kya", "rpg", "action-rpg", "nosy voaozona", "orana", "lazao ahy ny lalao"]
      },
      labels: { fr: "Le jeu", en: "The game", mg: "Ny lalao" },
      responses: {
        fr: "SDFAKER RIAN est un action-RPG 3D où vous incarnez Kya sur une île maudite par la pluie.",
        en: "SDFAKER RIAN is a 3D action-RPG where you play as Kya on an island cursed by rain.",
        mg: "SDFAKER RIAN dia lalao action-RPG 3D izay ianao no mitana an'i Kya ao amin'ny nosy voaozona noho ny orana."
      }
    },

    thanks: {
      triggers: {
        fr: ["merci", "merci beaucoup", "avec plaisir"],
        en: ["thanks", "thank you", "thank you very much", "cheers"],
        mg: ["misaotra", "misaotra betsaka", "misaotra anao"]
      },
      labels: { fr: "Gratitude", en: "Gratitude", mg: "Fisaorana" },
      responses: {
        fr: "Avec plaisir. Que puis-je faire d'autre pour vous ?",
        en: "You're welcome. Is there anything else I can do for you?",
        mg: "Tsy misy fisaorana. Inona koa no azoko atao ho anao ?"
      }
    },

    fallback: {
      triggers: { fr: [], en: [], mg: [] },
      labels: { fr: "Aide / repli", en: "Help / fallback", mg: "Fanampiana" },
      responses: {
        fr: "Je suis une petite IA locale. Je ne comprends que les questions simples sur WANDERGRAND et SDFAKER RIAN.",
        en: "I am a small local AI. I only understand simple questions about WANDERGRAND and SDFAKER RIAN.",
        mg: "AI kely eo an-toerana aho. Tsy mahatakatra afa-tsy fanontaniana tsotra momba an'i WANDERGRAND sy SDFAKER RIAN."
      }
    }
  };

  /* L'identité passe avant la salutation : « bonjour, qui es-tu ? » */
  var INTENT_ORDER = ["identity", "game", "thanks", "greeting"];

  /* Lexiques de détection. Les mots forts pèsent plus lourd. */
  var LANG_MARKERS = {
    fr: {
      strong: ["bonjour", "salut", "bonsoir", "merci", "qui es-tu", "qui es tu", "jeu", "francais", "comment", "pourquoi", "voudrais", "peux-tu", "peux tu", "presente-toi", "bonne journee", "avec plaisir"],
      weak: ["le", "la", "les", "une", "un", "des", "est", "et", "tu", "vous", "je", "mon", "ma", "pour", "avec", "dans", "sur", "du", "de", "que", "qui", "quoi", "parle", "moi"]
    },
    en: {
      strong: ["hello", "hi", "hey", "thanks", "thank you", "who are you", "what is", "what are", "game", "english", "please", "introduce yourself", "how are you", "good morning", "good evening"],
      weak: ["the", "is", "are", "you", "your", "my", "about", "and", "with", "what", "how", "this", "that", "tell", "me"]
    },
    mg: {
      strong: ["manao ahoana", "manahoana", "manaova", "misaotra", "iza ianao", "inona ianao", "lalao", "malagasy", "salama", "tompoko", "ahoana", "azafady", "ny lalao"],
      weak: ["ny", "sy", "ary", "amin", "ao", "aho", "ianao", "izy", "izay", "ve", "moa", "no", "koa", "tsy", "mba", "ity", "io"]
    }
  };

  var LANG_NAMES = { fr: "Français", en: "English", mg: "Malagasy" };
  var LANG_ORDER = ["en", "mg"]; // le français reste la voix par défaut en cas d'égalité

  var REDUCED_MOTION = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  /* ------------------------------------------------------------------------
     Références DOM
     ------------------------------------------------------------------------ */

  var chatLog = document.getElementById("chatLog");
  var chatForm = document.getElementById("chatForm");
  var userInput = document.getElementById("userInput");
  var sendBtn = document.getElementById("sendBtn");
  var charCount = document.getElementById("charCount");
  var detectPill = document.getElementById("detectPill");
  var detectLang = document.getElementById("detectLang");
  var langRows = Array.prototype.slice.call(document.querySelectorAll("[data-lang-row]"));
  var clearChatBtn = document.getElementById("clearChat");
  var announcer = document.getElementById("srAnnouncer");
  var toast = document.getElementById("toast");

  var activeFinish = null;
  var sessionNumber = 0;
  var sessionId = 0;
  var toastTimer = null;

  /* ------------------------------------------------------------------------
     Outils de texte
     ------------------------------------------------------------------------ */

  function normalize(value) {
    return String(value == null ? "" : value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’‘`´]/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function phraseIn(text, phrase) {
    var needle = normalize(phrase);
    if (!needle) return false;

    if (needle.indexOf(" ") !== -1) {
      return text.indexOf(needle) !== -1;
    }

    var pattern = new RegExp("(^|[^a-z0-9])" + escapeRegExp(needle) + "([^a-z0-9]|$)", "i");
    return pattern.test(text);
  }

  function timeNow() {
    var date = new Date();
    var hours = String(date.getHours()).padStart(2, "0");
    var minutes = String(date.getMinutes()).padStart(2, "0");
    return hours + ":" + minutes;
  }

  /* ------------------------------------------------------------------------
     Détection de la langue
     ------------------------------------------------------------------------ */

  function detectLanguage(rawMessage) {
    var text = normalize(rawMessage);
    var scores = { fr: 0, en: 0, mg: 0 };

    Object.keys(LANG_MARKERS).forEach(function (lang) {
      LANG_MARKERS[lang].strong.forEach(function (phrase) {
        if (phraseIn(text, phrase)) scores[lang] += 3;
      });
      LANG_MARKERS[lang].weak.forEach(function (phrase) {
        if (phraseIn(text, phrase)) scores[lang] += 1;
      });
    });

    /* Les déclencheurs d'intention soutiennent eux aussi la détection. */
    Object.keys(INTENTS).forEach(function (intentKey) {
      Object.keys(INTENTS[intentKey].triggers).forEach(function (lang) {
        INTENTS[intentKey].triggers[lang].forEach(function (phrase) {
          if (phraseIn(text, phrase)) scores[lang] += 2;
        });
      });
    });

    var best = "fr";
    var bestScore = scores.fr;
    LANG_ORDER.forEach(function (lang) {
      /* Un signal faible ne suffit pas à détrôner le français par défaut. */
      if (scores[lang] >= 2 && scores[lang] > bestScore) {
        best = lang;
        bestScore = scores[lang];
      }
    });

    return { lang: best, scores: scores };
  }

  function detectIntent(rawMessage) {
    var text = normalize(rawMessage);
    for (var i = 0; i < INTENT_ORDER.length; i += 1) {
      var key = INTENT_ORDER[i];
      var triggerGroups = INTENTS[key].triggers;
      var languages = Object.keys(triggerGroups);
      for (var j = 0; j < languages.length; j += 1) {
        var phrases = triggerGroups[languages[j]];
        for (var k = 0; k < phrases.length; k += 1) {
          if (phraseIn(text, phrases[k])) return key;
        }
      }
    }
    return "fallback";
  }

  function setDetectedLanguage(lang, animate) {
    var code = lang.toUpperCase();
    detectLang.textContent = code;
    detectPill.setAttribute("title", "Langue détectée : " + LANG_NAMES[lang]);

    langRows.forEach(function (row) {
      var isActive = row.getAttribute("data-lang-row") === lang;
      row.classList.toggle("is-active", isActive);
      var state = row.querySelector(".lang-state");
      if (state) {
        if (isActive) state.textContent = "détectée";
        else if (row.getAttribute("data-lang-row") === "fr") state.textContent = "défaut";
        else state.textContent = "en veille";
      }
    });

    if (animate) {
      detectPill.classList.remove("is-pulsing");
      void detectPill.offsetWidth;
      detectPill.classList.add("is-pulsing");
    }
  }

  /* ------------------------------------------------------------------------
     Construction des messages
     ------------------------------------------------------------------------ */

  function isNearBottom() {
    return chatLog.scrollHeight - chatLog.scrollTop - chatLog.clientHeight < 110;
  }

  function scrollChat(force) {
    if (force || isNearBottom()) {
      chatLog.scrollTop = chatLog.scrollHeight;
    }
  }

  function createAvatar(label, isUser) {
    var avatar = document.createElement("div");
    avatar.className = "msg-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = label;
    if (isUser) avatar.setAttribute("data-user", "true");
    return avatar;
  }

  function addUserMessage(text, lang) {
    var article = document.createElement("article");
    article.className = "msg msg--user";

    var body = document.createElement("div");
    body.className = "msg-body";

    var meta = document.createElement("div");
    meta.className = "msg-meta";

    var author = document.createElement("span");
    author.className = "msg-author";
    author.textContent = "Vous";

    var langTag = document.createElement("span");
    langTag.className = "msg-lang";
    langTag.textContent = lang.toUpperCase();

    var time = document.createElement("span");
    time.className = "msg-time";
    time.textContent = timeNow();

    meta.appendChild(author);
    meta.appendChild(langTag);
    meta.appendChild(time);

    var bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.setAttribute("lang", lang);

    var bubbleText = document.createElement("p");
    bubbleText.className = "bubble-text";
    bubbleText.textContent = text;

    bubble.appendChild(bubbleText);
    body.appendChild(meta);
    body.appendChild(bubble);

    article.appendChild(createAvatar("V", true));
    article.appendChild(body);
    chatLog.appendChild(article);

    return article;
  }

  function createAIMessage(intentKey, lang) {
    var intent = INTENTS[intentKey] || INTENTS.fallback;

    var article = document.createElement("article");
    article.className = "msg msg--ai is-typing";

    var body = document.createElement("div");
    body.className = "msg-body";

    var meta = document.createElement("div");
    meta.className = "msg-meta";

    var author = document.createElement("span");
    author.className = "msg-author";
    author.textContent = "SDFAKER AI";

    var intentTag = document.createElement("span");
    intentTag.className = "msg-intent";
    intentTag.textContent = intent.labels[lang];

    var langTag = document.createElement("span");
    langTag.className = "msg-lang";
    langTag.textContent = lang.toUpperCase();

    var time = document.createElement("span");
    time.className = "msg-time";
    time.textContent = timeNow();

    meta.appendChild(author);
    meta.appendChild(intentTag);
    meta.appendChild(langTag);
    meta.appendChild(time);

    var bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.setAttribute("lang", lang);
    bubble.setAttribute("title", "Cliquez pour afficher la réponse immédiatement");
    bubble.setAttribute("role", "button");
    bubble.setAttribute("tabindex", "0");

    var bubbleText = document.createElement("p");
    bubbleText.className = "bubble-text";
    bubbleText.textContent = "";

    bubble.appendChild(bubbleText);
    body.appendChild(meta);
    body.appendChild(bubble);

    article.appendChild(createAvatar("S", false));
    article.appendChild(body);
    chatLog.appendChild(article);

    return {
      article: article,
      bubble: bubble,
      textEl: bubbleText
    };
  }

  /* ------------------------------------------------------------------------
     Machine à écrire
     ------------------------------------------------------------------------ */

  function typeText(element, fullText) {
    return new Promise(function (resolve) {
      var complete = false;
      var index = 0;
      var timer = null;
      var bubble = element.closest(".bubble");

      function finish() {
        if (complete) return;
        complete = true;
        window.clearInterval(timer);
        element.textContent = fullText;
        element.classList.remove("typing");
        if (bubble) {
          bubble.onclick = null;
          bubble.onkeydown = null;
          bubble.removeAttribute("title");
          bubble.removeAttribute("role");
          bubble.removeAttribute("tabindex");
        }
        var message = element.closest(".msg");
        if (message) message.classList.remove("is-typing");
        if (activeFinish === finish) activeFinish = null;
        scrollChat(false);
        resolve();
      }

      if (REDUCED_MOTION) {
        finish();
        return;
      }

      element.classList.add("typing");

      if (bubble) {
        bubble.onclick = finish;
        bubble.onkeydown = function (event) {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            finish();
          }
        };
      }

      var step = fullText.length > 240 ? 3 : fullText.length > 110 ? 2 : 1;
      var delay = fullText.length > 240 ? 15 : 19;
      timer = window.setInterval(function () {
        index = Math.min(fullText.length, index + step);
        element.textContent = fullText.slice(0, index);
        scrollChat(false);
        if (index >= fullText.length) finish();
      }, delay);

      activeFinish = finish;
    });
  }

  function speakResponse(intentKey, lang) {
    var message = createAIMessage(intentKey, lang);
    var text = INTENTS[intentKey].responses[lang];
    var localSession = sessionId;

    scrollChat(true);

    return typeText(message.textEl, text).then(function () {
      if (localSession !== sessionId) return message;
      announcer.textContent = "SDFAKER AI, en " + LANG_NAMES[lang] + " : " + text;
      return message;
    });
  }

  /* ------------------------------------------------------------------------
     Session
     ------------------------------------------------------------------------ */

  function buildSessionNote(number) {
    var note = document.createElement("div");
    note.className = "session-note";

    var label = document.createElement("span");
    label.textContent = "SESSION " + String(number).padStart(3, "0");

    var line = document.createElement("span");
    line.className = "session-note-line";
    line.setAttribute("aria-hidden", "true");

    var memory = document.createElement("span");
    memory.textContent = "AUCUN HISTORIQUE";

    note.appendChild(label);
    note.appendChild(line);
    note.appendChild(memory);
    return note;
  }

  function startSession(options) {
    var config = options || {};
    sessionNumber += 1;
    sessionId += 1;

    if (typeof activeFinish === "function") activeFinish();

    chatLog.innerHTML = "";
    chatLog.appendChild(buildSessionNote(sessionNumber));

    setDetectedLanguage("fr", false);
    announcer.textContent = "";

    userInput.value = "";
    updateComposer();

    if (config.toastMessage) showToast(config.toastMessage);

    speakResponse("greeting", "fr");

    if (config.revealChat) {
      var interfaceSection = document.getElementById("interface");
      if (interfaceSection) {
        interfaceSection.scrollIntoView({
          behavior: REDUCED_MOTION ? "auto" : "smooth",
          block: "start"
        });
      }
    }

    if (config.focusInput) {
      window.setTimeout(function () {
        userInput.focus({ preventScroll: true });
      }, 250);
    }
  }

  /* ------------------------------------------------------------------------
     Composition et envoi
     ------------------------------------------------------------------------ */

  function updateComposer() {
    var value = userInput.value;
    charCount.textContent = value.length + " / 500";
    sendBtn.disabled = value.trim().length === 0;

    userInput.style.height = "auto";
    userInput.style.height = Math.min(userInput.scrollHeight, 132) + "px";
  }

  function onSubmit(event) {
    if (event) event.preventDefault();
    handleSend(userInput.value);
  }

  function handleSend(rawText) {
    var message = String(rawText == null ? "" : rawText).trim();

    if (!message) {
      showToast("Écrivez un message avant d'envoyer.");
      userInput.focus({ preventScroll: true });
      return;
    }

    if (message.length > 500) message = message.slice(0, 500);

    if (typeof activeFinish === "function") activeFinish();

    var language = detectLanguage(message).lang;
    var intentKey = detectIntent(message);

    setDetectedLanguage(language, true);
    addUserMessage(message, language);

    userInput.value = "";
    updateComposer();
    scrollChat(true);

    speakResponse(intentKey, language);
  }

  function sendPrompt(prompt, originButton) {
    var value = String(prompt || "").trim();
    if (!value) return;

    var insideChat = originButton && originButton.closest(".chat-panel");

    if (!insideChat) {
      var interfaceSection = document.getElementById("interface");
      if (interfaceSection) {
        interfaceSection.scrollIntoView({
          behavior: REDUCED_MOTION ? "auto" : "smooth",
          block: "start"
        });
      }
    }

    handleSend(value);
  }

  /* ------------------------------------------------------------------------
     Toast
     ------------------------------------------------------------------------ */

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 3200);
  }

  /* ------------------------------------------------------------------------
     Écouteurs
     ------------------------------------------------------------------------ */

  chatForm.addEventListener("submit", onSubmit);

  userInput.addEventListener("input", updateComposer);

  userInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      if (userInput.value.trim()) onSubmit(event);
    }
  });

  clearChatBtn.addEventListener("click", function () {
    if (typeof activeFinish === "function") activeFinish();
    startSession({
      toastMessage: "Conversation effacée · le champ est vide.",
      focusInput: false
    });
    userInput.focus({ preventScroll: true });
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-new-session]"), function (button) {
    button.addEventListener("click", function () {
      startSession({
        toastMessage: "Nouvelle session ouverte · aucun historique conservé.",
        focusInput: false,
        revealChat: true
      });
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll("[data-prompt]"), function (button) {
    button.addEventListener("click", function () {
      sendPrompt(button.getAttribute("data-prompt"), button);
    });
  });

  var focusChatLink = document.querySelector("[data-focus-chat]");
  if (focusChatLink) {
    focusChatLink.addEventListener("click", function () {
      window.setTimeout(function () {
        userInput.focus({ preventScroll: true });
      }, REDUCED_MOTION ? 0 : 520);
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && document.activeElement === userInput) {
      userInput.blur();
    }
  });

  /* ------------------------------------------------------------------------
     Démarrage
     ------------------------------------------------------------------------ */

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  updateComposer();
  startSession({ focusInput: false });
})();
