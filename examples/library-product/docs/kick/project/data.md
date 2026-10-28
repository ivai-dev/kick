# Dữ liệu

## Các đối tượng chính và quan hệ

- **Sách** có nhiều **bản sách** (mỗi bản một mã vạch).
- **Học sinh** có nhiều **lượt mượn**; mỗi lượt mượn gắn với một bản sách.
- **Tài khoản** dùng để đăng nhập: thủ thư hoặc học sinh.

## Bảng

| Bảng | Làm bởi | Cột chính |
| --- | --- | --- |
| users | nền tảng | id, role, member_id, password_hash |
| books | nền tảng | id, title, author |
| copies | nền tảng | id, book_id, barcode |
| members | mượn trả | id, code, name, class, card_expires |
| loans | mượn trả | id, member_id, copy_id, lent_at, due_date, returned_at |
