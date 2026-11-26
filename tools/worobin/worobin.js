
(function(){
  var toc = document.querySelector('.w18-toc');
  if (toc && 'IntersectionObserver' in window) {
    var links = [].slice.call(toc.querySelectorAll('a')), map = {}, cur = null, ol = toc.querySelector('ol');
    links.forEach(function(a){ map[a.getAttribute('href').slice(1)] = a; });
    var set = function(id){
      if (cur === id) return; cur = id;
      links.forEach(function(a){ var on = a === map[id]; a.classList.toggle('is-on', on); on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'); });
      var a = map[id]; if (a && ol.scrollWidth > ol.clientWidth) ol.scrollTo({ left: a.offsetLeft - ol.clientWidth / 2 + a.offsetWidth / 2, behavior: 'smooth' });
    };
    var ob = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) set(e.target.id); }); }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(map).forEach(function(id){ var s = document.getElementById(id); if (s) ob.observe(s); });
    var hero = document.querySelector('.w18-hero');
    if (hero) new IntersectionObserver(function(es){ if (es[0].isIntersecting) set(null); }, { rootMargin: '0px 0px -60% 0px' }).observe(hero);
  }
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var els = document.querySelectorAll('.w18-p, .w18-q, .w18-qhero, .w18-court, .w18-after li, .w18-bio, .w18-names li, .w18-tl > li:not(.grp), .w18-inn article, .w18-bios article, .w18-waves article, .w18-why-c, .w18-rep-tl li, .w18-pre-b');
    var ro = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } }); }, { rootMargin: '0px 0px -6% 0px' });
    [].forEach.call(els, function(el, i){
      if (el.getBoundingClientRect().top < innerHeight) return;
      el.classList.add('ds-reveal'); el.style.transitionDelay = (i % 3) * 70 + 'ms'; ro.observe(el);
    });
  }
  var lb = document.getElementById('w18Lb');
  if (lb) {
    var im = lb.querySelector('img'), cp = lb.querySelector('p');
    (function(){var s=document.getElementById('dvi-pamiati'); if(!s) return; var bs=s.querySelectorAll('.w18-two-tg button');
      [].forEach.call(bs,function(b){ b.addEventListener('click',function(){ s.setAttribute('data-view',b.getAttribute('data-v')); [].forEach.call(bs,function(x){ x.setAttribute('aria-pressed', x===b ? 'true':'false'); }); }); });
    })();
    [].forEach.call(document.querySelectorAll('[data-lb]'), function(b){
      b.addEventListener('click', function(){
        im.src = b.getAttribute('data-lb'); var src = b.querySelector('img'); im.alt = src ? src.alt : '';
        cp.textContent = b.getAttribute('data-cap') || '';
        if (lb.showModal) lb.showModal(); else lb.setAttribute('open', '');
      });
    });
    lb.addEventListener('click', function(e){ if (e.target !== im) lb.close ? lb.close() : lb.removeAttribute('open'); });
  }
})();
(function(){
  var dv = document.getElementById('w18Dv'); if (!dv) return;
  var data = null, order = [], cur = -1, page = 0, lastFocus = null;
  var $ = function(id){ return document.getElementById(id); };
  var stage = $('w18DvStage'), img = $('w18DvImg'), tr = $('w18DvTr'), pg = $('w18DvP'), body = dv.querySelector('.w18-dv-body');
  var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
  function load(cb){
    if (data) return cb();
    fetch('w18-docs.json').then(function(r){ return r.json(); }).then(function(j){ data = {}; j.forEach(function(d){ data[d.id] = d; order.push(d.id); }); cb(); });
  }
  function render(d){
    var h = '<span class="w18-dv-st ' + d.st + '">' + ({ ok: 'Переклад звірено зі сканом', part: 'Переклад звірено частково', raw: 'Переклад ще не звірено зі сканом' })[d.st] + '</span>';
    h += '<h3>' + esc(d.title) + '</h3><p class="meta">' + esc(d.date) + (d.arch ? ' · ' + esc(d.arch) : '') + ' · справа № 67/22</p>';
    var ul = false;
    d.tr.forEach(function(b){
      var k = b[0], t = b[1];
      if (k !== 'li' && ul) { h += '</ul>'; ul = false; }
      if (k === 'img') {
        var m = String(t).match(/IMG_(\d{4})/), i = m ? d.pages.indexOf(+m[1]) : -1;
        h += i > -1 ? '<button type="button" class="pg" data-p="' + i + '">' + esc(t) + '</button>' : '<div class="pg no">' + esc(t) + ' · скан ще не додано</div>';
      } else if (k === 'li') { if (!ul) { h += '<ul>'; ul = true; } h += '<li>' + esc(t) + '</li>'; }
      else if (k === 'table') {
        h += '<div class="tw"><table>' + t.map(function(r, ri){ return '<tr>' + r.map(function(c){ return ri ? '<td>' + esc(c) + '</td>' : '<th>' + esc(c) + '</th>'; }).join('') + '</tr>'; }).join('') + '</table></div>';
      }
      else if (k === 'stamp') h += '<p class="stamp">' + esc(t) + '</p>';
      else if (k === 'sig') h += '<p class="sig">' + esc(t) + '</p>';
      else h += '<p' + (/^(\[Переклад звірено|Примітка)/.test(t) ? ' class="note"' : '') + '>' + esc(t) + '</p>';
    });
    if (ul) h += '</ul>';
    tr.innerHTML = h; tr.scrollTop = 0;
  }
  function show(i){
    var d = data[order[cur]]; page = i;
    stage.classList.add('is-load');
    img.onload = function(){ stage.classList.remove('is-load'); };
    img.src = 'w18-scans/IMG_' + d.pages[i] + '.webp';
    img.alt = d.title + ', скан IMG_' + d.pages[i];
    [].forEach.call(pg.children, function(b, j){ b.classList.toggle('is-on', j === i); });
    [].forEach.call(tr.querySelectorAll('.pg[data-p]'), function(b){ b.classList.toggle('is-on', +b.getAttribute('data-p') === i); });
    if (d.pages[i + 1]) { var pre = new Image(); pre.src = 'w18-scans/IMG_' + d.pages[i + 1] + '.webp'; }
  }
  function open(id, keepFocus){
    load(function(){
      if (!data[id]) return;
      cur = order.indexOf(id); var d = data[id];
      $('w18DvD').textContent = d.date; $('w18DvT').textContent = d.title; $('w18DvA').textContent = d.arch;
      $('w18DvN').textContent = (cur + 1) + ' / ' + order.length;
      pg.innerHTML = d.pages.length > 1 ? d.pages.map(function(p, j){ return '<button type="button" data-p="' + j + '" aria-label="Аркуш ' + (j + 1) + '"><img src="w18-scans/t/IMG_' + p + '.webp" alt="" loading="lazy"></button>'; }).join('') : '';
      render(d); show(0);
      if (dv.hidden) { lastFocus = document.activeElement; dv.hidden = false; document.documentElement.style.overflow = 'hidden'; }
      if (!keepFocus) dv.querySelector('.w18-dv-x').focus();
      try { history.replaceState(null, '', '#doc-' + id); } catch (e) {}
    });
  }
  function close(){
    dv.hidden = true; document.documentElement.style.overflow = ''; img.removeAttribute('src');
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('[data-doc]');
    if (b) { e.preventDefault(); open(b.getAttribute('data-doc')); }
  });
  dv.querySelector('.w18-dv-x').addEventListener('click', close);
  [].forEach.call(dv.querySelectorAll('[data-go]'), function(b){ b.addEventListener('click', function(){ var n = cur + +b.getAttribute('data-go'); if (n >= 0 && n < order.length) open(order[n], true); }); });
  [].forEach.call(dv.querySelectorAll('.w18-dv-tabs button'), function(b){ b.addEventListener('click', function(){
    body.setAttribute('data-v', b.getAttribute('data-v'));
    [].forEach.call(dv.querySelectorAll('.w18-dv-tabs button'), function(x){ x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
  }); });
  pg.addEventListener('click', function(e){ var b = e.target.closest('button'); if (b) show(+b.getAttribute('data-p')); });
  tr.addEventListener('click', function(e){
    var b = e.target.closest('.pg[data-p]'); if (!b) return; show(+b.getAttribute('data-p'));
    if (getComputedStyle(dv.querySelector('.w18-dv-tabs')).display !== 'none') dv.querySelector('.w18-dv-tabs [data-v="scan"]').click();
  });
  var sc = 1, fitW = 0, fitH = 0, ptrs = {}, pinch = null, pan = null, moved = false;
  function fit(){
    if (!img.naturalWidth) return;
    var cs = getComputedStyle(stage), pw = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), ph = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var r = Math.min(pw / img.naturalWidth, ph / img.naturalHeight);
    fitW = img.naturalWidth * r; fitH = img.naturalHeight * r;
  }
  function setZ(n, cx, cy){
    n = Math.max(1, Math.min(6, n));
    var rect = stage.getBoundingClientRect();
    if (cx === undefined) { cx = rect.left + stage.clientWidth / 2; cy = rect.top + stage.clientHeight / 2; }
    var ir = img.getBoundingClientRect(), fx = (cx - ir.left) / ir.width, fy = (cy - ir.top) / ir.height;
    sc = n;
    img.style.width = fitW * sc + 'px'; img.style.height = fitH * sc + 'px';
    stage.classList.toggle('is-z', sc > 1.001);
    var ir2 = img.getBoundingClientRect();
    stage.scrollLeft += (ir2.left + fx * ir2.width) - cx;
    stage.scrollTop += (ir2.top + fy * ir2.height) - cy;
    $('w18DvZ').textContent = Math.round(sc * 100) + '%';
  }
  function reset(){ fit(); sc = 1; img.style.width = fitW + 'px'; img.style.height = fitH + 'px'; stage.classList.remove('is-z'); stage.scrollLeft = stage.scrollTop = 0; $('w18DvZ').textContent = '100%'; }
  img.addEventListener('load', reset);
  addEventListener('resize', function(){ if (!dv.hidden) { var k = sc; reset(); if (k > 1) setZ(k); } });
  [].forEach.call(dv.querySelectorAll('[data-z]'), function(b){ b.addEventListener('click', function(){ var z = +b.getAttribute('data-z'); if (!z) reset(); else setZ(sc * (z > 0 ? 1.5 : 1 / 1.5)); }); });
  stage.addEventListener('wheel', function(e){ e.preventDefault(); setZ(sc * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0022)), e.clientX, e.clientY); }, { passive: false });
  stage.addEventListener('pointerdown', function(e){
    ptrs[e.pointerId] = { x: e.clientX, y: e.clientY }; stage.setPointerCapture(e.pointerId); moved = false;
    var ids = Object.keys(ptrs);
    if (ids.length === 2) { var a = ptrs[ids[0]], b = ptrs[ids[1]]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: sc }; pan = null; }
    else if (ids.length === 1) pan = { x: e.clientX, y: e.clientY, l: stage.scrollLeft, t: stage.scrollTop };
  });
  stage.addEventListener('pointermove', function(e){
    if (!ptrs[e.pointerId]) return; ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(ptrs);
    if (pinch && ids.length === 2) { var a = ptrs[ids[0]], b = ptrs[ids[1]]; setZ(pinch.s * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, (a.x + b.x) / 2, (a.y + b.y) / 2); moved = true; }
    else if (pan) { var dx = e.clientX - pan.x, dy = e.clientY - pan.y; if (Math.abs(dx) + Math.abs(dy) > 5) { moved = true; stage.classList.add('is-drag'); } stage.scrollLeft = pan.l - dx; stage.scrollTop = pan.t - dy; }
  });
  function up(e){ delete ptrs[e.pointerId]; if (Object.keys(ptrs).length < 2) pinch = null; if (!Object.keys(ptrs).length) { pan = null; stage.classList.remove('is-drag'); } }
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
  var lastTap = 0;
  stage.addEventListener('click', function(e){
    if (moved) { moved = false; return; }
    if (e.target !== img) return;
    var now = Date.now();
    if (e.pointerType === 'touch' || (e.detail === 0)) { if (now - lastTap < 320) { sc > 1.01 ? reset() : setZ(2.5, e.clientX, e.clientY); } lastTap = now; return; }
    sc > 1.01 ? reset() : setZ(2.5, e.clientX, e.clientY);
  });
  document.addEventListener('keydown', function(e){
    if (dv.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      var d = data[order[cur]], s = e.key === 'ArrowRight' ? 1 : -1;
      if (d.pages[page + s] !== undefined) show(page + s);
      else if (order[cur + s]) open(order[cur + s], true);
    } else if (e.key === 'Tab') {
      var f = [].filter.call(dv.querySelectorAll('button, [tabindex="0"]'), function(x){ return x.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  var m = location.hash.match(/^#doc-([a-z]\d+)$/); if (m) open(m[1]);
})();
(function(){
  var rm = matchMedia('(prefers-reduced-motion: reduce)').matches, io = 'IntersectionObserver' in window;
  var ease = function(t){ return t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; };
  /* прогрес читання */
  var pr = document.querySelector('.w18-prog');
  if (pr && !(window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()'))) {
    var tk = false;
    var upd = function(){ tk = false; var m = document.documentElement.scrollHeight - innerHeight; pr.style.transform = 'scaleX(' + (m > 0 ? Math.min(1, scrollY / m) : 0) + ')'; };
    addEventListener('scroll', function(){ if (!tk) { tk = true; requestAnimationFrame(upd); } }, { passive: true }); upd();
  }

  /* словничок: перше згадування терміна стає підказкою */
  var G = window.W18_GLOSS || [];
  var main = document.querySelector('main.w18'), tip = null, tipFor = null, tShown = 0;
  if (main && G.length) {
    tip = document.createElement('div'); tip.className = 'w18-tip'; tip.setAttribute('role', 'tooltip'); document.body.appendChild(tip);
    var used = {}, L = 'А-Яа-яІіЇїЄєҐґ\'’';
    var walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, { acceptNode: function(n){
      var p = n.parentNode; if (!p || !n.nodeValue.trim()) return 2;
      if (p.closest('h1,h2,h3,h4,button,a,summary,.w18-vl-a,.w18-vl-sc,.w18-gloss,.w18-hero,.w18-toc,.w18-act,figcaption,.w18-src,script,style,svg,time,.w18-dv,dialog,.w18-vl-key,small,cite,label,th')) return 2;
      return 1; } });
    var nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    G.forEach(function(g, gi){
      var re = new RegExp('(^|[^' + L + '])(' + g[0] + ')', 'iu');
      for (var i = 0; i < nodes.length && !used[gi]; i++) {
        var n = nodes[i], m = re.exec(n.nodeValue); if (!m) continue;
        var st = m.index + m[1].length, word = m[2];
        var after = n.splitText(st); after.nodeValue = after.nodeValue.slice(word.length);
        var b = document.createElement('button'); b.type = 'button'; b.className = 'w18-term'; b.textContent = word; b.setAttribute('data-g', gi);
        b.setAttribute('aria-label', word + ': ' + g[1] + ' — ' + g[2]);
        n.parentNode.insertBefore(b, after); nodes.splice(i + 1, 0, after); used[gi] = 1;
      }
    });
    var show = function(b){
      var g = G[+b.getAttribute('data-g')]; if (tipFor !== b || !tip.classList.contains('on')) tShown = Date.now(); tipFor = b;
      tip.innerHTML = '<b></b><span></span>'; tip.firstChild.textContent = g[1]; tip.lastChild.textContent = g[2];
      var r = b.getBoundingClientRect(), tw = Math.min(320, innerWidth - 32);
      tip.style.left = Math.max(16, Math.min(r.left + r.width / 2 - tw / 2, innerWidth - tw - 16)) + 'px';
      tip.style.width = tw + 'px';
      var top = r.top - 10; tip.classList.add('on');
      var th = tip.offsetHeight; tip.style.top = (top - th > 70 ? top - th : r.bottom + 10) + 'px';
    };
    var hide = function(){ tip.classList.remove('on'); tipFor = null; };
    main.addEventListener('mouseover', function(e){ var b = e.target.closest && e.target.closest('.w18-term'); if (b) show(b); });
    main.addEventListener('mouseout', function(e){ var b = e.target.closest && e.target.closest('.w18-term'); if (b) hide(); });
    main.addEventListener('focusin', function(e){ if (e.target.classList && e.target.classList.contains('w18-term')) show(e.target); });
    main.addEventListener('focusout', hide);
    main.addEventListener('click', function(e){ var b = e.target.closest && e.target.closest('.w18-term'); if (b) { e.preventDefault(); tipFor === b && tip.classList.contains('on') && Date.now() - tShown > 450 ? hide() : show(b); } else if (tipFor) hide(); });
    addEventListener('scroll', function(){ if (tipFor) hide(); }, { passive: true });
  }

  /* лічильники */
  var count = function(el){
    var to = +el.getAttribute('data-count'), t0 = null;
    if (rm) { el.textContent = to; return; }
    var step = function(t){ if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(to * ease(p)); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  var heroN = document.querySelectorAll('.w18-hero .cover-facts dd');
  [].forEach.call(heroN, function(d){ var v = parseInt(d.textContent, 10); if (!isNaN(v)) { d.setAttribute('data-count', v); count(d); } });

  /* «Під чиєю владою»: відрізки ↔ картки */
  var vl = document.getElementById('vlada');
  if (vl) {
    var rows = {}; [].forEach.call(vl.querySelectorAll('.w18-vl-list li'), function(li){ rows[li.getAttribute('data-e')] = li; });
    var segs = vl.querySelectorAll('[data-e]');
    var pick = function(e, scroll){
      [].forEach.call(segs, function(s){ s.classList.toggle('on', s.getAttribute('data-e') === e && s.tagName !== 'LI'); });
      Object.keys(rows).forEach(function(k){ rows[k].classList.toggle('on', k === e); });
      if (scroll && rows[e]) { var r = rows[e].getBoundingClientRect(); if (r.top < 90 || r.bottom > innerHeight) rows[e].scrollIntoView({ behavior: rm ? 'auto' : 'smooth', block: 'center' }); }
    };
    [].forEach.call(vl.querySelectorAll('.w18-vl-det [data-e], .w18-vl-ov [data-e]'), function(s){
      s.addEventListener('click', function(){ pick(s.getAttribute('data-e'), true); });
      s.addEventListener('mouseenter', function(){ pick(s.getAttribute('data-e'), false); });
    });
    Object.keys(rows).forEach(function(k){ rows[k].addEventListener('mouseenter', function(){ pick(k, false); }); });
    if (io) {
      var co = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) { [].forEach.call(vl.querySelectorAll('[data-count]'), count); co.disconnect(); } }); }, { threshold: .4 });
      co.observe(vl.querySelector('.w18-vl-stats'));
    }
  }
  if (!io) return;

  /* одноразові появи */
  if (!rm) {
    var once = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('in'); once.unobserve(e.target); } }); }, { rootMargin: '0px 0px -12% 0px' });
    [].forEach.call(document.querySelectorAll('.w18 .ds-sh, .w18-act'), function(el){
      if (el.getBoundingClientRect().top < innerHeight * .85) return;
      el.classList.add('pre'); once.observe(el);
    });
  }
  /* активний крок */
  var act = function(sel, cb){
    var items = [].slice.call(document.querySelectorAll(sel)); if (!items.length) return;
    var ob = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) cb(e.target, items); }); }, { rootMargin: '-38% 0px -52% 0px' });
    items.forEach(function(it){ ob.observe(it); });
  };
  act('.w18-pre-step', function(t, items){ items.forEach(function(x){ x.classList.toggle('is-on', x === t); }); });

  /* карта: підсвітка й наближення */
  var svg = document.getElementById('w18Rail');
  if (svg) {
    var W = +svg.getAttribute('data-w'), H = +svg.getAttribute('data-h'), A = W / H;
    var groups = [].slice.call(svg.querySelectorAll('.rl-st[data-st]'));
    var vb = [0, 0, W, H], anim = null;
    var circles = svg.querySelectorAll('circle[data-r], circle.mp-pulse'), rects = svg.querySelectorAll('rect[data-c]');
    var apply = function(b){
      vb = b; svg.setAttribute('viewBox', b.map(function(v){ return v.toFixed(1); }).join(' '));
      var k = b[2] / W; svg.style.setProperty('--k', k); svg.classList.toggle('zoomed', k < .97);
      [].forEach.call(circles, function(c){ var r0 = +(c.getAttribute('data-r') || c.getAttribute('data-r0') || (c.setAttribute('data-r0', c.getAttribute('r')), c.getAttribute('r'))); c.setAttribute('r', (r0 * k).toFixed(2)); });
      [].forEach.call(rects, function(r){ var c = r.getAttribute('data-c').split(','), s = 7 * k; r.setAttribute('x', (+c[0] - s / 2).toFixed(2)); r.setAttribute('y', (+c[1] - s / 2).toFixed(2)); r.setAttribute('width', s.toFixed(2)); r.setAttribute('height', s.toFixed(2)); r.setAttribute('rx', (1.5 * k).toFixed(2)); });
    };
    var fly = function(to){
      if (anim) cancelAnimationFrame(anim);
      var from = vb.slice(), t0 = null;
      if (rm) return apply(to);
      var step = function(t){ if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1100), e = ease(p);
        apply(from.map(function(v, i){ return v + (to[i] - v) * e; })); if (p < 1) anim = requestAnimationFrame(step); };
      anim = requestAnimationFrame(step);
    };
    var zoomOK = function(){ return innerWidth > 900; };
    act('.w18-rep-tl li', function(t, items){
      items.forEach(function(x){ x.classList.toggle('is-on', x === t); });
      var on = (t.getAttribute('data-st') || '').split(' '), xs = [], ys = [];
      groups.forEach(function(g){ var hit = on.indexOf(g.getAttribute('data-st')) > -1; g.classList.toggle('on', hit);
        if (hit) { xs.push(+g.getAttribute('data-x')); ys.push(+g.getAttribute('data-y')); } });
      if (!zoomOK()) return;
      if (!xs.length || on.indexOf('shep') > -1) return fly([0, 0, W, H]);
      var x0 = Math.min.apply(0, xs) - 70, x1 = Math.max.apply(0, xs) + 70, y0 = Math.min.apply(0, ys) - 90, y1 = Math.max.apply(0, ys) + 90;
      var w = x1 - x0, h = y1 - y0; if (h < 300) { y0 -= (300 - h) / 2; h = 300; }
      if (w / h < A) { var nw = h * A; x0 -= (nw - w) / 2; w = nw; } else { var nh = w / A; y0 -= (nh - h) / 2; h = nh; }
      if (h > H) { fly([0, 0, W, H]); return; }
      fly([x0, y0, w, h]);
    });
  }
})();

(function(){
  var sec = document.getElementById('kharkiv-1925'); if (!sec) return;
  var stage = sec.querySelector('.w18-k25-stage'), sc = sec.querySelector('.w18-k25-scroll');
  var rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var faces = {}, legs = {};
  [].forEach.call(sec.querySelectorAll('.w18-k25-f'), function(f){ faces[f.getAttribute('data-k')] = f; });
  [].forEach.call(sec.querySelectorAll('.w18-k25-row a'), function(a){ legs[a.getAttribute('data-k')] = a; });
  var cur = null, timer = null;
  var hl = function(k){
    if (cur === k) return; clear(); var f = faces[k]; if (!f) return; cur = k;
    f.classList.add('on'); if (legs[k]) legs[k].classList.add('on');
    var W = stage.offsetWidth;
    stage.style.setProperty('--fx', f.style.left); stage.style.setProperty('--fy', f.style.top);
    stage.style.setProperty('--fr', (f.offsetWidth * .62) + 'px');
    stage.classList.add('is-hl');
  };
  var clear = function(){
    if (!cur) return; if (faces[cur]) faces[cur].classList.remove('on'); if (legs[cur]) legs[cur].classList.remove('on');
    stage.classList.remove('is-hl'); cur = null;
  };
  var toCard = function(k){
    var c = document.getElementById(k === 'dytyna' || k === 'nevidomyi' ? 'k25-x' : 'k25-' + k); if (!c) return;
    c.scrollIntoView({ behavior: rm ? 'auto' : 'smooth', block: 'center' });
    c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash');
    setTimeout(function(){ c.classList.remove('flash'); }, 2200);
  };
  var showFace = function(k){
    var f = faces[k]; if (!f) return;
    sec.querySelector('.w18-k25-ph').scrollIntoView({ behavior: rm ? 'auto' : 'smooth', block: 'center' });
    if (sc.scrollWidth > sc.clientWidth) sc.scrollTo({ left: f.offsetLeft - sc.clientWidth / 2, behavior: rm ? 'auto' : 'smooth' });
    clearTimeout(timer); setTimeout(function(){ hl(k); }, rm ? 0 : 450);
    timer = setTimeout(clear, 3600);
  };
  var touch = false;
  stage.addEventListener('pointerdown', function(e){ touch = e.pointerType !== 'mouse'; });
  Object.keys(faces).forEach(function(k){
    var f = faces[k];
    f.addEventListener('mouseenter', function(){ if (!touch) { clearTimeout(timer); hl(k); } });
    f.addEventListener('focus', function(){ if (!touch) hl(k); });
    f.addEventListener('click', function(e){
      e.preventDefault();
      if (touch && cur !== k) { clearTimeout(timer); hl(k); return; }
      toCard(k);
    });
  });
  stage.addEventListener('mouseleave', function(){ if (!touch) clear(); });
  Object.keys(legs).forEach(function(k){
    var a = legs[k];
    a.addEventListener('mouseenter', function(){ clearTimeout(timer); hl(k); });
    a.addEventListener('mouseleave', clear);
    a.addEventListener('focus', function(){ hl(k); });
    a.addEventListener('blur', clear);
    a.addEventListener('click', function(e){ e.preventDefault(); toCard(k); });
  });
  [].forEach.call(sec.querySelectorAll('.w18-k25-back'), function(b){
    b.addEventListener('click', function(){ showFace(b.getAttribute('data-k')); });
  });
  var nb = sec.querySelector('.w18-k25-nums');
  nb.addEventListener('click', function(){
    var on = stage.classList.toggle('show-n'); nb.setAttribute('aria-pressed', on ? 'true' : 'false');
    nb.textContent = on ? 'Сховати номери' : 'Показати всі номери';
  });
  document.addEventListener('click', function(e){ if (touch && cur && !e.target.closest('.w18-k25-f')) clear(); });
})();

/* ── Документи справи: пошук і фільтри ── */
(function(){
    var list = document.getElementById('w18-dl'); if (!list) return;
    var q = document.getElementById('w18-df-q'), ft = document.getElementById('w18-df-t'), fp = document.getElementById('w18-df-p'),
        fy = document.getElementById('w18-df-y'), fm = document.getElementById('w18-df-m'), out = document.getElementById('w18-df-n'),
        rst = document.getElementById('w18-df-r'), none = document.getElementById('w18-dl-none');
    var items = [].slice.call(list.querySelectorAll('li[data-t]'));
    var norm = function(s){ return (s || '').toLowerCase().replace(/[’ʼ`]/g, "'").replace(/ґ/g, 'г'); };
    items.forEach(function(li){ li._s = norm(li.textContent); });
    var full = null, loading = false;
    function loadFull(){
        if (full || loading) return; loading = true;
        fetch('w18-docs.json').then(function(r){ return r.json(); }).then(function(j){
            full = {}; j.forEach(function(d){ full[d.id] = norm(d.title + ' ' + d.note + ' ' + d.arch + ' ' + d.date + ' ' + d.tr); }); apply();
        }).catch(function(){ loading = false; });
    }
    function apply(){
        var w = norm(q.value).trim().split(/\s+/).filter(Boolean), t = ft.value, p = fp.value, y = fy.value, m = fm.checked, n = 0;
        items.forEach(function(li){
            var id = li.firstChild.getAttribute('data-doc'), txt = (full && full[id]) || li._s;
            var ok = (!t || li.dataset.t === t) && (!p || (' ' + li.dataset.p + ' ').indexOf(' ' + p + ' ') > -1) &&
                     (!y || li.parentNode.parentNode.dataset.yr === y) && (!m || li.dataset.m === '1') &&
                     w.every(function(x){ return txt.indexOf(x) > -1; });
            li.hidden = !ok; if (ok) n++;
        });
        [].forEach.call(list.querySelectorAll('.w18-dl-y'), function(s){ s.hidden = !s.querySelector('li:not([hidden])'); });
        out.textContent = n; none.hidden = n > 0;
        rst.hidden = !(w.length || t || p || y || m);
    }
    var tm; q.addEventListener('input', function(){ loadFull(); clearTimeout(tm); tm = setTimeout(apply, 120); });
    q.addEventListener('focus', loadFull);
    [ft, fp, fy, fm].forEach(function(el){ el.addEventListener('change', apply); });
    rst.addEventListener('click', function(){ q.value = ''; ft.value = fp.value = fy.value = ''; fm.checked = false; apply(); });
})();
