/* ------------------------------------------------ nhóm CSDL - CSVC: liên kết sheet, công văn (chỉ đọc), duyệt 2 cấp, mượn / trả tài sản */
/*
 * Liên kết (link sheet / folder) lưu ở tab "Cài đặt" của sheet lịch trực — quản lý dán ở trang Cài đặt. Không ghi ID vào repo.
 * Công văn: dashboard CHỈ ĐỌC 2 sheet công văn đi / đến (việc lưu công văn vẫn làm trên sheet).
 * Duyệt 2 cấp (việc của nhóm cần duyệt): trưởng nhóm duyệt → quản lý duyệt.
 *   Trưởng nhóm không duyệt → "Trả lại" (về thành viên sửa); quản lý không duyệt → "Quản lý trả lại" (về nhóm sửa).
 *   Trưởng nhóm = người thuộc nhóm có cột "Chức vụ" (sheet tài khoản) ghi "Trưởng nhóm". Nhóm chưa có trưởng nhóm thì gửi thẳng quản lý.
 * Mượn / trả: sheet riêng (link "Sheet mượn trả tài sản"), tab đầu là danh mục tài sản; tab "Mượn về", "Cho mượn" tự tạo.
 */
const LIEN_KET = [
  ['cvDi', 'Link sheet công văn đi'], ['cvDiFolder', 'Link folder công văn đi'],
  ['cvDen', 'Link sheet công văn đến'], ['cvDenFolder', 'Link folder công văn đến'],
  ['bbTuanThang', 'Link biên bản kiểm kê tuần/tháng'], ['bbNam', 'Link biên bản kiểm kê năm'],
  ['muonTra', 'Link sheet mượn trả tài sản']
];
const TT2 = { CHO_TN: 'Chờ trưởng nhóm duyệt', CHO_QL: 'Chờ quản lý duyệt', DUYET: 'Đã duyệt', TRA_TN: 'Trả lại', TRA_QL: 'Quản lý trả lại', HUY: 'Đã huỷ' };
const NHOM_CSVC = 'csdl-csvc';

/* ---------------- liên kết */

function lienKet_() {
  const s = sheetTruc_().getSheetByName('Cài đặt');
  const v = s && s.getLastRow() ? s.getRange(1, 1, s.getLastRow(), 2).getValues() : [];
  const o = {};
  LIEN_KET.forEach(function (k) {
    const r = v.filter(function (x) { return chuanHoa_(x[0]) === chuanHoa_(k[1]); })[0];
    o[k[0]] = r ? chuoi_(r[1]) : '';
  });
  return o;
}
function idTuLink_(url) {
  const s = chuoi_(url);
  const m = /\/(?:d|folders)\/([a-zA-Z0-9_-]{15,})/.exec(s) || /[?&]id=([a-zA-Z0-9_-]{15,})/.exec(s);
  return m ? m[1] : /^[a-zA-Z0-9_-]{25,}$/.test(s) ? s : '';
}
function laSheetGoogle_(url) { return /docs\.google\.com\/spreadsheets\/d\//.test(chuoi_(url)); }
function moSheetLienKet_(khoa, ten) {
  const url = lienKet_()[khoa];
  if (!url) throw new Error('Chưa có ' + ten + '. Quản lý dán link ở trang Cài đặt → Liên kết nhóm CSDL - CSVC.');
  if (!laSheetGoogle_(url)) throw new Error(ten + ' không phải Google Sheet (có thể là file Excel). Mở file → Tệp → Lưu dưới dạng Google Trang tính rồi dán link mới.');
  try { return SpreadsheetApp.openById(idTuLink_(url)); }
  catch (e) { throw new Error('Không mở được ' + ten + '. Kiểm tra link và chia sẻ quyền xem cho tài khoản chạy dashboard.'); }
}
function luuLienKet_(nd, req) {
  canQuanLy_(nd, 'sửa được liên kết');
  return voiKhoa_(function () {
    const s = sheetTruc_().getSheetByName('Cài đặt');
    const nhan = s.getRange(1, 1, Math.max(s.getLastRow(), 1), 1).getValues().map(function (r) { return chuanHoa_(r[0]); });
    LIEN_KET.forEach(function (k) {
      if (!req.lienKet || req.lienKet[k[0]] === undefined) return;
      const url = chuoi_(req.lienKet[k[0]]).slice(0, 500);
      if (url && !/^https:\/\/(docs|drive)\.google\.com\//.test(url)) throw new Error(k[1] + ': cần link Google Drive / Google Sheets.');
      let d = nhan.indexOf(chuanHoa_(k[1])) + 1;
      if (!d) { s.appendRow([k[1], '', '']); d = s.getLastRow(); nhan.push(chuanHoa_(k[1])); }
      s.getRange(d, 2).setNumberFormat('@').setValue(url);
    });
    try { CacheService.getScriptCache().removeAll(['congvan', 'danhmuc']); } catch (e) {}
    return caiDat_(nd);
  });
}

/* ---------------- duyệt 2 cấp */

/** Tên các trưởng nhóm của nhóm (cột "Chức vụ" trong sheet tài khoản). */
function truongNhom_(ma) {
  const c = CacheService.getScriptCache(), k = 'truongnhom:' + ma, co = c.get(k);
  if (co) return JSON.parse(co);
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_TAI_KHOAN');
  const s = SpreadsheetApp.openById(id).getSheets()[0], kq = [];
  if (s.getLastRow() >= 2) {
    const dau = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0].map(chuanHoa_), cCv = dau.indexOf(chuanHoa_('Chức vụ'));
    if (cCv > -1) {
      let tv = [];
      try { tv = layNhom(ma, false).thanhVien; } catch (e) {}
      s.getRange(2, 1, s.getLastRow() - 1, s.getLastColumn()).getValues().forEach(function (r) {
        const cv = chuanHoa_(r[cCv]), ten = chuoi_(r[0]);
        if (!ten || cv.indexOf('trưởng nhóm') === -1 || /^phó/.test(cv)) return;
        if (maNhomTuChu_(r[1]).indexOf(ma) > -1 || tv.indexOf(ten) > -1) kq.push(ten);
      });
    }
  }
  try { c.put(k, JSON.stringify(kq), 300); } catch (e) {}
  return kq;
}
function vaiDuyet_(nd, ma) {
  const tn = truongNhom_(ma);
  return { ql: nd.vaiTro === 'quanLy', tn: tn.indexOf(nd.ten) > -1, coTN: tn.length > 0, dsTN: tn };
}
/** Trạng thái khi gửi (hoặc gửi lại) một việc cần duyệt. */
function trangThaiGui_(nd, ma) {
  const v = vaiDuyet_(nd, ma);
  return v.ql ? TT2.DUYET : (v.tn || !v.coTN) ? TT2.CHO_QL : TT2.CHO_TN;
}
/** Một bước duyệt → { tt, cap: 'tn' | 'ql', ghi: 'Tên · thời điểm · Đồng ý/Trả lại' }. */
function buocDuyet_(nd, ma, tt, dongY, gc) {
  const v = vaiDuyet_(nd, ma), luc = Utilities.formatDate(new Date(), MUI_GIO, 'dd/MM HH:mm');
  if (!dongY && !gc) throw new Error('Ghi lý do / việc cần sửa khi trả lại.');
  const ghi = nd.ten + ' · ' + luc + ' · ' + (dongY ? 'Đồng ý' : 'Trả lại') + (gc ? ': ' + gc : '');
  if (tt === TT2.CHO_TN) {
    if (!v.ql && !v.tn) throw loiQuyen_('Chỉ trưởng nhóm (hoặc quản lý) duyệt bước này.');
    return { tt: dongY ? (v.ql ? TT2.DUYET : TT2.CHO_QL) : TT2.TRA_TN, cap: 'tn', ghi: ghi };
  }
  if (tt === TT2.CHO_QL) {
    if (!v.ql) throw loiQuyen_('Bước này chờ quản lý duyệt.');
    return { tt: dongY ? TT2.DUYET : TT2.TRA_QL, cap: 'ql', ghi: ghi };
  }
  throw new Error('Mục này không ở trạng thái chờ duyệt.');
}

/* ---------------- công văn (chỉ đọc) */

function hangTieuDe_(v) {
  for (let i = 0; i < Math.min(v.length, 15); i++) if (chuanHoa_(v[i][0]) === 'stt') return i;
  return -1;
}
function cotTheo_(dau, khoa) { for (let i = 0; i < dau.length; i++) if (khoa.some(function (k) { return dau[i].indexOf(k) > -1; })) return i; return -1; }
function soDau_(so) { const m = /^\s*0*(\d{1,4})/.exec(chuoi_(so)); return m ? Number(m[1]) : 0; }

function docCvDi_() {
  const ss = moSheetLienKet_('cvDi', 'sheet công văn đi');
  // tab nhiệm kỳ mới nhất: tên dạng "2025-2027"
  const tabs = ss.getSheets().map(function (s) { const m = /(\d{4})\s*-\s*(\d{4})/.exec(s.getName()); return { s: s, a: m ? +m[1] : 0, b: m ? +m[2] : 0 }; });
  tabs.sort(function (x, y) { return y.b - x.b || y.a - x.a; });
  const s = tabs[0].s, v = s.getDataRange().getValues(), h = hangTieuDe_(v);
  if (h < 0) throw new Error('Không thấy dòng tiêu đề (STT) trong tab ' + s.getName() + ' của sheet công văn đi.');
  const dau = v[h].map(chuanHoa_);
  const c = { so: cotTheo_(dau, ['số ký hiệu', 'số kí hiệu']), ngay: cotTheo_(dau, ['ngày']), soan: cotTheo_(dau, ['soạn']), ky: cotTheo_(dau, ['người ký', 'người kí']),
    trich: cotTheo_(dau, ['trích yếu']), trang: cotTheo_(dau, ['số trang']), docs: cotTheo_(dau, ['docs']), pdf: cotTheo_(dau, ['pdf']), gdn: cotTheo_(dau, ['giấy đề nghị']), gc: cotTheo_(dau, ['ghi chú']) };
  const lay = function (r, k) { return c[k] > -1 ? r[c[k]] : ''; };
  const ds = [];
  for (let i = h + 1; i < v.length; i++) {
    const r = v[i], so = chuoi_(lay(r, 'so'));
    if (!so && !chuoi_(lay(r, 'trich'))) continue;
    ds.push({ dong: i + 1, so: so, ngay: ngayISO_(lay(r, 'ngay'), MUI_GIO) || '', soan: chuoi_(lay(r, 'soan')), ky: chuoi_(lay(r, 'ky')),
      trichYeu: chuoi_(lay(r, 'trich')), trang: chuoi_(lay(r, 'trang')), docs: chuoi_(lay(r, 'docs')), pdf: chuoi_(lay(r, 'pdf')), gdn: chuoi_(lay(r, 'gdn')), ghiChu: chuoi_(lay(r, 'gc')) });
  }
  const now = bayGio_(), thang = now.ngay.slice(0, 7);
  const soMax = ds.reduce(function (m, x) { return Math.max(m, soDau_(x.so)); }, 0);
  const daLuu = ds.filter(function (x) { return x.trichYeu; });
  return {
    tab: s.getName(), soTiep: soMax + 1, tong: daLuu.length,
    thangNay: daLuu.filter(function (x) { return x.ngay.slice(0, 7) === thang; }).length,
    ganDay: daLuu.slice(-10).reverse(),
    chuaTen: ds.filter(function (x) { return x.so && !x.trichYeu; }).map(function (x) { return { so: x.so, dong: x.dong }; }).slice(-15).reverse(),
    chuaPdf: daLuu.filter(function (x) { return !x.pdf && !/không lưu/i.test(x.ghiChu); }).map(function (x) { return { so: x.so, ngay: x.ngay, trichYeu: x.trichYeu }; }).slice(-15).reverse(),
    soChuaPdf: daLuu.filter(function (x) { return !x.pdf && !/không lưu/i.test(x.ghiChu); }).length
  };
}
function loaiCvDen_(ten) {
  const t = chuanHoa_(ten);
  if (t.indexOf('trong') > -1) return 'Trong trường';
  if (t.indexOf('ngoài') > -1) return 'Ngoài trường';
  if (t.indexOf('clb') > -1 || t.indexOf('đội') > -1 || t.indexOf('nhóm') > -1) return 'CLB - Đội - Nhóm';
  return '';
}
function docCvDen_() {
  const ss = moSheetLienKet_('cvDen', 'sheet công văn đến'), now = bayGio_(), thang = now.ngay.slice(0, 7);
  const loai = [], tat = [], chuaLink = [];
  ss.getSheets().forEach(function (s) {
    const ten = loaiCvDen_(s.getName());
    if (!ten) return;
    const v = s.getDataRange().getValues(), h = hangTieuDe_(v);
    if (h < 0) return;
    const dau = v[h].map(chuanHoa_);
    const c = { so: cotTheo_(dau, ['số ký hiệu', 'số kí hiệu']), ngay: cotTheo_(dau, ['ngày']), dv: cotTheo_(dau, ['đơn vị']), trich: cotTheo_(dau, ['trích yếu']), link: cotTheo_(dau, ['link']), trang: cotTheo_(dau, ['số trang']) };
    const ds = [];
    for (let i = h + 1; i < v.length; i++) {
      const r = v[i], tr = c.trich > -1 ? chuoi_(r[c.trich]) : '';
      if (!tr) continue;
      ds.push({ loai: ten, so: c.so > -1 ? chuoi_(r[c.so]) : '', ngay: c.ngay > -1 ? (ngayISO_(r[c.ngay], MUI_GIO) || '') : '', donVi: c.dv > -1 ? chuoi_(r[c.dv]).replace(/\s+/g, ' ') : '',
        trichYeu: tr, link: c.link > -1 ? chuoi_(r[c.link]).split('\n')[0] : '', trang: c.trang > -1 ? chuoi_(r[c.trang]) : '', thu: i });
    }
    loai.push({ ten: ten, tab: s.getName(), tong: ds.length, thangNay: ds.filter(function (x) { return x.ngay.slice(0, 7) === thang; }).length });
    ds.slice(-8).forEach(function (x) { tat.push(x); });
    ds.filter(function (x) { return !x.link; }).slice(-5).forEach(function (x) { chuaLink.push(x); });
  });
  const sx = function (a, b) { return (b.ngay || '') < (a.ngay || '') ? -1 : (b.ngay || '') > (a.ngay || '') ? 1 : b.thu - a.thu; };
  return { loai: loai, ganDay: tat.sort(sx).slice(0, 12), chuaLink: chuaLink.sort(sx).slice(0, 12) };
}
function congVan_(nd) {
  canNhom_(nd, NHOM_CSVC);
  const lk = lienKet_(), c = CacheService.getScriptCache();
  let d = null;
  try { const co = c.get('congvan'); if (co) d = JSON.parse(co); } catch (e) {}
  if (!d) {
    d = {};
    try { d.di = docCvDi_(); } catch (e) { d.di = { loi: String(e.message || e) }; }
    try { d.den = docCvDen_(); } catch (e) { d.den = { loi: String(e.message || e) }; }
    try { c.put('congvan', JSON.stringify(d), 300); } catch (e) {}
  }
  d.lienKet = { cvDi: lk.cvDi, cvDiFolder: lk.cvDiFolder, cvDen: lk.cvDen, cvDenFolder: lk.cvDenFolder };
  d.homNay = bayGio_().ngay;
  return d;
}

/* ---------------- mượn / trả tài sản */

const NGUON_MUON = ['Phòng Tổ chức - Hành chính', 'Ký túc xá', 'Khác'];
const COT_MV = ['Mã', 'Ghi lúc', 'Nguồn', 'Chương trình / mục đích', 'Link giấy đề nghị', 'Danh sách đồ', 'Người đi mượn', 'Người liên hệ bên cho mượn', 'SĐT liên hệ',
  'Ngày mượn', 'Hạn trả', 'Trạng thái', 'Ngày trả', 'Người trả', 'Tình trạng khi trả', 'Ghi chú', 'Cập nhật bởi', 'Cập nhật lúc'];
const COT_CM = ['Mã', 'Ghi lúc', 'Đơn vị mượn', 'Người đại diện', 'SĐT', 'Mục đích', 'Link giấy đề nghị', 'Danh sách đồ', 'Ngày giao dự kiến', 'Hạn trả', 'Trạng thái', 'Người tạo',
  'Trưởng nhóm duyệt', 'Quản lý duyệt', 'Ghi chú duyệt', 'Ngày giao', 'Người giao', 'Tình trạng lúc giao', 'Ngày nhận lại', 'Người nhận lại', 'Tình trạng khi trả', 'Ghi chú', 'Cập nhật bởi', 'Cập nhật lúc'];
const TT_MUON = { DANG: 'Đang mượn', DANG_CHO: 'Đang cho mượn', DA_TRA: 'Đã trả' };

function chuoiDo_(ds) { return ds.map(function (x) { return x.ten + ' × ' + x.sl; }).join('; '); }
function tachDo_(s) {
  return chuoi_(s).split(/;\s*/).filter(String).map(function (p) { const m = /^(.*?)\s*×\s*(\d+)\s*$/.exec(p); return m ? { ten: m[1], sl: +m[2] } : { ten: p, sl: 1 }; });
}
function kiemDo_(ds) {
  const kq = (ds || []).map(function (x) { return { ten: chuoi_(x && x.ten).replace(/[;×]/g, ' ').slice(0, 120), sl: Math.floor(Number(x && x.sl)) }; })
    .filter(function (x) { return x.ten; });
  if (!kq.length) throw new Error('Thêm ít nhất 1 món đồ.');
  kq.forEach(function (x) { if (!(x.sl >= 1 && x.sl <= 9999)) throw new Error('Số lượng của "' + x.ten + '" không hợp lệ.'); });
  return kq;
}
function ngayHopLe_(v, ten) { const s = String(v || ''); if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error('Chọn ' + ten + '.'); return s; }
function linkHopLe_(v, ten, batBuoc) { const s = chuoi_(v).slice(0, 500); if (batBuoc && !/^https?:\/\//.test(s)) throw new Error('Dán link ' + ten + ' (bắt đầu bằng https://).'); return s; }

function ssMuonTra_() {
  const ss = moSheetLienKet_('muonTra', 'sheet mượn trả tài sản');
  if (!ss.getSheetByName('Mượn về')) tabHd_(ss, 'Mượn về', COT_MV, [90, 120, 170, 260, 220, 320, 170, 190, 110, 100, 100, 110, 100, 170, 200, 220, 160, 120], [10, 11, 13]);
  if (!ss.getSheetByName('Cho mượn')) tabHd_(ss, 'Cho mượn', COT_CM, [90, 120, 200, 170, 110, 240, 220, 320, 100, 100, 150, 170, 220, 220, 240, 100, 170, 180, 100, 170, 200, 220, 160, 120], [9, 10, 16, 19]);
  return ss;
}
function danhMuc_(ss) {
  const c = CacheService.getScriptCache();
  try { const co = c.get('danhmuc'); if (co) return JSON.parse(co); } catch (e) {}
  const s = ss.getSheets().filter(function (x) { return chuanHoa_(x.getRange(1, 1).getValue()) === 'danh mục'; })[0];
  const ds = [];
  if (s && s.getLastRow() >= 2) {
    s.getRange(2, 1, s.getLastRow() - 1, 8).getValues().forEach(function (r) {
      const ten = chuoi_(r[4]);
      if (ten) ds.push({ loai: chuoi_(r[0]), viTri: [chuoi_(r[1]), chuoi_(r[2]), chuoi_(r[3])].filter(String).join(' · '), ten: ten, dvt: chuoi_(r[5]), sl: Number(r[6]) || 0 });
    });
  }
  try { c.put('danhmuc', JSON.stringify(ds), 600); } catch (e) {}
  return ds;
}
function docMv_(ss) {
  return docTabHd_(ss, 'Mượn về', COT_MV.length).map(function (r) {
    return { dong: r.dong, id: chuoi_(r[0]), luc: lucChu2_(r[1]), nguon: chuoi_(r[2]), mucDich: chuoi_(r[3]), gdn: chuoi_(r[4]), do: tachDo_(r[5]), nguoiMuon: chuoi_(r[6]),
      lienHe: chuoi_(r[7]), sdt: chuoi_(r[8]), ngayMuon: ngayISO_(r[9], MUI_GIO) || '', hanTra: ngayISO_(r[10], MUI_GIO) || '', trangThai: chuoi_(r[11]),
      ngayTra: ngayISO_(r[12], MUI_GIO) || '', nguoiTra: chuoi_(r[13]), tinhTrang: chuoi_(r[14]), ghiChu: chuoi_(r[15]), boi: chuoi_(r[16]), capNhat: lucChu2_(r[17]) };
  }).filter(function (x) { return x.id; });
}
function docCm_(ss) {
  return docTabHd_(ss, 'Cho mượn', COT_CM.length).map(function (r) {
    return { dong: r.dong, id: chuoi_(r[0]), luc: lucChu2_(r[1]), donVi: chuoi_(r[2]), daiDien: chuoi_(r[3]), sdt: chuoi_(r[4]), mucDich: chuoi_(r[5]), gdn: chuoi_(r[6]),
      do: tachDo_(r[7]), ngayGiaoDk: ngayISO_(r[8], MUI_GIO) || '', hanTra: ngayISO_(r[9], MUI_GIO) || '', trangThai: chuoi_(r[10]), nguoiTao: chuoi_(r[11]),
      tnDuyet: chuoi_(r[12]), qlDuyet: chuoi_(r[13]), ghiChuDuyet: chuoi_(r[14]), ngayGiao: ngayISO_(r[15], MUI_GIO) || '', nguoiGiao: chuoi_(r[16]), tinhTrangGiao: chuoi_(r[17]),
      ngayNhan: ngayISO_(r[18], MUI_GIO) || '', nguoiNhan: chuoi_(r[19]), tinhTrang: chuoi_(r[20]), ghiChu: chuoi_(r[21]), boi: chuoi_(r[22]), capNhat: lucChu2_(r[23]) };
  }).filter(function (x) { return x.id; });
}
function boDong_(x) { const o = Object.assign({}, x); delete o.dong; return o; }

function muonTra_(nd) {
  canNhom_(nd, NHOM_CSVC);
  const ss = ssMuonTra_(), now = bayGio_(), d = layNhom(NHOM_CSVC, false), v = vaiDuyet_(nd, NHOM_CSVC);
  const ctx = mangNhom_(NHOM_CSVC, KIEM_KE.KHOA);
  const quaHan = function (x, dang) { return x.trangThai === dang && x.hanTra && x.hanTra < now.ngay; };
  const mv = docMv_(ss).reverse(), cm = docCm_(ss).reverse();
  return {
    homNay: now.ngay, toi: nd.ten, laQL: v.ql, laTN: v.tn, coTN: v.coTN, truongNhom: v.dsTN, laPhuTrach: laPhuTrach_(nd, ctx), phuTrach: ctx.phuTrach,
    laThanhVien: d.thanhVien.indexOf(nd.ten) > -1, thanhVien: d.thanhVien, nguon: NGUON_MUON, danhMuc: danhMuc_(ss), link: lienKet_().muonTra,
    muonVe: mv.filter(function (x, i) { return x.trangThai === TT_MUON.DANG || i < 40; }).map(function (x) { const o = boDong_(x); o.quaHan = quaHan(x, TT_MUON.DANG); return o; }),
    choMuon: cm.filter(function (x, i) { return [TT_MUON.DA_TRA, TT2.HUY].indexOf(x.trangThai) === -1 || i < 40; }).map(function (x) { const o = boDong_(x); o.quaHan = quaHan(x, TT_MUON.DANG_CHO); return o; })
  };
}

function luuMuonVe_(nd, req) {
  canNhom_(nd, NHOM_CSVC);
  return voiKhoa_(function () {
    const ss = ssMuonTra_(), s = ss.getSheetByName('Mượn về'), d = layNhom(NHOM_CSVC, false), v = vaiDuyet_(nd, NHOM_CSVC);
    const laTV = d.thanhVien.indexOf(nd.ten) > -1 || v.ql, gc = chuoi_(req.ghiChu).slice(0, 500);
    if (!laTV) throw loiQuyen_('Chỉ thành viên nhóm CSDL - CSVC mới ghi mượn / trả.');
    if (req.viec === 'tao') {
      const nguon = NGUON_MUON.indexOf(req.nguon) > -1 ? req.nguon : '';
      if (!nguon) throw new Error('Chọn nguồn mượn.');
      const mucDich = chuoi_(req.mucDich).slice(0, 300);
      if (!mucDich) throw new Error('Ghi chương trình / mục đích mượn.');
      const gdn = linkHopLe_(req.gdn, 'giấy đề nghị', nguon === NGUON_MUON[0]);
      const lienHe = chuoi_(req.lienHe).slice(0, 120), sdt = chuoi_(req.sdt).slice(0, 30);
      if (nguon === NGUON_MUON[1] && (!lienHe || !sdt)) throw new Error('Mượn ở Ký túc xá không có giấy tờ: ghi người liên hệ và số điện thoại.');
      const nguoi = chuoi_(req.nguoiMuon) || nd.ten;
      if (d.thanhVien.indexOf(nguoi) === -1 && nguoi !== nd.ten) throw new Error(nguoi + ' không có trong danh sách thành viên nhóm.');
      const ngayMuon = ngayHopLe_(req.ngayMuon, 'ngày mượn'), hanTra = ngayHopLe_(req.hanTra, 'hạn trả');
      if (hanTra < ngayMuon) throw new Error('Hạn trả phải sau ngày mượn.');
      s.appendRow([maMoi_('MV'), new Date(), nguon, mucDich, gdn, chuoiDo_(kiemDo_(req.do)), nguoi, lienHe, sdt, dmy_(ngayMuon), dmy_(hanTra), TT_MUON.DANG, '', '', '', gc, nd.ten, new Date()]);
    } else {
      const x = docMv_(ss).filter(function (y) { return y.id === chuoi_(req.id); })[0];
      if (!x) throw new Error('Không tìm thấy lượt mượn này.');
      if (req.viec === 'tra') {
        if (x.trangThai !== TT_MUON.DANG) throw new Error('Lượt mượn này không ở trạng thái đang mượn.');
        const ngay = ngayHopLe_(req.ngayTra, 'ngày trả'), tt = chuoi_(req.tinhTrang).slice(0, 300);
        if (!tt) throw new Error('Ghi tình trạng khi trả.');
        s.getRange(x.dong, 12, 1, 7).setValues([[TT_MUON.DA_TRA, dmy_(ngay), chuoi_(req.nguoiTra) || nd.ten, tt, gc || x.ghiChu, nd.ten, new Date()]]);
      } else if (req.viec === 'huy') {
        if (x.trangThai !== TT_MUON.DANG) throw new Error('Chỉ huỷ được lượt đang mượn.');
        if (!v.ql && x.boi !== nd.ten && x.nguoiMuon !== nd.ten) throw loiQuyen_('Chỉ người ghi (hoặc quản lý) mới huỷ được.');
        s.getRange(x.dong, 12).setValue(TT2.HUY); s.getRange(x.dong, 16, 1, 3).setValues([[gc || 'Huỷ (ghi nhầm)', nd.ten, new Date()]]);
      } else throw new Error('Yêu cầu không hợp lệ.');
    }
    SpreadsheetApp.flush();
    return muonTra_(nd);
  });
}

function luuChoMuon_(nd, req) {
  canNhom_(nd, NHOM_CSVC);
  return voiKhoa_(function () {
    const ss = ssMuonTra_(), s = ss.getSheetByName('Cho mượn'), d = layNhom(NHOM_CSVC, false), v = vaiDuyet_(nd, NHOM_CSVC);
    const laTV = d.thanhVien.indexOf(nd.ten) > -1 || v.ql, gc = chuoi_(req.ghiChu).slice(0, 500);
    if (!laTV) throw loiQuyen_('Chỉ thành viên nhóm CSDL - CSVC mới ghi cho mượn.');
    const x = req.id ? docCm_(ss).filter(function (y) { return y.id === chuoi_(req.id); })[0] : null;
    if (req.id && !x) throw new Error('Không tìm thấy yêu cầu cho mượn này.');
    if (req.viec === 'tao') {
      if (x && [TT2.TRA_TN, TT2.TRA_QL].indexOf(x.trangThai) === -1) throw new Error('Chỉ sửa được khi yêu cầu bị trả lại.');
      const donVi = chuoi_(req.donVi).slice(0, 150), daiDien = chuoi_(req.daiDien).slice(0, 120), sdt = chuoi_(req.sdt).slice(0, 30);
      if (!donVi || !daiDien) throw new Error('Ghi đơn vị mượn và người đại diện.');
      const mucDich = chuoi_(req.mucDich).slice(0, 300);
      if (!mucDich) throw new Error('Ghi mục đích mượn.');
      const gdn = linkHopLe_(req.gdn, 'giấy đề nghị của đơn vị mượn', true);
      const ngayGiao = ngayHopLe_(req.ngayGiaoDk, 'ngày giao dự kiến'), hanTra = ngayHopLe_(req.hanTra, 'hạn trả');
      if (hanTra < ngayGiao) throw new Error('Hạn trả phải sau ngày giao.');
      const tt = trangThaiGui_(nd, NHOM_CSVC);
      const vals = [donVi, daiDien, sdt, mucDich, gdn, chuoiDo_(kiemDo_(req.do)), dmy_(ngayGiao), dmy_(hanTra), tt];
      if (x) {
        s.getRange(x.dong, 3, 1, 9).setValues([vals]);
        s.getRange(x.dong, 22, 1, 3).setValues([[gc || x.ghiChu, nd.ten, new Date()]]);
      } else s.appendRow([maMoi_('CM'), new Date()].concat(vals, [nd.ten, '', '', '', '', '', '', '', '', '', gc, nd.ten, new Date()]));
    } else {
      if (!x) throw new Error('Không tìm thấy yêu cầu cho mượn này.');
      if (req.viec === 'duyet') {
        const b = buocDuyet_(nd, NHOM_CSVC, x.trangThai, req.dongY === true, chuoi_(req.ghiChu).slice(0, 300));
        s.getRange(x.dong, 11).setValue(b.tt);
        s.getRange(x.dong, b.cap === 'tn' ? 13 : 14).setValue(b.ghi);
        if (!req.dongY) s.getRange(x.dong, 15).setValue(b.ghi);
      } else if (req.viec === 'giao') {
        if (x.trangThai !== TT2.DUYET) throw new Error('Yêu cầu chưa được duyệt đủ 2 cấp.');
        const ngay = ngayHopLe_(req.ngay, 'ngày giao');
        s.getRange(x.dong, 11).setValue(TT_MUON.DANG_CHO);
        s.getRange(x.dong, 16, 1, 3).setValues([[dmy_(ngay), nd.ten, chuoi_(req.tinhTrang).slice(0, 300) || 'Bình thường']]);
      } else if (req.viec === 'nhanLai') {
        if (x.trangThai !== TT_MUON.DANG_CHO) throw new Error('Đồ chưa được giao cho đơn vị mượn.');
        const ngay = ngayHopLe_(req.ngay, 'ngày nhận lại'), tt = chuoi_(req.tinhTrang).slice(0, 300);
        if (!tt) throw new Error('Ghi tình trạng khi nhận lại.');
        s.getRange(x.dong, 11).setValue(TT_MUON.DA_TRA);
        s.getRange(x.dong, 19, 1, 3).setValues([[dmy_(ngay), nd.ten, tt]]);
      } else if (req.viec === 'huy') {
        if ([TT_MUON.DANG_CHO, TT_MUON.DA_TRA, TT2.HUY].indexOf(x.trangThai) > -1) throw new Error('Không huỷ được ở trạng thái này.');
        if (!v.ql && x.nguoiTao !== nd.ten) throw loiQuyen_('Chỉ người tạo (hoặc quản lý) mới huỷ được.');
        s.getRange(x.dong, 11).setValue(TT2.HUY);
      } else throw new Error('Yêu cầu không hợp lệ.');
      s.getRange(x.dong, 22, 1, 3).setValues([[gc || x.ghiChu, nd.ten, new Date()]]);
    }
    SpreadsheetApp.flush();
    return muonTra_(nd);
  });
}

/** Mục chờ QUẢN LÝ duyệt (cho trang Phê duyệt): lịch kiểm kê + cho mượn. */
function choDuyetCsvc_() {
  const kq = [];
  try {
    docKk_(sheetTruc_()).filter(function (x) { return x.trangThai === TT2.CHO_QL; }).forEach(function (x) {
      const kk = kyKk_(x.ky);
      kq.push({ kieu: 'kiemKe', id: x.ky, ten: x.nguoiDangKy || x.phuTrach, loai: 'Lịch kiểm kê CSVC', ngay: x.ngay, nhan: kk ? kk.nhan : x.ky,
        thucHien: x.thucHien, ghiChu: x.ghiChu, tnDuyet: x.tnDuyet, trangThai: x.trangThai });
    });
  } catch (e) {}
  try {
    if (lienKet_().muonTra) docCm_(ssMuonTra_()).filter(function (x) { return x.trangThai === TT2.CHO_QL; }).forEach(function (x) {
      kq.push({ kieu: 'choMuon', id: x.id, ten: x.nguoiTao, loai: 'Cho mượn tài sản', ngay: x.ngayGiaoDk, donVi: x.donVi, daiDien: x.daiDien, mucDich: x.mucDich,
        gdn: x.gdn, do: x.do, hanTra: x.hanTra, tnDuyet: x.tnDuyet, trangThai: x.trangThai });
    });
  } catch (e) {}
  return kq;
}
