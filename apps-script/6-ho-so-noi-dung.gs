/* ------------------------------------------------ hồ sơ của tôi · tài liệu & biểu mẫu · cẩm nang · cài đặt */
/*
 * Hồ sơ: thêm các cột vào sheet tài khoản (nếu chưa có): Chức vụ, MSSV, Lớp, Số điện thoại.
 *   Thành viên tự sửa MSSV / Lớp / Số điện thoại; Chức vụ do quản lý ghi (trên sheet hoặc hồ sơ của chính quản lý).
 * Tài liệu & Cẩm nang: tab "Tài liệu" và "Cẩm nang" trong sheet tài khoản. Ai đăng nhập cũng đọc được, quản lý thêm / sửa / xoá.
 * Cài đặt: các dòng trong tab Cài đặt của sheet lịch trực (vị trí, bán kính, số buổi tối thiểu, ngày nghỉ). Chỉ quản lý.
 */
const HO_SO = {
  COT_THEM: ['Chức vụ', 'MSSV', 'Lớp', 'Số điện thoại'],
  TU_SUA: { mssv: 'MSSV', lop: 'Lớp', sdt: 'Số điện thoại' }
};
const COT_TL = ['Mã', 'Tiêu đề', 'Link', 'Danh mục', 'Mô tả', 'Cập nhật bởi', 'Cập nhật lúc'];
const COT_CN = ['Mã', 'Thứ tự', 'Tiêu đề', 'Nội dung', 'Cập nhật bởi', 'Cập nhật lúc'];

function ssTaiKhoan_() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_TAI_KHOAN');
  if (!id) throw new Error('Chưa có sheet tài khoản dashboard.');
  return SpreadsheetApp.openById(id);
}
function canQuanLy_(nd, viec) { if (nd.vaiTro !== 'quanLy') throw loiQuyen_('Chỉ quản lý mới ' + viec + '.'); }
function lucChu_(v) { return Object.prototype.toString.call(v) === '[object Date]' ? Utilities.formatDate(v, MUI_GIO, 'dd/MM/yyyy HH:mm') : chuoi_(v); }
function maMoi_(dau) { return dau + Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase(); }

/* ---------------- hồ sơ */

function damBaoCotHoSo_(s) {
  const tieuDe = s.getRange(1, 1, 1, Math.max(s.getLastColumn(), 1)).getValues()[0].map(chuanHoa_);
  const thieu = HO_SO.COT_THEM.filter(function (c) { return tieuDe.indexOf(chuanHoa_(c)) === -1; });
  if (!thieu.length) return tieuDe;
  const c0 = s.getLastColumn() + 1;
  s.getRange(1, c0, 1, thieu.length).setValues([thieu]).setFontWeight('bold').setBackground('#1a56c4').setFontColor('#ffffff');
  thieu.forEach(function (c, i) { s.setColumnWidth(c0 + i, c === 'Chức vụ' ? 150 : 120); });
  if (thieu.indexOf('Chức vụ') > -1) s.getRange(1, c0 + thieu.indexOf('Chức vụ')).setNote('Ví dụ: Trưởng ban, Phó ban, Trưởng nhóm, Thành viên. Hiện ở mục "Hồ sơ của tôi".');
  const sdt = thieu.indexOf('Số điện thoại'); if (sdt > -1) s.getRange(2, c0 + sdt, Math.max(s.getMaxRows() - 1, 1), 1).setNumberFormat('@');
  const mssv = thieu.indexOf('MSSV'); if (mssv > -1) s.getRange(2, c0 + mssv, Math.max(s.getMaxRows() - 1, 1), 1).setNumberFormat('@');
  return s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0].map(chuanHoa_);
}
/** Dòng của email trong sheet tài khoản (cột Email có thể ghi nhiều email). */
function dongTaiKhoan_(s, email) {
  if (s.getLastRow() < 2) return 0;
  const v = s.getRange(2, 3, s.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < v.length; i++) {
    if (String(v[i][0] || '').toLowerCase().split(/[,;\s]+/).indexOf(email) > -1) return i + 2;
  }
  return 0;
}
function hoSoCuaToi_(nd) {
  const s = ssTaiKhoan_().getSheets()[0];
  const tieuDe = voiKhoa_(function () { return damBaoCotHoSo_(s); });
  const d = dongTaiKhoan_(s, nd.email);
  const r = d ? s.getRange(d, 1, 1, tieuDe.length).getValues()[0] : [];
  const o = function (ten) { const i = tieuDe.indexOf(chuanHoa_(ten)); return i > -1 && d ? chuoi_(r[i]) : ''; };
  return {
    ten: nd.ten, email: nd.email, vaiTro: nd.vaiTro, nhom: nd.nhom,
    chucVu: o('Chức vụ'), mssv: o('MSSV'), lop: o('Lớp'), sdt: o('Số điện thoại'),
    suaChucVu: nd.vaiTro === 'quanLy'
  };
}
function luuHoSo_(nd, req) {
  return voiKhoa_(function () {
    const s = ssTaiKhoan_().getSheets()[0];
    const tieuDe = damBaoCotHoSo_(s);
    const d = dongTaiKhoan_(s, nd.email);
    if (!d) throw new Error('Không tìm thấy dòng của bạn trong sheet tài khoản.');
    const ghi = function (cot, v) { const i = tieuDe.indexOf(chuanHoa_(cot)); if (i > -1) s.getRange(d, i + 1).setValue(v); };
    const sach = function (v, n) { return chuoi_(v).replace(/[\r\n\t]+/g, ' ').slice(0, n); };
    const sdt = sach(req.sdt, 20);
    if (sdt && !/^[0-9 +().-]{8,20}$/.test(sdt)) throw new Error('Số điện thoại không hợp lệ.');
    const mssv = sach(req.mssv, 20);
    if (mssv && !/^[0-9A-Za-z]{4,20}$/.test(mssv)) throw new Error('MSSV chỉ gồm chữ và số.');
    ghi('MSSV', mssv); ghi('Lớp', sach(req.lop, 40)); ghi('Số điện thoại', sdt);
    if (nd.vaiTro === 'quanLy' && req.chucVu !== undefined) ghi('Chức vụ', sach(req.chucVu, 60));
    SpreadsheetApp.flush();
    return hoSoCuaToi_(nd);
  });
}

/* ---------------- tài liệu & biểu mẫu */

function tabNoiDung_(ten, cot, rong, mau) {
  const ss = ssTaiKhoan_();
  let s = ss.getSheetByName(ten);
  if (!s) {
    s = ss.insertSheet(ten);
    s.getRange(1, 1, 1, cot.length).setValues([cot]).setFontWeight('bold').setBackground('#1a56c4').setFontColor('#ffffff');
    s.setFrozenRows(1);
    rong.forEach(function (w, i) { s.setColumnWidth(i + 1, w); });
    if (mau && mau.length) s.getRange(2, 1, mau.length, cot.length).setValues(mau);
  }
  return s;
}
function docTaiLieu_() {
  const s = ssTaiKhoan_().getSheetByName('Tài liệu');
  if (!s || s.getLastRow() < 2) return [];
  return s.getRange(2, 1, s.getLastRow() - 1, COT_TL.length).getValues().map(function (r, i) {
    return { dong: i + 2, ma: chuoi_(r[0]), tieuDe: chuoi_(r[1]), link: chuoi_(r[2]), danhMuc: chuoi_(r[3]) || 'Khác', moTa: chuoi_(r[4]), boi: chuoi_(r[5]), luc: lucChu_(r[6]) };
  }).filter(function (x) { return x.ma && x.tieuDe; });
}
function taiLieu_(nd) { return { ds: docTaiLieu_().map(function (x) { delete x.dong; return x; }), quanLy: nd.vaiTro === 'quanLy' }; }
function luuTaiLieu_(nd, req) {
  canQuanLy_(nd, 'sửa được tài liệu');
  return voiKhoa_(function () {
    const s = tabNoiDung_('Tài liệu', COT_TL, [90, 280, 340, 140, 320, 150, 130]);
    const cu = req.ma ? docTaiLieu_().filter(function (x) { return x.ma === req.ma; })[0] : null;
    if (req.viec === 'xoa') { if (!cu) throw new Error('Không tìm thấy tài liệu.'); s.deleteRow(cu.dong); return taiLieu_(nd); }
    const tieuDe = chuoi_(req.tieuDe).slice(0, 150), link = chuoi_(req.link).slice(0, 1000);
    if (!tieuDe) throw new Error('Nhập tên tài liệu.');
    if (!/^https:\/\/[^\s"<>]+$/i.test(link)) throw new Error('Link phải bắt đầu bằng https:// (ví dụ link Google Drive).');
    const dong = [cu ? cu.ma : maMoi_('TL'), tieuDe, link, chuoi_(req.danhMuc).slice(0, 60) || 'Khác', chuoi_(req.moTa).slice(0, 300), nd.ten, new Date()];
    if (req.viec === 'sua') { if (!cu) throw new Error('Không tìm thấy tài liệu.'); s.getRange(cu.dong, 1, 1, COT_TL.length).setValues([dong]); }
    else s.appendRow(dong);
    return taiLieu_(nd);
  });
}

/* ---------------- cẩm nang */

function camNangMau_() {
  const d = new Date(), t = 'Dashboard';
  const muc = [
    ['Giới thiệu Ban Đoàn vụ', 'Ban Đoàn vụ gồm 4 nhóm: Truyền thông - Thông tin, Nghiệp vụ, Cơ sở dữ liệu - Cơ sở vật chất và Nội vụ.\nQuản lý Ban cập nhật phần này: nhiệm vụ của Ban, cơ cấu, người liên hệ.'],
    ['Trực văn phòng', 'Mỗi thành viên trực tối thiểu 2 buổi (6 giờ) mỗi tuần, từ thứ 2 đến thứ 6.\n- Buổi sáng 8h – 11h, buổi chiều 14h – 17h. Có thể đăng ký cả buổi hoặc tự chọn giờ trong khung 8h – 17h (tối thiểu 1 giờ).\n- Đăng ký lịch tuần sau từ thứ 6 đến 17h chủ nhật. Sau đó lịch khoá, quản lý xem lại và công bố.\n- Muốn đổi, huỷ hoặc thêm ca sau khi khoá: vào Lịch trực → "Tạo yêu cầu đổi lịch" để quản lý duyệt.'],
    ['Điểm danh', '- Đến văn phòng, mở mục Điểm danh trên điện thoại và bấm nút Điểm danh (cho phép trang dùng vị trí).\n- Điểm danh được từ 15 phút trước giờ bắt đầu ca, khi đứng trong bán kính văn phòng.\n- Không có ca mà vẫn đến trực: bấm "Điểm danh đột xuất", giờ trực được tính sau khi quản lý duyệt.'],
    ['Nhận việc và cập nhật tiến độ', '- Vào "Việc của nhóm" để xem nhiệm vụ, bấm Nhận phụ trách hoặc Tham gia hỗ trợ.\n- Làm xong thì đổi trạng thái và dán link sản phẩm ngay trên dashboard, dữ liệu ghi thẳng vào sheet của nhóm.\n- Trang chủ hiện các việc của bạn sắp đến hạn hoặc đã quá hạn.'],
    ['Sử dụng dashboard', '- Đăng nhập bằng tài khoản Google đã đăng ký với Ban. Chưa vào được thì nhờ quản lý thêm email vào sheet tài khoản.\n- Cập nhật Hồ sơ của tôi (MSSV, lớp, số điện thoại) để Ban tiện liên hệ.\n- Gặp lỗi hoặc cần thêm tính năng, báo quản lý Ban.']
  ];
  return muc.map(function (m, i) { return [maMoi_('CN'), i + 1, m[0], m[1], t, d]; });
}
function docCamNang_() {
  const s = ssTaiKhoan_().getSheetByName('Cẩm nang');
  if (!s || s.getLastRow() < 2) return [];
  return s.getRange(2, 1, s.getLastRow() - 1, COT_CN.length).getValues().map(function (r, i) {
    return { dong: i + 2, ma: chuoi_(r[0]), thuTu: Number(r[1]) || 999, tieuDe: chuoi_(r[2]), noiDung: String(r[3] == null ? '' : r[3]), boi: chuoi_(r[4]), luc: lucChu_(r[5]) };
  }).filter(function (x) { return x.ma && x.tieuDe; }).sort(function (a, b) { return a.thuTu - b.thuTu || a.dong - b.dong; });
}
function camNang_(nd) {
  if (!ssTaiKhoan_().getSheetByName('Cẩm nang')) voiKhoa_(function () { tabNoiDung_('Cẩm nang', COT_CN, [90, 70, 260, 620, 150, 130], camNangMau_()); });
  return { ds: docCamNang_().map(function (x) { delete x.dong; return x; }), quanLy: nd.vaiTro === 'quanLy' };
}
function luuCamNang_(nd, req) {
  canQuanLy_(nd, 'sửa được cẩm nang');
  return voiKhoa_(function () {
    const s = tabNoiDung_('Cẩm nang', COT_CN, [90, 70, 260, 620, 150, 130], camNangMau_());
    const ds = docCamNang_();
    const i = ds.findIndex(function (x) { return x.ma === req.ma; }), cu = ds[i];
    if (req.viec !== 'them' && !cu) throw new Error('Không tìm thấy mục này (có thể vừa bị xoá). Tải lại trang.');
    if (req.viec === 'xoa') { s.deleteRow(cu.dong); return camNang_(nd); }
    if (req.viec === 'len' || req.viec === 'xuong') {
      const j = req.viec === 'len' ? i - 1 : i + 1;
      if (j >= 0 && j < ds.length) {
        ds.splice(j, 0, ds.splice(i, 1)[0]);
        ds.forEach(function (x, k) { s.getRange(x.dong, 2).setValue(k + 1); });
      }
      return camNang_(nd);
    }
    const tieuDe = chuoi_(req.tieuDe).slice(0, 150), noiDung = String(req.noiDung || '').slice(0, 20000);
    if (!tieuDe) throw new Error('Nhập tiêu đề mục.');
    if (req.viec === 'sua') s.getRange(cu.dong, 3, 1, 4).setValues([[tieuDe, noiDung, nd.ten, new Date()]]);
    else s.appendRow([maMoi_('CN'), ds.length + 1, tieuDe, noiDung, nd.ten, new Date()]);
    return camNang_(nd);
  });
}

/* ---------------- cài đặt (quản lý) */

function caiDat_(nd) {
  canQuanLy_(nd, 'xem được cài đặt');
  const cd = caiDatTruc_(sheetTruc_());
  return { lat: cd.lat, lng: cd.lng, banKinh: cd.banKinh, soBuoi: cd.toiThieuGio / 3, ngayNghi: cd.ngayNghi.slice().sort(), homNay: bayGio_().ngay };
}
function luuCaiDat_(nd, req) {
  canQuanLy_(nd, 'sửa được cài đặt');
  return voiKhoa_(function () {
    const s = sheetTruc_().getSheetByName('Cài đặt');
    const nhan = s.getRange(1, 1, Math.max(s.getLastRow(), 1), 1).getValues().map(function (r) { return chuanHoa_(r[0]); });
    const o = function (tienTo, tenDay) {
      let d = nhan.findIndex(function (x) { return x.indexOf(chuanHoa_(tienTo)) === 0; }) + 1;
      if (!d) { s.appendRow([tenDay, '', '']); d = s.getLastRow(); nhan.push(chuanHoa_(tenDay)); }
      return s.getRange(d, 2);
    };
    if (req.lat !== undefined || req.lng !== undefined) {
      const lat = Number(req.lat), lng = Number(req.lng);
      if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new Error('Toạ độ không hợp lệ.');
      o('Vĩ độ', 'Vĩ độ văn phòng').setValue(Math.round(lat * 1e6) / 1e6);
      o('Kinh độ', 'Kinh độ văn phòng').setValue(Math.round(lng * 1e6) / 1e6);
    }
    if (req.banKinh !== undefined) {
      const bk = Math.round(Number(req.banKinh));
      if (!(bk >= 30 && bk <= 2000)) throw new Error('Bán kính từ 30 đến 2000 m.');
      o('Bán kính', 'Bán kính điểm danh (m)').setValue(bk);
    }
    if (req.soBuoi !== undefined) {
      const sb = Number(req.soBuoi);
      if (!(sb >= 0 && sb <= 10) || Math.round(sb * 2) !== sb * 2) throw new Error('Số buổi tối thiểu từ 0 đến 10 (có thể lẻ nửa buổi).');
      o('Số buổi tối thiểu', 'Số buổi tối thiểu / tuần').setValue(sb);
    }
    if (req.ngayNghi !== undefined) {
      const ds = (req.ngayNghi || []).filter(function (x) { return /^\d{4}-\d{2}-\d{2}$/.test(String(x)); })
        .filter(function (x, i, a) { return a.indexOf(x) === i; }).sort().slice(0, 200);
      const oNghi = o('Ngày nghỉ', 'Ngày nghỉ (không trực)'); oNghi.setNumberFormat('@');
      oNghi.setValue(ds.map(function (x) { const p = x.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }).join(', '));
    }
    SpreadsheetApp.flush();
    return caiDat_(nd);
  });
}
