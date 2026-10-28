# API

<!-- Status: mock (dữ liệu mẫu, chưa có máy chủ thật) hoặc real. Cost: API tốn kém khi làm thật. -->

## Endpoints

| Endpoint | Used by | Roles | Status | Cost |
| --- | --- | --- | --- | --- |
| POST /auth/login | đăng nhập | thủ thư, học sinh | real | |
| GET /books?q=&page= | quầy, tìm sách | thủ thư | real | |
| GET /members/{code} | quầy: quét thẻ | thủ thư | mock | |
| POST /loans | xác nhận mượn | thủ thư | real | |
| GET /loans?member=&page= | sách đang mượn | thủ thư, học sinh (của mình) | real | |
| POST /loans/{id}/return | xác nhận trả | thủ thư | mock | |
| GET /loans/overdue | danh sách quá hạn | thủ thư | mock | |
| GET /reports/monthly?month= | báo cáo tháng | thủ thư | mock | tốn kém: tổng hợp mọi lượt mượn theo tháng |

## Details

- `POST /loans` nhận `{member_code, copy_code}`, trả lượt mượn với `due_date` (14 ngày). Lỗi: thẻ hết hạn, sách
  đang được mượn, học sinh đang giữ 3 cuốn.
- `GET /loans` phân trang 20 dòng; học sinh chỉ thấy lượt mượn của mình.
