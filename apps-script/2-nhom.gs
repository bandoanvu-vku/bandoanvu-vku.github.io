
/* ------------------------------------------- dashboard 3 nhóm + tổng quan */

// Trạng thái nhiệm vụ của 3 nhóm (khớp danh sách chọn ở cột "Trạng thái" trong sheet nhóm)
const TRANG_THAI = ['Chưa làm', 'Đang làm', 'Chờ duyệt', 'Hoàn thành'];
// Duyệt việc 2 cấp: "Chờ duyệt" = chờ trưởng nhóm → "Chờ quản lý duyệt" → Hoàn thành (nhóm chưa có trưởng nhóm: gửi thẳng quản lý)
const VIEC_CHO_QL = 'Chờ quản lý duyệt';

// 3 nhóm có sheet theo dõi riêng. ID sheet lưu ở Script Properties, khoá SHEET_NHOM ({ ma: { id, ten } }).
// Thành viên và mảng công việc nằm trong chính sheet của nhóm (tab "Thành viên", "Mảng công việc").
const NHOM_MOI = [
  { ma: 'nghiep-vu', ten: 'Nghiệp vụ' },
  { ma: 'csdl-csvc', ten: 'Cơ sở dữ liệu - Cơ sở vật chất' },
  { ma: 'noi-vu', ten: 'Nội vụ' }
];

function sheetNhom_(ma) {
  const ds = JSON.parse(PropertiesService.getScriptProperties().getProperty('SHEET_NHOM') || '{}');
  if (!Object.prototype.hasOwnProperty.call(ds, ma)) throw new Error('Không có nhóm này.');
  return ds[ma];
}

/** Dữ liệu một nhóm (nghiep-vu, csdl-csvc, noi-vu). Nhớ tạm 90 giây; moi = true thì đọc lại sheet. */
function layNhom(ma, moi) {
  const khoaNho = 'nhom:' + ma;
  if (moi !== true) {
    const nho = nhoLay_(khoaNho);
    if (nho) { nho.thanhVien = hopNhat_(nho.thanhVien, themTuTaiKhoan_(ma)); return nho; }
  }
  const d = docNhom_(ma, SpreadsheetApp.openById(sheetNhom_(ma).id));
  nhoNhom_(d);
  return d;
}

function nhoNhom_(d) {
  nhoGhi_('nhom:' + d.ma, d);
  try { CacheService.getScriptCache().remove('tongquan'); } catch (err) {}
}

function docNhom_(ma, ss) {
  const muiGio = ss.getSpreadsheetTimeZone();
  const doc = function (ten, soCot) {
    const s = ss.getSheetByName(ten);
    if (!s || s.getLastRow() < 2) return [];
    return s.getRange(2, 1, s.getLastRow() - 1, soCot).getValues();
  };
  const thanhVien = doc('Thành viên', 2).map(function (r) { return chuoi_(r[1]); }).filter(String);
  const mang = doc('Mảng công việc', 5).filter(function (r) { return chuoi_(r[1]); }).map(function (r) {
    return { ten: chuoi_(r[1]), chinh: chuoi_(r[2]), hoTroChinh: chuoi_(r[3]), thamGia: chuoi_(r[4]) };
  });
  const nhiemVu = [];
  doc('Nhiệm vụ', 12).forEach(function (r, i) {
    if (i === 0) return; // dòng 2 của sheet là dòng gợi ý
    const ten = chuoi_(r[2]);
    if (!ten) return;
    nhiemVu.push({
      dong: i + 2, mang: chuoi_(r[1]), ten: ten, moTa: chuoi_(r[3]), mucDo: chuoi_(r[4]),
      ngayGiao: ngayISO_(r[5], muiGio), han: ngayISO_(r[6], muiGio), chinh: chuoi_(r[7]), hoTro: chuoi_(r[8]),
      trangThai: chuoi_(r[9]), link: chuoi_(r[10]), ghiChu: chuoi_(r[11])
    });
  });
  return { ma: ma, ten: sheetNhom_(ma).ten, canMa: !!CONFIG.MA_NHOM, thanhVien: hopNhat_(thanhVien, themTuTaiKhoan_(ma)), mang: mang, nhiemVu: nhiemVu };
}

/** Thành viên thao tác trên dashboard nhóm: nhan, boNhan, hoTro, trangThai, link. */
function nhomGhi(req) {
  req = req || {};
  if (CONFIG.MA_NHOM && String(req.ma || '').trim() !== CONFIG.MA_NHOM) throw new Error('Mã nhóm chưa đúng.');
  const khoa = LockService.getScriptLock();
  khoa.waitLock(20000);
  try {
    const maNhom = String(req.nhom || '');
    const ss = SpreadsheetApp.openById(sheetNhom_(maNhom).id);
    const ten = chuoi_(req.ten);
    if (docNhom_(maNhom, ss).thanhVien.indexOf(ten) === -1) throw new Error('Hãy chọn tên của bạn trước.');
    const sheet = ss.getSheetByName('Nhiệm vụ');
    const dong = Number(req.dong);
    if (!(dong >= 3)) throw new Error('Việc không hợp lệ.');
    const r = sheet.getRange(dong, 1, 1, 12).getValues()[0];
    const tenViec = chuoi_(r[2]);
    if (!tenViec || tenViec !== chuoi_(req.nhiemVu)) {
      throw new Error('Sheet vừa được chỉnh sửa. Dashboard đã tải lại, bạn thao tác lại giúp nhé.');
    }
    const chinh = chuoi_(r[7]);
    const hoTro = chuoi_(r[8]).split(',').map(chuoi_).filter(String);
    const lienQuan = chinh === ten || hoTro.indexOf(ten) > -1;
    const chiNguoiLam = function () {
      if (!lienQuan) throw new Error('Chỉ người phụ trách hoặc hỗ trợ mới cập nhật được việc này.');
    };
    let hanhDong;
    if (req.viec === 'nhan') {
      if (chinh && chinh !== ten) throw new Error('Việc này đã có ' + chinh + ' phụ trách.');
      sheet.getRange(dong, 8).setValue(ten);
      if (!chuoi_(r[9])) sheet.getRange(dong, 10).setValue('Chưa làm');
      hanhDong = 'Nhận việc';
    } else if (req.viec === 'boNhan') {
      if (chinh !== ten) throw new Error('Bạn chỉ bỏ nhận được việc mình đang phụ trách.');
      if (chuoi_(r[9]) === 'Hoàn thành') throw new Error('Việc đã hoàn thành, hãy đổi trạng thái trước.');
      sheet.getRange(dong, 8).setValue('');
      hanhDong = 'Bỏ nhận';
    } else if (req.viec === 'hoTro') {
      if (lienQuan) throw new Error('Bạn đã có tên trong việc này.');
      sheet.getRange(dong, 9).setValue(hoTro.concat([ten]).join(', '));
      hanhDong = 'Tham gia hỗ trợ';
    } else if (req.viec === 'trangThai') {
      chiNguoiLam();
      const tt = String(req.trangThai || '');
      if (TRANG_THAI.indexOf(tt) === -1) throw new Error('Trạng thái không hợp lệ.');
      let ghiTT = tt;
      if (tt === 'Chờ duyệt') { const tn = truongNhom_(maNhom); if (!tn.length || tn.indexOf(ten) > -1) ghiTT = VIEC_CHO_QL; }
      sheet.getRange(dong, 10).setValue(ghiTT);
      hanhDong = 'Trạng thái: ' + ghiTT;
    } else if (req.viec === 'link') {
      chiNguoiLam();
      const link = chuoi_(req.link).slice(0, 500);
      if (link && !/^https?:\/\//i.test(link)) throw new Error('Link phải bắt đầu bằng http:// hoặc https://');
      sheet.getRange(dong, 11).setValue(link);
      hanhDong = 'Cập nhật link';
    } else {
      throw new Error('Yêu cầu không hợp lệ.');
    }
    ghiNhatKy_(ss, [new Date(), ten, hanhDong, 'Nhiệm vụ', tenViec, '']);
    SpreadsheetApp.flush();
    const moiNhat = docNhom_(maNhom, ss);
    nhoNhom_(moiNhat);
    return moiNhat;
  } finally {
    khoa.releaseLock();
  }
}

/** Số liệu gộp cả 4 nhóm cho trang tổng quan. Nhớ tạm 60 giây. */
function layTongQuan(moi) {
  if (moi !== true) {
    const nho = nhoLay_('tongquan');
    if (nho) return nho;
  }
  let giaNhat = 0; // tuổi (giây) của nguồn dữ liệu cũ nhất được dùng
  const ngay = function (lech) {
    return Utilities.formatDate(new Date(Date.now() + lech * 864e5), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');
  };
  const homNay = ngay(0), sau7 = ngay(7);
  const nguoi = {}, sapToi = [], thang = [], nhom = [];
  const taoNhom = function (ma, ten) {
    const o = { ma: ma, ten: ten, thanhVien: 0, xong: 0, dangLam: 0, chuaLam: 0, chuaNhan: 0, quaHan: 0, sapHan: 0 };
    nhom.push(o);
    return o;
  };
  const tinhNguoi = function (ten, ma, xong, tre) {
    if (!ten) return;
    const o = nguoi[ten] || (nguoi[ten] = { ten: ten, nhom: [], giao: 0, xong: 0, quaHan: 0 });
    if (o.nhom.indexOf(ma) === -1) o.nhom.push(ma);
    o.giao++;
    if (xong) o.xong++; else if (tre) o.quaHan++;
    const g = o.theoNhom || (o.theoNhom = {});
    const x = g[ma] || (g[ma] = { giao: 0, xong: 0, quaHan: 0 });
    x.giao++;
    if (xong) x.xong++; else if (tre) x.quaHan++;
  };

  // Nhóm Truyền thông - Thông tin: đơn vị tính là từng việc con (viết bài, thiết kế, chụp hình)
  const n4 = taoNhom('4t', 'Truyền thông - Thông tin');
  try {
    const d4 = layDuLieu(moi);
    giaNhat = Math.max(giaNhat, d4.tuoi || 0);
    n4.thanhVien = d4.thanhVien.length;
    d4.cacThang.forEach(function (t) {
      let viec = 0, xongThang = 0;
      t.hoatDong.forEach(function (h) {
        const can = h.viec.filter(function (v) { return v.nguoi || v.xong; });
        const tre = !!h.ngay && h.ngay < homNay, sap = !!h.ngay && h.ngay >= homNay && h.ngay <= sau7;
        let conLai = [];
        if (!can.length) {
          viec++;
          if (h.truongNhomTick) { n4.xong++; xongThang++; return; }
          n4.chuaNhan++;
          if (tre) n4.quaHan++;
          if (sap) n4.sapHan++;
          conLai = ['Chưa có người nhận'];
        }
        can.forEach(function (v) {
          viec++;
          tinhNguoi(v.nguoi, '4t', v.xong, tre);
          if (v.xong) { n4.xong++; xongThang++; return; }
          n4.chuaLam++;
          if (tre) n4.quaHan++;
          if (sap) n4.sapHan++;
          if (v.nguoi && conLai.indexOf(v.nguoi) === -1) conLai.push(v.nguoi);
        });
        if (conLai.length && (tre || sap)) sapToi.push({ nhom: '4t', ten: h.ten, han: h.ngay, nguoi: conLai.join(', ') });
      });
      if (viec) thang.push({ thang: t.thang, nam: t.nam, viec: viec, xong: xongThang });
    });
  } catch (err) {
    n4.loi = String((err && err.message) || err);
  }

  // Ba nhóm còn lại: đơn vị tính là từng nhiệm vụ
  NHOM_MOI.forEach(function (n) {
    const o = taoNhom(n.ma, n.ten);
    try {
      const d = layNhom(n.ma, moi);
      giaNhat = Math.max(giaNhat, d.tuoi || 0);
      o.thanhVien = d.thanhVien.length;
      d.nhiemVu.forEach(function (v) {
        const xong = v.trangThai === 'Hoàn thành';
        const tre = !xong && !!v.han && v.han < homNay, sap = !xong && !!v.han && v.han >= homNay && v.han <= sau7;
        if (xong) o.xong++;
        else if (!v.chinh) o.chuaNhan++;
        else if (v.trangThai === 'Đang làm' || v.trangThai === 'Chờ duyệt' || v.trangThai === VIEC_CHO_QL) o.dangLam++;
        else o.chuaLam++;
        if (tre) o.quaHan++;
        if (sap) o.sapHan++;
        tinhNguoi(v.chinh, n.ma, xong, tre);
        if (tre || sap) sapToi.push({ nhom: n.ma, ten: v.ten, han: v.han, nguoi: v.chinh || 'Chưa có người nhận' });
      });
    } catch (err) {
      o.loi = String((err && err.message) || err);
    }
  });

  sapToi.sort(function (a, b) { return a.han < b.han ? -1 : a.han > b.han ? 1 : 0; });
  const kq = {
    homNay: homNay,
    nhom: nhom,
    nguoi: Object.keys(nguoi).map(function (k) { return nguoi[k]; }).sort(function (a, b) { return b.giao - a.giao; }),
    sapToi: sapToi,
    soSapToi: sapToi.length,
    thang: thang
  };
  try {
    CacheService.getScriptCache().put('tongquan', JSON.stringify({ luc: Date.now() - giaNhat * 1000, d: kq }), 21600);
  } catch (err) {}
  kq.tuoi = giaNhat;
  return kq;
}
