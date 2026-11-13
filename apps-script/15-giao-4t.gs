/* ------------------------------------------------ giao việc nhóm Truyền thông - Thông tin (sheet Timeline) */
/*
 * Văn phòng Đoàn đã cấp quyền chỉnh sửa (11/2026): quản lý tạo hoạt động mới trên dashboard → ghi vào tab tháng tương ứng
 * của sheet Timeline, ở HÀNG TRỐNG NGAY SAU hàng cuối cùng đã có "Tên hoạt động". Chỉ ghi các cột theo tiêu đề dòng 1:
 * Thời gian, Mức độ, Thư mục, Tên hoạt động, Mô tả, Vị trí đăng, ô người làm của 5 việc con, Ghi chú (+ cột TT nếu đang đánh số).
 * Không đụng ô tick (Tiến độ, ô tick việc con), định dạng hay bảng thành viên bên phải. Mỗi thao tác ghi một dòng vào "Nhật ký dashboard".
 * Quyền: quản lý + phụ trách chính 4T (dòng "Phụ trách chính 4T" ở tab Cài đặt sheet lịch trực; chưa ghi thì lấy người có Chức vụ "Trưởng nhóm" của 4T).
 * Sửa / xoá: CHỈ hoạt động do dashboard tạo (sổ theo dõi ở tab "4T - hoạt động dashboard" của sheet lịch trực, khớp theo tab + tên hoạt động)
 * và chưa có ô tick nào được tick. Xoá = xoá các ô từ cột B đến hết cột hoạt động của hàng đó rồi dồn các ô bên dưới lên (không xoá cả hàng,
 * để bảng thành viên bên phải giữ nguyên). Trước khi xoá, nội dung hàng được lưu vào sổ theo dõi + Nhật ký để khôi phục.
 * Danh sách chọn (Mức độ, Vị trí đăng, người làm) lấy từ quy tắc xác thực dữ liệu của chính tab tháng → giống hệt khi nhập trên sheet.
 */
const G4T_COT = [['mucDo', 'Mức độ'], ['thuMuc', 'Thư mục'], ['viTri', 'Vị trí đăng']];

/** Danh sách giá trị của quy tắc xác thực dữ liệu ở một ô (danh sách / dải ô). null nếu ô không có danh sách chọn. */
function dsXacThuc_(o) {
  try {
    const dv = o.getDataValidation();
    if (!dv) return null;
    const t = dv.getCriteriaType(), v = dv.getCriteriaValues();
    if (t === SpreadsheetApp.DataValidationCriteria.VALUE_IN_LIST) return (v[0] || []).map(chuoi_).filter(Boolean);
    if (t === SpreadsheetApp.DataValidationCriteria.VALUE_IN_RANGE && v[0]) {
      return v[0].getValues().reduce(function (a, r) { return a.concat(r); }, []).map(chuoi_).filter(function (x, i, a) { return x && a.indexOf(x) === i; });
    }
  } catch (e) {}
  return null;
}

/** Tiêu chí nhập của tab tháng: danh sách chọn theo cột (lấy ở hàng dữ liệu đầu tiên) + các giá trị đã dùng làm gợi ý. */
function tieuChi4t_(ss, tab) {
  const c = CacheService.getScriptCache(), k = 'g4t:tc1:' + tab, co = c.get(k);
  if (co) return JSON.parse(co);
  const s = ss.getSheetByName(tab);
  const cot = timCot_(s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0]);
  const o = {};
  G4T_COT.forEach(function (x) { if (cot[x[0]] !== undefined) o[x[0]] = dsXacThuc_(s.getRange(DONG_DU_LIEU_DAU, cot[x[0]] + 1)); });
  const viecCo = VIEC.filter(function (v) { return cot[v.key] !== undefined; });
  o.nguoi = viecCo.length ? dsXacThuc_(s.getRange(DONG_DU_LIEU_DAU, cot[viecCo[0].key] + 2)) : null;
  o.viec = viecCo.map(function (v) { return v.key; });
  try { c.put(k, JSON.stringify(o), 1800); } catch (e) {}
  return o;
}

const TAB_G4 = '4T - hoạt động dashboard';
const COT_G4 = ['Mã', 'Tab', 'Tên hoạt động', 'Thời gian', 'Trạng thái', 'Tạo bởi', 'Tạo lúc', 'Cập nhật bởi', 'Cập nhật lúc', 'Dữ liệu khi xoá'];
const G4_TRUONG = ['ngay', 'mucDo', 'thuMuc', 'ten', 'moTa', 'viTri', 'ghiChu'];

/** Phụ trách chính nhóm 4T: dòng "Phụ trách chính 4T" ở tab Cài đặt (tên, cách nhau dấu phẩy); chưa ghi thì lấy trưởng nhóm 4T. */
function phuTrach4t_() {
  const r = giaTriCaiDat_().filter(function (x) { return chuanHoa_(x[0]) === chuanHoa_('Phụ trách chính 4T'); })[0];
  const ds = r ? chuoi_(r[1]).split(/[,;\n]+/).map(chuoi_).filter(Boolean) : [];
  if (ds.length) return ds;
  try { return truongNhom_('4t'); } catch (e) { return []; }
}
function quyen4t_(nd) {
  const ql = nd.vaiTro === 'quanLy' && !nd.xemThu;
  const pt = phuTrach4t_().indexOf(nd.ten) > -1;
  if (!ql && !pt) throw loiQuyen_('Chỉ quản lý và phụ trách chính nhóm Truyền thông - Thông tin mới giao / sửa / xoá việc của nhóm.');
  return { ql: ql, pt: pt };
}

function tabG4_() { return damBaoTab_(sheetTruc_(), TAB_G4, COT_G4, [130, 80, 280, 100, 90, 150, 130, 150, 130, 360]); }
function docG4_(s) {
  if (s.getLastRow() < 2) return [];
  return s.getRange(2, 1, s.getLastRow() - 1, COT_G4.length).getValues().map(function (r, i) {
    return { dong: i + 2, ma: chuoi_(r[0]), tab: chuoi_(r[1]), ten: chuoi_(r[2]), trangThai: chuoi_(r[4]) || 'Đang có', taoBoi: chuoi_(r[5]),
      capNhatBoi: chuoi_(r[7]), capNhatLuc: lucChu_(r[8]), du: chuoi_(r[9]) };
  }).filter(function (x) { return x.ma; });
}
/** Hoạt động tạo trước khi có sổ theo dõi: lấy từ Nhật ký ("Giao việc: tạo hoạt động") rồi thêm vào sổ (một lần). */
function boSungG4_(ss, s, ds, d) {
  const nk = ss.getSheetByName(CONFIG.TAB_NHAT_KY);
  if (!nk || nk.getLastRow() < 2) return ds;
  const co = {}; ds.forEach(function (x) { co[x.tab + '|' + x.ten] = 1; });
  const them = [];
  // Ô Tab trong Nhật ký có thể bị Sheets tự đổi "11.2026" thành ngày hoặc số → đưa về dạng tên tab "MM.yyyy"
  const tabChu = function (v) {
    if (Object.prototype.toString.call(v) === '[object Date]') return Utilities.formatDate(v, ss.getSpreadsheetTimeZone(), 'MM.yyyy');
    if (typeof v === 'number') { const p = v.toFixed(4).split('.'); return ('0' + p[0]).slice(-2) + '.' + p[1]; }
    const m = /^(\d{1,2})\.(\d{4})$/.exec(chuoi_(v)); return m ? ('0' + m[1]).slice(-2) + '.' + m[2] : chuoi_(v);
  };
  nk.getRange(2, 1, nk.getLastRow() - 1, 5).getValues().forEach(function (r) {
    if (chuoi_(r[2]).indexOf('Giao việc: tạo hoạt động') !== 0) return;
    r[3] = tabChu(r[3]);
    const k = chuoi_(r[3]) + '|' + chuoi_(r[4]);
    if (co[k]) return;
    const t = d.cacThang.filter(function (x) { return x.tab === chuoi_(r[3]); })[0];
    if (!t || !t.hoatDong.some(function (h) { return h.ten === chuoi_(r[4]); })) return;
    co[k] = 1; them.push([maMoi_('HD'), chuoi_(r[3]), chuoi_(r[4]), '', 'Đang có', chuoi_(r[1]), r[0], '', '', '']);
  });
  if (!them.length) return ds;
  s.getRange(s.getLastRow() + 1, 1, them.length, COT_G4.length).setValues(them);
  return docG4_(s);
}

function giao4tDs_(nd, req) {
  const q = quyen4t_(nd);
  const ss = moSheet_(), d = layDuLieu(req && req.moi === true);
  const tabs = d.cacThang.map(function (t) { return t.tab; });
  // Chỉ đọc tiêu chí của tháng đang chọn (mặc định tháng hiện tại) để nhanh; đổi tháng thì trang gọi lại kèm tab
  const nay = bayGio_().ngay.split('-'), tabNay = nay[1] + '.' + nay[0];
  const tab = tabs.indexOf(req && req.tab) > -1 ? req.tab : (tabs.indexOf(tabNay) > -1 ? tabNay : tabs[tabs.length - 1] || '');
  // Gợi ý từ dữ liệu đã nhập (dùng khi cột không có danh sách chọn)
  const daDung = { mucDo: [], thuMuc: [], viTri: [] };
  d.cacThang.forEach(function (t) { t.hoatDong.forEach(function (h) {
    Object.keys(daDung).forEach(function (k) { const v = h[k]; if (v && daDung[k].indexOf(v) === -1 && daDung[k].length < 40) daDung[k].push(v); });
  }); });
  const tc = {};
  (tab ? [tab] : []).forEach(function (t) { try { tc[t] = tieuChi4t_(ss, t); } catch (e) { tc[t] = { loi: String(e.message || e) }; } });
  // Hoạt động do dashboard tạo (được sửa / xoá) + đã xoá gần đây (khôi phục)
  const sg = tabG4_();
  const g4 = boSungG4_(ss, sg, docG4_(sg), d);
  const dash = {};
  d.cacThang.forEach(function (t) {
    const dt = {};
    t.hoatDong.forEach(function (h) {
      const r = g4.filter(function (x) { return x.trangThai === 'Đang có' && x.tab === t.tab && x.ten === h.ten; })[0];
      if (r && !dt[r.ma]) { dt[r.ma] = 1; dash[t.tab + '|' + h.dong] = r.ma; }
    });
  });
  const daXoa = g4.filter(function (x) { return x.trangThai === 'Đã xoá'; }).slice(-15).reverse()
    .map(function (x) { return { ma: x.ma, tab: x.tab, ten: x.ten, boi: x.capNhatBoi, luc: x.capNhatLuc }; });
  return { homNay: bayGio_().ngay, tab: tab, thanhVien: d.thanhVien, cacThang: d.cacThang, tieuChi: tc, daDung: daDung, dash: dash, daXoa: daXoa,
    quyen: q, phuTrach: phuTrach4t_(), tenViec: VIEC.map(function (v) { return { key: v.key, ten: v.tieuDe, loai: v.loai }; }) };
}

/** Kiểm tra + làm sạch nội dung một hoạt động (dùng khi tạo / sửa / khôi phục). */
function sachHoatDong4t_(f, tn) {
  const sach = function (v, n) { return chuAnToan_(chuoi_(v).slice(0, n)); };
  const o = { ten: sach(f.ten, 300), mucDo: sach(f.mucDo, 60), thuMuc: sach(f.thuMuc, 500), moTa: sach(f.moTa, 2000), viTri: sach(f.viTri, 200), ghiChu: sach(f.ghiChu, 500), ngay: '' };
  if (!o.ten) throw new Error('Nhập tên hoạt động.');
  if (f.ngay) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.ngay)) throw new Error('Ngày không hợp lệ.');
    const p = f.ngay.split('-').map(Number);
    if (p[0] !== tn.nam || p[1] !== tn.thang) throw new Error('Ngày ' + p[2] + '/' + p[1] + '/' + p[0] + ' không thuộc tháng ' + tn.thang + '/' + tn.nam + '. Chọn đúng tháng hoặc đổi tab tháng.');
    o.ngay = new Date(p[0], p[1] - 1, p[2]);
  }
  return o;
}
/** Ghi một hoạt động mới vào hàng trống ngay sau hàng cuối cùng có tên hoạt động. Trả số hàng. */
function ghiHangMoi4t_(s, cot, f, nguoi) {
  const n = Math.max(s.getLastRow(), DONG_DU_LIEU_DAU);
  const cotTen = s.getRange(1, cot.ten + 1, n, 1).getValues();
  let cuoi = DONG_DU_LIEU_DAU - 1;
  for (let i = n - 1; i >= DONG_DU_LIEU_DAU - 1; i--) { if (chuoi_(cotTen[i][0])) { cuoi = i + 1; break; } }
  const dong = cuoi + 1;
  if (dong > s.getMaxRows()) s.insertRowsAfter(s.getMaxRows(), 1);
  // TT: nếu cột A đang đánh số (hàng trên là số, hàng mới trống, không phải công thức) thì đánh tiếp
  const tt = s.getRange(dong, 1);
  if (cot.ten !== 0 && !tt.getFormula() && chuoi_(tt.getValue()) === '' && cuoi >= DONG_DU_LIEU_DAU) {
    const truoc = s.getRange(cuoi, 1).getValue();
    if (typeof truoc === 'number' && !s.getRange(cuoi, 1).getFormula()) tt.setValue(truoc + 1);
  }
  G4_TRUONG.forEach(function (k) { if (cot[k] !== undefined && f[k] !== '' && f[k] !== null && f[k] !== undefined) s.getRange(dong, cot[k] + 1).setValue(f[k]); });
  VIEC.forEach(function (v) { if (cot[v.key] !== undefined && nguoi[v.key]) s.getRange(dong, cot[v.key] + 2).setValue(nguoi[v.key]); });
  return dong;
}

function giao4t_(nd, req) {
  quyen4t_(nd);
  const tab = String(req.tab || '');
  let kq = {};
  const khoa = LockService.getScriptLock();
  khoa.waitLock(20000);
  try {
    const ss = moSheet_(), sg = tabG4_(), g4 = docG4_(sg), bay = new Date();
    let ghiNk;
    if (req.viec === 'khoiPhuc') {
      const r = g4.filter(function (x) { return x.ma === chuoi_(req.ma); })[0];
      if (!r || r.trangThai !== 'Đã xoá' || !r.du) throw new Error('Không tìm thấy hoạt động đã xoá này.');
      const du = JSON.parse(r.du), s = ss.getSheetByName(r.tab), tn = laTabThang_(r.tab);
      if (!s || !tn) throw new Error('Không còn tab ' + r.tab + ' trong sheet Timeline.');
      const cot = timCot_(s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0]);
      const f = sachHoatDong4t_(du.f || {}, tn);
      const tv = docDuLieu_(ss).thanhVien, nguoi = {};
      VIEC.forEach(function (v) { const t = chuoi_((du.nguoi || {})[v.key]); if (t && tv.indexOf(t) > -1) nguoi[v.key] = t; });
      const dong = ghiHangMoi4t_(s, cot, f, nguoi);
      sg.getRange(r.dong, 5).setValue('Đang có'); sg.getRange(r.dong, 8, 1, 3).setValues([[nd.ten, bay, '']]);
      ghiNk = [bay, nd.ten, 'Giao việc: khôi phục hoạt động (hàng ' + dong + ')', r.tab, f.ten, ''];
      kq.tab = r.tab;
    } else {
      const tn = laTabThang_(tab);
      if (!tn) throw new Error('Tháng không hợp lệ.');
      const s = ss.getSheetByName(tab);
      if (!s) throw new Error('Không tìm thấy tab ' + tab + ' trong sheet Timeline.');
      const cot = timCot_(s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0]);
      if (cot.ten === undefined) throw new Error('Tab ' + tab + ' không có cột "Tên hoạt động".');
      const tv = docDuLieu_(ss).thanhVien;
      const kiemNguoi = function (t) { t = chuoi_(t); if (t && tv.indexOf(t) === -1) throw new Error('"' + t + '" không có trong danh sách thành viên nhóm.'); return t; };
      // Hàng của hoạt động đã có: kiểm tra đúng tên (sheet có thể vừa bị sửa) và (khi sửa / xoá) đúng là hoạt động do dashboard tạo
      const hangCu = function (canDash) {
        const dong = Number(req.dong);
        if (!(dong >= DONG_DU_LIEU_DAU)) throw new Error('Hoạt động không hợp lệ.');
        const tenHD = chuoi_(s.getRange(dong, cot.ten + 1).getValue());
        if (!tenHD || tenHD !== chuoi_(req.hoatDong)) throw new Error('Sheet vừa được chỉnh sửa. Dashboard đã tải lại, bạn thao tác lại giúp nhé.');
        let r = null;
        if (canDash) {
          r = g4.filter(function (x) { return x.ma === chuoi_(req.ma) && x.trangThai === 'Đang có' && x.tab === tab && x.ten === tenHD; })[0];
          if (!r) throw new Error('Chỉ sửa / xoá được hoạt động tạo trên dashboard. Hoạt động nhập trên sheet thì sửa trực tiếp trên sheet.');
        }
        return { dong: dong, ten: tenHD, r: r };
      };

      if (req.viec === 'tao') {
        const f = sachHoatDong4t_(req, tn), nguoi = {};
        VIEC.forEach(function (v) { nguoi[v.key] = kiemNguoi((req.nguoi || {})[v.key]); });
        const dong = ghiHangMoi4t_(s, cot, f, nguoi);
        sg.appendRow([maMoi_('HD'), tab, f.ten, f.ngay || '', 'Đang có', nd.ten, bay, '', '', '']);
        const ai = VIEC.filter(function (v) { return nguoi[v.key]; }).map(function (v) { return v.tieuDe + ': ' + nguoi[v.key]; }).join('; ');
        ghiNk = [bay, nd.ten, 'Giao việc: tạo hoạt động (hàng ' + dong + ')', tab, f.ten, ai || 'Chưa giao người'];
      } else if (req.viec === 'nguoi') {
        const h = hangCu(false), viec = VIEC.filter(function (v) { return v.key === req.key; })[0];
        if (!viec || cot[viec.key] === undefined) throw new Error('Việc không hợp lệ.');
        const oTick = s.getRange(h.dong, cot[viec.key] + 1), oNguoi = s.getRange(h.dong, cot[viec.key] + 2);
        const cu = chuoi_(oNguoi.getValue()), moi = kiemNguoi(req.nguoi);
        if (cu === moi) return giao4tDs_(nd, { tab: tab });
        if (cu && oTick.getValue() === true) throw new Error('Việc này ' + cu + ' đã tick hoàn thành, không đổi người được.');
        oNguoi.setValue(moi);
        ghiNk = [bay, nd.ten, moi ? (cu ? 'Giao việc: đổi ' + cu + ' → ' + moi : 'Giao việc cho ' + moi) : 'Giao việc: gỡ ' + cu, tab, h.ten, viec.tieuDe];
      } else if (req.viec === 'sua') {
        const h = hangCu(true), f = sachHoatDong4t_(req.f || {}, tn);
        const doi = [];
        G4_TRUONG.forEach(function (k) {
          if (cot[k] === undefined) return;
          const o = s.getRange(h.dong, cot[k] + 1), cu = k === 'ngay' ? ngayISO_(o.getValue(), ss.getSpreadsheetTimeZone()) || '' : chuoi_(o.getValue());
          const moi = k === 'ngay' ? (req.f.ngay || '') : f[k];
          if (cu === moi) return;
          o.setValue(f[k]); doi.push(k);
        });
        sg.getRange(h.r.dong, 3, 1, 2).setValues([[f.ten, f.ngay || '']]); sg.getRange(h.r.dong, 8, 1, 2).setValues([[nd.ten, bay]]);
        ghiNk = [bay, nd.ten, 'Giao việc: sửa hoạt động (hàng ' + h.dong + ')', tab, f.ten, doi.length ? 'Sửa: ' + doi.join(', ') + (h.ten !== f.ten ? ' · tên cũ: ' + h.ten : '') : 'Không đổi gì'];
      } else if (req.viec === 'xoa') {
        const h = hangCu(true);
        // Không xoá hoạt động đã có ô tick được tick
        const tick = VIEC.filter(function (v) { return cot[v.key] !== undefined && s.getRange(h.dong, cot[v.key] + 1).getValue() === true; });
        if (tick.length || (cot.tienDo !== undefined && s.getRange(h.dong, cot.tienDo + 1).getValue() === true)) {
          throw new Error('Hoạt động đã có việc được tick hoàn thành, không xoá được. Bỏ tick trên sheet trước nếu thật sự cần xoá.');
        }
        // Lưu nội dung để khôi phục
        const tz = ss.getSpreadsheetTimeZone(), du = { f: {}, nguoi: {} };
        G4_TRUONG.forEach(function (k) { if (cot[k] !== undefined) { const v = s.getRange(h.dong, cot[k] + 1).getValue(); du.f[k] = k === 'ngay' ? (ngayISO_(v, tz) || '') : chuoi_(v); } });
        VIEC.forEach(function (v) { if (cot[v.key] !== undefined) du.nguoi[v.key] = chuoi_(s.getRange(h.dong, cot[v.key] + 2).getValue()); });
        // Xoá ô từ cột B đến hết cột hoạt động và dồn ô bên dưới lên (bảng thành viên bên phải không bị ảnh hưởng)
        let cuoiCot = 1;
        Object.keys(cot).forEach(function (k) { if (cot[k] !== undefined) cuoiCot = Math.max(cuoiCot, cot[k] + (VIEC.some(function (v) { return v.key === k; }) ? 2 : 1)); });
        const n = Math.max(s.getLastRow(), h.dong);
        const cotTen = s.getRange(1, cot.ten + 1, n, 1).getValues();
        let cuoi = h.dong;
        for (let i = n - 1; i >= h.dong - 1; i--) { if (chuoi_(cotTen[i][0])) { cuoi = i + 1; break; } }
        s.getRange(h.dong, 2, 1, cuoiCot - 1).deleteCells(SpreadsheetApp.Dimension.ROWS);
        // TT đánh số tay chỉ cho các hàng có hoạt động → bỏ số ở hàng cuối vừa trống (nếu cột A không đánh sẵn cho cả bảng)
        const aCuoi = s.getRange(cuoi, 1), aSau = s.getRange(cuoi + 1, 1);
        if (!aCuoi.getFormula() && typeof aCuoi.getValue() === 'number' && chuoi_(aSau.getValue()) === '') aCuoi.clearContent();
        sg.getRange(h.r.dong, 5).setValue('Đã xoá'); sg.getRange(h.r.dong, 8, 1, 3).setValues([[nd.ten, bay, JSON.stringify(du)]]);
        ghiNk = [bay, nd.ten, 'Giao việc: xoá hoạt động (hàng ' + h.dong + ')', tab, h.ten, JSON.stringify(du)];
        kq.vuaXoa = h.r.ma;
      } else throw new Error('Yêu cầu không hợp lệ.');
      kq.tab = tab;
    }
    ghiNhatKy_(ss, ghiNk);
    SpreadsheetApp.flush();
    luuNho_(docDuLieu_(ss));
  } finally {
    khoa.releaseLock();
  }
  const o = giao4tDs_(nd, { tab: kq.tab });
  if (kq.vuaXoa) o.vuaXoa = kq.vuaXoa;
  return o;
}
