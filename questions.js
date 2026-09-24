/* =====================================================================
   MedQCM — questions.js
   ---------------------------------------------------------------------
   C'est le SEUL fichier à modifier pour ajouter du contenu.

   Ce fichier contient 3 blocs :
     1. SETTINGS    → réglages (par ex. mélanger les questions)
     2. CURRICULUM  → la structure : années → modules → chapitres
     3. QUESTIONS   → la liste de toutes les questions

   COMMENT AJOUTER UNE QUESTION ?
   Copiez ce modèle à la fin de la liste QUESTIONS (n'oubliez pas la
   virgule après la question précédente) :

     {
       id: 16,                       // numéro UNIQUE (jamais deux fois le même)
       year: "1ère année",
       module: "Anatomie",
       chapter: "Thorax",
       question: "Texte de la question ?",
       options: ["Choix A", "Choix B", "Choix C", "Choix D"],
       correctAnswer: 2,             // 0 = A, 1 = B, 2 = C, 3 = D
       explanation: "Courte explication de la bonne réponse."
     },

   Si vous utilisez une année, un module ou un chapitre qui n'existe pas
   encore dans CURRICULUM, l'application le crée automatiquement.
   ===================================================================== */


/* ---------------------------------------------------------------------
   1. RÉGLAGES
   --------------------------------------------------------------------- */
const SETTINGS = {
  // true  = l'ordre des questions est mélangé à chaque nouvelle série
  // false = les questions restent dans l'ordre de la liste
  shuffleQuestions: false
};


/* ---------------------------------------------------------------------
   2. STRUCTURE (années → modules → chapitres)
   Les éléments listés ici apparaissent à l'écran même s'ils n'ont pas
   encore de questions : ils s'affichent alors comme "Bientôt disponible".
   --------------------------------------------------------------------- */
const CURRICULUM = {
  "1ère année": {
    "Anatomie": ["Thorax", "Abdomen", "Membre supérieur", "Membre inférieur", "Tête et cou"],
    "Physiologie": [],
    "Biochimie": [],
    "Histologie": [],
    "Embryologie": [],
    "Biophysique": [],
    "Biostatistiques": []
  },
  "2ème année": {},
  "3ème année": {},
  "4ème année": {},
  "5ème année": {},
  "6ème année": {},
  "7ème année": {}
};


/* ---------------------------------------------------------------------
   3. QUESTIONS
   --------------------------------------------------------------------- */
const QUESTIONS = [

  /* ===== 1ère année → Anatomie → Thorax ===== */

  {
    id: 1,
    year: "1ère année",
    module: "Anatomie",
    chapter: "Thorax",
    question: "Le thorax est situé :",
    options: [
      "Entre le bassin et les membres inférieurs",
      "Entre le cou et l’abdomen",
      "Entre le crâne et le cou",
      "Entre l’abdomen et le bassin"
    ],
    correctAnswer: 1,
    explanation: "Le thorax est la région supérieure du tronc, située entre le cou et l’abdomen."
  },
  {
    id: 2,
    year: "1ère année",
    module: "Anatomie",
    chapter: "Thorax",
    question: "La cavité thoracique comprend :",
    options: [
      "Une seule cavité",
      "Deux cavités médiastinales",
      "Deux cavités pleuropulmonaires et le médiastin",
      "Trois cavités pleuropulmonaires"
    ],
    correctAnswer: 2,
    explanation: "Elle comprend deux cavités pleuropulmonaires latérales et une cavité centrale appelée médiastin."
  },
  {
    id: 3,
    year: "1ère année",
    module: "Anatomie",
    chapter: "Thorax",
    question: "Le médiastin est situé :",
    options: [
      "Derrière la colonne vertébrale",
      "Entre les deux cavités pleuropulmonaires",
      "À l’intérieur des poumons",
      "Sous le diaphragme"
    ],
    correctAnswer: 1,
    explanation: "Le médiastin est situé entre les deux cavités pleuropulmonaires."
  },
  {
    id: 4,
    year: "1ère année",
    module: "Anatomie",
    chapter: "Thorax",
    question: "De l’avant vers l’arrière, le médiastin comprend :",
    options: [
      "Antérieur, moyen, postérieur",
      "Supérieur, moyen, inférieur",
      "Antérieur, inférieur, postérieur",
      "Moyen, antérieur, postérieur"
    ],
    correctAnswer: 0,
    explanation: "Le médiastin est décrit d’avant vers l’arrière comme antérieur, moyen et postérieur."
  },
  {
    id: 5,
    year: "1ère année",
    module: "Anatomie",
    chapter: "Thorax",
    question: "La limite antérieure de la cage thoracique est constituée par :",
    options: [
      "La colonne thoracique",
      "Les côtes",
      "Le sternum",
      "Le diaphragme"
    ],
    correctAnswer: 2,
    explanation: "Le sternum constitue la limite antérieure de la cage thoracique."
  },
  {
    id: 6,
    year: "1ère année",
    module: "Anatomie",
    chapter: "Thorax",
    question: "La limite postérieure de la cage thoracique est :",
    options: [
      "Le sternum",
      "La colonne thoracique",
      "Les côtes",
      "Le diaphragme"
    ],
    correctAnswer: 1,
    explanation: "La colonne thoracique constitue la limite postérieure de la cage thoracique."
  },
  {
    id: 7,
    year: "1ère année",
    module: "Anatomie",
    chapter: "Thorax",
    question: "L’ouverture inférieure du thorax est fermée par :",
    options: [
      "Le sternum",
      "Les muscles intercostaux",
      "Le diaphragme",
      "Les côtes flottantes"
    ],
    correctAnswer: 2,
    explanation: "L’ouverture inférieure du thorax est fermée par le diaphragme."
  },
  {
    id: 8,
    year: "1ère année",
    module: "Anatomie",
    chapter: "Thorax",
    question: "Le squelette thoracique comprend :",
    options: [
      "Sternum, colonne thoracique, côtes et cartilages costaux",
      "Sternum, clavicule et scapula uniquement",
      "Colonne cervicale, sternum et bassin",
      "Côtes et os iliaques"
    ],
    correctAnswer: 0,
    explanation: "Le squelette thoracique comprend le sternum, la colonne thoracique, les côtes et les cartilages costaux."
  },
  {
    id: 9,
    year: "1ère année",
    module: "Anatomie",
    chapter: "Thorax",
    question: "Le sternum est :",
    options: [
      "Un os long",
      "Un os court",
      "Un os plat situé sur la ligne médiane",
      "Un os irrégulier situé postérieurement"
    ],
    correctAnswer: 2,
    explanation: "Le sternum est un os plat situé sur la ligne médiane."
  },
  {
    id: 10,
    year: "1ère année",
    module: "Anatomie",
    chapter: "Thorax",
    question: "Le sternum comprend :",
    options: [
      "Manubrium, corps et processus xiphoïde",
      "Corps, col et tête",
      "Manubrium, clavicule et corps",
      "Corps, arc et processus transverse"
    ],
    correctAnswer: 0,
    explanation: "Le sternum comprend trois parties : le manubrium, le corps et le processus xiphoïde."
  },
  {
    id: 11,
    year: "1ère année",
    module: "Anatomie",
    chapter: "Thorax",
    question: "L’angle de Louis se trouve entre :",
    options: [
      "Le corps et le processus xiphoïde",
      "Le manubrium et le corps du sternum",
      "Le sternum et la clavicule",
      "Les deux premières côtes"
    ],
    correctAnswer: 1,
    explanation: "L’angle de Louis se situe entre le manubrium et le corps du sternum."
  },
  {
    id: 12,
    year: "1ère année",
    module: "Anatomie",
    chapter: "Thorax",
    question: "La colonne thoracique comporte :",
    options: [
      "7 vertèbres",
      "10 vertèbres",
      "12 vertèbres",
      "14 vertèbres"
    ],
    correctAnswer: 2,
    explanation: "La colonne thoracique comporte 12 vertèbres."
  },
  {
    id: 13,
    year: "1ère année",
    module: "Anatomie",
    chapter: "Thorax",
    question: "Combien de paires de côtes possède l’être humain ?",
    options: [
      "10",
      "11",
      "12",
      "14"
    ],
    correctAnswer: 2,
    explanation: "L’être humain possède 12 paires de côtes."
  },
  {
    id: 14,
    year: "1ère année",
    module: "Anatomie",
    chapter: "Thorax",
    question: "Les côtes 11 et 12 sont appelées :",
    options: [
      "Côtes vraies",
      "Côtes fausses",
      "Côtes flottantes",
      "Côtes sternales"
    ],
    correctAnswer: 2,
    explanation: "Les 11e et 12e côtes sont les côtes flottantes."
  },
  {
    id: 15,
    year: "1ère année",
    module: "Anatomie",
    chapter: "Thorax",
    question: "Parmi les muscles suivants, lequel appartient aux muscles de la paroi antérolatérale du thorax ?",
    options: [
      "Trapèze",
      "Grand pectoral",
      "Rhomboïde",
      "Grand dorsal"
    ],
    correctAnswer: 1,
    explanation: "Le grand pectoral appartient aux muscles de la paroi antérolatérale du thorax."
  }

  /* ---- Ajoutez vos nouvelles questions ICI (après une virgule) ---- */

];
