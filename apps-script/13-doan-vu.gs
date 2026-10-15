/* ------------------------------------------------ Thông tin Đoàn vụ (nhóm CSDL - CSVC) */
/*
 * CHỈ ĐỌC các sheet của vanphongdoan (link ở Cài đặt → Liên kết nhóm CSDL - CSVC):
 *   qldv  — sheet "Quản lý Đoàn vụ": tab "Danh sách ban đoàn vụ" (dòng tiêu đề có ô "Mã sinh viên") + tab "Track-Log" (chia theo dòng "ĐỢT n")
 *   xeMay — sheet "Xe máy Ban Đoàn vụ": tab "Mới" (hoặc tab đầu có cột "Biển số xe")
 * Không ghi gì vào 2 sheet này. Chỉ thành viên nhóm CSDL - CSVC và quản lý xem được (canNhom_).
 * Dữ liệu nhạy cảm (CCCD, STK, tôn giáo, dân tộc, cha mẹ, hoàn cảnh gia đình, địa chỉ) KHÔNG gửi về trình duyệt:
 *   chỉ trả "đã có / chưa có" cho từng mục hồ sơ; xem chi tiết thì mở sheet gốc.
 */
const DV_TT_CAN = ['Ngày sinh', 'Email', 'Số điện thoại', 'CCCD', 'Nơi sinh', 'Địa chỉ', 'Cha', 'Mẹ']; // mục thông tin cá nhân cần có
const DV_GIAY = [['syll', 'Sơ yếu lý lịch'], ['don', 'Đơn đăng ký'], ['tsv', 'Thẻ sinh viên'], ['cccd', 'CCCD'], ['anh', 'Ảnh thẻ']];

function khoaTen_(v) { return chuoi_(v).toLowerCase().normalize('NFC').replace(/\s+/g, ' ').trim(); }
function khoaMssv_(v) { return chuoi_(v).toUpperCase().replace(/[\s.]/g, ''); }
function coGiaTri_(v) { const s = chuoi_(v); return !!s && ['-', '/', 'không', 'không có', 'x'].indexOf(s.toLowerCase()) === -1; }
function ngayDv_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v)) return Utilities.formatDate(v, MUI_GIO, 'yyyy-MM-dd');
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(chuoi_(v));
  return m ? m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2) : '';
}

/** Danh sách ban đoàn vụ: trả map theo MSSV và theo tên → { mssv, ten, nhom, chucVu, lop, khoa, sdt, email, zalo, fb, thieuTT:[], giay:{}, xe:{}, thuMuc } */
function docDanhSachDv_(ss) {
  const s = ss.getSheetByName('Danh sách ban đoàn vụ') || ss.getSheets().filter(function (x) { return /danh sách ban đoàn vụ/i.test(x.getName()); })[0];
  if (!s || s.getLastRow() < 2) return [];
  const n = Math.min(s.getLastRow(), 400), w = s.getLastColumn();
  const v = s.getRange(1, 1, n, w).getValues();
  const rt = s.getRange(1, 1, n, w).getRichTextValues();
  let h = -1;
  for (let i = 0; i < Math.min(8, n); i++) if (v[i].some(function (c) { return chuanHoa_(c) === 'mã sinh viên'; })) { h = i; break; }
  if (h < 0) return [];
  const td = v[h].map(chuanHoa_), tren = h > 0 ? v[h - 1].map(chuanHoa_) : [];
  const dau = function (ten) { return td.indexOf(chuanHoa_(ten)); };
  const cuoi = function (ten) { return td.lastIndexOf(chuanHoa_(ten)); };
  // Nhóm CHA / MẸ nằm ở dòng trên tiêu đề; cột "Họ và Tên" đầu tiên sau mỗi nhãn
  const sau = function (nhan) { const c = tren.indexOf(chuanHoa_(nhan)); return c > -1 ? c : -1; };
  const c = {
    mssv: dau('Mã sinh viên'), ten: dau('Họ và Tên'), nhom: dau('Nhóm'), chucVu: td.findIndex(function (x) { return x.indexOf('chức vụ') === 0; }), lop: dau('Lớp'), khoa: dau('Khóa'),
    ngaySinh: dau('Ngày sinh'), email: dau('Email'), sdt: dau('Số điện thoại'), cccdSo: dau('CCCD'), noiSinh: dau('Nơi sinh'), diaChi: dau('Địa chỉ'),
    cha: sau('CHA'), me: sau('MẸ'), zalo: dau('Zalo'), fb: dau('Facebook'),
    syll: dau('Sơ yếu lý lịch'), don: dau('Đơn đăng ký'), tsv: dau('Thẻ sinh viên'), cccd: cuoi('CCCD'), anh: dau('Ảnh thẻ'), thuMuc: dau('Thư mục'),
    bien: sau('BIỂN SỐ XE'), loai: sau('LOẠI XE'), mau: sau('MÀU XE')
  };
  const g = function (r, k) { return c[k] > -1 ? r[c[k]] : ''; };
  const kq = [];
  for (let i = h + 1; i < n; i++) {
    const r = v[i], ten = chuoi_(g(r, 'ten'));
    if (!ten || /^\(\d+\)$/.test(ten)) continue;
    const tt = { 'Ngày sinh': g(r, 'ngaySinh'), 'Email': g(r, 'email'), 'Số điện thoại': g(r, 'sdt'), 'CCCD': g(r, 'cccdSo'), 'Nơi sinh': g(r, 'noiSinh'), 'Địa chỉ': g(r, 'diaChi'), 'Cha': g(r, 'cha'), 'Mẹ': g(r, 'me') };
    const giay = {}; DV_GIAY.forEach(function (x) { giay[x[0]] = coGiaTri_(g(r, x[0])); });
    let thuMuc = '';
    if (c.thuMuc > -1) { try { thuMuc = rt[i][c.thuMuc].getLinkUrl() || ''; } catch (e) {} }
    kq.push({
      mssv: chuoi_(g(r, 'mssv')), ten: ten, nhom: chuoi_(g(r, 'nhom')), chucVu: chuoi_(g(r, 'chucVu')), lop: chuoi_(g(r, 'lop')), khoa: chuoi_(g(r, 'khoa')),
      sdt: chuoi_(g(r, 'sdt')).replace(/\.0$/, ''), email: chuoi_(g(r, 'email')), zalo: chuoi_(g(r, 'zalo')).replace(/\.0$/, ''), fb: chuoi_(g(r, 'fb')),
      thieuTT: DV_TT_CAN.filter(function (k) { return !coGiaTri_(tt[k]); }), giay: giay,
      xe: coGiaTri_(g(r, 'bien')) ? { bien: chuoi_(g(r, 'bien')), loai: chuoi_(g(r, 'loai')), mau: chuoi_(g(r, 'mau')) } : null,
      thuMuc: /^https:\/\/(drive|docs)\.google\.com\//.test(thuMuc) ? thuMuc : ''
    });
  }
  return kq;
}

/** Track-Log: các dòng "ĐỢT n" chia đợt; Ngày vào "/" = không vào; Ngày ra có ngày / "Đã rời" = đã rời. */
function docTrackLog_(ss) {
  const s = ss.getSheetByName('Track-Log');
  if (!s || s.getLastRow() < 2) return [];
  const v = s.getRange(1, 1, s.getLastRow(), Math.min(8, s.getLastColumn())).getValues();
  let h = v.findIndex(function (r) { return r.some(function (x) { return chuanHoa_(x) === 'mã sinh viên'; }); });
  if (h < 0) return [];
  const td = v[h].map(chuanHoa_), ci = function (t) { return td.indexOf(chuanHoa_(t)); };
  const cM = ci('Mã sinh viên'), cT = ci('Họ và Tên'), cD = ci('Ngày đăng ký'), cV = ci('Ngày vào'), cR = ci('Ngày ra'), cG = ci('Ghi chú');
  const kq = []; let dot = 'Đợt đầu';
  for (let i = h + 1; i < v.length; i++) {
    const r = v[i], a = chuoi_(r[0]);
    const m = /^đợt\s*(\d+)/i.exec(a) || /^đợt\s*(\d+)/i.exec(chuoi_(r[cM]));
    if (m) { dot = 'Đợt ' + m[1]; continue; }
    const ten = chuoi_(r[cT]);
    if (!ten || /^\(\d+\)$/.test(ten)) continue;
    const vaoS = chuoi_(r[cV]), raS = chuoi_(r[cR]), dkS = chuoi_(r[cD]);
    const vao = ngayDv_(r[cV]), ra = ngayDv_(r[cR]);
    const daVao = !!vao || (!!vaoS && vaoS !== '/' && vaoS !== '-');
    const daRoi = daVao && (!!ra || /rời/i.test(raS));
    kq.push({ dot: dot, mssv: chuoi_(r[cM]), ten: ten, cachVao: /tuyển/i.test(dkS) || /người/i.test(dkS) ? dkS : 'Đăng ký',
      dangKy: ngayDv_(r[cD]), vao: vao, ra: ra, trangThai: !daVao ? 'Không vào' : daRoi ? 'Đã rời' : 'Đang hoạt động', ghiChu: chuoi_(r[cG]).slice(0, 200) });
  }
  return kq;
}

/** Sheet xe máy: tab "Mới" (danh sách hiện tại) hoặc tab đầu tiên có cột "Biển số xe". */
function docXeMay_(ss) {
  const tabs = [ss.getSheetByName('Mới')].concat(ss.getSheets()).filter(Boolean);
  for (let t = 0; t < tabs.length; t++) {
    const s = tabs[t]; if (s.getLastRow() < 2) continue;
    const v = s.getRange(1, 1, Math.min(s.getLastRow(), 300), Math.min(14, s.getLastColumn())).getValues();
    const h = v.slice(0, 6).findIndex(function (r) { return r.some(function (x) { return chuanHoa_(x) === 'biển số xe'; }); });
    if (h < 0) continue;
    const td = v[h].map(chuanHoa_), ci = function (k) { return td.findIndex(function (x) { return x.indexOf(k) === 0; }); };
    const c = { mssv: ci('mã sinh viên'), ten: ci('họ'), chiDoan: ci('chi đoàn'), bien: ci('biển số'), loai: ci('loại xe'), mau: ci('màu xe'), ghiChu: ci('ghi chú') };
    return { tab: s.getName(), ds: v.slice(h + 1).filter(function (r) { return chuoi_(r[c.ten]) && coGiaTri_(r[c.bien]); }).map(function (r) {
      const g = function (k) { return c[k] > -1 ? chuoi_(r[c[k]]) : ''; };
      return { mssv: g('mssv'), ten: g('ten'), chiDoan: g('chiDoan'), bien: g('bien'), loai: g('loai'), mau: g('mau'), ghiChu: g('ghiChu') };
    }) };
  }
  return { tab: '', ds: [] };
}

/** Thành viên hiện tại = sheet tài khoản dashboard (họ tên, nhóm, MSSV, chức vụ, vai trò). */
function thanhVienTaiKhoan_() {
  const s = ssTaiKhoan_().getSheets()[0];
  if (s.getLastRow() < 2) return [];
  const v = s.getRange(1, 1, s.getLastRow(), s.getLastColumn()).getValues(), td = v[0].map(chuanHoa_);
  const ci = function (t) { return td.indexOf(chuanHoa_(t)); };
  const cMssv = ci('MSSV'), cCv = ci('Chức vụ'), cVt = ci('Vai trò'), cLop = ci('Lớp'), cSdt = ci('Số điện thoại');
  const daCo = {};
  return v.slice(1).filter(function (r) { const t = khoaTen_(r[0]); if (!t || daCo[t]) return false; daCo[t] = 1; return true; }).map(function (r) {
    return { ten: chuoi_(r[0]), nhomChu: chuoi_(r[1]), nhom: maNhomTuChu_(r[1]), email: chuoi_(r[2]).split(/[,;\s]+/)[0],
      mssv: cMssv > -1 ? chuoi_(r[cMssv]) : '', chucVu: cCv > -1 ? chuoi_(r[cCv]) : '', quanLy: cVt > -1 && chuanHoa_(r[cVt]).indexOf('quản lý') > -1,
      lop: cLop > -1 ? chuoi_(r[cLop]) : '', sdt: cSdt > -1 ? chuoi_(r[cSdt]) : '' };
  });
}

function doanVu_(nd) {
  canNhom_(nd, NHOM_CSVC);
  const lk = lienKet_(), c = CacheService.getScriptCache();
  let d = null;
  try { const co = c.get('doanvu2'); if (co) d = JSON.parse(co); } catch (e) {}
  if (!d) {
    d = { loi: {}, ds: [], track: [], xe: { tab: '', ds: [] } };
    if (lk.qldv) {
      try { const ss = moSheetLienKet_('qldv', 'sheet Quản lý Đoàn vụ'); d.ds = docDanhSachDv_(ss); d.track = docTrackLog_(ss); }
      catch (e) { d.loi.qldv = String(e.message || e); }
    }
    if (lk.xeMay) {
      try { d.xe = docXeMay_(moSheetLienKet_('xeMay', 'sheet xe máy Ban Đoàn vụ')); }
      catch (e) { d.loi.xeMay = String(e.message || e); }
    }
    if (lk.qldv && !d.loi.qldv) { try { c.put('doanvu2', JSON.stringify(d), 300); } catch (e) {} }
  }
  // Ghép với thành viên hiện tại (tài khoản dashboard)
  const theoMssv = {}, theoTen = {};
  d.ds.forEach(function (x, i) { if (x.mssv) theoMssv[khoaMssv_(x.mssv)] = i; theoTen[khoaTen_(x.ten)] = i; });
  const xeMssv = {}, xeTen = {};
  d.xe.ds.forEach(function (x) { if (x.mssv) xeMssv[khoaMssv_(x.mssv)] = x; xeTen[khoaTen_(x.ten)] = x; });
  const trTen = {}; d.track.forEach(function (t) { if (t.trangThai !== 'Không vào') trTen[khoaTen_(t.ten)] = t; });
  const dung = {};
  const tv = thanhVienTaiKhoan_().filter(function (t) { return !t.quanLy || t.nhom.length; }).map(function (t) {
    let i = t.mssv && theoMssv[khoaMssv_(t.mssv)] !== undefined ? theoMssv[khoaMssv_(t.mssv)] : theoTen[khoaTen_(t.ten)];
    const x = i !== undefined ? d.ds[i] : null; if (x) dung[i] = 1;
    const xe = (t.mssv && xeMssv[khoaMssv_(t.mssv)]) || xeTen[khoaTen_(t.ten)] || (x && x.xe) || null;
    const tr = trTen[khoaTen_(t.ten)];
    return {
      ten: t.ten, nhom: t.nhom.map(function (m) { return TEN_NHOM[m] || m; }).join(', ') || t.nhomChu, chucVu: t.chucVu || (x ? x.chucVu : ''),
      mssv: t.mssv || (x ? x.mssv : ''), lop: t.lop || (x ? x.lop : ''), sdt: t.sdt || (x ? x.sdt : ''), email: x && x.email ? x.email : t.email,
      zalo: x ? x.zalo : '', fb: x ? x.fb : '', coTrongSheet: !!x, thieuTT: x ? x.thieuTT : DV_TT_CAN.slice(), giay: x ? x.giay : {},
      thuMuc: x ? x.thuMuc : '', xe: xe ? { bien: xe.bien, loai: xe.loai, mau: xe.mau } : null, vao: tr ? tr.vao : '', dot: tr ? tr.dot : ''
    };
  });
  return {
    lienKet: { qldv: lk.qldv, xeMay: lk.xeMay, formTT: lk.formTT, formXe: lk.formXe, folderHoSo: lk.folderHoSo },
    loi: d.loi, giay: DV_GIAY, ttCan: DV_TT_CAN, thanhVien: tv,
    ngoaiTaiKhoan: d.ds.filter(function (x, i) { return !dung[i]; }).map(function (x) { return { ten: x.ten, nhom: x.nhom, chucVu: x.chucVu }; }),
    track: d.track.map(function (t) { return { dot: t.dot, ten: t.ten, cachVao: t.cachVao, dangKy: t.dangKy, vao: t.vao, ra: t.ra, trangThai: t.trangThai }; }),
    xe: d.xe, homNay: bayGio_().ngay
  };
}
