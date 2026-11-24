"""Builds the bigger word lists for the word games (Inna, Nov 2026: "expand word bank").
Source: SCOWL English word lists (Kevin Atkinson, free to use with the copyright notice kept; see
src/WORDS-LICENSE.txt), via the npm package wordlist-english 1.2.1. SCOWL sizes: 10/20 = very common,
35/40 = common, 50/55 = less common, 60+ = rare (not used). U.S. spellings are included.

Writes src/words.json:
  answers   new 5-letter words for future Daily Word / Word Duel answers (common, not plurals/past tenses)
  guesses   every 5-letter word players may type in Daily Word / Word Duel (common + less common)
  wc_extra  extra 3-7 letter words Word Connect accepts as BONUS words (puzzles still use src/dict.json)

Usage: python3 tools/make_words.py <path to node_modules/wordlist-english>"""
import json, os, re, sys

W = sys.argv[1]
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

def level(*sizes):
    out = set()
    for kind in ('english', 'american'):
        for s in sizes:
            f = os.path.join(W, f'{kind}-words-{s}.json')
            if os.path.exists(f): out |= {w for w in json.load(open(f)) if re.fullmatch('[a-z]+', w)}
    return out

# words never shown as answers or accepted as guesses (slurs, swearing, crude words)
BAD = ['fuck', 'shit', 'bitch', 'cunt', 'nigg', 'fag', 'retard', 'whore', 'slut', 'dick', 'pussy', 'kys', 'cock', 'twat',
       'wank', 'prick', 'piss', 'bastard', 'damn', 'crap', 'tits', 'boob', 'penis', 'vagin', 'anal', 'anus', 'sperm', 'semen',
       'dildo', 'horny', 'porn', 'rape', 'nazi', 'kike', 'spic', 'chink', 'gook', 'dyke', 'homo', 'queer', 'tranny', 'negro',
       'coon', 'wop', 'jap', 'paki', 'gyp', 'skank', 'sexy', 'bong', 'weed', 'heroin', 'arse', 'bollock', 'bugger', 'jizz',
       'orgy', 'pubic', 'puss', 'scrot', 'smut', 'turd', 'fart', 'butt', 'hooker', 'pimp', 'booze', 'lesbo', 'nude', 'kill',
       'drug', 'slave', 'bimbo', 'hussy', 'tramp', 'idiot', 'moron', 'dumb', 'sissy', 'pansy', 'fatso', 'loony', 'psycho', 'lunatic', 'cripple', 'midget', 'gypsy']
# only the bad words themselves and their endings are blocked ("grape", "skill", "canal", "raccoon" stay); a few
# strong words are blocked anywhere they appear
STRONG = ['fuck', 'shit', 'cunt', 'nigg', 'whore', 'slut', 'dildo', 'jizz', 'porn', 'wank', 'twat', 'bitch', 'faggot', 'tranny', 'kike']
FORMS = ('', 's', 'es', 'ed', 'ing', 'er', 'ers', 'y', 'ie', 'ies', 'ish', 'ism')
BLOCKED = {b + e for b in BAD for e in FORMS}
clean = lambda w: w not in BLOCKED and not any(b in w for b in STRONG)

common = level(10, 20)
mid = level(35, 40)
less = level(50, 55)

dict_now = json.load(open(os.path.join(ROOT, 'src', 'dict_source.json')))
wc_now = set(dict_now['all'])

def nice_answer(w):
    if not re.fullmatch('[a-z]{5}', w) or not clean(w): return False
    if w.endswith('s') and not w.endswith(('ss', 'us', 'is')): return False   # plurals and "-s" verbs make poor answers
    if w.endswith('ed') or w.endswith('er') and w[:-2] + 'e' in common: return False
    return True

answers = sorted(w for w in (common | mid) if nice_answer(w) and (w in common or w in wc_now))
guesses = sorted(w for w in (common | mid | less | wc_now) if re.fullmatch('[a-z]{5}', w) and clean(w))
wc_extra = sorted(w for w in (common | mid | less) if re.fullmatch('[a-z]{3,7}', w) and clean(w) and w not in wc_now)  # bonus words (finished below)

# Word Connect (Inna, Nov 2026: "some 3 letter words are so stupid"): the words you must find are only common words
# (SCOWL sizes 10-35): the old list's abbreviations and name bits (als, eds, ing, ios, kai...) are gone, and common
# words it missed are added. Everything else real and clean (up to size 55, e.g. "taro") still counts as a bonus word.
common35 = level(10, 20, 35)
DROP3 = {'ass', 'sex', 'hes', 'mas', 'pas', 'dos', 'ins', 'ups', 'gay', 'chi', 'sic', 'sac', 'sup', 'thy', 'wan', 'rue', 'roe', 'fro', 'ode', 'sod',
         'nay', 'don', 'ken', 'mar', 'rev', 'cad', 'bop', 'pew', 'lee', 'vie', 'yen', 'con', 'mod', 'ion', 'per', 'din', 'dun', 'nil', 'tor', 'sow'}
wc_must = sorted(w for w in ((wc_now | level(10, 20)) & common35) if re.fullmatch('[a-z]{3,7}', w) and clean(w)
                 and (len(w) > 3 or w not in DROP3))
wc_base = sorted(w for w in dict_now['base'] if w in common35 and clean(w))
json.dump({'all': wc_must, 'base': wc_base}, open(os.path.join(ROOT, 'src', 'dict.json'), 'w'), separators=(',', ':'))
wc_extra = sorted(set(wc_extra) | {w for w in wc_now if w in (common | mid | less) and re.fullmatch('[a-z]{3,7}', w) and clean(w) and w not in wc_must})
wc_extra = sorted(set(wc_extra) - set(wc_must))
print('word connect: must-find words', len(wc_must), '| letter sets', len(wc_base))
json.dump({'answers': answers, 'guesses': guesses, 'wc_extra': wc_extra}, open(os.path.join(ROOT, 'src', 'words.json'), 'w'), separators=(',', ':'))
with open(os.path.join(ROOT, 'src', 'WORDS-LICENSE.txt'), 'w') as f: f.write(open(os.path.join(W, 'Copyright')).read())
print('answers', len(answers), '| guesses', len(guesses), '| word connect bonus words', len(wc_extra))
