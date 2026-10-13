/* Свято-Миколаївська церква в Дубровиці — 3D-модель за сучасними фотографіями з усіх боків і знімком згори.
   Використання:  Mykolai3D.mount(canvas, {autoRotate, zoom, touch, view, ...}).then(function(api){ ... })
   Бібліотека three.js r147 підвантажується з three-r147.js лише тоді, коли модель справді показують.
   Осі моделі: +x — схід (вівтар), −x — захід (дзвіниця), +z — південь, −z — північ. */
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
  o = Object.assign({autoRotate:true, autoRotateSpeed:.45, zoom:true, touch:'none', view:[-30, 6.5, 44], fit:1, pixelRatio:2, shadow:2048,
                     turntable:true, onReady:null, onFail:null, onStart:null}, o || {});
  if (!supported()){ if (o.onFail) o.onFail('webgl'); return Promise.resolve(null); }
  return Promise.all([load(), fonts()]).then(function(){ return build(canvas, o); }, function(){ if (o.onFail) o.onFail('load'); return null; });
}
window.Mykolai3D = {mount: mount, load: load, supported: supported};

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

/* ── materials: boards painted azure with dark blue and green, white trim, galvanised roofs, gilded onions ── */
function canvasTex(w, h, draw){ var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; }
function mat(c, o){ return new THREE.MeshStandardMaterial(Object.assign({color:c, roughness:.9, metalness:0}, o||{})); }
var M = {
  wall:  mat('#1a6bd3', {roughness:.78}),
  wallP: mat('#1a6bd3', {roughness:.75}),
  wallL: mat('#2aa9e4', {roughness:.78}),
  blueD: mat('#0f3a96', {roughness:.7}),
  green: mat('#24733f', {roughness:.75}),
  yellow:mat('#e3b23a', {roughness:.6}),
  trim:  mat('#f3f5f7', {roughness:.62}),
  sash:  mat('#f7f8f9', {roughness:.5}),
  roof:  mat('#a9afb5', {roughness:.42, metalness:.55}),
  dome:  mat('#b9bdc4', {roughness:.3, metalness:.78}),
  domeS: mat('#d2d5da', {roughness:.3, metalness:.7}),
  gold:  mat('#dcb76c', {roughness:.3, metalness:.85}),
  glass: mat('#1c2630', {roughness:.12, metalness:.2}),
  louv:  mat('#ffffff', {roughness:.7}),
  door:  mat('#2c6b43', {roughness:.6}),
  doorP: mat('#367a4f', {roughness:.55}),
  icon:  mat('#5b3a22', {roughness:.6}),
  plinth:mat('#6d6b67', {roughness:.95}),
  step:  mat('#a19f99', {roughness:.92}),
  pave:  mat('#ffffff', {roughness:.95}),
  pipeW: mat('#e6eaee', {roughness:.4, metalness:.3})
};
/* louvres in the belfry: green slats */
M.louv.map = canvasTex(16, 64, function(k){ k.fillStyle = '#1e4f34'; k.fillRect(0, 0, 16, 64); var g = k.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, '#5aa077'); g.addColorStop(.6, '#3b8058'); g.addColorStop(1, '#1e4f34'); k.fillStyle = g; k.fillRect(0, 6, 16, 50); });
M.louv.map.wrapS = M.louv.map.wrapT = THREE.RepeatWrapping; M.louv.map.repeat.set(1, 6);
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
/* horizontal weatherboards, 0.19 m each: a shadow line under every board and a slight lap shading */
shaderHook(M.wall, 'boards', [
  'float bd = fract(vWPos.y/0.19), bid = floor(vWPos.y/0.19);',
  'diffuseColor.rgb *= (0.9 + 0.1*smoothstep(0.0, 0.85, bd)) * (1.0 - 0.38*(1.0 - smoothstep(0.0, 0.07, bd)));',
  'diffuseColor.rgb *= 0.97 + 0.06*h3(vec3(bid, 1.0, 2.0)) - 0.04*fbm(vWPos*vec3(0.25, 2.0, 0.25));'
].join('\n'));
shaderHook(M.wallL, 'boardsL', [
  'float bd = fract(vWPos.y/0.19), bid = floor(vWPos.y/0.19);',
  'diffuseColor.rgb *= (0.9 + 0.1*smoothstep(0.0, 0.85, bd)) * (1.0 - 0.34*(1.0 - smoothstep(0.0, 0.07, bd)));',
  'diffuseColor.rgb *= 0.97 + 0.06*h3(vec3(bid, 3.0, 2.0)) - 0.04*fbm(vWPos*vec3(0.25, 2.0, 0.25));'
].join('\n'));
shaderHook(M.blueD, 'blueD', 'diffuseColor.rgb *= 0.95 + 0.08*fbm(vWPos*vec3(0.6, 0.15, 0.6));');
shaderHook(M.green, 'green', 'diffuseColor.rgb *= 0.93 + 0.1*fbm(vWPos*vec3(0.6, 0.12, 0.6));');
weather(M.trim, 'trim', {mottle: .02, grain: .02, streak: .02, grime: .06, gfade: .6, base: .5});
weather(M.plinth, 'plinth', {mottle: .07, grain: .06, streak: .02, grime: .2, gfade: .5, base: 0});
weather(M.step, 'step', {mottle: .08, grain: .08, streak: 0, grime: .1, gfade: .3, base: 0});
/* pavers: grey-pink, laid in a running bond */
shaderHook(M.pave, 'pave', [
  'float pr = floor(vWPos.z/0.2), pu = vWPos.x/0.4 + 0.5*mod(pr, 2.0);',
  'float joint = max(step(0.93, fract(vWPos.z/0.2)), step(0.96, fract(pu)));',
  'vec3 pc = mix(vec3(0.36, 0.25, 0.24), vec3(0.32, 0.31, 0.30), step(0.55, h3(vec3(floor(pu), pr, 5.0))));',
  'pc *= 0.9 + 0.2*h3(vec3(floor(pu), pr, 9.0));',
  'diffuseColor.rgb = mix(pc, vec3(0.16, 0.15, 0.14), joint);'
].join('\n'));
var revealB = mat('#1a5fbd', {side: THREE.BackSide});
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

function ground(){ return 0; }
/* ═══════════ PLAN AND HEIGHTS (m) · solved from the photographs: three modern views (NW, S, NE) fitted together by
   reprojection of ~60 marked corners (cameras and dimensions at once); scale from the refectory windows (1.0 × 1.95 m).
   Origin: the tower's east face on the axis; +x east (altar), +z south. Plan: the bell tower (3.8 × 6.0 m, broad side to the
   west), the refectory (6.55 × 6.5), the tall crossing (8.4 × 8.1) under the drum, gabled arms north and south (6.4 wide,
   4.0 deep), the altar end (4.6 × 7.7) with a gable to the east ═══════════ */
var P0 = .3, LOW = 4.3;
var TX0 = -3.8, TX1 = 0, TH = 3.1, TCAP = 5.73, BX = (TX0 + TX1)/2, TXH = (TX1 - TX0)/2;
var PH = 1.6, PT = 8.15;                            // pedestal of the belfry: half width, top (ledge)
var BH = 1.47, B0 = 8.32, B1 = 11.02;              // belfry walls
var RX0 = 0, RX1 = 6.55, RH = 3.25, RR = 5.62;      // refectory
var NX0 = RX1, NX1 = 14.86, NH = 4.04, NCAP = 6.03; // crossing
var AX0 = 7.44, AX1 = 13.88, AH = 8.0, ALOW = 4.33, AR = 5.6;   // arms
var EX0 = NX1, EX1 = 19.29, EH = 3.73, ELOW = 4.26, ER = 5.5;    // altar end
var DCX = (NX0 + NX1)/2, DA = 1.86, DE = .84, D1 = 9.97;         // drum: half across the flats, chamfer, top of the walls
var ACX = (AX0 + AX1)/2;

/* ── small builders ── */
function wallBox(x0, x1, z0, z1, y0, y1, m){ return boxX(x0, x1, y0, y1, z0, z1, m || M.wall); }
function slab(a, b, c, d, t, m, parent){
  var A = new THREE.Vector3().fromArray(a), Bv = new THREE.Vector3().fromArray(b), C = new THREE.Vector3().fromArray(c), D = new THREE.Vector3().fromArray(d);
  var n = new THREE.Vector3().subVectors(Bv, A).cross(new THREE.Vector3().subVectors(D, A)).normalize(); if (n.y < 0) n.negate();
  var dn = n.clone().multiplyScalar(-t), q = [A, Bv, C, D], r = q.map(function(v){ return v.clone().add(dn); });
  var f = function(v){ return [v.x, v.y, v.z]; }, ctr = new THREE.Vector3(); q.concat(r).forEach(function(v){ ctr.add(v); }); ctr.divideScalar(8);
  return solid([q.map(f), r.map(f), [q[0], q[1], r[1], r[0]].map(f), [q[1], q[2], r[2], r[1]].map(f), [q[2], q[3], r[3], r[2]].map(f), [q[3], q[0], r[0], r[3]].map(f)], m, ctr, parent);
}
/* gable roof: ridge along x (axis 'x') or z; a0 → a1 along the ridge, `half` the wall half-width, eaves at y0, ridge yr over the wall line */
function gableRoof(axis, a0, a1, half, c, y0, yr, m, over){
  over = over === undefined ? .42 : over; var w = half + over, ye = y0 - over*(yr - y0)/half;
  if (axis === 'x'){
    slab([a0, yr, c], [a1, yr, c], [a1, ye, c - w], [a0, ye, c - w], .1, m); slab([a0, yr, c], [a1, yr, c], [a1, ye, c + w], [a0, ye, c + w], .1, m);
    rod([a0, yr + .03, c], [a1, yr + .03, c], .07, m);
  } else {
    slab([c, yr, a0], [c, yr, a1], [c - w, ye, a1], [c - w, ye, a0], .1, m); slab([c, yr, a0], [c, yr, a1], [c + w, ye, a1], [c + w, ye, a0], .1, m);
    rod([c, yr + .03, a0], [c, yr + .03, a1], .07, m);
  }
}
/* gable end in a face group: the boarded triangle, dark blue raking fascias with a white edge */
function gableEnd(g, half, y0, yr, over){
  over = over === undefined ? .42 : over;
  add(ext(new THREE.Shape([V(-half, y0 - .01), V(half, y0 - .01), V(0, yr)]), .3), M.wall, 0, 0, -.3, g);
  var w = half + over, ye = y0 - over*(yr - y0)/half, L = Math.hypot(w, yr - ye), a = Math.atan2(yr - ye, w);
  [-1, 1].forEach(function(sd){
    var b = box(L, .24, .1, 0, -.12, 0, M.blueD, g); b.position.set(sd*w/2, (yr + ye)/2 - .12, .12); b.rotation.z = -sd*a;
    var t = box(L, .05, .12, 0, -.025, 0, M.trim, g); t.position.set(sd*w/2 + Math.sin(a)*sd*.0, (yr + ye)/2 - .26, .13); t.rotation.z = -sd*a;
  });
}
function kokoS(w){
  /* the white figure over every window (taken off close-ups): a board with ends slanting inwards, a little house with a
     pointed roof standing on it, and a pointed notch cut up into both from below, the blue wall showing through */
  var k = [[-.355, 0], [-.19, 0], [-.19, .16], [0, .27], [.19, .16], [.19, 0], [.355, 0], [.5, .2], [.28, .2], [.28, .33], [0, .48], [-.28, .33], [-.28, .2], [-.5, .2]];
  return new THREE.Shape(k.map(function(p){ return V(p[0]*w, p[1]*w); }));
}
function koko(g, x, y, w){
  var o = add(ext(kokoS(w*1.07), .05), M.blueD, x, y - .025*w, 0, g);                 // the dark blue outline round it
  add(ext(kokoS(w), .08), M.trim, x, y, 0, g);
}
function bigKoko(g, x, y, w){ koko(g, x, y, w); }
/* window: dark blue surround, a broad flat white casing, a sash of cols × rows panes behind the wall face, the figure over it */
var WY = 1.2, WW = .74, WHT = 1.7;                  // the standard window: inner opening (casing 1.0 × 1.96)
function win2(g, x, y, w, h, cols, rows, o2){
  o2 = o2 || {}; var fw = .13, depth = .26, W = w + 2*fw;
  var bs = rectS(W + .14, y - fw - .07, y + h + fw + .07); bs.holes.push(rectS(W, y - fw, y + h + fw, true)); add(ext(bs, .05), M.blueD, x, 0, 0, g);
  var sur = rectS(W, y - fw, y + h + fw); sur.holes.push(rectS(w, y, y + h, true)); add(ext(sur, .07), M.trim, x, 0, 0, g);
  box(W + .26, .08, .16, x, y - fw - .15, .08, M.blueD, g);
  cut(g, x, function(){ return rectS(w, y, y + h); }, depth, M.glass, revealB);
  var zb = -depth + .04, f = .05, b = .03;
  var fr = rectS(w, y, y + h); fr.holes.push(rectS(w - 2*f, y + f, y + h - f, true)); sunk(add(ext(fr, .04), M.sash, x, 0, zb, g), 3);
  for (var i = 1; i < cols; i++) sunk(box(b, h - 2*f, .04, x - w/2 + f + (w - 2*f)*i/cols, y + f, zb + .02, M.sash, g), 3);
  for (i = 1; i < rows; i++) sunk(box(w - 2*f, b, .04, x, y + f + (h - 2*f)*i/rows - b/2, zb + .02, M.sash, g), 3);
  if (o2.koko !== false) koko(g, x, y + h + fw + .1, W*1.42);
}
function stdWin(g, x){ win2(g, x, WY, WW, WHT, 3, 5); }
/* corner pilaster: dark blue boards either side of a green one, a yellow block at the top */
function pil(g, x, y0, y1, cap, wd){
  wd = wd || .56;
  box(wd, y1 - y0, .07, x, y0, .035, M.blueD, g);
  box(wd*.5, y1 - y0, .1, x, y0, .05, M.green, g);
  if (cap !== false) box(wd + .06, .14, .13, x, y1 - .14, .065, M.yellow, g);
}
function frieze(g, len, y0, y1, d, pw0){
  d = d || 0; var n = Math.max(2, Math.round(len/(pw0 || .9))), pw = len/n, hh = y1 - y0;
  box(len, .08, .07 + d, 0, y0, .035 + d/2, M.blueD, g); box(len, .08, .07 + d, 0, y1 - .08, .035 + d/2, M.blueD, g);
  for (var i = 0; i < n; i++){ var cx = -len/2 + pw*(i + .5);
    box(pw - .1, hh - .2, .05 + d, cx, y0 + .1, .025 + d/2, M.trim, g);
    box(pw*.4, (hh - .2)*.34, .07 + d, cx, y0 + .1 + (hh - .2)*.33, .035 + d/2, M.wallP, g); }
}
function base(g, half, y0){ box(2*half, .22, .06, 0, y0, .03, M.blueD, g); box(2*half, .04, .08, 0, y0 + .22, .04, M.trim, g); }
/* eaves of a low wall: dark blue board, a thin white line under it */
function eaves(g, half, y){ box(2*half, .2, .07, 0, y - .2, .035, M.blueD, g); box(2*half, .04, .08, 0, y - .24, .04, M.trim, g); }
/* cornice of the tall blocks: stepped, dark blue / white / dark blue */
function cornice2(x0, x1, z0, z1, y){
  boxX(x0 - .08, x1 + .08, y, y + .1, z0 - .08, z1 + .08, M.blueD);
  boxX(x0 - .2, x1 + .2, y + .1, y + .2, z0 - .2, z1 + .2, M.trim);
  boxX(x0 - .32, x1 + .32, y + .2, y + .3, z0 - .32, z1 + .32, M.blueD);
  return y + .3;
}
function plinthB(x0, x1, z0, z1){ boxX(x0 - .06, x1 + .06, 0, P0, z0 - .06, z1 + .06, M.plinth); }
function pipe(x, z, y1){ add(new THREE.CylinderGeometry(.055, .055, y1, 8), M.pipeW, x, y1/2, z); add(new THREE.CylinderGeometry(.08, .055, .25, 8), M.pipeW, x, .12, z);
  add(new THREE.CylinderGeometry(.09, .06, .2, 8), M.pipeW, x, y1 - .1, z); }
/* frustum roof between an outer rectangle (eaves) and an inner one (top), as four sloping slabs */
function frustum(x0, x1, z0, z1, y0, ix0, ix1, iz0, iz1, y1, m){
  var A = [x0, y0, z0], B = [x1, y0, z0], C = [x1, y0, z1], D = [x0, y0, z1], a = [ix0, y1, iz0], b = [ix1, y1, iz0], c = [ix1, y1, iz1], d = [ix0, y1, iz1];
  var ctr = new THREE.Vector3((x0 + x1)/2, (y0 + y1)/2 - .5, (z0 + z1)/2);
  solid([[A, B, b, a], [B, C, c, b], [C, D, d, c], [D, A, a, d], [A, B, C, D], [a, b, c, d]], m, ctr);
  [[A, a], [B, b], [C, c], [D, d]].forEach(function(e){ rod(e[0], e[1], .045, m); });
}
/* porch: platform and steps out to `dir`, posts (white over dark blue, a yellow band), a gabled canopy with a pediment */
function porch(cx, cz, dir, w, d, h, o2){
  o2 = o2 || {}; var g = new THREE.Group(); g.position.set(cx, 0, cz); g.rotation.y = dir; house.add(g);   // local +z = outwards
  var fl = P0 + .12, ns = o2.steps || 4;
  box(w + .2, fl, d + .1, 0, 0, (d + .1)/2, M.plinth, g);
  for (var s = 0; s < ns; s++) box(o2.stepW || w*.7, fl*(ns - s)/ns, .3, 0, 0, d + .1 + .15 + s*.3, M.step, g);
  var posts = [[-(w/2 - .12), d - .14], [w/2 - .12, d - .14]];
  if (o2.back) posts.push([-(w/2 - .12), .14], [w/2 - .12, .14]);
  posts.forEach(function(p){
    box(.22, 1.05, .22, p[0], fl, p[1], M.blueD, g); box(.18, h - fl - 1.05, .18, p[0], fl + 1.05, p[1], M.trim, g);
    box(.25, .1, .25, p[0], fl + 1.0, p[1], M.yellow, g);
  });
  if (o2.rail) [-1, 1].forEach(function(sd){ var x = sd*(w/2 - .12);
    box(.07, .06, d - .3, x, fl + .9, (d - .14)/2 + .02, M.blueD, g); box(.05, .05, d - .3, x, fl + .12, (d - .14)/2 + .02, M.blueD, g);
    for (var k = 1; k < 7; k++) box(.045, .8, .045, x, fl + .12, .14 + (d - .28)*k/7, M.blueD, g); });
  box(w + .08, .24, d + .02, 0, h, d/2, M.trim, g);                                  // frieze board round the canopy
  box(w + .1, .1, d + .04, 0, h - .1, d/2, M.blueD, g);
  var rise = o2.rise || .72, yb = h + .24;
  add(ext(new THREE.Shape([V(-w/2, yb), V(w/2, yb), V(0, yb + rise)]), .1), M.wall, 0, 0, d - .1, g);
  var ov = o2.ov || .36, hw = w/2 + ov, yr = yb + rise + .06, ye = yr - hw*rise/(w/2);
  [-1, 1].forEach(function(sd){
    var L = Math.hypot(hw, yr - ye), a = Math.atan2(yr - ye, hw);
    var b = box(L, .2, .08, 0, 0, 0, M.blueD, g); b.position.set(sd*hw/2, (yr + ye)/2 - .14, d + .2); b.rotation.z = -sd*a;
  });
  if (o2.icon){ box(.6, .46, .04, 0, yb + .1, d + .0, M.gold, g); box(.42, .32, .05, 0, yb + .17, d + .01, M.icon, g); }
  slab([0, yr, -.05], [0, yr, d + .25], [-hw, ye, d + .25], [-hw, ye, -.05], .07, M.roof, g);
  slab([0, yr, -.05], [0, yr, d + .25], [hw, ye, d + .25], [hw, ye, -.05], .07, M.roof, g);

  return g;
}
function door(g, x, y, w, h){
  var sur = rectS(w + .26, y, y + h + .13); sur.holes.push(rectS(w, y, y + h, true)); add(ext(sur, .07), M.trim, x, 0, 0, g);
  cut(g, x, function(){ return rectS(w, y, y + h); }, .14, M.door, revealB);
  [-1, 1].forEach(function(sd){ [[.25, h*.42], [h*.5, h*.42]].forEach(function(p){ sunk(box(w/2 - .22, p[1] - .1, .03, x + sd*w/4, y + p[0], -.12, M.doorP, g), 3); }); });
  sunk(box(.04, h, .04, x, y, -.11, M.blueD, g), 3);
}
function cross(x, y, z, s){
  var t = .036*s;
  box(t, 1.0*s, t, x, y, z, M.gold);
  box(.56*s, t, t, x, y + .64*s, z, M.gold); box(.3*s, t, t, x, y + .85*s, z, M.gold);
  var f = box(.38*s, t, t, x, y + .26*s, z, M.gold); f.rotation.z = -.38;
  [[-.28, .64], [.28, .64], [0, 1.0]].forEach(function(p){ add(new THREE.SphereGeometry(t*1.1, 8, 6), M.gold, x + p[0]*s, y + p[1]*s + t/2, z); });
}
/* lantern: a sheet-metal collar, a slender light-blue octagonal drum with white strips and collars, a dark band, a gilded
   onion with a ball and spike, the cross */
function lantern(x, z, y, r, h, gr, gh, cs, slim){
  var c0 = add(new THREE.CylinderGeometry(r + .05, r + .08, .16, 8), slim ? M.dome : M.roof, x, y + .08, z); c0.rotation.y = Math.PI/8;
  var dg = add(new THREE.CylinderGeometry(r, r, h, 8), M.blueD, x, y + .16 + h/2, z); dg.rotation.y = Math.PI/8;
  [y + .2, y + .16 + h - .06].forEach(function(yy){ var c = add(new THREE.CylinderGeometry(r + .04, r + .04, .07, 8), M.trim, x, yy, z); c.rotation.y = Math.PI/8; });
  for (var i = 0; i < 8; i++){ var a = i*Math.PI/4; var b = box(.035, h - .1, .03, x + Math.cos(a)*r*.93, y + .2, z + Math.sin(a)*r*.93, M.trim); b.rotation.y = -a + Math.PI/2; }
  var yt = y + .16 + h;
  var bd = add(new THREE.CylinderGeometry(r + .07, r + .07, .1, 8), M.blueD, x, yt + .05, z); bd.rotation.y = Math.PI/8;
  var pr = [V(0, 0), V(gr*.72, 0), V(gr*.92, gh*.14), V(gr, gh*.34), V(gr*.9, gh*.56), V(gr*.6, gh*.76), V(gr*.28, gh*.9), V(gr*.12, gh*.97), V(gr*.1, gh), V(0, gh)];
  add(new THREE.LatheGeometry(new THREE.SplineCurve(pr).getPoints(28), 24), slim ? M.dome : M.gold, x, yt + .1, z);
  var yb = yt + .1 + gh;
  add(new THREE.SphereGeometry(gr*.24, 14, 10), M.gold, x, yb + gr*.18, z);
  add(new THREE.CylinderGeometry(.03, .05, .3, 6), M.gold, x, yb + gr*.36 + .15, z);
  cross(x, yb + gr*.36 + .28, z, cs);
}

/* ═══════════ PLINTHS ═══════════ */
plinthB(TX0, TX1, -TH, TH); plinthB(RX0, RX1, -RH, RH); plinthB(NX0, NX1, -NH, NH); plinthB(AX0, AX1, -AH, AH); plinthB(EX0, EX1, -EH, EH);

/* ═══════════ TOWER · broad west front with the door, porch, big ornament and fan window; one window north and south ═══════════ */
wallBox(TX0, TX1, -TH, TH, P0, 6.84);
var TW = face(TX0, 0, WEST), TN = face(BX, -TH, NORTH), TS = face(BX, TH, SOUTH);
[[TW, TH], [TN, TXH], [TS, TXH]].forEach(function(e){ var g = e[0], h = e[1];
  base(g, h, P0); pil(g, -h + .28, P0 + .26, TCAP); pil(g, h - .28, P0 + .26, TCAP);
  box(2*h, .2, .08, 0, TCAP + .02, .04, M.blueD, g); frieze(g, 2*h, 6.06, 6.84, 0, .92); });
door(TW, 0, P0 + .14, 1.5, 2.25);
bigKoko(TW, 0, 3.95, 2.1);
(function(){                                                                       // fan window under the frieze
  var r = .62, yc = 4.9, g = TW;
  var lr = new THREE.Shape(); lr.moveTo(-r - .12, yc); lr.absarc(0, yc, r + .12, Math.PI, 0, true); lr.lineTo(r, yc); lr.absarc(0, yc, r, 0, Math.PI, false); lr.lineTo(-r - .12, yc);
  add(ext(lr, .06, 40), M.trim, 0, 0, 0, g); box(2*r + .36, .1, .14, 0, yc - .1, .07, M.trim, g);
  cut(g, 0, function(){ var s = new THREE.Shape(); s.moveTo(-r, yc); s.absarc(0, yc, r, Math.PI, 0, true); s.lineTo(-r, yc); return s; }, .2, M.glass, revealB);
  for (var i = 1; i < 6; i++){ var a = Math.PI*i/6; var b = sunk(box(.035, r, .03, 0, 0, -.15, M.sash, g), 3); b.geometry.translate(0, r/2, 0); b.position.set(0, yc, -.15); b.rotation.z = Math.PI/2 - a; }
  var arc = new THREE.Shape(); arc.moveTo(-r*.55, yc); arc.absarc(0, yc, r*.55, Math.PI, 0, true); arc.lineTo(r*.48, yc); arc.absarc(0, yc, r*.48, 0, Math.PI, false); arc.lineTo(-r*.55, yc);
  sunk(add(ext(arc, .03, 24), M.sash, 0, 0, -.16, g), 3);
})();
stdWin(TN, 0); stdWin(TS, 0);
porch(TX0, 0, WEST, 2.9, 2.0, 3.05, {rail: true, icon: true, steps: 4, stepW: 2.2});
var TC = cornice2(TX0, TX1, -TH, TH, 6.84);
[[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function(c){ pipe((c[0] < 0 ? TX0 : TX1) + c[0]*.1, c[1]*(TH + .1), 6.84); });
/* skirt roof from the tower cornice up to the pedestal of the belfry */
frustum(TX0 - .32, TX1 + .32, -TH - .32, TH + .32, TC, BX - PH, BX + PH, -PH, PH, 7.62, M.roof);

/* ═══════════ BELFRY · light blue; a pedestal and ledge; one wide opening a side with rounded shoulders, in a white
   frame, louvres over a white balustrade; frieze and cornice ═══════════ */
wallBox(BX - PH, BX + PH, -PH, PH, 7.2, PT, M.wallL);
boxX(BX - PH - .14, BX + PH + .14, PT, PT + .17, -PH - .14, PH + .14, M.blueD);
boxX(BX - PH - .16, BX + PH + .16, PT + .13, PT + .17, -PH - .16, PH + .16, M.trim);
wallBox(BX - BH, BX + BH, -BH, BH, PT + .17, B1, M.wallL);
(function(){
  var gs = [face(BX - BH, 0, WEST), face(BX, -BH, NORTH), face(BX, BH, SOUTH), face(BX + BH, 0, EAST)];
  var gp = [face(BX - PH, 0, WEST), face(BX, -PH, NORTH), face(BX, PH, SOUTH), face(BX + PH, 0, EAST)];
  gp.forEach(function(g){ box(2*PH, .1, .05, 0, PT - .14, .025, M.blueD, g); });
  gs.forEach(function(g){
    var w = 1.72, y0 = 8.45, ys = 9.72, yt = 10.16, ch = .34, FW = 2.5, fy0 = 8.4, fy1 = 10.4;
    function op(path, gr){ gr = gr || 0; var a = w/2 + gr, b0 = y0 - (gr ? .08 : 0), s = path ? new THREE.Path() : new THREE.Shape();
      s.moveTo(-a, b0); s.lineTo(a, b0); s.lineTo(a, ys); s.quadraticCurveTo(a, yt + gr, a - ch - gr*.4, yt + gr); s.lineTo(-a + ch + gr*.4, yt + gr); s.quadraticCurveTo(-a, yt + gr, -a, ys); s.lineTo(-a, b0); return s; }
    var fr = rectS(FW, fy0, fy1); fr.holes.push(rectS(FW - .22, fy0 + .02, fy1 - .11, true)); add(ext(fr, .07), M.trim, 0, 0, 0, g);
    var ln = rectS(FW - .34, fy0 + .02, fy1 - .19); ln.holes.push(rectS(FW - .44, fy0 + .02, fy1 - .29, true)); add(ext(ln, .04), M.blueD, 0, 0, 0, g);
    var sur = op(false, .12); sur.holes.push(op(true)); add(ext(sur, .06, 24), M.trim, 0, 0, 0, g);
    cut(g, 0, function(){ return op(); }, .5, M.louv, revealB);
    for (var i = 0; i <= 12; i++) sunk(box(.045, .6, .05, -w/2 + .07 + (w - .14)*i/12, y0 + .02, -.1, M.trim, g), 3);
    sunk(box(w, .07, .1, 0, y0 + .62, -.1, M.trim, g), 3); sunk(box(w, .05, .1, 0, y0, -.1, M.trim, g), 3);
    [-1, 1].forEach(function(sd){ box(.07, 10.5 - PT - .17, .06, sd*(BH - .05), PT + .17, .03, M.blueD, g); box(.07, 10.5 - PT - .17, .06, sd*(BH - .15), PT + .17, .03, M.trim, g); });
    frieze(g, 2*BH, 10.5, B1, 0, .6);
  });
})();
var BC = cornice2(BX - BH, BX + BH, -BH, BH, B1);

/* ═══════════ SPIRE · a low skirt from the cornice, then a slender four-sided spire set in from the walls (NW and S views) ═══════════ */
var SK = 1.12, SKY = BC + .22, SPA = 15.15;
frustum(BX - BH - .34, BX + BH + .34, -BH - .34, BH + .34, BC - .04, BX - SK, BX + SK, -SK, SK, SKY, M.roof);
hipRoof(BX - SK, BX + SK, -SK, SK, SKY, SPA + .12, M.roof);
[[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function(c){ rod([BX + c[0]*SK, SKY, c[1]*SK], [BX, SPA + .12, 0], .04, M.roof); });
lantern(BX, 0, SPA - .1, .25, .92, .3, .46, .8, true);

/* ═══════════ REFECTORY · three windows a side, no pilasters, gable roof from the tower to the crossing ═══════════ */
wallBox(RX0, RX1, -RH, RH, P0, LOW);
(function(){
  var cx = (RX0 + RX1)/2, half = (RX1 - RX0)/2;
  var n = face(cx, -RH, NORTH), s = face(cx, RH, SOUTH);
  [n, s].forEach(function(g){ base(g, half, P0); eaves(g, half, LOW); });
  [1.31, 3.27, 5.22].forEach(function(x){ stdWin(s, x - cx); stdWin(n, cx - x); });
  /* the strips of the west end that stand out beside the tower */
  [-1, 1].forEach(function(sd){ var g = face(RX0, sd*(TH + RH)/2, WEST); base(g, (RH - TH)/2, P0); });
  gableRoof('x', RX0 - .02, RX1, RH, 0, LOW, RR, M.roof, .42);
  [-1, 1].forEach(function(sd){ pipe(RX0 + .1, sd*(RH + .1), LOW - .1); pipe(RX1 - .12, sd*(RH + .1), LOW - .1); });
})();

/* ═══════════ CROSSING · tall square under the drum; pilasters at every corner, frieze, cornice, low hip roof ═══════════ */
wallBox(NX0, NX1, -NH, NH, P0, 7.0);
(function(){
  var half = (NX1 - NX0)/2, cx = (NX0 + NX1)/2;
  var n = face(cx, -NH, NORTH), s = face(cx, NH, SOUTH), w = face(NX0, 0, WEST), e = face(NX1, 0, EAST);
  [[n, half], [s, half], [w, NH], [e, NH]].forEach(function(f){ var g = f[0], h = f[1];
    base(g, h, P0); pil(g, -h + .28, P0 + .26, NCAP); pil(g, h - .28, P0 + .26, NCAP);
    box(2*h, .12, .08, 0, NCAP + .02, .04, M.blueD, g); frieze(g, 2*h, 6.16, 7.0, 0, .92); });
  /* inner corners where the arms, the refectory and the altar meet it */
  [[s, AX0 - cx - .3], [s, AX1 - cx + .3], [n, -(AX0 - cx) + .3], [n, -(AX1 - cx) - .3]].forEach(function(p){ pil(p[0], p[1], ALOW, NCAP, true, .4); });
  [[w, RH + .25], [w, -RH - .25], [e, EH + .25], [e, -EH - .25]].forEach(function(p){ pil(p[0], p[1], P0 + .26, NCAP, true, .4); });
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function(c){ pipe((c[0] < 0 ? NX0 : NX1) + c[0]*.1, c[1]*(NH + .1), 7.0); });
})();
var NC = cornice2(NX0, NX1, -NH, NH, 7.0);
var NRA = NC + 1.15;                                         // apex of the hip if it ran to a point
hipRoof(NX0 - .32, NX1 + .32, -NH - .32, NH + .32, NC, NRA, M.roof);

/* ═══════════ ARMS · gabled to the north and south, a porch and door in each gable, one window in each side wall ═══════════ */
[-1, 1].forEach(function(sd){
  var z0 = sd*NH, z1 = sd*AH, half = (AX1 - AX0)/2, dep = Math.abs(z1 - z0)/2, zc = (z0 + z1)/2;
  wallBox(AX0, AX1, Math.min(z0, z1), Math.max(z0, z1), P0, ALOW);
  var gEnd = face(ACX, z1, sd > 0 ? SOUTH : NORTH), gW = face(AX0, zc, WEST), gE = face(AX1, zc, EAST);
  base(gEnd, half, P0); eaves(gEnd, half, ALOW); pil(gEnd, -half + .3, P0 + .26, ALOW - .2); pil(gEnd, half - .3, P0 + .26, ALOW - .2);
  [gW, gE].forEach(function(g){ base(g, dep, P0); eaves(g, dep, ALOW); var o = (g === gW ? sd : -sd)*(dep - .3); pil(g, o, P0 + .26, ALOW - .2); stdWin(g, 0); });
  gableEnd(gEnd, half, ALOW, AR, .42);
  bigKoko(gEnd, 0, ALOW - .85, 2.4);
  door(gEnd, 0, P0 + .14, 1.45, 2.35);
  porch(ACX, z1, sd > 0 ? SOUTH : NORTH, 2.7, 1.7, 3.05, {steps: 5, stepW: 2.9, rise: .66});
  gableRoof('z', z0, z1 + sd*.42, half, ACX, ALOW, AR, M.roof, .42);
  pipe(AX0 - .1, z1 + sd*.1, ALOW - .1); pipe(AX1 + .1, z1 + sd*.1, ALOW - .1);
});

/* ═══════════ ALTAR END · one window north and south, a plain gable to the east ═══════════ */
wallBox(EX0, EX1, -EH, EH, P0, ELOW);
(function(){
  var cx = (EX0 + EX1)/2, half = (EX1 - EX0)/2;
  var n = face(cx, -EH, NORTH), s = face(cx, EH, SOUTH), e = face(EX1, 0, EAST);
  [n, s].forEach(function(g){ base(g, half, P0); eaves(g, half, ELOW); pil(g, half - .3, P0 + .26, ELOW - .2); stdWin(g, 0); });
  base(e, EH, P0); eaves(e, EH, ELOW); pil(e, -EH + .3, P0 + .26, ELOW - .2); pil(e, EH - .3, P0 + .26, ELOW - .2);
  gableEnd(e, EH, ELOW, ER, .42);
  gableRoof('x', EX0, EX1 + .42, EH, 0, ELOW, ER, M.roof, .42);
  [-1, 1].forEach(function(sd){ pipe(EX1 + .1, sd*(EH + .1), ELOW - .1); });
})();

/* ═══════════ DRUM · light blue, a square with broad cut corners: a pair of windows under little white gables on each of
   the four broad faces, the diagonal faces plain; green strips at every corner; cornice ═══════════ */
var DRUM0 = 7.4;
(function(){
  var a = DA, e = DE, c = 2*(a - e), dgl = e*Math.SQRT2;
  var shp = new THREE.Shape([V(-a + e, -a), V(a - e, -a), V(a, -a + e), V(a, a - e), V(a - e, a), V(-a + e, a), V(-a, a - e), V(-a, -a + e)]);
  var dg = add(new THREE.ExtrudeGeometry(shp, {depth: D1 - DRUM0, bevelEnabled: false}), M.wallL, DCX, D1, 0); dg.rotation.x = Math.PI/2;
  for (var i = 0; i < 4; i++){                                                      // broad faces
    var ang = i*Math.PI/2, g = new THREE.Group(); g.position.set(DCX + Math.sin(ang)*a, 0, Math.cos(ang)*a); g.rotation.y = ang; house.add(g);
    [-1, 1].forEach(function(sd){
      var x = sd*.42, y = 8.12, w = .54, h = 1.2;
      var sur = rectS(w + .16, y - .08, y + h + .08); sur.holes.push(rectS(w, y, y + h, true)); add(ext(sur, .05), M.trim, x, 0, 0, g);
      cut(g, x, function(){ return rectS(w, y, y + h); }, .2, M.glass, revealB);
      var fr = rectS(w, y, y + h); fr.holes.push(rectS(w - .08, y + .04, y + h - .04, true)); sunk(add(ext(fr, .03), M.sash, x, 0, -.17, g), 3);
      sunk(box(.03, h, .03, x, y, -.16, M.sash, g), 3); [.36, .68].forEach(function(k){ sunk(box(w, .03, .03, x, y + h*k, -.16, M.sash, g), 3); });
      var t = new THREE.Shape([V(-w/2 - .1, 0), V(w/2 + .1, 0), V(0, .34)]); t.holes.push(new THREE.Path([V(-w/2 + .05, .06), V(0, .25), V(w/2 - .05, .06)]));
      add(ext(t, .05), M.trim, x, y + h + .1, 0, g);
    });
    box(c - .2, .08, .05, 0, 7.96, .025, M.blueD, g); box(c - .2, .06, .05, 0, 9.78, .025, M.blueD, g);
    [-1, 1].forEach(function(sd){ box(.14, D1 - 7.8, .06, sd*(c/2 - .07), 7.8, .03, M.green, g); });
    var g2 = new THREE.Group(), a2 = ang + Math.PI/4, dd = (2*a - e)/Math.SQRT2;
    g2.position.set(DCX + Math.sin(a2)*dd, 0, Math.cos(a2)*dd); g2.rotation.y = a2; house.add(g2);
    [-1, 1].forEach(function(sd){ box(.14, D1 - 7.8, .06, sd*(dgl/2 - .07), 7.8, .03, M.green, g2); });
    box(dgl - .2, .08, .05, 0, 7.96, .025, M.blueD, g2); box(dgl - .2, .06, .05, 0, 9.78, .025, M.blueD, g2);
  }
  var cs = function(o, y, h, m){ var s2 = new THREE.Shape([V(-a + e, -a - o), V(a - e, -a - o), V(a + o, -a + e), V(a + o, a - e), V(a - e, a + o), V(-a + e, a + o), V(-a - o, a - e), V(-a - o, -a + e)]);
    var k = add(new THREE.ExtrudeGeometry(s2, {depth: h, bevelEnabled: false}), m, DCX, y + h, 0); k.rotation.x = Math.PI/2; };
  cs(.06, D1, .12, M.blueD); cs(.1, D1 + .12, .05, M.yellow); cs(.12, D1 + .17, .04, M.trim); cs(.15, D1 + .21, .1, M.blueD);
})();
/* ═══════════ ONION · eight facets with standing seams on the ribs; a broad bulb that swells out over the cornice and
   rounds off into a short neck (profile fitted to the S and SE views) ═══════════ */
var ON = {R: 1, H: 1,                                // radius (m, to the middle of a facet) at each height above the cornice, fitted with the real
  // perspective of the S, SE and NE cameras so the outline matches each photograph within 3–5 px
  prof: [[1.84, 0.0], [1.97, 0.08], [2.06, 0.2], [2.053, 0.4], [2.059, 0.6], [2.066, 0.8], [2.073, 1.0], [2.119, 1.2], [2.148, 1.4], [2.121, 1.6], [1.964, 1.8], [1.813, 2.0], [1.585, 2.2], [1.265, 2.4], [0.955, 2.6], [0.768, 2.8], [0.554, 3.0], [0.389, 3.2], [0.278, 3.38], [0.27, 3.42]]};
(function(){
  var y0 = D1 + .31, R = ON.R, H = ON.H, N = 8, k = 1/Math.cos(Math.PI/N);
  var pts = new THREE.SplineCurve(ON.prof.map(function(p){ return V(p[0]*R, p[1]*H); })).getPoints(64);
  var pos = [], nor = [];
  function pn(j){ var a = pts[Math.max(0, j - 1)], b = pts[Math.min(pts.length - 1, j + 1)]; var dr = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dr, dy); return [dy/l, -dr/l]; }
  for (var f = 0; f < N; f++){
    var a0 = Math.PI/N + f*2*Math.PI/N, a1 = a0 + 2*Math.PI/N, ac = (a0 + a1)/2;
    for (var j = 0; j < pts.length - 1; j++){
      var q = [[pts[j], a0], [pts[j], a1], [pts[j + 1], a1], [pts[j + 1], a0]].map(function(t){ return [DCX + Math.sin(t[1])*t[0].x*k, y0 + t[0].y, Math.cos(t[1])*t[0].x*k]; });
      var n0 = pn(j), n1 = pn(j + 1), nn = [[n0, a0], [n0, a1], [n1, a1], [n1, a0]].map(function(t){ var aa = ac + (t[1] - ac)*.35; return [Math.sin(aa)*t[0][0], t[0][1], Math.cos(aa)*t[0][0]]; });
      [0, 1, 2, 0, 2, 3].forEach(function(ix){ pos.push.apply(pos, q[ix]); nor.push.apply(nor, nn[ix]); });
    }
  }
  var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  add(geo, M.dome, 0, 0, 0);
  for (var i = 0; i < 8; i++){
    var an = Math.PI/8 + i*Math.PI/4, rib = pts.map(function(v){ return new THREE.Vector3(DCX + Math.sin(an)*(v.x*k + .02), y0 + v.y, Math.cos(an)*(v.x*k + .02)); });
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rib), 64, .025, 5, false), M.domeS, 0, 0, 0);
  }
  var ring = add(new THREE.CylinderGeometry(R*ON.prof[0][0]*k + .04, R*ON.prof[0][0]*k + .04, .1, N), M.dome, DCX, y0 + .05, 0); ring.rotation.y = Math.PI/N;
  lantern(DCX, 0, y0 + 3.38, .27, .62, .3, .46, .85, true);
})();
var TX0_ = TX0;

/* ═══════════ PAVING · pink-grey pavers round the church and the paths to the three porches ═══════════ */
(function(){
  function pave(x0, x1, z0, z1){ boxX(x0, x1, 0, .03, z0, z1, M.pave); }
  var m = 1.1;
  pave(TX0 - m, EX1 + m, -RH - m, RH + m);
  pave(NX0 - m, NX1 + m, -NH - m, NH + m);
  pave(AX0 - m, AX1 + m, -AH - m, AH + m);
  pave(TX0 - 6.5, TX0 - m, -1.7, 1.7);
  pave(ACX - 1.8, ACX + 1.8, AH + m, AH + 5); pave(ACX - 1.8, ACX + 1.8, -AH - 5, -AH - m);
})();


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
  geos.forEach(function(g){ g.dispose(); });
  root.children.slice().forEach(function(c){ if (!c.isMesh && c.children.length === 0) root.remove(c); });
})(house);

/* ═══════════ GROUND · a turntable engraved with the name ═══════════ */
var GX = 7.6, GZ = 0;
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
    arc('СВЯТО-МИКОЛАЇВСЬКА  ЦЕРКВА', -Math.PI/2, true, fs*.22);
    arc('ДУБРОВИЦЯ', Math.PI/2, false, fs*.22);
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
sun.position.set(-38, 50, 40); sun.target.position.set(GX, 6, GZ);
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
flood([-20, .3, -7], [-4, 5, -1.5], .38, 3.4); flood([-20, .3, 7], [-4, 5, 1.5], .38, 3.4); flood([-22, .3, 0], [-2, 12, 0], .2, 3.2);
flood([10.7, .3, 30], [10.7, 5, 8], .6, 3.4); flood([10.7, .3, -30], [10.7, 5, -8], .6, 3.0); flood([40, .3, 0], [19.6, 4.5, 0], .6, 2.4);
flood([10.7, .3, 26], [10.7, 11.5, 0], .22, 3.2); flood([10.7, .3, -26], [10.7, 11.5, 0], .22, 2.6);
var portLamp = new THREE.PointLight('#ffc27a', 0, 9, 2); portLamp.position.set(TX0 - 1.2, 2.8, 0); portLamp.userData.i = 2.0; scene.add(portLamp); NL.points.push(portLamp);
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
controls.target.set(GX, o.targetY || 7.0, GZ);
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
  var t = Math.tan(camera.fov*Math.PI/360), dist = Math.max(16.5/t, 18.5/(t*camera.aspect))*o.fit;
  return controls.target.clone().addScaledVector(viewDir, dist);
}
function resize(){
  var w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w/h;
  camera.fov = w/h < 1 ? 50 : 40;
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
  renderer: renderer, camera: camera, controls: controls, scene: scene,
  zoomIn: function(){ zoomBy(1/1.35); }, zoomOut: function(){ zoomBy(1.35); },
  reset: function(){ touched = false; moveTo(home()); },
  autoRotate: function(on){ if (on === undefined) return controls.autoRotate; controls.autoRotate = !!on; return controls.autoRotate; },
  snapshot: function(){ renderer.render(scene, camera); return canvas.toDataURL('image/png'); },
  view: function(side){ var D = {west: [-1, .18, 0], south: [0, .18, 1], east: [1, .18, 0], north: [0, .18, -1], sw: [-1, .3, .85], ne: [1, .3, -.85], top: [-.25, 1.6, .35]}; viewFrom(D[side] || D.sw); },
  /* model-space directions of geographic east and north (x, z): the bell tower stands to the west, the altar to the east */
  compass: {east: [1, 0], north: [0, -1]},
  light: setLight
};
return api;
}
})();
