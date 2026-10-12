
/* ------------------------------------------------ lịch trực + điểm danh */

const TRUC = {
  TEN_SHEET: 'Lịch trực văn phòng - Ban Đoàn vụ',
  CA: [
    { ma: 'sang', ten: 'Sáng', bd: '08:00', kt: '11:00' },
    { ma: 'chieu', ten: 'Chiều', bd: '14:00', kt: '17:00' }
  ],
  SOM_PHUT: 15,        // được điểm danh sớm trước giờ ca bao nhiêu phút
  TOI_THIEU: 2,        // số buổi trực tối thiểu mỗi tuần
  BAN_KINH: 150,       // mét, mặc định nếu chưa cài
  SAI_SO_TOI_DA: 300,  // mét; GPS kém hơn mức này thì yêu cầu thử lại
  TUAN_TOI: 4          // được đăng ký trước tối đa bao nhiêu tuần
};
const MUI_GIO = 'Asia/Ho_Chi_Minh';
const COT_TRUC = ['Ngày', 'Ca', 'Họ và tên', 'Email', 'Đăng ký lúc', 'Điểm danh lúc', 'Vĩ độ', 'Kinh độ', 'Cách văn phòng (m)', 'Ghi chú'];

function sheetTruc_() {
  const p = PropertiesService.getScriptProperties();
  const id = p.getProperty('SHEET_TRUC');
  if (id) return SpreadsheetApp.openById(id);
  const khoa = LockService.getScriptLock();
  khoa.waitLock(20000);
  try {
    const id2 = p.getProperty('SHEET_TRUC');
    if (id2) return SpreadsheetApp.openById(id2);
    const ss = SpreadsheetApp.create(TRUC.TEN_SHEET);
    ss.setSpreadsheetTimeZone(MUI_GIO);
    const s = ss.getSheets()[0];
    s.setName('Đăng ký');
    s.getRange(1, 1, 1, COT_TRUC.length).setValues([COT_TRUC]).setFontWeight('bold').setBackground('#1a56c4').setFontColor('#ffffff');
    s.setFrozenRows(1);
    [110, 70, 190, 220, 140, 140, 90, 90, 120, 220].forEach(function (w, i) { s.setColumnWidth(i + 1, w); });
    s.getRange('A:A').setNumberFormat('dd/MM/yyyy');
    s.getRange('E:F').setNumberFormat('dd/MM/yyyy HH:mm');
    const c = ss.insertSheet('Cài đặt');
    c.getRange(1, 1, 6, 3).setValues([
      ['Mục', 'Giá trị', 'Ghi chú'],
      ['Vĩ độ văn phòng', '', 'Quản lý bấm "Đặt vị trí văn phòng tại chỗ tôi đứng" trên trang Lịch trực khi đang ở văn phòng'],
      ['Kinh độ văn phòng', '', ''],
      ['Bán kính điểm danh (m)', TRUC.BAN_KINH, 'Đứng trong bán kính này quanh văn phòng mới điểm danh được'],
      ['Số buổi tối thiểu / tuần', TRUC.TOI_THIEU, ''],
      ['Ngày nghỉ (không trực)', '', 'Ghi các ngày dạng dd/MM/yyyy, cách nhau bằng dấu phẩy']
    ]);
    c.getRange(1, 1, 1, 3).setFontWeight('bold');
    c.setColumnWidth(1, 200); c.setColumnWidth(2, 160); c.setColumnWidth(3, 520);
    p.setProperty('SHEET_TRUC', ss.getId());
    return ss;
  } finally {
    khoa.releaseLock();
  }
}

function caiDatTruc_(ss) {
  const s = ss.getSheetByName('Cài đặt');
  const v = s ? s.getRange(1, 1, Math.max(s.getLastRow(), 1), 2).getValues() : [];
  const lay = function (nhan) {
    const r = v.filter(function (x) { return chuanHoa_(x[0]).indexOf(chuanHoa_(nhan)) === 0; })[0];
    return r ? r[1] : '';
  };
  const so = function (x) { const n = Number(String(x).replace(',', '.')); return isFinite(n) && String(x).trim() !== '' ? n : null; };
  const nghi = String(lay('Ngày nghỉ') || '').split(/[,;\n]+/).map(function (x) { return ngayISO_(x.trim(), MUI_GIO); }).filter(Boolean);
  return {
    lat: so(lay('Vĩ độ')), lng: so(lay('Kinh độ')),
    banKinh: so(lay('Bán kính')) || TRUC.BAN_KINH,
    toiThieu: so(lay('Số buổi tối thiểu')) || TRUC.TOI_THIEU,
    ngayNghi: nghi
  };
}

function bayGio_() {
  const d = new Date();
  return {
    ngay: Utilities.formatDate(d, MUI_GIO, 'yyyy-MM-dd'),
    gio: Utilities.formatDate(d, MUI_GIO, 'HH:mm'),
    thu: Number(Utilities.formatDate(d, MUI_GIO, 'u')) // 1 = thứ 2 ... 7 = CN
  };
}
function themNgay_(iso, n) {
  const p = iso.split('-').map(Number);
  const d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + n));
  return d.toISOString().slice(0, 10);
}
function thuCua_(iso) { const p = iso.split('-').map(Number); const t = new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay(); return t === 0 ? 7 : t; }
function dauTuan_(iso) { return themNgay_(iso, 1 - thuCua_(iso)); }
function ngayDate_(iso) { const p = iso.split('-').map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2], 5, 0, 0)); } // 12h trưa giờ VN, không lệch ngày dù múi giờ script khác
function phut_(hhmm) { const p = hhmm.split(':').map(Number); return p[0] * 60 + p[1]; }
function caTheoMa_(ma) { return TRUC.CA.filter(function (c) { return c.ma === ma; })[0]; }

function docTruc_(ss) {
  const s = ss.getSheetByName('Đăng ký');
  if (!s || s.getLastRow() < 2) return [];
  return s.getRange(2, 1, s.getLastRow() - 1, COT_TRUC.length).getValues().map(function (r, i) {
    const ca = TRUC.CA.filter(function (c) { return c.ten === chuoi_(r[1]) || c.ma === chuoi_(r[1]); })[0];
    return {
      dong: i + 2, ngay: ngayISO_(r[0], MUI_GIO), ca: ca ? ca.ma : '', ten: chuoi_(r[2]), email: chuoi_(r[3]).toLowerCase(),
      diemDanh: Object.prototype.toString.call(r[5]) === '[object Date]' ? Utilities.formatDate(r[5], MUI_GIO, 'HH:mm') : (chuoi_(r[5]) ? chuoi_(r[5]) : ''),
      cach: r[8] === '' ? null : Number(r[8])
    };
  }).filter(function (x) { return x.ngay && x.ca && x.ten; });
}

function khoangCach_(a1, o1, a2, o2) {
  const R = 6371000, rad = Math.PI / 180;
  const da = (a2 - a1) * rad, dob = (o2 - o1) * rad;
  const h = Math.sin(da / 2) * Math.sin(da / 2) + Math.cos(a1 * rad) * Math.cos(a2 * rad) * Math.sin(dob / 2) * Math.sin(dob / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Lịch trực một tuần (tuan = ngày bất kỳ trong tuần, yyyy-MM-dd). */
function lichTruc_(nd, tuan) {
  const ss = sheetTruc_(), cd = caiDatTruc_(ss), now = bayGio_();
  const t0 = dauTuan_(/^\d{4}-\d{2}-\d{2}$/.test(String(tuan || '')) ? tuan : now.ngay);
  const ngay = [0, 1, 2, 3, 4].map(function (i) { return themNgay_(t0, i); });
  const tat = docTruc_(ss);
  const trongTuan = tat.filter(function (x) { return ngay.indexOf(x.ngay) > -1; });
  const quanLy = nd.vaiTro === 'quanLy';

  // ca đang diễn ra (để hiện nút điểm danh)
  let caHienTai = null;
  if (now.thu <= 5 && cd.ngayNghi.indexOf(now.ngay) === -1) {
    const p = phut_(now.gio);
    TRUC.CA.forEach(function (c) { if (p >= phut_(c.bd) - TRUC.SOM_PHUT && p <= phut_(c.kt)) caHienTai = c.ma; });
  }
  const cuaToi = function (x) { return x.email === nd.email || (!x.email && x.ten === nd.ten); };

  const o = {
    tuan: t0, ngay: ngay, ca: TRUC.CA, homNay: now.ngay, gio: now.gio, caHienTai: caHienTai,
    toiThieu: cd.toiThieu, ngayNghi: cd.ngayNghi, coViTri: cd.lat !== null && cd.lng !== null, banKinh: cd.banKinh,
    tuanToiDa: themNgay_(dauTuan_(now.ngay), 7 * TRUC.TUAN_TOI),
    dangKy: trongTuan.map(function (x) { return { ngay: x.ngay, ca: x.ca, ten: x.ten, toi: cuaToi(x), diemDanh: x.diemDanh }; }),
    toi: {
      dangKy: trongTuan.filter(cuaToi).length,
      diemDanh: trongTuan.filter(function (x) { return cuaToi(x) && x.diemDanh; }).length,
      homNay: tat.filter(function (x) { return cuaToi(x) && x.ngay === now.ngay; }).map(function (x) { return { ca: x.ca, diemDanh: x.diemDanh }; })
    },
    quanLy: quanLy
  };
  if (quanLy) {
    // Thống kê cả Ban cho tuần đang xem: mọi người trong sheet tài khoản (trừ tài khoản quản lý không có nhóm)
    const bang = bangTaiKhoan_(), nguoi = {};
    Object.keys(bang).forEach(function (em) {
      const tk = bang[em];
      if (tk.quanLy && !(tk.nhom || []).length) return;
      if (!nguoi[tk.ten]) nguoi[tk.ten] = { ten: tk.ten, nhom: tk.nhom || [], dangKy: 0, diemDanh: 0, vang: 0 };
    });
    trongTuan.forEach(function (x) {
      const p = nguoi[x.ten] || (nguoi[x.ten] = { ten: x.ten, nhom: [], dangKy: 0, diemDanh: 0, vang: 0 });
      p.dangKy++;
      if (x.diemDanh) p.diemDanh++;
      else {
        const c = caTheoMa_(x.ca);
        if (x.ngay < now.ngay || (x.ngay === now.ngay && phut_(now.gio) > phut_(c.kt))) p.vang++;
      }
    });
    o.thongKe = Object.keys(nguoi).map(function (k) { return nguoi[k]; }).sort(function (a, b) { return a.diemDanh - b.diemDanh || a.dangKy - b.dangKy || (a.ten < b.ten ? -1 : 1); });
    o.viTri = { lat: cd.lat, lng: cd.lng };
  }
  return o;
}

function kiemTraCa_(ngay, ca, cd, now) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(ngay || ''))) throw new Error('Ngày không hợp lệ.');
  const c = caTheoMa_(ca);
  if (!c) throw new Error('Ca không hợp lệ.');
  if (thuCua_(ngay) > 5) throw new Error('Chỉ trực từ thứ 2 đến thứ 6.');
  if (cd.ngayNghi.indexOf(ngay) > -1) throw new Error('Ngày này văn phòng nghỉ, không có ca trực.');
  return c;
}

function dangKyTruc_(nd, req) {
  const khoa = LockService.getScriptLock();
  khoa.waitLock(20000);
  try {
    const ss = sheetTruc_(), cd = caiDatTruc_(ss), now = bayGio_();
    const c = kiemTraCa_(req.ngay, req.ca, cd, now);
    if (req.ngay < now.ngay || (req.ngay === now.ngay && phut_(now.gio) > phut_(c.kt))) throw new Error('Ca này đã qua, không đăng ký được nữa.');
    if (req.ngay >= themNgay_(dauTuan_(now.ngay), 7 * TRUC.TUAN_TOI)) throw new Error('Chỉ đăng ký trước tối đa ' + TRUC.TUAN_TOI + ' tuần.');
    const trung = docTruc_(ss).filter(function (x) { return x.ngay === req.ngay && x.ca === c.ma && (x.email === nd.email || x.ten === nd.ten); });
    if (trung.length) throw new Error('Bạn đã đăng ký ca này rồi.');
    ss.getSheetByName('Đăng ký').appendRow([ngayDate_(req.ngay), c.ten, nd.ten, nd.email, new Date(), '', '', '', '', '']);
    SpreadsheetApp.flush();
    return lichTruc_(nd, req.ngay);
  } finally {
    khoa.releaseLock();
  }
}

function huyTruc_(nd, req) {
  const khoa = LockService.getScriptLock();
  khoa.waitLock(20000);
  try {
    const ss = sheetTruc_(), cd = caiDatTruc_(ss), now = bayGio_();
    const c = kiemTraCa_(req.ngay, req.ca, cd, now);
    const x = docTruc_(ss).filter(function (y) { return y.ngay === req.ngay && y.ca === c.ma && (y.email === nd.email || (!y.email && y.ten === nd.ten)); })[0];
    if (!x) throw new Error('Bạn chưa đăng ký ca này.');
    if (x.diemDanh) throw new Error('Ca này bạn đã điểm danh, không huỷ được.');
    if (req.ngay < now.ngay || (req.ngay === now.ngay && phut_(now.gio) >= phut_(c.bd))) throw new Error('Ca đã bắt đầu, không huỷ được nữa. Báo quản lý nếu bạn không đến được.');
    ss.getSheetByName('Đăng ký').deleteRow(x.dong);
    SpreadsheetApp.flush();
    return lichTruc_(nd, req.ngay);
  } finally {
    khoa.releaseLock();
  }
}

function diemDanh_(nd, req) {
  const khoa = LockService.getScriptLock();
  khoa.waitLock(20000);
  try {
    const ss = sheetTruc_(), cd = caiDatTruc_(ss), now = bayGio_();
    if (cd.lat === null || cd.lng === null) throw new Error('Quản lý chưa đặt vị trí văn phòng nên chưa điểm danh được.');
    let c = null;
    if (now.thu <= 5 && cd.ngayNghi.indexOf(now.ngay) === -1) {
      const p = phut_(now.gio);
      TRUC.CA.forEach(function (x) { if (p >= phut_(x.bd) - TRUC.SOM_PHUT && p <= phut_(x.kt)) c = x; });
    }
    if (!c) throw new Error('Bây giờ không phải giờ trực. Điểm danh được từ ' + TRUC.SOM_PHUT + ' phút trước giờ bắt đầu đến hết ca (sáng 8h - 11h, chiều 14h - 17h, thứ 2 - thứ 6).');
    const lat = Number(req.lat), lng = Number(req.lng), acc = Number(req.acc);
    if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new Error('Không đọc được vị trí của bạn.');
    if (isFinite(acc) && acc > TRUC.SAI_SO_TOI_DA) throw new Error('Vị trí chưa đủ chính xác (sai số khoảng ' + Math.round(acc) + ' m). Bật GPS / định vị chính xác rồi thử lại.');
    const cach = Math.round(khoangCach_(lat, lng, cd.lat, cd.lng));
    if (cach > cd.banKinh) throw new Error('Bạn đang cách văn phòng khoảng ' + cach + ' m (cho phép ' + cd.banKinh + ' m). Đến văn phòng rồi điểm danh nhé.');
    const s = ss.getSheetByName('Đăng ký');
    const x = docTruc_(ss).filter(function (y) { return y.ngay === now.ngay && y.ca === c.ma && (y.email === nd.email || (!y.email && y.ten === nd.ten)); })[0];
    if (x && x.diemDanh) throw new Error('Bạn đã điểm danh ca ' + c.ten.toLowerCase() + ' nay lúc ' + x.diemDanh + '.');
    const luc = new Date();
    if (x) {
      s.getRange(x.dong, 6, 1, 4).setValues([[luc, lat, lng, cach]]);
    } else {
      // Chưa đăng ký trước: vẫn ghi nhận buổi trực, đánh dấu để quản lý biết
      s.appendRow([ngayDate_(now.ngay), c.ten, nd.ten, nd.email, luc, luc, lat, lng, cach, 'Không đăng ký trước']);
    }
    SpreadsheetApp.flush();
    const kq = lichTruc_(nd, now.ngay);
    kq.vuaDiemDanh = { ca: c.ten, luc: Utilities.formatDate(luc, MUI_GIO, 'HH:mm'), cach: cach };
    return kq;
  } finally {
    khoa.releaseLock();
  }
}

function datViTri_(nd, req) {
  if (nd.vaiTro !== 'quanLy') throw loiQuyen_('Chỉ quản lý mới đặt được vị trí văn phòng.');
  const lat = Number(req.lat), lng = Number(req.lng), acc = Number(req.acc);
  if (!isFinite(lat) || !isFinite(lng)) throw new Error('Không đọc được vị trí.');
  if (isFinite(acc) && acc > 100) throw new Error('Vị trí chưa đủ chính xác (sai số khoảng ' + Math.round(acc) + ' m). Bật GPS, ra gần cửa sổ rồi thử lại.');
  const ss = sheetTruc_(), s = ss.getSheetByName('Cài đặt');
  const v = s.getRange(1, 1, s.getLastRow(), 1).getValues().map(function (r) { return chuanHoa_(r[0]); });
  const dong = function (nhan) { return v.findIndex(function (x) { return x.indexOf(chuanHoa_(nhan)) === 0; }) + 1; };
  s.getRange(dong('Vĩ độ'), 2).setValue(Math.round(lat * 1e6) / 1e6);
  s.getRange(dong('Kinh độ'), 2).setValue(Math.round(lng * 1e6) / 1e6);
  const bk = Number(req.banKinh);
  if (isFinite(bk) && bk >= 30 && bk <= 2000) s.getRange(dong('Bán kính'), 2).setValue(Math.round(bk));
  SpreadsheetApp.flush();
  return lichTruc_(nd, req.tuan);
}

/** Số buổi trực của một người trong tuần hiện tại (dùng cho trang Của tôi). */
function trucTuanNay_(nd) {
  try {
    const ss = sheetTruc_(), cd = caiDatTruc_(ss), now = bayGio_(), t0 = dauTuan_(now.ngay);
    const ngay = [0, 1, 2, 3, 4].map(function (i) { return themNgay_(t0, i); });
    const cua = docTruc_(ss).filter(function (x) { return ngay.indexOf(x.ngay) > -1 && (x.email === nd.email || (!x.email && x.ten === nd.ten)); });
    return { dangKy: cua.length, diemDanh: cua.filter(function (x) { return x.diemDanh; }).length, toiThieu: cd.toiThieu };
  } catch (err) { return null; }
}
