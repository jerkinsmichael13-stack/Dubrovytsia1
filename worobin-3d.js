/* Павільйон «Бібліотека» у Воробині під Дубровицею — 3D-реконструкція за фотографіями (до 1917 р., 1937 р.) та описом.
   Використання:  Worobin3D.mount(canvas, {autoRotate, zoom, touch, view, ...}).then(function(api){ ... })
   Бібліотека three.js r147 підвантажується з three-r147.js лише тоді, коли модель справді показують.
   Осі моделі: +x — схід (до Горині), −x — захід (портик), +z — південь (колонада), −z — північ (вежа). */
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
  return Promise.race([document.fonts.load('500 64px "Cormorant Garamond"').catch(function(){}), new Promise(function(r){ setTimeout(r, 1500); })]);
}
function mount(canvas, o){
  o = Object.assign({autoRotate:true, autoRotateSpeed:.45, zoom:true, touch:'none', view:[-46, 13, 40], fit:1, pixelRatio:2, shadow:2048,
                     turntable:true, onReady:null, onFail:null, onStart:null}, o || {});
  if (!supported()){ if (o.onFail) o.onFail('webgl'); return Promise.resolve(null); }
  return Promise.all([load(), fonts()]).then(function(){ return build(canvas, o); }, function(){ if (o.onFail) o.onFail('load'); return null; });
}
window.Worobin3D = {mount: mount, load: load, supported: supported};

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
var camera = new THREE.PerspectiveCamera(34, 1, 0.5, 600);

/* ── materials: lime-plastered brick, stone podium and steps, sheet-metal roofs ── */
function canvasTex(w, h, draw){ var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; }
function mat(c, o){ return new THREE.MeshStandardMaterial(Object.assign({color:c, roughness:.9, metalness:0}, o||{})); }
var M = {
  wall:  mat('#e3dac6'),
  trim:  mat('#f3eee2'),
  col:   mat('#f1ece0', {roughness:.85}),
  stone: mat('#a59d8b', {roughness:.95}),
  step:  mat('#b8b09f', {roughness:.92}),
  roof:  mat('#6b7271', {roughness:.68, metalness:.2}),
  glass: mat('#283038', {roughness:.18, metalness:.1}),
  blind: mat('#e3dac6'),
  door:  mat('#4a3423', {roughness:.75}),
  doorP: mat('#5a4029', {roughness:.7}),
  louv:  mat('#2e2a25', {roughness:.8}),
  pot:   mat('#b7a58a', {roughness:.9}),
  leaf:  mat('#4f6236', {roughness:.95, flatShading:true}),
  leaf2: mat('#62743f', {roughness:.95, flatShading:true}),
  sash:  mat('#f7f5f0', {roughness:.6}),
  pipe:  mat('#5d625f', {roughness:.45, metalness:.4}),
  roofF: mat('#6c7271', {roughness:.6, metalness:.3}),
  roofT: mat('#ffffff', {roughness:.5, metalness:.35}),
  plinth:mat('#d3cab6'),
  brick: mat('#8d5f4a', {roughness:.95})
};
/* ── weathering: lime plaster is never one flat colour. World-space noise gives broad mottling, a fine grain and faint rain
   streaks, and the lowest metre picks up grime from the ground; the stone gets more grain, the chimneys real brick courses ── */
var NOISE = [
  'float h3(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x + p.y + p.z)); }',
  'float vn(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0 - 2.0*f);',
  '  return mix(mix(mix(h3(i), h3(i + vec3(1.0,0.0,0.0)), f.x), mix(h3(i + vec3(0.0,1.0,0.0)), h3(i + vec3(1.0,1.0,0.0)), f.x), f.y),',
  '             mix(mix(h3(i + vec3(0.0,0.0,1.0)), h3(i + vec3(1.0,0.0,1.0)), f.x), mix(h3(i + vec3(0.0,1.0,1.0)), h3(i + vec3(1.0,1.0,1.0)), f.x), f.y), f.z); }',
  'float fbm(vec3 p){ return .5*vn(p) + .25*vn(p*2.03 + 7.1) + .125*vn(p*4.07 + 3.3) + .0625*vn(p*8.13 + 1.7); }',
  'float groundY(float x){ return -1.75*smoothstep(-5.0, 9.0, x) - 2.2*smoothstep(9.5, 22.0, x); }'
].join('\n');
function shaderHook(m, key, frag, deriv){
  m.onBeforeCompile = function(sh){
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\n' + NOISE)
      .replace('#include <map_fragment>', '#include <map_fragment>\n' + frag);
  };
  if (deriv) m.extensions = {derivatives: true};
  m.customProgramCacheKey = function(){ return 'w-' + key; };
  m.needsUpdate = true;
}
function weather(m, key, o){
  var f = function(v){ return (+v).toFixed(3); };
  shaderHook(m, key, [
    'float wm = fbm(vWPos*0.32), wg = vn(vWPos*7.0), ws = vn(vec3(vWPos.x*1.8, vWPos.y*0.22, vWPos.z*1.8));',
    'float wb = ' + (o.base === 'ground' ? 'groundY(vWPos.x)' : f(o.base)) + ';',
    'float wgr = 1.0 - smoothstep(wb, wb + ' + f(o.gfade) + ', vWPos.y);',
    'diffuseColor.rgb *= 1.0 - ' + f(o.mottle) + '*(wm - 0.5)*2.0 - ' + f(o.grain) + '*wg - ' + f(o.streak) + '*smoothstep(0.45, 0.9, ws);',
    'diffuseColor.rgb *= 1.0 - ' + f(o.grime) + '*wgr;'
  ].join('\n'));
}
var WALLW = {mottle: .05, grain: .035, streak: .05, grime: .16, gfade: 1.1, base: 1.5};
weather(M.wall, 'wall', WALLW); weather(M.blind, 'blind', WALLW);
weather(M.trim, 'trim', {mottle: .035, grain: .03, streak: .035, grime: .1, gfade: .8, base: 1.5});
weather(M.col, 'col', {mottle: .04, grain: .03, streak: .045, grime: .14, gfade: 1.0, base: 1.5});
weather(M.plinth, 'plinth', {mottle: .07, grain: .05, streak: .03, grime: .22, gfade: 1.0, base: 'ground'});
weather(M.step, 'step', {mottle: .1, grain: .09, streak: 0, grime: .12, gfade: .5, base: 'ground'});
M.brick.color.set('#ffffff');
shaderHook(M.brick, 'brick', [
  'vec3 bn = normalize(cross(dFdx(vWPos), dFdy(vWPos)));',
  'float along = abs(bn.x) > abs(bn.z) ? vWPos.z : vWPos.x, row = floor(vWPos.y/0.077), u = along/0.26 + 0.5*mod(row, 2.0);',
  'float mortar = max(step(0.84, fract(vWPos.y/0.077)), step(0.92, fract(u)));',
  'vec3 bc = vec3(0.50, 0.27, 0.19)*(0.8 + 0.4*h3(vec3(floor(u), row, 3.0)))*(0.85 + 0.25*fbm(vWPos*1.5));',
  'diffuseColor.rgb = mix(bc, vec3(0.55, 0.52, 0.47), mortar);'
].join('\n'), true);
var house = new THREE.Group(); scene.add(house);
function add(geo, m, x, y, z, parent){ var ob = new THREE.Mesh(geo, m); ob.position.set(x||0, y||0, z||0); ob.castShadow = ob.receiveShadow = true; (parent||house).add(ob); return ob; }
function box(w, h, d, x, y, z, m, parent){ return add(new THREE.BoxGeometry(w, h, d), m, x, y + h/2, z, parent); }
function boxX(x0, x1, y0, y1, z0, z1, m, parent){ return box(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), (x0 + x1)/2, Math.min(y0, y1), (z0 + z1)/2, m, parent); }
/* face-local group: x across the face (to the right, seen from outside), y up, +z out of the wall */
function face(x, z, rotY){ var g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY||0; house.add(g); return g; }
var SOUTH = 0, EAST = Math.PI/2, WEST = -Math.PI/2, NORTH = Math.PI;
function ext(shape, depth, seg){ return new THREE.ExtrudeGeometry(shape, {depth:depth, bevelEnabled:false, curveSegments:seg||20}); }
function V(x, y){ return new THREE.Vector2(x, y); }
function archS(w, yb, yc, path){ var r = w/2, s = path ? new THREE.Path() : new THREE.Shape(); s.moveTo(-r, yb); s.lineTo(r, yb); s.lineTo(r, yc); s.absarc(0, yc, r, 0, Math.PI, false); s.lineTo(-r, yb); return s; }
function rectS(w, yb, yt, path){ var s = path ? new THREE.Path() : new THREE.Shape(); s.moveTo(-w/2, yb); s.lineTo(w/2, yb); s.lineTo(w/2, yt); s.lineTo(-w/2, yt); s.lineTo(-w/2, yb); return s; }
function circS(r, cy, path){ var s = path ? new THREE.Path() : new THREE.Shape(); s.absarc(0, cy, r, 0, Math.PI*2, false); return s; }
function ringS(r0, r1, cy){ var s = circS(r1, cy); s.holes.push(new THREE.Path().absarc(0, cy, r0, 0, Math.PI*2, true)); return s; }
/* closed convex solid from polygon faces (auto-oriented outwards) */
function solid(faces, m, centre, parent){
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
  return add(g, m, 0, 0, 0, parent);
}
/* hipped (pyramid) roof over a rectangle, eaves at y0; with r = 0 the top is a point */
function hipRoof(x0, x1, z0, z1, y0, y1, m){
  var cx = (x0 + x1)/2, cz = (z0 + z1)/2, hx = (x1 - x0)/2, hz = (z1 - z0)/2, r = Math.max(0, hx - hz);
  var A = [x0, y0, z0], B = [x1, y0, z0], C = [x1, y0, z1], D = [x0, y0, z1], P = [cx - r, y1, cz], Q = [cx + r, y1, cz];
  var faces = r > 0 ? [[A, B, Q, P], [C, D, P, Q], [B, C, Q], [D, A, P], [A, B, C, D]] : [[A, B, P], [B, C, P], [C, D, P], [D, A, P], [A, B, C, D]];
  return solid(faces, m, new THREE.Vector3(cx, (y0 + y1)/2, cz));
}
/* a thin rod between two points (hip caps, ridges) */
function rod(a, b, r, m){
  var A = new THREE.Vector3(a[0], a[1], a[2]), B = new THREE.Vector3(b[0], b[1], b[2]), d = B.clone().sub(A);
  var ob = add(new THREE.CylinderGeometry(r, r, d.length(), 8), m, (A.x + B.x)/2, (A.y + B.y)/2, (A.z + B.z)/2);
  ob.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return ob;
}

/* openings: the wall is a solid block, so an opening is "cut" at draw time — a mask resets the depth buffer inside it,
   then the reveals and the glass behind the wall surface are drawn into it */
var holeStencil = new THREE.MeshBasicMaterial({colorWrite: false, depthWrite: false, stencilWrite: true, stencilRef: 1,
  stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp});
var holeDepth = new THREE.ShaderMaterial({
  vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w * 0.999999; }',
  fragmentShader: 'void main(){ gl_FragColor = vec4(0.0); }',
  colorWrite: false, depthWrite: true, depthFunc: THREE.AlwaysDepth,
  stencilWrite: true, stencilRef: 1, stencilFunc: THREE.EqualStencilFunc, stencilZPass: THREE.KeepStencilOp
});
var revealMat = mat('#efe9dc', {side: THREE.BackSide});
function sunk(ob, order){ ob.renderOrder = order; ob.castShadow = false; ob.receiveShadow = false; return ob; }
function cut(g, x, shapeFn, depth, back, reveal){
  var hg = new THREE.ShapeGeometry(shapeFn(), 32);
  [holeStencil, holeDepth].forEach(function(hm, i){ var m = new THREE.Mesh(hg, hm); m.position.set(x, 0, .02); m.renderOrder = 1 + i; m.frustumCulled = false; g.add(m); });
  sunk(add(ext(shapeFn(), depth, 32), reveal || revealMat, x, 0, -depth, g), 3);
  sunk(add(new THREE.ShapeGeometry(shapeFn(), 32), back, x, 0, -depth + .02, g), 3);
}
/* window: flat surround, sill, a sash with glazing bars (rows) — the classic six- or nine-pane casement */
function win(g, x, y, w, h, o2){
  o2 = o2 || {}; var fw = o2.fw || .2, depth = o2.depth || .32, arched = !!o2.arched, yc = y + h - w/2;
  function opening(path){ return arched ? archS(w, y, yc, path) : rectS(w, y, y + h, path); }
  if (o2.frame){
    var sur = arched ? archS(w + 2*fw, y - fw*.5, yc) : rectS(w + 2*fw, y - fw*.5, y + h + fw);
    sur.holes.push(opening(true)); add(ext(sur, .05), M.trim, x, 0, 0, g);
  }
  if (o2.sill !== false) box(w + 2*fw + .16, .09, .22, x, y - fw*.5 - .09, .11, M.trim, g);
  if (o2.cornice) box(w + 2*fw + .3, .14, .2, x, y + h + fw, .1, M.trim, g);       // little cornice over the head
  cut(g, x, function(){ return opening(); }, depth, o2.glass || M.glass);
  if (!o2.bars) return;
  var zb = -depth + .03, f = .07, b = .045, top = arched ? yc : y + h;
  var frame = opening(); frame.holes.push(arched ? archS(w - 2*f, y + f, yc, true) : rectS(w - 2*f, y + f, y + h - f, true));
  sunk(add(ext(frame, .05, 24), M.sash, x, 0, zb, g), 3);
  sunk(box(b, (arched ? yc + w/2 : top) - y - 2*f, .05, x, y + f, zb, M.sash, g), 3);
  for (var i = 1; i < o2.bars; i++) sunk(box(w - 2*f, b, .05, x, y + (top - y)*i/o2.bars - b/2, zb, M.sash, g), 3);
  if (arched) sunk(box(w - 2*f, b, .05, x, yc - b/2, zb, M.sash, g), 3);
}
/* blind panel ("płycina") imitating a window: surround as a window, a shallow plastered recess behind */
function blind(g, x, y, w, h){ win(g, x, y, w, h, {glass: M.blind, depth: .08, sill: false}); }
/* stacked cornice: layers [height, projection] round a block; sides say which faces get it */
function cornice(x0, x1, z0, z1, y, layers, sides){
  sides = sides || {n:1, s:1, w:1, e:1};
  layers.forEach(function(L){ var h = L[0], p = L[1];
    boxX(x0 - (sides.w ? p : 0), x1 + (sides.e ? p : 0), y, y + h, z0 - (sides.n ? p : 0), z1 + (sides.s ? p : 0), M.trim); y += h; });
  return y;
}

/* ═══════════ MEASURES (m) · taken off the photographs. Scale: the window axes are 3.2 m apart (the south colonnade
   has a column between every two windows). The south front of 1937 gives the storeys and the entablature, the west
   front of 1937 and the pre-1914 view give the portico and the pediment (about 27°), the view across the pond (before
   1917) gives the east front, its basement and the tower roof. ═══════════ */
var HS = 8.5;                      // half side of the square block, 5 window axes a side
var P = 1.5;                       // floor of the main storey = top of the podium (nine steps on the west)
var C0 = P + 7.0;                  // top of the columns: 7 m, about 7½ diameters (the same on both fronts)
var E1 = C0 + .55, E2 = E1 + .75, E3 = E2 + .5;      // architrave, frieze, cornice: the walls end at E3, where the roof starts
var AX = [-6.4, -3.2, 0, 3.2, 6.4];                 // window axes on every face
var CR = .47;                                         // column radius at the foot
var CORN = [[.14, .08], [.16, .24], [.2, .5]];       // the crowning cornice
var WW = 1.25, W1 = {y: P + .9, h: 1.95}, W2 = {y: P + 4.65, h: 1.95}, PNL = {y: P + 3.3, h: .55, w: 1.55};
/* the ground: level on the west, where the steps and the outbuildings are; falling to the east, to the meadows of the Horyn,
   so that on the river front the podium becomes a basement storey with its own small windows */
function ground(x){ return -1.75*THREE.MathUtils.smoothstep(x, -5, 9) - 2.2*THREE.MathUtils.smoothstep(x, 9.5, 22); }
/* a podium whose foot follows the sloping ground, so nothing hangs below the terrain */
function podium(x0, x1, z0, z1, top, m){
  var sh = new THREE.Shape(), n = Math.max(2, Math.ceil((x1 - x0)/.4));
  sh.moveTo(x0, ground(x0) - .08);
  for (var i = 1; i <= n; i++){ var x = x0 + (x1 - x0)*i/n; sh.lineTo(x, ground(x) - .08); }
  sh.lineTo(x1, top); sh.lineTo(x0, top); sh.lineTo(x0, ground(x0) - .08);
  return add(ext(sh, z1 - z0, 1), m, 0, 0, z0);
}

/* ═══════════ PODIUM, TERRACES, STEPS ═══════════ */
podium(-HS - .3, HS + .3, -HS - .3, HS + .3, P, M.plinth);
boxX(-HS - .38, HS + .38, P - .16, P + .1, -HS - .38, HS + .38, M.step);          // the stone course at floor level
var PX0 = -12.45, PZ = 5.75;                                                       // portico platform (west)
podium(PX0, -HS, -PZ, PZ, P, M.plinth); boxX(PX0 - .06, -HS, P - .16, P + .1, -PZ - .06, PZ + .06, M.step);
var CCZ = HS + 3.2, CF = CCZ + .55, CX = 8.65;                                     // south colonnade: column line, front face, ends
podium(-CX - .3, CX + .3, HS, CF + .3, P, M.plinth); boxX(-CX - .36, CX + .36, P - .16, P + .1, HS, CF + .36, M.step);
var TR = .34;
for (var k = 1; k <= 8; k++) boxX(PX0 - (9 - k)*TR, PX0, 0, P*k/9, -PZ, PZ, M.step);               // nine steps across the whole portico
/* square stone slabs either side of the steps, for flowers in pots */
function potOn(x, y, z){
  var prof = [V(0, 0), V(.26, 0), V(.3, .06), V(.22, .12), V(.2, .2), V(.34, .52), V(.4, .58), V(.4, .64), V(0, .64)];
  add(new THREE.LatheGeometry(prof, 20), M.pot, x, y, z);
  var f = add(new THREE.IcosahedronGeometry(.48, 1), M.leaf, x, y + .9, z); f.scale.set(1, .8, 1);
  add(new THREE.IcosahedronGeometry(.3, 1), M.leaf2, x + .14, y + 1.18, z - .08);
}
[-1, 1].forEach(function(s){
  var x = PX0 - 9*TR + .55, z = s*(PZ + .65);
  boxX(x - .6, x + .6, -.3, .78, z - .6, z + .6, M.step); boxX(x - .66, x + .66, .78, .9, z - .66, z + .66, M.step);
  potOn(x, .9, z);
  potOn(PX0 + .55, P + .1, s*(PZ - .55));
});

/* ═══════════ THE BLOCK ═══════════ */
boxX(-HS, HS - .24, P, E2, -HS, HS, M.wall);
cornice(-HS, HS, -HS, HS, E2, CORN);
/* rusticated corners (bonie): channelled courses 0.58 m high on a strip 1.4 m wide, wrapping round each corner */
function rustic(g, side, w, edge, top){
  for (var y = P + .1; y < top - .2; y += .58){ var h = Math.min(.5, top - y); box(w, h, .07, side*(edge - w/2 + .07), y, .035, M.trim, g); }
}
var SF = face(0, HS, SOUTH), WF = face(-HS, 0, WEST), NF = face(0, -HS, NORTH);
[SF, WF, NF].forEach(function(g){ rustic(g, -1, 1.4, HS, E2); rustic(g, 1, 1.4, HS, E2); });

/* the east front to the river: five round-headed recesses through both storeys. Four hold a rectangular window below
   and a second, as tall, high under the arch (a library: shelves under the windows); the fourth from the south is blind.
   All measured on the view across the pond: arches 0.3 m under the eaves, windows 1.4 m wide */
var EF = face(HS, 0, EAST);
(function(){
  var s = rectS(2*HS, P, E2), w = 1.8, yb = P + .15, yc = E2 - .25 - .9;
  AX.forEach(function(x){ var hp = new THREE.Path(); hp.moveTo(x - w/2, yb); hp.lineTo(x - w/2, yc); hp.absarc(x, yc, w/2, Math.PI, 0, true); hp.lineTo(x + w/2, yb); hp.lineTo(x - w/2, yb); s.holes.push(hp); });
  add(ext(s, .24, 32), M.trim, 0, 0, -.24, EF);                                    // piers and arches a shade lighter than the recesses
  var back = face(HS - .24, 0, EAST);
  AX.forEach(function(x){
    box(w + .1, .12, .28, x, yb - .12, .1, M.trim, back);                          // sill course at the foot of each recess
    if (x === 3.2) return;                                                          // local +x is north: the blind recess
    win(back, x, P + 1.1, 1.4, 2.2, {bars: 3});
    win(back, x, yc - 1.95, 1.4, 2.45, {bars: 3});
  });
  rustic(EF, -1, 1.15, HS, E2); rustic(EF, 1, 1.15, HS, E2);
  /* basement windows in the podium, where the ground has fallen away */
  var bf = face(HS + .3, 0, EAST);
  AX.forEach(function(x){ if (x !== 3.2) win(bf, x, -.75, 1.0, 1.2, {bars: 2, depth: .4}); });
})();

/* south front behind the colonnade: windows on both floors, a recessed panel between them */
AX.forEach(function(x){ win(SF, x, W1.y, WW, W1.h, {bars: 3}); blind(SF, x, PNL.y, PNL.w, PNL.h); win(SF, x, W2.y, WW, W2.h, {bars: 3}); });
/* west front: windows in the outer axes; under the portico the door, a window over it, and panels imitating windows */
[-6.4, 6.4].forEach(function(x){ win(WF, x, W1.y, WW, W1.h, {bars: 3}); blind(WF, x, PNL.y, PNL.w, PNL.h); win(WF, x, W2.y, WW, W2.h, {bars: 3}); });
[-3.2, 3.2].forEach(function(x){ blind(WF, x, W1.y, 1.1, 2.0); blind(WF, x, PNL.y, PNL.w, PNL.h); blind(WF, x, P + 5.55, 1.1, .9); });
(function(){                                                                        // the door: two panelled leaves
  var w = 1.2, h = 2.8, y = P + .1;
  win(WF, 0, y, w, h, {glass: M.door, depth: .3, sill: false});
  [-1, 1].forEach(function(s){ [[.25, 1.0], [1.45, 1.1]].forEach(function(p){ sunk(box(.4, p[1], .05, s*.29, y + p[0], -.27, M.doorP, WF), 3); }); });
  sunk(box(.04, h, .06, 0, y, -.26, M.doorP, WF), 3);
  blind(WF, 0, PNL.y, PNL.w, PNL.h);
  win(WF, 0, W2.y, 1.1, W2.h, {bars: 3});
})();
/* north front (no photograph): windows as on the south, either side of the tower */
[-6.4, -3.2, 3.2, 6.4].forEach(function(x){ win(NF, x, W1.y, WW, W1.h, {bars: 3}); blind(NF, x, PNL.y, PNL.w, PNL.h); win(NF, x, W2.y, WW, W2.h, {bars: 3}); });

/* ═══════════ COLUMNS · plain Doric: torus base on a plinth, a slight swelling, necking, echinus, square abacus ═══════════ */
var colGeo = (function(){
  var H = C0 - P - .3, pts = [V(0, 0), V(.61, 0), V(.61, .12), V(.57, .16), V(.56, .24), V(.51, .3), V(.48, .38)], yt = H - .48;
  for (var i = 0; i <= 12; i++){ var t = i/12; pts.push(V(CR - .085*t + .025*Math.sin(Math.PI*t), .38 + t*(yt - .38))); }
  pts.push(V(.42, yt + .02), V(.45, yt + .05), V(.45, yt + .1), V(.41, yt + .12));
  for (i = 1; i <= 6; i++){ var q = i/6; pts.push(V(.41 + .23*Math.sin(q*Math.PI/2), yt + .12 + .3*q)); }
  pts.push(V(.64, H), V(0, H));
  return new THREE.LatheGeometry(pts, 28);
})();
function column(x, z){
  add(colGeo, M.col, x, P + .1, z);
  box(1.34, .2, 1.34, x, C0 - .2, z, M.col);                                         // abacus
}

/* ═══════════ WEST PORTICO · four columns in the great order, entablature and a pediment with a round window ═══════════ */
var PCX = -11.6, PF = PCX - .55, PW = 5.5, RISE = 2.8, RK = RISE/PW;
[-4.8, -1.6, 1.6, 4.8].forEach(function(z){ column(PCX, z); boxX(PCX + .5, -HS, C0, E1, z - .4, z + .4, M.trim); });   // beams back to the wall
boxX(PF, PF + 1.1, C0, E1, -PW, PW, M.trim);                                        // architrave over the columns
boxX(PF, -HS, E1, E2, -PW, PW, M.trim);                                             // frieze, closing the ceiling
boxX(PF - .03, -HS, E1 - .02, E1 + .06, -PW - .03, PW + .03, M.trim);                // fillet between architrave and frieze
cornice(PF, -HS, -PW, PW, E2 + .004, CORN, {n:1, s:1, w:1, e:0});
(function(){
  var g = face(PF, 0, WEST);                                                        // local x = south, +z = west
  var tri = new THREE.Shape([V(-PW, E3), V(PW, E3), V(0, E3 + RISE)]);
  add(ext(tri, 3.6), M.wall, 0, 0, -3.6, g);                                        // tympanum
  var a = Math.atan(RK), ex = PW + .55, L = Math.hypot(ex, ex*RK) + .3;
  [-1, 1].forEach(function(sd){                                                     // raking cornices, two mouldings
    [[.34, .42, 0], [.16, .55, .34]].forEach(function(c){
      var off = c[2] + c[0]/2, mx = sd*ex/2, my = E3 + RISE - ex*RK/2;
      var b = box(L, c[0], 1.0 + c[1], 0, 0, 0, M.trim, g);
      b.rotation.z = -sd*a;
      b.position.set(mx + sd*Math.sin(a)*off, my + Math.cos(a)*off, (c[1] - 1.0)/2);
    });
  });
  /* the round window: a broad moulded ring, a little below the middle of the tympanum */
  var oy = E3 + RISE*.37, r = .44;
  add(ext(ringS(r, r + .2, oy), .1, 40), M.trim, 0, 0, 0, g);
  add(ext(ringS(r + .2, r + .26, oy), .05, 40), M.trim, 0, 0, 0, g);
  cut(g, 0, function(){ return circS(r, oy); }, .35, M.glass);
  sunk(box(.05, 2*r, .05, 0, oy - r, -.32, M.sash, g), 3); sunk(box(2*r, .05, .05, 0, oy - .025, -.32, M.sash, g), 3);
})();
/* the portico roof: a gable behind the pediment, running back into the main roof */
(function(){
  var top = function(z){ return E3 + (PW - Math.abs(z))*RK + .42; }, hw = 6.15;
  var s = new THREE.Shape([V(-hw, top(hw)), V(hw, top(hw)), V(0, top(0))]);
  var m = add(ext(s, -PF - .35), M.roof, 0, 0, 0); m.rotation.y = -Math.PI/2;      // stops just behind the tympanum
  rod([PF + .2, top(0) + .02, 0], [-1.2, top(0) + .02, 0], .07, M.roof);
})();

/* ═══════════ SOUTH COLONNADE · six columns along the whole front, 3.2 m out from the wall. Over the entablature
   an attic hides a flat roof; the ends are open up to the ceiling (west view, 1937) ═══════════ */
[-8, -4.8, -1.6, 1.6, 4.8, 8].forEach(function(x){ column(x, CCZ); });
boxX(-CX, CX, C0, E1, CF - 1.1, CF, M.trim);                                        // architrave
boxX(-CX, CX, E1, E2, CF - 1.0, CF, M.trim);                                        // frieze, on the front only
boxX(-CX - .03, CX + .03, E1 - .02, E1 + .06, CF - 1.0, CF + .03, M.trim);
boxX(-CX + .04, CX - .04, E2 - .12, E2, HS, CF - .98, M.trim);                     // ceiling
cornice(-CX, CX, HS + .02, CF, E2 + .004, CORN, {n:0, s:1, w:1, e:1});
(function(){
  var AT = E3 + .78, z0 = HS + .75;
  boxX(-CX, CX, E3 + .004, AT, z0, CF, M.wall);                                      // the attic: a solid block hiding a flat roof
  boxX(-CX - .07, CX + .07, AT, AT + .1, z0 - .07, CF + .07, M.trim);                // coping
  boxX(-CX + .25, CX - .25, AT + .1, AT + .14, z0 + .18, CF - .25, M.roofF);         // the flat roof's sheet metal
  boxX(-CX - .02, CX + .02, E3 + .22, E3 + .3, CF - .1, CF + .02, M.trim);           // a plain band low on the attic
})();

/* ═══════════ NORTH TOWER · on the axis of the north front, square, two storeys; it rises over the eaves under a tall
   roof that stands about 3 m above the main roof in the view across the pond. The description calls it conical
   ("stożkowy"); the photograph shows a straight lit hip, so it is modelled as a steep four-sided spire ═══════════ */
var TW = 2.3, TZ0 = -HS - 4.6, TZC = (TZ0 - HS)/2, TT = E3 + 1.0;
podium(-TW - .3, TW + .3, TZ0 - .3, -HS, P, M.plinth); boxX(-TW - .38, TW + .38, P - .16, P + .1, TZ0 - .38, -HS, M.step);
boxX(-TW, TW, P, TT, TZ0, -HS, M.wall);
var TC = cornice(-TW, TW, TZ0, -HS + .01, TT, [[.12, .08], [.12, .22], [.16, .4]], {n:1, s:0, w:1, e:1});
(function(){
  var tn = face(0, TZ0, NORTH), te = face(TW, TZC, EAST), tw = face(-TW, TZC, WEST);
  win(tn, 0, W1.y, 1.2, W1.h, {bars: 3});
  [tn, te, tw].forEach(function(g){
    win(g, 0, P + 4.4, 1.15, 2.9, {bars: 4, arched: true});
    add(ext(ringS(.34, .5, E3 + .55), .08, 32), M.trim, 0, 0, 0, g);                 // a round window under the cornice
    cut(g, 0, function(){ return circS(.34, E3 + .55); }, .3, M.glass);
    var hw = g === tn ? TW : 2.3;
    [-1, 1].forEach(function(s){ for (var y = P + .1; y < TT - .3; y += .58) box(.75, Math.min(.5, TT - y), .06, s*(hw - .375 + .07), y, .03, M.trim, g); });
  });
})();
/* the spire roof: about 60° slopes, hip rolls, a ball and a rod at the top */
(function(){
  var sq = TW + .5, H = 4.1, top = TC + H;          // low enough to stay hidden behind the roof in the south view
  boxX(-sq, sq, TC - .14, TC, TZC - sq, TZC + sq, M.trim);
  hipRoof(-sq, sq, TZC - sq, TZC + sq, TC, top, M.roof);
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function(c){ rod([c[0]*sq, TC, TZC + c[1]*sq], [0, top, TZC], .06, M.roof); });
  add(new THREE.SphereGeometry(.17, 14, 10), M.pipe, 0, top + .08, TZC);
  add(new THREE.CylinderGeometry(.03, .03, 1.3, 6), M.pipe, 0, top + .7, TZC);
})();

/* ═══════════ MAIN ROOF · smooth, four slopes at about 20° (across the pond the hips look almost level), eaves
   overhanging with a gutter; a dormer to the south; chimneys placed so each photograph shows the ones it shows ═══════════ */
var HR = HS + .7, RT = .36, APEX = E3 + HR*RT;
boxX(-HR, HR, E3 - .17, E3 - .001, -HR, HR, M.trim);                                // eaves board and soffit
hipRoof(-HR, HR, -HR, HR, E3, APEX, M.roof);
[[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function(c){ rod([c[0]*HR, E3, c[1]*HR], [0, APEX, 0], .07, M.roof); });
[[-HR - .08, -HR - .08, -HR - .08, HR + .08], [HR + .08, -HR - .08, HR + .08, HR + .08], [-HR - .08, -HR - .08, HR + .08, -HR - .08], [-HR - .08, HR + .08, HR + .08, HR + .08]]
  .forEach(function(e){ rod([e[0], E3 - .08, e[1]], [e[2], E3 - .08, e[3]], .1, M.pipe); });   // gutters
function roofY(x, z){ return E3 + (HR - Math.max(Math.abs(x), Math.abs(z)))*RT; }
(function(){                                                                        // the dormer, as in the 1937 photograph
  var z1 = 5.6, w = 2.0, yb = roofY(0, z1) - .25, yt = yb + 1.25, g = face(0, z1, SOUTH);
  boxX(-w/2, w/2, E3, yt, 1.5, z1, M.wall);
  boxX(-w/2 - .1, w/2 + .1, yt, yt + .14, 1.5, z1 + .1, M.trim);
  var tri = new THREE.Shape([V(-w/2 - .15, yt + .14), V(w/2 + .15, yt + .14), V(0, yt + .82)]);
  add(ext(tri, z1 - 1.5 + .1), M.trim, 0, 0, 1.5, house);
  var s = new THREE.Shape([V(-w/2 - .3, yt + .08), V(w/2 + .3, yt + .08), V(0, yt + .98)]);
  add(ext(s, z1 - 1.6 + .2), M.roof, 0, 0, 1.6);
  win(g, 0, yb + .25, 1.25, .85, {glass: M.louv, depth: .2, sill: false});
  for (var i = 1; i < 6; i++) sunk(box(.04, .85, .06, -.625 + i*.21, yb + .25, -.15, M.trim, g), 3);
})();
/* chimneys. Brick: a broad stack near the north-west eaves (west view), a tall one by the top of the roof (south view,
   and the small dark one at the top across the pond), another south of it (dark, right of the pediment in the pre-1914 west
   view). Plastered: one near the south-west corner, light beside the pediment before 1914 and plain at the left end of the
   roof in the south view of 1937; Plastered: three on the north-east half, seen across the pond,
   low enough to stay hidden behind the roof in the view from the south */
[[-7.0, -3.6, .6, 1.4, 2.1, M.brick], [-1.9, .9, .7, .7, 2.0, M.brick], [-7.0, 7.2, .8, .8, 2.1, M.wall], [-1.9, 5.0, .7, .7, 2.3, M.brick], [1.0, -3.0, 1.4, .7, 1.1, M.wall], [4.5, -3.6, 1.0, .7, 1.1, M.wall], [3.0, -7.2, .8, .7, 1.4, M.wall]].forEach(function(c){
  var base = roofY(c[0], c[1]) - .5, y1 = roofY(c[0], c[1]) + c[4];
  boxX(c[0] - c[2]/2, c[0] + c[2]/2, base, y1, c[1] - c[3]/2, c[1] + c[3]/2, c[5]);
  boxX(c[0] - c[2]/2 - .08, c[0] + c[2]/2 + .08, y1 - .3, y1 - .18, c[1] - c[3]/2 - .08, c[1] + c[3]/2 + .08, c[5]);
  boxX(c[0] - c[2]/2 + .05, c[0] + c[2]/2 - .05, y1, y1 + .08, c[1] - c[3]/2 + .05, c[1] + c[3]/2 - .05, M.pipe);
});
/* the lightning rod: a thin mast by the top of the roof, west of the dormer (south view, 1937) */
add(new THREE.CylinderGeometry(.025, .04, 4.6, 6), M.pipe, -.9, roofY(-.9, 0) + 2.2, 0);
/* downpipes: where the portico meets the west wall (west view, 1937) and at the corners of the river front */
[-1, 1].forEach(function(sd){ add(new THREE.CylinderGeometry(.065, .065, E3 - P, 10), M.pipe, -HS - .14, (E3 + P)/2, sd*(PW + .25)); });
[-1, 1].forEach(function(sd){ var y0 = ground(HS); add(new THREE.CylinderGeometry(.065, .065, E3 - y0, 10), M.pipe, HS + .14, (E3 + y0)/2, sd*(HS + .14)); });

/* a soft sky for every surface to pick up light from */
function skyEnv(renderer){
  var es = new THREE.Scene(), g = new THREE.SphereGeometry(50, 32, 16), col = [], p = g.attributes.position, c = new THREE.Color();
  var top = new THREE.Color('#8fb8e3'), hor = new THREE.Color('#f4e6c8'), low = new THREE.Color('#4f5a3a');
  for (var i = 0; i < p.count; i++){ var y = p.getY(i)/50; if (y > 0) c.copy(hor).lerp(top, Math.pow(y, .6)); else c.copy(hor).lerp(low, Math.min(1, -y*3)); col.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  es.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({vertexColors: true, side: THREE.BackSide})));
  var sunDisc = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 8), new THREE.MeshBasicMaterial({color: new THREE.Color(6, 5.4, 4.2)}));
  sunDisc.position.set(-28, 30, 20); es.add(sunDisc);
  var pm = new THREE.PMREMGenerator(renderer), t = pm.fromScene(es, .03).texture; pm.dispose();
  return t;
}
scene.environment = skyEnv(renderer);
/* sheet metal laid in standing seams running down the slopes */
(function(m){
  m.onBeforeCompile = function(sh){
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nfloat rHash(float n){ return fract(sin(n)*43758.5453); }\n' + NOISE)
      .replace('#include <map_fragment>', [
        '#include <map_fragment>',
        'vec3 wn = normalize(cross(dFdx(vWPos), dFdy(vWPos)));',
        'float along = abs(wn.x) > abs(wn.z) ? vWPos.z : vWPos.x;',
        'float u = along/0.55, f = fract(u), id = floor(u);',
        'float seam = smoothstep(0.0, 0.035, f)*(1.0 - smoothstep(0.93, 1.0, f));',
        'float lit = smoothstep(0.035, 0.07, f)*(1.0 - smoothstep(0.07, 0.11, f));',
        'float flatTop = step(0.97, abs(wn.y));',
        'diffuseColor.rgb *= mix((0.8 + 0.2*seam) * (1.0 + 0.16*lit) * (0.94 + 0.12*rHash(id*7.13)), 1.0, flatTop);',
        'diffuseColor.rgb *= 0.9 + 0.16*fbm(vWPos*vec3(0.35, 0.9, 0.35)) - 0.05*vn(vec3(along*3.0, vWPos.y*0.4, 0.0));'
      ].join('\n'));
  };
  m.extensions = {derivatives: true};
  m.customProgramCacheKey = function(){ return 'roofSeamsW'; };
  m.needsUpdate = true;
})(M.roof);

/* ═══════════ PERFORMANCE · bake the static parts into a handful of meshes (one per material and pass) ═══════════ */
/* ── AR export (o.ar): no stencil holes in a glTF/USDZ viewer, so the sunk window parts (glass, sashes, door leaves) are pressed
   into a thin layer just in front of the wall face and the reveals are dropped ── */
if (o.ar) (function(root){ var rm = []; root.traverse(function(ob){ if (!ob.isMesh) return; var m = ob.material;
  if (m === holeStencil || m === holeDepth){ rm.push(ob); return; }
  if (ob.renderOrder === 3){ if (m.side === THREE.BackSide){ rm.push(ob); return; } ob.position.z = .02 + ob.position.z*.03; ob.scale.z *= .03; } });
  rm.forEach(function(ob){ ob.parent.remove(ob); }); })(house);
(function mergeStatic(root){
  root.updateMatrixWorld(true);
  var groups = {}, order = [], gone = [];
  root.traverse(function(ob){
    if (!ob.isMesh || Array.isArray(ob.material)) return;
    var key = ob.material.uuid + '|' + ob.renderOrder + '|' + ob.castShadow + '|' + ob.receiveShadow + '|' + ob.frustumCulled;
    if (!groups[key]){ groups[key] = {o: ob, list: []}; order.push(key); }
    groups[key].list.push(ob);
  });
  function cat(arrs){ var len = 0; arrs.forEach(function(a){ len += a.length; }); var out = new Float32Array(len), at = 0; arrs.forEach(function(a){ out.set(a, at); at += a.length; }); return out; }
  order.forEach(function(key){
    var G = groups[key]; if (G.list.length < 2) return;
    var Pp = [], N = [], U = [];
    G.list.forEach(function(ob){
      var g = ob.geometry.index ? ob.geometry.toNonIndexed() : ob.geometry.clone();
      g.applyMatrix4(ob.matrixWorld);
      if (!g.attributes.normal) g.computeVertexNormals();
      var n = g.attributes.position.count;
      Pp.push(g.attributes.position.array); N.push(g.attributes.normal.array);
      U.push(g.attributes.uv ? g.attributes.uv.array : new Float32Array(n*2));
      g.dispose(); gone.push(ob);
    });
    var mg = new THREE.BufferGeometry();
    mg.setAttribute('position', new THREE.BufferAttribute(cat(Pp), 3));
    mg.setAttribute('normal', new THREE.BufferAttribute(cat(N), 3));
    mg.setAttribute('uv', new THREE.BufferAttribute(cat(U), 2));
    var m = new THREE.Mesh(mg, G.o.material);
    m.renderOrder = G.o.renderOrder; m.castShadow = G.o.castShadow; m.receiveShadow = G.o.receiveShadow; m.frustumCulled = G.o.frustumCulled;
    root.add(m);
  });
  var geos = [];
  gone.forEach(function(ob){ if (geos.indexOf(ob.geometry) < 0) geos.push(ob.geometry); ob.parent.remove(ob); });
  geos.forEach(function(g){ if (g !== colGeo) g.dispose(); });
  root.children.slice().forEach(function(c){ if (!c.isMesh && c.children.length === 0) root.remove(c); });
})(house);

/* ═══════════ GROUND · a turntable engraved with the name ═══════════ */
var GX = -3.4, GZ = -.4;
(function(){
  var R = 28, W = 2048;
  var tex = canvasTex(W, W, function(k){
    var c = W/2, px = c/R;
    var g = k.createRadialGradient(c, c, 0, c, c, c);
    g.addColorStop(0, 'rgba(62,60,40,1)'); g.addColorStop(.62, 'rgba(50,47,31,1)'); g.addColorStop(.8, 'rgba(42,39,26,.92)'); g.addColorStop(.92, 'rgba(34,31,20,.4)'); g.addColorStop(1, 'rgba(28,25,16,0)');
    k.fillStyle = g; k.fillRect(0, 0, W, W);
    if (!o.turntable) return;
    var gold = 'rgba(222,190,112,', ring = function(r, lw, a){ k.strokeStyle = gold + a + ')'; k.lineWidth = lw; k.beginPath(); k.arc(c, c, r*px, 0, Math.PI*2); k.stroke(); };
    ring(18.5, 4, .55); ring(18.9, 1.6, .45); ring(23.1, 1.6, .38); ring(23.5, 4, .5);
    for (var i = 0; i < 360; i += 2){
      var a = i*Math.PI/180, r1 = i % 30 === 0 ? 20.2 : i % 10 === 0 ? 19.7 : 19.35;
      k.strokeStyle = gold + (i % 30 === 0 ? .6 : .38) + ')'; k.lineWidth = i % 30 === 0 ? 3 : 1.6;
      k.beginPath(); k.moveTo(c + Math.sin(a)*18.9*px, c - Math.cos(a)*18.9*px); k.lineTo(c + Math.sin(a)*r1*px, c - Math.cos(a)*r1*px); k.stroke();
    }
    var rt = 21.35*px, fs = Math.round(1.25*px);
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
    /* the canvas is laid flat with its top to the north (−z), so the west portico looks at the left edge */
    arc('ПАВІЛЬЙОН  «БІБЛІОТЕКА»', -Math.PI/2, true, fs*.22);
    arc('ВОРОБИН  ·  ДУБРОВИЦЯ', Math.PI/2, false, fs*.22);
    [0, Math.PI].forEach(function(t){ k.save(); k.translate(c + Math.sin(t)*rt, c - Math.cos(t)*rt); k.rotate(t + Math.PI/4); k.fillRect(-fs*.13, -fs*.13, fs*.26, fs*.26); k.restore(); });
  });
  var gm = new THREE.MeshStandardMaterial({map:tex, roughness:1, transparent:true, depthWrite:false});
  weather(gm, 'ground', {mottle: .14, grain: .1, streak: 0, grime: 0, gfade: 1, base: -9});
  gm.depthWrite = true;
  var pg = new THREE.PlaneGeometry(2*R, 2*R, 140, 140); pg.rotateX(-Math.PI/2);
  var pp = pg.attributes.position; for (var i = 0; i < pp.count; i++) pp.setY(i, ground(pp.getX(i) + GX) + .005);
  pg.computeVertexNormals();
  var g = add(pg, gm, GX, 0, GZ, scene); g.castShadow = false;
})();

/* ── light ── */
var hemi = new THREE.HemisphereLight('#fff4de', '#3a3420', .42); scene.add(hemi);
var sun = new THREE.DirectionalLight('#ffeccd', 1.6);
sun.position.set(-38, 50, 40); sun.target.position.set(GX, 5, GZ);
sun.castShadow = true; sun.shadow.mapSize.set(o.shadow, o.shadow);
var sc = sun.shadow.camera; sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30; sc.near = 20; sc.far = 160;
sun.shadow.bias = -.0003; sun.shadow.normalBias = .035;
scene.add(sun); scene.add(sun.target);
var fill = new THREE.DirectionalLight('#d3dcff', .5); fill.position.set(40, 18, -24); scene.add(fill);

/* ── night: floodlights on the walls, a warm glow in the windows (sun-3d.js, s.lamps 0…1) ── */
var NL = {spots: [], points: []};
function flood(p, t, ang, i){
  var sp = new THREE.SpotLight('#ffd7a0', 0, 90, ang, .9, 1); sp.position.set(p[0], p[1], p[2]); sp.target.position.set(t[0], t[1], t[2]);
  sp.userData.i = i; scene.add(sp); scene.add(sp.target); NL.spots.push(sp);
}
flood([-26, .3, -7], [-11.6, 6.5, -2.5], .4, 3.6); flood([-26, .3, 7], [-11.6, 6.5, 2.5], .4, 3.6); flood([-28, .3, 0], [-12, 11.5, 0], .2, 3.4);
flood([-2, -1, 31], [0, 5.5, 11.5], .62, 3.4); flood([24, ground(24) + .3, 0], [HS, 4, 0], .7, 2.6); flood([0, -.5, -30], [0, 8, -12], .45, 2.4);
var portLamp = new THREE.PointLight('#ffc27a', 0, 12, 2); portLamp.position.set(-10.2, C0 - .5, 0); portLamp.userData.i = 2.2; scene.add(portLamp); NL.points.push(portLamp);
M.glass.emissive = new THREE.Color('#ffb15a'); M.glass.emissiveIntensity = 0;
function setLamps(n){
  NL.spots.forEach(function(sp){ sp.intensity = n*sp.userData.i; });
  NL.points.forEach(function(pt){ pt.intensity = n*pt.userData.i; });
  M.glass.emissiveIntensity = n*.9;
}

/* ── daylight for the sun slider (sun-3d.js): s = null restores the studio light ── */
var L0 = {sp: sun.position.clone(), sc: sun.color.clone(), si: sun.intensity, fp: fill.position.clone(), fc: fill.color.clone(), fi: fill.intensity,
          hs: hemi.color.clone(), hg: hemi.groundColor.clone(), hi: hemi.intensity, ex: renderer.toneMappingExposure, box: sc.right, far: sc.far};
function shadowBox(r, far){ sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.far = far; sc.updateProjectionMatrix(); }
var envMats = null;
function envScale(k){
  if (!envMats){ envMats = []; scene.traverse(function(ob){ if (!ob.material) return; (Array.isArray(ob.material) ? ob.material : [ob.material]).forEach(function(m){ if (m.envMapIntensity !== undefined && envMats.indexOf(m) < 0){ m.userData.env0 = m.envMapIntensity; envMats.push(m); } }); }); }
  envMats.forEach(function(m){ m.envMapIntensity = m.userData.env0*k; });
}
function setLight(s){
  setLamps(s ? s.lamps || 0 : 0);
  if (!s){ envScale(1);
    sun.position.copy(L0.sp); sun.color.copy(L0.sc); sun.intensity = L0.si; fill.position.copy(L0.fp); fill.color.copy(L0.fc); fill.intensity = L0.fi;
    hemi.color.copy(L0.hs); hemi.groundColor.copy(L0.hg); hemi.intensity = L0.hi; renderer.toneMappingExposure = L0.ex; shadowBox(L0.box, L0.far);
  } else {
    var d = new THREE.Vector3(s.dir[0], s.dir[1], s.dir[2]).normalize();
    sun.position.copy(sun.target.position).addScaledVector(d, 110); sun.color.set(s.sunColor); sun.intensity = s.sunI;
    var h = new THREE.Vector3(-d.x, 0, -d.z); if (h.lengthSq() < 1e-4) h.set(1, 0, 0); h.normalize();
    fill.position.copy(sun.target.position).addScaledVector(h, 60).add(new THREE.Vector3(0, 34, 0)); fill.color.set(s.fillColor); fill.intensity = s.fillI;
    hemi.color.set(s.sky); hemi.groundColor.set(s.ground); hemi.intensity = s.hemiI; renderer.toneMappingExposure = s.exposure;
    envScale(s.env);
    var lo = Math.max(.12, d.y); shadowBox(Math.min(L0.box*2.2, L0.box/Math.sqrt(lo)*.62 + L0.box*.4), 240);
  }
  wake();
}

/* ── camera + controls ── */
var controls = new THREE.OrbitControls(camera, canvas);
controls.target.set(GX, o.targetY || 6.0, GZ);
var viewDir = new THREE.Vector3(o.view[0], o.view[1], o.view[2]).normalize(), touched = false;
controls.enableDamping = true; controls.dampingFactor = .07;
controls.minDistance = 14; controls.maxDistance = 140;
controls.maxPolarAngle = Math.PI/2 - .04;
controls.enablePan = false;
controls.enableZoom = !!o.zoom;
controls.rotateSpeed = .7;
canvas.style.touchAction = o.touch;
var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
controls.autoRotate = !!o.autoRotate && !reduced; controls.autoRotateSpeed = o.autoRotateSpeed;
controls.addEventListener('start', function(){ controls.autoRotate = false; touched = true; tween = null; if (o.onStart) o.onStart(); });

function home(){
  var t = Math.tan(camera.fov*Math.PI/360), dist = Math.max(15.5/t, 19/(t*camera.aspect))*o.fit;
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
var tween = null;
function moveTo(p, ms){ tween = {a: camera.position.clone(), b: p, t0: performance.now(), ms: ms || 650}; wake(); }
function stepTween(now){
  if (!tween) return;
  var k = Math.min(1, (now - tween.t0)/tween.ms), e = 1 - Math.pow(1 - k, 3);
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
/* the four fronts, for the view buttons */
function viewFrom(dir){
  var off = camera.position.clone().sub(controls.target), d = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize();
  touched = true; controls.autoRotate = false; moveTo(controls.target.clone().addScaledVector(d, off.length()), 900);
}

/* ── render only while the viewer is on screen ── */
var onScreen = true, running = false, first = true;
function tick(now){
  if (!running) return;
  requestAnimationFrame(tick);
  stepTween(now);
  controls.update();
  renderer.render(scene, camera);
  if (first){ first = false; requestAnimationFrame(function(){ if (o.onReady) o.onReady(api); }); }
}
function wake(){ if (!running && onScreen && !document.hidden){ running = true; requestAnimationFrame(tick); } }
function sync(){ if (onScreen && !document.hidden) wake(); else running = false; }
if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ onScreen = es[es.length - 1].isIntersecting; sync(); }).observe(canvas);
document.addEventListener('visibilitychange', sync);
if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas); else window.addEventListener('resize', resize);
resize(); sync();

var api = {
  renderer: renderer, camera: camera, controls: controls, scene: scene, model: house,
  zoomIn: function(){ zoomBy(1/1.35); }, zoomOut: function(){ zoomBy(1.35); },
  reset: function(){ touched = false; moveTo(home()); },
  autoRotate: function(on){ if (on === undefined) return controls.autoRotate; controls.autoRotate = !!on; return controls.autoRotate; },
  snapshot: function(){ renderer.render(scene, camera); return canvas.toDataURL('image/png'); },
  view: function(side){ var D = {west: [-1, .22, 0], south: [0, .22, 1], east: [1, .22, 0], north: [0, .22, -1], sw: [-1, .3, .85], ne: [1, .3, -.85]}; viewFrom(D[side] || D.sw); },
  /* model-space directions of geographic east and north (x, z): the portico faces west, the colonnade south */
  compass: {east: [1, 0], north: [0, -1]},
  light: setLight
};
return api;
}
})();
