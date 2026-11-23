    /* =========================================================================
       ONLINE: real accounts, rooms, live moves, chat and ranked Elo.
       - With src/online.json filled in (Supabase project address + public key) the hub goes online.
       - Without it, NET.on stays false and everything works offline against bots, exactly as before.
       - localStorage.ps_net_local = '1' switches on a stand-in service that links the browser tabs of
         one computer. It is only for testing; real players never see it.
       Every game talks to NET only, never to Supabase directly:
         NET.start() · NET.me · NET.setName(name, avatar)
         NET.chatHistory(room) · NET.chatSend(room, text) · NET.chatSub(room, fn) · NET.report(id, why)
         NET.onOnline(fn)  (live count of people online)
         NET.quickMatch(game, settings) · NET.enterRoom(code, game, settings) · NET.watchRoom(code, fn)
         NET.sendMove(code, move, index) · NET.ping(code) · NET.reportResult(code, result) · NET.leave(code)
         NET.openRooms() · NET.leaderboard(game) · NET.rating(game) · NET.profileOf(id)
       ========================================================================= */
    const NET = { on: false, mode: 'off', me: null, count: 0, _cbs: [] };
    (function setupNet() {
      const cfg = window.PS_ONLINE || {};
      const local = (() => { try { return localStorage.getItem('ps_net_local') === '1'; } catch (e) { return false; } })();
      const K = 32;
      const eloDelta = (ra, rb, score) => Math.round(K * (score - 1 / (1 + Math.pow(10, (rb - ra) / 400))));
      const scoreOf = (r) => (r === 'win' ? 1 : r === 'draw' ? 0.5 : 0);
      const flip = (r) => (r === 'win' ? 'loss' : r === 'loss' ? 'win' : 'draw');
      const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const newCode = () => Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
      // the chat word filter (the service runs the same filter, this one just saves a round trip)
      const BAD = ['fuck', 'shit', 'bitch', 'cunt', 'nigg', 'fag', 'retard', 'whore', 'slut', 'dick', 'pussy', 'kys'];
      // swear filter + privacy: email addresses and phone numbers typed into chat are hidden from everyone
      NET.clean = (t) => BAD.reduce((s, w) => s.replace(new RegExp(w + '\\w*', 'gi'), (m) => '*'.repeat(m.length)), String(t))
        .replace(/[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}/gi, '[email hidden]')
        .replace(/\+?\d[\d\s().-]{8,}\d/g, (m) => (m.replace(/\D/g, '').length >= 9 ? '[number hidden]' : m));
      NET.onOnline = (fn) => { NET._cbs.push(fn); fn(NET.count); };
      const setCount = (n) => { NET.count = n; NET._cbs.forEach((f) => { try { f(n); } catch (e) {} }); };

      /* ================= the stand-in service (tests only): tabs of one computer ================= */
      function localBackend() {
        const KEY = 'psnet_db', bc = 'BroadcastChannel' in window ? new BroadcastChannel('psnet') : null;
        // tabs opened from this one (tests open them with window.open) share ONE copy of the data in memory, so
        // nothing is lost between tabs; other tabs fall back to localStorage
        const hub = (() => { try { if (window.opener && window.opener.__psnet) { window.opener.__psnet.used = true; return window.opener.__psnet; } } catch (e) {} return null; })() || (window.__psnet = { d: null, used: false });
        const load = () => { if (hub.used && hub.d) return JSON.parse(JSON.stringify(hub.d)); try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
        const db = () => { const d = load(); d.profiles = d.profiles || {}; d.ratings = d.ratings || {}; d.rooms = d.rooms || {}; d.messages = d.messages || []; d.seq = d.seq || 0; return d; };
        const save = (d, note) => { hub.d = JSON.parse(JSON.stringify(d)); localStorage.setItem(KEY, JSON.stringify(d)); if (bc) bc.postMessage(note || {}); fire(note || {}); };
        const subs = new Set(); const fire = (n) => subs.forEach((f) => { try { f(n); } catch (e) {} });
        if (bc) bc.onmessage = (e) => fire(e.data || {});
        window.addEventListener('storage', (e) => { if (e.key === KEY) fire({}); });
        let uid; try { uid = sessionStorage.getItem('psnet_uid'); if (!uid) { uid = 'u' + Math.random().toString(36).slice(2, 10); sessionStorage.setItem('psnet_uid', uid); } } catch (e) { uid = 'u' + Math.random().toString(36).slice(2, 10); }
        const now = () => Date.now();
        const room = (d, code) => { const r = d.rooms[code]; if (!r) throw new Error('No room with that code.'); return r; };
        const B = {
          async start() { const email = sessionStorage.getItem('psnet_email'); return { id: uid, guest: !email, email }; },
          // accounts on the stand-in: email -> { pw, uid } in the shared test data
          async upgrade(email, pw) { const d = db(); d.users = d.users || {}; if (d.users[email]) return { error: 'That email already has an account. Log in instead.' }; d.users[email] = { pw, uid }; save(d); sessionStorage.setItem('psnet_email', email); return {}; },
          async signIn(email, pw) { const d = db(); const u = (d.users || {})[email]; if (!u || u.pw !== pw) return { error: 'Wrong email or password.' }; sessionStorage.setItem('psnet_uid', u.uid); sessionStorage.setItem('psnet_email', email); return { reload: true }; },
          async google() { return { error: 'Google sign-in only works on the real site.' }; },
          async reset() { return {}; },
          async setPassword() { return {}; },
          async signOut() { sessionStorage.removeItem('psnet_uid'); sessionStorage.removeItem('psnet_email'); return { reload: true }; },
          async loadSave() { const d = db(); return (d.saves || {})[uid] || null; },
          async pushSave(data) { const d = db(); d.saves = d.saves || {}; d.saves[uid] = { data, updated: Date.now() }; save(d); },
          async setName(name, avatar) {
            const d = db(); const taken = Object.entries(d.profiles).some(([id, p]) => id !== uid && p.name.toLowerCase() === name.toLowerCase());
            if (taken) return { error: 'taken' };
            d.profiles[uid] = { name, avatar }; save(d, { k: 'p' }); return {};
          },
          async history(roomId) { const d = db(); return d.messages.filter((m) => m.room === roomId).slice(-50).map((m) => ({ ...m, name: (d.profiles[m.uid] || {}).name || '?', avatar: (d.profiles[m.uid] || {}).avatar || '🙂' })); },
          async send(roomId, text) {
            const d = db(); const recent = d.messages.filter((m) => m.uid === uid && now() - m.at < 10000).length;
            if (recent >= 5) throw new Error('Slow down a little!');
            const m = { id: ++d.seq, room: roomId, uid, text: NET.clean(text), at: now() }; d.messages.push(m); d.messages = d.messages.slice(-500); save(d, { k: 'msg', room: roomId });
          },
          sub(roomId, fn) {
            let last = (db().messages.slice(-1)[0] || { id: 0 }).id;
            const f = (n) => { if (n.k && n.k !== 'msg') return; const d = db(); d.messages.filter((m) => m.room === roomId && m.id > last).forEach((m) => { last = m.id; fn({ ...m, name: (d.profiles[m.uid] || {}).name || '?', avatar: (d.profiles[m.uid] || {}).avatar || '🙂' }); }); };
            subs.add(f); return () => subs.delete(f);
          },
          async report() {},
          presence() {
            const beat = () => { try { const p = JSON.parse(localStorage.getItem('psnet_pres') || '{}'); p[uid] = now(); Object.keys(p).forEach((k) => { if (now() - p[k] > 20000) delete p[k]; }); localStorage.setItem('psnet_pres', JSON.stringify(p)); NET.onlineIds = new Set(Object.keys(p)); setCount(Object.keys(p).length); } catch (e) {} };
            beat(); setInterval(beat, 5000);
          },
          async create(game, settings, pub, code) {
            const d = db(); let c = (code || '').toUpperCase();
            if (!/^[A-Z0-9]{4,6}$/.test(c) || (d.rooms[c] && d.rooms[c].status !== 'done')) c = newCode();
            d.rooms[c] = { code: c, game, settings: settings || {}, is_public: !!pub, host: uid, guest: null, first: null, status: 'waiting', moves: [], host_seen: now(), guest_seen: null, created_at: now() };
            save(d, { k: 'room', code: c }); return d.rooms[c];
          },
          async join(code) {
            const d = db(); const r = room(d, code.toUpperCase());
            if (r.host === uid || r.guest === uid) return r;
            if (r.guest) throw new Error('That room is already full.');
            if (r.status !== 'waiting') throw new Error('That game is already over.');
            r.guest = uid; r.status = 'playing'; r.guest_seen = now(); r.first = Math.random() < 0.5 ? r.host : uid;
            save(d, { k: 'room', code: r.code }); return r;
          },
          async quick(game, settings) {
            const d = db();
            const r = Object.values(d.rooms).filter((x) => x.game === game && x.is_public && x.status === 'waiting' && !x.guest && x.host !== uid && now() - x.host_seen < 30000).sort((a, b) => a.created_at - b.created_at)[0];
            if (r) return B.join(r.code);
            Object.values(d.rooms).forEach((x) => { if (x.host === uid && x.status === 'waiting') x.status = 'done'; }); save(d);
            return B.create(game, settings, true);
          },
          async get(code) { return db().rooms[code] || null; },
          // a live channel for one table: instant messages + who is here (BroadcastChannel between tabs)
          channel(name, meta) {
            const bch = new BroadcastChannel('np:' + name), hs = {}, here = {}; let pres = () => {}, dead = false;
            const list = () => Object.entries(here).filter(([, x]) => x.id === uid || now() - x.last < 5000).map(([id, x]) => ({ uid: id, ...x.meta }));
            const upd = () => { const l = list(); pres(l); };
            here[uid] = { id: uid, last: now(), meta };
            bch.onmessage = (ev) => { const m = ev.data || {}; if (dead) return;
              if (m.e === '_here') { const was = !!here[m.from]; here[m.from] = { last: now(), meta: m.d }; if (!was) { upd(); bch.postMessage({ e: '_here', d: meta, from: uid }); } return; }
              if (m.e === '_bye') { delete here[m.from]; upd(); return; }
              const h = hs[m.e]; if (h) h(m.d, m.from); };
            const beat = setInterval(() => { if (dead) return; bch.postMessage({ e: '_here', d: meta, from: uid }); const before = Object.keys(here).length; Object.keys(here).forEach((k) => { if (k !== uid && now() - here[k].last > 5000) delete here[k]; }); if (Object.keys(here).length !== before) upd(); }, 1500);
            bch.postMessage({ e: '_here', d: meta, from: uid }); setTimeout(upd, 0);
            return { ready: Promise.resolve(), send: async (e, d) => { if (!dead) bch.postMessage({ e, d, from: uid }); }, on: (e, f) => { hs[e] = f; }, presence: (f) => { pres = f; upd(); },
              close: () => { if (dead) return; bch.postMessage({ e: '_bye', from: uid }); dead = true; clearInterval(beat); bch.close(); } };
          },
          watch(code, fn) { let last = ''; const f = () => { const r = db().rooms[code]; if (!r) return; const s = JSON.stringify(r); if (s !== last) { last = s; fn(r); } }; subs.add(f); f(); return () => subs.delete(f); },
          async move(code, mv, idx) {
            const d = db(); const r = room(d, code);
            if (r.host !== uid && r.guest !== uid) throw new Error('Not your room.');
            if (r.status !== 'playing') throw new Error('The game is not running.');
            if (idx !== r.moves.length) throw new Error('out of sync');
            if ((mv.t || 'move') === 'move') {
              const n = r.moves.filter((x) => (x.t || 'move') === 'move').length;
              const expect = n % 2 === 0 ? r.first : r.first === r.host ? r.guest : r.host;
              if (uid !== expect) throw new Error('Not your turn.');
            }
            r.moves.push({ ...mv, by: uid, n: r.moves.length }); save(d, { k: 'room', code }); return r.moves.length;
          },
          async ping(code) { const d = db(); const r = d.rooms[code]; if (!r) return; if (r.host === uid) r.host_seen = now(); else if (r.guest === uid) r.guest_seen = now(); save(d, { k: 'room', code }); },
          async leave(code) { const d = db(); const r = d.rooms[code]; if (r && r.host === uid && r.status === 'waiting') { r.status = 'done'; save(d, { k: 'room', code }); } },
          async result(code, res) {
            const d = db(); const r = room(d, code);
            if (r.status === 'done') return { ...(r.result || {}), final: true };
            if (r.host === uid) r.host_report = res; else if (r.guest === uid) r.guest_report = res; else throw new Error('Not your game.');
            let hr = r.host_report, gr = r.guest_report;
            const away = (t) => !t || now() - t > 60000;
            if (hr && gr) { if (!(hr === flip(gr))) { r.status = 'done'; r.result = { disputed: true }; save(d, { k: 'room', code }); return { final: true, disputed: true }; } }
            else if (hr && (hr === 'loss' || away(r.guest_seen))) gr = flip(hr);
            else if (gr && (gr === 'loss' || away(r.host_seen))) hr = flip(gr);
            else { save(d, { k: 'room', code }); return { final: false }; }
            const key = (u) => u + ':' + r.game, rt = (u) => (d.ratings[key(u)] = d.ratings[key(u)] || { elo: 1200, games: 0, wins: 0, losses: 0, draws: 0 });
            const a = rt(r.host), b = rt(r.guest), ra = a.elo, rb = b.elo;
            const dl = r.is_public ? eloDelta(ra, rb, scoreOf(hr)) : 0;
            if (r.is_public) { a.elo += dl; b.elo -= dl; [[a, hr], [b, gr]].forEach(([x, rr]) => { x.games++; x[rr === 'win' ? 'wins' : rr === 'loss' ? 'losses' : 'draws']++; }); }
            r.status = 'done'; r.result = { host: hr, delta_host: dl, host_elo: a.elo, guest_elo: b.elo, ranked: r.is_public };
            save(d, { k: 'room', code }); return { ...r.result, final: true };
          },
          async openRooms() { const d = db(); return Object.values(d.rooms).filter((x) => x.is_public && x.status === 'waiting' && x.host !== uid && now() - x.host_seen < 30000).map((x) => ({ code: x.code, game: x.game, name: (d.profiles[x.host] || {}).name || '?', avatar: (d.profiles[x.host] || {}).avatar || '🙂', elo: (d.ratings[x.host + ':' + x.game] || {}).elo || 1200 })); },
          async leaderboard(game) { const d = db(); return Object.entries(d.ratings).filter(([k]) => k.endsWith(':' + game)).map(([k, v]) => ({ id: k.split(':')[0], ...v, name: (d.profiles[k.split(':')[0]] || {}).name || '?', avatar: (d.profiles[k.split(':')[0]] || {}).avatar || '🙂' })).sort((a, b) => b.elo - a.elo).slice(0, 50); },
          async rating(game) { return (db().ratings[uid + ':' + game] || { elo: 1200, games: 0 }); },
          async profileOf(id) { const p = db().profiles[id]; return p || { name: 'Player', avatar: '🙂' }; },
          /* friends (stand-in) */
          async searchPlayers(q) { q = String(q || '').trim().toLowerCase(); if (q.length < 2) return []; const d = db(); return Object.entries(d.profiles).filter(([, p]) => p.name.toLowerCase().includes(q)).slice(0, 20).map(([id, p]) => ({ id, name: p.name, avatar: p.avatar })); },
          async playerCard(id) {
            const d = db(), p = d.profiles[id]; if (!p) return null; const fr = d.friends || [];
            const rel = id === uid ? 'me' : fr.some((f) => f.status === 'accepted' && ((f.from === uid && f.to === id) || (f.from === id && f.to === uid))) ? 'friends' : fr.some((f) => f.from === uid && f.to === id) ? 'sent' : fr.some((f) => f.from === id && f.to === uid) ? 'asked' : 'none';
            const ratings = Object.entries(d.ratings).filter(([k, v]) => k.startsWith(id + ':') && v.games > 0).map(([k, v]) => ({ game: k.split(':')[1], elo: v.elo, games: v.games, wins: v.wins })).sort((a, b) => b.elo - a.elo);
            return { id, name: p.name, avatar: p.avatar, since: 'Nov 2026', ratings, friend: rel };
          },
          async friends() {
            const d = db(), fr = d.friends || [], pr = (id) => ({ id, name: (d.profiles[id] || {}).name || 'Player', avatar: (d.profiles[id] || {}).avatar || '🙂' });
            return { friends: fr.filter((f) => f.status === 'accepted' && (f.from === uid || f.to === uid)).map((f) => pr(f.from === uid ? f.to : f.from)),
              incoming: fr.filter((f) => f.status === 'pending' && f.to === uid).map((f) => pr(f.from)), outgoing: fr.filter((f) => f.status === 'pending' && f.from === uid).map((f) => pr(f.to)) };
          },
          async addFriend(id) { const d = db(); d.friends = d.friends || []; const back = d.friends.find((f) => f.from === id && f.to === uid); if (back) back.status = 'accepted'; else if (!d.friends.some((f) => f.from === uid && f.to === id)) d.friends.push({ from: uid, to: id, status: 'pending', at: now() }); save(d, { k: 'fr' }); },
          async acceptFriend(id) { const d = db(); (d.friends || []).forEach((f) => { if (f.from === id && f.to === uid) f.status = 'accepted'; }); save(d, { k: 'fr' }); },
          async removeFriend(id) { const d = db(); d.friends = (d.friends || []).filter((f) => !((f.from === uid && f.to === id) || (f.from === id && f.to === uid))); save(d, { k: 'fr' }); },
          async dmHistory(id) { const d = db(); return (d.dms || []).filter((m) => (m.from === uid && m.to === id) || (m.from === id && m.to === uid)).slice(-60); },
          async dmSend(id, text) {
            const d = db(), ok2 = (d.friends || []).some((f) => f.status === 'accepted' && ((f.from === uid && f.to === id) || (f.from === id && f.to === uid)));
            if (!ok2) throw new Error('You can only message friends.');
            d.dms = d.dms || []; d.seq = (d.seq || 0) + 1; d.dms.push({ id: d.seq, from: uid, to: id, text: NET.clean(text).slice(0, 300), at: now() }); save(d, { k: 'dm' });
          },
          onSocial(fn) {
            let last = ((db().dms || []).slice(-1)[0] || { id: 0 }).id, frKey = JSON.stringify(db().friends || []);
            const f = (n) => { if (n.k && !['dm', 'fr'].includes(n.k)) return; const d = db();
              (d.dms || []).filter((m) => m.id > last).forEach((m) => { last = m.id; if (m.to === uid) fn({ type: 'dm', id: m.id, from: m.from, text: m.text, at: m.at }); });
              const k = JSON.stringify(d.friends || []); if (k !== frKey) { frKey = k; fn({ type: 'fr' }); } };
            subs.add(f); return () => subs.delete(f);
          },
        };
        return B;
      }

      /* ================= Supabase (the real service) ================= */
      function supaBackend() {
        let sb, uid;
        const err = (e) => { const m = (e && (e.message || e.error_description)) || String(e); return new Error(/full/.test(m) ? 'That room is already full.' : /no such room/.test(m) ? 'No room with that code.' : /over/.test(m) ? 'That game is already over.' : /slow/i.test(m) ? 'Slow down a little!' : m); };
        const ok = ({ data, error }) => { if (error) throw err(error); return data; };
        const withP = (rows) => rows.map((m) => ({ id: m.id, room: m.room, uid: m.user_id, text: m.text, at: Date.parse(m.created_at), name: (m.profiles || {}).name || '?', avatar: (m.profiles || {}).avatar || '🙂' }));
        const pcache = {};
        const B = {
          async start() {
            await new Promise((res, rej) => {
              if (window.supabase && window.supabase.createClient) return res();
              const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js';
              s.onload = res; s.onerror = () => rej(new Error('Could not load the online service.')); document.head.appendChild(s);
            });
            sb = window.supabase.createClient(cfg.url, cfg.key, { auth: { persistSession: true, autoRefreshToken: true } });
            let { data } = await sb.auth.getSession();
            if (!data.session) { const r = await sb.auth.signInAnonymously(); if (r.error) throw err(r.error); data = r.data; }
            const user = (data.session || data).user;
            uid = user.id;
            sb.auth.onAuthStateChange((ev) => { if (ev === 'PASSWORD_RECOVERY' && NET.onRecovery) NET.onRecovery(); });
            return { id: uid, guest: !!user.is_anonymous || !user.email, email: user.email || null };
          },
          // a guest becomes a real account: same player, same progress and ratings
          async upgrade(email, pw) {
            const { data, error } = await sb.auth.updateUser({ email, password: pw });
            if (error) return { error: /already|registered|exists/i.test(error.message) ? 'That email already has an account. Log in instead.' : /password/i.test(error.message) ? 'Pick a longer password (at least 8 characters).' : error.message };
            return { pending: !!(data && data.user && data.user.new_email && !data.user.email) };
          },
          async signIn(email, pw) {
            const { error } = await sb.auth.signInWithPassword({ email, password: pw });
            if (error) return { error: /invalid|credentials/i.test(error.message) ? 'Wrong email or password.' : /confirm/i.test(error.message) ? 'Please confirm your email first (check your inbox).' : error.message };
            return { reload: true };
          },
          async google(link) {
            if (location.protocol === 'file:') return { error: 'Google sign-in works once the site is on its web address.' };
            const opts = { provider: 'google', options: { redirectTo: location.origin + location.pathname } };
            const { error } = link ? await sb.auth.linkIdentity(opts) : await sb.auth.signInWithOAuth(opts);
            if (error) return { error: /already/i.test(error.message) ? 'That Google account already has a GameHub account. Use Log in.' : error.message };
            return { redirect: true };
          },
          async reset(email) { const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }); return error ? { error: error.message } : {}; },
          async setPassword(pw) { const { error } = await sb.auth.updateUser({ password: pw }); return error ? { error: error.message } : {}; },
          async signOut() { await sb.auth.signOut(); return { reload: true }; },
          async loadSave() { const r = ok(await sb.from('saves').select('data,updated_at').eq('user_id', uid).maybeSingle()); return r ? { data: r.data, updated: Date.parse(r.updated_at) } : null; },
          async pushSave(data) { ok(await sb.from('saves').upsert({ user_id: uid, data, updated_at: new Date().toISOString() })); },
          async setName(name, avatar) {
            const { error } = await sb.from('profiles').upsert({ id: uid, name, avatar });
            if (error) return { error: /duplicate|unique/i.test(error.message) ? 'taken' : error.message };
            pcache[uid] = { name, avatar }; return {};
          },
          async history(room) { return withP(ok(await sb.from('messages').select('id,room,user_id,text,created_at,profiles(name,avatar)').eq('room', room).order('id', { ascending: false }).limit(50)).reverse()); },
          async send(room, text) { ok(await sb.from('messages').insert({ room, user_id: uid, text })); },
          sub(room, fn) {
            const ch = sb.channel('chat:' + room).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room=eq.${room}` }, async (p) => {
              const m = p.new; const pr = await B.profileOf(m.user_id);
              fn({ id: m.id, room: m.room, uid: m.user_id, text: m.text, at: Date.parse(m.created_at), name: pr.name, avatar: pr.avatar });
            }).subscribe();
            return () => sb.removeChannel(ch);
          },
          async report(id, reason) { ok(await sb.from('reports').insert({ message_id: id, reason })); },
          presence() {
            const ch = sb.channel('lobby', { config: { presence: { key: uid } } });
            ch.on('presence', { event: 'sync' }, () => { const ids = Object.keys(ch.presenceState()); NET.onlineIds = new Set(ids); setCount(ids.length); }).subscribe((st) => { if (st === 'SUBSCRIBED') ch.track({ at: Date.now() }); });
          },
          async create(game, settings, pub, code) { return ok(await sb.rpc('create_room', { p_game: game, p_settings: settings || {}, p_public: !!pub, p_code: code || null })); },
          async join(code) { return ok(await sb.rpc('join_room', { p_code: code.toUpperCase() })); },
          async quick(game, settings) { return ok(await sb.rpc('quick_match', { p_game: game, p_settings: settings || {} })); },
          async get(code) { const r = ok(await sb.from('rooms').select('*').eq('code', code).maybeSingle()); return r; },
          // a live channel for one table: instant messages (broadcast) + who is here (presence); no database rows
          channel(name, meta) {
            const ch = sb.channel('np:' + name, { config: { broadcast: { self: false }, presence: { key: uid } } }), hs = {};
            let pres = () => {}, dead = false;
            const list = () => { const st = ch.presenceState(); return Object.keys(st).map((k) => ({ uid: k, ...(st[k][0] || {}) })); };
            ch.on('broadcast', { event: 'm' }, ({ payload }) => { if (dead || !payload) return; const h = hs[payload.e]; if (h) h(payload.d, payload.from); });
            ch.on('presence', { event: 'sync' }, () => { if (!dead) pres(list()); });
            const ready = new Promise((res) => ch.subscribe((st) => { if (st === 'SUBSCRIBED') { ch.track(meta); res(); } }));
            return { ready, send: (e, d) => ready.then(() => ch.send({ type: 'broadcast', event: 'm', payload: { e, d, from: uid } })), on: (e, f) => { hs[e] = f; }, presence: (f) => { pres = f; },
              close: () => { if (dead) return; dead = true; try { ch.untrack(); } catch (e) {} setTimeout(() => sb.removeChannel(ch), 300); } };
          },
          watch(code, fn) {
            const conv = (r) => ({ ...r, host_seen: Date.parse(r.host_seen) || 0, guest_seen: Date.parse(r.guest_seen) || 0 });
            const ch = sb.channel('room:' + code).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${code}` }, (p) => fn(conv(p.new))).subscribe();
            B.get(code).then((r) => { if (r) fn(conv(r)); });
            return () => sb.removeChannel(ch);
          },
          async move(code, mv, idx) { return ok(await sb.rpc('add_move', { p_code: code, p_move: mv, p_index: idx })); },
          async ping(code) { await sb.rpc('room_ping', { p_code: code }); },
          async leave(code) { await sb.rpc('leave_room', { p_code: code }); },
          async result(code, res) { return ok(await sb.rpc('report_result', { p_code: code, p_result: res })); },
          async openRooms() { return ok(await sb.rpc('open_rooms')) || []; },
          async leaderboard(game) { return (ok(await sb.from('ratings').select('user_id,elo,games,wins,losses,draws,profiles(name,avatar)').eq('game', game).gt('games', 0).order('elo', { ascending: false }).limit(50)) || []).map((r) => ({ id: r.user_id, elo: r.elo, games: r.games, wins: r.wins, losses: r.losses, draws: r.draws, name: (r.profiles || {}).name || '?', avatar: (r.profiles || {}).avatar || '🙂' })); },
          async rating(game) { return ok(await sb.from('ratings').select('elo,games').eq('user_id', uid).eq('game', game).maybeSingle()) || { elo: 1200, games: 0 }; },
          async profileOf(id) { if (pcache[id]) return pcache[id]; const p = ok(await sb.from('profiles').select('name,avatar').eq('id', id).maybeSingle()) || { name: 'Player', avatar: '🙂' }; pcache[id] = p; return p; },
          /* friends (backend/friends.sql) */
          async searchPlayers(q) { if (String(q || '').trim().length < 2) return []; return ok(await sb.rpc('search_players', { q: String(q).trim() })) || []; },
          async playerCard(id) { return ok(await sb.rpc('player_card', { p_id: id })); },
          async friends() {
            const rows = ok(await sb.from('friend_requests').select('from_id,to_id,status')) || [];
            const pr = async (id) => Object.assign({ id }, await B.profileOf(id));
            const pick = async (list) => Promise.all(list.map(pr));
            return { friends: await pick(rows.filter((f) => f.status === 'accepted').map((f) => (f.from_id === uid ? f.to_id : f.from_id))),
              incoming: await pick(rows.filter((f) => f.status === 'pending' && f.to_id === uid).map((f) => f.from_id)),
              outgoing: await pick(rows.filter((f) => f.status === 'pending' && f.from_id === uid).map((f) => f.to_id)) };
          },
          async addFriend(id) {
            const back = ok(await sb.from('friend_requests').select('status').eq('from_id', id).eq('to_id', uid).maybeSingle());
            if (back) { ok(await sb.from('friend_requests').update({ status: 'accepted' }).eq('from_id', id).eq('to_id', uid)); return; }
            const r = await sb.from('friend_requests').insert({ from_id: uid, to_id: id }); if (r.error && !/duplicate/i.test(r.error.message)) throw err(r.error);
          },
          async acceptFriend(id) { ok(await sb.from('friend_requests').update({ status: 'accepted' }).eq('from_id', id).eq('to_id', uid)); },
          async removeFriend(id) { ok(await sb.from('friend_requests').delete().or(`and(from_id.eq.${uid},to_id.eq.${id}),and(from_id.eq.${id},to_id.eq.${uid})`)); },
          async dmHistory(id) {
            const rows = ok(await sb.from('dms').select('id,from_id,to_id,text,created_at').or(`and(from_id.eq.${uid},to_id.eq.${id}),and(from_id.eq.${id},to_id.eq.${uid})`).order('id', { ascending: false }).limit(60)) || [];
            return rows.reverse().map((m) => ({ id: m.id, from: m.from_id, to: m.to_id, text: m.text, at: Date.parse(m.created_at) }));
          },
          async dmSend(id, text) { const r = await sb.from('dms').insert({ from_id: uid, to_id: id, text }); if (r.error) throw new Error(/row-level|policy/i.test(r.error.message) ? 'You can only message friends.' : /slow/i.test(r.error.message) ? 'Slow down a little!' : r.error.message); },
          onSocial(fn) {
            const ch = sb.channel('social:' + uid)
              .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dms', filter: `to_id=eq.${uid}` }, (p) => fn({ type: 'dm', id: p.new.id, from: p.new.from_id, text: p.new.text, at: Date.parse(p.new.created_at) }))
              .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests', filter: `to_id=eq.${uid}` }, () => fn({ type: 'fr' }))
              .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests', filter: `from_id=eq.${uid}` }, () => fn({ type: 'fr' }))
              .subscribe();
            return () => sb.removeChannel(ch);
          },
        };
        return B;
      }

      const B = local ? localBackend() : cfg.url && cfg.key ? supaBackend() : null;
      NET.mode = local ? 'local' : B ? 'online' : 'off';
      NET.start = async () => {
        if (!B) return false;
        try {
          const me = await B.start();
          NET.account = me.guest ? null : { email: me.email };
          if (NET.account) await NET.syncDown().catch((e) => console.warn('Could not load your saved progress:', e && e.message));
          else if (profile.account) { profile.account = null; if (typeof saveProfileToStorage === 'function') saveProfileToStorage(); }
          NET.me = { id: me.id, name: profile.username, avatar: profile.avatar };
          // your GameHub name becomes your online name; if someone already has it, a number is added
          let name = profile.username, r = await B.setName(name, profile.avatar);
          for (let k = 0; r.error === 'taken' && k < 6; k++) { name = profile.username.slice(0, 16) + Math.floor(10 + Math.random() * 989); r = await B.setName(name, profile.avatar); }
          if (r.error) throw new Error(r.error);
          if (name !== profile.username) { profile.username = name; if (typeof saveProfile === 'function') saveProfile(); showToast(`That name was taken online, so you are ${name}.`, 'info'); }
          NET.me.name = name; NET.on = true;
          B.presence();
          document.dispatchEvent(new Event('ps-online'));
          return true;
        } catch (e) { NET.on = false; console.warn('Online features are unavailable:', e && e.message); NET.failed = true; document.dispatchEvent(new Event('ps-offline')); return false; }
      };
      /* ---------- accounts + progress saved online ---------- */
      // logged in: the newest copy wins. Your account's save replaces a different (or older) copy on this device;
      // otherwise this device's progress goes up.
      NET.syncDown = async () => {
        const sv = await B.loadSave();
        const mine = profile.account && profile.account.email === NET.account.email;
        if (sv && sv.data && (!mine || !profile.savedAt || sv.updated > profile.savedAt)) {
          profile = mergeProfile(sv.data);
          profile.account = { email: NET.account.email, since: (sv.data.account && sv.data.account.since) || getTodayISO() };
          profile.savedAt = sv.updated;
          lsSet(STORAGE_KEY, JSON.stringify(profile));
          if (typeof syncProfileUI === 'function') syncProfileUI();
        } else {
          // no save online yet = a brand-new account (e.g. just signed up with Google): it starts fresh, keeping the name
          if (!sv) profile = freshProfile({ username: profile.username, avatar: profile.avatar });
          profile.account = { email: NET.account.email, since: (profile.account && profile.account.since) || getTodayISO() };
          lsSet(STORAGE_KEY, JSON.stringify(profile));
          await NET.syncUp(true);
        }
      };
      let upT = null;
      NET.syncUp = async (now) => {
        if (!NET.account || !B) return;
        if (!now) { clearTimeout(upT); upT = setTimeout(() => NET.syncUp(true), 4000); return; }
        profile.savedAt = Date.now(); lsSet(STORAGE_KEY, JSON.stringify(profile));
        try { await B.pushSave(JSON.parse(JSON.stringify(profile))); } catch (e) { console.warn('Could not save progress online:', e && e.message); }
      };
      NET.upgrade = async (email, pw, name) => {
        const r = await B.upgrade(email, pw); if (r.error) return r;
        NET.account = { email };
        if (name && name !== profile.username) { const n = await NET.setName(name, profile.avatar); if (!n.error) profile.username = name; }
        profile = freshProfile({ username: profile.username, avatar: profile.avatar });   // a new account starts fresh
        profile.account = { email, since: getTodayISO() };
        await NET.syncUp(true);
        return r;
      };
      NET.signIn = (email, pw) => B.signIn(email, pw);
      NET.google = (link) => B.google(link);
      NET.resetPassword = (email) => B.reset(email);
      NET.setPassword = (pw) => B.setPassword(pw);
      NET.signOut = async () => { await NET.syncUp(true); const r = await B.signOut(); profile = freshProfile(); lsSet(STORAGE_KEY, JSON.stringify(profile)); return r; };
      NET.setName = async (name, avatar) => { if (!NET.on) return { error: 'offline' }; const r = await B.setName(name, avatar); if (!r.error) { NET.me.name = name; NET.me.avatar = avatar; } return r; };
      NET.searchPlayers = (q) => B.searchPlayers(q);
      NET.playerCard = (id) => B.playerCard(id);
      NET.friends = () => B.friends();
      NET.addFriend = (id) => B.addFriend(id);
      NET.acceptFriend = (id) => B.acceptFriend(id);
      NET.removeFriend = (id) => B.removeFriend(id);
      NET.dmHistory = (id) => B.dmHistory(id);
      NET.dmSend = (id, text) => B.dmSend(id, NET.clean(text).slice(0, 300));
      NET.onSocial = (fn) => B.onSocial(fn);
      NET.isOnline = (id) => !!(NET.onlineIds && NET.onlineIds.has(id));
      NET.chatHistory = (room) => B.history(room);
      NET.chatSend = (room, text) => B.send(room, NET.clean(text).slice(0, 200));
      NET.chatSub = (room, fn) => B.sub(room, fn);
      NET.report = (id, why) => B.report(id, why);
      NET.quickMatch = (game, settings) => B.quick(game, settings);
      // a private room: join it if it exists, otherwise open it with this code
      NET.enterRoom = async (code, game, settings) => {
        const r = code ? await B.get(code.toUpperCase()).catch(() => null) : null;
        if (r && r.status !== 'done') { if (r.game !== game) throw new Error('That code is for a different game.');
          if (r.status === 'waiting' && NET.me && r.host === NET.me.id) throw new Error('That room is yours: this browser is already that player. To play yourself, open the second copy in another browser or a private window.');
          return B.join(code); }
        return B.create(game, settings, false, code);
      };
      NET.watchRoom = (code, fn) => B.watch(code, fn);
      NET.getRoom = (code) => B.get(String(code || '').toUpperCase());
      NET.createRoom = (game, settings, pub, code) => B.create(game, settings, pub, code);
      NET.joinRoom = (code) => B.join(code);
      NET.channel = (name, meta) => B.channel(name, meta);
      NET.sendMove = (code, mv, idx) => B.move(code, mv, idx);
      NET.ping = (code) => B.ping(code).catch(() => {});
      NET.leave = (code) => B.leave(code).catch(() => {});
      NET.reportResult = (code, res) => B.result(code, res);
      NET.openRooms = () => B.openRooms();
      NET.leaderboard = (game) => B.leaderboard(game);
      NET.rating = (game) => B.rating(game);
      NET.profileOf = (id) => B.profileOf(id);
    })();

