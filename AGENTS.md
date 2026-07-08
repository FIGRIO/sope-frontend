# AGENTS.md - Quy tắc riêng cho sope-frontend

## 1. Vai trò của thư mục này

Bạn đang làm việc trong phần frontend của dự án SOPE.

Frontend này dùng cấu trúc **Next.js App Router** với TypeScript/React. Cấu trúc hiện tại:

```text
sope-frontend/
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

Frontend phụ trách:

- Giao diện người dùng.
- Trang chủ.
- Trang đăng nhập, đăng ký.
- Trang danh sách sản phẩm.
- Trang chi tiết sản phẩm.
- Giỏ hàng.
- Thanh toán.
- Trang admin.
- Trang seller nếu có.
- Component dùng chung.
- Hook dùng chung.
- Hàm tiện ích, API client trong `lib/`.
- Gọi API từ `sope-backend/`.
- Hiển thị hoặc tích hợp chatbot nếu có.

Không sửa backend hoặc chatbot từ thư mục này trừ khi yêu cầu thật sự cần và đã xác định rõ nguyên nhân.

---

## 2. Quy trình bắt buộc trước khi code

Trước khi sửa code frontend, phải:

1. Đọc `../CONTEXT.md` nếu tồn tại.
2. Đọc `CONTEXT.md` trong thư mục `sope-frontend/` nếu tồn tại.
3. Xác định yêu cầu thuộc khu vực nào:
   - Đăng nhập/đăng ký → kiểm tra `app/(auth)/`.
   - Giỏ hàng/thanh toán → kiểm tra `app/(checkout)/`.
   - Admin → kiểm tra `app/admin/`.
   - Sản phẩm → kiểm tra `app/products/`.
   - Seller → kiểm tra `app/seller/`.
   - Trang chủ/layout/global style → kiểm tra `app/page.tsx`, `app/layout.tsx`, `app/globals.css`.
   - Component dùng chung → kiểm tra `components/`.
   - Hook dùng chung → kiểm tra `hooks/`.
   - API/helper/config → kiểm tra `lib/`.
4. Kiểm tra file/component/hook/helper đã có trước khi tạo mới.
5. Không viết lại toàn bộ file nếu chỉ cần sửa một phần nhỏ.
6. Không tạo component, hook, helper hoặc API client trùng chức năng.
7. Không tự ý đổi cấu trúc route nếu chưa được yêu cầu.
8. Không tự ý đổi response API nếu backend chưa sửa.
9. Không hard-code API URL nếu dự án đã dùng biến môi trường.
10. Không sửa `.env` nếu không được yêu cầu rõ.

---

## 3. Quy tắc Next.js App Router

Dự án dùng thư mục `app/`, vì vậy phải tuân thủ quy tắc App Router:

- Route được tạo bằng thư mục và file `page.tsx`.
- Layout chung nằm ở `app/layout.tsx`.
- CSS global nằm ở `app/globals.css`.
- Route group như `(auth)` và `(checkout)` không xuất hiện trên URL.
- Dynamic route sản phẩm dùng `app/products/[id]/page.tsx`.

Khi sửa route:

- Không đổi tên thư mục route nếu không được yêu cầu.
- Không di chuyển page sang nơi khác nếu không cần.
- Không tạo route mới trùng với route đã có.
- Nếu thêm route mới, phải đặt đúng cấu trúc App Router.
- Nếu cần metadata, kiểm tra cách dự án đang khai báo metadata trước.

Ví dụ:

```text
app/products/page.tsx          -> /products
app/products/[id]/page.tsx     -> /products/:id
app/(auth)/login/page.tsx      -> /login
app/(auth)/register/page.tsx   -> /register
app/(checkout)/cart/page.tsx   -> /cart
app/(checkout)/checkout/page.tsx -> /checkout
```

---

## 4. Quy tắc Server Component và Client Component

Trong Next.js App Router, component mặc định là Server Component.

Chỉ thêm `"use client"` khi thật sự cần:

- Dùng `useState`.
- Dùng `useEffect`.
- Dùng event handler như `onClick`, `onChange`, `onSubmit`.
- Dùng browser API như `window`, `localStorage`, `document`.
- Dùng hook client-side.
- Dùng thư viện chỉ chạy trên trình duyệt.

Không thêm `"use client"` bừa bãi vào mọi file, vì có thể làm tăng bundle và giảm hiệu năng.

Nếu một page lớn cần tương tác, nên:

- Giữ page chính là Server Component nếu có thể.
- Tách phần tương tác thành component nhỏ trong `components/`.
- Đặt `"use client"` ở component tương tác đó.

---

## 5. Quy tắc theo từng thư mục trong `app/`

### `app/(auth)/login/`

Dùng cho trang đăng nhập.

Khi sửa login:

- Kiểm tra form đăng nhập hiện có.
- Kiểm tra API login trong `lib/` hoặc nơi đang gọi backend.
- Kiểm tra nơi lưu token/session/cookie.
- Kiểm tra redirect sau khi đăng nhập thành công.
- Kiểm tra hiển thị lỗi khi đăng nhập thất bại.
- Không lưu password hoặc thông tin nhạy cảm.
- Không để client secret ở frontend.

### `app/(auth)/register/`

Dùng cho trang đăng ký.

Khi sửa register:

- Kiểm tra validate form.
- Kiểm tra API register.
- Kiểm tra thông báo lỗi từ backend.
- Không tự ý đổi field gửi lên backend nếu backend chưa đổi.
- Nếu thêm field đăng ký mới, phải kiểm tra DTO/API backend tương ứng.

### `app/(checkout)/cart/`

Dùng cho trang giỏ hàng.

Khi sửa cart:

- Kiểm tra logic thêm/xóa/cập nhật số lượng sản phẩm.
- Kiểm tra nơi lưu cart: state, localStorage, cookie, backend hoặc context.
- Không làm mất dữ liệu giỏ hàng khi reload nếu chức năng yêu cầu lưu.
- Kiểm tra giá, số lượng, tổng tiền.
- Không tự bịa giá sản phẩm; giá phải đến từ dữ liệu thật hoặc backend.

### `app/(checkout)/checkout/`

Dùng cho trang thanh toán.

Khi sửa checkout:

- Kiểm tra dữ liệu giỏ hàng trước khi tạo đơn.
- Kiểm tra form thông tin người nhận.
- Kiểm tra API tạo đơn hàng.
- Kiểm tra validate địa chỉ, số điện thoại, phương thức thanh toán nếu có.
- Không tự ý bỏ bước kiểm tra đăng nhập nếu hệ thống yêu cầu user đăng nhập.
- Không log thông tin thanh toán nhạy cảm.

### `app/admin/`

Dùng cho trang quản trị.

Khi sửa admin:

- Kiểm tra phân quyền admin.
- Không cho user thường truy cập dữ liệu admin.
- Không hiển thị thông tin nhạy cảm nếu không cần.
- Nếu gọi API admin, phải kiểm tra backend có bảo vệ role admin không.
- Không bỏ kiểm tra auth để sửa lỗi nhanh.

### `app/products/`

Dùng cho danh sách sản phẩm.

Khi sửa `app/products/page.tsx`:

- Kiểm tra dữ liệu sản phẩm lấy từ đâu.
- Kiểm tra lọc, tìm kiếm, sắp xếp, phân trang nếu có.
- Không hard-code danh sách sản phẩm nếu backend/data đã có.
- Không bịa giá, tồn kho, khuyến mãi.

### `app/products/[id]/`

Dùng cho trang chi tiết sản phẩm.

Khi sửa `app/products/[id]/page.tsx`:

- Kiểm tra lấy `id` từ params đúng kiểu App Router.
- Kiểm tra API hoặc dữ liệu sản phẩm theo id.
- Xử lý trường hợp không tìm thấy sản phẩm.
- Không bịa thông tin sản phẩm nếu dữ liệu thiếu.
- Nếu có nút thêm vào giỏ hàng, kiểm tra tương tác client-side.

### `app/seller/`

Dùng cho chức năng người bán nếu có.

Khi sửa seller:

- Kiểm tra quyền seller.
- Không cho user không có quyền seller truy cập chức năng seller.
- Không sửa admin nếu chỉ liên quan seller.
- Nếu seller quản lý sản phẩm/đơn hàng, phải kiểm tra API backend tương ứng.

### `app/data/`

Dùng cho dữ liệu tĩnh hoặc dữ liệu nội bộ frontend nếu dự án có.

Khi sửa `app/data/`:

- Không xem dữ liệu tĩnh là dữ liệu thật nếu backend mới là nguồn chính.
- Không bịa hoặc sửa dữ liệu sản phẩm nếu chưa được yêu cầu.
- Nếu chuyển dữ liệu từ static sang API, phải kiểm tra toàn bộ nơi đang import dữ liệu đó.

### `app/layout.tsx`

Dùng cho layout gốc.

Khi sửa layout:

- Cẩn thận vì ảnh hưởng toàn bộ website.
- Không thêm logic client-side trực tiếp vào layout nếu không cần.
- Không phá import `globals.css`.
- Không đổi metadata chung nếu không được yêu cầu.
- Nếu thêm provider, kiểm tra có cần `"use client"` và có nên tách provider riêng không.

### `app/page.tsx`

Dùng cho trang chủ.

Khi sửa trang chủ:

- Không làm ảnh hưởng các route khác.
- Nếu hiển thị sản phẩm, kiểm tra nguồn dữ liệu.
- Nếu dùng component chung, ưu tiên tái sử dụng trong `components/`.

### `app/globals.css`

Dùng cho style global.

Khi sửa CSS global:

- Cẩn thận vì ảnh hưởng toàn bộ giao diện.
- Không thêm style quá rộng làm hỏng component khác.
- Ưu tiên style cục bộ/component nếu chỉ sửa một phần nhỏ.
- Kiểm tra responsive nếu sửa layout.

---

## 6. Quy tắc cho `components/`

Thư mục `components/` chứa component dùng chung.

Khi sửa component:

- Kiểm tra component đã được dùng ở đâu trước khi đổi props.
- Không đổi tên props nếu chưa kiểm tra nơi gọi.
- Không tạo component mới nếu component cũ có thể tái sử dụng.
- Component nên rõ chức năng, không chứa quá nhiều business logic.
- Nếu component cần state/event, thêm `"use client"` trong chính component đó.
- Không đưa API key hoặc secret vào component.

Tên component nên rõ nghĩa:

- `Header`
- `Footer`
- `ProductCard`
- `ProductList`
- `LoginForm`
- `RegisterForm`
- `CartItem`
- `CheckoutForm`
- `AdminTable`
- `ChatbotWidget`

---

## 7. Quy tắc cho `hooks/`

Thư mục `hooks/` chứa custom hook.

Khi sửa hook:

- Hook phải bắt đầu bằng `use`.
- Hook chỉ dùng trong Client Component.
- Không gọi hook có điều kiện.
- Không tạo hook mới nếu logic chỉ dùng một lần và đơn giản.
- Nếu hook dùng `localStorage`, `window`, `document`, phải đảm bảo chỉ chạy client-side.
- Nếu hook gọi API, phải xử lý loading, error, cleanup nếu cần.

---

## 8. Quy tắc cho `lib/`

Thư mục `lib/` dùng cho:

- API client.
- Helper function.
- Config.
- Utility.
- Hàm format tiền tệ, text, date.
- Hàm auth/token nếu dự án đặt tại đây.

Khi sửa `lib/`:

- Không tạo nhiều API client trùng nhau.
- Không hard-code base URL nếu có thể dùng biến môi trường.
- Không đặt secret key ở frontend.
- Không đưa business logic giao diện vào `lib/`.
- Nếu sửa hàm dùng chung, kiểm tra tất cả nơi import hàm đó.
- Nếu sửa API client, kiểm tra login, product, cart, checkout, admin có bị ảnh hưởng không.

---

## 9. Quy tắc gọi API backend

Khi frontend gọi backend:

- Kiểm tra backend endpoint thật.
- Kiểm tra method, URL, headers, body, query params.
- Kiểm tra response backend trả về.
- Không đổi field request/response nếu backend chưa đổi.
- Không hard-code API base URL nếu dự án dùng `.env`.

Nếu dùng biến môi trường Next.js ở phía client, tên biến phải có tiền tố:

```text
NEXT_PUBLIC_
```

Ví dụ:

```text
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Không đưa secret vào biến `NEXT_PUBLIC_`.

---

## 10. Quy tắc auth/token

Khi sửa đăng nhập, đăng ký, phân quyền:

- Không lưu thông tin nhạy cảm không cần thiết ở frontend.
- Không log token ra console.
- Kiểm tra nơi lưu token: cookie, localStorage, sessionStorage hoặc state.
- Kiểm tra redirect sau đăng nhập.
- Kiểm tra bảo vệ route admin/seller/checkout nếu có.
- Không chỉ bảo vệ route bằng ẩn UI; backend vẫn phải kiểm tra quyền.

Nếu lỗi auth:

- Kiểm tra API login/register.
- Kiểm tra CORS backend.
- Kiểm tra token gửi trong header/cookie.
- Kiểm tra middleware/guard ở frontend nếu có.
- Kiểm tra role user/admin/seller.

---

## 11. Quy tắc UI và CSS

Khi sửa giao diện:

- Giữ phong cách nhất quán.
- Không đổi layout lớn nếu yêu cầu chỉ là sửa lỗi nhỏ.
- Không phá responsive.
- Không thêm thư viện UI mới nếu chưa cần.
- Không sửa `globals.css` nếu chỉ cần sửa một component.
- Nếu có Tailwind hoặc CSS module, làm theo cách dự án đang dùng.

Khi hiển thị giá tiền:

- Không hard-code nếu backend/data đã có.
- Format tiền rõ ràng.
- Không bịa khuyến mãi.

---

## 12. Quy tắc dữ liệu sản phẩm

Khi sửa sản phẩm:

- Kiểm tra dữ liệu lấy từ `app/data/`, `lib/` hay backend API.
- Không tạo sản phẩm giả nếu không được yêu cầu.
- Không bịa giá, tồn kho, mô tả, khuyến mãi.
- Trang danh sách sản phẩm và chi tiết sản phẩm phải dùng cùng nguồn dữ liệu nếu có thể.
- Nếu sản phẩm không tồn tại, phải xử lý trạng thái not found hoặc thông báo phù hợp.

---

## 13. Quy tắc kiểm tra frontend

Sau khi sửa frontend, nếu phù hợp, hãy chạy hoặc đề xuất:

```bash
npm run dev
npm run build
npm run lint
```

Nếu dùng pnpm:

```bash
pnpm dev
pnpm build
pnpm lint
```

Nếu dùng yarn:

```bash
yarn dev
yarn build
yarn lint
```

Khi báo lại, phải nêu:

- Route/trang cần kiểm tra.
- Thao tác kiểm tra.
- Kết quả mong đợi.
- API liên quan nếu có.

Ví dụ:

```text
Kiểm tra /login:
1. Nhập email/password đúng.
2. Bấm đăng nhập.
3. Kết quả mong đợi: chuyển về trang chủ hoặc dashboard.
```

---

## 14. Những việc không được tự ý làm

Không tự ý:

- Đổi cấu trúc App Router.
- Đổi tên route group `(auth)`, `(checkout)` nếu chưa được yêu cầu.
- Đổi toàn bộ layout.
- Xóa `app/layout.tsx`.
- Xóa hoặc phá `app/globals.css`.
- Xóa component đang được dùng.
- Đổi toàn bộ cách gọi API.
- Đổi cơ chế auth/token nếu chưa kiểm tra backend.
- Hard-code API URL, token, secret.
- Thêm thư viện mới nếu chưa kiểm tra thư viện hiện có.
- Sửa backend/chatbot nếu chưa xác định cần thiết.

---

## 15. Cập nhật CONTEXT.md

Sau khi sửa frontend, phải cập nhật:

1. `sope-frontend/CONTEXT.md`
2. `../CONTEXT.md` nếu thay đổi quan trọng ảnh hưởng toàn dự án.

Nội dung cập nhật gồm:

- Người dùng yêu cầu gì.
- Route/khu vực liên quan.
- File đã sửa.
- Component/hook/lib liên quan.
- API liên quan nếu có.
- Cách kiểm tra trên trình duyệt.
- Lỗi gặp phải nếu có.
- Cách tránh lặp lỗi.
- Việc cần làm tiếp theo.

Không chép code dài vào `CONTEXT.md`.
Chỉ ghi tóm tắt ngắn gọn, đủ để lần sau Codex hiểu và làm tiếp.

---

## 16. Cách trả lời người dùng sau khi hoàn thành

Sau khi làm xong, trả lời bằng tiếng Việt theo mẫu:

### Đã hoàn thành

- Đã làm:
- File đã sửa:
- Route/trang liên quan:
- Cách kiểm tra:
- Đã cập nhật `CONTEXT.md`:

### Lưu ý

- Nêu ngắn gọn lỗi hoặc rủi ro nếu có.
- Nêu việc nên làm tiếp theo nếu cần.

Không trả lời quá dài nếu nhiệm vụ nhỏ.
