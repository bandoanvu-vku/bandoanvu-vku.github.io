/* Menu chung cho mọi trang của Ban Đoàn vụ. Thêm trang mới: thêm một dòng vào TRANG. */
(function () {
  var TRANG = [
    ['/', 'Tổng quan'],
    ['/4t/', 'Truyền thông - Thông tin'],
    ['/nghiep-vu/', 'Nghiệp vụ'],
    ['/csdl-csvc/', 'CSDL - CSVC'],
    ['/noi-vu/', 'Nội vụ']
  ];
  var o = location.pathname.replace(/index\.html$/, '');
  if (o.slice(-1) !== '/') o += '/';
  var st = document.createElement('style');
  st.textContent =
    '.bdv-menu{position:sticky;top:0;z-index:4;background:var(--card,#fff);border-bottom:1px solid var(--line,#dfe4ec)}' +
    '.bdv-menu>div{max-width:1040px;margin:0 auto;padding:0 16px;display:flex;align-items:center;gap:6px 18px}' +
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
  h.innerHTML = '<div><a class="brand" href="/">Ban Đoàn vụ</a><nav aria-label="Các trang">' + TRANG.map(function (t) {
    return '<a href="' + t[0] + '"' + (t[0] === o ? ' aria-current="page"' : '') + '>' + t[1] + '</a>';
  }).join('') + '</nav></div>';
  document.body.insertBefore(h, document.body.firstChild);
  var c = h.querySelector('[aria-current]');
  if (c && c.scrollIntoView) c.scrollIntoView({ block: 'nearest', inline: 'center' });
  if (!window.BDV && !document.querySelector('script[src="/dangnhap.js"]')) {
    var dn = document.createElement('script'); dn.src = '/dangnhap.js'; document.body.appendChild(dn);
  }
})();
