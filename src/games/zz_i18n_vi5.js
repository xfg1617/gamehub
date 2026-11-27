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
    };
    window.VI_PAT5 = [
      [/^five in a row in (\d+) moves$/, 'năm quân liền nhau sau $1 nước'], [/^([XO]) · (\d+) wins?$/, '$1 · thắng $2'],
      [/^X · (.+)$/, 'X · $1'], [/^O · (.+)$/, 'O · $1'],
    ];
