# Dashboard Ban Đoàn vụ (VKU) — ghi chú cho Claude

Người dùng: Trâm, trả lời bằng tiếng Việt. Đây là dashboard phân công + theo dõi nhiệm vụ của Ban Đoàn vụ,
4 nhóm: Truyền thông - Thông tin (`4t`), Nghiệp vụ (`nghiep-vu`), CSDL - CSVC (`csdl-csvc`), Nội vụ (`noi-vu`).

## Kiến trúc

- **Giao diện**: GitHub Pages, repo này, https://bandoanvu-vku.github.io/ (push lên `main` là lên trang sau ~1 phút).
  Trang tĩnh, không build. Mọi dữ liệu lấy qua `BDV.goi(action, req)` trong `dangnhap.js`.
- **Máy chủ**: một dự án Apps Script (tài khoản vanborapper@gmail.com), web app "Execute as me", access "Anyone".
  - Mã nguồn: `apps-script/*.gs` (thứ tự file 1-…4- chỉ để dễ đọc; khi dán vào trình sửa thì gộp bằng
    `scripts/build-apps-script.sh > /tmp/Ma.gs` rồi thay toàn bộ nội dung file `Mã.gs`).
  - Deployment ID: `AKfycbyvfVC6D4z7dpvqTRXENomrqmEMnoeqY4Y2Al5ApP32yQWwjJunsJZJYJ4PqCtaptfd`
    (URL `/exec` không đổi khi triển khai phiên bản mới: Triển khai → Quản lý các tùy chọn triển khai → bút chì → Phiên bản mới → Triển khai).
  - Editor: https://script.google.com/u/1/home/projects/1TyUGdGBtKs3sPF5SgtxSMwHXYDa_VqVRirUd13WRZX_KCPNK-yDIm6y2/edit
  - Chỉ có `doPost` (JSON gửi dạng text/plain, fetch `credentials:'omit'`); `doGet` chỉ trả thông báo.
  - Script Properties: `SHEET_TIMELINE`, `SHEET_NHOM` (JSON {ma:{id,ten}}), `SHEET_TAI_KHOAN`, `SHEET_TRUC`, `BI_MAT_PHIEN` (khoá ký phiên — không bao giờ in ra).
    **Không ghi ID sheet hay bí mật vào repo** (repo công khai).
- **Đăng nhập**: Google Identity Services, OAuth client `416137728937-0o67vc9pdrhfvftgutl145ic7va4bafr.apps.googleusercontent.com`
  (Google Cloud project `dashboard-bdv`, đã "En production", origin https://bandoanvu-vku.github.io).
  `dangNhap` đổi ID token (kiểm tra qua tokeninfo) lấy phiên HMAC 7 ngày (`s1.<payload>.<sig>`).

## Dữ liệu (Google Sheets)

- **Timeline 2026 - 2027** (của vanphongdoan@vku.udn.vn): nguồn của nhóm 4T, tab tháng dạng `08.2026`.
  Chỉ được ghi vào ô nhận việc/tick và tab "Nhật ký dashboard". **Không sửa gì khác trên sheet này.**
- 3 sheet nhóm "[BĐV 2026 - 2027] Theo dõi nhiệm vụ - Nhóm …": tab Nhiệm vụ (dòng 1 tiêu đề, dòng 2 gợi ý, dữ liệu từ dòng 3),
  Thành viên, Mảng công việc.
- **Tài khoản dashboard - Ban Đoàn vụ**: Họ và tên | Nhóm | Email Google | Vai trò (Quản lý/Thành viên) | Ghi chú.
  Một người thuộc nhóm nếu cột Nhóm ghi nhóm đó HOẶC có tên trong danh sách thành viên của sheet nhóm.
- **Lịch trực văn phòng - Ban Đoàn vụ**: tab Đăng ký (mỗi dòng 1 ca: Từ/Đến, Loại = Cả buổi/Ca ghép/Đổi ca/Đột xuất,
  Trạng thái = Đã đăng ký/Chờ duyệt/Đã duyệt/Từ chối/Đã huỷ — không xoá dòng sau khi khoá), Yêu cầu (đổi/huỷ/thêm ca),
  Công bố (tuần đã công bố), Cài đặt (vị trí văn phòng, bán kính, số buổi tối thiểu, ngày nghỉ).
  Buổi: sáng 8–11h, chiều 14–17h, T2–T6; ca tự chọn giờ:phút bất kỳ trong 8:00–17:00, tối thiểu 1 giờ (bắt đầu trước 12:30 xếp buổi sáng);
  trực đột xuất tính từ lúc điểm danh, đến giờ tự chọn ≤ 17:00; tính theo giờ (1 buổi = 3 giờ). Trang Lịch trực có nút "Tạo yêu cầu đổi lịch" (đổi/huỷ/thêm).
  Quy trình tuần: mở đăng ký 00:00 thứ 6 → khoá 17:00 CN tuần trước; trong lúc mở thành viên chỉ thấy lịch mình + số người;
  khoá xong quản lý chỉnh rồi Công bố; sau khoá muốn đổi/huỷ/thêm thì gửi yêu cầu cho quản lý duyệt;
  trực đột xuất điểm danh luôn → "Chờ duyệt" → quản lý duyệt mới tính giờ. Tuần trước 19/10/2026 coi như đã công bố.

## Phân quyền

- Chưa đăng nhập: không thấy dữ liệu. Thành viên: Của tôi (gồm cả tổng quan nhóm mình; vào `/` tự chuyển sang `/cua-toi/`), Lịch trực, trang nhóm mình.
  Quản lý: xem tất cả (chỉ xem ở trang nhóm), thống kê trực, đặt vị trí văn phòng, mục **Phê duyệt** (`/phe-duyet/`, action `pheDuyet`;
  menu hiện số mục chờ). Loại việc cần duyệt mới sau này: thêm vào `pheDuyet_` + mảng `LOAI` trong `phe-duyet/index.html`.
  Mục **Thống kê** (`/thong-ke/`, action `thongKe` trong `5-thong-ke.gs`): giờ trực (đăng ký / thực tế / vắng) + hoạt động
  (phụ trách / hỗ trợ / việc truyền thông 4T, theo hạn nhiệm vụ) theo khoảng ngày; quản lý thấy tất cả, thành viên chỉ thấy mình (link từ Của tôi).
- Kiểm tra quyền luôn ở máy chủ (`canNhom_`, `nguoiDung_`); tên ghi vào sheet lấy từ tài khoản, không tin client.

## Trang

`/` tổng quan · `/cua-toi/` · `/lich-truc/` · `/phe-duyet/` `/thong-ke/` (quản lý) · `/4t/` · `/nghiep-vu/` `/csdl-csvc/` `/noi-vu/` (dùng chung `nhom.js`) · `/bao-mat/`.
`menu.js` vẽ menu theo quyền (xem được ≥2 nhóm thì gom vào menu thả xuống "Công việc nhóm"; cột 4 = 'quanLy' là trang chỉ quản lý thấy) và tự nạp `dangnhap.js`. Thêm trang: thêm một dòng vào `TRANG` trong `menu.js`.

## Cách làm việc (để tiết kiệm thời gian/token)

- Sửa giao diện: sửa file trong repo → commit → push `main`. Không cần trình duyệt.
- Sửa máy chủ: sửa `apps-script/*.gs` → commit → push `main`. Workflow `.github/workflows/deploy-apps-script.yml`
  tự `clasp push` + `clasp deploy` vào đúng Deployment ID và kiểm tra web app (cần secret `CLASPRC_JSON`;
  thiếu secret thì workflow bỏ qua và phải dán tay qua editor như cũ). Xem kết quả: `gh run list -R bandoanvu-vku/bandoanvu-vku.github.io`.
  `clasp push` thay toàn bộ file trong dự án bằng nội dung `apps-script/` (kể cả `appsscript.json`, giữ webapp
  USER_DEPLOYING + ANYONE_ANONYMOUS). Thêm quyền mới (scope) thì người dùng phải vào editor chạy một hàm để cấp quyền lại.
- Chrome của người dùng bị thu nhỏ thì thao tác chuột/ảnh chụp treo; nhờ họ mở cửa sổ lên.
- Gom nhiều thay đổi máy chủ vào một lần triển khai.
