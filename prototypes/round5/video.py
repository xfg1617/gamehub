import sys, os, glob, shutil, subprocess; sys.path.insert(0, 'test')
from tlib import *
VD = '/tmp/claude-0/-home-user-gamehub/9d8e9617-cd64-5108-b3b7-55f8d6ba7601/scratchpad/vid'; shutil.rmtree(VD, ignore_errors=True)
with sync_playwright() as p:
    br = launch(p)
    ctx = br.new_context(viewport={'width': 1280, 'height': 720}, record_video_dir=VD, record_video_size={'width': 1280, 'height': 720})
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    ctx.route('https://*.supabase.co/**', lambda r: r.abort())
    pg.goto('file://' + os.path.abspath('dist/gamehub.html')); pg.wait_for_timeout(800)
    pg.evaluate(open('prototypes/round5/demo.js').read())
    pg.wait_for_function('window.__demoDone === true', timeout=60000); pg.wait_for_timeout(300)
    print('errors', errs); ctx.close(); br.close()
src = glob.glob(VD + '/*.webm')[0]
out = 'prototypes/round5/how-to-play-bullshit-sample.mp4'
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', '0.9', '-i', src, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', '-movflags', '+faststart', out], check=True)
print(out, os.path.getsize(out))
