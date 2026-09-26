/* =====================================================================
   MedQCM — i18n.js  (textes de l'interface, français / anglais)
   ---------------------------------------------------------------------
   • Ne contient AUCUNE question médicale : uniquement les textes des
     menus, boutons, titres et messages.
   • La langue choisie est mémorisée séparément de l'activation et de
     la progression (aucune des trois ne s'efface entre elles).
   ===================================================================== */
const MedQCMI18n = (function () {
  'use strict';

  const STORAGE_KEY = 'medqcm_language_v1';

  const STRINGS = {
    fr: {
      chooseLanguageTitle: '🌍 Choisissez votre langue',
      chooseLanguageSub: 'Vous pourrez la changer plus tard dans les réglages.',
      langFr: 'Français',
      langEn: 'English',
      continue: 'Continuer',

      appName: 'MedQCM',
      appYear: '1ère année',
      tagline: 'Entraînez-vous. Corrigez vos erreurs. Progressez.',
      home: 'Accueil',
      back: 'Retour',
      settings: 'Réglages',
      changeLanguage: 'Changer de langue',
      changeCode: 'Changer de code',

      continueRevision: 'Continuer la révision',
      semester1: 'Semestre 1',
      semester2: 'Semestre 2',
      myProgress: 'Ma progression',
      myMistakes: 'Mes erreurs',
      chooseSemester: 'Choisissez un semestre',
      chooseModule: 'Choisissez un module',
      chooseChapter: 'Choisissez un chapitre',
      comingSoon: 'Bientôt disponible.',
      comingSoonChapter: 'QCM bientôt disponibles pour ce chapitre.',
      comingSoonModule: 'Contenu bientôt disponible pour ce module.',
      questionsCount: (n) => n + ' ' + (n > 1 ? 'questions' : 'question'),
      noDataYet: 'Pas encore de données pour ce module.',

      modeHub: 'Comment voulez-vous réviser ?',
      modeAll: 'Toutes les questions',
      modeAllDesc: 'La série complète, dans l’ordre.',
      modeMistakes: 'Mes erreurs',
      modeMistakesDesc: 'Uniquement les questions déjà ratées.',
      modeRetry: 'Recommencer',
      modeRetryDesc: 'Refaire ce chapitre depuis le début.',
      modeRandom: 'Pratique aléatoire',
      modeRandomDesc: 'Les mêmes questions, dans un ordre mélangé.',
      modeQuick: 'Révision rapide',
      modeQuickDesc: (n) => n + ' questions, pour une pause courte.',
      noMistakesYet: 'Aucune erreur enregistrée pour ce chapitre pour le moment.',

      resumeTitle: 'Vous avez une session en cours.',
      resume: 'Reprendre',
      restart: 'Recommencer',
      start: 'Commencer le QCM',
      lastResult: 'Dernier résultat :',
      firstTry: 'au premier essai',

      quitSeries: '← Quitter la série',
      question: 'Question',
      firstSeries: 'Première série',
      reviewBadge: 'Révision des erreurs',
      reviewRemaining: (n) => 'Révision — ' + n + ' ' + (n > 1 ? 'questions restantes' : 'question restante'),
      reviewHint: 'Vous revoyez vos erreurs. Une question disparaît de la liste dès que vous y répondez correctement.',
      validate: 'Valider',
      nextQuestion: 'Question suivante →',
      finishSeries: 'Terminer la première série →',
      seeResult: 'Voir le résultat final →',
      correct: '✓ Réponse correcte !',
      incorrect: '✗ Réponse incorrecte !',
      correctAnswerIs: 'La bonne réponse est :',
      explanation: 'Explication',
      backToReview: 'Cette question sera reprise dans la révision des erreurs.',
      backToReviewAgain: 'Cette question reviendra à la fin de la révision.',

      transitionTitle: 'Révision des erreurs',
      transitionDone: 'Vous avez terminé la première série.',
      transitionMistakes: (n) => 'Vous avez ' + n + ' ' + (n > 1 ? 'erreurs' : 'erreur') + ' à revoir.',
      transitionScore: 'Score de la première série :',
      startReview: 'Commencer la révision',

      resultTitle: 'Résultat final',
      resultAllClear: '🎉 Toutes vos erreurs ont été corrigées !',
      resultAllClearSub: 'Toutes les erreurs ont été revues avec succès.',
      resultPerfect: '🎉 Parcours sans faute !',
      resultPerfectSub: 'Aucune erreur à réviser.',
      resultInitialScore: 'Score initial',
      resultPercent: (p) => 'Votre score : ' + p + ' % au premier essai',
      statFirstTry: '✓ Correctes au premier essai',
      statMistakes: '✗ Erreurs initiales',
      statReviewed: '🔁 Questions révisées',
      statTotal: '📝 Total des réponses',
      backToModule: 'Retour au module',

      progressTitle: 'Ma progression',
      progressYear: 'Progression générale (1ère année)',
      progressNoData: 'Aucune progression enregistrée pour le moment.',

      activationTitle: 'MedQCM',
      activationTagline: 'Révision médicale intelligente',
      activationLabel: 'Entrez votre code d’accès',
      activate: 'Activer',
      activationHelp: 'Votre code vous a été fourni après votre achat.',
      activationInvalidTitle: '❌ Code invalide',
      activationInvalidText: 'Veuillez vérifier votre code d’accès.',
      activationEmptyTitle: 'Code manquant',
      activationEmptyText: 'Saisissez votre code d’accès pour continuer.',
      activationLockedTitle: 'Trop d’essais',
      activationLockedText: (s) => 'Réessayez dans ' + s + ' ' + (s > 1 ? 'secondes' : 'seconde') + '.',
      activationErrorTitle: 'Vérification impossible',
      activationErrorText: 'Réessayez dans un instant.',
      activationSuccessTitle: '✓ Activation réussie',
      activationSuccessText: 'Ouverture de MedQCM…',

      progressSavedFooter: 'Votre progression est enregistrée automatiquement sur cet appareil.',
      loadError: 'Erreur de chargement',
      questionsFileError: 'Le fichier questions.js est introuvable ou contient une erreur (par exemple une virgule ou une accolade manquante).',
      activationFileError: 'Le fichier activation.js est introuvable ou contient une erreur.',
      checkSameFolder: 'Vérifiez qu’il se trouve dans le même dossier que index.html.'
    },

    en: {
      chooseLanguageTitle: '🌍 Choose your language',
      chooseLanguageSub: 'You can change it later in settings.',
      langFr: 'Français',
      langEn: 'English',
      continue: 'Continue',

      appName: 'MedQCM',
      appYear: 'Year 1',
      tagline: 'Practice. Correct your mistakes. Progress.',
      home: 'Home',
      back: 'Back',
      settings: 'Settings',
      changeLanguage: 'Change language',
      changeCode: 'Change code',

      continueRevision: 'Continue Revision',
      semester1: 'Semester 1',
      semester2: 'Semester 2',
      myProgress: 'My Progress',
      myMistakes: 'My Mistakes',
      chooseSemester: 'Choose Semester',
      chooseModule: 'Choose Module',
      chooseChapter: 'Choose a chapter',
      comingSoon: 'Coming soon.',
      comingSoonChapter: 'Quizzes coming soon for this chapter.',
      comingSoonModule: 'Content coming soon for this module.',
      questionsCount: (n) => n + ' ' + (n > 1 ? 'questions' : 'question'),
      noDataYet: 'No data yet for this module.',

      modeHub: 'How do you want to revise?',
      modeAll: 'All Questions',
      modeAllDesc: 'The full set, in order.',
      modeMistakes: 'My Mistakes',
      modeMistakesDesc: 'Only questions you got wrong before.',
      modeRetry: 'Retry',
      modeRetryDesc: 'Redo this chapter from the start.',
      modeRandom: 'Random Practice',
      modeRandomDesc: 'Same questions, shuffled order.',
      modeQuick: 'Quick Revision',
      modeQuickDesc: (n) => n + ' questions, for a short session.',
      noMistakesYet: 'No mistakes recorded yet for this chapter.',

      resumeTitle: 'You have a session in progress.',
      resume: 'Resume',
      restart: 'Restart',
      start: 'Start Quiz',
      lastResult: 'Last result:',
      firstTry: 'on first try',

      quitSeries: '← Leave series',
      question: 'Question',
      firstSeries: 'First round',
      reviewBadge: 'Reviewing mistakes',
      reviewRemaining: (n) => 'Review — ' + n + ' ' + (n > 1 ? 'questions left' : 'question left'),
      reviewHint: 'You are reviewing your mistakes. A question leaves the list once you answer it correctly.',
      validate: 'Submit',
      nextQuestion: 'Next question →',
      finishSeries: 'Finish first round →',
      seeResult: 'See final result →',
      correct: '✓ Correct answer!',
      incorrect: '✗ Incorrect answer!',
      correctAnswerIs: 'The correct answer is:',
      explanation: 'Explanation',
      backToReview: 'This question will come back in the mistake review.',
      backToReviewAgain: 'This question will come back at the end of the review.',

      transitionTitle: 'Mistake review',
      transitionDone: 'You’ve finished the first round.',
      transitionMistakes: (n) => 'You have ' + n + ' ' + (n > 1 ? 'mistakes' : 'mistake') + ' to review.',
      transitionScore: 'First round score:',
      startReview: 'Start review',

      resultTitle: 'Final result',
      resultAllClear: '🎉 All your mistakes have been corrected!',
      resultAllClearSub: 'Every mistake was successfully reviewed.',
      resultPerfect: '🎉 Flawless run!',
      resultPerfectSub: 'No mistakes to review.',
      resultInitialScore: 'Initial score',
      resultPercent: (p) => 'Your score: ' + p + '% on first try',
      statFirstTry: '✓ Correct on first try',
      statMistakes: '✗ Initial mistakes',
      statReviewed: '🔁 Questions reviewed',
      statTotal: '📝 Total answers',
      backToModule: 'Back to module',

      progressTitle: 'My Progress',
      progressYear: 'Overall progress (Year 1)',
      progressNoData: 'No progress recorded yet.',

      activationTitle: 'MedQCM',
      activationTagline: 'Smart medical revision',
      activationLabel: 'Enter your access code',
      activate: 'Activate',
      activationHelp: 'Your code was provided after your purchase.',
      activationInvalidTitle: '❌ Invalid code',
      activationInvalidText: 'Please check your access code.',
      activationEmptyTitle: 'Missing code',
      activationEmptyText: 'Enter your access code to continue.',
      activationLockedTitle: 'Too many attempts',
      activationLockedText: (s) => 'Try again in ' + s + ' ' + (s > 1 ? 'seconds' : 'second') + '.',
      activationErrorTitle: 'Could not verify',
      activationErrorText: 'Please try again in a moment.',
      activationSuccessTitle: '✓ Activation successful',
      activationSuccessText: 'Opening MedQCM…',

      progressSavedFooter: 'Your progress is saved automatically on this device.',
      loadError: 'Loading error',
      questionsFileError: 'The questions.js file is missing or contains an error (e.g. a missing comma or brace).',
      activationFileError: 'The activation.js file is missing or contains an error.',
      checkSameFolder: 'Make sure it is in the same folder as index.html.'
    }
  };

  const SUPPORTED = Object.keys(STRINGS);
  let current = null;
  let memoryLang = null;

  function detectDefault() {
    const nav = (navigator.language || 'fr').slice(0, 2).toLowerCase();
    return SUPPORTED.indexOf(nav) !== -1 ? nav : 'fr';
  }

  function getLanguage() {
    if (current) return current;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.indexOf(saved) !== -1) { current = saved; return current; }
    } catch (err) { if (memoryLang) return memoryLang; }
    return null; // aucune langue choisie pour l'instant
  }

  function setLanguage(lang) {
    if (SUPPORTED.indexOf(lang) === -1) return;
    current = lang;
    memoryLang = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (err) { /* ignoré : reste en mémoire pour cette session */ }
  }

  // t('key') ou t('key', arg) pour les chaînes qui dépendent d'un nombre.
  function t(key, arg) {
    const lang = getLanguage() || detectDefault();
    const dict = STRINGS[lang] || STRINGS.fr;
    const value = (key in dict) ? dict[key] : STRINGS.fr[key];
    return typeof value === 'function' ? value(arg) : value;
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    supported: SUPPORTED,
    getLanguage: getLanguage,
    setLanguage: setLanguage,
    detectDefault: detectDefault,
    t: t
  };
})();
