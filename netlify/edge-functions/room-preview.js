// Netlify Edge Function (made by build.py, don't edit by hand): link previews for room invites.
// gamehub.us.com/r/CODE is the GameHub page itself; this only changes what a chat app SHOWS for the link:
// the game's banner and "Play Chess with Inna" (host with an account) or "Play Chess together" (guest host).
const SUPA = "https://kfydkerunjjdpcsjgmmw.supabase.co", KEY = "sb_publishable_tzwFBYzQ8bPoPLKgUMLqzQ_7kw7TCsk", SITE = "https://gamehub.us.com", GAMES = {"naval": "Naval Grid", "daily": "Daily Word", "blackjack": "Blackjack", "bowling": "Bowling", "checkers": "Checkers", "chess": "Chess", "colorclash": "Color Clash", "dominoes": "Dominoes", "doodle": "Doodle Chain", "c4": "Four-in-a-Row", "impostor": "Find the Impostor", "isles": "Frontier Isles", "kittens": "Hot Potato Cats", "manor": "Manor Mystery", "poker": "Poker", "pool": "Pool", "tictactoe": "Tic-Tac-Toe", "tycoon": "Property Tycoon", "wordconnect": "Word Connect", "wordduel": "Word Duel", "navalnet": "Naval Grid"};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export default async (request, context) => {
  const res = await context.next();
  const m = /^\/r\/([A-Za-z0-9]{3,8})\/?$/.exec(new URL(request.url).pathname);
  if (!m || !(res.headers.get('content-type') || '').includes('text/html')) return res;
  const code = m[1].toUpperCase();
  let info = null;
  try {
    const r = await fetch(`${SUPA}/rest/v1/rpc/room_preview`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_code: code }) });
    if (r.ok) info = await r.json();
  } catch (e) {}
  const id = info && info.game, name = (id && GAMES[id]) || null;
  const title = name ? (info.host_account && info.host_name ? `Play ${name} with ${info.host_name}` : `Play ${name} together`) : 'Join my game on GameHub';
  const desc = name ? `Tap to join room ${code} on GameHub. Free, right in your browser.` : 'Play games with your friends on GameHub. Free, right in your browser.';
  const img = `${SITE}/og/${name ? (id === 'navalnet' ? 'naval' : id) : 'gamehub'}.png`;
  let html = await res.text();
  const set = (prop, val) => { html = html.replace(new RegExp(`(<meta (?:property|name)="${prop}" content=")[^"]*(")`), `$1${esc(val)}$2`); };
  set('og:title', title); set('twitter:title', title);
  set('og:description', desc); set('twitter:description', desc); set('description', desc);
  set('og:image', img); set('twitter:image', img); set('og:url', `${SITE}/r/${code}`);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)} · GameHub</title>`);
  const headers = new Headers(res.headers); headers.delete('content-length');
  return new Response(html, { status: 200, headers });
};
export const config = { path: '/r/*' };
