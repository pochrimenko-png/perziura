/* 9×16 peržiūra — интерфейс клиента и команды.
   Без сборки: обычный скрипт. Данные — window.KAB_DATA (data.js), настройки — window.KABINETAS (config.js).
   Адреса (на нашем хостинге): #k=<токен клиента> — клиент; #a=<токен команды> — мы. Без токена в демо — переключатель «Klientas / Komanda».
   В артефакте claude.ai (window.KAB_EMBED) — только демо в этом браузере, без адресов.
   Вход: линия этапов «Kas toliau» на всю ширину под шапкой (projects[].plan, без текста «Dabar / Toliau»), число «laukia», карточки. Пояснения — за «?» в шапке.
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
      help1: 'Viršuje – paruošti vaizdo įrašai, žemiau – laukiantys jūsų peržiūros, dar žemiau – juodraštiniai montažai ir archyvas.',
      help2: 'Norite ką nors pakeisti? Spauskite „Pastaba šioje vietoje“ – laikas pažymimas automatiškai.',
      help3: 'Jei viskas gerai – „Viskas gerai“ (vaizdo įrašas pereis į „Paruošta“), jei ne – „Reikia pataisymų“.',
      help4: 'v1, v2 – variantai. „Palyginti“ perjungia juos toje pačioje vietoje.',
      help5: 'Pasibaigus vaizdo įrašui, po kelių sekundžių įsijungia kitas.',
      helpKbd: 'Kompiuteryje: klavišas N – nauja pastaba.',
      gotIt: 'Aišku',
      planTitle: 'Kas toliau',
      planNow: 'Dabar', planNext: 'Toliau', planAllDone: 'Viskas atlikta',
      variants: 'Variantai',
      compareMode: 'Palyginti',
      compareHint: 'Perjungiama toje pačioje vietoje',
      compareOff: 'Baigti palyginimą',
      sameMoment: function (tc) { return 'ta pati vieta ' + tc; },
      aboutFirst: 'Apie šį variantą',
      whatChanged: function (l) { return 'Kas pakeista (' + l + ')'; },
      noteBtn: 'Pastaba šioje vietoje',
      approve: 'Viskas gerai',
      needChanges: 'Reikia pataisymų',
      approvedT: 'Patvirtinta',
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
      langLabel: 'Kalba',
      // 26.11: atsisiuntimas, juodraščiai, taisyklės, nauja versija
      download: function (l) { return 'Atsisiųsti' + (l ? ' ' + l : ''); },
      downloadAll: 'Atsisiųsti viską',
      downloadAllSub: 'Naujausi variantai. Telefone failai atsisiunčiami po vieną – spauskite kiekvieną.',
      downloadSeq: 'Visus iš eilės',
      downloadedMark: 'Atsisiųsta ✓',
      downloadedLine: function (who, when) { return 'Atsisiųsta ✓ ' + (who ? who + ', ' : '') + when; },
      notDownloadedLine: 'Dar neatsisiųsta',
      dlShort: 'atsisiųsta ✓',
      sDownloaded: function (x, y) { return 'iš ' + y + ' atsisiųsta'; },
      dlStarted: 'Atsisiunčiama…',
      drafts: function (n) { return 'Juodraščiai (' + n + ')'; },
      draftsSub: 'Peržiūrėti, bet dar be sprendimo ir be pastabų.',
      rules: 'Taisyklės',
      rulesOf: function (n) { return 'Taisyklės · ' + n; },
      toReview: function (n) { return 'Peržiūrėti: ' + n; },
      newVersionCard: 'Nauja versija – peržiūrėkite',
      newVersionLine: function (l) { return 'Nauja versija (' + l + ') – peržiūrėkite.'; },
      oldDecisionLine: function (l) { return 'Sprendimas dėl ' + l + ' šiai versijai negalioja.'; },
      // 27.11: titrai (vieta ir stilius), pasirinktas viršelis, vidinės taisyklės
      subsPick: 'Pasirinkti', subsChange: 'Keisti',
      subsPlace: 'Vieta', subsStyle: 'Stilius',
      subsPx: function (px) { return px + ' px iš 1920'; },
      subsNone: 'Dar nepasirinkta. Parodykite, kur ir kokie titrai jums patinka – taip ir darysime.',
      subsNoneTeam: 'Klientas dar nepasirinko.',
      subsBy: function (who, when) { return 'Pasirinko ' + (who ? who + ', ' : '') + when; },
      subsByTeam: function (who, when) { return 'Užrašyta po pokalbio' + (who ? ' (' + who + ')' : '') + ', ' + when; },
      subsSheetSub: 'Bakstelėkite liniją ant telefono arba variantą dešinėje – ten bus titrų apačia. Pilkai – Instagram užrašai ir mygtukai (apytiksliai).',
      subsZoneTop: 'Instagram viršus', subsZoneBottom: 'Vardas ir aprašymas', subsZoneRight: 'Mygtukai',
      subsStyleH: 'Titrų stilius',
      subsNeed: 'Pasirinkite ir vietą, ir stilių.',
      subsSaved: 'Išsaugota. Titrus dėsime taip, kaip pasirinkote.',
      subsSample: ['Tai', 'mūsų', 'istorija'],
      subsSampleLong: 'Tai mūsų istorija, kurią norime papasakoti',
      coverH: 'Pasirinktas viršelis',
      coverUsed: 'Viršelį pasirinkote jūs – jį ir naudojame.',
      coverEmpty: 'Čia bus jūsų pasirinktas viršelis',
      rulesAutoH: 'Titrai ir viršelis',
      dirb: 'Dirbtuvės',
      // 27.11: этажи
      floor1: 'Paruošta', floor1Sub: 'Patvirtinta – galite siųsti ir atsisiųsti maksimalia kokybe.',
      floor2: 'Peržiūrėkite ir patvirtinkite', floor2Sub: 'Po pataisymų. Viskas tinka – spauskite „Viskas gerai“.',
      floor3: 'Juodraštiniai montažai', floor3Sub: 'Nauji montažai: patinka ar ne, ir trumpas komentaras.',
      floor4: 'Archyvas', floor4Sub: 'Ankstesnės versijos ir nebenaudojami vaizdo įrašai.',
      oldVersionsH: 'Ankstesnės versijos',
      rounds: function (n) { return 'pataisyta ' + n + ' ' + ltPl(n, 'kartą', 'kartus', 'kartų'); },
      noHdShort: 'laukia max kokybės',
      noHdT: function (n) { return 'Patvirtinta, laukia max kokybės failo: ' + n; },
      noHdLine: 'Ruošiame maksimalios kokybės failą – netrukus galėsite atsisiųsti čia.',
      downloadHd: 'Atsisiųsti max kokybe',
      readyT: 'Paruošta',
      approveSub: '„Viskas gerai“ – vaizdo įrašas keliauja į „Paruošta“, ten galėsite atsisiųsti maksimalia kokybe.',
      archiveLine: 'Archyve. Jei norite jį grąžinti – parašykite pastabą.',
      draftQ: 'Ar patinka šis montažas?',
      draftComment: 'Parašyti komentarą',
      like: 'Patinka', dislike: 'Nepatinka', likeShort: 'Patinka', dislikeShort: 'Nepatinka',
      likedToast: 'Pažymėta: patinka', dislikedToast: 'Pažymėta: nepatinka', noReaction: 'dar neįvertinta',
      animH: 'Animacijos', animSub: 'Peržiūrėkite pavyzdžius ir pažymėkite, kurie patinka.',
      dirbAnim: function (x, y) { return 'animacijos ' + x + ' iš ' + y; },
      voiceH: 'Balsas (DI)', voiceStub: function (i) { return 'Balsas ' + i; }, voiceSoon: 'pavyzdį įkelsime netrukus',
      subsLocked: 'Patvirtinta', subsLock: 'Patvirtinti', subsUnlock: 'Atšaukti patvirtinimą',
      subsLockedToast: 'Pasirinkimas patvirtintas',
      subsLockedNote: 'Šis pasirinkimas jau patvirtintas. Pakeitimą išsiųsime komandai – ji patvirtins.',
      subsReqSent: 'Išsiųsta komandai. Pakeisime, kai patvirtins.',
      subsReqMine: 'Jūsų prašymas laukia komandos:',
      subsReqTeam: function (by) { return 'Klientas' + (by ? ' (' + by + ')' : '') + ' prašo pakeisti į:'; },
      subsAccept: 'Priimti',
      subsReqSum: function (n) { return 'Titrų pakeitimo prašymas: ' + n; },
      subsH: 'Titrai',
      dirbOf: function (n) { return 'Dirbtuvės · ' + n; },
      dirbSub: 'Čia renkatės, kaip atrodys visi vaizdo įrašai: titrai ir viršelis. Vėliau – animacijos ir balsas.',
      dirbSubsShort: function (l) { return 'Titrai: ' + l; },
      dirbSubsNone: 'Titrai: dar nepasirinkta',
      dirbCoverYes: 'viršelis pasirinktas',
      dirbCoverWait: 'viršelis: laukiame',
      ruleSubPlace: function (name, px) { return 'Titrų apačia – ' + px + ' px iš 1920' + (name ? ' („' + name + '“)' : '') + '.'; },
      ruleSubStyle: function (name) { return 'Titrų stilius – ' + name + '.'; },
      ruleCover: 'Viršelis – jūsų pasirinktas, jį ir naudojame.',
      ruleCoverSoon: 'Viršelis – jūsų pasirinktas; paveikslėlį įkelsime čia.',
      rulesInternal: 'Tik komandai'
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
      help1: 'At the top – ready videos, below – the ones waiting for your review, then draft edits and the archive.',
      help2: 'Want to change something? Tap “Note at this moment” – the time is marked for you.',
      help3: 'All fine – “All good” (the video moves to “Ready”). If not – “Needs changes”.',
      help4: 'v1, v2 are versions. “Compare” switches between them at the same moment.',
      help5: 'When a reel ends, the next one starts after a few seconds.',
      helpKbd: 'On a computer: press N to add a note.',
      gotIt: 'Got it',
      planTitle: 'What’s next',
      planNow: 'Now', planNext: 'Next', planAllDone: 'All done',
      variants: 'Versions',
      compareMode: 'Compare',
      compareHint: 'Switches at the same moment',
      compareOff: 'Exit compare',
      sameMoment: function (tc) { return 'same moment ' + tc; },
      aboutFirst: 'About this version',
      whatChanged: function (l) { return 'What changed (' + l + ')'; },
      noteBtn: 'Note at this moment',
      approve: 'All good',
      needChanges: 'Needs changes',
      approvedT: 'Approved',
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
      langLabel: 'Language',
      download: function (l) { return 'Download' + (l ? ' ' + l : ''); },
      downloadAll: 'Download all',
      downloadAllSub: 'Latest versions. On a phone files download one by one – tap each.',
      downloadSeq: 'All in a row',
      downloadedMark: 'Downloaded ✓',
      downloadedLine: function (who, when) { return 'Downloaded ✓ ' + (who ? who + ', ' : '') + when; },
      notDownloadedLine: 'Not downloaded yet',
      dlShort: 'downloaded ✓',
      sDownloaded: function (x, y) { return 'of ' + y + ' downloaded'; },
      dlStarted: 'Downloading…',
      drafts: function (n) { return 'Drafts (' + n + ')'; },
      draftsSub: 'Viewed, but no decision and no notes yet.',
      rules: 'Guidelines',
      rulesOf: function (n) { return 'Guidelines · ' + n; },
      toReview: function (n) { return 'To review: ' + n; },
      newVersionCard: 'New version – please review',
      newVersionLine: function (l) { return 'New version (' + l + ') – please review.'; },
      oldDecisionLine: function (l) { return 'The decision on ' + l + ' does not apply to this version.'; },
      subsPick: 'Choose', subsChange: 'Change',
      subsPlace: 'Position', subsStyle: 'Style',
      subsPx: function (px) { return px + ' px of 1920'; },
      subsNone: 'Not chosen yet. Show us where and what kind of subtitles you like – we will do it that way.',
      subsNoneTeam: 'The client has not chosen yet.',
      subsBy: function (who, when) { return 'Chosen by ' + (who ? who + ', ' : '') + when; },
      subsByTeam: function (who, when) { return 'Noted after the call' + (who ? ' (' + who + ')' : '') + ', ' + when; },
      subsSheetSub: 'Tap a line on the phone – that is where the bottom of the subtitles goes. Grey – Instagram captions and buttons (approximate).',
      subsZoneTop: 'Instagram top', subsZoneBottom: 'Name and caption', subsZoneRight: 'Buttons',
      subsStyleH: 'Subtitle style',
      subsNeed: 'Please choose both a position and a style.',
      subsSaved: 'Saved. We will do the subtitles the way you chose.',
      subsSample: ['This', 'is our', 'story'],
      subsSampleLong: 'This is the story we want to tell you',
      coverH: 'Chosen cover',
      coverUsed: 'You chose this cover – this is the one we use.',
      coverEmpty: 'Your chosen cover will appear here',
      rulesAutoH: 'Subtitles and cover',
      dirb: 'Workshop',
      floor1: 'Ready', floor1Sub: 'Approved – you can share and download in max quality.',
      floor2: 'Review and approve', floor2Sub: 'After corrections. All fine – tap “All good”.',
      floor3: 'Draft edits', floor3Sub: 'New edits: like or not, and a short comment.',
      floor4: 'Archive', floor4Sub: 'Earlier versions and videos no longer in use.',
      oldVersionsH: 'Earlier versions',
      rounds: function (n) { return 'corrected ' + n + (n === 1 ? ' time' : ' times'); },
      noHdShort: 'waiting for max quality',
      noHdT: function (n) { return 'Approved, waiting for max quality file: ' + n; },
      noHdLine: 'We are preparing the max quality file – you will download it here soon.',
      downloadHd: 'Download in max quality',
      readyT: 'Ready',
      approveSub: '“All good” moves the video to “Ready”, where you can download it in max quality.',
      archiveLine: 'In the archive. To bring it back, leave a note.',
      draftQ: 'Do you like this edit?',
      draftComment: 'Write a comment',
      like: 'Like', dislike: 'Dislike', likeShort: 'Like', dislikeShort: 'Dislike',
      likedToast: 'Marked: like', dislikedToast: 'Marked: dislike', noReaction: 'not rated yet',
      animH: 'Animation', animSub: 'Watch the samples and mark the ones you like.',
      dirbAnim: function (x, y) { return 'animation ' + x + ' of ' + y; },
      voiceH: 'Voice (AI)', voiceStub: function (i) { return 'Voice ' + i; }, voiceSoon: 'sample coming soon',
      subsLocked: 'Approved', subsLock: 'Approve', subsUnlock: 'Undo approval',
      subsLockedToast: 'Choice approved',
      subsLockedNote: 'This choice is already approved. We will send your change to the team to approve.',
      subsReqSent: 'Sent to the team. We will change it once approved.',
      subsReqMine: 'Your request is waiting for the team:',
      subsReqTeam: function (by) { return 'The client' + (by ? ' (' + by + ')' : '') + ' asks to change to:'; },
      subsAccept: 'Accept',
      subsReqSum: function (n) { return 'Subtitle change request: ' + n; },
      subsH: 'Subtitles',
      dirbOf: function (n) { return 'Workshop · ' + n; },
      dirbSub: 'Here you choose how all the videos look: subtitles and cover. Later – animation and voice.',
      dirbSubsShort: function (l) { return 'Subtitles: ' + l; },
      dirbSubsNone: 'Subtitles: not chosen yet',
      dirbCoverYes: 'cover chosen',
      dirbCoverWait: 'cover: waiting',
      ruleSubPlace: function (name, px) { return 'Bottom of subtitles – ' + px + ' px of 1920' + (name ? ' (“' + name + '”)' : '') + '.'; },
      ruleSubStyle: function (name) { return 'Subtitle style – ' + name + '.'; },
      ruleCover: 'Cover – the one you chose; we use it.',
      ruleCoverSoon: 'Cover – the one you chose; we will upload the image here.',
      rulesInternal: 'Team only'
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

  // ---------------- бренд клиента: логотип, цвет, обложка, шрифт (каталог: brand) ----------------
  // Нет brand — нейтральный вид 9×16. Плашка «9×16» в шапке всегда наша (жёлтая), цвет клиента заменяет жёлтый в остальном.
  function hexRgb(x) {
    var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(x || '').trim());
    if (!m) return null;
    var hx = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1];
    return [0, 2, 4].map(function (i) { return parseInt(hx.substr(i, 2), 16); });
  }
  function rgbHex(c) { return '#' + c.map(function (v) { v = Math.round(clamp(v, 0, 255)); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function lum(c) { var a = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function mixRgb(a, b, k) { return a.map(function (v, i) { return v + (b[i] - v) * k; }); }
  function inkOn(c) { return contrast(c, [255, 255, 255]) >= contrast(c, [26, 26, 26]) ? '#ffffff' : '#1a1a1a'; }
  // адрес картинки: https:// или относительный путь; без кавычек, скобок и пробелов (идёт в CSS url())
  function safeUrl(u) {
    u = String(u || '').trim();
    if (!u || /["'\\\s()<>]/.test(u)) return '';
    if (/^https:\/\//i.test(u)) return u;
    return /^[a-z][a-z0-9+.-]*:/i.test(u) ? '' : u;
  }
  function brandOf(c) {
    var b = c && c.brand;
    if (!b || typeof b !== 'object' || !Object.keys(b).length) b = c && c.projects && c.projects[0] && c.projects[0].brand; // пока функция базы не отдаёт brand
    if (!b || typeof b !== 'object') return null;
    var o = { logo: safeUrl(b.logo), logoLight: safeUrl(b.logoLight), cover: safeUrl(b.cover), color: hexRgb(b.color), font: '', fontWeight: 0 };
    if (/^[A-Za-z0-9 ]{2,60}$/.test(String(b.font || ''))) { o.font = String(b.font).trim(); o.fontWeight = /^[1-9]00$/.test(String(b.fontWeight || '')) ? +b.fontWeight : 0; }
    // демо на этом ПК: ?brand=none — без бренда, ?brand=light — только логотип и цвет
    if (isLocal() && !EMBED) {
      var q = (location.search.match(/[?&]brand=(none|light)\b/) || [])[1];
      if (q === 'none') return null;
      if (q === 'light') { o.cover = ''; o.font = ''; }
    }
    return o.logo || o.color || o.cover || o.font ? o : null;
  }
  function applyBrand() {
    var root = document.documentElement, st = root.style;
    var b = S.brand = S.clients.length === 1 ? brandOf(S.clients[0]) : null;
    root.classList.toggle('has-brand', !!(b && b.color));
    root.classList.toggle('has-brand-font', !!(b && b.font));
    ['--b-accent', '--b-accent-ink', '--b-accent-d', '--b-accent-ink-d', '--b-font', '--b-font-w'].forEach(function (k) { st.removeProperty(k); });
    if (!b) return;
    if (b.color) {
      // тёмная тема и тёмная обложка: тот же цвет, осветлённый до читаемого на тёмном
      var c = b.color, dk = c;
      for (var i = 0; i < 12 && contrast(dk, [14, 14, 16]) < 4; i++) dk = mixRgb(dk, [255, 255, 255], 0.12);
      st.setProperty('--b-accent', rgbHex(c)); st.setProperty('--b-accent-ink', inkOn(c));
      st.setProperty('--b-accent-d', rgbHex(dk)); st.setProperty('--b-accent-ink-d', inkOn(dk));
    }
    if (b.font) {
      st.setProperty('--b-font', '"' + b.font + '", var(--display)');
      st.setProperty('--b-font-w', String(b.fontWeight || 400));
      var href = 'https://fonts.googleapis.com/css2?family=' + b.font.replace(/ /g, '+') + (b.fontWeight ? ':wght@' + b.fontWeight : '') + '&display=swap';
      var l = document.getElementById('brand-font');
      if (!l) { l = document.createElement('link'); l.id = 'brand-font'; l.rel = 'stylesheet'; document.head.appendChild(l); }
      if (l.getAttribute('href') !== href) l.setAttribute('href', href);
    }
  }
  // логотип клиента; light — для тёмного фона (обложка): светлый файл, а если его нет — тот же, перекрашенный в белый
  function logoEl(where, light) {
    var b = S.brand, c = S.clients[0];
    if (!b || !b.logo) return null;
    var box = h('span', { class: 'c-logo ' + where + (b.logoLight ? ' two' : ' one'), role: 'img', 'aria-label': c ? c.name : '' });
    if (light) box.append(h('img', { src: b.logoLight || b.logo, alt: '', class: b.logoLight ? 'ld-on' : 'inv', decoding: 'async' }));
    else {
      box.append(h('img', { src: b.logo, alt: '', class: 'lo', decoding: 'async' }));
      if (b.logoLight) box.append(h('img', { src: b.logoLight, alt: '', class: 'ld', decoding: 'async' }));
    }
    return box;
  }

  // ---------------- состояние ----------------
  var S = {
    lang: 'lt', auth: null, mode: 'client', backend: null,
    clients: [], notes: [], st: {}, vref: {}, rref: {},
    view: 'loading', cid: null, rid: null, vid: null,
    name: '', device: '', editing: null, sheet: null, seenSent: {}, raf: 0,
    cmp: false, open: {}, unT: 0, subsEdit: null, subsDraft: null, reactions: {}
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
  // ---------------- этаж ролика (Павел 27.11) ----------------
  // 0 — образцы «Dirbtuvės» (проект kind: 'animacijos'), 1 Paruošta, 2 Peržiūrėkite / patvirtinkite, 3 Juodraštiniai montažai, 4 Archyvas.
  // Порядок: архив (stage 4 или старый draft: true) → готово (stage 1 или клиент нажал «Viskas gerai» = approved у последней версии)
  // → stage 2 / 3 из каталога → без отметки — 3 (новый черновой монтаж). Новая версия после правок: в каталоге stage: 2.
  function floorOf(rr) {
    if (rr.p && rr.p.kind === 'animacijos') return 0;
    var r = rr.r, st = +r.stage;
    if (st === 4 || r.draft === true) return 4;
    var s = stOf(rr.c.id, rr.latest.id);
    if (st === 1 || (s && s.decision === 'approved')) return 1;
    if (st === 2 || st === 3) return st;
    return 3;
  }
  // ждёт клиента: этаж 2 без решения по последней версии
  function isWaiting(rr) { return floorOf(rr) === 2 && !(stOf(rr.c.id, rr.latest.id) || {}).decision; }
  function clientNoteOn(cid, rid, vid) {
    return S.notes.some(function (n) { return n.client_id === cid && n.side !== 'team' && (rid == null || n.reel_id === rid) && (vid == null || n.version_id === vid); });
  }
  // одна классификация ролика по последней версии (решения и просмотры — по версии: «Tvirtinu» на v1 к v2 не относится)
  //   review — клиенту нужно посмотреть: последняя версия не досмотрена (нет seen_at) и без решения;
  //   newVer — то же, но это новая версия: у прежних уже были просмотр, решение или заметки клиента;
  //   draft  — «Juodraščiai»: досмотрел, но без решения и без единой своей заметки к ролику; ручной флаг draft у ролика
  //            в каталоге перекрывает правило в обе стороны. Досмотренное в этом открытии страницы (S.seenSent)
  //            до перезагрузки остаётся в основном списке — человек ещё решает.
  function reelInfo(rr) {
    var cid = rr.c.id, v = rr.latest, s = stOf(cid, v.id) || {};
    var review = !s.seen_at && !s.decision;
    var earlier = rr.vs.slice(0, -1).some(function (x) { var o = stOf(cid, x.id); return !!(o && (o.seen_at || o.decision)) || clientNoteOn(cid, null, x.id); });
    var prevDec = null;
    for (var i = rr.vs.length - 2; i >= 0 && !prevDec; i--) { var o = stOf(cid, rr.vs[i].id); if (o && o.decision) prevDec = rr.vs[i]; }
    // автоматических «Juodraščiai» больше нет (иначе этаж 2 пустел бы, пока клиент смотрит): архив — только stage 4 / draft: true
    return { review: review, newVer: review && earlier, draft: floorOf(rr) === 4, prevDecided: prevDec, dl: s.downloaded_at ? s : null };
  }
  function byT(a, b) {
    var at = a.t == null ? -1 : +a.t, bt = b.t == null ? -1 : +b.t;
    return at - bt || String(a.created_at).localeCompare(String(b.created_at));
  }
  function notesOf(cid, vid) { return S.notes.filter(function (n) { return n.client_id === cid && n.version_id === vid; }).sort(byT); }
  function unanswered(n) { return n.side !== 'team' && !n.reply && !n.fixed; }
  function curRef() { return S.vref[S.cid + '|' + S.vid] || null; }
  function curV() { var r = curRef(); return r ? r.v : null; }
  function waitingReels() { return allReels().filter(isWaiting); }
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

  // ---------------- «Atsisiųsti» ----------------
  // имя файла: латиница без знаков (Content-Disposition от Supabase и старые телефоны), например SHIZURI-1600-zmoniu-v2.mp4
  function dlName(c, r, v) {
    var ext = (/\.(mp4|mov|m4v|webm)(?:[?#]|$)/i.exec(String(v.src || '')) || [0, 'mp4'])[1].toLowerCase();
    var base = [c.name, r.title, v.label].join(' ');
    try { base = base.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) { /* old browser */ }
    base = base.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'video';
    return base + '.' + ext;
  }
  // публичный файл Supabase Storage: ?download=<имя> → Content-Disposition: attachment (у ссылки на другой домен атрибут download не действует)
  function dlHref(src, name) {
    src = String(src || '');
    if (!/\/storage\/v1\/object\/public\//.test(src)) return src;
    var i = src.indexOf('#'), hash = i < 0 ? '' : src.slice(i);
    if (i >= 0) src = src.slice(0, i);
    src = src.replace(/([?&])download=[^&]*&?/, '$1').replace(/[?&]$/, '');
    return src + (src.indexOf('?') < 0 ? '?' : '&') + 'download=' + encodeURIComponent(name) + hash;
  }
  function isIOS() { return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
  // ссылка «Atsisiųsti»: обычный <a> (без iframe и fetch — их режет политика страницы и память телефона); отметка — только у клиента
  // 26.11: финал Full HD на Google Диске (поле dl у версии) — только адреса Диска; нет dl — копия просмотра (720p) из бакета
  function driveDl(u) { return /^https:\/\/(drive\.google\.com|drive\.usercontent\.google\.com)\//.test(String(u || '')) ? String(u) : ''; }
  function dlLink(c, r, v, attrs, label) {
    var name = dlName(c, r, v), drv = driveDl(v.dl), file = drv ? '' : safeUrl(v.dl); // https:// (бакет) или относительный путь (демо)
    var a = h('a', Object.assign(drv ? { href: drv, target: '_blank', rel: 'noopener', 'data-v': v.id }
      : { href: dlHref(file || v.src, name), download: name, rel: 'noopener', 'data-v': v.id }, attrs || {}), label);
    a.addEventListener('click', function () { markDl(c.id, v.id); });
    return a;
  }
  function markDl(cid, vid) {
    toast(t('dlStarted'));
    if (!isClient()) return Promise.resolve(null);
    var s = stOf(cid, vid);
    if (s && s.downloaded_at) return Promise.resolve(s);
    return S.backend.markDownloaded(S.auth, cid, vid, S.name).then(function (st) {
      if (st && st.version_id) S.st[cid + '|' + vid] = st;
      setTimeout(function () { if (S.view === 'player' && !S.editing) renderSide(); markDlRows(); }, 0);
      return st;
    }).catch(function () { return null; });
  }
  function markDlRows() {
    if (!S.sheet) return;
    Array.prototype.forEach.call(S.sheet.querySelectorAll('[data-dl-row]'), function (li) {
      var s = stOf(li.getAttribute('data-c'), li.getAttribute('data-dl-row'));
      li.classList.toggle('done', !!(s && s.downloaded_at));
    });
  }
  // «Atsisiųsti viską»: лист со всеми текущими версиями, у каждой своя кнопка (iPhone пускает одно скачивание на одно касание);
  // на компьютере ещё «Visus iš eilės» — те же ссылки по очереди
  function dlAllSheet() {
    var list = [];
    S.clients.forEach(function (c) { floorReels(c, 1).forEach(function (rr) { if (rr.latest.dl) list.push(rr); }); });
    openSheet(function (pan) {
      var links = [];
      var ul = h('ul', { class: 'dl-list', id: 'dl-list' }, list.map(function (rr) {
        var a = dlLink(rr.c, rr.r, rr.latest, { class: 'btn ghost sm' }, t('download'));
        links.push(a);
        var s = stOf(rr.c.id, rr.latest.id);
        return h('li', { 'data-dl-row': rr.latest.id, 'data-c': rr.c.id, class: s && s.downloaded_at ? 'done' : null },
          h('span', { class: 'dl-t' }, h('b', { text: rr.r.title }), ' ', h('span', { class: 'chip seen count', text: rr.latest.label })),
          h('span', { class: 'dl-ok', 'aria-label': t('downloadedMark'), title: t('downloadedMark'), text: '✓' }), a);
      }));
      var seq = null;
      if (!isIOS() && list.length > 1) {
        seq = h('button', { type: 'button', class: 'btn primary', id: 'dl-seq' }, t('downloadSeq'));
        seq.addEventListener('click', function () {
          seq.disabled = true;
          links.forEach(function (a, i) { setTimeout(function () { a.click(); if (i === links.length - 1) seq.disabled = false; }, i * 1500); });
        });
      }
      pan.append(h('div', { class: 'grip' }), h('h2', { text: t('downloadAll') }), h('p', { class: 'sub', text: t('downloadAllSub') }), ul,
        h('div', { class: 'row' }, seq, h('button', { type: 'button', class: 'btn ghost', id: 'dl-close', onclick: closeSheet }, t('gotIt'))));
    }, 'dl-sheet');
  }

  // ---------------- правила клиента (каталог: rules) ----------------
  // rules: [{title: строка или {lt,en}, items: [строка или {lt,en}]}] — только текст (рисуется textContent, HTML не выполняется)
  function rulesOf(c) {
    var rs = c && Array.isArray(c.rules) ? c.rules : [];
    var out = [];
    rs.slice(0, 20).forEach(function (g) {
      if (!g || typeof g !== 'object') return;
      var items = (Array.isArray(g.items) ? g.items : []).map(function (x) { return loc(x).trim().slice(0, 600); }).filter(Boolean).slice(0, 60);
      var title = loc(g.title).trim().slice(0, 120);
      if (items.length || title) out.push({ title: title, items: items });
    });
    return out;
  }
  // группа «Titrai ir viršelis» — из живого выбора клиента (subtitles) и выбранной обложки (chosenCover), не из файла правил
  function autoRules(c) {
    var items = [], sc = subsOf(c), cv = coverOf(c);
    if (sc) {
      items.push(t('ruleSubPlace', sc.level ? loc(sc.level.name) : '', sc.px));
      if (sc.styleDef) items.push(t('ruleSubStyle', loc(sc.styleDef.name)));
    }
    if (cv) items.push(cv.src ? t('ruleCover') : t('ruleCoverSoon'));
    return items.length ? [{ title: t('rulesAutoH'), items: items }] : [];
  }
  // сворачиваемая плашка: закрыта по умолчанию, состояние держится между перерисовками (опрос базы)
  // внутренние правила (rulesInternal) приходят только по ссылке команды — kab_admin_state; клиенту их в данных нет
  function rulesBox(c, where) {
    var groups = rulesOf(c).concat(autoRules(c));
    var inner = isClient() ? [] : rulesOf({ rules: c.rulesInternal });
    if (!groups.length && !inner.length) return null;
    var n = groups.concat(inner).reduce(function (a, g) { return a + g.items.length; }, 0);
    var label = !isClient() && S.clients.length > 1 ? t('rulesOf', c.name) : t('rules');
    var grp = function (g, internal) {
      return h('div', { class: 'rl-g' + (internal ? ' rl-int' : '') },
        g.title || internal ? h('h4', null, internal ? h('span', { class: 'chip team', text: t('rulesInternal') }) : null, g.title ? h('span', { text: g.title }) : null) : null,
        g.items.length ? h('ul', null, g.items.map(function (x) { return h('li', { text: x }); })) : null);
    };
    return foldable('rules|' + where + '|' + c.id, h('details', { class: 'rules rules-' + where, id: 'rules-' + where },
      h('summary', null, h('span', { class: 'rl-i', 'aria-hidden': 'true', text: '§' }), h('span', { text: label }), n ? h('span', { class: 'chip seen count', text: String(n) }) : null),
      h('div', { class: 'rl-body' }, groups.map(function (g) { return grp(g, false); }), inner.map(function (g) { return grp(g, true); }))));
  }

  // ---------------- «Titrai» (vieta ir stilius) ir pasirinktas viršelis ----------------
  // Уровни — низ строки субтитров в px из 1920 (кадр 1080×1920). Зоны Instagram — примерно, по нашей карточке c040
  // (knowledge/montazh-stol): важный текст 250–1500 px по высоте, справа от 972 px — кнопки; «нижние 35 %» = 1250 px.
  var SUB_H = 1920, SUB_W = 1080;
  var SUB_ZONES = { top: 250, bottom: 1500, right: 972, btnTop: 1020, btnBottom: 1680 };
  var SUB_LEVELS = [
    { px: 1150, name: { lt: 'Aukščiau', en: 'Higher' }, sub: { lt: 'arčiau kadro vidurio', en: 'closer to the middle' } },
    { px: 1250, name: { lt: 'Saugi zona', en: 'Safe zone' }, sub: { lt: 'Instagram patarimas: apatiniai 35 % – laisvi', en: 'Instagram advice: bottom 35 % kept clear' } },
    { px: 1345, name: { lt: 'Žemiau', en: 'Lower' }, sub: { lt: 'virš aprašymo, su atsarga', en: 'above the caption, with room to spare' } },
    { px: 1440, name: { lt: 'Žemai', en: 'Low' }, sub: { lt: 'tiesiai virš vardo ir aprašymo', en: 'right above the name and caption' } }
  ];
  var SUB_STYLES = [
    { id: 'zodis', name: { lt: 'Žodis po žodžio', en: 'Word by word' }, sub: { lt: 'žodžiai atsiranda kalbant, tariamas – ryškesnis', en: 'words appear as spoken, the current one stands out' } },
    { id: 'zodis-kursyvas', name: { lt: 'Žodis po žodžio + pagrindinis žodis kursyvu', en: 'Word by word + key word in italics' }, sub: { lt: 'kaip „Žodis po žodžio“, o vienas svarbiausias žodis – kursyvu', en: 'like “Word by word”, with one key word in italics' } },
    { id: 'demele', name: { lt: 'Ant minkštos dėmės', en: 'On a soft pad' }, sub: { lt: 'trumpa frazė ant permatomo fono', en: 'a short phrase on a see-through pad' } },
    { id: 'sakinys', name: { lt: 'Visas sakinys', en: 'Whole sentence' }, sub: { lt: 'ramūs klasikiniai titrai, 1–2 eilutės', en: 'calm classic subtitles, 1–2 lines' } }
  ];
  function levelOf(px) { return SUB_LEVELS.filter(function (l) { return l.px === px; })[0] || null; }
  function styleDefOf(id) { return SUB_STYLES.filter(function (x) { return x.id === id; })[0] || null; }
  function subsOf(c) {
    var s = c && c.subtitles;
    if (!s || typeof s !== 'object') return null;
    var px = Math.round(+s.bottom_px);
    if (!(px >= 900 && px <= 1700)) return null;
    var rp = Math.round(+s.req_bottom_px), req = rp >= 900 && rp <= 1700 && s.req_style
      ? { px: rp, level: levelOf(rp), style: String(s.req_style), styleDef: styleDefOf(String(s.req_style)), by: s.req_by || '', at: s.req_at || '' } : null;
    return { px: px, level: levelOf(px), style: String(s.style || ''), styleDef: styleDefOf(String(s.style || '')), by: s.chosen_by || '', side: s.side === 'team' ? 'team' : 'client', at: s.chosen_at || '', locked: !!s.locked, req: req };
  }
  // chosenCover — {src, caption}; объект без src = «выбрали, картинку ещё не положили» (заглушка)
  function coverOf(c) {
    var x = c && c.chosenCover;
    if (!x || typeof x !== 'object') return null;
    return { src: safeUrl(x.src), caption: loc(x.caption).trim().slice(0, 200) };
  }
  // образец стиля: тот же текст во всех четырёх, рисуется CSS (картинок и шрифтов не грузим)
  function sampleEl(style) {
    var w = t('subsSample');
    if (style === 'sakinys') return h('span', { class: 'smp st-sakinys' }, t('subsSampleLong'));
    if (style === 'demele') return h('span', { class: 'smp st-demele' }, w.join(' '));
    if (style === 'zodis-kursyvas') return h('span', { class: 'smp st-zodis st-kurs' }, h('b', { text: w[0] }), ' ', h('b', { class: 'hl', text: w[1] }), ' ', h('em', { text: w[2] }));
    return h('span', { class: 'smp st-zodis' }, h('b', { text: w[0] }), ' ', h('b', { text: w[1] }), ' ', h('b', { class: 'hl', text: w[2] }));
  }
  // схема телефона 9:16: зоны интерфейса Instagram, линия субтитров; pick — режим выбора (линии уровней можно нажимать)
  function phoneEl(px, style, pick) {
    var pc = function (v, of) { return (v / of * 100).toFixed(2) + '%'; };
    var ph = h('div', { class: 'ph' + (pick ? ' pick' : ''), 'aria-hidden': pick ? null : 'true' },
      h('span', { class: 'z z-top', style: 'height:' + pc(SUB_ZONES.top, SUB_H) }, pick ? h('i', { text: t('subsZoneTop') }) : null),
      h('span', { class: 'z z-bot', style: 'top:' + pc(SUB_ZONES.bottom, SUB_H) }, h('span', { class: 'zb-av' }), h('span', { class: 'zb-l1' }), h('span', { class: 'zb-l2' }), pick ? h('i', { text: t('subsZoneBottom') }) : null),
      h('span', { class: 'z z-right', style: 'left:' + pc(SUB_ZONES.right, SUB_W) + ';top:' + pc(SUB_ZONES.btnTop, SUB_H) + ';height:' + pc(SUB_ZONES.btnBottom - SUB_ZONES.btnTop, SUB_H) }, [0, 1, 2, 3].map(function () { return h('span', { class: 'zr-b' }); })));
    if (pick) {
      SUB_LEVELS.forEach(function (l) {
        ph.appendChild(h('button', { type: 'button', class: 'lv' + (l.px === px ? ' on' : ''), id: 'lv-' + l.px, 'data-px': String(l.px), style: 'top:' + pc(l.px, SUB_H), 'aria-label': loc(l.name) + ' – ' + t('subsPx', l.px), onclick: function () { pick(l.px); } }, h('span', { class: 'lv-t', text: String(l.px) })));
      });
    }
    if (px) ph.appendChild(h('span', { class: 'sub-line', style: 'bottom:' + pc(SUB_H - px, SUB_H) }, sampleEl(style || 'zodis')));
    return ph;
  }
  function coverEl(c) {
    var cv = coverOf(c);
    var pic = cv && cv.src ? h('img', { src: cv.src, alt: t('coverH'), loading: 'lazy', decoding: 'async' }) : h('span', { class: 'cv-empty', text: t('coverEmpty') });
    return h('figure', { class: 'cv' + (cv && cv.src ? '' : ' is-empty'), id: 'cover-' + c.id },
      h('span', { class: 'cv-pic' }, pic),
      h('figcaption', null, cv && cv.src ? h('span', { text: cv.caption || t('coverUsed') }) : (cv && cv.caption ? h('span', { text: cv.caption }) : null)));
  }
  // ---------------- «Dirbtuvės» — мастерская клиента на главной (Павел 27.11) ----------------
  // Выборы клиента: субтитры (уровень и стиль), обложка; позже — анимации и голос. Раскрывается на месте, без перехода
  // и без листа поверх страницы. Нет выбора субтитров — открыт сам (у клиента), иначе свёрнут; состояние держится между перерисовками.
  function subsWho(sc) {
    var when = sc.at ? fmtD(sc.at) : '';
    return h('p', { class: 'subs-who' }, sc.side === 'team' ? t('subsByTeam', sc.by, when) : t('subsBy', sc.by, when));
  }
  function dirbtuves(c) {
    var sc = subsOf(c), cv = coverOf(c), many = !isClient() && S.clients.length > 1;
    var key = 'dirb|' + c.id;
    if (S.open[key] === undefined && !sc && isClient()) S.open[key] = true;
    var editing = S.subsEdit === c.id;
    var anims = animSamples(c);
    // короткая строка в заголовке: что уже выбрано
    var bits = [sc ? t('dirbSubsShort', sc.level ? loc(sc.level.name) : t('subsPx', sc.px)) + (sc.locked ? ' ✓' : '') : t('dirbSubsNone'),
      cv && cv.src ? t('dirbCoverYes') : t('dirbCoverWait')];
    if (anims.length) bits.push(t('dirbAnim', anims.filter(function (rr) { return !!reactionOf(c.id, rr.latest.id); }).length, anims.length));
    var req = sc && sc.req;
    var titrai = h('section', { class: 'dirb-sec subs' + (sc ? '' : ' is-none'), id: 'subs-' + c.id },
      h('div', { class: 'subs-h' }, h('h3', null, t('subsH'), sc && sc.locked ? h('span', { class: 'chip approved', id: 'subs-locked', text: t('subsLocked') }) : null),
        editing ? null : h('div', { class: 'subs-acts' },
          !isClient() && sc ? h('button', { type: 'button', class: 'btn ghost sm', id: 'subs-lock-' + c.id, onclick: function () { lockSubs(c, !sc.locked); } }, sc.locked ? t('subsUnlock') : t('subsLock')) : null,
          h('button', { type: 'button', class: 'btn sm' + (sc ? ' ghost' : ' primary'), id: 'subs-edit-' + c.id, onclick: function () { S.subsEdit = c.id; S.editing = 'subs'; renderList(); var el = document.getElementById('subs-' + c.id); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start' }); } }, sc ? t('subsChange') : t('subsPick')))),
      editing ? subsEditor(c) : h('div', { class: 'subs-body' },
        h('div', { class: 'subs-ph', 'aria-hidden': 'true' }, phoneEl(sc ? sc.px : 0, sc ? sc.style : '', null)),
        sc ? h('div', { class: 'subs-info' },
          h('dl', null,
            h('dt', { text: t('subsPlace') }), h('dd', null, sc.level ? h('b', { text: loc(sc.level.name) }) : null, sc.level ? ' · ' : null, t('subsPx', sc.px)),
            h('dt', { text: t('subsStyle') }), h('dd', null, h('b', { text: sc.styleDef ? loc(sc.styleDef.name) : sc.style }))),
          subsWho(sc),
          // запрос клиента на изменение закреплённого выбора: клиент видит «ждём команду», команда — «Priimti»
          req ? h('div', { class: 'subs-req', id: 'subs-req-' + c.id },
            h('p', { text: (isClient() ? t('subsReqMine') : t('subsReqTeam', req.by)) + ' ' + (req.level ? loc(req.level.name) : t('subsPx', req.px)) + ' · ' + (req.styleDef ? loc(req.styleDef.name) : req.style) }),
            !isClient() ? h('button', { type: 'button', class: 'btn ok sm', id: 'subs-accept-' + c.id, onclick: function () { acceptReq(c, req); } }, t('subsAccept')) : null) : null)
          : h('div', { class: 'subs-info' }, h('p', { class: 'subs-none', text: isClient() ? t('subsNone') : t('subsNoneTeam') }))));
    var virselis = h('section', { class: 'dirb-sec cover-sec' }, h('h3', { text: t('coverH') }), coverEl(c));
    // анимации: образцы из проекта kind: 'animacijos' — смотреть прямо здесь, «patinka / nepatinka»
    var anim = anims.length ? h('section', { class: 'dirb-sec anim-sec', id: 'anim-' + c.id }, h('h3', { text: t('animH') }), h('p', { class: 'dirb-sub', text: t('animSub') }),
      h('div', { class: 'samples' }, anims.map(function (rr) {
        var v = rr.latest, re = reactionOf(c.id, v.id);
        var vid = h('video', { controls: true, playsinline: true, preload: 'none', poster: v.poster || null, src: v.src, controlslist: 'nodownload' });
        vid.playsInline = true;
        return h('div', { class: 'sample', id: 'sample-' + rr.r.id }, vid, h('b', { text: rr.r.title }),
          isClient() ? reactButtons(c.id, v.id, 'an-' + rr.r.id, keepScroll(renderList))
            : h('span', { class: 'cm', text: re ? (re === 'like' ? t('like') : t('dislike')) : t('noReaction') }));
      }))) : null;
    // голос ИИ: catalog.voices [{id, title, src}]; пока пусто — заглушка-список (без кнопок)
    var voices = Array.isArray(c.voices) ? c.voices.filter(function (x) { return x && x.id; }) : [];
    var balsas = h('section', { class: 'dirb-sec voice-sec', id: 'voice-' + c.id }, h('h3', { text: t('voiceH') }),
      voices.length
        ? h('div', { class: 'samples voices' }, voices.map(function (x) {
            var re = reactionOf(c.id, x.id), src = safeUrl(x.src);
            return h('div', { class: 'sample voice', id: 'v-' + x.id }, h('b', { text: loc(x.title) || x.id }), src ? h('audio', { controls: true, preload: 'none', src: src }) : null,
              isClient() ? reactButtons(c.id, x.id, 'vo-' + x.id, keepScroll(renderList)) : h('span', { class: 'cm', text: re ? (re === 'like' ? t('like') : t('dislike')) : t('noReaction') }));
          }))
        : h('ul', { class: 'voice-stub', id: 'voice-stub' }, [1, 2, 3].map(function (i) { return h('li', null, h('b', { text: t('voiceStub', i) }), h('span', { text: t('voiceSoon') })); })));
    return foldable(key, h('details', { class: 'dirbtuves' + (sc ? '' : ' is-none'), id: 'dirbtuves-' + c.id },
      h('summary', null, h('span', { class: 'rl-i', 'aria-hidden': 'true', text: '✎' }),
        h('span', { class: 'dirb-t' }, h('b', { text: many ? t('dirbOf', c.name) : t('dirb') }), h('small', { text: bits.join(' · ') }))),
      h('div', { class: 'dirb-body' }, h('p', { class: 'dirb-sub', text: t('dirbSub') }), titrai, anim, virselis, balsas)));
  }
  // образцы анимаций: ролики проекта с kind: 'animacijos' (у SHIZURI — «Animacijų stiliai»); на этажах их нет
  function animSamples(c) { return clientReels(c).filter(function (rr) { return rr.p.kind === 'animacijos'; }); }
  function keepScroll(fn) { return function () { var y = window.scrollY; fn(); window.scrollTo(0, y); }; }
  function lockSubs(c, locked) {
    S.backend.lockSubtitles(S.auth, c.id, locked).then(function (rec) { c.subtitles = rec; keepScroll(renderList)(); toast(locked ? t('subsLockedToast') : t('undone')); })
      .catch(function () { toast(t('err')); });
  }
  function acceptReq(c, req) {
    withName(function () {
      S.backend.setSubtitles(S.auth, c.id, { bottom_px: req.px, style: req.style, by: S.name }).then(function (rec) { c.subtitles = rec; keepScroll(renderList)(); toast(t('subsSaved')); })
        .catch(function () { toast(t('err')); });
    });
  }
  // выбор на месте: схема телефона с уровнями + 4 образца стиля; имя спрашиваем здесь же, как у заметки
  function subsEditor(c) {
    var cid = c.id, sc = subsOf(c), cur = S.subsDraft && S.subsDraft.cid === cid ? S.subsDraft : { cid: cid, px: sc ? sc.px : 0, style: sc && sc.styleDef ? sc.style : '' };
    S.subsDraft = cur;
    var needName = !S.name;
    var box = h('div', { class: 'subs-edit', id: 'subs-editor' });
    var err = h('p', { class: 'err', id: 'subs-err', hidden: true });
    var phBox = h('div', { class: 'subs-pickph' });
    var lvList = h('div', { class: 'lv-list', role: 'radiogroup', 'aria-label': t('subsPlace') });
    var stGrid = h('div', { class: 'st-grid', role: 'radiogroup', 'aria-label': t('subsStyleH') });
    var nameIn = needName ? h('input', { type: 'text', id: 'subs-name', autocomplete: 'name', placeholder: t('namePh'), maxlength: 80 }) : null;
    var draw = function () {
      phBox.textContent = '';
      phBox.appendChild(phoneEl(cur.px, cur.style || 'zodis', function (px) { cur.px = px; draw(); }));
      lvList.textContent = '';
      SUB_LEVELS.forEach(function (l) {
        lvList.appendChild(h('button', { type: 'button', class: 'lv-opt' + (l.px === cur.px ? ' on' : ''), id: 'lvo-' + l.px, role: 'radio', 'aria-checked': l.px === cur.px ? 'true' : 'false', onclick: function () { cur.px = l.px; draw(); } },
          h('b', { text: loc(l.name) }), h('span', { text: loc(l.sub) }), h('small', { text: t('subsPx', l.px) })));
      });
      if (cur.px && !levelOf(cur.px)) lvList.appendChild(h('p', { class: 'sub', text: t('subsPx', cur.px) }));
      stGrid.textContent = '';
      SUB_STYLES.forEach(function (x) {
        stGrid.appendChild(h('button', { type: 'button', class: 'st-opt' + (x.id === cur.style ? ' on' : ''), id: 'st-' + x.id, role: 'radio', 'aria-checked': x.id === cur.style ? 'true' : 'false', onclick: function () { cur.style = x.id; draw(); } },
          h('span', { class: 'st-frame', 'aria-hidden': 'true' }, sampleEl(x.id)), h('b', { text: loc(x.name) }), h('span', { text: loc(x.sub) })));
      });
    };
    draw();
    var stop = function () { S.subsEdit = null; S.subsDraft = null; if (S.editing === 'subs') S.editing = null; };
    var save = h('button', { type: 'button', class: 'btn primary', id: 'subs-save' }, t('save'));
    var cancel = h('button', { type: 'button', class: 'btn ghost', id: 'subs-cancel', onclick: function () { stop(); var y = window.scrollY; renderList(); window.scrollTo(0, y); } }, t('cancel'));
    add(box, [sc && sc.locked && isClient() ? h('p', { class: 'subs-lock-note', id: 'subs-lock-note', text: t('subsLockedNote') }) : null,
      h('p', { class: 'sub', text: t('subsSheetSub') }),
      h('div', { class: 'subs-pick' }, phBox, lvList),
      h('h4', { text: t('subsStyleH') }), stGrid,
      needName ? h('label', { for: 'subs-name' }, t('nameLabel'), h('span', { class: 'sub', text: t('nameWhy') }), nameIn) : null,
      err, h('div', { class: 'row' }, save, cancel)]);
    save.addEventListener('click', function () {
      var nm = nameIn ? nameIn.value.trim() : S.name;
      if (!cur.px || !cur.style) { err.textContent = t('subsNeed'); err.hidden = false; return; }
      if (!nm) { err.textContent = t('needName'); err.hidden = false; nameIn.focus(); return; }
      if (nameIn) setName(nm);
      err.hidden = true; save.disabled = true; save.textContent = t('saving');
      S.backend.setSubtitles(S.auth, cid, { bottom_px: cur.px, style: cur.style, by: S.name }).then(function (rec) {
        c.subtitles = rec;
        stop();
        var y = window.scrollY; // перерисовка списка не должна уносить наверх
        renderList();
        window.scrollTo(0, y);
        toast(rec && rec.req_bottom_px && isClient() ? t('subsReqSent') : t('subsSaved'));
      }).catch(function () {
        save.disabled = false; save.textContent = t('save');
        err.textContent = t('saveErr'); err.hidden = false;
      });
    });
    return box;
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
    S.reactions = {};
    (d.reactions || []).forEach(function (x) { if (x && x.reaction) S.reactions[x.client_id + '|' + x.item_id] = x; });
    index();
    S.name = LS.get(nameKey()) || '';
    var c = S.clients[0];
    document.title = '9×16 peržiūra' + (isClient() && c ? ' · ' + c.name : '');
    applyBrand();
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
    else if (S.clients[0]) {
      // с логотипом клиента: в плеере — логотип вместо имени; в списке — ничего (логотип уже крупно на странице)
      var hasLogo = !!(S.brand && S.brand.logo);
      if (hasLogo && S.view === 'player') who.appendChild(logoEl('in-top'));
      else if (!(hasLogo && S.view === 'list')) who.textContent = S.clients[0].name;
    }
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
    else if (S.view === 'player') { E.noteLabel.textContent = t('noteBtn'); hideUpnext(); renderSide(); renderTrack(); }
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

  // линии этапов «Kas toliau» больше нет (Павел 27.11): projects[].plan в каталоге страница не показывает
  // колонки сетки: ряды заполнены целиком, без пустого места справа (оно и давало «сдвиг влево»)
  function cols(n, max, min) { return n <= max ? Math.max(n, min) : Math.ceil(n / Math.ceil(n / max)); }
  // ---------------- список ----------------
  function chip(st) {
    var key = st === 'new' && !isClient() ? 'chip_new_team' : 'chip_' + st;
    return h('span', { class: 'chip ' + st, text: t(key) });
  }
  // клиенту на обложке — только значок «просмотрено / не просмотрено» (точка или галочка), без слов; слово — для читалок и в подсказке
  function mark(st) {
    return h('span', { class: 'mk ' + st, role: 'img', 'aria-label': t('chip_' + st), title: t('chip_' + st) });
  }
  function showList() {
    S.view = 'list'; S.rid = null; S.vid = null; S.editing = null; S.subsEdit = null; S.subsDraft = null;
    pauseVideo(); stopRaf(); hideUpnext();
    E.video = null; E.player = null; E.upnext = null; E.cmpbar = null;
    renderTop(); renderList();
    window.scrollTo(0, 0);
  }
  // ---------------- главная: этажи (Павел 27.11) ----------------
  // 1 Paruošta → 2 Peržiūrėkite / patvirtinkite → 3 Juodraštiniai montažai → 4 Archyvas; без тем и без линии этапов.
  // Ниже — «Dirbtuvės» (выборы клиента) и мелко «Taisyklės».
  function floorReels(c, f) {
    var out = clientReels(c).filter(function (rr) { return floorOf(rr) === f; });
    if (f === 2) {
      // свежая правка сверху: по дате последней версии (created), без даты — в конце, дальше порядок каталога
      out = out.map(function (rr, i) { return { rr: rr, i: i, at: String(rr.latest.created || '') }; })
        .sort(function (a, b) { return a.at === b.at ? a.i - b.i : a.at < b.at ? 1 : -1; })
        .map(function (x) { return x.rr; });
    }
    return out;
  }
  // версии старше двух последних — в «Archyvas», отдельным списком (ссылки открывают именно эту версию)
  function oldVersions(c) {
    var out = [];
    clientReels(c).forEach(function (rr) {
      if (floorOf(rr) === 4) return;
      rr.vs.slice(0, Math.max(0, rr.vs.length - 2)).forEach(function (v) { out.push({ rr: rr, v: v }); });
    });
    return out;
  }
  function floorHead(f, extra) {
    return h('div', { class: 'floor-h' }, h('span', { class: 'fl-n', 'aria-hidden': 'true', text: String(f) }),
      h('div', { class: 'fl-t' }, h('h2', { text: t('floor' + f) }), h('small', { text: t('floor' + f + 'Sub') })), extra || null);
  }
  function grid(cards, small) {
    var n = cards.length;
    return h('div', { class: 'grid' + (small ? ' grid-sm' : ''), style: small ? '--dc:' + cols(n, 8, 6) + ';--tc:' + cols(n, 5, 4) : '--dc:' + cols(n, 6, 4) + ';--tc:' + cols(n, 4, 3) }, cards);
  }
  function floorsOf(c, box) {
    var many = !isClient() && S.clients.length > 1;
    if (many) box.appendChild(h('h2', { class: 'client-h', text: c.name }));
    var f1 = floorReels(c, 1), f2 = floorReels(c, 2), f3 = floorReels(c, 3), f4 = floorReels(c, 4), old = oldVersions(c);
    if (f1.length) {
      var withDl = f1.filter(function (rr) { return !!rr.latest.dl; }).length;
      box.appendChild(h('section', { class: 'floor floor-1', id: 'floor-1-' + c.id }, floorHead(1,
        withDl ? h('button', { type: 'button', class: 'btn ghost sm dl-all', id: 'dl-all', onclick: dlAllSheet }, h('span', { class: 'dl-i', 'aria-hidden': 'true' }), t('downloadAll')) : null),
        grid(f1.map(function (rr) { return card(c, rr.r, 1); }), true)));
    }
    if (f2.length) box.appendChild(h('section', { class: 'floor floor-2', id: 'floor-2-' + c.id }, floorHead(2), grid(f2.map(function (rr) { return card(c, rr.r, 2); }))));
    if (f3.length) box.appendChild(h('section', { class: 'floor floor-3', id: 'floor-3-' + c.id }, floorHead(3), grid(f3.map(function (rr) { return card(c, rr.r, 3); }))));
    if (f4.length || old.length) {
      box.appendChild(foldable('arch|' + c.id, h('details', { class: 'floor floor-4 archive', id: 'floor-4-' + c.id },
        h('summary', null, floorHead(4, h('span', { class: 'chip seen count', text: String(f4.length + old.length) }))),
        f4.length ? grid(f4.map(function (rr) { return card(c, rr.r, 4); })) : null,
        old.length ? h('div', { class: 'old-vers' }, h('h3', { text: t('oldVersionsH') }),
          h('ul', null, old.map(function (x) {
            return h('li', null, h('button', { type: 'button', class: 'linkbtn', 'data-ov': x.v.id, onclick: function () { openReel(c.id, x.rr.r.id, x.v.id); } }, x.rr.r.title + ' · ' + x.v.label));
          }))) : null)));
    }
  }
  function renderList() {
    E.main.textContent = '';
    var box = h('div', { class: 'wrap', id: 'list' });
    // бренд клиента: кадр-обложка полосой под шапкой (без линии этапов — её больше нет)
    var b = isClient() ? S.brand : null;
    if (b && b.cover) {
      var band = h('section', { class: 'plan plan-band has-cover', id: 'brand-band' }, h('div', { class: 'wrap' }));
      band.style.backgroundImage = 'url("' + b.cover + '")';
      var lgc = logoEl('in-band', true);
      if (lgc) band.firstChild.appendChild(lgc);
      E.main.appendChild(band);
    }
    box.appendChild(isClient() ? heroClient(!(b && b.cover)) : heroTeam());
    S.clients.forEach(function (c) { floorsOf(c, box); });
    // «Dirbtuvės» — после этажей: выборы клиента, раскрывается на месте (вид команды — по каждому клиенту)
    S.clients.forEach(function (c) { box.appendChild(dirbtuves(c)); });
    S.clients.forEach(function (c) { add(box, rulesBox(c, 'list')); });
    box.appendChild(footer());
    E.main.appendChild(box);
  }
  function heroClient(withLogo) {
    var w = waitingReels();
    var head = w.length
      ? h('h1', null, h('span', { class: 'n', text: String(w.length) }), ' ', t('waitingTail', w.length))
      : [h('h1', { text: t('allDone') }), h('p', { text: t('allDoneSub') })];
    return h('section', { class: 'hero' }, h('div', { class: 'hero-t' }, withLogo ? logoEl('in-hero') : null, head));
  }
  function heroTeam() {
    var rs = allReels().filter(function (rr) { return floorOf(rr) > 0; }), un = S.notes.filter(unanswered);
    var cnt = { w: 0, c: 0, a: 0 };
    rs.forEach(function (rr) { var f = floorOf(rr), s = vState(rr.c.id, rr.latest.id); if (f === 1) cnt.a++; else if (f === 2 && s === 'changes') cnt.c++; else if (f === 2) cnt.w++; });
    var first = un.slice().sort(function (a, b) { return String(a.created_at).localeCompare(String(b.created_at)); })[0];
    // «atsisiųsta X iš Y»: среди готовых (этаж 1) — клиент скачал текущую версию
    var ready = rs.filter(function (rr) { return floorOf(rr) === 1; });
    var dl = ready.filter(function (rr) { return !!reelInfo(rr).dl; }).length;
    // этаж 1 без ссылки на Full HD (dl) — основной чат должен залить финал
    var noHd = ready.filter(function (rr) { return !rr.latest.dl; });
    var reqs = S.clients.filter(function (c) { var s = subsOf(c); return s && s.req; });
    return h('section', { class: 'hero' },
      h('p', { class: 'eyebrow', text: t('teamEyebrow') }),
      h('h1', { text: t('teamTitle') }),
      h('div', { class: 'stats' },
        h('span', { class: 'stat' + (un.length ? ' hot' : '') }, h('b', { text: String(un.length) }), t('sUnanswered')),
        h('span', { class: 'stat' }, h('b', { text: String(cnt.w) }), t('sWaiting')),
        h('span', { class: 'stat' }, h('b', { text: String(cnt.c) }), t('sChanges')),
        h('span', { class: 'stat' }, h('b', { text: String(cnt.a) }), t('sApproved'))),
      ready.length ? h('p', { class: 'dl-sum' + (dl === ready.length ? ' all' : ''), id: 'dl-sum' }, h('span', { class: 'dl-i', 'aria-hidden': 'true' }), h('b', { text: String(dl) }), ' ', t('sDownloaded', dl, ready.length)) : null,
      noHd.length ? h('div', { class: 'nohd', id: 'no-hd' }, h('b', { text: t('noHdT', noHd.length) }),
        h('ul', null, noHd.map(function (rr) {
          var s = stOf(rr.c.id, rr.latest.id) || {};
          return h('li', null, h('button', { type: 'button', class: 'linkbtn', onclick: function () { openReel(rr.c.id, rr.r.id); } }, (S.clients.length > 1 ? rr.c.name + ' · ' : '') + rr.r.title + ' · ' + rr.latest.label),
            s.decided_at ? h('span', { class: 'sl-by', text: ' ' + t('byWhen', s.decided_by, fmtD(s.decided_at)) }) : null);
        }))) : null,
      reqs.length ? h('p', { class: 'nohd', id: 'subs-req-sum' }, h('b', { text: t('subsReqSum', reqs.map(function (c) { return c.name; }).join(', ')) })) : null,
      first ? h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn primary', id: 'open-unanswered', onclick: function () { openReel(first.client_id, first.reel_id, first.version_id); } }, t('openUnanswered'))) : null);
  }
  // карточка: обложка, версия; этаж 1 — мелкая (только узнать); 2 — версия и сколько раз правили; 3 — patinka / nepatinka
  function card(c, r, floor) {
    var v = r.versions[r.versions.length - 1], st = vState(c.id, v.id);
    var rr = S.rref[c.id + '|' + r.id], info = rr ? reelInfo(rr) : {};
    floor = floor || (rr ? floorOf(rr) : 2);
    var rn = S.notes.filter(function (n) { return n.client_id === c.id && n.reel_id === r.id; });
    var nv = rn.filter(function (n) { return n.version_id === v.id; }).length;
    var parts = [];
    if (floor === 2 && r.versions.length > 1) parts.push(t('rounds', r.versions.length - 1));
    if (nv) parts.push(t('nNotes', nv));
    if (!isClient()) {
      var un = rn.filter(unanswered).length;
      if (un) parts.push(t('nUnanswered', un));
      if (info.dl) parts.push(t('dlShort'));
      if (floor === 1 && !v.dl) parts.push(t('noHdShort'));
    }
    var re = floor === 3 ? reactionOf(c.id, v.id) : null;
    var meta = parts.length ? h('span', { class: 'cm', text: parts.join(' · ') }) : null;
    // обложка: картинка из каталога; если её нет — кадр из самого ролика поверх подложки с номером версии
    var cover = v.poster ? h('img', { src: v.poster, alt: '', loading: 'lazy', decoding: 'async' }) : [h('span', { class: 'tile', text: v.label || '9×16' }), frameThumb(v.src)];
    // «Neperžiūrėta» / «Nauja» не показываем (Павел 27.11): непросмотренное и так стоит на этаже 2; остаются «Reikia pataisymų» и версия
    var badge = floor === 2 && st === 'changes' ? chip('changes') : floor === 1 ? h('span', { class: 'mk approved', role: 'img', 'aria-label': t('chip_approved'), title: t('chip_approved') }) : null;
    var thumb = h('span', { class: 'thumb' }, cover,
      floor === 1 ? null : h('span', { class: 'play', 'aria-hidden': 'true' }),
      badge,
      re ? h('span', { class: 'react-mk ' + re, text: re === 'like' ? t('likeShort') : t('dislikeShort') }) : null,
      h('span', { class: 'vtag', text: v.label }),
      v.duration && floor !== 1 ? h('span', { class: 'dur', text: fmtT(v.duration) }) : null);
    return h('button', { type: 'button', class: 'card' + (floor === 1 ? ' sm' : ''), id: 'card-' + r.id, 'data-state': st, 'data-floor': String(floor), onclick: function () { openReel(c.id, r.id); } },
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
    E.noteLabel = h('span', { class: 'nl', text: t('noteBtn') });
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
    var fl = floorOf(cur), list = fl ? floorReels(cur.c, fl) : [], i = list.indexOf(cur);
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

  // ---------------- под видео: две последние версии, «что изменено», скачивание (только этаж 1); справа: решение, заметки ----------------
  function renderSide() {
    var vr = curRef();
    if (!vr || !E.side) return;
    var f = floorOf(vr.rr);
    E.phead.textContent = '';
    E.phead.append(h('p', { class: 'eyebrow', text: (isClient() ? '' : vr.c.name + ' · ') + (f ? t('floor' + f) : t('dirb')) }), h('h1', { id: 'reel-title', text: vr.r.title }));
    add(E.phead, [variantsRow(vr), changesBox(vr), f === 1 && vr.latest ? dlRow(vr) : null]);
    E.side.textContent = '';
    // без линии этапов и без правил (Павел 27.11: правила — только на главной, внизу)
    add(E.side, [isClient() ? decisionPanel(vr) : teamStatusPanel(vr), notesPanel(vr)]);
    renderCmpbar();
  }
  // в ролике — две последние версии; открытая старая (из «Archyvas») показывается третьей
  function shownVersions(vr) {
    var vs = vr.rr.vs.slice(-2);
    if (vs.indexOf(vr.v) < 0) vs = [vr.v].concat(vs);
    return vs;
  }
  function variantsRow(vr) {
    var vs = shownVersions(vr);
    if (vs.length < 2) return null;
    return h('div', { class: 'variants' },
      h('div', { class: 'vseg', role: 'group', 'aria-label': t('variants') }, vs.map(function (v) {
        return h('button', { type: 'button', 'data-v': v.id, id: 'ver-' + v.label, 'aria-pressed': String(v.id === vr.v.id), onclick: function () { pickVersion(v); } }, v.label);
      })),
      h('button', { type: 'button', class: 'cmp-tog', id: 'compare-toggle', 'aria-pressed': String(!!S.cmp), onclick: toggleCompare }, t('compareMode')));
  }
  // режим «Palyginti»: крупные кнопки версий прямо под видео, переключение в той же секунде
  function renderCmpbar() {
    if (!E.cmpbar) return;
    var vr = curRef(), vs = vr ? shownVersions(vr) : [], on = !!(S.cmp && vs.length > 1);
    E.cmpbar.hidden = !on;
    if (E.player) E.player.classList.toggle('cmp-on', on);
    E.cmpbar.textContent = '';
    if (!on) return;
    E.cmpbar.append(
      h('div', { class: 'cseg', role: 'group', 'aria-label': t('variants') }, vs.map(function (v) {
        return h('button', { type: 'button', id: 'cmp-' + v.label, 'aria-pressed': String(v.id === vr.v.id), onclick: function () { switchVersion(v, { same: true }); } }, v.label);
      })),
      h('span', { class: 'chint', 'aria-hidden': 'true' }),
      h('button', { type: 'button', class: 'cx', id: 'cmp-off', 'aria-label': t('compareOff'), title: t('compareOff'), onclick: toggleCompare }, '×'));
  }
  // этаж 1: «Atsisiųsti» финал (поле dl у последней версии: Google Диск или файл в бакете); нет dl — «Full HD ruošiame»
  function dlRow(vr) {
    var v = vr.rr.latest, s = stOf(vr.c.id, v.id);
    if (!v.dl) return h('div', { class: 'dlrow' }, h('span', { class: 'dl-wait', id: 'dl-wait', text: t('noHdLine') }));
    return h('div', { class: 'dlrow' },
      dlLink(vr.c, vr.r, v, { class: 'btn ghost sm dl-btn', id: 'dl-btn' }, [h('span', { class: 'dl-i', 'aria-hidden': 'true' }), t('downloadHd')]),
      isClient() && s && s.downloaded_at ? h('span', { class: 'dl-done', id: 'dl-done', text: t('downloadedMark') }) : null);
  }
  function changesBox(vr) {
    if (!vr.v.changes) return null;
    return foldable('chg|' + vr.c.id + '|' + vr.v.id, h('details', { class: 'changes', id: 'changes' },
      h('summary', { text: vr.i === 0 ? t('aboutFirst') : t('whatChanged', vr.v.label) }), h('p', { text: vr.v.changes })));
  }
  // patinka / nepatinka (этаж 3, анимации, голос): S.reactions[cid|item]
  function reactionOf(cid, item) { var x = S.reactions[cid + '|' + item]; return x && x.reaction ? x.reaction : null; }
  function react(cid, item, val, after) {
    withName(function () {
      var cur = reactionOf(cid, item), next = cur === val ? 'none' : val;
      S.backend.react(S.auth, cid, item, next, S.name).then(function (x) {
        if (x && x.reaction) S.reactions[cid + '|' + item] = x; else delete S.reactions[cid + '|' + item];
        if (after) after();
        toast(next === 'like' ? t('likedToast') : next === 'dislike' ? t('dislikedToast') : t('undone'));
      }).catch(function () { toast(t('err')); });
    });
  }
  function reactButtons(cid, item, idp, after) {
    var cur = reactionOf(cid, item);
    return h('div', { class: 'react', role: 'group' },
      h('button', { type: 'button', class: 'btn sm rb like', id: idp + '-like', 'aria-pressed': String(cur === 'like'), onclick: function () { react(cid, item, 'like', after); } }, t('like')),
      h('button', { type: 'button', class: 'btn sm rb dislike', id: idp + '-dislike', 'aria-pressed': String(cur === 'dislike'), onclick: function () { react(cid, item, 'dislike', after); } }, t('dislike')));
  }
  function decisionPanel(vr) {
    var s = stOf(vr.c.id, vr.v.id) || {}, box = h('section', { class: 'panel', id: 'decision' }), f = floorOf(vr.rr);
    if (!vr.latest) {
      var latest = vr.rr.latest;
      box.append(h('div', { class: 'verdict info' },
        h('p', { class: 'vt', text: t('olderVersion', vr.v.label) }),
        s.decision ? h('p', { class: 'vs', text: s.decision === 'approved' ? t('approvedLine', s.decided_by, fmtD(s.decided_at)) : t('changesLine', s.decided_by, fmtD(s.decided_at)) }) : null,
        h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn primary sm', id: 'to-latest', onclick: function () { switchVersion(latest, { t: 0 }); } }, t('toLatest', latest.label)))));
      return box;
    }
    if (f === 4) { box.append(h('div', { class: 'verdict info', id: 'verdict' }, h('p', { class: 'vt', text: t('archiveLine') }))); return box; }
    if (f === 3) {
      box.append(h('div', { class: 'draftbox', id: 'draft-react' }, h('p', { class: 'vt', text: t('draftQ') }),
        reactButtons(vr.c.id, vr.v.id, 'dr', function () { if (S.view === 'player') renderSide(); }),
        h('button', { type: 'button', class: 'linkbtn', id: 'draft-comment', onclick: function () { noteSheet(null, { title: t('draftComment') }); } }, t('draftComment'))));
      return box;
    }
    if (f === 1) {
      box.append(h('div', { class: 'verdict approved', id: 'verdict' },
        h('p', { class: 'vt', text: t('readyT') }),
        s.decision === 'approved' ? h('p', { class: 'vs', text: t('byWhen', s.decided_by, fmtD(s.decided_at)) }) : null,
        s.decision === 'approved' ? h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn ghost sm', id: 'btn-undo', onclick: function () { decide('none'); } }, t('undo'))) : null));
      return box;
    }
    // этаж 2: «Viskas gerai» → этаж 1; «Reikia pataisymų» — заметки
    var info = reelInfo(vr.rr);
    if (info.newVer) {
      box.append(h('div', { class: 'newver', id: 'newver' }, h('p', { class: 'vt', text: t('newVersionLine', vr.v.label) }),
        info.prevDecided ? h('p', { class: 'vs', text: t('oldDecisionLine', info.prevDecided.label) }) : null));
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
      h('button', { type: 'button', class: 'btn chg', id: 'btn-changes', onclick: function () { decide('changes'); } }, t('needChanges'))),
      h('p', { class: 'decide-sub', text: t('approveSub') }));
    return box;
  }
  function teamStatusPanel(vr) {
    var s = stOf(vr.c.id, vr.v.id) || {}, f = floorOf(vr.rr), re = reactionOf(vr.c.id, vr.v.id), rx = S.reactions[vr.c.id + '|' + vr.v.id];
    var lines = [
      h('li', { id: 'floor-line' }, h('span', { class: 'chip team', text: f ? f + ' · ' + t('floor' + f) : t('dirb') })),
      s.decision ? h('li', null, chip(vState(vr.c.id, vr.v.id)), h('span', { class: 'sl-by', text: t('byWhen', s.decided_by, fmtD(s.decided_at)) })) : null,
      s.seen_at ? h('li', { text: t('seenLine', s.seen_by, fmtD(s.seen_at), s.seen_pct) }) : null,
      re ? h('li', { id: 'react-line', text: (re === 'like' ? t('like') : t('dislike')) + ' · ' + t('byWhen', rx.reacted_by, fmtD(rx.reacted_at)) }) : null,
      f === 1 ? h('li', { class: 'dl-line' + (s.downloaded_at ? ' ok' : ''), id: 'dl-line', text: s.downloaded_at ? t('downloadedLine', s.downloaded_by, fmtD(s.downloaded_at)) : t('notDownloadedLine') }) : null
    ];
    return h('section', { class: 'panel', id: 'decision' }, h('h3', { text: t('clientDecision') + ' · ' + vr.v.label }), h('ul', { class: 'st-lines' }, lines));
  }
  function notesPanel(vr) {
    var mine = notesOf(vr.c.id, vr.v.id);
    var box = h('section', { class: 'panel', id: 'notes-panel' },
      h('h3', null, t('notes'), mine.length ? h('span', { class: 'chip seen count', text: String(mine.length) }) : null));
    if (mine.length) box.append(h('ul', { class: 'notes', id: 'notes' }, mine.map(function (n) { return noteItem(n, false); })));
    // пусто — ничего не пишем: под заголовком сразу «+ Bendra pastaba»
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

  window.KAB_APP = { state: S, version: '2026-11-27', dlHref: dlHref, dlName: dlName, SUB_LEVELS: SUB_LEVELS, SUB_STYLES: SUB_STYLES };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
