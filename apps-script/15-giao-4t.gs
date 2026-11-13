/* ------------------------------------------------ giao việc nhóm Truyền thông - Thông tin (sheet Timeline) */
/*
 * Văn phòng Đoàn đã cấp quyền chỉnh sửa (11/2026): quản lý tạo hoạt động mới trên dashboard → ghi vào tab tháng tương ứng
 * của sheet Timeline, ở HÀNG TRỐNG NGAY SAU hàng cuối cùng đã có "Tên hoạt động". Chỉ ghi các cột theo tiêu đề dòng 1:
 * Thời gian, Mức độ, Thư mục, Tên hoạt động, Mô tả, Vị trí đăng, ô người làm của 5 việc con, Ghi chú (+ cột TT nếu đang đánh số).
 * Không đụng ô tick (Tiến độ, ô tick việc con), định dạng hay bảng thành viên bên phải. Mỗi thao tác ghi một dòng vào "Nhật ký dashboard".
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

function giao4tDs_(nd, req) {
  canQuanLyViec_(nd);
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
  return { homNay: bayGio_().ngay, tab: tab, thanhVien: d.thanhVien, cacThang: d.cacThang, tieuChi: tc, daDung: daDung,
    tenViec: VIEC.map(function (v) { return { key: v.key, ten: v.tieuDe, loai: v.loai }; }) };
}

function giao4t_(nd, req) {
  canQuanLyViec_(nd);
  const tab = String(req.tab || '');
  const tn = laTabThang_(tab);
  if (!tn) throw new Error('Tháng không hợp lệ.');
  const sach = function (v, n) { return chuAnToan_(chuoi_(v).slice(0, n)); };
  const khoa = LockService.getScriptLock();
  khoa.waitLock(20000);
  try {
    const ss = moSheet_(), s = ss.getSheetByName(tab);
    if (!s) throw new Error('Không tìm thấy tab ' + tab + ' trong sheet Timeline.');
    const cot = timCot_(s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0]);
    if (cot.ten === undefined) throw new Error('Tab ' + tab + ' không có cột "Tên hoạt động".');
    const tv = docDuLieu_(ss).thanhVien;
    const kiemNguoi = function (t) { t = chuoi_(t); if (t && tv.indexOf(t) === -1) throw new Error('"' + t + '" không có trong danh sách thành viên nhóm.'); return t; };
    let ghiNk;

    if (req.viec === 'tao') {
      const ten = sach(req.ten, 300);
      if (!ten) throw new Error('Nhập tên hoạt động.');
      let ngay = '';
      if (req.ngay) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(req.ngay)) throw new Error('Ngày không hợp lệ.');
        const p = req.ngay.split('-').map(Number);
        if (p[0] !== tn.nam || p[1] !== tn.thang) throw new Error('Ngày ' + p[2] + '/' + p[1] + '/' + p[0] + ' không thuộc tháng ' + tn.thang + '/' + tn.nam + '. Chọn đúng tháng hoặc đổi tab tháng.');
        ngay = new Date(p[0], p[1] - 1, p[2]);
      }
      const nguoi = {};
      VIEC.forEach(function (v) { nguoi[v.key] = kiemNguoi((req.nguoi || {})[v.key]); });

      // Hàng trống ngay sau hàng cuối cùng có tên hoạt động (bỏ qua bảng thành viên ở bên phải)
      const n = Math.max(s.getLastRow(), DONG_DU_LIEU_DAU);
      const cotTen = s.getRange(1, cot.ten + 1, n, 1).getValues();
      let cuoi = DONG_DU_LIEU_DAU - 1;
      for (let i = n - 1; i >= DONG_DU_LIEU_DAU - 1; i--) { if (chuoi_(cotTen[i][0])) { cuoi = i + 1; break; } }
      const dong = cuoi + 1;
      if (dong > s.getMaxRows()) s.insertRowsAfter(s.getMaxRows(), 1);

      const dat = function (k, v) { if (cot[k] !== undefined && v !== '' && v !== null) s.getRange(dong, cot[k] + 1).setValue(v); };
      // TT: nếu cột A đang đánh số (hàng trên là số, hàng mới trống, không phải công thức) thì đánh tiếp
      const tt = s.getRange(dong, 1);
      if (cot.ten !== 0 && !tt.getFormula() && chuoi_(tt.getValue()) === '' && cuoi >= DONG_DU_LIEU_DAU) {
        const truoc = s.getRange(cuoi, 1).getValue();
        if (typeof truoc === 'number' && !s.getRange(cuoi, 1).getFormula()) tt.setValue(truoc + 1);
      }
      dat('ten', ten); dat('ngay', ngay); dat('mucDo', sach(req.mucDo, 60)); dat('thuMuc', sach(req.thuMuc, 500));
      dat('moTa', sach(req.moTa, 2000)); dat('viTri', sach(req.viTri, 200)); dat('ghiChu', sach(req.ghiChu, 500));
      VIEC.forEach(function (v) { if (cot[v.key] !== undefined && nguoi[v.key]) s.getRange(dong, cot[v.key] + 2).setValue(nguoi[v.key]); });
      const ai = VIEC.filter(function (v) { return nguoi[v.key]; }).map(function (v) { return v.tieuDe + ': ' + nguoi[v.key]; }).join('; ');
      ghiNk = [new Date(), nd.ten, 'Giao việc: tạo hoạt động (hàng ' + dong + ')', tab, ten, ai || 'Chưa giao người'];
    } else if (req.viec === 'nguoi') {
      const dong = Number(req.dong), viec = VIEC.filter(function (v) { return v.key === req.key; })[0];
      if (!viec || cot[viec.key] === undefined || !(dong >= DONG_DU_LIEU_DAU)) throw new Error('Việc không hợp lệ.');
      const tenHD = chuoi_(s.getRange(dong, cot.ten + 1).getValue());
      if (!tenHD || tenHD !== chuoi_(req.hoatDong)) throw new Error('Sheet vừa được chỉnh sửa. Dashboard đã tải lại, bạn thao tác lại giúp nhé.');
      const oTick = s.getRange(dong, cot[viec.key] + 1), oNguoi = s.getRange(dong, cot[viec.key] + 2);
      const cu = chuoi_(oNguoi.getValue()), moi = kiemNguoi(req.nguoi);
      if (cu === moi) return giao4tDs_(nd, { tab: tab });
      if (cu && oTick.getValue() === true) throw new Error('Việc này ' + cu + ' đã tick hoàn thành, không đổi người được.');
      oNguoi.setValue(moi);
      ghiNk = [new Date(), nd.ten, moi ? (cu ? 'Giao việc: đổi ' + cu + ' → ' + moi : 'Giao việc cho ' + moi) : 'Giao việc: gỡ ' + cu, tab, tenHD, viec.tieuDe];
    } else throw new Error('Yêu cầu không hợp lệ.');

    ghiNhatKy_(ss, ghiNk);
    SpreadsheetApp.flush();
    luuNho_(docDuLieu_(ss));
  } finally {
    khoa.releaseLock();
  }
  return giao4tDs_(nd, { tab: tab });
}
