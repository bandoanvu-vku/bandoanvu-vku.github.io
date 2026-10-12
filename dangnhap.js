/* Đăng nhập Google cho mọi trang của Ban Đoàn vụ.
   Xem dashboard thì không cần đăng nhập; chỉ khi nhận việc / cập nhật mới cần.
   Trang dùng: BDV.nguoi() -> {ten, email} hoặc null; BDV.canToken(cb, lyDo) -> gọi cb(token) khi đã đăng nhập;
   BDV.hetHan() khi máy chủ báo phiên hết hạn; lắng nghe sự kiện 'bdv-nguoi' trên document. */
(function () {
  if (window.BDV) return;
  var CLIENT_ID = '416137728937-0o67vc9pdrhfvftgutl145ic7va4bafr.apps.googleusercontent.com';
  var API = 'https://script.google.com/macros/s/AKfycbyvfVC6D4z7dpvqTRXENomrqmEMnoeqY4Y2Al5ApP32yQWwjJunsJZJYJ4PqCtaptfd/exec';
  var K_NG = 'bdv.nguoi', K_TK = 'bdv.token';

  function doc(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function ghi(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var nguoi = doc(K_NG), tk = doc(K_TK), choCb = null, dangHoi = false;
  if (nguoi && !nguoi.ten) nguoi = null;

  function token() { return tk && tk.t && tk.exp * 1000 > Date.now() + 60000 ? tk.t : ''; }

  /* ---------- giao diện ---------- */
  var st = document.createElement('style');
  st.textContent =
    '.bdv-tk{flex:none;margin-left:auto;display:flex;align-items:center;gap:8px;font-size:13.5px;color:var(--muted,#5d6b80)}' +
    '.bdv-tk b{color:var(--text,#17202e);font-weight:600;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.bdv-tk button{font:inherit;cursor:pointer;border-radius:8px;padding:5px 11px;min-height:32px}' +
    '.bdv-tk .dn{background:var(--accent,#1a56c4);border:1px solid var(--accent,#1a56c4);color:var(--on-accent,#fff);font-weight:600}' +
    '.bdv-tk .dx{background:none;border:1px solid var(--line,#dfe4ec);color:var(--muted,#5d6b80)}' +
    '.bdv-tk .dx:hover{border-color:var(--accent,#1a56c4);color:var(--accent,#1a56c4)}' +
    '@media (max-width:640px){.bdv-menu>div{position:relative}.bdv-tk{position:absolute;right:16px;top:5px}.bdv-tk b{max-width:120px}}' +
    '.bdv-dn{position:fixed;inset:0;z-index:10;background:rgba(10,15,25,.45);display:none;align-items:center;justify-content:center;padding:16px}' +
    '.bdv-dn.mo{display:flex}' +
    '.bdv-dn>div{background:var(--card,#fff);color:var(--text,#17202e);border-radius:14px;max-width:380px;width:100%;padding:20px 20px 16px;box-shadow:0 10px 40px rgba(0,0,0,.25)}' +
    '.bdv-dn h2{margin:0 0 6px;font-size:18px;color:var(--text,#17202e)}' +
    '.bdv-dn p{margin:0 0 14px;font-size:14px;color:var(--muted,#5d6b80);line-height:1.5}' +
    '.bdv-dn .g{min-height:44px;display:flex;justify-content:center}' +
    '.bdv-dn .loi{color:var(--bad,#b3261e);font-size:13.5px;margin:12px 0 0;display:none}' +
    '.bdv-dn .dong{display:block;margin:14px 0 0 auto;background:none;border:1px solid var(--line,#dfe4ec);border-radius:8px;padding:6px 14px;font:inherit;color:var(--muted,#5d6b80);cursor:pointer}';
  document.head.appendChild(st);

  var hop = document.createElement('div');
  hop.className = 'bdv-dn';
  hop.setAttribute('role', 'dialog');
  hop.setAttribute('aria-modal', 'true');
  hop.setAttribute('aria-labelledby', 'bdv-dn-t');
  hop.innerHTML = '<div><h2 id="bdv-dn-t">Đăng nhập</h2><p id="bdv-dn-p"></p><div class="g" id="bdv-dn-g">Đang tải nút đăng nhập Google…</div>' +
    '<div class="loi" id="bdv-dn-loi"></div><button type="button" class="dong">Để sau</button></div>';
  document.body.appendChild(hop);
  hop.addEventListener('click', function (e) { if (e.target === hop || e.target.className === 'dong') dongHop(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && hop.className.indexOf('mo') > -1) dongHop(); });

  function loi(m) { var l = document.getElementById('bdv-dn-loi'); l.textContent = m || ''; l.style.display = m ? 'block' : 'none'; }
  function moHop(lyDo) {
    document.getElementById('bdv-dn-p').textContent = lyDo ||
      'Dùng tài khoản Google đã đăng ký với Ban để nhận việc và cập nhật tiến độ. Xem dashboard thì không cần đăng nhập.';
    loi('');
    hop.className = 'bdv-dn mo';
    sanSang().then(function (ok) {
      var g = document.getElementById('bdv-dn-g');
      if (!ok) { g.textContent = 'Không tải được Google. Kiểm tra mạng rồi thử lại.'; return; }
      g.innerHTML = '';
      google.accounts.id.renderButton(g, { theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', locale: 'vi', width: 280 });
      try { google.accounts.id.prompt(); } catch (e) {}
    });
  }
  function dongHop() { hop.className = 'bdv-dn'; choCb = null; }

  function veNut() {
    var o = document.querySelector('.bdv-menu > div');
    if (!o) return;
    var el = o.querySelector('.bdv-tk');
    if (!el) { el = document.createElement('div'); el.className = 'bdv-tk'; o.appendChild(el); }
    el.innerHTML = nguoi
      ? '<b title="' + esc(nguoi.email) + '">' + esc(nguoi.ten) + '</b><button type="button" class="dx">Đăng xuất</button>'
      : '<button type="button" class="dn">Đăng nhập</button>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.bdv-tk button');
    if (!b) return;
    if (b.className === 'dn') moHop(); else dangXuat();
  });
  function bao() {
    veNut();
    try { document.dispatchEvent(new CustomEvent('bdv-nguoi', { detail: nguoi })); } catch (e) {}
  }

  /* ---------- Google Identity Services ---------- */
  var hua = null;
  function sanSang() {
    if (hua) return hua;
    hua = new Promise(function (xong) {
      var s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.onload = function () {
        try {
          google.accounts.id.initialize({
            client_id: CLIENT_ID, callback: nhanTheBai, auto_select: true,
            cancel_on_tap_outside: true, use_fedcm_for_prompt: true, itp_support: true, context: 'signin'
          });
          xong(true);
        } catch (e) { xong(false); }
      };
      s.onerror = function () { hua = null; xong(false); };
      document.head.appendChild(s);
    });
    return hua;
  }
  function giaiMa(jwt) {
    var p = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    while (p.length % 4) p += '=';
    return JSON.parse(decodeURIComponent(atob(p).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join('')));
  }
  function nhanTheBai(r) {
    if (!r || !r.credential || dangHoi) return;
    var p;
    try { p = giaiMa(r.credential); } catch (e) { loi('Đăng nhập không thành công, thử lại nhé.'); return; }
    var t = { t: r.credential, exp: p.exp };
    dangHoi = true;
    loi('');
    document.getElementById('bdv-dn-g').style.opacity = '.5';
    fetch(API, { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'toi', token: t.t }) })
      .then(function (x) { if (!x.ok) throw new Error('Máy chủ trả về lỗi ' + x.status); return x.json(); })
      .then(function (o) {
        if (!o.ok) throw new Error(o.error || 'Có lỗi xảy ra.');
        tk = t; ghi(K_TK, tk);
        nguoi = { ten: o.data.ten, email: o.data.email }; ghi(K_NG, nguoi);
        var cb = choCb;
        hop.className = 'bdv-dn'; choCb = null;
        bao();
        if (cb) cb(tk.t);
      })
      .catch(function (e) {
        if (hop.className.indexOf('mo') === -1) moHop();
        loi(e && e.message ? e.message : String(e));
        try { google.accounts.id.disableAutoSelect(); } catch (er) {}
      })
      .then(function () { dangHoi = false; var g = document.getElementById('bdv-dn-g'); if (g) g.style.opacity = ''; });
  }

  function dangXuat() {
    nguoi = null; tk = null; ghi(K_NG, null); ghi(K_TK, null);
    try { if (window.google && google.accounts) google.accounts.id.disableAutoSelect(); } catch (e) {}
    bao();
  }

  window.BDV = {
    API: API,
    nguoi: function () { return nguoi; },
    token: token,
    moDangNhap: moHop,
    dangXuat: dangXuat,
    /** Gọi cb(token) ngay nếu đang đăng nhập; nếu chưa thì mở hộp đăng nhập rồi gọi sau khi đăng nhập xong. */
    canToken: function (cb, lyDo) {
      var t = token();
      if (t && nguoi) { cb(t); return; }
      choCb = cb;
      moHop(lyDo || (nguoi ? 'Phiên đăng nhập đã hết hạn (mỗi lần dùng được khoảng 1 giờ). Bạn đăng nhập lại để tiếp tục nhé.' : null));
    },
    /** Máy chủ báo token hết hạn / không hợp lệ. */
    hetHan: function (m) { tk = null; ghi(K_TK, null); moHop(m || 'Phiên đăng nhập đã hết hạn. Bạn đăng nhập lại rồi thao tác lại nhé.'); }
  };

  veNut();
  bao();
  // Tải sẵn thư viện Google khi trang rảnh để bấm đăng nhập là có ngay
  var nap = function () { setTimeout(sanSang, 1500); };
  if (document.readyState === 'complete') nap(); else window.addEventListener('load', nap);
})();
