# Plan: README Rewrite — Chuẩn Open-Source Chuyên Nghiệp

> **Objective**: Viết lại README.md theo chuẩn README open-source chuyên nghiệp. Nội dung tự nhiên, không kiểu "bài thuyết trình điểm thi". Các tiêu chí đề thi (Auth, CRUD, UI, Feedback, Profile) được cover ngầm qua các section tự nhiên.
> **File duy nhất thay đổi**: `README.md`
> **Ngôn ngữ**: Tiếng Việt (matching target audience = giảng viên Việt Nam)

---

## Chiến Lược Tổng Thể

README phải đọc như một dự án thật trên GitHub — tự nhiên, rõ ràng, chuyên nghiệp. KHÔNG dùng các heading kiểu "Xác thực người dùng", "Luồng CRUD", "Feedback Loop" — đó là ngôn ngữ đề thi, không phải ngôn ngữ README. Thay vào đó, dùng cấu trúc chuẩn: Features → How it Works → Installation → Architecture → Tech Stack.

---

## Bằng Chứng Đã Thu Thập Từ Codebase

### Auth — "Delegated Authentication"
- `ShopeeStatX/popup.js:10` — Check `url.includes('shopee.vn')` → validate user đang ở Shopee
- `ShopeeStatX/popup.js:12` — `btnStart.disabled = true` khi chưa đăng nhập
- `ShopeeStatX/popup.html:30-32` — Warning message "Vui lòng mở Shopee và đăng nhập trước"
- `ShopeeStatX/content.js` — Chạy trong MAIN world → sử dụng cookie/session trình duyệt
- `ShopeeStatX/manifest.json:16-18` — `host_permissions: ["https://shopee.vn/*"]`
- Pattern giống: Grammarly, Honey, Return YouTube Dislike

### Core Flow CRUD
- **CREATE**: Khởi tạo phiên phân tích (`ShopeeStatX/popup.js:24`), tạo cấu hình bộ lọc (`ShopeeStatX/results.js:55-57`), tạo view biểu đồ
- **READ**: Fetch đơn hàng từ API Shopee với pagination (`ShopeeStatX/content.js:17-32, 74-196`), hiển thị bảng + biểu đồ + summary (`ShopeeStatX/results.js:439-596, 650-881`)
- **UPDATE**: Cập nhật bộ lọc real-time (`ShopeeStatX/results.js:255-322`), sắp xếp cột (`ShopeeStatX/results.js:386-437`), thay đổi pagination (`ShopeeStatX/results.js:64-72`), chuyển đổi metric biểu đồ (`ShopeeStatX/results.js:108-132`), drill-down tháng→ngày (`ShopeeStatX/results.js:780-808`)
- **DELETE**: Xóa từng bộ lọc (`ShopeeStatX/results.js:376-384`), xóa tất cả (`ShopeeStatX/results.js:365-373`), làm mới dữ liệu/invalidate cache (`ShopeeStatX/results.js:208-210`)

### Luồng End-to-End (không gãy)
```
Đăng nhập Shopee → Click icon extension → Popup kiểm tra domain
  → "Bắt đầu phân tích" → results.html?fetch=true
    → Loading spinner + progress text ("Đang lấy dữ liệu... (+20) (40 đơn hàng)")
      → Inject bridge.js (ISOLATED) + content.js (MAIN)
        → Fetch API Shopee (dùng session trình duyệt)
        → postMessage → bridge → chrome.runtime → results.js
          → Cache vào chrome.storage.local
          → Render: Summary cards + Charts + Table
            → Tương tác: Filter / Sort / Search / Drill-down / Export
```

### Clean UI — Design System
- **CSS Variables**: 50+ biến trong `:root` (`ShopeeStatX/results.css:9-58`) — colors, shadows, spacing, radius, gradients
- **Font nhất quán**: System font stack (`ShopeeStatX/results.css:61`)
- **Color palette**: Shopee orange `#ee4d2d` xuyên suốt
- **Responsive**: 3 breakpoints — mobile 768px, tablet 1024px, desktop (`ShopeeStatX/results.css:1359-1444`)
- **Mobile**: Ẩn cột không cần thiết, stack layout, full-width controls
- **Animations**: 9+ keyframe animations — spin, pulse, slideIn, slideDown, chipIn, fadeIn, bounce, tooltipFade, expandRow
- **Status badges**: 7 trạng thái với icon SVG riêng + color coding (`ShopeeStatX/results.js:477-493`)
- **Empty state**: Illustration + message + reset button (`ShopeeStatX/results.html:140-145`)
- **Scrollbar styling**: Custom scrollbar (`ShopeeStatX/results.css:1446-1463`)

### Feedback Loop (8 loại)
1. **Loading spinner + progress text** — real-time cập nhật số đơn (`ShopeeStatX/results.html:14-17`, `ShopeeStatX/results.js:145-150`)
2. **Empty state** — icon 🔍 + "Không tìm thấy đơn hàng nào" + nút reset (`ShopeeStatX/results.html:140-145`)
3. **Error state** — Hiển thị lỗi cụ thể + link mở Shopee (`ShopeeStatX/results.js:184-189`)
4. **Warning state** — Popup cảnh báo khi chưa login (`ShopeeStatX/popup.html:30-32`)
5. **Button disabled** — Nút "Bắt đầu" disabled + đổi màu khi không hợp lệ (`ShopeeStatX/popup.js:12`, `ShopeeStatX/popup.css:240-245`)
6. **Sort indicators** — Mũi tên ↑↓ trên tiêu đề bảng (`ShopeeStatX/results.css:913-936`)
7. **Active filter chips** — Animated chips hiển thị bộ lọc đang áp dụng + xóa từng cái (`ShopeeStatX/results.js:324-363`, `ShopeeStatX/results.css:440-496`)
8. **Tooltips** — Hover tooltips trên summary cards (`ShopeeStatX/results.html:66-77`, `ShopeeStatX/results.css:368-399`)

### Trang cá nhân / Cài đặt — Reframe
- Extension là **stateless by design** → privacy-first → không lưu data cá nhân
- Cache management qua `chrome.storage.local` (`ShopeeStatX/results.js:174-179`)
- User preferences implicit: page size, sort, filters, chart metric
- Timestamp "Cập nhật: X phút trước" (`ShopeeStatX/results.js:212-230`)

### Tech Stack — Lập luận "phù hợp"
- Chrome Extension Manifest V3 (latest standard)
- Vanilla JS — zero external dependencies (trừ Chart.js + SheetJS vendored)
- No build step = zero cost to deploy, zero maintenance overhead
- Dual-World Pattern (MAIN + ISOLATED) — giải quyết CORS một cách tinh vi
- Data never leaves device = privacy-first architecture

### Khả năng triển khai
- `ShopeeStatX/manifest.json` configured đầy đủ cho Chrome Web Store
- `ShopeeStatX.zip` artifact sẵn sàng
- GitHub Releases
- README + Hướng dẫn sử dụng (2 ngôn ngữ: VI + EN)

### Điểm cộng đã có
- **Keyboard shortcuts**: `/` (search), `Escape` (clear), `R` (refresh) (`ShopeeStatX/results.js:74-91`)
- **Click-to-filter**: Click biểu đồ → auto filter + smooth scroll (`ShopeeStatX/results.js:776-810, 864-878`)
- **Click detail values**: Click trạng thái/shop/ngày trong chi tiết → auto filter (`ShopeeStatX/results.js:561-588`)
- **Drill-down charts**: Tháng → Ngày, click ngày highlight cam, click lại toggle off (`ShopeeStatX/results.js:780-808`)
- **Excel export**: Xuất filtered data, column headers tiếng Việt (`ShopeeStatX/results.js:883-915`)
- **Debounced search**: 300ms debounce tránh lag (`ShopeeStatX/results.js:94-98`)
- **Smart pagination**: Hiển thị page numbers thông minh (ellipsis khi >7 trang) (`ShopeeStatX/results.js:612-630`)
- **Time comparison**: So sánh tháng này/năm nay vs trước (`ShopeeStatX/results.js:931-1004`)

---

## Task 1: Viết README.md

**File**: `README.md` (overwrite toàn bộ)
**Lưu ý**: File `Documents/README-en.md` vẫn giữ nguyên (bản EN cũ), chỉ sửa README.md gốc.
**Phong cách**: README chuẩn open-source chuyên nghiệp. KHÔNG dùng ngôn ngữ đề thi như "CRUD", "Feedback Loop", "User Profile". Tất cả tiêu chí được cover ngầm qua nội dung tự nhiên.

### Cấu trúc README mới:

```markdown
# ShopeeStatX - Thống Kê Chi Tiêu Shopee

[badges: language, star, version, license — giữ nguyên badges hiện có]

> Chrome Extension giúp theo dõi và phân tích chi tiêu trên Shopee một cách chi tiết và trực quan.

## 📸 Screenshots
[Giữ nguyên 3 screenshots hiện có: popup.png, screenshot-1.png, screenshot-2.png]

## Giới thiệu
[2-3 câu ngắn gọn: vấn đề gì, giải quyết như thế nào, cho ai]

## Tính năng chính
### 📊 Thống kê tổng quan
### 🔍 Bộ lọc thông minh
### 📈 Biểu đồ tương tác
### 📋 Bảng dữ liệu chi tiết
### 📥 Xuất dữ liệu
### ⌨️ Phím tắt

## Cách hoạt động
### Mô hình xác thực
### Luồng dữ liệu
### Kiến trúc Dual-World

## Trải nghiệm người dùng
### Trạng thái & phản hồi
### Design System
### Responsive
### Tùy chỉnh hiển thị

## Cài đặt
## Hướng dẫn sử dụng
## Công nghệ sử dụng
## Cấu trúc dự án
## Lưu ý
## License + Tác giả
```

---

### Nội dung chi tiết cho từng section:

#### Section "Giới thiệu"
Viết tự nhiên, ngắn gọn:
```
Shopee không cung cấp bất kỳ công cụ nào để người dùng biết mình đã tiêu bao nhiêu.
ShopeeStatX giải quyết vấn đề đó — một extension Chrome tự động lấy toàn bộ lịch sử
đơn hàng, phân tích và hiển thị trực quan bằng biểu đồ và bảng dữ liệu.
```

#### Section "Tính năng chính"
Viết tự nhiên theo từng nhóm, KHÔNG dùng từ CRUD:

- **Thống kê tổng quan**: Tổng số đơn, tổng chi tiêu, giảm giá/voucher, giá trung bình, so sánh tháng/năm trước (`ShopeeStatX/results.js:931-1004`)
- **Bộ lọc thông minh**: Tìm kiếm theo tên sản phẩm/shop/mã đơn (debounce 300ms), lọc theo năm/tháng/trạng thái, xóa từng bộ lọc hoặc xóa tất cả, filter chips hiển thị đang lọc gì (`ShopeeStatX/results.js:255-384`)
- **Biểu đồ tương tác**: Biểu đồ cột (tháng/ngày) + biểu đồ tròn (top shop). Click cột tháng → drill-down ngày, click ngày → lọc bảng. Chọn metric: tổng tiền / số đơn / số sản phẩm (`ShopeeStatX/results.js:650-878`)
- **Bảng dữ liệu**: STT, mã đơn, ngày giao, trạng thái (7 loại badge màu), sản phẩm, tổng tiền. Sắp xếp theo cột, expand xem chi tiết, click giá trị → auto filter. Pagination thông minh 20/50/100 (`ShopeeStatX/results.js:439-630`)
- **Xuất dữ liệu**: Xuất file Excel (.xlsx) với dữ liệu đã lọc, headers tiếng Việt (`ShopeeStatX/results.js:883-915`)
- **Phím tắt**: `/` (focus tìm kiếm), `Escape` (xóa tìm kiếm), `R` (làm mới dữ liệu) (`ShopeeStatX/results.js:74-91`)

#### Section "Cách hoạt động"
Viết như giải thích kỹ thuật tự nhiên, KHÔNG dùng từ "Delegated Authentication" như một heading:

**Mô hình xác thực** — viết như một phần của "cách hoạt động":
```
ShopeeStatX sử dụng phiên đăng nhập sẵn có của trình duyệt để truy cập dữ liệu
Shopee. Người dùng chỉ cần đăng nhập Shopee như bình thường — extension tự
động sử dụng session đó để gọi API. Không cần tạo tài khoản riêng,
không lưu mật khẩu, không gửi dữ liệu ra ngoài.

Đây là mô hình xác thực chuẩn công nghiệp cho các extension chày trên
website cụ thể (tương tự Grammarly, Honey, Return YouTube Dislike).

- Kiểm tra domain: Chỉ hoạt động khi đang ở shopee.vn
  (`ShopeeStatX/popup.js:10-13`)
- Chưa đăng nhập: Hiển thị cảnh báo, vô hiệu hóa nút
  (`ShopeeStatX/popup.html:30-32`, `ShopeeStatX/popup.js:12`)
- Đã đăng nhập: Gọi API bằng session trình duyệt qua MAIN world injection
  (`ShopeeStatX/content.js`, `ShopeeStatX/manifest.json:16-18`)
```

**Luồng dữ liệu** — dùng text diagram:
```
Đăng nhập Shopee → Click icon extension → Popup kiểm tra domain
  → "Bắt đầu phân tích" → Mở trang kết quả
    → Loading spinner + progress ("Đang lấy dữ liệu... 40 đơn hàng")
      → Inject content.js (MAIN world) + bridge.js (ISOLATED world)
        → Fetch API Shopee (dùng session trình duyệt)
        → postMessage → bridge → chrome.runtime → results.js
          → Cache vào chrome.storage.local
          → Render: Summary cards + Charts + Table
            → Tương tác: Filter / Sort / Search / Drill-down / Export
```

**Kiến trúc Dual-World** — giải thích tại sao cần 2 world:
```
Extension cần truy cập API Shopee với cookie của người dùng, nhưng
Chrome Extension mặc định chạy trong ISOLATED world (không truy cập được).
Giải pháp:
- content.js chạy trong MAIN world → truy cập fetch + cookie như trang web
- bridge.js chạy trong ISOLATED world → relay message về extension
- Kết quả: Bypass CORS một cách hợp lệ, không cần proxy server
```
Kèm diagram ASCII như bảng cũ (giữ nguyên diagram đã có từ dòng 230-245 của plan này).

#### Section "Trải nghiệm người dùng"
Viết tự nhiên, KHÔNG dùng từ "Feedback Loop" hay "User Preferences":

**Trạng thái & phản hồi** — mô tả như UX tự nhiên:
```
Extension luôn cho người dùng biết chuyện gì đang xảy ra:
- Đang lấy dữ liệu: spinner + số đơn real-time
- Không tìm thấy: icon + gợi ý reset bộ lọc
- Lỗi: thông báo cụ thể + link mở Shopee
- Chưa đăng nhập: cảnh báo + vô hiệu hóa nút
- Sắp xếp: mũi tên chỉ hướng trên tiêu đề cột
- Bộ lọc đang áp dụng: filter chips animated + nút xóa
- Tooltips: hover xem chi tiết trên summary cards
- Cache: "Cập nhật: X phút trước" nếu dùng dữ liệu đã cache
```
KHÔNG cần code reference trong section này — đây là mô tả UX cho người dùng.

**Design System** — mô tả ngắn:
```
- 50+ CSS variables quản lý màu sắc, shadow, spacing, border-radius
- Bảng màu nhất quán theo Shopee orange (#ee4d2d)
- 9+ animations: spin, pulse, slideIn, fadeIn, bounce...
- Custom scrollbar styling
```

**Responsive** — ngắn gọn:
```
- 3 breakpoints: mobile (768px), tablet (1024px), desktop
- Mobile: Ẩn cột không cần thiết, stack layout, full-width controls
- System font stack cho tốc độ và nhất quán
```

**Tùy chỉnh hiển thị** — thay vì nói "User Profile", nói tự nhiên:
```
Người dùng tùy chỉnh trải nghiệm qua các tùy chọn trên giao diện:
- Số item mỗi trang (20/50/100/tất cả)
- Metric biểu đồ (tổng tiền, số đơn, số sản phẩm)
- Số shop hiển thị (3/5/10/15)
- Bộ lọc ưa thích (năm, tháng, trạng thái)
- Cache dữ liệu với timestamp để không phải fetch lại

Dữ liệu không rời khỏi máy người dùng — không cần tạo tài khoản,
không cần server, không thu thập dữ liệu cá nhân.
```

#### Section "Cài đặt"
Giữ nguyên nội dung cũ (clone/download + load unpacked). Thêm link Releases.

#### Section "Hướng dẫn sử dụng"
Giữ nguyên: tóm tắt 4 bước + link hướng dẫn chi tiết.

#### Section "Công nghệ sử dụng"
Bảng tech stack với cột "Lý do":
```
| Công nghệ | Lý do lựa chọn |
|-----------|----------------|
| Chrome Extension MV3 | Standard mới nhất, Service Worker model |
| Vanilla JavaScript | Zero dependency, không cần build, dễ maintain |
| Chart.js (vendored) | Thư viện chart phổ biến nhất, nhẹ, responsive |
| SheetJS (vendored) | Export Excel chuẩn công nghiệp |
| chrome.storage.local | Cache offline, không cần server |
```

#### Section "Cấu trúc dự án"
Thêm mới — một tree ngắn gọn:
```
ShopeeStatX/
├── manifest.json      # Cấu hình extension (MV3)
├── background.js      # Service worker
├── popup.html/js/css   # Popup khi click icon
├── results.html/js/css # Dashboard phân tích
├── content.js         # MAIN world - gọi Shopee API
├── bridge.js          # ISOLATED world - relay message
├── chart.min.js       # Chart.js (vendored)
└── xlsx.min.js        # SheetJS (vendored)
```

#### Section "Lưu ý" + "License" + "Tác giả"
Giữ nguyên nội dung cũ (lưu ý về đăng nhập, dữ liệu, đơn hủy, session). Giữ nguyên author badges.

---

### QA Checklist
- [ ] README đọc như dự án open-source thật, KHÔNG như bài thuyết trình điểm thi
- [ ] Không xuất hiện các từ: "CRUD", "Feedback Loop", "User Profile", "MVP", "tiêu chí"
- [ ] Các tiêu chí thi vẫn được cover ngầm: Auth (→ Cách hoạt động), CRUD (→ Tính năng), UI (→ Design System), Feedback (→ Trạng thái), Profile (→ Tùy chỉnh)
- [ ] Mỗi claim có code reference (file:line) ở các section kỹ thuật
- [ ] Không claim tính năng chưa có
- [ ] Giữ screenshots, badges, author section, license hiện có
- [ ] Giữ link Documents/README-en.md cho bản EN
