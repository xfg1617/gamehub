    /* =========================================================================
       LANGUAGE: English / Tiếng Việt (Nov 2026, Inna; stage 1). The page is written in English; when Vietnamese is
       picked, every piece of text that exactly matches a line in VI below is swapped as it appears on screen (a
       MutationObserver), plus a few patterns ("3-6 PLAYERS · ~20 MIN"). Things people type (chat, names) are never
       touched. Stage 1 covers the menus, home page, game tiles, setup screens, rooms, profile, friends, leaderboard and
       the common game buttons; game rules and guides come later. Choice saved in ps_lang; switching reloads the page.
       ========================================================================= */
    const LANG = (() => {
      let code = 'en';
      try { code = localStorage.getItem('ps_lang') === 'vi' ? 'vi' : 'en'; } catch (e) {}
      return { code };
    })();
    window.LANG = LANG;
    (() => {
      const VI = {
        // side menu, phone tabs, footer
        'Play': 'Chơi', 'Daily Word': 'Chữ Mỗi Ngày', 'Leaderboard': 'Bảng Xếp Hạng', 'How to Play': 'Cách Chơi', 'Friends': 'Bạn Bè', 'Discord': 'Discord',
        'Sound & Music': 'Âm Thanh & Nhạc', 'Sign up · Log in': 'Đăng ký · Đăng nhập', 'online now': 'đang online', 'ON · OFF': 'BẬT · TẮT', 'ON · ON': 'BẬT · BẬT',
        'OFF · OFF': 'TẮT · TẮT', 'OFF · ON': 'TẮT · BẬT', 'PLAY': 'CHƠI', 'DAILY': 'MỖI NGÀY', 'RANKS': 'XẾP HẠNG', 'RULES': 'LUẬT', 'ME': 'TÔI',
        'CHAT': 'CHAT', 'ROOM': 'PHÒNG', '👥 Friends': '👥 Bạn bè', '· Built for quick matches with friends': '· Chơi nhanh cùng bạn bè',
        '© 2026 GameHub. All rights reserved.': '© 2026 GameHub. Bảo lưu mọi quyền.', 'Terms': 'Điều khoản', 'Privacy': 'Quyền riêng tư',
        // home page
        'Play with friends': 'Chơi cùng bạn bè', 'Pick any game, get a room code, send it to your friends.': 'Chọn một trò, lấy mã phòng, gửi cho bạn bè.',
        'JOIN': 'VÀO', '🏆 Ranked match': '🏆 Đấu xếp hạng', '· play someone at your level': '· đấu với người cùng trình độ', '💬 Discord': '💬 Discord',
        '· find people to play with': '· tìm người chơi cùng',
        'Ready to play,': 'Sẵn sàng chơi chưa,', 'DAY STREAK': 'CHUỖI NGÀY', 'NAVAL ELO': 'ELO HẢI CHIẾN', 'Play with Friends': 'Chơi cùng bạn bè',
        'Create a room for any game and send your friends the code': 'Tạo phòng cho bất kỳ trò nào rồi gửi mã cho bạn bè', '＋ CREATE A ROOM': '＋ TẠO PHÒNG',
        'HAVE A ROOM CODE?': 'CÓ MÃ PHÒNG?', 'Join': 'Vào', 'RANKED MATCH': 'ĐẤU XẾP HẠNG',
        'Pick a game and get paired with a player at your level. Wins raise your ranking.': 'Chọn trò chơi để ghép cặp với người cùng trình độ. Thắng để lên hạng.',
        'Find a Ranked Match ▶': 'Tìm trận xếp hạng ▶', 'COMMUNITY': 'CỘNG ĐỒNG', 'Join our Discord!': 'Tham gia Discord của chúng tôi!', 'Join the Discord ▶': 'Tham gia Discord ▶',
        'ALL GAMES': 'TẤT CẢ TRÒ CHƠI', 'ALL': 'TẤT CẢ', 'BOARD': 'CỜ', 'CARD': 'BÀI', 'WORD': 'CHỮ', 'PARTY': 'VUI NHÓM', 'SPORTS': 'THỂ THAO',
        'NEW': 'MỚI', 'HOT': 'HOT', 'SOON': 'SẮP CÓ', 'OPEN ROOMS': 'PHÒNG ĐANG MỞ', 'All': 'Tất cả', '4-Row': 'Bốn Liền', 'Naval': 'Hải Chiến',
        'No open tables right now.': 'Chưa có bàn nào đang mở.', 'Pick a game and choose': 'Chọn một trò rồi chọn', 'Online · quick match': 'Online · ghép nhanh',
        ': others can join you here.': ': người khác có thể vào cùng bạn ở đây.', 'Rooms fill fast': 'Phòng đầy rất nhanh', '↻ REFRESH': '↻ LÀM MỚI',
        'GLOBAL CHAT': 'TRÒ CHUYỆN CHUNG', 'No messages yet. Say hi!': 'Chưa có tin nhắn. Chào mọi người đi!', '👋 Hi all': '👋 Chào mọi người',
        'Anyone up for a game?': 'Có ai chơi một ván không?', 'GG': 'GG', 'Send': 'Gửi', 'Say something nice…': 'Nói gì đó dễ thương…',
        'No open rooms right now. Create one!': 'Chưa có phòng nào. Tạo một phòng nhé!',
        // game names
        'Chess': 'Cờ Vua', 'Checkers': 'Cờ Đam', 'Landlord': 'Cờ Tỷ Phú', 'Four-in-a-Row': 'Bốn Quân Liền', 'Tic-Tac-Toe': 'Cờ Ca-rô', 'Blackjack': 'Xì Dách',
        'Kaboom Cats': 'Mèo Nổ', 'Word Duel': 'Đấu Chữ', 'Word Connect': 'Nối Chữ', 'Find the Impostor': 'Tìm Kẻ Giả Mạo', 'Doodle Guess': 'Vẽ & Đoán',
        'Pool': 'Bi-a', 'Dominoes': 'Domino', 'Whodunit': 'Ai Là Thủ Phạm?', 'Island Settlers': 'Khai Hoang Đảo', 'Castles & Kings': 'Lâu Đài & Vua',
        'Mine Saboteurs': 'Phá Hoại Hầm Mỏ', 'Wall Maze': 'Mê Cung Tường', 'Bullshit': 'Nói Xạo', 'Trivia Rush': 'Đố Vui Nhanh', 'Sea Battle': 'Hải Chiến',
        'CHESS': 'CỜ VUA', 'POKER': 'POKER', 'UNO': 'UNO', 'BULLSHIT': 'NÓI XẠO',
        // game header, setup screen, rooms
        '← Lobby': '← Sảnh', '? Guide': '? Hướng dẫn', '📜 Moves': '📜 Nước đi', '📜 Log': '📜 Nhật ký', 'HOW DO YOU WANT TO PLAY?': 'BẠN MUỐN CHƠI THẾ NÀO?',
        'Online match': 'Trận online', 'Private room': 'Phòng riêng', 'Solo': 'Chơi một mình',
        'Get paired with a real player at your level. Ranked.': 'Ghép cặp với người thật cùng trình độ. Có xếp hạng.',
        'Join a table with real players.': 'Vào bàn cùng người chơi thật.',
        'Your own room: invite friends with a link, add computer players, choose the settings together and chat.': 'Phòng của bạn: mời bạn bè bằng đường link, thêm người chơi máy, cùng chọn cài đặt và trò chuyện.',
        'Your own room: invite a friend with a link or add a computer opponent, choose the timer and chat.': 'Phòng của bạn: mời bạn bè bằng đường link hoặc thêm đối thủ máy, chọn thời gian và trò chuyện.',
        'Your own room: invite friends with a link, choose the settings together and chat.': 'Phòng của bạn: mời bạn bè bằng đường link, cùng chọn cài đặt và trò chuyện.',
        '? How to play': '? Cách chơi', 'Good luck!': 'Chúc may mắn!', 'Nice move!': 'Nước hay!', 'Rematch?': 'Chơi lại?', '🃏 Hand ranks': '🃏 Thứ hạng bài',
        'WAITING': 'ĐANG CHỜ', 'SEARCHING': 'ĐANG TÌM', 'Your room is open. Send the link to your friends.': 'Phòng đã mở. Gửi đường link cho bạn bè nhé.',
        'Copy invite link': 'Sao chép link mời', 'Invite friends': 'Mời bạn bè', 'Share': 'Chia sẻ', 'HOST': 'CHỦ PHÒNG', 'YOU': 'BẠN', 'Open seat': 'Ghế trống',
        'ADD COMPUTER PLAYERS': 'THÊM NGƯỜI CHƠI MÁY', 'PLAY THE COMPUTER': 'CHƠI VỚI MÁY', 'Not enough friends? Computer players fill the empty seats.': 'Thiếu bạn? Người chơi máy sẽ ngồi vào ghế trống.',
        'GAME SETTINGS': 'CÀI ĐẶT TRÒ CHƠI', 'TAP TO CHANGE': 'CHẠM ĐỂ ĐỔI', 'COMPUTER LEVEL': 'TRÌNH ĐỘ MÁY', 'COMPUTER PLAYERS': 'NGƯỜI CHƠI MÁY',
        'Start': 'Bắt đầu', 'Start game': 'Bắt đầu', 'Leave room': 'Rời phòng', 'Leave': 'Rời đi', 'Leave table': 'Rời bàn', 'ROOM CHAT': 'CHAT PHÒNG',
        'Table': 'Bàn', 'All players': 'Mọi người', 'Off': 'Tắt', 'On': 'Bật', 'Slow': 'Chậm', 'Normal': 'Thường', 'Fast': 'Nhanh', 'Easy': 'Dễ', 'Medium': 'Vừa',
        'Hard': 'Khó', 'ACTION TIMER': 'ĐỒNG HỒ LƯỢT', 'BLIND LEVELS': 'MỨC CƯỢC MÙ', 'STARTING CHIPS': 'CHIP KHỞI ĐẦU', 'PLAYERS': 'SỐ NGƯỜI', 'ROUNDS': 'SỐ VÒNG',
        'DRAWING TIME': 'THỜI GIAN VẼ', 'WORDS': 'NGÔN NGỮ TỪ', 'TIME TO SHOUT': 'THỜI GIAN HÔ', 'GAME ENDS AT': 'KẾT THÚC KHI CÓ',
        'Invite friends or add computer players (at least 2 players).': 'Mời bạn bè hoặc thêm người chơi máy (ít nhất 2 người).',
        'Waiting for the host to start...': 'Đang chờ chủ phòng bắt đầu...', 'Give up': 'Bỏ cuộc', 'Resign': 'Đầu hàng', 'New game': 'Ván mới',
        'Play again': 'Chơi lại', 'Back to Lobby': 'Về sảnh', 'Back to setup': 'Về phần cài đặt', 'You win!': 'Bạn thắng!', '🔁 Rematch': '🔁 Chơi lại',
        'YOUR TURN': 'LƯỢT CỦA BẠN', 'YOUR MOVE': 'LƯỢT CỦA BẠN', 'Your turn': 'Lượt của bạn', 'GAME OVER': 'HẾT VÁN', 'YOUR CARDS': 'BÀI CỦA BẠN',
        'Leave this game?': 'Rời ván này?', 'Stay': 'Ở lại', 'Cancel': 'Hủy', 'OK': 'OK', 'Close': 'Đóng',
        // profile, account, welcome
        'Your Player Card': 'Thẻ Người Chơi', 'Level': 'Cấp', 'Elo': 'Elo', 'Win %': '% Thắng', 'Streak': 'Chuỗi', 'DISPLAY NAME': 'TÊN HIỂN THỊ',
        'PICK YOUR AVATAR': 'CHỌN ẢNH ĐẠI DIỆN', 'Save Profile': 'Lưu', 'My Profile': 'Hồ Sơ Của Tôi', 'PLAYER CARD': 'THẺ NGƯỜI CHƠI', 'GUEST': 'KHÁCH',
        'Account': 'Tài khoản', 'Guest (not saved)': 'Khách (chưa lưu)', 'Edit player card': 'Sửa thẻ người chơi', 'Create free account': 'Tạo tài khoản miễn phí',
        'I already have an account': 'Tôi đã có tài khoản', 'STATS LOCKED': 'THỐNG KÊ ĐANG KHÓA', 'Your stats live in an account': 'Thống kê được lưu trong tài khoản',
        "You're playing as a guest. Create a free account to keep everything you earn:": 'Bạn đang chơi với tư cách khách. Tạo tài khoản miễn phí để giữ mọi thứ bạn đạt được:',
        'An overview of how you play': 'Tổng quan cách bạn chơi', 'Stats and match history for every game': 'Thống kê và lịch sử trận của mọi trò',
        'Badges and your Daily Word streak': 'Huy hiệu và chuỗi Chữ Mỗi Ngày', 'Sign in': 'Đăng nhập', 'Sign up': 'Đăng ký', 'Log in': 'Đăng nhập', 'Log out': 'Đăng xuất',
        'WELCOME!': 'CHÀO MỪNG!', 'NICE WIN!': 'THẮNG ĐẸP!', 'Save your progress': 'Lưu tiến trình', 'Save this win': 'Lưu chiến thắng này',
        'Make a free account to keep what you earn.': 'Tạo tài khoản miễn phí để giữ những gì bạn đạt được.', 'Progress': 'Tiến trình', 'Avatars': 'Ảnh đại diện',
        'Badges': 'Huy hiệu', 'BADGES': 'HUY HIỆU', 'Maybe later': 'Để sau',
        // player card / profile page
        'View full profile ▶': 'Xem hồ sơ đầy đủ ▶', '＋ Add friend': '＋ Kết bạn', 'Friend request sent': 'Đã gửi lời mời kết bạn', 'Accept friend request': 'Chấp nhận kết bạn',
        'Remove friend': 'Hủy kết bạn', 'RANKINGS': 'XẾP HẠNG', 'No ranked games yet.': 'Chưa có trận xếp hạng nào.', 'No games played yet.': 'Chưa chơi trận nào.',
        'LEVEL': 'CẤP', 'GAMES': 'SỐ TRẬN', 'WIN %': '% THẮNG', 'WINS': 'THẮNG', 'OVERVIEW': 'TỔNG QUAN', 'GAMES PLAYED': 'CÁC TRÒ ĐÃ CHƠI', 'RECENT GAMES': 'TRẬN GẦN ĐÂY',
        'PLAYER PROFILE': 'HỒ SƠ NGƯỜI CHƠI', 'GAME': 'TRÒ CHƠI', 'PLAYED': 'ĐÃ CHƠI', 'WON': 'THẮNG', 'RATING': 'ĐIỂM', 'No recent games.': 'Chưa có trận gần đây.',
        // leaderboard, friends, how to play
        'Top players on GameHub. Win ranked matches to climb the podium!': 'Những người chơi giỏi nhất GameHub. Thắng trận xếp hạng để leo lên bục!',
        'Overall Elo': 'Elo tổng', 'Daily Streak': 'Chuỗi ngày', 'TOP 3': 'TOP 3', 'ELO': 'ELO', 'ALL CONTENDERS': 'TẤT CẢ NGƯỜI CHƠI',
        "Look players up, add friends, see who's online, chat and invite them to your room.": 'Tìm người chơi, kết bạn, xem ai đang online, trò chuyện và mời họ vào phòng.',
        'TIP': 'MẸO', "You're playing as a guest.": 'Bạn đang chơi với tư cách khách.', 'Create an account': 'Tạo tài khoản',
        'so your friends list follows you to any device.': 'để danh sách bạn bè đi theo bạn trên mọi thiết bị.', 'FIND A PLAYER': 'TÌM NGƯỜI CHƠI', 'Search': 'Tìm',
        'Look up anyone by their player name, see their rankings, and add them as a friend.': 'Tìm bất kỳ ai theo tên, xem xếp hạng và kết bạn với họ.',
        'MY FRIENDS': 'BẠN BÈ CỦA TÔI', 'Add friend': 'Kết bạn', 'FRIEND CHAT': 'CHAT BẠN BÈ', 'Chat': 'Chat', 'Type a player name': 'Nhập tên người chơi',
        'Pick a game to see how it works, step by step.': 'Chọn một trò để xem cách chơi từng bước.', 'PLAYER SELECT': 'CHỌN NGƯỜI CHƠI',
        'No friends yet. Look players up above, or tap a name in any chat, then press': 'Chưa có bạn bè. Hãy tìm người chơi ở trên, hoặc chạm vào tên trong bất kỳ khung chat nào, rồi bấm',
        'Pick a friend and press': 'Chọn một người bạn rồi bấm', '. Only the two of you can read your messages.': '. Chỉ hai bạn đọc được tin nhắn.',
        // music panel, language switch
        'SOUND & MUSIC': 'ÂM THANH & NHẠC', 'Sound effects': 'Hiệu ứng âm thanh', 'Music': 'Nhạc', 'Volume': 'Âm lượng', 'Music during games': 'Nhạc khi đang chơi',
        'Auto': 'Tự động', 'Shuffle': 'Ngẫu nhiên',
        // Doodle Guess
        'Choose a word to draw:': 'Chọn một từ để vẽ:', 'Type your guess...': 'Nhập từ bạn đoán...', 'Guess': 'Đoán', 'GUESSES': 'LƯỢT ĐOÁN', 'Undo': 'Hoàn tác',
        'Clear': 'Xóa hết', 'Thin': 'Mảnh', 'Fat': 'Đậm', 'YOUR TURN TO DRAW': 'ĐẾN LƯỢT BẠN VẼ', 'Time left': 'Còn lại',
      };
      Object.keys(window.VI_MORE || {}).forEach((k) => { if (!(k in VI)) VI[k] = window.VI_MORE[k]; });   // part 1: zz_i18n_vi.js
      Object.keys(window.VI_MORE2 || {}).forEach((k) => { if (!(k in VI)) VI[k] = window.VI_MORE2[k]; });   // part 2: zz_i18n_vi2.js
      const PAT = [
        [/^(\d+)[–-](\d+) PLAYERS/, (m, a, b) => `${a}-${b} NGƯỜI`], [/(\d+) PLAYERS\b/g, '$1 NGƯỜI'], [/~(\d+) MIN\b/g, '~$1 PHÚT'], [/(\d+) MIN\b/g, '$1 PHÚT'],
        [/\bSOLO\b/g, 'CHƠI ĐƠN'], [/\bCHIPS\b/g, 'CHIP'], [/^(\d+) GAMES$/, '$1 TRÒ'], [/^● (\d+) online$/, '● $1 online'], [/^(\d+) chatting$/, '$1 đang trò chuyện'],
        [/^YOUR ROOM · (\w+)$/, 'PHÒNG CỦA BẠN · $1'], [/^TABLE (\w+) CHAT$/, 'CHAT BÀN $1'], [/^(.+) ROOM$/, (m, g) => `PHÒNG ${VI[g.charAt(0) + g.slice(1).toLowerCase()] ? VI[g.charAt(0) + g.slice(1).toLowerCase()].toUpperCase() : g}`],
        [/^\? How to play (.+)$/, (m, g) => `? Cách chơi ${VI[g] || g}`], [/^(\d+)\/(\d+) XP to Lv (\d+)$/, '$1/$2 XP lên Cấp $3'], [/^Your Rank: #(\d+)$/, 'Hạng của bạn: #$1'],
        [/^(\d+) games · (\d+)% win rate$/, '$1 trận · $2% thắng'], [/^(\d+) games · (\d+)% WR$/, '$1 trận · $2% thắng'], [/^(\d+) ONLINE · (\d+)$/, '$1 ONLINE · $2'],
        [/^(.+)'S TURN$/, 'LƯỢT CỦA $1'], [/^(.+)’S TURN$/, 'LƯỢT CỦA $1'],
        // Nov 25: results, places, pop-up notes
        [/^You finished (\d+)(?:st|nd|rd|th)$/, 'Bạn về hạng $1'], [/^You finished (\d+)(?:st|nd|rd|th)!$/, 'Bạn về hạng $1!'], [/^(\d+)(?:ST|ND|RD|TH)$/, 'HẠNG $1'],
        [/^(\d+)(?:st|nd|rd|th) of (\d+)$/, 'Hạng $1/$2'], [/^(.+) wins$/, '$1 thắng'], [/^(.+) wins!$/, '$1 thắng!'], [/^You are on (.+)$/, 'Bạn đang ở $1'], [/^(.+) is on (.+)$/, '$1 đang ở $2'],
        [/^Friend request sent to (.+)\.$/, 'Đã gửi lời mời kết bạn tới $1.'], [/^You and (.+) are now friends!$/, 'Bạn và $1 đã là bạn bè!'],
        [/^(.+): (royal|faith|trade|guard|wonder) building, costs (\d+)$/, (m, n, c, k) => `${n}: công trình ${{ royal: 'hoàng gia', faith: 'tôn giáo', trade: 'thương mại', guard: 'quân sự', wonder: 'kỳ quan' }[c]}, giá ${k}`],
        [/^Waiting for (.+)'s screen to answer\. Your shot is marked on the map\.$/, 'Đang chờ màn hình của $1 trả lời. Phát bắn của bạn đã được đánh dấu.'],
        [/^Target ([A-J]\d+) locked\.$/, 'Đã khóa mục tiêu $1.'], [/^Splash! ([A-J]\d+) was open water\.$/, 'Tõm! $1 là biển trống.'], [/^RANKED ONLINE · (.+)$/, (m, g) => `XẾP HẠNG ONLINE · ${(VI[g.charAt(0) + g.slice(1).toLowerCase()] || g).toUpperCase()}`],
        [/^(\d+) PLAYERS$/, '$1 NGƯỜI'], [/^Tip: (.+)$/, (m, t) => `Mẹo: ${VI[t] || t}`],
        [/^(.+) ONLINE$/, (m, g) => { const k = Object.keys(VI).find((x) => x.toUpperCase() === g); return k ? `${VI[k].toUpperCase()} ONLINE` : m; }],
        [/^HOW TO PLAY · (.+)$/, (m, g) => { const k = Object.keys(VI).find((x) => x.toUpperCase() === g); return `CÁCH CHƠI · ${k ? VI[k].toUpperCase() : g}`; }],
        [/^((?:\d+[-–]\d+ NGƯỜI|\d+ NGƯỜI|1v1|CHƠI ĐƠN)) · (.+)$/, (m, a, b) => `${a} · ${VI[b] || b.replace('GRID', 'BẢNG').replace('COLUMNS', 'CỘT')}`],
        [/^Invite friends or add computer players \(at least (\d+) players\)\.$/, 'Mời bạn bè hoặc thêm người chơi máy (ít nhất $1 người).'],
        [/^Waiting for friends to join \(at least (\d+) players\)\.\.\.$/, 'Đang chờ bạn bè vào phòng (ít nhất $1 người)...'],
        [/^Waiting for (.+)\.\.\.$/, 'Đang chờ $1...'], [/^(\d+) online now$/, '$1 đang online'],
      ];
      // only exact lines are swapped, so names and chat stay as typed
      const SKIP = '.chat-msg, #dg-feed, .logbox, .cf-list, #fr-chatwin .chat-list, input, textarea, script, style, [data-no-tr]';
      function tr(t) {
        const s = t.trim(); if (!s) return null;
        if (VI[s]) return t.replace(s, VI[s]);
        let out = s, hit = false;
        for (const [re, to] of PAT) { const n = out.replace(re, to); if (n !== out) { out = n; hit = true; } }
        return hit ? t.replace(s, out) : null;
      }
      function walk(root) {
        if (!root) return;
        if (root.nodeType === 3) { const e = root.parentElement; if (!e || e.closest(SKIP)) return; const v = tr(root.nodeValue); if (v !== null && v !== root.nodeValue) root.nodeValue = v; return; }
        if (root.nodeType !== 1 || root.closest(SKIP)) return;
        const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const list = []; while (w.nextNode()) list.push(w.currentNode);
        list.forEach(walk);
        root.querySelectorAll('input[placeholder], textarea[placeholder]').forEach((i) => { const v = VI[i.placeholder]; if (v) i.placeholder = v; });
        if (root.matches && root.matches('input[placeholder]') && VI[root.placeholder]) root.placeholder = VI[root.placeholder];
      }
      // the switch: in the side menu (and so in the phone ☰ menu, which copies it)
      function addSwitch() {
        const nav = document.querySelector('aside.side nav'); if (!nav || document.getElementById('nav-lang')) return;
        const b = document.createElement('button');
        b.id = 'nav-lang'; b.className = (nav.querySelector('button[id^="nav-"]') || {}).className || '';
        b.setAttribute('onclick', 'setLang(LANG.code === "vi" ? "en" : "vi")'); b.setAttribute('data-no-tr', '');
        b.innerHTML = `<span class="lang-flag">${LANG.code === 'vi' ? 'EN' : 'VI'}</span><span>${LANG.code === 'vi' ? 'English' : 'Tiếng Việt'}</span>`;
        nav.appendChild(b);
      }
      window.setLang = (c) => { try { localStorage.setItem('ps_lang', c); } catch (e) {} location.reload(); };
      window.trVI = (s) => (LANG.code === 'vi' ? (tr(String(s)) || s) : s);
      addSwitch();
      if (LANG.code !== 'vi') return;
      document.documentElement.lang = 'vi';
      walk(document.body);
      new MutationObserver((ms) => {
        for (const m of ms) {
          if (m.type === 'characterData') walk(m.target);
          else m.addedNodes.forEach(walk);
        }
      }).observe(document.body, { childList: true, subtree: true, characterData: true });
    })();
