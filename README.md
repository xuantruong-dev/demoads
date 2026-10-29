# Lăng Kính — Dashboard thấu hiểu khách hàng

Website tĩnh sẵn sàng đưa lên GitHub Pages. Toàn bộ chiến dịch được hợp nhất trong một dashboard; giữ biểu đồ nhân khẩu học, hành vi, nội dung thấu hiểu, bộ lọc, xuất CSV, chế độ in, biểu đồ 2D/3D và chuyển động GSAP.

## Đưa lên GitHub Pages

1. Giải nén gói tải về. Tạo một repository GitHub, ví dụ `lang-kinh-dashboard`.
2. Tải **toàn bộ nội dung bên trong gói** vào nhánh `main`: `index.html`, thư mục `assets`, `scripts` và các tệp đi kèm. `index.html` phải nằm ngay ở gốc repository, không nằm trong một thư mục lồng thêm. Không tải riêng tệp ZIP.
3. Mở **Settings → Pages → Build and deployment**. Chọn **Deploy from a branch**, nhánh **main**, thư mục **/ (root)**, rồi **Save**.
4. Khi GitHub hoàn tất triển khai, mở địa chỉ website hiển thị trong trang Pages. Với repository ví dụ, địa chỉ thường có dạng `https://TEN-TAI-KHOAN.github.io/lang-kinh-dashboard/`.

Các bước theo [tài liệu cấu hình GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) và [quy tắc tệp khởi đầu](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site). Nếu dùng GitHub Free, chọn repository public để dùng Pages. Gói này đã có `.nojekyll`; nếu công cụ tải tệp bỏ qua tệp ẩn, tạo một tệp `.nojekyll` trống ở gốc repository.

Không cần backend, API key, npm install hay bước build trên GitHub. Mọi tài nguyên đều dùng đường dẫn tương đối, hỗ trợ cả website ở gốc tên miền lẫn đường dẫn `/ten-repository/`.

## Những phần đã được giữ

- Tất cả chiến dịch hợp nhất; không tách thành dashboard riêng.
- 47 trường dữ liệu nguồn có dữ liệu cùng các chỉ số bổ sung; không hiển thị chỉ số tiền tệ.
- Biểu đồ tuổi, giới tính, xu hướng, tương tác, video và hội thoại; số 0 thực được giữ, ô thiếu không biến thành 0.
- Ba góc nhìn thấu hiểu: Chú ý, Tìm hiểu, Kết nối; phân biệt quan sát, giả thuyết và câu hỏi phỏng vấn.
- Bộ lọc ngày/tuổi, tìm kiếm chỉ số, xuất CSV và in báo cáo.
- Hiệu ứng xuất hiện khi cuộn, vẽ đường, điểm/vùng biểu đồ và thanh tiến độ cuộn bằng GSAP 3.14.2; hỗ trợ tắt hiệu ứng và cài đặt giảm chuyển động.

GSAP được lưu trực tiếp trong `assets/vendor/gsap.min.js`, nên trang không cần tải thư viện từ CDN. Giữ nguyên chú thích bản quyền của thư viện.

## Cấu trúc

```text
index.html
.nojekyll
assets/
  favicon.svg
  css/dashboard.css
  js/data.js
  js/model.js
  js/dashboard.js
  vendor/gsap.min.js
scripts/verify.cjs
README.md
THIRD_PARTY_NOTICES.md
```

`data.js` chứa dữ liệu đã chuẩn bị cho dashboard; không cần tải hai workbook Excel gốc lên repository. `model.js` xử lý phép tính; `dashboard.js` vẽ biểu đồ và xử lý tương tác. Các script là script trình duyệt thông thường, dùng `defer` theo đúng thứ tự data → model → GSAP → dashboard. Giữ thứ tự này khi sửa trang.

## Kiểm tra và cập nhật

Có thể mở `index.html` để xem nhanh. Để kiểm tra qua HTTP, mở terminal tại thư mục gói và chạy:

```sh
python -m http.server 8000
```

Sau đó mở `http://localhost:8000/`. Nếu đã có Node.js, chạy kiểm tra cấu trúc và dữ liệu:

```sh
node scripts/verify.cjs .
```

Sau mỗi lần chỉnh, tải các tệp thay đổi lên cùng repository. Nếu trình duyệt đang giữ bản cũ, tải lại trang bằng Ctrl + F5. Nếu thiếu màu/hiệu ứng, kiểm tra thư mục `assets` đã được tải đầy đủ và tên tệp đúng chữ hoa/chữ thường.

Gói này không có khóa truy cập hay đường dẫn tới máy cá nhân. Dữ liệu hiển thị được đóng gói trong website tĩnh và sẽ có thể đọc được khi website công khai.
