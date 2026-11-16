/* ------------------------------------------------ Nội vụ → Nhân sự: theo dõi đã cập nhật hoàn cảnh gia đình hay chưa */
/*
 * Nguồn: sheet "Hoàn cảnh gia đình - Học lực" (Nội vụ quản lý trực tiếp trên sheet). ID lưu ở Script Property SHEET_HOAN_CANH
 * (quản lý dán link một lần qua action luuNguonHoanCanh — KHÔNG ghi ID/link vào repo, KHÔNG trả link về trình duyệt).
 * Máy chủ chỉ đọc cột "Họ và tên" + "Hoàn cảnh gia đình" để biết ô có nội dung hay không; nội dung hoàn cảnh không bao giờ gửi về trình duyệt.
 * Đối chiếu với danh sách thành viên hiện tại = sheet Tài khoản dashboard (bỏ quản lý không thuộc nhóm nào), ghép theo họ tên.
 * action hoanCanh (Nội vụ + quản lý), luuNguonHoanCanh {url} (quản lý). Cache 'hoancanh1' 5 phút.
 */
function tenKhop_(s) { return chuoi_(s).normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim(); }

function docHoanCanh_() {
  const c = CacheService.getScriptCache(), co = c.get('hoancanh1');
  if (co) return JSON.parse(co);
  const id = prop_('SHEET_HOAN_CANH');
  if (!id) return null;
  let ss;
  try { ss = moId_(id); } catch (e) { throw new Error('Máy chủ chưa đọc được sheet hoàn cảnh (tài khoản chạy dashboard cần quyền xem sheet).'); }
  const s = ss.getSheets().filter(function (x) { return /hoàn cảnh/i.test(x.getName()); })[0] || ss.getSheets()[0];
  const v = s.getDataRange().getValues();
  let h = -1, cTen = -1, cHc = -1;
  for (let i = 0; i < Math.min(v.length, 10) && h < 0; i++) {
    v[i].forEach(function (x, j) { const t = chuanHoa_(x); if (/họ và tên|họ tên/.test(t)) cTen = j; if (/hoàn cảnh/.test(t)) cHc = j; });
    if (cTen > -1 && cHc > -1) h = i; else { cTen = -1; cHc = -1; }
  }
  if (h < 0) throw new Error('Không tìm thấy cột "Họ và tên" và "Hoàn cảnh gia đình" trong sheet hoàn cảnh.');
  const co1 = {};
  v.slice(h + 1).forEach(function (r) {
    const ten = tenKhop_(r[cTen]);
    if (!ten) return;
    co1[ten] = co1[ten] || chuoi_(r[cHc]).replace(/[\s\-–.]/g, '').length > 0;
  });
  const kq = { tab: s.getName(), co: co1 };
  try { c.put('hoancanh1', JSON.stringify(kq), 300); } catch (e) {}
  return kq;
}

function hoanCanh_(nd) {
  canNoiVu_(nd);
  const ql = nd.vaiTro === 'quanLy', hc = docHoanCanh_();
  if (!hc) return { ketNoi: false, quanLy: ql };
  const bang = bangTaiKhoan_(), da = {}, nguoi = [];
  Object.keys(bang).forEach(function (em) {
    const tk = bang[em];
    if (tk.quanLy && !(tk.nhom || []).length) return;
    const k = tenKhop_(tk.ten);
    if (!k || da[k]) return;
    da[k] = 1;
    nguoi.push({ ten: tk.ten, nhom: tk.nhom || [], coTen: Object.prototype.hasOwnProperty.call(hc.co, k), co: !!hc.co[k] });
  });
  nguoi.sort(function (a, b) { return a.ten.localeCompare(b.ten, 'vi'); });
  return {
    ketNoi: true, quanLy: ql, tab: hc.tab,
    nguoi: nguoi,
    ngoai: Object.keys(hc.co).filter(function (k) { return !da[k]; }).length // tên trong sheet nhưng không còn trong Ban (chỉ trả số lượng)
  };
}

function luuNguonHoanCanh_(nd, req) {
  canQuanLy_(nd, 'đổi được sheet hoàn cảnh');
  const id = idTuLink_(req.url);
  if (!id) throw new Error('Dán link Google Sheet hợp lệ.');
  try { SpreadsheetApp.openById(id); } catch (e) { throw new Error('Tài khoản chạy dashboard chưa có quyền xem sheet này. Chia sẻ quyền xem cho tài khoản đó rồi thử lại.'); }
  PropertiesService.getScriptProperties().setProperty('SHEET_HOAN_CANH', id);
  PROP_NHO_ = null;
  try { CacheService.getScriptCache().remove('hoancanh1'); } catch (e) {}
  return hoanCanh_(nd);
}
