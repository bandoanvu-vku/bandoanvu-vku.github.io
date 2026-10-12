/* Đăng nhập và phân quyền cho mọi trang của Ban Đoàn vụ.
   Mọi dữ liệu đều cần đăng nhập bằng tài khoản Google có trong sheet "Tài khoản dashboard".
   Trang dùng:
     BDV.nguoi()            -> { email, ten, vaiTro: 'quanLy' | 'thanhVien', nhom: [...] } hoặc null
     BDV.duocXem(ma)        -> true nếu xem được nhóm (ma = '4t' | 'nghiep-vu' | 'csdl-csvc' | 'noi-vu')
     BDV.goi(action, req)   -> Promise dữ liệu; lỗi có .canDangNhap hoặc .khongQuyen
     BDV.veCong(el, lyDo)   -> vẽ khung "Đăng nhập để xem" có nút Google vào el
   và lắng nghe sự kiện 'bdv-nguoi' trên document (đăng nhập / đăng xuất / đổi quyền). */
(function () {
  if (window.BDV) return;
  var CLIENT_ID = '416137728937-0o67vc9pdrhfvftgutl145ic7va4bafr.apps.googleusercontent.com';
  var API = 'https://script.google.com/macros/s/AKfycbyvfVC6D4z7dpvqTRXENomrqmEMnoeqY4Y2Al5ApP32yQWwjJunsJZJYJ4PqCtaptfd/exec';
  var K_NG = 'bdv.nguoi', K_PH = 'bdv.phien';

  function doc(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function ghi(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function xoaBanLuu() {
    try {
      Object.keys(localStorage).forEach(function (k) { if (/^bdv(4t)?\./.test(k)) localStorage.removeItem(k); });
    } catch (e) {}
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var nguoi = doc(K_NG), phien = doc(K_PH);
  if (!phien || !phien.t || !(phien.het * 1000 > Date.now() + 60000) || !nguoi || !nguoi.ten) { nguoi = null; phien = null; }
  var choDangNhap = false;

  /* ---------- giao diện ---------- */
  var st = document.createElement('style');
  st.textContent =
    '.bdv-tk{flex:none;margin-left:auto;display:flex;align-items:center;gap:8px;font-size:13.5px;color:var(--muted,#5d6b80)}' +
    '.bdv-tk b{color:var(--text,#17202e);font-weight:600;max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.bdv-tk .vt{font-size:11.5px;font-weight:600;border-radius:999px;padding:1px 8px;background:var(--accent-soft,#e6eefc);color:var(--accent,#1a56c4);white-space:nowrap}' +
    '.bdv-tk button{font:inherit;cursor:pointer;border-radius:8px;padding:5px 11px;min-height:32px}' +
    '.bdv-tk .dn{background:var(--accent,#1a56c4);border:1px solid var(--accent,#1a56c4);color:var(--on-accent,#fff);font-weight:600}' +
    '.bdv-tk .dx{background:none;border:1px solid var(--line,#dfe4ec);color:var(--muted,#5d6b80)}' +
    '.bdv-tk .dx:hover{border-color:var(--accent,#1a56c4);color:var(--accent,#1a56c4)}' +
    '@media (max-width:640px){.bdv-menu>div{position:relative}.bdv-tk{position:absolute;right:16px;top:5px}.bdv-tk b{max-width:110px}.bdv-tk .vt{display:none}}' +
    '.bdv-dn{position:fixed;inset:0;z-index:10;background:rgba(10,15,25,.45);display:none;align-items:center;justify-content:center;padding:16px}' +
    '.bdv-dn.mo{display:flex}' +
    '.bdv-dn>div,.bdv-cong{background:var(--card,#fff);color:var(--text,#17202e);border-radius:14px;max-width:400px;width:100%;padding:22px 22px 18px}' +
    '.bdv-dn>div{box-shadow:0 10px 40px rgba(0,0,0,.25)}' +
    '.bdv-cong{margin:28px auto;border:1px solid var(--line,#dfe4ec);text-align:center}' +
    '.bdv-dn h2,.bdv-cong h2{margin:0 0 6px;font-size:18px;color:var(--text,#17202e)}' +
    '.bdv-dn p,.bdv-cong p{margin:0 0 16px;font-size:14px;color:var(--muted,#5d6b80);line-height:1.5}' +
    '.bdv-g{min-height:44px;display:flex;justify-content:center}' +
    '.bdv-loi{color:var(--bad,#b3261e);font-size:13.5px;margin:12px 0 0;display:none;line-height:1.45;overflow-wrap:anywhere}' +
    '.bdv-dn .dong{display:block;margin:14px 0 0 auto;background:none;border:1px solid var(--line,#dfe4ec);border-radius:8px;padding:6px 14px;font:inherit;color:var(--muted,#5d6b80);cursor:pointer}' +
    '.bdv-cong .nho{font-size:12.5px;margin:14px 0 0}';
  document.head.appendChild(st);

  var hop = document.createElement('div');
  hop.className = 'bdv-dn';
  hop.setAttribute('role', 'dialog');
  hop.setAttribute('aria-modal', 'true');
  hop.innerHTML = '<div><h2>Đăng nhập</h2><p>Dùng tài khoản Google đã đăng ký với Ban Đoàn vụ.</p><div class="bdv-g"></div>' +
    '<div class="bdv-loi"></div><button type="button" class="dong">Để sau</button></div>';
  function ganHop() { if (!hop.parentNode && document.body) document.body.appendChild(hop); }
  ganHop();
  if (!hop.parentNode) document.addEventListener('DOMContentLoaded', ganHop);
  hop.addEventListener('click', function (e) { if (e.target === hop || e.target.className === 'dong') hop.className = 'bdv-dn'; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hop.className = 'bdv-dn'; });

  function hienLoi(m) {
    [].forEach.call(document.querySelectorAll('.bdv-loi'), function (l) { l.textContent = m || ''; l.style.display = m ? 'block' : 'none'; });
  }
  function veNutGoogle(el) {
    el.textContent = 'Đang tải nút đăng nhập Google…';
    sanSang().then(function (ok) {
      if (!ok) { el.textContent = 'Không tải được Google. Kiểm tra mạng rồi tải lại trang.'; return; }
      el.innerHTML = '';
      google.accounts.id.renderButton(el, { theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', locale: 'vi', width: 280 });
    });
  }
  function moHop() {
    ganHop();
    hienLoi('');
    hop.className = 'bdv-dn mo';
    veNutGoogle(hop.querySelector('.bdv-g'));
  }
  function veCong(el, lyDo) {
    el.innerHTML = '<div class="bdv-cong"><h2>Đăng nhập để xem</h2><p>' + esc(lyDo ||
      'Dashboard chỉ dành cho thành viên Ban Đoàn vụ. Đăng nhập bằng tài khoản Google bạn đã đăng ký với Ban.') + '</p>' +
      '<div class="bdv-g"></div><div class="bdv-loi"></div>' +
      '<p class="nho">Chưa đăng ký email? Nhờ quản lý thêm email của bạn vào sheet tài khoản. <a href="/bao-mat/">Quyền riêng tư</a></p></div>';
    veNutGoogle(el.querySelector('.bdv-g'));
    try { sanSang().then(function (ok) { if (ok) google.accounts.id.prompt(); }); } catch (e) {}
  }

  function veNut() {
    var o = document.querySelector('.bdv-menu > div');
    if (!o) return;
    var el = o.querySelector('.bdv-tk');
    if (!el) { el = document.createElement('div'); el.className = 'bdv-tk'; o.appendChild(el); }
    el.innerHTML = nguoi
      ? '<b title="' + esc(nguoi.email) + '">' + esc(nguoi.ten) + '</b>' + (nguoi.vaiTro === 'quanLy' ? '<span class="vt">Quản lý</span>' : '') +
        '<button type="button" class="dx">Đăng xuất</button>'
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
  function guiLen(body) {
    return fetch(API, { method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
      .then(function (x) { if (!x.ok) throw new Error('Máy chủ trả về lỗi ' + x.status); return x.json(); });
  }
  function nhanTheBai(r) {
    if (!r || !r.credential || choDangNhap) return;
    choDangNhap = true;
    hienLoi('');
    [].forEach.call(document.querySelectorAll('.bdv-g'), function (g) { g.style.opacity = '.5'; });
    guiLen({ action: 'dangNhap', idToken: r.credential })
      .then(function (o) {
        if (!o.ok) throw new Error(o.error || 'Có lỗi xảy ra.');
        if (!nguoi || nguoi.email !== o.data.nguoi.email) xoaBanLuu();
        phien = { t: o.data.phien, het: o.data.het }; ghi(K_PH, phien);
        nguoi = o.data.nguoi; ghi(K_NG, nguoi);
        hop.className = 'bdv-dn';
        bao();
      })
      .catch(function (e) {
        hienLoi(e && e.message ? e.message : String(e));
        try { google.accounts.id.disableAutoSelect(); } catch (er) {}
      })
      .then(function () {
        choDangNhap = false;
        [].forEach.call(document.querySelectorAll('.bdv-g'), function (g) { g.style.opacity = ''; });
      });
  }

  function dangXuat() {
    nguoi = null; phien = null;
    xoaBanLuu();
    try { if (window.google && google.accounts) google.accounts.id.disableAutoSelect(); } catch (e) {}
    bao();
  }

  function goi(action, req) {
    if (!phien || !(phien.het * 1000 > Date.now())) {
      var e0 = new Error('Bạn cần đăng nhập để xem dashboard.'); e0.canDangNhap = true;
      if (nguoi) { nguoi = null; phien = null; ghi(K_NG, null); ghi(K_PH, null); bao(); }
      return Promise.reject(e0);
    }
    return guiLen({ action: action, req: req || {}, token: phien.t }).then(function (o) {
      if (o.ok) return o.data;
      var e = new Error(o.error || 'Có lỗi xảy ra.');
      e.canDangNhap = !!o.canDangNhap; e.khongQuyen = !!o.khongQuyen;
      if (e.canDangNhap) { nguoi = null; phien = null; ghi(K_NG, null); ghi(K_PH, null); bao(); }
      throw e;
    });
  }

  window.BDV = {
    API: API,
    nguoi: function () { return nguoi; },
    laQuanLy: function () { return !!nguoi && nguoi.vaiTro === 'quanLy'; },
    duocXem: function (ma) { return !!nguoi && (nguoi.vaiTro === 'quanLy' || (nguoi.nhom || []).indexOf(ma) > -1); },
    goi: goi,
    veCong: veCong,
    moDangNhap: moHop,
    dangXuat: dangXuat,
    veNut: veNut
  };

  veNut();
  // Cập nhật lại vai trò / nhóm (quản lý có thể vừa sửa sheet tài khoản)
  if (phien) {
    goi('toi').then(function (nd) {
      if (JSON.stringify(nd) !== JSON.stringify(nguoi)) { nguoi = nd; ghi(K_NG, nguoi); bao(); }
    }).catch(function () {});
  }
  var nap = function () { setTimeout(sanSang, nguoi ? 2500 : 300); };
  if (document.readyState === 'complete') nap(); else window.addEventListener('load', nap);
})();
