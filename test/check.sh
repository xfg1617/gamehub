#!/bin/sh
# syntax-check the big script block of the built page
cd "$(dirname "$0")/.." && python3 -c "
import re;s=open('dist/playstack.html').read()
sc=re.findall(r'<script(?![^>]*src)[^>]*>(.*?)</script>', s, re.S); open('dist/_check.js','w').write(max(sc,key=len))" && node --check dist/_check.js && echo SYNTAX OK
