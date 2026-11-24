"""The online service recovers by itself when a tablet/phone wakes up with an expired sign-in ("permission denied for
function quick_match") or a dropped request ("TypeError: Load failed", Inna's iPad, Nov 2026): the call refreshes the
sign-in / waits a moment and tries once more; if it still fails the player sees a plain message, not the raw error.
Uses a pretend Supabase client (no real service)."""
import sys; sys.path.insert(0, 'test')
from tlib import *
fails = []
def check(ok, what): print('OK  ' if ok else 'FAIL', what); fails.append(what) if not ok else None
FAKE = """
window.__calls = { rpc: 0, refresh: 0, anon: 0 }; window.__plan = [];
window.supabase = { createClient: () => {
  const ch = () => { const c = { on: () => c, subscribe: (f) => { f && f('SUBSCRIBED'); return c; }, track: () => {}, untrack: () => {}, send: async () => {}, presenceState: () => ({}) }; return c; };
  const q = () => { const o = new Proxy(function () {}, { get: (t, k) => k === 'then' ? (res) => res({ data: [], error: null }) : () => o, apply: () => o }); return o; };
  return {
    auth: { getSession: async () => ({ data: { session: { expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: 'u1', is_anonymous: true } } } }),
      signInAnonymously: async () => { __calls.anon++; return { data: { user: { id: 'u1', is_anonymous: true }, session: {} } }; },
      refreshSession: async () => { __calls.refresh++; return { data: {} }; }, onAuthStateChange: () => {} },
    rpc: async (name) => { __calls.rpc++; const p = __plan.shift(); if (p === 'deny') return { data: null, error: { message: 'permission denied for function ' + name } };
      if (p === 'load') return { data: null, error: { message: 'TypeError: Load failed' } }; if (p === 'throw') throw new TypeError('Load failed');
      return { data: { code: 'ABCD', ok: true }, error: null }; },
    from: () => q(), channel: () => ch(), removeChannel: () => {},
  }; } };
"""
with sync_playwright() as p:
    br = launch(p); ctx = br.new_context(); ctx.add_init_script(FAKE)
    ctx.route('https://*.supabase.co/**', lambda r: r.abort())
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + __import__('os').path.abspath('dist/gamehub.html')); pg.wait_for_timeout(2500)
    on = pg.evaluate("(typeof NET !== 'undefined') && NET.on")
    print('   online with the pretend service:', on)
    def run(plan):
        return pg.evaluate("""async (plan) => { __plan = plan.slice(); const before = { ...__calls };
          try { const r = await NET.quickMatch ? null : null; } catch (e) {}
          let out; try { out = await NET._B.quick('tictactoe', {}); out = 'ok'; } catch (e) { out = 'ERR: ' + e.message; }
          return { out, rpc: __calls.rpc - before.rpc, refresh: __calls.refresh - before.refresh }; }""", plan)
    has = pg.evaluate("(typeof NET !== 'undefined') && !!NET._B")
    if not has:
        print('   (NET._B not exposed; exposing the backend for this test is needed)')
    else:
        r = run(['deny']); print('  ', r); check(r['out'] == 'ok' and r['rpc'] == 2 and r['refresh'] >= 1, 'expired sign-in: refreshed and retried, game goes on')
        r = run(['load']); print('  ', r); check(r['out'] == 'ok' and r['rpc'] == 2, 'dropped request ("Load failed"): retried, game goes on')
        r = run(['throw']); print('  ', r); check(r['out'] == 'ok' and r['rpc'] == 2, 'dropped request thrown as an error: retried')
        r = run(['load', 'load']); print('  ', r); check(r['out'].startswith('ERR: Connection problem'), 'still failing: a plain message instead of "TypeError: Load failed"')
        r = run(['deny', 'deny']); print('  ', r); check('timed out' in r['out'], 'still denied: a plain message instead of "permission denied"')
    check(not errs, f'no page errors {errs[:2]}')
    br.close()
print('ALL OK' if not fails else f'{len(fails)} FAILED'); sys.exit(1 if fails else 0)
