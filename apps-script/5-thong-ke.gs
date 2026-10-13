/* ------------------------------------------------ thống kê thành viên: giờ trực + hoạt động tham gia */
/*
 * Giờ trực: tính từ tab Đăng ký của lịch trực (ca còn hiệu lực trong khoảng ngày).
 *   - giờ đăng ký: ca đã đăng ký (không gồm trực đột xuất)
 *   - giờ trực thực tế: ca đã điểm danh + trực đột xuất đã được duyệt
 *   - vắng: ca đã đăng ký, đã qua giờ mà không điểm danh
 * Hoạt động: nhiệm vụ có hạn trong khoảng ngày.
 *   - phụ trách: là người phụ trách chính (3 nhóm Nghiệp vụ / CSDL - CSVC / Nội vụ)
 *   - hỗ trợ: có tên ở cột Hỗ trợ (3 nhóm trên)
 *   - truyền thông: nhận việc con (viết bài / thiết kế / chụp hình) trong Timeline của nhóm 4T
 * Quản lý xem tất cả thành viên; thành viên chỉ nhận số liệu của chính mình.
 */
const THONG_KE = { NAM_HOC_BD: '2026-08-01' };

function thongKe_(nd, req) {
  const now = bayGio_(), quanLy = nd.vaiTro === 'quanLy';
  const hopLe = function (v) { return /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')); };
  let tu = hopLe(req.tu) ? req.tu : THONG_KE.NAM_HOC_BD, den = hopLe(req.den) ? req.den : now.ngay;
  if (den < tu) { const t = tu; tu = den; den = t; }

  const bang = bangTaiKhoan_(), theoEmail = {}, nguoi = {};
  const tao = function (ten, email, nhom) {
    if (!nguoi[ten]) {
      nguoi[ten] = { ten: ten, email: email || '', nhom: [], gioDangKy: 0, gioTruc: 0, gioDotXuat: 0, gioCho: 0, soCa: 0, vang: 0,
        phuTrach: 0, hoTro: 0, truyenThong: 0, xong: 0, tuan: {} };
    }
    const p = nguoi[ten];
    (nhom || []).forEach(function (m) { if (p.nhom.indexOf(m) === -1) p.nhom.push(m); });
    if (email && !p.email) p.email = email;
    return p;
  };
  Object.keys(bang).forEach(function (em) {
    const tk = bang[em];
    theoEmail[em] = tk.ten;
    if (tk.quanLy && !(tk.nhom || []).length) return; // tài khoản quản lý thuần không tính
    tao(tk.ten, em, tk.nhom);
  });
  const lay = function (ten, email, nhom) {
    const t = (email && theoEmail[email]) || ten;
    return t ? tao(t, email, nhom) : null;
  };

  // ---- giờ trực
  const ss = sheetTruc_(), cd = caiDatTruc_(ss);
  let ngayDau = null;
  docTruc_(ss).forEach(function (x) {
    if (x.ngay < tu || x.ngay > den || !conHieuLuc_(x)) return;
    const p = lay(x.ten, x.email);
    if (!p) return;
    const m = soPhut_(x), dx = x.loai === 'Đột xuất';
    if (!ngayDau || x.ngay < ngayDau) ngayDau = x.ngay;
    if (x.trangThai === TT.CHO) { p.gioCho += m; return; }
    if (!dx) { p.gioDangKy += m; p.soCa++; }
    const w = dauTuan_(x.ngay), o = p.tuan[w] || (p.tuan[w] = { dk: 0, tt: 0 });
    if (!dx) o.dk += m;
    if (x.diemDanh) { p.gioTruc += m; o.tt += m; if (dx) p.gioDotXuat += m; }
    else if (!dx && daQua_(x.ngay, x.den, now)) p.vang++;
  });

  // ---- hoạt động
  const loi = [];
  try {
    layDuLieu(false).cacThang.forEach(function (t) {
      t.hoatDong.forEach(function (h) {
        if (!h.ngay || h.ngay < tu || h.ngay > den) return;
        h.viec.forEach(function (v) {
          if (!v.nguoi) return;
          const p = lay(v.nguoi, '', ['4t']);
          p.truyenThong++; if (v.xong) p.xong++;
        });
      });
    });
  } catch (e) { loi.push('Truyền thông - Thông tin'); }
  NHOM_MOI.forEach(function (n) {
    try {
      layNhom(n.ma, false).nhiemVu.forEach(function (v) {
        if (!v.han || v.han < tu || v.han > den) return;
        const xong = v.trangThai === 'Hoàn thành';
        if (v.chinh) { const p = lay(v.chinh, '', [n.ma]); p.phuTrach++; if (xong) p.xong++; }
        v.hoTro.split(',').map(chuoi_).filter(String).forEach(function (ten) {
          if (ten === v.chinh) return;
          const p = lay(ten, '', [n.ma]); p.hoTro++; if (xong) p.xong++;
        });
      });
    } catch (e) { loi.push(n.ten); }
  });

  // số tuần làm mục tiêu: từ tuần đầu có lịch trực (hoặc đầu khoảng) đến tuần hiện tại / cuối khoảng
  const cuoi = den < now.ngay ? den : now.ngay;
  const bd = dauTuan_(ngayDau && ngayDau > tu ? ngayDau : tu);
  let soTuan = 0;
  for (let w = bd; w <= cuoi; w = themNgay_(w, 7)) soTuan++;

  let ds = Object.keys(nguoi).map(function (k) {
    const p = nguoi[k];
    return {
      ten: p.ten, email: p.email, nhom: p.nhom,
      gioDangKy: p.gioDangKy / 60, gioTruc: p.gioTruc / 60, gioDotXuat: p.gioDotXuat / 60, gioCho: p.gioCho / 60,
      soCa: p.soCa, vang: p.vang, phuTrach: p.phuTrach, hoTro: p.hoTro, truyenThong: p.truyenThong, xong: p.xong,
      tuan: Object.keys(p.tuan).sort().map(function (w) { return { tuan: w, dangKy: p.tuan[w].dk / 60, truc: p.tuan[w].tt / 60 }; })
    };
  });
  if (!quanLy) ds = ds.filter(function (p) { return p.email === nd.email || p.ten === nd.ten; });
  ds.sort(function (a, b) { return b.gioTruc - a.gioTruc || b.gioDangKy - a.gioDangKy || (a.ten < b.ten ? -1 : 1); });
  return { tu: tu, den: den, homNay: now.ngay, namHocBd: THONG_KE.NAM_HOC_BD, toiThieuGio: cd.toiThieuGio, soTuan: soTuan,
    tuanDau: bd, nguoi: ds, quanLy: quanLy, loi: loi };
}
