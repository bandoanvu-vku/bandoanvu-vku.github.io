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
  trực đột xuất tính từ lúc điểm danh, đến giờ tự chọn ≤ 17:00; tính theo giờ (1 buổi = 3 giờ). Trang Lịch trực có nút "Tạo yêu cầu đổi lịch" (đổi ca / xin vắng / thêm ca; bỏ "Huỷ ca") và nút "Xin vắng" cạnh nút Điểm danh. Duyệt xin vắng → ca Đã huỷ với ghi chú "Vắng có phép…" (Thống kê đếm riêng).
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

`/` tổng quan (quản lý; 5 tab Chung + từng nhóm, tab ghi trên địa chỉ #4t…) · `/cua-toi/` (Trang chủ của thành viên / Việc của tôi của quản lý) · `/lich-truc/` (`#diem-danh` = chế độ Điểm danh) ·
`/phe-duyet/` `/thong-ke/` `/cai-dat/` (quản lý) · `/ho-so/` `/tai-lieu/` `/cam-nang/` `/phan-hoi/` · `/4t/` · `/nghiep-vu/` `/csdl-csvc/` `/noi-vu/` (dùng chung `nhom.js`) · `/bao-mat/`.
`menu.js` vẽ thanh menu bên trái chia nhóm mục theo vai trò (hàm `cauHinh`; trên điện thoại mở bằng nút ☰) và tự nạp `dangnhap.js`.
Thêm trang: thêm một mục vào `cauHinh()` trong `menu.js`. Trang mới dùng chung `/chung.css` + `/chung.js` (T.$, T.esc, T.toast, T.khoi).
Server `6-ho-so-noi-dung.gs`: hồ sơ (cột Chức vụ/MSSV/Lớp/Số điện thoại tự thêm vào sheet tài khoản; thành viên sửa MSSV/Lớp/SĐT,
chức vụ do quản lý), tab "Tài liệu" (cột Nhóm: chung/4t/…; trang chia tab Chung + 4 nhóm, thành viên thấy Chung + nhóm mình) + "Cẩm nang" trong sheet tài khoản (quản lý sửa), cài đặt lịch trực (`caiDat`/`luuCaiDat`).
Server `7-hoat-dong-nhom.gs` + giao diện `/hoat-dong.js` (BDVHD.cnXanh / kiemKe / hopNhom), lưu ở các tab "CN xanh", "CN xanh - xin vắng",
"Kiểm kê", "Họp nhóm" của sheet lịch trực. Trang CSDL - CSVC có 5 tab theo đầu việc nhóm tự chia: Công văn · Cơ sở vật chất · Giấy tờ / Biểu mẫu · Thông tin Đoàn vụ · Chủ nhật xanh
(mỗi tab hiện dòng "Đầu việc"; tab Mảng công việc trong sheet giữ 7 dòng, khớp theo từ khoá trong `MANG_RIENG` ở nhom.js; Hệ thống QL Đoàn viên đã chuyển sang Nghiệp vụ (Tân)). Phụ trách chính của mảng = cột "Phụ trách chính" tab Mảng công việc.
CN xanh: 2 người/CN, đăng ký cùng khung lịch trực, sau khoá thì xin vắng + chọn người thay → phụ trách chính/quản lý duyệt (cũng hiện ở Phê duyệt).
Mỗi CN có 4 đầu việc chuẩn bị (`VIEC_CNX`: Viết thông báo, Liên hệ khu vực trực, Tạo sheet điểm danh — bắt buộc link, Giám sát thực hiện), tab "CN xanh - chuẩn bị",
action `luuViecCnXanh` (nhận / giao (phụ trách) / bỏ nhận / xong / mở lại).
Tab Cơ sở vật chất (`BDVHD.csvc`) có 3 tab con: Kiểm kê · Mượn về · Cho mượn.
Kiểm kê: cột Kỳ = "Tuần YYYY-MM-DD" (thứ 2; chỉ chọn T5/T6) · "YYYY-MM" (7 ngày cuối tháng) · "Giữa năm YYYY" (15–31/5) / "Cuối năm YYYY" (15–31/12).
Phụ trách chính mảng CSVC / quản lý đăng ký → duyệt 2 cấp → đến ngày nộp báo cáo (link biên bản bắt buộc + tổng/tốt/hỏng/mất/mới thêm/thanh lý + tóm tắt) → biểu đồ biến động.
**Duyệt 2 cấp** (`10-csvc-cong-van.gs`: `trangThaiGui_`, `buocDuyet_`, TT2): Chờ phụ trách duyệt → Chờ quản lý duyệt → Đã duyệt; phụ trách từ chối = "Trả lại" (về thành viên),
quản lý từ chối = "Quản lý trả lại" (về nhóm). Người duyệt cấp 1 = **phụ trách chính của mảng công việc đó** (cột "Phụ trách chính" tab Mảng công việc, `phuTrachMang_`;
kiểm kê / cho mượn dùng mảng CSVC: `duyetCap1Csvc_`) — KHÔNG dùng chức vụ trưởng nhóm; mảng chưa có phụ trách hoặc chính phụ trách gửi thì đi thẳng quản lý.
Trạng thái cũ "Chờ trưởng nhóm duyệt" được đọc như "Chờ phụ trách duyệt". Mục chờ quản lý hiện ở Phê duyệt (`choDuyetCsvc_`).
Mượn trả: sheet "[BĐV 2026 - 2027] CSVC - Mượn trả tài sản" (tab đầu = danh mục tài sản chép từ 2 biên bản xlsx; tab "Mượn về", "Cho mượn" tự tạo).
Mượn về: nguồn Phòng TCHC (bắt buộc link giấy đề nghị) / KTX (bắt buộc người liên hệ + SĐT) / Khác → Đang mượn → Đã trả. Cho mượn: bắt buộc giấy đề nghị, duyệt 2 cấp → giao → nhận lại.
Công văn (`BDVHD.congVan`, action `congVan`): CHỈ ĐỌC sheet công văn đi (tab nhiệm kỳ mới nhất, số tiếp theo = số lớn nhất + 1, dòng đã lấy số chưa có tên, chưa PDF)
và công văn đến (3 tab Trong trường / Ngoài trường / CLB Đội Nhóm). Không ghi gì vào 2 sheet này (của vanphongdoan). Danh sách "Chưa có file PDF" hiện đủ (xem tất cả).
Việc lưu công văn tự động theo ca trực: ai có tên trong mảng "Lưu Công văn đi/đến" (phụ trách / hỗ trợ / tham gia, "Cả nhóm" = mọi người) thì mỗi ngày có ca trực
(còn hiệu lực, từ 15/10/2026) tự có việc "Lưu công văn đi / đến (ngày trực dd/mm)", hạn = ngày trực — gộp như nhiệm vụ thường vào Việc cần làm / KPI Trang chủ
(`cuaToi.viec`, `tuDong:'cv'`), tab "Việc của tôi" trang CSDL (`nhom.viecTuDong`), Thống kê (cột `luuCongVan`) và tab Công văn (`congVan.caTruc`); đánh dấu qua `luuViecCongVan`,
lưu ở tab "Lưu công văn - ca trực" của sheet lịch trực (không thêm dòng vào sheet nhiệm vụ). Phụ trách mảng công văn / quản lý đánh dấu hộ được.
Liên kết (link sheet / folder công văn, biên bản, sheet mượn trả) lưu ở tab "Cài đặt" của sheet lịch trực; quản lý dán ở trang Cài đặt (action `luuLienKet`) — không ghi ID vào repo. Họp tháng: mục riêng `/hop-nhom/` trên menu (tab theo nhóm; quản lý có tab Tổng hợp; thành viên nhóm đăng ký, quản lý xem;
bảng tổng hợp ở tab Chung của Tổng quan). Năm học: ô chọn trên thanh header, bên trái — đối diện tài khoản (`menu.js`: NAM_HOC, HIEN_TAI, CO_DU_LIEU; nhớ ở localStorage `bdv.namHoc`, `window.BDV_NAM_HOC`).
Hiện chỉ 2026 - 2027 có dữ liệu; năm khác thì trang theo năm hiện "chưa có dữ liệu" (trừ hồ sơ/cẩm nang/cài đặt/tài liệu/bảo mật).
Khi bổ sung năm cũ: cần nguồn sheet theo năm ở máy chủ + thêm năm vào CO_DU_LIEU + truyền năm học trong các BDV.goi.
Tất cả file .gs chung một không gian tên — build script / workflow dừng nếu trùng tên hàm.
Quản lý không có "Việc của tôi"; thay bằng **Giao việc** (`/giao-viec/`, `8-giao-viec.gs`: tạo/sửa nhiệm vụ ghi vào tab Nhiệm vụ của 3 sheet nhóm,
4T không giao được vì Timeline chỉ được ghi ô nhận/tick) và **Duyệt việc** 2 cấp: thành viên đặt "Chờ duyệt" (= chờ phụ trách chính của mảng ghi ở nhiệm vụ; mảng chưa có phụ trách
hoặc chính phụ trách gửi thì ghi thẳng "Chờ quản lý duyệt") → phụ trách chính duyệt ở khung "Chờ bạn duyệt" trên tab Nhiệm vụ nhóm (action `duyetViec`, `ve:'nhom'`)
→ "Chờ quản lý duyệt" → quản lý duyệt ở `/duyet-viec/` = Hoàn thành. Trả lại (cả 2 cấp) = Đang làm + ghi chú. Menu đếm số chờ quản lý (`soViecChoQL_`).
Xin vắng CN xanh vẫn 1 cấp (phụ trách chính duyệt).
Xem như thành viên: quản lý chọn "Giao diện" trên header (Quản lý / Thành viên · nhóm X), nhớ ở localStorage `bdv.xemNhu`.
`BDV.nguoi()` trả người "hiệu lực" (vai trò thành viên, nhom=[X]), `BDV.nguoiThat()` trả tài khoản thật; `BDV.goi` tự gửi `req.xemNhu`
→ máy chủ (doPost) chỉ cho các action đọc và lọc như thành viên nhóm X; thao tác ghi bị chặn.
Nguồn phân công: Google Sheet "BẢNG PHÂN CÔNG NHIỆM VỤ BĐV" (tab theo nhóm: Họ tên | Chi tiết công việc, ghi "(Phụ trách chính)/(Hỗ trợ chính)").
Dashboard không đọc trực tiếp; nội dung được chép vào tab Thành viên + Mảng công việc của sheet nhóm. Tab "Mảng và thành viên" hiện phân công từng người.
Sửa dữ liệu sheet một lần: thêm mục vào `CAP_NHAT` trong `9-cap-nhat-du-lieu.gs` (tự chạy ở lần gọi web app đầu tiên sau triển khai, đánh dấu Script Property).
**Phản hồi hệ thống** (`/phan-hoi/`, `11-phan-hoi.gs`, actions `phanHoi` / `guiPhanHoi` / `xuLyPhanHoi`): mọi vai trò gửi góp ý (loại, trang, mức hài lòng 1–5, nội dung; tối đa 10/ngày),
lưu tab "Phản hồi hệ thống" của sheet tài khoản KÈM họ tên/email/nhóm người gửi. Trang không có ghi chú về ẩn danh (không được hứa ẩn danh vì sheet lưu tên).
 Thành viên thấy góp ý của mình + trả lời của Ban; quản lý có tab Tổng hợp (tên ẩn mặc định, nút "Xem người gửi"), đổi trạng thái + trả lời.
Lộ trình còn lại: Đơn từ & xin nghỉ → duyệt ở Phê duyệt; Nhắc việc tự động (email, cần cấp quyền).

## Cách làm việc (để tiết kiệm thời gian/token)

- Sửa giao diện: sửa file trong repo → commit → push `main`. Không cần trình duyệt.
- Sửa máy chủ: sửa `apps-script/*.gs` → commit → push `main`. Workflow `.github/workflows/deploy-apps-script.yml`
  tự `clasp push` + `clasp deploy` vào đúng Deployment ID và kiểm tra web app (cần secret `CLASPRC_JSON`;
  thiếu secret thì workflow bỏ qua và phải dán tay qua editor như cũ). Xem kết quả: `gh run list -R bandoanvu-vku/bandoanvu-vku.github.io`.
  `clasp push` thay toàn bộ file trong dự án bằng nội dung `apps-script/` (kể cả `appsscript.json`, giữ webapp
  USER_DEPLOYING + ANYONE_ANONYMOUS). Thêm quyền mới (scope) thì người dùng phải vào editor chạy một hàm để cấp quyền lại.
- Chrome của người dùng bị thu nhỏ thì thao tác chuột/ảnh chụp treo; nhờ họ mở cửa sổ lên.
- Gom nhiều thay đổi máy chủ vào một lần triển khai.
