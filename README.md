# 🖐️ BME Hand Rehabilitation System

Hệ thống phục hồi chức năng bàn tay sử dụng trò chơi tương tác MediaPipe + Supabase backend.

## 📁 Cấu trúc dự án

```
Game-phuc-hoi-chuc-nang/
├── index.html              # Game client (bệnh nhân chơi trực tiếp)
├── doctor-dashboard/       # Dashboard bác sĩ (React + Vite)
│   ├── src/
│   │   ├── components/     # Sidebar, TopNav, ProtectedLayout
│   │   ├── contexts/       # AuthContext (Supabase Auth)
│   │   ├── lib/            # Supabase client
│   │   └── pages/          # Login, Dashboard, PatientList, PatientDetail, SessionDetail
│   ├── .env.local          # Supabase keys (không push lên git)
│   └── package.json
└── README.md
```

## 🎮 Game Client (Bệnh nhân)

### Yêu cầu
- Trình duyệt Chrome (khuyến nghị)
- Webcam
- Kết nối internet (để lưu dữ liệu lên Supabase)

### Cách chạy
1. Mở file `index.html` trực tiếp bằng trình duyệt
2. Đăng ký / Đăng nhập bằng email + mật khẩu
3. Cho phép webcam → bắt đầu chơi

> **Lưu ý:** Nếu chạy từ file local (`file://`), một số trình duyệt có thể chặn webcam. Dùng Live Server extension hoặc `npx serve .` để chạy qua `http://localhost`.

---

## 🩺 Doctor Dashboard (Bác sĩ)

### Yêu cầu
- Node.js >= 18
- npm >= 9

### Cài đặt

```bash
cd doctor-dashboard
npm install
```

### Cấu hình

Tạo file `.env.local` trong thư mục `doctor-dashboard/`:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### Chạy development

```bash
npm run dev
```

Mở trình duyệt tại `http://localhost:5173`

### Build production

```bash
npm run build
```

Output sẽ nằm trong thư mục `dist/`.

---

## 🗄️ Supabase Backend

### Database Schema

| Bảng | Mô tả |
|---|---|
| `profiles` | Thông tin người dùng (tên, role, ghi chú chẩn đoán) |
| `sessions` | Kết quả mỗi phiên tập (điểm, góc gập, độ rung, kết luận) |
| `session_events` | Dữ liệu chi tiết từng lần bắt trong phiên |

### Roles

| Role | Quyền |
|---|---|
| `patient` | Chơi game, xem lịch sử cá nhân |
| `doctor` | Xem tất cả bệnh nhân, phiên tập, ghi chú chẩn đoán, xuất CSV |

### Tạo tài khoản bác sĩ

Tài khoản bác sĩ phải được tạo thủ công trong Supabase Dashboard:
1. **Authentication → Users → Add User** (email + password)
2. **SQL Editor** → cập nhật role:
```sql
UPDATE public.profiles SET role = 'doctor' WHERE id = '<user-id>';
```

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| Game Client | HTML5, JavaScript, MediaPipe Hands |
| Doctor Dashboard | React 19, TypeScript, Vite, TailwindCSS v4 |
| Charts | Recharts |
| Backend | Supabase (PostgreSQL, Auth, RLS) |
| Routing | React Router v7 |

---

## 📄 License

© 2024 Trung tâm Kỹ thuật Y sinh (BME). All rights reserved.
