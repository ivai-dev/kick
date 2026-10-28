# Mượn và trả sách — tasks

## Tasks

| Task | Done when | After | Days (min–likely–max) | Confidence | Basis | Status |
| --- | --- | --- | --- | --- | --- | --- |
| members: bảng members, nhập danh sách học sinh từ file Excel của trường | 600 học sinh có trong hệ thống | | 1–2–3 | medium | | done |
| lend-api: POST /loans và GET /loans thật, test hợp đồng | màn cho mượn không đổi, chạy thật | members | 2–3–5 | medium | | done |
| return-api: POST /loans/{id}/return thật | màn nhận trả chạy thật | lend-api | 1–2–3 | medium | | doing |
| member-api: GET /members/{code} thật | quét thẻ hiện đúng học sinh | members | 1–1–2 | high | | todo |
| renew: gia hạn | gia hạn một lần, thêm 7 ngày | return-api | 1–2–4 | low | quy tắc gia hạn còn chưa rõ | todo |

## Finished when

- Mượn, trả, gia hạn chạy thật; bốn API chuyển sang "real".
