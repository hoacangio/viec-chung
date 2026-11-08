# Việc chung

App việc nhà và danh sách mua sắm cho hai vợ chồng. Dữ liệu đồng bộ realtime giữa hai máy, chạy được trên Android, iOS và web từ cùng một codebase: Expo, react-native-web và Supabase.

**MVP hiện có**
- Đăng ký / đăng nhập bằng email.
- Ghép đôi bằng mã mời 8 ký tự (dùng một lần, hết hạn sau 24h).
- Tab **Việc**: gõ nhanh kiểu `mai 5h chiều đón bé @anh` → app tự tách tên việc, hạn chót và người làm. Việc được nhóm theo Quá hạn / Hôm nay / Sắp tới / Không hạn, lọc được theo người.
- Tab **Mua sắm**: một người tick, người kia thấy ngay; có nút xoá hết các món đã mua.
- Bảo mật bằng Row Level Security: mỗi Nhà chỉ thấy dữ liệu của mình. Có test tự động.

**Chưa có** (để vòng sau): push nhắc việc, việc lặp lại, chat/bình luận, sửa tên việc, AI tiếng Việt.

---

## Chạy thử trong ~30 phút

### 1. Supabase (5 phút)
1. Vào [supabase.com](https://supabase.com) → **New project**, chọn region **Singapore**.
2. **SQL Editor** → **New query** → dán toàn bộ `supabase/migrations/0001_init.sql` → **Run**.
3. **Authentication → Sign In / Providers → Email**: tắt **Confirm email** để đăng ký xong dùng được ngay. Nếu muốn giữ bước xác nhận email thì bỏ qua bước này.
4. **Project Settings → API Keys**: copy **Project URL** và **anon / publishable key**. Tuyệt đối không dùng key `service_role` / secret.

### 2. Máy tính (10 phút, cần Node 20+)
```bash
git clone https://github.com/hoacangio/viec-chung && cd viec-chung
bash scripts/setup.sh        # lấy khung Expo mới nhất + cài thư viện đúng phiên bản
# điền 2 dòng trong .env
npx expo start --web         # mở http://localhost:8081
```
Thử bằng 2 tài khoản: một cửa sổ thường, một cửa sổ ẩn danh. Tài khoản 1 tạo Nhà, tài khoản 2 nhập mã.

Sau đó commit `package.json`, `package-lock.json` và `app.json` để CI chạy typecheck và build web.

### 3. Lên điện thoại
**Cách A: nhanh nhất, máy tính phải bật và cùng Wi-Fi**
```bash
npx expo start
```
Cả iPhone và Android cài **Expo Go** từ store rồi quét QR. Expo Go chỉ chạy SDK mới nhất, và `setup.sh` đã lấy `@latest` nên sẽ khớp.

**Cách B: link web dùng lâu dài, không phụ thuộc máy tính** (giải quyết chuyện iOS không cài được app)
```bash
npm run build:web            # tạo thư mục dist/
npx vercel deploy dist --prod   # hoặc kéo dist/ vào https://app.netlify.com/drop (đăng nhập trước, kẻo site tự xoá)
```
- iPhone: mở link bằng **Safari** → nút Chia sẻ → **Thêm vào MH chính**. App mở toàn màn hình như app thật.
- Android: Chrome → ⋮ → **Thêm vào màn hình chính**.

> Biến `EXPO_PUBLIC_*` được đóng gói vào bản build. Anon key được thiết kế để public, còn dữ liệu được bảo vệ bằng RLS.
> Project Supabase gói free sẽ tạm dừng nếu không có hoạt động trong 7 ngày; vào dashboard bấm Restore là chạy lại.

---

## Test
```bash
npm test                     # parser giờ tiếng Việt + nhóm danh sách (26 test)
```
Test RLS cần một Postgres trống (CI tự chạy bằng service `postgres:16`):
```bash
psql -f supabase/tests/_local_auth_stub.sql   # CHỈ dùng cho DB test, không chạy trên Supabase thật
psql -f supabase/migrations/0001_init.sql
psql -f supabase/tests/rls_test.sql           # → ALL RLS TESTS PASSED
```

## Cấu trúc
```
App.tsx                     Auth → Ghép đôi → Màn hình chính
src/lib/quickAdd.ts         Parse "mai 8h…", "tối nay…", "thứ 6 tuần sau…", "@em"
src/lib/sections.ts         Nhóm việc theo hạn
src/hooks/useItems.ts       Realtime + optimistic update/rollback
supabase/migrations/        Schema, RLS, RPC (create/join household, mã mời)
supabase/tests/             Test bảo mật RLS
docs/                       Brief, chiến lược, kiến trúc, decision log
```

## Gõ nhanh: ví dụ
| Gõ | Kết quả |
| --- | --- |
| `mai 8h đóng tiền điện` | Đóng tiền điện · Mai 08:00 |
| `đón bé 5h chiều @anh` | Đón bé · Hôm nay 17:00 · giao Anh |
| `tối nay mua bánh sinh nhật` | Mua bánh sinh nhật · Hôm nay 19:00 |
| `thứ 6 tuần sau họp phụ huynh` | Họp phụ huynh · T6 tuần sau 09:00 |
| `12/11 khám răng cho bé` | Khám răng cho bé · 12/11 09:00 |
| `9h rưỡi tối dọn bếp` | Dọn bếp · 21:30 |
