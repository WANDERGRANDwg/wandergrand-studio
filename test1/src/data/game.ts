export type NavLink = { label: string; href: string; index: string };

export const navLinks: NavLink[] = [
  { label: "Le monde", href: "#monde", index: "01" },
  { label: "Kya", href: "#kya", index: "02" },
  { label: "Les 15 clés", href: "#cles", index: "03" },
  { label: "L'Éclicosmique", href: "#eclicosmique", index: "04" },
  { label: "Manuel", href: "#manuel", index: "05" },
];

export type Region = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  weather: string;
  risk: string;
  x: number;
  y: number;
};

export const regions: Region[] = [
  {
    id: "village",
    name: "Brumepierre",
    subtitle: "Le village qui veille",
    description:
      "Dernier foyer de l'île. Des lanternes d'ambre y brûlent jour et nuit, moins pour éclairer les ruelles que pour tenir la brume à distance. C'est ici que Kya reprend son souffle, et que les Veilleurs comptent les clés.",
    weather: "Pluie continue · 12 °C",
    risk: "Sûr",
    x: 55,
    y: 58,
  },
  {
    id: "foret",
    name: "Les Murs de Brume",
    subtitle: "La forêt des Murmures",
    description:
      "Un enchevêtrement de pins noirs et de pierres levées où les Slaches se glissent entre les racines. On raconte que la forêt répète les noms des disparus — et qu'il ne faut jamais répondre.",
    weather: "Brouillard dense · 9 °C",
    risk: "Élevé",
    x: 24,
    y: 39,
  },
  {
    id: "porte",
    name: "La Porte Interdite",
    subtitle: "L'ultime serrure",
    description:
      "Quinze serrures pour une seule porte, taillée dans la falaise. Derrière elle, l'Éclicosmique attend depuis la première pluie. Aucun Veilleur n'en est revenu. Kya compte bien être la première.",
    weather: "Orage électrique · 6 °C",
    risk: "Interdit",
    x: 76,
    y: 25,
  },
  {
    id: "falaise",
    name: "Le Cap des Noyés",
    subtitle: "La côte oubliée",
    description:
      "Des mâts brisés, des marches qui s'effacent sous la mer et, parfois, une lumière bleue au fond de l'eau. C'est là que les pierres bleues s'échouent après les tempêtes.",
    weather: "Rafales · 41 km/h",
    risk: "Modéré",
    x: 84,
    y: 72,
  },
];

export type CharacterMode = {
  id: string;
  label: string;
  icon: "sword" | "wind" | "heal";
  title: string;
  description: string;
  statLabel: string;
  stats: { label: string; value: number }[];
  hint: string;
};

export const characterModes: CharacterMode[] = [
  {
    id: "lame",
    label: "La lame",
    icon: "sword",
    title: "Danse de la Lame",
    description:
      "Une frappe circulaire née des vieux serments. Kya ouvre sa garde un instant, puis tranche l'arc entier devant elle. Chaque coup porté nourrit la jauge d'essence rouge.",
    statLabel: "Efficacité",
    stats: [
      { label: "Portée", value: 72 },
      { label: "Cadence", value: 58 },
      { label: "Impact", value: 84 },
    ],
    hint: "F · Clic gauche",
  },
  {
    id: "brume",
    label: "La brume",
    icon: "wind",
    title: "Pas de Brume",
    description:
      "Kya se dissout dans l'averse et reparaît trois pas plus loin. Assez pour esquiver une frappe de l'Éclicosmique. Pas assez pour oublier la pluie.",
    statLabel: "Mobilité",
    stats: [
      { label: "Distance", value: 66 },
      { label: "Réactivité", value: 92 },
      { label: "Recharge", value: 44 },
    ],
    hint: "Espace",
  },
  {
    id: "soin",
    label: "L'essence",
    icon: "heal",
    title: "L'Éclat Rouge",
    description:
      "Les créatures de l'île saignent une lumière ancienne. En la convertissant, Kya referme ses blessures dans une pulsation écarlate — mais reste exposée le temps de la transmutation.",
    statLabel: "Régénération",
    stats: [
      { label: "Conversion", value: 78 },
      { label: "Exposition", value: 62 },
      { label: "Capacité", value: 88 },
    ],
    hint: "R · Clic droit",
  },
];

export type KeySource = {
  id: string;
  index: string;
  title: string;
  amount: string;
  unit: string;
  description: string;
  icon: "slache" | "stone" | "compass";
};

export const keySources: KeySource[] = [
  {
    index: "I",
    id: "slaches",
    title: "Le tribut des Slaches",
    amount: "1",
    unit: "clé / 10 tués",
    description:
      "Chaque dixième Slache abattu libère une clé de son masque. La méthode la plus directe — et la plus bruyante.",
    icon: "slache",
  },
  {
    index: "II",
    id: "pierres",
    title: "Le troc des Veilleurs",
    amount: "30",
    unit: "pierres / 1 clé",
    description:
      "Les pierres bleues s'éveillent au bord de l'eau. Rapportez-en trente à la gardienne de Brumepierre pour forger une clé.",
    icon: "stone",
  },
  {
    index: "III",
    id: "exploration",
    title: "Ce que l'île garde",
    amount: "6",
    unit: "clés dissimulées",
    description:
      "Falaises, chapelles noyées, tombeaux de marins. Six clés n'attendent aucun combat. Seulement quelqu'un d'assez curieux.",
    icon: "compass",
  },
];

export type BossAttack = {
  id: string;
  index: string;
  name: string;
  damage: string;
  tag: string;
  description: string;
  telegraph: string;
};

export const bossAttacks: BossAttack[] = [
  {
    id: "eclair",
    index: "01",
    name: "Éclair du Néant",
    damage: "4",
    tag: "À distance",
    description:
      "L'Éclicosmique lève le bras et fend l'orage. Une colonne d'éclairs écarlates trace un cercle de mort sur le sol.",
    telegraph: "Le halo derrière sa tête pâlit — fuyez la ligne rouge.",
  },
  {
    id: "frappe",
    index: "02",
    name: "Frappe Colossale",
    damage: "2",
    tag: "Mêlée",
    description:
      "Quatre fois la taille de Kya. Un revers de bras qui laboure la pierre et envoie valser les imprudents.",
    telegraph: "Le titan recule son poing. Deux battements de cœur avant l'impact.",
  },
  {
    id: "eclipse",
    index: "03",
    name: "Onde de l'Éclipse",
    damage: "1",
    tag: "Zone",
    description:
      "Quand sa vie tombe sous le tiers, l'anneau brisé s'ouvre. Une pulsation continue vide les barres les plus fragiles.",
    telegraph: "Le sol se tache de noir. Cherchez les rares piliers de lumière.",
  },
];

export const bossPhases = [
  {
    name: "L'Approche",
    threshold: "100 → 70 %",
    note: "Le titan observe. Il frappe pour juger, pas pour tuer. Apprenez le rythme de ses éclairs.",
  },
  {
    name: "Le Courroux",
    threshold: "70 → 30 %",
    note: "L'orage double. Les frappes s'enchaînent et les éclairs convergent vers Kya. Restez en mouvement.",
  },
  {
    name: "L'Éclipse",
    threshold: "30 → 0 %",
    note: "Le halo se brise. L'onde vide vos barres lentement. C'est le moment de convertir votre essence rouge.",
  },
];

export type ControlKey = {
  action: string;
  azerty: string[];
  qwerty: string[];
  note: string;
};

export const controls: ControlKey[] = [
  {
    action: "Se déplacer",
    azerty: ["Z", "Q", "S", "D"],
    qwerty: ["W", "A", "S", "D"],
    note: "Marcher dans la tempête",
  },
  {
    action: "Caméra orbitale",
    azerty: ["SOURIS"],
    qwerty: ["SOURIS"],
    note: "Troisième personne",
  },
  {
    action: "Sauter",
    azerty: ["ESPACE"],
    qwerty: ["ESPACE"],
    note: "Franchir les ravines",
  },
  {
    action: "Courir",
    azerty: ["MAJ DROITE"],
    qwerty: ["MAJ DROITE"],
    note: "Sprint sous la pluie",
  },
  {
    action: "Attaquer",
    azerty: ["F", "CLIC G."],
    qwerty: ["F", "CLIC G."],
    note: "Tranche devant Kya",
  },
  {
    action: "Se soigner",
    azerty: ["R", "CLIC D."],
    qwerty: ["R", "CLIC D."],
    note: "Convertir l'essence rouge",
  },
  {
    action: "Interagir",
    azerty: ["E"],
    qwerty: ["E"],
    note: "PNJ, clés, pierres",
  },
  {
    action: "Pause",
    azerty: ["ÉCHAP"],
    qwerty: ["ÉCHAP"],
    note: "Menu & sauvegarde",
  },
];

export const systems = [
  {
    label: "Sauvegarde",
    value: "Automatique",
    detail: "JSON · position, vie, clés",
  },
  {
    label: "Chute",
    value: "−2 barres",
    detail: "Réveil au village",
  },
  {
    label: "Météo",
    value: "Pluie & brume",
    detail: "Volume et distance dynamiques",
  },
  {
    label: "Moteur",
    value: "OpenGL 4.6",
    detail: "C++17 · SDL2 · cel-shading",
  },
];

export const tickerItems = [
  "La pluie n'oublie rien",
  "Quinze clés",
  "Une porte scellée",
  "Kya de Brumepierre",
  "L'Éclicosmique s'éveille",
  "WANDERGRAND",
  "Aucun retour",
];
