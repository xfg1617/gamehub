    /* =========================================================================
       HOW TO PLAY in Vietnamese (Nov 2026). When LANG.code is 'vi', guideHTML uses these instead of the English goal,
       steps, tip and online note (whole sentences, so bold words inside them don't break the translation). The
       "what things mean" labels are translated through VI_MORE (zz_i18n_vi.js).
       ========================================================================= */
    (() => {
      const ON2 = 'Chọn <b>Trận online</b> để đấu với người mới (có <b>xếp hạng</b>: thắng thì tăng điểm, thua thì giảm). Chọn <b>Phòng riêng</b> để chơi với bạn bè: gửi mã hoặc link trong phòng cho họ. Không có ai chơi? Thêm người chơi máy trong phòng. Rời trận giữa chừng sẽ tính là thua.';
      const ONT = 'Chọn <b>Trận online</b> để vào bàn với người chơi khác, hoặc <b>Phòng riêng</b> để chơi với bạn bè: gửi mã hoặc link trong phòng cho họ. Chủ phòng bấm Bắt đầu. Ghế trống có thể thêm người chơi máy. Nếu ai đó rời đi, người chơi máy sẽ thế chỗ.';
      window.HOWTO_VI = {
        naval: { goal: 'Đánh chìm cả năm con tàu của đối phương trước khi họ đánh chìm tàu của bạn.', steps: [
          ['Giấu hạm đội', 'Kéo từng con tàu vào bảng của bạn. Chạm vào tàu để xoay. Các tàu không được chồng lên nhau (và ở một số ván còn không được chạm nhau). Bấm <b>Sẵn sàng</b> khi đã ưng ý.'],
          ['Bắn', 'Đến lượt, chạm vào một ô trên bảng của đối phương. <b class="text-coral">Trúng</b> thì hiện lửa, <b>trượt</b> thì hiện bọt nước. Mỗi phát bắn chỉ có vài giây, đừng chần chừ!'],
          ['Truy đuổi', 'Sau khi bắn trúng, hãy thử các ô bên cạnh: tàu là đường thẳng, nên phần còn lại nằm ở trên, dưới, trái hoặc phải.'],
          ['Chiến thắng', 'Khi mọi ô của một con tàu bị bắn trúng, tàu sẽ chìm. Đánh chìm cả năm tàu để thắng.']],
          tip: 'Lúc đầu hãy bắn theo kiểu bàn cờ (cách một ô): tàu nào cũng dài ít nhất 2 ô, nên chỉ cần nửa số phát bắn vẫn tìm ra hết.', online: 'Tàu của bạn được giữ bí mật: chỉ màn hình của bạn biết chúng ở đâu. ' + ON2 },
        daily: { goal: 'Đoán từ bí mật 5 chữ cái trong tối đa 6 lần.', steps: [
          ['Gõ một từ', 'Gõ một từ tiếng Anh có thật gồm 5 chữ cái rồi bấm Enter.'],
          ['Xem màu', 'Mỗi chữ sẽ đổi màu cho biết bạn đoán gần đúng đến đâu (xem bên dưới).'],
          ['Dùng điều đã biết', 'Lần đoán sau nên giữ các chữ xanh ở đúng chỗ và thử các chữ vàng ở vị trí khác.'],
          ['Ngày mai quay lại', 'Mỗi ngày ai cũng có cùng một từ. Giải mỗi ngày để kéo dài chuỗi ngày. "Từ luyện tập" cho bạn chơi thêm không giới hạn.']],
          tip: 'Hãy bắt đầu bằng một từ có nhiều chữ cái phổ biến, như CRANE hoặc SLATE.', online: 'Chữ Mỗi Ngày là trò chơi một mình. Muốn đua với người khác? Hãy chơi <b>Đấu Chữ</b>: cùng cách chơi, cùng một từ bí mật cho mọi người.' },
        wordduel: { goal: 'Là người đầu tiên tìm ra từ bí mật 5 chữ cái.', steps: [
          ['Cùng một từ', 'Mọi người cùng đoán một từ bí mật trên bảng của riêng mình, cùng một lúc.'],
          ['Xem màu', 'Giống Chữ Mỗi Ngày: xanh = đúng chỗ, vàng = có trong từ nhưng sai chỗ, xám = không có trong từ.'],
          ['Theo dõi đối thủ', 'Bên phải bạn thấy màu của mọi người (nhưng không thấy chữ), nên biết ai đang gần đích.'],
          ['Chiến thắng', 'Ai có cả năm chữ xanh đầu tiên sẽ thắng. Mỗi người có sáu lần đoán.']], online: 'Chọn <b>Trận online</b> để đua với người lạ, hoặc <b>Phòng riêng</b> để đua với tối đa 3 người bạn. Một mình trong phòng? Thêm người chơi máy để đua.' },
        c4: { goal: 'Xếp bốn quân của bạn thành một hàng: ngang, dọc hoặc chéo.', steps: [
          ['Thả quân', 'Đến lượt, chạm vào một cột. Quân sẽ rơi xuống ô trống thấp nhất.'],
          ['Lần lượt', 'Hai người lần lượt thả mỗi người một quân. Để ý đồng hồ.'],
          ['Chặn lại!', 'Nếu đối thủ có ba quân liền nhau và bên cạnh còn trống, hãy thả quân vào đó để chặn.'],
          ['Chiến thắng', 'Bốn quân liền nhau là thắng. Nếu bàn đầy trước thì hòa.']], online: ON2 },
        tictactoe: { goal: 'Xếp ba quân của bạn thẳng hàng.', steps: [
          ['Đánh quân', 'Chạm vào một ô trống. X đi trước ở ván đầu.'],
          ['Lần lượt', 'Hai người lần lượt mỗi người đánh một quân.'],
          ['Thắng ván', 'Ba quân thẳng hàng ngang, dọc hoặc chéo là thắng ván. Bàn đầy mà không ai thẳng hàng thì hòa.'],
          ['Thắng trận', 'Trong trận "thắng 2/3" hoặc "thắng 3/5", ai thắng nhiều ván hơn sẽ thắng trận. Hai người thay phiên đi trước.']], online: ON2 },
        hedge: { goal: 'Là người đầu tiên đưa quân sang bờ bên kia của khu vườn.', steps: [
          ['Đi một bước', 'Đến lượt, chạm vào một ô đang sáng để đi tới đó: lên, xuống, trái hoặc phải.'],
          ['Hoặc trồng hàng rào', 'Chạm vào <b>khe giữa hai ô</b>. Trên máy tính, hàng rào hiện ra khi bạn trỏ vào khe và bấm một lần là trồng; trên điện thoại, chạm một lần để xem rồi chạm lần nữa để trồng. Khe theo hàng ngang cho hàng rào nằm ngang, khe theo cột cho hàng rào đứng.'],
          ['Hàng rào chặn đường', 'Không ai đi xuyên qua hàng rào được, nên đối thủ phải đi vòng. Nhưng không được nhốt kín ai: luôn phải còn một lối đi.'],
          ['Nhảy qua', 'Nếu có quân khác ngay cạnh bạn, bạn có thể nhảy qua nó. Nếu phía sau có hàng rào, hãy bước chéo sang bên cạnh nó.']], online: ONT },
        fibber: { goal: 'Là người đầu tiên đánh hết bài trên tay. Những người còn lại chơi tiếp để giành hạng 2, 3... cho đến khi chỉ còn một người cầm bài.', steps: [
          ['Mỗi lượt một loại bài mới', 'Mỗi lượt có một loại bài được chọn ngẫu nhiên (không bao giờ trùng hai lượt liền nhau). Giữa bàn cho biết đang đến loại nào.'],
          ['Úp bài', 'Đến lượt, chạm vào 1 đến 4 lá bài rồi bấm <b>Đánh</b>. Bài được úp xuống và bạn nói đó là loại đang đến. Không có? Thì xạo!'],
          ['NÓI XẠO!', 'Sau mỗi lượt đánh, mọi người có vài giây để bấm <b>NÓI XẠO!</b> nếu nghĩ đó là nói dối. Các lá bài sẽ được lật lên.'],
          ['Ai phải ôm bài', 'Nếu có lá sai, người nói dối phải ôm cả chồng bài. Nếu tất cả đều đúng, người hô phải ôm. Đánh hết lá cuối cùng (mà không bị bắt) là thắng.']], online: ONT },
        tunnel: { goal: 'Thợ đào: đào đường hầm từ lối vào đến kho vàng. Kẻ phá hoại: bí mật ngăn họ lại.', steps: [
          ['Biết phe của mình', 'Lúc bắt đầu, một dòng thông báo cho bạn biết mình là <b class="text-teal">Thợ đào</b> hay <b class="text-coral">Kẻ phá hoại</b>. Không ai khác thấy được.'],
          ['Đánh một lá', 'Đến lượt, chạm vào một lá trên tay. Mảnh đường hầm được đặt vào ô đang sáng (↻ để xoay). Nó phải khớp với các mảnh bên cạnh và nối vào đường hầm.'],
          ['Lá hành động', 'Làm hỏng cuốc hoặc đèn của một người (họ không đào được cho đến khi sửa), sửa dụng cụ, dùng bản đồ kho báu để lén xem dưới một trong ba hòn đá đích, hoặc gây sập hầm để bỏ một mảnh đường hầm.'],
          ['Cuốc hoặc đèn bị hỏng?', 'Dụng cụ hỏng thì không đào được. Đánh một <b class="text-emerald">lá Sửa</b> (cùng dụng cụ có dấu ✓ xanh): chạm vào lá, rồi chạm vào chính bạn. Người khác cũng có thể sửa giúp bạn. Lá Sửa của bạn sẽ sáng lên khi bạn cần.'],
          ['Không giúp được? Bỏ một lá', 'Bấm 🗑 Bỏ bài. Sau mỗi lượt bạn luôn rút một lá mới khi bộ bài còn.'],
          ['Ai thắng', 'Khi đường hầm đến được kho vàng, Thợ đào thắng. Nếu mọi người hết bài trước, Kẻ phá hoại thắng.']], online: ONT },
        guild: { goal: 'Xây thị trấn có nhiều điểm nhất.', steps: [
          ['Chọn nhân vật', 'Mỗi vòng, mọi người bí mật chọn một nhân vật. Người cầm vương miện 👑 chọn trước, nên nhân vật tốt có thể đã bị chọn mất khi đến lượt bạn.'],
          ['Đi theo số thứ tự', 'Nhân vật số 1 đi trước, rồi số 2, cứ thế tiếp. Đến lượt, lấy <b>2 vàng</b> hoặc xem <b>2 lá công trình và giữ 1</b>.'],
          ['Xây dựng', 'Chạm vào lá công trình bạn đủ tiền xây, rồi bấm <b>Xây</b>. Không được xây hai công trình giống nhau. Kiến Trúc Sư được xây tối đa 3.'],
          ['Dùng năng lực', 'Mỗi nhân vật có một năng lực (xem bên dưới). Bóng Đêm và Kẻ Móc Túi gọi tên nhân vật theo số, mà không biết ai đang giữ nó!'],
          ['Vì sao tôi bị mất lượt?', 'Nếu <b>Bóng Đêm</b> gọi đúng nhân vật của bạn, bạn mất cả lượt. Nếu <b>Kẻ Móc Túi</b> gọi đúng, toàn bộ vàng của bạn sang tay Kẻ Móc Túi khi lượt bạn bắt đầu. <b>Thuyền Trưởng</b> có thể phá một công trình của bạn bằng cách trả giá của nó trừ 1.'],
          ['Vàng theo màu', 'Nhà Vua (vàng), Tu Viện Trưởng (xanh dương), Thương Nhân (xanh lá) và Thuyền Trưởng (đỏ) được 1 vàng cho mỗi công trình cùng màu trong thị trấn.'],
          ['Kết thúc', 'Khi có người xây đủ số công trình mục tiêu, vòng đó sẽ chơi cho xong. Điểm: giá của từng công trình, +3 nếu có đủ năm màu, +4 cho người xong đầu tiên (+2 cho những người cũng xong), +2 cho mỗi kỳ quan.']], online: ONT },
        chess: { goal: 'Vây vua đối phương để vua không còn đường thoát. Đó là chiếu hết.', steps: [
          ['Đi quân', 'Chạm vào một quân của bạn, rồi chạm vào ô được tô sáng. Bên Trắng đi trước.'],
          ['Ăn quân', 'Đi vào ô có quân đối phương để bắt quân đó ra khỏi bàn.'],
          ['Chiếu tướng', 'Nếu vua của bạn bị tấn công, nước tiếp theo bạn phải đưa vua ra khỏi nguy hiểm.'],
          ['Nước đặc biệt', '<b>Nhập thành</b>: vua và xe đổi chỗ trong một nước. <b>Phong cấp</b>: tốt đi đến hàng cuối sẽ thành hậu (hoặc quân khác). <b>Bắt tốt qua đường</b>: một cách ăn tốt đặc biệt.'],
          ['Thắng hoặc hòa', 'Chiếu hết là thắng. Nếu một bên không còn nước đi hợp lệ nhưng không bị chiếu, ván cờ hòa (hết nước).']], online: ON2 },
        checkers: { goal: 'Bắt hết quân của đối thủ, hoặc khiến họ không còn nước đi.', steps: [
          ['Đi quân', 'Quân đi chéo một ô về phía trước, trên các ô tối. Chạm vào quân, rồi chạm vào ô được tô sáng.'],
          ['Nhảy ăn', 'Nhảy qua quân đối phương vào ô trống phía sau để ăn nó. Nếu ăn được thì <b>bắt buộc</b> phải ăn.'],
          ['Nhảy tiếp', 'Nếu sau khi đáp xuống còn nhảy ăn được nữa, tiếp tục trong cùng lượt.'],
          ['Phong vua', 'Đi đến hàng cuối bên kia, quân của bạn thành vua và đi lùi được.']], online: ON2 },
        pool: { goal: 'Đưa hết bóng của bạn (bóng đặc hoặc bóng sọc) vào lỗ, rồi đến bóng số 8.', steps: [
          ['Ngắm', 'Giữ trên bàn và kéo để xoay hướng ngắm. Vòng tròn chấm cho biết bi cái sẽ chạm vào đâu, mũi tên ngắn cho biết các bóng sẽ đi về đâu.'],
          ['Lực đánh', 'Kéo thanh lực về bên trái rồi thả ra để đánh. Kéo càng xa đánh càng mạnh.'],
          ['Xoáy (tùy chọn)', 'Chạm vào hình bi cái nhỏ để đánh phía trên (bi đi theo), phía dưới (bi lùi lại) hoặc bên cạnh (bi bật băng lệch đi).'],
          ['Bóng đặc hay bóng sọc', 'Quả đầu tiên bạn đưa vào lỗ sau cú phá bóng sẽ quyết định nhóm của bạn. Đưa được bóng của mình vào lỗ thì được đánh tiếp.'],
          ['Phạm lỗi', 'Bi trắng rơi vào lỗ, chạm sai bóng trước, hoặc không bóng nào chạm băng là phạm lỗi. Khi đó đối thủ được đặt bi trắng ở bất cứ đâu.'],
          ['Chiến thắng', 'Khi hết bóng của nhóm mình, hãy đưa bóng số 8 vào lỗ. Đưa nó vào quá sớm là thua!']], online: 'Bạn có thể xem đối thủ ngắm và kéo cơ trực tiếp. ' + ON2 },
        bowling: { goal: 'Đánh đổ càng nhiều ki càng tốt trong 10 frame.', steps: [
          ['Cầm bóng', 'Nhấn giữ vào quả bóng. Trượt sang trái hoặc phải ở phía dưới màn hình để chọn chỗ đứng.'],
          ['Ném', 'Vuốt lên rồi thả ra. Vuốt càng nhanh bóng càng nhanh nhưng khó ngắm hơn.'],
          ['Thêm xoáy', 'Uốn cong cuối đường vuốt, bóng sẽ móc vào khi gần đến các con ki.'],
          ['Frame', 'Mỗi frame bạn có hai lần ném để đánh đổ cả mười con ki.'],
          ['Tính điểm', '<b>Strike (X)</b>: đổ cả mười ki ở lần ném đầu, được 10 cộng điểm hai lần ném tiếp theo. <b>Spare (/)</b>: đổ cả mười ki trong hai lần ném, được 10 cộng điểm lần ném tiếp theo.']],
          online: 'Mọi người lần lượt ném trên cùng một làn và cùng xem từng cú ném. Trận online 2 người có xếp hạng.' },
        poker: { goal: 'Thắng hết chip của mọi người. Người cuối cùng còn chip sẽ thắng.', steps: [
          ['Bài của bạn', 'Bạn nhận hai lá bài riêng. Năm lá bài chung lật ra ở giữa: ba lá (flop), rồi một lá (turn), rồi một lá (river).'],
          ['Đặt cược', 'Đến lượt: <b>Bỏ bài</b> (bỏ ván này), <b>Xem/Theo</b> (theo mức cược để chơi tiếp) hoặc <b>Tố</b> (cược thêm).'],
          ['Lật bài', 'Nếu cuối ván còn hơn một người, ai có bộ năm lá mạnh nhất (ghép từ hai lá riêng và năm lá chung) sẽ ăn cả pot.'],
          ['Cược mù', 'Mỗi ván có hai người phải đặt một khoản cược nhỏ (cược mù). Mức này tăng dần để ván chơi luôn kết thúc.']], online: ONT },
        blackjack: { goal: 'Thắng nhà cái bằng cách gần 21 điểm hơn mà không bị quá.', steps: [
          ['Đặt cược', 'Chạm vào các chip để đặt cược, rồi chia bài.'],
          ['Giá trị lá bài', 'Lá số tính đúng số đó, J Q K tính 10, lá Át tính 1 hoặc 11 (tùy cái nào có lợi).'],
          ['Lượt của bạn', '<b>Rút</b> để lấy thêm lá, <b>Dừng</b> để thôi, <b>Gấp đôi</b> để nhân đôi tiền cược và rút đúng một lá nữa. Hai lá giống nhau có thể <b>Tách</b> thành hai tay (không có khi chơi online).'],
          ['Lượt nhà cái', 'Nhà cái rút tiếp cho đến khi được 17 điểm trở lên.'],
          ['Kết quả', 'Gần 21 hơn nhà cái thì được nhận lại gấp đôi tiền cược. Quá 21 là quắc và thua. Át + một lá 10 điểm ở hai lá đầu là <b>blackjack</b> và được trả 3 ăn 2.']],
          online: 'Khi chơi online, mọi người ngồi cùng một bàn đấu với một nhà cái. Mỗi người bắt đầu với 1.000 chip chỉ dùng cho bàn này. Sau ván cuối, ai nhiều chip nhất sẽ thắng.' },
        kittens: { goal: 'Đừng để bị dính Khoai Nóng. Chú mèo cuối cùng còn trụ lại sẽ thắng!', steps: [
          ['Lượt của bạn', 'Đánh bao nhiêu lá tùy thích (hoặc không đánh), rồi rút một lá từ chồng bài để kết thúc lượt.'],
          ['Khoai Nóng', 'Khoai Nóng được giấu trong chồng bài. Rút phải là bạn bị loại, trừ khi có Găng lò nướng.'],
          ['Thoát nạn!', 'Có Găng lò nướng thì bạn sống sót, và được lén nhét Khoai Nóng trở lại chồng bài ở bất cứ đâu: ngay trên cùng cho người kế tiếp, hoặc giấu thật sâu.'],
          ['Bỏ lượt và Tấn công', 'Bỏ lượt kết thúc lượt mà không phải rút. Tấn công cũng vậy, và người kế tiếp phải chơi 2 lượt liền.'],
          ['Xem trước, Xáo bài, Xin bài', 'Xem trước cho xem 3 lá trên cùng. Xáo bài trộn lại chồng bài. Xin bài bắt một người phải đưa bạn một lá họ chọn.'],
          ['Không Đời Nào!', 'Ai cũng có thể đánh Không Đời Nào bất cứ lúc nào để chặn một lá bài. Có thể Không Đời Nào cả một lá Không Đời Nào!'],
          ['Bộ mèo', 'Lá mèo đánh lẻ không làm gì. Một đôi: chọn một lá úp của một người. Bộ ba: gọi tên một lá, nếu họ có thì phải đưa. Năm con mèo khác nhau: lấy bất kỳ lá nào trong chồng bài đã đánh.']], online: ONT },
        random: { goal: 'Ghi nhiều điểm nhất qua một loạt trò ngẫu nhiên.', steps: [
          ['Tập hợp', 'Mở phòng riêng và gửi link cho bạn bè, hoặc vào trận trực tuyến. Chủ phòng có thể thêm người chơi máy.'],
          ['Chọn loạt chơi', 'Nhanh là 1 ván, hoặc chơi liền 3 hay 5 ván. Có thể chỉ chọn trò bài, trò bàn cờ hoặc trò nhóm.'],
          ['Bất ngờ!', 'Khi chủ phòng bấm Bắt đầu, một trò hợp với mọi người được chọn ngẫu nhiên. Một hộp hiện cách cài đặt trước khi chơi.'],
          ['Cộng điểm', 'Mỗi ván cho điểm: hạng nhất 10, nhì 6, ba 3, còn lại 1. Sau mỗi ván bạn xem bảng điểm, rồi ván tiếp bắt đầu.'],
          ['Nhà vô địch', 'Sau ván cuối, người nhiều điểm nhất là nhà vô địch. Bấm Loạt mới để chơi tiếp.']],
          tip: 'Chưa biết chơi trò nào? Mỗi trò đều có hướng dẫn và video ngay trên thanh trên cùng.', online: 'Mọi người ở cùng nhau qua từng ván: cùng người, cùng phòng chat. Chủ phòng bắt đầu ván tiếp theo.' },
        colorclash: { goal: 'Là người đầu tiên đánh hết bài. Những người còn lại chơi tiếp để giành hạng 2, 3, 4 cho đến khi chỉ còn một người giữ bài.', steps: [
          ['Đánh trùng', 'Đánh một lá trùng với lá trên cùng về <b>màu</b> hoặc <b>số/ký hiệu</b>.'],
          ['Không đánh được?', 'Rút một lá từ chồng bài. Nếu hợp, bạn có thể đánh luôn.'],
          ['Lá đặc biệt', 'Một số lá cho người kế bị mất lượt, đổi chiều chơi, hoặc bắt người kế phải rút bài (xem bên dưới).'],
          ['Hô CLASH!', 'Khi còn một lá, hãy bấm nút CLASH! thật nhanh. Quên thì phải rút 2 lá. Bắt được người khác quên thì họ phải rút 2 lá!']], online: ONT },
        dominoes: { goal: 'Đánh hết quân trước và được cộng số nút còn trên tay đối thủ.', steps: [
          ['Nối đầu', 'Đến lượt, đánh một quân có số trùng với một trong hai đầu đang mở của hàng.'],
          ['Quân đôi', 'Quân có hai nửa cùng số được đặt nằm ngang.'],
          ['Bị kẹt?', 'Trong <b>kiểu bốc</b>, bạn bốc quân cho đến khi có quân hợp. Trong <b>kiểu chặn</b>, bạn chỉ việc bỏ lượt.'],
          ['Tính điểm', 'Ai đánh hết trước được cộng tất cả số nút còn trên tay người khác. Nếu không ai đánh được nữa, người có ít nút nhất thắng phần chênh lệch.']], online: ONT },
        tycoon: { goal: 'Là người giàu nhất khi hết số vòng (ván Ngắn, Vừa hoặc Dài), hoặc người cuối cùng chưa phá sản (Cổ điển).', steps: [
          ['Tung xúc xắc', 'Giữ nút tung để lắc xúc xắc rồi thả ra để tung. Đi số ô tương ứng.'],
          ['Mua đất', 'Dừng ở ô chưa ai sở hữu thì bạn có thể mua. Không mua thì ô đó được đem ra đấu giá cho mọi người.'],
          ['Tiền thuê', 'Dừng ở đất của người khác thì phải trả tiền thuê cho họ. Có đủ cả bộ màu thì tiền thuê gấp đôi.'],
          ['Xây nhà', 'Có đủ bộ màu thì xây nhà (rồi khách sạn) để thu tiền thuê cao hơn nhiều. (Cài đặt phòng: hoặc xây một nhà mỗi lần dừng ở đất của mình.)'],
          ['Mua lại đất (cài đặt)', 'Nếu phòng bật: sau khi trả tiền thuê, bạn có thể trả giá để mua ô đó (ít nhất bằng giá trị của nó: giá đất + nhà). Chủ đất có thể bán, từ chối, hoặc đòi giá cao hơn; rồi bạn trả giá đó hoặc thôi. Không áp dụng cho ô có khách sạn hoặc thuộc bộ màu đã đủ.'],
          ['Ô START', 'Mỗi lần đi qua hoặc dừng ở ô START bạn nhận <b>$200</b>.'],
          ['Đổ đôi', 'Hai xúc xắc ra cùng số thì bạn đi rồi được tung tiếp. Đổ đôi <b>ba lần liền</b> thì vào thẳng Nhà tù (không nhận $200).'],
          ['Nhà tù', 'Bạn vào tù khi dừng ở ô Vào Tù, do một lá thẻ, hoặc do đổ đôi 3 lần. Trong tù bạn có thể <b>trả $50</b>, dùng thẻ <b>Ra Tù Miễn Phí</b>, hoặc thử <b>đổ đôi</b> (tối đa 3 lượt; trượt lần thứ ba thì trả $50 rồi đi). Chỉ dừng ở ô Nhà tù thì chỉ là “thăm”.'],
          ['Thẻ Bất Ngờ và Bí Ẩn', 'Dừng ở các ô này để rút một lá: có thể được tiền, mất tiền, bị dời chỗ, hoặc vào tù.'],
          ['Đường sắt và tiện ích', 'Tiền thuê đường sắt tăng theo số đường sắt chủ sở hữu có. Tiện ích tính theo bội số điểm xúc xắc của bạn.'],
          ['Thuế và Bãi Đỗ Xe', 'Ô thuế bắt bạn trả cho ngân hàng. Nếu bật hũ Bãi Đỗ Xe, thuế và tiền phạt dồn vào giữa bàn, ai dừng ở Bãi Đỗ Xe sẽ lấy hết.'],
          ['Thiếu tiền?', 'Nhà sẽ được bán và đất được cầm cố tự động. Nếu vẫn không đủ trả, bạn phá sản.'],
          ['Chạm để xem', 'Chạm vào một ô đất trên bàn để xem thẻ: tiền thuê theo số nhà, giá nhà, giá cầm cố. Chạm vào quân cờ để xem người đó đang đứng ở đâu.']], online: ONT },
        isles: { goal: 'Là người đầu tiên đạt số điểm mục tiêu bằng cách xây làng, thị trấn và đường.', steps: [
          ['Bắt đầu', 'Mỗi người đặt hai làng và hai con đường. Góc chạm vào những số hay ra (6 và 8) là tốt nhất.'],
          ['Tung xúc xắc', 'Mỗi lượt tung xúc xắc. Mỗi ô đất có số đó sẽ cho tài nguyên cho ai có làng (1 lá) hoặc thị trấn (2 lá) ở góc của nó.'],
          ['Xây dựng', 'Dùng tài nguyên: <b>Đường</b> (Gỗ + Đất sét), <b>Làng</b> (Gỗ + Đất sét + Len + Lúa), <b>Thị trấn</b> (2 Lúa + 3 Đá, nâng cấp từ một làng).'],
          ['Xây ở đâu', 'Đường phải nối với đường hoặc công trình của bạn. Làng đặt ở góc trống cuối đường của bạn, và <b>góc kề bên không được có làng khác</b> (giữa hai làng phải có một góc trống). Nút màu xám cho bạn biết vì sao chưa xây được.'],
          ['Trao đổi', 'Đổi 4 lá cùng loại lấy 1 lá bất kỳ với ngân hàng, hoặc đề nghị trao đổi với người chơi khác.'],
          ['Tên Cướp', 'Tung ra 7 thì không ai nhận tài nguyên. Ai cầm <b>hơn 7 lá phải bỏ một nửa</b>. Rồi Tên Cướp chuyển đến một ô đất: ô đó không cho gì cho đến khi Tên Cướp đi chỗ khác, và chủ của nó mất một lá ngẫu nhiên.'],
          ['Đường dài nhất', 'Người đầu tiên có một con đường liền mạch từ <b>5 đoạn trở lên</b> được Đường dài nhất (2 điểm). Ai có đường dài hơn sẽ lấy lại.'],
          ['Điểm', 'Làng = 1 điểm, Thị trấn = 2 điểm, Đường dài nhất = 2 điểm. Ai đạt mục tiêu trước sẽ thắng.']], online: ONT },
        manor: { goal: 'Là người đầu tiên tìm ra ai đã làm, bằng gì, và ở phòng nào.', steps: [
          ['Bí mật', 'Một nghi phạm, một công cụ và một căn phòng được giấu trong phong bì. Các lá khác được chia ra, nên lá nào trên tay bạn thì không thể là đáp án.'],
          ['Đi lại', 'Đến lượt, đi sang một phòng bên cạnh (các phòng ở góc có lối đi bí mật sang góc đối diện).'],
          ['Phỏng đoán', 'Gọi tên một nghi phạm và một công cụ "ở phòng này". Người kế tiếp có một trong các lá đó phải bí mật cho bạn xem một lá.'],
          ['Ghi chép', 'Sổ tay đánh dấu những lá bạn đã thấy. Gạch bỏ mọi thứ không thể là đáp án.'],
          ['Ai đưa lá?', 'Lần lượt từng người quanh bàn được hỏi. Người đầu tiên có nghi phạm, công cụ hoặc căn phòng đó sẽ cho bạn xem <b>một</b> lá (chỉ bạn thấy). Nếu không ai đưa được, những lá đó hoặc nằm trong phong bì, hoặc trên tay bạn.'],
          ['Buộc tội', 'Khi đã chắc chắn, hãy buộc tội! Đúng thì thắng. Sai thì bị loại (nhưng vẫn phải cho người khác xem bài).']],
          online: 'Khi ai đó đưa ra một lá, chỉ người hỏi mới được thấy. ' + ONT },
        wordconnect: { goal: 'Tìm càng nhiều từ càng tốt từ vòng chữ cái.', steps: [
          ['Ghép từ', 'Chạm vào các chữ trên vòng theo thứ tự. Ngay khi chúng thành một từ bạn chưa tìm, từ đó tự được nhận.'],
          ['Sửa lỗi', 'Chạm lại chữ cuối (hoặc ⌫ Xóa) để bỏ nó. Xóa hết để làm lại.'],
          ['Từ dài nhất', 'Có ít nhất một từ dùng hết mọi chữ. Tìm được nó sẽ có nhiều điểm nhất.'],
          ['Ngôi sao', 'Tìm thêm các từ ẩn để được tối đa ba ngôi sao. Gợi ý cho xem chữ đầu nhưng bị trừ điểm.']],
          online: 'Khi online là một cuộc đua: ai cũng có cùng các chữ cái và thấy điểm của nhau khi chơi. Ai nhiều điểm nhất khi hết giờ sẽ thắng.' },
        impostor: { goal: 'Dân thường: tìm ra kẻ giả mạo. Kẻ giả mạo: trà trộn và đừng để bị bắt.', steps: [
          ['Từ bí mật', 'Mọi người nhận cùng một từ bí mật, trừ một người là kẻ giả mạo, nhận một từ gần giống nhưng khác. Không ai biết ai là kẻ giả mạo, kể cả chính họ!'],
          ['Gợi ý', 'Lần lượt, mỗi người gõ một từ để gợi ý về từ của mình. Đủ rõ để đồng đội hiểu, đủ mơ hồ để kẻ giả mạo không đoán được.'],
          ['Bỏ phiếu', 'Mọi người bỏ phiếu cho người mình nghĩ là kẻ giả mạo. Nếu cả nhóm loại nhầm một người KHÔNG phải kẻ giả mạo, người đó bị loại và một vòng gợi ý mới bắt đầu.'],
          ['Đến khi còn 2 người', 'Chơi tiếp từng vòng. Nếu chỉ còn 2 người, kẻ giả mạo thắng. Hai lần phiếu hòa liên tiếp cũng giúp kẻ giả mạo thoát.'],
          ['Cơ hội cuối', 'Kẻ giả mạo bị bắt được đoán một lần từ của cả nhóm. Đoán đúng thì vẫn thắng!']],
          online: 'Mọi người gõ gợi ý trên màn hình của mình, rồi cùng bỏ phiếu một lúc. ' + ONT },
        doodle: { goal: 'Đoán thật nhanh hình người khác vẽ, và vẽ thật dễ hiểu để họ đoán được hình của bạn.', steps: [
          ['Chọn từ', 'Đến lượt vẽ, chọn một từ <b>dễ</b>, <b>vừa</b> hoặc <b>khó</b>. Từ càng khó càng nhiều điểm (×1, ×1,5, ×2). Chỉ bạn thấy từ đó.'],
          ['Vẽ', 'Vẽ lên bảng trắng. Chọn màu và cỡ bút; có nút Hoàn tác và Xóa hết. Không được viết chữ hay số!'],
          ['Mọi người đoán', 'Những người khác gõ từ đoán vào ô bên phải. Đoán đúng được điểm: càng nhanh càng nhiều. Đoán sai sẽ hiện trong danh sách cho mọi người thấy.'],
          ['Gợi ý', 'Người đoán thấy độ khó và một gạch cho mỗi chữ cái. Khi sắp hết giờ, một vài chữ sẽ hiện ra. Không cần gõ dấu: "meo" vẫn tính là "mèo".'],
          ['Chiến thắng', 'Mỗi vòng ai cũng được vẽ một lần. Sau vòng cuối, ai nhiều điểm nhất sẽ thắng.']],
          online: 'Mọi người thấy hình vẽ trực tiếp khi đang vẽ. Trò này chỉ chơi với người thật (không có người chơi máy): tạo phòng và gửi link cho bạn bè. Phòng có thể chọn từ tiếng Anh hoặc tiếng Việt.' },
      };
    })();
