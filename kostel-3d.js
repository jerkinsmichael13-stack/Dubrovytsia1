/* Костел Іоанна Хрестителя у Дубровиці — 3D-модель за фотографіями та обмірним кресленням.
   Використання:  Kostel3D.mount(canvas, {autoRotate, zoom, touch, view, ...}).then(function(api){ ... })
   Бібліотека three.js r147 підвантажується з three-r147.js лише тоді, коли модель справді показують. */
(function(){
'use strict';
var BASE = (function(){ var s = document.currentScript; return s && s.src ? s.src.replace(/[^\/?#]*([?#].*)?$/, '') : ''; })();
var loading = null;
function load(){
  if (window.THREE && THREE.OrbitControls) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise(function(res, rej){
    var s = document.createElement('script'); s.src = BASE + 'three-r147.js'; s.async = true;
    s.onload = function(){ window.THREE && THREE.OrbitControls ? res() : rej(new Error('three')); };
    s.onerror = function(){ loading = null; rej(new Error('three')); };
    document.head.appendChild(s);
  });
  return loading;
}
function supported(){ try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch(e){ return false; } }
function fonts(){
  if (!document.fonts || !document.fonts.load) return Promise.resolve();
  return Promise.race([Promise.all([document.fonts.load('500 64px "Cormorant Garamond"'), document.fonts.load('600 40px "Manrope"')]).catch(function(){}), new Promise(function(r){ setTimeout(r, 1500); })]);
}
function mount(canvas, o){
  o = Object.assign({autoRotate:true, autoRotateSpeed:.45, zoom:true, touch:'none', view:[46, 9, 52], fit:1, pixelRatio:2, shadow:2048,
                     turntable:true, motes:false, onReady:null, onFail:null, onStart:null}, o || {});
  if (!supported()){ if (o.onFail) o.onFail('webgl'); return Promise.resolve(null); }
  return Promise.all([load(), fonts()]).then(function(){ return build(canvas, o); }, function(){ if (o.onFail) o.onFail('load'); return null; });
}
window.Kostel3D = {mount: mount, load: load, supported: supported};

function build(canvas, o){
THREE.ColorManagement.legacyMode = false;
var renderer;
try { renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:true, alpha:true, powerPreference:'high-performance'}); }
catch(e){ if (o.onFail) o.onFail('webgl'); return null; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, o.pixelRatio));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(34, 1, 0.5, 800);

/* ── materials: the church as it is today ── */
function canvasTex(w, h, draw){ var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; }
function mat(c, o){ return new THREE.MeshStandardMaterial(Object.assign({color:c, roughness:.9, metalness:0}, o||{})); }
var M = {
  wall:  mat('#eebf30'),
  trim:  mat('#f5f2ea'),
  roof:  mat('#4b3430', {roughness:.55}),
  field: mat('#efebe2', {roughness:.95}),
  dome:  mat('#3f4239', {roughness:.62, metalness:.22}),
  domeF: mat('#43473d', {roughness:.55, metalness:.25, flatShading:true}),
  glass: mat('#2a3036', {roughness:.18, metalness:.1}),
  louv:  mat('#2a2622', {roughness:.7}),
  door:  mat('#3b2a1c', {roughness:.8}),
  orn:   mat('#3a2a1c', {roughness:.7}),
  cross: mat('#8b7a50', {roughness:.35, metalness:.75}),
  ground:mat('#3a3023', {roughness:1})
};

/* louvres in the tower openings: horizontal slats */
M.louv.map = canvasTex(16, 64, function(k){ k.fillStyle = '#1c1a17'; k.fillRect(0, 0, 16, 64); var g = k.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, '#5a524a'); g.addColorStop(.6, '#3a352f'); g.addColorStop(1, '#1c1a17'); k.fillStyle = g; k.fillRect(0, 6, 16, 50); });
M.louv.map.wrapS = M.louv.map.wrapT = THREE.RepeatWrapping; M.louv.map.repeat.set(1, 5); M.louv.color.set('#ffffff');
var church = new THREE.Group(); scene.add(church);
function add(geo, m, x, y, z, parent){ var o = new THREE.Mesh(geo, m); o.position.set(x||0, y||0, z||0); o.castShadow = o.receiveShadow = true; (parent||church).add(o); return o; }
/* box by bottom-centre */
function box(w, h, d, x, y, z, m, parent){ return add(new THREE.BoxGeometry(w, h, d), m, x, y + h/2, z, parent); }
/* box by extents */
function boxX(x0, x1, y0, y1, z0, z1, m, parent){ return box(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), (x0 + x1)/2, Math.min(y0, y1), (z0 + z1)/2, m, parent); }
/* face-local group: x across the face, y up, +z out of the wall */
function face(x, z, rotY){ var g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY||0; church.add(g); return g; }
var FRONT = 0, RIGHT = Math.PI/2, LEFT = -Math.PI/2, BACK = Math.PI;
function ext(shape, depth, seg){ return new THREE.ExtrudeGeometry(shape, {depth:depth, bevelEnabled:false, curveSegments:seg||20}); }
function V(x, y){ return new THREE.Vector2(x, y); }
function archS(w, yb, yc, path){ var r = w/2, s = path ? new THREE.Path() : new THREE.Shape(); s.moveTo(-r, yb); s.lineTo(r, yb); s.lineTo(r, yc); s.absarc(0, yc, r, 0, Math.PI, false); s.lineTo(-r, yb); return s; }
function segS(w, yb, yt, rise, path){ var r = w/2, R = (r*r + rise*rise)/(2*rise), cy = yt - R, a0 = Math.atan2(yt - rise - cy, r), s = path ? new THREE.Path() : new THREE.Shape();
  s.moveTo(-r, yb); s.lineTo(r, yb); s.lineTo(r, yt - rise); s.absarc(0, cy, R, a0, Math.PI - a0, false); s.lineTo(-r, yb); return s; }
function rectS(w, yb, yt, path){ var s = path ? new THREE.Path() : new THREE.Shape(); s.moveTo(-w/2, yb); s.lineTo(w/2, yb); s.lineTo(w/2, yt); s.lineTo(-w/2, yt); s.lineTo(-w/2, yb); return s; }
function ring(r0, r1){ var s = new THREE.Shape(); s.absarc(0, 0, r1, 0, Math.PI*2, false); s.holes.push(new THREE.Path().absarc(0, 0, r0, 0, Math.PI*2, true)); return s; }

/* window on a face group: an opening sunk into the wall with white reveals, a flat white surround and a sill.
   The wall is a solid block, so the opening is "cut" at draw time: a mask resets the depth buffer inside
   the opening, then the reveals and the glass behind the wall surface are drawn into it. */
var holeStencil = new THREE.MeshBasicMaterial({colorWrite: false, depthWrite: false, stencilWrite: true, stencilRef: 1,
  stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp});
var holeDepth = new THREE.ShaderMaterial({
  vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w * 0.999999; }',
  fragmentShader: 'void main(){ gl_FragColor = vec4(0.0); }',
  colorWrite: false, depthWrite: true, depthFunc: THREE.AlwaysDepth,
  stencilWrite: true, stencilRef: 1, stencilFunc: THREE.EqualStencilFunc, stencilZPass: THREE.KeepStencilOp
});
var revealMat = mat('#f1ede4', {side: THREE.BackSide});
var revealWall = mat('#e6b62c', {side: THREE.BackSide});
M.void = mat('#16130f', {roughness:1});
M.frameG = mat('#8e8a82', {roughness:.8});
/* leaded glass of the centre window: small panes with a lozenge at every crossing */
M.leaded = mat('#ffffff', {roughness:.25, metalness:.1});
M.leaded.map = canvasTex(128, 128, function(k){
  k.fillStyle = '#2b3238'; k.fillRect(0, 0, 128, 128);
  var g = k.createLinearGradient(0, 0, 128, 128); g.addColorStop(0, 'rgba(160,180,195,.25)'); g.addColorStop(1, 'rgba(160,180,195,0)'); k.fillStyle = g; k.fillRect(0, 0, 128, 128);
  k.strokeStyle = '#c9c4b8'; k.lineWidth = 3; k.strokeRect(1.5, 1.5, 125, 125);
  k.lineWidth = 2.5; k.beginPath(); k.moveTo(64, 34); k.lineTo(94, 64); k.lineTo(64, 94); k.lineTo(34, 64); k.closePath(); k.stroke();
  [[0,0],[128,0],[0,128],[128,128]].forEach(function(c){ k.beginPath(); k.moveTo(c[0], c[1] + (c[1] ? -22 : 22)); k.lineTo(c[0] + (c[0] ? -22 : 22), c[1]); k.stroke(); });
});
M.leaded.map.wrapS = M.leaded.map.wrapT = THREE.RepeatWrapping; M.leaded.map.repeat.set(1/.48, 1/.48);
M.sash = mat('#f7f5f0', {roughness:.6});
M.pipe = mat('#4e342b', {roughness:.45, metalness:.35});
function sunk(o, order){ o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; return o; }
/* bars: number of rows, or a list of transom heights as fractions of the opening's straight part */
/* opt: {frame: surround material or null, sill: material or null, reveal: material, seg: rise of a segmental top} */
function win(g, x, y, w, h, arched, fw, bars, glassMat, depth, opt){
  fw = fw || .2; depth = depth || .35; opt = opt || {};
  var yc = y + h - w/2, seg = opt.seg || 0;
  function opening(path){ return arched ? archS(w, y, yc, path) : seg ? segS(w, y, y + h, seg, path) : rectS(w, y, y + h, path); }
  var frameM = opt.frame === undefined ? M.trim : opt.frame, sillM = opt.sill === undefined ? M.trim : opt.sill;
  if (frameM){
    var o = arched ? archS(w + 2*fw, y - fw*.6, yc) : seg ? segS(w + 2*fw, y - fw, y + h + fw, seg*1.15) : rectS(w + 2*fw, y - fw, y + h + fw);
    o.holes.push(opening(true));
    add(ext(o, .06), frameM, x, 0, 0, g);                                          // flat surround
  }
  if (sillM) box(w + 2*fw + .14, .1, .24, x, y - fw*.6 - .1, .12, sillM, g);       // sill
  var hg = new THREE.ShapeGeometry(opening(), 24);
  [holeStencil, holeDepth].forEach(function(hm, i){ var m = new THREE.Mesh(hg, hm); m.position.set(x, 0, .02); m.renderOrder = 1 + i; m.frustumCulled = false; g.add(m); });
  sunk(add(ext(opening(), depth, 24), opt.reveal || revealMat, x, 0, -depth, g), 3);   // reveals
  sunk(add(new THREE.ShapeGeometry(opening(), 24), glassMat || M.glass, x, 0, -depth + .02, g), 3);
  if (!bars) return;
  var zb = -depth + .03, f = .07, b = .045, top = arched ? yc : y + h;
  var sashM = opt.sash || M.sash;
  var frame = arched ? archS(w, y, yc) : seg ? segS(w, y, y + h, seg) : rectS(w, y, y + h);   // sash frame round the opening
  frame.holes.push(arched ? archS(w - 2*f, y + f, yc, true) : seg ? segS(w - 2*f, y + f, y + h - f, seg*.9, true) : rectS(w - 2*f, y + f, y + h - f, true));
  sunk(add(ext(frame, .05, 24), sashM, x, 0, zb, g), 3);
  sunk(box(b, (arched ? yc + w/2 : top) - y - 2*f, .05, x, y + f, zb, sashM, g), 3); // mullion
  var tr = Array.isArray(bars) ? bars : Array.from({length: bars - 1}, function(_, i){ return (i + 1)/bars; });
  if (arched) tr = tr.concat([1]);
  tr.forEach(function(t){ sunk(box(w - 2*f, b, .05, x, y + (top - y)*t - b/2, zb, sashM, g), 3); });
}
/* raised moulding round a recessed panel */
function panel(g, x, y, w, h, t, m){
  t = t || .16; var yt = y + h, e = w > 1.5 ? .14 : 0, eh = .45, hw = w/2;
  var o = new THREE.Shape([V(-hw, y), V(hw, y), V(hw, yt - eh), V(hw + e, yt - eh), V(hw + e, yt), V(-hw - e, yt), V(-hw - e, yt - eh), V(-hw, yt - eh)]);
  o.holes.push(rectS(w - 2*t, y + t, yt - t, true));
  add(ext(o, .07), m || M.trim, x, 0, 0, g);
}
/* pilaster with base and capital, on a face group */
function pil(g, x, y0, y1, w, d){
  d = d || .3;
  box(w, y1 - y0, d, x, y0, d/2, M.trim, g);
  box(w + .24, .3, d + .12, x, y1 - .3, (d + .12)/2, M.trim, g);
  box(w + .14, .32, d + .07, x, y0, (d + .07)/2, M.trim, g);
}
/* group of 1 or 2 pilasters on a shallow backing strip */
function pilGroup(g, x0, x1, y0, y1, two){
  var w = x1 - x0, cx = (x0 + x1)/2;
  box(w, y1 - y0, .12, cx, y0, .06, M.trim, g);
  if (two){ var pw = (w - .16)/2; pil(g, x0 + pw/2, y0, y1, pw, .3); pil(g, x1 - pw/2, y0, y1, pw, .3); }
  else pil(g, cx, y0, y1, w - .22, .32);
}
/* stacked cornice: layers [height, projection] round a block */
function cornice(x0, x1, z0, z1, y, layers, sides){
  sides = sides || {f:1, b:1, l:1, r:1};
  layers.forEach(function(L){ var h = L[0], p = L[1];
    boxX(x0 - (sides.l ? p : 0), x1 + (sides.r ? p : 0), y, y + h, z0 - (sides.b ? p : 0), z1 + (sides.f ? p : 0), M.trim); y += h; });
  return y;
}
function prism(pts, len, m, x, y, z){ var s = new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(function(p){ s.lineTo(p[0], p[1]); }); s.lineTo(pts[0][0], pts[0][1]); return add(ext(s, len), m, x, y, z); }
/* closed convex solid from polygon faces (auto-oriented outwards) */
function solid(faces, m, centre){
  var pos = [];
  faces.forEach(function(f){
    var p = f.map(function(a){ return new THREE.Vector3(a[0], a[1], a[2]); });
    var n = new THREE.Vector3(), c = new THREE.Vector3();
    for (var i = 0; i < p.length; i++){ var a = p[i], b = p[(i + 1) % p.length]; n.x += (a.y - b.y)*(a.z + b.z); n.y += (a.z - b.z)*(a.x + b.x); n.z += (a.x - b.x)*(a.y + b.y); c.add(a); }
    c.divideScalar(p.length);
    if (n.dot(c.clone().sub(centre)) < 0) p.reverse();
    for (var k = 1; k < p.length - 1; k++) [p[0], p[k], p[k + 1]].forEach(function(v){ pos.push(v.x, v.y, v.z); });
  });
  var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  return add(g, m);
}
function crossAt(x, y, z, h, rotY){
  var g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rotY || 0; church.add(g);
  box(.11, h, .11, 0, 0, 0, M.cross, g);
  box(h*.5, .11, .11, 0, h*.68, 0, M.cross, g);
  [[0, h],[-h*.25, h*.68 + .055],[h*.25, h*.68 + .055]].forEach(function(p){ add(new THREE.SphereGeometry(.09, 10, 8), M.cross, p[0], p[1], 0, g); });
}

/* ═══════════ DIMENSIONS (metres) ═══════════ */
var HW = 11, FD = 6.0;                 // facade: 22 m wide, 6 m deep, flush with the side walls
var H1 = 10.4, H2 = 18.0;               // lower tier and second tier, tops of their cornices
var NX = 6.3, NZ0 = -FD, NZ1 = -22.4, NE = 16.6;   // nave (clerestory) walls
var PX = 4.85, PZ1 = -30.4, PE = 16.0;             // presbytery, narrower and lower
var AE = 8.9, AEC = 9.5, AK = .4227;               // aisles: wall top, eave, roof slope
var BAYS = [-8.4, -13.4, -19.25], PIERS = [-10.7, -16.1], DORMERS = [-9.0, -18.1], PBAY = -24.7, LBAY = -27.0;   // window axes along the sides
function aisleRoofY(x){ return AEC + (HW - Math.abs(x))*AK; }

/* ═══════════ FACADE BLOCK ═══════════ */
boxX(-HW - .15, HW + .15, 0, .8, -FD - .1, .15, M.trim);       // plinth
boxX(-HW, HW, 0, H2 - .5, -FD, 0, M.wall);                     // the block itself
/* front groups: [x0, x1, two pilasters?]  — symmetric */
var GROUPS = [[9.72, 11.0, false], [5.15, 6.25, true], [2.29, 3.87, true]];
var FF = face(0, 0, FRONT);
function frontGroups(y0, y1){
  GROUPS.forEach(function(G){ [-1, 1].forEach(function(s){ var a = s*G[0], b = s*G[1]; pilGroup(FF, Math.min(a, b), Math.max(a, b), y0, y1, G[2]); }); });
}
/* corner blocks wrap the pilasters round onto the sides */
function corners(y0, y1){ [-1, 1].forEach(function(s){ boxX(s*(HW - 1.28), s*(HW + .32), y0, y1, -1.28, .32, M.trim); boxX(s*(HW - .2), s*(HW + .32), y0, y1, -FD, -FD + 1.1, M.trim); }); }

/* lower tier */
frontGroups(.8, 8.6); corners(.8, 8.6);
boxX(-HW - .05, HW + .05, 8.6, 8.9, -FD - .05, .05, M.trim);                 // architrave
cornice(-HW, HW, -FD, 0, 9.5, [[.25,.12],[.3,.3],[.2,.42],[.15,.5]]);           // → 10.4
boxX(-HW + .3, HW - .3, 8.16, 8.24, -.02, .05, M.trim);                        // thin band under the capitals
(function(){                                                                      // tin flashing on the lower cornice
  var a = Math.atan2(.16, .62);
  var f = box(2*HW + 1.1, .04, .66, 0, 10.46, .27, M.roof); f.rotation.x = a;
  [-1, 1].forEach(function(s){ var b = box(.66, .04, FD + .5, s*(HW + .27), 10.46, -FD/2 + .25, M.roof); b.rotation.z = -s*a; });
})();
[-1, 1].forEach(function(s){                                                      // small pediments over the narrow bays
  var t = new THREE.Shape([V(-1.0, 0), V(1.0, 0), V(0, .95)]); t.holes.push(new THREE.Path([V(-.72, .12), V(0, .72), V(.72, .12)]));
  add(ext(t, .34), M.trim, s*4.51, 8.92, .02);
  add(ext(new THREE.Shape([V(-.72, .12), V(.72, .12), V(0, .72)]), .2), M.wall, s*4.51, 8.92, .02);
});
/* portal */
(function(){
  box(2.1, 3.8, .14, 0, .8, .07, M.door);
  box(.06, 3.6, .03, 0, .9, .15, M.orn);
  [-1, 1].forEach(function(s){ box(.4, 4.1, .44, s*1.27, .8, .22, M.trim); });
  [-1, 1].forEach(function(s){ box(.5, .22, .5, s*1.27, 4.62, .24, M.orn); });
  (function(){ var b = new THREE.Shape(); b.moveTo(-1.62, 4.84); b.quadraticCurveTo(0, 5.3, 1.62, 4.84); b.lineTo(1.62, 5.16); b.quadraticCurveTo(0, 5.62, -1.62, 5.16); b.lineTo(-1.62, 4.84);
    add(ext(b, .56, 24), M.trim, 0, 0, .02); })();
  var pl = rectS(2.4, 0, 1.05); pl.holes.push(rectS(2.0, .17, .88, true));
  add(ext(pl, .18), M.trim, 0, 5.45, .05);
  function plaque(w, h, r){ var s = new THREE.Shape(), a = w/2, b = h/2;
    s.moveTo(-a + r, -b); s.lineTo(a - r, -b); s.absarc(a, -b, r, Math.PI, Math.PI/2, true); s.lineTo(a, b - r); s.absarc(a, b, r, -Math.PI/2, -Math.PI, true);
    s.lineTo(-a + r, b); s.absarc(-a, b, r, 0, -Math.PI/2, true); s.lineTo(-a, -b + r); s.absarc(-a, -b, r, Math.PI/2, 0, true); return s; }
  var pb = plaque(1.9, .66, .16); pb.holes.push(new THREE.Path(plaque(1.72, .5, .12).getPoints(12)));
  add(ext(pb, .1, 12), M.orn, 0, 5.975, .1);
  add(ext(plaque(1.72, .5, .12), .06, 12), M.wall, 0, 5.975, .08);
  /* C-scrolls beside the plaque */
  [-1, 1].forEach(function(s){
    var c = new THREE.CatmullRomCurve3([[1.22,1.0],[1.4,.75],[1.38,.42],[1.2,.18],[1.0,.1],[.92,.26],[1.04,.36]].map(function(p){ return new THREE.Vector3(s*p[0], 5.45 + p[1], .2); }));
    add(new THREE.TubeGeometry(c, 50, .085, 8, false), M.trim);
  });
  /* gabled pediment: two moulded rakes meeting under a pedestal; dark sculptures on the ends and on top */
  var PB = 6.55, PT = 7.3, pa = Math.atan2(PT - PB, 1.35), pl2 = Math.hypot(1.35, PT - PB) + .1;
  box(2.9, .16, .46, 0, PB, .23, M.trim);
  [-1, 1].forEach(function(s){ var r = box(pl2, .2, .46, s*.67, PB + (PT - PB)/2 - .02, .23, M.trim); r.rotation.z = -s*pa; });
  box(.46, .3, .4, 0, PT - .06, .22, M.trim);
  function figure(x, y, z, flip, sc){       // a kneeling figure, simplified to a dark silhouette in relief
    var p = [[0,0],[.42,0],[.44,.12],[.3,.18],[.34,.42],[.28,.62],[.2,.7],[.22,.82],[.16,.9],[.08,.88],[.06,.78],[.1,.68],[.0,.55],[-.16,.75],[-.3,.82],[-.22,.6],[-.1,.42],[-.04,.2]];
    var sh = new THREE.Shape(p.map(function(q){ return V(flip*q[0]*sc, q[1]*sc); }));
    add(ext(sh, .22, 6), M.orn, x, y, z);
  }
  figure(-1.12, PB + .14, .16, 1, 1.0); figure(1.12, PB + .14, .16, -1, 1.0);
  /* St John the Baptist on top: a seated figure with a cross-staff */
  (function(){
    var p = [[-.42,0],[.42,0],[.4,.16],[.18,.22],[.22,.5],[.16,.66],[.18,.8],[.08,.9],[-.04,.88],[-.08,.76],[-.04,.66],[-.18,.52],[-.3,.28],[-.42,.2]];
    add(ext(new THREE.Shape(p.map(function(q){ return V(q[0]*1.15, q[1]*1.15); })), .26, 6), M.orn, 0, PT + .24, .1);
    box(.04, 1.1, .04, .38, PT + .24, .24, M.orn); box(.26, .04, .04, .38, PT + 1.12, .24, M.orn);
  })();
})();
/* lower tier sides: small square window */
[-1, 1].forEach(function(s){ var g = face(s*HW, -3.0, s*RIGHT); win(g, 0, 6.2, .8, .8, false, .14); panel(g, 0, 1.5, 2.6, 6.7); });

/* second tier — as wide as the lower one */
boxX(-HW - .05, HW + .05, H1, H1 + .35, -FD - .05, .05, M.trim);
frontGroups(H1 + .35, 15.7); corners(H1 + .35, 15.7);
boxX(-HW - .05, HW + .05, 15.7, 15.95, -FD - .05, .05, M.trim);              // architrave
cornice(-HW, HW, -FD, 0, 16.85, [[.25,.12],[.35,.3],[.3,.48],[.25,.55]]);      // → 18.0
[-1, 1].forEach(function(s){
  win(FF, s*7.99, 12.55, 1.1, 2.45, true, .2, 0, M.void, .5, {frame: null, sill: M.wall, reveal: revealWall});
  var g = face(s*HW, -3.0, s*RIGHT);
  panel(g, 0, 11.0, 2.6, 4.5);
  win(g, 0, 12.65, 1.0, 2.3, true, .18, 2);
  win(g, 0, 11.3, .55, .55, false, .12);
});
win(FF, 0, 12.0, 1.85, 2.75, false, .2, [.64], M.leaded, .35, {frame: M.frameG, sill: M.frameG, seg: .22, sash: M.sash});
/* inscription in the frieze */
(function(){
  function label(text, w, x){
    var t = canvasTex(1024, 180, function(k){
      k.fillStyle = '#eebf30'; k.fillRect(0, 0, 1024, 180);
      k.font = 'bold 150px "Times New Roman", Georgia, serif'; k.textAlign = 'center'; k.textBaseline = 'middle';
      try { k.letterSpacing = '10px'; } catch(e){}
      /* bronze letters with a gilded edge, as on the facade */
      k.lineJoin = 'round'; k.strokeStyle = '#b8924a'; k.lineWidth = 9; k.strokeText(text, 512, 98, 1000);
      k.fillStyle = '#5a3a26'; k.fillText(text, 512, 98, 1000);
    });
    add(new THREE.PlaneGeometry(w, w*180/1024), new THREE.MeshStandardMaterial({map:t, roughness:.9}), x, 16.4, .015).castShadow = false;
  }
  label('SAMEMU', 3.7, -7.99); label('BOGU CZESC I', 4.9, 0); label('CHWALA', 3.7, 7.99);
})();

/* ═══════════ TOWERS · 5.6 m square, flush with the facade's corners ═══════════ */
var TS = 5.6, TB = H2 + .8, TC = 25.9, TTOP = 26.9;
var clockTex = canvasTex(256, 256, function(k){
  k.fillStyle = '#16171a'; k.fillRect(0, 0, 256, 256);
  k.strokeStyle = '#d9d2c3'; k.lineWidth = 4; k.beginPath(); k.arc(128, 128, 112, 0, Math.PI*2); k.stroke();
  k.lineWidth = 2; k.beginPath(); k.arc(128, 128, 78, 0, Math.PI*2); k.stroke();
  k.fillStyle = '#d9d2c3'; k.font = 'bold 26px "Times New Roman", Georgia, serif'; k.textAlign = 'center'; k.textBaseline = 'middle';
  var R = ['XII','I','II','III','IIII','V','VI','VII','VIII','IX','X','XI'];
  for (var i = 0; i < 12; i++){ var a = i/12*Math.PI*2; k.save(); k.translate(128 + Math.sin(a)*95, 128 - Math.cos(a)*95); k.rotate(a); k.fillText(R[i], 0, 1); k.restore(); }
  k.strokeStyle = '#e8dfc8'; k.lineCap = 'round';
  k.lineWidth = 8; k.beginPath(); k.moveTo(128, 128); k.lineTo(128 + Math.cos(-2.4)*46, 128 + Math.sin(-2.4)*46); k.stroke();
  k.lineWidth = 5; k.beginPath(); k.moveTo(128, 128); k.lineTo(128 + Math.cos(-.75)*68, 128 + Math.sin(-.75)*68); k.stroke();
  k.fillStyle = '#e8dfc8'; k.beginPath(); k.arc(128, 128, 7, 0, Math.PI*2); k.fill();
});
var clockMat = new THREE.MeshStandardMaterial({map:clockTex, roughness:.6});
function smooth(list, n){ var c = new THREE.CatmullRomCurve3(list.map(function(p){ return new THREE.Vector3(p[0], p[1], 0); }), false, 'centripetal'); return c.getPoints(n).map(function(v){ return V(Math.max(0, v.x), v.y); }); }
function tower(cx){
  var cz = -TS/2, h = TS/2;
  boxX(cx - h - .08, cx + h + .08, H2, TB, cz - h - .08, cz + h + .08, M.trim);
  boxX(cx - h, cx + h, TB, TC, cz - h, cz + h, M.wall);
  /* corner pilasters (wrapping both faces), base, impost, capital */
  [-1, 1].forEach(function(a){ [-1, 1].forEach(function(b){
    var x0 = cx + a*(h - 1.25), x1 = cx + a*(h + .22), z0 = cz + b*(h - 1.25), z1 = cz + b*(h + .22);
    boxX(x0, x1, TB, 25.75, z0, z1, M.trim);
    boxX(x0 - a*.06, x1 + a*.1, TB, TB + .4, z0 - b*.06, z1 + b*.1, M.trim);
    boxX(x0 - a*.06, x1 + a*.1, 20.95, 21.25, z0 - b*.06, z1 + b*.1, M.trim);
    boxX(x0 - a*.08, x1 + a*.14, 25.45, 25.75, z0 - b*.08, z1 + b*.14, M.trim);
  }); });
  boxX(cx - h - .04, cx + h + .04, 25.75, 25.9, cz - h - .04, cz + h + .04, M.trim);
  boxX(cx - h - .04, cx + h + .04, TB - .12, TB, cz - h - .04, cz + h + .04, M.trim);
  cornice(cx - h, cx + h, cz - h, cz + h, TC, [[.2,.1],[.3,.3],[.25,.45],[.25,.52]]);   // → 26.3
  /* openings on all four faces; clocks on the front faces */
  [[cx, cz + h, FRONT],[cx, cz - h, BACK],[cx + h, cz, RIGHT],[cx - h, cz, LEFT]].forEach(function(f, i){
    var g = face(f[0], f[1], f[2]);
    win(g, 0, 19.1, .9, 1.65, true, .16, 0, M.void, .55, {frame: null, sill: M.wall, reveal: revealWall});
    win(g, 0, 23.35, .85, 2.0, true, .18, 0, M.void, .55, {frame: null, sill: M.wall, reveal: revealWall});
    if (i === 0){                                                   // black clock face in a white square frame
      box(1.55, 1.55, .1, 0, 21.5, .05, M.trim, g);
      add(new THREE.PlaneGeometry(1.31, 1.31), clockMat, 0, 22.275, .102, g).castShadow = false;
    } else win(g, 0, 21.9, .5, .55, false, .12, 0, M.glass, .3);
  });
  /* onion dome, lantern drum, small onion, spire, cross */
  var y = TTOP;
  add(new THREE.CylinderGeometry(2.62*Math.SQRT2, 3.34*Math.SQRT2, .42, 4, 1), M.roof, cx, y + .21, cz).rotation.y = Math.PI/4;
  y += .34;
  add(new THREE.CylinderGeometry(2.5, 2.55, .16, 8), M.domeF, cx, y + .08, cz).rotation.y = Math.PI/8;
  var big = smooth([[0,0],[2.46,0],[2.55,.67],[2.55,1.34],[2.46,1.85],[2.24,2.3],[1.85,2.69],[1.34,2.97],[.92,3.14],[0,3.14]], 26);
  add(new THREE.LatheGeometry(big, 8, Math.PI/8), M.domeF, cx, y + .14, cz);
  y += 3.28;
  add(new THREE.CylinderGeometry(.88, .9, 1.55, 28), M.dome, cx, y + .775, cz);
  for (var i = 0; i < 12; i++){ var a = i/12*Math.PI*2; box(.06, 1.4, .06, cx + Math.cos(a)*.9, y + .08, cz + Math.sin(a)*.9, M.louv); }
  y += 1.55;
  add(new THREE.CylinderGeometry(1.1, 1.1, .16, 28), M.dome, cx, y + .08, cz);
  y += .16;
  var sm = smooth([[0,0],[1.04,0],[1.18,.28],[1.18,.62],[.95,1.0],[.5,1.33],[.2,1.55],[0,1.6]], 18);
  add(new THREE.LatheGeometry(sm, 8, Math.PI/8), M.domeF, cx, y, cz);
  y += 1.5;
  add(new THREE.CylinderGeometry(.06, .15, 2.5, 12), M.dome, cx, y + 1.25, cz);
  add(new THREE.SphereGeometry(.22, 16, 12), M.dome, cx, y + .55, cz);
  crossAt(cx, y + 2.45, cz, 1.6, 0);                                  // facing the square, like the gable cross
}
tower(-8.2); tower(8.2);

/* ═══════════ BAROQUE GABLE with the cartouche — traced from the close-up of the 1930s photograph, in metres ═══════════ */
(function(){
  var gy = H2, z0 = -.25, TW = 5.4, BT = .75;            // tower faces at x = ±5.4; plinth band up to 0.75 m
  function half(pts, n, bottom){                          // right half, from the top centre down to the bottom centre
    var all = [[-pts[1][0], pts[1][1]]].concat(pts);
    var c = new THREE.CatmullRomCurve3(all.map(function(p){ return new THREE.Vector3(p[0], gy + p[1], 0); }), false, 'centripetal');
    var out = [V(0, gy + pts[0][1])].concat(c.getPoints(n).map(function(v){ return V(v.x, v.y); }).filter(function(v){ return v.x > .002; }));
    out.push(V(0, gy + bottom));
    return out;
  }
  function mirror(pts){ return pts.map(function(v){ return V(-v.x, v.y); }); }
  function loop(h){ return h.concat(mirror(h.slice(1, -1)).reverse()); }
  function offsetLoop(pts, d){
    var n = pts.length, area = 0, i;
    for (i = 0; i < n; i++){ var p = pts[i], q = pts[(i + 1) % n]; area += p.x*q.y - q.x*p.y; }
    var sg = area > 0 ? 1 : -1;
    return pts.map(function(p, i){ var a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n], tx = b.x - a.x, ty = b.y - a.y, L = Math.hypot(tx, ty) || 1; return V(p.x - sg*ty/L*d, p.y + sg*tx/L*d); });
  }
  function shapeOf(l, hole){ var s = new THREE.Shape(l); if (hole) s.holes.push(new THREE.Path(hole)); return s; }

  /* frame: wavy top, the shoulder running on in a straight slope to a pointed lobe, back in, down to the
     scroll, along the white pier, then the lower edge sweeping in to the foot on the plinth band */
  var OUT = [[0,9.55],[.6,9.5],[1.29,9.25],[2.0,9.15],[2.4,8.97],[2.8,8.7],[3.15,8.43],[3.45,8.17],[3.66,7.93],[3.72,7.75],
             [3.55,7.55],[3.38,7.38],[3.45,7.22],[3.6,7.08],[3.75,6.94],[3.9,6.8],[4.05,6.67],[4.38,6.55],[4.2,6.42],[3.92,6.33],
             [3.82,6.13],[3.74,5.9],[3.68,5.6],[3.65,5.3],[3.67,5.03],[3.69,4.89],[3.72,4.72],[3.8,4.57],[3.9,4.45],[3.98,4.32],
             [4.05,4.18],[4.1,4.03],[4.15,3.9],[4.24,3.77],[4.38,3.65],[4.48,3.51],[4.52,3.35],[4.52,2.96],[4.2,2.82],[3.92,2.68],
             [3.7,2.43],[3.45,2.15],[3.14,1.99],[2.6,1.84],[1.95,1.74],[1.5,1.62],[1.22,1.45],[1.04,1.3],[.93,1.1],[.87,.92],[.85,BT]];
  var FIELD = [[0,7.99],[.45,8.1],[.95,8.42],[1.3,8.38],[1.7,8.1],[2.1,7.86],[2.6,7.8],[2.42,7.52],[2.3,7.38],[2.17,7.1],[2.05,6.82],
               [2.04,6.55],[2.09,6.27],[2.19,6.0],[2.34,5.72],[2.5,5.44],[2.73,5.17],[2.9,4.89],[3.03,4.61],[3.1,4.34],[3.13,4.06],
               [3.08,3.72],[3.02,3.4],[2.93,3.1],[2.78,2.82],[2.54,2.54],[2.25,2.36],[1.9,2.25],[1.5,2.12],[1.2,1.99],[.96,1.85],
               [.82,1.66],[.66,1.47],[.56,1.3],[.52,1.12]];
  var fo = loop(half(OUT, 600, BT)), fi = loop(half(FIELD, 500, 1.1));
  var top = gy + 9.55, zf = z0 + .05, FR = .26;          // FR: how far the frame stands out from the wall

  /* wall behind: plinth band, the yellow wall low down between the towers, the frame's outline above */
  boxX(-TW, TW, gy, gy + BT, z0 - 1.12, z0 + .2, M.wall);
  boxX(-TW, TW, gy + BT - .12, gy + BT, z0 - 1.14, z0 + .3, M.trim);
  boxX(-TW, TW, gy + BT, gy + 3.2, z0 - 1.1, z0 + .04, M.wall);
  add(ext(shapeOf(fo), 1.08, 4), M.wall, 0, 0, z0 - 1.1);
  add(ext(shapeOf(fo), .07, 4), M.trim, 0, 0, z0 - .02);

  /* the frame: yellow like the wall (as on the building today), a white border along its upper edge down to the
     consoles, a rib following the top edge, the white shield sunk inside a rounded edge */
  add(ext(shapeOf(fo, fi), FR, 4), M.wall, 0, 0, zf);
  (function(){
    var run = half(OUT.slice(0, 26), 420, 4.89).slice(0, -1);
    run = mirror(run.slice(1)).reverse().concat(run);
    var strip = run.map(function(p, i){ var a = run[Math.max(0, i - 2)], b = run[Math.min(run.length - 1, i + 2)], tx = b.x - a.x, ty = b.y - a.y, L = Math.hypot(tx, ty) || 1; return [V(p.x - ty/L*.015, p.y + tx/L*.015), V(p.x + ty/L*.27, p.y - tx/L*.27)]; });
    var shp = strip.map(function(q){ return q[0]; }).concat(strip.map(function(q){ return q[1]; }).reverse());
    add(ext(new THREE.Shape(shp), FR + .03, 4), M.trim, 0, 0, zf);
  })();
  (function(){
    var run = half(OUT.slice(0, 10), 160, 7.75).slice(0, -1);
    run = mirror(run.slice(1)).reverse().concat(run);                // left slope … top … right slope
    var strip = run.map(function(p, i){ var a = run[Math.max(0, i - 1)], b = run[Math.min(run.length - 1, i + 1)], tx = b.x - a.x, ty = b.y - a.y, L = Math.hypot(tx, ty) || 1; return [V(p.x + ty/L*.26, p.y - tx/L*.26), V(p.x + ty/L*.38, p.y - tx/L*.38)]; });
    var shp = strip.map(function(q){ return q[0]; }).concat(strip.map(function(q){ return q[1]; }).reverse());
    add(ext(new THREE.Shape(shp), FR + .08, 4), M.trim, 0, 0, zf);
  })();
  var roll = new THREE.CatmullRomCurve3(offsetLoop(fi, -.06).map(function(v){ return new THREE.Vector3(v.x, v.y, zf + FR); }), true);
  add(new THREE.TubeGeometry(roll, 900, .1, 8, true), M.trim);
  var f1 = offsetLoop(fi, .1);
  add(ext(shapeOf(fi, f1), FR - .12, 4), M.trim, 0, 0, zf);
  add(ext(shapeOf(f1), .06, 4), M.field, 0, 0, zf);

  /* beside each tower: a console standing on a white pier — its outer edge curls into a scroll right by the
     tower, with open sky between the scroll and the tower above it */
  [-1, 1].forEach(function(s){
    var C = [[3.69,4.89],[4.56,4.89],[4.76,4.84],[4.88,4.72],[4.93,4.5],[4.93,4.2],[4.92,3.95],[4.97,3.78],[5.12,3.66],[5.27,3.5],
             [5.37,3.36],[5.37,2.96],[4.52,2.96],[4.52,3.35],[4.48,3.51],[4.38,3.65],[4.24,3.77],[4.15,3.9],[4.1,4.03],[4.05,4.18],
             [3.98,4.32],[3.9,4.45],[3.8,4.57],[3.72,4.72]];
    var sh = new THREE.Shape(C.map(function(p){ return V(s*p[0], gy + p[1]); }));
    add(ext(sh, 1.08, 4), M.wall, 0, 0, z0 - 1.1);
    add(ext(sh, FR, 4), M.trim, 0, 0, zf);
    /* the scroll: a spiral band on the console's face */
    var cx = s*4.63, cy = gy + 4.18, N = 160, T = Math.PI*2*2.2, pts = [], ins = [], i;
    for (i = 0; i <= N; i++){ var t = i/N*T, r = .34 - .25*i/N, a = s > 0 ? t + 1.2 : -t + Math.PI - 1.2;
      pts.push(V(cx + Math.cos(a)*r, cy + Math.sin(a)*r)); ins.push(V(cx + Math.cos(a)*(r - .1 + .04*i/N), cy + Math.sin(a)*(r - .1 + .04*i/N))); }
    add(ext(new THREE.Shape(pts.concat(ins.reverse())), .18, 4), M.trim, 0, 0, zf + FR);
    add(new THREE.SphereGeometry(.1, 14, 10), M.trim, cx, cy, zf + FR + .08);
    /* pier under the console, with a capital */
    boxX(s*4.56, s*5.37, gy + BT, gy + 2.96, zf - .02, zf + FR - .04, M.wall);
    boxX(s*4.5, s*(TW + .02), gy + 2.84, gy + 2.98, zf - .02, zf + FR + .06, M.trim);
    boxX(s*4.5, s*(TW + .02), gy + BT, gy + BT + .2, zf - .02, zf + FR + .02, M.wall);
  });
  box(1.1, .45, .9, 0, top - .05, z0 - .35, M.roof);                              // tin-clad block under the cross
  crossAt(0, top + .4, z0 - .35, 2.3);
  var cr = new THREE.Shape(); cr.absarc(0, 0, .42, Math.PI*1.05, Math.PI*1.95, false); cr.absarc(0, .14, .36, Math.PI*1.9, Math.PI*1.1, true);
  add(ext(cr, .07, 16), M.cross, 0, top + .78, z0 - .385);
})();

/* ═══════════ NAVE · three bays, a full gabled roof ending in a gable wall at the back ═══════════ */
boxX(-NX, NX, 0, NE, NZ1, NZ0, M.wall);
cornice(-NX, NX, NZ1, NZ0, NE, [[.25,.1],[.35,.35]], {f:0, b:1, l:1, r:1});        // → 17.2
var RE = 17.2, RR = 23.0, RO = 6.75, PK = (RR - RE)/RO;
prism([[-RO,0],[0,RR - RE],[RO,0],[RO - .5,0],[0,RR - RE - .4],[-RO + .5,0]], -1.4 - NZ1, M.roof, 0, RE, NZ1);   // runs forward to the back of the gable
/* front and rear gable walls */
prism([[-NX,0],[NX,0],[NX,(RO - NX)*PK],[0,RR - RE],[-NX,(RO - NX)*PK]], .4, M.wall, 0, RE, NZ1 - .4);
(function(){
  var a = Math.atan(PK), len = Math.hypot(RO, RR - RE) + .25;
  [-1, 1].forEach(function(s){ var b = box(len, .32, .55, s*RO/2, RE + (RR - RE)/2 - .02, NZ1 - .2, M.trim); b.rotation.z = -s*a; });
  box(.5, .4, .55, 0, RR - .05, NZ1 - .2, M.trim);
  var g = face(0, NZ1 - .4, BACK);
  [-1, 1].forEach(function(s){ box(.32, .45, .05, s*.75, RE + 1.6, .01, M.glass, g).castShadow = false; });
})();
[-1, 1].forEach(function(s){
  /* clerestory: pilasters on the pier lines; three tall arched windows starting just above the aisle roof */
  PIERS.forEach(function(z){ boxX(s*NX, s*(NX + .15), aisleRoofY(NX) - .3, NE, z - .68, z + .68, M.trim); });
  boxX(s*(NX - .5), s*(NX + .15), aisleRoofY(NX) - .3, NE, NZ1 - .15, NZ1 + .6, M.trim);
  BAYS.forEach(function(z){ win(face(s*NX, z, s*RIGHT), 0, aisleRoofY(NX) + .4, 1.4, 2.95, true, .22, 3); });
  /* two dormers, both well within the main roof */
  DORMERS.forEach(function(z){
    var xf = 5.9, yb = RE + (RO - xf)*PK;
    boxX(s*xf, s*4.2, yb - .4, yb + 1.25, z - .7, z + .7, M.wall);
    prism([[-.9,0],[.9,0],[0,.8]], 2.0, M.roof, s > 0 ? 4.2 : -6.2, yb + 1.25, z).rotation.y = Math.PI/2;
    var g = face(s*xf, z, s*RIGHT);
    win(g, 0, yb + .25, .55, .6, false, .12);
    var tri = new THREE.Shape([V(-.85,0),V(.85,0),V(0,.72)]); tri.holes.push(new THREE.Path([V(-.62,.1),V(0,.55),V(.62,.1)]));
    add(ext(tri, .1), M.trim, 0, yb + 1.18, .02, g);
  });
});

/* rainwater goods: gutters under the eaves, downpipes as in the photographs; ridge caps */
(function(){
  function gutter(x, y, z0, z1){ add(new THREE.CylinderGeometry(.1, .1, z1 - z0, 10), M.pipe, x, y, (z0 + z1)/2).rotation.x = Math.PI/2; }
  function pipe(x, y0, y1, z){ add(new THREE.CylinderGeometry(.065, .065, y1 - y0, 10), M.pipe, x, (y0 + y1)/2, z); [y0 + .4, (y0 + y1)/2, y1 - .3].forEach(function(y){ box(.18, .06, .18, x, y, z, M.pipe); }); }
  [-1, 1].forEach(function(s){
    gutter(s*(HW + .52), AEC - .3, PZ1 - .45, NZ0 + .05);
    gutter(s*(RO + .1), RE - .1, NZ1 - .45, -1.5);
    gutter(s*(PX + .5), 16.3, PZ1 - .45, NZ1);
    [NZ0 - .45, PIERS[0] - .8, PIERS[1] - .8, PZ1 + .45].forEach(function(z){ pipe(s*(HW + .24), .25, AEC - .3, z); });
    [PIERS[0] + .8, PIERS[1] + .8].forEach(function(z){ pipe(s*(NX + .26), aisleRoofY(NX + .26), RE - .1, z); });
  });
  box(.34, .16, -1.4 - NZ1 + .3, 0, RR - .08, (NZ1 - 1.4)/2 - .15, M.roof);
})();

/* ═══════════ PRESBYTERY · narrower and 1.5 m lower, closed pediment with the rose window ═══════════ */
boxX(-PX, PX, 0, PE, PZ1, NZ1, M.wall);
var PRE = cornice(-PX, PX, PZ1, NZ1, PE, [[.2,.1],[.2,.3]], {f:0, b:1, l:1, r:1});
var POH = .4, PRR = PRE + (PX + POH)*PK;
prism([[-(PX + POH), 0],[0, PRR - PRE],[PX + POH, 0],[PX, 0],[0, PRR - PRE - .35],[-PX, 0]], (NZ1 - .4) - (PZ1 - POH), M.roof, 0, PRE, PZ1 - POH);
prism([[-PX, 0],[PX, 0],[0, PX*PK]], .35, M.wall, 0, PRE, PZ1);                   // pediment wall
(function(){
  var a = Math.atan(PK), len = Math.hypot(PX + .1, (PX + .1)*PK) + .1;
  [-1, 1].forEach(function(s){ var b = box(len, .32, .45, s*(PX + .1)/2, PRE + (PX + .1)*PK/2 - .3, PZ1 - .1, M.trim); b.rotation.z = -s*a; });
  var g = face(0, PZ1, BACK);
  add(ext(ring(.24, .4), .14, 32), M.trim, 0, PRE + 1.45, 0, g);
  add(new THREE.CircleGeometry(.24, 24), M.glass, 0, PRE + 1.45, .01, g).castShadow = false;
  /* rose window: a quatrefoil of dark glass in a white quatrefoil frame */
  function quatrefoil(a, rc, n){
    var pts = [];
    for (var i = 0; i < n; i++){
      var t = i/n*Math.PI*2, best = 0;
      for (var k = 0; k < 4; k++){ var d = t - k*Math.PI/2, s2 = rc*rc - a*a*Math.sin(d)*Math.sin(d); if (s2 >= 0) best = Math.max(best, a*Math.cos(d) + Math.sqrt(s2)); }
      pts.push(V(Math.cos(t)*best, Math.sin(t)*best));
    }
    return pts;
  }
  var ry = PE - 3.05, outer = quatrefoil(.62, .72, 240), inner = quatrefoil(.5, .56, 240);
  add(ext(shapeOf2(outer, inner), .18), M.trim, 0, ry, 0, g);
  var glassTex = canvasTex(256, 256, function(k){
    k.fillStyle = '#2c3a34'; k.fillRect(0, 0, 256, 256);
    var cols = ['#3c4f43','#4a3a2c','#33444f','#523234'];
    for (var j = 0; j < 8; j++){ k.fillStyle = cols[j % 4]; k.beginPath(); k.moveTo(128, 128); k.arc(128, 128, 128, (j - .5)/8*Math.PI*2, (j + .5)/8*Math.PI*2); k.closePath(); k.fill(); }
    k.strokeStyle = '#141414'; k.lineWidth = 5;
    for (j = 0; j < 8; j++){ var aa = (j + .5)/8*Math.PI*2; k.beginPath(); k.moveTo(128 + Math.cos(aa)*30, 128 + Math.sin(aa)*30); k.lineTo(128 + Math.cos(aa)*128, 128 + Math.sin(aa)*128); k.stroke(); }
    k.fillStyle = '#5a2a2c'; k.beginPath(); k.arc(128, 128, 30, 0, Math.PI*2); k.fill(); k.stroke();
  });
  var gs = new THREE.ShapeGeometry(new THREE.Shape(inner), 1), uv = gs.attributes.uv, ps = gs.attributes.position;
  for (var i = 0; i < uv.count; i++) uv.setXY(i, ps.getX(i)/2.12 + .5, ps.getY(i)/2.12 + .5);
  add(gs, new THREE.MeshStandardMaterial({map:glassTex, roughness:.3}), 0, ry, .02, g).castShadow = false;
  crossAt(0, PRR - .05, PZ1 - .25, 1.5);
})();
function shapeOf2(loop, hole){ var s = new THREE.Shape(loop); if (hole) s.holes.push(new THREE.Path(hole)); return s; }
[-1, 1].forEach(function(s){ win(face(s*PX, PBAY, s*RIGHT), 0, aisleRoofY(PX) + .4, 1.25, 2.2, true, .2, 3); });

/* ═══════════ AISLES · lean-to roofs, running the whole length ═══════════ */
[-1, 1].forEach(function(s){
  boxX(s*NX, s*HW, 0, AE, NZ1, NZ0, M.wall);
  boxX(s*PX, s*HW, 0, AE, PZ1, NZ1, M.wall);
  boxX(s*(HW - .05), s*(HW + .1), 0, .6, PZ1 - .1, NZ0, M.trim);                  // plinth
  boxX(s*PX, s*(HW + .1), 0, .6, PZ1 - .1, PZ1 + .05, M.trim);
  boxX(-PX, PX, 0, .6, PZ1 - .1, PZ1 + .05, M.trim);
  /* eave cornice along the side and across the back */
  [[.25,.1],[.35,.3]].reduce(function(y, L){ boxX(s*(HW - .1), s*(HW + L[1]), y, y + L[0], PZ1 - L[1], NZ0, M.trim); boxX(s*PX, s*(HW + L[1]), y, y + L[0], PZ1 - L[1], PZ1 + .1, M.trim); return y + L[0]; }, AE);
  /* lean-to roof slabs (one plane): beside the nave, then beside the presbytery */
  function slab(xin, z0, z1){
    var xo = HW + .4, t = .28;
    prism(s > 0 ? [[xin, aisleRoofY(xin)],[xo, aisleRoofY(xo)],[xo, aisleRoofY(xo) - t],[xin, aisleRoofY(xin) - t]]
                : [[-xin, aisleRoofY(xin)],[-xin, aisleRoofY(xin) - t],[-xo, aisleRoofY(xo) - t],[-xo, aisleRoofY(xo)]], z1 - z0, M.roof, 0, 0, z0);
  }
  slab(NX, NZ1, NZ0); slab(PX, PZ1 - .35, NZ1);
  /* half-gable at the back of each aisle, with its round window and the upper-floor window under it */
  prism(s > 0 ? [[PX, AEC],[HW - .64, AEC],[PX, aisleRoofY(PX) - .27]] : [[-HW + .64, AEC],[-PX, AEC],[-PX, aisleRoofY(PX) - .27]], .3, M.wall, 0, 0, PZ1);
  var ra = Math.atan(AK), rl = Math.hypot(HW - PX, (HW - PX)*AK);
  var rb = box(rl, .26, .4, s*(HW + PX)/2, (AEC + aisleRoofY(PX))/2 - .22, PZ1 - .08, M.trim); rb.rotation.z = -s*ra;
  var gb = face(s*7.1, PZ1, BACK);
  add(ext(ring(.18, .32), .12, 24), M.trim, 0, AEC + .65, 0, gb);
  add(new THREE.CircleGeometry(.18, 20), M.glass, 0, AEC + .65, .01, gb).castShadow = false;
  win(gb, 0, AE - 2.6, 1.3, 1.55, false, .2, 2);
  /* side: flat pilasters; three arched windows, then two storeys of windows in the last bay */
  PIERS.forEach(function(z){ boxX(s*HW, s*(HW + .12), .6, AE, z - .68, z + .68, M.trim); });
  boxX(s*HW, s*(HW + .12), .6, AE, -23.1, -21.7, M.trim);
  boxX(s*(HW - .5), s*(HW + .12), .6, AE, PZ1 - .12, PZ1 + .7, M.trim);
  BAYS.forEach(function(z){ win(face(s*HW, z, s*RIGHT), 0, AE - 4.25, 1.2, 2.25, true, .18, 2); });
  var lb = face(s*HW, LBAY, s*RIGHT);
  win(lb, 0, AE - 3.3, 1.1, 2.05, false, .18, 2);
  win(lb, 0, 2.2, 1.1, 1.8, false, .18, 2);
});

/* ═══════════ REALISM · weathering worked out in the shader, in world space, so it is the same scale on every part:
   lime-wash blotches, fine plaster grain (bumped, so it catches the light), rain streaks running down from the
   cornices, darker damp near the ground; metal and slate get gentle tonal variation ═══════════ */
function weather(m, o){
  if (!m || !m.isMeshStandardMaterial || m.userData.weathered) return;
  o = Object.assign({blotch: .1, grain: .05, streak: .12, grime: .22, bump: .012, scale: 1, rough: .06}, o || {});
  m.userData.weathered = true;
  m.extensions = m.extensions || {}; m.extensions.derivatives = true;
  var key = 'w' + [o.blotch, o.grain, o.streak, o.grime, o.bump, o.scale, o.rough].join('_');
  function f(v){ v = String(+v); return v.indexOf('.') < 0 && v.indexOf('e') < 0 ? v + '.0' : v; }
  m.onBeforeCompile = function(sh){
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', [
      '#include <common>', 'varying vec3 vWPos;',
      'float wHash(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x + p.y + p.z)); }',
      'float wNoise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0 - 2.0*f);',
      '  return mix(mix(mix(wHash(i), wHash(i + vec3(1,0,0)), f.x), mix(wHash(i + vec3(0,1,0)), wHash(i + vec3(1,1,0)), f.x), f.y),',
      '             mix(mix(wHash(i + vec3(0,0,1)), wHash(i + vec3(1,0,1)), f.x), mix(wHash(i + vec3(0,1,1)), wHash(i + vec3(1,1,1)), f.x), f.y), f.z); }',
      'float wFbm(vec3 p){ return 0.5*wNoise(p) + 0.3*wNoise(p*2.07 + 3.1) + 0.2*wNoise(p*4.13 + 7.7); }'
    ].join('\n'))
    .replace('#include <map_fragment>', [
      '#include <map_fragment>',
      'vec3 wp = vWPos*' + f(o.scale) + ';',
      'float wB = wFbm(wp*0.45);',
      'float wG = wNoise(wp*9.0);',
      'float wS = wNoise(vec3(wp.x*0.9, wp.y*0.08, wp.z*0.9)) * smoothstep(0.35, 0.8, wNoise(vec3(wp.x*3.1, wp.y*0.22, wp.z*3.1)));',
      'float wShade = 1.0 + ' + f(o.blotch) + '*(wB - 0.5)*2.0 + ' + f(o.grain) + '*(wG - 0.5);',
      'wShade *= 1.0 - ' + f(o.streak) + '*smoothstep(0.18, 0.55, wS);',
      'wShade *= mix(1.0 - ' + f(o.grime) + ', 1.0, smoothstep(0.15, 1.6, vWPos.y));',
      'diffuseColor.rgb *= wShade;'
    ].join('\n'))
    .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor + ' + f(o.rough) + '*(wB - 0.5)*2.0, 0.04, 1.0);')
    .replace('#include <normal_fragment_maps>', [
      '#include <normal_fragment_maps>',
      '{ float wh = wNoise(vWPos*' + f(o.scale) + '*14.0)*0.6 + wNoise(vWPos*' + f(o.scale) + '*37.0)*0.4;',
      '  vec2 dh = vec2(dFdx(wh), dFdy(wh)); vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition);',
      '  vec3 r1 = cross(sy, normal), r2 = cross(normal, sx); float det = dot(sx, r1);',
      '  vec3 grad = sign(det)*(dh.x*r1 + dh.y*r2);',
      '  normal = normalize(abs(det)*normal - ' + f(o.bump) + '*grad*' + f(1/(o.scale||1)) + '); }'
    ].join('\n'));
  };
  m.customProgramCacheKey = function(){ return key; };
  m.needsUpdate = true;
}
/* a soft sky for every surface to pick up light from, not only the gilded and glazed ones */
function skyEnv(renderer){
  var es = new THREE.Scene(), g = new THREE.SphereGeometry(50, 32, 16), col = [], p = g.attributes.position, c = new THREE.Color();
  var top = new THREE.Color('#8fb8e3'), hor = new THREE.Color('#f4e6c8'), low = new THREE.Color('#5b4a33');
  for (var i = 0; i < p.count; i++){ var y = p.getY(i)/50; if (y > 0) c.copy(hor).lerp(top, Math.pow(y, .6)); else c.copy(hor).lerp(low, Math.min(1, -y*3)); col.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  es.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({vertexColors: true, side: THREE.BackSide})));
  var sunDisc = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 8), new THREE.MeshBasicMaterial({color: new THREE.Color(6, 5.4, 4.2)}));
  sunDisc.position.set(-28, 30, 20); es.add(sunDisc);
  var pm = new THREE.PMREMGenerator(renderer), t = pm.fromScene(es, .03).texture; pm.dispose();
  return t;
}

scene.environment = skyEnv(renderer);
weather(M.wall,  {blotch: .12, grain: .05, streak: .2, grime: .28, bump: .014});
weather(M.trim,  {blotch: .05, grain: .04, streak: .16, grime: .22, bump: .01});
weather(M.field, {blotch: .05, grain: .04, streak: .12, grime: .1, bump: .01});
weather(revealMat, {blotch: .04, streak: .08, grime: .1}); weather(revealWall, {blotch: .1, streak: .12, grime: .1});
weather(M.roof,  {blotch: .16, grain: .06, streak: 0, grime: 0, bump: .004, rough: .12, scale: .7});
weather(M.dome,  {blotch: .14, grain: .05, streak: .12, grime: 0, bump: .003, rough: .1});
weather(M.domeF, {blotch: .14, grain: .05, streak: .12, grime: 0, bump: .003, rough: .1});
weather(M.door,  {blotch: .1, streak: 0, grime: .15}); weather(M.orn, {blotch: .12, streak: 0, grime: 0});
weather(M.sash,  {blotch: .04, streak: 0, grime: 0}); weather(M.frameG, {blotch: .08, streak: .1, grime: 0});
weather(M.pipe,  {blotch: .1, streak: 0, grime: .1, bump: .003});

/* ═══════════ PERFORMANCE · bake the ~800 static parts into a handful of meshes (one per material and pass),
   so a phone draws a few dozen batches a frame instead of well over a thousand ═══════════ */
(function mergeStatic(root){
  root.updateMatrixWorld(true);
  var groups = {}, order = [], gone = [];
  root.traverse(function(o){
    if (!o.isMesh || Array.isArray(o.material)) return;
    var key = o.material.uuid + '|' + o.renderOrder + '|' + o.castShadow + '|' + o.receiveShadow + '|' + o.frustumCulled;
    if (!groups[key]){ groups[key] = {o: o, list: []}; order.push(key); }
    groups[key].list.push(o);
  });
  function cat(arrs, n){ var len = 0; arrs.forEach(function(a){ len += a.length; }); var out = new Float32Array(len), at = 0; arrs.forEach(function(a){ out.set(a, at); at += a.length; }); return out; }
  order.forEach(function(key){
    var G = groups[key]; if (G.list.length < 2) return;
    var P = [], N = [], U = [];
    G.list.forEach(function(o){
      var g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      g.applyMatrix4(o.matrixWorld);
      if (!g.attributes.normal) g.computeVertexNormals();
      var n = g.attributes.position.count;
      P.push(g.attributes.position.array); N.push(g.attributes.normal.array);
      U.push(g.attributes.uv ? g.attributes.uv.array : new Float32Array(n*2));
      g.dispose(); gone.push(o);
    });
    var mg = new THREE.BufferGeometry();
    mg.setAttribute('position', new THREE.BufferAttribute(cat(P), 3));
    mg.setAttribute('normal', new THREE.BufferAttribute(cat(N), 3));
    mg.setAttribute('uv', new THREE.BufferAttribute(cat(U), 2));
    var m = new THREE.Mesh(mg, G.o.material);
    m.renderOrder = G.o.renderOrder; m.castShadow = G.o.castShadow; m.receiveShadow = G.o.receiveShadow; m.frustumCulled = G.o.frustumCulled;
    root.add(m);
  });
  var geos = [];
  gone.forEach(function(o){ if (geos.indexOf(o.geometry) < 0) geos.push(o.geometry); o.parent.remove(o); });
  geos.forEach(function(g){ g.dispose(); });
  /* drop the now-empty face groups */
  root.children.slice().forEach(function(c){ if (!c.isMesh && c.children.length === 0) root.remove(c); });
})(church);

/* ═══════════ PROPORTIONS · checked against photographs taken from the square: the second tier is about 15 %
   and the towers with the gable about 8 % taller than the measured drawing gives; the lower tier and the domes stay
   as they are. Applied as a vertical stretch by zones, baked into the geometry (normals corrected). ═══════════ */
var Z1 = 10.4, Z2 = 18.0, Z3 = 26.3, K2 = 1.15, K3 = 1.08;
function lift(y){ if (y <= Z1) return y; if (y <= Z2) return Z1 + (y - Z1)*K2; var y2 = Z1 + (Z2 - Z1)*K2; if (y <= Z3) return y2 + (y - Z2)*K3; return y2 + (Z3 - Z2)*K3 + (y - Z3); }
function liftK(y){ return y <= Z1 ? 1 : y <= Z2 ? K2 : y <= Z3 ? K3 : 1; }
(function(root){
  root.updateMatrixWorld(true);
  var meshes = []; root.traverse(function(o){ if (o.isMesh) meshes.push(o); });
  meshes.forEach(function(o){
    var g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
    var p = g.attributes.position, n = g.attributes.normal, v = new THREE.Vector3();
    for (var i = 0; i < p.count; i++){
      var y = p.getY(i), k = liftK(y);
      if (n){ v.set(n.getX(i), n.getY(i)/k, n.getZ(i)).normalize(); n.setXYZ(i, v.x, v.y, v.z); }
      p.setY(i, lift(y));
    }
    g.computeBoundingSphere(); g.computeBoundingBox();
    o.geometry = g;
    if (o.parent !== root){ o.parent.remove(o); root.add(o); }
    o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.updateMatrix();
  });
  root.children.slice().forEach(function(c){ if (!c.isMesh && c.children.length === 0) root.remove(c); });
})(church);

/* ═══════════ GROUND · a turntable engraved with the church's name ═══════════ */
var GC = -15;                                         // centre of the church on the long axis
(function(){
  var R = 34, W = 2048;
  var tex = canvasTex(W, W, function(k){
    var c = W/2, px = c/R;
    var g = k.createRadialGradient(c, c, 0, c, c, c);
    g.addColorStop(0, 'rgba(70,57,39,.96)'); g.addColorStop(.6, 'rgba(56,45,31,.86)'); g.addColorStop(.84, 'rgba(42,34,23,.42)'); g.addColorStop(1, 'rgba(30,24,16,0)');
    k.fillStyle = g; k.fillRect(0, 0, W, W);
    if (!o.turntable) return;
    var gold = 'rgba(222,190,112,', ring = function(r, lw, a){ k.strokeStyle = gold + a + ')'; k.lineWidth = lw; k.beginPath(); k.arc(c, c, r*px, 0, Math.PI*2); k.stroke(); };
    ring(22.4, 4, .55); ring(22.9, 1.6, .45); ring(28.0, 1.6, .38); ring(28.45, 4, .5);
    for (var i = 0; i < 360; i += 2){
      var a = i*Math.PI/180, r1 = i % 30 === 0 ? 24.4 : i % 10 === 0 ? 23.8 : 23.4;
      k.strokeStyle = gold + (i % 30 === 0 ? .6 : .38) + ')'; k.lineWidth = i % 30 === 0 ? 3 : 1.6;
      k.beginPath(); k.moveTo(c + Math.sin(a)*22.9*px, c - Math.cos(a)*22.9*px); k.lineTo(c + Math.sin(a)*r1*px, c - Math.cos(a)*r1*px); k.stroke();
    }
    /* inscriptions: the upper arc reads outward, the lower one reads from the front */
    var rt = 25.8*px, fs = Math.round(1.5*px);
    k.fillStyle = gold + '.72)'; k.textAlign = 'center'; k.textBaseline = 'middle';
    k.font = '500 ' + fs + 'px "Cormorant Garamond", Georgia, serif';
    function arc(text, centre, lower, track){
      var ws = Array.from(text).map(function(ch){ return k.measureText(ch).width + track; }), total = ws.reduce(function(s, w){ return s + w; }, 0);
      var t = centre + (lower ? 1 : -1)*total/2/rt;
      Array.from(text).forEach(function(ch, j){
        var d = ws[j]/2/rt; t += lower ? -d : d;
        k.save(); k.translate(c + Math.sin(t)*rt, c - Math.cos(t)*rt); k.rotate(lower ? t - Math.PI : t); k.fillText(ch, 0, 0); k.restore();
        t += lower ? -d : d;
      });
    }
    arc('КОСТЕЛ  ІОАННА  ХРЕСТИТЕЛЯ', 0, false, fs*.22);
    arc('ДУБРОВИЦЯ  ·  1740', Math.PI, true, fs*.22);
    [Math.PI/2, -Math.PI/2].forEach(function(t){ k.save(); k.translate(c + Math.sin(t)*rt, c - Math.cos(t)*rt); k.rotate(t + Math.PI/4); k.fillRect(-fs*.13, -fs*.13, fs*.26, fs*.26); k.restore(); });
  });
  var gm = new THREE.MeshStandardMaterial({map:tex, roughness:1, transparent:true, depthWrite:false});
  var g = add(new THREE.CircleGeometry(R, 128), gm, 0, 0, GC, scene); g.rotation.x = -Math.PI/2; g.castShadow = false; g.renderOrder = -1;
})();

/* ── dust in the lamplight ── */
var motes = null, MN = 160;
if (o.motes){
  var mp = new Float32Array(MN*3), mv = [];
  for (var mi = 0; mi < MN; mi++){ mp[mi*3] = (Math.random() - .5)*64; mp[mi*3 + 1] = Math.random()*42; mp[mi*3 + 2] = GC + (Math.random() - .5)*64; mv.push(.25 + Math.random()*.6, Math.random()*6.28); }
  var mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
  var dot = canvasTex(64, 64, function(k){ var r = k.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.35, 'rgba(255,255,255,.45)'); r.addColorStop(1, 'rgba(255,255,255,0)'); k.fillStyle = r; k.fillRect(0, 0, 64, 64); });
  motes = new THREE.Points(mg, new THREE.PointsMaterial({map:dot, color:'#ffd99a', size:.42, sizeAttenuation:true, transparent:true, opacity:.55, depthWrite:false, blending:THREE.AdditiveBlending}));
  scene.add(motes);
}

/* ── light ── */
/* ── light ── */
scene.add(new THREE.HemisphereLight('#fff4de', '#3a2c1c', .42));
var sun = new THREE.DirectionalLight('#ffeccd', 1.55);
sun.position.set(-40, 50, 34); sun.target.position.set(0, 10, -15);
sun.castShadow = true; sun.shadow.mapSize.set(o.shadow, o.shadow);
var sc = sun.shadow.camera; sc.left = -42; sc.right = 42; sc.top = 42; sc.bottom = -42; sc.near = 20; sc.far = 160;
sun.shadow.bias = -.0003; sun.shadow.normalBias = .035;
scene.add(sun); scene.add(sun.target);
var fill = new THREE.DirectionalLight('#d3dcff', .5); fill.position.set(42, 18, -20); scene.add(fill);

/* ── camera + controls ── */
var controls = new THREE.OrbitControls(camera, canvas);
controls.target.set(0, o.targetY || 17.3, -14);
var viewDir = new THREE.Vector3(o.view[0], o.view[1], o.view[2]).normalize(), touched = false;
controls.enableDamping = true; controls.dampingFactor = .07;
controls.minDistance = 22; controls.maxDistance = 180;
controls.maxPolarAngle = Math.PI/2 - .05;
controls.enablePan = false;
controls.enableZoom = !!o.zoom;
controls.rotateSpeed = .7;
canvas.style.touchAction = o.touch;
var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
controls.autoRotate = !!o.autoRotate && !reduced; controls.autoRotateSpeed = o.autoRotateSpeed;
controls.addEventListener('start', function(){ controls.autoRotate = false; touched = true; tween = null; if (o.onStart) o.onStart(); });

function home(){
  var t = Math.tan(camera.fov*Math.PI/360), dist = Math.max(27/t, 25/(t*camera.aspect))*o.fit;
  return controls.target.clone().addScaledVector(viewDir, dist);
}
function resize(){
  var w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w/h;
  camera.fov = w/h < 1 ? 45 : 34;
  camera.updateProjectionMatrix();
  if (!touched) camera.position.copy(home());
}
/* smooth camera moves for the buttons */
var tween = null;
function moveTo(p, ms){ tween = {a: camera.position.clone(), b: p, t0: performance.now(), ms: ms || 650}; wake(); }
function stepTween(now){
  if (!tween) return;
  var k = Math.min(1, (now - tween.t0)/tween.ms), e = 1 - Math.pow(1 - k, 3);
  /* interpolate on the sphere round the target, so the camera never cuts through the church */
  var A = tween.a.clone().sub(controls.target), B = tween.b.clone().sub(controls.target);
  var sa = new THREE.Spherical().setFromVector3(A), sb = new THREE.Spherical().setFromVector3(B);
  var dt = sb.theta - sa.theta; if (dt > Math.PI) dt -= 2*Math.PI; if (dt < -Math.PI) dt += 2*Math.PI;
  var s = new THREE.Spherical(sa.radius + (sb.radius - sa.radius)*e, sa.phi + (sb.phi - sa.phi)*e, sa.theta + dt*e);
  camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(s));
  if (k >= 1) tween = null;
}
function zoomBy(f){
  var off = camera.position.clone().sub(controls.target);
  off.setLength(THREE.MathUtils.clamp(off.length()*f, controls.minDistance, controls.maxDistance));
  touched = true; controls.autoRotate = false;
  moveTo(controls.target.clone().add(off), 380);
}

/* ── render only while the viewer is on screen ── */
var onScreen = true, running = false, first = true, last = 0;
function tick(now){
  if (!running) return;
  requestAnimationFrame(tick);
  var dt = Math.min(.05, (now - (last || now))/1000); last = now;
  stepTween(now);
  controls.update();
  if (motes){
    var p = motes.geometry.attributes.position, a = p.array;
    for (var i = 0; i < MN; i++){
      a[i*3 + 1] += mv[i*2]*dt; a[i*3] += Math.sin(now/1600 + mv[i*2 + 1])*.006;
      if (a[i*3 + 1] > 42) a[i*3 + 1] = 0;
    }
    p.needsUpdate = true;
  }
  renderer.render(scene, camera);
  if (first){ first = false; requestAnimationFrame(function(){ if (o.onReady) o.onReady(api); }); }
}
function wake(){ if (!running && onScreen && !document.hidden){ running = true; last = 0; requestAnimationFrame(tick); } }
function sync(){ if (onScreen && !document.hidden) wake(); else running = false; }
if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ onScreen = es[es.length - 1].isIntersecting; sync(); }).observe(canvas);
document.addEventListener('visibilitychange', sync);
if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas); else window.addEventListener('resize', resize);
resize(); sync();

var api = {
  renderer: renderer, camera: camera, controls: controls, scene: scene,
  zoomIn: function(){ zoomBy(1/1.35); }, zoomOut: function(){ zoomBy(1.35); },
  reset: function(){ touched = false; moveTo(home()); },
  autoRotate: function(on){ if (on === undefined) return controls.autoRotate; controls.autoRotate = !!on; return controls.autoRotate; },
  snapshot: function(){ renderer.render(scene, camera); return canvas.toDataURL('image/png'); }
};
return api;
}
})();
