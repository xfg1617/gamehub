"""Profiles + accounts (stand-in service).
1. A brand-new guest starts from zero: a "Player1234" name, level 1, 0 XP, 0 streak, 1200 Elo, no wins (no made-up numbers).
2. A guest who plays, then creates an account: the account starts FRESH (Inna's rule), keeping only the chosen name.
3. Progress earned on the account is saved online: logging in on a second device loads it. Wrong password is refused.
4. A profile saved before the clean-up (the old fake "CaptainFox" numbers + real games on top) loses only the fake part.
Add 'real' to run against the real service (needs backend/accounts.sql and email sign-up turned on)."""
import sys, os, json, random; sys.path.insert(0, 'test')
from nplib import *
REAL = 'real' in sys.argv
email = f'test.pilot.{random.randint(10000, 99999)}@example.com'
with sync_playwright() as p:
    A, B = players(p, 2, REAL)
    fresh = A.evaluate("[profile.username, profile.xp, profile.dailyStreak, profile.navalElo, profile.wins, profile.stats.naval.played, profile.stats.daily.played, document.getElementById('home-elo').textContent, document.getElementById('home-streak').textContent]")
    print('   new guest:', fresh)
    check(fresh[0].startswith('Player') and fresh[1:7] == [0, 0, 1200, 0, 0, 0], 'a new guest starts from zero (no CaptainFox, no fake numbers)')
    check(fresh[7] == '1200' and fresh[8] == '0', 'the home page shows the real starting Elo and streak')
    check(A.evaluate("document.getElementById('btn-signin').style.display") != 'none' and 'Sign up' in A.evaluate("document.getElementById('btn-signin').textContent"), 'guests see "Sign up · Log in"')
    A.evaluate("profile.xp = 777; profile.stats.chess = { played: 5, wins: 4, losses: 1, draws: 0 }; saveProfileToStorage()")
    A.evaluate("openAuthModal('signup')"); A.wait_for_timeout(200)
    A.fill('#auth-name', 'Test Pilot Acct'[:16]); A.fill('#auth-email', email); A.fill('#auth-pw', 'hunter2hunter2')
    A.click('#auth-submit'); A.wait_for_timeout(1200)
    check('13 or older' in A.evaluate("document.getElementById('auth-error').textContent"), 'the 13+ box must be ticked')
    A.check('#auth-age'); A.click('#auth-submit'); A.wait_for_timeout(3000)
    acct = A.evaluate("[profile.account && profile.account.email, profile.username, profile.xp, profile.stats.chess || null]")
    print('   new account:', acct)
    check(acct[0] == email and acct[1] == 'Test Pilot Acct' and acct[2] == 0 and acct[3] is None, 'the new account starts fresh with the name it picked')
    A.evaluate("profile.xp = 900; profile.stats.chess = { played: 2, wins: 1, losses: 1, draws: 0 }; saveProfileToStorage()"); A.wait_for_timeout(5500)   # saved online after a few seconds
    # second device: log in
    B.evaluate("openAuthModal('signin')"); B.wait_for_timeout(200)
    B.fill('#auth-email', email); B.fill('#auth-pw', 'wrongpassword1'); B.click('#auth-submit'); B.wait_for_timeout(2000)
    check('Wrong email or password' in B.evaluate("document.getElementById('auth-error').textContent"), 'a wrong password is refused')
    B.fill('#auth-pw', 'hunter2hunter2'); B.click('#auth-submit'); B.wait_for_timeout(1500)
    B.wait_for_load_state(); B.wait_for_function("typeof NET !== 'undefined' && NET.on", timeout=30000); B.wait_for_timeout(2500)
    print('   device 2:', B.evaluate("[profile.account && profile.account.email, profile.xp, profile.stats.chess && profile.stats.chess.wins, profile.username]"))
    check(B.evaluate("profile.xp") == 900 and B.evaluate("profile.stats.chess.wins") == 1, 'the second device loaded the account progress')
    check(B.evaluate("NET.me.id") == A.evaluate("NET.me.id"), 'it is the same online player (same ratings)')
    # an old profile from before the clean-up: fake starting numbers + 2 real naval wins, 120 real XP, a 1-day streak
    old = {'username': 'CaptainFox', 'avatar': '🦊', 'xp': 465, 'elo': 1240, 'navalElo': 1256, 'wins': 8, 'losses': 3, 'dailyStreak': 4, 'lastDailySolved': '2026-11-23',
           'stats': {'naval': {'played': 8, 'wins': 6, 'losses': 2, 'shots': 400, 'hits': 180, 'sunk': 31, 'bestShots': 41}, 'c4': {'played': 3, 'wins': 2, 'losses': 1, 'draws': 0},
                     'daily': {'played': 10, 'solved': 8, 'failed': 2, 'bestStreak': 5, 'dist': [0, 0, 2, 4, 1, 1]}}, 'history': []}
    br = launch(p); C = br.new_page(); errs = []; C.on('pageerror', lambda e: errs.append(str(e)))
    C.goto('file://' + os.path.abspath('dist/gamehub.html')); C.wait_for_timeout(500)
    C.evaluate(f"localStorage.setItem('playstack_friendly_v3', {json.dumps(json.dumps(old))})"); C.reload(); C.wait_for_timeout(1500)
    got = C.evaluate("[profile.username, profile.xp, profile.navalElo, profile.wins, profile.losses, profile.dailyStreak, profile.stats.naval.played, profile.stats.naval.wins, profile.stats.naval.bestShots, profile.stats.c4.played, profile.stats.daily.played, profile.stats.daily.dist.join(''), profile.v]")
    print('   old profile cleaned:', got)
    check(got[0].startswith('Player') and got[1:11] == [120, 1216, 2, 0, 1, 2, 2, 41, 0, 1] and got[11] == '000100' and got[12] == 2, 'an old profile keeps only what was really earned')
    C.reload(); C.wait_for_timeout(1000)
    check(C.evaluate("profile.xp") == 120, 'the clean-up only happens once')
    check(not errs, 'no page errors ' + str(errs[:2]))
    done(A, B)
