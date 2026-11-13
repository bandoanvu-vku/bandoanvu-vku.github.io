/* ------------------------------------------------ Nội vụ: đợt đăng ký trực · lịch học · lịch thi */
/*
 * Đợt đăng ký trực (Nội vụ + quản lý đặt):
 *   - Quy tắc mặc định ở tab "Cài đặt" của sheet lịch trực: dòng "Mở đăng ký trực" (vd "T6 00:00") và "Khoá đăng ký trực" (vd "CN 17:00"),
 *     tính theo các ngày của TUẦN TRƯỚC tuần trực. Trống = T6 00:00 → CN 17:00.
 *   - Chỉnh riêng từng tuần ở tab "Đợt đăng ký trực": Tuần (thứ 2) | Mở lúc | Khoá lúc | Cập nhật bởi | Cập nhật lúc (chuỗi "yyyy-MM-dd HH:mm").
 *   - action quanLyTruc {tuan}: các tuần sắp tới + ai đã / chưa đăng ký đủ giờ tối thiểu; luuQuanLyTruc {viec: macDinh | tuan | boTuan}.
 * Lịch học / lịch thi (thành viên tự đăng ký ở Hồ sơ của tôi, Nội vụ + quản lý xem):
 *   - tab "Lịch học": Email | Họ và tên | Học kỳ | Lịch (JSON [{thu 2..8 (8 = CN), tu, den, mon, phong}]) | Cập nhật lúc — 1 dòng / người / học kỳ.
 *   - tab "Lịch thi": Mã | Email | Họ và tên | Học kỳ | Môn thi | Ngày thi | Giờ thi | Phòng / ghi chú | Cập nhật lúc.
 *   - action luuLichHoc {slots}, luuLichThi {viec: them | sua | xoa}, lichThanhVien (Nội vụ + quản lý).
 */
const NOI_VU = 'noi-vu';
const DOT_TRUC = { TAB: 'Đợt đăng ký trực', COT: ['Tuần', 'Mở lúc', 'Khoá lúc', 'Cập nhật bởi', 'Cập nhật lúc'], MO: [5, '00:00'], DONG: [7, '17:00'] };
const COT_LH = ['Email', 'Họ và tên', 'Học kỳ', 'Lịch', 'Cập nhật lúc'];
const COT_LT = ['Mã', 'Email', 'Họ và tên', 'Học kỳ', 'Môn thi', 'Ngày thi', 'Giờ thi', 'Phòng / ghi chú', 'Cập nhật lúc'];
const THU_CHU = ['', '', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/** Ô ngày: Date, dd/MM/yyyy hoặc yyyy-MM-dd → yyyy-MM-dd. */
function ngayTuan_(v) { const t = chuoi_(v); return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : ngayISO_(v, MUI_GIO); }
function laNoiVu_(nd) { return nd.vaiTro === 'quanLy' || (nd.nhom || []).indexOf(NOI_VU) > -1; }
function canNoiVu_(nd) { if (!laNoiVu_(nd)) throw loiQuyen_('Chỉ nhóm Nội vụ và quản lý mới dùng được mục này.'); }

/* ---------------- đợt đăng ký trực */

/** "T6 00:00" → [5, '00:00'] (thứ 2 = 1 … CN = 7). */
function docMocChu_(v, macDinh) {
  const m = /^\s*(T\s*([2-7])|CN)\s+(\d{1,2}):(\d{2})\s*$/i.exec(chuoi_(v));
  if (!m) return macDinh;
  return [m[2] ? Number(m[2]) - 1 : 7, ('0' + m[3]).slice(-2) + ':' + m[4]];
}
function mocChu_(m) { return (m[0] === 7 ? 'CN' : 'T' + (m[0] + 1)) + ' ' + m[1]; }
function macDinhDot_() {
  const v = giaTriCaiDat_();
  const lay = function (nhan) { const r = v.filter(function (x) { return chuanHoa_(x[0]).indexOf(chuanHoa_(nhan)) === 0; })[0]; return r ? r[1] : ''; };
  return { mo: docMocChu_(lay('Mở đăng ký trực'), DOT_TRUC.MO), dong: docMocChu_(lay('Khoá đăng ký trực'), DOT_TRUC.DONG) };
}
let DOT_NHO_ = null;
function dotRieng_() {
  if (DOT_NHO_) return DOT_NHO_;
  const c = CacheService.getScriptCache(), co = c.get('dottruc1');
  if (co) { DOT_NHO_ = JSON.parse(co); return DOT_NHO_; }
  const o = {}, s = sheetTruc_().getSheetByName(DOT_TRUC.TAB);
  if (s && s.getLastRow() >= 2) {
    s.getRange(2, 1, s.getLastRow() - 1, 5).getValues().forEach(function (r) {
      const t0 = ngayTuan_(r[0]), mo = mocISO_(r[1]), dong = mocISO_(r[2]);
      if (t0 && mo && dong) o[t0] = { mo: mo, dong: dong, boi: chuoi_(r[3]), luc: lucChu_(r[4]) };
    });
  }
  try { c.put('dottruc1', JSON.stringify(o), 600); } catch (e) {}
  DOT_NHO_ = o;
  return o;
}
function xoaDotNho_() { DOT_NHO_ = null; try { CacheService.getScriptCache().remove('dottruc1'); } catch (e) {} }
/** Ô sheet (Date hoặc chuỗi "yyyy-MM-dd HH:mm" / "dd/MM/yyyy HH:mm") → "yyyy-MM-dd HH:mm". */
function mocISO_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]') return Utilities.formatDate(v, MUI_GIO, 'yyyy-MM-dd HH:mm');
  const t = chuoi_(v), m = /^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}):(\d{2})/.exec(t);
  if (m) return m[1] + ' ' + ('0' + m[2]).slice(-2) + ':' + m[3];
  const n = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/.exec(t);
  return n ? n[3] + '-' + ('0' + n[2]).slice(-2) + '-' + ('0' + n[1]).slice(-2) + ' ' + ('0' + n[4]).slice(-2) + ':' + n[5] : '';
}
/** Mốc mở / khoá đăng ký của tuần t0 (thứ 2). */
function mocTuan_(t0) {
  const r = dotRieng_()[t0];
  if (r) return { mo: r.mo, dong: r.dong, rieng: true, boi: r.boi, luc: r.luc };
  const md = macDinhDot_();
  return { mo: themNgay_(t0, md.mo[0] - 8) + ' ' + md.mo[1], dong: themNgay_(t0, md.dong[0] - 8) + ' ' + md.dong[1], rieng: false };
}

function ghiCaiDatDong_(nhan, ten, giaTri, ghiChu) {
  const s = sheetTruc_().getSheetByName('Cài đặt');
  const v = s.getRange(1, 1, Math.max(1, s.getLastRow()), 1).getValues().map(function (r) { return chuanHoa_(r[0]); });
  const i = v.findIndex(function (x) { return x.indexOf(chuanHoa_(nhan)) === 0; });
  if (i > -1) s.getRange(i + 1, 2).setNumberFormat('@').setValue(giaTri);
  else { s.appendRow([ten, '', ghiChu || '']); s.getRange(s.getLastRow(), 2).setNumberFormat('@').setValue(giaTri); }
}

function quanLyTruc_(nd, req) {
  canNoiVu_(nd);
  const ss = sheetTruc_(), cd = caiDatTruc_(ss), now = bayGio_(), cb = docCongBo_(ss);
  const t1 = dauTuan_(now.ngay);
  const tuan = [0, 1, 2, 3, 4].map(function (i) {
    const t0 = themNgay_(t1, 7 * i), st = trangThaiTuan_(t0, now, cb), m = mocTuan_(t0);
    return { t0: t0, ma: st.ma, mo: st.mo, dong: st.dong, rieng: !!m.rieng, boi: m.boi || '', luc: m.luc || '' };
  });
  let chon = /^\d{4}-\d{2}-\d{2}$/.test(String(req.tuan || '')) ? dauTuan_(req.tuan) : '';
  if (!tuan.some(function (x) { return x.t0 === chon; })) {
    const dang = tuan.filter(function (x) { return x.ma === 'mo'; })[0] || tuan.filter(function (x) { return x.ma === 'chuaMo'; })[0];
    chon = dang ? dang.t0 : tuan[1].t0;
  }
  const ngay = [0, 1, 2, 3, 4].map(function (i) { return themNgay_(chon, i); });
  const ca = docTruc_(ss).filter(function (x) { return ngay.indexOf(x.ngay) > -1 && conHieuLuc_(x); });
  const bang = bangTaiKhoan_(), nguoi = {};
  Object.keys(bang).forEach(function (em) {
    const tk = bang[em];
    if (tk.quanLy && !(tk.nhom || []).length) return;
    if (!nguoi[tk.ten]) nguoi[tk.ten] = { ten: tk.ten, email: em, nhom: tk.nhom || [], phut: 0, cho: 0, ca: [] };
  });
  ca.forEach(function (x) {
    const p = nguoi[x.ten] || (nguoi[x.ten] = { ten: x.ten, email: x.email, nhom: [], phut: 0, cho: 0, ca: [], ngoai: true });
    if (x.trangThai === TT.CHO) p.cho += soPhut_(x); else p.phut += soPhut_(x);
    p.ca.push({ ngay: x.ngay, tu: x.tu, den: x.den, loai: x.loai, trangThai: x.trangThai });
  });
  const md = macDinhDot_();
  return {
    homNay: now.ngay, gio: now.gio, quanLy: nd.vaiTro === 'quanLy', toiThieuGio: cd.toiThieuGio, ngayNghi: cd.ngayNghi,
    macDinh: { moThu: md.mo[0], moGio: md.mo[1], dongThu: md.dong[0], dongGio: md.dong[1] },
    tuan: tuan, chon: chon,
    nguoi: Object.keys(nguoi).map(function (k) {
      const p = nguoi[k]; p.gio = p.phut / 60; p.gioCho = p.cho / 60; delete p.phut; delete p.cho;
      p.ca.sort(function (a, b) { return a.ngay < b.ngay ? -1 : a.ngay > b.ngay ? 1 : phut_(a.tu) - phut_(b.tu); });
      return p;
    }).sort(function (a, b) { return a.gio - b.gio || (a.ten < b.ten ? -1 : 1); })
  };
}

function luuQuanLyTruc_(nd, req) {
  canNoiVu_(nd);
  return voiKhoa_(function () {
    const ss = sheetTruc_(), now = bayGio_();
    if (req.viec === 'macDinh') {
      const mo = [Number(req.moThu), gioChu_(req.moGio)], dong = [Number(req.dongThu), gioChu_(req.dongGio)];
      [mo, dong].forEach(function (m) { if (!(m[0] >= 1 && m[0] <= 7) || !m[1]) throw new Error('Thứ / giờ không hợp lệ.'); });
      if (mo[0] * 1440 + phut_(mo[1]) >= dong[0] * 1440 + phut_(dong[1])) throw new Error('Giờ mở đăng ký phải trước giờ khoá (cùng trong tuần trước tuần trực).');
      ghiCaiDatDong_('Mở đăng ký trực', 'Mở đăng ký trực', mocChu_(mo), 'Ngày trong TUẦN TRƯỚC tuần trực, vd "T6 00:00". Nội vụ sửa ở trang Nội vụ → Lịch trực');
      ghiCaiDatDong_('Khoá đăng ký trực', 'Khoá đăng ký trực', mocChu_(dong), 'Vd "CN 17:00"');
      SpreadsheetApp.flush(); xoaCaiDatNho_();
    } else if (req.viec === 'tuan' || req.viec === 'boTuan') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(req.tuan || ''))) throw new Error('Tuần không hợp lệ.');
      const t0 = dauTuan_(req.tuan);
      if (t0 < dauTuan_(now.ngay)) throw new Error('Không chỉnh được tuần đã qua.');
      const s = damBaoTab_(ss, DOT_TRUC.TAB, DOT_TRUC.COT, [110, 140, 140, 180, 140]);
      s.getRange('A:C').setNumberFormat('@');
      const v = s.getLastRow() >= 2 ? s.getRange(2, 1, s.getLastRow() - 1, 1).getValues() : [];
      let dong = 0; v.forEach(function (r, i) { if (ngayTuan_(r[0]) === t0) dong = i + 2; });
      if (req.viec === 'boTuan') { if (dong) s.deleteRow(dong); }
      else {
        const mo = mocISO_(req.mo), kh = mocISO_(req.dong);
        if (!mo || !kh) throw new Error('Nhập đủ ngày giờ mở và khoá đăng ký.');
        if (mo >= kh) throw new Error('Giờ mở đăng ký phải trước giờ khoá.');
        if (kh > themNgay_(t0, 4) + ' 17:00') throw new Error('Giờ khoá muộn nhất là 17:00 thứ 6 của tuần trực.');
        const hang = [t0, mo, kh, nd.ten, new Date()];
        if (dong) s.getRange(dong, 1, 1, 5).setValues([hang]); else s.appendRow(hang);
      }
      SpreadsheetApp.flush(); xoaDotNho_();
    } else throw new Error('Thao tác không hợp lệ.');
    return quanLyTruc_(nd, { tuan: req.tuan });
  });
}

/* ---------------- lịch học · lịch thi */

/** Học kỳ theo ngày: tháng 8–12 và tháng 1 = HK1, tháng 2–6 = HK2, tháng 7 = Hè. */
function hocKy_(iso) {
  const y = Number(iso.slice(0, 4)), m = Number(iso.slice(5, 7));
  if (m >= 8) return 'HK1 ' + y + '-' + (y + 1);
  if (m === 1) return 'HK1 ' + (y - 1) + '-' + y;
  if (m <= 6) return 'HK2 ' + (y - 1) + '-' + y;
  return 'Hè ' + (y - 1) + '-' + y;
}
function tabLichHoc_() { return damBaoTab_(sheetTruc_(), 'Lịch học', COT_LH, [200, 160, 120, 420, 140]); }
function tabLichThi_() {
  const s = damBaoTab_(sheetTruc_(), 'Lịch thi', COT_LT, [90, 200, 160, 120, 220, 100, 80, 200, 140]);
  s.getRange('F:F').setNumberFormat('dd/MM/yyyy'); s.getRange('G:G').setNumberFormat('@');
  return s;
}
function docLichHoc_() {
  const s = sheetTruc_().getSheetByName('Lịch học');
  if (!s || s.getLastRow() < 2) return [];
  return s.getRange(2, 1, s.getLastRow() - 1, COT_LH.length).getValues().map(function (r, i) {
    let slots = []; try { slots = JSON.parse(chuoi_(r[3]) || '[]'); } catch (e) {}
    return { dong: i + 2, email: chuoi_(r[0]).toLowerCase(), ten: chuoi_(r[1]), hocKy: chuoi_(r[2]), slots: Array.isArray(slots) ? slots : [], capNhat: lucChu_(r[4]) };
  }).filter(function (x) { return x.email && x.hocKy; });
}
function docLichThi_() {
  const s = sheetTruc_().getSheetByName('Lịch thi');
  if (!s || s.getLastRow() < 2) return [];
  return s.getRange(2, 1, s.getLastRow() - 1, COT_LT.length).getValues().map(function (r, i) {
    return { dong: i + 2, id: chuoi_(r[0]), email: chuoi_(r[1]).toLowerCase(), ten: chuoi_(r[2]), hocKy: chuoi_(r[3]), mon: chuoi_(r[4]),
      ngay: ngayISO_(r[5], MUI_GIO) || '', gio: gioChu_(r[6]), ghiChu: chuoi_(r[7]), capNhat: lucChu_(r[8]) };
  }).filter(function (x) { return x.id && x.email; }).sort(function (a, b) { return a.ngay < b.ngay ? -1 : a.ngay > b.ngay ? 1 : (a.gio < b.gio ? -1 : 1); });
}
function thiRa_(x) { return { id: x.id, mon: x.mon, ngay: x.ngay, gio: x.gio, ghiChu: x.ghiChu, hocKy: x.hocKy }; }
/** Lịch thi còn đáng xem: thuộc học kỳ hiện tại hoặc chưa tới ngày. */
function thiConXem_(x, hk, homNay) { return x.hocKy === hk || x.ngay >= homNay; }

/** Phần lịch của hồ sơ: lịch học kỳ này (+ học kỳ gần nhất có lịch để chép), lịch thi. */
function lichCuaToi_(nd) {
  const now = bayGio_(), hk = hocKy_(now.ngay);
  const lh = docLichHoc_().filter(function (x) { return x.email === nd.email; });
  const nay = lh.filter(function (x) { return x.hocKy === hk; })[0];
  const truoc = lh.filter(function (x) { return x.hocKy !== hk && x.slots.length; }).pop();
  return {
    hocKy: hk, homNay: now.ngay,
    lichHoc: nay ? { slots: nay.slots, capNhat: nay.capNhat } : null,
    lichHocTruoc: truoc ? { hocKy: truoc.hocKy, slots: truoc.slots } : null,
    lichThi: docLichThi_().filter(function (x) { return x.email === nd.email && thiConXem_(x, hk, now.ngay); }).map(thiRa_)
  };
}

function luuLichHoc_(nd, req) {
  if (nd.xemThu) throw new Error('Đang xem thử, không lưu được.');
  const ds = Array.isArray(req.slots) ? req.slots : [];
  if (ds.length > 40) throw new Error('Tối đa 40 buổi học / tuần.');
  const sach = ds.map(function (x) {
    const thu = Number(x.thu), tu = gioChu_(x.tu), den = gioChu_(x.den), mon = chuoi_(x.mon).replace(/\s+/g, ' ').slice(0, 80), phong = chuoi_(x.phong).replace(/\s+/g, ' ').slice(0, 40);
    if (!(thu >= 2 && thu <= 8)) throw new Error('Thứ không hợp lệ.');
    if (!tu || !den) throw new Error('Nhập đủ giờ bắt đầu và kết thúc cho mỗi buổi học (' + THU_CHU[thu] + (mon ? ' · ' + mon : '') + ').');
    if (phut_(tu) < 6 * 60 || phut_(den) > 22 * 60) throw new Error('Giờ học phải trong khoảng 06:00 – 22:00.');
    if (phut_(tu) >= phut_(den)) throw new Error('Giờ kết thúc phải sau giờ bắt đầu (' + THU_CHU[thu] + ' ' + tu + ').');
    if (!mon) throw new Error('Nhập tên môn cho buổi học ' + THU_CHU[thu] + ' ' + tu + '.');
    return { thu: thu, tu: tu, den: den, mon: mon, phong: phong };
  }).sort(function (a, b) { return a.thu - b.thu || phut_(a.tu) - phut_(b.tu); });
  for (let i = 1; i < sach.length; i++) {
    const a = sach[i - 1], b = sach[i];
    if (a.thu === b.thu && phut_(b.tu) < phut_(a.den)) throw new Error('Hai buổi học ' + THU_CHU[a.thu] + ' bị trùng giờ (' + a.tu + '–' + a.den + ' và ' + b.tu + '–' + b.den + ').');
  }
  return voiKhoa_(function () {
    const s = tabLichHoc_(), hk = hocKy_(bayGio_().ngay);
    const x = docLichHoc_().filter(function (y) { return y.email === nd.email && y.hocKy === hk; })[0];
    const hang = [nd.email, nd.ten, hk, JSON.stringify(sach), new Date()];
    if (x) s.getRange(x.dong, 1, 1, hang.length).setValues([hang]); else s.appendRow(hang);
    SpreadsheetApp.flush();
    return hoSoCuaToi_(nd);
  });
}

function luuLichThi_(nd, req) {
  if (nd.xemThu) throw new Error('Đang xem thử, không lưu được.');
  return voiKhoa_(function () {
    const s = tabLichThi_(), now = bayGio_(), tat = docLichThi_();
    const cu = req.id ? tat.filter(function (x) { return x.id === req.id && x.email === nd.email; })[0] : null;
    if (req.id && !cu) throw new Error('Không tìm thấy lịch thi này (có thể đã xoá).');
    if (req.viec === 'xoa') { s.deleteRow(cu.dong); SpreadsheetApp.flush(); return hoSoCuaToi_(nd); }
    const mon = chuoi_(req.mon).replace(/\s+/g, ' ').slice(0, 100), ngay = /^\d{4}-\d{2}-\d{2}$/.test(String(req.ngay || '')) ? req.ngay : '';
    const gio = req.gio ? gioChu_(req.gio) : '', ghiChu = chuoi_(req.ghiChu).replace(/\s+/g, ' ').slice(0, 120);
    if (!mon) throw new Error('Nhập tên môn thi.');
    if (!ngay) throw new Error('Chọn ngày thi.');
    if (ngay < themNgay_(now.ngay, -200) || ngay > themNgay_(now.ngay, 400)) throw new Error('Ngày thi không hợp lệ.');
    if (req.gio && !gio) throw new Error('Giờ thi không hợp lệ.');
    const hang = [cu ? cu.id : maMoi_('LT'), nd.email, nd.ten, hocKy_(ngay), mon, ngayDate_(ngay), gio, ghiChu, new Date()];
    if (cu) s.getRange(cu.dong, 1, 1, hang.length).setValues([hang]); else s.appendRow(hang);
    SpreadsheetApp.flush();
    return hoSoCuaToi_(nd);
  });
}

/** Lịch học + lịch thi của mọi thành viên (Nội vụ + quản lý). */
function lichThanhVien_(nd) {
  canNoiVu_(nd);
  const now = bayGio_(), hk = hocKy_(now.ngay), bang = bangTaiKhoan_(), nguoi = {}, theoEmail = {};
  Object.keys(bang).forEach(function (em) {
    const tk = bang[em];
    if (tk.quanLy && !(tk.nhom || []).length) return;
    if (!nguoi[tk.ten]) nguoi[tk.ten] = { ten: tk.ten, email: em, nhom: tk.nhom || [], lichHoc: null, lichThi: [] };
    theoEmail[em] = nguoi[tk.ten];
  });
  docLichHoc_().forEach(function (x) { const p = theoEmail[x.email]; if (p && x.hocKy === hk) p.lichHoc = { slots: x.slots, capNhat: x.capNhat }; });
  docLichThi_().forEach(function (x) { const p = theoEmail[x.email]; if (p && thiConXem_(x, hk, now.ngay)) p.lichThi.push(thiRa_(x)); });
  return {
    hocKy: hk, homNay: now.ngay, toi: nd.email,
    nguoi: Object.keys(nguoi).map(function (k) { return nguoi[k]; }).sort(function (a, b) { return a.ten.localeCompare(b.ten, 'vi'); })
  };
}
