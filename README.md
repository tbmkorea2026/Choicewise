# WiseChoiceKR — Website review sản phẩm cho Affiliate

Website tĩnh (static site) được sinh ra bằng **Node.js**: tốc độ cực nhanh, chuẩn SEO, chạy trên **mọi gói Hostinger** (kể cả gói Premium/Single không hỗ trợ Node.js), tự động deploy mỗi khi bạn `git push`.

```
content/ (Markdown)  ──►  npm run build  ──►  dist/ (HTML thuần)  ──►  Hostinger public_html
```

---

## 1. Tính năng chính

| Nhóm | Chi tiết |
|---|---|
| **Loại trang** | Review sản phẩm đơn · Top 5 / Best-of so sánh · Danh mục · Tác giả · Trang tĩnh (About, Disclosure, Privacy…) · Tìm kiếm · 404 |
| **Affiliate** | Link rút gọn `/go/<id>/` (redirect 302 qua `.htaccess`), tự gắn `rel="sponsored nofollow"`, nút CTA nổi bật, thanh CTA dính đáy trên mobile, hộp CTA chèn giữa bài, bảng so sánh có nút giá, theo dõi click qua GA4 (`affiliate_click`) |
| **SEO** | Title/description/canonical, Open Graph, JSON-LD (Product + Review, ItemList, FAQPage, BreadcrumbList, Organization, WebSite + SearchAction), `sitemap.xml`, `robots.txt`, RSS `feed.xml`, `{{year}}` tự cập nhật năm trong tiêu đề |
| **Tin cậy (E-E-A-T)** | Trang tác giả, hộp tác giả, phương pháp đánh giá, disclosure ở đầu mỗi bài, ngày cập nhật |
| **UX** | Thiết kế editorial cao cấp, dark mode, responsive, mục lục tự động, tìm kiếm tức thì (phím `/`), bộ lọc review, accessibility (WCAG AA) |
| **Hiệu năng** | Không framework phía client, JS < 10 KB, CSS 1 file, cache-busting tự động, gzip + cache headers |

---

## 2. Chạy trên máy tính

Cần **Node.js 18+** ([nodejs.org](https://nodejs.org)).

```bash
npm install
npm run dev
```

Mở **http://localhost:3000**. Mỗi khi sửa file trong `content/` hoặc `src/`, trình duyệt tự tải lại.

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy local + live reload (hiện cả bài `draft: true`) |
| `npm run build` | Build bản production vào `dist/` (ẩn bài draft) |
| `npm run preview` | Xem bản production ở local |
| `npm run new review "Tên sản phẩm" -- --category tech` | Tạo nhanh bài review mới |
| `npm run new best "Best Air Purifiers" -- --category home-kitchen` | Tạo nhanh bài Top 5 mới |

---

## 3. Viết bài

### Cấu trúc thư mục

```
content/
  reviews/   ← bài review sản phẩm đơn   → /reviews/<tên-file>/
  best/      ← bài Top 5 / Best-of       → /best/<tên-file>/
  pages/     ← About, Privacy, Contact…  → /<tên-file>/
src/data/
  site.json        ← tên site, domain, email, GA4, newsletter, FAQ trang chủ
  categories.json  ← danh mục (slug, tên, icon, màu)
  authors.json     ← tác giả
src/assets/img/    ← logo, ảnh sản phẩm (tạo thư mục products/)
```

### Bài review (`content/reviews/*.md`)

```yaml
---
title: "Tên SP Review: Nhận định một dòng"
description: "Mô tả 150–160 ký tự cho Google."
category: tech                 # slug trong categories.json
author: alex-morgan            # slug trong authors.json
date: 2026-10-01
updated: 2026-10-05
featured: true                 # ưu tiên hiển thị trang chủ
draft: false                   # true = chỉ hiện khi npm run dev
rating: 9.1                    # điểm /10
product:
  name: "Tên sản phẩm"
  brand: "Thương hiệu"
  image: "/assets/img/products/ten-sp.webp"   # tỉ lệ 4:3, để trống = ảnh minh hoạ tự động
  price: "$179"
  merchant: "Amazon"           # nút sẽ ghi "Check Price on Amazon"
  ctaLabel: "Get 70% Off"      # (tuỳ chọn) ghi đè chữ trên nút
  link: "https://link-affiliate-cua-ban"
  linkId: ten-sp               # (tuỳ chọn) → /go/ten-sp/
bestFor: [Commuters, Travel]
scores: { Sound Quality: 9.2, Battery Life: 8.8, Value: 9.1 }
verdict: "Kết luận 2–3 câu."
pros: ["Ưu điểm 1", "Ưu điểm 2"]
cons: ["Nhược điểm 1"]
specs: { Battery: "8 hours", Weight: "5 g" }
faqs:
  - q: "Câu hỏi?"
    a: "Trả lời."
---

Nội dung bài viết bằng Markdown. Dùng ## cho tiêu đề mục (tự vào mục lục).

{{cta}}   ← chèn hộp "Check Price" ngay giữa bài
```

### Bài Top 5 (`content/best/*.md`)

Giống bài review, nhưng thay `product` bằng danh sách `products` (xếp theo thứ tự hạng 1 → 5). Mỗi sản phẩm có: `name, badge, rating, price, merchant, link, image, bestFor, summary, pros, cons, specs, review` (slug bài review riêng, nếu có). Dùng `{{product 1}}` để chèn hộp CTA của sản phẩm hạng 1 vào nội dung. Viết `{{year}}` trong tiêu đề để năm tự cập nhật mỗi lần build.

> Nếu một sản phẩm trong Top 5 trùng tên với một bài review, nút **"Read full review"** sẽ tự xuất hiện.

### Link affiliate trong nội dung

```markdown
[Xem giá trên Amazon](go:nuvio-pods-pro-2)
```

→ thành `/go/nuvio-pods-pro-2/` với `rel="sponsored nofollow"`. Đổi link affiliate ở **một chỗ** (front matter), mọi nút trên toàn site tự cập nhật.

### Ảnh sản phẩm

Đặt ảnh vào `src/assets/img/products/` (khuyến nghị **WebP, 800×600, < 120 KB**) rồi khai báo `image: "/assets/img/products/ten.webp"`. Chỉ dùng ảnh bạn có quyền sử dụng (ảnh tự chụp, ảnh press kit của hãng, hoặc ảnh do chương trình affiliate cung cấp).

---

## 4. Đưa lên GitHub

```bash
git remote add origin https://github.com/<ten-ban>/choicewise.git
git branch -M main
git push -u origin main
```

---

## 5. Deploy tự động lên Hostinger (GitHub Actions + FTP)

Mỗi lần `git push` lên nhánh `main`, GitHub sẽ tự build và upload thư mục `dist/` lên Hostinger.

**Bước 1: Lấy thông tin FTP trong Hostinger**
hPanel → **Websites → Manage → Files → FTP Accounts**. Ghi lại **FTP IP (hostname)**, **username**, **password** (bấm *Change FTP password* nếu chưa có).

**Bước 2: Khai báo trong GitHub**
Repo → **Settings → Secrets and variables → Actions**

| Loại | Tên | Giá trị |
|---|---|---|
| Secret | `FTP_SERVER` | FTP IP/hostname, ví dụ `153.92.xx.xx` |
| Secret | `FTP_USERNAME` | ví dụ `u123456789` hoặc `u123456789.tenmien-cua-ban.com` |
| Secret | `FTP_PASSWORD` | mật khẩu FTP |
| Variable | `SITE_URL` | `https://tenmien-cua-ban.com` (domain thật của bạn) |
| Variable | `FTP_SERVER_DIR` | *(tuỳ chọn)* mặc định `public_html/`. Nếu tài khoản FTP đã mở thẳng vào `public_html`, đặt `./` |

**Bước 3:** Push code, hoặc vào tab **Actions → Build & deploy to Hostinger → Run workflow**.

> Lần đầu: xoá file `default.php` mặc định trong `public_html` (File Manager) để trang chủ của bạn hiển thị.
> Bật **SSL** miễn phí trong hPanel (Security → SSL). `.htaccess` đã tự chuyển HTTP → HTTPS và www → không-www.

**Cách thủ công (không dùng GitHub Actions):** chạy `npm run build`, nén nội dung thư mục `dist/` thành zip, upload lên `public_html` bằng File Manager và giải nén. Lưu ý phải có cả file ẩn `.htaccess`.

---

## 6. Trước khi chạy thật (checklist)

- [ ] `src/data/site.json`: đổi `url` sang domain thật, `email`, mạng xã hội.
- [ ] **Xoá toàn bộ nội dung DEMO** trong `content/reviews` và `content/best` (sản phẩm hư cấu), thay bằng sản phẩm thật và link affiliate thật.
- [ ] `src/data/authors.json`: thay tác giả mẫu bằng người thật (Google đánh giá cao E-E-A-T).
- [ ] Rà lại **Privacy Policy, Terms, Affiliate Disclosure** cho phù hợp thị trường của bạn. Nếu tham gia Amazon Associates, giữ câu disclosure bắt buộc.
- [ ] GA4: điền Measurement ID vào `analytics.ga4` (ví dụ `G-XXXXXXX`). Khi dùng GA4 cho khách EU/UK, cần thêm banner xin đồng ý cookie.
- [ ] Newsletter: điền URL form của nhà cung cấp (Mailchimp, Brevo, ConvertKit…) vào `newsletter.action`. Khi để trống, khối newsletter tự ẩn trên bản production.
- [ ] Thay `src/assets/img/og-default.png` bằng ảnh chia sẻ 1200×630 có chữ thương hiệu (tuỳ chọn).
- [ ] Submit `https://domain-cua-ban/sitemap.xml` lên Google Search Console.

---

## 6b. Mã giảm giá (coupon)

Chỉ dùng **mã riêng affiliate** lấy trong dashboard của từng chương trình (mã công khai của shop có thể làm mất hoa hồng).

**Cách 1 — một mã cho cả dự án** (khuyến nghị): thêm vào `src/data/coupons.json`. Mã tự hiện ở mọi bài có link tới cửa hàng đó (khớp theo tên miền trong `store`):

```json
[
  {
    "store": "merino.tech",
    "code": "TRUNGTRAN10",
    "discount": "10% off",
    "terms": "Sitewide, excludes sale items",
    "expires": "2026-12-31",
    "verified": "2026-10-07"
  }
]
```

**Cách 2 — mã riêng cho một sản phẩm**: thêm vào `product:` (bài review) hoặc từng mục trong `products:` (bài Top/so sánh):

```yaml
coupon:
  code: "TRUNGTRAN10"
  discount: "10% off"
  expires: 2026-12-31
```

Dùng `coupon: false` để ẩn mã của dự án trên một sản phẩm cụ thể.

Mã hiện ở: hộp sản phẩm đầu bài review, hộp CTA giữa/cuối bài, sidebar, thanh mua hàng dưới đáy trên mobile, thẻ Top picks, từng sản phẩm trong bài Top 5 và bảng so sánh. Có nút **Copy** (theo dõi sự kiện `coupon_copy` trên GA4). Mã **tự ẩn khi quá hạn `expires`** — GitHub Actions build lại mỗi ngày nên web luôn cập nhật. `expires` và `verified` có thể bỏ trống.

---

## 7. Tuỳ biến giao diện

- **Màu sắc, font, bo góc:** sửa biến CSS ở đầu `src/assets/css/main.css` (`--brand`, `--cta`, …). Dark mode nằm ngay bên dưới.
- **Menu:** mảng `nav` trong `scripts/build.js`.
- **Danh mục mới:** thêm vào `src/data/categories.json`. `icon` là một trong: `cpu, house, heartPulse, sparkles, dumbbell, paw, cloud, plane, tag, award, trophy…` (xem `src/lib/icons.js`). `hue` là màu 0–360.
- **Template HTML:** `src/templates/` (`layout.js` = header/footer, `pages.js` = từng loại trang, `components.js` = thẻ, nút, bảng…).

---

## 8. Cấu trúc mã nguồn

```
scripts/
  build.js       ← trình sinh site (đọc content → ghi dist/)
  dev.js         ← server local + live reload
  new.js         ← tạo bài mới từ mẫu
  gen-images.js  ← (cũ, đã thay bằng brand/src) logo PNG / og-default.png
src/
  lib/           ← content loader, markdown, SEO (JSON-LD), icons, utils
  templates/     ← layout, pages, components
  assets/        ← css, js, img
public/          ← copy nguyên vào dist (.htaccess, favicon)
.github/workflows/deploy.yml  ← CI/CD lên Hostinger
```
