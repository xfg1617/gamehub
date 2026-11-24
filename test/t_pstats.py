"""Player cards + profile page (stand-in service): a player's browser publishes a summary of its stats; another player
opens their card (level, games, win %, this game's numbers) and the full profile (overview, badges, games, history)."""
import sys; sys.path.insert(0, 'test')
from nplib import *
S = sys.argv[1] if len(sys.argv) > 1 else 'test/shots/'
with sync_playwright() as p:
    A, B = players(p, 2)
    A.set_viewport_size({'width': 1440, 'height': 900})
    B.evaluate("""(() => { profile.xp = 730; const g = gstat('chess'); g.played = 14; g.wins = 9; g.losses = 5;
      const t = gstat('tictactoe'); t.played = 6; t.wins = 2; t.draws = 3; t.losses = 1; profile.badges = ['first', 'mate'];
      profile.history = [{ game: 'chess', result: 'win', at: Date.now() - 300000 }, { game: 'tictactoe', result: 'draw', at: Date.now() - 7200000 }, { game: 'chess', result: 'loss', at: Date.now() - 90000000 }];
      return NET.publishStats(myPublicStats()); })()""")
    bid = B.evaluate("NET.me.id")
    A.evaluate("setupSave('chess', {}); openGame('chess')"); A.wait_for_timeout(600)
    A.evaluate(f"openPlayerCard('{bid}')"); A.wait_for_timeout(1000)
    card = A.inner_text('#pcard-modal')
    check('Lv 8' in card and '20' in card and '55%' in card, 'card shows level 8, 20 games, 55% won')
    check('IN CHESS' in card and '14 played' in card and '64% won' in card, "card shows this game's numbers")
    A.screenshot(path=S + '08_card.png')
    A.click('#pcard-modal [data-act="full"]'); A.wait_for_timeout(500)
    pp = A.inner_text('#pprof-modal')
    check('GAMES PLAYED' in pp and 'Tic-Tac-Toe' in pp and 'RECENT GAMES' in pp and 'BADGES · 2' in pp, 'profile page: games, badges, history')
    A.screenshot(path=S + '08_profile.png')
    A.set_viewport_size({'width': 390, 'height': 844}); A.wait_for_timeout(300); A.screenshot(path=S + '08_profile_phone.png')
    check(not A.errs and not B.errs, 'no page errors')
    done()
