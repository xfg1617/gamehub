"""Round 5 prototype screenshots: python3 prototypes/round5/shots.py [names]"""
import sys, os; sys.path.insert(0, 'test')
from tlib import *
OUT = 'prototypes/round5/shots/'; os.makedirs(OUT, exist_ok=True)
MOCK = open('prototypes/round5/mock.js').read()
want = sys.argv[1].split(',') if len(sys.argv) > 1 else None
def go(pg, js, wait=300): pg.evaluate(js); pg.wait_for_timeout(wait)
def game(pg, g, wait=3000):
    go(pg, f"PM.clear(); navigateTo('play', true); openGame('{g}')", 300)
    if pg.query_selector('#su-go'): pg.click('#su-go')
    pg.wait_for_timeout(wait)
def shot(pg, name):
    pg.screenshot(path=OUT + name + '.png'); print('shot', name, pg.errs[:2])
S = {}
def sc(f): S[f.__name__] = f; return f
@sc
def home(pg): go(pg, "PM.home()", 400); shot(pg, '01_home_random_tile')
@sc
def random_setup(pg):
    go(pg, "PM.registerRandom(); openGame('random')", 800)
    go(pg, "document.querySelectorAll('#gs-body .win > div > *').forEach(e => { if (/ROOM CODE/.test(e.textContent) && e.querySelector('input,button')) e.style.display='none'; })")
    pg.screenshot(path=OUT + '02_random_settings.png', clip={'x':0,'y':0,'width':1690,'height':760}); print('shot random')
@sc
def pop_random(pg): game(pg, 'tycoon', 1500); go(pg, "PM.settingsPop(true)"); shot(pg, '03_settings_popup_random')
@sc
def pop_normal(pg): game(pg, 'poker', 1500); go(pg, "PM.settingsPop(false)"); shot(pg, '04_settings_popup_normal_game')
@sc
def points(pg): game(pg, 'tycoon', 1500); go(pg, "PM.resultPoints()"); shot(pg, '05_result_with_points')
@sc
def final(pg): game(pg, 'kittens', 1500); go(pg, "PM.final()", 900); shot(pg, '06_session_champion')
@sc
def room(pg): go(pg, "PM.clear(); navigateTo('play', true); PM.roomNext()", 400); shot(pg, '07_same_room_what_next')
@sc
def board(pg): go(pg, "PM.clear(); navigateTo('leaderboard', true); PM.board()", 400); shot(pg, '08_points_leaderboard')
@sc
def chat(pg): go(pg, "PM.clear(); navigateTo('friends', true); PM.friendsChat()", 400); shot(pg, '09_friends_chat')
@sc
def guest(pg): game(pg, 'poker', 1500); go(pg, "PM.guestCard()"); shot(pg, '10_guest_player_card')
@sc
def fire(pg):
    game(pg, 'fibber', 4000)
    r = pg.evaluate("PM.fire('#fb-seat-1', true)"); print('fire', r)
    go(pg, "PM.miniBadges()", 500); shot(pg, '11_fire_streak_bullshit')
@sc
def log(pg): game(pg, 'tycoon', 2500); go(pg, "PM.log()"); shot(pg, '12_movable_log')
@sc
def manor(pg): game(pg, 'manor', 3500); print('manor', pg.evaluate("PM.manor()")); pg.wait_for_timeout(1200); shot(pg, '13_whodunit_map')
PHONE = {}
def ph(f): PHONE[f.__name__] = f; return f
@ph
def m_pool(pg):
    game(pg, 'pool', 2500)
    pg.evaluate('''() => { const cv = document.getElementById('pl-cv'); const c = document.createElement('canvas'); c.width = cv.height; c.height = cv.width;
      const x = c.getContext('2d'); x.translate(c.width, 0); x.rotate(Math.PI / 2); x.drawImage(cv, 0, 0);
      c.style.cssText = 'width:100%;display:block;border:4px solid #050E18;box-shadow:0 5px 0 #050E18'; cv.style.display = 'none'; cv.parentNode.appendChild(c);
      const t = document.querySelector('.pl-table'); t.style.maxWidth = '250px'; t.style.margin = '0 auto'; window.scrollTo(0, 0); document.querySelector('.pl-table').scrollIntoView({block: 'start'}); }''')
    pg.wait_for_timeout(300); shot(pg, '14_phone_pool_upright')
@ph
def m_pop(pg): game(pg, 'poker', 1500); go(pg, "PM.settingsPop(false)"); shot(pg, '15_phone_settings_popup')
@ph
def m_chat(pg):
    go(pg, "PM.clear(); navigateTo('friends', true); PM.friendsChat()", 300)
    go(pg, "document.querySelector('.pm-chat').style.cssText='grid-template-columns:1fr;height:640px;width:100%'; document.querySelector('.pm-fl').style.display='none'")
    shot(pg, '16_phone_friends_chat')
@ph
def m_final(pg): game(pg, 'kittens', 1500); go(pg, "PM.final()", 900); shot(pg, '17_phone_session_champion')
with sync_playwright() as p:
    br = launch(p)
    pg = open_page(br, 1690, 903); pg.evaluate(MOCK)
    for k, f in S.items():
        if want and k not in want: continue
        f(pg)
    pg.context.close()
    pg = open_page(br, 390, 844, mobile=True); pg.evaluate(MOCK)
    for k, f in PHONE.items():
        if want and k not in want: continue
        f(pg)
    br.close()
