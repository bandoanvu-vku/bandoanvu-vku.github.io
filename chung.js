/* Tiện ích nhỏ dùng chung cho các trang mới. */
window.T = (function () {
  var tT;
  return {
    $: function (id) { return document.getElementById(id); },
    esc: function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); },
    toast: function (m, err) {
      var t = document.getElementById('toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
      t.textContent = m; t.className = err ? 'err' : ''; t.style.display = 'block'; clearTimeout(tT); tT = setTimeout(function () { t.style.display = 'none'; }, err ? 7000 : 2800);
    },
    // Khung trang: gọi tai() khi đã đăng nhập, vẽ cổng đăng nhập khi chưa
    khoi: function (app, tai) {
      function chan() { BDV.veCong(app); }
      document.addEventListener('bdv-nguoi', function (e) { if (!e.detail) chan(); else tai(); });
      if (!BDV.nguoi()) chan(); else tai();
    },
    // Tải dữ liệu đọc: hiện ngay bản lưu lần trước (nếu có) rồi vẽ lại khi máy chủ trả bản mới.
    // Lỗi mạng khi đã có bản lưu thì chỉ báo nhỏ, không xoá nội dung đang hiện.
    tai: function (app, action, req, nhan) {
      var daVe = false;
      return BDV.tai(action, req || {}, function (d, cu) { daVe = true; nhan(d, cu); })
        .catch(function (e) { if (daVe && !(e && (e.canDangNhap || e.khongQuyen))) T.toast('Chưa cập nhật được: ' + (e && e.message ? e.message : e), true); else T.loi(app, e); });
    },
    loi: function (app, e) {
      if (e && e.canDangNhap) { BDV.veCong(app); return; }
      app.innerHTML = '<div class="panel empty">' + (e && e.khongQuyen ? 'Mục này chỉ dành cho quản lý.' : 'Không tải được: ' + T.esc(e && e.message ? e.message : e)) + '</div>';
    }
  };
})();
