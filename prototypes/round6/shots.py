"""Round 6 prototype screenshots (5 new games): python3 prototypes/round6/shots.py"""
import sys, os; sys.path.insert(0, 'test')
from tlib import *
OUT = 'prototypes/round6/shots/'; os.makedirs(OUT, exist_ok=True)
MOCK = open('prototypes/round6/mock.js').read()
D = [('01_caro', 'caro(false)'), ('02_caro_win', 'caro(true)'), ('03_tienlen', 'tienlen(false)'), ('04_tienlen_bomb', 'tienlen(true)'),
     ('05_werewolf_night', 'wwNight()'), ('06_werewolf_day_vote', 'wwDay()'), ('07_werewolf_roles', 'wwRoles()'),
     ('08_trivia_categories', 'tvCats()'), ('09_trivia_question', 'tvQ(false)'), ('10_trivia_answer', 'tvQ(true)'),
     ('11_funny_type', 'faType()'), ('12_funny_vote', 'faVote(false)'), ('13_funny_result', 'faVote(true)'), ('14_funny_final', 'faLast()')]
M = [('15_phone_caro', 'caro(false)'), ('16_phone_tienlen', 'tienlen(false)'), ('17_phone_werewolf', 'wwNight()'), ('18_phone_trivia', 'tvQ(true)'), ('19_phone_funny', 'faVote(true)')]
with sync_playwright() as p:
    br = launch(p)
    for size, lst, mob in (((1690, 903), D, False), ((390, 844), M, True)):
        pg = open_page(br, size[0], size[1], mobile=mob); pg.evaluate(MOCK); pg.wait_for_timeout(500)
        for n, js in lst:
            pg.evaluate('P6.' + js); pg.wait_for_timeout(250); pg.screenshot(path=OUT + n + '.png'); print(n, pg.errs[:2])
        pg.context.close()
    br.close()
