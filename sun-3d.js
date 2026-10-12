/* Сонце над Дубровицею: положення сонця за датою й годиною (київський час) для 3D-моделей.
   Sun3D.attach(api, {button, mount}) — додає панель «Сонце»; api — з Kostel3D/Cerkva3D (потрібні api.light і api.compass). */
(function(){
'use strict';
var LAT = 51.573, LON = 26.567, RAD = Math.PI/180;

/* положення сонця: висота й азимут (від півночі за годинниковою стрілкою), у градусах */
function sunPos(date){
  var d = date.getTime()/864e5 + 2440587.5 - 2451545.0;
  var g = (357.529 + .98560028*d)*RAD, q = 280.459 + .98564736*d;
  var L = (q + 1.915*Math.sin(g) + .020*Math.sin(2*g))*RAD, e = (23.439 - .00000036*d)*RAD;
  var ra = Math.atan2(Math.cos(e)*Math.sin(L), Math.cos(L)), dec = Math.asin(Math.sin(e)*Math.sin(L));
  var gmst = ((18.697374558 + 24.06570982441908*d) % 24 + 24) % 24;
  var H = (gmst*15 + LON)*RAD - ra, la = LAT*RAD;
  var alt = Math.asin(Math.sin(la)*Math.sin(dec) + Math.cos(la)*Math.cos(dec)*Math.cos(H));
  var az = Math.atan2(-Math.sin(H), Math.tan(dec)*Math.cos(la) - Math.sin(la)*Math.cos(H));
  return {alt: alt/RAD, az: (az/RAD + 360) % 360};
}
/* київський час: UTC+2, влітку (остання неділя березня — остання неділя жовтня) UTC+3 */
function lastSunday(y, m){ var t = new Date(Date.UTC(y, m + 1, 0, 1)); t.setUTCDate(t.getUTCDate() - t.getUTCDay()); return t.getTime(); }
function offset(y, m, d, min){
  var t = Date.UTC(y, m, d, 0, min) - 2*36e5;
  return t >= lastSunday(y, 2) && t < lastSunday(y, 9) ? 3 : 2;
}
function instant(y, m, d, min){ return new Date(Date.UTC(y, m, d, 0, min) - offset(y, m, d, min)*36e5); }
function riseSet(y, m, d){
  var r = null, s = null, prev = sunPos(instant(y, m, d, 0)).alt + .833;
  for (var k = 5; k <= 1440; k += 5){
    var a = sunPos(instant(y, m, d, k)).alt + .833;
    if (prev < 0 && a >= 0 && r === null) r = k - 5*a/(a - prev);
    if (prev >= 0 && a < 0) s = k - 5*a/(a - prev);
    prev = a;
  }
  return {rise: r, set: s};
}
function hhmm(min){ min = Math.round(min); return Math.floor(min/60) + ':' + ('0' + min%60).slice(-2); }
var DIRS = ['Пн', 'ПнПнСх', 'ПнСх', 'СхПнСх', 'Сх', 'СхПдСх', 'ПдСх', 'ПдПдСх', 'Пд', 'ПдПдЗ', 'ПдЗ', 'ЗПдЗ', 'З', 'ЗПнЗ', 'ПнЗ', 'ПнПнЗ'];

/* кольори світла від висоти сонця */
function mix(a, b, t){ t = Math.max(0, Math.min(1, t)); var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), o = '#';
  for (var i = 16; i >= 0; i -= 8){ var x = Math.round(((pa >> i) & 255)*(1 - t) + ((pb >> i) & 255)*t); o += ('0' + x.toString(16)).slice(-2); } return o; }
function smooth(a, b, x){ var t = Math.max(0, Math.min(1, (x - a)/(b - a))); return t*t*(3 - 2*t); }
function lightFor(h){
  var day = smooth(-1, 12, h), high = smooth(6, 40, h), twi = smooth(-10, 0, h);
  return {
    sunI: 1.75*smooth(-.8, 6, h)*(.72 + .28*high),
    sunColor: h < 6 ? mix('#ff7a3a', '#ffc98f', smooth(-1, 6, h)) : mix('#ffd9a8', '#fff3e0', high),
    fillI: .08 + .2*day, fillColor: mix('#5f73b0', '#d3dcff', day),
    sky: mix(mix('#3a4a7a', '#e9a37a', twi*(1 - day)*1.6), '#fff4de', day), ground: mix('#141722', '#3a2c1c', day),
    hemiI: .18 + .27*day, exposure: .3 + .28*twi + .46*day, env: .05 + .1*twi + .33*day,
    night: 1 - twi, warm: twi*(1 - day)
  };
}

function el(tag, cls, html){ var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
var CSS = '.sun-p{position:fixed;z-index:3;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 86px);transform:translate(-50%,8px);width:min(440px,calc(100vw - 24px));padding:1rem 1.1rem .9rem;border-radius:18px;border:1px solid var(--faint);background:rgba(23,18,11,.86);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 26px 60px rgba(0,0,0,.45);opacity:0;visibility:hidden;transition:opacity .3s var(--ease),transform .3s var(--ease),visibility .3s}' +
  '.sun-p.open{opacity:1;visibility:visible;transform:translate(-50%,0)}' +
  '.sun-h{display:flex;align-items:baseline;justify-content:space-between;gap:.6rem;margin:0 0 .7rem}' +
  '.sun-h b{font:400 1.25rem/1.1 var(--display)}.sun-h span{font:500 .68rem var(--body);letter-spacing:.12em;text-transform:uppercase;color:var(--gold)}' +
  '.sun-d{display:flex;flex-wrap:wrap;gap:.35rem;margin:0 0 .75rem}' +
  '.sun-d button,.sun-d label{display:inline-flex;align-items:center;gap:.35rem;padding:.38rem .7rem;border-radius:999px;border:1px solid var(--faint);background:none;color:var(--text);font:500 .72rem var(--body);cursor:pointer;transition:border-color .2s,background .2s}' +
  '.sun-d button:hover,.sun-d label:hover{border-color:var(--gold)}.sun-d button[aria-pressed="true"]{border-color:var(--gold);background:rgba(212,178,90,.16)}' +
  '.sun-d input{width:7.6em;border:0;background:none;color:var(--text);font:inherit;color-scheme:dark}' +
  '.sun-t{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:.7rem}' +
  '.sun-t output{min-width:3.2em;font:400 1.6rem/1 var(--display);text-align:right;font-variant-numeric:tabular-nums}' +
  '.sun-t input{width:100%;height:28px;margin:0;background:none;-webkit-appearance:none;appearance:none;cursor:pointer}' +
  '.sun-t input::-webkit-slider-runnable-track{height:6px;border-radius:3px;background:var(--trk)}.sun-t input::-moz-range-track{height:6px;border-radius:3px;background:var(--trk)}' +
  '.sun-t input::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;margin-top:-7px;border-radius:50%;border:2px solid #17120b;background:#ffd36a;box-shadow:0 0 12px rgba(255,200,90,.8)}' +
  '.sun-t input::-moz-range-thumb{width:16px;height:16px;border-radius:50%;border:2px solid #17120b;background:#ffd36a;box-shadow:0 0 12px rgba(255,200,90,.8)}' +
  '.sun-play{display:grid;place-items:center;width:36px;height:36px;border:1px solid var(--faint);border-radius:50%;background:none;color:var(--text);cursor:pointer}.sun-play:hover{border-color:var(--gold)}.sun-play svg{width:14px;height:14px}' +
  '.sun-i{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.2rem .8rem;margin:.6rem 0 0;font:400 .72rem/1.5 var(--body);color:var(--muted)}.sun-i b{font-weight:600;color:var(--text)}' +
  '.sun-n{position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(90% 70% at 50% 40%,rgba(18,26,52,.55),rgba(4,6,14,.92));opacity:0;transition:opacity .4s}' +
  '.sun-w{position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(80% 60% at 50% 70%,rgba(255,130,60,.22),transparent 70%);opacity:0;transition:opacity .4s}' +
  '#view{z-index:1}' +
  '@media(min-width:1000px){.sun-p{left:clamp(16px,3vw,36px);bottom:calc(env(safe-area-inset-bottom,0px) + 24px);transform:translateY(8px)}.sun-p.open{transform:none}}' +
  '@media(max-width:640px){.sun-p{bottom:calc(env(safe-area-inset-bottom,0px) + 80px);padding:.8rem .9rem .7rem}.sun-d{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}.sun-d>*{flex:none}}';

var PRESETS = [
  {m: 6, d: 6, t: 'св. Іуліанії', k: '6 липня'},
  {m: 0, d: 7, t: 'Різдво', k: '7 січня'},
  {m: 5, d: 21, t: 'найдовший день', k: '21 червня'},
  {m: 11, d: 21, t: 'найкоротший', k: '21 грудня'}
];

function attach(api, o){
  if (!api || !api.light || !api.compass) return null;
  o = o || {};
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  var night = el('div', 'sun-n'), warm = el('div', 'sun-w');
  document.body.insertBefore(warm, document.body.firstChild); document.body.insertBefore(night, document.body.firstChild);
  var now = new Date(), Y = now.getFullYear(), M = now.getMonth(), D = now.getDate(), T = now.getHours()*60 + now.getMinutes();
  var p = el('section', 'sun-p'); p.id = 'sunPanel'; p.setAttribute('aria-label', 'Сонце над Дубровицею');
  p.innerHTML = '<div class="sun-h"><b id="sunDate"></b><span>сонце над Дубровицею</span></div>' +
    '<div class="sun-d" role="group" aria-label="Дата">' + PRESETS.map(function(x, i){ return '<button type="button" data-p="' + i + '" title="' + x.k + '">' + x.k + ' · ' + x.t + '</button>'; }).join('') +
    '<button type="button" data-p="now">зараз</button><label title="Будь-яка дата"><input type="date" id="sunPick" aria-label="Дата"></label></div>' +
    '<div class="sun-t"><button type="button" class="sun-play" id="sunPlay" aria-label="Прогорнути день" title="Прогорнути день від сходу до заходу"></button>' +
    '<input type="range" id="sunTime" min="0" max="1439" step="1" aria-label="Година за київським часом"><output id="sunOut"></output></div>' +
    '<p class="sun-i"><span id="sunRS"></span><span id="sunPos"></span></p>';
  (o.mount || document.body).appendChild(p);
  var $ = function(id){ return document.getElementById(id); }, rng = $('sunTime'), out = $('sunOut'), pick = $('sunPick'), play = $('sunPlay');
  var MON = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
  var PLAY = '<svg viewBox="0 0 14 14" fill="currentColor"><path d="M3 1.8v10.4L12 7z"/></svg>', PAUSE = '<svg viewBox="0 0 14 14" fill="currentColor"><path d="M3 2h3v10H3zM8 2h3v10H8z"/></svg>';
  play.innerHTML = PLAY;
  var rs = null, on = false, anim = null;

  function track(){
    var a = rs && rs.rise != null ? rs.rise/14.4 : 0, b = rs && rs.set != null ? rs.set/14.4 : 100;
    var g = 'linear-gradient(90deg,#1d2440 0%,#1d2440 ' + Math.max(0, a - 4) + '%,#e8885a ' + a + '%,#ffd98a ' + (a + 6) + '%,#fff0c8 50%,#ffd98a ' + (b - 6) + '%,#e8885a ' + b + '%,#1d2440 ' + Math.min(100, b + 4) + '%,#1d2440 100%)';
    if (rs && rs.rise == null && rs.set == null) g = sunPos(instant(Y, M, D, 720)).alt > 0 ? '#ffd98a' : '#1d2440';
    p.style.setProperty('--trk', g);
  }
  function setDate(y, m, d){
    Y = y; M = m; D = d; rs = riseSet(Y, M, D); track();
    $('sunDate').textContent = D + ' ' + MON[M] + ' ' + Y;
    pick.value = Y + '-' + ('0' + (M + 1)).slice(-2) + '-' + ('0' + D).slice(-2);
    $('sunRS').innerHTML = rs.rise != null ? 'Схід <b>' + hhmm(rs.rise) + '</b> · захід <b>' + hhmm(rs.set) + '</b> · день <b>' + hhmm(rs.set - rs.rise).replace(':', ' год ') + ' хв</b>' : '';
    p.querySelectorAll('[data-p]').forEach(function(b){ var x = PRESETS[b.dataset.p]; b.setAttribute('aria-pressed', String(!!x && x.m === M && x.d === D)); });
    apply();
  }
  function apply(){
    rng.value = T; out.textContent = hhmm(T);
    var s = sunPos(instant(Y, M, D, T)), h = s.alt*RAD, A = s.az*RAD, E = api.compass.east, N = api.compass.north;
    var ce = Math.cos(h)*Math.sin(A), cn = Math.cos(h)*Math.cos(A);
    var L = lightFor(s.alt);
    L.dir = [E[0]*ce + N[0]*cn, Math.sin(h), E[1]*ce + N[1]*cn];
    if (on) api.light(L);
    night.style.opacity = on ? (L.night*.9).toFixed(3) : 0; warm.style.opacity = on ? (L.warm*1.1).toFixed(3) : 0;
    $('sunPos').innerHTML = s.alt > -.83 ? 'Сонце: висота <b>' + Math.round(s.alt) + '°</b>, з боку <b>' + DIRS[Math.round(s.az/22.5) % 16] + '</b>' : (s.alt > -6 ? '<b>Сутінки</b>' : '<b>Ніч</b>');
  }
  function stop(){ if (anim){ cancelAnimationFrame(anim); anim = null; play.innerHTML = PLAY; play.setAttribute('aria-label', 'Прогорнути день'); } }
  function run(){
    if (anim){ stop(); return; }
    var a = rs.rise != null ? rs.rise - 40 : 0, b = rs.set != null ? rs.set + 50 : 1439;
    if (T < a || T >= b - 5) T = a;
    var last = 0; play.innerHTML = PAUSE; play.setAttribute('aria-label', 'Зупинити');
    (function step(ts){
      if (last) T = Math.min(b, T + (ts - last)/1000*(b - a)/18);
      last = ts; apply();
      if (T >= b) { stop(); return; }
      anim = requestAnimationFrame(step);
    })(0);
  }
  rng.addEventListener('input', function(){ stop(); T = +rng.value; apply(); });
  play.addEventListener('click', run);
  pick.addEventListener('change', function(){ var v = pick.value.split('-'); if (v.length === 3) setDate(+v[0], +v[1] - 1, +v[2]); });
  p.addEventListener('click', function(e){
    var b = e.target.closest('[data-p]'); if (!b) return; stop();
    if (b.dataset.p === 'now'){ var n = new Date(); T = n.getHours()*60 + n.getMinutes(); setDate(n.getFullYear(), n.getMonth(), n.getDate()); return; }
    var x = PRESETS[+b.dataset.p]; if (T < 300 || T > 1290) T = 600; setDate(Y, x.m, x.d);
  });
  function toggle(v){
    on = v === undefined ? !on : !!v; p.classList.toggle('open', on);
    if (o.button) o.button.setAttribute('aria-pressed', String(on));
    if (!on){ stop(); api.light(null); night.style.opacity = 0; warm.style.opacity = 0; } else apply();
    if (o.onToggle) o.onToggle(on);
  }
  if (o.button) o.button.addEventListener('click', function(){ toggle(); });
  addEventListener('keydown', function(e){ if (e.key === 'Escape' && on) toggle(false); });
  setDate(Y, M, D);
  return {toggle: toggle, sunPos: sunPos};
}
window.Sun3D = {attach: attach, sunPos: function(y, m, d, min){ return sunPos(instant(y, m, d, min)); }};
})();
