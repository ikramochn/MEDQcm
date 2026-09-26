/* =====================================================================
   MedQCM — script.js  (logique de l'application)
   ---------------------------------------------------------------------
   Ne contient AUCUN texte affiché en dur : tous les libellés viennent
   de i18n.js (fonction t()). Pour ajouter du contenu, voir questions.js.

   Flux : Activation (activation.js) → Langue (i18n.js) → Accueil →
          Semestre → Module → Chapitre → Mode de révision → QCM →
          Correction → Révision des erreurs → Résultat.
          + Ma progression, Mes erreurs, Réglages.
   ===================================================================== */
(function () {
  'use strict';

  const app = document.getElementById('app');
  const homeBtn = document.getElementById('home-btn');
  const t = function (key, arg) { return MedQCMI18n.t(key, arg); };

  if (typeof QUESTIONS === 'undefined' || !Array.isArray(QUESTIONS) || typeof CURRICULUM === 'undefined') {
    homeBtn.hidden = true;
    app.innerHTML =
      '<section class="card notice notice-error"><h2>Loading error / Erreur de chargement</h2>' +
      '<p>questions.js introuvable ou invalide — vérifiez qu’il est dans le même dossier que index.html.</p></section>';
    return;
  }
  if (typeof MedQCMActivation === 'undefined') {
    homeBtn.hidden = true;
    app.innerHTML =
      '<section class="card notice notice-error"><h2>Loading error / Erreur de chargement</h2>' +
      '<p>activation.js introuvable ou invalide — vérifiez qu’il est dans le même dossier que index.html.</p></section>';
    return;
  }
  if (typeof MedQCMI18n === 'undefined') {
    homeBtn.hidden = true;
    app.innerHTML = '<section class="card notice notice-error"><h2>Loading error</h2><p>i18n.js missing.</p></section>';
    return;
  }

  const STORAGE_KEY = 'medqcm_data_v2';
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const SHUFFLE_QUESTIONS = typeof SETTINGS !== 'undefined' && SETTINGS && SETTINGS.shuffleQuestions === true;
  const QUICK_COUNT = (typeof SETTINGS !== 'undefined' && SETTINGS && SETTINGS.quickRevisionCount) || 10;

  const data = {
    nav: { view: 'home', semester: null, module: null, chapter: null, mode: null },
    sessions: {},       // clé "S1||Anatomy||Thorax||all" → session en cours
    lastResults: {},    // clé "S1||Anatomy||Thorax||all" → dernier résultat
    mistakeBank: {}      // clé "S1||Anatomy||Thorax" → [ids jamais maîtrisés]
  };
  const nav = data.nav;

  let session = null;
  let resultsView = null;
  let activationBusy = false;
  let guardActive = false;

  /* ---------------------------------------------------------------------
     OUTILS
     --------------------------------------------------------------------- */
  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lang() { return MedQCMI18n.getLanguage() || MedQCMI18n.detectDefault(); }
  function localize(field) { const L = lang(); return field[L] || field.fr; }
  function shuffle(list) { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function newPending() { return { selected: null, validated: false, correct: null }; }

  function chapterKey(semester, module, chapter) { return [semester, module, chapter].join('||'); }
  function sessionKey(semester, module, chapter, mode) { return [semester, module, chapter, mode].join('||'); }

  function moduleDef(semester, module) { return CURRICULUM[semester] && CURRICULUM[semester].modules[module]; }
  function moduleLabel(semester, module) { const m = moduleDef(semester, module); return m ? localize(m.label) : module; }
  function semesterLabel(semester) { return CURRICULUM[semester] ? localize(CURRICULUM[semester].label) : semester; }

  function questionsFor(semester, module, chapter) {
    return QUESTIONS.filter(function (q) { return q.semester === semester && q.module === module && q.chapter === chapter; });
  }
  function byId(id) { return QUESTIONS.find(function (q) { return q.id === id; }); }

  // Chapitres qui ont réellement des questions, pour un module donné.
  function chaptersWithContent(semester, module) {
    const def = moduleDef(semester, module);
    if (!def) return [];
    return (def.chapters || []).filter(function (c) { return questionsFor(semester, module, c).length > 0; });
  }

  /* ---------------------------------------------------------------------
     SAUVEGARDE
     --------------------------------------------------------------------- */
  function saveProgress() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (err) { /* ignoré */ }
  }

  function repairSession(s) {
    if (!s || typeof s !== 'object') return null;
    if (['initial', 'transition', 'review'].indexOf(s.phase) === -1) return null;
    if (!Array.isArray(s.questionIds) || !Array.isArray(s.queue) || !s.firstAttempt) return null;
    s.questionIds = s.questionIds.filter(function (id) { return !!byId(id); });
    s.queue = s.queue.filter(function (id) { return !!byId(id); });
    if (!s.questionIds.length) return null;
    if (!Number.isInteger(s.index) || s.index < 0) s.index = 0;
    if (!Number.isInteger(s.totalAnswers) || s.totalAnswers < 0) s.totalAnswers = 0;
    if (!s.pending) s.pending = newPending();
    if (s.phase === 'initial' && s.index >= s.questionIds.length) { if (!s.queue.length) return null; s.phase = 'transition'; }
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
      if (saved.nav) Object.assign(nav, { view: saved.nav.view || 'home', semester: saved.nav.semester || null, module: saved.nav.module || null, chapter: saved.nav.chapter || null, mode: saved.nav.mode || null });
      if (saved.sessions) Object.keys(saved.sessions).forEach(function (k) { const fixed = repairSession(saved.sessions[k]); if (fixed) data.sessions[k] = fixed; });
      if (saved.lastResults) data.lastResults = saved.lastResults;
      if (saved.mistakeBank) data.mistakeBank = saved.mistakeBank;
    } catch (err) { /* sauvegarde illisible : ignorée */ }
  }

  function bankFor(key) { if (!data.mistakeBank[key]) data.mistakeBank[key] = []; return data.mistakeBank[key]; }
  function addToBank(key, id) { const b = bankFor(key); if (b.indexOf(id) === -1) b.push(id); }
  function removeFromBank(key, id) { const b = bankFor(key); const i = b.indexOf(id); if (i !== -1) b.splice(i, 1); }

  function normalizeNav() {
    if (!nav.semester || !CURRICULUM[nav.semester]) { nav.view = 'home'; nav.semester = nav.module = nav.chapter = nav.mode = null; return; }
    if (!nav.module || !moduleDef(nav.semester, nav.module)) { nav.view = 'modules'; nav.module = nav.chapter = nav.mode = null; return; }
    if (nav.view === 'chapters' || nav.view === 'modules') { nav.chapter = nav.mode = null; return; }
    const withContent = chaptersWithContent(nav.semester, nav.module);
    if (!nav.chapter || withContent.indexOf(nav.chapter) === -1) { nav.view = 'chapters'; nav.chapter = nav.mode = null; return; }
    nav.view = 'hub'; nav.mode = null; // jamais en pleine question après un rechargement
  }

  /* ---------------------------------------------------------------------
     NAVIGATION
     --------------------------------------------------------------------- */
  function go(view) {
    nav.view = view;
    if (view === 'home') { nav.semester = nav.module = nav.chapter = nav.mode = null; }
    if (view === 'modules') { nav.module = nav.chapter = nav.mode = null; }
    if (view === 'chapters') { nav.chapter = nav.mode = null; }
    if (view === 'hub') { nav.mode = null; }
    if (view !== 'quiz') session = null;
    ensureGuard();
    saveProgress();
    render(true);
  }

  function ensureGuard() {
    if (nav.view !== 'home' && !guardActive && MedQCMActivation.isActivated() && MedQCMI18n.getLanguage()) {
      try { history.pushState({ medqcm: true }, ''); guardActive = true; } catch (err) { /* ignoré */ }
    }
  }
  window.addEventListener('popstate', function () {
    guardActive = false;
    if (nav.view !== 'home' && MedQCMActivation.isActivated() && MedQCMI18n.getLanguage()) goBack();
  });

  function goBack() {
    switch (nav.view) {
      case 'quiz': go('hub'); break;
      case 'results': go('hub'); break;
      case 'hub': go('chapters'); break;
      case 'chapters': go('modules'); break;
      case 'modules': go('semesters'); break;
      case 'progress': case 'mistakes-list': case 'settings': go('home'); break;
      default: go('home');
    }
  }

  function navRowHtml(extraCrumb) {
    const items = [{ label: t('home'), action: 'home' }];
    if (nav.semester) items.push({ label: semesterLabel(nav.semester), action: 'crumb-semester' });
    if (nav.module && (nav.view === 'chapters' || nav.view === 'hub' || nav.view === 'quiz' || nav.view === 'results')) items.push({ label: moduleLabel(nav.semester, nav.module), action: 'crumb-module' });
    if (nav.chapter && (nav.view === 'hub' || nav.view === 'quiz' || nav.view === 'results')) items.push({ label: nav.chapter, action: 'crumb-chapter' });
    if (extraCrumb) items.push({ label: extraCrumb, action: null });
    const crumbs = items.map(function (it, i) {
      if (i === items.length - 1) return '<span class="crumb-current" aria-current="page">' + esc(it.label) + '</span>';
      return '<button type="button" class="crumb-link" data-action="' + it.action + '">' + esc(it.label) + '</button>';
    }).join('<span class="crumb-sep" aria-hidden="true">›</span>');
    return '<div class="nav-row"><button type="button" class="back-btn" data-action="back">' + esc(t('back')) + '</button>' +
      '<nav class="crumbs" aria-label="breadcrumb">' + crumbs + '</nav></div>';
  }

  /* ---------------------------------------------------------------------
     ÉCRAN : LANGUE
     --------------------------------------------------------------------- */
  function viewLanguage() {
    return '<section class="activation">' +
      '<div class="app-logo" aria-hidden="true">' + stethoscopeSvg(64) + '</div>' +
      '<h1 class="activation-brand">' + esc(t('chooseLanguageTitle')) + '</h1>' +
      '<p class="activation-tagline" style="margin-top:8px;font-size:1rem">' + esc(t('chooseLanguageSub')) + '</p>' +
      '<div class="lang-grid">' +
      '<button type="button" class="lang-card" data-action="set-lang" data-value="fr"><span class="lang-flag" aria-hidden="true">🇫🇷</span><span>Français</span></button>' +
      '<button type="button" class="lang-card" data-action="set-lang" data-value="en"><span class="lang-flag" aria-hidden="true">🇬🇧</span><span>English</span></button>' +
      '</div></section>';
  }

  /* ---------------------------------------------------------------------
     ÉCRAN : ACCUEIL
     --------------------------------------------------------------------- */
  function findAnyActiveSession() {
    const keys = Object.keys(data.sessions);
    return keys.length ? keys[0] : null;
  }

  function viewHome() {
    const activeKey = findAnyActiveSession();
    const html = [];
    html.push(
      '<section class="hero">' +
      '<div class="hero-logo" aria-hidden="true">' + stethoscopeSvg(34) + '</div>' +
      '<h1>' + esc(t('appName')) + '</h1>' +
      '<p class="subtitle" style="font-weight:650;color:var(--accent-strong)">' + esc(t('appYear')) + '</p>' +
      '<p class="subtitle">' + esc(t('tagline')) + '</p>' +
      '</section>'
    );
    html.push('<div class="grid grid-list">');
    html.push(homeTile('continue', t('continueRevision'), activeKey ? '' : t('noDataYet'), !activeKey));
    html.push(homeTile('sem1', t('semester1'), Object.keys(CURRICULUM.S1.modules).length + ' modules', false));
    html.push(homeTile('sem2', t('semester2'), Object.keys(CURRICULUM.S2.modules).length + ' modules', false));
    html.push(homeTile('progress', t('myProgress'), '', false));
    html.push(homeTile('mistakes', t('myMistakes'), '', false));
    html.push(homeTile('settings', t('settings'), '', false));
    html.push('</div>');
    return html.join('');
  }

  function homeTile(action, title, meta, disabled) {
    return '<button type="button" class="card-btn' + (disabled ? ' is-empty' : '') + '" data-action="' + action + '"' + (disabled ? ' disabled' : '') + '>' +
      '<span class="card-title">' + esc(title) + '</span>' +
      (meta ? '<span class="card-meta">' + esc(meta) + '</span>' : '') + '</button>';
  }

  /* ---------------------------------------------------------------------
     ÉCRANS : SEMESTRE / MODULE / CHAPITRE
     --------------------------------------------------------------------- */
  function emptyState(message) {
    return '<div class="card empty-state"><div class="empty-icon" aria-hidden="true">🩺</div><p class="empty-title">' + esc(message) + '</p></div>';
  }

  function viewSemesters() {
    let html = navRowHtml() + '<header class="page-head"><h2 class="page-title">' + esc(t('chooseSemester')) + '</h2></header><div class="grid grid-years">';
    ['S1', 'S2'].forEach(function (s) {
      const n = Object.keys(CURRICULUM[s].modules).length;
      html += '<button type="button" class="card-btn" data-action="semester" data-value="' + s + '">' +
        '<span class="card-lead" aria-hidden="true">' + s + '</span>' +
        '<span class="card-title">' + esc(semesterLabel(s)) + '</span>' +
        '<span class="card-meta">' + n + ' modules</span></button>';
    });
    return html + '</div>';
  }

  function viewModules() {
    const modules = Object.keys(CURRICULUM[nav.semester].modules);
    let html = navRowHtml() + '<header class="page-head"><p class="eyebrow">' + esc(semesterLabel(nav.semester)) + '</p><h2 class="page-title">' + esc(t('chooseModule')) + '</h2></header><div class="grid grid-list">';
    modules.forEach(function (m) {
      const withContent = chaptersWithContent(nav.semester, m);
      const total = withContent.reduce(function (sum, c) { return sum + questionsFor(nav.semester, m, c).length; }, 0);
      html += '<button type="button" class="card-btn' + (total ? '' : ' is-empty') + '" data-action="module" data-value="' + esc(m) + '">' +
        '<span class="card-title">' + esc(moduleLabel(nav.semester, m)) + '</span>' +
        '<span class="card-meta">' + (total ? t('questionsCount', total) : t('comingSoon')) + '</span></button>';
    });
    return html + '</div>';
  }

  function viewChapters() {
    const withContent = chaptersWithContent(nav.semester, nav.module);
    let html = navRowHtml() + '<header class="page-head"><p class="eyebrow">' + esc(moduleLabel(nav.semester, nav.module)) + '</p><h2 class="page-title">' + esc(t('chooseChapter')) + '</h2></header>';
    if (!withContent.length) return html + emptyState(t('comingSoonModule'));
    html += '<div class="grid grid-list">';
    withContent.forEach(function (c) {
      const n = questionsFor(nav.semester, nav.module, c).length;
      html += '<button type="button" class="card-btn" data-action="chapter" data-value="' + esc(c) + '">' +
        '<span class="card-title">' + esc(c) + '</span><span class="card-meta">' + t('questionsCount', n) + '</span></button>';
    });
    return html + '</div>';
  }

  /* ---------------------------------------------------------------------
     ÉCRAN : HUB DE RÉVISION (choix du mode)
     --------------------------------------------------------------------- */
  function modeCard(mode, title, desc, disabled, hint) {
    return '<button type="button" class="mode-card' + (disabled ? ' is-empty' : '') + '" data-action="mode" data-value="' + mode + '"' + (disabled ? ' disabled' : '') + '>' +
      '<span class="mode-title">' + esc(title) + '</span><span class="mode-desc">' + esc(disabled && hint ? hint : desc) + '</span></button>';
  }

  function viewHub() {
    const total = questionsFor(nav.semester, nav.module, nav.chapter).length;
    const key = chapterKey(nav.semester, nav.module, nav.chapter);
    const bank = bankFor(key);
    const allKey = sessionKey(nav.semester, nav.module, nav.chapter, 'all');
    const activeAny = ['all', 'mistakes', 'retry', 'random', 'quick'].some(function (m) { return !!data.sessions[sessionKey(nav.semester, nav.module, nav.chapter, m)]; });
    const last = data.lastResults[allKey];

    let html = navRowHtml() +
      '<header class="page-head"><p class="eyebrow">' + esc(moduleLabel(nav.semester, nav.module)) + '</p>' +
      '<h2 class="page-title">' + esc(nav.chapter) + '</h2></header>' +
      '<p class="lead muted" style="margin:-8px 0 16px">' + t('questionsCount', total) + '</p>';

    if (activeAny) {
      html += '<div class="status-box"><strong>' + esc(t('resumeTitle')) + '</strong></div>';
    }
    if (last) {
      const date = last.date ? new Date(last.date).toLocaleDateString(lang() === 'fr' ? 'fr-FR' : 'en-US') : '';
      html += '<p class="last-result">' + esc(t('lastResult')) + ' ' + last.firstCorrect + ' / ' + last.total + ' ' + esc(t('firstTry')) + (date ? ' (' + esc(date) + ')' : '') + '</p>';
    }

    html += '<h3 class="section-title" style="margin-top:18px">' + esc(t('modeHub')) + '</h3><div class="mode-grid">';
    html += modeCard('all', t('modeAll'), t('modeAllDesc'), false);
    html += modeCard('mistakes', t('modeMistakes'), t('modeMistakesDesc'), bank.length === 0, t('noMistakesYet'));
    html += modeCard('retry', t('modeRetry'), t('modeRetryDesc'), false);
    html += modeCard('random', t('modeRandom'), t('modeRandomDesc'), false);
    html += modeCard('quick', t('modeQuick'), t('modeQuickDesc', Math.min(QUICK_COUNT, total)), total < 2);
    html += '</div>';
    return html;
  }

  /* ---------------------------------------------------------------------
     MOTEUR DE QUIZ
     --------------------------------------------------------------------- */
  function currentQuestion() { const id = session.phase === 'review' ? session.queue[0] : session.questionIds[session.index]; return byId(id); }
  function countMistakes() { return session.questionIds.filter(function (id) { return session.firstAttempt[id] === false; }).length; }
  function countFirstTryCorrect() { return session.questionIds.filter(function (id) { return session.firstAttempt[id] === true; }).length; }

  function buildQuestionSet(mode) {
    const all = questionsFor(nav.semester, nav.module, nav.chapter).map(function (q) { return q.id; });
    if (mode === 'mistakes') return bankFor(chapterKey(nav.semester, nav.module, nav.chapter)).slice();
    if (mode === 'random') return shuffle(all);
    if (mode === 'quick') return shuffle(all).slice(0, Math.min(QUICK_COUNT, all.length));
    return SHUFFLE_QUESTIONS ? shuffle(all) : all; // 'all' et 'retry'
  }

  function startQuiz(mode, fresh) {
    if (!MedQCMActivation.isActivated()) { render(false); return; }
    const key = sessionKey(nav.semester, nav.module, nav.chapter, mode);
    let s = fresh ? null : data.sessions[key];
    if (!s) {
      const ids = buildQuestionSet(mode);
      if (!ids.length) { go('hub'); return; }
      s = { phase: 'initial', index: 0, questionIds: ids, queue: [], firstAttempt: {}, totalAnswers: 0, pending: newPending(), startedAt: Date.now() };
      data.sessions[key] = s;
    }
    session = s;
    resultsView = null;
    nav.mode = mode;
    nav.view = 'quiz';
    ensureGuard();
    saveProgress();
    render(true);
  }

  function resetQuiz() {
    delete data.sessions[sessionKey(nav.semester, nav.module, nav.chapter, nav.mode)];
    session = null;
    startQuiz(nav.mode, true);
  }

  function modeLabel(mode) {
    return { all: t('modeAll'), mistakes: t('modeMistakes'), retry: t('modeRetry'), random: t('modeRandom'), quick: t('modeQuick') }[mode] || mode;
  }

  function displayQuestion(opts) {
    opts = opts || {};
    if (!MedQCMActivation.isActivated()) { render(false); return; }
    if (!session) { startQuiz(nav.mode || 'all', false); return; }

    const topRow = '<div class="nav-row"><button type="button" class="back-btn" data-action="leave">' + esc(t('quitSeries')) + '</button></div>';
    const where = moduleLabel(nav.semester, nav.module) + ' — ' + nav.chapter;

    if (session.phase === 'transition') {
      const n = session.queue.length;
      app.innerHTML = topRow + '<article class="card center-card">' +
        '<p class="eyebrow">' + esc(where) + '</p><div class="big-emoji" aria-hidden="true">🔁</div>' +
        '<h2>' + esc(t('transitionTitle')) + '</h2><p class="lead">' + esc(t('transitionDone')) + '</p>' +
        '<p class="lead">' + esc(t('transitionMistakes', n)) + '</p>' +
        '<p class="muted" style="margin-top:10px">' + esc(t('transitionScore')) + ' ' + countFirstTryCorrect() + ' / ' + session.questionIds.length + '</p>' +
        '<button type="button" class="btn btn-primary btn-block" data-action="review">' + esc(t('startReview')) + '</button></article>';
      window.scrollTo(0, 0); return;
    }

    const q = currentQuestion();
    const p = session.pending;
    const isReview = session.phase === 'review';
    const total = session.questionIds.length;

    let label, sub, pct;
    if (!isReview) {
      label = t('question') + ' ' + (session.index + 1) + ' / ' + total;
      sub = t('firstSeries');
      pct = (session.index + (p.validated ? 1 : 0)) / total * 100;
    } else {
      const mistakes = countMistakes();
      const remaining = session.queue.length - (p.validated && p.correct ? 1 : 0);
      label = t('reviewRemaining', remaining);
      sub = t('reviewBadge');
      pct = mistakes ? (mistakes - remaining) / mistakes * 100 : 100;
    }

    const opts_ = localize(q.options);
    const options = opts_.map(function (text, i) {
      let cls = 'option', mark = '';
      if (p.validated) {
        if (i === q.correctAnswer) { cls += ' is-correct'; mark = '✓'; }
        else if (i === p.selected) { cls += ' is-wrong'; mark = '✗'; }
        else cls += ' is-dim';
      } else if (i === p.selected) cls += ' is-selected';
      return '<button type="button" class="' + cls + '" role="radio" aria-checked="' + (i === p.selected) + '" data-action="select" data-value="' + i + '"' + (p.validated ? ' disabled' : '') + '>' +
        '<span class="option-letter" aria-hidden="true">' + LETTERS[i] + '</span><span class="option-text">' + esc(text) + '</span><span class="option-mark" aria-hidden="true">' + mark + '</span></button>';
    }).join('');

    let bottom;
    if (!p.validated) {
      bottom = '<div class="actions"><button type="button" id="validate-btn" class="btn btn-primary btn-block" data-action="validate"' + (p.selected === null ? ' disabled' : '') + '>' + esc(t('validate')) + '</button></div>';
    } else {
      bottom = feedbackHtml(q, p) + '<div class="actions"><button type="button" id="next-btn" class="btn btn-primary btn-block" data-action="next">' + esc(nextLabel(p)) + '</button></div>';
    }

    app.innerHTML = topRow + '<article class="card quiz-card">' +
      '<div class="quiz-meta"><span class="eyebrow">' + esc(where) + '</span>' +
      '<span class="badge ' + (isReview ? 'badge-review' : 'badge-initial') + '">' + esc(isReview ? t('reviewBadge') : modeLabel(nav.mode)) + '</span></div>' +
      '<div class="progress-head"><span>' + esc(label) + '</span><span class="progress-sub">' + esc(sub) + '</span></div>' +
      '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(pct) + '"><div class="progress-fill' + (isReview ? ' is-review' : '') + '" style="width:' + pct.toFixed(1) + '%"></div></div>' +
      (isReview ? '<p class="review-hint">' + esc(t('reviewHint')) + '</p>' : '') +
      '<h2 class="question-text">' + esc(localize(q.question)) + '</h2>' +
      '<div class="options" role="radiogroup">' + options + '</div>' + bottom + '</article>';

    if (opts.scrollToNext) { const btn = document.getElementById('next-btn'); if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    else window.scrollTo(0, 0);
  }

  function nextLabel(p) {
    if (session.phase === 'initial') {
      if (session.index + 1 < session.questionIds.length) return t('nextQuestion');
      return session.queue.length ? t('finishSeries') : t('seeResult');
    }
    const remaining = session.queue.length - (p.correct ? 1 : 0);
    return remaining > 0 ? t('nextQuestion') : t('seeResult');
  }

  function feedbackHtml(q, p) {
    const ok = p.correct;
    let html = '<div id="feedback" class="feedback ' + (ok ? 'feedback-correct' : 'feedback-wrong') + '" role="status">' +
      '<p class="feedback-title">' + esc(ok ? t('correct') : t('incorrect')) + '</p>' +
      '<p class="feedback-answer">' + esc(t('correctAnswerIs')) + ' <strong>' + LETTERS[q.correctAnswer] + '. ' + esc(localize(q.options)[q.correctAnswer]) + '</strong></p>';
    if (q.explanation) html += '<div class="feedback-explanation"><p class="feedback-label">' + esc(t('explanation')) + '</p><p>' + esc(localize(q.explanation)) + '</p></div>';
    if (!ok) html += '<p class="feedback-note">' + esc(session.phase === 'review' ? t('backToReviewAgain') : t('backToReview')) + '</p>';
    return html + '</div>';
  }

  function selectAnswer(index) {
    if (!session || session.phase === 'transition' || session.pending.validated) return;
    session.pending.selected = index;
    saveProgress();
    const buttons = app.querySelectorAll('.option');
    for (let i = 0; i < buttons.length; i++) { const sel = i === index; buttons[i].classList.toggle('is-selected', sel); buttons[i].setAttribute('aria-checked', String(sel)); }
    const vb = document.getElementById('validate-btn'); if (vb) vb.disabled = false;
  }

  function checkAnswer() {
    if (!session || session.phase === 'transition') return;
    const p = session.pending;
    if (p.selected === null || p.validated) return;
    const q = currentQuestion();
    p.validated = true;
    p.correct = (p.selected === q.correctAnswer);
    session.totalAnswers += 1;

    const cKey = chapterKey(nav.semester, nav.module, nav.chapter);
    if (p.correct) removeFromBank(cKey, q.id);
    if (session.phase === 'initial') {
      session.firstAttempt[q.id] = p.correct;
      if (!p.correct) { addToBank(cKey, q.id); if (session.queue.indexOf(q.id) === -1) session.queue.push(q.id); }
    }
    saveProgress();
    displayQuestion({ scrollToNext: true });
  }

  function nextQuestion() {
    if (!session || !session.pending.validated) return;
    const p = session.pending;
    if (session.phase === 'initial') {
      session.index += 1;
      session.pending = newPending();
      if (session.index >= session.questionIds.length) {
        if (session.queue.length > 0) session.phase = 'transition';
        else { finishSession(); return; }
      }
    } else if (session.phase === 'review') {
      if (p.correct) session.queue.shift(); else session.queue.push(session.queue.shift());
      session.pending = newPending();
      if (session.queue.length === 0) { finishSession(); return; }
    }
    saveProgress();
    displayQuestion();
  }

  function reviewMistakes() {
    if (!session) return;
    if (session.phase === 'transition') { session.phase = 'review'; session.pending = newPending(); saveProgress(); }
    displayQuestion();
  }

  function finishSession() {
    const key = sessionKey(nav.semester, nav.module, nav.chapter, nav.mode);
    const total = session.questionIds.length;
    const firstCorrect = countFirstTryCorrect();
    const mistakes = countMistakes();
    resultsView = { total: total, firstCorrect: firstCorrect, mistakes: mistakes, reviewed: mistakes, totalAnswers: session.totalAnswers };
    data.lastResults[key] = { total: total, firstCorrect: firstCorrect, mistakes: mistakes, totalAnswers: session.totalAnswers, date: Date.now() };
    delete data.sessions[key];
    session = null;
    saveProgress();
    nav.view = 'results'; ensureGuard(); saveProgress(); render(true);
  }

  function viewResults() {
    const r = resultsView;
    const pct = r.total ? Math.round(r.firstCorrect / r.total * 100) : 0;
    const banner = r.mistakes > 0
      ? '<div class="banner">' + esc(t('resultAllClear')) + '<small>' + esc(t('resultAllClearSub')) + '</small></div>'
      : '<div class="banner">' + esc(t('resultPerfect')) + '<small>' + esc(t('resultPerfectSub')) + '</small></div>';
    return navRowHtml() + '<article class="card">' +
      '<p class="eyebrow">' + esc(moduleLabel(nav.semester, nav.module)) + ' — ' + esc(nav.chapter) + '</p>' +
      '<h2>' + esc(t('resultTitle')) + '</h2>' + banner +
      '<div class="score-ring" style="--pct:' + pct + '"><div class="score-ring-inner"><span class="score-value">' + r.firstCorrect + ' / ' + r.total + '</span><span class="score-caption">' + esc(t('resultInitialScore')) + '</span></div></div>' +
      '<p class="score-pct">' + esc(t('resultPercent', pct)) + '</p>' +
      '<ul class="stats">' +
      '<li><span>' + esc(t('statFirstTry')) + '</span><span class="stat-value">' + r.firstCorrect + '</span></li>' +
      '<li><span>' + esc(t('statMistakes')) + '</span><span class="stat-value">' + r.mistakes + '</span></li>' +
      '<li><span>' + esc(t('statReviewed')) + '</span><span class="stat-value">' + r.reviewed + '</span></li>' +
      '<li><span>' + esc(t('statTotal')) + '</span><span class="stat-value">' + r.totalAnswers + '</span></li>' +
      '</ul><div class="results-actions">' +
      '<button type="button" class="btn btn-primary" data-action="restart">' + esc(t('restart')) + '</button>' +
      '<button type="button" class="btn btn-secondary" data-action="to-hub">' + esc(t('backToModule')) + '</button>' +
      '<button type="button" class="btn btn-secondary" data-action="home">' + esc(t('home')) + '</button></div></article>';
  }

  /* ---------------------------------------------------------------------
     PROGRESSION / MES ERREURS / RÉGLAGES
     --------------------------------------------------------------------- */
  function allContentChapters() {
    const list = [];
    ['S1', 'S2'].forEach(function (s) {
      Object.keys(CURRICULUM[s].modules).forEach(function (m) {
        chaptersWithContent(s, m).forEach(function (c) { list.push({ semester: s, module: m, chapter: c }); });
      });
    });
    return list;
  }

  function viewProgress() {
    const chapters = allContentChapters();
    let html = navRowHtml() + '<header class="page-head"><h2 class="page-title">' + esc(t('progressTitle')) + '</h2></header>';
    if (!chapters.length) return html + emptyState(t('progressNoData'));

    let sumPct = 0, withData = 0;
    const rows = chapters.map(function (c) {
      const key = sessionKey(c.semester, c.module, c.chapter, 'all');
      const last = data.lastResults[key];
      const pct = last ? Math.round(last.firstCorrect / last.total * 100) : null;
      if (pct !== null) { sumPct += pct; withData++; }
      return '<div class="progress-row"><div class="progress-row-head"><span>' + esc(moduleLabel(c.semester, c.module)) + ' — ' + esc(c.chapter) + '</span><span>' + (pct === null ? '—' : pct + '%') + '</span></div>' +
        '<div class="progress"><div class="progress-fill" style="width:' + (pct || 0) + '%"></div></div></div>';
    }).join('');
    const overall = withData ? Math.round(sumPct / withData) : 0;

    return html + '<div class="card"><p class="eyebrow">' + esc(t('progressYear')) + '</p>' +
      '<div class="progress-row-head" style="margin-top:6px"><span>' + overall + '%</span></div>' +
      '<div class="progress"><div class="progress-fill" style="width:' + overall + '%"></div></div>' +
      '<div style="margin-top:18px">' + rows + '</div></div>';
  }

  function viewMistakesList() {
    const chapters = allContentChapters().map(function (c) {
      const bank = bankFor(chapterKey(c.semester, c.module, c.chapter));
      return Object.assign({}, c, { count: bank.length });
    }).filter(function (c) { return c.count > 0; });

    let html = navRowHtml() + '<header class="page-head"><h2 class="page-title">' + esc(t('myMistakes')) + '</h2></header>';
    if (!chapters.length) return html + emptyState(t('noMistakesYet'));
    html += '<div class="grid grid-list">';
    chapters.forEach(function (c) {
      html += '<button type="button" class="card-btn" data-action="go-mistakes" data-value="' + esc(chapterKey(c.semester, c.module, c.chapter)) + '">' +
        '<span class="card-title">' + esc(moduleLabel(c.semester, c.module)) + ' — ' + esc(c.chapter) + '</span>' +
        '<span class="card-meta">' + t('questionsCount', c.count) + '</span></button>';
    });
    return html + '</div>';
  }

  function viewSettings() {
    const cur = lang();
    let html = navRowHtml() + '<header class="page-head"><h2 class="page-title">' + esc(t('settings')) + '</h2></header>';
    html += '<div class="card"><p class="eyebrow">' + esc(t('changeLanguage')) + '</p><div class="lang-grid" style="margin-top:10px">' +
      '<button type="button" class="lang-card' + (cur === 'fr' ? ' is-active' : '') + '" data-action="set-lang" data-value="fr"><span class="lang-flag" aria-hidden="true">🇫🇷</span><span>Français</span></button>' +
      '<button type="button" class="lang-card' + (cur === 'en' ? ' is-active' : '') + '" data-action="set-lang" data-value="en"><span class="lang-flag" aria-hidden="true">🇬🇧</span><span>English</span></button>' +
      '</div></div>';
    if (MedQCMActivation.showChangeCodeButton) {
      html += '<div class="card" style="margin-top:14px"><button type="button" class="btn btn-secondary btn-block" data-action="deactivate">' + esc(t('changeCode')) + '</button></div>';
    }
    return html;
  }

  /* ---------------------------------------------------------------------
     LOGO (stéthoscope, utilisé pour l'écran de langue et l'accueil)
     --------------------------------------------------------------------- */
  function stethoscopeSvg(size) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M14 6v10a8 8 0 0 0 16 0V6" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M14 6a2 2 0 1 0 0-.01M30 6a2 2 0 1 0 0-.01" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M22 24v6a8 8 0 0 0 16 0v-3" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="40" cy="27" r="4" stroke="currentColor" stroke-width="3"/>' +
      '<circle cx="22" cy="23" r="3.4" stroke="currentColor" stroke-width="2.6"/>' +
      '</svg>';
  }

  /* ---------------------------------------------------------------------
     ACTIVATION (inchangé dans son fonctionnement, textes via i18n)
     --------------------------------------------------------------------- */
  function alertHtml(kind, title, text) { return '<div class="alert alert-' + kind + '"' + (kind === 'success' ? ' role="status"' : '') + '><strong>' + esc(title) + '</strong><span>' + esc(text) + '</span></div>'; }

  function viewActivation() {
    return '<section class="activation">' +
      '<div class="app-logo" aria-hidden="true">' + stethoscopeSvg(64) + '</div>' +
      '<h1 class="activation-brand">' + esc(t('activationTitle')) + '</h1>' +
      '<p class="activation-tagline">' + esc(t('activationTagline')) + '</p>' +
      '<form class="activation-form" id="activation-form" novalidate autocomplete="off">' +
      '<label class="activation-label" for="access-code">' + esc(t('activationLabel')) + '</label>' +
      '<input id="access-code" class="code-input" type="text" inputmode="text" autocapitalize="characters" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="go" maxlength="20" placeholder="MED-XXXX-XXXX" aria-describedby="activation-msg">' +
      '<div id="activation-msg" class="activation-msg" aria-live="polite"></div>' +
      '<button type="submit" id="activate-btn" class="btn btn-primary btn-block">' + esc(t('activate')) + '</button>' +
      '</form><p class="activation-help">' + esc(t('activationHelp')) + '</p></section>';
  }

  function showActivationError(result) {
    const msg = document.getElementById('activation-msg'); const input = document.getElementById('access-code');
    if (!msg) return;
    let html;
    if (result.reason === 'empty') html = alertHtml('error', t('activationEmptyTitle'), t('activationEmptyText'));
    else if (result.reason === 'locked') html = alertHtml('error', t('activationLockedTitle'), t('activationLockedText', result.retryIn));
    else if (result.reason === 'error') html = alertHtml('error', t('activationErrorTitle'), t('activationErrorText'));
    else html = alertHtml('error', t('activationInvalidTitle'), t('activationInvalidText'));
    msg.innerHTML = html;
    if (input) { input.classList.add('is-invalid'); input.setAttribute('aria-invalid', 'true'); }
  }

  function showActivationSuccess() {
    const form = document.getElementById('activation-form');
    if (form) form.innerHTML = alertHtml('success', t('activationSuccessTitle'), t('activationSuccessText'));
    setTimeout(enterApp, 1000);
  }

  function enterApp() {
    if (!MedQCMActivation.isActivated()) { render(false); return; }
    normalizeNav(); ensureGuard(); render(true);
  }

  async function submitActivation() {
    if (activationBusy) return;
    const input = document.getElementById('access-code'); const button = document.getElementById('activate-btn');
    if (!input || !button) return;
    activationBusy = true; button.disabled = true; button.textContent = lang() === 'fr' ? 'Vérification…' : 'Checking…';
    let result;
    try { result = await MedQCMActivation.verifyCode(input.value); } catch (err) { result = { ok: false, reason: 'error' }; }
    activationBusy = false;
    if (result.ok) { MedQCMActivation.activate(result.codeHash); showActivationSuccess(); return; }
    button.disabled = false; button.textContent = t('activate');
    showActivationError(result); input.focus();
  }

  function formatCodeInput(el) {
    let raw = el.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); let formatted = raw;
    if (raw.indexOf('MED') === 0) { raw = raw.slice(0, 11); formatted = [raw.slice(0, 3), raw.slice(3, 7), raw.slice(7, 11)].filter(Boolean).join('-'); }
    if (formatted !== el.value) el.value = formatted;
  }

  /* ---------------------------------------------------------------------
     AFFICHAGE PRINCIPAL
     --------------------------------------------------------------------- */
  function render(scrollTop) {
    const locked = !MedQCMActivation.isActivated();
    document.body.classList.toggle('is-locked', locked);

    const footerEl = document.getElementById('app-footer');
    if (locked) {
      homeBtn.hidden = true; session = null;
      if (footerEl) footerEl.hidden = true;
      app.innerHTML = viewActivation();
      if (scrollTop !== false) window.scrollTo(0, 0);
      return;
    }
    if (!MedQCMI18n.getLanguage()) {
      homeBtn.hidden = true; session = null;
      if (footerEl) footerEl.hidden = true;
      app.innerHTML = viewLanguage();
      if (scrollTop !== false) window.scrollTo(0, 0);
      return;
    }

    if (nav.view === 'results' && !resultsView) nav.view = 'hub';
    homeBtn.hidden = nav.view === 'home';
    homeBtn.textContent = t('home');
    const footer = document.getElementById('app-footer');
    const footerText = document.getElementById('footer-text');
    if (footer && footerText) { footer.hidden = false; footerText.textContent = t('progressSavedFooter'); }
    if (nav.view === 'quiz') { displayQuestion(); return; }

    let html;
    switch (nav.view) {
      case 'semesters': html = viewSemesters(); break;
      case 'modules': html = viewModules(); break;
      case 'chapters': html = viewChapters(); break;
      case 'hub': html = viewHub(); break;
      case 'results': html = viewResults(); break;
      case 'progress': html = viewProgress(); break;
      case 'mistakes-list': html = viewMistakesList(); break;
      case 'settings': html = viewSettings(); break;
      default: html = viewHome();
    }
    app.innerHTML = html;
    if (scrollTop !== false) window.scrollTo(0, 0);
  }

  /* ---------------------------------------------------------------------
     CLICS
     --------------------------------------------------------------------- */
  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const value = el.dataset.value;

    // Sélection de langue : toujours permise (écran de langue ou réglages).
    if (el.dataset.action === 'set-lang') {
      MedQCMI18n.setLanguage(value);
      if (!nav.view || nav.view === 'home') nav.view = 'home';
      enterApp();
      return;
    }
    if (!MedQCMActivation.isActivated() || !MedQCMI18n.getLanguage()) return;

    switch (el.dataset.action) {
      case 'home': go('home'); break;
      case 'back': goBack(); break;
      case 'sem1': nav.semester = 'S1'; go('modules'); break;
      case 'sem2': nav.semester = 'S2'; go('modules'); break;
      case 'progress': go('progress'); break;
      case 'mistakes': go('mistakes-list'); break;
      case 'settings': go('settings'); break;
      case 'continue': {
        const key = findAnyActiveSession();
        if (key) {
          const parts = key.split('||');
          nav.semester = parts[0]; nav.module = parts[1]; nav.chapter = parts[2]; nav.mode = parts[3];
          nav.view = 'quiz'; session = data.sessions[key];
          ensureGuard(); saveProgress(); render(true);
        }
        break;
      }
      case 'crumb-semester': go('modules'); break;
      case 'crumb-module': go('chapters'); break;
      case 'crumb-chapter': go('hub'); break;
      case 'semester': nav.semester = value; go('modules'); break;
      case 'module': nav.module = value; go('chapters'); break;
      case 'chapter': nav.chapter = value; go('hub'); break;
      case 'go-mistakes': {
        const parts = value.split('||');
        nav.semester = parts[0]; nav.module = parts[1]; nav.chapter = parts[2];
        startQuiz('mistakes', false);
        break;
      }
      case 'mode': startQuiz(value, false); break;
      case 'to-hub': go('hub'); break;
      case 'restart':
        if (data.sessions[sessionKey(nav.semester, nav.module, nav.chapter, nav.mode)] &&
            !window.confirm(lang() === 'fr' ? 'Recommencer ? Votre progression en cours sera effacée.' : 'Restart? Your current progress will be cleared.')) break;
        resetQuiz();
        break;
      case 'leave': go('hub'); break;
      case 'select': selectAnswer(Number(value)); break;
      case 'validate': checkAnswer(); break;
      case 'next': nextQuestion(); break;
      case 'review': reviewMistakes(); break;
      case 'deactivate':
        if (window.confirm(lang() === 'fr' ? 'Changer de code ? Votre progression est conservée.' : 'Change code? Your progress is kept.')) { MedQCMActivation.deactivate(); render(true); }
        break;
    }
  });

  document.addEventListener('submit', function (e) { if (e.target && e.target.id === 'activation-form') { e.preventDefault(); submitActivation(); } });
  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'access-code') {
      formatCodeInput(e.target);
      const msg = document.getElementById('activation-msg'); if (msg) msg.innerHTML = '';
      e.target.classList.remove('is-invalid'); e.target.removeAttribute('aria-invalid');
    }
  });
  window.addEventListener('storage', function (e) { if (e.key === MedQCMActivation.storageKey || e.key === MedQCMI18n.STORAGE_KEY) render(false); });

  /* ---------------------------------------------------------------------
     DÉMARRAGE
     --------------------------------------------------------------------- */
  loadProgress();
  normalizeNav();
  ensureGuard();
  render(false);

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('service-worker.js', { updateViaCache: 'none' }).catch(function () { /* hors ligne indisponible */ });
    });
  }
})();
