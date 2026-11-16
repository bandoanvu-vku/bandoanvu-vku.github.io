/* ------------------------------------------------ cập nhật dữ liệu một lần (chạy tự động ở lần gọi web app đầu tiên sau khi triển khai) */
/*
 * Mỗi mục chạy đúng 1 lần, đánh dấu bằng Script Property "DA_CAP_NHAT_<mã>".
 * 20261014_tan: theo Bảng phân công nhiệm vụ BĐV (14/10/2026), Lê Hoàng Tân không còn ở nhóm CSDL - CSVC:
 *   - xoá khỏi tab Thành viên + bỏ tên khỏi tab Mảng công việc của sheet nhóm CSDL - CSVC
 *   - cột Nhóm trong sheet tài khoản chỉ còn Nghiệp vụ
 * 20261014_qldv: mảng "Cập nhật Hệ thống quản lý Đoàn viên" chuyển sang nhóm Nghiệp vụ (Tân phụ trách, đã có dòng
 *   "Phần mềm Quản lý Đoàn viên" ở sheet Nghiệp vụ) → xoá dòng mảng này ở tab Mảng công việc của CSDL - CSVC.
 * 20261116_noiquydoc: mục Nội quy VPĐ lấy nội dung từ Google Doc gốc (cột Nguồn Google Doc).
 * 20261116_noiquy: thêm mục "Nội quy Văn phòng Đoàn" (bản 21/4/2026) vào Cẩm nang, đứng thứ 2 sau Giới thiệu (có rồi thì bỏ qua).
 * 20261113_vitri: đặt vị trí điểm danh văn phòng = 15.975518, 108.252674 (điểm Trâm gửi trên Google Maps), bán kính 80 m.
 */
const CAP_NHAT = [
  { ma: '20261014_tan', chay: function () { boNguoiKhoiNhom_('csdl-csvc', 'Lê Hoàng Tân'); } },
  { ma: '20261014_qldv', chay: function () { boMangKhoiNhom_('csdl-csvc', /hệ thống quản lý đoàn viên/i); } },
  { ma: '20261113_vitri', chay: function () { ghiViTriVanPhong_(15.975518, 108.252674, 80); } },
  { ma: '20261116_noiquy', chay: function () { themMucCamNang_('Nội quy Văn phòng Đoàn', NOI_QUY_VPD, 2); } },
  { ma: '20261116_noiquydoc', chay: function () { ganNguonCamNang_('Nội quy Văn phòng Đoàn', 'https://docs.google.com/document/d/16Ey2g8RwXdSiQhpesCbzxsHionZ6WcFdbTyeWubTBgE/edit'); } }
];

/** Gắn link Google Doc vào cột "Nguồn Google Doc" của mục cẩm nang có tiêu đề này (nội dung tự đồng bộ ở lần mở Cẩm nang sau). */
function ganNguonCamNang_(tieuDe, link) {
  const s = ssTaiKhoan_().getSheetByName('Cẩm nang');
  if (!s) return;
  damBaoCotCn_(s);
  const x = docCamNang_().filter(function (y) { return chuanHoa_(y.tieuDe) === chuanHoa_(tieuDe); })[0];
  if (x && !x.nguon) s.getRange(x.dong, COT_CN.length).setValue(link);
}

const NOI_QUY_VPD = '**Văn phòng Đoàn trường** (bản cập nhật 21/4/2026). Bản gốc: https://docs.google.com/document/d/16Ey2g8RwXdSiQhpesCbzxsHionZ6WcFdbTyeWubTBgE/edit\n**NHIỆM VỤ CHUNG CỦA VĂN PHÒNG ĐOÀN**\nVăn phòng Đoàn trường là một phòng ban bộ phận trong hệ thống các phòng chức năng của Nhà trường, là nơi:\n- Quản lý tài sản, hồ sơ Đoàn trường.\n- Triển khai các hoạt động, công tác Đoàn và phong trào thanh niên Đoàn trường.\n- Ban Thường vụ, Ban Chấp hành, Ban Đoàn vụ Đoàn trường làm việc.\n- Tiếp khách đến thăm và liên hệ công việc với Đoàn trường.\n**CHƯƠNG I: QUY ĐỊNH ĐỐI VỚI THÀNH VIÊN BAN ĐOÀN VỤ**\n- **Điều 1:** Chấp hành nghiêm túc thời gian làm việc (điểm danh và cập nhật nhật ký trực); trong trường hợp cần thiết phải ra ngoài trong lúc trực thì phải báo cáo và được sự đồng ý.\n- **Điều 2:** Trang phục làm việc: áo xanh thanh niên (áo VKU), quần dài (chân váy quá gối), giày (dép có quai sau) — KHÔNG MANG DÉP CROSS, bảng tên BĐV; tác phong làm việc nghiêm túc, chấp hành sự phân công nhiệm vụ của BTV Đoàn trường và phụ trách Ban Đoàn vụ.\n- **Điều 3:** Giao tiếp đúng mực, hòa nhã với mọi người; vui vẻ, tận tình với các đoàn viên thanh niên cần sự trợ giúp và khách khi đến liên hệ công việc; nhiệt tình hướng dẫn, tuyên truyền, nhắc nhở Đoàn viên thanh niên thực hiện đúng những điều quy định của Văn phòng Đoàn.\n- **Điều 4:** Không hút thuốc lá, hoặc sử dụng các chất kích thích, chất cấm, rượu, bia tại Văn phòng Đoàn.\n- **Điều 5:** Không được phép tiết lộ và cung cấp các thông tin nội bộ cho các tổ chức, cá nhân khi chưa được sự cho phép của Bí thư Đoàn; không mang tài liệu, tài sản của Đoàn trường ra ngoài khi chưa được sự chấp thuận.\n- **Điều 6:** Thực hành tiết kiệm điện, nước, điện thoại, văn phòng phẩm; có trách nhiệm bảo vệ tài sản của Đoàn, nếu cố ý làm hư hỏng, thất thoát thì phải bồi thường.\n- **Điều 7:** Có ý thức giữ gìn vệ sinh tại Văn phòng Đoàn, xây dựng nơi làm việc xanh, sạch, đẹp, an toàn; Văn phòng Đoàn phải sạch sẽ, gọn gàng, thuận tiện cho việc thực hiện nhiệm vụ chung của các thành viên, chủ động dọn dẹp vệ sinh Văn phòng Đoàn trường sạch, gọn, ngăn nắp.\n- **Điều 8:** Thực hiện nghiêm các quy định về phòng chống cháy nổ, tắt các thiết bị sử dụng điện, khóa cửa phòng khi hết giờ làm việc.\n- **Điều 9:** Nhóm CSDL - CSVC có trách nhiệm quản lý bảo vệ an toàn tài sản của Đoàn, trong công tác cho mượn và trả đúng quy định.\n- **Điều 10:** Phải nhiệt tình hướng dẫn, tuyên truyền, nhắc nhở Đoàn viên thanh niên thực hiện đúng những điều quy định trên.\n- **Điều 11:** Các thông tin thuộc về Ban Đoàn vụ là các thông tin nội bộ, tuyệt đối không chia sẻ các thông tin ra bên ngoài khi không được phép.\n- **Điều 12:** Thực hiện nhiệm vụ truyền thông, hỗ trợ truyền thông xây dựng thương hiệu đoàn viên, thành viên Ban Đoàn vụ trên không gian mạng.\n**CHƯƠNG II: QUY ĐỊNH ĐỐI VỚI ĐOÀN VIÊN THANH NIÊN VÀ KHÁCH ĐẾN THĂM HỎI, LIÊN HỆ CÔNG VIỆC**\n- **Điều 13:** Quý khách, cán bộ Đoàn và Đoàn viên thanh niên đến thăm, làm việc tại Văn phòng Đoàn trường không uống rượu, bia, hút thuốc lá; ăn mặc, lời nói lịch sự; ứng xử văn minh; đi lại nhẹ nhàng; tôn trọng lẫn nhau; không gây mất trật tự, mang đồ phản cảm khi vào Văn phòng.\n- **Điều 14:** Không tự ý di chuyển CSVC, trang thiết bị và tài liệu trong Văn phòng Đoàn trường. Không được tự ý lấy đồ vật của Văn phòng Đoàn ra khỏi phòng. Không mang các loại vũ khí, vật liệu dễ gây cháy nổ, hóa chất độc hại vào Văn phòng Đoàn.\n- **Điều 15:** Phải có ý thức bảo vệ, giữ gìn mọi tài sản trong Văn phòng Đoàn trường. Ai làm phương hại hoặc làm mất tài sản Văn phòng Đoàn trường, phải chịu trách nhiệm bồi thường.\n- **Điều 16:** Không vứt giấy, rác. Phải có ý thức giữ gìn vệ sinh chung.\n- **Điều 17:** Ra, vào cần chú ý đóng, khóa cửa, tắt các thiết bị điện đảm bảo an toàn, tiết kiệm.\n- **Điều 18:** Tất cả Đoàn viên thanh niên chịu trách nhiệm thực hiện Nội quy này. Ai thực hiện tốt sẽ được xem xét tuyên dương, khen thưởng. Ai vi phạm sẽ bị kỷ luật theo đúng Điều lệ Đoàn.\n**CHƯƠNG III: QUY ĐỊNH VỀ THỜI GIAN TRỰC VĂN PHÒNG ĐOÀN**\n- **Điều 19 – Thời gian trực trong tuần:** từ thứ 2 đến thứ 6 hằng tuần.\n- **Điều 20 – Ngày nghỉ:** nghỉ vào thứ 7, chủ nhật và các ngày Lễ, Tết theo quy định của Bộ luật Lao động.\n- **Điều 21 – Giờ trực trong ngày:** buổi sáng từ 08 giờ 00 phút đến 11 giờ 00 phút; buổi chiều từ 14 giờ 00 phút đến 17 giờ 00 phút.\n**CHƯƠNG IV: TỔ CHỨC THỰC HIỆN VÀ XỬ LÝ VI PHẠM**\n- **Điều 22:** Ban Chấp hành, Ban Đoàn vụ và những thành viên có liên quan thực hiện nghiêm túc Nội quy này.\n- **Điều 23:** Các vi phạm tùy theo tính chất, mức độ sẽ bị xử lý theo quy định của Nội quy.';

/** Chèn một mục vào Cẩm nang ở vị trí viTri (1 = đầu), dồn các mục sau xuống; đã có mục cùng tiêu đề thì bỏ qua. */
function themMucCamNang_(tieuDe, noiDung, viTri) {
  const s = tabNoiDung_('Cẩm nang', COT_CN, [90, 70, 260, 620, 150, 130], camNangMau_());
  const ds = docCamNang_();
  if (ds.some(function (x) { return chuanHoa_(x.tieuDe) === chuanHoa_(tieuDe); })) return;
  const k = Math.max(0, Math.min(ds.length, viTri - 1));
  ds.forEach(function (x, i) { s.getRange(x.dong, 2).setValue(i < k ? i + 1 : i + 2); });
  s.appendRow([maMoi_('CN'), k + 1, tieuDe, noiDung, 'Dashboard', new Date()]);
  SpreadsheetApp.flush();
}

/** Ghi vĩ độ / kinh độ / bán kính vào tab Cài đặt của sheet lịch trực (thiếu dòng thì thêm). */
function ghiViTriVanPhong_(lat, lng, banKinh) {
  const s = sheetTruc_().getSheetByName('Cài đặt');
  const ghi = function (nhan, ten, giaTri) {
    const v = s.getRange(1, 1, Math.max(1, s.getLastRow()), 1).getValues().map(function (r) { return chuanHoa_(r[0]); });
    const i = v.findIndex(function (x) { return x.indexOf(chuanHoa_(nhan)) === 0; });
    if (i > -1) s.getRange(i + 1, 2).setValue(giaTri);
    else s.appendRow([ten, giaTri, '']);
  };
  ghi('Vĩ độ', 'Vĩ độ văn phòng', lat);
  ghi('Kinh độ', 'Kinh độ văn phòng', lng);
  ghi('Bán kính', 'Bán kính điểm danh (m)', banKinh);
  SpreadsheetApp.flush();
  xoaCaiDatNho_();
}

function chayCapNhat_() {
  const p = PropertiesService.getScriptProperties();
  CAP_NHAT.forEach(function (c) {
    const k = 'DA_CAP_NHAT_' + c.ma;
    if (prop_(k)) return;
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
  const ss = moId_(sheetNhom_(ma).id);
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
  const ss = moId_(sheetNhom_(ma).id), mg = ss.getSheetByName('Mảng công việc');
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
