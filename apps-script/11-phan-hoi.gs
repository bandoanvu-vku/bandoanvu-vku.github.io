/* ------------------------------------------------ phản hồi hệ thống */
/*
 * Mọi người dùng đã đăng nhập gửi góp ý về dashboard. Lưu ở tab "Phản hồi hệ thống" của sheet tài khoản,
 * có ghi họ tên / email / nhóm người gửi (lấy từ tài khoản, không tin trang gửi lên).
 * Trang quản lý ẩn tên mặc định, bấm "Xem người gửi" mới hiện.
 * Thành viên chỉ thấy góp ý của chính mình (kèm trả lời của Ban); quản lý thấy tất cả và cập nhật trạng thái / trả lời.
 */
const TAB_PH = 'Phản hồi hệ thống';
const COT_PH = ['Mã', 'Thời gian', 'Họ và tên', 'Email', 'Nhóm', 'Vai trò', 'Loại', 'Trang / tính năng', 'Mức độ hài lòng (1-5)',
  'Nội dung', 'Trạng thái', 'Trả lời của Ban', 'Xử lý bởi', 'Xử lý lúc'];
const LOAI_PH = ['Góp ý cải thiện', 'Báo lỗi', 'Đề xuất tính năng', 'Khác'];
const TT_PH = ['Mới', 'Đã xem', 'Đang xử lý', 'Đã xử lý', 'Không xử lý'];
const PH_TOI_DA_NGAY = 10;

function tabPhanHoi_() {
  const ss = ssTaiKhoan_();
  let s = ss.getSheetByName(TAB_PH);
  if (!s) {
    s = ss.insertSheet(TAB_PH);
    s.getRange(1, 1, 1, COT_PH.length).setValues([COT_PH]).setFontWeight('bold').setBackground('#1a56c4').setFontColor('#ffffff');
    s.setFrozenRows(1);
    [90, 130, 170, 200, 110, 90, 130, 150, 90, 480, 100, 300, 150, 130].forEach(function (w, i) { s.setColumnWidth(i + 1, w); });
    s.getRange(2, 10, Math.max(s.getMaxRows() - 1, 1), 1).setWrap(true);
  }
  return s;
}
/** Chặn công thức khi ghi chữ người dùng nhập vào sheet. */
function chuAnToan_(v) { const t = String(v == null ? '' : v); return /^[=+\-@]/.test(t) ? "'" + t : t; }

function docPhanHoi_(s) {
  if (s.getLastRow() < 2) return [];
  return s.getRange(2, 1, s.getLastRow() - 1, COT_PH.length).getValues().map(function (r, i) {
    return {
      dong: i + 2, ma: chuoi_(r[0]), luc: lucChu_(r[1]), ten: chuoi_(r[2]), email: chuoi_(r[3]).toLowerCase(), nhom: chuoi_(r[4]), vaiTro: chuoi_(r[5]),
      loai: chuoi_(r[6]), trang: chuoi_(r[7]), mucDo: Number(r[8]) || 0, noiDung: chuoi_(r[9]).replace(/^'/, ''), trangThai: chuoi_(r[10]) || 'Mới',
      traLoi: chuoi_(r[11]), xuLyBoi: chuoi_(r[12]), xuLyLuc: lucChu_(r[13])
    };
  }).filter(function (x) { return x.ma && x.noiDung; }).reverse();
}

function phanHoi_(nd) {
  const ds = docPhanHoi_(tabPhanHoi_());
  const cuaToi = ds.filter(function (x) { return x.email === nd.email; }).map(function (x) {
    return { ma: x.ma, luc: x.luc, loai: x.loai, trang: x.trang, mucDo: x.mucDo, noiDung: x.noiDung, trangThai: x.trangThai, traLoi: x.traLoi, xuLyLuc: x.xuLyLuc };
  });
  const o = { loai: LOAI_PH, trangThai: TT_PH, cuaToi: cuaToi, quanLy: nd.vaiTro === 'quanLy' && !nd.xemThu };
  if (o.quanLy) o.ds = ds.map(function (x) { const y = Object.assign({}, x); delete y.dong; return y; });
  return o;
}

function guiPhanHoi_(nd, req) {
  const noiDung = String(req.noiDung || '').trim();
  const loai = LOAI_PH.indexOf(req.loai) > -1 ? req.loai : 'Khác';
  const trang = String(req.trang || '').trim().slice(0, 100);
  const mucDo = Math.round(Number(req.mucDo) || 0);
  if (noiDung.length < 5) throw new Error('Nội dung góp ý quá ngắn.');
  if (noiDung.length > 3000) throw new Error('Nội dung góp ý tối đa 3000 ký tự.');
  if (mucDo && (mucDo < 1 || mucDo > 5)) throw new Error('Mức độ hài lòng từ 1 đến 5.');
  return voiKhoa_(function () {
    const s = tabPhanHoi_();
    const hom = bayGio_().ngay.split('-').reverse().join('/');
    const soHom = docPhanHoi_(s).filter(function (x) { return x.email === nd.email && x.luc.indexOf(hom) === 0; }).length;
    if (soHom >= PH_TOI_DA_NGAY) throw new Error('Bạn đã gửi ' + PH_TOI_DA_NGAY + ' góp ý hôm nay, vui lòng gửi tiếp vào ngày mai.');
    const nhom = (nd.nhom || []).map(function (m) { return TEN_NHOM[m] || m; }).join(', ');
    s.appendRow([maMoi_('PH'), new Date(), nd.ten, nd.email, nhom, nd.vaiTro === 'quanLy' ? 'Quản lý' : 'Thành viên',
      loai, chuAnToan_(trang), mucDo || '', chuAnToan_(noiDung), 'Mới', '', '', '']);
    s.getRange(s.getLastRow(), 2).setNumberFormat('dd/MM/yyyy HH:mm');
    return phanHoi_(nd);
  });
}

function xuLyPhanHoi_(nd, req) {
  canQuanLy_(nd, 'xử lý phản hồi');
  const tt = String(req.trangThai || '');
  if (TT_PH.indexOf(tt) === -1) throw new Error('Trạng thái không hợp lệ.');
  const traLoi = String(req.traLoi || '').trim().slice(0, 2000);
  return voiKhoa_(function () {
    const s = tabPhanHoi_();
    const x = docPhanHoi_(s).filter(function (y) { return y.ma === String(req.ma || ''); })[0];
    if (!x) throw new Error('Không tìm thấy góp ý này.');
    s.getRange(x.dong, 11, 1, 4).setValues([[tt, chuAnToan_(traLoi), nd.ten, new Date()]]);
    s.getRange(x.dong, 14).setNumberFormat('dd/MM/yyyy HH:mm');
    return phanHoi_(nd);
  });
}
