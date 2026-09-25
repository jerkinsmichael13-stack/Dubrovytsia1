/* Край у цифрах, 1798 — діаграми сторінки аналітики.
   Дані: atlas-1798-analityka-data.js (таблиця + факти з описів маєтків). */
(function(){
'use strict';

var D = window.ATLAS_ANALYTICS_1798 || (typeof ATLAS_ANALYTICS_1798 !== 'undefined' ? ATLAS_ANALYTICS_1798 : null);
if (!D) return;
var ROWS = D.rows, ESTATES = D.estates;

/* ── Довідники ─────────────────────────────── */
var CATS = [
    { k: 'serfs',       l: 'Кріпаки',              full: 'Кріпаки (власницькі піддані)', d: 'селяни, що належали власникові маєтку й відробляли панщину' },
    { k: 'churchSerfs', l: 'Піддані духовних маєтків', full: 'Піддані духовних маєтків', d: 'селяни, що належали церкві чи монастирю' },
    { k: 'free',        l: 'Вільні люди й цигани', full: 'Вільні люди й цигани', d: 'особисто вільні, не прикріплені до маєтку' },
    { k: 'burghers',    l: 'Купці й міщани',       full: 'Купці й міщани', d: 'мешканці містечок, що жили з торгівлі й ремесла' },
    { k: 'nobles',      l: 'Шляхта',               full: 'Шляхта', d: 'дворянство — від заможних родин до дрібної «околичної» шляхти' },
    { k: 'clergy',      l: 'Духовенство',          full: 'Духовенство', d: 'священники, дяки та їхні родини' }
];
var CAT = {}; CATS.forEach(function(c){ CAT[c.k] = c; });
var MONTHS = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
var MONTHS_GEN = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];

/* ── Утиліти ───────────────────────────────── */
function $(id){ return document.getElementById(id); }
/* екранує і для тексту, і для значень атрибутів (data-tip містить HTML з лапками) */
function esc(s){ return (s == null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function fmt(n){ return (Math.round(n)).toLocaleString('uk-UA').replace(/\s/g, ' '); }
function pct(a, b, dp){ if (!b) return '0'; return (a / b * 100).toFixed(dp == null ? 1 : dp).replace('.', ','); }
function dec(x, dp){ return x.toFixed(dp == null ? 1 : dp).replace('.', ','); }
function plural(n, one, few, many){ var a = n % 10, b = n % 100; if (a === 1 && b !== 11) return one; if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few; return many; }
function cv(k){ return 'var(--k-' + k + ')'; }
function tot(r){ return r.m + r.f; }
function catN(r, k){ return r.cats[k][0] + r.cats[k][1]; }
function catSum(r){ return CATS.reduce(function(s, c){ return s + catN(r, c.k); }, 0); }
function sum(arr, f){ return arr.reduce(function(s, x){ return s + f(x); }, 0); }
function median(a){ a = a.slice().sort(function(x, y){ return x - y; }); var m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; }
var ARROW = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';

var EST = {}; ESTATES.forEach(function(e){ EST[e.g] = e; });
ESTATES.forEach(function(e){
    e.rows = ROWS.filter(function(r){ return r.g === e.g; });
    e.pop = sum(e.rows, tot); e.dv = sum(e.rows, function(r){ return r.dvory || 0; });
    e.m = sum(e.rows, function(r){ return r.m; }); e.f = sum(e.rows, function(r){ return r.f; });
    e.mills = sum(e.rows, function(r){ return r.mills ? r.mills[0] : 0; }) + sum(e.rows, function(r){ return r.horseMill || 0; });
});
var POP = sum(ROWS, tot), DV = sum(ROWS, function(r){ return r.dvory || 0; });
var ownerPages = (typeof ATLAS_OWNERS_1798 !== 'undefined') ? ATLAS_OWNERS_1798 : {};

/* назва поселення: посилання на мапу, якщо поселення на ній є */
function place(r, withEstate){
    var name = esc(r.name);
    var h = r.slug ? '<a href="atlas-1798.html#' + r.slug + '" title="Відкрити на мапі">' + name + '</a>' : name;
    if (withEstate) h += '<small>' + esc(EST[r.g].short) + '</small>';
    return h;
}
function catTip(r){
    var t = tot(r), cs = catSum(r);
    var h = '<b>' + esc(r.full) + '</b>' + fmt(t) + ' душ' + (r.dvory ? ', ' + fmt(r.dvory) + ' ' + plural(r.dvory, 'двір', 'двори', 'дворів') : '');
    CATS.forEach(function(c){
        var n = catN(r, c.k); if (!n) return;
        h += '<div class="row"><span><i style="background:' + cv(c.k) + '"></i>' + c.l + '</span><span>' + fmt(n) + ' · ' + pct(n, cs) + '%</span></div>';
    });
    return h;
}
function stackHtml(r, labels){
    var cs = catSum(r) || 1;
    return CATS.map(function(c){
        var n = catN(r, c.k); if (!n) return '';
        var w = n / cs * 100;
        return '<i style="flex:' + n + ' 1 0;background:' + cv(c.k) + '" data-tip="' + esc(catTip(r)) + '">' + (labels && w > 9 ? '<span>' + Math.round(w) + '%</span>' : '') + '</i>';
    }).join('');
}

/* ── Підказка ──────────────────────────────── */
var tip = $('tip');
function showTip(html, x, y){
    tip.innerHTML = html; tip.classList.add('on');
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var left = Math.min(window.innerWidth - w - 10, Math.max(10, x + 14));
    var top = y + 16 + h > window.innerHeight ? y - h - 12 : y + 16;
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
}
function hideTip(){ tip.classList.remove('on'); }
document.addEventListener('mouseover', function(e){ var t = e.target.closest('[data-tip]'); if (t) showTip(t.getAttribute('data-tip'), e.clientX, e.clientY); });
document.addEventListener('mousemove', function(e){ if (tip.classList.contains('on') && e.target.closest('[data-tip]')) showTip(tip.innerHTML, e.clientX, e.clientY); });
document.addEventListener('mouseout', function(e){ var t = e.target.closest('[data-tip]'); if (t && !t.contains(e.relatedTarget)) hideTip(); });
document.addEventListener('focusin', function(e){ var t = e.target.closest('[data-tip]'); if (t) { var r = t.getBoundingClientRect(); showTip(t.getAttribute('data-tip'), r.left, r.bottom); } });
document.addEventListener('focusout', hideTip);
window.addEventListener('scroll', hideTip, { passive: true });
/* на сенсорних екранах — підказка по дотику */
document.addEventListener('click', function(e){
    var t = e.target.closest('[data-tip]');
    if (t && !e.target.closest('a')) { var r = t.getBoundingClientRect(); showTip(t.getAttribute('data-tip'), r.left + r.width / 2, r.top + r.height / 2); }
});

function legend(el){ el.innerHTML = CATS.map(function(c){ return '<li><span class="sw" style="background:' + cv(c.k) + '"></span>' + c.l + '</li>'; }).join(''); }

/* ══ Шапка: головні цифри ═════════════════════ */
var serfsAll = sum(ROWS, function(r){ return catN(r, 'serfs'); });
var CS_ALL = sum(ROWS, catSum);
var waterMills = sum(ROWS, function(r){ return r.mills ? r.mills[0] : 0; });
var horseMills = sum(ROWS, function(r){ return r.horseMill || 0; });
var churches = sum(ROWS, function(r){ return (r.church || []).length; }), kostels = sum(ROWS, function(r){ return r.kostel || 0; });
$('kpis').innerHTML = [
    [ROWS.length, 'поселень у «Примітках»'],
    [fmt(DV), 'дворів'],
    [fmt(POP), 'душ обох статей'],
    [pct(serfsAll, CS_ALL) + '%', 'мешканців — кріпаки'],
    [waterMills + horseMills, 'млинів'],
    [churches + kostels, 'храмів: ' + churches + ' церкви й ' + kostels + ' костели']
].map(function(k){ return '<div class="an-kpi"><b>' + k[0] + '</b><span>' + k[1] + '</span></div>'; }).join('');

/* ══ § 1 Хто тут жив ═════════════════════════ */
var CT = {};
CATS.forEach(function(c){
    var m = sum(ROWS, function(r){ return r.cats[c.k][0]; }), f = sum(ROWS, function(r){ return r.cats[c.k][1]; });
    var where = ROWS.filter(function(r){ return catN(r, c.k) > 0; }).sort(function(a, b){ return catN(b, c.k) - catN(a, c.k); });
    CT[c.k] = { m: m, f: f, n: m + f, where: where };
});
legend($('catLegend'));
$('catStack').innerHTML = CATS.map(function(c){
    var n = CT[c.k].n, w = n / CS_ALL * 100;
    return '<i style="flex:' + n + ' 1 0;background:' + cv(c.k) + '" data-tip="<b>' + esc(c.full) + '</b>' + fmt(n) + ' осіб · ' + pct(n, CS_ALL) + '%">' + (w > 5 ? '<span>' + (w > 20 ? c.l + ' · ' : '') + pct(n, CS_ALL, w > 20 ? 1 : 0) + '%</span>' : '') + '</i>';
}).join('');
$('catCards').innerHTML = CATS.map(function(c){
    var t = CT[c.k], top = t.where[0];
    return '<button type="button" class="cat" data-cat="' + c.k + '" style="--c:' + cv(c.k) + '">' +
        '<div class="cat-n"><span class="sw" style="background:' + cv(c.k) + '"></span>' + c.full + '</div>' +
        '<div class="cat-v">' + fmt(t.n) + '<small>' + pct(t.n, CS_ALL) + '%</small></div>' +
        '<div class="cat-d">' + fmt(t.m) + ' чол. · ' + fmt(t.f) + ' жін. · у ' + t.where.length + ' ' + plural(t.where.length, 'поселенні', 'поселеннях', 'поселеннях') +
        '<br>найбільше — ' + esc(top.name) + ' (' + fmt(catN(top, c.k)) + ')</div></button>';
}).join('');
$('catCards').addEventListener('click', function(e){
    var b = e.target.closest('.cat'); if (!b) return;
    setWhere(b.getAttribute('data-cat'));
    document.getElementById('dejyly').scrollIntoView({ behavior: 'smooth' });
});
var towns = ROWS.filter(function(r){ return r.type === 'Містечко'; });
var burgInTowns = sum(towns, function(r){ return catN(r, 'burghers'); });
$('catInsight').innerHTML = 'Майже дев’ять із десяти мешканців — <b>кріпаки</b> (' + pct(CT.serfs.n, CS_ALL) + '%). Усі інші стани разом — трохи більше за десяту частину: шляхти ' + fmt(CT.nobles.n) + ', духовенства ' + fmt(CT.clergy.n) + ', купців і міщан ' + fmt(CT.burghers.n) + ' — з них ' + pct(burgInTowns, CT.burghers.n, 0) + '% жили в чотирьох містечках.';

/* ══ § 2 Де жили стани ═══════════════════════ */
var whereCat = 'nobles', whereAll = false;
$('whereChips').innerHTML = CATS.map(function(c){ return '<button type="button" class="chip" data-cat="' + c.k + '" aria-pressed="false"><span class="sw" style="background:' + cv(c.k) + '"></span>' + c.l + ' <small>' + CT[c.k].where.length + '</small></button>'; }).join('');
$('whereChips').addEventListener('click', function(e){ var b = e.target.closest('.chip'); if (b) setWhere(b.getAttribute('data-cat')); });
$('whereMore').addEventListener('click', function(){ whereAll = !whereAll; renderWhere(); });

var WHERE_NOTES = {
    nobles: function(t){
        var maj = t.where.filter(function(r){ return catN(r, 'nobles') / catSum(r) >= .3; });
        var top5 = sum(t.where.slice(0, 5), function(r){ return catN(r, 'nobles'); });
        return 'Шляхту записано в <b>' + t.where.length + '</b> поселеннях, але ' + pct(top5, t.n, 0) + '% її жило лише в п’яти: ' + t.where.slice(0, 5).map(function(r){ return esc(r.name); }).join(', ') + '. ' +
            'Є й справжні шляхетські осередки, де шляхта становила третину мешканців і більше: ' + maj.map(function(r){ return esc(r.name) + ' (' + pct(catN(r, 'nobles'), catSum(r), 0) + '%)'; }).join(', ') + '. У Працюках усі 25 мешканців записані шляхтою — це типове поселення дрібної «околичної» шляхти.';
    },
    clergy: function(t){
        var withChurch = t.where.filter(function(r){ return (r.church || []).length || r.kostel; });
        var noCh = t.where.filter(function(r){ return !((r.church || []).length || r.kostel); });
        return 'Духовенство жило в <b>' + t.where.length + '</b> поселеннях. У ' + withChurch.length + ' з них опис згадує храм — там жили священники зі своїми родинами. ' +
            (noCh.length ? 'Ще в ' + noCh.length + ' (' + noCh.map(function(r){ return esc(r.name); }).join(', ') + ') духовенство записане, але церкви в описі не названо.' : '');
    },
    burghers: function(t){
        var out = t.where.filter(function(r){ return r.type !== 'Містечко'; });
        return pct(burgInTowns, t.n, 0) + '% купців і міщан жили в чотирьох містечках. Решта — по кілька осіб у <b>' + out.length + '</b> селах (зазвичай 1–7): імовірно, орендарі шинків чи ремісники — описи сіл про них окремо нічого не кажуть.';
    },
    serfs: function(t){
        var all = ROWS.filter(function(r){ return catSum(r) && catN(r, 'serfs') === catSum(r); });
        var none = ROWS.filter(function(r){ return catSum(r) && !catN(r, 'serfs'); });
        return 'Кріпаки жили майже скрізь — у <b>' + t.where.length + '</b> із 74 поселень. У ' + all.length + ' поселеннях, крім кріпаків, не записано взагалі нікого. Без жодного кріпака — лише ' + none.map(function(r){ return esc(r.name) + ' (' + (catN(r, 'nobles') === catSum(r) ? 'усі — шляхта' : 'усі — вільні люди') + ')'; }).join(', ') + '.';
    },
    churchSerfs: function(t){
        return 'Селяни духовних маєтків жили лише в <b>' + t.where.length + '</b> містечках: у Бережниці (маєток ділили Чацький і духовенство Бережницького костелу) та в Домбровиці, де стояв костел із мурованими келіями. Селяни в маєтку Домбровицького кляштору піарів (Стрільськ, Глушиця та ін.) записані в таблиці в рубриці «власницьких» підданих.';
    },
    free: function(t){
        return 'Два поселення цілком складалися з вільних людей: <b>Гута Каноницька</b> (скляна гута, де скло робили «вільні люди») і <b>Буда Цепцевицька</b> (поташний завод). Цікаво, що опис Буди каже: роботу на заводі виконують «власні селяни» маєтку.';
    }
};
function setWhere(k){ whereCat = k; whereAll = false; renderWhere(); }
function renderWhere(){
    var c = CAT[whereCat], t = CT[whereCat];
    document.querySelectorAll('#whereChips .chip').forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-cat') === whereCat ? 'true' : 'false'); });
    $('whereTitle').innerHTML = '<span class="sw" style="background:' + cv(c.k) + ';margin-right:.5rem;vertical-align:.1em"></span>' + c.full + ': ' + fmt(t.n);
    $('whereSub').textContent = c.d + '. Число — скільки осіб цього стану; відсоток — яку частку мешканців поселення вони становили.';
    var list = whereAll ? t.where : t.where.slice(0, 15), max = catN(t.where[0], whereCat);
    $('whereBars').innerHTML = list.map(function(r){
        var n = catN(r, whereCat), sh = n / catSum(r);
        return '<div class="hb-l">' + place(r, true) + '</div>' +
            '<div class="hb-t" data-tip="' + esc(catTip(r)) + '"><i style="width:' + (n / max * 100).toFixed(1) + '%;background:' + cv(whereCat) + '"></i></div>' +
            '<div class="hb-v"><b>' + fmt(n) + '</b> · ' + pct(n, catSum(r), sh < .1 ? 1 : 0) + '%</div>';
    }).join('');
    var more = $('whereMore');
    more.hidden = t.where.length <= 15;
    more.textContent = whereAll ? 'Згорнути' : 'Показати всі ' + t.where.length + ' ' + plural(t.where.length, 'поселення', 'поселення', 'поселень');
    $('whereInsight').innerHTML = WHERE_NOTES[whereCat](t);
}
renderWhere();

/* склад кожного поселення */
var compGroup = 'estate', compSort = 'pop';
legend($('compLegend'));
function compRow(r){ return '<div class="hb-l">' + place(r) + '</div><div class="stack" role="img" aria-label="' + esc(r.name) + '">' + stackHtml(r) + '</div><div class="comp-v">' + fmt(tot(r)) + '</div>'; }
function sorter(a, b){
    if (compSort === 'name') return a.name.localeCompare(b.name, 'uk');
    if (compSort === 'serfs') return catN(a, 'serfs') / (catSum(a) || 1) - catN(b, 'serfs') / (catSum(b) || 1) || tot(b) - tot(a);
    return tot(b) - tot(a);
}
function renderComp(){
    var q = ($('compQ').value || '').trim().toLowerCase();
    var rows = ROWS.filter(function(r){ return !q || r.full.toLowerCase().indexOf(q) !== -1; });
    var h = '';
    if (!rows.length) h = '<p class="blk-note" style="grid-column:1/-1">Нічого не знайдено.</p>';
    else if (compGroup === 'estate' && !q) {
        ESTATES.slice().sort(function(a, b){ return b.pop - a.pop; }).forEach(function(e){
            h += '<div class="comp-g"><span>' + esc(e.short) + '</span><span>' + fmt(e.pop) + ' душ</span></div>';
            h += e.rows.slice().sort(sorter).map(compRow).join('');
        });
    } else h = rows.sort(sorter).map(compRow).join('');
    $('comp').innerHTML = h;
}
document.querySelectorAll('[data-grp]').forEach(function(b){ b.addEventListener('click', function(){ compGroup = b.getAttribute('data-grp'); document.querySelectorAll('[data-grp]').forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); renderComp(); }); });
document.querySelectorAll('[data-sort]').forEach(function(b){ b.addEventListener('click', function(){ compSort = b.getAttribute('data-sort'); document.querySelectorAll('[data-sort]').forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); renderComp(); }); });
$('compQ').addEventListener('input', renderComp);
renderComp();

/* ══ § 3 Чоловіки й жінки ════════════════════ */
(function(){
    var h = '<div class="bf-h l">чоловіки</div><div></div><div class="bf-h">жінки</div>';
    CATS.forEach(function(c){
        var t = CT[c.k], mx = Math.max(t.m, t.f);
        h += '<div class="bf-t l"><span class="bf-n">' + fmt(t.m) + '</span><i style="width:' + (t.m / mx * 100).toFixed(1) + '%;background:var(--male)" data-tip="<b>' + esc(c.full) + '</b>чоловіків: ' + fmt(t.m) + '"></i></div>' +
             '<div class="bf-c">' + c.l + '<br><small style="color:var(--color-text-light)">' + Math.round(t.m / t.f * 100) + ' ч. на 100 ж.</small></div>' +
             '<div class="bf-t r"><i style="width:' + (t.f / mx * 100).toFixed(1) + '%;background:var(--female)" data-tip="<b>' + esc(c.full) + '</b>жінок: ' + fmt(t.f) + '"></i><span class="bf-n">' + fmt(t.f) + '</span></div>';
    });
    $('bf').innerHTML = h;
    $('bfInsight').innerHTML = 'Смуги в кожному рядку порівнюють чоловіків і жінок одного стану. Серед кріпаків статі майже рівні (' + Math.round(CT.serfs.m / CT.serfs.f * 100) + ' : 100). Зате серед <b>купців і міщан жінок більше</b> (' + Math.round(CT.burghers.m / CT.burghers.f * 100) + ' чоловіків на 100 жінок), а серед <b>духовенства</b> (' + Math.round(CT.clergy.m / CT.clergy.f * 100) + ' : 100) і <b>вільних людей</b> (' + Math.round(CT.free.m / CT.free.f * 100) + ' : 100) помітно переважають чоловіки.';

    // точкова смуга
    var pts = ROWS.filter(function(r){ return r.f > 0 && tot(r) >= 30; }).map(function(r){ return { r: r, v: r.m / r.f * 100 }; });
    var lo = 60, hi = 170;
    var el = $('sexStrip'), sorted = pts.slice().sort(function(a, b){ return a.v - b.v; });
    var x = function(v){ return (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo) * 100; };
    var ticks = [60, 80, 100, 120, 140, 160];
    var hs = '<div class="strip-axis"></div>' + ticks.map(function(t){ return '<span class="strip-tick" style="left:' + x(t) + '%">' + t + '</span>'; }).join('') +
        '<div class="strip-ref" style="left:' + x(100) + '%"><span>рівновага</span></div>';
    // розсунути точки по вертикалі, щоб не накладались
    var lanes = [];
    sorted.forEach(function(p){
        var px = x(p.v), lane = 0;
        while (lanes[lane] != null && px - lanes[lane] < 1.3) lane++;
        lanes[lane] = px;
        var y = 50 + (lane % 2 ? 1 : -1) * Math.ceil(lane / 2) * 8;
        hs += '<button type="button" class="dot" style="left:' + px + '%;top:' + y + 'px" data-tip="<b>' + esc(p.r.full) + '</b>' + Math.round(p.v) + ' чоловіків на 100 жінок<br>' + fmt(p.r.m) + ' ч. · ' + fmt(p.r.f) + ' ж." aria-label="' + esc(p.r.name) + '"></button>';
    });
    [sorted[0], sorted[sorted.length - 1]].forEach(function(p, i){
        hs += '<span class="dot-l" style="left:' + Math.min(88, Math.max(10, x(p.v))) + '%;top:0px">' + esc(p.r.name) + ' · ' + Math.round(p.v) + '</span>';
    });
    el.innerHTML = hs;
    var men = sorted.slice(-3).reverse(), wom = sorted.slice(0, 3);
    $('sexInsight').innerHTML = 'Найбільше чоловіків — у ' + men.map(function(p){ return '<b>' + esc(p.r.name) + '</b> (' + Math.round(p.v) + ')'; }).join(', ') + '; найбільше жінок — у ' + wom.map(function(p){ return '<b>' + esc(p.r.name) + '</b> (' + Math.round(p.v) + ')'; }).join(', ') + '. Показано ' + pts.length + ' поселень, де живе щонайменше 30 осіб: у менших один-два записи різко змінюють співвідношення.';
})();

/* ══ § 4 Розмір поселень ════════════════════ */
(function(){
    var B = [[0, 49, 'до 50'], [50, 99, '50–99'], [100, 199, '100–199'], [200, 299, '200–299'], [300, 499, '300–499'], [500, 999, '500–999'], [1000, 1e9, '1000+']];
    var cnt = B.map(function(b){ return ROWS.filter(function(r){ var t = tot(r); return t >= b[0] && t <= b[1]; }); });
    var mx = Math.max.apply(null, cnt.map(function(c){ return c.length; }));
    $('hist').innerHTML = '<div class="hist" style="--n:' + B.length + '">' + cnt.map(function(c, i){
        var hgt = c.length / mx * 100;
        return '<div class="hist-c" data-tip="<b>' + B[i][2] + ' душ</b>' + c.length + ' ' + plural(c.length, 'поселення', 'поселення', 'поселень') + ':<br>' + esc(c.map(function(r){ return r.name; }).join(', ')) + '"><b style="bottom:calc(' + hgt + '% + 4px)">' + c.length + '</b><i style="height:' + hgt + '%"></i></div>';
    }).join('') + '</div><div class="hist-x" style="--n:' + B.length + '">' + B.map(function(b){ return '<span>' + b[2] + '</span>'; }).join('') + '</div>' +
    '<p class="blk-note">Медіанне поселення — ' + fmt(median(ROWS.map(tot))) + ' душ. Наведіть на стовпчик, щоб побачити назви.</p>';

    var types = {}; ROWS.forEach(function(r){ (types[r.type] = types[r.type] || []).push(r); });
    var tk = Object.keys(types).sort(function(a, b){ return types[b].length - types[a].length; }), tmax = types[tk[0]].length;
    $('types').innerHTML = tk.map(function(k){
        var list = types[k], p = sum(list, tot);
        return '<div class="hb-l">' + k + '</div><div class="hb-t" data-tip="<b>' + k + '</b>' + esc(list.map(function(r){ return r.name; }).join(', ')) + '"><i style="width:' + (list.length / tmax * 100) + '%;background:var(--gold)"></i></div><div class="hb-v"><b>' + list.length + '</b> · ' + fmt(p) + ' душ</div>';
    }).join('');

    var big = ROWS.slice().sort(function(a, b){ return tot(b) - tot(a); }), bigAll = false, bmax = tot(big[0]);
    function renderBig(){
        $('biggest').innerHTML = (bigAll ? big : big.slice(0, 12)).map(function(r, i){
            return '<div class="hb-l">' + (i + 1) + '. ' + place(r, true) + '</div><div class="hb-t" data-tip="' + esc(catTip(r)) + '">' +
                CATS.map(function(c){ var n = catN(r, c.k); return n ? '<i style="width:' + (n / bmax * 100) + '%;background:' + cv(c.k) + ';border-radius:0"></i>' : ''; }).join('') +
                '</div><div class="hb-v"><b>' + fmt(tot(r)) + '</b>' + (r.dvory ? ' · ' + r.dvory + ' дв.' : '') + '</div>';
        }).join('');
        $('biggestMore').textContent = bigAll ? 'Згорнути' : 'Показати всі 74';
    }
    $('biggestMore').addEventListener('click', function(){ bigAll = !bigAll; renderBig(); });
    renderBig();

    // душ на двір
    var pts = ROWS.filter(function(r){ return r.dvory; }).map(function(r){ return { r: r, v: tot(r) / r.dvory }; }).sort(function(a, b){ return a.v - b.v; });
    var avg = POP / DV;
    $('avgDvir').textContent = dec(avg);
    var hi = Math.ceil(pts[pts.length - 1].v / 2) * 2, x = function(v){ return v / hi * 100; };
    var hs = '<div class="strip-axis"></div>';
    for (var t = 0; t <= hi; t += 2) hs += '<span class="strip-tick" style="left:' + x(t) + '%">' + t + '</span>';
    hs += '<div class="strip-ref" style="left:' + x(avg) + '%"><span>середнє ' + dec(avg) + '</span></div>';
    var lanes = [];
    pts.forEach(function(p){
        var px = x(p.v), lane = 0;
        while (lanes[lane] != null && px - lanes[lane] < 1.2) lane++;
        lanes[lane] = px;
        var y = 50 + (lane % 2 ? 1 : -1) * Math.ceil(lane / 2) * 8;
        hs += '<button type="button" class="dot" style="left:' + px + '%;top:' + y + 'px" data-tip="<b>' + esc(p.r.full) + '</b>' + dec(p.v) + ' душі на двір<br>' + fmt(tot(p.r)) + ' душ · ' + p.r.dvory + ' дв." aria-label="' + esc(p.r.name) + '"></button>';
    });
    var top = pts[pts.length - 1];
    hs += '<span class="dot-l" style="left:' + Math.min(92, x(top.v)) + '%;top:0px">' + esc(top.r.name) + ' · ' + dec(top.v) + '</span>';
    $('dvirStrip').innerHTML = hs;
    var p2 = pts[pts.length - 2];
    $('dvirInsight').innerHTML = 'Здебільшого в дворі жило 5–8 людей — велика родина з дітьми й старими. Разюче вибивається <b>' + esc(top.r.name) + '</b>: ' + top.r.dvory + ' дворів на ' + fmt(tot(top.r)) + ' душ, тобто ' + dec(top.v) + ' на двір — утричі більше за наступне за щільністю поселення (' + esc(p2.r.name) + ', ' + dec(p2.v) + '). Імовірно, це описка в кількості дворів у самій таблиці.';
    $('dvirInsight').innerHTML = $('dvirInsight').innerHTML.replace('утричі більше', 'у ' + dec(top.v / p2.v) + ' раза більше');
})();

/* ══ § 5 Містечка ═══════════════════════════ */
(function(){
    function fairTxt(f){ if (f === 'Вознесіння') return 'Вознесіння'; var p = f.split('-'); return +p[1] + ' ' + MONTHS_GEN[+p[0] - 1]; }
    $('towns').innerHTML = towns.slice().sort(function(a, b){ return tot(b) - tot(a); }).map(function(r){
        var cs = catSum(r), e = EST[r.g];
        var bars = CATS.filter(function(c){ return catN(r, c.k); }).map(function(c){
            var n = catN(r, c.k);
            return '<div class="town-bar"><span class="l"><span>' + c.l + '</span><span>' + fmt(n) + '</span></span><span class="t"><i style="width:' + (n / cs * 100).toFixed(1) + '%;background:' + cv(c.k) + '"></i></span><span style="text-align:right">' + pct(n, cs, 0) + '%</span></div>';
        }).join('');
        var ch = (r.church || []).map(function(c){ return c[0]; });
        var facts = [
            '<li><b>' + fmt(tot(r)) + '</b> душ · <b>' + r.dvory + '</b> дворів</li>',
            r.fairs ? '<li>Ярмарки: ' + r.fairs.map(fairTxt).join(', ') + '</li>' : '',
            ch.length ? '<li>Церкви: ' + ch.join('; ') + '</li>' : '',
            r.kostel ? '<li>Костел латинського обряду</li>' : '',
            r.mills ? '<li>Млинів: ' + r.mills[0] + '</li>' : '',
            r.port ? '<li>Одна з найкращих пристаней на Горині</li>' : ''
        ].join('');
        return '<div class="panel town"><h4>' + (r.slug ? '<a href="atlas-1798.html#' + r.slug + '">' + esc(r.name) + '</a>' : esc(r.name)) + '</h4><p class="town-o">' + esc(e.short) + '</p><div class="town-bars">' + bars + '</div><ul class="town-f">' + facts + '</ul></div>';
    }).join('');
    var tp = sum(towns, tot);
    $('townInsight').innerHTML = 'У чотирьох містечках жило ' + pct(tp, POP, 0) + '% усіх мешканців краю, але ' + pct(burgInTowns, CT.burghers.n, 0) + '% купців і міщан, ' + pct(sum(towns, function(r){ return catN(r, 'clergy'); }), CT.clergy.n, 0) + '% духовенства й усі піддані духовних маєтків. Навіть у містечках кріпаки лишалися найбільшою групою — від ' + Math.min.apply(null, towns.map(function(r){ return Math.round(catN(r, 'serfs') / catSum(r) * 100); })) + '% до ' + Math.max.apply(null, towns.map(function(r){ return Math.round(catN(r, 'serfs') / catSum(r) * 100); })) + '% мешканців. У Бережниці описи уточнюють: євреї сплачували до скарбниці по 4 рублі з душі.';
})();

/* ══ § 6 Власники ═══════════════════════════ */
var ownSel = null;
var byPop = ESTATES.slice().sort(function(a, b){ return b.pop - a.pop; });
var avgPop = POP / ESTATES.length;
$('ownPick').innerHTML = byPop.map(function(e){ return '<button type="button" class="chip" role="tab" data-g="' + e.g + '" aria-pressed="false">' + esc(e.short) + ' <small>' + e.rows.length + '</small></button>'; }).join('');
$('ownPick').addEventListener('click', function(e){ var b = e.target.closest('.chip'); if (b) renderOwner(+b.getAttribute('data-g')); });
function tags(all, have){ return all.map(function(x){ return '<span class="tag' + (have.indexOf(x) === -1 ? ' no' : '') + '">' + x + '</span>'; }).join(''); }
function renderOwner(g){
    var e = EST[g]; ownSel = g;
    document.querySelectorAll('#ownPick .chip').forEach(function(b){ b.setAttribute('aria-pressed', +b.getAttribute('data-g') === g ? 'true' : 'false'); });
    var rank = byPop.indexOf(e) + 1;
    var first = e.rows.slice().sort(function(a, b){ return tot(b) - tot(a); }).filter(function(r){ return r.slug; })[0];
    var page = (ownerPages[e.id] || {}).page;
    var links = (page ? '<a class="btn ink" href="' + page + '">Біографія власника ' + ARROW + '</a>' : '') +
        (first ? '<a class="btn" href="atlas-1798.html#' + first.slug + '">На мапі ' + ARROW + '</a>' : '');
    var cs = sum(e.rows, catSum);
    var inc = e.income ? fmt(e.income) + '<small style="font-size:.9rem"> руб.</small>' : '—';
    var kv = '<dl class="kv">' +
        '<div><dd>' + e.rows.length + '</dd><dt>' + plural(e.rows.length, 'поселення', 'поселення', 'поселень') + '</dt></div>' +
        '<div><dd>' + fmt(e.dv) + '</dd><dt>дворів</dt></div>' +
        '<div><dd>' + fmt(e.pop) + '</dd><dt>душ · ' + rank + '-й за населенням</dt><span class="cmp">' + (e.pop >= avgPop ? 'у ' + dec(e.pop / avgPop) + ' раза більше' : 'у ' + dec(avgPop / e.pop) + ' раза менше') + ' за середній маєток</span></div>' +
        '<div><dd>' + inc + '</dd><dt>' + (e.income ? (e.kind === 'оренда' ? 'оренда на рік' : 'дохід на рік') : 'прибуток не вказано') + '</dt>' + (e.income ? '<span class="cmp">' + dec(e.income / e.pop, 2) + ' руб. на душу</span>' : '') + '</div></dl>';
    // поселення маєтку
    var vmax = Math.max.apply(null, e.rows.map(tot));
    var vil = e.rows.slice().sort(function(a, b){ return tot(b) - tot(a); }).map(function(r){
        return '<div class="hb-l">' + place(r) + '</div><div class="hb-t" data-tip="' + esc(catTip(r)) + '">' +
            CATS.map(function(c){ var n = catN(r, c.k); return n ? '<i style="width:' + (n / vmax * 100) + '%;background:' + cv(c.k) + ';border-radius:0"></i>' : ''; }).join('') +
            '</div><div class="hb-v"><b>' + fmt(tot(r)) + '</b>' + (r.dvory ? ' · ' + r.dvory + ' дв.' : '') + '</div>';
    }).join('');
    var mix = CATS.filter(function(c){ return sum(e.rows, function(r){ return catN(r, c.k); }); }).map(function(c){
        var n = sum(e.rows, function(r){ return catN(r, c.k); });
        return c.l.toLowerCase() + ' ' + pct(n, cs, n / cs < .1 ? 1 : 0) + '%';
    }).join(', ');
    // факти
    var mills = e.rows.filter(function(r){ return r.mills || r.horseMill; }).map(function(r){ return esc(r.name) + (r.mills ? ' ' + r.mills[0] : '') + (r.horseMill ? ' (кінний)' : ''); });
    var churchesE = [];
    e.rows.forEach(function(r){ (r.church || []).forEach(function(c){ churchesE.push(esc(r.name) + ' — ' + c[0]); }); if (r.kostel) churchesE.push(esc(r.name) + ' — костел'); });
    var manors = e.rows.filter(function(r){ return r.manor; }).map(function(r){ return esc(r.name); });
    var crafts = [];
    e.rows.forEach(function(r){ if (r.fulling) crafts.push('сукновальня (' + esc(r.name) + ')'); if (r.glass) crafts.push('скляна гута'); if (r.potash) crafts.push('поташний завод'); });
    if (e.weaving) crafts.push('жінки прядуть і тчуть полотно, частково на продаж');
    var none = '<span class="none">в описі не згадано</span>';
    var pan = e.panshchyna ? e.panshchyna.slice().sort().map(function(d){ return d + ' ' + plural(d, 'день', 'дні', 'днів'); }).join(' / ') + ' на тиждень' : none;
    var fauna = [].concat(e.beasts, e.birds);
    var facts = [
        ['Вода', e.rows.some(function(r){ return true; }) && (e.rivers.length ? e.rivers.join(', ') : '') + (e.wells ? (e.rivers.length ? '; ' : '') + 'копані колодязі' : '') || none],
        ['Ґрунт', e.soil],
        ['Сіяли', tags(D.crops, e.crops)],
        ['Ліс', e.forest ? esc(e.forest) + (e.timber ? ', стовбури ' + (e.timber[0] ? e.timber[0] + '–' : 'до ') + e.timber[1] + ' вершків' : '') + '<br>' + tags(D.trees, e.trees) : none],
        ['Сіножаті', e.hay || none],
        ['Звірі й птахи', fauna.length ? fauna.join(', ') : none],
        ['Риба', e.fish.length ? e.fish.join(', ') : none],
        ['Млини', mills.length ? e.mills + ': ' + mills.join(', ') : none],
        ['Храми', churchesE.length ? churchesE.join('; ') : none],
        ['Панські доми', manors.length ? manors.length + ': ' + manors.join(', ') : none],
        ['Промисли', crafts.length ? crafts.join('; ') : none],
        ['Панщина', pan],
        ['Худоба', e.livestock ? 'тримають ' + e.livestock + (e.horses ? ', також коней' : '') : none]
    ].map(function(f){ return '<div class="fact"><dt>' + f[0] + '</dt><dd>' + f[1] + '</dd></div>'; }).join('');
    $('ownBody').innerHTML = '<div class="own">' +
        '<div class="panel"><h3 class="own-name">' + esc(e.owner) + '</h3><div class="own-links">' + links + '</div>' + kv +
        '<div class="blk-h" style="margin-bottom:.6rem"><h3 style="font-size:1.25rem">Поселення маєтку</h3><p>' + esc(mix) + '</p></div><div class="hb">' + vil + '</div></div>' +
        '<div class="panel"><dl class="facts">' + facts + '</dl></div></div>';
}
renderOwner(byPop[0].g);

/* ══ § 7 Поля, ліси, звірі ═══════════════════ */
function heat(el, cols, has, extra){
    var list = ESTATES.slice().sort(function(a, b){ return b.pop - a.pop; });
    var h = '<thead><tr><th></th>' + cols.map(function(c){ return '<th scope="col">' + c + '</th>'; }).join('') + '</tr></thead><tbody>';
    list.forEach(function(e){
        h += '<tr><th scope="row" class="row">' + esc(e.short) + (extra ? '<br><small style="font-family:var(--font-body);font-size:.7rem;color:var(--color-text-light)">' + extra(e) + '</small>' : '') + '</th>' +
            cols.map(function(c){ var on = has(e, c); return '<td class="' + (on ? 'on' : '') + '" aria-label="' + (on ? 'так' : 'ні') + '" data-tip="<b>' + esc(e.short) + '</b>' + c + ': ' + (on ? 'є в описі' : 'не згадано') + '"></td>'; }).join('') + '</tr>';
    });
    h += '</tbody><tfoot><tr><td></td>' + cols.map(function(c){ return '<td>' + list.filter(function(e){ return has(e, c); }).length + '/16</td>'; }).join('') + '</tr></tfoot>';
    el.innerHTML = h;
}
heat($('cropHeat'), D.crops, function(e, c){ return e.crops.indexOf(c) !== -1; });
(function(){
    var miss = {}; D.crops.forEach(function(c){ miss[c] = ESTATES.filter(function(e){ return e.crops.indexOf(c) === -1; }).map(function(e){ return e.short; }); });
    var every = D.crops.filter(function(c){ return !miss[c].length; });
    var some = D.crops.filter(function(c){ return miss[c].length; });
    $('cropInsight').innerHTML = '<b>' + every.join(', ') + '</b> сіяли в усіх 16 маєтках. Не згадано: ' + some.map(function(c){ return c + ' — ' + miss[c].join(', '); }).join('; ') + '. Льон і коноплі були всюди — з них пряли й ткали: у маєтку Плятера опис прямо каже, що жінки «прядуть льон, вовну й коноплі та тчуть полотно… частково й на продаж».';
})();
heat($('treeHeat'), D.trees, function(e, c){ return e.trees.indexOf(c) !== -1; }, function(e){ return e.forest ? esc(e.forest) : 'ліс не описано'; });
(function(){
    var withF = ESTATES.filter(function(e){ return e.trees.length; });
    var cnt = function(t){ return withF.filter(function(e){ return e.trees.indexOf(t) !== -1; }).length; };
    $('treeInsight').innerHTML = (cnt('сосна') === withF.length && cnt('береза') === withF.length ? 'Сосну й березу названо в усіх ' + withF.length + ' описаних лісах' : 'Сосна росла в ' + cnt('сосна') + ', береза — у ' + cnt('береза') + ' з ' + withF.length + ' описаних лісів') + ', вільха — у ' + cnt('вільха') + ', осика — у ' + cnt('осика') + '. Дуб названо в ' + cnt('дуб') + ', граб — лише в ' + cnt('граб') + ', клен — в одному маєтку (Чацького). Майже всюди ліс «дров’яний»: придатних для будівництва дерев мало, стовбури здебільшого до 4–6 вершків (18–27 см). Найкращий ліс — у Каноничах, 5–7 вершків (22–31 см).';
})();
(function(){
    function collect(key){
        var m = {};
        ESTATES.forEach(function(e){ e[key].forEach(function(s){ (m[s] = m[s] || []).push(e.short); }); });
        return Object.keys(m).map(function(s){ return [s, m[s]]; }).sort(function(a, b){ return b[1].length - a[1].length; });
    }
    var ICON = {
        beasts: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M6 12l3-7 4 5h6l4-5 3 7c1 4-1 9-4 11l-6 4-6-4c-3-2-5-7-4-11z"/><circle cx="12.5" cy="15" r="1" fill="currentColor"/><circle cx="19.5" cy="15" r="1" fill="currentColor"/><path d="M14 20l2 1.5 2-1.5"/></svg>',
        birds: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M4 18c4-1 7-5 9-9 2 4 3 6 6 7l9-3-6 7c-2 3-6 5-11 4-3 0-5-3-7-6z"/><circle cx="20" cy="13" r=".9" fill="currentColor"/></svg>',
        fish: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M4 16c4-6 12-8 18-4l6-4-2 8 2 8-6-4c-6 4-14 2-18-4z"/><circle cx="10" cy="15" r="1" fill="currentColor"/></svg>'
    };
    var T = { beasts: ['Звірі', 'у лісах'], birds: ['Птахи', 'у лісах, полях і на водах'], fish: ['Риба', 'у Горині та інших річках'] };
    $('fauna').innerHTML = ['beasts', 'birds', 'fish'].map(function(k){
        var list = collect(k);
        return '<div class="panel"><h4>' + ICON[k] + T[k][0] + '</h4><p class="sub">' + list.length + ' видів ' + T[k][1] + '</p>' +
            list.map(function(s){ return '<div class="sp"><b>' + s[0] + '</b><span>' + s[1].join(', ') + '</span></div>'; }).join('') + '</div>';
    }).join('');
})();
(function(){
    var g = { 'посередні': [], 'бідні': [] };
    ESTATES.forEach(function(e){ if (g[e.hay]) g[e.hay].push(e.short); });
    $('hay').innerHTML = Object.keys(g).map(function(k){
        return '<div class="hb-l">' + k + '</div><div class="hb-t" data-tip="<b>Сіножаті ' + k + '</b>' + esc(g[k].join(', ')) + '"><i style="width:' + (g[k].length / 16 * 100) + '%;background:var(--gold)"></i></div><div class="hb-v"><b>' + g[k].length + '</b> з 16</div>';
    }).join('');
    $('horsesN').textContent = ESTATES.filter(function(e){ return e.horses; }).length;
    $('weaveNote').textContent = 'В описі маєтку Урбановських (Тутовичі) про ліс, худобу й панщину не сказано нічого.';
})();

/* ══ § 8 Млини ══════════════════════════════ */
(function(){
    var MODES = [['рік', 'цілий рік', 'var(--k-churchSerfs)'], ['весна-осінь', 'навесні й восени', 'var(--k-serfs)'], ['весна', 'лише навесні', 'var(--k-free)'], [null, 'режим не вказано', '#a8a29e'], ['horse', 'кінний («машинний»)', 'var(--k-nobles)']];
    $('millLegend').innerHTML = MODES.map(function(m){ return '<li><span class="sw" style="background:' + m[2] + '"></span>' + m[1] + '</li>'; }).join('');
    var list = ESTATES.filter(function(e){ return e.mills; }).sort(function(a, b){ return b.mills - a.mills; });
    var mx = list[0].mills;
    $('millBars').innerHTML = list.map(function(e){
        var parts = MODES.map(function(m){
            var n = m[0] === 'horse' ? sum(e.rows, function(r){ return r.horseMill || 0; }) : sum(e.rows, function(r){ return r.mills && r.mills[2] === m[0] ? r.mills[0] : 0; });
            return n ? '<i style="width:' + (n / mx * 100) + '%;background:' + m[2] + ';border-radius:0" data-tip="<b>' + esc(e.short) + '</b>' + m[1] + ': ' + n + '"></i>' : '';
        }).join('');
        var stones = sum(e.rows, function(r){ return r.mills ? r.mills[1] : 0; });
        return '<div class="hb-l">' + esc(e.short) + '</div><div class="hb-t">' + parts + '</div><div class="hb-v"><b>' + e.mills + '</b>' + (stones ? ' · ' + stones + ' ' + plural(stones, 'камінь', 'камені', 'каменів') : '') + '</div>';
    }).join('');
    var rows = ROWS.filter(function(r){ return r.mills; });
    var by = function(m){ return sum(rows, function(r){ return r.mills[2] === m ? r.mills[0] : 0; }); };
    var stonesAll = sum(rows, function(r){ return r.mills[1]; });
    var noMill = ESTATES.filter(function(e){ return !e.mills; }).map(function(e){ return e.short; });
    $('millInsight').innerHTML = 'Разом <b>' + (waterMills + horseMills) + ' млини</b>: ' + waterMills + ' водяних на ' + stonesAll + ' жорнових каменів і один кінний. Цілий рік працювали ' + by('рік') + ' — на повноводних Горині й Случі; ' + (by('весна-осінь') + by('весна')) + ' — лише навесні або восени, коли вистачало води в малих річках; для ' + by(null) + ' режим не вказано. Найбільше млинів мали Плятер і Чацький — по 7. Без млина в описі — ' + noMill.join(', ') + '.';
    var modeTxt = function(m){ return m === 'рік' ? 'цілий рік' : m === 'весна-осінь' ? 'навесні й восени' : m === 'весна' ? 'лише навесні' : 'режим не вказано'; };
    var items = rows.map(function(r){ return { r: r, h: '<li><span>' + place(r) + '<small>' + esc(EST[r.g].short) + (r.fulling ? ' · із сукновальнею' : '') + '</small></span><span class="r">' + r.mills[0] + ' ' + plural(r.mills[0], 'млин', 'млини', 'млинів') + ' · ' + r.mills[1] + ' ' + plural(r.mills[1], 'камінь', 'камені', 'каменів') + '<br>' + modeTxt(r.mills[2]) + '</span></li>' }; });
    ROWS.filter(function(r){ return r.horseMill; }).forEach(function(r){ items.push({ r: r, h: '<li><span>' + place(r) + '<small>' + esc(EST[r.g].short) + '</small></span><span class="r">1 кінний млин<br>не залежить від води</span></li>' }); });
    $('millList').innerHTML = items.sort(function(a, b){ return a.r.name.localeCompare(b.r.name, 'uk'); }).map(function(x){ return x.h; }).join('');
    $('crafts').innerHTML = [
        ['2', 'Сукновальні', 'У Рудні та Бережниці (маєток Чацького), при водяних млинах на Бережанці: там валяли сукно.'],
        ['1', 'Скляна гута', 'Гута Каноницька (Трешневська). Просте скло робили вільні люди й продавали по навколишніх поселеннях — єдине виробництво на вільнонайманій праці.'],
        ['1', 'Поташний завод', 'Буда Цепцевицька (Урбановські). Працювали власні селяни; поташ возили до Дубенки на Бузі й продавали за кордон по 3 руб. за пуд.'],
        ['1', 'Кінний млин', 'Грані (Бекерський і Мошинський): «машинний» млин, який крутили коні, — у селі, що стояло далеко від річки.']
    ].map(function(c){ return '<div class="panel card4"><div class="n">' + c[0] + '</div><h4>' + c[1] + '</h4><p>' + c[2] + '</p></div>'; }).join('');
})();

/* ══ § 9 Храми й садиби ═════════════════════ */
(function(){
    var ch = [];
    ROWS.forEach(function(r){ (r.church || []).forEach(function(c){ ch.push({ r: r, d: c[0].replace('Архистратига', 'Архангела'), conf: c[1] }); }); });
    var ded = {}; ch.forEach(function(c){ (ded[c.d] = ded[c.d] || []).push(c.r.name); });
    var dk = Object.keys(ded).sort(function(a, b){ return ded[b].length - ded[a].length || a.localeCompare(b, 'uk'); }), dmax = ded[dk[0]].length;
    $('dedic').innerHTML = dk.map(function(k){ return '<div class="hb-l">' + k + '</div><div class="hb-t" data-tip="<b>' + k + '</b>' + esc(ded[k].join(', ')) + '"><i style="width:' + (ded[k].length / dmax * 100) + '%;background:var(--k-clergy)"></i></div><div class="hb-v"><b>' + ded[k].length + '</b></div>'; }).join('');

    var withCh = ROWS.filter(function(r){ return (r.church || []).length; });
    var clergyAt = withCh.filter(function(r){ return catN(r, 'clergy'); });
    var perChurch = sum(withCh, function(r){ return catN(r, 'clergy'); }) / ch.length;
    var noCl = withCh.filter(function(r){ return !catN(r, 'clergy'); });
    var conf = { 'православна': 0, 'греко-унійна': 0 }; ch.forEach(function(c){ if (c.conf) conf[c.conf]++; });
    $('clergyChurch').innerHTML = '<dl class="kv" style="grid-template-columns:repeat(3,1fr)">' +
        '<div><dd>' + ch.length + '</dd><dt>церков у ' + withCh.length + ' поселеннях</dt></div>' +
        '<div><dd>' + kostels + '</dd><dt>костели — у всіх чотирьох містечках</dt></div>' +
        '<div><dd>' + dec(perChurch) + '</dd><dt>особи духовного стану на одну церкву</dt></div></dl>' +
        '<p class="blk-note" style="margin-top:0">Конфесію названо лише для частини храмів: православні — ' + conf['православна'] + ', греко-унійні — ' + conf['греко-унійна'] + ' (обидві церкви Домбровиці). Для решти опис каже лише «церква». Духовенство записане в ' + clergyAt.length + ' із ' + withCh.length + ' поселень із церквою' + (noCl.length ? '; без духовенства — ' + noCl.map(function(r){ return esc(r.name); }).join(', ') : '') + '. Костели в Бережниці, Домбровиці й Володимирці стоять поруч із приміткою «+ католики» в рубриці духовенства.</p>';

    var items = ch.map(function(c){ return '<li><span>' + place(c.r) + '<small>' + esc(EST[c.r.g].short) + '</small></span><span class="r">церква ' + esc(c.d) + (c.conf ? '<br>' + c.conf : '') + '</span></li>'; });
    ROWS.filter(function(r){ return r.kostel; }).forEach(function(r){ items.push('<li><span>' + place(r) + '<small>' + esc(EST[r.g].short) + '</small></span><span class="r">костел латинського обряду' + (r.garden ? '<br>муровані келії й сад' : '') + '</span></li>'); });
    $('churchList').innerHTML = items.join('');

    var man = ESTATES.map(function(e){ return { e: e, n: e.rows.filter(function(r){ return r.manor; }) }; }).filter(function(x){ return x.n.length; }).sort(function(a, b){ return b.n.length - a.n.length; });
    var mAll = sum(man, function(x){ return x.n.length; }), mmax = man[0].n.length;
    $('manorSub').textContent = 'Усього ' + mAll + ' панських домів у ' + mAll + ' поселеннях. Наведіть, щоб побачити, де саме.';
    $('manorBars').innerHTML = man.map(function(x){ return '<div class="hb-l">' + esc(x.e.short) + '</div><div class="hb-t" data-tip="<b>' + esc(x.e.short) + '</b>' + esc(x.n.map(function(r){ return r.name; }).join(', ')) + '"><i style="width:' + (x.n.length / mmax * 100) + '%;background:var(--gold)"></i></div><div class="hb-v"><b>' + x.n.length + '</b></div>'; }).join('');
    var silTot = ROWS.filter(function(r){ return r.type === 'Сільце'; }), silM = silTot.filter(function(r){ return r.manor; });
    $('manorInsight').innerHTML = 'Панський дім стояв у ' + silM.length + ' з ' + silTot.length + ' сілець — це й відрізняло сільце від звичайного села. Усі панські доми дерев’яні; єдина кам’яна споруда серед панських садиб — двоповерхові муровані «служби» (господарські будівлі) у Великих Цепцевичах. Муровані також костел у Бережниці й келії при костелі в Домбровиці, а резиденція графа Плятера стояла у фільварку Воробин.';
})();

/* ══ § 10 Гроші ═════════════════════════════ */
(function(){
    var list = ESTATES.filter(function(e){ return e.income; }).sort(function(a, b){ return b.income - a.income; });
    var mx = list[0].income, total = sum(list, function(e){ return e.income; });
    $('incBars').innerHTML = list.map(function(e){
        var col = e.kind === 'оренда' ? 'var(--k-churchSerfs)' : 'var(--gold)';
        return '<div class="hb-l">' + esc(e.short) + '</div><div class="hb-t" data-tip="<b>' + esc(e.owner) + '</b>' + (e.kind === 'оренда' ? 'оренда' : 'дохід') + ': ' + fmt(e.income) + ' руб. на рік<br>' + pct(e.income, total) + '% усієї суми"><i style="width:' + (e.income / mx * 100) + '%;background:' + col + '"></i></div><div class="hb-v"><b>' + fmt(e.income) + '</b> · ' + e.kind + '</div>';
    }).join('');
    var ps = list.map(function(e){ return { e: e, v: e.income / e.pop }; }).sort(function(a, b){ return b.v - a.v; }), pmx = ps[0].v;
    $('perSoul').innerHTML = ps.map(function(x){ return '<div class="hb-l">' + esc(x.e.short) + '</div><div class="hb-t" data-tip="<b>' + esc(x.e.short) + '</b>' + fmt(x.e.income) + ' руб. ÷ ' + fmt(x.e.pop) + ' душ"><i style="width:' + (x.v / pmx * 100) + '%;background:' + (x.e.kind === 'оренда' ? 'var(--k-churchSerfs)' : 'var(--gold)') + '"></i></div><div class="hb-v"><b>' + dec(x.v, 2) + '</b></div>'; }).join('');

    // крива концентрації
    var asc = list.slice().reverse(), W = 440, H = 300, P = 46;
    var pts = [[0, 0]], acc = 0;
    asc.forEach(function(e, i){ acc += e.income; pts.push([(i + 1) / asc.length, acc / total]); });
    var X = function(v){ return P + v * (W - P - 10); }, Y = function(v){ return H - P - v * (H - P - 10); };
    var path = pts.map(function(p, i){ return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1); }).join(' ');
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Крива концентрації доходу">' +
        [0, .25, .5, .75, 1].map(function(t){ return '<line x1="' + X(0) + '" x2="' + X(1) + '" y1="' + Y(t) + '" y2="' + Y(t) + '" stroke="var(--grid)"/><text x="' + (P - 6) + '" y="' + (Y(t) + 4) + '" text-anchor="end">' + (t * 100) + '%</text>'; }).join('') +
        '<line x1="' + X(0) + '" y1="' + Y(0) + '" x2="' + X(1) + '" y2="' + Y(1) + '" stroke="var(--color-text-light)" stroke-dasharray="4 4"/>' +
        '<path d="' + path + ' L' + X(1) + ' ' + Y(0) + ' Z" fill="rgba(201,162,39,.18)"/>' +
        '<path d="' + path + '" fill="none" stroke="var(--gold)" stroke-width="2"/>' +
        pts.slice(1).map(function(p, i){ return '<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="4" fill="var(--gold)" stroke="var(--color-bg)" stroke-width="2" data-tip="<b>' + esc(asc[i].short) + '</b>' + (i + 1) + ' найменших маєтків разом — ' + pct(p[1] * total, total, 0) + '% доходу"/>'; }).join('') +
        '<text x="' + X(.5) + '" y="' + (H - 8) + '" text-anchor="middle">частка маєтків →</text></svg>';
    $('lorenz').innerHTML = svg;
    var top3 = list.slice(0, 3), t3 = sum(top3, function(e){ return e.income; }), t3v = sum(top3, function(e){ return e.rows.length; });
    var med = median(list.map(function(e){ return e.income; })), mean = total / list.length;
    $('incInsight').innerHTML = 'Разом відомий прибуток маєтків — <b>' + fmt(total) + ' руб. на рік</b>. Троє найбагатших — ' + top3.map(function(e){ return e.short; }).join(', ') + ' — отримували ' + pct(t3, total, 0) + '% цієї суми, хоча мали ' + t3v + ' з 74 поселень. Середній маєток приносив ' + fmt(mean) + ' руб., але типовий (медіана) — лише ' + fmt(med) + ': кілька великих латифундій і довгий «хвіст» дрібних маєтків, зданих в оренду. Найбільше з однієї душі приносив маєток ' + ps[0].e.short + ' — ' + dec(ps[0].v, 2) + ' руб.; найменше — ' + ps[ps.length - 1].e.short + ' (' + dec(ps[ps.length - 1].v, 2) + ' руб.).';

    var PAN = ['1 день', '2 дні', '3 дні'];
    var rows = ESTATES.slice().sort(function(a, b){ return b.pop - a.pop; });
    $('panHeat').innerHTML = '<thead><tr><th></th>' + PAN.map(function(p){ return '<th>' + p + '</th>'; }).join('') + '<th>не вказано</th></tr></thead><tbody>' +
        rows.map(function(e){
            return '<tr><th class="row" scope="row">' + esc(e.short) + '</th>' + [1, 2, 3].map(function(d){ var on = e.panshchyna && e.panshchyna.indexOf(d) !== -1; return '<td class="' + (on ? 'on' : '') + '" data-tip="<b>' + esc(e.short) + '</b>' + d + ' ' + plural(d, 'день', 'дні', 'днів') + ' на тиждень: ' + (on ? 'так' : 'ні') + '"></td>'; }).join('') +
                '<td class="' + (!e.panshchyna ? 'on' : '') + '"></td></tr>';
        }).join('') + '</tbody><tfoot><tr><td></td>' + [1, 2, 3].map(function(d){ return '<td>' + rows.filter(function(e){ return e.panshchyna && e.panshchyna.indexOf(d) !== -1; }).length + '/16</td>'; }).join('') + '<td>' + rows.filter(function(e){ return !e.panshchyna; }).length + '/16</td></tr></tfoot>';
})();

/* ══ § 11 Ярмарки ═══════════════════════════ */
(function(){
    var DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    function pos(f){
        if (f === 'Вознесіння') return (4 + 20 / 31) / 12;   // приблизно кінець травня
        var p = f.split('-'), m = +p[0] - 1, d = +p[1];
        return (m + (d - .5) / DAYS[m]) / 12;
    }
    function label(f){ if (f === 'Вознесіння') return 'Вознесіння Господнє (рухоме свято, травень–червень)'; var p = f.split('-'); return +p[1] + ' ' + MONTHS_GEN[+p[0] - 1]; }
    var grid = '<div class="cal-grid">' + MONTHS.map(function(){ return '<i></i>'; }).join('') + '</div>';
    $('cal').innerHTML = towns.slice().sort(function(a, b){ return b.fairs.length - a.fairs.length; }).map(function(r){
        return '<div class="cal-row"><b>' + esc(r.name) + '</b><div class="cal-t">' + grid + r.fairs.map(function(f){
            return '<button type="button" class="fair' + (f === 'Вознесіння' ? ' mov' : '') + '" style="left:' + (pos(f) * 100).toFixed(2) + '%" data-tip="<b>' + esc(r.name) + '</b>ярмарок ' + label(f) + '" aria-label="' + esc(r.name) + ': ' + label(f) + '"></button>';
        }).join('') + '</div></div>';
    }).join('') + '<div class="cal-m"><span></span><div>' + MONTHS.map(function(m){ return '<span>' + m + '</span>'; }).join('') + '</div></div>';
})();

/* ══ Навігація: підсвітити поточний розділ ══ */
(function(){
    var hdr = document.querySelector('.header');
    if (hdr) document.documentElement.style.setProperty('--hdr', hdr.offsetHeight + 'px');
    var links = [].slice.call(document.querySelectorAll('.an-nav a[href^="#"]'));
    var secs = links.map(function(a){ return document.querySelector(a.getAttribute('href')); });
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function(en){
        en.forEach(function(x){
            if (!x.isIntersecting) return;
            var i = secs.indexOf(x.target);
            links.forEach(function(a, j){ a.classList.toggle('is-on', j === i); });
            var a = links[i]; if (a) a.parentNode.scrollLeft = a.offsetLeft - 40;
        });
    }, { rootMargin: '-40% 0px -55% 0px' });
    secs.forEach(function(s){ if (s) io.observe(s); });
})();
})();
