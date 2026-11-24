"""Invite links: a host opens a private room (the link only exists once the room is open, Nov 2026) and copies the
short invite link (site/r/CODE); a friend opens that link in a brand-new browser tab. The friend must land IN the host's room (same table), not on a setup screen or a game of their own.
Checked for a 2-player game (Tic-Tac-Toe), a bigger table (Dominoes, 3 seats), Chess and Sea Battle,
plus an expired code. Stand-in service (the tabs share it like separate devices)."""
import sys, time; sys.path.insert(0, 'test')
from nplib import *

def room_link(A):
    return 'http://' + A.evaluate("document.querySelector('.np-linkline').textContent").strip() if not A.evaluate("document.querySelector('.np-linkline').textContent").startswith('http') else A.evaluate("document.querySelector('.np-linkline').textContent").strip()

def host_room(A, game):
    A.evaluate("navigateTo('play', true)"); A.wait_for_timeout(400)
    A.evaluate(f"selectedRoomGame = '{game}'; launchPrivateRoom()"); A.wait_for_timeout(900)
    A.click('#su-go'); A.wait_for_timeout(1500)
    link = A.evaluate("(document.getElementById('su-link') || {}).value || null")
    return link

def open_link(B, link):
    # a fresh visit: the page loads with the link in the address bar
    B.goto(link); B.wait_for_load_state()
    B.wait_for_timeout(6000)

with sync_playwright() as p:
    A, B = players(p, 2)
    # 1. Tic-Tac-Toe (2 seats)
    A.evaluate("navigateTo('play', true)"); A.evaluate("selectedRoomGame = 'tictactoe'; launchPrivateRoom()"); A.wait_for_timeout(900)
    check(A.query_selector('#su-link') is None, 'no invite link before the room exists')
    code = open_table(A, 'tictactoe', 'room'); link = room_link(A)
    check(link.endswith('/r/' + code), 'the invite link is short: site/r/CODE')
    print('   link:', link)
    open_link(B, link)
    A.click('#np-start'); A.wait_for_timeout(2500)   # private rooms start when the host presses Start
    barA = A.evaluate("(document.querySelector('.np-bar') || {}).textContent || ''"); barB = B.evaluate("(document.querySelector('.np-bar') || {}).textContent || ''")
    print('   A:', barA[:70], '| B:', barB[:70])
    check(code in barB and code in barA and B.evaluate("NET.me.name") in barA, 'Tic-Tac-Toe: the friend lands in the host\'s room and the game starts')
    # 2. Dominoes, 3 seats: friend joins the lobby
    A.evaluate("closeActiveGame()"); B.evaluate("closeActiveGame()")
    code = open_table(A, 'dominoes', 'room', {'n': 3}); link = room_link(A)
    open_link(B, link)
    seatsA = A.evaluate("document.querySelectorAll('.np-seat.on').length")
    print('   dominoes seats taken on host screen:', seatsA)
    check(seatsA == 2, 'Dominoes: the friend appears in the host\'s lobby')
    A.evaluate("closeActiveGame()"); B.evaluate("closeActiveGame()")
    # 3. Chess
    A.evaluate("navigateTo('play', true); openGame('chess')"); A.wait_for_timeout(600)
    A.click('[data-mode="friend"]'); A.wait_for_timeout(2500)
    link = room_link(A)
    open_link(B, link)
    A.click('#np-start'); A.wait_for_timeout(3000)
    chB = B.evaluate("(document.getElementById('ch-lvl') || {}).textContent || ''"); chA = A.evaluate("(document.getElementById('ch-lvl') || {}).textContent || ''")
    print('   chess A:', chA, '| B:', chB)
    check('ROOM' in chB and 'ROOM' in chA, 'Chess: the friend lands in the host\'s game')
    A.evaluate("closeActiveGame()"); B.evaluate("closeActiveGame()")
    # 4. Sea Battle (online version)
    code = open_table(A, 'naval', 'room'); link = room_link(A)
    open_link(B, link)
    A.click('#np-start'); A.wait_for_timeout(2500)
    check(A.query_selector('#game-root #ng-setup-grid') and B.query_selector('#game-root #ng-setup-grid'), 'Sea Battle: both players are on the fleet setup board together')
    A.evaluate("closeActiveGame()"); B.evaluate("closeActiveGame()")
    # 5. an old link whose room is gone
    B.add_init_script("document.addEventListener('DOMContentLoaded', () => new MutationObserver(() => { const c = document.getElementById('toast-container'); if (c) window.__toasts = (window.__toasts || '') + ' | ' + c.textContent; }).observe(document, { subtree: true, childList: true, characterData: true }))")
    B.goto(link.rsplit('/r/', 1)[0] + '/r/ZZZZ'); B.wait_for_timeout(6000)
    toast = B.evaluate("window.__toasts || ''")
    toast = ' | '.join(t for t in dict.fromkeys(x.strip() for x in toast.split('|')) if 'ZZZZ' in t)
    print('   expired link toast:', toast[:120])
    check("isn't open" in toast and 'Joining' not in toast, 'an expired link says the room is not open (instead of pretending to join)')
    done(A, B)
