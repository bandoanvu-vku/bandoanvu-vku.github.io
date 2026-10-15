/* ------------------------------------------------ hiện trạng tài sản (nhóm CSDL - CSVC) */
/*
 * Sheet "[BĐV 2026 - 2027] CSVC - Hiện trạng tài sản" (link ở Cài đặt → Liên kết nhóm CSDL - CSVC, khoá hienTrang).
 * Tab đầu: Mã | Nhóm tài sản | Khu / vị trí | Lớp | Tầng / Ô | Tên tài sản | ĐVT | SL sổ sách | SL kiểm kê gần nhất | Ngày kiểm kê | Tình trạng | Ghi chú | Cập nhật bởi | Cập nhật lúc
 * Dữ liệu ban đầu chép từ 2 biên bản (kho tuần/tháng: lần kiểm kê gần nhất; tài sản cố định: biên bản 6 tháng đầu năm 2026).
 * Thành viên nhóm CSDL - CSVC + quản lý xem; phụ trách chính mảng CSVC / quản lý sửa số lượng, tình trạng, ghi chú và thêm tài sản.
 * Không xoá dòng: tài sản không còn thì đặt tình trạng "Không còn sử dụng" / "Mất".
 */
const HT_COT = ['Mã', 'Nhóm tài sản', 'Khu / vị trí', 'Lớp', 'Tầng / Ô', 'Tên tài sản', 'ĐVT', 'SL sổ sách', 'SL kiểm kê gần nhất', 'Ngày kiểm kê',
  'Tình trạng', 'Ghi chú', 'Cập nhật bởi', 'Cập nhật lúc'];
const HT_TINH_TRANG = ['Bình thường', 'Hư hỏng một phần', 'Hư hỏng, chờ sửa', 'Mất', 'Không còn sử dụng'];
const HT_NHOM = ['Kho CSVC', 'Tài sản cố định'];

function tabHienTrang_() {
  const s = moSheetLienKet_('hienTrang', 'sheet hiện trạng tài sản').getSheets()[0];
  const tieuDe = s.getRange(1, 1, 1, Math.max(s.getLastColumn(), 1)).getValues()[0].map(chuanHoa_);
  const thieu = HT_COT.filter(function (c) { return tieuDe.indexOf(chuanHoa_(c)) === -1; });
  if (thieu.length) {
    voiKhoa_(function () {
      const c0 = s.getLastColumn() + 1;
      s.getRange(1, c0, 1, thieu.length).setValues([thieu]);
      s.getRange(1, 1, 1, c0 + thieu.length - 1).setFontWeight('bold').setBackground('#1a56c4').setFontColor('#ffffff');
      s.setFrozenRows(1);
    });
  }
  return s;
}
function cotHt_(s) {
  const t = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0].map(chuanHoa_);
  const o = {}; HT_COT.forEach(function (c) { o[c] = t.indexOf(chuanHoa_(c)); });
  return o;
}
function soHt_(v) { if (v === '' || v === null || v === undefined) return null; const n = Number(v); return isNaN(n) ? null : n; }
function docHienTrang_(s) {
  if (s.getLastRow() < 2) return [];
  const c = cotHt_(s), v = s.getRange(2, 1, s.getLastRow() - 1, s.getLastColumn()).getValues();
  const g = function (r, ten) { return c[ten] > -1 ? r[c[ten]] : ''; };
  return v.map(function (r, i) {
    return {
      dong: i + 2, ma: chuoi_(g(r, 'Mã')), nhom: chuoi_(g(r, 'Nhóm tài sản')), khu: chuoi_(g(r, 'Khu / vị trí')), lop: chuoi_(g(r, 'Lớp')), tang: chuoi_(g(r, 'Tầng / Ô')),
      ten: chuoi_(g(r, 'Tên tài sản')), dvt: chuoi_(g(r, 'ĐVT')), ss: soHt_(g(r, 'SL sổ sách')), kk: soHt_(g(r, 'SL kiểm kê gần nhất')),
      ngay: ngayISO_(g(r, 'Ngày kiểm kê'), MUI_GIO) || chuoi_(g(r, 'Ngày kiểm kê')), tinhTrang: chuoi_(g(r, 'Tình trạng')), ghiChu: chuoi_(g(r, 'Ghi chú')),
      boi: chuoi_(g(r, 'Cập nhật bởi')), luc: lucChu_(g(r, 'Cập nhật lúc'))
    };
  }).filter(function (x) { return x.ten; });
}

function hienTrang_(nd) {
  canNhom_(nd, NHOM_CSVC);
  const ds = docHienTrang_(tabHienTrang_());
  // Đồ đang cho mượn / đang mượn về (từ sheet mượn trả, nếu đã có link)
  const cho = {}, muonVe = [];
  try {
    const ss = ssMuonTra_();
    docCm_(ss).filter(function (x) { return x.trangThai === TT_MUON.DANG_CHO; }).forEach(function (x) {
      x.do.forEach(function (d) { const k = chuanHoa_(d.ten); (cho[k] = cho[k] || []).push({ sl: d.sl, donVi: x.donVi, hanTra: x.hanTra }); });
    });
    docMv_(ss).filter(function (x) { return x.trangThai === TT_MUON.DANG; }).forEach(function (x) {
      x.do.forEach(function (d) { muonVe.push({ ten: d.ten, sl: d.sl, nguon: x.nguon, mucDich: x.mucDich, hanTra: x.hanTra }); });
    });
  } catch (e) {}
  const ctx = mangNhom_(NHOM_CSVC, KIEM_KE.KHOA);
  return {
    homNay: bayGio_().ngay, sua: laPhuTrach_(nd, ctx) && !nd.xemThu, phuTrach: ctx.phuTrach, tinhTrang: HT_TINH_TRANG, nhom: HT_NHOM,
    link: lienKet_().hienTrang, muonVe: muonVe,
    ds: ds.map(function (x) { const o = boDong_(x); o.choMuon = cho[chuanHoa_(x.ten)] || []; return o; })
  };
}

function luuHienTrang_(nd, req) {
  canNhom_(nd, NHOM_CSVC);
  if (!laPhuTrach_(nd, mangNhom_(NHOM_CSVC, KIEM_KE.KHOA))) throw loiQuyen_('Chỉ phụ trách chính mảng CSVC hoặc quản lý mới cập nhật hiện trạng tài sản.');
  const so = function (v, ten) {
    if (v === '' || v === null || v === undefined) return '';
    const n = Number(v); if (!(n >= 0 && n <= 99999) || Math.floor(n) !== n) throw new Error(ten + ' phải là số nguyên từ 0.'); return n;
  };
  const tt = chuoi_(req.tinhTrang);
  if (tt && HT_TINH_TRANG.indexOf(tt) === -1) throw new Error('Tình trạng không hợp lệ.');
  const gc = chuAnToan_(chuoi_(req.ghiChu).slice(0, 500)), hom = bayGio_().ngay;
  return voiKhoa_(function () {
    const s = tabHienTrang_(), c = cotHt_(s), ds = docHienTrang_(s);
    const ghi = function (dong, ten, v) { if (c[ten] > -1) s.getRange(dong, c[ten] + 1).setValue(v); };
    if (req.viec === 'sua') {
      const x = ds.filter(function (y) { return y.ma === chuoi_(req.ma); })[0];
      if (!x) throw new Error('Không tìm thấy tài sản này.');
      const kk = so(req.kk, 'Số lượng hiện có');
      if (kk !== '' && kk !== x.kk) { ghi(x.dong, 'SL kiểm kê gần nhất', kk); ghi(x.dong, 'Ngày kiểm kê', hom); }
      if (req.ss !== undefined) ghi(x.dong, 'SL sổ sách', so(req.ss, 'Số lượng sổ sách'));
      ghi(x.dong, 'Tình trạng', tt); ghi(x.dong, 'Ghi chú', gc);
      ghi(x.dong, 'Cập nhật bởi', nd.ten); ghi(x.dong, 'Cập nhật lúc', new Date());
    } else if (req.viec === 'them') {
      const ten = chuAnToan_(chuoi_(req.ten).slice(0, 150));
      if (!ten) throw new Error('Nhập tên tài sản.');
      const nhom = HT_NHOM.indexOf(req.nhom) > -1 ? req.nhom : HT_NHOM[0];
      const khu = chuAnToan_(chuoi_(req.khu).slice(0, 120));
      if (!khu) throw new Error('Nhập khu / vị trí.');
      const so1 = so(req.kk, 'Số lượng');
      if (so1 === '') throw new Error('Nhập số lượng.');
      const max = ds.reduce(function (m, y) { const k = /^TS(\d+)$/.exec(y.ma); return k ? Math.max(m, +k[1]) : m; }, 0);
      const r = new Array(s.getLastColumn()).fill('');
      const dat = function (ten, v) { if (c[ten] > -1) r[c[ten]] = v; };
      dat('Mã', 'TS' + ('00' + (max + 1)).slice(-3)); dat('Nhóm tài sản', nhom); dat('Khu / vị trí', khu);
      dat('Lớp', chuAnToan_(chuoi_(req.lop).slice(0, 30))); dat('Tầng / Ô', chuAnToan_(chuoi_(req.tang).slice(0, 80))); dat('Tên tài sản', ten);
      dat('ĐVT', chuAnToan_(chuoi_(req.dvt).slice(0, 20)) || 'Cái'); dat('SL sổ sách', so(req.ss, 'Số lượng sổ sách') === '' ? so1 : so(req.ss, 'Số lượng sổ sách'));
      dat('SL kiểm kê gần nhất', so1); dat('Ngày kiểm kê', hom); dat('Tình trạng', tt || 'Bình thường'); dat('Ghi chú', gc);
      dat('Cập nhật bởi', nd.ten); dat('Cập nhật lúc', new Date());
      s.appendRow(r);
    } else throw new Error('Yêu cầu không hợp lệ.');
    return hienTrang_(nd);
  });
}
