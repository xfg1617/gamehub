"""Test-only: the Tailwind CDN is blocked in the sandbox, so build the same CSS locally
and serve it in place of the CDN script. Not needed when the page is opened normally."""
import os, re, subprocess, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
TW = sys.argv[1]  # folder with node_modules/tailwindcss
html = open(os.path.join(HERE, '..', 'dist', 'gamehub.html')).read()
cfg = re.search(r'tailwind\.config = (\{.*?\});\n  </script>', html, re.S).group(1)
open(os.path.join(TW, 'tailwind.config.js'), 'w').write(
    "module.exports = Object.assign(" + cfg + ", {content: [" + json.dumps(os.path.abspath(os.path.join(HERE, '..', 'dist', 'gamehub.html'))) + "]});")
open(os.path.join(TW, 'in.css'), 'w').write('@tailwind base;\n@tailwind components;\n@tailwind utilities;\n')
subprocess.run([os.path.join(TW, 'node_modules/.bin/tailwindcss'), '-c', 'tailwind.config.js', '-i', 'in.css', '-o', 'out.css'], cwd=TW, check=True, capture_output=True)
css = open(os.path.join(TW, 'out.css')).read()
open(os.path.join(HERE, 'tw_stub.js'), 'w').write(
    "window.tailwind = {config: {}};\n(function(){var s=document.createElement('style');s.textContent=" + json.dumps(css) + ";document.head.appendChild(s);})();\n")
print('tw_stub.js', len(css))
