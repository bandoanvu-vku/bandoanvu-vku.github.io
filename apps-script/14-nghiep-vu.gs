/* ------------------------------------------------ nhóm Nghiệp vụ: sổ theo dõi theo quy trình */
/*
 * Mỗi "sổ" là một tab trong sheet lịch trực (tự tạo), mô tả bằng cấu hình SO_NV: các trường, trạng thái theo quy trình,
 * điều kiện để chuyển trạng thái (trường bắt buộc đã đánh dấu / có link), trạng thái chỉ phụ trách chính của mảng (hoặc quản lý) chốt được,
 * và các bước của quy trình (hiện thành hướng dẫn trên trang).
 * Quy trình gốc (Đoàn trường, 10/2025): thu sổ Đoàn · phê duyệt sổ Đoàn · nhận + xét hồ sơ SV5T/TNTT · thư mời, giấy khen, GCN (Canva) · ký nhận.
 * Thành viên nhóm Nghiệp vụ + quản lý xem và ghi. Không xoá dòng: huỷ = trạng thái "Đã huỷ".
 * Không lưu số tài khoản, CCCD của người ký nhận / người nộp hồ sơ (ghi trên giấy theo quy trình).
 */
const NHOM_NV = 'nghiep-vu';
const NV_HUY = 'Đã huỷ';
const NV_COT_DAU = ['Mã', 'Trạng thái'], NV_COT_CUOI = ['Người tạo', 'Tạo lúc', 'Cập nhật bởi', 'Cập nhật lúc'];
// Trường: [khoá, nhãn, kiểu (text|num|date|check|select|link|tv|area), tuỳ chọn {bb: bắt buộc khi tạo, ds: lựa chọn, goiY, bang: hiện ở bảng}]
const SO_NV = {
  thuSo: {
    ten: 'Thu sổ Đoàn', tab: 'NV - Thu sổ Đoàn', mang: ['sổ đoàn'], donVi: 'chi đoàn',
    truong: [
      ['dot', 'Đợt thu', 'text', { bb: 1, goiY: 'K25 - HK1 2026-2027', bang: 1 }], ['chiDoan', 'Chi đoàn', 'text', { bb: 1, bang: 1 }],
      ['daiDien', 'Đại diện nộp', 'text', { bang: 1 }], ['sdt', 'SĐT đại diện', 'text'], ['soSo', 'Số sổ', 'num', { bb: 1, bang: 1 }],
      ['banCung', 'Bản cứng danh sách', 'check', { bang: 1 }], ['banMem', 'Bản mềm .xlsx đã gửi mail', 'check', { bang: 1 }],
      ['khop', 'Đã đối chiếu số lượng, xếp đúng thứ tự', 'check', { bang: 1 }], ['soTheoDoi', 'Đã ghi "Sổ theo dõi sổ Đoàn"', 'check'],
      ['nguoiNhan', 'Người nhận', 'tv', { bang: 1 }], ['ngayNhan', 'Ngày nhận', 'date', { bang: 1 }],
      ['nhapSheet', 'Đã nhập vào sheet Quản lý sổ Đoàn - Đoàn phí', 'check', { bang: 1 }], ['nguoiNhap', 'Người nhập dữ liệu', 'tv'],
      ['ghiChu', 'Ghi chú', 'area']
    ],
    trangThai: ['Đã nộp – chờ kiểm tra', 'Trả lại bổ sung', 'Đã nhận – đặt lên kệ', 'Đã nhập dữ liệu'],
    can: { 'Đã nhận – đặt lên kệ': ['banCung', 'banMem', 'khop', 'soTheoDoi'], 'Đã nhập dữ liệu': ['banCung', 'banMem', 'khop', 'nhapSheet'] },
    lienKet: ['qlSoDoan', 'folderSoDoan', 'mauDsSoDoan'],
    buoc: [
      ['Chi đoàn', 'Bí thư nhận thông tin → thu sổ toàn bộ đoàn viên (năm 2) → lập danh sách theo mẫu → gửi file .xlsx về vanphongdoan@vku.udn.vn → nộp sổ + bản cứng tại K.E101 (8h–11h, 14h–17h). Bổ sung thì nộp lại toàn bộ danh sách (cả bản cứng và bản mềm).'],
      ['Ban Đoàn vụ nhận sổ', '1. Tiếp nhận đại diện chi đoàn. 2. Kiểm tra đủ sổ, bản cứng, bản mềm (folder Thông tin Sổ Đoàn hoặc mail). 3. Đối chiếu số lượng, xếp sổ đúng thứ tự danh sách (chưa xếp thì nhờ đại diện xếp tại chỗ). 4. Thiếu / sai → trả lại chi đoàn bổ sung. 5. Đủ và khớp → bỏ sổ + danh sách vào hộp tên chi đoàn, đặt lên kệ. 6. Ghi "Sổ theo dõi sổ Đoàn": nội dung, người giao, người nhận, số sổ, ký tên.'],
      ['Nhóm Nghiệp vụ nhập dữ liệu', '1. Tải file .xlsx của chi đoàn từ mail Văn phòng Đoàn. 2. Tạo folder "Danh sách K.. đã nộp" trong folder Thông tin Sổ Đoàn, upload file. 3. Mở sheet 1_QUẢN LÝ SỔ ĐOÀN - ĐOÀN PHÍ, vào trang tính của chi đoàn (dùng mail VKU cá nhân). 4. VLOOKUP (+ IMPORTRANGE) theo mã sinh viên lấy Ngày vào Đoàn, Nơi vào Đoàn, Ngày nộp sổ (tham số cuối FALSE). 5. Kiểm tra lại với bản cứng.']
    ]
  },
  pheSo: {
    ten: 'Phê sổ Đoàn', tab: 'NV - Phê sổ Đoàn', mang: ['sổ đoàn'], donVi: 'chi đoàn',
    truong: [
      ['namHoc', 'Năm học', 'text', { bb: 1, goiY: '2025 - 2026', bang: 1 }], ['chiDoan', 'Chi đoàn', 'text', { bb: 1, bang: 1 }],
      ['daiDien', 'BCH chi đoàn đến phê', 'text', { bang: 1 }], ['soSo', 'Số sổ', 'num', { bang: 1 }], ['ngay', 'Ngày phê', 'date', { bang: 1 }],
      ['huongDan', 'Thành viên hướng dẫn', 'tv', { bang: 1 }], ['dungTrang', 'Đã kiểm tra đúng trang "Nhận xét ưu, khuyết điểm"', 'check', { bang: 1 }],
      ['kyDau', 'Đoàn trường đã ký, đóng dấu', 'check', { bang: 1 }], ['ghiChu', 'Ghi chú', 'area']
    ],
    trangThai: ['Đã hẹn', 'Đang phê', 'Đã phê – chờ ký, đóng dấu', 'Hoàn thành'],
    can: { 'Đã phê – chờ ký, đóng dấu': ['dungTrang'], 'Hoàn thành': ['dungTrang', 'kyDau'] },
    lienKet: ['qlSoDoan'],
    buoc: [
      ['Thời điểm', 'Tháng 5 học kỳ II hằng năm, sau thông báo của Đoàn trường, BCH các chi đoàn đến Văn phòng Đoàn phê sổ cho chi đoàn mình.'],
      ['Vị trí phê (chi đoàn)', 'Trang "Nhận xét ưu, khuyết điểm từng năm", sau toàn bộ các trang đã có nội dung; bắt đầu ở trang trống phía sau. Trang có dấu đỏ ở giữa không thuộc Đoàn trường CNTT&TT Việt - Hàn thì lật sang trang bên cạnh.'],
      ['Gợi ý nhận xét', 'Tích cực tham gia các hoạt động của lớp, trường · Hoàn thành tốt trách nhiệm của đoàn viên · Đóng đoàn phí đầy đủ.'],
      ['Lưu ý', 'Bút mực xanh, rõ ràng, không tẩy xoá hay ghi chèn; kiểm tra lại toàn bộ trước khi nộp lại cho Đoàn trường ký, đóng dấu.']
    ]
  },
  chuyenSH: {
    ten: 'Rút sổ / Chuyển sinh hoạt', tab: 'NV - Chuyển sinh hoạt Đoàn', mang: ['sổ đoàn'], donVi: 'sổ',
    truong: [
      ['hoTen', 'Họ tên đoàn viên', 'text', { bb: 1, bang: 1 }], ['mssv', 'MSSV', 'text', { bang: 1 }], ['chiDoan', 'Chi đoàn', 'text', { bang: 1 }],
      ['lyDo', 'Lý do', 'select', { ds: ['Tốt nghiệp', 'Chuyển trường', 'Chuyển sinh hoạt nơi cư trú', 'Khác'], bang: 1 }], ['ngayYC', 'Ngày tiếp nhận', 'date', { bang: 1 }],
      ['doanPhi', 'Đóng đoàn phí đến (theo Đoàn trường cung cấp)', 'text', { goiY: 'hết tháng 5/2026', bang: 1 }],
      ['daPhe', 'Đã ghi trang "Giới thiệu sinh hoạt Đoàn"', 'check', { bang: 1 }], ['nguoiPhe', 'Người phê', 'tv', { bang: 1 }],
      ['kyDau', 'Đoàn trường đã ký, đóng dấu', 'check', { bang: 1 }], ['ngayTra', 'Ngày trả sổ', 'date', { bang: 1 }], ['ghiChu', 'Ghi chú', 'area']
    ],
    trangThai: ['Tiếp nhận', 'Đã phê – chờ ký, đóng dấu', 'Đã trả sổ'],
    can: { 'Đã phê – chờ ký, đóng dấu': ['daPhe', 'doanPhi'], 'Đã trả sổ': ['daPhe', 'doanPhi', 'kyDau', 'ngayTra'] },
    lienKet: ['qlSoDoan'],
    buoc: [
      ['Vị trí phê (Đoàn cơ sở)', 'Trang "GIỚI THIỆU SINH HOẠT ĐOÀN" còn trống gần nhất; ghi ở phần cuối trang bên trái.'],
      ['Nội dung', '"Kính gửi BCH Đoàn": ghi "Cơ sở mới" · "Đề nghị tiếp nhận… cho đồng chí": họ tên đầy đủ (bìa trước sổ) · Thời gian đóng đoàn phí theo thông tin Đoàn trường / Đoàn cơ sở (vd: đến hết tháng 5 năm 2020).'],
      ['Ký, đóng dấu', 'BCH Đoàn trường ký xác nhận; dấu đặt ở ghi chú "dấu của Đoàn cơ sở chuyển đi".'],
      ['Lưu ý', 'Bút mực xanh, không tẩy xoá; kiểm tra lại trước khi nộp cho Đoàn trường.']
    ]
  },
  sv5t: {
    ten: 'Hồ sơ SV5T · TNTT', tab: 'NV - Hồ sơ SV5T TNTT', mang: ['sinh viên 5 tốt', 'sv5t'], donVi: 'hồ sơ',
    truong: [
      ['namHoc', 'Năm học', 'text', { bb: 1, goiY: '2025 - 2026' }], ['loai', 'Danh hiệu', 'select', { ds: ['Sinh viên 5 tốt', 'Thanh niên tiên tiến làm theo lời Bác'], bb: 1, bang: 1 }],
      ['hoTen', 'Họ tên', 'text', { bb: 1, bang: 1 }], ['mssv', 'MSSV', 'text', { bang: 1 }], ['chiDoan', 'Chi đoàn', 'text', { bang: 1 }],
      ['banMem', 'Đã nộp bản mềm (form)', 'check', { bang: 1 }], ['banCung', 'Đã nộp bản cứng (ô tủ 142)', 'check', { bang: 1 }],
      ['nguoiNhan', 'Người nhận bản cứng', 'tv', { bang: 1 }], ['ngayNhan', 'Ngày nhận', 'date'], ['dayDu', 'Đủ giấy tờ (báo cáo thành tích, minh chứng / trích ngang, ảnh thẻ)', 'check', { bang: 1 }],
      ['daoDuc', 'Đạo đức (ĐRL ≥ 80)', 'check'], ['hocTap', 'Học tập (GPA ≥ 3.0/4)', 'check'], ['theLuc', 'Thể lực', 'check'],
      ['tinhNguyen', 'Tình nguyện', 'check'], ['hoiNhap', 'Hội nhập', 'check'], ['uuTien', 'Tiêu chí ưu tiên (nếu có)', 'text'],
      ['tieuChiTntt', 'TNTT: đoàn viên xuất sắc / ưu tú, hoạt động Đoàn được khen, học lực khá 2 HK liên tiếp', 'check'],
      ['hanBoSung', 'Hạn bổ sung minh chứng', 'date', { bang: 1 }], ['ghiChu', 'Ghi chú (minh chứng còn thiếu…)', 'area']
    ],
    trangThai: ['Đã nhận', 'Đang xét', 'Thiếu minh chứng – chờ bổ sung', 'Đạt', 'Không đạt'],
    chot: ['Đạt', 'Không đạt'],
    can: { 'Đang xét': ['banMem', 'banCung'], 'Thiếu minh chứng – chờ bổ sung': ['hanBoSung', 'ghiChu'] },
    lienKet: ['sheetSv5t', 'formSv5t', 'folderSv5t'],
    buoc: [
      ['Nhận hồ sơ (mọi thành viên)', 'Bản mềm nộp qua form trên bài đăng; bản cứng nộp tại Văn phòng Đoàn: kiểm tra đúng người nộp, đủ giấy tờ (SV5T: báo cáo thành tích đúng mẫu, minh chứng theo thứ tự mục, ảnh thẻ · TNTT: báo cáo thành tích, trích ngang, ảnh thẻ), thiếu thì đề nghị bổ sung. Cất bản cứng ô tủ 142 và báo người phụ trách.'],
      ['Xét hồ sơ (phụ trách chính, hỗ trợ)', '1. Gom bản mềm vào sheet tổng hợp. 2. Lập nhóm Zalo, thêm tất cả người nộp (SĐT từ form). 3. Kiểm tra đủ bản cứng + bản mềm, báo bổ sung qua nhóm. 4. Xét theo tiêu chí trong folder [SV5T] của năm học; đặt tên file [Cấp xét] + [Họ tên]. 5. Thông báo kết quả lần 1, cho thời gian phản hồi minh chứng thiếu; không phản hồi = không đạt. 6. Lưu hồ sơ bản mềm. 7. Soạn quyết định công nhận cấp trường trình cán bộ ký.'],
      ['5 tiêu chí SV5T', 'Đạo đức: ĐRL ≥ 80 · Học tập: GPA ≥ 3.0/4 · Thể lực: thi đấu từ cấp Đoàn khoa hoặc GCN phong trào thể thao · Tình nguyện: 1 chương trình (hè, cộng đồng, quốc tế) hoặc ≥ 2 GCN tình nguyện tại chỗ · Hội nhập: ngoại ngữ B / tương đương, hoặc GCN giao lưu quốc tế cấp trường, hoặc giải cuộc thi có dùng ngoại ngữ.']
    ]
  },
  thietKe: {
    ten: 'Thư mời · Giấy khen · GCN', tab: 'NV - Thư mời Giấy khen GCN', mang: ['thiết kế', 'thư mời', 'giấy chứng nhận', 'giấy khen'], donVi: 'yêu cầu',
    truong: [
      ['chuongTrinh', 'Chương trình', 'text', { bb: 1, bang: 1 }], ['loai', 'Loại', 'select', { ds: ['Thư mời', 'Giấy khen', 'Giấy chứng nhận'], bb: 1, bang: 1 }],
      ['soLuong', 'Số lượng', 'num', { bang: 1 }], ['nguoiYC', 'Người phụ trách chương trình', 'text', { bang: 1 }], ['han', 'Hạn gửi bản xem', 'date', { bang: 1 }],
      ['keHoach', 'Link kế hoạch chương trình', 'link'], ['danhSach', 'Link danh sách khách mời / người nhận', 'link'],
      ['nguoiLam', 'Người làm', 'tv', { bang: 1 }], ['conDau', 'Cần dấu / chữ ký (làm phẳng PDF khi tải)', 'check'],
      ['ketQua', 'Link file PDF (TM_<tên chương trình>)', 'link', { bang: 1 }], ['ghiChu', 'Ghi chú / yêu cầu sửa', 'area']
    ],
    trangThai: ['Mới nhận', 'Đang làm', 'Chờ người phụ trách xem', 'Cần sửa', 'Hoàn thành'],
    can: { 'Đang làm': ['nguoiLam'], 'Chờ người phụ trách xem': ['nguoiLam', 'ketQua'], 'Hoàn thành': ['ketQua'] },
    lienKet: ['mauThietKe'],
    buoc: [
      ['Chuẩn bị', 'File kế hoạch chương trình · file danh sách khách mời · mẫu trên Canva (sao chép sang dự án khác, không sửa bản mẫu) · bì thư, nhãn tên.'],
      ['Làm trên Canva', '1. Sửa nội dung theo kế hoạch (mục đích, thời gian, địa điểm…), giữ nguyên kiểu, cỡ, màu chữ, căn bố cục cân đối. 2. Thêm trường "Tên" + "Chức vụ" (giấy khen: "Tên" + "Đơn vị"). 3. Ứng dụng → Tạo hàng loạt → tải lên danh sách hoặc nhập tay → kết nối dữ liệu từng trường → kiểm tra đủ số lượng → Tạo thiết kế.'],
      ['Xuất file', 'Xem lại từng trang, chỉnh tay chỗ lệch → Chia sẻ → Tải xuống PDF (cần dấu / chữ ký thì chọn làm phẳng PDF) → đặt tên "TM_<tên chương trình>" → gửi người phụ trách xem, sửa nếu có sai sót.'],
      ['GCN', 'Loại điền tay sau: chỉ đổi nội dung danh hiệu + thời gian cấp, in 1 mẫu. Loại có sẵn tên: làm như thư mời (tạo hàng loạt).']
    ]
  },
  kyNhan: {
    ten: 'Ký nhận', tab: 'NV - Ký nhận', mang: ['danh sách nhận', 'soạn thảo', 'ký nhận'], donVi: 'danh sách',
    truong: [
      ['tenDs', 'Danh sách ký nhận', 'text', { bb: 1, bang: 1 }], ['phuTrach', 'Người chịu trách nhiệm chính', 'tv', { bb: 1, bang: 1 }],
      ['dsLink', 'Link danh sách', 'link'], ['tongNguoi', 'Số người trong danh sách', 'num', { bb: 1, bang: 1 }], ['daKy', 'Đã ký', 'num', { bang: 1 }],
      ['coStk', 'Danh sách có ghi số tài khoản (chuyển khoản)', 'check', { bang: 1 }], ['daChuyen', 'Đã chuyển tiền xong', 'check', { bang: 1 }],
      ['anh', 'Link folder ảnh minh chứng (chữ ký + thẻ SV)', 'link', { bang: 1 }], ['han', 'Hạn ký nhận', 'date', { bang: 1 }], ['ghiChu', 'Ghi chú', 'area']
    ],
    trangThai: ['Đang ký nhận', 'Đủ chữ ký', 'Hoàn tất (đã chuyển tiền, lưu trữ)'],
    can: { 'Đủ chữ ký': ['anh'], 'Hoàn tất (đã chuyển tiền, lưu trữ)': ['anh'] },
    lienKet: [],
    buoc: [
      ['Người cho ký nhận', '1. Hỏi họ tên, tìm đúng dòng trong danh sách. 2. Cho ký bằng bút xanh, ghi rõ họ tên. 3. Mượn thẻ sinh viên / CCCD đặt dưới chữ ký, chụp rõ. 4. Gửi ảnh cho người chịu trách nhiệm chính. 5. Danh sách có cột STK thì hướng dẫn ghi rõ STK (nhận tiền mặt thì bỏ qua). 6. Kiểm tra lại chữ ký, họ tên, ảnh trước khi xong.'],
      ['Người chịu trách nhiệm chính', 'Kiểm tra thông tin ký nhận · chuyển tiền cho người có STK · lưu ảnh minh chứng để đối chiếu.'],
      ['Lưu ý', 'Dashboard không lưu STK hay ảnh thẻ: STK ghi trên danh sách giấy, ảnh lưu trong folder minh chứng.']
    ]
  }
};
// Link của nhóm Nghiệp vụ: khai báo trong LIEN_KET (10-csvc-cong-van.gs), nhóm 'Nghiệp vụ'.
function tenLkNv_(k) { const x = LIEN_KET.filter(function (y) { return y[0] === k; })[0]; return x ? x[1] : k; }

function cotSoNv_(so) { return NV_COT_DAU.concat(so.truong.map(function (t) { return t[1]; })).concat(NV_COT_CUOI); }
function tabSoNv_(so) {
  const ss = sheetTruc_(), cot = cotSoNv_(so);
  let s = ss.getSheetByName(so.tab);
  if (!s) {
    s = ss.insertSheet(so.tab);
    s.getRange(1, 1, 1, cot.length).setValues([cot]).setFontWeight('bold').setBackground('#1a56c4').setFontColor('#ffffff');
    s.setFrozenRows(1);
    return s;
  }
  const td = s.getRange(1, 1, 1, Math.max(s.getLastColumn(), 1)).getValues()[0].map(chuanHoa_);
  const thieu = cot.filter(function (c) { return td.indexOf(chuanHoa_(c)) === -1; });
  if (thieu.length) s.getRange(1, s.getLastColumn() + 1, 1, thieu.length).setValues([thieu]).setFontWeight('bold');
  return s;
}
function giaTriNv_(t, v) {
  if (t[2] === 'check') return chuanHoa_(v) === 'x' || v === true;
  if (t[2] === 'num') return v === '' || v === null ? '' : Number(v);
  if (t[2] === 'date') return ngayISO_(v, MUI_GIO) || '';
  return chuoi_(v);
}
function docSoNv_(so) {
  const s = tabSoNv_(so);
  if (s.getLastRow() < 2) return [];
  const w = s.getLastColumn(), td = s.getRange(1, 1, 1, w).getValues()[0].map(chuanHoa_);
  const ci = function (ten) { return td.indexOf(chuanHoa_(ten)); };
  const cMa = ci('Mã'), cTT = ci('Trạng thái'), cuoi = NV_COT_CUOI.map(ci);
  return s.getRange(2, 1, s.getLastRow() - 1, w).getValues().map(function (r, i) {
    const f = {};
    so.truong.forEach(function (t) { const c = ci(t[1]); f[t[0]] = giaTriNv_(t, c > -1 ? r[c] : ''); });
    return { dong: i + 2, id: chuoi_(r[cMa]), trangThai: chuoi_(r[cTT]), f: f,
      taoBoi: chuoi_(r[cuoi[0]]), taoLuc: lucChu_(r[cuoi[1]]), boi: chuoi_(r[cuoi[2]]), luc: lucChu_(r[cuoi[3]]) };
  }).filter(function (x) { return x.id; });
}
function laThanhVienNv_(nd) { return nd.vaiTro === 'quanLy' || layNhom(NHOM_NV, false).thanhVien.indexOf(nd.ten) > -1; }

function nghiepVu_(nd, req) {
  canNhom_(nd, NHOM_NV);
  const keys = (Array.isArray(req.so) ? req.so : [req.so]).filter(function (k) { return SO_NV[k]; });
  if (!keys.length) throw new Error('Không có sổ này.');
  const lk = lienKet_(), cfg = {}, ds = {}, pt = {};
  keys.forEach(function (k) {
    const so = SO_NV[k], ctx = mangNhom_(NHOM_NV, so.mang);
    cfg[k] = { ten: so.ten, donVi: so.donVi, truong: so.truong, trangThai: so.trangThai, can: so.can || {}, chot: so.chot || [], buoc: so.buoc,
      lienKet: so.lienKet.map(function (x) { return { ten: tenLkNv_(x).replace(/^Link /, ''), url: lk[x] || '' }; }),
      phuTrach: ctx.phuTrach };
    pt[k] = laPhuTrach_(nd, ctx) && !nd.xemThu;
    ds[k] = docSoNv_(so).map(boDong_).reverse();
  });
  return { cfg: cfg, ds: ds, pt: pt, ghi: laThanhVienNv_(nd) && !nd.xemThu, thanhVien: layNhom(NHOM_NV, false).thanhVien, toi: nd.ten, homNay: bayGio_().ngay, so: keys };
}

function luuNghiepVu_(nd, req) {
  canNhom_(nd, NHOM_NV);
  const so = SO_NV[req.so];
  if (!so) throw new Error('Không có sổ này.');
  if (!laThanhVienNv_(nd)) throw loiQuyen_('Chỉ thành viên nhóm Nghiệp vụ hoặc quản lý mới ghi được.');
  const tv = layNhom(NHOM_NV, false).thanhVien;
  const chuan = function (t, v) {
    if (t[2] === 'check') return v === true || v === 'x' ? 'x' : '';
    if (t[2] === 'num') { if (v === '' || v === null || v === undefined) return ''; const n = Number(v); if (!(n >= 0 && n <= 100000) || Math.floor(n) !== n) throw new Error(t[1] + ' phải là số nguyên từ 0.'); return n; }
    if (t[2] === 'date') { const s = chuoi_(v); if (!s) return ''; if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error(t[1] + ': ngày không hợp lệ.'); return dmy_(s); }
    if (t[2] === 'link') { const s = chuoi_(v).slice(0, 500); if (s && !/^https:\/\//.test(s)) throw new Error(t[1] + ': cần link bắt đầu bằng https://'); return s; }
    if (t[2] === 'select') { const s = chuoi_(v); if (s && t[3].ds.indexOf(s) === -1) throw new Error(t[1] + ' không hợp lệ.'); return s; }
    if (t[2] === 'tv') { const s = chuoi_(v); if (s && tv.indexOf(s) === -1 && s !== nd.ten) throw new Error(s + ' không có trong danh sách thành viên nhóm Nghiệp vụ.'); return s; }
    return chuAnToan_(chuoi_(v).slice(0, t[2] === 'area' ? 1000 : 200));
  };
  return voiKhoa_(function () {
    const s = tabSoNv_(so), w = s.getLastColumn(), td = s.getRange(1, 1, 1, w).getValues()[0].map(chuanHoa_);
    const ci = function (ten) { return td.indexOf(chuanHoa_(ten)); };
    const ds = docSoNv_(so);
    const x = req.id ? ds.filter(function (y) { return y.id === chuoi_(req.id); })[0] : null;
    if (req.id && !x) throw new Error('Không tìm thấy dòng này.');
    const f = req.f || {}, moi = {};
    so.truong.forEach(function (t) { if (Object.prototype.hasOwnProperty.call(f, t[0])) moi[t[0]] = chuan(t, f[t[0]]); });
    // giá trị sau khi lưu (để kiểm tra điều kiện trạng thái)
    const sau = {};
    so.truong.forEach(function (t) {
      if (Object.prototype.hasOwnProperty.call(moi, t[0])) sau[t[0]] = giaTriNv_(t, moi[t[0]]);
      else sau[t[0]] = x ? x.f[t[0]] : giaTriNv_(t, '');
    });
    let tt = x ? x.trangThai : so.trangThai[0];
    if (req.viec === 'huy') {
      if (!x) throw new Error('Không tìm thấy dòng này.');
      if (nd.vaiTro !== 'quanLy' && x.taoBoi !== nd.ten && !laPhuTrach_(nd, mangNhom_(NHOM_NV, so.mang))) throw loiQuyen_('Chỉ người tạo, phụ trách chính hoặc quản lý mới huỷ được.');
      tt = NV_HUY;
    } else if (req.viec === 'tao' || req.viec === 'sua') {
      if (req.viec === 'tao') so.truong.forEach(function (t) { if (t[3] && t[3].bb && (sau[t[0]] === '' || sau[t[0]] === false)) throw new Error('Nhập ' + t[1].toLowerCase() + '.'); });
      if (x && x.trangThai === NV_HUY) throw new Error('Dòng này đã huỷ.');
      if (req.trangThai) {
        if (so.trangThai.indexOf(req.trangThai) === -1) throw new Error('Trạng thái không hợp lệ.');
        tt = req.trangThai;
      }
    } else throw new Error('Yêu cầu không hợp lệ.');
    if (tt !== NV_HUY && (!x || tt !== x.trangThai)) {
      if ((so.chot || []).indexOf(tt) > -1 && !laPhuTrach_(nd, mangNhom_(NHOM_NV, so.mang)))
        throw loiQuyen_('Chỉ phụ trách chính của mảng (' + (mangNhom_(NHOM_NV, so.mang).phuTrach.join(', ') || 'chưa có') + ') hoặc quản lý mới chốt "' + tt + '".');
      const thieu = ((so.can || {})[tt] || []).filter(function (k) { return sau[k] === '' || sau[k] === false || sau[k] === null; })
        .map(function (k) { return so.truong.filter(function (t) { return t[0] === k; })[0][1]; });
      if (thieu.length) throw new Error('Để chuyển sang "' + tt + '" cần: ' + thieu.join('; ') + '.');
      kiemRiengNv_(req.so, tt, sau);
    }
    if (x) {
      Object.keys(moi).forEach(function (k) { const t = so.truong.filter(function (y) { return y[0] === k; })[0], c = ci(t[1]); if (c > -1) s.getRange(x.dong, c + 1).setValue(moi[k]); });
      s.getRange(x.dong, ci('Trạng thái') + 1).setValue(tt);
      s.getRange(x.dong, ci('Cập nhật bởi') + 1, 1, 2).setValues([[nd.ten, new Date()]]);
    } else {
      const r = new Array(w).fill('');
      r[ci('Mã')] = maMoi_('NV'); r[ci('Trạng thái')] = tt;
      Object.keys(moi).forEach(function (k) { const t = so.truong.filter(function (y) { return y[0] === k; })[0], c = ci(t[1]); if (c > -1) r[c] = moi[k]; });
      r[ci('Người tạo')] = nd.ten; r[ci('Tạo lúc')] = new Date();
      s.appendRow(r);
    }
    return nghiepVu_(nd, { so: req.tra || [req.so] });
  });
}
/** Điều kiện riêng không diễn tả được bằng danh sách trường. */
function kiemRiengNv_(k, tt, f) {
  if (k === 'sv5t' && tt === 'Đạt') {
    if (!f.banMem || !f.banCung || !f.dayDu) throw new Error('Để "Đạt" cần đủ bản mềm, bản cứng và giấy tờ.');
    if (f.loai === 'Sinh viên 5 tốt' && !(f.daoDuc && f.hocTap && f.theLuc && f.tinhNguyen && f.hoiNhap)) throw new Error('Sinh viên 5 tốt cần đạt đủ 5 tiêu chí: đạo đức, học tập, thể lực, tình nguyện, hội nhập.');
    if (f.loai !== 'Sinh viên 5 tốt' && !f.tieuChiTntt) throw new Error('Thanh niên tiên tiến làm theo lời Bác cần đánh dấu đạt tiêu chí TNTT.');
  }
  if (k === 'kyNhan' && tt !== 'Đang ký nhận') {
    if (!(f.tongNguoi > 0) || !(f.daKy >= f.tongNguoi)) throw new Error('Chưa đủ chữ ký (' + (f.daKy || 0) + '/' + (f.tongNguoi || 0) + ').');
    if (tt.indexOf('Hoàn tất') === 0 && f.coStk && !f.daChuyen) throw new Error('Danh sách có chuyển khoản: đánh dấu "Đã chuyển tiền xong" trước.');
  }
}
