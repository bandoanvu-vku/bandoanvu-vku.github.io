/* ------------------------------------------------ giao việc + duyệt việc (quản lý) */
/*
 * Chỉ cho 3 nhóm có sheet "Theo dõi nhiệm vụ" (Nghiệp vụ, CSDL - CSVC, Nội vụ): ghi vào tab Nhiệm vụ của sheet nhóm.
 * Nhóm Truyền thông dùng sheet Timeline của Văn phòng Đoàn — không được ghi gì ngoài ô nhận việc / tick, nên không giao việc từ đây.
 * Duyệt việc: nhiệm vụ thành viên đặt trạng thái "Chờ duyệt" → quản lý Duyệt (Hoàn thành) hoặc Trả lại (Đang làm + ghi chú).
 * Cột tab Nhiệm vụ: TT | Mảng | Nhiệm vụ | Mô tả | Mức độ | Ngày giao | Hạn | Phụ trách chính | Hỗ trợ | Trạng thái | Link | Ghi chú
 */
const MUC_DO = ['Cao', 'Trung bình', 'Thấp'];

function canQuanLyViec_(nd) { if (nd.vaiTro !== 'quanLy') throw loiQuyen_('Chỉ quản lý mới giao / duyệt việc.'); }
function nhomMoiHopLe_(ma) { if (!NHOM_MOI.some(function (n) { return n.ma === ma; })) throw new Error('Nhóm này không giao việc trên dashboard được.'); }
function isoNgay_(v) { return /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? ngayDate_(String(v)) : ''; }

/** Dữ liệu cho trang Giao việc: thành viên + mảng của 3 nhóm, và các việc gần đây. */
function giaoViecDs_(nd) {
  canQuanLyViec_(nd);
  return {
    homNay: bayGio_().ngay, mucDo: MUC_DO,
    nhom: NHOM_MOI.map(function (n) {
      try {
        const d = layNhom(n.ma, false);
        return { ma: n.ma, ten: n.ten, thanhVien: d.thanhVien, mang: d.mang.map(function (m) { return m.ten; }),
          nhiemVu: d.nhiemVu.map(function (v) { return { dong: v.dong, ten: v.ten, mang: v.mang, moTa: v.moTa, mucDo: v.mucDo, ngayGiao: v.ngayGiao, han: v.han, chinh: v.chinh, hoTro: v.hoTro, trangThai: v.trangThai, ghiChu: v.ghiChu, link: v.link }; }) };
      } catch (e) { return { ma: n.ma, ten: n.ten, loi: String(e.message || e), thanhVien: [], mang: [], nhiemVu: [] }; }
    })
  };
}

function giaoViec_(nd, req) {
  canQuanLyViec_(nd);
  const ma = String(req.nhom || '');
  nhomMoiHopLe_(ma);
  return voiKhoa_(function () {
    const ss = SpreadsheetApp.openById(sheetNhom_(ma).id), d = docNhom_(ma, ss), s = ss.getSheetByName('Nhiệm vụ');
    const ten = chuoi_(req.ten).slice(0, 200);
    if (!ten) throw new Error('Nhập tên nhiệm vụ.');
    const chinh = chuoi_(req.chinh), hoTro = (req.hoTro || []).map(chuoi_).filter(function (t, i, a) { return t && t !== chinh && a.indexOf(t) === i; });
    [chinh].concat(hoTro).forEach(function (t) { if (t && d.thanhVien.indexOf(t) === -1) throw new Error(t + ' không có trong danh sách thành viên nhóm.'); });
    const mucDo = MUC_DO.indexOf(req.mucDo) > -1 ? req.mucDo : '';
    if (req.han && !isoNgay_(req.han)) throw new Error('Hạn không hợp lệ.');
    const vals = { mang: chuoi_(req.mang).slice(0, 150), moTa: String(req.moTa || '').slice(0, 2000), ghiChu: chuoi_(req.ghiChu).slice(0, 500) };
    let hanhDong;
    if (req.dong) {
      const dong = Number(req.dong);
      const cu = d.nhiemVu.filter(function (v) { return v.dong === dong; })[0];
      if (!cu || cu.ten !== chuoi_(req.tenCu)) throw new Error('Sheet vừa được chỉnh sửa. Tải lại trang rồi sửa lại giúp nhé.');
      s.getRange(dong, 2, 1, 8).setValues([[vals.mang, ten, vals.moTa, mucDo, cu.ngayGiao ? ngayDate_(cu.ngayGiao) : new Date(), isoNgay_(req.han), chinh, hoTro.join(', ')]]);
      if (chinh && !cu.trangThai) s.getRange(dong, 10).setValue('Chưa làm');
      s.getRange(dong, 12).setValue(vals.ghiChu);
      hanhDong = 'Quản lý sửa việc';
    } else {
      const tt = d.nhiemVu.reduce(function (m, v) { return Math.max(m, v.dong - 2); }, 0) + 1;
      // ghi vào dòng trống đầu tiên sau dữ liệu (sheet có thể có sẵn dòng định dạng trống)
      const cot3 = s.getRange(3, 3, Math.max(s.getLastRow() - 2, 1), 1).getValues();
      let dong = 3; for (let i = 0; i < cot3.length; i++) if (chuoi_(cot3[i][0])) dong = i + 4;
      s.getRange(dong, 1, 1, 12).setValues([[tt, vals.mang, ten, vals.moTa, mucDo, new Date(), isoNgay_(req.han), chinh, hoTro.join(', '), chinh ? 'Chưa làm' : '', '', vals.ghiChu]]);
      hanhDong = 'Quản lý giao việc';
    }
    ghiNhatKy_(ss, [new Date(), nd.ten, hanhDong, 'Nhiệm vụ', ten, chinh]);
    SpreadsheetApp.flush();
    nhoNhom_(docNhom_(ma, ss));
    return giaoViecDs_(nd);
  });
}

/** Các việc đang chờ duyệt của 3 nhóm. cap = 'tn' (chờ trưởng nhóm) | 'ql' (chờ quản lý; gồm cả "Chờ duyệt" của nhóm chưa có trưởng nhóm). */
function viecChoDuyet_() {
  const ds = [];
  NHOM_MOI.forEach(function (n) {
    try {
      const tn = truongNhom_(n.ma);
      layNhom(n.ma, false).nhiemVu.forEach(function (v) {
        if (v.trangThai !== 'Chờ duyệt' && v.trangThai !== VIEC_CHO_QL) return;
        const cap = v.trangThai === VIEC_CHO_QL || !tn.length ? 'ql' : 'tn';
        ds.push({ nhom: n.ma, tenNhom: n.ten, cap: cap, truongNhom: tn, trangThai: v.trangThai, dong: v.dong, ten: v.ten, mang: v.mang, moTa: v.moTa, han: v.han, chinh: v.chinh, hoTro: v.hoTro, link: v.link, ghiChu: v.ghiChu });
      });
    } catch (e) {}
  });
  return ds.sort(function (a, b) { return (a.han || '9999') < (b.han || '9999') ? -1 : 1; });
}
function duyetViecDs_(nd) {
  canQuanLyViec_(nd);
  const tat = viecChoDuyet_();
  return { homNay: bayGio_().ngay, ds: tat.filter(function (v) { return v.cap === 'ql'; }), choTN: tat.filter(function (v) { return v.cap === 'tn'; }) };
}
/** Số việc chờ quản lý duyệt (menu). */
function soViecChoQL_() { return viecChoDuyet_().filter(function (v) { return v.cap === 'ql'; }).length; }

/** Trưởng nhóm duyệt cấp 1 (→ Chờ quản lý duyệt) · quản lý duyệt cấp 2 (→ Hoàn thành). Trả lại → Đang làm + ghi chú. */
function duyetViec_(nd, req) {
  const ma = String(req.nhom || '');
  nhomMoiHopLe_(ma);
  const laQL = nd.vaiTro === 'quanLy', tn = truongNhom_(ma), laTN = tn.indexOf(nd.ten) > -1;
  if (!laQL && !laTN) throw loiQuyen_('Chỉ trưởng nhóm hoặc quản lý mới duyệt việc.');
  return voiKhoa_(function () {
    const ss = SpreadsheetApp.openById(sheetNhom_(ma).id), s = ss.getSheetByName('Nhiệm vụ'), dong = Number(req.dong);
    if (!(dong >= 3)) throw new Error('Việc không hợp lệ.');
    const r = s.getRange(dong, 1, 1, 12).getValues()[0], tt = chuoi_(r[9]);
    if (chuoi_(r[2]) !== chuoi_(req.ten)) throw new Error('Sheet vừa được chỉnh sửa. Tải lại trang rồi duyệt lại giúp nhé.');
    if (tt !== 'Chờ duyệt' && tt !== VIEC_CHO_QL) throw new Error('Việc này không còn ở trạng thái chờ duyệt.');
    if (tt === VIEC_CHO_QL && !laQL) throw loiQuyen_('Việc này đã qua trưởng nhóm, đang chờ quản lý duyệt.');
    const gc = chuoi_(req.ghiChu).slice(0, 300), dongY = req.dongY === true;
    if (!dongY && !gc) throw new Error('Ghi lý do / việc cần sửa khi trả lại.');
    const capTN = tt === 'Chờ duyệt' && !laQL;
    const moi = dongY ? (capTN ? VIEC_CHO_QL : 'Hoàn thành') : 'Đang làm';
    const nhan = dongY ? (capTN ? 'Trưởng nhóm duyệt' : 'Quản lý duyệt') : (capTN ? 'Trưởng nhóm trả lại' : 'Quản lý trả lại, nhóm xử lý');
    s.getRange(dong, 10).setValue(moi);
    if (gc || capTN) s.getRange(dong, 12).setValue((chuoi_(r[11]) ? chuoi_(r[11]) + ' | ' : '') + nhan + ' (' + nd.ten + ')' + (gc ? ': ' + gc : ''));
    ghiNhatKy_(ss, [new Date(), nd.ten, nhan, 'Nhiệm vụ', chuoi_(r[2]), gc]);
    SpreadsheetApp.flush();
    const d = docNhom_(ma, ss);
    nhoNhom_(d);
    if (laQL && req.ve !== 'nhom') return duyetViecDs_(nd);
    d.truongNhom = tn;
    return d;
  });
}
