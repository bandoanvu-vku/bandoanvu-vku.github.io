/**
 * DASHBOARD NHÓM TRUYỀN THÔNG - THÔNG TIN (4T) — Ban Đoàn vụ
 *
 * Đọc trực tiếp các tab tháng (08.2026, 09.2026, ...) của sheet "Timeline 2026 - 2027".
 * Thành viên nhận việc / tick hoàn thành trên dashboard -> ghi ngược lại vào đúng ô trong sheet.
 * Sửa sheet -> dashboard tự cập nhật. Không cần sửa lại code khi thêm hoạt động hay thêm tab tháng.
 */

const CONFIG = {
  // Chỉ lấy các tab tháng từ mốc này trở về sau (tên tab dạng "08.2026")
  BAT_DAU: { thang: 8, nam: 2026 },

  // Mã nhóm: để trống '' = ai có link cũng nhận việc/tick được.
  // Điền ví dụ '4T2026' = phải nhập đúng mã mới ghi được (xem thì vẫn công khai).
  MA_NHOM: '',

  TIEU_DE: 'Dashboard nhóm Truyền thông - Thông tin',
  TAB_NHAT_KY: 'Nhật ký dashboard',

  // ID sheet Timeline không ghi ở đây (repo công khai): lưu ở Script Properties, khoá SHEET_TIMELINE
  SPREADSHEET_ID: ''
};

// Các việc con của mỗi hoạt động. "tieuDe" phải khớp tiêu đề cột ở dòng 1 của tab tháng.
const VIEC = [
  { key: 'ctt', tieuDe: 'Content Tuổi trẻ', loai: 'Viết bài' },
  { key: 'cvp', tieuDe: 'Content VPĐ', loai: 'Viết bài' },
  { key: 'dtt', tieuDe: 'Des Tuổi trẻ', loai: 'Thiết kế' },
  { key: 'dvp', tieuDe: 'Des VPĐ', loai: 'Thiết kế' },
  { key: 'photo', tieuDe: 'Chụp hình', loai: 'Chụp ảnh' }
];

const DONG_DU_LIEU_DAU = 3; // dòng 1-2 là tiêu đề

/* ---------------------------------------------------------------- web app */

/** Không còn phục vụ trang HTML cũ hay dữ liệu công khai: mọi thứ đi qua doPost và phải đăng nhập. */
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({
    ok: false, canDangNhap: true,
    error: 'Dashboard Ban Đoàn vụ ở https://bandoanvu-vku.github.io/ và cần đăng nhập bằng tài khoản Google đã đăng ký.'
  })).setMimeType(ContentService.MimeType.JSON);
}

/** Trang GitHub Pages gửi mọi yêu cầu qua đây (text/plain JSON). Trừ bước đăng nhập, mọi yêu cầu phải kèm phiên đăng nhập. */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const req = body.req || {};
    if (body.action === 'dangNhap') return json_({ ok: true, data: dangNhap_(body.idToken) });

    const nd = nguoiDung_(body.token);
    const doc = {
      toi: function () { return nd; },
      data: function () { canNhom_(nd, '4t'); return layDuLieu(req.moi === true); },
      nhom: function () { canNhom_(nd, String(req.n || '')); return layNhom(String(req.n || ''), req.moi === true); },
      tongquan: function () { return locTongQuan_(layTongQuan(req.moi === true), nd); },
      cuaToi: function () { const o = cuaToi_(nd, req.moi === true); o.truc = trucTuanNay_(nd); return o; },
      lichTruc: function () { return lichTruc_(nd, req.tuan); },
      dangKyTruc: function () { return dangKyTruc_(nd, req); },
      huyTruc: function () { return huyTruc_(nd, req); },
      diemDanh: function () { return diemDanh_(nd, req); },
      datViTri: function () { return datViTri_(nd, req); },
      guiYeuCau: function () { return guiYeuCau_(nd, req); },
      rutYeuCau: function () { return rutYeuCau_(nd, req); },
      duyetTruc: function () { return duyetTruc_(nd, req); },
      pheDuyet: function () { return pheDuyet_(nd, req); },
      thongKe: function () { return thongKe_(nd, req); },
      hoSo: function () { return hoSoCuaToi_(nd); },
      luuHoSo: function () { return luuHoSo_(nd, req); },
      taiLieu: function () { return taiLieu_(nd); },
      luuTaiLieu: function () { return luuTaiLieu_(nd, req); },
      camNang: function () { return camNang_(nd); },
      luuCamNang: function () { return luuCamNang_(nd, req); },
      caiDat: function () { return caiDat_(nd); },
      luuCaiDat: function () { return luuCaiDat_(nd, req); },
      quanLySuaTruc: function () { return quanLySuaTruc_(nd, req); },
      congBoTruc: function () { return congBoTruc_(nd, req); }
    };
    if (Object.prototype.hasOwnProperty.call(doc, body.action)) return json_({ ok: true, data: doc[body.action]() });

    const ghi = { nhanViec: nhanViec, boNhan: boNhan, danhDauXong: danhDauXong, nhomGhi: nhomGhi };
    if (!Object.prototype.hasOwnProperty.call(ghi, body.action)) throw new Error('Yêu cầu không hợp lệ.');
    canNhom_(nd, body.action === 'nhomGhi' ? String(req.nhom || '') : '4t');
    req.ten = nd.ten; // tên lấy từ tài khoản đã đăng nhập, không tin tên trang gửi lên
    return json_({ ok: true, data: ghi[body.action](req) });
  } catch (err) {
    return json_({
      ok: false, error: String((err && err.message) || err),
      canDangNhap: !!(err && err.canDangNhap), khongQuyen: !!(err && err.khongQuyen)
    });
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/** Lấy toàn bộ dữ liệu. Kết quả được nhớ tạm 90 giây để mở nhanh; moi = true thì đọc lại sheet ngay. */
function layDuLieu(moi) {
  if (moi !== true) {
    const nho = nhoLay_('data');
    if (nho) { nho.thanhVien = hopNhat_(nho.thanhVien, themTuTaiKhoan_('4t')); return nho; }
  }
  const d = docDuLieu_(moSheet_());
  luuNho_(d);
  return d;
}

function luuNho_(d) {
  nhoGhi_('data', d);
  try { CacheService.getScriptCache().remove('tongquan'); } catch (err) {}
}

/** Bộ nhớ tạm giữ 6 giờ. Mỗi lần lấy ra có kèm "tuoi" = số giây kể từ lúc đọc sheet, để trang biết khi nào cần đọc lại. */
function nhoGhi_(khoa, d) {
  d.tuoi = 0;
  try { CacheService.getScriptCache().put(khoa, JSON.stringify({ luc: Date.now(), d: d }), 21600); } catch (err) {}
}

function nhoLay_(khoa) {
  const nho = CacheService.getScriptCache().get(khoa);
  if (!nho) return null;
  const o = JSON.parse(nho);
  if (!o || !o.d || !o.luc) return null;
  o.d.tuoi = Math.max(0, Math.round((Date.now() - o.luc) / 1000));
  return o.d;
}

/** Thành viên tự nhận một việc còn trống. */
function nhanViec(req) {
  return ghi_(req, function (o, ten) {
    const dangGiu = chuoi_(o.oNguoi.getValue());
    if (dangGiu && dangGiu !== ten) throw new Error('Việc này đã có ' + dangGiu + ' nhận rồi.');
    o.oNguoi.setValue(ten);
    return 'Nhận việc';
  });
}

/** Bỏ nhận (chỉ việc của chính mình và chưa tick xong). */
function boNhan(req) {
  return ghi_(req, function (o, ten) {
    if (chuoi_(o.oNguoi.getValue()) !== ten) throw new Error('Bạn chỉ bỏ nhận được việc của chính mình.');
    if (o.oTick.getValue() === true) throw new Error('Việc đã tick hoàn thành, hãy bỏ tick trước.');
    o.oNguoi.setValue('');
    return 'Bỏ nhận';
  });
}

/** Tick / bỏ tick hoàn thành (chỉ việc của chính mình). */
function danhDauXong(req) {
  return ghi_(req, function (o, ten) {
    if (chuoi_(o.oNguoi.getValue()) !== ten) throw new Error('Bạn chỉ cập nhật được việc của chính mình.');
    const xong = req.xong === true;
    if (typeof o.oTick.getValue() !== 'boolean') o.oTick.insertCheckboxes();
    o.oTick.setValue(xong);
    return xong ? 'Tick hoàn thành' : 'Bỏ tick hoàn thành';
  });
}

/* ------------------------------------------------------------------- ghi */

function ghi_(req, thaoTac) {
  req = req || {};
  if (CONFIG.MA_NHOM && String(req.ma || '').trim() !== CONFIG.MA_NHOM) {
    throw new Error('Mã nhóm chưa đúng.');
  }
  const khoa = LockService.getScriptLock();
  khoa.waitLock(20000);
  try {
    const ss = moSheet_();
    const tab = String(req.tab || '');
    if (!laTabThang_(tab)) throw new Error('Tab không hợp lệ.');
    const sheet = ss.getSheetByName(tab);
    if (!sheet) throw new Error('Không tìm thấy tab ' + tab + '.');

    const duLieu = docDuLieu_(ss);
    const ten = chuoi_(req.ten);
    if (duLieu.thanhVien.indexOf(ten) === -1) throw new Error('Hãy chọn tên của bạn trước.');

    const dong = Number(req.dong);
    const tieuDe = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const cot = timCot_(tieuDe);
    const viec = VIEC.filter(function (v) { return v.key === req.key; })[0];
    if (!viec || cot[viec.key] === undefined || !(dong >= DONG_DU_LIEU_DAU)) throw new Error('Việc không hợp lệ.');

    // Sheet có thể vừa bị chèn/xoá dòng: kiểm tra đúng hoạt động trước khi ghi
    const tenHD = chuoi_(sheet.getRange(dong, cot.ten + 1).getValue());
    if (!tenHD || tenHD !== chuoi_(req.hoatDong)) {
      throw new Error('Sheet vừa được chỉnh sửa. Dashboard đã tải lại, bạn thao tác lại giúp nhé.');
    }

    const hanhDong = thaoTac({
      oTick: sheet.getRange(dong, cot[viec.key] + 1),
      oNguoi: sheet.getRange(dong, cot[viec.key] + 2)
    }, ten);

    ghiNhatKy_(ss, [new Date(), ten, hanhDong, tab, tenHD, viec.tieuDe]);
    SpreadsheetApp.flush();
    const moiNhat = docDuLieu_(ss);
    luuNho_(moiNhat);
    return moiNhat;
  } finally {
    khoa.releaseLock();
  }
}

function ghiNhatKy_(ss, dong) {
  let sheet = ss.getSheetByName(CONFIG.TAB_NHAT_KY);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.TAB_NHAT_KY);
    sheet.appendRow(['Thời điểm', 'Người thao tác', 'Hành động', 'Tab', 'Hoạt động', 'Việc']);
  }
  sheet.appendRow(dong);
}

/* ------------------------------------------------------------------- đọc */

function moSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_TIMELINE') || CONFIG.SPREADSHEET_ID;
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

function laTabThang_(ten) {
  const m = /^(\d{1,2})\.(\d{4})$/.exec(String(ten).trim());
  if (!m) return null;
  const thang = Number(m[1]), nam = Number(m[2]);
  if (thang < 1 || thang > 12) return null;
  if (nam * 12 + thang < CONFIG.BAT_DAU.nam * 12 + CONFIG.BAT_DAU.thang) return null;
  return { thang: thang, nam: nam };
}

function docDuLieu_(ss) {
  const muiGio = ss.getSpreadsheetTimeZone();
  const cacThang = [];
  const thanhVien = [];
  const themTV = function (ten) {
    ten = chuoi_(ten);
    if (ten && thanhVien.indexOf(ten) === -1) thanhVien.push(ten);
  };

  ss.getSheets().forEach(function (sheet) {
    const tab = sheet.getName();
    const tn = laTabThang_(tab);
    if (!tn) return;
    const o = docTab_(sheet.getDataRange().getValues(), muiGio);
    if (!o) return;
    o.dsThanhVien.forEach(themTV);
    cacThang.push({ tab: tab, thang: tn.thang, nam: tn.nam, hoatDong: o.hoatDong });
  });

  // Người có tên trong ô "Người thực hiện" nhưng chưa có ở bảng thành viên
  cacThang.forEach(function (t) {
    t.hoatDong.forEach(function (h) {
      h.viec.forEach(function (v) { themTV(v.nguoi); });
    });
  });

  // Người được ghi nhóm này trong sheet "Tài khoản dashboard" nhưng chưa có tên trong Timeline
  themTuTaiKhoan_('4t').forEach(themTV);

  cacThang.sort(function (a, b) { return (a.nam * 12 + a.thang) - (b.nam * 12 + b.thang); });
  return {
    tieuDe: CONFIG.TIEU_DE,
    tenSheet: ss.getName(),
    canMa: !!CONFIG.MA_NHOM,
    thanhVien: thanhVien,
    cacThang: cacThang
  };
}

/** Đổi mảng giá trị của một tab tháng thành danh sách hoạt động. Trả null nếu tab không đúng mẫu. */
function docTab_(giaTri, muiGio) {
  if (!giaTri.length) return null;
  const cot = timCot_(giaTri[0]);
  if (cot.ten === undefined) return null;

  const lay = function (dong, k) { return cot[k] === undefined ? '' : dong[cot[k]]; };
  const hoatDong = [];

  for (let i = DONG_DU_LIEU_DAU - 1; i < giaTri.length; i++) {
    const dong = giaTri[i];
    const ten = chuoi_(lay(dong, 'ten'));
    if (!ten) continue;
    hoatDong.push({
      dong: i + 1,
      ten: ten,
      ngay: ngayISO_(lay(dong, 'ngay'), muiGio),
      mucDo: chuoi_(lay(dong, 'mucDo')),
      moTa: chuoi_(lay(dong, 'moTa')),
      viTri: chuoi_(lay(dong, 'viTri')),
      thuMuc: chuoi_(lay(dong, 'thuMuc')),
      ghiChu: chuoi_(lay(dong, 'ghiChu')),
      truongNhomTick: laTrue_(lay(dong, 'tienDo')),
      viec: VIEC.filter(function (v) { return cot[v.key] !== undefined; }).map(function (v) {
        return {
          key: v.key,
          xong: laTrue_(dong[cot[v.key]]),
          nguoi: chuoi_(dong[cot[v.key] + 1])
        };
      })
    });
  }

  // Bảng thành viên nằm bên phải: tìm ô "Họ và Tên" rồi đọc các tên bên dưới
  const dsThanhVien = [];
  timO: for (let r = 0; r < Math.min(giaTri.length, 15); r++) {
    for (let c = 0; c < giaTri[r].length; c++) {
      if (chuanHoa_(giaTri[r][c]) !== 'họ và tên') continue;
      let trong = 0;
      for (let k = r + 1; k < giaTri.length && trong < 3; k++) {
        const ten = chuoi_(giaTri[k][c]);
        if (ten) { dsThanhVien.push(ten); trong = 0; } else { trong++; }
      }
      break timO;
    }
  }

  return { hoatDong: hoatDong, dsThanhVien: dsThanhVien };
}

/** Tìm vị trí cột theo tiêu đề dòng 1 (nên chèn thêm cột vào sheet vẫn không hỏng). */
function timCot_(dongTieuDe) {
  const tim = function (ten) {
    const can = chuanHoa_(ten);
    for (let c = 0; c < dongTieuDe.length; c++) if (chuanHoa_(dongTieuDe[c]) === can) return c;
    return undefined;
  };
  const cot = {
    tienDo: tim('Tiến độ'), mucDo: tim('Mức độ'), thuMuc: tim('Thư mục'), ngay: tim('Thời gian'),
    ten: tim('Tên hoạt động'), moTa: tim('Mô tả'), viTri: tim('Vị trí đăng'), ghiChu: tim('Ghi chú')
  };
  VIEC.forEach(function (v) { cot[v.key] = tim(v.tieuDe); });
  return cot;
}

/* --------------------------------------------------------------- tiện ích */

function chuoi_(v) {
  return v === null || v === undefined ? '' : String(v).replace(/\s+/g, ' ').trim();
}

function chuanHoa_(v) {
  return chuoi_(v).toLowerCase();
}

function laTrue_(v) {
  return v === true || String(v).toUpperCase() === 'TRUE';
}

function ngayISO_(v, muiGio) {
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v)) {
    return Utilities.formatDate(v, muiGio, 'yyyy-MM-dd');
  }
  const m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(chuoi_(v)); // dd/MM/yyyy
  if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  return null;
}
