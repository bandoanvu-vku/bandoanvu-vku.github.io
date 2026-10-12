
/* ------------------------------------------------- đăng nhập bằng Google */

const DANG_NHAP = {
  CLIENT_ID: '416137728937-0o67vc9pdrhfvftgutl145ic7va4bafr.apps.googleusercontent.com',
  TEN_SHEET: 'Tài khoản dashboard - Ban Đoàn vụ',
  TAB: 'Tài khoản',
  NGAY_PHIEN: 7 // phiên đăng nhập dùng được bao nhiêu ngày
};
const TEN_NHOM = { '4t': 'Truyền thông - Thông tin', 'nghiep-vu': 'Nghiệp vụ', 'csdl-csvc': 'Cơ sở dữ liệu - Cơ sở vật chất', 'noi-vu': 'Nội vụ' };

function loiDangNhap_(m) { const e = new Error(m); e.canDangNhap = true; return e; }
function loiQuyen_(m) { const e = new Error(m); e.khongQuyen = true; return e; }

/** Kiểm tra ID token Google, trả về email đã xác minh. */
function xacMinhGoogle_(token) {
  token = String(token || '');
  if (!token) throw loiDangNhap_('Bạn cần đăng nhập Google.');
  const r = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token), { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw loiDangNhap_('Đăng nhập Google không hợp lệ hoặc đã hết hạn. Bạn thử lại nhé.');
  const t = JSON.parse(r.getContentText());
  if (t.aud !== DANG_NHAP.CLIENT_ID) throw loiDangNhap_('Token không dành cho dashboard này.');
  if (['accounts.google.com', 'https://accounts.google.com'].indexOf(t.iss) === -1) throw loiDangNhap_('Token không hợp lệ.');
  if (String(t.email_verified) !== 'true' || !t.email) throw loiDangNhap_('Email Google chưa được xác minh.');
  if (!(Number(t.exp) * 1000 > Date.now())) throw loiDangNhap_('Đăng nhập đã hết hạn, bạn thử lại nhé.');
  return String(t.email).toLowerCase();
}

/* Phiên đăng nhập riêng của dashboard (ký HMAC), để không phải đăng nhập Google lại mỗi giờ. */
function biMat_() {
  const p = PropertiesService.getScriptProperties();
  let s = p.getProperty('BI_MAT_PHIEN');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); p.setProperty('BI_MAT_PHIEN', s); }
  return s;
}
function ky_(s) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(s, biMat_())).replace(/=+$/, '');
}
function taoPhien_(email) {
  const het = Math.floor(Date.now() / 1000) + DANG_NHAP.NGAY_PHIEN * 86400;
  const tai = Utilities.base64EncodeWebSafe(email + '|' + het, Utilities.Charset.UTF_8).replace(/=+$/, '');
  return { t: 's1.' + tai + '.' + ky_(tai), het: het };
}
function docPhien_(token) {
  token = String(token || '');
  if (!token) throw loiDangNhap_('Bạn cần đăng nhập để xem dashboard.');
  const p = token.split('.');
  if (p.length !== 3 || p[0] !== 's1' || ky_(p[1]) !== p[2]) throw loiDangNhap_('Phiên đăng nhập không hợp lệ, bạn đăng nhập lại nhé.');
  let tai = p[1];
  while (tai.length % 4) tai += '=';
  const x = Utilities.newBlob(Utilities.base64DecodeWebSafe(tai)).getDataAsString().split('|');
  if (!(Number(x[1]) * 1000 > Date.now())) throw loiDangNhap_('Phiên đăng nhập đã hết hạn, bạn đăng nhập lại nhé.');
  return x[0];
}

/** Bảng email -> { ten, quanLy } đọc từ sheet "Tài khoản dashboard". Nhớ tạm 2 phút. */
function bangTaiKhoan_() {
  const cache = CacheService.getScriptCache();
  const daCo = cache.get('taikhoan3');
  if (daCo) return JSON.parse(daCo);
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_TAI_KHOAN');
  if (!id) throw new Error('Chưa có sheet tài khoản dashboard.');
  const s = SpreadsheetApp.openById(id).getSheets()[0];
  const bang = {};
  if (s.getLastRow() >= 2) {
    const tieuDe = s.getRange(1, 1, 1, Math.max(4, s.getLastColumn())).getValues()[0].map(chuanHoa_);
    const cVaiTro = tieuDe.indexOf(chuanHoa_('Vai trò'));
    s.getRange(2, 1, s.getLastRow() - 1, Math.max(4, s.getLastColumn())).getValues().forEach(function (r) {
      const ten = chuoi_(r[0]);
      const quanLy = cVaiTro > -1 && chuanHoa_(r[cVaiTro]).indexOf(chuanHoa_('quản lý')) > -1;
      const nhom = maNhomTuChu_(r[1]);
      String(r[2] || '').split(/[,;\s]+/).forEach(function (em) {
        em = em.trim().toLowerCase();
        if (ten && em && em.indexOf('@') > 0) bang[em] = { ten: ten, quanLy: quanLy, nhom: nhom };
      });
    });
  }
  try { cache.put('taikhoan3', JSON.stringify(bang), 120); } catch (err) {}
  return bang;
}

/** Đổi chữ ở cột "Nhóm" (vd "Nghiệp vụ, Cơ sở dữ liệu - Cơ sở vật chất") thành mã nhóm. */
function maNhomTuChu_(v) {
  const s = chuanHoa_(v), kq = [];
  if (s.indexOf('truyền thông') > -1 || /\b4t\b/.test(s)) kq.push('4t');
  if (s.indexOf('nghiệp vụ') > -1) kq.push('nghiep-vu');
  if (s.indexOf('cơ sở dữ liệu') > -1 || s.indexOf('cơ sở vật chất') > -1 || s.indexOf('csdl') > -1 || s.indexOf('csvc') > -1) kq.push('csdl-csvc');
  if (s.indexOf('nội vụ') > -1) kq.push('noi-vu');
  return kq;
}

/** Tên những người được ghi thuộc nhóm `ma` ở cột "Nhóm" của sheet tài khoản. */
function themTuTaiKhoan_(ma) {
  let bang;
  try { bang = bangTaiKhoan_(); } catch (err) { return []; }
  const ds = [];
  Object.keys(bang).forEach(function (em) {
    const tk = bang[em];
    if ((tk.nhom || []).indexOf(ma) > -1 && ds.indexOf(tk.ten) === -1) ds.push(tk.ten);
  });
  return ds;
}

function hopNhat_(a, b) {
  const kq = (a || []).slice();
  (b || []).forEach(function (t) { if (kq.indexOf(t) === -1) kq.push(t); });
  return kq;
}

/** Thông tin một email: tên, vai trò, các nhóm (theo danh sách thành viên trong sheet của từng nhóm). */
function hoSo_(email) {
  const tk = bangTaiKhoan_()[email];
  if (!tk) {
    throw new Error('Email ' + email + ' chưa có trong danh sách tài khoản của Ban. Nhờ quản lý điền email này vào đúng dòng tên bạn trong sheet "' +
      DANG_NHAP.TEN_SHEET + '" rồi thử lại sau 2 phút.');
  }
  // Nhóm = nhóm ghi ở cột "Nhóm" của sheet tài khoản + nhóm nào có tên người này trong danh sách thành viên
  const nhom = [];
  const coTrongNhom = function (ma) {
    if ((tk.nhom || []).indexOf(ma) > -1) return true;
    try { return (ma === '4t' ? layDuLieu(false) : layNhom(ma, false)).thanhVien.indexOf(tk.ten) > -1; } catch (err) { return false; }
  };
  ['4t'].concat(NHOM_MOI.map(function (n) { return n.ma; })).forEach(function (ma) { if (coTrongNhom(ma)) nhom.push(ma); });
  return { email: email, ten: tk.ten, vaiTro: tk.quanLy ? 'quanLy' : 'thanhVien', nhom: nhom };
}

/** Bước đăng nhập: đổi ID token Google lấy phiên dashboard. */
function dangNhap_(idToken) {
  const email = xacMinhGoogle_(idToken);
  const nd = hoSo_(email);
  const ph = taoPhien_(email);
  return { phien: ph.t, het: ph.het, nguoi: nd };
}

/** Người đang đăng nhập (kiểm tra lại sheet tài khoản mỗi lần, nên xoá email là mất quyền ngay sau ~2 phút). */
function nguoiDung_(token) {
  try {
    return hoSo_(docPhien_(token));
  } catch (err) {
    if (!err.canDangNhap && !err.khongQuyen) err.canDangNhap = true;
    throw err;
  }
}

function canNhom_(nd, ma) {
  if (!Object.prototype.hasOwnProperty.call(TEN_NHOM, ma)) throw new Error('Không có nhóm này.');
  if (nd.vaiTro === 'quanLy' || nd.nhom.indexOf(ma) > -1) return;
  throw loiQuyen_('Tài khoản của bạn không thuộc nhóm ' + TEN_NHOM[ma] + ', nên không xem được trang này.');
}

/** Quản lý thấy toàn bộ; thành viên chỉ thấy số liệu các nhóm mình thuộc về. */
function locTongQuan_(kq, nd) {
  const tatCa = nd.vaiTro === 'quanLy';
  if (!tatCa && kq.nguoi.some(function (p) { return !p.theoNhom; })) kq = layTongQuan(true); // bản nhớ tạm cũ chưa có số liệu theo nhóm
  const duoc = function (ma) { return tatCa || nd.nhom.indexOf(ma) > -1; };
  const sapToi = kq.sapToi.filter(function (v) { return duoc(v.nhom); });
  const nguoi = [];
  kq.nguoi.forEach(function (p) {
    if (tatCa) { nguoi.push({ ten: p.ten, nhom: p.nhom, giao: p.giao, xong: p.xong, quaHan: p.quaHan }); return; }
    const o = { ten: p.ten, nhom: [], giao: 0, xong: 0, quaHan: 0 };
    Object.keys(p.theoNhom || {}).forEach(function (ma) {
      if (!duoc(ma)) return;
      const x = p.theoNhom[ma];
      o.nhom.push(ma); o.giao += x.giao; o.xong += x.xong; o.quaHan += x.quaHan;
    });
    if (o.giao) nguoi.push(o);
  });
  nguoi.sort(function (a, b) { return b.giao - a.giao; });
  return {
    phamVi: tatCa ? 'tatCa' : 'nhom',
    homNay: kq.homNay,
    nhom: kq.nhom.filter(function (n) { return duoc(n.ma); }),
    nguoi: nguoi,
    sapToi: sapToi.slice(0, 20),
    soSapToi: sapToi.length,
    thang: duoc('4t') ? kq.thang : [],
    tuoi: kq.tuoi
  };
}

/** Trang "Của tôi": hồ sơ và mọi việc của người đăng nhập ở các nhóm. */
function cuaToi_(nd, moi) {
  const viec = [], ten = nd.ten;
  let tuoi = 0;
  if (nd.nhom.indexOf('4t') > -1) {
    const d = layDuLieu(moi);
    tuoi = Math.max(tuoi, d.tuoi || 0);
    d.cacThang.forEach(function (t) {
      t.hoatDong.forEach(function (h) {
        h.viec.forEach(function (v) {
          if (v.nguoi !== ten) return;
          const loai = VIEC.filter(function (x) { return x.key === v.key; })[0];
          viec.push({ nhom: '4t', ten: h.ten, vaiTro: loai ? loai.tieuDe : v.key, han: h.ngay || '', xong: !!v.xong, trangThai: v.xong ? 'Hoàn thành' : 'Đã nhận' });
        });
      });
    });
  }
  NHOM_MOI.forEach(function (n) {
    if (nd.nhom.indexOf(n.ma) === -1) return;
    const d = layNhom(n.ma, moi);
    tuoi = Math.max(tuoi, d.tuoi || 0);
    d.nhiemVu.forEach(function (v) {
      const hoTro = v.hoTro.split(',').map(chuoi_).filter(String);
      const vt = v.chinh === ten ? 'Phụ trách' : hoTro.indexOf(ten) > -1 ? 'Hỗ trợ' : '';
      if (!vt) return;
      viec.push({ nhom: n.ma, ten: v.ten, vaiTro: vt, han: v.han || '', xong: v.trangThai === 'Hoàn thành', trangThai: v.trangThai || 'Chưa làm', mang: v.mang, link: v.link });
    });
  });
  return {
    nguoi: nd,
    homNay: Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd'),
    viec: viec,
    tuoi: tuoi
  };
}

/** Chạy một lần từ trình chỉnh sửa: thêm cột "Vai trò" vào sheet tài khoản và một dòng tài khoản quản lý. */
function nangCapSheetTaiKhoan() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_TAI_KHOAN');
  const s = SpreadsheetApp.openById(id).getSheets()[0];
  const tieuDe = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0].map(chuoi_);
  if (tieuDe.indexOf('Vai trò') === -1) {
    s.insertColumnAfter(3);
    s.getRange(1, 4).setValue('Vai trò').setFontWeight('bold').setBackground('#1a56c4').setFontColor('#ffffff');
    s.setColumnWidth(4, 120);
    s.getRange('D1').setNote('Quản lý: xem được toàn bộ dashboard. Thành viên: chỉ xem trang của nhóm mình, tổng quan nhóm mình và trang Của tôi.');
    const n = s.getLastRow() - 1;
    if (n > 0) s.getRange(2, 4, n, 1).setValues(s.getRange(2, 1, n, 1).getValues().map(function (r) { return [chuoi_(r[0]) ? 'Thành viên' : '']; }));
  }
  s.getRange(2, 4, Math.max(s.getLastRow(), 2) + 50, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Quản lý', 'Thành viên'], true).setAllowInvalid(false).build());
  const emails = s.getRange(2, 3, Math.max(s.getLastRow() - 1, 1), 1).getValues().map(function (r) { return String(r[0]).toLowerCase(); });
  if (emails.join(',').indexOf('vanborapper@gmail.com') === -1) {
    s.appendRow(['Quản lý Ban', '', 'vanborapper@gmail.com', 'Quản lý', 'Tài khoản quản lý: xem được toàn bộ dashboard. Có thể đổi tên dòng này.']);
  }
  CacheService.getScriptCache().remove('taikhoan3');
  return 'ok';
}
