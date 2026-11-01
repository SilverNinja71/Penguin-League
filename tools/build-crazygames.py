#!/usr/bin/env python3
"""Builds the CrazyGames upload from index.html (run by build.sh, after index.html is built).

dist/crazygames/            the self-contained game: index.html, lib/three (Three.js r160 + the
                            post-processing add-ons) and fonts/ (Fredoka, Lilita One), all from vendor/
dist/penguin-league-crazygames.zip   the same folder zipped, ready to upload

Differences from the GitHub Pages page: Three.js and the fonts load from the game's own files instead of
jsDelivr and Google Fonts, the CrazyGames SDK is added, and online rooms (PeerJS) are left out, so the only
outside request is CrazyGames' own SDK. The build stops if any other outside address is left in the page.
"""
import os, re, shutil, sys, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')
OUT = os.path.join(DIST, 'crazygames')
ZIP = os.path.join(DIST, 'penguin-league-crazygames.zip')
CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0/'


def must_sub(pattern, repl, text, flags=0):
    new, n = re.subn(pattern, repl, text, flags=flags)
    if not n:
        sys.exit('build-crazygames: pattern not found: ' + pattern)
    return new


html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
sdk = open(os.path.join(ROOT, 'src', 'crazygames-head.html'), encoding='utf-8').read()
html = must_sub(r'<link rel="preconnect"[^>]*>\n', '', html)
html = must_sub(r'<!-- fonts load without blocking[^\n]*\n<link rel="stylesheet" href="https://fonts\.googleapis\.com/[^>]*>',
                '<link rel="stylesheet" href="fonts/fonts.css">', html)
html = must_sub(re.escape(CDN), './lib/three/', html)   # import maps need ./ (a bare lib/ is ignored)
html = must_sub(r'<!-- PeerJS:[^\n]*\n<script defer src="https://unpkg\.com/peerjs[^>]*></script>\n', '', html)
html = must_sub(r'(<title>[^<]*</title>\n)', lambda m: m.group(1) + sdk, html)

# nothing may reach outside the zip except the SDK (SVG namespace strings are not requests)
allowed = ('https://sdk.crazygames.com/crazygames-sdk-v3.js', 'http://www.w3.org/')
left = sorted({u for u in re.findall(r'https?://[^\s"\'<>)]+', html) if not u.startswith(allowed)})
if left:
    sys.exit('build-crazygames: outside addresses left in the page: ' + ', '.join(left))

shutil.rmtree(OUT, ignore_errors=True)
shutil.copytree(os.path.join(ROOT, 'vendor', 'three'), os.path.join(OUT, 'lib', 'three'))
shutil.copytree(os.path.join(ROOT, 'vendor', 'fonts'), os.path.join(OUT, 'fonts'))
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(html)

# every lib/ file the page points at must exist (the import map and preloads)
for ref in re.findall(r'(?<=\./)lib/three/[\w./-]+\.js', html):
    if not os.path.isfile(os.path.join(OUT, ref)):
        sys.exit('build-crazygames: missing ' + ref)

if os.path.exists(ZIP):
    os.remove(ZIP)
total = 0
with zipfile.ZipFile(ZIP, 'w', zipfile.ZIP_DEFLATED) as z:
    for d, _, files in sorted(os.walk(OUT)):
        for f in sorted(files):
            p = os.path.join(d, f)
            z.write(p, os.path.relpath(p, OUT))
            total += os.path.getsize(p)
print('crazygames: %d files, %.1f MB unzipped, %.1f MB zip' % (
    sum(len(f) for _, _, f in os.walk(OUT)), total / 1e6, os.path.getsize(ZIP) / 1e6))
