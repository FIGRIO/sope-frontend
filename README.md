# SOPE Frontend

Frontend thương mại điện tử SOPE, xây dựng bằng Next.js 16 App Router,
React 19, TypeScript và Tailwind CSS.

Luồng gọi API:

```text
Browser → Next.js Frontend → Spring Boot Backend → FastAPI Chatbot/Gemini
```

Frontend chỉ gọi Spring Boot backend. Không cấu hình frontend gọi trực tiếp
domain chatbot.

## Mô tả dự án

SOPE Frontend là giao diện web cho khách hàng và quản trị viên, phụ trách:

- Hiển thị trang chủ, danh mục, tìm kiếm và chi tiết sản phẩm.
- Đăng ký, đăng nhập, Google Login và khôi phục mật khẩu.
- Giỏ hàng, mã giảm giá, giao hàng, đặt hàng và thanh toán.
- Lịch sử đơn mua và theo dõi tiến trình đơn hàng theo thời gian thực.
- Wishlist, đánh giá sản phẩm và trạng thái offline/PWA.
- Dashboard quản trị sản phẩm, đơn hàng, người dùng, vận chuyển và doanh thu.
- Hiển thị chatbot; mọi chat request được gửi qua Spring Boot backend.

Các service production:

| Thành phần | Link deploy |
|---|---|
| Website SOPE | [https://sope-frontend-self.vercel.app/](https://sope-frontend-self.vercel.app/) |
| Spring Boot API | [https://sope-backend-wezh.onrender.com/](https://sope-backend-wezh.onrender.com/) |
| FastAPI Chatbot | [https://chatbot-tmdt.onrender.com/](https://chatbot-tmdt.onrender.com/) |

## Cấu trúc dự án

```text
sope-frontend/
├── app/                       # Next.js App Router
│   ├── (auth)/                # Login, register, forgot/reset password
│   ├── (checkout)/            # Cart, checkout và kết quả thanh toán
│   ├── admin/                 # Các trang quản trị
│   ├── orders/                # Danh sách và chi tiết đơn mua
│   ├── products/              # Danh sách và chi tiết sản phẩm
│   │   └── [id]/              # Dynamic route /products/:id
│   ├── seller/                # Khu vực người bán
│   ├── wishlist/              # Sản phẩm yêu thích
│   ├── offline/               # Trang fallback PWA/offline
│   ├── layout.tsx             # Root layout toàn ứng dụng
│   ├── page.tsx               # Trang chủ
│   └── globals.css            # CSS global/Tailwind
├── components/                # Component UI dùng chung
├── hooks/                     # Custom React hooks, WebSocket/PWA
├── lib/                       # API client, auth, shop và helper
├── public/                    # Ảnh, manifest và service worker
├── tests/                     # Node test cho contract/regression
├── .env.example               # Mẫu biến môi trường
├── Dockerfile                 # Next.js standalone production image
├── next.config.ts             # Cấu hình Next.js/PWA
├── package.json               # Script và dependency
└── tsconfig.json              # Cấu hình TypeScript
```

Vai trò từng khu vực:

| Khu vực | Chức năng |
|---|---|
| `app/` | Định nghĩa route, layout và page theo Next.js App Router |
| `app/(auth)/` | Các luồng xác thực người dùng |
| `app/(checkout)/` | Giỏ hàng, checkout và thanh toán |
| `app/admin/` | Giao diện chỉ dành cho quản trị viên |
| `app/products/` | Catalog, lọc, tìm kiếm và product detail |
| `components/` | Header, chatbot, product card và UI tái sử dụng |
| `hooks/` | Logic client dùng chung như WebSocket và PWA |
| `lib/` | Gọi Spring Boot API, quản lý auth và business helper |
| `public/` | Static assets và file phục vụ PWA |
| `tests/` | Kiểm tra các contract quan trọng không bị phá vỡ |

## Yêu cầu

- Node.js 22, khớp với `Dockerfile`.
- npm và file `package-lock.json`.
- Spring Boot backend chạy tại `http://localhost:8080`.

## 1. Cấu hình local

Mở PowerShell tại thư mục `sope-frontend`:

```powershell
Copy-Item .env.example .env.local
```

Nội dung local tối thiểu:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
INTERNAL_API_URL=http://localhost:8080
```

| Biến | Bắt buộc | Ý nghĩa |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Có | URL Spring Boot dùng trong browser |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Khi dùng Google Login | OAuth client ID công khai |
| `INTERNAL_API_URL` | Không | URL backend dành cho Server Component/Docker private network |

Quy tắc quan trọng:

- URL backend là domain gốc, ví dụ `http://localhost:8080`.
- Không thêm hậu tố `/api` vào `NEXT_PUBLIC_API_URL`.
- Không thêm secret, API key hoặc password vào biến `NEXT_PUBLIC_*`.
- Sau khi đổi `.env.local`, phải khởi động lại dev server.
- Backend local phải cho phép origin `http://localhost:3000` trong
  `APP_FRONTEND_ORIGINS`.

## 2. Cài dependency

```powershell
npm ci
```

Nên dùng `npm ci` để cài đúng phiên bản trong `package-lock.json`. Chỉ dùng
`npm install` khi chủ động thay đổi dependency.

## 3. Chạy development

Khởi động backend trước, sau đó chạy:

```powershell
npm run dev
```

Mở:

```text
http://localhost:3000
```

Một số route chính:

| Chức năng | URL |
|---|---|
| Trang chủ | `http://localhost:3000/` |
| Sản phẩm | `http://localhost:3000/products` |
| Chi tiết sản phẩm | `http://localhost:3000/products/3` |
| Đăng nhập | `http://localhost:3000/login` |
| Giỏ hàng | `http://localhost:3000/cart` |
| Đơn mua | `http://localhost:3000/orders` |
| Admin | `http://localhost:3000/admin` |

## 4. Test, lint và build

Chạy test:

```powershell
npm test
```

Chạy lint:

```powershell
npm run lint
```

Build production:

```powershell
npm run build
```

Chạy bản production sau khi build:

```powershell
npm run start
```

Quy trình kiểm tra trước khi tạo pull request:

```powershell
npm ci
npm test
npm run lint
npm run build
```

## 5. Kiểm tra tích hợp local

Backend health:

```powershell
Invoke-RestMethod "http://localhost:8080/api/health"
```

Frontend:

```powershell
Invoke-WebRequest "http://localhost:3000"
Invoke-WebRequest "http://localhost:3000/products"
Invoke-WebRequest "http://localhost:3000/products/3"
```

Kiểm tra chatbot trên giao diện:

1. Mở widget chatbot.
2. Gửi “Tư vấn cho tôi iPhone 17”.
3. Frontend phải gọi `POST http://localhost:8080/api/chat`.
4. Không được có request browser tới `localhost:8000` hoặc domain Render của
   chatbot.

## 6. Chạy bằng Docker

Build image trong PowerShell:

```powershell
docker build `
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8080 `
  --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id `
  -t sope-frontend .
```

Chạy container:

```powershell
docker run --rm `
  --name sope-frontend `
  -p 3000:3000 `
  sope-frontend
```

Các biến `NEXT_PUBLIC_*` được nhúng vào browser bundle trong lúc build. Nếu đổi
backend URL hoặc Google client ID, phải build lại image.

Để chạy toàn bộ MySQL, backend, chatbot và frontend:

```powershell
Set-Location ..
docker compose --env-file .env build
docker compose --env-file .env up -d
docker compose ps
```

## 7. Deploy Vercel

Thiết lập:

- Root Directory: `sope-frontend`
- Framework Preset: Next.js
- Build Command: `npm run build`
- Install Command: `npm ci`

Environment production:

```dotenv
NEXT_PUBLIC_API_URL=https://sope-backend-wezh.onrender.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-google-client-id>
```

Sau khi backend URL hoặc environment thay đổi, redeploy frontend để tạo browser
bundle mới.

Nếu dùng Vercel CLI:

```powershell
npx vercel --prod
```

Frontend production hiện tại:

```text
https://sope-frontend-self.vercel.app/
```

## 8. Lỗi thường gặp

### Trang báo lỗi mạng hoặc CORS

Kiểm tra:

- Backend đang chạy và `/api/health` trả 200.
- `NEXT_PUBLIC_API_URL` không chứa `/api`.
- Backend có `APP_FRONTEND_ORIGINS=http://localhost:3000`.
- Đã restart `npm run dev` sau khi đổi `.env.local`.

### Browser vẫn gọi backend URL cũ

Biến `NEXT_PUBLIC_*` được nhúng khi build. Dừng dev server, kiểm tra lại
`.env.local`, rồi khởi động/build lại:

```powershell
npm run dev
npm run build
```

### Port 3000 đang được sử dụng

Chạy development trên port khác:

```powershell
npm run dev -- -p 3001
```

Khi đổi port, thêm origin mới vào `APP_FRONTEND_ORIGINS` của backend.

### UI dùng dữ liệu cũ sau deploy

Thử hard refresh hoặc xóa service worker/site data của domain frontend. Không
xóa cache auth/cookie của production nếu chưa sao lưu thông tin cần thiết.

### Backend Render vừa sleep/cold start

Mở endpoint health backend trước và đợi service sẵn sàng. Product detail vẫn
phải hiển thị dù recommendation tạm thời trả danh sách rỗng.

## 9. Tài liệu liên quan

- `../DEPLOYMENT.md`
- `../CORS_DEPLOYMENT_FIX.md`
- `../CHATBOT_CONCURRENCY_TIMEOUT_FIX_REPORT.md`
