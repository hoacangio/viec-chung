# Strategist — Đánh giá tiềm năng phổ biến

## Summary (≤5 lines)
- Là sản phẩm đại chúng: tiềm năng **thấp–trung bình**. Thị trường app cặp đôi toàn cầu đông đúc nhưng nhỏ; app dẫn đầu mảng lập kế hoạch là Cupla, mất 5 năm mới đạt khoảng 500k cặp.
- Là công cụ cho gia đình mình kèm portfolio AI Engineering: **rất đáng làm**.
- Rủi ro lớn nhất không nằm ở kỹ thuật mà ở hành vi: người Việt đã nhắn tin trên Zalo/Messenger, sẽ không chuyển chat sang app khác.
- Hướng có cơ hội: định vị lại thành **"trợ lý việc nhà cho bố mẹ có con nhỏ"**, nhận việc từ Zalo qua share sheet và AI tiếng Việt, thay vì làm "app chat cho cặp đôi".
- Đi theo thứ tự: dùng thật 4 tuần trong nhà → 10 cặp beta → rồi mới tính chuyện kiếm tiền.

## Key decisions & rationale
- Không cạnh tranh ở chat; cạnh tranh ở **thu nhận việc** (capture) và **chia tải tinh thần** (mental load).
- North Star = số hộ có **cả hai người** hoàn thành việc trong tuần, vì app cặp đôi chỉ sống khi cả hai cùng dùng.

## Assumptions made
- 6–8 h/tuần; mục tiêu chính là học + portfolio, side income là phụ.
- Tỷ giá ~26.000 VND/USD (ước tính).

## Risks / open questions for the lead
- Owner có muốn bỏ chat đầy đủ không? Đây là ý tưởng gốc của owner.

---

## Verdict
**Validate first.** Build bản tối giản để dùng trong nhà. Chỉ đầu tư cho người dùng ngoài khi qua được ngưỡng ở mục Validation.

## The bet
- **Problem**: việc nhà và việc con cái dặn nhau qua tin nhắn bị trôi, quên, hoặc dồn hết lên một người (thường là vợ) phải nhớ và nhắc. Việc này xảy ra hằng ngày.
- **Customer**: vợ chồng 28–40 tuổi ở đô thị Việt Nam, có con mầm non hoặc tiểu học, cả hai cùng đi làm.
- **Current alternatives**: nhắn Zalo, ghim tin nhắn, Google Keep hay Apple Reminders chia sẻ, lịch giấy dán tủ lạnh, hoặc trí nhớ của vợ.
- **Why you**: owner là kỹ sư React Native và DevSecOps, đang chuyển sang AI, và là chính người dùng mục tiêu.

## Market scan
| App | Giá | Điểm mạnh | Khoảng trống |
| --- | --- | --- | --- |
| Cupla | Freemium, có Premium | Lịch chung đồng bộ Google/Apple, to-do, AI assist; khoảng 500k cặp, 1M lượt tải tính đến 7/2026 | Tiếng Anh, không gắn với Zalo, ít nội dung cảm xúc |
| Between | Free có quảng cáo; 2,99 USD/tháng, 26,99 USD trọn đời | Chat riêng, ảnh, kỷ niệm; phổ biến ở châu Á | Giao diện cũ, gần như không có quản lý việc |
| Paired | 14,99 USD/tháng hoặc 74,99 USD/năm | Câu hỏi hằng ngày, nội dung từ chuyên gia | Không có task |
| Honeydo, Tend, TaskBuddy | Freemium | Chia việc nhà | Nhỏ, tiếng Anh, không có AI tiếng Việt |
| Zalo, Messenger | Miễn phí | Ai cũng đã dùng | Không có task, nhắc việc hay trạng thái |

Tín hiệu nhu cầu: tìm kiếm không thấy app Việt nào nổi bật trong mảng này. Đây vừa là cơ hội, vừa có thể là dấu hiệu nhu cầu trả tiền thấp (ước tính, chưa kiểm chứng).

## Monetization
| Model | Phù hợp | Effort | Thời gian có doanh thu | Kết luận |
| --- | --- | --- | --- | --- |
| Freemium theo hộ, AI là tính năng trả phí | Trung bình | Trung bình | 6+ tháng | **Chọn nếu đi tiếp** |
| Mua một lần / trọn đời | Hợp thói quen người Việt | Thấp | Nhanh | Phương án dự phòng |
| Quảng cáo | Thấp, làm hỏng sự riêng tư | Thấp | Chậm | Loại |
| Miễn phí / open-source làm portfolio | Cao với mục tiêu học tập | Thấp | Không có | **Mặc định giai đoạn đầu** |

## Unit economics (ước tính)
Giá 39.000 VND/tháng/hộ; store thu phí 15% nên thực nhận khoảng 33.000 VND. AI chỉ mở cho hộ trả phí, khoảng 3.000 VND/hộ/tháng. Chi phí cố định khoảng 870.000 VND/tháng, gồm Apple khoảng 215k và Supabase Pro khoảng 650k khi vượt gói free.

| Kịch bản | Hộ hoạt động | Tỷ lệ trả phí | Hộ trả phí | Doanh thu/tháng | Lợi nhuận/tháng |
| --- | --- | --- | --- | --- | --- |
| Bi quan | 300 | 1% | 3 | ~99k | ~−120k (vẫn ở gói free) |
| Cơ sở | 2.000 | 3% | 60 | ~2,0M | ~0,9M |
| Lạc quan | 10.000 | 5% | 500 | ~16,5M | ~13,5M |

- Hòa vốn: khoảng 30 hộ trả phí.
- Lãi 10 triệu VND/tháng: khoảng 360 hộ trả phí, tương đương khoảng 12.000 hộ hoạt động. Con số này cần giả định rất lạc quan với một dự án làm 6–8 h/tuần.

## Validation plan
Rủi ro lớn nhất là **cả hai vợ chồng có dùng đều đặn không**, hay app lại thành chỗ chỉ một người nhập việc.
1. **Dogfood 4 tuần** trong nhà. Ngưỡng: vợ tự mở app ít nhất 4 ngày/tuần và có ít nhất 15 việc hoàn thành/tuần.
2. **10 cặp beta** (đồng nghiệp, bạn bè, nhóm phụ huynh lớp của con). Phỏng vấn trước khi mời, 5 câu về hành vi trong quá khứ:
   - Tuần rồi có việc nào trong nhà bị quên không? Chuyện gì đã xảy ra?
   - Hai người đang dặn việc nhau bằng cách nào?
   - Ai là người nhớ lịch của con?
   - Đã từng thử app hay cách nào khác chưa? Vì sao bỏ?
   - Lần gần nhất anh/chị trả tiền cho một app là app gì?
3. Ngưỡng tuần thứ 4: ít nhất 5/10 cặp có cả hai người hoạt động.
4. **Kill criteria**: dưới 3/10 cặp còn dùng thì giữ app làm công cụ riêng và portfolio, không đầu tư marketing.

## Rollout
| Phase | Scope | Kênh | Metric | Kill trigger | Giờ |
| --- | --- | --- | --- | --- | --- |
| Validate (dogfood) | Task + nhắc việc + share từ Zalo | Nhà mình | Vợ hoạt động ≥4 ngày/tuần | Vợ bỏ dùng sau 2 tuần | ~60 h (8–10 tuần) |
| Private beta | +AI tiếng Việt, mua sắm, việc lặp lại | TestFlight + APK, 10 cặp | ≥5/10 cặp cả hai cùng hoạt động | <3/10 | ~40 h |
| Public | Store, landing page | Nhóm Facebook phụ huynh, TikTok build-in-public, bài kỹ thuật trên LinkedIn | 500 hộ, retention W4 ≥25% | <100 hộ sau 2 tháng | ~40 h |
| Grow | Freemium | Giới thiệu bạn bè qua lời mời của chính cặp đôi | 3% trả phí | — | liên tục |

## Metrics
- **North Star**: số hộ có cả hai người hoàn thành ít nhất 1 việc trong tuần.
- **Input metrics**: số việc tạo/hộ/tuần; % việc được giao cho người kia; % lời mời ghép đôi được chấp nhận.
- **Guardrails**: tỷ lệ tắt thông báo; churn W4; chi phí AI/hộ.

## Roadmap
- **Now**: task, nhắc việc, ghép đôi, nhận việc từ share sheet, việc lặp lại.
- **Next**: AI tiếng Việt ("tối thứ 6 nhớ mua bánh cho bé"), danh sách mua sắm, lịch của con.
- **Later**: thêm thành viên (ông bà, người giúp việc), widget, đồng bộ Google Calendar, Premium.

## Risks & what would change my mind
- Nếu beta cho thấy người dùng **thật sự muốn** chat trong app (đếm tin nhắn/ngày), đưa chat trở lại.
- Nếu Cupla hoặc Between ra bản tiếng Việt có AI, cơ hội ở thị trường Việt hẹp lại.
- Sinh viên thực tập ở công ty hoặc nhóm phụ huynh có thể là kênh phát tán tốt hơn dự đoán.

Sources: [Cupla facts](https://cupla.app/facts/) · [Habi: 7 best couple apps 2026](https://habi.app/insights/best-couple-apps/) · [Toolfinder: shared to-do apps for couples](https://toolfinder.co/lists/best-shared-to-do-apps) · [Tend Task (App Store)](https://apps.apple.com/app/id1456102211) · [Honeydo Tasks (App Store VN)](https://apps.apple.com/vn/app/honeydo-tasks/id6475327895?l=vi)
