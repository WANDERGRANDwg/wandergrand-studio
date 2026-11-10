/* WANDERGRAND STUDIO — multilingual interface and small UI interactions */

const translations = {
    en: {
        skip_link: "Skip to content",
        nav_home: "Home", nav_web_game: "Game Web", nav_game: "Game", nav_software: "Software", nav_contact: "Contact",
        hero_kicker: "A WORLD OF OUR OWN", hero_title_line1: "Beyond the", hero_title_line2: "known world.",
        hero_subtitle: "Independent worlds, unforgettable journeys, and creative tools born from imagination.",
        hero_cta_primary: "Discover our worlds", hero_cta_secondary: "Explore our creations",
        hero_signature: "IMAGINED IN MADAGASCAR · MADE FOR EVERYWHERE", art_top: "THE WANDERER'S CREST", art_side: "EST. IN MADAGASCAR",
        scroll_label: "DESCEND INTO OUR WORLD", strip_one: "WORLDS TO EXPLORE", strip_two: "TOOLS TO CREATE", strip_three: "IDEAS WITHOUT BORDERS",
        web_kicker: "PLAY IN YOUR BROWSER", web_game_title: "Web games", web_intro: "Small portals to other worlds. Open, play, and discover.",
        status_dev: "In Development", status_test: "Test Version", category_web: "BROWSER GAME", web_game_desc: "A new street-racing experience is taking shape. More details will be revealed soon.",
        coming_soon: "A NEW JOURNEY IS TAKING SHAPE <span aria-hidden=\"true\">↗</span>",
        game_kicker: "WORLDS & ADVENTURES", game_title: "Our games", game_intro: "Places to get lost in. Stories waiting to be lived.",
        category_game: "VIDEO GAME", game_art_label: "AN ADVENTURE IN THE MAKING", rain_desc: "A mysterious adventure shaped by exploration, forgotten places, and encounters.",
        in_the_works: "IN THE WORKS <span aria-hidden=\"true\">✧</span>",
        software_kicker: "MADE TO BUILD", software_title: "Creative tools", software_intro: "Our own instruments for shaping ideas, worlds, and experiences.",
        category_software: "CREATIVE SOFTWARE", category_engine: "GAME ENGINE",
        vmada_desc: "A 3D creation software built with Malagasy creators in mind.",
        engine_desc: "A game engine designed to make game creation more accessible to Malagasy creators.",
        contact_kicker: "SEND A MESSAGE THROUGH THE FOG", contact_title: "Find your way to us",
        contact_text: "Have a question, found a bug, or wish to create something together? Our door is open.",
        donation_text: "Support the journey", footer_line: "Independent creations from Madagascar.", rights: "ALL RIGHTS RESERVED.",
        menu_open: "Open navigation", menu_close: "Close navigation", back_top: "Back to top"
    },
    fr: {
        skip_link: "Aller au contenu",
        nav_home: "Accueil", nav_web_game: "Jeu web", nav_game: "Jeux", nav_software: "Logiciels", nav_contact: "Contact",
        hero_kicker: "UN MONDE À PART", hero_title_line1: "Au-delà du", hero_title_line2: "monde connu.",
        hero_subtitle: "Des mondes indépendants, des aventures inoubliables et des outils créatifs nés de l'imagination.",
        hero_cta_primary: "Découvrir nos mondes", hero_cta_secondary: "Explorer nos créations",
        hero_signature: "IMAGINÉ À MADAGASCAR · CRÉÉ POUR LE MONDE", art_top: "L'EMBLÈME DU VOYAGEUR", art_side: "NÉ À MADAGASCAR",
        scroll_label: "ENTREZ DANS NOTRE UNIVERS", strip_one: "DES MONDES À EXPLORER", strip_two: "DES OUTILS POUR CRÉER", strip_three: "DES IDÉES SANS FRONTIÈRES",
        web_kicker: "JOUEZ DANS VOTRE NAVIGATEUR", web_game_title: "Jeux web", web_intro: "De petits passages vers d'autres mondes. Ouvrez, jouez et découvrez.",
        status_dev: "En développement", status_test: "Version de test", category_web: "JEU NAVIGATEUR", web_game_desc: "Une nouvelle expérience de course urbaine prend forme. Plus de détails bientôt.",
        coming_soon: "UNE NOUVELLE AVENTURE SE PRÉPARE <span aria-hidden=\"true\">↗</span>",
        game_kicker: "MONDES & AVENTURES", game_title: "Nos jeux", game_intro: "Des lieux où se perdre. Des histoires à vivre.",
        category_game: "JEU VIDÉO", game_art_label: "UNE AVENTURE EN CONSTRUCTION", rain_desc: "Une aventure mystérieuse placée sous le signe de l'exploration, des lieux oubliés et des rencontres.",
        in_the_works: "EN COURS DE CRÉATION <span aria-hidden=\"true\">✧</span>",
        software_kicker: "FAIT POUR CRÉER", software_title: "Outils créatifs", software_intro: "Nos propres instruments pour donner forme aux idées, aux mondes et aux expériences.",
        category_software: "LOGICIEL CRÉATIF", category_engine: "MOTEUR DE JEU",
        vmada_desc: "Un logiciel de création 3D pensé avec les créateurs malgaches.",
        engine_desc: "Un moteur de jeu conçu pour rendre la création de jeux plus accessible aux créateurs malgaches.",
        contact_kicker: "ENVOYEZ UN MESSAGE À TRAVERS LA BRUME", contact_title: "Retrouvez notre chemin",
        contact_text: "Une question, un bug à signaler ou l'envie de créer ensemble ? Notre porte est ouverte.",
        donation_text: "Soutenir l'aventure", footer_line: "Des créations indépendantes de Madagascar.", rights: "TOUS DROITS RÉSERVÉS.",
        menu_open: "Ouvrir la navigation", menu_close: "Fermer la navigation", back_top: "Retour en haut"
    },
    mg: {
        skip_link: "Hankany amin'ny votoaty",
        nav_home: "Fandraisana", nav_web_game: "Lalao web", nav_game: "Lalao", nav_software: "Rindranasa", nav_contact: "Fifandraisana",
        hero_kicker: "TONTOLO MANOKANA", hero_title_line1: "Mihoatra ny", hero_title_line2: "tontolo fantatra.",
        hero_subtitle: "Tontolo foronina, dia tsy hay hadinoina ary fitaovana famoronana avy amin'ny saina.",
        hero_cta_primary: "Jereo ny tontolonay", hero_cta_secondary: "Diniho ny zavatra noforoninay",
        hero_signature: "NOFORONINA ETO MADAGASIKARA · HO AN'IZAO TONTOLO IZAO", art_top: "MARIKY NY MPANDEHA", art_side: "NIPOITRA ETO MADAGASIKARA",
        scroll_label: "MIDIRA AO AMIN'NY TONTOLO", strip_one: "TONTOLO AZO DIDIANA", strip_two: "FITAOVANA HAMORONANA", strip_three: "HEVITRA TSY MISY FETRA",
        web_kicker: "MILALAOA AO AMIN'NY NAVIGATEUR", web_game_title: "Lalao web", web_intro: "Varavarana kely mankany amin'ny tontolo hafa. Sokafy, milalaova ary fantaro.",
        status_dev: "Eo am-pamolavolana", status_test: "Dika andrana", category_web: "LALAO NAVIGATEUR", web_game_desc: "Eo am-panamboarana ny lalao hazakazaka an-tanàna vaovao. Havoaka tsy ho ela ny antsipiriany.",
        coming_soon: "MISY DIA VAOVAO OMANA <span aria-hidden=\"true\">↗</span>",
        game_kicker: "TONTOLO & DIA", game_title: "Ny lalaonay", game_intro: "Toerana hahavery tena. Tantara miandry ny hiainana.",
        category_game: "LALAO VIDEO", game_art_label: "DIA EO AM-PIOMANANA", rain_desc: "Dia mistery mifototra amin'ny fikarohana, toerana adino ary fihaonana.",
        in_the_works: "EO AM-PANAMBOARANA <span aria-hidden=\"true\">✧</span>",
        software_kicker: "NATAO HAMORONANA", software_title: "Fitaovana famoronana", software_intro: "Fitaovana manokana hanomezana endrika ny hevitra sy ny tontolo foronina.",
        category_software: "RINDRANASA FAMORONANA", category_engine: "MOTERA LALAO",
        vmada_desc: "Rindranasa famoronana 3D natao hiarahana amin'ny mpamorona Malagasy.",
        engine_desc: "Motera lalao natao hanamorana kokoa ny famoronana lalao ho an'ny mpamorona Malagasy.",
        contact_kicker: "ALEFASO ETO NY HAFATRAO", contact_title: "Mifandraisa aminay",
        contact_text: "Manana fanontaniana, nahita olana, sa te hiara-hamorona? Misokatra ho anao ny varavaranay.",
        donation_text: "Tohano ny tetikasa", footer_line: "Famoronana mahaleo tena avy eto Madagasikara.", rights: "ZO REHETRA VOATOKANA.",
        menu_open: "Sokafy ny fitetezana", menu_close: "Akombony ny fitetezana", back_top: "Hiverina any ambony"
    }
};

let currentLanguage = "en";

function changeLanguage(lang) {
    if (!translations[lang]) return;
    currentLanguage = lang;

    document.querySelectorAll("[data-i18n]").forEach((element) => {
        const key = element.dataset.i18n;
        const translated = translations[lang][key];
        if (typeof translated === "string") {
            // A few labels intentionally contain a tiny decorative span.
            if (key === "coming_soon" || key === "in_the_works") {
                element.innerHTML = translated;
            } else {
                element.textContent = translated;
            }
        }
    });

    document.documentElement.lang = lang;
    document.querySelectorAll(".lang-switcher button").forEach((button) => {
        const active = button.dataset.lang === lang;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
    });
    updateMenuAccessibility();

    try { localStorage.setItem("wandergrand-language", lang); } catch (_) { /* Storage may be disabled. */ }
}

const menuToggle = document.getElementById("menu-toggle");
const primaryNav = document.getElementById("primary-nav");
const siteHeader = document.getElementById("site-header");
const backToTop = document.getElementById("back-to-top");
const progressBar = document.getElementById("scroll-progress-bar");

function updateMenuAccessibility() {
    if (!menuToggle) return;
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-label", translations[currentLanguage][isOpen ? "menu_close" : "menu_open"]);
}

function setMenuOpen(open) {
    if (!menuToggle || !primaryNav) return;
    menuToggle.setAttribute("aria-expanded", String(open));
    primaryNav.classList.toggle("open", open);
    updateMenuAccessibility();
}

if (menuToggle) {
    menuToggle.addEventListener("click", () => {
        setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
    });
}

if (primaryNav) {
    primaryNav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => setMenuOpen(false));
    });
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenuOpen(false);
});

document.querySelectorAll(".lang-switcher button").forEach((button) => {
    button.addEventListener("click", () => changeLanguage(button.dataset.lang));
});

function updateScrollUI() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    if (progressBar) progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    if (siteHeader) siteHeader.classList.toggle("is-scrolled", window.scrollY > 20);
    if (backToTop) backToTop.classList.toggle("visible", window.scrollY > 480);
}
window.addEventListener("scroll", updateScrollUI, { passive: true });
window.addEventListener("resize", () => {
    if (window.innerWidth > 780) setMenuOpen(false);
});
updateScrollUI();

if (backToTop) {
    backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

// Reveal cards as they enter the viewport; show them immediately on older browsers.
const revealItems = document.querySelectorAll("[data-reveal]");
if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    revealItems.forEach((item) => revealObserver.observe(item));
} else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
}

// Highlight the navigation item for the section currently in view.
const observedSections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".nav-link");
if ("IntersectionObserver" in window && observedSections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                navLinks.forEach((link) => {
                    const active = link.getAttribute("href") === `#${entry.target.id}`;
                    link.classList.toggle("active", active);
                });
            }
        });
    }, { rootMargin: "-35% 0px -55% 0px" });
    observedSections.forEach((section) => sectionObserver.observe(section));
}

const year = document.getElementById("current-year");
if (year) year.textContent = String(new Date().getFullYear());

try {
    const savedLanguage = localStorage.getItem("wandergrand-language");
    if (savedLanguage && translations[savedLanguage]) changeLanguage(savedLanguage);
} catch (_) { /* The default language remains English. */ }

// Keep the original function available for compatibility with older inline links.
window.changeLanguage = changeLanguage;
