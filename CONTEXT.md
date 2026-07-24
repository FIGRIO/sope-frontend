# CONTEXT.md - Bộ nhớ riêng cho sope-frontend

## Cập nhật 2026-07-24 – Bổ sung tài khoản admin demo vào README

- `README.md` đã ghi tài khoản đăng nhập admin mặc định: username `admin`, password `admin123`.
- Trang đăng nhập là `/login` và trang quản trị là `/admin`.
- Đây chỉ là thông tin dành cho môi trường local/demo; khi triển khai production phải đổi `APP_ADMIN_PASSWORD` và không đưa mật khẩu vào biến `NEXT_PUBLIC_*`, mã nguồn hoặc tài liệu công khai.
- Thay đổi lần này chỉ cập nhật tài liệu, không thay đổi mã nguồn hay biến môi trường.

## Cập nhật 2026-07-24 – Bổ sung mô tả, cấu trúc và link production

- `README.md` mô tả đầy đủ chức năng khách hàng/admin/PWA/chatbot, cây App
  Router thực tế và trách nhiệm của `app`, `components`, `hooks`, `lib`,
  `public`, `tests`.
- Thêm bảng link production của toàn hệ thống; website chính:
  `https://sope-frontend-self.vercel.app/`.
- Chỉ cập nhật tài liệu, không đổi route, component, API hoặc runtime.

## Cập nhật 2026-07-24 – README hướng dẫn chạy dự án

- Thay README mặc định của Create Next App bằng hướng dẫn SOPE thực tế:
  Node.js 22, `npm ci`, `.env.local`, chạy dev, test/lint/build, Docker, Vercel
  và xử lý lỗi CORS/port/build-time environment.
- Ghi rõ `NEXT_PUBLIC_API_URL` là domain gốc Spring Boot không có `/api`,
  `INTERNAL_API_URL` là tùy chọn server-side và frontend không gọi FastAPI trực
  tiếp.
- Hướng dẫn smoke test các route chính và chatbot qua `POST /api/chat` của
  backend; không thay đổi code/runtime hay API contract.

## Cập nhật 2026-07-24 – Cô lập recommendation và khóa duplicate chat

- `ProductClient.tsx` tải product chính độc lập với `SimilarProducts`.
  Recommendation có `AbortController`, reset loading trong `finally` và chuyển
  mọi lỗi/non-JSON/non-2xx thành danh sách rỗng; block tương tự tự ẩn khi rỗng.
- `ChatbotWidget.tsx` dùng ref in-flight làm khóa đồng bộ ngay trước request,
  nên click/Enter nhanh không tạo request trùng; ref và loading luôn reset trong
  `finally`, lịch sử chat cũ được giữ nguyên khi lỗi.
- Browser vẫn chỉ gọi `${NEXT_PUBLIC_API_URL}/api/chat` và endpoint
  recommendation của Spring Boot, không gọi domain FastAPI trực tiếp.
- `npm test` chạy kiểm tra kiến trúc/contract trong
  `tests/chatbot-recommendation-isolation.test.mjs`; 4 test pass.
  `npm run lint` đạt 0 error (còn warning cũ) và `npm run build` pass.

## Cập nhật 2026-07-24 – Phân biệt lỗi CORS/mạng với sản phẩm không tồn tại

- Route: `/products/[id]`; API: GET product, reviews và coupon từ Spring Boot.
- `lib/auth.ts` tiếp tục ưu tiên `NEXT_PUBLIC_API_URL`, fallback `NEXT_PUBLIC_API_BASE_URL`; Server Component ưu tiên `INTERNAL_API_URL`. URL được trim và bỏ dấu `/` cuối, nhưng biến deploy vẫn phải là domain gốc không có `/api`.
- `ProductClient.tsx` chỉ hiển thị “Không tìm thấy sản phẩm” khi backend trả đúng HTTP 404. Lỗi CORS/mạng, 401/403/5xx và JSON lỗi hiển thị trạng thái “Không thể tải sản phẩm” cùng thông báo phù hợp.
- Production tại thời điểm kiểm tra: bundle dùng `https://sope-backend-wezh.onrender.com`, không dùng localhost; `/products/3` và ba API liên quan đều HTTP 200.
- Kiểm tra local: ESLint hai file sửa đạt 0 lỗi; `npm ci` và `npm run build` trong bản sao source sạch pass TypeScript và đủ 25 route.
- Cấu hình/redeploy/kiểm tra đầy đủ ở `../CORS_DEPLOYMENT_FIX.md`. Không thay đổi API contract, auth, payment hoặc route.

## Cập nhật 2026-07-23 – Chuẩn bị deploy frontend

- `Dockerfile` tiếp tục dùng Next.js standalone/non-root và bổ sung healthcheck HTTP cổng 3000.
- `lib/auth.ts` tách URL theo môi trường: browser dùng `NEXT_PUBLIC_API_URL` công khai; Server Component ưu tiên `INTERNAL_API_URL`. Full-stack Compose đặt internal URL là `http://backend:8080`.
- `.env.example` và README đã ghi rõ public build-time URL so với private runtime URL; đổi public backend URL phải build lại frontend.
- Kiểm tra: lint toàn dự án exit 0 (còn warning cũ), lint file thay đổi 0 lỗi, `npm run build` pass 25 route, frontend local trả HTTP 200.
- Full-stack deploy dùng `../docker-compose.yml`, `../.env.example`, `../DEPLOYMENT.md`.

## Cập nhật 2026-07-23 – Chatbot hỏi trạng thái đơn hàng

- `components/ChatbotWidget.tsx` tiếp tục gửi Bearer token hiện có tới `POST /api/chat`, nhờ đó backend xác định đúng tài khoản khi trả trạng thái đơn.
- Lời chào và placeholder nêu rõ chatbot hỗ trợ đơn cá nhân; thêm câu hỏi nhanh “Đơn gần nhất của tôi đang ở đâu?” và “Có đơn nào đang giao không?”.
- Link nội bộ trong câu trả lời như `/login`, `/orders`, `/orders/{id}` mở cùng tab; chỉ link ngoài dùng `https://` mới được mở tab mới.
- ID tin nhắn dùng bộ đếm `useRef`, không gọi hàm thời gian không thuần trong đường render theo quy tắc lint React.
- Kiểm tra: ESLint riêng widget 0 lỗi; toàn bộ `npm run lint` exit 0 (còn warning có sẵn ở file khác); `npm run build` pass đủ 25 route.

## Cập nhật 2026-07-17 – Sửa đăng nhập/đăng ký

- File sửa: `lib/auth.ts`.
- Thay đổi: thêm `credentials: "include"` vào helper POST JSON/text để login, Google login và các request auth nhận/gửi cookie HttpOnly theo cấu hình CORS backend.
- Luồng register giữ nguyên: tạo tài khoản rồi login tự động; sau khi JWT backend hợp lệ, luồng đã smoke test thành công.
- Kiểm tra: ESLint `lib/auth.ts`, `/login`, `/register` pass; API runtime register 201 và login 200.
- Lưu ý: đăng nhập mới sẽ ghi đè token localStorage cũ.

## Cập nhật 2026-07-17 – Chẩn đoán 403 khi thêm giỏ

- API liên quan: `POST /api/cart/items` trong `lib/shop.ts`; request có Bearer token lấy từ `localStorage` và `credentials: include`.
- Không sửa code frontend. Diff payment chỉ đổi kiểu/endpoint payment, không đổi `addToCart` hay `requestJson`.
- Kết luận: frontend đã có token nhưng backend không xác thực được token cũ sau khi JWT secret đổi nên UI nhận body rỗng với status 403. Chỉ đăng nhập lại sau khi backend đã được cấu hình JWT secret Base64 hợp lệ; cấu hình hiện tại làm login trả 500.
- CORS đã xác nhận hợp lệ cho `http://localhost:3000`; nếu chạy frontend ở port/IP khác phải thêm đúng origin vào `APP_FRONTEND_ORIGINS`.

## 1. Vai trò của frontend

`sope-frontend/` là phần giao diện người dùng của dự án SOPE.

Frontend hiện dùng cấu trúc **Next.js App Router** với `app/`, `components/`, `hooks/`, `lib/`.

Phần này phụ trách:

- Trang chủ.
- Đăng nhập, đăng ký.
- Danh sách sản phẩm.
- Chi tiết sản phẩm.
- Giỏ hàng.
- Thanh toán.
- Trang admin.
- Trang seller.
- Component dùng chung.
- Hook dùng chung.
- API client/helper/config trong `lib/`.
- Tích hợp giao diện chatbot nếu có.

---

## 2. Cấu trúc frontend hiện tại

```text
sope-frontend/
├─ AGENTS.md
├─ CONTEXT.md
├─ app/
│  ├─ (auth)/
│  │  ├─ login/
│  │  └─ register/
│  ├─ (checkout)/
│  │  ├─ cart/
│  │  └─ checkout/
│  ├─ admin/
│  │  └─ page.tsx
│  ├─ data/
│  ├─ products/
│  │  ├─ [id]/
│  │  │  └─ page.tsx
│  │  └─ page.tsx
│  ├─ seller/
│  ├─ favicon.ico
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
├─ hooks/
└─ lib/
```

---

## 3. Công nghệ frontend

- Framework: Next.js App Router.
- Ngôn ngữ: TypeScript/React.
- Route chính: `app/`.
- CSS global: `app/globals.css`.
- Component dùng chung: `components/`.
- Custom hook: `hooks/`.
- API/helper/config: `lib/`.

Cần cập nhật thêm:

- Package manager:
- UI library:
- State management:
- Cách gọi API:
- Lệnh chạy dev:
- Lệnh build:
- Lệnh lint:

---

## 4. Ý nghĩa từng khu vực

### `app/(auth)/login/`

Phụ trách trang đăng nhập.

Cần kiểm tra khi sửa:

- Form đăng nhập.
- API login.
- Token/cookie/session.
- Redirect sau đăng nhập.
- Thông báo lỗi đăng nhập.
- CORS/backend auth nếu login không hoạt động.

### `app/(auth)/register/`

Phụ trách trang đăng ký.

Cần kiểm tra khi sửa:

- Form đăng ký.
- Validate dữ liệu.
- API register.
- Field gửi lên backend.
- Thông báo lỗi từ backend.

### `app/(checkout)/cart/`

Phụ trách giỏ hàng.

Cần kiểm tra khi sửa:

- Thêm/xóa/cập nhật số lượng sản phẩm.
- Nơi lưu cart.
- Giá, số lượng, tổng tiền.
- Đồng bộ với backend nếu có.
- Không bịa giá sản phẩm.

### `app/(checkout)/checkout/`

Phụ trách thanh toán.

Cần kiểm tra khi sửa:

- Dữ liệu giỏ hàng.
- Form thông tin người nhận.
- API tạo đơn hàng.
- Validate địa chỉ, số điện thoại, phương thức thanh toán.
- Auth nếu checkout yêu cầu đăng nhập.

### `app/admin/`

Phụ trách trang quản trị.

Cần kiểm tra khi sửa:

- Quyền admin.
- API admin.
- Không lộ dữ liệu nhạy cảm.
- Không chỉ ẩn UI mà bỏ qua backend role.

### `app/products/page.tsx`

Phụ trách danh sách sản phẩm.

Cần kiểm tra khi sửa:

- Nguồn dữ liệu sản phẩm.
- Tìm kiếm, lọc, sắp xếp, phân trang nếu có.
- Component hiển thị sản phẩm.
- Không hard-code dữ liệu nếu backend/data đã có.

### `app/products/[id]/page.tsx`

Phụ trách chi tiết sản phẩm.

Cần kiểm tra khi sửa:

- Lấy params `id`.
- Lấy dữ liệu sản phẩm theo id.
- Trạng thái không tìm thấy sản phẩm.
- Nút thêm vào giỏ nếu có.
- Không bịa mô tả, giá, tồn kho.

### `app/seller/`

Phụ trách khu vực người bán nếu có.

Cần kiểm tra khi sửa:

- Quyền seller.
- API seller.
- Không trộn lẫn seller và admin nếu chưa cần.

### `app/data/`

Có thể chứa dữ liệu tĩnh frontend.

Cần kiểm tra:

- Dữ liệu ở đây có phải dữ liệu thật không.
- Có đang được `products` hoặc trang chủ import không.
- Nếu chuyển sang API backend, phải kiểm tra toàn bộ nơi dùng.

### `app/layout.tsx`

Layout gốc toàn ứng dụng.

Cần cẩn thận vì ảnh hưởng toàn website.

### `app/page.tsx`

Trang chủ.

Cần kiểm tra component và dữ liệu hiển thị.

### `app/globals.css`

CSS global.

Chỉ sửa khi cần, vì ảnh hưởng toàn dự án.

### `components/`

Component dùng chung.

Cần kiểm tra nơi sử dụng trước khi đổi props hoặc xóa component.

### `hooks/`

Custom hooks.

Hook phải dùng đúng quy tắc React, chỉ dùng trong Client Component.

### `lib/`

API client, helper, config, format, auth helper nếu có.

Không đặt secret key ở frontend.

---

## 5. Quy tắc Next.js App Router cần nhớ

- Route được tạo bằng thư mục và `page.tsx`.
- Route group `(auth)` và `(checkout)` không xuất hiện trên URL.
- Dynamic route sản phẩm là `products/[id]`.
- Component mặc định là Server Component.
- Chỉ thêm `"use client"` khi cần state, effect, event handler, browser API hoặc custom hook client-side.
- Không thêm `"use client"` bừa bãi vào toàn bộ page nếu có thể tách component nhỏ.

---

## 6. API frontend đang gọi

| Chức năng | Method | Endpoint | File gọi API | Backend liên quan | Ghi chú |
|---|---|---|---|---|---|
| Login | Chưa cập nhật | Chưa cập nhật | Chưa cập nhật | sope-backend/security/controller | Cần điền |
| Register | Chưa cập nhật | Chưa cập nhật | Chưa cập nhật | sope-backend/security/controller | Cần điền |
| Product list | Chưa cập nhật | Chưa cập nhật | Chưa cập nhật | sope-backend/controller/service | Cần điền |
| Product detail | Chưa cập nhật | Chưa cập nhật | Chưa cập nhật | sope-backend/controller/service | Cần điền |
| Cart | Chưa cập nhật | Chưa cập nhật | Chưa cập nhật | sope-backend/controller/service | Cần điền |
| Checkout | Chưa cập nhật | Chưa cập nhật | Chưa cập nhật | sope-backend/controller/service | Cần điền |

---

## 7. Component, hook, lib quan trọng

### PWA / Service Worker
- Đã thêm component [components/PwaRegistration.tsx](components/PwaRegistration.tsx) để đăng ký service worker từ client-side.
- Đã thêm [public/sw.js](public/sw.js) với cache versioning cho asset tĩnh và endpoint catalog public.
- Các route nhạy cảm như auth/cart/orders/payment/admin/chat/ws được cấu hình bypass cache.
- Người dùng sẽ nhận thông báo khi có bản cập nhật mới và có thể reload ngay.

| Loại | Tên | Đường dẫn | Chức năng | Ghi chú |
|---|---|---|---|---|
| Component | Chưa cập nhật | Chưa cập nhật | Chưa cập nhật | Cần điền |
| Hook | Chưa cập nhật | Chưa cập nhật | Chưa cập nhật | Cần điền |
| Lib/helper | Chưa cập nhật | Chưa cập nhật | Chưa cập nhật | Cần điền |

---

## 8. Lỗi frontend cũ cần tránh

| Ngày | Lỗi | Nguyên nhân | Cách tránh | Route/file liên quan |
|---|---|---|---|---|
| Chưa có | Chưa có | Chưa có | Chưa có | Chưa có |

---

## 9. Nhật ký làm việc frontend gần nhất

### Lần 1

- Ngày:
- Người dùng yêu cầu:
- Route/khu vực liên quan:
- File đã sửa:
- Component/hook/lib liên quan:
- API liên quan:
- Nội dung thay đổi:
- Lỗi gặp phải:
- Cách xử lý:
- Cách kiểm tra trên trình duyệt:
- Có cập nhật root CONTEXT.md không:
- Việc cần làm tiếp theo:

---

## 10. Cách kiểm tra frontend

Lệnh tham khảo:

```bash
npm run dev
npm run build
npm run lint
```

Hoặc:

```bash
pnpm dev
pnpm build
pnpm lint
```

Hoặc:

```bash
yarn dev
yarn build
yarn lint
```

Khi kiểm tra cần ghi rõ:

- Route/trang:
- Thao tác:
- Kết quả mong đợi:
- API liên quan nếu có:

---

## 11. Việc cần làm tiếp theo cho frontend

- [ ] Điền package manager thực tế.
- [ ] Ghi lại API base URL.
- [ ] Ghi lại file trong `lib/` dùng gọi API.
- [ ] Ghi lại component sản phẩm chính.
- [ ] Ghi lại cơ chế auth/token.
- [ ] Ghi lại lỗi frontend nếu phát sinh.

---

## Cap nhat 2026-07-08 - Gio hang tren trang san pham

- Nguoi dung yeu cau: them nut them vao gio hang cho `/products` va `/products/[id]`, dong thoi badge gio hang phai dung so luong that thay vi hard-code `3`.
- Route/khu vuc: `app/products/page.tsx`, `app/products/[id]/page.tsx`, `components/Header.tsx`, `lib/shop.ts`.
- File da sua: `lib/shop.ts`, `components/Header.tsx`, `components/ProductAddToCartButton.tsx`, `app/products/page.tsx`, `app/products/[id]/page.tsx`.
- API lien quan: `GET /api/cart`, `POST /api/cart/items`, `PUT /api/cart/items/{id}`, `DELETE /api/cart/items/{id}`, `POST /api/orders`.
- Noi dung thay doi: them event cap nhat gio hang; Header tu dong load `totalItems`; product card co nut client them vao gio; chi tiet san pham co nut them gio ro chu.
- Cach kiem tra: dang nhap, vao `/products`, bam `Them vao gio`, badge tren header tang; vao `/cart` thay san pham; vao chi tiet san pham bam nut them gio hoac mua ngay.
- Lenh da chay: `npm run build` thanh cong, co log Dynamic server usage tu trang chu nhung exit code 0.
- Luu y: khong dat button ben trong Link tren listing; khong hard-code so luong gio hang.

---

## Cap nhat 2026-07-08 - GoogleSignInButton initialize lap

- Yeu cau: kiem tra log loi khi dang nhap/dang ky va Google login.
- Route/khu vuc: `/login`, `/register`, `components/GoogleSignInButton.tsx`, `lib/auth.ts`.
- File da sua: `components/GoogleSignInButton.tsx`.
- Noi dung thay doi: Google Sign-In chi goi `google.accounts.id.initialize()` khi client id doi; callback credential dung ref de khong bi recreate theo render cha; button van render rieng cho login/register.
- Kiem tra: `npm run build` thanh cong. Build van co log Dynamic server usage tu trang chu nhung exit code 0.
- Luu y: tranh de callback props trong dependency lam Google initialize lap lai lien tuc.

---

## Cap nhat 2026-07-08 - Google client id trong frontend env example

- Yeu cau: them lai Google client id de dang nhap/dang ky bang Google.
- File da sua: `.env.example`.
- Noi dung: cap nhat `NEXT_PUBLIC_GOOGLE_CLIENT_ID=953134505647-thn9ed73vuiao2g8nml0r4277fmikql0.apps.googleusercontent.com` de file mau khop `.env.local`.
- Kiem tra: `rg` xac nhan `.env.local` va `.env.example` deu co client id.
- Luu y: restart frontend dev server sau khi thay doi `.env.local`.

---

## Cap nhat 2026-07-08 - CBF product detail va checkout success

- Yeu cau: sua loi fetch san pham tuong tu CBF tren `/products/[id]` va them buoc xac nhan hoan tat checkout.
- Route/khu vuc: `app/products/[id]/page.tsx`, `app/(checkout)/checkout/page.tsx`, `app/(checkout)/checkout/success/page.tsx`.
- File da sua: `app/products/[id]/page.tsx`, `app/(checkout)/checkout/page.tsx`, `app/(checkout)/checkout/success/page.tsx`.
- Noi dung thay doi: trang chi tiet dung `API_BASE_URL` cho product/recommendation; recommendation non-OK chi an block goi y thay vi throw; checkout tao don xong chuyen sang `/checkout/success` voi ma don, phuong thuc, tong tien va link thanh toan neu co.
- Kiem tra: `npm run build` thanh cong. Build van log Dynamic server usage tu trang chu nhung exit code 0.
- Luu y: route `/checkout/success` la buoc hoan tat; VNPAY/MOMO hien nut `Tiep tuc thanh toan` thay vi auto redirect ngay.

---

## Cap nhat 2026-07-08 - Sua hydration Header

- Yeu cau: giao dien bao Hydration failed tai `components/Header.tsx` khi user da dang nhap.
- File da sua: `components/Header.tsx`.
- Noi dung thay doi: initial state `auth` doi tu doc `getStoredAuth()` ngay luc render sang `null`, sau hydrate moi doc localStorage trong `useEffect`.
- Kiem tra: `npm run build` thanh cong. Build van log Dynamic server usage cu tu trang chu nhung exit code 0.
- Luu y: Client Component SSR khong nen doc localStorage trong initializer vi server render guest, client render user se mismatch.

---

## Cap nhat 2026-07-08 - Breadcrumb chi tiet san pham

- Yeu cau: sua breadcrumb tren `/products/[id]` de bam Trang chu/category/brand dieu huong dung.
- File da sua: `app/products/[id]/page.tsx`.
- Noi dung thay doi: thay breadcrumb hard-code bang Next `Link`; category link toi `/products?category=...`, brand link toi `/products?category=...&brand=...`.
- Kiem tra: `npm run build` thanh cong. Build van log Dynamic server usage cu tu trang chu nhung exit code 0.
- Luu y: neu sua bo loc `/products`, can giu dong bo ten query `category` va `brand` voi breadcrumb.

---

## Cap nhat 2026-07-08 - Anh chi tiet tablet

- Yeu cau: kiem tra loi anh khi vao chi tiet san pham may tinh bang.
- File da sua: `app/products/[id]/page.tsx`.
- Noi dung thay doi: uu tien `mainThumbnail` cho anh chinh; thumbnails gom ca `mainThumbnail` va `images`; them `onError` fallback ve thumbnail/khong co anh.
- Kiem tra: API tablet id 163 co anh va URL tra 200; `npm run build` thanh cong.
- Luu y: day la loi logic hien thi frontend, khong phai DB thieu anh trong mau tablet da kiem tra.

---

## Cap nhat 2026-07-08 - Icon danh muc va search suggest

- Yeu cau: them icon cho `Danh muc san pham` va goi y san pham khi go tim kiem.
- File da sua: `app/page.tsx`, `components/Header.tsx`.
- Noi dung thay doi: thay chu `Icon` bang SVG icon phone/laptop/tablet; Header fetch goi y san pham theo keyword voi debounce 250ms, hien dropdown san pham va nut xem tat ca ket qua.
- Kiem tra: `npm run build` thanh cong. Build van log Dynamic server usage cu tu trang chu nhung exit code 0.
- Luu y: search suggest hien tai la Content-Based/Hybrid nhe o frontend; cac thuat toan CF/SVD can them API/model rieng neu can chinh xac theo hanh vi nguoi dung.

---

## Cap nhat 2026-07-08 - Product filters va sort bar

- Yeu cau: nang cap trang `/products` voi sort buttons dung data that va bo loc hang/loai thiet bi/khoang gia/dung luong.
- File da sua: `app/products/page.tsx`, `components/ProductFilterSidebar.tsx`, `components/ProductSortBar.tsx`.
- Noi dung thay doi: sidebar filter la Client Component, option loc lay tu API products, co slider min/max price va storage; sort bar co Pho bien/Moi nhat dung URL query, Ban chay disabled do chua co du lieu.
- Kiem tra: `npm run build` thanh cong. Build van log Dynamic server usage cu tu trang chu nhung exit code 0.
- Luu y: filter storage can backend moi duoc restart; URL filter dung `category`, `brand`, `storage`, `minPrice`, `maxPrice`, `sort`, `sortBy`, `sortDir`.

## 2026-07-08 - Product filter UI cleanup
- Yeu cau: Bo filter dung luong, doi loc gia thanh 2 input min/max, reset filter sach, sap xep gia tang/giam va pho bien.
- Da sua: app/products/page.tsx; components/ProductFilterSidebar.tsx; components/ProductSortBar.tsx.
- Thay doi: Trang products khong doc/ghi query storage; sidebar khong render dung luong; xoa loc ve /products; loc gia nhap min/max; sort bar gui sortBy=price asc/desc hoac sortBy=ratingStars desc.
- Kiem tra: npx eslint app/products/page.tsx components/ProductFilterSidebar.tsx components/ProductSortBar.tsx pass, con warning img cu.
- Luu y: Neu sua tiep filter products, khong them lai storage filter khi chua co mapping on dinh tu backend.

## 2026-07-08 - Fix product brand/price filters
- Yeu cau: Sua loc hang iPhone/iPad va loc gia tren /products.
- Da sua: app/products/page.tsx; components/ProductFilterSidebar.tsx.
- Thay doi: build brand option suy luan iPhone (Apple), iPad (Apple), MacBook (Apple) va cac hang pho bien tu ten san pham khi backend brand rong; input gia doi sang text va parse duoc 10, 10tr, 10.000.000 thanh VND.
- Kiem tra: npx eslint app/products/page.tsx components/ProductFilterSidebar.tsx pass, con warning img cu.
- Luu y: Filter hang phu thuoc backend moi da restart de brandContains fallback theo name.

## 2026-07-08 - Forgot password frontend
- Yeu cau: Them tinh nang quen mat khau o trang dang nhap.
- Da sua: lib/auth.ts; app/(auth)/login/page.tsx; app/(auth)/forgot-password/page.tsx; app/(auth)/reset-password/page.tsx; app/products/page.tsx.
- Thay doi: Them helper requestPasswordReset/resetPassword; login co link /forgot-password; them form nhap email va form dat mat khau moi tu token; formatPrice nhan undefined de build khong loi type.
- Kiem tra: npx eslint "app/(auth)/login/page.tsx" "app/(auth)/forgot-password/page.tsx" "app/(auth)/reset-password/page.tsx" app/products/page.tsx lib/auth.ts pass voi 1 warning img cu; npm run build pass.
- Luu y: Reset link hien do backend tra ve de test local vi chua co SMTP; sau nay neu co email thi co the an link nay tren UI.

## 2026-07-08 - Admin login to dashboard
- Yeu cau: Dang nhap tai khoan admin vao dashboard.
- Da sua: lib/auth.ts; app/(auth)/login/page.tsx; app/admin/page.tsx; components/Header.tsx.
- Thay doi: isAdminAuth nhan ROLE_ADMIN/ADMIN; login admin redirect /admin; dashboard /admin co guard localStorage auth + role; Header hien link Dashboard khi auth la admin.
- Kiem tra: npx eslint "app/(auth)/login/page.tsx" app/admin/page.tsx components/Header.tsx lib/auth.ts pass voi warning img cu; npm run build pass.
- Luu y: Neu vao /admin khi chua dang nhap se bi day ve /login; user thuong bi day ve /.

## 2026-07-08 - Checkout chuyen khoan gia lap va doanh thu admin
- Yeu cau: Sau khi chon VNPAY/MoMo phai co buoc chuyen khoan gia lap, luu lich su thanh toan va admin thay doanh thu that.
- Route/khu vuc: /checkout, /checkout/success, /admin, lib/shop.ts.
- Da sua: lib/shop.ts; app/(checkout)/checkout/page.tsx; app/(checkout)/checkout/success/page.tsx; app/admin/page.tsx.
- API lien quan: POST /api/payment/create; POST /api/payment/{id}/simulate-bank-transfer; GET /api/admin/stats.
- Thay doi: checkout truyen paymentId sang success; success hien thong tin chuyen khoan demo va nut TOI DA CHUYEN KHOAN goi backend; admin dashboard lay stats that de hien totalRevenue/totalOrders/users/products.
- Kiem tra: npx eslint "app/(checkout)/checkout/page.tsx" "app/(checkout)/checkout/success/page.tsx" app/admin/page.tsx lib/shop.ts pass voi 2 warning img cu; npm run build pass.
- Luu y: Can backend moi chay de nut simulate hoat dong; neu chua bam nut simulate thi don VNPAY/MoMo van PENDING va doanh thu chua tang.

## 2026-07-08 - Sua mau chu input checkout
- Yeu cau: O nhap thong tin thanh toan dang hien chu nhap mau xam, doi sang mau den.
- Route/khu vuc: /checkout.
- Da sua: app/(checkout)/checkout/page.tsx.
- Thay doi: Them text-black cho cac input thong tin nguoi nhan/dia chi/ghi chu, placeholder van la gray.
- Kiem tra: npx eslint "app/(checkout)/checkout/page.tsx" pass voi 1 warning img cu.
- Luu y: Dung class mau chu truc tiep tren input checkout de tranh bi ke thua mau text xam tu parent.

## 2026-07-09 - Lich su mua hang cua nguoi dung
- Yeu cau: Nguoi dung co the xem lich su mua hang cua ban than.
- Route/khu vuc: /orders, Header, lib/shop.ts.
- Da sua: lib/shop.ts; app/orders/page.tsx; components/Header.tsx.
- API lien quan: GET /api/orders.
- Thay doi: Them getMyOrders; tao trang /orders co guard dang nhap, tong da thanh toan, danh sach don hang va item trong don; Header co link Don mua cho user da dang nhap.
- Kiem tra: npx eslint app/orders/page.tsx components/Header.tsx lib/shop.ts pass voi 1 warning img cu; npm run build pass.
- Luu y: Khong tao backend moi vi OrderController da co GET /api/orders tra lich su don cua user hien tai.

## 2026-07-09 - Chuan hoa tieng Viet co dau tren giao dien
- Yeu cau: Doi cac chu tieng Viet khong dau tren giao dien website sang tieng Viet co dau, giu nguyen logic.
- Route/khu vuc: auth pages, cart, checkout, checkout success, orders, products, Header, admin dashboard, product filter/sort, lib message helpers.
- Da sua: app/(auth)/forgot-password/page.tsx; app/(auth)/login/page.tsx; app/(auth)/reset-password/page.tsx; app/(checkout)/cart/page.tsx; app/(checkout)/checkout/page.tsx; app/(checkout)/checkout/success/page.tsx; app/admin/page.tsx; app/orders/page.tsx; app/products/page.tsx; app/products/[id]/page.tsx; components/Header.tsx; components/ProductAddToCartButton.tsx; components/ProductFilterSidebar.tsx; components/ProductSortBar.tsx; lib/auth.ts; lib/shop.ts.
- Thay doi: Chuan hoa label/nut/thong bao/loading/mo ta sang tieng Viet co dau; doi mac dinh tinh thanh checkout tu Ho Chi Minh sang Ho Chi Minh co dau; khong doi API path, enum, query param hay logic redirect.
- Kiem tra: npx eslint cac file da sua pass voi 11 warning img cu; npm run build pass. npm run lint toan bo van fail do loi cu trong hooks/useWebSocket.ts.
- Luu y: Cac chuoi includes("dang nhap") la check logic voi thong bao backend nen de nguyen; khong sua app/data vi do la du lieu san pham/review mau.

## 2026-07-16 - Hoàn thiện tích hợp frontend

- Yêu cầu: sửa catalog phone/tablet, C08, H06, cart contract, chatbot qua Backend, Next.js 16 và cấu hình deploy.
- Đã sửa: các trang catalog/home/product detail/cart/checkout/admin shipping; `ChatbotWidget`, `ProductCard`, PWA/WebSocket hooks; `lib/auth.ts`, `lib/shop.ts`; `package.json`; thêm `.env.example`, `Dockerfile`.
- Thay đổi: mọi dữ liệu catalog/giao hàng/admin shipping dùng API thật; hiển thị loading/empty/error; chatbot chỉ gọi `/api/chat` của Spring; cart đọc đủ variant và tồn kho; API URL lấy từ env.
- Lỗi đã xử lý: `params` Next 16, `viewport`, Turbopack/PWA, truyền `formatPrice` qua Server–Client, type variant, response page và lỗi runtime `/products` 500.
- Kiểm tra: `npm run lint` exit 0 (124 warning, chủ yếu ảnh và service-worker sinh tự động); `npm run build` pass; `/`, `/products`, `/products/11`, `/cart`, `/checkout`, `/admin/shipping` đều HTTP 200.
- Việc tiếp theo: kiểm tra trực quan bằng browser khi có phiên browser; đăng nhập admin thật để thử toggle H06. Không đưa secret vào `NEXT_PUBLIC_*`.

## 2026-07-17 - Checkout VNPAY/MoMo Sandbox thật

- Yêu cầu: bỏ chuyển khoản giả lập, đồng bộ payment contract mới và result lấy dữ liệu backend.
- Đã sửa: `app/(checkout)/checkout/page.tsx`, `app/(checkout)/checkout/success/page.tsx`, `lib/shop.ts`; sửa cơ học các effect cũ và root viewport để lint/build toàn dự án sạch lỗi.
- Checkout: COD giữ luồng cũ; VNPAY có tự chọn/VNPAYQR/VNBANK/INTCARD; online payment không gửi amount, chống double-click và dùng `window.location.assign` khi có payUrl.
- Result: chỉ tin `paymentId` hoặc `orderId`, gọi backend/polling 3 giây; hiển thị trạng thái/metadata/chữ ký, MoMo deeplink/QR URL thật, payUrl fallback và retry; không còn dữ liệu total/status/paymentUrl từ query làm nguồn thật.
- API: `createPayment({orderId, provider, channel})`, `getPayment`, `retryPayment`; đã xóa helper simulate.
- Kiểm tra: lint toàn dự án 0 error; `npm run build` pass. Còn warning `<img>` cũ trong lint; build không còn warning metadata viewport sau khi chuyển sang export `viewport`.
- Tiếp theo: smoke test trình duyệt với backend, credential Sandbox và Ngrok; không đưa secret vào frontend env.
## 2026-07-23 - Sửa JSON catalog và chuẩn bị deploy frontend

- Yêu cầu: sửa lỗi `Unexpected non-whitespace character after JSON` khi tải trang sản phẩm, rà soát các trang lấy dữ liệu và chuẩn bị FE để deploy.
- Route/khu vực: `/`, `/products`, `/products/[id]`, các API helper auth/cart/admin, Header search, review và chatbot.
- Đã sửa: thêm `lib/api-response.ts` để đọc body trước rồi parse JSON có kiểm soát; thay toàn bộ `response.json()` trực tiếp trong các luồng API; các Server Component hiển thị empty/error state thay vì làm Next error overlay.
- Deploy: bật `output: "standalone"`; Docker dùng standalone runner/non-root user/build args; thêm `.dockerignore` và hướng dẫn env/Docker/Vercel trong README.
- API liên quan: `GET /api/products`, `GET /api/products/{id}` và các endpoint JSON dùng trong auth/cart/admin/review/chat.
- Kiểm tra: `npm run lint` đạt 0 error; `npm run build` pass; standalone smoke test 25 route đều HTTP 200 khi dùng backend đã sửa. Browser tích hợp không có phiên khả dụng nên kiểm tra route bằng HTTP/log runtime.
- Lưu ý: `NEXT_PUBLIC_API_URL` phải là URL HTTPS public của backend và được truyền trước lúc build; backend phải cho phép origin FE qua `APP_FRONTEND_ORIGINS`.

## 2026-07-23 - Chi tiết đơn mua, duyệt đơn và thông báo realtime admin

- Yêu cầu: mở được từng đơn trong `/orders`, admin nhận thông báo khi có đơn mới và tiến trình client/admin phải thống nhất.
- Route/khu vực: `/orders`, `/orders/[id]`, `/admin/orders`, `AdminTopBar`, WebSocket hook và API order.
- Đã sửa: thẻ/mã/nút đơn mua đều điều hướng tới chi tiết; thêm `OrderProgress` và `lib/order-status.ts` dùng chung nhãn, badge, timeline, luật chuyển trạng thái cho cả client/admin.
- Luồng trạng thái: COD dùng `PENDING → PROCESSING → SHIPPING → COMPLETED`; VNPAY/MoMo dùng `PENDING → PAID → PROCESSING → SHIPPING → COMPLETED`; khách chỉ hủy khi `PENDING`.
- Realtime: admin subscribe `/topic/admin.orders`, nhận toast/chuông/badge và bảng đơn tự refresh; client subscribe topic cá nhân để tự tải lại khi admin đổi trạng thái; WebSocket URL hỗ trợ cả `NEXT_PUBLIC_API_URL` và `NEXT_PUBLIC_API_BASE_URL`.
- Contract: `OrderResponse` nhận thêm `userId`, `updatedAt`, dùng đúng `estimatedDeliveryMinDate`/`estimatedDeliveryMaxDate`.
- Kiểm tra: lint toàn dự án 0 error (còn warning cũ); `npm run build` pass; production runtime `/orders` và `/admin/orders` HTTP 200. Browser tích hợp không có phiên khả dụng.
