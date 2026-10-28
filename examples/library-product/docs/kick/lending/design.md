# Mượn và trả sách — design

## Dữ liệu và API

- Thêm bảng `members` và `loans` (xem docs/kick/project/data.md).
- Làm thật `POST /loans`, `GET /loans`, `POST /loans/{id}/return`, `GET /members/{code}`; mỗi API có test hợp
  đồng: API thật trả đúng như dữ liệu mẫu mà màn hình đang dùng.
