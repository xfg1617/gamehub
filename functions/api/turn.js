// Cloudflare Pages Function: short-lived relay ("TURN") passwords for voice chat (Nov 2026).
// Most players connect their voices directly; some home/school/phone networks block that, and then the voice goes
// through Cloudflare's relay. The relay key stays here on the server (Cloudflare → Pages → gamehub → Settings →
// Variables and Secrets: TURN_KEY_ID and TURN_KEY_API_TOKEN, both "Secret"). Without them this answers with no relay
// and voice chat still works for everyone whose network allows direct connections.
const OK_HOSTS = /(^|\.)gamehub\.us\.com$|(^|\.)gamehub-8w2\.pages\.dev$|^localhost$/;
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

export async function onRequestGet({ request, env }) {
  // only our own pages may ask (a browser always sends where the request came from)
  const from = request.headers.get('origin') || request.headers.get('referer') || '';
  let host = ''; try { host = new URL(from).hostname; } catch (e) {}
  if (!OK_HOSTS.test(host)) return json({ iceServers: [] }, 403);
  if (!env.TURN_KEY_ID || !env.TURN_KEY_API_TOKEN) return json({ iceServers: [] });
  const base = `https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/`;
  const ask = (path) => fetch(base + path, { method: 'POST', headers: { Authorization: `Bearer ${env.TURN_KEY_API_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ttl: 7200 }) });
  try {
    let r = await ask('generate-ice-servers');
    if (!r.ok) r = await ask('generate');
    if (!r.ok) return json({ iceServers: [] });
    const j = await r.json();
    const list = Array.isArray(j.iceServers) ? j.iceServers : j.iceServers ? [j.iceServers] : [];
    // keep only the relay entries (the page already has its own STUN server)
    return json({ iceServers: list.map((s) => ({ ...s, urls: [].concat(s.urls || []).filter((u) => /^turns?:/.test(u)) })).filter((s) => s.urls.length) });
  } catch (e) { return json({ iceServers: [] }); }
}
