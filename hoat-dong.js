/* Các khối hoạt động riêng của nhóm, dùng trong trang nhóm (nhom.js) và trang 4T:
     BDVHD.cnXanh(el)        — Chủ nhật xanh (nhóm CSDL - CSVC): đăng ký / xếp người / xin vắng có người trực thay / 4 đầu việc chuẩn bị mỗi CN
     BDVHD.csvc(el)          — Cơ sở vật chất: hiện trạng tài sản · kiểm kê (đăng ký → duyệt 2 cấp → báo cáo, biểu đồ) · mượn về · cho mượn
     BDVHD.congVan(el)       — Công văn đi / đến (chỉ xem từ sheet): đăng ký ngày + phân công, đánh dấu đã kiểm kê
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
    '.hd .vc{grid-column:1/-1;background:var(--bg);border-radius:10px;padding:4px 12px;margin-top:2px}' +
    '.hd .vc-i{display:grid;grid-template-columns:22px 1fr auto;gap:4px 10px;align-items:center;padding:7px 0;border-top:1px solid var(--line)}.hd .vc-i:first-child{border-top:0}' +
    '.hd .vc-i .dau{font-size:15px;color:var(--muted)}.hd .vc-i.xong .dau{color:var(--ok,#17794a)}.hd .vc-i.xong .tv{text-decoration:line-through;opacity:.75}' +
    '.hd .vc-i .s{font-size:12.5px;color:var(--muted)}.hd .vc-i .form{margin:2px 0 4px}' +
    '.hd button.vc-nut{border:0;background:none;color:var(--accent);font-size:13px;padding:2px 0;cursor:pointer;font-weight:600}' +
    '.hd .seg{display:inline-flex;border:1px solid var(--line);border-radius:9px;overflow:hidden;margin:10px 0 2px}.hd .seg button{border:0;background:none;padding:6px 14px;font-size:13px;cursor:pointer;color:var(--text);min-height:34px}' +
    '.hd .seg button[aria-pressed=true]{background:var(--accent);color:var(--on-accent,#fff);font-weight:600}' +
    '.hd .p-info{background:var(--accent-soft);color:var(--accent)}.hd .seg .dem{display:inline-block;min-width:18px;border-radius:9px;background:var(--bad);color:#fff;font-size:11px;line-height:18px;padding:0 5px;margin-left:4px}' +
    '.hd .seg{flex-wrap:wrap}.hd .seg-to{margin:0 0 12px}.hd .seg-to button{font-weight:600}' +
    '.hd a.lk{display:inline-flex;align-items:center;border:1px solid var(--line);border-radius:8px;padding:5px 10px;font-size:13px;color:var(--accent);text-decoration:none;background:var(--card)}' +
    '.hd .so-kk{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.hd .so-kk span{background:var(--track);border-radius:7px;padding:2px 8px;font-size:12.5px}' +
    '.hd .nhom-t{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin:14px 0 2px}' +
    '.hd .do-ds{display:flex;flex-direction:column;gap:6px;margin-bottom:6px}.hd .do-r{display:flex;gap:6px}.hd .do-r input[data-f=dten]{flex:1 1 auto;min-width:0}.hd .do-r input[data-f=dsl]{width:76px}' +
    '.hd .tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-bottom:12px}.hd .tile{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:2px}' +
    '.hd .tile span{font-size:12.5px;color:var(--muted)}.hd .tile b{font-size:26px;line-height:1.15}.hd .tile small{font-size:12px;color:var(--muted)}.hd .tile.chinh{border-color:var(--accent);background:var(--accent-soft)}.hd .tile.chinh b{color:var(--accent);font-size:32px}.hd .tile.xau b{color:var(--bad)}' +
    '.hd .quy ol{margin:6px 0 0;padding-left:20px;font-size:13.5px;line-height:1.55}.hd .cv-r{display:grid;grid-template-columns:110px 1fr auto;gap:4px 12px;padding:8px 0;border-top:1px solid var(--line);font-size:13.5px}.hd .khung h3+.cv-r{border-top:0}' +
    '.hd .cv-r b{font-size:13px;word-break:break-word}.hd .cv-r small{display:block;color:var(--muted);font-size:12px}.hd .cv-r em{color:var(--bad);font-style:normal}' +
    '.hd{--c1:#2a78d6;--c2:#eda100;--c3:#6250d6}@media (prefers-color-scheme:dark){.hd{--c1:#3987e5;--c2:#c98500;--c3:#9085e9}}' +
    '.hd .bd{margin:0 0 14px}.hd .bd-t{font-weight:600;font-size:14px;margin-bottom:4px}.hd .bd svg{width:100%;max-width:720px;height:auto;display:block;overflow:visible}.hd .bd-grid{stroke:var(--line);stroke-width:1}.hd .bd-ax{fill:var(--muted);font-size:11px}' +
    '.hd .bd-line{fill:none;stroke:var(--c1);stroke-width:2;stroke-linejoin:round}.hd circle.bd-c1{fill:var(--c1);stroke:var(--card);stroke-width:2}.hd path.bd-c1{fill:var(--c1)}.hd path.bd-c2{fill:var(--c2)}.hd path.bd-c3{fill:var(--c3)}' +
    '.hd .bd-pt:hover circle.bd-c1{r:6}.hd .bd-pt:hover path{opacity:.8}.hd .bd-lg{display:flex;gap:14px;font-size:12.5px;color:var(--muted);margin-bottom:4px}.hd .bd-lg i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}' +
    '.hd .bd-lg i.bd-c1{background:var(--c1)}.hd .bd-lg i.bd-c2{background:var(--c2)}.hd .bd-lg i.bd-c3{background:var(--c3)}' +
    '.hd .bd-bang{overflow-x:auto}.hd .bd-bang table{border-collapse:collapse;font-size:12.5px;width:100%;margin-top:6px}.hd .bd-bang th,.hd .bd-bang td{border-bottom:1px solid var(--line);padding:5px 6px;text-align:right;white-space:nowrap}.hd .bd-bang th:first-child,.hd .bd-bang td:first-child{text-align:left}' +
    '.hd .ht-loc{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px}.hd .ht-loc input[type=search],.hd .ht-loc select{font:inherit;font-size:13.5px;color:var(--text);background:var(--card);border:1px solid var(--line);border-radius:8px;padding:6px 9px;min-height:36px}' +
    '.hd .ht-loc input[type=search]{flex:1 1 220px;min-width:0}.hd .ht-loc label{display:flex;gap:6px;align-items:center;font-size:13px;color:var(--text)}' +
    '.hd .ht-bang{overflow-x:auto}.hd .ht-bang table{border-collapse:collapse;width:100%;font-size:13.5px}.hd .ht-bang th{font-size:12px;color:var(--muted);font-weight:600;text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);white-space:nowrap}' +
    '.hd .ht-bang td{padding:7px 8px;border-bottom:1px solid var(--line);vertical-align:top}.hd .ht-bang td.so{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}.hd .ht-bang th.so{text-align:right}' +
    '.hd .ht-bang tr.khu td{background:var(--bg);font-weight:700;font-size:12.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.03em;padding:6px 8px}' +
    '.hd .ht-bang .vt{display:block;font-size:12px;color:var(--muted)}.hd .ht-bang .gc{display:block;font-size:12px;color:var(--muted);margin-top:2px}.hd .ht-bang .am{color:var(--bad);font-weight:600}.hd .ht-bang .duong{color:var(--ok,#17794a);font-weight:600}' +
    '.hd .ht-bang tr.sua-r td{background:var(--bg)}.hd .ht-bang tr.khu.cu td{background:var(--track);padding-top:10px}.hd .ht-bang .form{margin:0;background:none;padding:2px 0}.hd .ht-bang input[type=number]{width:90px}.hd .ht-bang td button{white-space:nowrap}' +
    '@media (max-width:640px){.hd .ht-bang .an-dd{display:none}}' +
    '.hd .ht-bd{position:relative}.hd .ht-so{display:flex;gap:10px 28px;flex-wrap:wrap;margin-bottom:14px}.hd .ht-so div{display:flex;gap:8px;align-items:baseline}.hd .ht-so b{font-size:26px;line-height:1.1}' +
    '.hd .ht-so span{font-size:13.5px}.hd .ht-so small{display:block;font-size:12px;color:var(--muted)}' +
    '.hd .ht-t{font-weight:600;font-size:13.5px;margin-bottom:6px}.hd .ht-t span{font-weight:400;font-size:12px;color:var(--muted);margin-left:6px}' +
    '.hd{--ht-du:#0ca30c;--ht-thieu:#fab219;--ht-hong:#d03b3b;--ht-cu:#b4bcc8;--ht-co:var(--c1)}@media (prefers-color-scheme:dark){.hd{--ht-cu:#4b5563}}' +
    '.hd .ht-du{background:var(--ht-du)}.hd .ht-thieu{background:var(--ht-thieu)}.hd .ht-hong{background:var(--ht-hong)}.hd .ht-cu{background:var(--ht-cu)}.hd .ht-co{background:var(--ht-co)}' +
    '.hd .ht-chong{display:flex;gap:2px;height:22px}.hd .ht-chong button{border:0;padding:0;min-width:6px;flex-basis:0;cursor:pointer}.hd .ht-chong button:first-child{border-radius:4px 0 0 4px}.hd .ht-chong button:last-child{border-radius:0 4px 4px 0}' +
    '.hd .ht-chong button.mo,.hd .ht-kr.mo{opacity:.3}.hd .ht-chong button:hover{filter:brightness(1.08)}' +
    '.hd .ht-chu{display:flex;gap:6px 16px;flex-wrap:wrap;margin-top:8px}.hd .ht-chu button{border:0;background:none;padding:2px 0;font-size:13px;color:var(--text);cursor:pointer;display:inline-flex;align-items:center;gap:6px}' +
    '.hd .ht-chu button[aria-pressed=true]{font-weight:700;text-decoration:underline}.hd .ht-chu i,.hd .ht-lg i{display:inline-block;width:10px;height:10px;border-radius:3px}' +
    '.hd .ht-lg{display:flex;gap:16px;font-size:12.5px;color:var(--muted);margin-bottom:6px}.hd .ht-lg span{display:inline-flex;align-items:center;gap:6px}' +
    '.hd .ht-khu{display:flex;flex-direction:column;gap:4px}.hd .ht-kr{display:grid;grid-template-columns:minmax(120px,240px) 1fr;gap:10px;align-items:center;border:0;background:none;padding:2px 0;cursor:pointer;text-align:left;color:var(--text);font-size:13px}' +
    '.hd .ht-kr:hover .ht-kt{color:var(--accent)}.hd .ht-kt{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hd .ht-kb{display:flex;align-items:center;gap:6px}' +
    '.hd .ht-kv{display:flex;gap:2px;height:14px}.hd .ht-kv i{display:block;min-width:3px;flex-basis:0}.hd .ht-kv i:last-child{border-radius:0 4px 4px 0}.hd .ht-kb em{font-style:normal;font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums}' +
    '.hd .ht-tip{position:absolute;z-index:3;pointer-events:none;background:var(--text);color:var(--card);font-size:12.5px;padding:5px 9px;border-radius:7px;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,.18)}' +
    '@media (max-width:640px){.hd .ht-kr{grid-template-columns:110px 1fr}}' +
    '.hd .cv-r.nay-r{background:var(--accent-soft);margin:0 -16px;padding:8px 16px;border-radius:8px}.hd .cv-r .cho{justify-content:flex-end}' +
    '@media (max-width:640px){.hd .cv-r{grid-template-columns:1fr}.hd .cv-r .cho{justify-content:flex-start}}' +
    '@media (max-width:640px){.hd .vc-i{grid-template-columns:22px 1fr}.hd .vc-i .nut{grid-column:2}.hd .dong{grid-template-columns:64px 1fr}.hd .nut{grid-column:1/-1;justify-content:flex-start}.hd .yc{grid-template-columns:1fr}}';
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
    o.vc = o.vc || {};
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
      var soXong = (c.viec || []).filter(function (v) { return v.xong; }).length, moVc = o.vc[c.ngay] != null ? o.vc[c.ngay] : c.ngay === ganNhat;
      var vcNut = c.viec ? '<button type="button" class="vc-nut" data-hd="vc" data-n="' + c.ngay + '" aria-expanded="' + moVc + '">Chuẩn bị ' + soXong + '/' + c.viec.length + (moVc ? ' ▴' : ' ▾') + '</button>' : '';
      return '<div class="dong' + (c.qua ? ' qua' : '') + (c.ngay >= d.homNay && c.ngay <= addDays(d.homNay, 6) ? ' nay' : '') + '" data-ngay="' + c.ngay + '"><div class="ng"><b>CN ' + dm(c.ngay) + '</b><span>' + c.ngay.slice(0, 4) + '</span></div>' +
        '<div><div class="cho">' + cho1 + '</div><div style="margin-top:5px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">' + nhanTT(c) + vcNut + '</div></div><div class="nut">' + nut + '</div>' + form +
        (moVc && c.viec ? veViecCn(o, c) : '') + '</div>';
    };
    var sap = d.chuNhat.filter(function (c) { return !c.qua; }), qua = d.chuNhat.filter(function (c) { return c.qua; }).reverse();
    var ganNhat = sap.length ? sap[0].ngay : '';
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
  // 4 đầu việc chuẩn bị của một Chủ nhật: Viết thông báo · Liên hệ khu vực trực · Tạo sheet điểm danh · Giám sát thực hiện
  function veViecCn(o, c) {
    var d = o.d, toi = d.toi;
    return '<div class="vc">' + c.viec.map(function (v) {
      var k = 'v:' + c.ngay + ':' + v.i, minh = v.nguoi === toi, sua = minh || d.laPhuTrach, nut = '';
      if (!v.xong) {
        if (!v.nguoi && d.laThanhVien) nut += '<button type="button" class="b2" data-hd="vNhan">Nhận</button>';
        if (d.laPhuTrach) nut += '<button type="button" class="b3" data-hd="vMo" data-k="giao">' + (v.nguoi ? 'Đổi người' : 'Giao') + '</button>';
        if (sua) nut += '<button type="button" class="b1" data-hd="vMo" data-k="xong">✓ Xong</button>';
        if (minh) nut += '<button type="button" class="b3" data-hd="vBo">Bỏ nhận</button>';
      } else if (sua) nut += '<button type="button" class="b3" data-hd="vMoLai">Mở lại</button>';
      var form = '';
      if (o.mo[k] === 'giao') form = '<div class="form ca"><label class="rong">Giao cho<select data-f="ten"><option value="">— Chưa giao —</option>' + d.thanhVien.map(function (t) { return '<option' + (t === v.nguoi ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select></label>' +
        '<button type="button" class="b1" data-hd="vGiao">Lưu</button><button type="button" class="b3" data-hd="vDong">Đóng</button></div>';
      if (o.mo[k] === 'xong') form = '<div class="form ca"><label class="rong">' + (v.i === 2 ? 'Link sheet điểm danh (bắt buộc)' : 'Link / ghi chú (không bắt buộc)') + '<input data-f="gc" maxlength="500" value="' + esc(v.ghiChu || '') + '" placeholder="' + (v.i === 0 ? 'Link bài thông báo…' : v.i === 1 ? 'Khu vực, người liên hệ…' : v.i === 2 ? 'https://docs.google.com/…' : 'Số người tham gia, ghi chú…') + '"></label>' +
        '<button type="button" class="b1" data-hd="vXong">Xác nhận xong</button><button type="button" class="b3" data-hd="vDong">Đóng</button></div>';
      return '<div class="vc-i' + (v.xong ? ' xong' : '') + '" data-n="' + c.ngay + '" data-i="' + v.i + '"><span class="dau">' + (v.xong ? '✓' : '○') + '</span>' +
        '<div><span class="tv">' + esc(v.ten) + '</span> · ' + (v.nguoi ? '<span class="ten' + (minh ? ' toi' : '') + '">' + esc(v.nguoi) + '</span>' : '<span class="s">chưa có người nhận</span>') +
        (v.ghiChu ? '<div class="s">' + linkHoa(v.ghiChu) + '</div>' : '') + (v.boi && v.xong ? '<div class="s">' + esc(v.boi) + ' · ' + esc(v.luc) + '</div>' : '') + '</div>' +
        '<div class="nut">' + nut + '</div>' + form + '</div>';
    }).join('') + '</div>';
  }
  function addDays(iso, n) { var p = iso.split('-'); var x = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + n)); return x.toISOString().slice(0, 10); }
  function suKienCnx(o, b) {
    var k = b.dataset.hd, n = b.dataset.n, dong = b.closest('.dong') || b.closest('.yc');
    if (k === 'vc') { o.vc[n] = b.getAttribute('aria-expanded') !== 'true'; o.ve(); return; }
    if (k.charAt(0) === 'v' && k !== 'vc') {
      var it = b.closest('.vc-i'), ng = it.dataset.n, i = +it.dataset.i, mk = 'v:' + ng + ':' + i, vc0 = o.vc[ng];
      var guiV = function (req, tb) { req.ngay = ng; req.i = i; return gui(o, 'luuViecCnXanh', req, it, tb).then(function () { o.vc[ng] = vc0 == null ? true : vc0; o.ve(); }).catch(function () {}); };
      if (k === 'vMo') { o.mo = {}; o.mo[mk] = b.dataset.k; o.vc[ng] = true; o.ve(); return; }
      if (k === 'vDong') { o.mo = {}; o.ve(); return; }
      if (k === 'vNhan') return guiV({ viec: 'nhan' }, 'Đã nhận việc');
      if (k === 'vBo') return guiV({ viec: 'boNhan' }, 'Đã bỏ nhận');
      if (k === 'vMoLai') return guiV({ viec: 'moLai' }, 'Đã mở lại');
      if (k === 'vGiao') return guiV({ viec: 'giao', ten: it.querySelector('[data-f=ten]').value }, 'Đã lưu người làm');
      if (k === 'vXong') {
        var g = it.querySelector('[data-f=gc]').value.trim();
        if (i === 2 && !/^https?:\/\//.test(g)) { bao('Dán link sheet điểm danh (bắt đầu bằng https://).', true); return; }
        return guiV({ viec: 'xong', ghiChu: g }, 'Đã đánh dấu xong');
      }
    }
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
  // Hằng tuần (T5/T6) · hằng tháng (7 ngày cuối) · đợt giữa năm (15–31/5) / cuối năm (15–31/12); đăng ký → duyệt 2 cấp → báo cáo
  var TT2 = { CHO_TN: 'Chờ phụ trách duyệt', CHO_QL: 'Chờ quản lý duyệt', DUYET: 'Đã duyệt', TRA_TN: 'Trả lại', TRA_QL: 'Quản lý trả lại', HUY: 'Đã huỷ' };
  var SO_KK = [['tong', 'Tổng số'], ['tot', 'Tốt'], ['hong', 'Hỏng'], ['mat', 'Mất'], ['moi', 'Mới thêm'], ['thanhLy', 'Thanh lý']];
  function pillTT(tt) {
    var c = tt === 'Đã báo cáo' || tt === 'Đã trả' ? 'p-mo' : tt === TT2.DUYET || tt === 'Đang mượn' || tt === 'Đang cho mượn' ? 'p-info'
      : tt === TT2.CHO_TN || tt === TT2.CHO_QL ? 'p-cho' : tt === TT2.TRA_TN || tt === TT2.TRA_QL ? 'p-bad' : 'p-khoa';
    return '<span class="pill ' + c + '">' + esc(tt) + '</span>';
  }
  function formDuyet(id) {
    return '<div class="form"><label class="rong">Ghi chú (bắt buộc khi trả lại)<input data-f="gcd" maxlength="300" placeholder="Việc cần sửa, lý do…"></label>' +
      '<button type="button" class="b1" data-hd="duyet" data-ok="1" data-t="' + esc(id) + '">Duyệt</button><button type="button" class="b3 do" data-hd="duyet" data-ok="0" data-t="' + esc(id) + '">Trả lại</button></div>';
  }
  function duocDuyet(d, tt) { return (tt === TT2.CHO_TN && (d.laTN || d.laQL)) || (tt === TT2.CHO_QL && d.laQL); }
  function kiemKe(el) {
    var o = khoi(el, 'kk', 'kiemKe', {}, veKk);
    ganSuKien(el, function (b) { suKienKk(o, b); });
  }
  function veKk(o) {
    var d = o.d, toi = d.toi;
    if (!d.loai || !d.loai[0].ky[0] || !d.loai[0].ky[0].chonTu) { o.el.innerHTML = '<div class="hd"><div class="khung trong-k">Máy chủ chưa cập nhật bản kiểm kê mới, tải lại trang sau ít phút.</div></div>'; return; }
    o.loai = o.loai || 'thang';
    var dk = d.laPhuTrach || d.laTN || d.laQL;
    var seg = '<div class="seg" role="group" aria-label="Loại kiểm kê">' + d.loai.map(function (x) {
      var cho = x.ky.filter(function (t) { return duocDuyet(d, t.trangThai); }).length;
      return '<button type="button" data-hd="loai" data-t="' + x.ma + '" aria-pressed="' + (x.ma === o.loai) + '">' + esc(x.ten) + (cho ? ' <span class="dem">' + cho + '</span>' : '') + '</button>'; }).join('') +
      '<button type="button" data-hd="loai" data-t="bd" aria-pressed="' + (o.loai === 'bd') + '">Biểu đồ biến động</button></div>';
    var bb = '<div class="cho" style="margin-top:8px">' + (d.lienKet.bbTuanThang ? '<a class="lk" href="' + esc(d.lienKet.bbTuanThang) + '" target="_blank" rel="noopener">Biên bản tuần / tháng ↗</a>' : '') +
      (d.lienKet.bbNam ? '<a class="lk" href="' + esc(d.lienKet.bbNam) + '" target="_blank" rel="noopener">Biên bản tài sản cố định (năm) ↗</a>' : '') + '</div>';
    var dau = '<div class="khung"><h3>Kiểm kê tài sản</h3><div class="mo-ta">Hằng tuần: thứ 5 hoặc thứ 6, tài sản biến động / dùng thường xuyên · Hằng tháng: tuần cuối tháng, toàn bộ tài sản · ' +
      'Hằng năm: đợt giữa năm (15–31/5) và cuối năm (15–31/12).<br>Phụ trách chính: <b>' + (d.phuTrach.length ? esc(d.phuTrach.join(', ')) : 'chưa ghi') + '</b> · Lịch đăng ký được duyệt 2 cấp (phụ trách chính → quản lý; phụ trách chính tự đăng ký thì gửi thẳng quản lý), đến ngày thì nộp báo cáo kèm link biên bản.</div>' +
      (!d.coTN ? '<div class="canh">Mảng Quản lý CSVC chưa ghi phụ trách chính (tab Mảng công việc), nên lịch gửi thẳng quản lý duyệt.</div>' : '') + bb + seg;
    if (o.loai === 'bd') { o.el.innerHTML = '<div class="hd">' + dau + veBieuDo(d) + '</div></div>'; return; }
    var L = d.loai.filter(function (x) { return x.ma === o.loai; })[0] || d.loai[1];
    var the = function (t) {
      var nd = '';
      if (t.ngay) {
        nd = '<b>' + THU[thu(t.ngay)] + ' ' + dm(t.ngay) + (L.ma === 'nam' ? '/' + t.ngay.slice(0, 4) : '') + '</b> · Thực hiện: ' + t.thucHien.map(function (x) { return '<span class="ten' + (x === toi ? ' toi' : '') + '">' + esc(x) + '</span>'; }).join(' ');
        if (t.ghiChu) nd += '<div class="mo-ta" style="margin-top:4px">' + linkHoa(t.ghiChu) + '</div>';
        if (t.trangThai === TT2.TRA_TN || t.trangThai === TT2.TRA_QL) nd += '<div class="canh">' + esc(t.ghiChuDuyet || 'Bị trả lại') + '</div>';
        else if (t.tnDuyet || t.qlDuyet) nd += '<div class="mo-ta">' + [t.tnDuyet && 'Phụ trách: ' + esc(t.tnDuyet), t.qlDuyet && 'Quản lý: ' + esc(t.qlDuyet)].filter(Boolean).join(' · ') + '</div>';
        if (t.trangThai === 'Đã báo cáo') {
          nd += '<div class="so-kk">' + SO_KK.map(function (k) { var v = t.so && t.so[k[0]]; return v == null ? '' : '<span><b>' + v + '</b> ' + k[1].toLowerCase() + '</span>'; }).join('') + '</div>' +
            (t.bienDong ? '<div style="margin-top:4px;white-space:pre-line">' + esc(t.bienDong) + '</div>' : '') + (t.deXuat ? '<div class="mo-ta">Đề xuất: ' + esc(t.deXuat) + '</div>' : '') +
            '<div class="mo-ta">' + (t.bienBan ? '<a href="' + esc(t.bienBan) + '" target="_blank" rel="noopener">Biên bản ↗</a> · ' : '') + 'Báo cáo bởi ' + esc(t.baoCaoBoi || t.boi) + (t.baoCaoLuc ? ' · ' + esc(t.baoCaoLuc) : '') + '</div>';
        }
      } else nd = '<span class="mo-ta">' + (t.qua ? 'Không có lịch kiểm kê trên dashboard.' : dk ? 'Chưa có lịch. Ngày được chọn: ' + dm(t.chonTu) + ' – ' + dm(t.chonDen) + '.' : 'Chưa đăng ký lịch.') + '</span>';
      var nut = '', tt = t.trangThai;
      if (dk && !t.qua && tt !== 'Đã báo cáo') nut += '<button type="button" class="' + (t.ngay ? 'b3' : 'b1') + '" data-hd="moDk" data-t="' + esc(t.ky) + '">' + (!t.ngay ? 'Đăng ký lịch' : tt === TT2.TRA_TN || tt === TT2.TRA_QL ? 'Sửa & gửi lại' : 'Sửa lịch') + '</button>';
      if (duocDuyet(d, tt)) nut += '<button type="button" class="b1" data-hd="moDuyet" data-t="' + esc(t.ky) + '">Xem & duyệt</button>';
      if (tt === TT2.DUYET && t.ngay <= d.homNay && (dk || t.thucHien.indexOf(toi) > -1)) nut += '<button type="button" class="b1" data-hd="moBc" data-t="' + esc(t.ky) + '">Nộp báo cáo</button>';
      if (tt === 'Đã báo cáo' && dk) nut += '<button type="button" class="b3" data-hd="moLai" data-t="' + esc(t.ky) + '">Mở lại</button>';
      var form = '', m = o.mo[t.ky];
      if (m === 'dk') {
        var mac = t.ngay || (t.chonTu < d.homNay ? (d.homNay <= t.chonDen ? d.homNay : '') : t.chonTu);
        form = '<div class="form"><label>Ngày kiểm kê<input type="date" data-f="ngay" min="' + t.chonTu + '" max="' + t.chonDen + '" value="' + mac + '"></label>' +
          '<div class="ca"><div class="mo-ta" style="margin-bottom:4px">Thành viên thực hiện</div><div class="chon">' + d.thanhVien.map(function (x) {
            return '<label><input type="checkbox" data-f="tv" value="' + esc(x) + '"' + (t.thucHien.indexOf(x) > -1 ? ' checked' : '') + '>' + esc(x) + '</label>'; }).join('') + '</div></div>' +
          '<label class="rong">Ghi chú (khu vực, tài sản cần chú ý…)<input data-f="gc" maxlength="500" value="' + esc(t.ghiChu || '') + '"></label>' +
          '<button type="button" class="b1" data-hd="dk" data-t="' + esc(t.ky) + '">' + (d.laQL ? 'Lưu lịch' : 'Gửi duyệt') + '</button><button type="button" class="b3" data-hd="dong">Đóng</button>' +
          '<span class="mo-ta ca">Chỉ chọn được ' + esc(t.luu) + '. ' + (d.laQL ? 'Quản lý đăng ký thì lịch được duyệt luôn.' : d.laTN || !d.coTN ? 'Lịch gửi quản lý duyệt.' : 'Lịch gửi phụ trách chính duyệt, sau đó đến quản lý.') + '</span></div>';
      }
      if (m === 'duyet') form = formDuyet(t.ky);
      if (m === 'bc') {
        var lk = L.ma === 'nam' ? d.lienKet.bbNam : d.lienKet.bbTuanThang;
        form = '<div class="form"><label class="ca">Link biên bản kiểm kê (sheet) — bắt buộc<input data-f="bb" maxlength="500" value="' + esc(t.bienBan || lk || '') + '" placeholder="https://docs.google.com/spreadsheets/…"></label>' +
          SO_KK.map(function (k) { return '<label>' + k[1] + (k[0] === 'tong' ? ' *' : '') + '<input type="number" min="0" step="1" data-so="' + k[0] + '" style="width:92px" value="' + (t.so && t.so[k[0]] != null ? t.so[k[0]] : '') + '"></label>'; }).join('') +
          '<label class="ca">Tóm tắt biến động<textarea data-f="bd" maxlength="1000" placeholder="Món nào hỏng / mất / mới thêm, ở đâu…">' + esc(t.bienDong || '') + '</textarea></label>' +
          '<label class="ca">Đề xuất (sửa chữa, mua bổ sung…)<input data-f="dx" maxlength="500" value="' + esc(t.deXuat || '') + '"></label>' +
          '<button type="button" class="b1" data-hd="bc" data-t="' + esc(t.ky) + '">Nộp báo cáo</button><button type="button" class="b3" data-hd="dong">Đóng</button></div>';
      }
      var ng = L.ma === 'tuan' ? '<b>' + dm(t.tu) + '</b><span>– ' + dm(t.den) + (t.nay ? ' · tuần này' : '') + '</span>'
        : L.ma === 'thang' ? '<b>T' + (+t.ky.slice(5)) + '/' + t.ky.slice(0, 4) + '</b><span>' + (t.nay ? 'tháng này' : '') + '</span>'
        : '<b>' + (/^Giữa/.test(t.ky) ? 'Giữa năm' : 'Cuối năm') + '</b><span>' + t.ky.slice(-4) + '</span>';
      return '<div class="dong' + (t.qua ? ' qua' : '') + (t.nay ? ' nay' : '') + '"><div class="ng">' + ng + '</div>' +
        '<div><div style="margin-bottom:4px">' + (t.ngay ? pillTT(tt) : t.qua ? '<span class="pill p-khoa">Không có lịch</span>' : '<span class="pill p-khoa">Chưa đăng ký</span>') + '</div>' + nd + '</div>' +
        '<div class="nut">' + nut + '</div>' + form + '</div>';
    };
    var sap = L.ky.filter(function (t) { return !t.qua; }).reverse(), qua = L.ky.filter(function (t) { return t.qua; });
    o.el.innerHTML = '<div class="hd">' + dau + '<div style="margin-top:8px">' + (sap.length ? sap.map(the).join('') : '<div class="trong-k">Không có kỳ sắp tới.</div>') + '</div>' +
      (qua.length ? '<details><summary>Các kỳ trước (' + qua.length + ')</summary>' + qua.map(the).join('') + '</details>' : '') + '</div></div>';
  }
  // Biểu đồ từ số liệu báo cáo: tổng số tài sản (đường) theo từng danh mục + hỏng / mất / mới thêm (cột nhóm) mỗi lần kiểm kê
  function veBieuDo(d) {
    var ds = d.bieuDo || [];
    if (!ds.length) return '<div class="trong-k" style="margin-top:10px">Chưa có báo cáo kiểm kê nào có số liệu. Biểu đồ hiện sau khi nộp báo cáo đầu tiên.</div>';
    var duong = function (ten, pts) {
      if (!pts.length) return '';
      var W = 640, H = 170, l = 40, r = 12, t = 14, b = 26, mx = Math.max.apply(null, pts.map(function (p) { return p.so.tong; })) || 1, mn = Math.min.apply(null, pts.map(function (p) { return p.so.tong; }));
      var lo = Math.max(0, Math.floor(mn * 0.9)), hi = Math.ceil(mx * 1.05) || 1;
      var x = function (i) { return pts.length === 1 ? (l + W - r) / 2 : l + i * (W - l - r) / (pts.length - 1); }, y = function (v) { return t + (H - t - b) * (1 - (v - lo) / ((hi - lo) || 1)); };
      var g = [lo, Math.round((lo + hi) / 2), hi].map(function (v) { return '<line x1="' + l + '" x2="' + (W - r) + '" y1="' + y(v) + '" y2="' + y(v) + '" class="bd-grid"/><text x="' + (l - 6) + '" y="' + (y(v) + 4) + '" class="bd-ax" text-anchor="end">' + v + '</text>'; }).join('');
      var path = pts.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.so.tong).toFixed(1); }).join(' ');
      var dot = pts.map(function (p, i) { return '<g class="bd-pt"><circle cx="' + x(i) + '" cy="' + y(p.so.tong) + '" r="12" fill="transparent"/><circle cx="' + x(i) + '" cy="' + y(p.so.tong) + '" r="4" class="bd-c1"/>' +
        '<title>' + esc(p.nhan) + ' (' + dm(p.ngay) + '): ' + p.so.tong + ' tài sản · hỏng ' + p.so.hong + ' · mất ' + p.so.mat + ' · mới ' + p.so.moi + '</title></g>' +
        (i === 0 || i === pts.length - 1 || pts.length <= 6 ? '<text x="' + x(i) + '" y="' + (H - 8) + '" class="bd-ax" text-anchor="middle">' + dm(p.ngay) + '</text>' : ''); }).join('');
      var cuoi = pts[pts.length - 1];
      return '<div class="bd"><div class="bd-t">' + esc(ten) + ' <span class="mo-ta">· lần gần nhất: <b>' + cuoi.so.tong + '</b> tài sản</span></div>' +
        '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(ten) + '">' + g + '<path d="' + path + '" class="bd-line"/>' + dot + '</svg></div>';
    };
    var cot = function (pts) {
      var W = 640, H = 190, l = 30, r = 8, t = 12, b = 28, mx = 1, S = [['moi', 'Mới thêm', 'bd-c1'], ['hong', 'Hỏng', 'bd-c2'], ['mat', 'Mất', 'bd-c3']];
      pts.forEach(function (p) { S.forEach(function (s) { mx = Math.max(mx, p.so[s[0]] || 0); }); });
      var gw = (W - l - r) / pts.length, bw = Math.min(16, (gw - 10) / 3), y = function (v) { return t + (H - t - b) * (1 - v / mx); };
      var bars = pts.map(function (p, i) {
        var x0 = l + i * gw + (gw - bw * 3 - 4) / 2;
        return S.map(function (s, j) { var v = p.so[s[0]] || 0, yy = y(v), h = H - b - yy;
          return '<g class="bd-pt"><rect x="' + (x0 + j * (bw + 2)) + '" y="' + t + '" width="' + bw + '" height="' + (H - b - t) + '" fill="transparent"/>' +
            (v ? '<path class="' + s[2] + '" d="M' + (x0 + j * (bw + 2)) + ' ' + (H - b) + 'V' + (yy + Math.min(4, h)) + 'q0 -' + Math.min(4, h) + ' ' + Math.min(4, bw / 2) + ' -' + Math.min(4, h) + 'H' + (x0 + j * (bw + 2) + bw - Math.min(4, bw / 2)) + 'q' + Math.min(4, bw / 2) + ' 0 ' + Math.min(4, bw / 2) + ' ' + Math.min(4, h) + 'V' + (H - b) + 'Z"/>' : '') +
            '<title>' + esc(p.nhan) + ' — ' + s[1] + ': ' + v + '</title></g>'; }).join('') +
          (pts.length <= 10 || i % Math.ceil(pts.length / 10) === 0 ? '<text x="' + (l + i * gw + gw / 2) + '" y="' + (H - 9) + '" class="bd-ax" text-anchor="middle">' + dm(p.ngay) + '</text>' : '');
      }).join('');
      return '<div class="bd"><div class="bd-t">Biến động mỗi lần kiểm kê</div><div class="bd-lg">' + S.map(function (s) { return '<span><i class="' + s[2] + '"></i>' + s[1] + '</span>'; }).join('') + '</div>' +
        '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Biến động mỗi lần kiểm kê"><line x1="' + l + '" x2="' + (W - r) + '" y1="' + (H - b) + '" y2="' + (H - b) + '" class="bd-grid"/>' +
        '<text x="' + (l - 6) + '" y="' + (t + 4) + '" class="bd-ax" text-anchor="end">' + mx + '</text>' + bars + '</svg></div>';
    };
    var bang = '<details><summary>Xem dạng bảng</summary><div class="bd-bang"><table><thead><tr><th>Kỳ</th><th>Ngày</th>' + SO_KK.map(function (k) { return '<th>' + k[1] + '</th>'; }).join('') + '</tr></thead><tbody>' +
      ds.slice().reverse().map(function (p) { return '<tr><td>' + esc(p.nhan) + '</td><td>' + dm(p.ngay) + '/' + p.ngay.slice(2, 4) + '</td>' + SO_KK.map(function (k) { return '<td>' + (p.so[k[0]] == null ? '' : p.so[k[0]]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div></details>';
    return '<div style="margin-top:10px">' + duong('Tổng số tài sản kho — kiểm kê hằng tháng', ds.filter(function (p) { return p.loai === 'thang'; })) +
      duong('Tổng số tài sản cố định — đợt giữa năm / cuối năm', ds.filter(function (p) { return p.loai === 'nam'; })) + cot(ds.slice(-16)) + bang +
      '<div class="mo-ta">Kiểm kê hằng tuần chỉ tính các món biến động nên không đưa vào đường tổng số; hỏng / mất / mới thêm của mọi lần kiểm kê đều có trong biểu đồ cột.</div></div>';
  }
  function linkHoa(s) { return esc(s).replace(/(https:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>'); }
  function suKienKk(o, b) {
    var k = b.dataset.hd, t = b.dataset.t, dong = b.closest('.dong');
    if (k === 'loai') { o.loai = t; o.mo = {}; o.ve(); return; }
    if (k === 'moDk' || k === 'moDuyet' || k === 'moBc') { o.mo = {}; o.mo[t] = { moDk: 'dk', moDuyet: 'duyet', moBc: 'bc' }[k]; o.ve(); return; }
    if (k === 'dong') { o.mo = {}; o.ve(); return; }
    if (k === 'dk') {
      var ngay = dong.querySelector('[data-f=ngay]').value, tv = [].map.call(dong.querySelectorAll('[data-f=tv]:checked'), function (x) { return x.value; });
      if (!ngay) { bao('Chọn ngày kiểm kê.', true); return; }
      if (!tv.length) { bao('Chọn ít nhất 1 thành viên thực hiện.', true); return; }
      return gui(o, 'luuKiemKe', { viec: 'dangKy', ky: t, ngay: ngay, thucHien: tv, ghiChu: dong.querySelector('[data-f=gc]').value }, dong, o.d.laQL ? 'Đã lưu lịch kiểm kê' : 'Đã gửi lịch kiểm kê để duyệt').catch(function () {});
    }
    if (k === 'duyet') {
      var ok = b.dataset.ok === '1', gc = dong.querySelector('[data-f=gcd]').value.trim();
      if (!ok && !gc) { bao('Ghi lý do / việc cần sửa khi trả lại.', true); return; }
      return gui(o, 'luuKiemKe', { viec: 'duyet', ky: t, dongY: ok, ghiChu: gc }, dong, ok ? 'Đã duyệt' : 'Đã trả lại').catch(function () {});
    }
    if (k === 'bc') {
      var so = {}; [].forEach.call(dong.querySelectorAll('[data-so]'), function (x) { so[x.dataset.so] = x.value === '' ? '' : +x.value; });
      var bbv = dong.querySelector('[data-f=bb]').value.trim();
      if (!/^https?:\/\//.test(bbv)) { bao('Dán link biên bản kiểm kê (bắt đầu bằng https://).', true); return; }
      if (so.tong === '') { bao('Nhập tổng số tài sản kiểm kê.', true); return; }
      return gui(o, 'luuKiemKe', { viec: 'baoCao', ky: t, bienBan: bbv, so: so, bienDong: dong.querySelector('[data-f=bd]').value, deXuat: dong.querySelector('[data-f=dx]').value }, dong, 'Đã nộp báo cáo kiểm kê').catch(function () {});
    }
    if (k === 'moLai') return gui(o, 'luuKiemKe', { viec: 'moLai', ky: t }, dong, 'Đã mở lại').catch(function () {});
  }


  /* ================= Hiện trạng tài sản ================= */
  function hienTrang(el) {
    var o = khoi(el, 'ht', 'hienTrang', {}, veHt);
    o.loc = o.loc || { q: '', nhom: '', khu: '', chuY: false, tt: '' };
    ganSuKien(el, function (b) { suKienHt(o, b); });
    if (el.dataset.htGan !== '1') {
      el.dataset.htGan = '1';
      el.addEventListener('mousemove', function (e) {
        var t = e.target.closest('[data-tip]'), tip = el.querySelector('.ht-tip'); if (!tip) return;
        if (!t) { tip.hidden = true; return; }
        var r = el.querySelector('.ht-bd').getBoundingClientRect();
        tip.textContent = t.dataset.tip; tip.hidden = false;
        tip.style.left = Math.min(e.clientX - r.left + 12, r.width - tip.offsetWidth - 4) + 'px'; tip.style.top = (e.clientY - r.top + 14) + 'px';
      });
      el.addEventListener('mouseleave', function () { var tip = el.querySelector('.ht-tip'); if (tip) tip.hidden = true; });
      el.addEventListener('input', function (e) { if (e.target.dataset.htl === 'q') { o.loc.q = e.target.value; veBangHt(o); } });
      el.addEventListener('change', function (e) {
        var k = e.target.dataset.htl; if (!k || k === 'q') return;
        o.loc[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; veBangHt(o);
      });
    }
  }
  var RE_HONG = /(^|[^a-zà-ỹ])(hư|hỏng|mất)(?![a-zà-ỹ])/i;
  function chuY(x) {
    return (x.ss != null && x.kk != null && x.kk < x.ss) || RE_HONG.test(x.tinhTrang + ' ' + x.ghiChu) || x.choMuon.length > 0;
  }
  function sumCho(x) { return x.choMuon.reduce(function (a, c) { return a + c.sl; }, 0); }
  function veHt(o) {
    var d = o.d, ds = d.ds, l = o.loc;
    var khus = []; ds.forEach(function (x) { if (khus.indexOf(x.khu) === -1) khus.push(x.khu); });
    var h = '<div class="hd">' + bieuDoHt(o);
    h += '<div class="khung"><div class="ht-loc"><input type="search" data-htl="q" placeholder="Tìm tên tài sản, vị trí, ghi chú…" value="' + esc(l.q) + '" aria-label="Tìm tài sản">' +
      '<select data-htl="nhom" aria-label="Nhóm tài sản"><option value="">Tất cả nhóm</option>' + d.nhom.map(function (x) { return '<option' + (l.nhom === x ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>' +
      '<select data-htl="khu" aria-label="Khu / vị trí"><option value="">Tất cả vị trí</option>' + khus.map(function (x) { return '<option' + (l.khu === x ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>' +
      '<label><input type="checkbox" data-htl="chuY"' + (l.chuY ? ' checked' : '') + '> Chỉ hiện mục cần chú ý</label>' +
      (d.sua ? '<button type="button" class="b2" data-hd="htThem">+ Thêm tài sản</button>' : '') +
      (d.link ? '<a class="lk" href="' + esc(d.link) + '" target="_blank" rel="noopener">Mở sheet hiện trạng</a>' : '') + '</div>' +
      (o.mo.them ? formThemHt(d) : '') +
      '<div class="ht-bang"></div>' +
      '<div class="mo-ta" style="margin-top:8px">Số liệu ban đầu lấy từ biên bản kiểm kê kho tuần/tháng (lần gần nhất 26/05/2026) và biên bản kiểm kê tài sản cố định (21/05/2026). ' +
      (d.sua ? 'Bạn có thể cập nhật số lượng, tình trạng sau mỗi lần kiểm kê.' : 'Phụ trách chính mảng CSVC' + (d.phuTrach.length ? ' (' + esc(d.phuTrach.join(', ')) + ')' : '') + ' cập nhật số lượng, tình trạng.') + '</div></div>';
    if (d.muonVe.length) h += '<div class="khung"><h3>Đồ đang mượn về (không thuộc tài sản văn phòng)</h3>' + d.muonVe.map(function (x) {
      return '<div class="cv-r"><b>' + esc(x.nguon) + '</b><div>' + esc(x.ten) + ' <b>×' + x.sl + '</b><small>' + esc(x.mucDich) + '</small></div><div class="cho">' + (x.hanTra ? 'Hạn trả ' + dmy(x.hanTra) : '') + '</div></div>'; }).join('') + '</div>';
    o.el.innerHTML = h + '</div>';
    veBangHt(o);
  }

  // Trạng thái loại trừ nhau (ưu tiên: cũ > hư/mất > thiếu > đủ) để chia 100%
  var HT_TT = [['du', 'Đủ so với sổ sách', 'ht-du'], ['thieu', 'Ít hơn sổ sách', 'ht-thieu'], ['hong', 'Có ghi nhận hư / mất', 'ht-hong'], ['cu', 'Cũ (hiện có 0)', 'ht-cu']];
  function ttHt(x) {
    if (x.kk === 0) return 'cu';
    if (RE_HONG.test(x.tinhTrang + ' ' + x.ghiChu)) return 'hong';
    if (x.ss != null && x.kk != null && x.kk < x.ss) return 'thieu';
    return 'du';
  }
  function bieuDoHt(o) {
    var ds = o.d.ds, l = o.loc, n = ds.length || 1;
    var dem = {}; HT_TT.forEach(function (t) { dem[t[0]] = 0; }); ds.forEach(function (x) { dem[ttHt(x)]++; });
    var tong = ds.reduce(function (a, x) { return a + (x.kk || 0); }, 0), cho = ds.filter(function (x) { return x.choMuon.length; }).length;
    var tsc = ds.filter(function (x) { return x.nhom === 'Tài sản cố định' && x.kk !== 0; }).length;
    var h = '<div class="khung ht-bd"><div class="ht-so"><div><b>' + (ds.length - dem.cu) + '</b><span>loại tài sản đang có<small>' + tsc + ' tài sản cố định · ' + (ds.length - dem.cu - tsc) + ' đồ trong kho</small></span></div>' +
      '<div><b>' + tong.toLocaleString('vi-VN') + '</b><span>món hiện có<small>theo lần kiểm kê gần nhất</small></span></div>' +
      '<div><b>' + cho + '</b><span>loại đang cho mượn<small>chưa nhận lại</small></span></div></div>';
    h += '<div class="ht-t">Tình trạng ' + ds.length + ' loại tài sản <span>bấm vào một phần để lọc bảng</span></div><div class="ht-chong" role="img" aria-label="' +
      esc(HT_TT.map(function (t) { return t[1] + ': ' + dem[t[0]]; }).join(', ')) + '">' + HT_TT.filter(function (t) { return dem[t[0]]; }).map(function (t) {
        return '<button type="button" class="' + t[2] + (l.tt && l.tt !== t[0] ? ' mo' : '') + '" style="flex-grow:' + dem[t[0]] + '" data-hd="htTT" data-t="' + t[0] + '" data-tip="' + esc(t[1] + ': ' + dem[t[0]] + ' loại (' + Math.round(dem[t[0]] * 100 / n) + '%)') + '" aria-label="' + esc(t[1] + ' ' + dem[t[0]]) + '"></button>'; }).join('') + '</div>' +
      '<div class="ht-chu">' + HT_TT.map(function (t) {
        return '<button type="button" data-hd="htTT" data-t="' + t[0] + '" aria-pressed="' + (l.tt === t[0]) + '"><i class="' + t[2] + '"></i>' + t[1] + ' <b>' + dem[t[0]] + '</b></button>'; }).join('') + '</div>';
    // Theo vị trí: đang có / cũ
    var khu = [], m = {};
    ds.forEach(function (x) { if (!m[x.khu]) { m[x.khu] = { co: 0, cu: 0 }; khu.push(x.khu); } m[x.khu][x.kk === 0 ? 'cu' : 'co']++; });
    var max = Math.max.apply(null, khu.map(function (k) { return m[k].co + m[k].cu; }).concat([1]));
    h += '<div class="ht-t" style="margin-top:16px">Số loại tài sản theo vị trí <span>bấm để lọc</span></div><div class="ht-lg"><span><i class="ht-co"></i>Đang có</span><span><i class="ht-cu"></i>Cũ (hiện có 0)</span></div><div class="ht-khu">' +
      khu.map(function (k) {
        var c = m[k], t = c.co + c.cu;
        return '<button type="button" class="ht-kr' + (l.khu && l.khu !== k ? ' mo' : '') + '" data-hd="htKhu" data-t="' + esc(k) + '" data-tip="' + esc(k + ': ' + c.co + ' đang có' + (c.cu ? ', ' + c.cu + ' cũ' : '')) + '">' +
          '<span class="ht-kt">' + esc(k) + '</span><span class="ht-kb"><span class="ht-kv" style="width:' + (t * 100 / max) + '%">' +
          (c.co ? '<i class="ht-co" style="flex-grow:' + c.co + '"></i>' : '') + (c.cu ? '<i class="ht-cu" style="flex-grow:' + c.cu + '"></i>' : '') + '</span><em>' + t + '</em></span></button>';
      }).join('') + '</div>';
    return h + '<div class="ht-tip" hidden></div></div>';
  }
  function locHt(o) {
    var l = o.loc, q = l.q.trim().toLowerCase();
    return o.d.ds.filter(function (x) {
      if (l.nhom && x.nhom !== l.nhom) return false;
      if (l.khu && x.khu !== l.khu) return false;
      if (l.chuY && !chuY(x)) return false;
      if (l.tt && ttHt(x) !== l.tt) return false;
      return !q || (x.ten + ' ' + x.khu + ' ' + x.lop + ' ' + x.tang + ' ' + x.ghiChu + ' ' + x.tinhTrang).toLowerCase().indexOf(q) > -1;
    });
  }
  function veBangHt(o) {
    var box = o.el.querySelector('.ht-bang'); if (!box) return;
    var d = o.d, ds = locHt(o);
    if (!ds.length) { box.innerHTML = '<div class="trong-k">Không có tài sản nào khớp bộ lọc.</div>'; return; }
    var cot = d.sua ? 8 : 7, khu = null, h = '<table><thead><tr><th>Tài sản</th><th class="an-dd">ĐVT</th><th class="so">Sổ sách</th><th class="so">Hiện có</th><th class="so">Chênh lệch</th><th>Tình trạng</th><th class="an-dd">Đang cho mượn</th>' + (d.sua ? '<th></th>' : '') + '</tr></thead><tbody>';
    var con = ds.filter(function (x) { return x.kk !== 0; }), cu = ds.filter(function (x) { return x.kk === 0; });
    function dong(x, cu) {
      var h = '';
      var vt = [cu ? x.khu : '', x.lop ? 'Lớp ' + x.lop : '', x.tang].filter(String).join(' · ');
      var cl = x.ss != null && x.kk != null ? x.kk - x.ss : null;
      var tt = x.tinhTrang ? '<span class="pill ' + (RE_HONG.test(x.tinhTrang) ? 'p-bad' : x.tinhTrang === 'Không còn sử dụng' ? 'p-khoa' : 'p-mo') + '">' + esc(x.tinhTrang) + '</span>' : '';
      var cm = x.choMuon.map(function (c) { return esc(c.donVi) + ' <b>×' + c.sl + '</b>' + (c.hanTra ? ' <span class="vt">hạn ' + dmy(c.hanTra) + '</span>' : ''); }).join('<br>');
      h += '<tr><td><b>' + esc(x.ten) + '</b>' + (vt ? '<span class="vt">' + esc(vt) + '</span>' : '') + '</td><td class="an-dd">' + esc(x.dvt) + '</td>' +
        '<td class="so">' + (x.ss == null ? '—' : x.ss) + '</td><td class="so"><b>' + (x.kk == null ? '—' : x.kk) + '</b>' + (x.ngay && /^\d{4}-/.test(x.ngay) ? '<span class="vt">' + dmy(x.ngay) + '</span>' : '') + '</td>' +
        '<td class="so">' + (cl == null || cl === 0 ? '<span class="vt">0</span>' : '<span class="' + (cl < 0 ? 'am' : 'duong') + '">' + (cl > 0 ? '+' : '−') + Math.abs(cl) + '</span>') + '</td>' +
        '<td>' + tt + (x.ghiChu ? '<span class="gc">' + esc(x.ghiChu) + '</span>' : '') + (x.boi && x.boi !== 'Biên bản kiểm kê' ? '<span class="gc">Cập nhật: ' + esc(x.boi) + (x.luc ? ' · ' + esc(x.luc) : '') + '</span>' : '') + '</td>' +
        '<td class="an-dd">' + (cm || '<span class="vt">—</span>') + '</td>' +
        (d.sua ? '<td><button type="button" class="b3" data-hd="htSua" data-t="' + esc(x.ma) + '">Sửa</button></td>' : '') + '</tr>';
      if (d.sua && o.mo.sua === x.ma) h += '<tr class="sua-r"><td colspan="' + cot + '"><div class="form" data-ma="' + esc(x.ma) + '">' +
        '<label>Hiện có<input type="number" min="0" step="1" data-f="kk" value="' + (x.kk == null ? '' : x.kk) + '"></label>' +
        '<label>Sổ sách<input type="number" min="0" step="1" data-f="ss" value="' + (x.ss == null ? '' : x.ss) + '"></label>' +
        '<label>Tình trạng<select data-f="tt"><option value="">—</option>' + d.tinhTrang.map(function (t) { return '<option' + (x.tinhTrang === t ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select></label>' +
        '<label class="rong">Ghi chú<input data-f="gc" maxlength="500" value="' + esc(x.ghiChu) + '"></label>' +
        '<button type="button" class="b1" data-hd="htLuu" data-t="' + esc(x.ma) + '">Lưu</button><button type="button" class="b3" data-hd="htDong">Đóng</button></div></td></tr>';
      return h;
    }
    con.forEach(function (x) {
      if (x.khu !== khu) { khu = x.khu; h += '<tr class="khu"><td colspan="' + cot + '">' + esc(khu) + '</td></tr>'; }
      h += dong(x, false);
    });
    if (cu.length) {
      h += '<tr class="khu cu"><td colspan="' + cot + '">Cũ / không còn (hiện có = 0) · ' + cu.length + ' mục</td></tr>';
      cu.forEach(function (x) { h += dong(x, true); });
    }
    box.innerHTML = h + '</tbody></table>';
  }
  function formThemHt(d) {
    return '<div class="form" data-form="htThem" style="margin-bottom:10px"><label>Nhóm<select data-f="nhom">' + d.nhom.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('') + '</select></label>' +
      '<label class="rong">Tên tài sản *<input data-f="ten" maxlength="150"></label>' +
      '<label>Khu / vị trí *<input data-f="khu" maxlength="120" list="htKhu" placeholder="Khu A, Tủ sắt 8 hộc…"></label>' +
      '<datalist id="htKhu">' + d.ds.map(function (x) { return x.khu; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist>' +
      '<label>Lớp<input data-f="lop" maxlength="30" style="width:70px"></label><label>Tầng / Ô<input data-f="tang" maxlength="80" style="width:120px"></label>' +
      '<label>ĐVT<input data-f="dvt" maxlength="20" value="Cái" style="width:80px"></label><label>Số lượng *<input type="number" min="0" step="1" data-f="kk" style="width:90px"></label>' +
      '<label>Tình trạng<select data-f="tt">' + d.tinhTrang.map(function (t) { return '<option>' + esc(t) + '</option>'; }).join('') + '</select></label>' +
      '<label class="rong">Ghi chú<input data-f="gc" maxlength="500"></label>' +
      '<button type="button" class="b1" data-hd="htThemLuu">Thêm</button><button type="button" class="b3" data-hd="htDong">Đóng</button></div>';
  }
  function suKienHt(o, b) {
    var k = b.dataset.hd;
    if (k === 'htTT') { o.loc.tt = o.loc.tt === b.dataset.t ? '' : b.dataset.t; o.ve(); return; }
    if (k === 'htKhu') { o.loc.khu = o.loc.khu === b.dataset.t ? '' : b.dataset.t; o.ve(); return; }
    if (k === 'htThem') { o.mo = { them: true }; o.ve(); return; }
    if (k === 'htDong') { o.mo = {}; o.ve(); return; }
    if (k === 'htSua') { o.mo = { sua: b.dataset.t }; veBangHt(o); return; }
    var f = b.closest('.form'), v = function (n) { var e = f.querySelector('[data-f=' + n + ']'); return e ? e.value.trim() : ''; };
    if (k === 'htLuu') return gui(o, 'luuHienTrang', { viec: 'sua', ma: b.dataset.t, kk: v('kk'), ss: v('ss'), tinhTrang: v('tt'), ghiChu: v('gc') }, f, 'Đã cập nhật').catch(function () {});
    if (k === 'htThemLuu') {
      if (!v('ten') || !v('khu') || v('kk') === '') { bao('Nhập tên, vị trí và số lượng.', true); return; }
      return gui(o, 'luuHienTrang', { viec: 'them', nhom: v('nhom'), ten: v('ten'), khu: v('khu'), lop: v('lop'), tang: v('tang'), dvt: v('dvt'), kk: v('kk'), tinhTrang: v('tt'), ghiChu: v('gc') }, f, 'Đã thêm tài sản').catch(function () {});
    }
  }

  /* ================= Cơ sở vật chất: Hiện trạng · Kiểm kê · Mượn về · Cho mượn ================= */
  var CSVC_TAB = [['ht', 'Hiện trạng tài sản'], ['kk', 'Kiểm kê tài sản'], ['ve', 'Mượn về'], ['cho', 'Cho mượn']];
  function csvc(el) {
    var tab = 'ht'; try { tab = sessionStorage.getItem('bdv.csvcTab') || 'ht'; } catch (e) {}
    var ve = function () {
      el.innerHTML = '<div class="hd"><div class="seg seg-to" role="tablist" aria-label="Cơ sở vật chất">' + CSVC_TAB.map(function (x) {
        return '<button type="button" role="tab" data-csvc="' + x[0] + '" aria-selected="' + (x[0] === tab) + '" aria-pressed="' + (x[0] === tab) + '">' + x[1] + '</button>'; }).join('') + '</div></div><div class="csvc-body"></div>';
      var body = el.querySelector('.csvc-body');
      if (tab === 'ht') hienTrang(body); else if (tab === 'kk') kiemKe(body); else muonTra(body, tab);
    };
    if (el.dataset.csvcGan !== '1') {
      el.dataset.csvcGan = '1';
      el.addEventListener('click', function (e) { var b = e.target.closest('button[data-csvc]'); if (!b) return; tab = b.dataset.csvc; try { sessionStorage.setItem('bdv.csvcTab', tab); } catch (er) {} ve(); });
    }
    ve();
  }
  function doRow(x, i) {
    return '<div class="do-r"><input data-f="dten" list="dmTS" maxlength="120" placeholder="Tên đồ (gõ để chọn trong danh mục)" value="' + esc(x.ten || '') + '">' +
      '<input data-f="dsl" type="number" min="1" step="1" value="' + (x.sl || 1) + '" aria-label="Số lượng">' +
      '<button type="button" class="b3" data-hd="boDo" data-i="' + i + '" aria-label="Bỏ món này">×</button></div>';
  }
  function docDo(f) { return [].map.call(f.querySelectorAll('.do-r'), function (r) { return { ten: r.querySelector('[data-f=dten]').value.trim(), sl: +r.querySelector('[data-f=dsl]').value }; }).filter(function (x) { return x.ten; }); }
  function chuoiDo(ds) { return ds.map(function (x) { return esc(x.ten) + ' <b>×' + x.sl + '</b>'; }).join(' · '); }
  function dmy(iso) { return iso ? dm(iso) + '/' + iso.slice(0, 4) : '—'; }
  function muonTra(el, kieu) {
    var o = khoi(el, 'mt', 'muonTra', {}, function (oo) { veMt(oo, kieu); });
    o.kieu = kieu;
    ganSuKien(el, function (b) { suKienMt(o, b); });
  }
  function veMt(o, kieu) {
    var d = o.d, toi = d.toi, laTV = d.laThanhVien || d.laQL, f = o.mo.form;
    var dl = '<datalist id="dmTS">' + d.danhMuc.map(function (x) { return '<option value="' + esc(x.ten) + '">' + esc(x.loai + ' · ' + x.sl + ' ' + x.dvt + (x.viTri ? ' · ' + x.viTri : '')) + '</option>'; }).join('') + '</datalist>';
    var tv = function (ten, chon) { return '<select data-f="' + ten + '">' + d.thanhVien.map(function (x) { return '<option' + (x === chon ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>'; };
    var ds = kieu === 've' ? d.muonVe : d.choMuon, html = '';
    if (kieu === 've') {
      var formVe = f === 'moi' ? '<div class="form" data-form="ve"><label>Nguồn<select data-f="nguon">' + d.nguon.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('') + '</select></label>' +
        '<label class="rong">Chương trình / mục đích *<input data-f="md" maxlength="300" placeholder="Ví dụ: Ngày hội Tân sinh viên"></label>' +
        '<label class="ca">Link giấy đề nghị (bắt buộc khi mượn Phòng Tổ chức - Hành chính)<input data-f="gdn" maxlength="500" placeholder="https://drive.google.com/…"></label>' +
        '<label class="rong">Người liên hệ bên cho mượn (bắt buộc với KTX)<input data-f="lh" maxlength="120"></label><label>SĐT liên hệ<input data-f="sdt" maxlength="30" inputmode="tel"></label>' +
        '<label>Người đi mượn' + tv('nguoi', toi) + '</label><label>Ngày mượn<input type="date" data-f="ngay" value="' + d.homNay + '"></label><label>Hạn trả<input type="date" data-f="han"></label>' +
        '<div class="ca"><div class="mo-ta" style="margin-bottom:4px">Danh sách đồ mượn *</div><div class="do-ds">' + doRow({}, 0) + '</div><button type="button" class="b2" data-hd="themDo">+ Thêm món</button></div>' +
        '<label class="ca">Ghi chú<input data-f="gc" maxlength="500"></label>' +
        '<button type="button" class="b1" data-hd="taoVe">Lưu lượt mượn</button><button type="button" class="b3" data-hd="dong">Đóng</button></div>' : '';
      var dong = function (x) {
        var nut = '', m = o.mo[x.id];
        if (x.trangThai === 'Đang mượn' && laTV) nut = '<button type="button" class="b1" data-hd="moTra" data-t="' + esc(x.id) + '">Ghi đã trả</button>' +
          ((x.boi === toi || x.nguoiMuon === toi || d.laQL) ? '<button type="button" class="b3" data-hd="huyVe" data-t="' + esc(x.id) + '">Huỷ</button>' : '');
        var form = m === 'tra' ? '<div class="form"><label>Ngày trả<input type="date" data-f="ngay" value="' + d.homNay + '"></label><label>Người trả' + tv('nguoi', toi) + '</label>' +
          '<label>Tình trạng<select data-f="tt"><option>Đủ, bình thường</option><option>Thiếu</option><option>Có món hư hỏng</option></select></label>' +
          '<label class="rong">Ghi chú (món thiếu / hỏng…)<input data-f="gc" maxlength="300"></label>' +
          '<button type="button" class="b1" data-hd="tra" data-t="' + esc(x.id) + '">Xác nhận đã trả</button><button type="button" class="b3" data-hd="dong">Đóng</button></div>' : '';
        return '<div class="dong' + (x.trangThai !== 'Đang mượn' ? ' qua' : '') + '"><div class="ng"><b>' + dm(x.ngayMuon) + '</b><span>→ ' + dm(x.hanTra) + '</span></div>' +
          '<div><div style="margin-bottom:4px">' + pillTT(x.trangThai) + (x.quaHan ? ' <span class="pill p-bad">Quá hạn trả</span>' : '') + ' <span class="mo-ta">' + esc(x.nguon) + '</span></div>' +
          '<b>' + esc(x.mucDich) + '</b><div style="margin-top:3px">' + chuoiDo(x.do) + '</div>' +
          '<div class="mo-ta">Người mượn: ' + esc(x.nguoiMuon) + (x.lienHe ? ' · liên hệ: ' + esc(x.lienHe) + (x.sdt ? ' (' + esc(x.sdt) + ')' : '') : '') + (x.gdn ? ' · <a href="' + esc(x.gdn) + '" target="_blank" rel="noopener">giấy đề nghị ↗</a>' : '') + '</div>' +
          (x.trangThai === 'Đã trả' ? '<div class="mo-ta">Đã trả ' + dmy(x.ngayTra) + ' · ' + esc(x.nguoiTra) + ' · ' + esc(x.tinhTrang) + '</div>' : '') + (x.ghiChu ? '<div class="mo-ta">' + linkHoa(x.ghiChu) + '</div>' : '') +
          '</div><div class="nut">' + nut + '</div>' + form + '</div>';
      };
      var dang = ds.filter(function (x) { return x.trangThai === 'Đang mượn'; }), cu = ds.filter(function (x) { return x.trangThai !== 'Đang mượn'; });
      html = '<div class="khung"><h3>Mượn về — Ban mượn tài sản của đơn vị khác</h3><div class="mo-ta">Mượn Phòng Tổ chức - Hành chính cho chương trình: kèm giấy đề nghị. Mượn thêm dụng cụ ở Ký túc xá: không có giấy tờ, ghi rõ người liên hệ và SĐT. Trả xong thì ghi tình trạng khi trả.</div>' +
        (laTV && f !== 'moi' ? '<div style="margin-top:8px"><button type="button" class="b1" data-hd="moMoi">+ Ghi lượt mượn</button></div>' : '') + formVe +
        '<div style="margin-top:8px">' + (dang.length ? dang.map(dong).join('') : '<div class="trong-k">Không có đồ nào đang mượn.</div>') + '</div>' +
        (cu.length ? '<details><summary>Đã trả / đã huỷ (' + cu.length + ')</summary>' + cu.map(dong).join('') + '</details>' : '') + '</div>';
    } else {
      var sua = f && f !== 'moi' ? ds.filter(function (x) { return x.id === f; })[0] : null, v0 = sua || {};
      var formCho = f ? '<div class="form" data-form="cho"><label class="rong">Đơn vị mượn *<input data-f="dv" maxlength="150" value="' + esc(v0.donVi || '') + '" placeholder="CLB, Liên chi đoàn, phòng ban…"></label>' +
        '<label class="rong">Người đại diện *<input data-f="dd" maxlength="120" value="' + esc(v0.daiDien || '') + '"></label><label>SĐT<input data-f="sdt" maxlength="30" inputmode="tel" value="' + esc(v0.sdt || '') + '"></label>' +
        '<label class="ca">Mục đích *<input data-f="md" maxlength="300" value="' + esc(v0.mucDich || '') + '"></label>' +
        '<label class="ca">Link giấy đề nghị của đơn vị mượn *<input data-f="gdn" maxlength="500" value="' + esc(v0.gdn || '') + '" placeholder="https://drive.google.com/…"></label>' +
        '<label>Ngày giao dự kiến<input type="date" data-f="ngay" value="' + (v0.ngayGiaoDk || d.homNay) + '"></label><label>Hạn trả<input type="date" data-f="han" value="' + (v0.hanTra || '') + '"></label>' +
        '<div class="ca"><div class="mo-ta" style="margin-bottom:4px">Danh sách đồ cho mượn *</div><div class="do-ds">' + ((v0.do && v0.do.length ? v0.do : [{}]).map(doRow).join('')) + '</div><button type="button" class="b2" data-hd="themDo">+ Thêm món</button></div>' +
        '<label class="ca">Ghi chú<input data-f="gc" maxlength="500" value="' + esc(v0.ghiChu || '') + '"></label>' +
        '<button type="button" class="b1" data-hd="taoCho" data-t="' + esc(sua ? sua.id : '') + '">' + (d.laQL ? 'Lưu (duyệt luôn)' : 'Gửi duyệt') + '</button><button type="button" class="b3" data-hd="dong">Đóng</button>' +
        '<span class="mo-ta ca">' + (d.laQL ? 'Quản lý tạo thì yêu cầu được duyệt luôn.' : d.laTN || !d.coTN ? 'Yêu cầu gửi quản lý duyệt.' : 'Yêu cầu gửi phụ trách chính mảng CSVC duyệt, sau đó đến quản lý.') + '</span></div>' : '';
      var dongC = function (x) {
        var nut = '', m = o.mo[x.id], tt = x.trangThai;
        if (duocDuyet(d, tt)) nut += '<button type="button" class="b1" data-hd="moDuyetC" data-t="' + esc(x.id) + '">Xem & duyệt</button>';
        if ((tt === TT2.TRA_TN || tt === TT2.TRA_QL) && (x.nguoiTao === toi || d.laTN || d.laPhuTrach || d.laQL)) nut += '<button type="button" class="b1" data-hd="moSua" data-t="' + esc(x.id) + '">Sửa & gửi lại</button>';
        if (tt === TT2.DUYET && laTV) nut += '<button type="button" class="b1" data-hd="moGiao" data-t="' + esc(x.id) + '">Ghi đã giao</button>';
        if (tt === 'Đang cho mượn' && laTV) nut += '<button type="button" class="b1" data-hd="moNhan" data-t="' + esc(x.id) + '">Ghi đã nhận lại</button>';
        if ([TT2.CHO_TN, TT2.CHO_QL, TT2.TRA_TN, TT2.TRA_QL, TT2.DUYET].indexOf(tt) > -1 && (x.nguoiTao === toi || d.laQL)) nut += '<button type="button" class="b3" data-hd="huyCho" data-t="' + esc(x.id) + '">Huỷ</button>';
        var form = m === 'duyet' ? formDuyet(x.id)
          : m === 'giao' || m === 'nhan' ? '<div class="form"><label>' + (m === 'giao' ? 'Ngày giao' : 'Ngày nhận lại') + '<input type="date" data-f="ngay" value="' + d.homNay + '"></label>' +
            '<label class="rong">' + (m === 'giao' ? 'Tình trạng lúc giao' : 'Tình trạng khi trả *') + '<input data-f="tt" maxlength="300" value="' + (m === 'giao' ? 'Bình thường' : '') + '" placeholder="Đủ, bình thường / thiếu… / hỏng…"></label>' +
            '<button type="button" class="b1" data-hd="' + m + '" data-t="' + esc(x.id) + '">Xác nhận</button><button type="button" class="b3" data-hd="dong">Đóng</button></div>' : '';
        var xong = tt === 'Đã trả' || tt === TT2.HUY;
        return '<div class="dong' + (xong ? ' qua' : '') + '"><div class="ng"><b>' + dm(x.ngayGiao || x.ngayGiaoDk) + '</b><span>→ ' + dm(x.hanTra) + '</span></div>' +
          '<div><div style="margin-bottom:4px">' + pillTT(tt) + (x.quaHan ? ' <span class="pill p-bad">Quá hạn trả</span>' : '') + '</div>' +
          '<b>' + esc(x.donVi) + '</b> · ' + esc(x.daiDien) + (x.sdt ? ' (' + esc(x.sdt) + ')' : '') + ' · ' + esc(x.mucDich) +
          '<div style="margin-top:3px">' + chuoiDo(x.do) + '</div>' +
          '<div class="mo-ta">' + (x.gdn ? '<a href="' + esc(x.gdn) + '" target="_blank" rel="noopener">Giấy đề nghị ↗</a> · ' : '') + 'Tạo bởi ' + esc(x.nguoiTao) + ' · ' + esc(x.luc) + '</div>' +
          ((tt === TT2.TRA_TN || tt === TT2.TRA_QL) ? '<div class="canh">' + esc(x.ghiChuDuyet || 'Bị trả lại') + '</div>'
            : (x.tnDuyet || x.qlDuyet) ? '<div class="mo-ta">' + [x.tnDuyet && 'Phụ trách: ' + esc(x.tnDuyet), x.qlDuyet && 'Quản lý: ' + esc(x.qlDuyet)].filter(Boolean).join(' · ') + '</div>' : '') +
          (x.ngayGiao ? '<div class="mo-ta">Đã giao ' + dmy(x.ngayGiao) + ' · ' + esc(x.nguoiGiao) + ' · ' + esc(x.tinhTrangGiao) + '</div>' : '') +
          (x.ngayNhan ? '<div class="mo-ta">Đã nhận lại ' + dmy(x.ngayNhan) + ' · ' + esc(x.nguoiNhan) + ' · ' + esc(x.tinhTrang) + '</div>' : '') +
          '</div><div class="nut">' + nut + '</div>' + form + '</div>';
      };
      var nhom = [['Cần duyệt', function (x) { return x.trangThai === TT2.CHO_TN || x.trangThai === TT2.CHO_QL; }], ['Bị trả lại', function (x) { return x.trangThai === TT2.TRA_TN || x.trangThai === TT2.TRA_QL; }],
        ['Đã duyệt, chờ giao', function (x) { return x.trangThai === TT2.DUYET; }], ['Đang cho mượn', function (x) { return x.trangThai === 'Đang cho mượn'; }]];
      var cu2 = ds.filter(function (x) { return x.trangThai === 'Đã trả' || x.trangThai === TT2.HUY; });
      html = '<div class="khung"><h3>Cho mượn — đơn vị khác mượn tài sản của Ban</h3><div class="mo-ta">Đơn vị mượn phải có giấy đề nghị. Yêu cầu được duyệt 2 cấp (phụ trách chính → quản lý) rồi mới giao đồ; khi nhận lại ghi tình trạng.' +
        (d.truongNhom.length ? ' Phụ trách chính duyệt cấp 1: <b>' + esc(d.truongNhom.join(', ')) + '</b>.' : '') + '</div>' +
        (laTV && !f ? '<div style="margin-top:8px"><button type="button" class="b1" data-hd="moMoi">+ Tạo yêu cầu cho mượn</button></div>' : '') + (f === 'moi' ? formCho : '') +
        nhom.map(function (g) { var a = ds.filter(g[1]); return a.length ? '<div class="nhom-t">' + g[0] + ' (' + a.length + ')</div>' + a.map(function (x) { return dongC(x) + (sua && sua.id === x.id ? formCho : ''); }).join('') : ''; }).join('') +
        (ds.length - cu2.length ? '' : '<div class="trong-k">Không có yêu cầu cho mượn nào đang mở.</div>') +
        (cu2.length ? '<details><summary>Đã trả / đã huỷ (' + cu2.length + ')</summary>' + cu2.map(dongC).join('') + '</details>' : '') + '</div>';
    }
    o.el.innerHTML = '<div class="hd">' + dl + html + (d.link ? '<div class="mo-ta" style="margin:-4px 0 10px"><a href="' + esc(d.link) + '" target="_blank" rel="noopener">Mở sheet mượn trả ↗</a> · danh mục tài sản ở tab đầu của sheet này.</div>' : '') + '</div>';
  }
  function suKienMt(o, b) {
    var k = b.dataset.hd, t = b.dataset.t, dong = b.closest('.dong') || b.closest('.form'), d = o.d;
    var q = function (sel) { var x = (b.closest('.form') || dong).querySelector('[data-f=' + sel + ']'); return x ? x.value.trim() : ''; };
    if (k === 'moMoi') { o.mo = { form: 'moi' }; o.ve(); return; }
    if (k === 'moSua') { o.mo = { form: t }; o.ve(); return; }
    if (k === 'dong') { o.mo = {}; o.ve(); return; }
    if (k === 'themDo') { var w = b.parentNode.querySelector('.do-ds'); w.insertAdjacentHTML('beforeend', doRow({}, w.children.length)); w.lastChild.querySelector('input').focus(); return; }
    if (k === 'boDo') { var r = b.closest('.do-r'); if (r.parentNode.children.length > 1) r.remove(); else r.querySelector('input').value = ''; return; }
    var m = { moTra: 'tra', moDuyetC: 'duyet', moGiao: 'giao', moNhan: 'nhan' }[k];
    if (m) { o.mo = {}; o.mo[t] = m; o.ve(); return; }
    var fm = b.closest('.form');
    if (k === 'taoVe') {
      var dsDo = docDo(fm);
      if (!q('md')) { bao('Ghi chương trình / mục đích mượn.', true); return; }
      if (!dsDo.length) { bao('Thêm ít nhất 1 món đồ.', true); return; }
      if (!q('han')) { bao('Chọn hạn trả.', true); return; }
      return gui(o, 'luuMuonVe', { viec: 'tao', nguon: q('nguon'), mucDich: q('md'), gdn: q('gdn'), lienHe: q('lh'), sdt: q('sdt'), nguoiMuon: q('nguoi'), ngayMuon: q('ngay'), hanTra: q('han'), do: dsDo, ghiChu: q('gc') }, fm, 'Đã ghi lượt mượn').catch(function () {});
    }
    if (k === 'tra') return gui(o, 'luuMuonVe', { viec: 'tra', id: t, ngayTra: q('ngay'), nguoiTra: q('nguoi'), tinhTrang: q('tt') + (q('gc') ? ' — ' + q('gc') : ''), ghiChu: '' }, dong, 'Đã ghi trả đồ').catch(function () {});
    if (k === 'huyVe' || k === 'huyCho') {
      if (b.dataset.chac !== '1') { b.dataset.chac = '1'; b.textContent = 'Bấm lần nữa để huỷ'; setTimeout(function () { if (b.isConnected) { b.dataset.chac = ''; b.textContent = 'Huỷ'; } }, 3500); return; }
      return gui(o, k === 'huyVe' ? 'luuMuonVe' : 'luuChoMuon', { viec: 'huy', id: t }, dong, 'Đã huỷ').catch(function () {});
    }
    if (k === 'taoCho') {
      var dsC = docDo(fm);
      if (!q('dv') || !q('dd')) { bao('Ghi đơn vị mượn và người đại diện.', true); return; }
      if (!/^https?:\/\//.test(q('gdn'))) { bao('Dán link giấy đề nghị của đơn vị mượn.', true); return; }
      if (!dsC.length) { bao('Thêm ít nhất 1 món đồ.', true); return; }
      if (!q('han')) { bao('Chọn hạn trả.', true); return; }
      return gui(o, 'luuChoMuon', { viec: 'tao', id: t || '', donVi: q('dv'), daiDien: q('dd'), sdt: q('sdt'), mucDich: q('md'), gdn: q('gdn'), ngayGiaoDk: q('ngay'), hanTra: q('han'), do: dsC, ghiChu: q('gc') },
        fm, d.laQL ? 'Đã lưu yêu cầu cho mượn' : 'Đã gửi yêu cầu để duyệt').catch(function () {});
    }
    if (k === 'duyet') {
      var ok = b.dataset.ok === '1', gc = q('gcd');
      if (!ok && !gc) { bao('Ghi lý do / việc cần sửa khi trả lại.', true); return; }
      return gui(o, 'luuChoMuon', { viec: 'duyet', id: t, dongY: ok, ghiChu: gc }, dong, ok ? 'Đã duyệt' : 'Đã trả lại').catch(function () {});
    }
    if (k === 'giao') return gui(o, 'luuChoMuon', { viec: 'giao', id: t, ngay: q('ngay'), tinhTrang: q('tt') }, dong, 'Đã ghi giao đồ').catch(function () {});
    if (k === 'nhan') {
      if (!q('tt')) { bao('Ghi tình trạng khi nhận lại.', true); return; }
      return gui(o, 'luuChoMuon', { viec: 'nhanLai', id: t, ngay: q('ngay'), tinhTrang: q('tt') }, dong, 'Đã ghi nhận lại đồ').catch(function () {});
    }
  }

  /* ================= Công văn (chỉ xem — việc lưu làm trên Google Sheet) ================= */
  function congVan(el) {
    var o = khoi(el, 'cv', 'congVan', {}, veCv);
    ganSuKien(el, function (b) {
      if (b.dataset.hd === 'cvLoai') { o.loai = b.dataset.t; o.ve(); }
      if (b.dataset.hd === 'cvLoc') { o.loc = b.dataset.t; o.ve(); }
      if (b.dataset.hd === 'cvPdf') { o.hetPdf = !o.hetPdf; o.ve(); }
      if (b.dataset.hd === 'vcv') {
        var ok = b.dataset.x !== '1';
        gui(o, 'luuViecCongVan', { ngay: b.dataset.n, ten: b.dataset.ten, loai: b.dataset.l, xong: ok, ve: 'congVan' }, b.closest('.cv-r'), ok ? 'Đã đánh dấu đã lưu' : 'Đã bỏ đánh dấu').catch(function () {});
      }
    });
  }
  function soCv(n) { return n < 10 ? '0' + n : String(n); }
  // Việc lưu công văn theo ca trực: mỗi ngày trực của người có tên trong mảng lưu công văn đi / đến
  function veCaTruc(o) {
    var d = o.d, ds = d.caTruc || [];
    if (d.loiCaTruc) return '<div class="khung"><h3>Lưu công văn theo ca trực</h3><div class="canh">' + esc(d.loiCaTruc) + '</div></div>';
    var nut = function (v, l) {
      var can = l === 'di' ? v.canDi : v.canDen, xong = l === 'di' ? v.xongDi : v.xongDen, ten = l === 'di' ? 'đi' : 'đến';
      if (!can) return '';
      var duoc = !(v.ngay > d.homNay) && (v.ten === d.toi || d.laQLCv);
      return duoc ? '<button type="button" class="' + (xong ? 'b3' : 'b2') + '" data-hd="vcv" data-n="' + v.ngay + '" data-ten="' + esc(v.ten) + '" data-l="' + l + '" data-x="' + (xong ? 1 : 0) + '">' + (xong ? '✓ Đã lưu CV ' + ten : 'Lưu CV ' + ten) + '</button>'
        : '<span class="pill ' + (xong ? 'p-mo' : v.qua ? 'p-bad' : 'p-khoa') + '">' + (xong ? '✓ ' : '') + 'CV ' + ten + '</span>';
    };
    var sap = ds.filter(function (v) { return !v.qua; }), qua = ds.filter(function (v) { return v.qua; }).reverse();
    var dong = function (v) {
      return '<div class="cv-r' + (v.homNay ? ' nay-r' : '') + '"><b>' + THU[thu(v.ngay)] + ' ' + dm(v.ngay) + (v.homNay ? ' · hôm nay' : '') + '</b><span>' + esc(v.ten) +
        '<small>ca ' + esc(v.ca.join(', ')) + (v.boi && (v.xongDi || v.xongDen) ? ' · ' + esc(v.boi) + ' ' + esc(v.luc) : '') + (v.qua && !v.xong ? ' · <em>chưa xong</em>' : '') + '</small></span>' +
        '<span class="cho">' + nut(v, 'di') + nut(v, 'den') + '</span></div>';
    };
    var tre = qua.filter(function (v) { return !v.xong; }).length;
    return '<div class="khung"><h3>Lưu công văn theo ca trực' + (tre ? ' <span class="pill p-bad">' + tre + ' ca chưa xong</span>' : '') + '</h3>' +
      '<div class="mo-ta">Ai có tên trong mảng "Lưu công văn đi" / "Lưu công văn đến" thì mỗi ngày trực tự có việc cập nhật công văn mới vào sheet. Làm xong bấm nút để đánh dấu.</div>' +
      (sap.length ? sap.map(dong).join('') : '<div class="trong-k">Chưa có ca trực nào sắp tới của người lưu công văn.</div>') +
      (qua.length ? '<details' + (tre ? ' open' : '') + '><summary>14 ngày qua (' + qua.length + ' ca)</summary>' + qua.map(dong).join('') + '</details>' : '') + '</div>';
  }
  function veCv(o) {
    var d = o.d, lk = d.lienKet || {}; o.loai = o.loai || 'di';
    var nutLk = [['cvDi', 'Sheet công văn đi'], ['cvDiFolder', 'Folder công văn đi'], ['cvDen', 'Sheet công văn đến'], ['cvDenFolder', 'Folder công văn đến']].map(function (x) {
      return lk[x[0]] ? '<a class="lk" href="' + esc(lk[x[0]]) + '" target="_blank" rel="noopener">' + x[1] + ' ↗</a>' : ''; }).join('');
    var seg = '<div class="seg" role="group" aria-label="Loại công văn"><button type="button" data-hd="cvLoai" data-t="di" aria-pressed="' + (o.loai === 'di') + '">Công văn đi</button>' +
      '<button type="button" data-hd="cvLoai" data-t="den" aria-pressed="' + (o.loai === 'den') + '">Công văn đến</button></div>';
    var loi = function (x) { return '<div class="canh">' + esc(x.loi) + '</div>'; };
    var body = '';
    if (o.loai === 'di') {
      var di = d.di || {};
      body = di.loi ? loi(di) :
        '<div class="tiles"><div class="tile chinh"><span>Số công văn tiếp theo</span><b>' + soCv(di.soTiep) + '</b><small>Ví dụ: ' + soCv(di.soTiep) + '-KH/ĐTN · số gần nhất ' + soCv(di.soTiep - 1) + ' · tab ' + esc(di.tab) + '</small></div>' +
        '<div class="tile"><span>Đã lưu tháng này</span><b>' + di.thangNay + '</b><small>' + di.tong + ' công văn trong nhiệm kỳ</small></div>' +
        '<div class="tile' + (di.chuaTen.length ? ' xau' : '') + '"><span>Đã lấy số, chưa có tên</span><b>' + di.chuaTen.length + '</b><small>người nhận thông tin điền tên</small></div>' +
        '<div class="tile' + (di.soChuaPdf ? ' xau' : '') + '"><span>Chưa có file PDF</span><b>' + di.soChuaPdf + '</b><small>bản mềm cần lưu vào folder</small></div></div>' +
        '<div class="khung quy"><h3>Quy trình lưu công văn đi</h3><ol><li>Người ban hành điền thẳng trên sheet, hoặc hỏi thành viên số tiếp theo (xem ô bên trên) rồi lấy số đó.</li>' +
        '<li>Thành viên nhận thông tin điền <b>tên (trích yếu)</b> công văn vào đúng dòng số.</li><li>Lưu <b>bản cứng</b> (bản in) vào tập và <b>bản mềm</b> (PDF) vào folder công văn đi, ghi tên file ở cột PDF.</li>' +
        '<li>Công văn có <b>chữ ký thầy Hiệu trưởng</b>: bản gốc lưu tập riêng, in 1 bản scan lưu vào tập chung.</li></ol></div>' +
        (di.chuaTen.length ? '<div class="khung"><h3>Đã lấy số nhưng chưa có tên</h3><div class="cho" style="margin-top:6px">' + di.chuaTen.map(function (x) { return '<span class="ten">Số ' + esc(x.so) + '</span>'; }).join('') + '</div></div>' : '') +
        (di.chuaPdf.length ? '<div class="khung"><h3>Chưa có file PDF (' + di.chuaPdf.length + ')</h3><div class="mo-ta">Công văn đã có tên nhưng cột PDF còn trống (trừ dòng ghi "không lưu"). Lưu bản mềm vào folder rồi ghi tên file ở cột PDF.</div>' +
          di.chuaPdf.slice(0, o.hetPdf ? 999 : 10).map(function (x) { return '<div class="cv-r"><b>' + esc(x.so) + '</b><span>' + esc(x.trichYeu) + '<small>' + [x.ngay && dmy(x.ngay), x.soan && 'soạn: ' + esc(x.soan), x.ky && 'ký: ' + esc(x.ky), 'dòng ' + x.dong].filter(Boolean).join(' · ') + '</small></span><small><em>chưa PDF</em></small></div>'; }).join('') +
          (di.chuaPdf.length > 10 ? '<button type="button" class="b3" data-hd="cvPdf" style="margin-top:8px">' + (o.hetPdf ? 'Thu gọn' : 'Xem tất cả ' + di.chuaPdf.length + ' công văn') + '</button>' : '') + '</div>' : '') +
        '<div class="khung"><h3>Công văn đi gần đây</h3>' + di.ganDay.map(function (x) {
          return '<div class="cv-r"><b>' + esc(x.so) + '</b><span>' + esc(x.trichYeu) + '<small>' + [x.ngay && dmy(x.ngay), x.soan && 'soạn: ' + esc(x.soan), x.ky && 'ký: ' + esc(x.ky), x.trang && x.trang + ' trang'].filter(Boolean).join(' · ') + '</small></span>' +
            '<small>' + (x.pdf ? 'PDF ✓' : '<em>chưa PDF</em>') + '</small></div>'; }).join('') + '</div>';
    } else {
      var den = d.den || {}; o.loc = o.loc || '';
      var ds = den.loi ? [] : den.ganDay.filter(function (x) { return !o.loc || x.loai === o.loc; });
      body = den.loi ? loi(den) :
        '<div class="tiles">' + den.loai.map(function (l) { return '<div class="tile"><span>' + esc(l.ten) + '</span><b>' + l.thangNay + '</b><small>tháng này · ' + l.tong + ' trong nhiệm kỳ</small></div>'; }).join('') + '</div>' +
        '<div class="khung quy"><h3>Quy trình lưu công văn đến</h3><ol><li>Công văn được gửi đến email — thành viên phụ trách cập nhật thông tin vào sheet, đúng tab loại: <b>Trong trường</b> (phòng ban trong trường), <b>Ngoài trường</b> (ĐHĐN, tổ chức khác), <b>CLB - Đội - Nhóm</b>.</li>' +
        '<li>Lưu bản mềm (PDF) vào folder công văn đến, ghi tên file ở cột LINK. Một số trường hợp có bản cứng thì lưu thêm vào tập.</li></ol></div>' +
        (den.chuaLink.length ? '<div class="khung"><h3>Chưa ghi file / link</h3>' + den.chuaLink.map(function (x) { return '<div class="cv-r"><b>' + esc(x.so || '—') + '</b><span>' + esc(x.trichYeu) + '<small>' + esc(x.loai) + ' · ' + esc(x.donVi) + '</small></span><small>' + (x.ngay ? dmy(x.ngay) : '') + '</small></div>'; }).join('') + '</div>' : '') +
        '<div class="khung"><h3>Công văn đến gần đây</h3><div class="seg" role="group" aria-label="Lọc theo loại"><button type="button" data-hd="cvLoc" data-t="" aria-pressed="' + (!o.loc) + '">Tất cả</button>' +
        den.loai.map(function (l) { return '<button type="button" data-hd="cvLoc" data-t="' + esc(l.ten) + '" aria-pressed="' + (o.loc === l.ten) + '">' + esc(l.ten) + '</button>'; }).join('') + '</div>' +
        (ds.length ? ds.map(function (x) { return '<div class="cv-r"><b>' + esc(x.so || '—') + '</b><span>' + esc(x.trichYeu) + '<small>' + esc(x.donVi) + ' · ' + esc(x.loai) + (x.trang ? ' · ' + esc(x.trang) + ' trang' : '') + '</small></span><small>' + (x.ngay ? dmy(x.ngay) : '') + '</small></div>'; }).join('') : '<div class="trong-k">Chưa có công văn.</div>') + '</div>';
    }
    o.el.innerHTML = '<div class="hd"><div class="khung"><h3>Công văn</h3><div class="mo-ta">Việc lưu công văn vẫn làm trên Google Sheet — dashboard chỉ đọc để xem nhanh và nhắc những dòng còn thiếu (cập nhật mỗi 5 phút).</div>' +
      (nutLk ? '<div class="cho" style="margin-top:8px">' + nutLk + '</div>' : '<div class="canh">Chưa có link sheet / folder công văn. Quản lý dán ở trang Cài đặt → Liên kết nhóm CSDL - CSVC.</div>') + seg + '</div>' + body + veCaTruc(o) + '</div>';
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

  window.BDVHD = { cnXanh: cnXanh, kiemKe: kiemKe, csvc: csvc, congVan: congVan, hopNhom: hopNhom };
})();
