/* ------------------------------------------------ hoạt động riêng của nhóm: Chủ nhật xanh, kiểm kê CSVC, họp tháng */
/*
 * Lưu trong sheet lịch trực (các tab: "CN xanh", "CN xanh - xin vắng", "Kiểm kê", "Họp nhóm").
 * Người phụ trách chính của một mảng = cột "Phụ trách chính" ở tab "Mảng công việc" trong sheet của nhóm.
 *
 * Chủ nhật xanh (nhóm CSDL - CSVC): mỗi Chủ nhật 2 người.
 *   - Thành viên tự đăng ký / huỷ trong khung đăng ký lịch trực của tuần đó (00:00 thứ 6 → 17:00 CN tuần trước).
 *   - Phụ trách chính (và quản lý) xếp / bỏ người bất kỳ lúc nào trước ngày đó.
 *   - Đã khoá mà muốn vắng: gửi "xin vắng", bắt buộc chọn người trực thay → phụ trách chính (hoặc quản lý) duyệt là đổi người.
 * Kiểm kê CSVC: hằng tuần / hằng tháng / giữa năm - cuối năm; đăng ký → duyệt 2 cấp → báo cáo (xem phần Kiểm kê bên dưới).
 * Họp tháng (cả 4 nhóm): trưởng nhóm / thành viên đại diện đăng ký ngày, giờ, địa điểm, nội dung; quản lý xem.
 */
const CN_XANH = { NHOM: 'csdl-csvc', KHOA: ['chủ nhật xanh', 'cn xanh'], SO_NGUOI: 2, TUAN_TRUOC: 4, TUAN_TOI: 6 };
const KIEM_KE = { NHOM: 'csdl-csvc', KHOA: ['csvc', 'cơ sở vật chất'], TUAN_TRUOC: 4, TUAN_TOI: 4, THANG_TRUOC: 3, THANG_TOI: 2, HAN_NGAY: 5 };
const COT_CNX = ['Ngày', 'Họ và tên', 'Email', 'Vai trò', 'Trạng thái', 'Ghi lúc', 'Ghi bởi', 'Ghi chú'];
const COT_CNX_YC = ['Mã', 'Gửi lúc', 'Ngày', 'Người xin vắng', 'Email', 'Người trực thay', 'Lý do', 'Trạng thái', 'Người duyệt', 'Duyệt lúc', 'Ghi chú duyệt'];
const COT_KK = ['Kỳ', 'Ngày kiểm kê', 'Phụ trách', 'Thành viên thực hiện', 'Trạng thái', 'Ghi chú / biên bản', 'Cập nhật bởi', 'Cập nhật lúc'];
const COT_HOP = ['Nhóm', 'Tháng', 'Ngày', 'Giờ', 'Địa điểm', 'Nội dung', 'Người đăng ký', 'Đăng ký lúc'];
const TT_CNX = { XEP: 'Đã xếp', HUY: 'Đã huỷ', THAY: 'Đã thay' };
// Đầu việc chuẩn bị cho mỗi Chủ nhật xanh (tab "CN xanh - chuẩn bị": mỗi dòng = 1 đầu việc của 1 CN)
const VIEC_CNX = ['Viết thông báo', 'Liên hệ khu vực trực', 'Tạo sheet điểm danh', 'Giám sát thực hiện'];
const COT_CNX_VIEC = ['Ngày', 'Đầu việc', 'Người làm', 'Trạng thái', 'Link / ghi chú', 'Cập nhật bởi', 'Cập nhật lúc'];

/* ---------------- tiện ích */

function dmy_(iso) { const p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
function tachTen_(s) { return chuoi_(s).split(/[,;\n]+/).map(function (x) { return chuoi_(x).replace(/\s+/g, ' '); }).filter(String); }
function tabHd_(ss, ten, cot, rong, cotChu) {
  const s = damBaoTab_(ss, ten, cot, rong);
  (cotChu || []).forEach(function (c) { s.getRange(2, c, Math.max(s.getMaxRows() - 1, 1), 1).setNumberFormat('@'); });
  return s;
}
function docTabHd_(ss, ten, soCot) {
  const s = ss.getSheetByName(ten);
  if (!s || s.getLastRow() < 2) return [];
  return s.getRange(2, 1, s.getLastRow() - 1, soCot).getValues().map(function (r, i) { r.dong = i + 2; return r; });
}
/** Mảng công việc của nhóm có tên chứa một trong các khoá → { d (dữ liệu nhóm), mang, phuTrach: [tên] }. */
function mangNhom_(ma, khoa) {
  const d = layNhom(ma, false);
  const m = d.mang.filter(function (x) { const t = chuanHoa_(x.ten); return khoa.some(function (k) { return t.indexOf(k) > -1; }); })[0] || null;
  return { d: d, mang: m, phuTrach: m ? tachTen_(m.chinh) : [] };
}
function laPhuTrach_(nd, ctx) { return nd.vaiTro === 'quanLy' || ctx.phuTrach.indexOf(nd.ten) > -1; }
function emailTheoTen_(ten) {
  const bang = bangTaiKhoan_();
  return Object.keys(bang).filter(function (e) { return bang[e].ten === ten; })[0] || '';
}
function lucChu2_(v) { return Object.prototype.toString.call(v) === '[object Date]' ? Utilities.formatDate(v, MUI_GIO, 'dd/MM HH:mm') : chuoi_(v); }

/* ---------------- Chủ nhật xanh */

function trangThaiCnx_(cn, now) {
  const t0 = themNgay_(cn, -6);
  const mo = themNgay_(t0, -3) + ' 00:00', dong = themNgay_(t0, -1) + ' ' + TRUC.DONG_GIO, bg = now.ngay + ' ' + now.gio;
  return { ma: bg < mo ? 'chuaMo' : bg < dong ? 'mo' : 'khoa', mo: mo, dong: dong };
}
function docCnx_(ss) {
  return docTabHd_(ss, 'CN xanh', COT_CNX.length).map(function (r) {
    return { dong: r.dong, ngay: ngayISO_(r[0], MUI_GIO), ten: chuoi_(r[1]), email: chuoi_(r[2]).toLowerCase(), vaiTro: chuoi_(r[3]), trangThai: chuoi_(r[4]), ghiChu: chuoi_(r[7]) };
  }).filter(function (x) { return x.ngay && x.ten; });
}
function docCnxYc_(ss) {
  return docTabHd_(ss, 'CN xanh - xin vắng', COT_CNX_YC.length).map(function (r) {
    return { dong: r.dong, id: chuoi_(r[0]), guiLuc: lucChu2_(r[1]), ngay: ngayISO_(r[2], MUI_GIO), ten: chuoi_(r[3]), email: chuoi_(r[4]).toLowerCase(),
      thay: chuoi_(r[5]), lyDo: chuoi_(r[6]), trangThai: chuoi_(r[7]) || TT.CHO, nguoiDuyet: chuoi_(r[8]), duyetLuc: lucChu2_(r[9]), ghiChuDuyet: chuoi_(r[10]) };
  }).filter(function (x) { return x.id; });
}
function cnXanh_(nd) {
  canNhom_(nd, CN_XANH.NHOM);
  const ctx = mangNhom_(CN_XANH.NHOM, CN_XANH.KHOA), laPT = laPhuTrach_(nd, ctx);
  const ss = sheetTruc_(), now = bayGio_();
  const ds = docCnx_(ss).filter(function (x) { return x.trangThai === TT_CNX.XEP; });
  const cn0 = themNgay_(dauTuan_(now.ngay), 6), cacCn = [];
  for (let i = -CN_XANH.TUAN_TRUOC; i <= CN_XANH.TUAN_TOI; i++) cacCn.push(themNgay_(cn0, 7 * i));
  const yc = docCnxYc_(ss), viec = docCnxViec_(ss);
  return {
    soNguoi: CN_XANH.SO_NGUOI, homNay: now.ngay, toi: nd.ten, laPhuTrach: laPT, laThanhVien: ctx.d.thanhVien.indexOf(nd.ten) > -1,
    mang: ctx.mang ? ctx.mang.ten : '', phuTrach: ctx.phuTrach, thanhVien: ctx.d.thanhVien,
    chuNhat: cacCn.map(function (n) {
      const st = trangThaiCnx_(n, now);
      return { ngay: n, trangThai: st.ma, mo: st.mo, dong: st.dong, qua: n < now.ngay,
        nguoi: ds.filter(function (x) { return x.ngay === n; }).map(function (x) { return { ten: x.ten, vaiTro: x.vaiTro, ghiChu: x.ghiChu }; }),
        viec: VIEC_CNX.map(function (t, i) {
          const v = viec.filter(function (y) { return y.ngay === n && y.viec === t; }).slice(-1)[0];
          return v ? { i: i, ten: t, nguoi: v.nguoi, xong: v.trangThai === 'Xong', ghiChu: v.ghiChu, boi: v.boi, luc: v.luc } : { i: i, ten: t, nguoi: '', xong: false, ghiChu: '' };
        }) };
    }),
    yeuCau: yc.filter(function (y) { return laPT || y.ten === nd.ten || y.thay === nd.ten; })
      .sort(function (a, b) { return (a.trangThai === TT.CHO ? 0 : 1) - (b.trangThai === TT.CHO ? 0 : 1) || b.dong - a.dong; }).slice(0, 30)
      .map(function (y) { const o = Object.assign({}, y); delete o.dong; delete o.email; return o; })
  };
}
function docCnxViec_(ss) {
  return docTabHd_(ss, 'CN xanh - chuẩn bị', COT_CNX_VIEC.length).map(function (r) {
    return { dong: r.dong, ngay: ngayISO_(r[0], MUI_GIO), viec: chuoi_(r[1]), nguoi: chuoi_(r[2]), trangThai: chuoi_(r[3]), ghiChu: chuoi_(r[4]), boi: chuoi_(r[5]), luc: lucChu2_(r[6]) };
  }).filter(function (x) { return x.ngay && x.viec; });
}
/** Đầu việc chuẩn bị CN xanh: nhận / giao / bỏ nhận / xong / mở lại. */
function luuViecCnXanh_(nd, req) {
  canNhom_(nd, CN_XANH.NHOM);
  return voiKhoa_(function () {
    const ctx = mangNhom_(CN_XANH.NHOM, CN_XANH.KHOA), laPT = laPhuTrach_(nd, ctx);
    const ss = sheetTruc_(), now = bayGio_(), ngay = String(req.ngay || ''), ten = VIEC_CNX[Number(req.i)];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay) || thuCua_(ngay) !== 7) throw new Error('Ngày không phải Chủ nhật.');
    if (!ten) throw new Error('Đầu việc không hợp lệ.');
    if (ngay < themNgay_(now.ngay, -14)) throw new Error('Chủ nhật này đã qua quá 2 tuần, không sửa được nữa.');
    const s = tabHd_(ss, 'CN xanh - chuẩn bị', COT_CNX_VIEC, [100, 170, 180, 90, 320, 160, 130], [1]);
    const cu = docCnxViec_(ss).filter(function (y) { return y.ngay === ngay && y.viec === ten; }).slice(-1)[0];
    const v = cu ? { nguoi: cu.nguoi, tt: cu.trangThai, gc: cu.ghiChu } : { nguoi: '', tt: '', gc: '' };
    const laTV = ctx.d.thanhVien.indexOf(nd.ten) > -1, gc = chuoi_(req.ghiChu).slice(0, 500);
    if (req.viec === 'nhan') {
      if (!laTV) throw loiQuyen_('Chỉ thành viên nhóm mới nhận việc được.');
      if (v.nguoi && v.nguoi !== nd.ten) throw new Error('Việc này ' + v.nguoi + ' đã nhận.');
      v.nguoi = nd.ten;
    } else if (req.viec === 'giao') {
      if (!laPT) throw loiQuyen_('Chỉ phụ trách chính mảng Chủ nhật xanh (hoặc quản lý) mới giao việc.');
      const t = chuoi_(req.ten);
      if (t && ctx.d.thanhVien.indexOf(t) === -1) throw new Error(t + ' không có trong danh sách thành viên nhóm.');
      v.nguoi = t;
    } else if (req.viec === 'boNhan') {
      if (v.nguoi !== nd.ten && !laPT) throw loiQuyen_('Bạn không phải người làm việc này.');
      if (v.tt === 'Xong') throw new Error('Việc đã xong, mở lại trước khi bỏ nhận.');
      v.nguoi = '';
    } else if (req.viec === 'xong') {
      if (v.nguoi !== nd.ten && !laPT) throw loiQuyen_('Chỉ người làm việc này hoặc phụ trách chính mới đánh dấu xong.');
      if (!v.nguoi) v.nguoi = nd.ten;
      if (Number(req.i) === 2 && !/https?:\/\//.test(gc || v.gc)) throw new Error('Dán link sheet điểm danh trước khi đánh dấu xong.');
      v.tt = 'Xong'; if (gc) v.gc = gc;
    } else if (req.viec === 'moLai') {
      if (v.nguoi !== nd.ten && !laPT) throw loiQuyen_('Chỉ người làm việc này hoặc phụ trách chính mới mở lại.');
      v.tt = '';
    } else throw new Error('Yêu cầu không hợp lệ.');
    const dong = [dmy_(ngay), ten, v.nguoi, v.tt, v.gc, nd.ten, new Date()];
    if (cu) s.getRange(cu.dong, 1, 1, dong.length).setValues([dong]); else s.appendRow(dong);
    SpreadsheetApp.flush();
    return cnXanh_(nd);
  });
}
function kiemNgayCn_(ngay, now) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(ngay || '')) || thuCua_(ngay) !== 7) throw new Error('Ngày không phải Chủ nhật.');
  if (ngay < now.ngay) throw new Error('Chủ nhật này đã qua.');
}
function luuCnXanh_(nd, req) {
  canNhom_(nd, CN_XANH.NHOM);
  return voiKhoa_(function () {
    const ctx = mangNhom_(CN_XANH.NHOM, CN_XANH.KHOA), laPT = laPhuTrach_(nd, ctx);
    const ss = sheetTruc_(), now = bayGio_(), ngay = String(req.ngay || '');
    kiemNgayCn_(ngay, now);
    const s = tabHd_(ss, 'CN xanh', COT_CNX, [100, 200, 200, 100, 90, 130, 160, 260], [1]);
    const tren = docCnx_(ss).filter(function (x) { return x.ngay === ngay && x.trangThai === TT_CNX.XEP; });
    const st = trangThaiCnx_(ngay, now).ma;
    const them = function (ten, vaiTro, ghiChu) {
      if (ctx.d.thanhVien.indexOf(ten) === -1) throw new Error(ten + ' không có trong danh sách thành viên nhóm.');
      if (tren.some(function (x) { return x.ten === ten; })) throw new Error(ten + ' đã có tên trong Chủ nhật này.');
      if (tren.length >= CN_XANH.SO_NGUOI) throw new Error('Chủ nhật này đã đủ ' + CN_XANH.SO_NGUOI + ' người.');
      s.appendRow([dmy_(ngay), ten, ten === nd.ten ? nd.email : emailTheoTen_(ten), vaiTro, TT_CNX.XEP, new Date(), nd.ten, ghiChu || '']);
    };
    if (req.viec === 'dangKy') {
      if (st !== 'mo') throw new Error(st === 'chuaMo' ? 'Chưa mở đăng ký Chủ nhật này (mở cùng lúc đăng ký lịch trực tuần đó).'
        : 'Đã hết hạn đăng ký Chủ nhật này. Nhờ phụ trách chính xếp giúp.');
      them(nd.ten, 'Đăng ký');
    } else if (req.viec === 'huy') {
      const x = tren.filter(function (y) { return y.ten === nd.ten; })[0];
      if (!x) throw new Error('Bạn không có tên trong Chủ nhật này.');
      if (st !== 'mo' && !laPT) throw new Error('Đã khoá đăng ký. Muốn vắng thì gửi "Xin vắng" và chọn người trực thay.');
      s.getRange(x.dong, 5).setValue(TT_CNX.HUY); s.getRange(x.dong, 8).setValue('Tự huỷ lúc đang mở đăng ký');
    } else if (req.viec === 'xep') {
      if (!laPT) throw loiQuyen_('Chỉ phụ trách chính mảng Chủ nhật xanh (hoặc quản lý) mới xếp người được.');
      them(chuoi_(req.ten), 'Phân công');
    } else if (req.viec === 'bo') {
      if (!laPT) throw loiQuyen_('Chỉ phụ trách chính mảng Chủ nhật xanh (hoặc quản lý) mới bỏ người được.');
      const x = tren.filter(function (y) { return y.ten === chuoi_(req.ten); })[0];
      if (!x) throw new Error('Không tìm thấy người này trong Chủ nhật đó.');
      s.getRange(x.dong, 5).setValue(TT_CNX.HUY); s.getRange(x.dong, 8).setValue('Bỏ bởi ' + nd.ten);
    } else throw new Error('Yêu cầu không hợp lệ.');
    SpreadsheetApp.flush();
    return cnXanh_(nd);
  });
}
function xinVangCnXanh_(nd, req) {
  canNhom_(nd, CN_XANH.NHOM);
  return voiKhoa_(function () {
    const ctx = mangNhom_(CN_XANH.NHOM, CN_XANH.KHOA), ss = sheetTruc_(), now = bayGio_(), ngay = String(req.ngay || '');
    kiemNgayCn_(ngay, now);
    const tren = docCnx_(ss).filter(function (x) { return x.ngay === ngay && x.trangThai === TT_CNX.XEP; });
    if (!tren.some(function (x) { return x.ten === nd.ten; })) throw new Error('Bạn không có tên trong Chủ nhật này.');
    const thay = chuoi_(req.thay), lyDo = chuoi_(req.lyDo).slice(0, 300);
    if (!thay) throw new Error('Chọn người trực thay.');
    if (thay === nd.ten) throw new Error('Người trực thay phải là người khác.');
    if (ctx.d.thanhVien.indexOf(thay) === -1) throw new Error(thay + ' không có trong danh sách thành viên nhóm.');
    if (tren.some(function (x) { return x.ten === thay; })) throw new Error(thay + ' đã có tên trong Chủ nhật này.');
    if (!lyDo) throw new Error('Ghi lý do xin vắng.');
    if (docCnxYc_(ss).some(function (y) { return y.ngay === ngay && y.ten === nd.ten && y.trangThai === TT.CHO; })) throw new Error('Bạn đã gửi xin vắng Chủ nhật này, đang chờ duyệt.');
    const s = tabHd_(ss, 'CN xanh - xin vắng', COT_CNX_YC, [90, 130, 100, 190, 190, 190, 260, 100, 160, 130, 220], [3]);
    s.appendRow([maMoi_('CX'), new Date(), dmy_(ngay), nd.ten, nd.email, thay, lyDo, TT.CHO, '', '', '']);
    SpreadsheetApp.flush();
    return cnXanh_(nd);
  });
}
function rutXinVangCnXanh_(nd, req) {
  canNhom_(nd, CN_XANH.NHOM);
  return voiKhoa_(function () {
    const ss = sheetTruc_(), y = docCnxYc_(ss).filter(function (x) { return x.id === req.id && x.ten === nd.ten; })[0];
    if (!y) throw new Error('Không tìm thấy yêu cầu.');
    if (y.trangThai !== TT.CHO) throw new Error('Yêu cầu đã được xử lý.');
    ss.getSheetByName('CN xanh - xin vắng').getRange(y.dong, 8).setValue(TT.HUY);
    return cnXanh_(nd);
  });
}
function duyetCnXanh_(nd, req) {
  canNhom_(nd, CN_XANH.NHOM);
  return voiKhoa_(function () {
    const ctx = mangNhom_(CN_XANH.NHOM, CN_XANH.KHOA);
    if (!laPhuTrach_(nd, ctx)) throw loiQuyen_('Chỉ phụ trách chính mảng Chủ nhật xanh (hoặc quản lý) mới duyệt được.');
    const ss = sheetTruc_(), y = docCnxYc_(ss).filter(function (x) { return x.id === req.id; })[0];
    if (!y) throw new Error('Không tìm thấy yêu cầu.');
    if (y.trangThai !== TT.CHO) throw new Error('Yêu cầu này đã được xử lý.');
    const sy = ss.getSheetByName('CN xanh - xin vắng'), ghiChu = chuoi_(req.ghiChu).slice(0, 200);
    const ket = function (tt) { sy.getRange(y.dong, 8, 1, 4).setValues([[tt, nd.ten, new Date(), ghiChu]]); };
    if (req.dongY !== true) ket(TT.TU_CHOI);
    else {
      const tren = docCnx_(ss).filter(function (x) { return x.ngay === y.ngay && x.trangThai === TT_CNX.XEP; });
      const goc = tren.filter(function (x) { return x.ten === y.ten; })[0];
      if (!goc) throw new Error(y.ten + ' không còn tên trong Chủ nhật này. Hãy từ chối yêu cầu.');
      if (tren.some(function (x) { return x.ten === y.thay; })) throw new Error(y.thay + ' đã có tên trong Chủ nhật này. Hãy từ chối yêu cầu.');
      const s = ss.getSheetByName('CN xanh');
      s.getRange(goc.dong, 5).setValue(TT_CNX.THAY); s.getRange(goc.dong, 8).setValue(y.thay + ' trực thay (yêu cầu ' + y.id + ')');
      s.appendRow([dmy_(y.ngay), y.thay, emailTheoTen_(y.thay), 'Trực thay', TT_CNX.XEP, new Date(), nd.ten, 'Trực thay cho ' + y.ten + ' (yêu cầu ' + y.id + ')']);
      ket(TT.DUYET);
    }
    SpreadsheetApp.flush();
    return req.ve === 'pheDuyet' ? pheDuyet_(nd, {}) : cnXanh_(nd);
  });
}
/** Xin vắng Chủ nhật xanh đang chờ — để quản lý thấy ở mục Phê duyệt. */
function choDuyetCnXanh_() {
  try {
    const ss = sheetTruc_();
    return docCnxYc_(ss).filter(function (y) { return y.trangThai === TT.CHO; }).map(function (y) {
      return { kieu: 'cnXanh', id: y.id, ten: y.ten, loai: 'Xin vắng Chủ nhật xanh', ngay: y.ngay, thay: y.thay, lyDo: y.lyDo, guiLuc: y.guiLuc, trangThai: y.trangThai };
    });
  } catch (e) { return []; }
}
function daXuLyCnXanh_() {
  try {
    return docCnxYc_(sheetTruc_()).filter(function (y) { return y.trangThai === TT.DUYET || y.trangThai === TT.TU_CHOI; }).slice(-15).reverse().map(function (y) {
      return { kieu: 'cnXanh', id: y.id, ten: y.ten, loai: 'Xin vắng Chủ nhật xanh', ngay: y.ngay, thay: y.thay, lyDo: y.lyDo, guiLuc: y.guiLuc,
        trangThai: y.trangThai, nguoiDuyet: y.nguoiDuyet, duyetLuc: y.duyetLuc, ghiChuDuyet: y.ghiChuDuyet };
    });
  } catch (e) { return []; }
}

/* ---------------- Kiểm kê CSVC */
/*
 * Kỳ (cột A): "Tuần YYYY-MM-DD" (thứ 2 đầu tuần; kiểm kê thứ 5 hoặc thứ 6 — tài sản biến động / dùng thường xuyên)
 *   · "YYYY-MM" (hằng tháng, tuần cuối tháng = 7 ngày cuối — toàn bộ tài sản)
 *   · "Giữa năm YYYY" (15 – 31/5) · "Cuối năm YYYY" (15 – 31/12) — biên bản tài sản cố định.
 * Quy trình: phụ trách / trưởng nhóm đăng ký ngày + người thực hiện → duyệt 2 cấp (trưởng nhóm → quản lý)
 *   → đến ngày, người thực hiện nộp báo cáo: link biên bản (sheet) + số liệu (tổng, tốt, hỏng, mất, mới thêm, thanh lý) + tóm tắt biến động.
 * Dữ liệu cũ: "Đã lên lịch" coi như Đã duyệt, "Đã kiểm kê" coi như Đã báo cáo.
 */
const TT_KK = { BAO_CAO: 'Đã báo cáo', CU_LICH: 'Đã lên lịch', CU_XONG: 'Đã kiểm kê' };
const SO_KK = ['tong', 'tot', 'hong', 'mat', 'moi', 'thanhLy'];
function themThang_(ym, n) { const p = ym.split('-').map(Number); const d = new Date(Date.UTC(p[0], p[1] - 1 + n, 1)); return d.toISOString().slice(0, 7); }
function cuoiThang_(ym) { const p = ym.split('-').map(Number); return ym + '-' + ('0' + new Date(Date.UTC(p[0], p[1], 0)).getUTCDate()).slice(-2); }
/** Mã kỳ → { loai, ky, nhan, tu, den (khoảng của kỳ), chonTu, chonDen (khoảng được chọn ngày), luu } hoặc null. */
function kyKk_(ky) {
  ky = chuoi_(ky);
  let m = /^Tuần (\d{4}-\d{2}-\d{2})$/.exec(ky);
  if (m && thuCua_(m[1]) === 1) { const den = themNgay_(m[1], 6); return { loai: 'tuan', ky: ky, tu: m[1], den: den, chonTu: themNgay_(m[1], 3), chonDen: themNgay_(m[1], 4), nhan: 'Tuần ' + dmy_(m[1]).slice(0, 5) + ' – ' + dmy_(den), luu: 'thứ 5 hoặc thứ 6' }; }
  m = /^(\d{4})-(\d{2})$/.exec(ky);
  if (m && +m[2] >= 1 && +m[2] <= 12) { const den = cuoiThang_(ky); return { loai: 'thang', ky: ky, tu: ky + '-01', den: den, chonTu: themNgay_(den, -6), chonDen: den, nhan: 'Tháng ' + (+m[2]) + '/' + m[1], luu: 'tuần cuối tháng (7 ngày cuối)' }; }
  m = /^(Giữa|Cuối) năm (\d{4})$/.exec(ky);
  if (m) { const th = m[1] === 'Giữa' ? '05' : '12', y = m[2]; return { loai: 'nam', ky: ky, tu: y + '-' + th + '-15', den: y + '-' + th + '-31', chonTu: y + '-' + th + '-15', chonDen: y + '-' + th + '-31', nhan: 'Đợt ' + m[1].toLowerCase() + ' năm ' + y, luu: 'từ 15 đến 31/' + th }; }
  return null;
}
const COT_KK2 = COT_KK.concat(['Người đăng ký', 'Trưởng nhóm duyệt', 'Quản lý duyệt', 'Ghi chú duyệt', 'Link biên bản', 'Tổng số', 'Tốt', 'Hỏng', 'Mất', 'Mới thêm', 'Thanh lý', 'Tóm tắt biến động', 'Đề xuất', 'Báo cáo bởi', 'Báo cáo lúc']);
function docKk_(ss) {
  return docTabHd_(ss, 'Kiểm kê', COT_KK2.length).map(function (r) {
    const raw = Object.prototype.toString.call(r[0]) === '[object Date]' ? ngayISO_(r[0], MUI_GIO).slice(0, 7) : chuoi_(r[0]);
    let tt = chuoi_(r[4]);
    if (tt === TT_KK.CU_LICH) tt = TT2.DUYET; else if (tt === TT_KK.CU_XONG) tt = TT_KK.BAO_CAO;
    const so = function (v) { return v === '' || v === null ? null : Number(v); };
    return { dong: r.dong, ky: raw, ngay: ngayISO_(r[1], MUI_GIO) || '', phuTrach: chuoi_(r[2]), thucHien: tachTen_(r[3]), trangThai: tt, ghiChu: chuoi_(r[5]), boi: chuoi_(r[6]), luc: lucChu2_(r[7]),
      nguoiDangKy: chuoi_(r[8]) || chuoi_(r[2]), tnDuyet: chuoi_(r[9]), qlDuyet: chuoi_(r[10]), ghiChuDuyet: chuoi_(r[11]), bienBan: chuoi_(r[12]),
      so: { tong: so(r[13]), tot: so(r[14]), hong: so(r[15]), mat: so(r[16]), moi: so(r[17]), thanhLy: so(r[18]) }, bienDong: chuoi_(r[19]), deXuat: chuoi_(r[20]), baoCaoBoi: chuoi_(r[21]), baoCaoLuc: lucChu2_(r[22]) };
  }).filter(function (x) { return kyKk_(x.ky); });
}
function kiemKe_(nd) {
  canNhom_(nd, KIEM_KE.NHOM);
  const ctx = mangNhom_(KIEM_KE.NHOM, KIEM_KE.KHOA), ss = sheetTruc_(), now = bayGio_(), ds = docKk_(ss), v = vaiDuyet_(nd, KIEM_KE.NHOM);
  const t2 = dauTuan_(now.ngay), t0 = now.ngay.slice(0, 7), y = +now.ngay.slice(0, 4);
  const tao = function (dsKy) {
    return dsKy.map(function (k) {
      const kk = kyKk_(k), x = ds.filter(function (z) { return z.ky === k; }).slice(-1)[0];
      const o = x ? boDong_(x) : { ky: k, trangThai: 'Chưa đăng ký', thucHien: [], ngay: '', so: {} };
      o.nhan = kk.nhan; o.tu = kk.tu; o.den = kk.den; o.chonTu = kk.chonTu; o.chonDen = kk.chonDen; o.luu = kk.luu;
      o.nay = kk.tu <= now.ngay && now.ngay <= kk.den; o.qua = kk.den < now.ngay;
      return o;
    });
  };
  const tuan = [], thang = [], dot = [];
  for (let i = KIEM_KE.TUAN_TOI; i >= -KIEM_KE.TUAN_TRUOC; i--) tuan.push('Tuần ' + themNgay_(t2, 7 * i));
  for (let i = KIEM_KE.THANG_TOI; i >= -KIEM_KE.THANG_TRUOC; i--) thang.push(themThang_(t0, i));
  [y + 1, y, y - 1].forEach(function (n) { dot.push('Cuối năm ' + n, 'Giữa năm ' + n); });
  const dotGan = dot.filter(function (k) { const kk = kyKk_(k); return kk.den >= themNgay_(now.ngay, -400) && kk.tu <= themNgay_(now.ngay, 400); });
  const bieuDo = ds.filter(function (x) { return x.trangThai === TT_KK.BAO_CAO && x.so.tong !== null; }).map(function (x) {
    const kk = kyKk_(x.ky); return { ky: x.ky, loai: kk.loai, nhan: kk.nhan, ngay: x.ngay || kk.tu, so: x.so };
  }).sort(function (a, b) { return a.ngay < b.ngay ? -1 : 1; });
  return {
    homNay: now.ngay, toi: nd.ten, laPhuTrach: laPhuTrach_(nd, ctx), laTN: v.tn, laQL: v.ql, coTN: v.coTN, truongNhom: v.dsTN,
    mang: ctx.mang ? ctx.mang.ten : '', phuTrach: ctx.phuTrach, thanhVien: ctx.d.thanhVien, lienKet: (function () { const l = lienKet_(); return { bbTuanThang: l.bbTuanThang, bbNam: l.bbNam }; })(),
    loai: [{ ma: 'tuan', ten: 'Hằng tuần', ky: tao(tuan) }, { ma: 'thang', ten: 'Hằng tháng', ky: tao(thang) }, { ma: 'nam', ten: 'Giữa năm / cuối năm', ky: tao(dotGan) }],
    bieuDo: bieuDo
  };
}
function luuKiemKe_(nd, req) {
  canNhom_(nd, KIEM_KE.NHOM);
  return voiKhoa_(function () {
    const ctx = mangNhom_(KIEM_KE.NHOM, KIEM_KE.KHOA), v = vaiDuyet_(nd, KIEM_KE.NHOM), ss = sheetTruc_(), now = bayGio_();
    const laPT = laPhuTrach_(nd, ctx) || v.tn;
    const kk = kyKk_(req.ky || req.thang);
    if (!kk) throw new Error('Kỳ kiểm kê không hợp lệ.');
    const s = tabHd_(ss, 'Kiểm kê', COT_KK2, [150, 110, 180, 300, 150, 320, 160, 130, 170, 230, 230, 240, 260, 80, 70, 70, 70, 80, 80, 300, 260, 160, 130], [1, 2, 13]);
    const cu = docKk_(ss).filter(function (y) { return y.ky === kk.ky; }).slice(-1)[0];
    const ghiChu = chuoi_(req.ghiChu).slice(0, 500);
    const ghi = function (cot, gt) { s.getRange(cu.dong, cot, 1, gt.length).setValues([gt]); };
    if (req.viec === 'dangKy') {
      if (!laPT) throw loiQuyen_('Chỉ phụ trách chính mảng CSVC, trưởng nhóm (hoặc quản lý) mới đăng ký lịch kiểm kê.');
      if (cu && cu.trangThai === TT_KK.BAO_CAO) throw new Error('Kỳ này đã có báo cáo. Mở lại trước khi sửa lịch.');
      const ngay = String(req.ngay || '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay) || ngay < kk.chonTu || ngay > kk.chonDen) throw new Error('Kiểm kê ' + kk.nhan.toLowerCase() + ' làm vào ' + kk.luu + ': chọn ngày từ ' + dmy_(kk.chonTu) + ' đến ' + dmy_(kk.chonDen) + '.');
      const th = (req.thucHien || []).map(chuoi_).filter(function (t, i, a) { return t && a.indexOf(t) === i; });
      if (!th.length) throw new Error('Phân công ít nhất 1 thành viên thực hiện.');
      th.forEach(function (t) { if (ctx.d.thanhVien.indexOf(t) === -1) throw new Error(t + ' không có trong danh sách thành viên nhóm.'); });
      const tt = trangThaiGui_(nd, KIEM_KE.NHOM);
      const dong = [kk.ky, dmy_(ngay), ctx.phuTrach.join(', ') || nd.ten, th.join(', '), tt, ghiChu || (cu ? cu.ghiChu : ''), nd.ten, new Date(),
        nd.ten, tt === TT2.CHO_QL && v.tn ? nd.ten + ' · gửi (trưởng nhóm)' : '', tt === TT2.DUYET ? nd.ten + ' · quản lý đăng ký' : '', ''];
      if (cu) s.getRange(cu.dong, 1, 1, dong.length).setValues([dong]); else s.appendRow(dong);
    } else if (req.viec === 'duyet') {
      if (!cu) throw new Error('Kỳ này chưa có lịch kiểm kê.');
      const b = buocDuyet_(nd, KIEM_KE.NHOM, cu.trangThai, req.dongY === true, chuoi_(req.ghiChu).slice(0, 300));
      ghi(5, [b.tt]); ghi(b.cap === 'tn' ? 10 : 11, [b.ghi]); if (!req.dongY) ghi(12, [b.ghi]);
      ghi(7, [nd.ten, new Date()]);
    } else if (req.viec === 'baoCao') {
      if (!cu || cu.trangThai !== TT2.DUYET) throw new Error('Lịch kiểm kê chưa được duyệt đủ 2 cấp nên chưa nộp báo cáo được.');
      if (!laPT && cu.thucHien.indexOf(nd.ten) === -1) throw loiQuyen_('Chỉ người được phân công, phụ trách chính hoặc trưởng nhóm mới nộp báo cáo.');
      if (cu.ngay > now.ngay) throw new Error('Chưa đến ngày kiểm kê (' + dmy_(cu.ngay) + ').');
      const bb = linkHopLe_(req.bienBan, 'biên bản kiểm kê trên sheet', true);
      const so = SO_KK.map(function (k) {
        const x = req.so ? req.so[k] : '';
        if (x === '' || x === null || x === undefined) { if (k === 'tong') throw new Error('Nhập tổng số tài sản kiểm kê.'); return 0; }
        const n = Number(x); if (!(n >= 0 && n <= 100000 && Math.floor(n) === n)) throw new Error('Số liệu phải là số nguyên ≥ 0.'); return n;
      });
      ghi(5, [TT_KK.BAO_CAO]); ghi(7, [nd.ten, new Date()]);
      ghi(13, [bb].concat(so, [chuoi_(req.bienDong).slice(0, 1000), chuoi_(req.deXuat).slice(0, 500), nd.ten, new Date()]));
    } else if (req.viec === 'moLai') {
      if (!cu || cu.trangThai !== TT_KK.BAO_CAO) throw new Error('Kỳ này chưa có báo cáo.');
      if (!laPT && !v.ql) throw loiQuyen_('Chỉ phụ trách chính / trưởng nhóm mới mở lại được.');
      ghi(5, [TT2.DUYET]); ghi(7, [nd.ten, new Date()]);
    } else throw new Error('Yêu cầu không hợp lệ.');
    SpreadsheetApp.flush();
    return kiemKe_(nd);
  });
}

/* ---------------- Họp tháng (cả 4 nhóm) */

function docHop_(ss) {
  return docTabHd_(ss, 'Họp nhóm', COT_HOP.length).map(function (r) {
    return { dong: r.dong, nhom: chuoi_(r[0]), thang: chuoi_(r[1]).slice(0, 7), ngay: ngayISO_(r[2], MUI_GIO) || '', gio: gioChu_(r[3]), diaDiem: chuoi_(r[4]),
      noiDung: chuoi_(r[5]), nguoi: chuoi_(r[6]), luc: lucChu2_(r[7]) };
  }).filter(function (x) { return x.nhom && /^\d{4}-\d{2}$/.test(x.thang); });
}
function hopNhom_(nd, req) {
  const nhom = String(req.nhom || '');
  canNhom_(nd, nhom);
  const ss = sheetTruc_(), now = bayGio_(), t0 = now.ngay.slice(0, 7), ds = docHop_(ss).filter(function (x) { return x.nhom === nhom; });
  const thang = [];
  for (let i = 2; i >= -3; i--) thang.push(themThang_(t0, i));
  return {
    nhom: nhom, homNay: now.ngay, thangNay: t0, suaDuoc: nd.nhom.indexOf(nhom) > -1,
    thang: thang.map(function (t) { const x = ds.filter(function (y) { return y.thang === t; }).slice(-1)[0]; if (!x) return { thang: t }; const o = Object.assign({}, x); delete o.dong; return o; })
  };
}
function luuHopNhom_(nd, req) {
  const nhom = String(req.nhom || '');
  canNhom_(nd, nhom);
  if (nd.nhom.indexOf(nhom) === -1) throw loiQuyen_('Chỉ thành viên của nhóm mới đăng ký lịch họp cho nhóm.');
  return voiKhoa_(function () {
    const ss = sheetTruc_(), thang = String(req.thang || '');
    if (!/^\d{4}-\d{2}$/.test(thang)) throw new Error('Tháng không hợp lệ.');
    const s = tabHd_(ss, 'Họp nhóm', COT_HOP, [110, 90, 110, 70, 200, 360, 180, 130], [2, 3, 4]);
    const cu = docHop_(ss).filter(function (y) { return y.nhom === nhom && y.thang === thang; }).slice(-1)[0];
    if (req.viec === 'xoa') { if (cu) s.deleteRow(cu.dong); return hopNhom_(nd, req); }
    const ngay = String(req.ngay || ''), gio = gioChu_(req.gio);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ngay) || ngay.slice(0, 7) !== thang) throw new Error('Chọn ngày họp trong tháng ' + thang.slice(5) + '/' + thang.slice(0, 4) + '.');
    if (!gio) throw new Error('Chọn giờ họp.');
    const diaDiem = chuoi_(req.diaDiem).slice(0, 150);
    if (!diaDiem) throw new Error('Ghi địa điểm họp (hoặc link họp online).');
    const dong = [nhom, thang, dmy_(ngay), gio, diaDiem, String(req.noiDung || '').slice(0, 1000), nd.ten, new Date()];
    if (cu) s.getRange(cu.dong, 1, 1, COT_HOP.length).setValues([dong]); else s.appendRow(dong);
    SpreadsheetApp.flush();
    return hopNhom_(nd, req);
  });
}
/** Quản lý: lịch họp tháng này và tháng sau của cả 4 nhóm. */
function hopThang_(nd) {
  if (nd.vaiTro !== 'quanLy') throw loiQuyen_('Chỉ quản lý mới xem được lịch họp của tất cả các nhóm.');
  const now = bayGio_(), t0 = now.ngay.slice(0, 7), t1 = themThang_(t0, 1), ds = docHop_(sheetTruc_());
  return {
    homNay: now.ngay, thang: [t0, t1],
    nhom: Object.keys(TEN_NHOM).map(function (ma) {
      const lay = function (t) { const x = ds.filter(function (y) { return y.nhom === ma && y.thang === t; }).slice(-1)[0]; if (!x) return null; const o = Object.assign({}, x); delete o.dong; return o; };
      return { ma: ma, ten: TEN_NHOM[ma], hop: [lay(t0), lay(t1)] };
    })
  };
}
