/* Hiển thị lịch học (lưới tuần) và lịch thi (bảng) — dùng ở Hồ sơ của tôi và trang Nội vụ.
   BDVLH.luoi(slots, { truc: true })   slot = { thu: 2..8 (8 = CN), tu: 'HH:MM', den, mon, phong }
   BDVLH.bangThi(ds, { homNay, sua })  ds = [{ id, mon, ngay: yyyy-mm-dd, gio, ghiChu }]  */
(function () {
  if (window.BDVLH) return;
  var THU = ['', '', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
  var THU_NGAN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  var CA_TRUC = [['08:00', '11:00', 'Ca trực sáng'], ['14:00', '17:00', 'Ca trực chiều']];
  var PX = 44; // px / giờ
  var css = '.lh-wrap{overflow-x:auto;margin-top:8px}.lh{display:grid;grid-template-columns:44px repeat(7,minmax(84px,1fr));min-width:640px;font-size:12.5px}' +
    '.lh-h{text-align:center;font-weight:700;font-size:12.5px;color:var(--muted);padding:4px 0 6px;border-bottom:1px solid var(--line)}' +
    '.lh-gio{position:relative;border-right:1px solid var(--line)}.lh-gio span{position:absolute;right:6px;transform:translateY(-50%);font-size:11px;color:var(--muted);font-variant-numeric:tabular-nums}' +
    '.lh-c{position:relative;border-right:1px solid var(--line);background-image:repeating-linear-gradient(to bottom,var(--line) 0,var(--line) 1px,transparent 1px,transparent ' + PX + 'px)}.lh-c:last-child{border-right:0}' +
    '.lh-c.cn{background-color:rgba(127,127,127,.05)}' +
    '.lh-truc{position:absolute;left:0;right:0;background:rgba(27,175,122,.10);border-top:1px dashed rgba(27,175,122,.55);border-bottom:1px dashed rgba(27,175,122,.55)}' +
    '.lh-b{position:absolute;left:3px;right:3px;border-radius:7px;background:#4c86e8;color:#fff;padding:3px 6px;overflow:hidden;line-height:1.25;box-shadow:0 1px 2px rgba(0,0,0,.12)}' +
    '.lh-b b{display:block;font-size:12px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lh-b span{display:block;font-size:11px;opacity:.9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.lh-chu{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--muted);margin-top:6px}.lh-chu i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}' +
    '.lh-trong{padding:18px;text-align:center;color:var(--muted);border:1px dashed var(--line);border-radius:10px;margin-top:8px}' +
    '.lt{width:100%;border-collapse:collapse;font-size:13.5px;margin-top:6px}.lt th{font-size:12px;color:var(--muted);text-align:left;font-weight:600;padding:6px 8px;border-bottom:1px solid var(--line)}' +
    '.lt td{padding:8px;border-bottom:1px solid var(--line);vertical-align:top}.lt tr.qua td{opacity:.55}.lt tr.gan td:first-child{box-shadow:inset 3px 0 0 #e8a33c}' +
    '.lt .ngay b{display:block}.lt .ngay span{font-size:12px;color:var(--muted)}.lt .con{font-size:12px;font-weight:600;color:#b86e00;white-space:nowrap}.lt td.nut{text-align:right;white-space:nowrap}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function phut(h) { var p = String(h || '').split(':'); return (+p[0]) * 60 + (+p[1] || 0); }
  function hopLe(x) { return x && x.thu >= 2 && x.thu <= 8 && /^\d{2}:\d{2}$/.test(x.tu || '') && /^\d{2}:\d{2}$/.test(x.den || '') && phut(x.den) > phut(x.tu); }

  function luoi(slots, o) {
    o = o || {};
    var ds = (slots || []).filter(hopLe);
    if (!ds.length && !o.hienTrong) return '<div class="lh-trong">' + esc(o.trong || 'Chưa có lịch học.') + '</div>';
    var bd = 7 * 60, kt = 18 * 60;
    ds.forEach(function (x) { bd = Math.min(bd, Math.floor(phut(x.tu) / 60) * 60); kt = Math.max(kt, Math.ceil(phut(x.den) / 60) * 60); });
    var cao = (kt - bd) / 60 * PX, y = function (m) { return (m - bd) / 60 * PX; };
    var h = '<div class="lh-wrap"><div class="lh"><div class="lh-h"></div>';
    for (var t = 2; t <= 8; t++) h += '<div class="lh-h">' + THU[t] + '</div>';
    h += '<div class="lh-gio" style="height:' + cao + 'px">';
    for (var g = bd + 60; g < kt; g += 60) h += '<span style="top:' + y(g) + 'px">' + (g / 60) + 'h</span>';
    h += '</div>';
    for (var d = 2; d <= 8; d++) {
      h += '<div class="lh-c' + (d === 8 ? ' cn' : '') + '" style="height:' + cao + 'px">';
      if (o.truc !== false && d <= 6) CA_TRUC.forEach(function (c) { h += '<div class="lh-truc" style="top:' + y(phut(c[0])) + 'px;height:' + (y(phut(c[1])) - y(phut(c[0]))) + 'px" title="' + c[2] + ' ' + c[0] + '–' + c[1] + '"></div>'; });
      ds.filter(function (x) { return +x.thu === d; }).forEach(function (x) {
        var top = y(phut(x.tu)), ht = Math.max(y(phut(x.den)) - top, 20);
        var tt = x.mon + ' · ' + x.tu + '–' + x.den + (x.phong ? ' · ' + x.phong : '');
        h += '<div class="lh-b" style="top:' + top + 'px;height:' + ht + 'px" title="' + esc(tt) + '"><b>' + esc(x.mon) + '</b><span>' + x.tu + '–' + x.den + '</span>' + (x.phong ? '<span>' + esc(x.phong) + '</span>' : '') + '</div>';
      });
      h += '</div>';
    }
    h += '</div></div>';
    if (o.truc !== false) h += '<div class="lh-chu"><span><i style="background:#4c86e8"></i>Giờ học</span><span><i style="background:rgba(27,175,122,.25);border:1px dashed rgba(27,175,122,.7)"></i>Ca trực văn phòng (8–11h, 14–17h)</span></div>';
    return h;
  }

  function ngayChu(iso) { var p = iso.split('-'); return THU_NGAN[new Date(+p[0], +p[1] - 1, +p[2]).getDay()] + ', ' + p[2] + '/' + p[1] + '/' + p[0]; }
  function soNgay(a, b) { var x = a.split('-'), y = b.split('-'); return Math.round((Date.UTC(+y[0], +y[1] - 1, +y[2]) - Date.UTC(+x[0], +x[1] - 1, +x[2])) / 864e5); }
  function bangThi(ds, o) {
    o = o || {};
    if (!ds || !ds.length) return '<div class="lh-trong">' + esc(o.trong || 'Chưa có lịch thi.') + '</div>';
    var homNay = o.homNay || '';
    return '<div style="overflow-x:auto"><table class="lt"><thead><tr>' + (o.ten ? '<th>Thành viên</th>' : '') + '<th>Ngày thi</th><th>Môn thi</th><th>Giờ</th><th>Phòng / ghi chú</th>' + (o.sua ? '<th></th>' : '') + '</tr></thead><tbody>' +
      ds.map(function (x) {
        var con = homNay && x.ngay ? soNgay(homNay, x.ngay) : null;
        var cls = con !== null && con < 0 ? 'qua' : con !== null && con <= 7 ? 'gan' : '';
        return '<tr class="' + cls + '">' + (o.ten ? '<td><b>' + esc(x.ten) + '</b></td>' : '') +
          '<td class="ngay"><b>' + (x.ngay ? ngayChu(x.ngay) : '—') + '</b>' + (con === 0 ? '<span class="con">Hôm nay</span>' : con > 0 && con <= 7 ? '<span class="con">còn ' + con + ' ngày</span>' : con < 0 ? '<span>đã thi</span>' : '') + '</td>' +
          '<td>' + esc(x.mon) + '</td><td>' + esc(x.gio || '—') + '</td><td>' + esc(x.ghiChu || '') + '</td>' +
          (o.sua ? '<td class="nut">' + o.sua(x) + '</td>' : '') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  window.BDVLH = { luoi: luoi, bangThi: bangThi, THU: THU, phut: phut, ngayChu: ngayChu };
})();
