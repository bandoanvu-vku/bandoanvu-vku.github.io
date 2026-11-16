/* ------------------------------------------------ Nội vụ → Văn phòng phẩm: kiểm kê (chỉ đọc) + giấy đề nghị VPP */
/*
 * Kiểm kê: CHỈ ĐỌC tab "Tồn kho văn phòng phẩm ĐTN" của sheet liên kết `tonKhoVpp` (Cài đặt → Nội vụ). Bảng: Stt | Danh mục | ĐVT | các cột kiểm kê
 * (hàng "Lần n" + hàng ngày dd/mm/yyyy; nhiều khối "THỜI GIAN KIỂM TRA"; dừng ở cột "TỔNG QUÝ"). Ô "2 hộp" → 2, trống = chưa đếm. Cache 'vppkk1' 10 phút.
 * Giấy đề nghị: Nội vụ + quản lý nhập trên dashboard → máy chủ tạo FILE MỚI (SpreadsheetApp.create), chép 2 tab của file mẫu `mauGdnVpp`
 * ("GĐN VPP - điền sl, gửi file" = danh mục đầy đủ, điền cột "Đoàn TN"; "GĐN-rút gọn-trình ký" = chỉ các món đề nghị + SL tồn kho lấy từ lần kiểm kê gần nhất),
 * chia sẻ quyền sửa cho người tạo; lưu sổ ở tab "VPP - Giấy đề nghị" của sheet lịch trực. Không ghi ID file vào repo.
 * actions: vppKiemKe, vppGdn (danh mục + tồn kho + danh sách đã tạo), luuVppGdn {viec: tao | xoa}.
 */
const COT_GDN = ['Mã', 'Quý', 'Năm', 'Ngày giấy', 'Người tạo', 'Email', 'Các món (JSON)', 'Link file', 'Tạo lúc'];

function soVpp_(v) {
  if (typeof v === 'number') return v;
  const t = chuoi_(v).replace(',', '.'), m = /^-?\d+(\.\d+)?/.exec(t);
  return m ? Number(m[0]) : null;
}
function tenVpp_(s) { return chuoi_(s).normalize('NFC').toLowerCase().replace(/\s+/g, ' ').replace(/\s*\(\s*/g, ' (').trim(); }
function ngayVppChu_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]') return Utilities.formatDate(v, MUI_GIO, 'dd/MM/yyyy');
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(chuoi_(v));
  return m ? ('0' + m[1]).slice(-2) + '/' + ('0' + m[2]).slice(-2) + '/' + m[3] : '';
}

function docTonKhoVpp_() {
  const c = CacheService.getScriptCache(), co = nhoDoc_('vppkk2');
  if (co) return JSON.parse(co);
  const url = lienKet_().tonKhoVpp, id = idTuLink_(url);
  if (!id) return null;
  let ss;
  try { ss = moId_(id); } catch (e) { throw new Error('Máy chủ chưa đọc được sheet tồn kho VPP (tài khoản chạy dashboard cần quyền xem).'); }
  const s = ss.getSheets().filter(function (x) { return /tồn kho/i.test(x.getName()); })[0];
  if (!s) throw new Error('Không thấy tab "Tồn kho văn phòng phẩm ĐTN" trong sheet tồn kho.');
  const r0 = s.getDataRange(), v = r0.getValues(), hien = r0.getDisplayValues(); // ngày lấy đúng chữ đang hiện trên sheet (sheet để định dạng ngày kiểu Mỹ)
  let h = -1;
  for (let i = 0; i < Math.min(v.length, 12) && h < 0; i++) if (/danh mục/i.test(chuoi_(v[i][1]))) h = i;
  if (h < 0) throw new Error('Không thấy hàng tiêu đề "Danh mục VPP" trong tab tồn kho.');
  // Hàng ngày = hàng đầu tiên dưới tiêu đề có ô dạng ngày ở cột D trở đi
  let hn = -1;
  for (let i = h + 1; i < Math.min(v.length, h + 5) && hn < 0; i++) if (hien[i].slice(3).some(function (x) { return !!ngayVppChu_(x); })) hn = i;
  if (hn < 0) throw new Error('Không thấy hàng ngày kiểm kê trong tab tồn kho.');
  const lan = [];
  let khoi = 0;
  for (let j = 3; j < v[hn].length; j++) {
    if (/tổng/i.test(chuoi_(v[h][j]))) break;
    if (/thời gian/i.test(chuoi_(v[h][j]))) khoi++;
    const ngay = ngayVppChu_(hien[hn][j]);
    if (!ngay) continue;
    let nhan = '';
    for (let i = h + 1; i < hn; i++) if (/lần/i.test(chuoi_(v[i][j]))) nhan = chuoi_(v[i][j]);
    lan.push({ cot: j, nhan: nhan || 'Lần ' + (lan.length + 1), ngay: ngay, khoi: Math.max(khoi, 1) });
  }
  const mon = [];
  v.slice(hn + 1).forEach(function (r) {
    const ten = chuoi_(r[1]).replace(/\s+/g, ' ');
    if (!ten) return;
    mon.push({ stt: chuoi_(r[0]), ten: ten, dvt: chuoi_(r[2]), sl: lan.map(function (l) { return soVpp_(r[l.cot]); }) });
  });
  const kq = { tab: s.getName(), lan: lan.map(function (l) { return { nhan: l.nhan, ngay: l.ngay, khoi: l.khoi }; }), mon: mon, luc: Utilities.formatDate(new Date(), MUI_GIO, 'dd/MM/yyyy HH:mm') };
  try { nhoDat_('vppkk2', JSON.stringify(kq), 600); } catch (e) {}
  return kq;
}

function vppKiemKe_(nd, req) {
  canNoiVu_(nd);
  if (req && req.lamMoi) try { CacheService.getScriptCache().remove('vppkk2'); } catch (e) {}
  const tk = docTonKhoVpp_();
  return tk ? Object.assign({ ketNoi: true, quanLy: nd.vaiTro === 'quanLy' }, tk) : { ketNoi: false, quanLy: nd.vaiTro === 'quanLy' };
}

/** Tồn kho hiện tại theo tên món: số ở lần kiểm kê gần nhất có đếm. */
function tonHienTai_(tk) {
  const o = {};
  (tk ? tk.mon : []).forEach(function (m) {
    for (let i = m.sl.length - 1; i >= 0; i--) if (m.sl[i] !== null) { o[tenVpp_(m.ten)] = { sl: m.sl[i], ngay: tk.lan[i].ngay }; break; }
  });
  return o;
}

/* ---------------- giấy đề nghị */

function mauGdn_() {
  const id = idTuLink_(lienKet_().mauGdnVpp);
  if (!id) throw new Error('Chưa có file mẫu Giấy đề nghị VPP: quản lý dán link ở Cài đặt → Liên kết → Nội vụ.');
  try { return moId_(id); } catch (e) { throw new Error('Máy chủ chưa mở được file mẫu Giấy đề nghị VPP (cần quyền xem).'); }
}
function tabGdn_(ss, rutGon) {
  return ss.getSheets().filter(function (s) { return rutGon ? /rút gọn/i.test(s.getName()) : /điền sl|gđn vpp/i.test(s.getName()) && !/rút gọn/i.test(s.getName()); })[0];
}
/** Danh mục VPP của trường = tab đầy đủ của file mẫu (Stt | Danh mục | ĐVT …). Cache 6 giờ. */
function danhMucGdn_() {
  const c = CacheService.getScriptCache(), co = c.get('vppdm1');
  if (co) return JSON.parse(co);
  const s = tabGdn_(mauGdn_(), false);
  if (!s) throw new Error('File mẫu thiếu tab "GĐN VPP - điền sl, gửi file".');
  const v = s.getRange(1, 1, s.getLastRow(), 3).getValues(), ds = [];
  let bat = false;
  v.forEach(function (r) {
    if (/danh mục/i.test(chuoi_(r[1]))) { bat = true; return; }
    if (bat && /^\d+$/.test(chuoi_(r[0])) && chuoi_(r[1])) ds.push({ ten: chuoi_(r[1]).replace(/\s+/g, ' '), dvt: chuoi_(r[2]) });
  });
  try { c.put('vppdm1', JSON.stringify(ds), 21600); } catch (e) {}
  return ds;
}
function tabSoGdn_() { return damBaoTab_(sheetTruc_(), 'VPP - Giấy đề nghị', COT_GDN, [90, 60, 60, 100, 160, 200, 420, 300, 140]); }
function docSoGdn_() {
  const s = sheetTruc_().getSheetByName('VPP - Giấy đề nghị');
  if (!s || s.getLastRow() < 2) return [];
  return s.getRange(2, 1, s.getLastRow() - 1, COT_GDN.length).getValues().map(function (r, i) {
    let muc = []; try { muc = JSON.parse(chuoi_(r[6]) || '[]'); } catch (e) {}
    return { dong: i + 2, ma: chuoi_(r[0]), quy: chuoi_(r[1]), nam: chuoi_(r[2]), ngay: ngayISO_(r[3], MUI_GIO) || chuoi_(r[3]), nguoi: chuoi_(r[4]), email: chuoi_(r[5]), muc: muc, link: chuoi_(r[7]), luc: lucChu_(r[8]) };
  }).filter(function (x) { return x.ma; }).reverse();
}

function vppGdn_(nd) {
  canNoiVu_(nd);
  let tk = null, loiTk = '';
  try { tk = docTonKhoVpp_(); } catch (e) { loiTk = e.message; }
  const ton = tonHienTai_(tk);
  let dm = [], loiDm = '';
  try { dm = danhMucGdn_(); } catch (e) { loiDm = e.message; }
  return {
    homNay: bayGio_().ngay, toi: nd.email, quanLy: nd.vaiTro === 'quanLy', loiDm: loiDm, loiTk: loiTk,
    danhMuc: dm.map(function (m) { const t = ton[tenVpp_(m.ten)]; return { ten: m.ten, dvt: m.dvt, ton: t ? t.sl : null }; }),
    tonKhac: tk ? tk.mon.filter(function (m) { return !dm.some(function (d) { return tenVpp_(d.ten) === tenVpp_(m.ten); }); }).map(function (m) { const t = ton[tenVpp_(m.ten)]; return { ten: m.ten, dvt: m.dvt, ton: t ? t.sl : null }; }) : [],
    ds: docSoGdn_().map(function (x) { delete x.dong; return x; })
  };
}

const QUY_LA_MA = ['', 'I', 'II', 'III', 'IV'];
function luuVppGdn_(nd, req) {
  canNoiVu_(nd);
  if (nd.xemThu) throw new Error('Đang xem thử, không lưu được.');
  if (req.viec === 'xoa') {
    return voiKhoa_(function () {
      const x = docSoGdn_().filter(function (y) { return y.ma === req.ma; })[0];
      if (!x) throw new Error('Không tìm thấy giấy đề nghị này.');
      if (x.email !== nd.email && nd.vaiTro !== 'quanLy') throw loiQuyen_('Chỉ người tạo hoặc quản lý mới xoá được.');
      sheetTruc_().getSheetByName('VPP - Giấy đề nghị').deleteRow(x.dong);
      return vppGdn_(nd);
    });
  }
  if (req.viec !== 'tao') throw new Error('Thao tác không hợp lệ.');
  const quy = Number(req.quy), nam = Number(req.nam), ngay = /^\d{4}-\d{2}-\d{2}$/.test(String(req.ngay || '')) ? req.ngay : bayGio_().ngay;
  if (!(quy >= 1 && quy <= 4)) throw new Error('Chọn quý.');
  if (!(nam >= 2024 && nam <= 2100)) throw new Error('Năm không hợp lệ.');
  const muc = (Array.isArray(req.muc) ? req.muc : []).map(function (m) {
    return { ten: chuoi_(m.ten).replace(/\s+/g, ' ').slice(0, 150), dvt: chuoi_(m.dvt).slice(0, 20), sl: Number(m.sl), ghiChu: chuoi_(m.ghiChu).replace(/\s+/g, ' ').slice(0, 150) };
  }).filter(function (m) { return m.ten && m.sl > 0; });
  if (!muc.length) throw new Error('Nhập số lượng cho ít nhất một món.');
  if (muc.length > 150) throw new Error('Tối đa 150 món.');
  let tk = null; try { tk = docTonKhoVpp_(); } catch (e) {}
  const ton = tonHienTai_(tk), dm = danhMucGdn_();
  muc.forEach(function (m) { const t = ton[tenVpp_(m.ten)]; m.ton = t ? t.sl : ''; m.trongDm = dm.some(function (d) { return tenVpp_(d.ten) === tenVpp_(m.ten); }); });

  const mau = mauGdn_(), d = ngay.split('-');
  const ten = 'ĐTN-Giấy đề nghị Văn phòng phẩm quý ' + QUY_LA_MA[quy] + ' năm ' + nam + ' (' + d[2] + '-' + d[1] + '-' + d[0] + ')';
  const moi = SpreadsheetApp.create(ten);
  const goc = moi.getSheets()[0];
  [tabGdn_(mau, false), tabGdn_(mau, true)].forEach(function (t) {
    if (!t) throw new Error('File mẫu phải có 2 tab: "GĐN VPP - điền sl, gửi file" và "GĐN-rút gọn-trình ký".');
    t.copyTo(moi).setName(t.getName());
  });
  moi.deleteSheet(goc);
  const t1 = tabGdn_(moi, false), t2 = tabGdn_(moi, true);
  const ngayChu = 'Đà Nẵng, ngày ' + d[2] + ' tháng ' + Number(d[1]) + ' năm ' + d[0];
  thayChuGdn_(t1, ngayChu, nam, quy); thayChuGdn_(t2, ngayChu, nam, quy);
  dienBanDayDu_(t1, muc);
  dienBanRutGon_(t2, muc);
  SpreadsheetApp.flush();
  let chiaSe = true;
  try { moi.addEditor(nd.email); } catch (e) { chiaSe = false; }
  const link = moi.getUrl();
  voiKhoa_(function () {
    tabSoGdn_().appendRow([maMoi_('GDN'), quy, nam, ngayDate_(ngay), nd.ten, nd.email, JSON.stringify(muc.map(function (m) { return { ten: m.ten, dvt: m.dvt, sl: m.sl, ton: m.ton, ghiChu: m.ghiChu }; })), link, new Date()]);
  });
  const kq = vppGdn_(nd);
  kq.moi = { link: link, ten: ten, chiaSe: chiaSe, ngoaiDm: muc.filter(function (m) { return !m.trongDm; }).map(function (m) { return m.ten; }) };
  return kq;
}

/** Ngày giấy, "năm 2026", "Quý I năm 2026" trong phần đầu tab. */
function thayChuGdn_(s, ngayChu, nam, quy) {
  const n = Math.min(s.getLastRow(), 20), w = s.getLastColumn(), r = s.getRange(1, 1, n, w), v = r.getValues();
  let doi = false;
  v.forEach(function (hang, i) {
    hang.forEach(function (o, j) {
      const t = chuoi_(o);
      if (!t) return;
      let m = t;
      if (/Đà Nẵng,\s*ngày/i.test(m)) m = m.replace(/Đà Nẵng,\s*ngày.*$/i, ngayChu);
      if (/cung cấp văn phòng phẩm/i.test(m)) m = m.replace(/(Quý\s+[IV]+\s+)?năm\s+\d{4}/i, (/Quý/i.test(m) ? 'Quý ' + QUY_LA_MA[quy] + ' ' : '') + 'năm ' + nam);
      if (/TỔNG HỢP ĐỀ NGHỊ VĂN PHÒNG PHẨM NĂM/i.test(m)) m = m.replace(/\d{4}/, String(nam));
      if (/năm học \d{4}-\d{4}/i.test(m)) m = m.replace(/năm học \d{4}-\d{4}/i, 'năm học ' + (quy >= 3 ? nam + '-' + (nam + 1) : (nam - 1) + '-' + nam));
      if (m !== t) { s.getRange(i + 1, j + 1).setValue(m); doi = true; }
    });
  });
  return doi;
}

/** Bản đầy đủ: điền SL vào cột "Đoàn TN" theo tên món (món ngoài danh mục không có hàng → chỉ có ở bản rút gọn). */
function dienBanDayDu_(s, muc) {
  const v = s.getDataRange().getValues();
  let h = -1, cDoan = -1;
  for (let i = 0; i < v.length && cDoan < 0; i++) {
    if (/danh mục/i.test(chuoi_(v[i][1]))) h = i;
    if (h > -1) v[i].forEach(function (o, j) { if (/đoàn\s*tn/i.test(chuoi_(o))) cDoan = j; });
  }
  if (cDoan < 0) return;
  const theoTen = {}; muc.forEach(function (m) { theoTen[tenVpp_(m.ten)] = m; });
  const cot = [];
  for (let i = h + 1; i < v.length; i++) {
    if (!/^\d+$/.test(chuoi_(v[i][0]))) continue;
    const m = theoTen[tenVpp_(v[i][1])];
    cot.push([i, m ? m.sl : '']);
  }
  cot.forEach(function (x) { s.getRange(x[0] + 1, cDoan + 1).setValue(x[1]); });
}

/** Bản rút gọn: thay các hàng món trong bảng (giữ định dạng, thêm / bớt hàng cho vừa). */
function dienBanRutGon_(s, muc) {
  const v = s.getDataRange().getValues();
  let h = -1, cuoi = -1;
  for (let i = 0; i < v.length; i++) {
    if (h < 0 && /danh mục/i.test(chuoi_(v[i][1]))) { h = i; continue; }
    if (h > -1 && /vậy kính đề nghị/i.test(v[i].map(chuoi_).join(' '))) { cuoi = i; break; }
  }
  if (h < 0) throw new Error('Tab rút gọn của file mẫu thiếu hàng tiêu đề "Danh mục VPP".');
  if (cuoi < 0) cuoi = v.length;
  const dau = h + 2, coSan = Math.max(cuoi - h - 1, 0), can = muc.length; // dòng sheet (1-based) của món đầu tiên
  if (can > coSan) s.insertRowsAfter(coSan ? dau + coSan - 1 : h + 1, can - coSan); // hàng chèn thêm nhận định dạng của hàng phía trên
  else if (can < coSan) s.deleteRows(dau + can, coSan - can);
  s.getRange(dau, 1, can, 7).setValues(muc.map(function (m, i) { return [i + 1, m.ten, m.dvt, m.ton === '' ? '' : m.ton, m.sl, '', m.ghiChu || '']; }));
}
