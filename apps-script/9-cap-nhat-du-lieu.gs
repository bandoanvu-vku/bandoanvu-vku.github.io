/* ------------------------------------------------ cập nhật dữ liệu một lần (chạy tự động ở lần gọi web app đầu tiên sau khi triển khai) */
/*
 * Mỗi mục chạy đúng 1 lần, đánh dấu bằng Script Property "DA_CAP_NHAT_<mã>".
 * 20261014_tan: theo Bảng phân công nhiệm vụ BĐV (14/10/2026), Lê Hoàng Tân không còn ở nhóm CSDL - CSVC:
 *   - xoá khỏi tab Thành viên + bỏ tên khỏi tab Mảng công việc của sheet nhóm CSDL - CSVC
 *   - cột Nhóm trong sheet tài khoản chỉ còn Nghiệp vụ
 * 20261014_qldv: mảng "Cập nhật Hệ thống quản lý Đoàn viên" chuyển sang nhóm Nghiệp vụ (Tân phụ trách, đã có dòng
 *   "Phần mềm Quản lý Đoàn viên" ở sheet Nghiệp vụ) → xoá dòng mảng này ở tab Mảng công việc của CSDL - CSVC.
 */
const CAP_NHAT = [
  { ma: '20261014_tan', chay: function () { boNguoiKhoiNhom_('csdl-csvc', 'Lê Hoàng Tân'); } },
  { ma: '20261014_qldv', chay: function () { boMangKhoiNhom_('csdl-csvc', /hệ thống quản lý đoàn viên/i); } }
];

function chayCapNhat_() {
  const p = PropertiesService.getScriptProperties();
  CAP_NHAT.forEach(function (c) {
    const k = 'DA_CAP_NHAT_' + c.ma;
    if (p.getProperty(k)) return;
    const khoa = LockService.getScriptLock();
    if (!khoa.tryLock(15000)) return;
    try {
      if (p.getProperty(k)) return;
      c.chay();
      p.setProperty(k, new Date().toISOString());
    } catch (err) {
      console.error('Cập nhật ' + c.ma + ' lỗi: ' + err);
    } finally { khoa.releaseLock(); }
  });
}

function boNguoiKhoiNhom_(ma, ten) {
  const ss = SpreadsheetApp.openById(sheetNhom_(ma).id);
  // Tab Thành viên: xoá dòng có tên, đánh lại số TT
  const tv = ss.getSheetByName('Thành viên');
  if (tv && tv.getLastRow() >= 2) {
    const v = tv.getRange(2, 1, tv.getLastRow() - 1, 2).getValues();
    for (let i = v.length - 1; i >= 0; i--) if (chuoi_(v[i][1]) === ten) tv.deleteRow(i + 2);
    const n = tv.getLastRow() - 1;
    if (n > 0) tv.getRange(2, 1, n, 1).setValues(tv.getRange(2, 2, n, 1).getValues().map(function (r, i) { return [chuoi_(r[0]) ? i + 1 : '']; }));
  }
  // Tab Mảng công việc: bỏ tên khỏi Phụ trách chính / Hỗ trợ chính / Tham gia
  const mg = ss.getSheetByName('Mảng công việc');
  if (mg && mg.getLastRow() >= 2) {
    const r = mg.getRange(2, 3, mg.getLastRow() - 1, 3), v = r.getValues();
    r.setValues(v.map(function (row) {
      return row.map(function (o) {
        const ds = String(o || '').split(',').map(chuoi_).filter(String);
        return ds.indexOf(ten) > -1 ? ds.filter(function (x) { return x !== ten; }).join(', ') : o;
      });
    }));
  }
  // Sheet tài khoản: bỏ nhóm khỏi cột Nhóm
  const s = ssTaiKhoan_().getSheets()[0];
  if (s.getLastRow() >= 2) {
    const v = s.getRange(2, 1, s.getLastRow() - 1, 2).getValues();
    v.forEach(function (row, i) {
      if (chuoi_(row[0]) !== ten) return;
      const con = String(row[1] || '').split(/[,;]/).map(chuoi_).filter(function (x) { return x && maNhomTuChu_(x).indexOf(ma) === -1; });
      s.getRange(i + 2, 2).setValue(con.join(', '));
    });
  }
  ghiNhatKy_(ss, [new Date(), 'Dashboard', 'Bỏ thành viên khỏi nhóm', 'Thành viên', ten, 'Theo Bảng phân công nhiệm vụ BĐV']);
  SpreadsheetApp.flush();
  const c = CacheService.getScriptCache();
  ['taikhoan3', 'nhom:' + ma, 'tongquan'].forEach(function (k) { try { c.remove(k); } catch (e) {} });
}

/** Xoá (các) dòng mảng có tên khớp mẫu ở tab Mảng công việc của nhóm, đánh lại số TT. */
function boMangKhoiNhom_(ma, mau) {
  const ss = SpreadsheetApp.openById(sheetNhom_(ma).id), mg = ss.getSheetByName('Mảng công việc');
  if (!mg || mg.getLastRow() < 2) return;
  const v = mg.getRange(2, 1, mg.getLastRow() - 1, 2).getValues(), bo = [];
  for (let i = v.length - 1; i >= 0; i--) if (mau.test(chuoi_(v[i][1]))) { bo.push(chuoi_(v[i][1])); mg.deleteRow(i + 2); }
  const n = mg.getLastRow() - 1;
  if (n > 0) mg.getRange(2, 1, n, 1).setValues(mg.getRange(2, 2, n, 1).getValues().map(function (r, i) { return [chuoi_(r[0]) ? i + 1 : '']; }));
  bo.forEach(function (t) { ghiNhatKy_(ss, [new Date(), 'Dashboard', 'Chuyển mảng sang nhóm khác', 'Mảng công việc', t, 'Chuyển sang nhóm Nghiệp vụ']); });
  SpreadsheetApp.flush();
  const c = CacheService.getScriptCache();
  ['nhom:' + ma, 'tongquan'].forEach(function (k) { try { c.remove(k); } catch (e) {} });
}
