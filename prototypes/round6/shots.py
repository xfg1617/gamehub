"""Round 6 prototype screenshots (5 new games): python3 prototypes/round6/shots.py"""
import sys, os; sys.path.insert(0, 'test')
from tlib import *
OUT = 'prototypes/round6/shots/'; os.makedirs(OUT, exist_ok=True)
MOCK = open('prototypes/round6/mock.js').read()
D = [('01_caro', 'caro(false)'), ('02_caro_win', 'caro(true)'), ('03_thirteen', 'thirteen(false)'), ('04_thirteen_bomb', 'thirteen(true)'),
     ('05_werewolf_night', 'wwNight()'), ('06_werewolf_day_vote', 'wwDay()'), ('07_werewolf_roles', 'wwRoles()'),
     ('08_trivia_settings', 'tvRoom()'), ('09_trivia_question', 'tvQ(false)'), ('10_trivia_answer', 'tvQ(true)'), ('11_trivia_vietnamese', 'tvQ(false, true)'),
     ('12_funny_settings', 'faRoom()'), ('13_funny_write', 'faType()'), ('14_funny_vote', 'faVote(false)'), ('15_funny_result', 'faVote(true)'), ('16_funny_final', 'faLast()')]
M = [('m1', 'caro(false)'), ('m2', 'thirteen(false)'), ('m3', 'wwNight()'), ('m4', 'tvQ(true, true)'), ('m5', 'faVote(true)')]
with sync_playwright() as p:
    br = launch(p)
    for size, lst, mob in (((1690, 903), D, False), ((390, 844), M, True)):
        pg = open_page(br, size[0], size[1], mobile=mob); pg.evaluate(MOCK); pg.wait_for_timeout(500)
        for n, js in lst:
            pg.evaluate('P6.' + js); pg.wait_for_timeout(250); pg.screenshot(path=OUT + n + '.png')
            if pg.errs: print(n, pg.errs[:2])
        pg.context.close()
    br.close()
from PIL import Image
ims = [Image.open(OUT + n + '.png') for n, _ in M]
o = Image.new('RGB', (sum(i.width for i in ims) + 16 * (len(ims) - 1), ims[0].height), '#050E18'); x = 0
for i in ims: o.paste(i, (x, 0)); x += i.width + 16
o.save(OUT + '17_phones.png')
for n, _ in M: os.remove(OUT + n + '.png')
