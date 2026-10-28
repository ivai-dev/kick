# Lộ trình

## Features

| Feature | After | Days (min–likely–max) | Confidence | Basis | Release | Kick |
| --- | --- | --- | --- | --- | --- | --- |
| foundation: nền tảng: đăng nhập, cơ sở dữ liệu, triển khai, một luồng chạy thật | | 4–6–10 | medium | đã làm FastAPI + PostgreSQL ở dự án trước | first | foundation |
| lending: mượn và trả sách chạy thật | foundation | 5–8–14 | low | quy tắc gia hạn chưa rõ | first | lending |
| overdue: nhắc quá hạn | lending | 2–3–6 | low | chưa chọn kênh nhắc | later | |
| reports: báo cáo tháng | lending | 3–5–9 | low | API báo cáo được đánh dấu tốn kém | later | |
