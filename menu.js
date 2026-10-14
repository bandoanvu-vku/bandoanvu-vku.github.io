/* Menu chung cho mọi trang của Ban Đoàn vụ: thanh bên trái chia nhóm mục, theo vai trò (quản lý / thành viên).
   Trên điện thoại thanh bên ẩn, bấm nút ☰ để mở. Thêm trang: thêm một mục vào cauHinh() bên dưới. */
(function () {
  var TEN_NHOM = { '4t': 'Truyền thông - Thông tin', 'nghiep-vu': 'Nghiệp vụ', 'csdl-csvc': 'CSDL - CSVC', 'noi-vu': 'Nội vụ' };
  var THU_TU = ['4t', 'nghiep-vu', 'csdl-csvc', 'noi-vu'];
  var ICON = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M21.5 20a6.2 6.2 0 0 0-3.8-5.7"/>',
    inbox: '<path d="M3 13h5l1.5 3h5l1.5-3h5"/><path d="M5.5 5h13l2.5 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z"/>',
    chart: '<path d="M4 20V11M10 20V5M16 20v-6M3 20h18"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.7 2.7L16 9.6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    book: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19M9 7h6"/>',
    gear: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
    bars: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    chev: '<path d="m6 9 6 6 6-6"/>'
  };
  function icon(k) { return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[k] + '</svg>'; }

  /* Cấu hình menu theo vai trò. Mỗi phần: { muc: tiêu đề (null = không tiêu đề), ds: [mục] }.
     Mục: { href, ten, icon, dem? (hiện số chờ duyệt) } hoặc { ten, icon, con: [{ href, ten }] } (mục sổ xuống). */
  function cauHinh(n) {
    var ql = n.vaiTro === 'quanLy';
    var nhom = ql ? THU_TU : THU_TU.filter(function (m) { return (n.nhom || []).indexOf(m) > -1; });
    var dsNhom = nhom.map(function (m) { return { href: '/' + m + '/', ten: TEN_NHOM[m] }; });
    var muc = dsNhom.length === 1 ? { href: dsNhom[0].href, ten: 'Việc của nhóm', icon: 'users' } : { ten: ql ? 'Công việc nhóm' : 'Việc của nhóm', icon: 'users', con: dsNhom };
    if (ql) {
      return [
        { muc: null, ds: [{ href: '/', ten: 'Tổng quan', icon: 'home' }] },
        { muc: 'Điều hành', ds: [{ href: '/phe-duyet/', ten: 'Phê duyệt', icon: 'inbox', dem: true }, { href: '/lich-truc/', ten: 'Lịch trực', icon: 'cal' }, muc] },
        { muc: 'Theo dõi', ds: [{ href: '/thong-ke/', ten: 'Thống kê', icon: 'chart' }] },
        { muc: 'Cá nhân', ds: [{ href: '/cua-toi/', ten: 'Việc của tôi', icon: 'check' }, { href: '/ho-so/', ten: 'Hồ sơ của tôi', icon: 'user' }] },
        { muc: 'Quản trị', ds: [{ href: '/tai-lieu/', ten: 'Tài liệu & biểu mẫu', icon: 'file' }, { href: '/cam-nang/', ten: 'Cẩm nang', icon: 'book' }, { href: '/cai-dat/', ten: 'Cài đặt', icon: 'gear' }] }
      ];
    }
    return [
      { muc: null, ds: [{ href: '/cua-toi/', ten: 'Trang chủ', icon: 'home' }] },
      { muc: 'Hằng ngày', ds: [{ href: '/lich-truc/#diem-danh', ten: 'Điểm danh', icon: 'clock' }, { href: '/lich-truc/', ten: 'Đăng ký ca trực', icon: 'cal' }].concat(dsNhom.length ? [muc] : []) },
      { muc: 'Của tôi', ds: [{ href: '/ho-so/', ten: 'Hồ sơ của tôi', icon: 'user' }, { href: '/thong-ke/', ten: 'Thống kê của tôi', icon: 'chart' },
        { href: '/tai-lieu/', ten: 'Tài liệu & biểu mẫu', icon: 'file' }, { href: '/cam-nang/', ten: 'Cẩm nang', icon: 'book' }] }
    ];
  }

  /* Năm học: chọn ở đầu thanh menu, nhớ trong trình duyệt. Hiện chỉ năm hiện tại có dữ liệu;
     chọn năm khác thì các trang theo năm (việc, lịch trực, thống kê…) hiện "chưa có dữ liệu". Khi bổ sung dữ liệu năm cũ: thêm vào CO_DU_LIEU. */
  var NAM_HOC = ['2026 - 2027', '2025 - 2026', '2024 - 2025', '2023 - 2024'];
  var HIEN_TAI = '2026 - 2027', CO_DU_LIEU = ['2026 - 2027'];
  var KHONG_THEO_NAM = ['/ho-so/', '/cam-nang/', '/cai-dat/', '/tai-lieu/', '/bao-mat/'];
  var namHoc = (function () { try { var v = localStorage.getItem('bdv.namHoc'); return NAM_HOC.indexOf(v) > -1 ? v : HIEN_TAI; } catch (e) { return HIEN_TAI; } })();
  window.BDV_NAM_HOC = { chon: function () { return namHoc; }, hienTai: HIEN_TAI, ds: NAM_HOC };
  var o = location.pathname.replace(/index\.html$/, ''); if (o.slice(-1) !== '/') o += '/';
  function key() { return o + (location.hash === '#diem-danh' ? '#diem-danh' : ''); }

  var st = document.createElement('style');
  st.textContent =
    '.bdv-menu{position:sticky;top:0;z-index:4;background:var(--card,#fff);border-bottom:1px solid var(--line,#dfe4ec)}' +
    '.bdv-menu>div{max-width:1040px;margin:0 auto;padding:0 16px;display:flex;align-items:center;gap:10px;min-height:52px}' +
    '.bdv-menu .brand{font-weight:700;font-size:15px;color:var(--text,#17202e);text-decoration:none}' +
    '.bdv-menu .mo-menu{display:none;border:1px solid var(--line,#dfe4ec);background:none;color:var(--text,#17202e);border-radius:8px;width:38px;height:36px;padding:0;align-items:center;justify-content:center;cursor:pointer}' +
    '.bdv-side{position:fixed;top:0;left:0;bottom:0;width:248px;z-index:7;background:var(--card,#fff);border-right:1px solid var(--line,#dfe4ec);overflow-y:auto;padding:14px 12px 24px;display:none}' +
    'body.bdv-co-side .bdv-side{display:block}' +
    '.bdv-side .logo{display:block;padding:6px 10px 14px;text-decoration:none;color:var(--text,#17202e)}' +
    '.bdv-side .logo b{display:block;font-size:16px}.bdv-side .logo span{font-size:12px;color:var(--muted,#5d6b80)}' +
    '.bdv-menu .nam{display:none;align-items:center;gap:8px;font-size:13px;color:var(--muted,#5d6b80);white-space:nowrap}body.bdv-co-side .bdv-menu .nam{display:flex}' +
    '.bdv-menu .nam select{font:inherit;font-size:13.5px;font-weight:600;color:var(--text,#17202e);background:var(--card,#fff);border:1px solid var(--line,#dfe4ec);border-radius:8px;padding:5px 8px;min-height:34px;cursor:pointer}' +
    '.bdv-menu .nam select:hover{border-color:var(--accent,#1a56c4)}' +
    '.bdv-menu .nam.cu select{border-color:#c77700;color:#9a5b00;background:#fdf0d5}' +
    '@media (prefers-color-scheme:dark){.bdv-menu .nam.cu select{color:#f2c063;background:#3a2d10}}' +
    'body.bdv-nam-cu .wrap,body.bdv-nam-cu .dlg{display:none!important}' +
    '.bdv-namcu{max-width:760px;margin:40px auto;padding:0 16px}.bdv-namcu>div{background:var(--card,#fff);border:1px dashed var(--line,#dfe4ec);border-radius:14px;padding:32px 22px;text-align:center;color:var(--muted,#5d6b80);font-size:15px}' +
    '.bdv-namcu h2{margin:0 0 8px;font-size:19px;color:var(--text,#17202e)}.bdv-namcu button{margin-top:14px;font:inherit;font-weight:600;border:1px solid var(--accent,#1a56c4);background:var(--accent,#1a56c4);color:#fff;border-radius:10px;padding:8px 16px;cursor:pointer}' +
    '.bdv-side .phan{margin-top:10px}' +
    '.bdv-side .td{display:flex;width:100%;align-items:center;justify-content:space-between;border:0;background:none;padding:8px 10px 4px;font:inherit;font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#5d6b80);cursor:pointer}' +
    '.bdv-side .td svg{width:14px;height:14px;transition:transform .15s}.bdv-side .phan.dong .td svg{transform:rotate(-90deg)}.bdv-side .phan.dong .ds{display:none}' +
    '.bdv-side a.m,.bdv-side button.m{position:relative;display:flex;align-items:center;gap:11px;width:100%;margin:2px 0;padding:9px 10px;border:0;border-radius:10px;background:none;font:inherit;font-size:14.5px;color:var(--text,#17202e);text-decoration:none;text-align:left;cursor:pointer}' +
    '.bdv-side .m svg{flex:none;color:var(--muted,#5d6b80)}' +
    '.bdv-side .m:hover{background:var(--track,#eef1f5)}' +
    '.bdv-side .m[aria-current=page]{background:var(--accent-soft,#e8f0fd);color:var(--accent,#1a56c4);font-weight:600}' +
    '.bdv-side .m[aria-current=page] svg{color:var(--accent,#1a56c4)}' +
    '.bdv-side .m[aria-current=page]::before{content:"";position:absolute;left:-12px;top:7px;bottom:7px;width:3px;border-radius:0 3px 3px 0;background:var(--accent,#1a56c4)}' +
    '.bdv-side .m .mui{margin-left:auto;width:14px;height:14px;transition:transform .15s}.bdv-side .nho.mo>.m .mui{transform:rotate(180deg)}' +
    '.bdv-side .nho .con{display:none;margin:0 0 4px 29px;border-left:1px solid var(--line,#dfe4ec);padding-left:8px}.bdv-side .nho.mo .con{display:block}' +
    '.bdv-side .con a{display:block;padding:7px 10px;border-radius:8px;font-size:13.5px;color:var(--text,#17202e);text-decoration:none}' +
    '.bdv-side .con a:hover{background:var(--track,#eef1f5)}.bdv-side .con a[aria-current=page]{color:var(--accent,#1a56c4);font-weight:600;background:var(--accent-soft,#e8f0fd)}' +
    '.bdv-side .so{margin-left:auto;min-width:20px;padding:0 6px;border-radius:10px;background:#d93025;color:#fff;font-size:11.5px;font-weight:700;line-height:20px;text-align:center}' +
    '.bdv-phu{position:fixed;inset:0;z-index:6;background:rgba(10,15,25,.4);display:none}' +
    '@media (prefers-color-scheme:dark){.bdv-side .m[aria-current=page],.bdv-side .con a[aria-current=page]{background:rgba(127,176,255,.14)}}' +
    '@media (min-width:1000px){body.bdv-co-side{padding-left:248px}body.bdv-co-side .bdv-menu .brand{display:none}}' +
    '@media (max-width:640px){body.bdv-co-side .bdv-menu .brand{display:none}.bdv-menu .nam span{display:none}.bdv-menu .nam select{font-size:13px;padding:4px 6px}}' +
    '@media (max-width:999px){body.bdv-co-side .bdv-menu .mo-menu{display:inline-flex}' +
    '.bdv-side{transform:translateX(-100%);transition:transform .2s;box-shadow:0 10px 40px rgba(0,0,0,.2)}' +
    'body.bdv-mo-side .bdv-side{transform:none}body.bdv-mo-side .bdv-phu{display:block}}' +
    '@media (max-width:640px){.bdv-menu .bdv-tk{position:static!important}}';
  document.head.appendChild(st);

  var h = document.createElement('header');
  h.className = 'bdv-menu';
  h.innerHTML = '<div><button type="button" class="mo-menu" aria-label="Mở menu">' + icon('bars') + '</button><a class="brand" href="/">Ban Đoàn vụ</a><label class="nam"><span>Năm học</span><select id="bdvNam" aria-label="Chọn năm học"></select></label></div>';
  var side = document.createElement('aside');
  side.className = 'bdv-side'; side.setAttribute('aria-label', 'Menu');
  var phu = document.createElement('div'); phu.className = 'bdv-phu';
  document.body.insertBefore(phu, document.body.firstChild);
  document.body.insertBefore(side, document.body.firstChild);
  document.body.insertBefore(h, document.body.firstChild);

  function nguoi() {
    if (window.BDV) return BDV.nguoi();
    try { return JSON.parse(localStorage.getItem('bdv.nguoi') || 'null'); } catch (e) { return null; }
  }
  function doc(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function ghi(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var dongPhan = doc('bdv.menu.dong') || {}, moNho = doc('bdv.menu.mo') || {};
  var soCho = null; // số mục chờ duyệt, hiện cạnh "Phê duyệt"

  function mucHtml(m) {
    var k = key();
    if (m.con) {
      var dang = m.con.some(function (c) { return c.href === k; }), mo = dang || moNho[m.ten];
      return '<div class="nho' + (mo ? ' mo' : '') + '"><button type="button" class="m" data-nho="' + m.ten + '" aria-expanded="' + !!mo + '">' + icon(m.icon) + '<span>' + m.ten + '</span>' +
        '<svg class="mui" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' + ICON.chev + '</svg></button>' +
        '<div class="con">' + m.con.map(function (c) { return '<a href="' + c.href + '"' + (c.href === k ? ' aria-current="page"' : '') + '>' + c.ten + '</a>'; }).join('') + '</div></div>';
    }
    var so = m.dem && soCho ? '<span class="so" aria-label="' + soCho + ' mục chờ duyệt">' + soCho + '</span>' : '';
    return '<a class="m" href="' + m.href + '"' + (m.href === k ? ' aria-current="page"' : '') + '>' + icon(m.icon) + '<span>' + m.ten + '</span>' + so + '</a>';
  }
  function ve() {
    var n = nguoi(), ql = !!n && n.vaiTro === 'quanLy';
    document.body.classList.toggle('bdv-co-side', !!n);
    h.querySelector('.brand').setAttribute('href', n && !ql ? '/cua-toi/' : '/');
    if (!n) { side.innerHTML = ''; soCho = null; document.body.classList.remove('bdv-mo-side'); veNam(null); if (window.BDV) BDV.veNut(); return; }
    if (ql && soCho === null) demCho(n);
    var cu = namHoc !== HIEN_TAI, nam = h.querySelector('.nam');
    nam.className = 'nam' + (cu ? ' cu' : ''); nam.title = cu ? 'Đang xem năm học cũ' : '';
    nam.querySelector('select').innerHTML = NAM_HOC.map(function (y) { return '<option' + (y === namHoc ? ' selected' : '') + '>' + y + '</option>'; }).join('');
    side.innerHTML = '<a class="logo" href="' + (ql ? '/' : '/cua-toi/') + '"><b>Ban Đoàn vụ</b><span>VKU · năm học ' + namHoc + '</span></a>' +
      cauHinh(n).map(function (p) {
        var ds = '<div class="ds">' + p.ds.map(mucHtml).join('') + '</div>';
        if (!p.muc) return '<div class="phan">' + ds + '</div>';
        return '<div class="phan' + (dongPhan[p.muc] ? ' dong' : '') + '"><button type="button" class="td" data-phan="' + p.muc + '" aria-expanded="' + !dongPhan[p.muc] + '">' + p.muc +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' + ICON.chev + '</svg></button>' + ds + '</div>';
      }).join('');
    veNam(n);
    if (window.BDV) BDV.veNut();
  }
  // Năm học chưa có dữ liệu: ẩn nội dung trang theo năm, hiện thông báo
  function veNam(n) {
    var an = !!n && CO_DU_LIEU.indexOf(namHoc) === -1 && KHONG_THEO_NAM.indexOf(o) === -1;
    document.body.classList.toggle('bdv-nam-cu', an);
    var el = document.querySelector('.bdv-namcu');
    if (!an) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('div'); el.className = 'bdv-namcu'; phu.parentNode.insertBefore(el, phu.nextSibling); }
    el.innerHTML = '<div><h2>Năm học ' + namHoc + '</h2>Chưa có dữ liệu của năm học này trên dashboard.<br>Dữ liệu các năm trước sẽ được bổ sung sau.' +
      '<br><button type="button" data-ve-nam="1">Về năm học ' + HIEN_TAI + '</button></div>';
  }
  function doiNam(v) { namHoc = v; try { localStorage.setItem('bdv.namHoc', v); } catch (e) {} ve(); try { document.dispatchEvent(new CustomEvent('bdv-namhoc', { detail: v })); } catch (e) {} }
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-ve-nam]')) doiNam(HIEN_TAI); });
  h.addEventListener('change', function (e) { if (e.target.id === 'bdvNam') doiNam(e.target.value); });
  function demCho(n) {
    if (!n || n.vaiTro !== 'quanLy' || !window.BDV || o === '/phe-duyet/') return;
    try { var c = JSON.parse(sessionStorage.getItem('bdv.pd') || 'null'); if (c && Date.now() - c.t < 60000) { soCho = c.so; return; } } catch (e) {}
    if (demCho.dang) return; demCho.dang = true;
    BDV.goi('pheDuyet', { dem: true }).then(function (d) {
      demCho.dang = false; soCho = d.so;
      try { sessionStorage.setItem('bdv.pd', JSON.stringify({ so: d.so, t: Date.now() })); } catch (e) {}
      ve();
    }).catch(function () { demCho.dang = false; });
  }
  function dongSide() { document.body.classList.remove('bdv-mo-side'); }

  side.addEventListener('click', function (e) {
    var td = e.target.closest('.td');
    if (td) { var p = td.dataset.phan; dongPhan[p] = !dongPhan[p]; ghi('bdv.menu.dong', dongPhan); ve(); return; }
    var nh = e.target.closest('[data-nho]');
    if (nh) { var t = nh.dataset.nho, el = nh.parentNode, mo = !el.classList.contains('mo'); moNho[t] = mo; ghi('bdv.menu.mo', moNho); el.classList.toggle('mo', mo); nh.setAttribute('aria-expanded', String(mo)); return; }
    if (e.target.closest('a')) dongSide();
  });
  h.querySelector('.mo-menu').addEventListener('click', function () { document.body.classList.add('bdv-mo-side'); });
  phu.addEventListener('click', dongSide);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') dongSide(); });
  window.addEventListener('hashchange', ve);
  document.addEventListener('bdv-pheduyet', function (e) { soCho = e.detail; ve(); });
  ve();
  document.addEventListener('bdv-nguoi', function () { soCho = null; ve(); });
  if (!window.BDV && !document.querySelector('script[src="/dangnhap.js"]')) {
    var dn = document.createElement('script'); dn.src = '/dangnhap.js'; dn.onload = ve; document.body.appendChild(dn);
  }
})();
