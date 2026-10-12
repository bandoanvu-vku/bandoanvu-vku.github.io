/* Menu chung cho mọi trang của Ban Đoàn vụ. Chỉ hiện những trang tài khoản đang đăng nhập được xem.
   Thêm trang mới: thêm một dòng vào TRANG (cột 3: '' = ai đăng nhập cũng xem được, hoặc mã nhóm). */
(function () {
  var TRANG = [
    ['/', 'Tổng quan', ''],
    ['/cua-toi/', 'Của tôi', ''],
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
    '.bdv-menu nav{display:flex;gap:2px;overflow-x:auto;scrollbar-width:none;min-width:0}' +
    '.bdv-menu nav::-webkit-scrollbar{display:none}' +
    '.bdv-menu nav a{flex:none;padding:13px 11px 10px;font-size:14px;color:var(--muted,#5d6b80);text-decoration:none;border-bottom:3px solid transparent;white-space:nowrap}' +
    '.bdv-menu nav a:hover{color:var(--accent,#1a56c4)}' +
    '.bdv-menu nav a[aria-current=page]{color:var(--accent,#1a56c4);border-bottom-color:var(--accent,#1a56c4);font-weight:600}' +
    '@media (max-width:640px){.bdv-menu>div{flex-direction:column;align-items:stretch;gap:0}.bdv-menu .brand{padding:9px 0 0}.bdv-menu nav{margin:0 -6px}.bdv-menu nav a{padding:8px 8px 7px}}';
  document.head.appendChild(st);
  var h = document.createElement('header');
  h.className = 'bdv-menu';
  h.innerHTML = '<div><a class="brand" href="/">Ban Đoàn vụ</a><nav aria-label="Các trang"></nav></div>';
  document.body.insertBefore(h, document.body.firstChild);

  function nguoi() {
    if (window.BDV) return BDV.nguoi();
    try { return JSON.parse(localStorage.getItem('bdv.nguoi') || 'null'); } catch (e) { return null; }
  }
  function ve() {
    var n = nguoi();
    var duoc = function (t) {
      if (!n) return false;
      return !t[2] || n.vaiTro === 'quanLy' || (n.nhom || []).indexOf(t[2]) > -1;
    };
    h.querySelector('nav').innerHTML = TRANG.filter(duoc).map(function (t) {
      return '<a href="' + t[0] + '"' + (t[0] === o ? ' aria-current="page"' : '') + '>' + t[1] + '</a>';
    }).join('');
    var c = h.querySelector('[aria-current]');
    if (c && c.scrollIntoView) c.scrollIntoView({ block: 'nearest', inline: 'center' });
    if (window.BDV) BDV.veNut();
  }
  ve();
  document.addEventListener('bdv-nguoi', ve);
  if (!window.BDV && !document.querySelector('script[src="/dangnhap.js"]')) {
    var dn = document.createElement('script'); dn.src = '/dangnhap.js'; dn.onload = ve; document.body.appendChild(dn);
  }
})();
