"""Recording helper for the TikTok clips (Nov 2026, Inna: "make first batch english for me").

Plays the real site in an upright phone-layout window (540x960 CSS px), grabs every screen update with its exact time
(Chrome's screencast, up to 60 a second, high-quality JPEG) and, at the same time, records the game's own sound inside
the page (the sound engine's master output -> MediaRecorder). Both carry wall-clock times, so picture and sound line up
exactly. Scenes call mark('name') to note moments; the cutter (make.py) uses them.
"""
import os, sys, base64, shutil
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'test'))
from tlib import sync_playwright, EXE, FILE  # noqa

W, H = 540, 960
AUDIO_JS = r"""
(async () => {
  try { if (!SFX.isOn() && typeof toggleSound === 'function') toggleSound(); } catch (e) {}
  const ctx = SFX._ctx(); await ctx.resume();
  const dest = ctx.createMediaStreamDestination(); SFX._master().connect(dest);
  window.__chunks = []; const rec = new MediaRecorder(dest.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 160000 });
  rec.ondataavailable = (e) => { if (e.data.size) window.__chunks.push(e.data); };
  window.__rec = rec; window.__marks = [];
  window.__mark = (n) => window.__marks.push([n, Date.now() / 1000]);
  rec.start(); window.__a0 = Date.now() / 1000;
  return window.__a0;
})()
"""
STOP_JS = r"""
new Promise((res) => { const r = window.__rec; r.onstop = async () => {
  const b = new Blob(window.__chunks, { type: 'audio/webm' }); const buf = new Uint8Array(await b.arrayBuffer());
  let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  res({ a: btoa(s), marks: window.__marks, a0: window.__a0 }); }; r.stop(); })
"""


class Take:
    """one recording: t = Take(p, name, out); t.page ...; t.start(); ... t.mark('x') ...; r = t.stop()"""
    def __init__(self, p, name, out, setup=None):
        self.name, self.out = name, out
        self.fdir = os.path.join(out, '_f_' + name); shutil.rmtree(self.fdir, ignore_errors=True); os.makedirs(self.fdir)
        kw = {'args': ['--no-sandbox', '--autoplay-policy=no-user-gesture-required']}
        if EXE: kw['executable_path'] = EXE
        self.br = p.chromium.launch(**kw)
        self.ctx = self.br.new_context(viewport={'width': W, 'height': H}, device_scale_factor=1, is_mobile=True, has_touch=True)
        self.ctx.route('https://*.supabase.co/**', lambda r: r.abort())
        if setup: self.ctx.add_init_script(setup)
        self.page = self.ctx.new_page(); self.errs = []; self.page.on('pageerror', lambda e: self.errs.append(str(e)))
        self.page.goto('file://' + FILE); self.page.wait_for_timeout(1200)
        self.page.mouse.click(2, 300)   # a first tap: browsers only allow sound after one
        self.page.evaluate("try { realLoad && realLoad(); } catch (e) {}")
        self.page.wait_for_timeout(1200)   # let the recordings decode
        self.frames = []; self.cdp = None

    def start(self):
        """start sound + picture recording"""
        self.a0 = self.page.evaluate(AUDIO_JS)
        self.cdp = self.ctx.new_cdp_session(self.page)
        def on(f):
            i = len(self.frames); fn = os.path.join(self.fdir, f'{i:06d}.jpg')
            open(fn, 'wb').write(base64.b64decode(f['data'])); self.frames.append((f['metadata']['timestamp'], fn))
            try: self.cdp.send('Page.screencastFrameAck', {'sessionId': f['sessionId']})
            except Exception: pass
        self.cdp.on('Page.screencastFrame', on)
        self.cdp.send('Page.startScreencast', {'format': 'jpeg', 'quality': 92, 'maxWidth': W, 'maxHeight': H, 'everyNthFrame': 1})

    def mark(self, n):
        self.page.evaluate(f"window.__mark({n!r})")

    def wait(self, ms):
        self.page.wait_for_timeout(ms)

    def stop(self):
        self.page.wait_for_timeout(300)
        self.cdp.send('Page.stopScreencast')
        r = self.page.evaluate(STOP_JS)
        errs = self.errs
        self.ctx.close(); self.br.close()
        a = os.path.join(self.out, f'_a_{self.name}.webm'); open(a, 'wb').write(base64.b64decode(r['a']))
        marks = {k: t - r['a0'] for k, t in r['marks']}           # seconds from the start of the sound
        frames = [(t - r['a0'], fn) for t, fn in self.frames]     # same clock
        return {'audio': a, 'frames': frames, 'marks': marks, 'errs': errs}
