# Dựng lại toàn bộ UI bằng React 19, Tailwind v4 và Vite

UI cũ là TypeScript thao tác DOM trực tiếp cùng ~3.000 dòng CSS chia nhiều file và nhiều theme, khó dùng chung giữa tab, side panel và popup. Ta chuyển sang React 19 (có Radix cho các thành phần tương tác truy cập được), Tailwind v4 với design tokens dạng CSS variables, giữ Vite và Chart.js (bọc thành component). Svelte 5 và Preact đã được cân nhắc; React thắng nhờ hệ sinh thái primitives và tooling.

Chỉ lớp giao diện bị thay. Logic miền (`data`, `stats`, `insights`, `predictions`, `budget`, `export`, `incremental-fetch`, `order-status`), `content`, `bridge`, `background`, i18n và test hiện có được giữ nguyên, và không thêm request nào tới Shopee (xem `docs/shopee-order-api.md`).
