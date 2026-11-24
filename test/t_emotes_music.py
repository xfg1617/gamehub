"""Emotes + music (Nov 2026, Inna).
Emotes: at a game table the face button opens the menu; each profile picture has its own character; spam is fine
(streak counter), the menu stays open and closes on an outside tap; online, the other screen sees the emote above
the sender's seat. Music: a Music button next to Sound opens the panel (on/off, volume, which music, during games);
it plays after the first tap, follows the game in Auto, and the choices are remembered."""
import sys, time; sys.path.insert(0, 'test')
from nplib import *
SH = 'test/shots/'
with sync_playwright() as p:
    # ---------- offline: poker vs computers on one screen ----------
    br = launch(p)
    for w, h, mob, tag in ((1280, 900, False, 'desk'), (390, 844, True, 'phone')):
        pg = open_page(br, w, h, mob)
        pg.evaluate("setupSave('poker', { clock: 0 }); profile.avatar = '🐻'; openGame('poker')"); pg.wait_for_timeout(300)
        go = pg.query_selector('#su-go'); go and go.click(); pg.wait_for_timeout(2500)
        check(pg.query_selector('#em-fab') is not None, f'{tag}: emote button at the poker table')
        pg.click('#em-fab'); pg.wait_for_timeout(200)
        check(pg.evaluate("document.querySelectorAll('#em-menu .em-it').length") == 10, f'{tag}: menu with 10 emotes')
        for _ in range(4): pg.click('#em-menu [data-em="lol"]'); pg.wait_for_timeout(80)
        check(pg.query_selector('#em-menu') is not None, f'{tag}: the menu stays open while sending')
        cnt = pg.evaluate("(document.querySelector('.em-bub.on .em-count') || {}).textContent")
        check(cnt == 'x4', f'{tag}: spamming shows a streak counter ({cnt})')
        pg.screenshot(path=SH + f'emotes_{tag}.png')
        pg.mouse.click(w // 2, 20); pg.wait_for_timeout(200)
        check(pg.query_selector('#em-menu') is None, f'{tag}: tapping outside closes the menu')
        bear = pg.evaluate("EMOTE.charFor('🐻')"); robot = pg.evaluate("EMOTE.charFor('🤖')")
        check(bear == '🐻' and robot == '🤖' and pg.evaluate("EMOTE.charFor('🐺')") == '🦊', 'characters: bear, robot for computers, wolf borrows the fox')
        pg.evaluate("closeActiveGame()"); pg.wait_for_timeout(700)
        check(pg.query_selector('#em-fab') is None, f'{tag}: no emote button outside a game')
        # music
        btn = '#mu-btn' if not mob else '#mu-btn-m'
        check(pg.query_selector(btn) is not None, f'{tag}: Music button next to Sound')
        check(pg.evaluate("MUSIC.state().on") is False, f'{tag}: test browsers start with music off')
        pg.evaluate("MUSIC.set('on', true)")
        pg.click(btn); pg.wait_for_timeout(300)
        check(pg.query_selector('#mu-pop') is not None, f'{tag}: Music panel opens')
        st = pg.evaluate("MUSIC.state()")
        print('   music state:', st)
        check(st['on'] and st['playing'] == 'harbor', f'{tag}: music plays after a tap (menu tune)')
        pg.screenshot(path=SH + f'music_{tag}.png')
        pg.click('#mu-pop [data-pick="card"]'); pg.wait_for_timeout(700)
        check(pg.evaluate("MUSIC.state().playing") == 'card', f'{tag}: picking a tune switches the music')
        pg.click('#mu-pop [data-pick="auto"]'); pg.click('#mu-pop [data-mu="on"]'); pg.wait_for_timeout(700)
        check(pg.evaluate("MUSIC.state().playing") is None, f'{tag}: switching music off stops it')
        pg.click('#mu-pop [data-mu="on"]'); pg.mouse.click(w // 2, h - 200); pg.wait_for_timeout(300)
        check(pg.query_selector('#mu-pop') is None, f'{tag}: tapping outside closes the panel')
        pg.evaluate("openGame('poker')"); pg.wait_for_timeout(300); go = pg.query_selector('#su-go'); go and go.click(); pg.wait_for_timeout(1500)
        check(pg.evaluate("MUSIC.state().playing") == 'card', f'{tag}: Auto plays the card tune at the poker table')
        check(not pg.errs, f'{tag}: no page errors {pg.errs[:2]}')
        pg.close()
    br.close()
    # ---------- online: two players, B sees A's emote ----------
    A, B = players(p, 2)
    A.evaluate("profile.avatar = '🦁'")
    code = open_table(A, 'tictactoe', 'room'); join(B, code); A.wait_for_timeout(3000)
    check(A.query_selector('#em-fab') is not None and B.query_selector('#em-fab') is not None, 'online: both players have the emote button')
    A.click('#em-fab'); A.click('#em-menu [data-em="rage"]'); B.wait_for_timeout(1500)
    seen = B.evaluate("[...document.querySelectorAll('.em-bub.on')].map((b) => b.innerHTML.length).length")
    check(seen >= 1, 'online: the other player sees the emote pop up')
    B.screenshot(path=SH + 'emotes_online_B.png')
    done(A, B)
