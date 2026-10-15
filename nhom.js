/* Dashboard nhiệm vụ cho một nhóm của Ban Đoàn vụ (Nghiệp vụ, CSDL - CSVC, Nội vụ).
   Trang gọi file này phải có <body data-nhom="nghiep-vu | csdl-csvc | noi-vu">. */
(function () {
  var NHOM = document.body.getAttribute('data-nhom');
  var TRANG_THAI = ['Chưa làm', 'Đang làm', 'Chờ duyệt', 'Hoàn thành'], CHO_QL = 'Chờ quản lý duyệt';
  // Mảng công việc thường nhật có tab riêng (khớp tên mảng trong tab "Mảng công việc" của sheet nhóm theo các từ khoá)
  var MANG_RIENG = {
    'csdl-csvc': [
      // 5 tab theo đầu việc nhóm tự chia (14/10/2026); tab Mảng công việc trong sheet vẫn giữ 7 dòng, khớp theo từ khoá
      // [mã tab, tên tab, từ khoá tên mảng, khối hoạt động, đầu việc]
      ['cong-van', 'Công văn', ['công văn'], 'congVan', ['Lưu công văn đi', 'Lưu công văn đến']],
      ['csvc', 'Cơ sở vật chất', ['csvc', 'cơ sở vật chất'], 'csvc', ['Kiểm kê hằng tuần / hằng tháng / giữa năm - cuối năm', 'Mượn về', 'Cho mượn']],
      ['giay-to', 'Giấy tờ / Biểu mẫu', ['giấy đề nghị', 'biểu mẫu', 'giấy tờ'], '', ['Soạn Giấy đề nghị']],
      ['doan-vu', 'Thông tin Đoàn vụ', ['đoàn vụ'], '', ['Cập nhật thông tin trên sheet, track-log', 'Quản lý thông tin', 'Hồ sơ của Đoàn vụ']],
      ['chu-nhat-xanh', 'Chủ nhật xanh', ['chủ nhật xanh', 'cn xanh'], 'cnXanh', ['Viết thông báo', 'Liên hệ khu vực trực', 'Tạo sheet điểm danh', 'Giám sát thực hiện']]
    ]
  };
  var DS_MANG = MANG_RIENG[NHOM] || [];
  var TABS = [['nv', 'Nhiệm vụ nhóm'], ['toi', 'Việc của tôi']].concat(DS_MANG.map(function (m) { return [m[0], m[1]]; }))
    .concat([['mang', 'Mảng và thành viên']]);
  if (!window.BDVHD && !document.querySelector('script[src="/hoat-dong.js"]')) {
    var hd = document.createElement('script'); hd.src = '/hoat-dong.js'; hd.onload = function () { if (typeof ve === 'function') ve(); }; document.head.appendChild(hd);
  }

  var css = [
    ':root{--bg:#f4f6fa;--card:#fff;--line:#dfe4ec;--text:#17202e;--muted:#5d6b80;--accent:#1a56c4;--accent-soft:#e6eefc;--on-accent:#fff;',
    '--ok:#17794a;--ok-soft:#e0f3e9;--warn:#9a5b00;--warn-soft:#fdf0d5;--bad:#b3261e;--bad-soft:#fde7e5;--idle:#5d6b80;--idle-soft:#eceff4;--track:#e4e8ef}',
    '@media (prefers-color-scheme:dark){:root{--bg:#10151d;--card:#19212c;--line:#2c3746;--text:#e8edf4;--muted:#9aa8bb;--accent:#7fb0ff;--accent-soft:#1d2f4d;--on-accent:#0c1524;',
    '--ok:#6fd3a0;--ok-soft:#173326;--warn:#f2c063;--warn-soft:#3a2d10;--bad:#ff9d94;--bad-soft:#40201d;--idle:#9aa8bb;--idle-soft:#242e3b;--track:#2a3442}}',
    '*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif}',
    '.wrap{max-width:1040px;margin:0 auto;padding:20px 16px 56px}h1{font-size:21px;line-height:1.25;margin:0}a{color:var(--accent)}',
    '.back{font-size:13px;text-decoration:none}.sub{color:var(--muted);font-size:13px;margin-top:2px}',
    'button,select,input{font:inherit;color:inherit}button{cursor:pointer}',
    '.top{display:flex;gap:12px 20px;align-items:flex-end;justify-content:space-between;flex-wrap:wrap}',
    '.who{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.who label{font-size:13px;color:var(--muted)}',
    'select,input[type=text],input[type=url]{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:7px 10px;min-height:38px}',
    '.who .me{font-size:14px;color:var(--muted)}.who .me b{color:var(--text)}.who .warn{color:var(--bad)}',
    '.ghost{background:none;border:1px solid var(--line);border-radius:8px;padding:7px 12px;min-height:38px}.ghost:hover{border-color:var(--accent);color:var(--accent)}',
    '.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0}',
    '.kpi{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px}',
    '.kpi .v{font-size:26px;font-weight:700;line-height:1.1;font-variant-numeric:tabular-nums}.kpi .v small{font-size:14px;font-weight:500;color:var(--muted)}',
    '.kpi .l{font-size:13px;color:var(--muted);margin-top:3px}.kpi.alert .v{color:var(--bad)}',
    '.bar{height:6px;border-radius:3px;background:var(--track);overflow:hidden;margin-top:8px;display:flex}.bar i{display:block;height:100%;background:var(--ok)}.bar i.doing{background:var(--warn);opacity:.55}',
    '.tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin-bottom:14px;overflow-x:auto}',
    '.tabs button{flex:none;background:none;border:0;border-bottom:3px solid transparent;padding:9px 12px;color:var(--muted);font-weight:600}',
    '.tabs button[aria-selected=true]{color:var(--accent);border-bottom-color:var(--accent)}',
    '.filters{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;align-items:center}',
    '.filters button{background:none;border:1px solid var(--line);border-radius:999px;padding:4px 11px;font-size:13px;color:var(--muted)}',
    '.filters button[aria-pressed=true]{background:var(--accent-soft);border-color:var(--accent);color:var(--accent);font-weight:600}',
    '.filters select{min-height:32px;padding:3px 8px;font-size:13px;max-width:100%}',
    '.act{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:13px 14px;margin-bottom:10px;display:grid;grid-template-columns:58px 1fr;gap:4px 14px}',
    '.act.done{opacity:.8}.date{text-align:center;border-right:1px solid var(--line);padding-right:12px;align-self:start}',
    '.date b{display:block;font-size:24px;line-height:1.1;font-variant-numeric:tabular-nums}.date span{font-size:12px;color:var(--muted)}',
    '.date.none b{font-size:13px;font-weight:600;color:var(--muted);line-height:1.3;padding-top:4px}',
    '.act h3{margin:0;font-size:15px;line-height:1.35;overflow-wrap:anywhere}',
    '.meta{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:6px;font-size:12.5px;color:var(--muted)}',
    '.pill{border-radius:999px;padding:1px 9px;font-size:12px;font-weight:600;white-space:nowrap}',
    '.pill.ok{background:var(--ok-soft);color:var(--ok)}.pill.doing{background:var(--warn-soft);color:var(--warn)}.pill.bad{background:var(--bad-soft);color:var(--bad)}',
    '.pill.idle{background:var(--idle-soft);color:var(--idle)}.pill.plain{border:1px solid var(--line);font-weight:500;color:var(--muted)}',
    '.desc{font-size:13.5px;margin-top:6px;overflow-wrap:anywhere}.people{font-size:13px;margin-top:6px;overflow-wrap:anywhere}.people b{font-weight:600}.people .me{color:var(--accent)}',
    '.acts{grid-column:2;display:flex;flex-wrap:wrap;gap:6px 8px;margin-top:9px;align-items:center;font-size:13px}',
    '.acts select{min-height:34px;padding:4px 8px}.acts input{min-height:34px;padding:4px 8px;width:230px;max-width:100%}',
    'button.open{border:1px dashed var(--accent);color:var(--accent);background:none;border-radius:8px;padding:4px 10px;font-size:13px;min-height:34px}button.open:hover{background:var(--accent-soft)}',
    'button.solid{border:1px solid var(--accent);background:var(--accent);color:var(--on-accent);border-radius:8px;padding:4px 12px;min-height:34px}',
    'button.x{background:none;border:0;padding:0 2px;color:var(--muted);font-size:12.5px;text-decoration:underline}',
    '.tn-duyet{background:var(--card);border:1px solid var(--accent);border-radius:12px;padding:6px 14px 10px;margin-bottom:14px}.tn-duyet h2{color:var(--accent);margin:8px 0 4px}',
    '.tn-r{display:grid;grid-template-columns:1fr auto;gap:8px 14px;align-items:center;padding:9px 0;border-top:1px solid var(--line)}.tn-duyet h2+.tn-r{border-top:0}',
    '.tn-b{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.tn-b input{min-height:34px;padding:4px 8px;font-size:13px;width:220px;max-width:100%}',
    '@media (max-width:640px){.tn-r{grid-template-columns:1fr}.tn-b input{width:100%}}',
    '.busy{opacity:.5;pointer-events:none}h2{font-size:14px;margin:18px 0 8px;color:var(--muted);font-weight:600}',
    'table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden}',
    'th,td{padding:10px 12px;text-align:left;border-bottom:1px solid var(--line);vertical-align:top;overflow-wrap:anywhere}',
    'th{font-size:12.5px;color:var(--muted);font-weight:600}tr:last-child td{border-bottom:0}td.num{font-variant-numeric:tabular-nums;white-space:nowrap}td .bar{margin:4px 0 0;min-width:90px;height:8px}',
    '.empty-box{text-align:center;color:var(--muted);padding:34px 16px;border:1px dashed var(--line);border-radius:12px}',
    '.foot{margin-top:22px;font-size:12.5px;color:var(--muted);display:flex;gap:8px 16px;flex-wrap:wrap;justify-content:space-between}',
    '#toast{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);max-width:calc(100vw - 32px);background:var(--text);color:var(--bg);padding:10px 16px;border-radius:10px;font-size:14px;display:none;z-index:5}',
    '#toast.err{background:var(--bad);color:#fff}',
    '@media (max-width:640px){.kpis{grid-template-columns:repeat(2,1fr)}.act{grid-template-columns:46px 1fr;gap:4px 10px;padding:12px}.date{padding-right:8px}.date b{font-size:20px}.acts{grid-column:1/-1}.hide-s{display:none}th,td{padding:9px 8px}}'
  ].join('');
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  document.body.insertAdjacentHTML('afterbegin',
    '<div class="wrap"><div class="top"><div><h1 id="title">Nhóm</h1>' +
    '<div class="sub">Năm học 2026 - 2027 · dữ liệu lấy trực tiếp từ sheet theo dõi nhiệm vụ của nhóm</div></div>' +
    '<div class="who"><span id="me" class="me"></span>' +
    '<button class="ghost" id="reload" type="button">Tải lại</button></div></div>' +
    '<div class="kpis" id="kpis"></div><div class="tabs" role="tablist">' + TABS.map(function (t) {
      return '<button type="button" role="tab" data-view="' + t[0] + '">' + t[1] + '</button>';
    }).join('') + '</div>' +
    '<div id="view"><div class="empty-box">Đang tải dữ liệu từ sheet…</div></div>' +
    '<div class="foot"><span>Nhận việc, đổi trạng thái và dán link tại đây sẽ được ghi thẳng vào sheet. Giao việc, sửa hạn, thêm nhiệm vụ: làm trong sheet.</span><span id="stamp"></span></div></div>' +
    '<div id="toast" role="status"></div>');

  var D = null, view = 'nv', loc = 'all', locMang = '', busy = false;
  // Tab đang xem ghi trên địa chỉ (#chu-nhat-xanh…) để tải lại vẫn giữ
  function docView() { var h = location.hash.slice(1); h = { 'giay-de-nghi': 'giay-to', 'bieu-mau': 'giay-to', 'doan-vien': 'nv' }[h] || h; view = TABS.some(function (t) { return t[0] === h; }) ? h : 'nv'; }
  docView();
  window.addEventListener('hashchange', function () { docView(); ve(); });
  var $ = function (id) { return document.getElementById(id); };
  function nho(k, v) {
    try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v); } catch (e) {}
    return v || '';
  }
  var toi = '', loi = null;
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function homNay() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function ngay(iso) { if (!iso) return null; var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function soNgay(iso) { return Math.round((ngay(iso) - homNay()) / 864e5); }
  function dsHoTro(v) { return v.hoTro.split(',').map(function (x) { return x.replace(/\s+/g, ' ').trim(); }).filter(Boolean); }
  // Phụ trách chính của một mảng công việc (tab Mảng công việc) — người duyệt cấp 1
  function ptMang(ten) {
    var t = String(ten || '').trim().toLowerCase(); if (!t || !D) return [];
    var m = D.mang.filter(function (x) { return String(x.ten).trim().toLowerCase() === t; })[0];
    return m ? String(m.chinh || '').split(/[,;]/).map(function (x) { return x.replace(/\s+/g, ' ').trim(); }).filter(Boolean) : [];
  }
  function lienQuan(v) { return !!toi && (v.chinh === toi || dsHoTro(v).indexOf(toi) > -1); }
  function xong(v) { return v.trangThai === 'Hoàn thành'; }
  function tre(v) { return !xong(v) && !!v.han && soNgay(v.han) < 0; }

  var tT;
  function toast(msg, err) {
    var t = $('toast'); t.textContent = msg; t.className = err ? 'err' : ''; t.style.display = 'block';
    clearTimeout(tT); tT = setTimeout(function () { t.style.display = 'none'; }, err ? 6000 : 2500);
  }

  // Đọc: action 'nhom'; ghi: action 'nhomGhi'. Máy chủ chỉ trả dữ liệu khi tài khoản thuộc nhóm này hoặc là quản lý.
  function goi(req, moi) {
    var p = req ? BDV.goi('nhomGhi', req) : BDV.goi('nhom', { n: NHOM, moi: !!moi });
    return p.catch(function (e) { loi = e; throw (e && e.message) || String(e); });
  }
  function tai(imLang) {
    return goi(null, !imLang).then(function (d) {
      if (busy) return;
      nhan(d);
      if (!imLang) { toast('Đã cập nhật từ sheet'); return; }
      if (d.tuoi > 90) {
        $('stamp').textContent = 'Đang đọc lại sheet…';
        return goi(null, true).then(function (m) { if (!busy && !dangGo()) nhan(m); });
      }
    })
      .catch(function (m) {
        if (loi && (loi.canDangNhap || loi.khongQuyen)) { chan(loi.khongQuyen ? m : ''); return; }
        if (!D) $('view').innerHTML = '<div class="empty-box">Không tải được dữ liệu: ' + esc(m) + '</div>'; else if (!imLang) toast(m, true);
      });
  }
  function dangGo() { var a = document.activeElement; return !!(a && a.matches && a.matches('input[type=url]')); }
  function nhan(d) {
    if (!d.truongNhom && D && D.truongNhom) d.truongNhom = D.truongNhom;
    if (!d.viecTuDong && D && D.viecTuDong) d.viecTuDong = D.viecTuDong;
    D = d; moKhoa();
    try { localStorage.setItem('bdv.' + NHOM + '.data', JSON.stringify(d)); } catch (e) {}
    document.title = 'Nhóm ' + D.ten + ' · Ban Đoàn vụ';
    $('title').textContent = 'Nhóm ' + D.ten;
    veMe();
    var n = new Date();
    $('stamp').textContent = 'Cập nhật lúc ' + ('0' + n.getHours()).slice(-2) + ':' + ('0' + n.getMinutes()).slice(-2);
    ve();
  }
  function thaoTac(v, viec, them, el) {
    if (busy) return;
    if (D.thanhVien.indexOf(toi) === -1) {
      toast(BDV.laQuanLy() ? 'Tài khoản quản lý chỉ xem; giao việc và sửa việc thì làm trong sheet của nhóm.' : 'Tài khoản của bạn không có trong danh sách thành viên nhóm này.', true);
      ve(); return;
    }
    busy = true; if (el) el.classList.add('busy');
    var req = { nhom: NHOM, dong: v.dong, nhiemVu: v.ten, viec: viec };
    for (var k in them) req[k] = them[k];
    goi(req).then(function (d) { busy = false; nhan(d); toast('Đã ghi vào sheet'); })
      .catch(function (m) { busy = false; toast(m, true); goi(null, true).then(nhan).catch(function () {}); });
  }

  function ve() {
    if (!D) return;
    veKpi();
    [].forEach.call(document.querySelectorAll('.tabs button'), function (b) { b.setAttribute('aria-selected', b.dataset.view === view); });
    if (view === 'mang') veMang();
    else if (view === 'hop') veHop();
    else if (view === 'nv' || view === 'toi') veNhiemVu(view === 'toi');
    else veMangRieng(DS_MANG.filter(function (m) { return m[0] === view; })[0]);
    var c = document.querySelector('.tabs [aria-selected=true]'); if (c && c.scrollIntoView && view !== 'nv') c.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  function khopMang(ten, khoa) { var t = String(ten || '').toLowerCase(); return khoa.some(function (k) { return t.indexOf(k) > -1; }); }
  function veHop() {
    $('view').innerHTML = '<div id="modHd"></div>';
    if (window.BDVHD) BDVHD.hopNhom($('modHd'), NHOM); else $('modHd').innerHTML = '<div class="empty-box">Đang tải…</div>';
  }
  function veMangRieng(m) {
    if (!m) { view = 'nv'; ve(); return; }
    var rows = D.mang.filter(function (x) { return khopMang(x.ten, m[2]); });
    var ds = D.nhiemVu.filter(function (v) { return khopMang(v.mang, m[2]); }).sort(function (a, b) {
      if (xong(a) !== xong(b)) return xong(a) ? 1 : -1;
      var x = a.han || '9999', y = b.han || '9999'; return x < y ? -1 : x > y ? 1 : a.dong - b.dong;
    });
    var dong = function (row) {
      return '<div class="people" style="margin:0 0 6px">' + (rows.length > 1 ? '<b>' + esc(row.ten) + ':</b> ' : '') + '<b>Phụ trách chính:</b> ' + (esc(row.chinh) || 'chưa có') +
        (row.hoTroChinh ? ' · <b>Hỗ trợ chính:</b> ' + esc(row.hoTroChinh) : '') + (row.thamGia ? ' · <b>Tham gia:</b> ' + esc(row.thamGia) : '') + '</div>';
    };
    var dv = m[4] && m[4].length ? '<div class="people" style="margin:0 0 6px"><b>Đầu việc:</b> ' + m[4].map(esc).join(' · ') + '</div>' : '';
    var info = rows.length ? '<div style="margin:0 0 12px">' + dv + rows.map(dong).join('') + '</div>'
      : '<div class="people" style="margin:0 0 12px;color:var(--muted)">Chưa có mảng "' + esc(m[1]) + '" trong tab Mảng công việc của sheet nhóm — thêm vào để ghi phụ trách chính.</div>';
    var mod = m[3] ? '<div id="modHd"></div>' : '';
    $('view').innerHTML = info + mod + '<h2>Nhiệm vụ của mảng ' + esc(m[1]) + ' (' + ds.length + ')</h2>' +
      (ds.length ? ds.map(the).join('') : '<div class="empty-box">Chưa có nhiệm vụ nào thuộc mảng này. Ghi đúng tên mảng ở cột "Mảng công việc" trong tab Nhiệm vụ để hiện ở đây.</div>');
    if (m[3]) { if (window.BDVHD) BDVHD[m[3]]($('modHd')); else $('modHd').innerHTML = '<div class="empty-box">Đang tải…</div>'; }
  }
  function veKpi() {
    var tong = D.nhiemVu.length, x = 0, q = 0, cn = 0;
    D.nhiemVu.forEach(function (v) { if (xong(v)) x++; else if (!v.chinh) cn++; if (tre(v)) q++; });
    var pt = tong ? Math.round(x / tong * 100) : 0;
    $('kpis').innerHTML =
      '<div class="kpi"><div class="v">' + tong + '</div><div class="l">Nhiệm vụ trong sheet</div></div>' +
      '<div class="kpi"><div class="v">' + x + '<small> / ' + tong + '</small></div><div class="l">Đã hoàn thành (' + pt + '%)</div><div class="bar"><i style="width:' + pt + '%"></i></div></div>' +
      '<div class="kpi' + (q ? ' alert' : '') + '"><div class="v">' + q + '</div><div class="l">Quá hạn, chưa xong</div></div>' +
      '<div class="kpi' + (cn ? ' alert' : '') + '"><div class="v">' + cn + '</div><div class="l">Chưa có người nhận</div></div>';
  }
  function the(v) {
    var d = ngay(v.han), con = v.han ? soNgay(v.han) : null, lq = lienQuan(v), ht = dsHoTro(v);
    var tt = xong(v) ? ['ok', 'Hoàn thành'] : !v.chinh ? ['idle', 'Chưa có người nhận']
      : v.trangThai === 'Chờ duyệt' ? ['doing', ptMang(v.mang).length ? 'Chờ phụ trách duyệt' : 'Chờ quản lý duyệt']
      : (v.trangThai === 'Đang làm' || v.trangThai === CHO_QL) ? ['doing', v.trangThai] : ['plain', 'Chưa làm'];
    var kh = '';
    if (!xong(v) && con !== null) {
      kh = con < 0 ? '<span class="pill bad">Quá hạn ' + (-con) + ' ngày</span>' : con === 0 ? '<span class="pill doing">Hạn hôm nay</span>' : con <= 7 ? '<span class="pill plain">Còn ' + con + ' ngày</span>' : '';
    }
    var ten = function (n) { return '<span' + (n === toi ? ' class="me"' : '') + '>' + esc(n) + '</span>'; };
    var acts = '';
    if (!v.chinh && !xong(v)) acts += '<button type="button" class="open" data-act="nhan">+ Nhận phụ trách</button>';
    if (!lq && !xong(v)) acts += '<button type="button" class="open" data-act="hoTro">+ Tham gia hỗ trợ</button>';
    if (lq) {
      acts += '<label>Trạng thái <select data-act="trangThai">' + (v.trangThai ? '' : '<option value="">Chọn…</option>') + (v.trangThai === CHO_QL ? TRANG_THAI.concat([CHO_QL]) : TRANG_THAI).map(function (s) {
        return '<option value="' + s + '"' + (s === v.trangThai ? ' selected' : '') + '>' + (s === 'Chờ duyệt' ? 'Chờ duyệt (gửi duyệt)' : s) + '</option>';
      }).join('') + '</select></label>' +
        '<input type="url" placeholder="Dán link sản phẩm (https://…)" value="' + esc(v.link) + '" aria-label="Link sản phẩm">' +
        '<button type="button" class="solid" data-act="link">Lưu link</button>';
      if (v.chinh === toi && !xong(v)) acts += '<button type="button" class="x" data-act="boNhan">bỏ nhận</button>';
    }
    return '<div class="act' + (xong(v) ? ' done' : '') + '" data-dong="' + v.dong + '">' +
      (d ? '<div class="date"><b>' + ('0' + d.getDate()).slice(-2) + '</b><span>Th' + (d.getMonth() + 1) + '</span></div>' : '<div class="date none"><b>Chưa có hạn</b></div>') +
      '<div><h3>' + esc(v.ten) + '</h3><div class="meta"><span class="pill ' + tt[0] + '">' + esc(tt[1]) + '</span>' + kh +
      (v.mucDo ? '<span class="pill plain">Ưu tiên: ' + esc(v.mucDo) + '</span>' : '') + (v.mang ? '<span>' + esc(v.mang) + '</span>' : '') + '</div>' +
      (v.moTa ? '<div class="desc">' + esc(v.moTa) + '</div>' : '') +
      '<div class="people"><b>Phụ trách:</b> ' + (v.chinh ? ten(v.chinh) : 'chưa có') + (ht.length ? ' · <b>Hỗ trợ:</b> ' + ht.map(ten).join(', ') : '') +
      (v.link && /^https?:\/\//i.test(v.link) ? ' · <a href="' + esc(v.link) + '" target="_blank" rel="noopener">Link sản phẩm</a>' : '') +
      (v.ghiChu ? '<br><span style="color:var(--muted)">Ghi chú: ' + esc(v.ghiChu) + '</span>' : '') + '</div></div>' +
      (acts ? '<div class="acts">' + acts + '</div>' : '') + '</div>';
  }
  function veNhiemVu(cuaToi) {
    if (cuaToi && !toi) { $('view').innerHTML = '<div class="empty-box">Đăng nhập (nút ở góc trên) để xem việc của mình.</div>'; return; }
    if (!D.nhiemVu.length && !(cuaToi && D.viecTuDong && D.viecTuDong.length)) {
      $('view').innerHTML = '<div class="empty-box">Sheet của nhóm chưa có nhiệm vụ nào.<br>Trưởng nhóm nhập việc vào tab “Nhiệm vụ” của sheet, mỗi dòng một việc; dashboard sẽ tự hiện.</div>';
      return;
    }
    var ds = D.nhiemVu.filter(function (v) {
      if (cuaToi) return lienQuan(v);
      if (locMang && v.mang !== locMang) return false;
      if (loc === 'todo') return !xong(v);
      if (loc === 'late') return tre(v);
      if (loc === 'open') return !v.chinh && !xong(v);
      return true;
    }).sort(function (a, b) {
      if (xong(a) !== xong(b)) return xong(a) ? 1 : -1;
      var x = a.han || '9999', y = b.han || '9999';
      return x < y ? -1 : x > y ? 1 : a.dong - b.dong;
    });
    var f = [['all', 'Tất cả'], ['todo', 'Chưa xong'], ['late', 'Quá hạn'], ['open', 'Chưa có người nhận']];
    var mangCo = D.mang.map(function (m) { return m.ten; });
    D.nhiemVu.forEach(function (v) { if (v.mang && mangCo.indexOf(v.mang) === -1) mangCo.push(v.mang); });
    // Phụ trách chính của mảng công việc duyệt cấp 1 các việc thành viên gửi "Chờ duyệt" → chuyển quản lý duyệt
    var tnDs = !cuaToi && toi ? D.nhiemVu.filter(function (v) { return v.trangThai === 'Chờ duyệt' && ptMang(v.mang).indexOf(toi) > -1; }) : [];
    var tnHtml = tnDs.length ? '<div class="tn-duyet"><h2>Chờ bạn duyệt — mảng bạn phụ trách chính (' + tnDs.length + ')</h2>' + tnDs.map(function (v) {
      return '<div class="tn-r" data-dong="' + v.dong + '"><div><b>' + esc(v.ten) + '</b><div class="people">Mảng: ' + esc(v.mang) + ' · Người làm: ' + esc(v.chinh || '—') + (v.hoTro ? ' · Hỗ trợ: ' + esc(v.hoTro) : '') +
        (v.link && /^https?:\/\//i.test(v.link) ? ' · <a href="' + esc(v.link) + '" target="_blank" rel="noopener">Xem sản phẩm ↗</a>' : ' · <i>chưa có link sản phẩm</i>') + '</div></div>' +
        '<div class="tn-b"><input type="text" maxlength="300" placeholder="Nhận xét (bắt buộc khi trả lại)" aria-label="Nhận xét"><button type="button" class="solid" data-tn="1">Duyệt → quản lý</button><button type="button" class="x" data-tn="0">Trả lại</button></div></div>';
    }).join('') + '</div>' : '';
    // Việc tự động của tôi (nhóm CSDL - CSVC: lưu công văn theo ngày trực)
    var td = cuaToi && D.viecTuDong ? D.viecTuDong.filter(function (v) { return !v.xong || soNgay(v.han) >= -7; }) : [];
    var tdHtml = td.length ? '<h2>Việc tự động theo ca trực (' + td.filter(function (v) { return !v.xong; }).length + ' chưa xong)</h2>' + td.map(function (v) {
      var d = ngay(v.han), con = soNgay(v.han), i = D.viecTuDong.indexOf(v);
      var pill = v.xong ? '<span class="pill ok">Hoàn thành</span>' : con < 0 ? '<span class="pill bad">Quá hạn ' + (-con) + ' ngày</span>' : con === 0 ? '<span class="pill doing">Hôm nay</span>' : '<span class="pill plain">Còn ' + con + ' ngày</span>';
      return '<div class="act' + (v.xong ? ' done' : '') + '"><div class="date"><b>' + ('0' + d.getDate()).slice(-2) + '</b><span>Th' + (d.getMonth() + 1) + '</span></div>' +
        '<div><h3>' + esc(v.ten) + '</h3><div class="meta">' + pill + '<span>' + esc(v.mang) + '</span><span>ca ' + esc((v.ca || []).join(', ')) + '</span></div>' +
        '<div class="people">Cập nhật công văn mới vào sheet trong ngày trực rồi đánh dấu. <a href="#cong-van">Mở tab Công văn</a></div></div>' +
        (con <= 0 ? '<div class="acts"><button type="button" class="' + (v.xong ? 'x' : 'solid') + '" data-td="' + i + '">' + (v.xong ? 'Bỏ đánh dấu' : '✓ Đã lưu') + '</button></div>' : '') + '</div>';
    }).join('') + '<h2>Nhiệm vụ trong sheet</h2>' : '';
    $('view').innerHTML = tnHtml + tdHtml + (cuaToi ? '' : '<div class="filters">' + f.map(function (x) {
      return '<button type="button" data-loc="' + x[0] + '" aria-pressed="' + (loc === x[0]) + '">' + x[1] + '</button>';
    }).join('') + '<select id="locMang" aria-label="Lọc theo mảng công việc"><option value="">Tất cả mảng công việc</option>' + mangCo.map(function (m) {
      return '<option' + (m === locMang ? ' selected' : '') + '>' + esc(m) + '</option>';
    }).join('') + '</select></div>') +
      (ds.length ? ds.map(the).join('') : '<div class="empty-box">' + (cuaToi ? 'Bạn chưa có việc nào trong sheet của nhóm.' : 'Không có nhiệm vụ nào khớp bộ lọc.') + '</div>');
  }
  function veMang() {
    var mo = {}, tv = {};
    D.thanhVien.forEach(function (n) { tv[n] = { giao: 0, xong: 0, ht: 0 }; });
    D.nhiemVu.forEach(function (v) {
      if (!xong(v)) mo[v.mang] = (mo[v.mang] || 0) + 1;
      if (tv[v.chinh]) { tv[v.chinh].giao++; if (xong(v)) tv[v.chinh].xong++; }
      dsHoTro(v).forEach(function (n) { if (tv[n]) tv[n].ht++; });
    });
    var max = 1; D.thanhVien.forEach(function (n) { max = Math.max(max, tv[n].giao); });
    // Phân công theo tab Mảng công việc: mỗi người phụ trách chính / hỗ trợ chính / tham gia mảng nào
    var pc = {}; D.thanhVien.forEach(function (n) { pc[n] = { chinh: [], hoTro: [], thamGia: [] }; });
    var ten = function (s) { return String(s || '').split(/[,;]/).map(function (x) { return x.replace(/\s+/g, ' ').trim(); }).filter(Boolean); };
    D.mang.forEach(function (m) {
      ten(m.chinh).forEach(function (n) { if (pc[n]) pc[n].chinh.push(m.ten); });
      ten(m.hoTroChinh).forEach(function (n) { if (pc[n]) pc[n].hoTro.push(m.ten); });
      var tg = /cả nhóm/i.test(m.thamGia || '') ? D.thanhVien : ten(m.thamGia);
      tg.forEach(function (n) { if (pc[n] && pc[n].chinh.indexOf(m.ten) < 0 && pc[n].hoTro.indexOf(m.ten) < 0) pc[n].thamGia.push(m.ten); });
    });
    var vaiTro = function (n) {
      var p = pc[n], o = [];
      if (p.chinh.length) o.push('<b>Phụ trách chính:</b> ' + p.chinh.map(esc).join('; '));
      if (p.hoTro.length) o.push('<b>Hỗ trợ chính:</b> ' + p.hoTro.map(esc).join('; '));
      if (p.thamGia.length) o.push('<span style="color:var(--muted)">Tham gia: ' + p.thamGia.map(esc).join('; ') + '</span>');
      return o.join('<br>') || '<span style="color:var(--muted)">—</span>';
    };
    $('view').innerHTML = '<h2>Thành viên</h2><table><thead><tr><th>Thành viên</th><th>Phân công</th><th>Phụ trách: xong / tổng</th><th>Đang hỗ trợ</th></tr></thead><tbody>' +
      D.thanhVien.map(function (n) {
        var a = tv[n];
        return '<tr><td><b>' + esc(n) + '</b></td><td style="font-size:13px;line-height:1.5">' + vaiTro(n) + '</td><td class="num">' + a.xong + ' / ' + a.giao + '<div class="bar"><i style="width:' + (a.xong / max * 100) + '%"></i><i class="doing" style="width:' + ((a.giao - a.xong) / max * 100) + '%"></i></div></td><td class="num">' + a.ht + ' việc</td></tr>';
      }).join('') + '</tbody></table>' +
      '<h2>Mảng công việc</h2><table><thead><tr><th>Mảng</th><th>Phụ trách chính</th><th class="hide-s">Hỗ trợ chính</th><th class="hide-s">Tham gia</th><th>Việc đang mở</th></tr></thead><tbody>' +
      D.mang.map(function (m) {
        return '<tr><td><b>' + esc(m.ten) + '</b></td><td>' + (esc(m.chinh) || '—') + '</td><td class="hide-s">' + (esc(m.hoTroChinh) || '—') + '</td><td class="hide-s">' + (esc(m.thamGia) || '—') + '</td><td class="num">' + (mo[m.ten] || 0) + '</td></tr>';
      }).join('') + '</tbody></table>';
  }

  function timViec(el) {
    var n = el.closest('[data-dong]'); if (!n) return null;
    var v = D.nhiemVu.filter(function (x) { return x.dong === +n.dataset.dong; })[0];
    return v ? { v: v, n: n } : null;
  }
  document.querySelector('.tabs').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    view = b.dataset.view;
    try { history.replaceState(null, '', view === 'nv' ? location.pathname : '#' + view); } catch (er) {}
    ve();
  });
  $('view').addEventListener('click', function (e) {
    var f = e.target.closest('[data-loc]'); if (f) { loc = f.dataset.loc; ve(); return; }
    var tdb = e.target.closest('button[data-td]');
    if (tdb) {
      var vt = D.viecTuDong[+tdb.dataset.td]; if (!vt || busy) return;
      var ok2 = !vt.xong; busy = true; tdb.disabled = true;
      BDV.goi('luuViecCongVan', { ngay: vt.ngay, loai: vt.loai, xong: ok2, ve: 'nhiemVu' })
        .then(function (ds) { busy = false; D.viecTuDong = ds; ve(); toast(ok2 ? 'Đã đánh dấu đã lưu công văn' : 'Đã bỏ đánh dấu'); })
        .catch(function (er) { busy = false; tdb.disabled = false; toast(er && er.message ? er.message : String(er), true); });
      return;
    }
    var tb = e.target.closest('button[data-tn]');
    if (tb) {
      var r = tb.closest('.tn-r'), v = D.nhiemVu.filter(function (x) { return x.dong === +r.dataset.dong; })[0], ok = tb.dataset.tn === '1', gc = r.querySelector('input').value.trim();
      if (!v || busy) return;
      if (!ok && !gc) { toast('Ghi lý do / việc cần sửa khi trả lại.', true); r.querySelector('input').focus(); return; }
      busy = true; r.style.opacity = '.5';
      BDV.goi('duyetViec', { nhom: NHOM, dong: v.dong, ten: v.ten, dongY: ok, ghiChu: gc, ve: 'nhom' })
        .then(function (d) { busy = false; nhan(d); toast(ok ? 'Đã duyệt, chuyển quản lý duyệt' : 'Đã trả lại cho người làm'); })
        .catch(function (er) { busy = false; r.style.opacity = ''; toast(er && er.message ? er.message : String(er), true); });
      return;
    }
    var a = e.target.closest('button[data-act]'); if (!a) return;
    var o = timViec(a); if (!o) return;
    if (a.dataset.act === 'link') thaoTac(o.v, 'link', { link: o.n.querySelector('input[type=url]').value.trim() }, o.n);
    else thaoTac(o.v, a.dataset.act, {}, o.n);
  });
  $('view').addEventListener('change', function (e) {
    if (e.target.id === 'locMang') { locMang = e.target.value; ve(); return; }
    if (e.target.dataset.act !== 'trangThai' || !e.target.value) return;
    var o = timViec(e.target); if (o) thaoTac(o.v, 'trangThai', { trangThai: e.target.value }, o.n);
  });
  function veMe() {
    $('me').innerHTML = toi && BDV.laQuanLy() && D && D.thanhVien.indexOf(toi) === -1 ? '<span class="pill plain">Chế độ quản lý: chỉ xem</span>' : '';
  }
  function chan(thongBao) {
    D = null;
    $('kpis').innerHTML = ''; $('stamp').textContent = '';
    document.querySelector('.tabs').style.display = 'none'; $('reload').style.display = 'none';
    if (!BDV.nguoi()) BDV.veCong($('view'));
    else $('view').innerHTML = '<div class="empty-box">' + esc(thongBao || 'Tài khoản của bạn không thuộc nhóm này, nên không xem được trang này.') +
      '<br><a href="/cua-toi/">Xem việc của tôi</a> · <a href="/">Tổng quan nhóm của bạn</a></div>';
  }
  function moKhoa() { document.querySelector('.tabs').style.display = ''; $('reload').style.display = ''; }
  $('reload').addEventListener('click', function () { tai(false); });

  function batDau() {
    toi = (BDV.nguoi() || {}).ten || '';
    document.addEventListener('bdv-nguoi', function (e) {
      var cu = toi; toi = (e.detail && e.detail.ten) || '';
      if (!e.detail || !BDV.duocXem(NHOM)) { chan(); return; }
      if (!D || cu !== toi) { moKhoa(); if (!D) $('view').innerHTML = '<div class="empty-box">Đang tải dữ liệu từ sheet…</div>'; tai(true); } else { veMe(); ve(); }
    });
    if (!BDV.nguoi() || !BDV.duocXem(NHOM)) chan();
    else {
      try {
        var cu = JSON.parse(localStorage.getItem('bdv.' + NHOM + '.data') || 'null');
        if (cu && cu.ma === NHOM && cu.nhiemVu && cu.thanhVien) { nhan(cu); $('stamp').textContent = 'Đang cập nhật…'; }
      } catch (e) {}
      tai(true);
    }
    setInterval(function () { if (!document.hidden && !busy && !dangGo() && D) tai(true); }, 180000);
    var mn = document.createElement('script'); mn.src = '/menu.js'; document.body.appendChild(mn);
  }
  if (window.BDV) batDau();
  else { var dn = document.createElement('script'); dn.src = '/dangnhap.js'; dn.onload = batDau; document.body.appendChild(dn); }
})();
