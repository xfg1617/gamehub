    /* =========================================================================
       VIETNAMESE, part 5 (Nov 2026 round 6): the new games (Caro, Thirteen, Werewolf, Trivia Rush, Funny Answers).
       VI_MORE5 = exact lines, VI_PAT5 = lines with numbers or names in them.
       ========================================================================= */
    window.VI_MORE5 = {
      // Caro
      "Five in a row on a big board. Vietnam's favourite pen-and-paper game: quick to learn, hard to master.": 'Năm quân liền nhau trên bàn cờ lớn. Trò chơi giấy bút được yêu thích nhất Việt Nam: dễ học, khó giỏi.',
      'BOARD': 'BÀN CỜ', '15 × 15': '15 × 15', '19 × 19': '19 × 19', "Vietnamese rule: blocked five doesn't win": 'Luật chặn hai đầu',
      'If the other player has a mark at both ends of your five, it does not count.': 'Nếu đối thủ chặn cả hai đầu năm quân của bạn thì không tính thắng.',
      'HOW TO WIN': 'CÁCH THẮNG', 'Get': 'Xếp', 'five in a row': 'năm quân liền nhau', ': across, down or diagonally. When the other player has': ': ngang, dọc hoặc chéo. Khi đối thủ có',
      'three or four': 'ba hoặc bốn quân', 'in a row, block an end!': 'liền nhau, hãy chặn một đầu!', 'Vietnamese rule:': 'Luật chặn hai đầu:',
      " five with the other player's marks at both ends doesn't win.": ' năm quân bị đối thủ chặn cả hai đầu thì không thắng.',
      'The board is full: a draw.': 'Bàn cờ đã đầy: hòa.', 'Easy CPU': 'Máy Dễ', 'Medium CPU': 'Máy Vừa', 'Hard CPU': 'Máy Khó', 'BEAT HARD CPU': 'THẮNG MÁY KHÓ',
      'QUICK WIN': 'THẮNG NHANH', 'wins this game: five in a row!': 'thắng ván này: năm quân liền nhau!',
      // Thirteen
      "Vietnam's favourite card game (Tiến Lên). Beat the cards on the table with higher ones and be the first to get rid of all 13.": 'Trò bài được yêu thích nhất Việt Nam. Chặn bài trên bàn bằng bài lớn hơn và là người đầu tiên đánh hết 13 lá.',
      'HANDS': 'SỐ VÁN', '1 hand': '1 ván', '3 hands': '3 ván', '5 hands': '5 ván', 'Smart': 'Giỏi',
      'Each hand: 1st place gets the most points. After the last hand, most points wins.': 'Mỗi ván: hạng nhất được nhiều điểm nhất. Hết ván cuối, ai nhiều điểm nhất thắng.',
      'Time for each turn. When it runs out you pass (or play your lowest card when you lead).': 'Thời gian mỗi lượt. Hết giờ thì bạn bỏ lượt (hoặc đánh lá nhỏ nhất nếu bạn đi trước).',
      '▶ Play': '▶ Đánh', 'Pass': 'Bỏ lượt', 'Pass (nothing beats it)': 'Bỏ lượt (không chặn được)', 'Clear': 'Bỏ chọn', '💣 BOMB!': '💣 CHẶT!',
      'You lead: play anything.': 'Bạn đi trước: đánh gì cũng được.', "Those cards don't make a play.": 'Mấy lá này không thành bộ.',
      'Include your lowest card to start.': 'Phải đánh kèm lá nhỏ nhất để mở ván.', 'PASSED': 'BỎ LƯỢT', 'OUT FIRST': 'VỀ NHẤT', 'BOMBS': 'CHẶT HEO',
      'Time is up! Your lowest card was played.': 'Hết giờ! Đã đánh lá nhỏ nhất của bạn.', 'Time is up! You passed.': 'Hết giờ! Bạn đã bỏ lượt.',
      'You went out first! 🏆': 'Bạn về nhất! 🏆', 'Your points': 'Điểm của bạn', 'Bombs': 'Chặt heo', 'Your place': 'Hạng của bạn', 'BOMB': 'CHẶT',
      'A TWO': 'HEO', 'with a higher one, or pass.': 'bằng bộ lớn hơn, hoặc bỏ lượt.', 'Beat': 'Chặn',
      // Trivia Rush
      'Quick-fire quiz: everyone gets the same question, fastest right answer scores most. 12 categories, English or Vietnamese.': 'Đố vui siêu tốc: mọi người cùng một câu hỏi, ai đúng nhanh nhất được nhiều điểm nhất. 12 chủ đề, tiếng Anh hoặc tiếng Việt.',
      'QUESTIONS IN': 'NGÔN NGỮ CÂU HỎI', 'Everyone at the table gets the questions in this language.': 'Mọi người trong bàn nhận câu hỏi bằng ngôn ngữ này.',
      'CATEGORY': 'CHỦ ĐỀ', 'All mixed': 'Trộn tất cả', 'Geography': 'Địa lý', 'Movies & TV': 'Phim ảnh', 'Music': 'Âm nhạc', 'Sports': 'Thể thao', 'Science': 'Khoa học',
      'History': 'Lịch sử', 'Food': 'Ẩm thực', 'Animals': 'Động vật', 'Games': 'Trò chơi', 'Vietnam': 'Việt Nam', 'USA': 'Nước Mỹ', 'Weird Facts': 'Chuyện lạ',
      'QUESTIONS': 'SỐ CÂU HỎI', 'TIME TO ANSWER': 'THỜI GIAN TRẢ LỜI', 'DIFFICULTY': 'ĐỘ KHÓ', 'Mixed': 'Trộn', 'Hard': 'Khó', 'Just me': 'Chỉ mình tôi', 'Genius': 'Thiên tài',
      'Right answers': 'Câu trả lời đúng', 'Score': 'Điểm', 'Best streak': 'Chuỗi dài nhất', 'RIGHT ANSWERS': 'CÂU ĐÚNG', 'BEST STREAK': 'CHUỖI DÀI NHẤT',
    };
    window.VI_PAT5 = [
      [/^(\d+) \/ (\d+) right!$/, 'Đúng $1 / $2 câu!'], [/^([\d,]+) points$/, '$1 điểm'], [/^(\d+)\/(\d+) right$/, 'đúng $1/$2'],
      [/^PAIR OF (.+)S$/, 'ĐÔI $1'], [/^THREE (.+)S$/, 'SÁM $1'], [/^FOUR (.+)S$/, 'TỨ QUÝ $1'], [/^STRAIGHT (\S+) → (\S+)$/, 'SẢNH $1 → $2'], [/^(\d) PAIRS IN A ROW$/, '$1 ĐÔI THÔNG'],
      [/^HAND (\d+) OF (\d+)$/, 'VÁN $1 / $2'], [/^HAND (\d+) OVER$/, 'HẾT VÁN $1'], [/^(\d+) cards? · (-?\d+) pts$/, '$1 lá · $2 điểm'], [/^(\d+) cards?$/, '$1 lá'],
      [/^(.+) leads?: any play$/, '$1 đi trước: đánh gì cũng được'], [/^(.+) · (\d+) passed$/, '$1 · $2 bỏ lượt'],
      [/^five in a row in (\d+) moves$/, 'năm quân liền nhau sau $1 nước'], [/^([XO]) · (\d+) wins?$/, '$1 · thắng $2'],
      [/^X · (.+)$/, 'X · $1'], [/^O · (.+)$/, 'O · $1'],
    ];
