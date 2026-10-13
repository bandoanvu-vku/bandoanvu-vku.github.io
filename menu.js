/* Menu chung cho mọi trang của Ban Đoàn vụ. Chỉ hiện những trang tài khoản đang đăng nhập được xem.
   Thêm trang mới: thêm một dòng vào TRANG (cột 3: '' = ai đăng nhập cũng xem được, hoặc mã nhóm). */
(function () {
  var TRANG = [
    ['/', 'Tổng quan', '', 'quanLy'], // thành viên xem tổng quan nhóm ngay trong "Của tôi"
    ['/cua-toi/', 'Của tôi', ''],
    ['/lich-truc/', 'Lịch trực', ''],
    ['/4t/', 'Truyền thông - Thông tin', '4t'],
    ['/nghiep-vu/', 'Nghiệp vụ', 'nghiep-vu'],
    ['/csdl-csvc/', 'CSDL - CSVC', 'csdl-csvc'],
    ['/noi-vu/', 'Nội vụ', 'noi-vu']
  ];
  var o = location.pathname.replace(/index\.html$/, '');
  if (o.slice(-1) !== '/') o += '/';
  var st = document.createElement('style');
  st.textContent =
    '.bdv-menu{position:sticky;top:0;z-index:4;background:var(--card,#fff);border-bottom:1px solid var(--line,#dfe4ec)}' +
    '.bdv-menu>div{max-width:1040px;margin:0 auto;padding:0 16px;display:flex;align-items:center;gap:6px 18px;min-height:48px}' +
    '.bdv-menu .brand{flex:none;font-weight:700;font-size:15px;color:var(--text,#17202e);text-decoration:none;padding:12px 0}' +
    '.bdv-menu nav{display:flex;flex-wrap:wrap;gap:2px;min-width:0}' +
    '.bdv-menu nav>a,.bdv-menu .nhom>button{flex:none;padding:13px 11px 10px;font:inherit;font-size:14px;color:var(--muted,#5d6b80);text-decoration:none;border:0;border-bottom:3px solid transparent;background:none;white-space:nowrap;cursor:pointer}' +
    '.bdv-menu nav>a:hover,.bdv-menu .nhom>button:hover{color:var(--accent,#1a56c4)}' +
    '.bdv-menu nav>a[aria-current=page],.bdv-menu .nhom.dang>button{color:var(--accent,#1a56c4);border-bottom-color:var(--accent,#1a56c4);font-weight:600}' +
    '.bdv-menu .nhom{position:relative}' +
    '.bdv-menu .nhom>button::after{content:"";display:inline-block;margin-left:6px;vertical-align:2px;border:4px solid transparent;border-top-color:currentColor;border-bottom:0}' +
    '.bdv-menu .nhom ul{display:none;position:absolute;left:0;top:100%;min-width:220px;margin:0;padding:6px;list-style:none;background:var(--card,#fff);border:1px solid var(--line,#dfe4ec);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.14);z-index:6}' +
    '.bdv-menu .nhom.mo ul{display:block}' +
    '.bdv-menu .nhom ul a{display:block;padding:9px 12px;border-radius:7px;font-size:14px;color:var(--text,#17202e);text-decoration:none;white-space:nowrap}' +
    '.bdv-menu .nhom ul a:hover{background:var(--track,#eceff4)}' +
    '.bdv-menu .nhom ul a[aria-current=page]{color:var(--accent,#1a56c4);font-weight:600;background:var(--track,#eceff4)}' +
    '@media (max-width:640px){.bdv-menu>div{flex-direction:column;align-items:stretch;gap:0}.bdv-menu .brand{padding:9px 0 0}.bdv-menu nav{margin:0 -6px}' +
    '.bdv-menu nav>a,.bdv-menu .nhom>button{padding:8px 8px 7px}.bdv-menu .nhom ul{left:auto;right:0}}';
  document.head.appendChild(st);
  var h = document.createElement('header');
  h.className = 'bdv-menu';
  h.innerHTML = '<div><a class="brand" href="/">Ban Đoàn vụ</a><nav aria-label="Các trang"></nav></div>';
  document.body.insertBefore(h, document.body.firstChild);

  function nguoi() {
    if (window.BDV) return BDV.nguoi();
    try { return JSON.parse(localStorage.getItem('bdv.nguoi') || 'null'); } catch (e) { return null; }
  }
  function lienKet(t) { return '<a href="' + t[0] + '"' + (t[0] === o ? ' aria-current="page"' : '') + '>' + t[1] + '</a>'; }
  // Trang chung hiện thẳng; trang các nhóm: xem được 1 nhóm thì hiện thẳng, từ 2 nhóm trở lên (vd quản lý) gom vào "Công việc nhóm"
  function ve() {
    var n = nguoi();
    var ql = !!n && n.vaiTro === 'quanLy';
    var duoc = function (t) { return !!n && (t[3] !== 'quanLy' || ql) && (!t[2] || ql || (n.nhom || []).indexOf(t[2]) > -1); };
    h.querySelector('.brand').setAttribute('href', n && !ql ? '/cua-toi/' : '/');
    var chung = TRANG.filter(function (t) { return !t[2] && duoc(t); });
    var nhom = TRANG.filter(function (t) { return t[2] && duoc(t); });
    var html = chung.map(lienKet).join('');
    if (nhom.length === 1) html += lienKet(nhom[0]);
    else if (nhom.length > 1) {
      var dang = nhom.some(function (t) { return t[0] === o; });
      html += '<div class="nhom' + (dang ? ' dang' : '') + '"><button type="button" aria-haspopup="true" aria-expanded="false">Công việc nhóm</button>' +
        '<ul>' + nhom.map(function (t) { return '<li>' + lienKet(t) + '</li>'; }).join('') + '</ul></div>';
    }
    h.querySelector('nav').innerHTML = html;
    if (window.BDV) BDV.veNut();
  }
  function dong() { var d = h.querySelector('.nhom.mo'); if (d) { d.className = d.className.replace(' mo', ''); d.querySelector('button').setAttribute('aria-expanded', 'false'); } }
  h.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.nhom>button');
    if (!b) return;
    var d = b.parentNode, mo = d.className.indexOf(' mo') === -1;
    dong();
    if (mo) { d.className += ' mo'; b.setAttribute('aria-expanded', 'true'); }
  });
  document.addEventListener('click', function (e) { if (!(e.target.closest && e.target.closest('.nhom'))) dong(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') dong(); });
  ve();
  document.addEventListener('bdv-nguoi', ve);
  if (!window.BDV && !document.querySelector('script[src="/dangnhap.js"]')) {
    var dn = document.createElement('script'); dn.src = '/dangnhap.js'; dn.onload = ve; document.body.appendChild(dn);
  }
})();
