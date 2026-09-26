/* =====================================================================
   MedQCM — questions.js
   ---------------------------------------------------------------------
   C'est le fichier à modifier pour ajouter du contenu (modules,
   chapitres, questions).

   3 blocs :
     1. SETTINGS    → réglages
     2. CURRICULUM  → Semestre 1 / Semestre 2 → Modules → Chapitres
     3. QUESTIONS   → toutes les questions

   COMMENT AJOUTER UNE QUESTION ?
   Copiez ce modèle à la fin de la liste QUESTIONS :

     {
       id: 16,                     // numéro UNIQUE
       semester: "S1",             // "S1" ou "S2"
       module: "Anatomy",          // doit exister dans CURRICULUM[semester].modules
       chapter: "Thorax",          // créé automatiquement s'il n'existe pas
       question: { fr: "Texte en français ?", en: "Text in English?" },
       options: {
         fr: ["Choix A", "Choix B", "Choix C", "Choix D"],
         en: ["Option A", "Option B", "Option C", "Option D"]
       },
       correctAnswer: 2,           // 0 = A, 1 = B, 2 = C, 3 = D (même index dans les 2 langues)
       explanation: { fr: "Explication en français.", en: "Explanation in English." },
       difficulty: "medium"        // "easy" | "medium" | "hard"
     },

   IMPORTANT : à ce stade, le contenu réel est UNIQUEMENT dans
   Anatomy / Thorax (Semestre 1), avec les 15 questions déjà validées.
   Tous les autres modules listés dans CURRICULUM existent déjà dans la
   structure du produit (S1 : 8 modules, S2 : 10 modules) mais sont
   volontairement vides ("Bientôt disponible") : aucune question n'a
   été inventée pour eux — voir le rapport livré avec cette version.
   ===================================================================== */


/* ---------------------------------------------------------------------
   1. RÉGLAGES
   --------------------------------------------------------------------- */
const SETTINGS = {
  shuffleQuestions: false,   // ordre fixe pour le mode "Toutes les questions"
  quickRevisionCount: 10     // nombre de questions pour "Révision rapide"
};


/* ---------------------------------------------------------------------
   2. STRUCTURE ACADÉMIQUE — 1ère année, Semestre 1 et Semestre 2
   --------------------------------------------------------------------- */
const CURRICULUM = {
  S1: {
    label: { fr: 'Semestre 1', en: 'Semester 1' },
    modules: {
      "Anatomy":       { label: { fr: 'Anatomie', en: 'Anatomy' }, chapters: ["Thorax", "Abdomen", "Membre supérieur", "Membre inférieur", "Tête et cou"] },
      "Biochemistry":  { label: { fr: 'Biochimie', en: 'Biochemistry' }, chapters: [] },
      "Chemistry":     { label: { fr: 'Chimie', en: 'Chemistry' }, chapters: [] },
      "Cytology":      { label: { fr: 'Cytologie', en: 'Cytology' }, chapters: [] },
      "Biophysics":    { label: { fr: 'Biophysique', en: 'Biophysics' }, chapters: [] },
      "Biostatistics": { label: { fr: 'Biostatistiques & Informatique', en: 'Biostatistics & Informatics' }, chapters: [] },
      "Embryology":    { label: { fr: 'Embryologie', en: 'Embryology' }, chapters: [] },
      "SSH":           { label: { fr: 'SSH — Sciences humaines et sociales', en: 'SSH — Humanities & Social Sciences' }, chapters: [] }
    }
  },
  S2: {
    label: { fr: 'Semestre 2', en: 'Semester 2' },
    modules: {
      "Anatomy":       { label: { fr: 'Anatomie', en: 'Anatomy' }, chapters: [] },
      "Biochemistry":  { label: { fr: 'Biochimie', en: 'Biochemistry' }, chapters: [] },
      "Chemistry":     { label: { fr: 'Chimie', en: 'Chemistry' }, chapters: [] },
      "Cytology":      { label: { fr: 'Cytologie', en: 'Cytology' }, chapters: [] },
      "Biophysics":    { label: { fr: 'Biophysique', en: 'Biophysics' }, chapters: [] },
      "Biostatistics": { label: { fr: 'Biostatistiques & Informatique', en: 'Biostatistics & Informatics' }, chapters: [] },
      "Embryology":    { label: { fr: 'Embryologie', en: 'Embryology' }, chapters: [] },
      "SSH":           { label: { fr: 'SSH — Sciences humaines et sociales', en: 'SSH — Humanities & Social Sciences' }, chapters: [] },
      "Histology":     { label: { fr: 'Histologie', en: 'Histology' }, chapters: [] },
      "Physiology":    { label: { fr: 'Physiologie', en: 'Physiology' }, chapters: [] }
    }
  }
};


/* ---------------------------------------------------------------------
   3. QUESTIONS
   --------------------------------------------------------------------- */
const QUESTIONS = [

  /* ===== S1 → Anatomy → Thorax (contenu déjà validé) ===== */

  {
    id: 1, semester: "S1", module: "Anatomy", chapter: "Thorax", difficulty: "easy",
    question: { fr: "Le thorax est situé :", en: "The thorax is located:" },
    options: {
      fr: ["Entre le bassin et les membres inférieurs", "Entre le cou et l’abdomen", "Entre le crâne et le cou", "Entre l’abdomen et le bassin"],
      en: ["Between the pelvis and the lower limbs", "Between the neck and the abdomen", "Between the skull and the neck", "Between the abdomen and the pelvis"]
    },
    correctAnswer: 1,
    explanation: { fr: "Le thorax est la région supérieure du tronc, située entre le cou et l’abdomen.", en: "The thorax is the upper region of the trunk, located between the neck and the abdomen." }
  },
  {
    id: 2, semester: "S1", module: "Anatomy", chapter: "Thorax", difficulty: "medium",
    question: { fr: "La cavité thoracique comprend :", en: "The thoracic cavity includes:" },
    options: {
      fr: ["Une seule cavité", "Deux cavités médiastinales", "Deux cavités pleuropulmonaires et le médiastin", "Trois cavités pleuropulmonaires"],
      en: ["A single cavity", "Two mediastinal cavities", "Two pleuropulmonary cavities and the mediastinum", "Three pleuropulmonary cavities"]
    },
    correctAnswer: 2,
    explanation: { fr: "Elle comprend deux cavités pleuropulmonaires latérales et une cavité centrale appelée médiastin.", en: "It includes two lateral pleuropulmonary cavities and a central cavity called the mediastinum." }
  },
  {
    id: 3, semester: "S1", module: "Anatomy", chapter: "Thorax", difficulty: "easy",
    question: { fr: "Le médiastin est situé :", en: "The mediastinum is located:" },
    options: {
      fr: ["Derrière la colonne vertébrale", "Entre les deux cavités pleuropulmonaires", "À l’intérieur des poumons", "Sous le diaphragme"],
      en: ["Behind the vertebral column", "Between the two pleuropulmonary cavities", "Inside the lungs", "Below the diaphragm"]
    },
    correctAnswer: 1,
    explanation: { fr: "Le médiastin est situé entre les deux cavités pleuropulmonaires.", en: "The mediastinum is located between the two pleuropulmonary cavities." }
  },
  {
    id: 4, semester: "S1", module: "Anatomy", chapter: "Thorax", difficulty: "medium",
    question: { fr: "De l’avant vers l’arrière, le médiastin comprend :", en: "From front to back, the mediastinum includes:" },
    options: {
      fr: ["Antérieur, moyen, postérieur", "Supérieur, moyen, inférieur", "Antérieur, inférieur, postérieur", "Moyen, antérieur, postérieur"],
      en: ["Anterior, middle, posterior", "Superior, middle, inferior", "Anterior, inferior, posterior", "Middle, anterior, posterior"]
    },
    correctAnswer: 0,
    explanation: { fr: "Le médiastin est décrit d’avant vers l’arrière comme antérieur, moyen et postérieur.", en: "The mediastinum is described from front to back as anterior, middle and posterior." }
  },
  {
    id: 5, semester: "S1", module: "Anatomy", chapter: "Thorax", difficulty: "easy",
    question: { fr: "La limite antérieure de la cage thoracique est constituée par :", en: "The anterior boundary of the rib cage is formed by:" },
    options: {
      fr: ["La colonne thoracique", "Les côtes", "Le sternum", "Le diaphragme"],
      en: ["The thoracic spine", "The ribs", "The sternum", "The diaphragm"]
    },
    correctAnswer: 2,
    explanation: { fr: "Le sternum constitue la limite antérieure de la cage thoracique.", en: "The sternum forms the anterior boundary of the rib cage." }
  },
  {
    id: 6, semester: "S1", module: "Anatomy", chapter: "Thorax", difficulty: "easy",
    question: { fr: "La limite postérieure de la cage thoracique est :", en: "The posterior boundary of the rib cage is:" },
    options: {
      fr: ["Le sternum", "La colonne thoracique", "Les côtes", "Le diaphragme"],
      en: ["The sternum", "The thoracic spine", "The ribs", "The diaphragm"]
    },
    correctAnswer: 1,
    explanation: { fr: "La colonne thoracique constitue la limite postérieure de la cage thoracique.", en: "The thoracic spine forms the posterior boundary of the rib cage." }
  },
  {
    id: 7, semester: "S1", module: "Anatomy", chapter: "Thorax", difficulty: "medium",
    question: { fr: "L’ouverture inférieure du thorax est fermée par :", en: "The inferior thoracic opening is closed by:" },
    options: {
      fr: ["Le sternum", "Les muscles intercostaux", "Le diaphragme", "Les côtes flottantes"],
      en: ["The sternum", "The intercostal muscles", "The diaphragm", "The floating ribs"]
    },
    correctAnswer: 2,
    explanation: { fr: "L’ouverture inférieure du thorax est fermée par le diaphragme.", en: "The inferior thoracic opening is closed by the diaphragm." }
  },
  {
    id: 8, semester: "S1", module: "Anatomy", chapter: "Thorax", difficulty: "medium",
    question: { fr: "Le squelette thoracique comprend :", en: "The thoracic skeleton includes:" },
    options: {
      fr: ["Sternum, colonne thoracique, côtes et cartilages costaux", "Sternum, clavicule et scapula uniquement", "Colonne cervicale, sternum et bassin", "Côtes et os iliaques"],
      en: ["Sternum, thoracic spine, ribs and costal cartilages", "Sternum, clavicle and scapula only", "Cervical spine, sternum and pelvis", "Ribs and iliac bones"]
    },
    correctAnswer: 0,
    explanation: { fr: "Le squelette thoracique comprend le sternum, la colonne thoracique, les côtes et les cartilages costaux.", en: "The thoracic skeleton includes the sternum, the thoracic spine, the ribs and the costal cartilages." }
  },
  {
    id: 9, semester: "S1", module: "Anatomy", chapter: "Thorax", difficulty: "easy",
    question: { fr: "Le sternum est :", en: "The sternum is:" },
    options: {
      fr: ["Un os long", "Un os court", "Un os plat situé sur la ligne médiane", "Un os irrégulier situé postérieurement"],
      en: ["A long bone", "A short bone", "A flat bone located on the midline", "An irregular bone located posteriorly"]
    },
    correctAnswer: 2,
    explanation: { fr: "Le sternum est un os plat situé sur la ligne médiane.", en: "The sternum is a flat bone located on the midline." }
  },
  {
    id: 10, semester: "S1", module: "Anatomy", chapter: "Thorax", difficulty: "medium",
    question: { fr: "Le sternum comprend :", en: "The sternum is made up of:" },
    options: {
      fr: ["Manubrium, corps et processus xiphoïde", "Corps, col et tête", "Manubrium, clavicule et corps", "Corps, arc et processus transverse"],
      en: ["Manubrium, body and xiphoid process", "Body, neck and head", "Manubrium, clavicle and body", "Body, arch and transverse process"]
    },
    correctAnswer: 0,
    explanation: { fr: "Le sternum comprend trois parties : le manubrium, le corps et le processus xiphoïde.", en: "The sternum has three parts: the manubrium, the body and the xiphoid process." }
  },
  {
    id: 11, semester: "S1", module: "Anatomy", chapter: "Thorax", difficulty: "hard",
    question: { fr: "L’angle de Louis se trouve entre :", en: "The angle of Louis (sternal angle) is located between:" },
    options: {
      fr: ["Le corps et le processus xiphoïde", "Le manubrium et le corps du sternum", "Le sternum et la clavicule", "Les deux premières côtes"],
      en: ["The body and the xiphoid process", "The manubrium and the body of the sternum", "The sternum and the clavicle", "The first two ribs"]
    },
    correctAnswer: 1,
    explanation: { fr: "L’angle de Louis se situe entre le manubrium et le corps du sternum.", en: "The angle of Louis is located between the manubrium and the body of the sternum." }
  },
  {
    id: 12, semester: "S1", module: "Anatomy", chapter: "Thorax", difficulty: "easy",
    question: { fr: "La colonne thoracique comporte :", en: "The thoracic spine has:" },
    options: {
      fr: ["7 vertèbres", "10 vertèbres", "12 vertèbres", "14 vertèbres"],
      en: ["7 vertebrae", "10 vertebrae", "12 vertebrae", "14 vertebrae"]
    },
    correctAnswer: 2,
    explanation: { fr: "La colonne thoracique comporte 12 vertèbres.", en: "The thoracic spine has 12 vertebrae." }
  },
  {
    id: 13, semester: "S1", module: "Anatomy", chapter: "Thorax", difficulty: "easy",
    question: { fr: "Combien de paires de côtes possède l’être humain ?", en: "How many pairs of ribs does a human have?" },
    options: { fr: ["10", "11", "12", "14"], en: ["10", "11", "12", "14"] },
    correctAnswer: 2,
    explanation: { fr: "L’être humain possède 12 paires de côtes.", en: "A human has 12 pairs of ribs." }
  },
  {
    id: 14, semester: "S1", module: "Anatomy", chapter: "Thorax", difficulty: "medium",
    question: { fr: "Les côtes 11 et 12 sont appelées :", en: "Ribs 11 and 12 are called:" },
    options: {
      fr: ["Côtes vraies", "Côtes fausses", "Côtes flottantes", "Côtes sternales"],
      en: ["True ribs", "False ribs", "Floating ribs", "Sternal ribs"]
    },
    correctAnswer: 2,
    explanation: { fr: "Les 11e et 12e côtes sont les côtes flottantes.", en: "The 11th and 12th ribs are the floating ribs." }
  },
  {
    id: 15, semester: "S1", module: "Anatomy", chapter: "Thorax", difficulty: "medium",
    question: { fr: "Parmi les muscles suivants, lequel appartient aux muscles de la paroi antérolatérale du thorax ?", en: "Which of the following muscles belongs to the anterolateral thoracic wall?" },
    options: {
      fr: ["Trapèze", "Grand pectoral", "Rhomboïde", "Grand dorsal"],
      en: ["Trapezius", "Pectoralis major", "Rhomboid", "Latissimus dorsi"]
    },
    correctAnswer: 1,
    explanation: { fr: "Le grand pectoral appartient aux muscles de la paroi antérolatérale du thorax.", en: "Pectoralis major belongs to the anterolateral thoracic wall muscles." }
  }

  /* ---- Ajoutez vos nouvelles questions ICI (après une virgule) ---- */

];
