/* 9×16 peržiūra — интерфейс клиента и команды.
   Без сборки: обычный скрипт. Данные — window.KAB_DATA (data.js), настройки — window.KABINETAS (config.js).
   Адреса (на нашем хостинге): #k=<токен клиента> — клиент; #a=<токен команды> — мы. Без токена в демо — переключатель «Klientas / Komanda».
   В артефакте claude.ai (window.KAB_EMBED) — только демо в этом браузере, без адресов.
   Вход: число «laukia», план «Kas toliau» (projects[].plan), карточки. Пояснения — за «?» в шапке.
   Плеер: варианты v1/v2 (обычно — с начала), режим «Palyginti» (та же секунда), «Kas pakeista» свёрнуто,
   в конце ролика — «Toliau» и через 5 с следующий ролик. */
(function () {
  'use strict';
  var CFG = window.KABINETAS || {};
  var KD = window.KAB_DATA, LS = KD.LS;
  var EMBED = window.KAB_EMBED || null;
  var noop = function () {};
  var UPNEXT_MS = 5000;

  // ---------------- тексты LT / EN ----------------
  function ltPl(n, one, few, many) {
    var a = Math.abs(n) % 10, b = Math.abs(n) % 100;
    if (a === 1 && b !== 11) return one;
    if (a >= 2 && a <= 9 && (b < 12 || b > 19)) return few;
    return many;
  }
  var MONTHS_LT = ['sausio', 'vasario', 'kovo', 'balandžio', 'gegužės', 'birželio', 'liepos', 'rugpjūčio', 'rugsėjo', 'spalio', 'lapkričio', 'gruodžio'];
  var MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var TXT = {
    lt: {
      review: 'peržiūra',
      today: 'šiandien',
      back: 'Visi vaizdo įrašai',
      waitingTail: function (n) { return ltPl(n, 'vaizdo įrašas laukia jūsų peržiūros', 'vaizdo įrašai laukia jūsų peržiūros', 'vaizdo įrašų laukia jūsų peržiūros'); },
      allDone: 'Viskas peržiūrėta. Ačiū!',
      allDoneSub: 'Kai įkelsime naują variantą, jį rasite čia.',
      teamEyebrow: '9×16 · komandos vaizdas',
      teamTitle: 'Klientų peržiūros',
      sUnanswered: 'Neatsakytos pastabos', sWaiting: 'Laukia kliento', sChanges: 'Reikia pataisymų', sApproved: 'Patvirtinta',
      openUnanswered: 'Atidaryti pirmą neatsakytą',
      chip_new: 'Nauja', chip_seen: 'Peržiūrėta', chip_changes: 'Reikia pataisymų', chip_approved: 'Patvirtinta', chip_new_team: 'Nežiūrėta',
      nNotes: function (n) { return n + ' ' + ltPl(n, 'pastaba', 'pastabos', 'pastabų'); },
      nVersions: function (n) { return n + ' ' + ltPl(n, 'variantas', 'variantai', 'variantų'); },
      nUnanswered: function (n) { return n + ' ' + ltPl(n, 'neatsakyta', 'neatsakytos', 'neatsakytų'); },
      cardCta: 'Žiūrėti ir komentuoti',
      help: 'Kaip tai veikia?',
      help1: 'Atidarykite vaizdo įrašą.',
      help2: 'Norite ką nors pakeisti? Spauskite „Pastaba šioje vietoje“ – laikas pažymimas automatiškai.',
      help3: 'Jei viskas gerai – „Tvirtinu“, jei ne – „Reikia pataisymų“.',
      help4: 'v1, v2 – variantai. „Palyginti“ perjungia juos toje pačioje vietoje.',
      help5: 'Pasibaigus vaizdo įrašui, po kelių sekundžių įsijungia kitas.',
      helpKbd: 'Kompiuteryje: klavišas N – nauja pastaba.',
      gotIt: 'Aišku',
      planTitle: 'Kas toliau',
      planNow: 'Dabar', planNext: 'Toliau', planAllDone: 'Viskas atlikta',
      variants: 'Variantai',
      compareMode: '⇄ Palyginti',
      compareHint: 'Perjungiama toje pačioje vietoje',
      compareOff: 'Baigti palyginimą',
      sameMoment: function (tc) { return 'ta pati vieta ' + tc; },
      aboutFirst: 'Apie šį variantą',
      whatChanged: function (l) { return 'Kas pakeista (' + l + ')'; },
      noteBtn: 'Pastaba šioje vietoje',
      approve: '✅ Tvirtinu',
      needChanges: 'Reikia pataisymų',
      approvedT: '✅ Patvirtinta',
      changesT: 'Reikia pataisymų',
      changesSub: 'Pataisysime pagal jūsų pastabas ir naują variantą įkelsime čia.',
      byWhen: function (who, when) { return (who ? who + ', ' : '') + when; },
      undo: 'Atšaukti',
      olderVersion: function (l) { return 'Tai ankstesnis variantas (' + l + ').'; },
      toLatest: function (l) { return 'Atidaryti naujausią (' + l + ')'; },
      clientDecision: 'Kliento sprendimas',
      seenLine: function (who, when, pct) { return 'Peržiūrėjo' + (who ? ' ' + who : '') + ', ' + when + (pct ? ' · ' + pct + ' %' : ''); },
      notSeenLine: 'Klientas dar nežiūrėjo iki galo',
      approvedLine: function (who, when) { return 'Patvirtino' + (who ? ' ' + who : '') + ', ' + when; },
      changesLine: function (who, when) { return 'Reikia pataisymų: ' + (who ? who + ', ' : '') + when; },
      noDecisionLine: 'Sprendimo dar nėra',
      notes: 'Pastabos',
      notesEmpty: 'Pastabų dar nėra.',
      notesEmptyTeam: 'Klientas šiam variantui pastabų nepaliko.',
      olderNotes: function (n) { return 'Ankstesnių variantų pastabos (' + n + ')'; },
      general: 'Bendra',
      addGeneral: '+ Bendra pastaba',
      seekTo: function (tc) { return 'Peršokti į ' + tc; },
      pinLabel: function (tc) { return 'Pastaba ties ' + tc; },
      del: 'Ištrinti', delConfirm: 'Tikrai ištrinti?',
      fixed: '✓ Pataisyta',
      teamName: '9×16',
      reply: 'Atsakyti', editReply: 'Keisti atsakymą', replyPh: 'Atsakymas klientui…',
      markFixed: 'Pažymėti: pataisyta', unmarkFixed: 'Grąžinti: nepataisyta',
      noteAt: 'Pastaba ties',
      generalNote: 'Bendra pastaba',
      whatToChange: 'Ką reikėtų pakeisti?',
      nameLabel: 'Jūsų vardas',
      nameWhy: 'Kad žinotume, kas rašo. Paklausime tik vieną kartą.',
      namePh: 'Vardas',
      nameTitle: 'Kaip į jus kreiptis?',
      nameWhyDecision: 'Kad žinotume, kas priėmė sprendimą. Paklausime tik vieną kartą.',
      notePh: 'Ką pakeisti šioje vietoje? Galite padiktuoti klaviatūros mikrofonu.',
      save: 'Išsaugoti', saving: 'Saugoma…', cancel: 'Atšaukti', cont: 'Tęsti',
      needName: 'Įrašykite savo vardą.', needNote: 'Parašykite pastabą.',
      saveErr: 'Nepavyko išsaugoti. Patikrinkite ryšį ir spauskite „Išsaugoti“ dar kartą – tekstas niekur nedings.',
      noteSaved: 'Pastaba išsaugota',
      approvedToast: 'Ačiū! Patvirtinta.',
      changesToast: 'Pažymėta. Pataisysime ir įkelsime naują variantą.',
      undone: 'Sprendimas atšauktas',
      seenToast: 'Pažymėta: peržiūrėta',
      deleted: 'Pastaba ištrinta',
      replySaved: 'Atsakymas išsaugotas',
      err: 'Nepavyko. Patikrinkite ryšį ir bandykite dar kartą.',
      signedAs: function (n) { return 'Rašote kaip ' + n; },
      change: 'keisti',
      team: 'Komanda',
      demoText: 'Duomenys saugomi tik šioje naršyklėje.',
      demoAs: 'Žiūrėti kaip:',
      roleClient: 'Klientas', roleTeam: 'Komanda',
      demoReset: 'Pradėti iš naujo',
      demoWasReset: 'Demo pradėta iš naujo',
      badTitle: 'Nuoroda neveikia',
      badText: 'Ši nuoroda neteisinga arba nebegalioja. Parašykite mums – atsiųsime naują.',
      errTitle: 'Nepavyko įkelti',
      errText: 'Patikrinkite interneto ryšį ir bandykite dar kartą.',
      cfgTitle: 'Puslapis dar neparuoštas',
      cfgText: 'Trūksta duomenų bazės nustatymų (config.js).',
      retry: 'Bandyti dar kartą',
      upNext: 'Toliau', upPlay: 'Žiūrėti', upCancel: 'Atšaukti',
      langLabel: 'Kalba'
    },
    en: {
      review: 'review',
      today: 'today',
      back: 'All reels',
      waitingTail: function (n) { return n === 1 ? 'reel is waiting for your review' : 'reels are waiting for your review'; },
      allDone: 'All reviewed. Thank you!',
      allDoneSub: 'When we upload a new version, you will find it here.',
      teamEyebrow: '9×16 · team view',
      teamTitle: 'Client reviews',
      sUnanswered: 'Unanswered notes', sWaiting: 'Waiting for client', sChanges: 'Needs changes', sApproved: 'Approved',
      openUnanswered: 'Open first unanswered',
      chip_new: 'New', chip_seen: 'Viewed', chip_changes: 'Needs changes', chip_approved: 'Approved', chip_new_team: 'Not viewed',
      nNotes: function (n) { return n + (n === 1 ? ' note' : ' notes'); },
      nVersions: function (n) { return n + (n === 1 ? ' version' : ' versions'); },
      nUnanswered: function (n) { return n + ' unanswered'; },
      cardCta: 'Watch & comment',
      help: 'How does it work?',
      help1: 'Open a reel.',
      help2: 'Want to change something? Tap “Note at this moment” – the time is marked for you.',
      help3: 'All good – “I approve”. If not – “Needs changes”.',
      help4: 'v1, v2 are versions. “Compare” switches between them at the same moment.',
      help5: 'When a reel ends, the next one starts after a few seconds.',
      helpKbd: 'On a computer: press N to add a note.',
      gotIt: 'Got it',
      planTitle: 'What’s next',
      planNow: 'Now', planNext: 'Next', planAllDone: 'All done',
      variants: 'Versions',
      compareMode: '⇄ Compare',
      compareHint: 'Switches at the same moment',
      compareOff: 'Exit compare',
      sameMoment: function (tc) { return 'same moment ' + tc; },
      aboutFirst: 'About this version',
      whatChanged: function (l) { return 'What changed (' + l + ')'; },
      noteBtn: 'Note at this moment',
      approve: '✅ I approve',
      needChanges: 'Needs changes',
      approvedT: '✅ Approved',
      changesT: 'Needs changes',
      changesSub: 'We will make the changes from your notes and upload a new version right here.',
      byWhen: function (who, when) { return (who ? who + ', ' : '') + when; },
      undo: 'Undo',
      olderVersion: function (l) { return 'This is an earlier version (' + l + ').'; },
      toLatest: function (l) { return 'Open the latest (' + l + ')'; },
      clientDecision: 'Client decision',
      seenLine: function (who, when, pct) { return 'Viewed' + (who ? ' by ' + who : '') + ', ' + when + (pct ? ' · ' + pct + ' %' : ''); },
      notSeenLine: 'The client has not watched it to the end yet',
      approvedLine: function (who, when) { return 'Approved' + (who ? ' by ' + who : '') + ', ' + when; },
      changesLine: function (who, when) { return 'Needs changes: ' + (who ? who + ', ' : '') + when; },
      noDecisionLine: 'No decision yet',
      notes: 'Notes',
      notesEmpty: 'No notes yet.',
      notesEmptyTeam: 'The client left no notes on this version.',
      olderNotes: function (n) { return 'Notes on earlier versions (' + n + ')'; },
      general: 'General',
      addGeneral: '+ General note',
      seekTo: function (tc) { return 'Jump to ' + tc; },
      pinLabel: function (tc) { return 'Note at ' + tc; },
      del: 'Delete', delConfirm: 'Delete for sure?',
      fixed: '✓ Fixed',
      teamName: '9×16',
      reply: 'Reply', editReply: 'Edit reply', replyPh: 'Reply to the client…',
      markFixed: 'Mark as fixed', unmarkFixed: 'Mark as not fixed',
      noteAt: 'Note at',
      generalNote: 'General note',
      whatToChange: 'What should we change?',
      nameLabel: 'Your name',
      nameWhy: 'So we know who wrote it. We only ask once.',
      namePh: 'Name',
      nameTitle: 'What is your name?',
      nameWhyDecision: 'So we know who made the decision. We only ask once.',
      notePh: 'What should change here? You can dictate with the keyboard microphone.',
      save: 'Save', saving: 'Saving…', cancel: 'Cancel', cont: 'Continue',
      needName: 'Please enter your name.', needNote: 'Please write the note.',
      saveErr: 'Could not save. Check your connection and tap Save again. Your text is still here.',
      noteSaved: 'Note saved',
      approvedToast: 'Thank you! Approved.',
      changesToast: 'Noted. We will fix it and upload a new version.',
      undone: 'Decision undone',
      seenToast: 'Marked as viewed',
      deleted: 'Note deleted',
      replySaved: 'Reply saved',
      err: 'That did not work. Check your connection and try again.',
      signedAs: function (n) { return 'Writing as ' + n; },
      change: 'change',
      team: 'Team',
      demoText: 'Data stays in this browser only.',
      demoAs: 'View as:',
      roleClient: 'Client', roleTeam: 'Team',
      demoReset: 'Reset demo',
      demoWasReset: 'Demo reset',
      badTitle: 'This link does not work',
      badText: 'The link is wrong or has expired. Write to us and we will send a new one.',
      errTitle: 'Could not load',
      errText: 'Check your internet connection and try again.',
      cfgTitle: 'This page is not set up yet',
      cfgText: 'The database settings are missing (config.js).',
      retry: 'Try again',
      upNext: 'Up next', upPlay: 'Watch', upCancel: 'Cancel',
      langLabel: 'Language'
    }
  };
  function t(k) {
    var v = (TXT[S.lang] || TXT.lt)[k];
    if (v === undefined) v = TXT.lt[k];
    if (typeof v === 'function') return v.apply(null, Array.prototype.slice.call(arguments, 1));
    return v == null ? k : v;
  }
  // текст из каталога: строка или {lt, en}
  function loc(x) {
    if (x == null) return '';
    if (typeof x === 'object') return String(x[S.lang] || x.lt || x.en || '');
    return String(x);
  }

  // ---------------- мелкие помощники ----------------
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
    el.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
  }
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'style') el.style.cssText = v;
      else if (k === 'value') el.value = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function fmtT(s) { s = Math.max(0, +s || 0); return Math.floor(s / 60) + ':' + pad(Math.floor(s % 60)); }
  function fmtD(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    var hm = pad(d.getHours()) + ':' + pad(d.getMinutes());
    if (d.toDateString() === new Date().toDateString()) return t('today') + ' ' + hm;
    return S.lang === 'lt' ? MONTHS_LT[d.getMonth()] + ' ' + d.getDate() + ' d., ' + hm : d.getDate() + ' ' + MONTHS_EN[d.getMonth()] + ', ' + hm;
  }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function reducedMotion() { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }

  // ---------------- состояние ----------------
  var S = {
    lang: 'lt', auth: null, mode: 'client', backend: null,
    clients: [], notes: [], st: {}, vref: {}, rref: {},
    view: 'loading', cid: null, rid: null, vid: null,
    name: '', device: '', editing: null, sheet: null, seenSent: {}, raf: 0,
    cmp: false, open: {}, unT: 0
  };
  var E = {};

  function isLocal() { return S.backend && S.backend.kind === 'local'; }
  function isClient() { return S.mode === 'client'; }
  function nameKey() { return S.mode === 'team' ? 'kab_name_team' : 'kab_name'; }
  function setName(n) { S.name = String(n || '').trim().slice(0, 80); LS.set(nameKey(), S.name); }

  function index() {
    S.vref = {}; S.rref = {};
    S.clients.forEach(function (c) {
      (c.projects || []).forEach(function (p) {
        (p.reels || []).forEach(function (r) {
          var vs = r.versions || [];
          if (!vs.length) return;
          var rr = { c: c, p: p, r: r, vs: vs, latest: vs[vs.length - 1] };
          S.rref[c.id + '|' + r.id] = rr;
          vs.forEach(function (v, i) { S.vref[c.id + '|' + v.id] = { c: c, p: p, r: r, v: v, i: i, latest: i === vs.length - 1, rr: rr }; });
        });
      });
    });
  }
  function allReels() { return Object.keys(S.rref).map(function (k) { return S.rref[k]; }); }
  function stOf(cid, vid) { return S.st[cid + '|' + vid] || null; }
  function vState(cid, vid) {
    var s = stOf(cid, vid) || {};
    return s.decision === 'approved' ? 'approved' : s.decision === 'changes' ? 'changes' : s.seen_at ? 'seen' : 'new';
  }
  function isWaiting(rr) { var s = vState(rr.c.id, rr.latest.id); return s === 'new' || s === 'seen'; }
  function byT(a, b) {
    var at = a.t == null ? -1 : +a.t, bt = b.t == null ? -1 : +b.t;
    return at - bt || String(a.created_at).localeCompare(String(b.created_at));
  }
  function notesOf(cid, vid) { return S.notes.filter(function (n) { return n.client_id === cid && n.version_id === vid; }).sort(byT); }
  function unanswered(n) { return n.side !== 'team' && !n.reply && !n.fixed; }
  function curRef() { return S.vref[S.cid + '|' + S.vid] || null; }
  function curV() { var r = curRef(); return r ? r.v : null; }
  function waitingReels() {
    return allReels().filter(isWaiting)
      .sort(function (a, b) { return (vState(a.c.id, a.latest.id) === 'new' ? 0 : 1) - (vState(b.c.id, b.latest.id) === 'new' ? 0 : 1); });
  }
  function projReels(p) { return (p.reels || []).filter(function (r) { return (r.versions || []).length; }); }
  // ролики клиента в порядке каталога (проекты → ролики)
  function clientReels(c) {
    var out = [];
    (c.projects || []).forEach(function (p) { projReels(p).forEach(function (r) { var rr = S.rref[c.id + '|' + r.id]; if (rr) out.push(rr); }); });
    return out;
  }
  // «свёрнуто / раскрыто» переживает перерисовку панели (опрос базы раз в 20 с, новые заметки)
  function foldable(key, d) {
    if (S.open[key]) d.open = true;
    d.addEventListener('toggle', function () { S.open[key] = d.open; });
    return d;
  }

  // ---------------- адрес страницы ----------------
  function hashParams() {
    var o = {};
    if (EMBED) return o;
    location.hash.replace(/^#/, '').split('&').forEach(function (kv) {
      var i = kv.indexOf('=');
      if (i > 0) { try { o[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1)); } catch (e) { /* bad escape */ } }
    });
    return o;
  }
  function readAuth() {
    var p = hashParams(), a;
    if (p.a) a = { kind: 'admin', token: p.a };
    else if (p.k) a = { kind: 'client', token: p.k };
    else a = { kind: 'demo', role: LS.get('kab_demo_role') === 'team' ? 'team' : 'client' };
    a.device = S.device;
    return a;
  }
  function setHash(rid, vid, cid, push) {
    if (EMBED) return;
    var parts = [];
    if (S.auth.kind === 'admin') parts.push('a=' + encodeURIComponent(S.auth.token));
    else if (S.auth.kind === 'client') parts.push('k=' + encodeURIComponent(S.auth.token));
    if (rid) {
      if (S.mode === 'team') parts.push('c=' + encodeURIComponent(cid));
      parts.push('r=' + encodeURIComponent(rid));
      if (vid) parts.push('v=' + encodeURIComponent(vid));
    }
    var url = location.pathname + location.search + (parts.length ? '#' + parts.join('&') : '');
    try {
      // запись «пришли из списка» — по ней кнопка «назад» на странице повторяет «назад» телефона
      if (push) history.pushState({ kabFrom: 'list' }, '', url);
      else history.replaceState(history.state, '', url);
    } catch (e) { /* sandboxed */ }
  }
  function route() {
    var p = hashParams();
    if (p.r) {
      var cid = p.c;
      if (!cid || !S.rref[cid + '|' + p.r]) {
        var hit = allReels().filter(function (rr) { return rr.r.id === p.r; })[0];
        cid = hit ? hit.c.id : null;
      }
      if (cid && S.rref[cid + '|' + p.r]) { showPlayer(cid, p.r, p.v || null, {}); return; }
    }
    showList();
  }
  function goList() {
    if (S.view !== 'player') { showList(); return; }
    var st = null;
    try { st = history.state; } catch (e) { st = null; }
    if (!EMBED && st && st.kabFrom === 'list') { history.back(); return; }
    showList();
    setHash(null, null, null, false);
  }

  // ---------------- загрузка ----------------
  function load(silent) {
    return S.backend.load(S.auth).then(function (d) {
      if (!d || d.error) { renderState('bad'); return; }
      apply(d);
      if (silent && S.view !== 'loading' && S.view !== 'state') refreshViews();
      else route();
    }).catch(function () { if (!silent) renderState('error'); });
  }
  function apply(d) {
    S.mode = d.mode === 'team' ? 'team' : 'client';
    S.clients = d.clients || [];
    S.notes = d.notes || [];
    S.st = {};
    (d.statuses || []).forEach(function (s) { S.st[s.client_id + '|' + s.version_id] = s; });
    index();
    S.name = LS.get(nameKey()) || '';
    var c = S.clients[0];
    document.title = '9×16 peržiūra' + (isClient() && c ? ' · ' + c.name : '');
  }
  function refreshViews() {
    renderTop();
    if (S.view === 'list') { renderList(); return; }
    if (S.view === 'player') {
      if (!curRef()) { showList(); return; }
      if (!S.editing) renderSide();
      renderTrack();
    }
  }

  // ---------------- каркас ----------------
  function buildShell() {
    var app = document.getElementById('app');
    app.textContent = '';
    E.topIn = h('div', { class: 'wrap' });
    E.demoIn = h('div', { class: 'wrap' });
    E.demo = h('div', { class: 'demo', hidden: true }, E.demoIn);
    E.main = h('main', { id: 'main' });
    E.toast = h('div', { class: 'toast', role: 'status', 'aria-live': 'polite' });
    app.append(h('header', { class: 'top' }, E.topIn), E.demo, E.main, E.toast);
  }
  function renderTop() {
    if (!E.topIn) return;
    document.documentElement.setAttribute('data-view', S.view);
    E.topIn.textContent = '';
    var left = S.view === 'player'
      ? h('button', { type: 'button', class: 'back', id: 'back', onclick: goList }, t('back'))
      : h('button', { type: 'button', class: 'brand', id: 'brand', onclick: goList, 'aria-label': '9×16 peržiūra' },
          h('span', { class: 'mark' }), h('span', { class: 'bt', text: '9×16' }), h('span', { class: 'bp', text: t('review') }));
    var who = h('span', { class: 'who' });
    if (S.mode === 'team') add(who, ['9×16', h('span', { class: 'tm', text: t('team') })]);
    else if (S.clients[0]) who.textContent = S.clients[0].name;
    var help = S.view === 'list' || S.view === 'player'
      ? h('button', { type: 'button', class: 'helpbtn', id: 'help', 'aria-label': t('help'), title: t('help'), onclick: helpSheet }, '?')
      : null;
    var lang = h('div', { class: 'lang', role: 'group', 'aria-label': t('langLabel') }, ['lt', 'en'].map(function (L) {
      return h('button', { type: 'button', id: 'lang-' + L, 'aria-pressed': String(S.lang === L), onclick: function () { setLang(L); } }, L.toUpperCase());
    }));
    add(E.topIn, [left, who, help, lang]);
    renderDemo();
  }
  function renderDemo() {
    var show = isLocal();
    E.demo.hidden = !show;
    document.documentElement.classList.toggle('has-demo', !!show);
    if (!show) return;
    E.demoIn.textContent = '';
    E.demoIn.append(h('b', { text: 'Demo' }), h('span', { class: 'dtext', text: t('demoText') }));
    if (S.auth.kind === 'demo') {
      E.demoIn.append(h('span', { class: 'das', text: t('demoAs') }), h('div', { class: 'seg' }, ['client', 'team'].map(function (r) {
        return h('button', { type: 'button', id: 'role-' + r, 'aria-pressed': String(S.auth.role === r), onclick: function () { setRole(r); } }, t(r === 'client' ? 'roleClient' : 'roleTeam'));
      })));
    }
    E.demoIn.append(h('button', { type: 'button', class: 'linkbtn', id: 'demo-reset', onclick: resetDemo }, t('demoReset')));
  }
  function setLang(L) {
    S.lang = L; LS.set('kab_lang', L);
    document.documentElement.lang = L;
    renderTop();
    if (S.view === 'list') renderList();
    else if (S.view === 'player') { E.noteLabel.textContent = '📝 ' + t('noteBtn'); hideUpnext(); renderSide(); renderTrack(); }
    else if (S.view === 'state') renderState(S.stateKind);
  }
  function setRole(r) {
    if (S.auth.role === r) return;
    S.auth.role = r; LS.set('kab_demo_role', r);
    load(true);
  }
  function resetDemo() {
    if (!isLocal()) return;
    S.backend.reset(); S.seenSent = {};
    load(true).then(function () { toast(t('demoWasReset')); });
  }

  function renderState(kind) {
    S.view = kind === 'loading' ? 'loading' : 'state'; S.stateKind = kind;
    pauseVideo(); hideUpnext();
    renderTop();
    E.main.textContent = '';
    if (kind === 'loading') {
      E.main.append(h('div', { class: 'wrap' }, h('div', { class: 'skel', 'aria-hidden': 'true' }, [1, 2, 3, 4].map(function () { return h('span'); }))));
      return;
    }
    var key = kind === 'bad' ? 'bad' : kind === 'config' ? 'cfg' : 'err';
    E.main.append(h('div', { class: 'wrap' }, h('section', { class: 'state' },
      h('h1', { text: t(key + 'Title') }),
      h('p', { text: t(key + 'Text') }),
      kind === 'error' ? h('button', { type: 'button', class: 'btn primary', onclick: function () { renderState('loading'); load(false); } }, t('retry')) : null)));
  }

  // ---------------- подсказка «?» ----------------
  function helpSheet() {
    var more = ['help4', 'help5'];
    if (window.matchMedia && matchMedia('(pointer: fine)').matches) more.push('helpKbd');
    openSheet(function (pan) {
      pan.append(h('div', { class: 'grip' }), h('h2', { text: t('help') }),
        h('ol', { class: 'help' }, ['help1', 'help2', 'help3'].map(function (k) { return h('li', { text: t(k) }); })),
        h('ul', { class: 'help-more' }, more.map(function (k) { return h('li', { text: t(k) }); })),
        h('div', { class: 'row one' }, h('button', { type: 'button', class: 'btn primary', id: 'help-ok', onclick: closeSheet, 'data-autofocus': true }, t('gotIt'))));
    }, 'help-sheet');
  }

  // ---------------- план «Kas toliau» (projects[].plan) ----------------
  // plan: [{title, text, now}] — title/text строка или {lt, en}; now: true — текущий шаг; done: true — пройденный.
  function planInfo(plan) {
    if (!Array.isArray(plan)) return null;
    var steps = plan.filter(function (s) { return s && typeof s === 'object' && (loc(s.title) || loc(s.text)); });
    if (!steps.length) return null;
    var cur = -1, lastDone = -1;
    steps.forEach(function (s, i) { if (s.now && cur < 0) cur = i; if (s.done) lastDone = i; });
    if (cur < 0) cur = lastDone + 1;
    return { steps: steps, cur: cur };
  }
  function stepText(s) { return loc(s.text) || loc(s.title); }
  function planLines(pi) {
    var now = pi.steps[pi.cur], next = pi.steps[pi.cur + 1];
    if (!now) return [h('p', { class: 'pl-line now' }, h('b', { text: '✓ ' + t('planAllDone') }))];
    return [
      h('p', { class: 'pl-line now' }, h('b', { text: t('planNow') + ':' }), ' ', stepText(now)),
      next ? h('p', { class: 'pl-line' }, h('b', { text: t('planNext') + ':' }), ' ', stepText(next)) : null
    ];
  }
  function planBlock(plan, id) {
    var pi = planInfo(plan);
    if (!pi) return null;
    return h('section', { class: 'plan', id: id, 'aria-label': t('planTitle') },
      h('h2', { text: t('planTitle') }),
      h('ol', { class: 'pl-steps', style: '--n:' + pi.steps.length }, pi.steps.map(function (s, i) {
        var st = i < pi.cur ? 'done' : i === pi.cur ? 'now' : 'next';
        return h('li', { class: st, 'aria-current': st === 'now' ? 'step' : null },
          h('i', { 'aria-hidden': 'true', text: st === 'done' ? '✓' : String(i + 1) }), h('span', { text: loc(s.title) || stepText(s) }));
      })),
      h('div', { class: 'pl-lines' }, planLines(pi)));
  }
  function planMini(plan) {
    var pi = planInfo(plan);
    if (!pi) return null;
    return h('section', { class: 'planmini', id: 'plan-mini', 'aria-label': t('planTitle') },
      h('span', { class: 'pm-bar', 'aria-hidden': 'true' }, pi.steps.map(function (s, i) { return h('i', { class: i < pi.cur ? 'done' : i === pi.cur ? 'now' : null }); })),
      h('div', { class: 'pm-t' }, planLines(pi)));
  }
  // один план на все проекты клиента — показываем один раз, рядом с заголовком
  function sharedPlan(c) {
    var ps = (c.projects || []).filter(function (p) { return projReels(p).length; });
    if (!ps.length || !planInfo(ps[0].plan)) return null;
    var k0 = JSON.stringify(ps[0].plan);
    for (var i = 1; i < ps.length; i++) if (JSON.stringify(ps[i].plan || null) !== k0) return null;
    return ps[0].plan;
  }

  // ---------------- список ----------------
  function chip(st) {
    var key = st === 'new' && !isClient() ? 'chip_new_team' : 'chip_' + st;
    return h('span', { class: 'chip ' + st, text: t(key) });
  }
  function showList() {
    S.view = 'list'; S.rid = null; S.vid = null; S.editing = null;
    pauseVideo(); stopRaf(); hideUpnext();
    E.video = null; E.player = null; E.upnext = null; E.cmpbar = null;
    renderTop(); renderList();
    window.scrollTo(0, 0);
  }
  function renderList() {
    E.main.textContent = '';
    var box = h('div', { class: 'wrap', id: 'list' });
    var shared = isClient() && S.clients[0] ? sharedPlan(S.clients[0]) : null;
    box.appendChild(isClient() ? heroClient(shared) : heroTeam());
    S.clients.forEach(function (c) {
      if (!isClient() && S.clients.length > 1) box.appendChild(h('h2', { class: 'client-h', text: c.name }));
      (c.projects || []).forEach(function (p) {
        var reels = projReels(p);
        if (!reels.length) return;
        box.appendChild(h('section', { class: 'proj' },
          h('div', { class: 'proj-h' }, h('h2', { text: p.title }), p.subtitle ? h('span', { text: p.subtitle }) : null),
          shared ? null : planBlock(p.plan, 'plan-' + c.id + '-' + p.id),
          h('div', { class: 'grid' }, reels.map(function (r) { return card(c, r); }))));
      });
    });
    box.appendChild(footer());
    E.main.appendChild(box);
  }
  function heroClient(plan) {
    var w = waitingReels();
    var head = w.length
      ? h('h1', null, h('span', { class: 'n', text: String(w.length) }), ' ', t('waitingTail', w.length))
      : [h('h1', { text: t('allDone') }), h('p', { text: t('allDoneSub') })];
    var pb = plan ? planBlock(plan, 'plan') : null;
    return h('section', { class: 'hero' + (pb ? ' has-plan' : '') }, h('div', { class: 'hero-t' }, head), pb);
  }
  function heroTeam() {
    var rs = allReels(), un = S.notes.filter(unanswered);
    var cnt = { w: 0, c: 0, a: 0 };
    rs.forEach(function (rr) { var s = vState(rr.c.id, rr.latest.id); if (s === 'approved') cnt.a++; else if (s === 'changes') cnt.c++; else cnt.w++; });
    var first = un.slice().sort(function (a, b) { return String(a.created_at).localeCompare(String(b.created_at)); })[0];
    return h('section', { class: 'hero' },
      h('p', { class: 'eyebrow', text: t('teamEyebrow') }),
      h('h1', { text: t('teamTitle') }),
      h('div', { class: 'stats' },
        h('span', { class: 'stat' + (un.length ? ' hot' : '') }, h('b', { text: String(un.length) }), t('sUnanswered')),
        h('span', { class: 'stat' }, h('b', { text: String(cnt.w) }), t('sWaiting')),
        h('span', { class: 'stat' }, h('b', { text: String(cnt.c) }), t('sChanges')),
        h('span', { class: 'stat' }, h('b', { text: String(cnt.a) }), t('sApproved'))),
      first ? h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn primary', id: 'open-unanswered', onclick: function () { openReel(first.client_id, first.reel_id, first.version_id); } }, t('openUnanswered'))) : null);
  }
  function card(c, r) {
    var v = r.versions[r.versions.length - 1], st = vState(c.id, v.id);
    var rn = S.notes.filter(function (n) { return n.client_id === c.id && n.reel_id === r.id; });
    var nv = rn.filter(function (n) { return n.version_id === v.id; }).length;
    var meta = null;
    if (isClient()) {
      // карточка сама говорит, что её можно открыть и прокомментировать
      if (nv) meta = h('span', { class: 'cm cta', text: t('nNotes', nv) });
      else if (st === 'new' || st === 'seen') meta = h('span', { class: 'cm cta', text: t('cardCta') });
    } else {
      var parts = [], un = rn.filter(unanswered).length;
      if (nv) parts.push(t('nNotes', nv));
      if (un) parts.push(t('nUnanswered', un));
      if (!parts.length && r.versions.length > 1) parts.push(t('nVersions', r.versions.length));
      if (parts.length) meta = h('span', { class: 'cm', text: parts.join(' · ') });
    }
    // обложка: картинка из каталога; если её нет — кадр из самого ролика поверх подложки с номером версии
    var cover = v.poster ? h('img', { src: v.poster, alt: '', loading: 'lazy', decoding: 'async' }) : [h('span', { class: 'tile', text: v.label || '9×16' }), frameThumb(v.src)];
    var thumb = h('span', { class: 'thumb' }, cover,
      h('span', { class: 'play', 'aria-hidden': 'true' }),
      chip(st),
      h('span', { class: 'vtag', text: v.label }),
      v.duration ? h('span', { class: 'dur', text: fmtT(v.duration) }) : null);
    return h('button', { type: 'button', class: 'card', id: 'card-' + r.id, 'data-state': st, onclick: function () { openReel(c.id, r.id); } },
      thumb, h('span', { class: 'ct', text: r.title }), meta);
  }
  function frameThumb(src) {
    if (!src) return null;
    var vd = h('video', { class: 'vthumb', muted: true, playsinline: true, preload: 'metadata', 'aria-hidden': 'true', tabindex: '-1' });
    vd.muted = true; vd.playsInline = true;
    vd.src = src + (src.indexOf('#') < 0 ? '#t=1.2' : '');
    return vd;
  }
  function footer() {
    var right = h('span');
    if (S.name) add(right, [t('signedAs', S.name), ' · ', h('button', { type: 'button', class: 'linkbtn', id: 'change-name', onclick: function () { nameSheet(true, function () { refreshViews(); }); } }, t('change'))]);
    var c = S.clients[0];
    if (isClient() && c && c.contact) add(right, [S.name ? ' · ' : '', c.contact]);
    return h('footer', { class: 'foot' }, h('span', { text: '9×16 · Kino Fabrikas · Vilnius' }), right);
  }

  // ---------------- плеер ----------------
  function openReel(cid, rid, vid) {
    var rr = S.rref[cid + '|' + rid];
    if (!rr) return;
    var v = (vid && rr.vs.filter(function (x) { return x.id === vid; })[0]) || rr.latest;
    showPlayer(cid, rid, v.id, {});
    setHash(rid, v.id, cid, true);
  }
  function showPlayer(cid, rid, vid, opts) {
    var rr = S.rref[cid + '|' + rid];
    if (!rr) { showList(); return; }
    var v = (vid && rr.vs.filter(function (x) { return x.id === vid; })[0]) || rr.latest;
    var fresh = S.view !== 'player' || !E.video;
    hideUpnext();
    S.view = 'player'; S.cid = cid; S.rid = rid; S.editing = null;
    if (fresh) buildPlayer();
    loadVersion(v, opts.t, opts.play);
    renderTop(); renderSide(); renderTrack();
    if (fresh) window.scrollTo(0, 0);
  }
  function buildPlayer() {
    E.main.textContent = '';
    var video = h('video', { id: 'vid', controls: true, playsinline: true, 'webkit-playsinline': true, preload: 'metadata', controlslist: 'nodownload' });
    video.playsInline = true;
    E.video = video;
    E.corner = h('span', { class: 'corner', id: 'corner' });
    E.flash = h('div', { class: 'flash', 'aria-hidden': 'true' });
    E.upnext = h('div', { class: 'upnext', id: 'upnext', hidden: true });
    E.stage = h('div', { class: 'stage' }, video, E.corner, E.flash, E.upnext);
    E.fill = h('div', { class: 'fill' });
    E.pins = h('div', { class: 'pins', style: 'position:absolute;inset:0' });
    E.track = h('div', { class: 'track', id: 'track', onclick: onTrackClick }, h('div', { class: 'rail' }, E.fill), E.pins);
    E.tl0 = h('span', { text: '0:00' });
    E.tl1 = h('span', { text: '' });
    E.nowt = h('span', { class: 'nowt', id: 'nowt', text: '0:00' });
    E.noteLabel = h('span', { text: '📝 ' + t('noteBtn') });
    E.noteBtn = h('button', { type: 'button', class: 'notebtn', id: 'note-btn', onclick: onNoteBtn }, E.noteLabel, E.nowt);
    E.cmpbar = h('div', { class: 'cmpbar', id: 'cmpbar', hidden: true });
    var stagecol = h('div', { class: 'stagecol' }, E.stage, E.track, h('div', { class: 'tlabels' }, E.tl0, E.tl1), E.cmpbar, h('div', { class: 'notebar' }, E.noteBtn));
    E.phead = h('div', { class: 'p-head' });
    E.side = h('div', { class: 'side', id: 'side' });
    E.player = h('div', { class: 'player', id: 'player' }, stagecol, E.phead, E.side);
    E.main.append(h('div', { class: 'wrap' }, E.player));
    video.addEventListener('loadedmetadata', function () { renderTrack(); });
    video.addEventListener('durationchange', function () { renderTrack(); });
    video.addEventListener('timeupdate', function () { updateHead(); checkSeen(); });
    video.addEventListener('seeked', updateHead);
    video.addEventListener('seeking', hideUpnext);
    video.addEventListener('play', function () { hideUpnext(); startRaf(); });
    video.addEventListener('pause', function () { stopRaf(); updateHead(); });
    video.addEventListener('ended', function () { stopRaf(); updateHead(); checkSeen(); onEnded(); });
  }
  function pauseVideo() { if (E.video) { try { E.video.pause(); } catch (e) { /* ignore */ } } }
  function startRaf() {
    stopRaf();
    var tick = function () { updateHead(); S.raf = requestAnimationFrame(tick); };
    S.raf = requestAnimationFrame(tick);
  }
  function stopRaf() { if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0; }
  function dur() {
    var d = E.video && E.video.duration;
    if (d && isFinite(d)) return d;
    var v = curV();
    return (v && +v.duration) || 0;
  }
  function updateHead() {
    if (!E.video || !E.fill) return;
    var d = dur(), c = E.video.currentTime || 0;
    E.fill.style.width = (d ? clamp(c / d * 100, 0, 100) : 0) + '%';
    var s = fmtT(c);
    if (E.nowt.textContent !== s) E.nowt.textContent = s;
    if (E.tl0.textContent !== s) E.tl0.textContent = s;
  }
  function seekTo(sec, play) {
    var vid = E.video;
    if (!vid) return;
    var go = function () {
      var d = dur();
      vid.currentTime = clamp(+sec || 0, 0, d ? Math.max(0, d - 0.05) : +sec || 0);
      updateHead();
      if (play) vid.play().catch(noop);
    };
    if (vid.readyState >= 1) go(); else vid.addEventListener('loadedmetadata', go, { once: true });
  }
  function loadVersion(v, sec, play) {
    var vid = E.video;
    S.vid = v.id;
    E.corner.textContent = v.label || '';
    if (vid.getAttribute('data-v') === v.id) { if (sec != null) seekTo(sec, play); else if (play) vid.play().catch(noop); return; }
    vid.setAttribute('data-v', v.id);
    if (v.poster) vid.setAttribute('poster', v.poster); else vid.removeAttribute('poster');
    vid.src = v.src;
    E.tl1.textContent = v.duration ? fmtT(v.duration) : '';
    if ((sec != null && sec > 0.05) || play) seekTo(sec || 0, play);
    updateHead();
  }
  function flash(label, sec) {
    E.flash.textContent = '';
    E.flash.append(h('span', null, label, sec != null ? h('small', { text: t('sameMoment', fmtT(sec)) }) : null));
    E.flash.classList.remove('on');
    void E.flash.offsetWidth;
    E.flash.classList.add('on');
    clearTimeout(E.flashT);
    E.flashT = setTimeout(function () { E.flash.classList.remove('on'); }, 1400);
  }
  // o.same — та же секунда (режим «Palyginti»); o.t — с этого места; иначе — с начала. o.play — играть (по умолчанию — как сейчас).
  function switchVersion(v, o) {
    if (!v || !E.video) return;
    o = o || {};
    var vid = E.video;
    var playing = !vid.paused && !vid.ended;
    var at = o.t != null ? o.t : o.same ? (vid.currentTime || 0) : 0;
    var play = o.play != null ? o.play : playing;
    if (v.id === S.vid) { if (o.t != null) { seekTo(at, true); revealStage(); } return; }
    hideUpnext();
    loadVersion(v, at, play);
    flash(v.label, o.same ? at : null);
    setHash(S.rid, v.id, S.cid, false);
    renderSide(); renderTrack();
    if (o.t != null) revealStage();
  }
  function pickVersion(v) { switchVersion(v, S.cmp ? { same: true } : { t: 0 }); }
  function toggleCompare() {
    S.cmp = !S.cmp;
    renderSide();
    if (S.cmp && E.cmpbar && !E.cmpbar.hidden) {
      try { E.cmpbar.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' }); } catch (e) { /* old browsers */ }
    }
  }
  function revealStage() {
    if (!E.stage) return;
    var r = E.stage.getBoundingClientRect(), topH = 70;
    if (r.top < topH || r.top > window.innerHeight * 0.5) {
      window.scrollTo({ top: Math.max(0, window.scrollY + r.top - topH), behavior: reducedMotion() ? 'auto' : 'smooth' });
    }
  }
  function onTrackClick(e) {
    var r = E.track.getBoundingClientRect(), d = dur();
    if (!d || !r.width) return;
    seekTo(clamp((e.clientX - r.left) / r.width, 0, 1) * d);
  }
  function renderTrack() {
    if (!E.pins || S.view !== 'player') return;
    var v = curV(), d = dur();
    E.pins.textContent = '';
    E.tl1.textContent = d ? fmtT(d) : '';
    if (!v || !d) { updateHead(); return; }
    notesOf(S.cid, v.id).forEach(function (n) {
      if (n.t == null) return;
      E.pins.appendChild(h('button', {
        type: 'button', class: 'pin' + (n.fixed ? ' fixed' : n.side === 'team' ? ' team' : ''),
        style: 'left:' + clamp(n.t / d * 100, 0, 100) + '%', 'aria-label': t('pinLabel', fmtT(n.t)), title: fmtT(n.t) + ' · ' + String(n.body).slice(0, 80),
        onclick: function (e) { e.stopPropagation(); seekTo(n.t); glow(n.id); }
      }));
    });
    updateHead();
  }
  function checkSeen() {
    if (!isClient() || !E.video) return;
    var v = curV();
    if (!v || S.seenSent[v.id]) return;
    var s = stOf(S.cid, v.id);
    if (s && s.seen_at) return;
    var vid = E.video, d = vid.duration;
    if (!d || !isFinite(d)) return;
    var sum = 0, p = vid.played;
    for (var i = 0; i < p.length; i++) sum += p.end(i) - p.start(i);
    var frac = sum / d;
    if (frac < 0.85) return;
    S.seenSent[v.id] = true;
    var cid = S.cid, rid = S.rid, vidId = v.id;
    S.backend.setStatus(S.auth, cid, rid, vidId, { seenPct: Math.min(100, frac * 100), by: S.name }).then(function (st) {
      S.st[cid + '|' + vidId] = st;
      if (S.view === 'player' && S.vid === vidId && !S.editing) renderSide();
      toast(t('seenToast'));
    }).catch(function () { S.seenSent[vidId] = false; });
  }

  // ---------------- «Toliau»: следующий ролик после конца ----------------
  // клиенту — следующий ещё не решённый (дальше по списку, потом с начала); команде — просто следующий
  function nextReel() {
    var cur = S.rref[S.cid + '|' + S.rid];
    if (!cur) return null;
    var list = clientReels(cur.c), i = list.indexOf(cur);
    if (i < 0) return null;
    var after = list.slice(i + 1), before = list.slice(0, i);
    if (isClient()) { var w = after.concat(before).filter(isWaiting)[0]; if (w) return w; }
    return after[0] || null;
  }
  function onEnded() {
    if (S.view !== 'player' || S.sheet) return;
    var nx = nextReel();
    if (nx) showUpnext(nx);
  }
  function showUpnext(nx) {
    if (!E.upnext) return;
    hideUpnext();
    var auto = !reducedMotion();
    var cid = nx.c.id, rid = nx.r.id;
    var go = h('button', { type: 'button', class: 'un-go', id: 'upnext-go', onclick: function () { goNext(cid, rid); } },
      '▶ ' + t('upPlay'), auto ? h('i', { class: 'un-fill', style: 'animation-duration:' + UPNEXT_MS + 'ms' }) : null);
    E.upnext.append(h('div', { class: 'un-card' },
      h('p', { class: 'un-k', text: t('upNext') }),
      h('p', { class: 'un-t', id: 'upnext-title', text: nx.r.title }),
      go,
      h('button', { type: 'button', class: 'un-x', id: 'upnext-cancel', onclick: hideUpnext }, t('upCancel'))));
    E.upnext.hidden = false;
    if (auto) S.unT = setTimeout(function () { S.unT = 0; if (S.view === 'player' && !S.sheet && E.upnext && !E.upnext.hidden) goNext(cid, rid); }, UPNEXT_MS);
  }
  // любое касание страницы останавливает отсчёт (человек решает, ставит заметку) — кнопка «Žiūrėti» остаётся
  function holdUpnext() {
    if (!S.unT) return;
    clearTimeout(S.unT); S.unT = 0;
    if (E.upnext) E.upnext.classList.add('held');
  }
  function hideUpnext() {
    if (S.unT) { clearTimeout(S.unT); S.unT = 0; }
    if (E.upnext) { E.upnext.hidden = true; E.upnext.textContent = ''; E.upnext.classList.remove('held'); }
  }
  function goNext(cid, rid) {
    hideUpnext();
    var rr = S.rref[cid + '|' + rid];
    if (!rr) return;
    showPlayer(cid, rid, null, { play: true });
    setHash(rid, rr.latest.id, cid, false);
    revealStage();
  }

  // ---------------- под видео: варианты, «что изменено»; справа: решение, план, заметки ----------------
  function renderSide() {
    var vr = curRef();
    if (!vr || !E.side) return;
    E.phead.textContent = '';
    E.phead.append(h('p', { class: 'eyebrow', text: (isClient() ? '' : vr.c.name + ' · ') + vr.p.title }), h('h1', { id: 'reel-title', text: vr.r.title }));
    add(E.phead, [variantsRow(vr), changesBox(vr)]);
    E.side.textContent = '';
    add(E.side, [isClient() ? decisionPanel(vr) : teamStatusPanel(vr), planMini(vr.p.plan), notesPanel(vr)]);
    renderCmpbar();
  }
  function variantsRow(vr) {
    var vs = vr.rr.vs;
    if (vs.length < 2) return null;
    return h('div', { class: 'variants' },
      h('span', { class: 'vl', text: t('variants') }),
      h('div', { class: 'vseg', role: 'group', 'aria-label': t('variants') }, vs.map(function (v) {
        var st = vState(vr.c.id, v.id);
        return h('button', { type: 'button', 'data-v': v.id, id: 'ver-' + v.label, 'aria-pressed': String(v.id === vr.v.id), onclick: function () { pickVersion(v); } },
          v.label, st === 'new' ? h('span', { class: 'dot', 'aria-hidden': 'true' }) : null);
      })),
      h('button', { type: 'button', class: 'cmp-tog', id: 'compare-toggle', 'aria-pressed': String(!!S.cmp), onclick: toggleCompare }, t('compareMode')));
  }
  // режим «Palyginti»: крупные v1 / v2 прямо под видео, переключение в той же секунде
  function renderCmpbar() {
    if (!E.cmpbar) return;
    var vr = curRef(), on = !!(S.cmp && vr && vr.rr.vs.length > 1);
    E.cmpbar.hidden = !on;
    if (E.player) E.player.classList.toggle('cmp-on', on);
    E.cmpbar.textContent = '';
    if (!on) return;
    E.cmpbar.append(
      h('div', { class: 'cseg', role: 'group', 'aria-label': t('variants') }, vr.rr.vs.map(function (v) {
        return h('button', { type: 'button', id: 'cmp-' + v.label, 'aria-pressed': String(v.id === vr.v.id), onclick: function () { switchVersion(v, { same: true }); } }, v.label);
      })),
      h('span', { class: 'chint', text: t('compareHint') }),
      h('button', { type: 'button', class: 'cx', id: 'cmp-off', 'aria-label': t('compareOff'), title: t('compareOff'), onclick: toggleCompare }, '×'));
  }
  function changesBox(vr) {
    if (!vr.v.changes) return null;
    return foldable('chg|' + vr.c.id + '|' + vr.v.id, h('details', { class: 'changes', id: 'changes' },
      h('summary', { text: vr.i === 0 ? t('aboutFirst') : t('whatChanged', vr.v.label) }), h('p', { text: vr.v.changes })));
  }
  function decisionPanel(vr) {
    var s = stOf(vr.c.id, vr.v.id) || {}, box = h('section', { class: 'panel', id: 'decision' });
    if (!vr.latest) {
      var latest = vr.rr.latest;
      box.append(h('div', { class: 'verdict info' },
        h('p', { class: 'vt', text: t('olderVersion', vr.v.label) }),
        s.decision ? h('p', { class: 'vs', text: s.decision === 'approved' ? t('approvedLine', s.decided_by, fmtD(s.decided_at)) : t('changesLine', s.decided_by, fmtD(s.decided_at)) }) : null,
        h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn primary sm', id: 'to-latest', onclick: function () { switchVersion(latest, { t: 0 }); } }, t('toLatest', latest.label)))));
      return box;
    }
    if (s.decision === 'approved') {
      box.append(h('div', { class: 'verdict approved', id: 'verdict' },
        h('p', { class: 'vt', text: t('approvedT') }),
        h('p', { class: 'vs', text: t('byWhen', s.decided_by, fmtD(s.decided_at)) }),
        h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn ghost sm', id: 'btn-undo', onclick: function () { decide('none'); } }, t('undo')))));
      return box;
    }
    if (s.decision === 'changes') {
      box.append(h('div', { class: 'verdict changes', id: 'verdict' },
        h('p', { class: 'vt', text: t('changesT') }),
        h('p', { class: 'vs', text: t('byWhen', s.decided_by, fmtD(s.decided_at)) }),
        h('p', { class: 'vs', text: t('changesSub') }),
        h('div', { class: 'row' },
          h('button', { type: 'button', class: 'btn ok sm', id: 'btn-approve', onclick: function () { decide('approved'); } }, t('approve')),
          h('button', { type: 'button', class: 'btn ghost sm', id: 'btn-undo', onclick: function () { decide('none'); } }, t('undo')))));
      return box;
    }
    box.append(h('div', { class: 'decide' },
      h('button', { type: 'button', class: 'btn ok', id: 'btn-approve', onclick: function () { decide('approved'); } }, t('approve')),
      h('button', { type: 'button', class: 'btn chg', id: 'btn-changes', onclick: function () { decide('changes'); } }, t('needChanges'))));
    return box;
  }
  function teamStatusPanel(vr) {
    var s = stOf(vr.c.id, vr.v.id) || {};
    var lines = [
      h('li', null, chip(vState(vr.c.id, vr.v.id))),
      h('li', { text: s.seen_at ? t('seenLine', s.seen_by, fmtD(s.seen_at), s.seen_pct) : t('notSeenLine') }),
      h('li', { text: s.decision === 'approved' ? t('approvedLine', s.decided_by, fmtD(s.decided_at)) : s.decision === 'changes' ? t('changesLine', s.decided_by, fmtD(s.decided_at)) : t('noDecisionLine') })
    ];
    return h('section', { class: 'panel', id: 'decision' }, h('h3', { text: t('clientDecision') + ' · ' + vr.v.label }), h('ul', { class: 'st-lines' }, lines));
  }
  function notesPanel(vr) {
    var mine = notesOf(vr.c.id, vr.v.id);
    var box = h('section', { class: 'panel', id: 'notes-panel' },
      h('h3', null, t('notes'), mine.length ? h('span', { class: 'chip seen count', text: String(mine.length) }) : null));
    if (mine.length) box.append(h('ul', { class: 'notes', id: 'notes' }, mine.map(function (n) { return noteItem(n, false); })));
    else box.append(h('p', { class: 'empty', id: 'notes-empty', text: isClient() ? t('notesEmpty') : t('notesEmptyTeam') }));
    box.append(h('div', null, h('button', { type: 'button', class: 'linkbtn', id: 'add-general', onclick: function () { noteSheet(null, {}); } }, t('addGeneral'))));
    var older = [];
    vr.rr.vs.forEach(function (v) { if (v.id !== vr.v.id) older = older.concat(notesOf(vr.c.id, v.id)); });
    if (older.length) {
      older.sort(function (a, b) {
        var ia = (S.vref[a.client_id + '|' + a.version_id] || {}).i || 0, ib = (S.vref[b.client_id + '|' + b.version_id] || {}).i || 0;
        return ib - ia || byT(a, b);
      });
      box.append(foldable('old|' + vr.c.id + '|' + vr.v.id, h('details', { class: 'older', id: 'older' }, h('summary', { text: t('olderNotes', older.length) }),
        h('ul', { class: 'notes' }, older.map(function (n) { return noteItem(n, true); })))));
    }
    return box;
  }
  function noteItem(n, old) {
    var ref = S.vref[n.client_id + '|' + n.version_id];
    var tc;
    if (n.t == null) tc = h('span', { class: 'tc gen', text: (old && ref ? ref.v.label + ' · ' : '') + t('general') });
    else tc = h('button', {
      type: 'button', class: 'tc' + (old ? ' old' : ''), 'aria-label': t('seekTo', fmtT(n.t)),
      onclick: function () { if (old && ref) switchVersion(ref.v, { t: n.t, play: true }); else { seekTo(n.t, true); revealStage(); } }
    }, (old && ref ? ref.v.label + ' · ' : '') + fmtT(n.t));
    var meta = h('p', { class: 'nm' },
      n.side === 'team' ? h('span', { class: 'chip team', text: t('teamName') }) : null,
      h('span', { text: n.author }), h('span', { text: fmtD(n.created_at) }),
      n.fixed ? h('span', { class: 'fixmark', text: t('fixed') }) : null);
    var canDel = !isClient() || (n.mine && !n.reply);
    if (canDel) meta.append(delButton(n));
    var body = h('div', { class: 'nb' }, h('p', { class: 'nt', text: n.body }), meta);
    if (n.reply && S.editing !== n.id) {
      body.append(h('div', { class: 'rep' },
        h('span', { class: 'rk' }, h('span', { class: 'chip team', text: t('teamName') }), n.reply_by ? h('span', { text: n.reply_by }) : null, h('span', { class: 'nm', text: fmtD(n.reply_at) })),
        h('p', { text: n.reply })));
    }
    if (!isClient()) {
      if (S.editing === n.id) body.append(replyEditor(n));
      else body.append(h('div', { class: 'adm' },
        h('button', { type: 'button', class: 'btn ghost sm', 'data-act': 'reply', onclick: function () { S.editing = n.id; renderSide(); } }, n.reply ? t('editReply') : t('reply')),
        h('button', { type: 'button', class: 'btn ghost sm', 'data-act': 'fixed', onclick: function (e) { toggleFixed(n, e.currentTarget); } }, n.fixed ? t('unmarkFixed') : t('markFixed'))));
    }
    return h('li', { class: 'note' + (n.fixed ? ' fixed' : ''), id: 'n-' + n.id, 'data-t': n.t == null ? '' : String(n.t) }, tc, body);
  }
  function delButton(n) {
    var armed = false, timer = 0;
    var b = h('button', { type: 'button', class: 'linkbtn', 'data-act': 'delete' }, t('del'));
    b.addEventListener('click', function () {
      if (!armed) {
        armed = true; b.textContent = t('delConfirm'); b.classList.add('danger');
        timer = setTimeout(function () { armed = false; b.textContent = t('del'); b.classList.remove('danger'); }, 3500);
        return;
      }
      clearTimeout(timer); b.disabled = true;
      S.backend.deleteNote(S.auth, n.id).then(function () {
        S.notes = S.notes.filter(function (x) { return x.id !== n.id; });
        renderSide(); renderTrack(); toast(t('deleted'));
      }).catch(function () { b.disabled = false; toast(t('err')); });
    });
    return b;
  }
  function replaceNote(x) {
    for (var i = 0; i < S.notes.length; i++) if (S.notes[i].id === x.id) { S.notes[i] = x; return; }
    S.notes.push(x);
  }
  function replyEditor(n) {
    var ta = h('textarea', { id: 'reply-text', placeholder: t('replyPh'), rows: 3, maxlength: 4000 });
    ta.value = n.reply || '';
    var save = h('button', { type: 'button', class: 'btn primary sm', id: 'reply-save' }, t('save'));
    var cancel = h('button', { type: 'button', class: 'btn ghost sm', onclick: function () { S.editing = null; renderSide(); } }, t('cancel'));
    save.addEventListener('click', function () {
      withName(function () {
        save.disabled = true; save.textContent = t('saving');
        S.backend.reply(S.auth, n.id, ta.value, S.name).then(function (x) {
          replaceNote(x); S.editing = null; renderSide(); toast(t('replySaved'));
        }).catch(function () { save.disabled = false; save.textContent = t('save'); toast(t('err')); });
      });
    });
    setTimeout(function () { try { ta.focus(); } catch (e) { /* ignore */ } }, 0);
    return h('div', { class: 'edit' }, ta, h('div', { class: 'adm' }, save, cancel));
  }
  function toggleFixed(n, btn) {
    btn.disabled = true;
    S.backend.setFixed(S.auth, n.id, !n.fixed).then(function (x) {
      replaceNote(x); renderSide(); renderTrack();
    }).catch(function () { btn.disabled = false; toast(t('err')); });
  }
  function glow(id) {
    var el = document.getElementById('n-' + id);
    if (!el) return;
    el.classList.add('glow');
    setTimeout(function () { el.classList.remove('glow'); }, 1600);
  }

  // ---------------- решения ----------------
  function decide(dec) {
    withName(function () {
      var vr = curRef();
      if (!vr) return;
      var cid = vr.c.id, rid = vr.r.id, vid = vr.v.id;
      // «Reikia pataisymų» без заметок: сразу открываем общую заметку (в том же нажатии — иначе телефон не покажет клавиатуру)
      if (dec === 'changes' && !notesOf(cid, vid).length) noteSheet(null, { title: t('whatToChange') });
      S.backend.setStatus(S.auth, cid, rid, vid, { decision: dec, by: S.name }).then(function (st) {
        S.st[cid + '|' + vid] = st;
        if (S.view === 'player' && S.vid === vid) renderSide();
        toast(dec === 'approved' ? t('approvedToast') : dec === 'changes' ? t('changesToast') : t('undone'));
      }).catch(function () { toast(t('err')); });
    });
  }

  // ---------------- листы: заметка, имя, подсказка ----------------
  function openSheet(build, id) {
    closeSheet();
    holdUpnext();
    var pan = h('div', { class: 'pan', role: 'dialog', 'aria-modal': 'true' });
    var sh = h('div', { class: 'sheet', id: 'sheet' }, pan);
    if (id) pan.id = id;
    sh.addEventListener('click', function (e) {
      if (e.target !== sh) return;
      var ta = sh.querySelector('textarea');
      if (!ta || !ta.value.trim()) closeSheet();
    });
    build(pan);
    document.body.appendChild(sh);
    S.sheet = sh;
    fitSheet();
    var f = pan.querySelector('[data-autofocus]');
    if (f) { try { f.focus(); } catch (e) { /* ignore */ } }
  }
  function closeSheet() {
    if (S.sheet) { S.sheet.remove(); S.sheet = null; }
  }
  function fitSheet() {
    var vv = window.visualViewport;
    if (!S.sheet || !vv) return;
    S.sheet.style.bottom = Math.max(0, window.innerHeight - vv.height - vv.offsetTop) + 'px';
  }
  function onNoteBtn() {
    if (!E.video) return;
    noteSheet(Math.round((E.video.currentTime || 0) * 10) / 10, {});
  }
  function noteSheet(sec, opts) {
    var vr = curRef();
    if (!vr) return;
    var cid = vr.c.id, rid = vr.r.id, vid = vr.v.id;
    var needName = !S.name;
    openSheet(function (pan) {
      var err = h('p', { class: 'err', id: 'sheet-err', hidden: true });
      var nameIn = needName ? h('input', { type: 'text', id: 'kab-name', autocomplete: 'name', placeholder: t('namePh'), maxlength: 80, 'data-autofocus': true }) : null;
      var ta = h('textarea', { id: 'kab-note', placeholder: t('notePh'), maxlength: 4000, rows: 4, 'data-autofocus': needName ? null : true });
      var save = h('button', { type: 'button', class: 'btn primary', id: 'kab-save' }, t('save'));
      var cancel = h('button', { type: 'button', class: 'btn ghost', id: 'kab-cancel', onclick: closeSheet }, t('cancel'));
      var title = sec == null ? h('h2', { text: opts.title || t('generalNote') }) : h('h2', null, t('noteAt'), h('span', { class: 'tc', text: fmtT(sec) }), h('span', { class: 'chip seen count', text: vr.v.label }));
      pan.append(h('div', { class: 'grip' }), title,
        needName ? h('label', { for: 'kab-name' }, t('nameLabel'), h('span', { class: 'sub', text: t('nameWhy') }), nameIn) : null,
        ta, err, h('div', { class: 'row' }, save, cancel));
      var submit = function () {
        var nm = nameIn ? nameIn.value.trim() : S.name, body = ta.value.trim();
        if (!nm) { err.textContent = t('needName'); err.hidden = false; nameIn.focus(); return; }
        if (!body) { err.textContent = t('needNote'); err.hidden = false; ta.focus(); return; }
        if (nameIn) setName(nm);
        err.hidden = true; save.disabled = true; save.textContent = t('saving');
        S.backend.addNote(S.auth, { client_id: cid, reel_id: rid, version_id: vid, t: sec, body: body, author: S.name }).then(function (n) {
          S.notes.push(n);
          closeSheet();
          if (S.view === 'player' && S.vid === vid) { renderSide(); renderTrack(); glow(n.id); }
          toast(t('noteSaved'));
        }).catch(function () {
          save.disabled = false; save.textContent = t('save');
          err.textContent = t('saveErr'); err.hidden = false;
        });
      };
      save.addEventListener('click', submit);
      ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); } });
      if (nameIn) nameIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); ta.focus(); } });
    });
  }
  function withName(cb) {
    if (S.name) { cb(); return; }
    nameSheet(false, cb);
  }
  function nameSheet(editing, cb) {
    openSheet(function (pan) {
      var err = h('p', { class: 'err', hidden: true });
      var inp = h('input', { type: 'text', id: 'kab-name', autocomplete: 'name', placeholder: t('namePh'), maxlength: 80, value: S.name || '', 'data-autofocus': true });
      var go = h('button', { type: 'button', class: 'btn primary', id: 'kab-name-ok' }, editing ? t('save') : t('cont'));
      var cancel = h('button', { type: 'button', class: 'btn ghost', onclick: closeSheet }, t('cancel'));
      var submit = function () {
        var v = inp.value.trim();
        if (!v) { err.textContent = t('needName'); err.hidden = false; inp.focus(); return; }
        setName(v); closeSheet(); cb();
      };
      go.addEventListener('click', submit);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
      pan.append(h('div', { class: 'grip' }), h('h2', { text: t('nameTitle') }), h('p', { class: 'sub', text: editing ? t('nameWhy') : t('nameWhyDecision') }), inp, err, h('div', { class: 'row' }, go, cancel));
    });
  }

  // ---------------- уведомление ----------------
  function toast(msg) {
    if (!E.toast) return;
    E.toast.textContent = msg;
    E.toast.classList.add('on');
    clearTimeout(E.toastT);
    E.toastT = setTimeout(function () { E.toast.classList.remove('on'); }, 2600);
  }

  // ---------------- запуск ----------------
  function placeholder(s) { return !s || /PAKEISTI|PROJEKTAS/.test(String(s)); }
  function boot() {
    var L = LS.get('kab_lang') || CFG.lang || 'lt';
    S.lang = TXT[L] ? L : 'lt';
    document.documentElement.lang = S.lang;
    S.device = LS.get('kab_device') || KD.uuid();
    LS.set('kab_device', S.device);
    S.auth = readAuth();
    buildShell();
    renderState('loading');

    var ready;
    if (EMBED) { S.backend = KD.local(KD.fromFlat(EMBED), EMBED.storeKey || 'artifact-v1'); ready = Promise.resolve(); }
    else if (CFG.backend === 'supabase') {
      // выложенная страница с заглушками в config.js — говорим об этом прямо, а не «нет связи»
      if (placeholder(CFG.supabaseUrl) || placeholder(CFG.supabaseKey)) { renderState('config'); return; }
      S.backend = KD.supabase(CFG.supabaseUrl, CFG.supabaseKey); ready = Promise.resolve();
    } else {
      ready = fetch(CFG.manifest || 'manifest.example.json', { cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw new Error('manifest ' + r.status); return r.json(); })
        .then(function (m) { S.backend = KD.local(m, CFG.demoStore || 'v1'); });
    }
    ready.then(function () { return load(false); }).catch(function () { renderState('error'); });

    window.addEventListener('popstate', function () {
      // другой токен в адресе (вставили новую ссылку в ту же вкладку) — начинаем с чистого листа
      var na = readAuth();
      if (na.kind !== S.auth.kind || na.token !== S.auth.token) { if (na.kind !== 'demo' || S.auth.kind !== 'demo') { location.reload(); return; } }
      if (!S.backend || S.view === 'loading' || S.view === 'state') return;
      closeSheet(); S.editing = null;
      route();
    });
    document.addEventListener('pointerdown', function (e) {
      if (!S.unT) return;
      var el = e.target;
      if (el && el.closest && el.closest('#upnext-go')) return;
      holdUpnext();
    }, true);
    document.addEventListener('keydown', function (e) {
      if (S.unT && !(e.target && e.target.id === 'upnext-go')) holdUpnext();
      if (e.key === 'Escape' && S.sheet) { closeSheet(); return; }
      var tag = (e.target && e.target.tagName) || '';
      if (S.sheet || /INPUT|TEXTAREA|SELECT/.test(tag) || e.ctrlKey || e.metaKey || e.altKey) return;
      if ((e.key === 'n' || e.key === 'N') && S.view === 'player') { e.preventDefault(); onNoteBtn(); }
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', fitSheet);
      window.visualViewport.addEventListener('scroll', fitSheet);
    }
    // общая база: раз в 20 с подтягиваем свежие заметки и отметки (когда вкладка видна и ничего не печатается)
    var pollMs = +CFG.pollMs || 20000;
    setInterval(function () {
      if (!S.backend || S.backend.kind !== 'supabase' || document.hidden || S.sheet || S.editing) return;
      if (S.view === 'list' || S.view === 'player') load(true);
    }, pollMs);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && S.backend && S.backend.kind === 'supabase' && !S.sheet && !S.editing && (S.view === 'list' || S.view === 'player')) load(true);
    });
    // демо: две вкладки (клиент и команда) видят изменения друг друга
    window.addEventListener('storage', function (e) {
      if (!isLocal() || !e.key || e.key.indexOf('kab_demo_') !== 0 || S.sheet || S.editing) return;
      if (S.view === 'list' || S.view === 'player') load(true);
    });
  }

  window.KAB_APP = { state: S, version: '2026-11-17b' };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
