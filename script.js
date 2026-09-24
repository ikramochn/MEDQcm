/* =====================================================================
   MedQCM — script.js  (la logique de l'application)
   ---------------------------------------------------------------------
   Vous n'avez normalement PAS besoin de modifier ce fichier.
   Pour ajouter des questions, modifiez uniquement questions.js.

   Plan du fichier :
     1. Vérifications et constantes
     2. État de l'application
     3. Outils (petites fonctions utiles)
     4. Données : années / modules / chapitres / questions
     5. Sauvegarde (localStorage)
     6. Navigation
     7. Écrans de sélection (accueil, modules, chapitres, démarrage)
     8. Moteur du QCM (questions, correction, file des erreurs)
     9. Résultat final
    10. Activation par code, affichage, clics et démarrage
        (le code d'activation lui-même est dans activation.js)
   ===================================================================== */
(function () {
  'use strict';

  /* ===================================================================
     1. VÉRIFICATIONS ET CONSTANTES
     =================================================================== */
  const app = document.getElementById('app');
  const homeBtn = document.getElementById('home-btn');

  // Si questions.js est absent ou contient une erreur, on l'explique clairement.
  if (typeof QUESTIONS === 'undefined' || !Array.isArray(QUESTIONS) || typeof CURRICULUM === 'undefined') {
    homeBtn.hidden = true;
    app.innerHTML =
      '<section class="card notice notice-error">' +
      '<h2>Erreur de chargement</h2>' +
      '<p>Le fichier <strong>questions.js</strong> est introuvable ou contient une erreur ' +
      '(par exemple une virgule ou une accolade manquante).</p>' +
      '<p>Vérifiez qu’il se trouve dans le même dossier que index.html.</p>' +
      '</section>';
    return;
  }

  // Sans activation.js, l'application reste FERMÉE (jamais d'accès par défaut).
  if (typeof MedQCMActivation === 'undefined') {
    homeBtn.hidden = true;
    app.innerHTML =
      '<section class="card notice notice-error">' +
      '<h2>Erreur de chargement</h2>' +
      '<p>Le fichier <strong>activation.js</strong> est introuvable ou contient une erreur.</p>' +
      '<p>Vérifiez qu’il se trouve dans le même dossier que index.html.</p>' +
      '</section>';
    return;
  }

  const STORAGE_KEY = 'medqcm_data_v1';
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const SHUFFLE_QUESTIONS =
    typeof SETTINGS !== 'undefined' && SETTINGS !== null && SETTINGS.shuffleQuestions === true;


  /* ===================================================================
     2. ÉTAT DE L'APPLICATION
     =================================================================== */
  const data = {
    nav: { view: 'home', year: null, module: null, chapter: null }, // où en est l'utilisateur
    sessions: {},    // sessions de QCM en cours (une par chapitre)
    lastResults: {}  // dernier résultat obtenu par chapitre
  };
  const nav = data.nav;

  let session = null;       // la session de QCM actuellement affichée
  let resultsView = null;   // les chiffres du résultat final affiché
  let storageOk = true;     // false si le navigateur refuse la sauvegarde
  let guardActive = false;  // pour que le bouton "retour" du navigateur reste dans l'application
  let activationBusy = false; // vrai pendant la vérification d'un code


  /* ===================================================================
     3. OUTILS
     =================================================================== */
  // Protège le texte avant de l'insérer dans la page.
  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function plural(n, one, many) { return n > 1 ? many : one; }

  function uniq(list) { return Array.from(new Set(list)); }

  // Mélange une liste (utilisé seulement si shuffleQuestions = true).
  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // Clé unique du QCM en cours (année + module + chapitre).
  function currentKey() { return [nav.year, nav.module, nav.chapter].join('||'); }

  function newPending() { return { selected: null, validated: false, correct: null }; }


  /* ===================================================================
     4. DONNÉES : années / modules / chapitres / questions
     =================================================================== */
  const warnings = [];      // problèmes détectés dans questions.js
  const VALID = [];         // questions valides
  const byId = new Map();   // accès rapide à une question par son id

  QUESTIONS.forEach(function (q, i) {
    const problems = [];
    const label = 'Question id ' + (q && q.id !== undefined ? q.id : '?') + ' (position ' + (i + 1) + ')';
    if (!q || typeof q !== 'object') {
      problems.push('format invalide');
    } else {
      if (q.id === undefined || q.id === null || q.id === '') problems.push('id manquant');
      else if (byId.has(q.id)) problems.push('id déjà utilisé');
      if (!q.year || !q.module || !q.chapter) problems.push('year, module ou chapter manquant');
      if (!q.question) problems.push('texte de la question manquant');
      if (!Array.isArray(q.options) || q.options.length < 2) {
        problems.push('options invalides (il en faut au moins 2)');
      } else if (!Number.isInteger(q.correctAnswer) || q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        problems.push('correctAnswer invalide (0 = A, 1 = B, 2 = C, 3 = D)');
      }
    }
    if (problems.length) {
      const msg = label + ' ignorée : ' + problems.join(', ') + '.';
      warnings.push(msg);
      console.warn('[MedQCM] ' + msg);
      return;
    }
    byId.set(q.id, q);
    VALID.push(q);
  });

  // Questions filtrées par année / module / chapitre (les filtres vides sont ignorés).
  function questionsFor(year, module, chapter) {
    return VALID.filter(function (q) {
      return (year == null || q.year === year) &&
             (module == null || q.module === module) &&
             (chapter == null || q.chapter === chapter);
    });
  }

  // Années = celles de CURRICULUM + celles trouvées dans les questions.
  function getYears() {
    return uniq(Object.keys(CURRICULUM).concat(VALID.map(function (q) { return q.year; })));
  }

  function getModules(year) {
    const base = CURRICULUM[year] ? Object.keys(CURRICULUM[year]) : [];
    return uniq(base.concat(questionsFor(year).map(function (q) { return q.module; })));
  }

  function getChapters(year, module) {
    const base = (CURRICULUM[year] && CURRICULUM[year][module]) || [];
    return uniq(base.concat(questionsFor(year, module).map(function (q) { return q.chapter; })));
  }


  /* ===================================================================
     5. SAUVEGARDE (localStorage)
     =================================================================== */
  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      storageOk = false;
    }
  }

  // Vérifie / répare une session lue depuis la sauvegarde. Renvoie null si inutilisable.
  function repairSession(s) {
    if (!s || typeof s !== 'object') return null;
    if (['initial', 'transition', 'review'].indexOf(s.phase) === -1) return null;
    if (!Array.isArray(s.questionIds) || !Array.isArray(s.queue)) return null;
    if (!s.firstAttempt || typeof s.firstAttempt !== 'object') return null;

    // On retire les questions qui n'existent plus dans questions.js.
    s.questionIds = s.questionIds.filter(function (id) { return byId.has(id); });
    s.queue = s.queue.filter(function (id) { return byId.has(id); });
    if (!s.questionIds.length) return null;

    if (!Number.isInteger(s.index) || s.index < 0) s.index = 0;
    if (!Number.isInteger(s.totalAnswers) || s.totalAnswers < 0) s.totalAnswers = 0;
    if (!s.pending || typeof s.pending !== 'object') s.pending = newPending();

    if (s.phase === 'initial' && s.index >= s.questionIds.length) {
      if (!s.queue.length) return null;
      s.phase = 'transition';
    }
    if ((s.phase === 'transition' || s.phase === 'review') && !s.queue.length) return null;
    if (s.phase === 'transition') s.pending = newPending();
    if (s.pending.validated && s.pending.selected === null) s.pending = newPending();
    return s;
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== 'object') return;

      if (saved.nav && typeof saved.nav === 'object') {
        nav.view = saved.nav.view || 'home';
        nav.year = saved.nav.year || null;
        nav.module = saved.nav.module || null;
        nav.chapter = saved.nav.chapter || null;
      }
      if (saved.sessions && typeof saved.sessions === 'object') {
        Object.keys(saved.sessions).forEach(function (key) {
          const fixed = repairSession(saved.sessions[key]);
          if (fixed) data.sessions[key] = fixed;
        });
      }
      if (saved.lastResults && typeof saved.lastResults === 'object') {
        data.lastResults = saved.lastResults;
      }
    } catch (err) {
      console.warn('[MedQCM] Sauvegarde illisible, elle est ignorée.', err);
    }
  }

  // Après un rechargement : on revient à l'écran choisi, mais jamais en pleine question.
  function normalizeNav() {
    if (!nav.year || getYears().indexOf(nav.year) === -1) {
      nav.view = 'home'; nav.year = nav.module = nav.chapter = null;
    } else if (nav.view === 'home' || nav.view === 'modules') {
      nav.view = nav.view === 'home' ? 'home' : 'modules';
      if (nav.view === 'modules') nav.module = nav.chapter = null;
    } else if (!nav.module || getModules(nav.year).indexOf(nav.module) === -1) {
      nav.view = 'modules'; nav.module = nav.chapter = null;
    } else if (nav.view === 'chapters') {
      nav.chapter = null;
    } else if (!nav.chapter || getChapters(nav.year, nav.module).indexOf(nav.chapter) === -1) {
      nav.view = 'chapters'; nav.chapter = null;
    } else {
      nav.view = 'intro'; // quiz / results / intro → page de démarrage (avec "Reprendre")
    }
  }


  /* ===================================================================
     6. NAVIGATION
     =================================================================== */
  // Change d'écran (et remet à zéro ce qui ne sert plus).
  function setView(view) {
    nav.view = view;
    if (view === 'home') { nav.year = null; nav.module = null; nav.chapter = null; }
    if (view === 'modules') { nav.module = null; nav.chapter = null; }
    if (view === 'chapters') { nav.chapter = null; }
    if (view !== 'quiz') session = null;
    ensureGuard();
  }

  function go(view) {
    setView(view);
    saveProgress();
    render(true);
  }

  function selectYear(year) { nav.year = year; go('modules'); }
  function selectModule(module) { nav.module = module; go('chapters'); }
  function selectChapter(chapter) { nav.chapter = chapter; go('intro'); }

  function goBack() {
    switch (nav.view) {
      case 'quiz':     go('intro'); break;     // la session est déjà sauvegardée
      case 'results':  go('chapters'); break;
      case 'intro':    go('chapters'); break;
      case 'chapters': go('modules'); break;
      default:         go('home');
    }
  }

  // Le bouton "retour" du navigateur (téléphone) fait un retour dans l'application.
  function ensureGuard() {
    if (nav.view !== 'home' && !guardActive && MedQCMActivation.isActivated()) {
      try { history.pushState({ medqcm: true }, ''); guardActive = true; } catch (err) { /* ignoré */ }
    }
  }

  window.addEventListener('popstate', function () {
    guardActive = false;
    if (nav.view !== 'home' && MedQCMActivation.isActivated()) goBack();
  });

  // Fil d'Ariane : Accueil › 1ère année › Anatomie › Thorax
  function navRowHtml() {
    const items = [{ label: 'Accueil', level: 'home' }];
    if (nav.year) items.push({ label: nav.year, level: 'year' });
    if (nav.module && (nav.view === 'chapters' || nav.view === 'intro' || nav.view === 'results')) {
      items.push({ label: nav.module, level: 'module' });
    }
    if (nav.chapter && (nav.view === 'intro' || nav.view === 'results')) {
      items.push({ label: nav.chapter, level: 'chapter' });
    }
    const crumbs = items.map(function (it, i) {
      return i === items.length - 1
        ? '<span class="crumb-current" aria-current="page">' + esc(it.label) + '</span>'
        : '<button type="button" class="crumb-link" data-action="crumb" data-value="' + it.level + '">' + esc(it.label) + '</button>';
    }).join('<span class="crumb-sep" aria-hidden="true">›</span>');

    return '<div class="nav-row">' +
      '<button type="button" class="back-btn" data-action="back">← Retour</button>' +
      '<nav class="crumbs" aria-label="Fil d’Ariane">' + crumbs + '</nav>' +
      '</div>';
  }


  /* ===================================================================
     7. ÉCRANS DE SÉLECTION
     =================================================================== */
  function emptyHtml(message) {
    return '<div class="card empty-state">' +
      '<div class="empty-icon" aria-hidden="true">🩺</div>' +
      '<p class="empty-title">' + esc(message) + '</p>' +
      '<p class="muted">Cette section est en cours de préparation.</p>' +
      '</div>';
  }

  function cardHtml(o) {
    return '<button type="button" class="card-btn' + (o.empty ? ' is-empty' : '') + '"' +
      ' data-action="' + o.action + '" data-value="' + esc(o.value) + '">' +
      (o.lead ? '<span class="card-lead" aria-hidden="true">' + esc(o.lead) + '</span>' : '') +
      '<span class="card-title">' + esc(o.title) + '</span>' +
      '<span class="card-meta">' + esc(o.meta) + '</span>' +
      '</button>';
  }

  function countLabel(n) {
    return n + ' ' + plural(n, 'question', 'questions');
  }

  function viewHome() {
    let html =
      '<section class="hero">' +
      '<div class="hero-logo" aria-hidden="true"><svg viewBox="0 0 24 24" width="34" height="34"><path fill="currentColor" d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7z"/></svg></div>' +
      '<h1>MedQCM</h1>' +
      '<p class="subtitle">Entraînez-vous. Corrigez vos erreurs. Progressez.</p>' +
      '</section>';

    if (warnings.length || !storageOk) {
      html += '<div class="notice" role="alert">';
      if (!storageOk) {
        html += '<p>La sauvegarde automatique est indisponible dans ce navigateur : votre progression ne sera pas conservée.</p>';
      }
      if (warnings.length) {
        html += '<p>Certaines questions de questions.js sont ignorées :</p><ul>' +
          warnings.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul>';
      }
      html += '</div>';
    }

    html += '<h2 class="section-title">Choisissez votre année</h2><div class="grid grid-years">';
    getYears().forEach(function (year, i) {
      const n = questionsFor(year).length;
      html += cardHtml({
        action: 'year', value: year, title: year, lead: String(i + 1),
        meta: n ? countLabel(n) : 'Bientôt disponible', empty: !n
      });
    });
    return html + '</div>';
  }

  function viewModules() {
    const modules = getModules(nav.year);
    let html = navRowHtml() +
      '<header class="page-head"><p class="eyebrow">' + esc(nav.year) + '</p>' +
      '<h2 class="page-title">Choisir un module</h2></header>';

    if (!modules.length) return html + emptyHtml('Contenu bientôt disponible.');

    html += '<div class="grid grid-list">';
    modules.forEach(function (module) {
      const n = questionsFor(nav.year, module).length;
      const chapters = getChapters(nav.year, module).filter(function (c) {
        return questionsFor(nav.year, module, c).length > 0;
      }).length;
      html += cardHtml({
        action: 'module', value: module, title: module,
        meta: n ? chapters + ' ' + plural(chapters, 'chapitre', 'chapitres') + ' · ' + countLabel(n) : 'Bientôt disponible',
        empty: !n
      });
    });
    return html + '</div>';
  }

  function viewChapters() {
    const chapters = getChapters(nav.year, nav.module);
    let html = navRowHtml() +
      '<header class="page-head"><p class="eyebrow">' + esc(nav.year) + ' — ' + esc(nav.module) + '</p>' +
      '<h2 class="page-title">Choisir un chapitre</h2></header>';

    if (!chapters.length) return html + emptyHtml('Contenu bientôt disponible pour ce module.');

    html += '<div class="grid grid-list">';
    chapters.forEach(function (chapter) {
      const n = questionsFor(nav.year, nav.module, chapter).length;
      html += cardHtml({
        action: 'chapter', value: chapter, title: chapter,
        meta: n ? countLabel(n) : 'Bientôt disponible', empty: !n
      });
    });
    return html + '</div>';
  }

  // Page de démarrage d'un QCM (avec "Reprendre" si une session existe).
  function viewIntro() {
    const total = questionsFor(nav.year, nav.module, nav.chapter).length;
    let html = navRowHtml();

    if (!total) {
      return html +
        '<header class="page-head"><p class="eyebrow">' + esc(nav.module) + ' — ' + esc(nav.chapter) + '</p>' +
        '<h2 class="page-title">' + esc(nav.chapter) + '</h2></header>' +
        emptyHtml('QCM bientôt disponibles pour ce chapitre.');
    }

    const key = currentKey();
    const s = data.sessions[key];
    const last = data.lastResults[key];

    html += '<section class="card">' +
      '<p class="eyebrow">' + esc(nav.module) + ' — ' + esc(nav.chapter) + '</p>' +
      '<h2>QCM ' + esc(nav.chapter) + '</h2>' +
      '<p class="lead muted">' + countLabel(total) + '</p>' +
      '<ul class="how">' +
      '<li>Répondez à chaque question, puis validez pour voir la correction.</li>' +
      '<li>Les questions ratées sont mises de côté.</li>' +
      '<li>Elles reviennent jusqu’à ce que vous les réussissiez toutes.</li>' +
      '</ul>';

    if (s) {
      let where;
      if (s.phase === 'initial') {
        where = 'Première série : question ' + (s.index + 1) + ' / ' + s.questionIds.length;
      } else if (s.phase === 'transition') {
        where = 'Première série terminée : révision des erreurs à faire';
      } else {
        where = 'Révision des erreurs : ' + s.queue.length + ' ' + plural(s.queue.length, 'question restante', 'questions restantes');
      }
      html += '<div class="status-box"><strong>Vous avez une session en cours.</strong><span>' + esc(where) + '</span></div>' +
        '<div class="actions">' +
        '<button type="button" class="btn btn-primary btn-block" data-action="resume">Reprendre</button>' +
        '<button type="button" class="btn btn-secondary btn-block" data-action="restart">Recommencer</button>' +
        '</div>';
    } else {
      html += '<div class="actions"><button type="button" class="btn btn-primary btn-block" data-action="start">Commencer le QCM</button></div>';
    }

    if (last) {
      const date = last.date ? new Date(last.date).toLocaleDateString('fr-FR') : '';
      html += '<p class="last-result">Dernier résultat : ' + last.firstCorrect + ' / ' + last.total +
        ' au premier essai' + (date ? ' (' + esc(date) + ')' : '') + '</p>';
    }
    return html + '</section>';
  }


  /* ===================================================================
     8. MOTEUR DU QCM
     =================================================================== */

  // --- Questions et compteurs ---
  function currentQuestion() {
    const id = session.phase === 'review' ? session.queue[0] : session.questionIds[session.index];
    return byId.get(id);
  }

  function countMistakes() {
    return session.questionIds.filter(function (id) { return session.firstAttempt[id] === false; }).length;
  }

  function countFirstTryCorrect() {
    return session.questionIds.filter(function (id) { return session.firstAttempt[id] === true; }).length;
  }

  // --- Démarrer ---
  // fresh = true  → nouvelle série (efface l'ancienne)
  // fresh = false → reprend la série en cours si elle existe
  function startQuiz(fresh) {
    if (!MedQCMActivation.isActivated()) { render(false); return; }
    const questions = questionsFor(nav.year, nav.module, nav.chapter);
    if (!questions.length) { go('intro'); return; }

    const key = currentKey();
    let s = fresh ? null : data.sessions[key];

    if (!s) {
      let ids = questions.map(function (q) { return q.id; });
      if (SHUFFLE_QUESTIONS) ids = shuffle(ids);
      s = {
        phase: 'initial',      // 'initial' → 'transition' → 'review'
        index: 0,              // position dans la première série
        questionIds: ids,      // les questions de la série (dans l'ordre)
        queue: [],             // FILE DES ERREURS (ids des questions à revoir)
        firstAttempt: {},      // id → true/false (résultat du premier essai)
        totalAnswers: 0,       // nombre total de réponses validées
        pending: newPending(), // état de la question affichée
        startedAt: Date.now()
      };
      data.sessions[key] = s;
    }

    session = s;
    resultsView = null;
    nav.view = 'quiz';
    ensureGuard();
    saveProgress();
    render(true);
  }

  // Recommencer à zéro le QCM du chapitre courant.
  function resetQuiz() {
    delete data.sessions[currentKey()];
    session = null;
    startQuiz(true);
  }

  // --- Afficher une question (ou l'écran de transition) ---
  function displayQuestion(opts) {
    opts = opts || {};
    if (!MedQCMActivation.isActivated()) { render(false); return; }
    if (!session) { startQuiz(false); return; }

    const topRow = '<div class="nav-row"><button type="button" class="back-btn" data-action="leave">← Quitter la série</button></div>';
    const where = nav.module + ' — ' + nav.chapter;

    // Écran entre la première série et la révision
    if (session.phase === 'transition') {
      const nMistakes = session.queue.length;
      app.innerHTML = topRow +
        '<article class="card center-card">' +
        '<p class="eyebrow">' + esc(where) + '</p>' +
        '<div class="big-emoji" aria-hidden="true">🔁</div>' +
        '<h2>Révision des erreurs</h2>' +
        '<p class="lead">Vous avez terminé la première série.</p>' +
        '<p class="lead">Vous avez <strong>' + nMistakes + ' ' + plural(nMistakes, 'erreur', 'erreurs') + '</strong> à revoir.</p>' +
        '<p class="muted" style="margin-top:10px">Score de la première série : ' + countFirstTryCorrect() + ' / ' + session.questionIds.length + '</p>' +
        '<p class="muted" style="margin-top:6px">Chaque question ratée reviendra jusqu’à ce que vous y répondiez correctement.</p>' +
        '<button type="button" class="btn btn-primary btn-block" data-action="review">Commencer la révision</button>' +
        '</article>';
      window.scrollTo(0, 0);
      return;
    }

    const q = currentQuestion();
    const p = session.pending;
    const isReview = session.phase === 'review';
    const total = session.questionIds.length;

    // --- Progression ---
    let label, sub, pct;
    if (!isReview) {
      label = 'Question ' + (session.index + 1) + ' / ' + total;
      sub = 'Première série';
      pct = (session.index + (p.validated ? 1 : 0)) / total * 100;
    } else {
      const mistakes = countMistakes();
      const remaining = session.queue.length - (p.validated && p.correct ? 1 : 0);
      label = 'Révision — ' + remaining + ' ' + plural(remaining, 'question restante', 'questions restantes');
      sub = 'Erreurs à corriger';
      pct = mistakes ? (mistakes - remaining) / mistakes * 100 : 100;
    }

    // --- Choix de réponse ---
    const options = q.options.map(function (text, i) {
      let cls = 'option';
      let mark = '';
      if (p.validated) {
        if (i === q.correctAnswer) { cls += ' is-correct'; mark = '✓'; }
        else if (i === p.selected) { cls += ' is-wrong'; mark = '✗'; }
        else { cls += ' is-dim'; }
      } else if (i === p.selected) {
        cls += ' is-selected';
      }
      return '<button type="button" class="' + cls + '" role="radio" aria-checked="' + (i === p.selected) + '"' +
        ' data-action="select" data-value="' + i + '"' + (p.validated ? ' disabled' : '') + '>' +
        '<span class="option-letter" aria-hidden="true">' + LETTERS[i] + '</span>' +
        '<span class="option-text">' + esc(text) + '</span>' +
        '<span class="option-mark" aria-hidden="true">' + mark + '</span>' +
        '</button>';
    }).join('');

    // --- Bas de carte : bouton Valider, ou correction + bouton suivant ---
    let bottom;
    if (!p.validated) {
      bottom = '<div class="actions"><button type="button" id="validate-btn" class="btn btn-primary btn-block" data-action="validate"' +
        (p.selected === null ? ' disabled' : '') + '>Valider</button></div>';
    } else {
      bottom = feedbackHtml(q, p) +
        '<div class="actions"><button type="button" id="next-btn" class="btn btn-primary btn-block" data-action="next">' +
        esc(nextLabel(p)) + '</button></div>';
    }

    app.innerHTML = topRow +
      '<article class="card">' +
      '<div class="quiz-meta">' +
      '<span class="eyebrow">' + esc(where) + '</span>' +
      (isReview ? '<span class="badge badge-review">Révision des erreurs</span>' : '') +
      '</div>' +
      '<div class="progress-head"><span>' + esc(label) + '</span><span class="progress-sub">' + esc(sub) + '</span></div>' +
      '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(pct) + '" aria-label="Progression">' +
      '<div class="progress-fill' + (isReview ? ' is-review' : '') + '" style="width:' + pct.toFixed(1) + '%"></div></div>' +
      (isReview ? '<p class="review-hint">Vous revoyez vos erreurs. Une question disparaît de la liste dès que vous y répondez correctement.</p>' : '') +
      '<h2 class="question-text">' + esc(q.question) + '</h2>' +
      '<div class="options" role="radiogroup" aria-label="Choix de réponse">' + options + '</div>' +
      bottom +
      '</article>';

    if (opts.scrollToNext) {
      const btn = document.getElementById('next-btn');
      if (btn && btn.scrollIntoView) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      window.scrollTo(0, 0);
    }
  }

  // Texte du bouton après la correction.
  function nextLabel(p) {
    if (session.phase === 'initial') {
      if (session.index + 1 < session.questionIds.length) return 'Question suivante →';
      return session.queue.length ? 'Terminer la première série →' : 'Voir le résultat final →';
    }
    const remaining = session.queue.length - (p.correct ? 1 : 0);
    return remaining > 0 ? 'Question suivante →' : 'Voir le résultat final →';
  }

  // Panneau vert / rouge affiché après "Valider".
  function feedbackHtml(q, p) {
    const ok = p.correct;
    let html = '<div id="feedback" class="feedback ' + (ok ? 'feedback-correct' : 'feedback-wrong') + '" role="status">' +
      '<p class="feedback-title">' + (ok ? '✓ Réponse correcte !' : '✗ Réponse incorrecte !') + '</p>' +
      '<p class="feedback-answer">La bonne réponse est : <strong>' + LETTERS[q.correctAnswer] + '. ' + esc(q.options[q.correctAnswer]) + '</strong></p>';
    if (q.explanation) {
      html += '<div class="feedback-explanation"><p class="feedback-label">Explication</p><p>' + esc(q.explanation) + '</p></div>';
    }
    if (!ok) {
      html += '<p class="feedback-note">' + (session.phase === 'review'
        ? 'Cette question reviendra à la fin de la révision.'
        : 'Cette question sera reprise dans la révision des erreurs.') + '</p>';
    }
    return html + '</div>';
  }

  // --- L'étudiant choisit une réponse ---
  function selectAnswer(index) {
    if (!session || session.phase === 'transition' || session.pending.validated) return;
    session.pending.selected = index;
    saveProgress();

    // Mise à jour directe de l'écran (sans tout redessiner)
    const buttons = app.querySelectorAll('.option');
    for (let i = 0; i < buttons.length; i++) {
      const selected = i === index;
      buttons[i].classList.toggle('is-selected', selected);
      buttons[i].setAttribute('aria-checked', String(selected));
    }
    const validateBtn = document.getElementById('validate-btn');
    if (validateBtn) validateBtn.disabled = false;
  }

  // --- L'étudiant clique sur "Valider" ---
  function checkAnswer() {
    if (!session || session.phase === 'transition') return;
    const p = session.pending;
    if (p.selected === null || p.validated) return;

    const q = currentQuestion();
    p.validated = true;
    p.correct = (p.selected === q.correctAnswer);
    session.totalAnswers += 1;

    // Première série : on note le résultat du premier essai
    if (session.phase === 'initial') {
      session.firstAttempt[q.id] = p.correct;
      if (!p.correct) addToMistakeQueue(q.id);
    }
    // (En révision, la file est mise à jour au clic sur "Question suivante".)

    saveProgress();
    displayQuestion({ scrollToNext: true });
  }

  // Ajoute une question à la file des erreurs (jamais en double).
  function addToMistakeQueue(id) {
    if (session.queue.indexOf(id) === -1) session.queue.push(id);
  }

  // --- L'étudiant clique sur "Question suivante" ---
  function nextQuestion() {
    if (!session || !session.pending.validated) return;
    const p = session.pending;

    if (session.phase === 'initial') {
      session.index += 1;
      session.pending = newPending();
      if (session.index >= session.questionIds.length) {
        if (session.queue.length > 0) {
          session.phase = 'transition';     // il y a des erreurs à revoir
        } else {
          finishSession();                  // aucune erreur : terminé
          return;
        }
      }
    } else if (session.phase === 'review') {
      if (p.correct) {
        session.queue.shift();                          // réussie → retirée de la file
      } else {
        session.queue.push(session.queue.shift());      // ratée → déplacée à la fin
      }
      session.pending = newPending();
      if (session.queue.length === 0) {
        finishSession();                    // plus aucune erreur : terminé
        return;
      }
    }

    saveProgress();
    displayQuestion();
  }

  // --- Lancer la révision des erreurs ---
  function reviewMistakes() {
    if (!session) return;
    if (session.phase === 'transition') {
      session.phase = 'review';
      session.pending = newPending();
      saveProgress();
    }
    displayQuestion();
  }

  // --- Fin de la série : on calcule le résultat ---
  function finishSession() {
    const key = currentKey();
    const total = session.questionIds.length;
    const firstCorrect = countFirstTryCorrect();
    const mistakes = countMistakes();

    resultsView = {
      total: total,
      firstCorrect: firstCorrect,
      mistakes: mistakes,
      reviewed: mistakes,
      totalAnswers: session.totalAnswers
    };
    data.lastResults[key] = {
      total: total,
      firstCorrect: firstCorrect,
      mistakes: mistakes,
      totalAnswers: session.totalAnswers,
      date: Date.now()
    };
    delete data.sessions[key];  // la série est terminée : plus rien à reprendre
    session = null;
    saveProgress();
    showResults();
  }


  /* ===================================================================
     9. RÉSULTAT FINAL
     =================================================================== */
  function showResults() {
    nav.view = 'results';
    ensureGuard();
    saveProgress();
    render(true);
  }

  function viewResults() {
    const r = resultsView;
    const pct = r.total ? Math.round(r.firstCorrect / r.total * 100) : 0;

    const banner = r.mistakes > 0
      ? '<div class="banner">🎉 Toutes vos erreurs ont été corrigées !<small>Toutes les erreurs ont été revues avec succès.</small></div>'
      : '<div class="banner">🎉 Parcours sans faute !<small>Aucune erreur à réviser.</small></div>';

    return navRowHtml() +
      '<article class="card">' +
      '<p class="eyebrow">' + esc(nav.module) + ' — ' + esc(nav.chapter) + '</p>' +
      '<h2>Résultat final</h2>' +
      banner +
      '<div class="score-ring" style="--pct:' + pct + '" role="img" aria-label="Score initial : ' + r.firstCorrect + ' sur ' + r.total + '">' +
      '<div class="score-ring-inner"><span class="score-value">' + r.firstCorrect + ' / ' + r.total + '</span>' +
      '<span class="score-caption">Score initial</span></div></div>' +
      '<p class="score-pct">Votre score : ' + pct + ' % au premier essai</p>' +
      '<ul class="stats">' +
      '<li><span>✓ Correctes au premier essai</span><span class="stat-value">' + r.firstCorrect + '</span></li>' +
      '<li><span>✗ Erreurs initiales</span><span class="stat-value">' + r.mistakes + '</span></li>' +
      '<li><span>🔁 Questions révisées</span><span class="stat-value">' + r.reviewed + '</span></li>' +
      '<li><span>📝 Total des réponses</span><span class="stat-value">' + r.totalAnswers + '</span></li>' +
      '</ul>' +
      '<div class="results-actions">' +
      '<button type="button" class="btn btn-primary" data-action="restart">Recommencer</button>' +
      '<button type="button" class="btn btn-secondary" data-action="to-chapters">Retour aux chapitres</button>' +
      '<button type="button" class="btn btn-secondary" data-action="home">Accueil</button>' +
      '</div>' +
      '</article>';
  }


  /* ===================================================================
     10. ACTIVATION PAR CODE, AFFICHAGE, CLICS ET DÉMARRAGE
     =================================================================== */

  /* ---------- Page d'activation ---------- */
  function alertHtml(kind, title, text) {
    return '<div class="alert alert-' + kind + '"' + (kind === 'success' ? ' role="status"' : '') + '>' +
      '<strong>' + esc(title) + '</strong><span>' + esc(text) + '</span></div>';
  }

  function viewActivation() {
    return '<section class="activation">' +
      '<div class="activation-logo" aria-hidden="true">🩺</div>' +
      '<h1 class="activation-brand">MedQCM</h1>' +
      '<p class="activation-tagline">Révision médicale<br>intelligente</p>' +
      '<form class="activation-form" id="activation-form" novalidate autocomplete="off">' +
      '<label class="activation-label" for="access-code">Entrez votre code d’accès</label>' +
      '<input id="access-code" name="access-code" class="code-input" type="text" inputmode="text"' +
      ' autocapitalize="characters" autocomplete="off" autocorrect="off" spellcheck="false"' +
      ' enterkeyhint="go" maxlength="20" placeholder="MED-XXXX-XXXX" aria-describedby="activation-msg">' +
      '<div id="activation-msg" class="activation-msg" aria-live="polite"></div>' +
      '<button type="submit" id="activate-btn" class="btn btn-primary btn-block">Activer</button>' +
      '</form>' +
      '<p class="activation-help">Votre code vous a été fourni après votre achat.</p>' +
      '</section>';
  }

  function showActivationError(result) {
    const msg = document.getElementById('activation-msg');
    const input = document.getElementById('access-code');
    if (!msg) return;
    let html;
    if (result.reason === 'empty') {
      html = alertHtml('error', 'Code manquant', 'Saisissez votre code d’accès pour continuer.');
    } else if (result.reason === 'locked') {
      html = alertHtml('error', 'Trop d’essais', 'Réessayez dans ' + result.retryIn + ' ' + plural(result.retryIn, 'seconde', 'secondes') + '.');
    } else if (result.reason === 'error') {
      html = alertHtml('error', 'Vérification impossible', 'Réessayez dans un instant.');
    } else {
      html = alertHtml('error', '❌ Code invalide', 'Veuillez vérifier votre code d’accès.');
    }
    msg.innerHTML = html;
    if (input) {
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
    }
  }

  function showActivationSuccess() {
    const form = document.getElementById('activation-form');
    if (form) form.innerHTML = alertHtml('success', '✓ Activation réussie', 'Ouverture de MedQCM…');
    setTimeout(enterApp, 1200); // bref message, puis l'application s'ouvre toute seule
  }

  // Ouvre l'application (après activation) là où l'étudiant s'était arrêté.
  function enterApp() {
    if (!MedQCMActivation.isActivated()) { render(false); return; }
    normalizeNav();
    ensureGuard();
    render(true);
  }

  async function submitActivation() {
    if (activationBusy) return;
    const input = document.getElementById('access-code');
    const button = document.getElementById('activate-btn');
    if (!input || !button) return;

    activationBusy = true;
    button.disabled = true;
    button.textContent = 'Vérification…';

    let result;
    try {
      result = await MedQCMActivation.verifyCode(input.value);
    } catch (err) {
      result = { ok: false, reason: 'error' };
    }
    activationBusy = false;

    if (result.ok) {
      MedQCMActivation.activate(result.codeHash); // sauvegarde AVANT d'afficher le succès
      showActivationSuccess();
      return;
    }
    button.disabled = false;
    button.textContent = 'Activer';
    showActivationError(result);
    input.focus();
  }

  // Met le code en forme pendant la saisie : majuscules + MED-XXXX-XXXX
  function formatCodeInput(el) {
    let raw = el.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    let formatted = raw;
    if (raw.indexOf('MED') === 0) {
      raw = raw.slice(0, 11);
      formatted = [raw.slice(0, 3), raw.slice(3, 7), raw.slice(7, 11)].filter(Boolean).join('-');
    }
    if (formatted !== el.value) el.value = formatted;
  }

  /* ---------- Affichage ---------- */
  // Dessine l'écran correspondant à nav.view (ou la page d'activation si l'appareil n'est pas activé).
  function render(scrollTop) {
    const locked = !MedQCMActivation.isActivated();
    document.body.classList.toggle('is-locked', locked);
    const changeBtn = document.getElementById('change-code-btn');
    if (changeBtn) changeBtn.hidden = locked || !MedQCMActivation.showChangeCodeButton;

    if (locked) {
      homeBtn.hidden = true;
      session = null;
      app.innerHTML = viewActivation();
      if (scrollTop !== false) window.scrollTo(0, 0);
      return;
    }

    if (nav.view === 'results' && !resultsView) nav.view = 'intro';
    homeBtn.hidden = nav.view === 'home';

    if (nav.view === 'quiz') { displayQuestion(); return; }

    let html;
    switch (nav.view) {
      case 'modules':  html = viewModules(); break;
      case 'chapters': html = viewChapters(); break;
      case 'intro':    html = viewIntro(); break;
      case 'results':  html = viewResults(); break;
      default:         html = viewHome();
    }
    app.innerHTML = html;
    if (scrollTop !== false) window.scrollTo(0, 0);
  }

  // Un seul écouteur pour tous les boutons (repérés par data-action).
  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    if (!MedQCMActivation.isActivated()) return; // appareil non activé : aucune action interne
    const value = el.dataset.value;

    switch (el.dataset.action) {
      case 'home':        go('home'); break;
      case 'back':        goBack(); break;
      case 'year':        selectYear(value); break;
      case 'module':      selectModule(value); break;
      case 'chapter':     selectChapter(value); break;
      case 'to-chapters': go('chapters'); break;
      case 'crumb':
        if (value === 'home') go('home');
        else if (value === 'year') go('modules');
        else if (value === 'module') go('chapters');
        else if (value === 'chapter') go('intro');
        break;
      case 'start':
      case 'resume':      startQuiz(false); break;
      case 'restart':
        if (data.sessions[currentKey()] &&
            !window.confirm('Recommencer ce QCM ? Votre progression en cours sera effacée.')) break;
        resetQuiz();
        break;
      case 'leave':       go('intro'); break;
      case 'select':      selectAnswer(Number(value)); break;
      case 'validate':    checkAnswer(); break;
      case 'next':        nextQuestion(); break;
      case 'review':      reviewMistakes(); break;
      case 'deactivate':
        // "Changer de code" : retire l'activation, la progression est conservée.
        if (window.confirm('Changer de code ? Vous devrez saisir un code d’accès pour rouvrir MedQCM. Votre progression est conservée.')) {
          MedQCMActivation.deactivate();
          render(true);
        }
        break;
    }
  });

  // Page d'activation : validation du formulaire (bouton "Activer" ou touche "OK" du clavier mobile)
  document.addEventListener('submit', function (e) {
    if (e.target && e.target.id === 'activation-form') {
      e.preventDefault();
      submitActivation();
    }
  });

  // Page d'activation : mise en forme du code pendant la saisie
  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'access-code') {
      formatCodeInput(e.target);
      const msg = document.getElementById('activation-msg');
      if (msg) msg.innerHTML = '';
      e.target.classList.remove('is-invalid');
      e.target.removeAttribute('aria-invalid');
    }
  });

  // Activation retirée / ajoutée dans un autre onglet : on met l'écran à jour.
  window.addEventListener('storage', function (e) {
    if (e.key === MedQCMActivation.storageKey) render(false);
  });

  // Démarrage de l'application
  loadProgress();
  normalizeNav();
  ensureGuard();
  render(false);

  // Mode hors ligne : enregistrement du service worker (nécessite https:// ou localhost).
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('service-worker.js', { updateViaCache: 'none' })
        .catch(function (err) { console.warn('[MedQCM] Mode hors ligne indisponible :', err); });
    });
  }
})();
