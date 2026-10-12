/* Dashboard nhiệm vụ cho một nhóm của Ban Đoàn vụ (Nghiệp vụ, CSDL - CSVC, Nội vụ).
   Trang gọi file này phải có <body data-nhom="nghiep-vu | csdl-csvc | noi-vu">. */
(function () {
  var API = 'https://script.google.com/macros/s/AKfycbyvfVC6D4z7dpvqTRXENomrqmEMnoeqY4Y2Al5ApP32yQWwjJunsJZJYJ4PqCtaptfd/exec';
  var NHOM = document.body.getAttribute('data-nhom');
  var TRANG_THAI = ['Chưa làm', 'Đang làm', 'Chờ duyệt', 'Hoàn thành'];

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
    '<div class="kpis" id="kpis"></div><div class="tabs" role="tablist">' +
    '<button type="button" role="tab" data-view="nv">Nhiệm vụ</button><button type="button" role="tab" data-view="toi">Việc của tôi</button>' +
    '<button type="button" role="tab" data-view="mang">Mảng và thành viên</button></div>' +
    '<div id="view"><div class="empty-box">Đang tải dữ liệu từ sheet…</div></div>' +
    '<div class="foot"><span>Nhận việc, đổi trạng thái và dán link tại đây sẽ được ghi thẳng vào sheet. Giao việc, sửa hạn, thêm nhiệm vụ: làm trong sheet.</span><span id="stamp"></span></div></div>' +
    '<div id="toast" role="status"></div>');

  var D = null, view = 'nv', loc = 'all', locMang = '', busy = false;
  var $ = function (id) { return document.getElementById(id); };
  function nho(k, v) {
    try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v); } catch (e) {}
    return v || '';
  }
  function nguoi() { if (window.BDV) return BDV.nguoi(); try { return JSON.parse(localStorage.getItem('bdv.nguoi') || 'null'); } catch (e) { return null; } }
  var toi = (nguoi() || {}).ten || '';
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function homNay() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function ngay(iso) { if (!iso) return null; var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function soNgay(iso) { return Math.round((ngay(iso) - homNay()) / 864e5); }
  function dsHoTro(v) { return v.hoTro.split(',').map(function (x) { return x.replace(/\s+/g, ' ').trim(); }).filter(Boolean); }
  function lienQuan(v) { return !!toi && (v.chinh === toi || dsHoTro(v).indexOf(toi) > -1); }
  function xong(v) { return v.trangThai === 'Hoàn thành'; }
  function tre(v) { return !xong(v) && !!v.han && soNgay(v.han) < 0; }

  var tT;
  function toast(msg, err) {
    var t = $('toast'); t.textContent = msg; t.className = err ? 'err' : ''; t.style.display = 'block';
    clearTimeout(tT); tT = setTimeout(function () { t.style.display = 'none'; }, err ? 6000 : 2500);
  }

  function goi(req, moi, token) {
    var p = req
      ? fetch(API, { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'nhomGhi', req: req, token: token }) })
      : fetch(API + '?api=nhom&n=' + encodeURIComponent(NHOM) + (moi ? '&fresh=1' : '') + '&t=' + Date.now(), { credentials: 'omit' });
    return p.then(function (r) { if (!r.ok) throw new Error('Máy chủ trả về lỗi ' + r.status); return r.json(); })
      .then(function (o) {
        if (!o.ok) { if (o.dangNhap && window.BDV) BDV.hetHan(o.error); throw new Error(o.error || 'Có lỗi xảy ra.'); }
        return o.data;
      })
      .catch(function (e) { throw (e && e.message ? e.message : String(e)); });
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
      .catch(function (m) { if (!D) $('view').innerHTML = '<div class="empty-box">Không tải được dữ liệu: ' + esc(m) + '</div>'; else if (!imLang) toast(m, true); });
  }
  function dangGo() { var a = document.activeElement; return !!(a && a.matches && a.matches('input[type=url]')); }
  function nhan(d) {
    D = d;
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
    if (!window.BDV) { toast('Đang tải phần đăng nhập, bạn thử lại sau vài giây nhé', true); ve(); return; }
    if (!BDV.token()) ve();
    BDV.canToken(function (token) {
      if (busy) return;
      if (D.thanhVien.indexOf(toi) === -1) { toast('Tài khoản ' + toi + ' không có trong danh sách thành viên nhóm ' + D.ten + '.', true); ve(); return; }
      busy = true; if (el) el.classList.add('busy');
      var req = { nhom: NHOM, dong: v.dong, nhiemVu: v.ten, ten: toi, viec: viec };
      for (var k in them) req[k] = them[k];
      gui(req, token);
    }, 'Đăng nhập bằng tài khoản Google đã đăng ký với Ban để nhận việc và cập nhật tiến độ.');
  }
  function gui(req, token) {
    goi(req, false, token).then(function (d) { busy = false; nhan(d); toast('Đã ghi vào sheet'); })
      .catch(function (m) { busy = false; toast(m, true); goi(null, true).then(nhan).catch(function () {}); });
  }

  function ve() {
    if (!D) return;
    veKpi();
    [].forEach.call(document.querySelectorAll('.tabs button'), function (b) { b.setAttribute('aria-selected', b.dataset.view === view); });
    if (view === 'mang') veMang(); else veNhiemVu(view === 'toi');
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
      : (v.trangThai === 'Đang làm' || v.trangThai === 'Chờ duyệt') ? ['doing', v.trangThai] : ['plain', 'Chưa làm'];
    var kh = '';
    if (!xong(v) && con !== null) {
      kh = con < 0 ? '<span class="pill bad">Quá hạn ' + (-con) + ' ngày</span>' : con === 0 ? '<span class="pill doing">Hạn hôm nay</span>' : con <= 7 ? '<span class="pill plain">Còn ' + con + ' ngày</span>' : '';
    }
    var ten = function (n) { return '<span' + (n === toi ? ' class="me"' : '') + '>' + esc(n) + '</span>'; };
    var acts = '';
    if (!v.chinh && !xong(v)) acts += '<button type="button" class="open" data-act="nhan">+ Nhận phụ trách</button>';
    if (!lq && !xong(v)) acts += '<button type="button" class="open" data-act="hoTro">+ Tham gia hỗ trợ</button>';
    if (lq) {
      acts += '<label>Trạng thái <select data-act="trangThai">' + (v.trangThai ? '' : '<option value="">Chọn…</option>') + TRANG_THAI.map(function (s) {
        return '<option' + (s === v.trangThai ? ' selected' : '') + '>' + s + '</option>';
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
    if (!D.nhiemVu.length) {
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
    $('view').innerHTML = (cuaToi ? '' : '<div class="filters">' + f.map(function (x) {
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
    $('view').innerHTML = '<h2>Thành viên</h2><table><thead><tr><th>Thành viên</th><th>Phụ trách: xong / tổng</th><th>Đang hỗ trợ</th></tr></thead><tbody>' +
      D.thanhVien.map(function (n) {
        var a = tv[n];
        return '<tr><td><b>' + esc(n) + '</b></td><td class="num">' + a.xong + ' / ' + a.giao + '<div class="bar"><i style="width:' + (a.xong / max * 100) + '%"></i><i class="doing" style="width:' + ((a.giao - a.xong) / max * 100) + '%"></i></div></td><td class="num">' + a.ht + ' việc</td></tr>';
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
  document.querySelector('.tabs').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { view = b.dataset.view; ve(); } });
  $('view').addEventListener('click', function (e) {
    var f = e.target.closest('[data-loc]'); if (f) { loc = f.dataset.loc; ve(); return; }
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
    $('me').innerHTML = toi
      ? 'Bạn: <b>' + esc(toi) + '</b>' + (D && D.thanhVien.indexOf(toi) === -1 ? ' <span class="warn">(không thuộc nhóm này)</span>' : '')
      : '<button type="button" class="ghost" data-dn>Đăng nhập để nhận việc</button>';
  }
  $('me').addEventListener('click', function (e) { if (e.target.closest('[data-dn]') && window.BDV) BDV.moDangNhap(); });
  document.addEventListener('bdv-nguoi', function (e) { toi = (e.detail && e.detail.ten) || ''; veMe(); ve(); });
  veMe();
  $('reload').addEventListener('click', function () { tai(false); });

  var mn = document.createElement('script'); mn.src = '/menu.js'; document.body.appendChild(mn);

  try {
    var cu = JSON.parse(localStorage.getItem('bdv.' + NHOM + '.data') || 'null');
    if (cu && cu.ma === NHOM && cu.nhiemVu && cu.thanhVien) { nhan(cu); $('stamp').textContent = 'Đang cập nhật…'; }
  } catch (e) {}
  tai(true);
  setInterval(function () { if (!document.hidden && !busy && !dangGo()) tai(true); }, 180000);
})();
