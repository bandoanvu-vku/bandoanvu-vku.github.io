/* Các khối hoạt động riêng của nhóm, dùng trong trang nhóm (nhom.js) và trang 4T:
     BDVHD.cnXanh(el)        — Chủ nhật xanh (nhóm CSDL - CSVC): đăng ký / xếp người / xin vắng có người trực thay
     BDVHD.kiemKe(el)        — Kiểm kê CSVC hằng tháng: đăng ký ngày + phân công, đánh dấu đã kiểm kê
     BDVHD.hopNhom(el, nhom) — Lịch họp tháng của nhóm
   Mỗi khối tự gọi máy chủ, tự vẽ và tự xử lý bấm nút bên trong el. Gọi lại khi trang vẽ lại: dùng dữ liệu đã có, làm mới nếu cũ hơn 60 giây. */
(function () {
  if (window.BDVHD) return;
  var THU = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  var css = '.hd{font-size:14px}.hd .khung{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin-bottom:12px}' +
    '.hd h3{margin:0 0 2px;font-size:15px}.hd .mo-ta{font-size:13px;color:var(--muted)}.hd .mo-ta b{color:var(--text)}' +
    '.hd .dong{display:grid;grid-template-columns:96px 1fr auto;gap:6px 14px;align-items:center;padding:11px 0;border-top:1px solid var(--line)}.hd .dong:first-of-type{border-top:0}' +
    '.hd .dong.qua{opacity:.62}.hd .dong.nay{background:var(--accent-soft);margin:0 -16px;padding:11px 16px;border-radius:8px;border-top-color:transparent}' +
    '.hd .ng b{display:block;font-size:15px}.hd .ng span{font-size:12px;color:var(--muted)}' +
    '.hd .cho{display:flex;gap:6px;flex-wrap:wrap;align-items:center}' +
    '.hd .ten{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:2px 10px;font-size:13px;background:var(--track);white-space:nowrap}' +
    '.hd .ten.toi{background:var(--accent);color:var(--on-accent,#fff);font-weight:600}.hd .ten.trong{background:none;border:1px dashed var(--line);color:var(--muted)}' +
    '.hd .ten small{opacity:.75;font-size:11px}.hd .ten button{border:0;background:none;color:inherit;padding:0 2px;font-size:14px;cursor:pointer;opacity:.75}' +
    '.hd .nut{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;align-items:center}' +
    '.hd button.b1{border:1px solid var(--accent);background:var(--accent);color:var(--on-accent,#fff);border-radius:8px;padding:4px 12px;min-height:34px;font-size:13px;font-weight:600;cursor:pointer}' +
    '.hd button.b2{border:1px dashed var(--accent);background:none;color:var(--accent);border-radius:8px;padding:4px 10px;min-height:34px;font-size:13px;cursor:pointer}' +
    '.hd button.b3{border:1px solid var(--line);background:none;color:var(--muted);border-radius:8px;padding:4px 10px;min-height:34px;font-size:13px;cursor:pointer}' +
    '.hd button.do{color:var(--bad)}.hd button:disabled{opacity:.5;cursor:default}' +
    '.hd .pill{border-radius:999px;padding:1px 9px;font-size:12px;font-weight:600;white-space:nowrap}' +
    '.hd .p-mo{background:var(--ok-soft,#e0f3e9);color:var(--ok,#17794a)}.hd .p-khoa{background:var(--idle-soft,#eceff4);color:var(--muted)}.hd .p-cho{background:var(--warn-soft);color:var(--warn)}' +
    '.hd .p-bad{background:var(--bad-soft);color:var(--bad)}' +
    '.hd .form{grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;background:var(--bg);border-radius:10px;padding:10px 12px;margin-top:4px}' +
    '.hd .form label{display:flex;flex-direction:column;gap:3px;font-size:12px;color:var(--muted)}' +
    '.hd .form input,.hd .form select,.hd .form textarea{font:inherit;font-size:13.5px;color:var(--text);background:var(--card);border:1px solid var(--line);border-radius:8px;padding:6px 8px;min-height:34px}' +
    '.hd .form textarea{min-height:60px;width:100%}.hd .form .rong{flex:1 1 220px}.hd .form .ca{flex:1 1 100%}' +
    '.hd .chon{display:flex;gap:4px 12px;flex-wrap:wrap;font-size:13.5px;color:var(--text)}.hd .chon label{flex-direction:row;align-items:center;gap:5px;font-size:13.5px;color:var(--text)}' +
    '.hd .loi{color:var(--bad);font-size:13px;flex:1 1 100%}.hd .canh{background:var(--warn-soft);color:var(--warn);border-radius:10px;padding:8px 12px;margin:8px 0 0;font-size:13.5px}' +
    '.hd .yc{display:grid;grid-template-columns:1fr auto;gap:6px 12px;padding:10px 0;border-top:1px solid var(--line)}.hd .yc:first-of-type{border-top:0}.hd .yc .s{font-size:12.5px;color:var(--muted)}' +
    '.hd .yc input{font:inherit;font-size:13px;border:1px solid var(--line);border-radius:8px;padding:4px 8px;background:var(--card);color:var(--text);width:150px}' +
    '.hd .trong-k{color:var(--muted);text-align:center;padding:14px 8px}.hd details summary{cursor:pointer;color:var(--accent);font-size:13px;margin-top:8px}' +
    '.hd .busy{opacity:.5;pointer-events:none}' +
    '@media (max-width:640px){.hd .dong{grid-template-columns:64px 1fr}.hd .nut{grid-column:1/-1;justify-content:flex-start}.hd .yc{grid-template-columns:1fr}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function thu(iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]).getDay(); }
  function dm(iso) { var p = iso.split('-'); return p[2] + '/' + p[1]; }
  function thangChu(ym) { return 'Tháng ' + (+ym.slice(5)) + '/' + ym.slice(0, 4); }
  function cuoiThang(ym) { var p = ym.split('-'); return ym + '-' + ('0' + new Date(+p[0], +p[1], 0).getDate()).slice(-2); }
  function bao(m, err) {
    var t = document.getElementById('toast');
    if (!t) { alertLess(m); return; }
    t.textContent = m; t.className = err ? 'err' : ''; t.style.display = 'block';
    clearTimeout(bao.t); bao.t = setTimeout(function () { t.style.display = 'none'; }, err ? 6000 : 2600);
  }
  function alertLess(m) { try { console.log(m); } catch (e) {} }

  // Khung chung: nhớ dữ liệu theo khoá, vẽ ngay nếu có, làm mới khi cũ
  var NHO = {};
  function khoi(el, khoa, action, req, ve) {
    var o = NHO[khoa] || (NHO[khoa] = { d: null, luc: 0, mo: {}, dang: false });
    o.el = el; o.ve = function () { if (o.d) ve(o); };
    if (o.d) ve(o); else el.innerHTML = '<div class="hd"><div class="khung trong-k">Đang tải…</div></div>';
    if (!o.dang && (!o.d || Date.now() - o.luc > 60000)) {
      o.dang = true;
      BDV.goi(action, req).then(function (d) { o.dang = false; o.d = d; o.luc = Date.now(); if (o.el.isConnected) ve(o); })
        .catch(function (e) { o.dang = false; if (o.el.isConnected && !o.d) o.el.innerHTML = '<div class="hd"><div class="khung trong-k">Không tải được: ' + esc(e && e.message ? e.message : e) + '</div></div>'; });
    }
    return o;
  }
  function gui(o, action, req, el, tb) {
    if (el) el.classList.add('busy');
    return BDV.goi(action, req).then(function (d) { o.d = d; o.luc = Date.now(); o.mo = {}; if (o.el.isConnected) o.ve(); if (tb) bao(tb); return d; })
      .catch(function (e) { if (el) el.classList.remove('busy'); var m = e && e.message ? e.message : String(e); bao(m, true); throw m; });
  }
  function ganSuKien(el, fn) { if (el.dataset.hdGan === '1') { el.__hdFn = fn; return; } el.dataset.hdGan = '1'; el.__hdFn = fn; el.addEventListener('click', function (e) { var b = e.target.closest('button[data-hd]'); if (b && el.__hdFn) el.__hdFn(b, e); }); }

  /* ================= Chủ nhật xanh ================= */
  function cnXanh(el) {
    var o = khoi(el, 'cnx', 'cnXanh', {}, veCnx);
    ganSuKien(el, function (b) { suKienCnx(o, b); });
  }
  function nhanTT(c) {
    if (c.qua) return '<span class="pill p-khoa">Đã qua</span>';
    if (c.trangThai === 'mo') return '<span class="pill p-mo">Đang mở đăng ký · đến 17h CN ' + dm(c.dong.slice(0, 10)) + '</span>';
    if (c.trangThai === 'chuaMo') return '<span class="pill p-khoa">Mở đăng ký từ thứ 6 ' + dm(c.mo.slice(0, 10)) + '</span>';
    return '<span class="pill p-khoa">Đã khoá đăng ký</span>';
  }
  function veCnx(o) {
    var d = o.d, toi = d.toi;
    var choCua = function (n) { return d.yeuCau.filter(function (y) { return y.ngay === n && y.ten === toi && y.trangThai === 'Chờ duyệt'; })[0]; };
    var dongCn = function (c) {
      var co = c.nguoi.some(function (x) { return x.ten === toi; }), du = c.nguoi.length >= d.soNguoi, cho = choCua(c.ngay);
      var cho1 = c.nguoi.map(function (x) {
        return '<span class="ten' + (x.ten === toi ? ' toi' : '') + '" title="' + esc(x.vaiTro + (x.ghiChu ? ' · ' + x.ghiChu : '')) + '">' + esc(x.ten) +
          (x.vaiTro === 'Trực thay' ? ' <small>(trực thay)</small>' : '') +
          (d.laPhuTrach && !c.qua ? '<button type="button" data-hd="bo" data-n="' + c.ngay + '" data-ten="' + esc(x.ten) + '" title="Bỏ ' + esc(x.ten) + ' khỏi Chủ nhật này" aria-label="Bỏ ' + esc(x.ten) + '">×</button>' : '') + '</span>';
      }).join('');
      for (var i = c.nguoi.length; i < d.soNguoi; i++) cho1 += '<span class="ten trong">Còn trống</span>';
      var nut = '';
      if (!c.qua) {
        if (!co && !du && c.trangThai === 'mo' && d.laThanhVien) nut += '<button type="button" class="b1" data-hd="dangKy" data-n="' + c.ngay + '">+ Đăng ký</button>';
        if (co && c.trangThai === 'mo') nut += '<button type="button" class="b3" data-hd="huy" data-n="' + c.ngay + '">Huỷ đăng ký</button>';
        if (co && c.trangThai !== 'mo' && !cho) nut += '<button type="button" class="b3" data-hd="moVang" data-n="' + c.ngay + '">Xin vắng</button>';
        if (cho) nut += '<span class="pill p-cho">Đang xin vắng, chờ duyệt</span>';
        if (d.laPhuTrach && !du) nut += '<button type="button" class="b2" data-hd="moXep" data-n="' + c.ngay + '">+ Xếp người</button>';
      }
      var form = '';
      var ranh = d.thanhVien.filter(function (t) { return !c.nguoi.some(function (x) { return x.ten === t; }); });
      if (o.mo[c.ngay] === 'vang') {
        var thay = ranh.filter(function (t) { return t !== toi; });
        form = '<div class="form"><label class="rong">Người trực thay<select data-f="thay"><option value="">Chọn người trực giúp…</option>' + thay.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label>' +
          '<label class="rong">Lý do<input data-f="lyDo" maxlength="300" placeholder="Ví dụ: về quê, trùng lịch thi"></label>' +
          '<button type="button" class="b1" data-hd="guiVang" data-n="' + c.ngay + '">Gửi xin vắng</button><button type="button" class="b3" data-hd="dong" data-n="' + c.ngay + '">Đóng</button>' +
          '<span class="mo-ta ca">Phụ trách chính duyệt xong thì người trực thay sẽ thay tên bạn trong Chủ nhật này.</span></div>';
      }
      if (o.mo[c.ngay] === 'xep') {
        form = '<div class="form"><label class="rong">Xếp thành viên<select data-f="ten"><option value="">Chọn thành viên…</option>' + ranh.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label>' +
          '<button type="button" class="b1" data-hd="xep" data-n="' + c.ngay + '">Xếp vào</button><button type="button" class="b3" data-hd="dong" data-n="' + c.ngay + '">Đóng</button></div>';
      }
      return '<div class="dong' + (c.qua ? ' qua' : '') + (c.ngay >= d.homNay && c.ngay <= addDays(d.homNay, 6) ? ' nay' : '') + '" data-ngay="' + c.ngay + '"><div class="ng"><b>CN ' + dm(c.ngay) + '</b><span>' + c.ngay.slice(0, 4) + '</span></div>' +
        '<div><div class="cho">' + cho1 + '</div><div style="margin-top:5px">' + nhanTT(c) + '</div></div><div class="nut">' + nut + '</div>' + form + '</div>';
    };
    var sap = d.chuNhat.filter(function (c) { return !c.qua; }), qua = d.chuNhat.filter(function (c) { return c.qua; }).reverse();
    var yc = d.yeuCau.map(function (y) {
      var cho = y.trangThai === 'Chờ duyệt';
      var b = '';
      if (cho && d.laPhuTrach) b = '<input type="text" data-f="gc" placeholder="Ghi chú (không bắt buộc)"><button type="button" class="b1" data-hd="duyet" data-ok="1" data-id="' + esc(y.id) + '">Duyệt</button><button type="button" class="b3 do" data-hd="duyet" data-ok="0" data-id="' + esc(y.id) + '">Từ chối</button>';
      else if (cho && y.ten === toi) b = '<button type="button" class="b3" data-hd="rut" data-id="' + esc(y.id) + '">Rút yêu cầu</button>';
      else b = '<span class="pill ' + (y.trangThai === 'Đã duyệt' ? 'p-mo' : y.trangThai === 'Chờ duyệt' ? 'p-cho' : 'p-khoa') + '">' + esc(y.trangThai) + '</span>';
      return '<div class="yc"><div><b>' + esc(y.ten) + '</b> xin vắng CN ' + dm(y.ngay) + ' → <b>' + esc(y.thay) + '</b> trực thay' +
        '<div class="s">Lý do: ' + esc(y.lyDo) + ' · gửi ' + esc(y.guiLuc) + (y.nguoiDuyet ? ' · ' + esc(y.nguoiDuyet) + ' xử lý ' + esc(y.duyetLuc) : '') + (y.ghiChuDuyet ? ' · ' + esc(y.ghiChuDuyet) : '') + '</div></div>' +
        '<div class="nut">' + b + '</div></div>';
    }).join('');
    o.el.innerHTML = '<div class="hd"><div class="khung"><h3>Lịch Chủ nhật xanh</h3><div class="mo-ta">Mỗi Chủ nhật ' + d.soNguoi + ' người · đăng ký cùng lúc với lịch trực (00:00 thứ 6 → 17:00 Chủ nhật tuần trước) · ' +
      'Phụ trách chính: <b>' + (d.phuTrach.length ? esc(d.phuTrach.join(', ')) : 'chưa ghi trong tab Mảng công việc') + '</b>' +
      (d.laPhuTrach ? ' · bạn có thể xếp / bỏ người và duyệt xin vắng' : '') + '</div>' +
      '<div style="margin-top:8px">' + sap.map(dongCn).join('') + '</div>' +
      (qua.length ? '<details><summary>Các Chủ nhật đã qua (' + qua.length + ')</summary>' + qua.map(dongCn).join('') + '</details>' : '') + '</div>' +
      '<div class="khung"><h3>Xin vắng & trực thay</h3><div class="mo-ta">Sau khi khoá đăng ký, muốn vắng thì bấm "Xin vắng" ở Chủ nhật đó và chọn người trực giúp.</div>' +
      '<div style="margin-top:6px">' + (yc || '<div class="trong-k">Chưa có yêu cầu nào.</div>') + '</div></div></div>';
  }
  function addDays(iso, n) { var p = iso.split('-'); var x = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + n)); return x.toISOString().slice(0, 10); }
  function suKienCnx(o, b) {
    var k = b.dataset.hd, n = b.dataset.n, dong = b.closest('.dong') || b.closest('.yc');
    if (k === 'moVang' || k === 'moXep') { o.mo = {}; o.mo[n] = k === 'moVang' ? 'vang' : 'xep'; o.ve(); return; }
    if (k === 'dong') { o.mo = {}; o.ve(); return; }
    if (k === 'dangKy') return gui(o, 'luuCnXanh', { viec: 'dangKy', ngay: n }, dong, 'Đã đăng ký Chủ nhật xanh ' + dm(n)).catch(function () {});
    if (k === 'huy') return gui(o, 'luuCnXanh', { viec: 'huy', ngay: n }, dong, 'Đã huỷ đăng ký').catch(function () {});
    if (k === 'bo') {
      if (b.dataset.chac !== '1') { b.dataset.chac = '1'; b.textContent = 'bỏ?'; setTimeout(function () { if (b.isConnected) { b.dataset.chac = ''; b.textContent = '×'; } }, 3500); return; }
      return gui(o, 'luuCnXanh', { viec: 'bo', ngay: n, ten: b.dataset.ten }, dong, 'Đã bỏ ' + b.dataset.ten).catch(function () {});
    }
    if (k === 'xep') {
      var t = dong.querySelector('[data-f=ten]').value; if (!t) { bao('Chọn thành viên để xếp.', true); return; }
      return gui(o, 'luuCnXanh', { viec: 'xep', ngay: n, ten: t }, dong, 'Đã xếp ' + t).catch(function () {});
    }
    if (k === 'guiVang') {
      var thay = dong.querySelector('[data-f=thay]').value, ly = dong.querySelector('[data-f=lyDo]').value.trim();
      if (!thay) { bao('Chọn người trực thay.', true); return; }
      if (!ly) { bao('Ghi lý do xin vắng.', true); return; }
      return gui(o, 'xinVangCnXanh', { ngay: n, thay: thay, lyDo: ly }, dong, 'Đã gửi xin vắng, chờ phụ trách chính duyệt').catch(function () {});
    }
    if (k === 'rut') return gui(o, 'rutXinVangCnXanh', { id: b.dataset.id }, dong, 'Đã rút yêu cầu').catch(function () {});
    if (k === 'duyet') {
      var gc = dong.querySelector('[data-f=gc]'), ok = b.dataset.ok === '1';
      return gui(o, 'duyetCnXanh', { id: b.dataset.id, dongY: ok, ghiChu: gc ? gc.value : '' }, dong, ok ? 'Đã duyệt, đã đổi người trực' : 'Đã từ chối').catch(function () {});
    }
  }

  /* ================= Kiểm kê CSVC ================= */
  function kiemKe(el) {
    var o = khoi(el, 'kk', 'kiemKe', {}, veKk);
    ganSuKien(el, function (b) { suKienKk(o, b); });
  }
  function veKk(o) {
    var d = o.d, toi = d.toi;
    var nay = d.thang.filter(function (t) { return t.thang === d.thangNay; })[0];
    var canh = nay && !nay.ngay && +d.homNay.slice(8) > d.hanNgay ? '<div class="canh">Tháng này chưa đăng ký lịch kiểm kê (cần đăng ký trước ngày ' + d.hanNgay + ' hằng tháng).</div>' : '';
    var the = function (t) {
      var la = t.thang === d.thangNay, qua = t.thang < d.thangNay;
      var tt = t.trangThai === 'Đã kiểm kê' ? '<span class="pill p-mo">✓ Đã kiểm kê</span>' : t.ngay ? '<span class="pill p-cho">Đã lên lịch</span>'
        : qua ? '<span class="pill p-khoa">Không có lịch</span>'
        : '<span class="pill ' + (la && +d.homNay.slice(8) > d.hanNgay ? 'p-bad' : 'p-khoa') + '">Chưa đăng ký</span>';
      var nd = t.ngay ? '<b>' + THU[thu(t.ngay)] + ' ' + dm(t.ngay) + '</b> · Thực hiện: ' + (t.thucHien.length ? t.thucHien.map(function (x) { return '<span class="ten' + (x === toi ? ' toi' : '') + '">' + esc(x) + '</span>'; }).join(' ') : '—') +
        (t.ghiChu ? '<div class="mo-ta" style="margin-top:4px">' + linkHoa(t.ghiChu) + '</div>' : '') + (t.boi ? '<div class="mo-ta">Cập nhật bởi ' + esc(t.boi) + ' · ' + esc(t.luc) + '</div>' : '')
        : '<span class="mo-ta">' + (qua ? 'Tháng này không có lịch kiểm kê trên dashboard.' : d.laPhuTrach ? 'Chưa có lịch, bấm "Đăng ký lịch" để chọn ngày và phân công.' : 'Phụ trách chính chưa đăng ký lịch.') + '</span>';
      var nut = '', duocDanh = d.laPhuTrach || t.thucHien.indexOf(toi) > -1;
      if (d.laPhuTrach && !qua) nut += '<button type="button" class="' + (t.ngay ? 'b3' : 'b1') + '" data-hd="moDk" data-t="' + t.thang + '">' + (t.ngay ? 'Sửa lịch' : 'Đăng ký lịch') + '</button>';
      if (t.ngay && t.trangThai !== 'Đã kiểm kê' && duocDanh) nut += '<button type="button" class="b2" data-hd="moXong" data-t="' + t.thang + '">✓ Đã kiểm kê</button>';
      if (t.trangThai === 'Đã kiểm kê' && d.laPhuTrach) nut += '<button type="button" class="b3" data-hd="moLai" data-t="' + t.thang + '">Mở lại</button>';
      var form = '';
      if (o.mo[t.thang] === 'dk') {
        form = '<div class="form"><label>Ngày kiểm kê<input type="date" data-f="ngay" min="' + t.thang + '-01" max="' + cuoiThang(t.thang) + '" value="' + (t.ngay || '') + '"></label>' +
          '<div class="ca"><div class="mo-ta" style="margin-bottom:4px">Thành viên thực hiện</div><div class="chon">' + d.thanhVien.map(function (x) {
            return '<label><input type="checkbox" data-f="tv" value="' + esc(x) + '"' + (t.thucHien.indexOf(x) > -1 ? ' checked' : '') + '>' + esc(x) + '</label>'; }).join('') + '</div></div>' +
          '<label class="rong">Ghi chú (khu vực, phòng…)<input data-f="gc" maxlength="500" value="' + esc(t.ghiChu || '') + '"></label>' +
          '<button type="button" class="b1" data-hd="dk" data-t="' + t.thang + '">Lưu lịch</button><button type="button" class="b3" data-hd="dong" data-t="' + t.thang + '">Đóng</button></div>';
      }
      if (o.mo[t.thang] === 'xong') {
        form = '<div class="form"><label class="rong">Ghi chú / link biên bản kiểm kê<input data-f="gc" maxlength="500" placeholder="https://drive.google.com/… hoặc ghi chú ngắn" value="' + esc(t.ghiChu || '') + '"></label>' +
          '<button type="button" class="b1" data-hd="xong" data-t="' + t.thang + '">Xác nhận đã kiểm kê</button><button type="button" class="b3" data-hd="dong" data-t="' + t.thang + '">Đóng</button></div>';
      }
      return '<div class="dong' + (qua ? ' qua' : '') + (la ? ' nay' : '') + '"><div class="ng"><b>' + thangChu(t.thang).replace('Tháng ', 'T') + '</b><span>' + (la ? 'tháng này' : '') + '</span></div>' +
        '<div><div style="margin-bottom:4px">' + tt + '</div>' + nd + '</div><div class="nut">' + nut + '</div>' + form + '</div>';
    };
    o.el.innerHTML = '<div class="hd"><div class="khung"><h3>Kiểm kê tài sản hằng tháng</h3><div class="mo-ta">Mỗi tháng kiểm kê 1 lần · phụ trách chính đăng ký ngày vào đầu tháng và phân công người thực hiện · ' +
      'Phụ trách chính: <b>' + (d.phuTrach.length ? esc(d.phuTrach.join(', ')) : 'chưa ghi trong tab Mảng công việc') + '</b></div>' + canh +
      '<div style="margin-top:8px">' + d.thang.map(the).join('') + '</div></div></div>';
  }
  function linkHoa(s) { return esc(s).replace(/(https:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>'); }
  function suKienKk(o, b) {
    var k = b.dataset.hd, t = b.dataset.t, dong = b.closest('.dong');
    if (k === 'moDk' || k === 'moXong') { o.mo = {}; o.mo[t] = k === 'moDk' ? 'dk' : 'xong'; o.ve(); return; }
    if (k === 'dong') { o.mo = {}; o.ve(); return; }
    if (k === 'dk') {
      var ngay = dong.querySelector('[data-f=ngay]').value, tv = [].map.call(dong.querySelectorAll('[data-f=tv]:checked'), function (x) { return x.value; });
      if (!ngay) { bao('Chọn ngày kiểm kê.', true); return; }
      if (!tv.length) { bao('Chọn ít nhất 1 thành viên thực hiện.', true); return; }
      return gui(o, 'luuKiemKe', { viec: 'dangKy', thang: t, ngay: ngay, thucHien: tv, ghiChu: dong.querySelector('[data-f=gc]').value }, dong, 'Đã lưu lịch kiểm kê ' + thangChu(t).toLowerCase()).catch(function () {});
    }
    if (k === 'xong') return gui(o, 'luuKiemKe', { viec: 'xong', thang: t, ghiChu: dong.querySelector('[data-f=gc]').value }, dong, 'Đã ghi nhận kiểm kê').catch(function () {});
    if (k === 'moLai') return gui(o, 'luuKiemKe', { viec: 'moLai', thang: t }, dong, 'Đã mở lại').catch(function () {});
  }

  /* ================= Họp tháng ================= */
  function hopNhom(el, nhom) {
    var o = khoi(el, 'hop:' + nhom, 'hopNhom', { nhom: nhom }, veHop);
    o.nhom = nhom;
    ganSuKien(el, function (b) { suKienHop(o, b); });
  }
  function veHop(o) {
    var d = o.d;
    var the = function (t) {
      var la = t.thang === d.thangNay, qua = t.thang < d.thangNay;
      var nd = t.ngay ? '<b>' + THU[thu(t.ngay)] + ', ' + dm(t.ngay) + ' lúc ' + esc(t.gio) + '</b> · ' + linkHoa(t.diaDiem) +
        (t.noiDung ? '<div style="margin-top:4px;white-space:pre-line">' + esc(t.noiDung) + '</div>' : '') + '<div class="mo-ta" style="margin-top:3px">Đăng ký bởi ' + esc(t.nguoi) + ' · ' + esc(t.luc) + '</div>'
        : '<span class="mo-ta">' + (qua ? 'Không có lịch họp.' : 'Chưa đăng ký lịch họp.') + '</span>';
      var nut = '';
      if (d.suaDuoc && !qua) nut = '<button type="button" class="' + (t.ngay ? 'b3' : 'b1') + '" data-hd="mo" data-t="' + t.thang + '">' + (t.ngay ? 'Sửa' : 'Đăng ký lịch họp') + '</button>' +
        (t.ngay ? '<button type="button" class="b3 do" data-hd="xoa" data-t="' + t.thang + '">Xoá</button>' : '');
      var form = o.mo[t.thang] ? '<div class="form"><label>Ngày<input type="date" data-f="ngay" min="' + t.thang + '-01" max="' + cuoiThang(t.thang) + '" value="' + (t.ngay || '') + '"></label>' +
        '<label>Giờ<input type="time" data-f="gio" value="' + esc(t.gio || '19:30') + '"></label>' +
        '<label class="rong">Địa điểm / link họp online<input data-f="dd" maxlength="150" value="' + esc(t.diaDiem || '') + '" placeholder="Ví dụ: Văn phòng Đoàn, Google Meet…"></label>' +
        '<label class="ca">Nội dung họp<textarea data-f="nd" maxlength="1000" placeholder="Tổng kết tháng, kế hoạch tháng sau…">' + esc(t.noiDung || '') + '</textarea></label>' +
        '<button type="button" class="b1" data-hd="luu" data-t="' + t.thang + '">Lưu lịch họp</button><button type="button" class="b3" data-hd="dong" data-t="' + t.thang + '">Đóng</button></div>' : '';
      return '<div class="dong' + (qua ? ' qua' : '') + (la ? ' nay' : '') + '"><div class="ng"><b>' + thangChu(t.thang).replace('Tháng ', 'T') + '</b><span>' + (la ? 'tháng này' : '') + '</span></div>' +
        '<div>' + nd + '</div><div class="nut">' + nut + '</div>' + form + '</div>';
    };
    var nay = d.thang.filter(function (t) { return t.thang >= d.thangNay; }).reverse(), qua = d.thang.filter(function (t) { return t.thang < d.thangNay; });
    o.el.innerHTML = '<div class="hd"><div class="khung"><h3>Lịch họp tháng của nhóm</h3><div class="mo-ta">' +
      (d.suaDuoc ? 'Trưởng nhóm hoặc thành viên đại diện đăng ký lịch họp mỗi tháng để quản lý Ban nắm được.' : 'Lịch họp do nhóm đăng ký (chế độ xem).') + '</div>' +
      '<div style="margin-top:8px">' + nay.map(the).join('') + '</div>' +
      (qua.length ? '<details><summary>Các tháng trước</summary>' + qua.map(the).join('') + '</details>' : '') + '</div></div>';
  }
  function suKienHop(o, b) {
    var k = b.dataset.hd, t = b.dataset.t, dong = b.closest('.dong');
    if (k === 'mo') { o.mo = {}; o.mo[t] = 1; o.ve(); return; }
    if (k === 'dong') { o.mo = {}; o.ve(); return; }
    if (k === 'xoa') {
      if (b.dataset.chac !== '1') { b.dataset.chac = '1'; b.textContent = 'Bấm lần nữa để xoá'; setTimeout(function () { if (b.isConnected) { b.dataset.chac = ''; b.textContent = 'Xoá'; } }, 3500); return; }
      return gui(o, 'luuHopNhom', { nhom: o.nhom, thang: t, viec: 'xoa' }, dong, 'Đã xoá lịch họp').catch(function () {});
    }
    if (k === 'luu') {
      var q = function (f) { return dong.querySelector('[data-f=' + f + ']').value.trim(); };
      if (!q('ngay')) { bao('Chọn ngày họp.', true); return; }
      if (!q('dd')) { bao('Ghi địa điểm họp.', true); return; }
      return gui(o, 'luuHopNhom', { nhom: o.nhom, thang: t, ngay: q('ngay'), gio: q('gio'), diaDiem: q('dd'), noiDung: dong.querySelector('[data-f=nd]').value }, dong, 'Đã lưu lịch họp').catch(function () {});
    }
  }

  window.BDVHD = { cnXanh: cnXanh, kiemKe: kiemKe, hopNhom: hopNhom };
})();
