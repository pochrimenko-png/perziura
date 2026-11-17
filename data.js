/* 9×16 peržiūra — слой данных.
   Два хранилища с одинаковыми функциями:
   - local    — демо: каталог из manifest.example.json (или из массива в артефакте), заметки и отметки в localStorage этого браузера;
   - supabase — общая база проекта «9x16»: только функции kab_* (schema.sql), открытый ключ страницы, без секретов.
   Включается в config.js: backend: 'supabase' + supabaseUrl + supabaseKey. */
(function () {
  'use strict';

  var mem = {};
  var LS = {
    get: function (k) { try { var v = localStorage.getItem(k); return v === null ? (k in mem ? mem[k] : null) : v; } catch (e) { return k in mem ? mem[k] : null; } },
    set: function (k, v) { mem[k] = v; try { localStorage.setItem(k, v); } catch (e) { /* private mode: keep in memory */ } },
    del: function (k) { delete mem[k]; try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16);
    (window.crypto || window.msCrypto).getRandomValues(b);
    b[6] = b[6] & 15 | 64; b[8] = b[8] & 63 | 128;
    var h = Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }
  function now() { return new Date().toISOString(); }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // Плоский список версий (артефакт) → обычный манифест с проектами и роликами.
  function fromFlat(embed) {
    var c = clone(embed.client), byProj = {}, projects = [];
    (embed.projects || []).forEach(function (p) { var x = clone(p); x.reels = []; byProj[p.id] = x; projects.push(x); });
    var byReel = {};
    (embed.reels || []).forEach(function (r) {
      var x = { id: r.id, title: r.title, versions: [] };
      byReel[r.id] = x;
      (byProj[r.project] || projects[0]).reels.push(x);
    });
    (embed.videos || []).forEach(function (v) {
      var r = byReel[v.reel]; if (!r) return;
      var x = clone(v); delete x.reel; r.versions.push(x);
    });
    c.projects = projects;
    return { adminToken: embed.adminToken || '', clients: [c], demo: embed.demo || null };
  }

  function stripClient(c) {
    return { id: c.id, name: c.name, contact: c.contact || '', projects: c.projects || [] };
  }
  function findVersion(client, reelId, versionId) {
    var hit = null;
    (client.projects || []).forEach(function (p) {
      (p.reels || []).forEach(function (r) {
        if (r.id !== reelId) return;
        (r.versions || []).forEach(function (v) { if (v.id === versionId) hit = v; });
      });
    });
    return hit;
  }

  // ---------------- local (demo) ----------------
  function LocalBackend(manifest, storeKey) {
    this.m = manifest;
    this.key = 'kab_demo_' + (storeKey || 'v1');
    this.kind = 'local';
  }
  LocalBackend.prototype._db = function () {
    var db = null;
    try { db = JSON.parse(LS.get(this.key) || 'null'); } catch (e) { db = null; }
    if (!db || !db.notes || !db.statuses) {
      db = { notes: [], statuses: [] };
      var seed = this.m.demo || {};
      (seed.notes || []).forEach(function (n) { db.notes.push(Object.assign({ id: uuid(), side: 'client', device: 'seed', reply: null, reply_by: null, reply_at: null, fixed: false, fixed_at: null }, n)); });
      (seed.statuses || []).forEach(function (s) { db.statuses.push(Object.assign({}, s)); });
      this._save(db);
    }
    return db;
  };
  LocalBackend.prototype._save = function (db) { LS.set(this.key, JSON.stringify(db)); };
  LocalBackend.prototype.reset = function () { LS.del(this.key); };
  LocalBackend.prototype._client = function (auth) {
    var cs = this.m.clients || [];
    if (auth.kind === 'client') return cs.filter(function (c) { return c.token && c.token === auth.token; })[0] || null;
    if (auth.kind === 'demo') return cs[0] || null;
    return null;
  };
  LocalBackend.prototype._isAdmin = function (auth) {
    return auth.kind === 'admin' ? !!(this.m.adminToken && auth.token === this.m.adminToken) : (auth.kind === 'demo' && auth.role === 'team');
  };
  LocalBackend.prototype.load = function (auth) {
    var self = this, db = this._db(), dev = auth.device || '';
    var mark = function (n) { var x = clone(n); x.mine = !!(dev && x.device === dev); delete x.device; return x; };
    return delay(60).then(function () {
      if (self._isAdmin(auth)) {
        return { mode: 'team', clients: (self.m.clients || []).map(stripClient), notes: db.notes.map(mark), statuses: clone(db.statuses) };
      }
      var c = self._client(auth);
      if (!c) return { error: 'bad_token' };
      return {
        mode: 'client', clients: [stripClient(c)],
        notes: db.notes.filter(function (n) { return n.client_id === c.id; }).map(mark),
        statuses: db.statuses.filter(function (s) { return s.client_id === c.id; })
      };
    });
  };
  LocalBackend.prototype._allowed = function (auth, clientId) {
    if (this._isAdmin(auth)) return true;
    var c = this._client(auth);
    return !!(c && c.id === clientId);
  };
  LocalBackend.prototype._clientById = function (id) { return (this.m.clients || []).filter(function (c) { return c.id === id; })[0] || null; };
  LocalBackend.prototype.addNote = function (auth, n) {
    var db = this._db(), c = this._clientById(n.client_id);
    if (!this._allowed(auth, n.client_id) || !c) return Promise.reject(new Error('forbidden'));
    if (!findVersion(c, n.reel_id, n.version_id)) return Promise.reject(new Error('no_version'));
    var body = String(n.body || '').trim().slice(0, 4000), author = String(n.author || '').trim().slice(0, 80);
    if (!body || !author) return Promise.reject(new Error('empty'));
    var rec = {
      id: uuid(), client_id: n.client_id, reel_id: n.reel_id, version_id: n.version_id,
      t: n.t == null ? null : Math.round(n.t * 100) / 100, body: body, author: author,
      side: this._isAdmin(auth) ? 'team' : 'client', device: auth.device || '',
      reply: null, reply_by: null, reply_at: null, fixed: false, fixed_at: null, created_at: now()
    };
    db.notes.push(rec); this._save(db);
    var out = clone(rec); out.mine = true; delete out.device;
    return delay(120).then(function () { return out; });
  };
  LocalBackend.prototype.deleteNote = function (auth, id) {
    var db = this._db(), admin = this._isAdmin(auth), self = this;
    var n = db.notes.filter(function (x) { return x.id === id; })[0];
    if (!n) return Promise.resolve(true);
    var own = n.device && n.device === auth.device && !n.reply && self._allowed(auth, n.client_id);
    if (!admin && !own) return Promise.reject(new Error('forbidden'));
    db.notes = db.notes.filter(function (x) { return x.id !== id; }); this._save(db);
    return delay(60).then(function () { return true; });
  };
  LocalBackend.prototype.setStatus = function (auth, clientId, reelId, versionId, patch) {
    var db = this._db(), c = this._clientById(clientId);
    if (!this._allowed(auth, clientId) || this._isAdmin(auth) || !c) return Promise.reject(new Error('forbidden'));
    if (!findVersion(c, reelId, versionId)) return Promise.reject(new Error('no_version'));
    var s = db.statuses.filter(function (x) { return x.client_id === clientId && x.version_id === versionId; })[0];
    if (!s) { s = { client_id: clientId, version_id: versionId, seen_at: null, seen_by: null, seen_pct: null, decision: null, decided_by: null, decided_at: null }; db.statuses.push(s); }
    var by = String(patch.by || '').slice(0, 80) || null;
    if (patch.seenPct != null) {
      if (!s.seen_at) { s.seen_at = now(); s.seen_by = by; }
      s.seen_pct = Math.max(s.seen_pct || 0, Math.min(100, Math.round(patch.seenPct)));
    }
    if (patch.decision === 'approved' || patch.decision === 'changes') { s.decision = patch.decision; s.decided_by = by; s.decided_at = now(); }
    else if (patch.decision === 'none') { s.decision = null; s.decided_by = null; s.decided_at = null; }
    this._save(db);
    return delay(90).then(function () { return clone(s); });
  };
  LocalBackend.prototype._adminNote = function (auth, id, fn) {
    if (!this._isAdmin(auth)) return Promise.reject(new Error('forbidden'));
    var db = this._db(), n = db.notes.filter(function (x) { return x.id === id; })[0];
    if (!n) return Promise.reject(new Error('no_note'));
    fn(n); this._save(db);
    var out = clone(n); out.mine = !!(auth.device && n.device === auth.device); delete out.device;
    return delay(90).then(function () { return out; });
  };
  LocalBackend.prototype.reply = function (auth, id, text, by) {
    return this._adminNote(auth, id, function (n) {
      var t = String(text || '').trim().slice(0, 4000);
      n.reply = t || null; n.reply_by = t ? String(by || '').slice(0, 80) : null; n.reply_at = t ? now() : null;
    });
  };
  LocalBackend.prototype.setFixed = function (auth, id, fixed) {
    return this._adminNote(auth, id, function (n) { n.fixed = !!fixed; n.fixed_at = fixed ? now() : null; });
  };

  // ---------------- supabase ----------------
  function SupabaseBackend(url, key) {
    this.url = String(url || '').replace(/\/+$/, '');
    this.key = key;
    this.kind = 'supabase';
  }
  SupabaseBackend.prototype.rpc = function (fn, body) {
    var self = this;
    return fetch(self.url + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      headers: { apikey: self.key, Authorization: 'Bearer ' + self.key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) return r.text().then(function (t) { throw new Error('http_' + r.status + ' ' + t.slice(0, 200)); });
      return r.json();
    }).then(function (j) {
      if (j && j.error) throw new Error(j.error);
      return j;
    });
  };
  SupabaseBackend.prototype.load = function (auth) {
    if (auth.kind === 'admin') return this.rpc('kab_admin_state', { p_token: auth.token }).catch(function (e) { return e.message === 'bad_token' ? { error: 'bad_token' } : Promise.reject(e); });
    if (auth.kind !== 'client') return Promise.resolve({ error: 'bad_token' });
    return this.rpc('kab_state', { p_token: auth.token, p_device: auth.device || '' }).catch(function (e) { return e.message === 'bad_token' ? { error: 'bad_token' } : Promise.reject(e); });
  };
  SupabaseBackend.prototype.addNote = function (auth, n) {
    if (auth.kind === 'admin') {
      return this.rpc('kab_admin_note_add', { p_token: auth.token, p_client_id: n.client_id, p_reel_id: n.reel_id, p_version_id: n.version_id, p_t: n.t, p_body: n.body, p_author: n.author });
    }
    return this.rpc('kab_note_add', { p_token: auth.token, p_reel_id: n.reel_id, p_version_id: n.version_id, p_t: n.t, p_body: n.body, p_author: n.author, p_device: auth.device || '' });
  };
  SupabaseBackend.prototype.deleteNote = function (auth, id) {
    if (auth.kind === 'admin') return this.rpc('kab_admin_note_delete', { p_token: auth.token, p_note_id: id });
    return this.rpc('kab_note_delete', { p_token: auth.token, p_note_id: id, p_device: auth.device || '' });
  };
  SupabaseBackend.prototype.setStatus = function (auth, clientId, reelId, versionId, patch) {
    return this.rpc('kab_status_set', {
      p_token: auth.token, p_reel_id: reelId, p_version_id: versionId,
      p_seen_pct: patch.seenPct == null ? null : Math.round(patch.seenPct),
      p_decision: patch.decision || null, p_by: patch.by || ''
    });
  };
  SupabaseBackend.prototype.reply = function (auth, id, text, by) {
    return this.rpc('kab_admin_reply', { p_token: auth.token, p_note_id: id, p_reply: text || '', p_by: by || '' });
  };
  SupabaseBackend.prototype.setFixed = function (auth, id, fixed) {
    return this.rpc('kab_admin_fixed', { p_token: auth.token, p_note_id: id, p_fixed: !!fixed });
  };

  window.KAB_DATA = {
    LS: LS, uuid: uuid, fromFlat: fromFlat,
    local: function (manifest, storeKey) { return new LocalBackend(manifest, storeKey); },
    supabase: function (url, key) { return new SupabaseBackend(url, key); }
  };
})();
