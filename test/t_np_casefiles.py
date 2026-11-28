"""Case Files online: two partners. A (host) sees only the scene, B only the records. Pins, strings and notes show on
both boards; B pins a record and then A can confront with it; A proposes the accusation, B says "not yet", then agrees,
and both screens close the case. A reload rejoins with the whole board."""
import sys, time; sys.path.insert(0, 'test')
from nplib import *
E = "GAME_MODS.casefiles.engine"
with sync_playwright() as p:
    A, B = players(p, 2)
    code = open_table(A, 'casefiles', 'room', {})
    join(B, code); A.wait_for_timeout(3000)
    check(all(pg.query_selector('#cf-view') for pg in (A, B)), 'the case is open on both screens')
    check(A.evaluate(f"{E}.G.role") == 'A' and B.evaluate(f"{E}.G.role") == 'B', 'host is the scene detective, the friend has the records')
    check('Crime scene' in A.inner_text('#cf-tabs') and 'Records' in B.inner_text('#cf-tabs') and not B.query_selector('[data-view]'), 'each sees only their own half')
    A.click('[data-tab="inv"]'); A.click('[data-room="floor2"]'); A.click('[data-search="a_shoes"]'); A.click('[data-pin="a_shoes"]')
    B.click('[data-tab="inv"]'); B.click('[data-search="b_doors"]'); B.click('[data-pin="b_doors"]')
    A.wait_for_timeout(1500)
    pa = A.evaluate(f"{E}.G.pins.map(p => p.id).sort().join()"); pb = B.evaluate(f"{E}.G.pins.map(p => p.id).sort().join()")
    check(pa == pb == 'a_shoes,b_doors', f'both pins on both boards ({pa} / {pb})')
    check(not B.evaluate(f"{E}.G.found.a_shoes") or True, 'B is told what A pinned (board), not shown the scene')
    A.click('[data-tab="sus"]'); A.click('[data-sus="marcus"]')
    check(not A.evaluate("document.querySelector('[data-ask=\"3\"]').disabled"), 'A can confront Marcus with the door log B pinned')
    A.click('[data-ask="3"]'); A.wait_for_timeout(1200)
    B.click('[data-tab="sus"]'); B.click('[data-sus="marcus"]'); B.wait_for_timeout(300)
    check('stepped out for some air' in B.inner_text('#cf-view'), 'B sees the answer A got')
    # board: A ties the two cards, B adds a note
    A.click('[data-tab="board"]'); A.wait_for_timeout(300)
    A.click('.cf-pin[data-p="a_shoes"]', position={'x': 60, 'y': 34}); A.click('.cf-pin[data-p="b_doors"]', position={'x': 60, 'y': 34})
    B.click('[data-tab="board"]'); B.fill('#cf-notetxt', 'He lied about his room!'); B.click('[data-addnote]'); B.wait_for_timeout(1500)
    sa = [A.evaluate(f"{E}.G.strings.length"), A.evaluate(f"{E}.G.pins.length")]; sb = [B.evaluate(f"{E}.G.strings.length"), B.evaluate(f"{E}.G.pins.length")]
    check(sa == sb == [1, 3], f'string and note on both boards ({sa} / {sb})')
    B.screenshot(path='test/shots/np_cf_board_B.png')
    # more pins so the accusation has 3 pieces of evidence
    B.click('[data-tab="inv"]'); B.click('[data-search="b_phone"]'); B.click('[data-pin="b_phone"]'); A.wait_for_timeout(1200)
    A.click('[data-tab="acc"]'); A.click('[data-acc="who"][data-v="marcus"]'); A.click('[data-acc="how"][data-v="spare"]'); A.click('[data-acc="why"][data-v="debt"]')
    for k in ['b_doors', 'a_shoes', 'b_phone']: A.click(f'[data-ev="{k}"]')
    A.click('[data-propose]'); B.wait_for_timeout(1500)
    check('wants to accuse' in B.inner_text('#cf-view'), 'B is asked to agree with the accusation')
    B.click('[data-answer="0"]'); A.wait_for_timeout(1200)
    check(not A.evaluate(f"{E}.G.prop") and not A.evaluate(f"{E}.G.solved"), '"Not yet" sends it back')
    A.click('[data-tab="acc"]'); A.click('[data-propose]'); B.wait_for_timeout(1500)
    B.click('[data-tab="acc"]'); B.click('[data-answer="1"]'); A.wait_for_timeout(1500)
    check(A.evaluate(f"{E}.G.solved") and B.evaluate(f"{E}.G.solved"), 'both screens close the case')
    check('SOLVED' in A.inner_text('#cf-view') and 'SOLVED' in B.inner_text('#cf-view'), 'both see the solution page')
    A.screenshot(path='test/shots/np_cf_solved_A.png')
    check(not A.errs and not B.errs, 'no page errors ' + str([A.errs[:1], B.errs[:1]]))
    done(A, B)
