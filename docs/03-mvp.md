# Lead — MVP "Việc chung" (2026-11-08)

## Summary
- Một MVP duy nhất: **ghép đôi + Việc + Mua sắm, đồng bộ realtime**, kèm gõ nhanh tiếng Việt. Dùng thử được ngay trong chiều 8/11.
- iOS chưa cài app được thì dùng **web (react-native-web) + "Thêm vào MH chính"**. Không cần Apple Developer cho tới khi cần push.
- Cắt khỏi vòng này: chat, push, việc lặp lại, AI. Lý do: phải trả lời câu hỏi rủi ro nhất trước tiên, là cả hai vợ chồng có mở app hằng ngày không.

## Decisions
| # | Decision | Chosen & why | Decided by |
|---|---|---|---|
| 8 | Phạm vi MVP | Việc + Mua sắm + ghép đôi; không chat (owner giao lead chọn) | Lead |
| 9 | Kênh iOS | Web PWA trước, Expo Go khi đang dev, TestFlight sau | Lead (theo yêu cầu owner) |
| 10 | Auth | Email + mật khẩu (nhanh nhất, chạy cả web và native); Google/Apple để sau | Lead |
| 11 | Một bảng `items` cho cả task và shopping | Ít code, cùng realtime và RLS; tách bảng khi hai loại khác nhau nhiều | Architect |
| 12 | Mã mời 8 ký tự, dùng 1 lần, 24h, giới hạn 10 lần thử/giờ | Chống dò mã | Architect |

## Definition of done (đã chạy)
- [x] Migration + RLS: 9 nhóm test trên Postgres 16, kèm mutation test chứng minh test bắt được policy hỏng.
- [x] Parser giờ + nhóm danh sách: 26 unit test, chạy pass ở cả TZ Asia/Ho_Chi_Minh và UTC.
- [x] Typecheck code app với shim thư viện (chỉ kiểm tra tính nhất quán nội bộ).
- [ ] Typecheck với type thật + `expo export --platform web`: CI tự chạy sau khi owner commit `package-lock.json` (môi trường build không có mạng để cài package).
- [ ] Chạy thử trên 2 điện thoại thật.

## Đo trong 4 tuần dogfood
- North Star: số việc hoàn thành/tuần mà cả hai người đều có tham gia.
- Ngưỡng tiếp tục: vợ tự mở app ít nhất 4 ngày/tuần.

## Vòng sau (theo thứ tự)
1. Web push (iOS 16.4+ hỗ trợ push cho web app đã thêm vào màn hình chính) hoặc Expo push sau khi có tài khoản Apple.
2. Việc lặp lại (đóng tiền điện ngày 5, đón con thứ 2-4-6).
3. Bình luận trên việc + nudge.
4. AI parse câu tự do (Edge Function + LLM), giữ parser rule-based làm fallback.
