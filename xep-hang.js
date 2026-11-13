/* Bảng xếp hạng dùng chung: trang Tổng quan (quản lý) và Trang chủ (thành viên).
   BDVXH.ve(nguoi, nhom, { coNhom, toi, ghiChu4t }) trả HTML; bấm nút tiêu chí gọi BDVXH.khiDoi(). */
(function () {
  var TEN_NGAN = { '4t': 'Truyền thông', 'nghiep-vu': 'Nghiệp vụ', 'csdl-csvc': 'CSDL - CSVC', 'noi-vu': 'Nội vụ' };
  var TIEU_CHI = [['xong', 'Nhiều việc xong nhất'], ['tyLe', 'Tỷ lệ hoàn thành']];
  var TOI_THIEU = 3, TOP = 5;
  var xh = 'xong';
  try { if (localStorage.getItem('bdv.xh') === 'tyLe') xh = 'tyLe'; } catch (e) {}

  var css = '.xh-dau{display:flex;gap:10px 16px;justify-content:space-between;align-items:flex-start;flex-wrap:wrap}' +
    '.xh{display:grid;grid-template-columns:1.4fr 1fr;gap:14px 28px;margin-top:12px}.xh.mot{grid-template-columns:1fr}' +
    '.xh h3{font-size:13px;font-weight:600;color:var(--muted);margin:0 0 4px;text-transform:uppercase;letter-spacing:.04em}' +
    '.hang{display:grid;grid-template-columns:34px 1fr auto;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line)}.hang:last-child{border-bottom:0}' +
    '.hang .hso{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:14px;background:var(--track);color:var(--muted);font-variant-numeric:tabular-nums}' +
    '.hang.h1 .hso{background:#f6c945;color:#5a4300}.hang.h2 .hso{background:#cfd6e0;color:#39465a}.hang.h3 .hso{background:#e2a874;color:#5a2f0a}' +
    '.hang.toi{background:rgba(76,134,232,.09);border-radius:8px;padding-left:6px;padding-right:6px}' +
    '.hang .ten{font-weight:600;font-size:14px;line-height:1.3;overflow-wrap:anywhere}.hang .ten small{display:block;font-weight:400;font-size:12px;color:var(--muted)}' +
    '.hang .ban{display:inline-block;margin-left:6px;padding:0 7px;border-radius:9px;background:#4c86e8;color:#fff;font-size:11px;font-weight:700;line-height:17px;vertical-align:1px}' +
    '.hang .diem{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}.hang .diem b{font-size:17px}.hang .diem span{display:block;font-size:12px;color:var(--muted)}' +
    '.hang .mini{height:5px;border-radius:3px;background:var(--track);margin-top:5px;overflow:hidden}.hang .mini i{display:block;height:100%;background:var(--s-done,#1baf7a);border-radius:3px}' +
    '.xh-toi{margin-top:12px;padding:10px 14px;border-radius:10px;background:rgba(76,134,232,.1);border:1px solid rgba(76,134,232,.3);font-size:14px}' +
    '.xh-toi b{font-size:16px}.xh-toi span{display:block;font-size:12.5px;color:var(--muted);margin-top:2px}' +
    '.xh-cach{text-align:center;color:var(--muted);font-size:12px;padding:2px 0;letter-spacing:.3em}' +
    '@media (max-width:820px){.xh{grid-template-columns:1fr}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function tyLe(xong, giao) { return giao ? xong / giao : 0; }
  function tong(n) { return (n.xong || 0) + (n.dangLam || 0) + (n.chuaLam || 0) + (n.chuaNhan || 0); }
  function chuan(s) { return String(s || '').trim().toLowerCase().normalize('NFC'); }

  function hang(i, ten, phu, chinh, duoi, pt, laToi) {
    return '<div class="hang' + (i < 3 ? ' h' + (i + 1) : '') + (laToi ? ' toi' : '') + '"><div class="hso">' + (i + 1) + '</div>' +
      '<div><div class="ten">' + ten + (laToi ? '<span class="ban">Bạn</span>' : '') + '<small>' + phu + '</small></div><div class="mini"><i style="width:' + Math.round(pt * 100) + '%"></i></div></div>' +
      '<div class="diem"><b>' + chinh + '</b><span>' + duoi + '</span></div></div>';
  }

  function ve(nguoi, nhom, o) {
    o = o || {};
    var toi = chuan(o.toi);
    var ds = (nguoi || []).filter(function (p) { return p.giao > 0 && (xh !== 'tyLe' || p.giao >= TOI_THIEU); });
    ds.sort(xh === 'tyLe'
      ? function (a, b) { return tyLe(b.xong, b.giao) - tyLe(a.xong, a.giao) || b.xong - a.xong || a.quaHan - b.quaHan; }
      : function (a, b) { return b.xong - a.xong || tyLe(b.xong, b.giao) - tyLe(a.xong, a.giao) || a.quaHan - b.quaHan; });
    var dong = function (p, i) {
      var r = tyLe(p.xong, p.giao), pt = Math.round(r * 100) + '%';
      var phu = (p.nhom || []).map(function (m) { return TEN_NGAN[m] || m; }).join(', ') + (p.quaHan ? ' · <span class="late">' + p.quaHan + ' quá hạn</span>' : '');
      var laToi = toi && chuan(p.ten) === toi;
      return xh === 'tyLe' ? hang(i, esc(p.ten), phu, pt, p.xong + ' / ' + p.giao + ' việc', r, laToi)
        : hang(i, esc(p.ten), phu, p.xong, 'việc xong · ' + pt, r, laToi);
    };
    var html = ds.slice(0, TOP).map(dong).join(''), hangToi = '';
    if (toi) {
      var vt = -1; ds.forEach(function (p, i) { if (vt < 0 && chuan(p.ten) === toi) vt = i; });
      if (vt >= TOP) html += '<div class="xh-cach">⋯</div>' + dong(ds[vt], vt);
      var ban = (nguoi || []).filter(function (p) { return chuan(p.ten) === toi; })[0];
      hangToi = '<div class="xh-toi">' + (vt > -1
        ? '<b>Bạn đang xếp thứ ' + (vt + 1) + '</b> / ' + ds.length + ' thành viên' + (vt === 0 ? ' 🏆' : vt < 3 ? ' 🎉' : '') +
          '<span>' + (xh === 'tyLe' ? 'Tỷ lệ hoàn thành ' + Math.round(tyLe(ban.xong, ban.giao) * 100) + '% (' + ban.xong + ' / ' + ban.giao + ' việc)'
            : ban.xong + ' việc đã xong' + (vt > 0 ? (ds[vt - 1].xong > ban.xong ? ' · còn ' + (ds[vt - 1].xong - ban.xong) + ' việc nữa là bằng hạng ' + vt : ' · bằng số việc với hạng ' + vt + ', xếp sau vì tỷ lệ / quá hạn') : '')) + '</span>'
        : !ban || !ban.giao ? '<b>Bạn chưa có trong bảng xếp hạng</b><span>Nhận việc trong trang nhóm để bắt đầu tính điểm.</span>'
        : '<b>Bạn chưa đủ điều kiện xếp theo tỷ lệ</b><span>Cần được giao từ ' + TOI_THIEU + ' việc (hiện có ' + ban.giao + ').</span>') + '</div>';
    }
    var cotNguoi = '<div><h3>Thành viên</h3>' + (html || '<div class="empty">' + (xh === 'tyLe' ? 'Chưa ai được giao từ ' + TOI_THIEU + ' việc trở lên.' : 'Chưa có việc nào được giao.') + '</div>') + '</div>';

    var cotNhom = '';
    if (o.coNhom) {
      var nh = (nhom || []).filter(function (n) { return !n.loi && tong(n) > 0; }).map(function (n) { return { n: n, t: tong(n), r: tyLe(n.xong, tong(n)) }; });
      nh.sort(function (a, b) { return b.r - a.r || a.n.quaHan - b.n.quaHan || b.n.xong - a.n.xong; });
      var chua = (nhom || []).filter(function (n) { return n.loi || !tong(n); }).length;
      var cuaToi = o.nhomToi || [];
      cotNhom = '<div><h3>Nhóm</h3>' + (nh.length ? nh.map(function (x, i) {
        var ten = o.linkNhom === false || (cuaToi.length && cuaToi.indexOf(x.n.ma) < 0) ? esc(x.n.ten)
          : '<a href="/' + x.n.ma + '/" style="text-decoration:none">' + esc(x.n.ten) + '</a>';
        return hang(i, ten, x.n.thanhVien + ' thành viên' + (x.n.quaHan ? ' · <span class="late">' + x.n.quaHan + ' quá hạn</span>' : ''),
          Math.round(x.r * 100) + '%', x.n.xong + ' / ' + x.t + ' xong', x.r, cuaToi.indexOf(x.n.ma) > -1);
      }).join('') : '<div class="empty">Chưa nhóm nào có việc.</div>') +
        (chua ? '<div class="note" style="margin-top:6px">' + chua + ' nhóm chưa có việc nên chưa xếp hạng.</div>' : '') + '</div>';
    }
    return '<div class="panel"><div class="xh-dau"><div><h2>Bảng xếp hạng</h2><div class="sub">' +
      (xh === 'tyLe' ? 'Top ' + TOP + ' thành viên có tỷ lệ hoàn thành cao nhất (được giao từ ' + TOI_THIEU + ' việc)' : 'Top ' + TOP + ' thành viên hoàn thành nhiều việc nhất') +
      (o.phamVi ? ' ' + o.phamVi : '') + (o.coNhom ? ' · nhóm xếp theo tỷ lệ hoàn thành' : '') + '</div></div>' +
      '<div class="seg" role="group" aria-label="Tiêu chí xếp hạng">' + TIEU_CHI.map(function (c) {
        return '<button type="button" data-xh="' + c[0] + '" aria-pressed="' + (xh === c[0]) + '">' + c[1] + '</button>';
      }).join('') + '</div></div>' +
      hangToi + '<div class="xh' + (o.coNhom ? '' : ' mot') + '">' + cotNguoi + cotNhom + '</div>' +
      '<div class="note" style="margin-top:8px">Bằng điểm thì xét tiếp tỷ lệ / số việc xong, rồi ít việc quá hạn hơn xếp trên.' +
      (o.ghiChu4t ? ' Truyền thông tính theo việc con nên số việc thường cao hơn các nhóm khác.' : '') + '</div></div>';
  }

  var BDVXH = { ve: ve, khiDoi: null };
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-xh]');
    if (!b || b.getAttribute('data-xh') === xh) return;
    xh = b.getAttribute('data-xh');
    try { localStorage.setItem('bdv.xh', xh); } catch (er) {}
    if (BDVXH.khiDoi) BDVXH.khiDoi();
  });
  window.BDVXH = BDVXH;
})();
