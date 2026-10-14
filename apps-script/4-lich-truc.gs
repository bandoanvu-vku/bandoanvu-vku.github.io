
/* ------------------------------------------------ lịch trực + điểm danh */
/*
 * Quy trình mỗi tuần (tuần = thứ 2 → chủ nhật, trực thứ 2 → thứ 6):
 *  - Mở đăng ký cho tuần sau từ 00:00 thứ 6 đến 17:00 chủ nhật tuần trước. Trong lúc mở, thành viên tự thêm/huỷ;
 *    chỉ thấy lịch của mình + số người mỗi buổi.
 *  - 17:00 chủ nhật khoá. Quản lý xem lại, chỉnh (thêm/xoá) rồi bấm Công bố → mọi người thấy tên.
 *  - Sau khi khoá: muốn đổi / huỷ / thêm ca thì gửi yêu cầu, quản lý duyệt.
 *  - Trực đột xuất: điểm danh luôn (trong giờ của một buổi), quản lý duyệt sau mới được tính giờ.
 * Đăng ký "Cả buổi" (3 giờ) hoặc "Ca ghép" tự chọn giờ:phút bất kỳ trong khung 8:00 - 17:00 (tối thiểu 1 giờ);
 * ca ghép bắt đầu trước 12:30 xếp vào buổi sáng, còn lại buổi chiều (chỉ để hiển thị).
 * Tính theo giờ: tối thiểu (số buổi trong Cài đặt × 3) giờ / tuần.
 */

const TRUC = {
  TEN_SHEET: 'Lịch trực văn phòng - Ban Đoàn vụ',
  BUOI: [
    { ma: 'sang', ten: 'Sáng', bd: '08:00', kt: '11:00' },
    { ma: 'chieu', ten: 'Chiều', bd: '14:00', kt: '17:00' }
  ],
  BUOC_PHUT: 1,        // ca ghép chọn tới từng phút
  NGAY_BD: '08:00', NGAY_KT: '17:00', // khung giờ được chọn cho ca ghép / trực đột xuất
  MOC_CHIEU: '12:30',  // ca bắt đầu từ mốc này xếp vào buổi chiều
  GHEP_TOI_THIEU: 60,  // ca ghép tối thiểu bao nhiêu phút
  SOM_PHUT: 15,        // được điểm danh sớm trước giờ bắt đầu bao nhiêu phút
  TOI_THIEU: 2,        // số buổi tối thiểu / tuần (1 buổi = 3 giờ), nếu Cài đặt để trống
  BAN_KINH: 150,       // mét
  SAI_SO_TOI_DA: 300,  // mét; GPS kém hơn mức này thì yêu cầu thử lại
  TUAN_TOI: 4,         // xem trước tối đa bao nhiêu tuần
  AP_DUNG_TU: '2026-10-19', // các tuần trước mốc này coi như đã công bố (lịch cũ trước khi có quy trình khoá)
  DONG_GIO: '17:00'    // giờ khoá đăng ký ngày chủ nhật
};
const MUI_GIO = 'Asia/Ho_Chi_Minh';
const COT_TRUC = ['Ngày', 'Ca', 'Họ và tên', 'Email', 'Đăng ký lúc', 'Điểm danh lúc', 'Vĩ độ', 'Kinh độ', 'Cách văn phòng (m)', 'Ghi chú',
  'Từ', 'Đến', 'Loại', 'Trạng thái'];
const COT_YC = ['Mã', 'Gửi lúc', 'Họ và tên', 'Email', 'Loại', 'Ca hiện tại', 'Ngày mới', 'Buổi mới', 'Từ', 'Đến', 'Lý do',
  'Trạng thái', 'Người duyệt', 'Duyệt lúc', 'Ghi chú duyệt'];
const TT = { DK: 'Đã đăng ký', CHO: 'Chờ duyệt', DUYET: 'Đã duyệt', TU_CHOI: 'Từ chối', HUY: 'Đã huỷ' };
const LOAI_YC = { doi: 'Đổi ca', huy: 'Huỷ ca', them: 'Thêm ca', vang: 'Xin vắng' }; // 'huy' chỉ còn để xử lý yêu cầu cũ; giao diện dùng 'vang'

/* ---------------- sheet */

function sheetTruc_() {
  const p = PropertiesService.getScriptProperties();
  let id = p.getProperty('SHEET_TRUC');
  let ss;
  if (id) ss = SpreadsheetApp.openById(id);
  else {
    const khoa = LockService.getScriptLock();
    khoa.waitLock(20000);
    try {
      id = p.getProperty('SHEET_TRUC');
      if (id) ss = SpreadsheetApp.openById(id);
      else {
        ss = SpreadsheetApp.create(TRUC.TEN_SHEET);
        ss.setSpreadsheetTimeZone(MUI_GIO);
        ss.getSheets()[0].setName('Đăng ký');
        const c = ss.insertSheet('Cài đặt');
        c.getRange(1, 1, 6, 3).setValues([
          ['Mục', 'Giá trị', 'Ghi chú'],
          ['Vĩ độ văn phòng', '', 'Quản lý bấm "Đặt vị trí văn phòng tại chỗ tôi đứng" trên trang Lịch trực khi đang ở văn phòng'],
          ['Kinh độ văn phòng', '', ''],
          ['Bán kính điểm danh (m)', TRUC.BAN_KINH, 'Đứng trong bán kính này quanh văn phòng mới điểm danh được'],
          ['Số buổi tối thiểu / tuần', TRUC.TOI_THIEU, '1 buổi = 3 giờ; ca ghép tính theo số giờ thực tế'],
          ['Ngày nghỉ (không trực)', '', 'Ghi các ngày dạng dd/MM/yyyy, cách nhau bằng dấu phẩy']
        ]);
        c.getRange(1, 1, 1, 3).setFontWeight('bold');
        c.setColumnWidth(1, 200); c.setColumnWidth(2, 160); c.setColumnWidth(3, 520);
        p.setProperty('SHEET_TRUC', ss.getId());
      }
    } finally {
      khoa.releaseLock();
    }
  }
  damBaoTab_(ss, 'Đăng ký', COT_TRUC, [110, 70, 190, 220, 140, 140, 90, 90, 120, 220, 60, 60, 90, 100]);
  damBaoTab_(ss, 'Yêu cầu', COT_YC, [90, 140, 190, 220, 80, 200, 100, 80, 60, 60, 260, 100, 190, 140, 220]);
  damBaoTab_(ss, 'Công bố', ['Tuần (thứ 2)', 'Công bố lúc', 'Người công bố'], [120, 160, 220]);
  return ss;
}

/** Tạo tab / bổ sung cột tiêu đề còn thiếu (sheet cũ chỉ có 10 cột). */
function damBaoTab_(ss, ten, cot, rong) {
  let s = ss.getSheetByName(ten);
  if (!s) s = ss.insertSheet(ten);
  const dau = s.getLastColumn() ? s.getRange(1, 1, 1, Math.max(s.getLastColumn(), cot.length)).getValues()[0].map(chuoi_) : [];
  if (dau.slice(0, cot.length).join('|') === cot.join('|')) return s;
  s.getRange(1, 1, 1, cot.length).setValues([cot]).setFontWeight('bold').setBackground('#1a56c4').setFontColor('#ffffff');
  s.setFrozenRows(1);
  (rong || []).forEach(function (w, i) { s.setColumnWidth(i + 1, w); });
  if (ten === 'Đăng ký') { s.getRange('A:A').setNumberFormat('dd/MM/yyyy'); s.getRange('E:F').setNumberFormat('dd/MM/yyyy HH:mm'); s.getRange('K:L').setNumberFormat('@'); }
  if (ten === 'Yêu cầu') { s.getRange('B:B').setNumberFormat('dd/MM/yyyy HH:mm'); s.getRange('G:G').setNumberFormat('dd/MM/yyyy'); s.getRange('N:N').setNumberFormat('dd/MM/yyyy HH:mm'); s.getRange('I:J').setNumberFormat('@'); }
  return s;
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
  const buoi = so(lay('Số buổi tối thiểu')) || TRUC.TOI_THIEU;
  return {
    lat: so(lay('Vĩ độ')), lng: so(lay('Kinh độ')),
    banKinh: so(lay('Bán kính')) || TRUC.BAN_KINH,
    toiThieuGio: buoi * 3,
    ngayNghi: nghi
  };
}

/* ---------------- thời gian */

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
  return new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)).toISOString().slice(0, 10);
}
function thuCua_(iso) { const p = iso.split('-').map(Number); const t = new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay(); return t === 0 ? 7 : t; }
function dauTuan_(iso) { return themNgay_(iso, 1 - thuCua_(iso)); }
function ngayDate_(iso) { const p = iso.split('-').map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2], 5, 0, 0)); } // 12h trưa giờ VN
function phut_(hhmm) { const p = String(hhmm).split(':').map(Number); return p[0] * 60 + p[1]; }
function hhmm_(phut) { return ('0' + Math.floor(phut / 60)).slice(-2) + ':' + ('0' + (phut % 60)).slice(-2); }
function buoiTheoMa_(ma) { return TRUC.BUOI.filter(function (b) { return b.ma === ma; })[0]; }
function gioChu_(v) { // ô giờ trong sheet có thể là chuỗi "08:30" hoặc Date
  if (Object.prototype.toString.call(v) === '[object Date]') return Utilities.formatDate(v, MUI_GIO, 'HH:mm');
  const m = /^(\d{1,2}):(\d{2})/.exec(chuoi_(v));
  return m ? ('0' + m[1]).slice(-2) + ':' + m[2] : '';
}

/** Trạng thái đăng ký của tuần bắt đầu t0 (thứ 2): chuaMo | mo | khoa | congBo. */
function trangThaiTuan_(t0, now, congBo) {
  const mo = themNgay_(t0, -3) + ' 00:00', dong = themNgay_(t0, -1) + ' ' + TRUC.DONG_GIO, bg = now.ngay + ' ' + now.gio;
  if (t0 < TRUC.AP_DUNG_TU) return { ma: 'congBo', mo: mo, dong: dong };
  if (bg < mo) return { ma: 'chuaMo', mo: mo, dong: dong };
  if (bg < dong) return { ma: 'mo', mo: mo, dong: dong };
  return { ma: congBo.indexOf(t0) > -1 ? 'congBo' : 'khoa', mo: mo, dong: dong };
}

/* ---------------- đọc dữ liệu */

function docTruc_(ss) {
  const s = ss.getSheetByName('Đăng ký');
  if (!s || s.getLastRow() < 2) return [];
  return s.getRange(2, 1, s.getLastRow() - 1, COT_TRUC.length).getValues().map(function (r, i) {
    const b = TRUC.BUOI.filter(function (x) { return x.ten === chuoi_(r[1]) || x.ma === chuoi_(r[1]); })[0];
    const tu = gioChu_(r[10]) || (b ? b.bd : ''), den = gioChu_(r[11]) || (b ? b.kt : '');
    const ghiChu = chuoi_(r[9]);
    let tt = chuoi_(r[13]) || TT.DK;
    let loai = chuoi_(r[12]) || 'Cả buổi';
    if (!chuoi_(r[12]) && ghiChu === 'Không đăng ký trước') { loai = 'Đột xuất'; tt = TT.DUYET; } // dòng cũ
    return {
      dong: i + 2, ngay: ngayISO_(r[0], MUI_GIO), buoi: b ? b.ma : '', ten: chuoi_(r[2]), email: chuoi_(r[3]).toLowerCase(),
      diemDanh: Object.prototype.toString.call(r[5]) === '[object Date]' ? Utilities.formatDate(r[5], MUI_GIO, 'HH:mm') : chuoi_(r[5]),
      cach: r[8] === '' ? null : Number(r[8]), ghiChu: ghiChu, tu: tu, den: den, loai: loai, trangThai: tt
    };
  }).filter(function (x) { return x.ngay && x.buoi && x.ten; });
}
function conHieuLuc_(x) { return x.trangThai !== TT.HUY && x.trangThai !== TT.TU_CHOI; }
function soPhut_(x) { return Math.max(0, phut_(x.den) - phut_(x.tu)); }
function cuaNguoi_(nd) { return function (x) { return x.email === nd.email || (!x.email && x.ten === nd.ten); }; }

function docYeuCau_(ss) {
  const s = ss.getSheetByName('Yêu cầu');
  if (!s || s.getLastRow() < 2) return [];
  return s.getRange(2, 1, s.getLastRow() - 1, COT_YC.length).getValues().map(function (r, i) {
    return {
      dong: i + 2, id: chuoi_(r[0]),
      guiLuc: Object.prototype.toString.call(r[1]) === '[object Date]' ? Utilities.formatDate(r[1], MUI_GIO, 'dd/MM HH:mm') : chuoi_(r[1]),
      ten: chuoi_(r[2]), email: chuoi_(r[3]).toLowerCase(), loai: chuoi_(r[4]), goc: chuoi_(r[5]),
      ngay: ngayISO_(r[6], MUI_GIO) || '', buoi: (TRUC.BUOI.filter(function (b) { return b.ten === chuoi_(r[7]); })[0] || {}).ma || '',
      tu: gioChu_(r[8]), den: gioChu_(r[9]), lyDo: chuoi_(r[10]), trangThai: chuoi_(r[11]) || TT.CHO,
      nguoiDuyet: chuoi_(r[12]), ghiChuDuyet: chuoi_(r[14]),
      duyetLuc: Object.prototype.toString.call(r[13]) === '[object Date]' ? Utilities.formatDate(r[13], MUI_GIO, 'dd/MM HH:mm') : chuoi_(r[13])
    };
  }).filter(function (x) { return x.id; });
}
function docCongBo_(ss) {
  const s = ss.getSheetByName('Công bố');
  if (!s || s.getLastRow() < 2) return [];
  return s.getRange(2, 1, s.getLastRow() - 1, 1).getValues().map(function (r) { return ngayISO_(r[0], MUI_GIO); }).filter(Boolean);
}

/** "Thứ 3 13/10 · Sáng 08:00-11:00" */
function moTaCa_(ngay, buoi, tu, den) {
  const thu = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'][thuCua_(ngay)];
  const p = ngay.split('-');
  return thu + ' ' + p[2] + '/' + p[1] + ' · ' + (buoiTheoMa_(buoi) || {}).ten + ' ' + tu + '-' + den;
}

/* ---------------- kiểm tra ca */

function kiemTraCa_(ngay, buoi, tu, den, cd) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(ngay || ''))) throw new Error('Ngày không hợp lệ.');
  if (thuCua_(ngay) > 5) throw new Error('Chỉ trực từ thứ 2 đến thứ 6.');
  if (cd.ngayNghi.indexOf(ngay) > -1) throw new Error('Ngày này văn phòng nghỉ, không có ca trực.');
  const b0 = buoiTheoMa_(buoi);
  tu = gioChu_(tu); den = gioChu_(den);
  if (!tu && !den) { if (!b0) throw new Error('Buổi không hợp lệ.'); tu = b0.bd; den = b0.kt; }
  if (!tu || !den || Number(tu.slice(3)) > 59 || Number(den.slice(3)) > 59) throw new Error('Giờ không hợp lệ.');
  const a = phut_(tu), z = phut_(den);
  if (a < phut_(TRUC.NGAY_BD) || z > phut_(TRUC.NGAY_KT)) throw new Error('Giờ trực phải trong khoảng ' + TRUC.NGAY_BD + ' - ' + TRUC.NGAY_KT + '.');
  if (a >= z) throw new Error('Giờ kết thúc phải sau giờ bắt đầu.');
  const ca = TRUC.BUOI.filter(function (x) { return x.bd === tu && x.kt === den; })[0];
  if (!ca && z - a < TRUC.GHEP_TOI_THIEU) throw new Error('Ca ghép tối thiểu ' + (TRUC.GHEP_TOI_THIEU / 60) + ' giờ.');
  return { b: ca || buoiTheoGio_(tu), tu: tu, den: den, caBuoi: !!ca };
}
function buoiTheoGio_(tu) { return TRUC.BUOI[phut_(tu) < phut_(TRUC.MOC_CHIEU) ? 0 : 1]; }
function trungGio_(ds, ngay, tu, den, boQua) {
  return ds.filter(function (x) {
    return conHieuLuc_(x) && x.ngay === ngay && x.dong !== boQua && phut_(x.tu) < phut_(den) && phut_(tu) < phut_(x.den);
  })[0];
}
function daQua_(ngay, gio, now) { return ngay < now.ngay || (ngay === now.ngay && phut_(now.gio) >= phut_(gio)); }

/* ---------------- lịch tuần */

function lichTruc_(nd, tuan) {
  const ss = sheetTruc_(), cd = caiDatTruc_(ss), now = bayGio_();
  const t0 = dauTuan_(/^\d{4}-\d{2}-\d{2}$/.test(String(tuan || '')) ? tuan : now.ngay);
  const ngay = [0, 1, 2, 3, 4].map(function (i) { return themNgay_(t0, i); });
  const tat = docTruc_(ss), yc = docYeuCau_(ss), cb = docCongBo_(ss);
  const st = trangThaiTuan_(t0, now, cb);
  const quanLy = nd.vaiTro === 'quanLy', cua = cuaNguoi_(nd);
  const hienTen = quanLy || st.ma === 'congBo';
  const trongTuan = tat.filter(function (x) { return ngay.indexOf(x.ngay) > -1 && x.trangThai !== TT.HUY; });

  // Buổi đang diễn ra (để hiện nút điểm danh)
  let buoiNay = null;
  if (now.thu <= 5 && cd.ngayNghi.indexOf(now.ngay) === -1) {
    const p = phut_(now.gio);
    TRUC.BUOI.forEach(function (b) { if (p >= phut_(b.bd) - TRUC.SOM_PHUT && p <= phut_(b.kt)) buoiNay = b.ma; });
  }
  const pNow = phut_(now.gio);
  const coDotXuat = now.thu <= 5 && cd.ngayNghi.indexOf(now.ngay) === -1 &&
    pNow >= phut_(TRUC.NGAY_BD) - TRUC.SOM_PHUT && pNow < phut_(TRUC.NGAY_KT);
  const dem = {};
  trongTuan.forEach(function (x) { if (conHieuLuc_(x)) dem[x.ngay + '|' + x.buoi] = (dem[x.ngay + '|' + x.buoi] || 0) + 1; });
  const thongTin = function (x) {
    return { dong: x.dong, ngay: x.ngay, buoi: x.buoi, tu: x.tu, den: x.den, loai: x.loai, trangThai: x.trangThai, ten: x.ten, toi: cua(x), diemDanh: x.diemDanh };
  };
  const cuaToiTuan = trongTuan.filter(cua);
  const tinhGio = function (ds) {
    let dk = 0, dd = 0, cho = 0;
    ds.forEach(function (x) {
      if (!conHieuLuc_(x)) return;
      if (x.trangThai === TT.CHO) { cho += soPhut_(x); return; }
      dk += soPhut_(x);
      if (x.diemDanh) dd += soPhut_(x);
    });
    return { dangKy: dk / 60, diemDanh: dd / 60, choDuyet: cho / 60 };
  };

  const o = {
    tuan: t0, ngay: ngay, buoi: TRUC.BUOI, buoc: TRUC.BUOC_PHUT, ghepToiThieu: TRUC.GHEP_TOI_THIEU,
    homNay: now.ngay, gio: now.gio, buoiNay: buoiNay, trangThaiTuan: st, coDotXuat: coDotXuat, ngayBd: TRUC.NGAY_BD, ngayKt: TRUC.NGAY_KT,
    toiThieuGio: cd.toiThieuGio, ngayNghi: cd.ngayNghi, coViTri: cd.lat !== null && cd.lng !== null, banKinh: cd.banKinh,
    tuanToiDa: themNgay_(dauTuan_(now.ngay), 7 * TRUC.TUAN_TOI), hienTen: hienTen,
    dangKy: trongTuan.filter(function (x) { return hienTen || cua(x); }).map(thongTin),
    dem: dem,
    toi: Object.assign(tinhGio(cuaToiTuan), {
      homNay: tat.filter(function (x) { return cua(x) && x.ngay === now.ngay && conHieuLuc_(x); }).map(thongTin),
      // ca sắp tới của tôi (chưa bắt đầu, chưa điểm danh) để chọn khi tạo yêu cầu đổi / huỷ
      sapToi: tat.filter(function (x) {
        return cua(x) && conHieuLuc_(x) && x.trangThai !== TT.CHO && !x.diemDanh && !daQua_(x.ngay, x.tu, now);
      }).sort(function (a, b) { return a.ngay < b.ngay ? -1 : a.ngay > b.ngay ? 1 : phut_(a.tu) - phut_(b.tu); }).slice(0, 30).map(thongTin)
    }),
    yeuCau: yc.filter(function (x) { return x.email === nd.email; }).slice(-15).reverse(),
    quanLy: quanLy
  };
  if (quanLy) {
    const bang = bangTaiKhoan_(), nguoi = {};
    Object.keys(bang).forEach(function (em) {
      const tk = bang[em];
      if (tk.quanLy && !(tk.nhom || []).length) return;
      if (!nguoi[tk.ten]) nguoi[tk.ten] = { ten: tk.ten, email: em, nhom: tk.nhom || [], ds: [] };
    });
    trongTuan.forEach(function (x) { (nguoi[x.ten] || (nguoi[x.ten] = { ten: x.ten, email: x.email, nhom: [], ds: [] })).ds.push(x); });
    o.thongKe = Object.keys(nguoi).map(function (k) {
      const p = nguoi[k], g = tinhGio(p.ds);
      const vang = p.ds.filter(function (x) { return conHieuLuc_(x) && x.trangThai !== TT.CHO && !x.diemDanh && daQua_(x.ngay, x.den, now); }).length;
      return { ten: p.ten, email: p.email, nhom: p.nhom, gioDangKy: g.dangKy, gioDiemDanh: g.diemDanh, gioChoDuyet: g.choDuyet, vang: vang };
    }).sort(function (a, b) { return a.gioDangKy - b.gioDangKy || (a.ten < b.ten ? -1 : 1); });
    o.choDuyet = choDuyetTruc_(yc, tat);
    o.viTri = { lat: cd.lat, lng: cd.lng };
  }
  return o;
}

function dotXuatRa_(x) {
  return { kieu: 'dotXuat', id: 'D' + x.dong, dong: x.dong, ten: x.ten, email: x.email, loai: 'Trực đột xuất', ngay: x.ngay, buoi: x.buoi,
    tu: x.tu, den: x.den, diemDanh: x.diemDanh, cach: x.cach, trangThai: x.trangThai, ghiChu: x.ghiChu || '' };
}
function choDuyetTruc_(yc, tat) {
  return yc.filter(function (x) { return x.trangThai === TT.CHO; }).map(function (x) { return Object.assign({ kieu: 'yeuCau' }, x); })
    .concat(tat.filter(function (x) { return x.loai === 'Đột xuất' && x.trangThai === TT.CHO; }).map(dotXuatRa_));
}

/* ---------------- trang Phê duyệt (quản lý): mọi thứ thành viên gửi lên chờ duyệt */

function pheDuyet_(nd, req) {
  if (nd.vaiTro !== 'quanLy') throw loiQuyen_('Chỉ quản lý mới xem được mục Phê duyệt.');
  const ss = sheetTruc_(), now = bayGio_();
  const yc = docYeuCau_(ss), tat = docTruc_(ss);
  const cho = choDuyetTruc_(yc, tat).concat(choDuyetCnXanh_(), choDuyetCsvc_());
  if (req && req.dem) { let soViec = 0; try { soViec = viecChoDuyet_().length; } catch (e) {} return { so: cho.length, soViec: soViec }; }
  const tu = themNgay_(now.ngay, -14);
  const daXuLy = yc.filter(function (x) { return x.trangThai !== TT.CHO; }).slice(-20).reverse().map(function (x) { return Object.assign({ kieu: 'yeuCau' }, x); })
    .concat(tat.filter(function (x) { return x.loai === 'Đột xuất' && x.ngay >= tu && (x.trangThai === TT.DUYET || x.trangThai === TT.TU_CHOI); }).map(dotXuatRa_).reverse()).concat(daXuLyCnXanh_());
  return { so: cho.length, choDuyet: cho, daXuLy: daXuLy, homNay: now.ngay, gio: now.gio };
}

/* ---------------- thành viên tự đăng ký / huỷ (khi đang mở) */

function dangKyTruc_(nd, req) {
  return voiKhoa_(function () {
    const ss = sheetTruc_(), cd = caiDatTruc_(ss), now = bayGio_();
    const c = kiemTraCa_(req.ngay, req.buoi, req.tu, req.den, cd);
    const st = trangThaiTuan_(dauTuan_(req.ngay), now, docCongBo_(ss));
    if (st.ma !== 'mo') {
      throw new Error(st.ma === 'chuaMo' ? 'Lịch tuần này chưa mở đăng ký (mở từ thứ 6 tuần trước).'
        : 'Lịch tuần này đã khoá đăng ký. Gửi yêu cầu "Thêm ca" để quản lý duyệt.');
    }
    const ds = docTruc_(ss).filter(cuaNguoi_(nd));
    const trung = trungGio_(ds, req.ngay, c.tu, c.den);
    if (trung) throw new Error('Bạn đã có ca ' + trung.tu + ' - ' + trung.den + ' trùng giờ này.');
    themDong_(ss, req.ngay, c, nd, c.caBuoi ? 'Cả buổi' : 'Ca ghép', TT.DK, '');
    return lichTruc_(nd, req.ngay);
  });
}

function huyTruc_(nd, req) {
  return voiKhoa_(function () {
    const ss = sheetTruc_(), now = bayGio_();
    const x = timDong_(ss, req, function (y) { return cuaNguoi_(nd)(y); });
    const st = trangThaiTuan_(dauTuan_(x.ngay), now, docCongBo_(ss));
    if (st.ma !== 'mo') throw new Error('Lịch đã khoá. Gửi yêu cầu "Huỷ ca" để quản lý duyệt.');
    ss.getSheetByName('Đăng ký').deleteRow(x.dong);
    return lichTruc_(nd, x.ngay);
  });
}

function themDong_(ss, ngay, c, nd, loai, tt, ghiChu, diemDanh) {
  ss.getSheetByName('Đăng ký').appendRow([ngayDate_(ngay), c.b.ten, nd.ten, nd.email, new Date(), diemDanh ? diemDanh.luc : '',
    diemDanh ? diemDanh.lat : '', diemDanh ? diemDanh.lng : '', diemDanh ? diemDanh.cach : '', ghiChu || '', c.tu, c.den, loai, tt]);
}
function timDong_(ss, req, loc) {
  const x = docTruc_(ss).filter(function (y) {
    return y.dong === Number(req.dong) && y.ngay === req.ngay && y.tu === gioChu_(req.tu) && (!loc || loc(y));
  })[0];
  if (!x) throw new Error('Không tìm thấy ca này (lịch vừa thay đổi). Bấm Tải lại rồi thử lại.');
  return x;
}
function datTrangThai_(ss, dong, tt, ghiChu) {
  const s = ss.getSheetByName('Đăng ký');
  s.getRange(dong, 14).setValue(tt);
  if (ghiChu) s.getRange(dong, 10).setValue(ghiChu);
}
function voiKhoa_(fn) {
  const khoa = LockService.getScriptLock();
  khoa.waitLock(20000);
  try { const kq = fn(); SpreadsheetApp.flush(); return kq; } finally { khoa.releaseLock(); }
}

/* ---------------- yêu cầu đổi / huỷ / thêm ca (khi đã khoá) */

function guiYeuCau_(nd, req) {
  return voiKhoa_(function () {
    const ss = sheetTruc_(), cd = caiDatTruc_(ss), now = bayGio_();
    const loai = LOAI_YC[req.loai];
    if (!loai) throw new Error('Loại yêu cầu không hợp lệ.');
    const lyDo = chuoi_(req.lyDo).slice(0, 300);
    if (!lyDo) throw new Error('Ghi lý do giúp quản lý duyệt nhé.');
    let goc = null, moi = null;
    const ds = docTruc_(ss).filter(cuaNguoi_(nd));
    if (req.loai !== 'them') {
      goc = timDong_(ss, req.goc || {}, cuaNguoi_(nd));
      if (!conHieuLuc_(goc) || goc.trangThai === TT.CHO) throw new Error('Ca này không còn hiệu lực.');
      if (goc.diemDanh) throw new Error('Ca này bạn đã điểm danh.');
      if (req.loai === 'vang' ? daQua_(goc.ngay, goc.den, now) : daQua_(goc.ngay, goc.tu, now)) {
        throw new Error(req.loai === 'vang' ? 'Ca này đã kết thúc.' : 'Ca này đã bắt đầu, không gửi yêu cầu được nữa.');
      }
    }
    if (req.loai !== 'huy' && req.loai !== 'vang') {
      const m = req.moi || {};
      const c = kiemTraCa_(m.ngay, m.buoi, m.tu, m.den, cd);
      if (daQua_(m.ngay, c.den, now)) throw new Error('Ca mới đã qua.');
      if (m.ngay >= themNgay_(dauTuan_(now.ngay), 7 * TRUC.TUAN_TOI)) throw new Error('Chỉ xin ca trong ' + TRUC.TUAN_TOI + ' tuần tới.');
      const tr = trungGio_(ds, m.ngay, c.tu, c.den, goc ? goc.dong : null);
      if (tr) throw new Error('Bạn đã có ca ' + tr.tu + ' - ' + tr.den + ' trùng giờ này.');
      moi = { ngay: m.ngay, b: c.b, tu: c.tu, den: c.den };
    }
    const dangCho = docYeuCau_(ss).filter(function (y) { return y.email === nd.email && y.trangThai === TT.CHO && goc && y.goc === moTaCa_(goc.ngay, goc.buoi, goc.tu, goc.den); });
    if (dangCho.length) throw new Error('Ca này đã có một yêu cầu đang chờ duyệt.');
    const id = 'YC' + Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase();
    ss.getSheetByName('Yêu cầu').appendRow([id, new Date(), nd.ten, nd.email, loai,
      goc ? moTaCa_(goc.ngay, goc.buoi, goc.tu, goc.den) : '', moi ? ngayDate_(moi.ngay) : '', moi ? moi.b.ten : '', moi ? moi.tu : '', moi ? moi.den : '',
      lyDo, TT.CHO, '', '', goc ? 'dong:' + goc.dong : '']);
    return lichTruc_(nd, (moi || goc).ngay);
  });
}

function rutYeuCau_(nd, req) {
  return voiKhoa_(function () {
    const ss = sheetTruc_();
    const y = docYeuCau_(ss).filter(function (x) { return x.id === req.id && x.email === nd.email; })[0];
    if (!y) throw new Error('Không tìm thấy yêu cầu.');
    if (y.trangThai !== TT.CHO) throw new Error('Yêu cầu đã được xử lý.');
    ss.getSheetByName('Yêu cầu').getRange(y.dong, 12).setValue(TT.HUY);
    return lichTruc_(nd, req.tuan);
  });
}

/** Quản lý duyệt / từ chối: yêu cầu (kieu 'yeuCau', id) hoặc buổi trực đột xuất (kieu 'dotXuat', dong). */
function duyetTruc_(nd, req) {
  if (nd.vaiTro !== 'quanLy') throw loiQuyen_('Chỉ quản lý mới duyệt được.');
  const traVe = function (ngay) { return req.ve === 'pheDuyet' ? pheDuyet_(nd, {}) : lichTruc_(nd, ngay); };
  return voiKhoa_(function () {
    const ss = sheetTruc_(), cd = caiDatTruc_(ss), now = bayGio_(), dongY = req.dongY === true;
    const ghiChu = chuoi_(req.ghiChu).slice(0, 200);
    if (req.kieu === 'dotXuat') {
      const x = docTruc_(ss).filter(function (y) { return y.dong === Number(req.dong) && y.loai === 'Đột xuất' && y.trangThai === TT.CHO; })[0];
      if (!x) throw new Error('Không tìm thấy buổi đột xuất đang chờ (có thể đã được duyệt).');
      datTrangThai_(ss, x.dong, dongY ? TT.DUYET : TT.TU_CHOI, ghiChu ? 'Quản lý: ' + ghiChu : '');
      return traVe(x.ngay);
    }
    const y = docYeuCau_(ss).filter(function (x) { return x.id === req.id; })[0];
    if (!y) throw new Error('Không tìm thấy yêu cầu.');
    if (y.trangThai !== TT.CHO) throw new Error('Yêu cầu này đã được xử lý.');
    const s = ss.getSheetByName('Yêu cầu');
    const ketThuc = function (tt) { s.getRange(y.dong, 12, 1, 4).setValues([[tt, nd.ten, new Date(), ghiChu]]); };
    if (!dongY) { ketThuc(TT.TU_CHOI); return traVe(y.ngay || req.tuan); }

    const nguoi = { ten: y.ten, email: y.email };
    const ds = docTruc_(ss).filter(cuaNguoi_(nguoi));
    let goc = null;
    if (y.loai !== LOAI_YC.them) {
      const d = Number((/dong:(\d+)/.exec(y.ghiChuDuyet || '') || [])[1]);
      goc = ds.filter(function (x) { return conHieuLuc_(x) && (x.dong === d || moTaCa_(x.ngay, x.buoi, x.tu, x.den) === y.goc); })[0];
      if (!goc) throw new Error('Ca gốc của yêu cầu không còn (có thể đã bị xoá). Hãy từ chối yêu cầu này.');
    }
    if (y.loai !== LOAI_YC.huy && y.loai !== LOAI_YC.vang) {
      const c = kiemTraCa_(y.ngay, y.buoi, y.tu, y.den, cd);
      const tr = trungGio_(ds, y.ngay, c.tu, c.den, goc ? goc.dong : null);
      if (tr) throw new Error(y.ten + ' đã có ca ' + tr.tu + ' - ' + tr.den + ' trùng giờ, không duyệt được.');
      themDong_(ss, y.ngay, c, nguoi, y.loai === LOAI_YC.doi ? 'Đổi ca' : (c.caBuoi ? 'Cả buổi' : 'Ca ghép'), TT.DK, 'Theo yêu cầu ' + y.id);
    }
    // ghi dòng mới trước rồi mới huỷ ca gốc (appendRow không làm lệch số dòng của ca gốc)
    if (goc) datTrangThai_(ss, goc.dong, TT.HUY, (y.loai === LOAI_YC.doi ? 'Đổi ca' : y.loai === LOAI_YC.vang ? 'Vắng có phép' : 'Huỷ ca') + ' theo yêu cầu ' + y.id);
    ketThuc(TT.DUYET);
    return traVe(y.ngay || (goc && goc.ngay) || req.tuan);
  });
}

/* ---------------- quản lý chỉnh lịch + công bố */

function quanLySuaTruc_(nd, req) {
  if (nd.vaiTro !== 'quanLy') throw loiQuyen_('Chỉ quản lý mới chỉnh được lịch.');
  return voiKhoa_(function () {
    const ss = sheetTruc_(), cd = caiDatTruc_(ss);
    if (req.viec === 'xoa') {
      const x = timDong_(ss, req);
      if (x.diemDanh) throw new Error('Ca này đã điểm danh, không xoá được.');
      datTrangThai_(ss, x.dong, TT.HUY, 'Quản lý ' + nd.ten + ' xoá');
      return lichTruc_(nd, x.ngay);
    }
    if (req.viec === 'them') {
      const bang = bangTaiKhoan_();
      const em = Object.keys(bang).filter(function (e) { return bang[e].ten === chuoi_(req.ten); })[0];
      if (!em) throw new Error('Không tìm thấy thành viên này trong sheet tài khoản.');
      const nguoi = { ten: bang[em].ten, email: em };
      const c = kiemTraCa_(req.ngay, req.buoi, req.tu, req.den, cd);
      const tr = trungGio_(docTruc_(ss).filter(cuaNguoi_(nguoi)), req.ngay, c.tu, c.den);
      if (tr) throw new Error(nguoi.ten + ' đã có ca ' + tr.tu + ' - ' + tr.den + ' trùng giờ.');
      themDong_(ss, req.ngay, c, nguoi, c.caBuoi ? 'Cả buổi' : 'Ca ghép', TT.DK, 'Quản lý ' + nd.ten + ' thêm');
      return lichTruc_(nd, req.ngay);
    }
    throw new Error('Yêu cầu không hợp lệ.');
  });
}

function congBoTruc_(nd, req) {
  if (nd.vaiTro !== 'quanLy') throw loiQuyen_('Chỉ quản lý mới công bố được lịch.');
  return voiKhoa_(function () {
    const ss = sheetTruc_(), now = bayGio_(), t0 = dauTuan_(String(req.tuan || now.ngay));
    const cb = docCongBo_(ss), st = trangThaiTuan_(t0, now, cb);
    if (st.ma === 'congBo') throw new Error('Lịch tuần này đã công bố.');
    if (st.ma !== 'khoa') throw new Error('Chỉ công bố được sau khi khoá đăng ký (17h chủ nhật).');
    ss.getSheetByName('Công bố').appendRow([ngayDate_(t0), new Date(), nd.ten]);
    return lichTruc_(nd, t0);
  });
}

/* ---------------- điểm danh */

function diemDanh_(nd, req) {
  return voiKhoa_(function () {
    const ss = sheetTruc_(), cd = caiDatTruc_(ss), now = bayGio_();
    if (cd.lat === null || cd.lng === null) throw new Error('Quản lý chưa đặt vị trí văn phòng nên chưa điểm danh được.');
    const lat = Number(req.lat), lng = Number(req.lng), acc = Number(req.acc);
    if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new Error('Không đọc được vị trí của bạn.');
    if (isFinite(acc) && acc > TRUC.SAI_SO_TOI_DA) throw new Error('Vị trí chưa đủ chính xác (sai số khoảng ' + Math.round(acc) + ' m). Bật GPS / định vị chính xác rồi thử lại.');
    const cach = Math.round(khoangCach_(lat, lng, cd.lat, cd.lng));
    if (cach > cd.banKinh) throw new Error('Bạn đang cách văn phòng khoảng ' + cach + ' m (cho phép ' + cd.banKinh + ' m). Đến văn phòng rồi điểm danh nhé.');
    const p = phut_(now.gio), luc = new Date();
    const dd = { luc: luc, lat: lat, lng: lng, cach: cach };
    const s = ss.getSheetByName('Đăng ký');
    const cua = docTruc_(ss).filter(function (x) { return cuaNguoi_(nd)(x) && x.ngay === now.ngay && conHieuLuc_(x); });
    // 1) ca đã đăng ký đang trong giờ (cho sớm SOM_PHUT phút)
    const ca = cua.filter(function (x) { return x.trangThai !== TT.CHO && p >= phut_(x.tu) - TRUC.SOM_PHUT && p <= phut_(x.den); });
    const chua = ca.filter(function (x) { return !x.diemDanh; });
    if (chua.length) {
      // điểm danh luôn các ca liền nhau phía sau trong cùng buổi
      chua.forEach(function (x) { s.getRange(x.dong, 6, 1, 4).setValues([[luc, lat, lng, cach]]); });
      let cuoi = chua[chua.length - 1];
      cua.filter(function (x) { return !x.diemDanh && x.buoi === cuoi.buoi && phut_(x.tu) === phut_(cuoi.den); }).forEach(function (x) {
        s.getRange(x.dong, 6, 1, 4).setValues([[luc, lat, lng, cach]]); cuoi = x;
      });
      const kq = lichTruc_(nd, now.ngay);
      kq.vuaDiemDanh = { tu: chua[0].tu, den: cuoi.den, luc: Utilities.formatDate(luc, MUI_GIO, 'HH:mm'), cach: cach, dotXuat: false };
      return kq;
    }
    if (ca.length) throw new Error('Bạn đã điểm danh ca ' + ca[0].tu + ' - ' + ca[0].den + ' lúc ' + ca[0].diemDanh + '.');
    // 2) trực đột xuất: trong giờ của một buổi, chưa có ca nào giờ này → ghi "Chờ duyệt"
    if (now.thu > 5 || cd.ngayNghi.indexOf(now.ngay) > -1) throw new Error('Hôm nay không có ca trực.');
    if (p < phut_(TRUC.NGAY_BD) - TRUC.SOM_PHUT || p >= phut_(TRUC.NGAY_KT)) throw new Error('Bây giờ không phải giờ trực (' + TRUC.NGAY_BD + ' - ' + TRUC.NGAY_KT + ', thứ 2 - thứ 6).');
    const tu = hhmm_(Math.max(phut_(TRUC.NGAY_BD), p)); // tính từ lúc điểm danh
    const den = gioChu_(req.den) || TRUC.NGAY_KT;
    if (phut_(den) <= phut_(tu) || phut_(den) > phut_(TRUC.NGAY_KT)) throw new Error('Giờ kết thúc phải sau ' + tu + ' và không quá ' + TRUC.NGAY_KT + '.');
    const b = buoiTheoGio_(tu);
    if (trungGio_(cua, now.ngay, tu, den)) throw new Error('Khung giờ này trùng một ca khác của bạn.');
    themDong_(ss, now.ngay, { b: b, tu: tu, den: den }, nd, 'Đột xuất', TT.CHO, 'Trực đột xuất, chờ quản lý duyệt', dd);
    const kq = lichTruc_(nd, now.ngay);
    kq.vuaDiemDanh = { tu: tu, den: den, luc: Utilities.formatDate(luc, MUI_GIO, 'HH:mm'), cach: cach, dotXuat: true };
    return kq;
  });
}

function khoangCach_(a1, o1, a2, o2) {
  const R = 6371000, rad = Math.PI / 180;
  const da = (a2 - a1) * rad, dob = (o2 - o1) * rad;
  const h = Math.sin(da / 2) * Math.sin(da / 2) + Math.cos(a1 * rad) * Math.cos(a2 * rad) * Math.sin(dob / 2) * Math.sin(dob / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
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

/** Giờ trực của một người trong tuần hiện tại (trang Của tôi). */
function trucTuanNay_(nd) {
  try {
    const ss = sheetTruc_(), cd = caiDatTruc_(ss), now = bayGio_(), t0 = dauTuan_(now.ngay);
    const ngay = [0, 1, 2, 3, 4].map(function (i) { return themNgay_(t0, i); });
    let dk = 0, dd = 0;
    docTruc_(ss).forEach(function (x) {
      if (ngay.indexOf(x.ngay) === -1 || !cuaNguoi_(nd)(x) || !conHieuLuc_(x) || x.trangThai === TT.CHO) return;
      dk += soPhut_(x); if (x.diemDanh) dd += soPhut_(x);
    });
    return { gioDangKy: dk / 60, gioDiemDanh: dd / 60, toiThieuGio: cd.toiThieuGio };
  } catch (err) { return null; }
}
