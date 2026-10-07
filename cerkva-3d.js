/* Церква Різдва Пресвятої Богородиці в Дубровиці (1861) — 3D-модель за фотографіями: архівними 1930-х і 1960-х
   років, сучасними та знімком згори. Вигляд після реставрації: блакитні стіни, білий декор, сірі шатра, золоті бані.
   Використання:  Cerkva3D.mount(canvas, {autoRotate, zoom, touch, view, ...}).then(function(api){ ... })
   Бібліотека three.js r147 підвантажується з three-r147.js лише тоді, коли модель справді показують.
   Осі: x — із заходу (−) на схід (+), z — на південь (+), y — вгору; метри. */
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
  o = Object.assign({autoRotate:true, autoRotateSpeed:.45, zoom:true, touch:'none', view:[-50, 15, 46], fit:1, pixelRatio:2, shadow:2048,
                     turntable:true, motes:false, onReady:null, onFail:null, onStart:null}, o || {});
  if (!supported()){ if (o.onFail) o.onFail('webgl'); return Promise.resolve(null); }
  return Promise.all([load(), fonts()]).then(function(){ return build(canvas, o); }, function(){ if (o.onFail) o.onFail('load'); return null; });
}
window.Cerkva3D = {mount: mount, load: load, supported: supported};

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

/* ── a soft sky for the gilded domes and the glass to reflect ── */
var envTex = (function(){
  var es = new THREE.Scene(), g = new THREE.SphereGeometry(50, 32, 16), col = [], p = g.attributes.position, c = new THREE.Color();
  var top = new THREE.Color('#8fb8e3'), hor = new THREE.Color('#f4e6c8'), low = new THREE.Color('#5b4a33');
  for (var i = 0; i < p.count; i++){ var y = p.getY(i)/50; if (y > 0) c.copy(hor).lerp(top, Math.pow(y, .6)); else c.copy(hor).lerp(low, Math.min(1, -y*3)); col.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  es.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({vertexColors: true, side: THREE.BackSide})));
  var sunDisc = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 8), new THREE.MeshBasicMaterial({color: new THREE.Color(6, 5.4, 4.2)}));
  sunDisc.position.set(-28, 30, 20); es.add(sunDisc);
  var pm = new THREE.PMREMGenerator(renderer), t = pm.fromScene(es, .03).texture; pm.dispose();
  return t;
})();

/* ── materials: the church after the restoration — sky-blue walls, white details, grey roofs, gilded domes ── */
function canvasTex(w, h, draw){ var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; }
function rep(t, u, v){ t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(u, v); return t; }
function mat(c, o){ return new THREE.MeshStandardMaterial(Object.assign({color:c, roughness:.9, metalness:0}, o||{})); }
function rnd(seed){ var s = seed; return function(){ s = (s*16807) % 2147483647; return (s - 1)/2147483646; }; }

var stucco = rep(canvasTex(256, 256, function(k){
  k.fillStyle = '#ffffff'; k.fillRect(0, 0, 256, 256);
  var r = rnd(3); for (var i = 0; i < 2600; i++){ var v = 236 + Math.floor(r()*20); k.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',.35)'; var w = 2 + r()*10; k.fillRect(r()*256, r()*256, w, w*(.4 + r())); }
  for (i = 0; i < 40; i++){ k.fillStyle = 'rgba(200,205,210,.08)'; k.beginPath(); k.arc(r()*256, r()*256, 10 + r()*40, 0, Math.PI*2); k.fill(); }
}), 1/3, 1/3);
stucco.encoding = THREE.sRGBEncoding;
var M = {
  wall:  mat('#4ea3dd', {roughness:.92, map: stucco}),
  trim:  mat('#f2f3ef', {roughness:.85, map: stucco}),
  plinth:mat('#9b9d98', {roughness:.95}),
  step:  mat('#b3b3ad', {roughness:.95}),
  gold:  mat('#e3b043', {roughness:.26, metalness:1, envMap: envTex, envMapIntensity: 1.25}),
  goldD: mat('#c8962f', {roughness:.32, metalness:1, envMap: envTex, envMapIntensity: 1.1}),
  glass: mat('#273644', {roughness:.12, metalness:.3, envMap: envTex, envMapIntensity: .9}),
  dark:  mat('#2a2d31', {roughness:.6, metalness:.4}),
  teal:  mat('#3d8f86', {roughness:.7}),
  neck:  mat('#7cc0e8', {roughness:.8})
};
/* standing-seam metal for the low roofs: a seam every half metre */
M.roof = mat('#bcc4cb', {roughness:.62, metalness:.25, envMap: envTex, envMapIntensity: .12});
M.roof.map = rep(canvasTex(128, 128, function(k){
  k.fillStyle = '#8f99a2'; k.fillRect(0, 0, 128, 128);
  var r = rnd(7); for (var i = 0; i < 900; i++){ k.fillStyle = 'rgba(' + (r() > .5 ? '255,255,255' : '0,0,0') + ',' + (.02 + r()*.03) + ')'; k.fillRect(r()*128, r()*128, 2, 2 + r()*6); }
  k.fillStyle = '#b6bec5'; k.fillRect(0, 0, 4, 128); k.fillStyle = '#6d757c'; k.fillRect(4, 0, 2, 128);
  k.fillStyle = '#b6bec5'; k.fillRect(64, 0, 4, 128); k.fillStyle = '#6d757c'; k.fillRect(68, 0, 2, 128);
}), 1, 1);
/* slate shingles of the tent roofs: small diamonds laid in staggered rows, as on the photographs */
M.slate = mat('#ffffff', {roughness:.7, metalness:.1, envMap: envTex, envMapIntensity: .25});
M.slate.map = rep(canvasTex(256, 256, function(k){
  k.fillStyle = '#5f6b77'; k.fillRect(0, 0, 256, 256);
  var r = rnd(11), w = 32, h = 32;
  for (var row = -1; row < 9; row++) for (var cl = -1; cl < 9; cl++){
    var cx = cl*w + (row % 2 ? w/2 : 0), cy = row*h + h/2, g = 112 + Math.floor(r()*26) - 13;
    k.fillStyle = 'rgb(' + (g - 6) + ',' + (g + 4) + ',' + (g + 16) + ')';
    k.beginPath(); k.moveTo(cx, cy - h*.62); k.lineTo(cx + w/2 - 1, cy); k.lineTo(cx, cy + h*.62); k.lineTo(cx - w/2 + 1, cy); k.closePath(); k.fill();
    k.strokeStyle = 'rgba(30,36,44,.55)'; k.lineWidth = 1.4; k.stroke();
  }
}), 1/.9, 1/.9);
/* wooden louvres of the belfry openings */
M.louv = mat('#ffffff', {roughness:.8});
M.louv.map = rep(canvasTex(32, 64, function(k){
  k.fillStyle = '#3a2416'; k.fillRect(0, 0, 32, 64);
  var g = k.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, '#8a5a35'); g.addColorStop(.7, '#6a4126'); g.addColorStop(1, '#3a2416');
  k.fillStyle = g; k.fillRect(0, 4, 32, 52);
}), 1, 1/.13);
/* the blue double doors: raised panels and the round medallions seen on the south door */
M.door = mat('#ffffff', {roughness:.6});
M.door.map = canvasTex(256, 384, function(k){
  k.fillStyle = '#2f79bf'; k.fillRect(0, 0, 256, 384);
  [[10, 118], [138, 246]].forEach(function(L){
    var x0 = L[0], x1 = L[1];
    k.strokeStyle = '#1f5c96'; k.lineWidth = 5; k.strokeRect(x0 + 8, 18, x1 - x0 - 16, 110); k.strokeRect(x0 + 8, 150, x1 - x0 - 16, 216);
    k.strokeStyle = '#5c9ad2'; k.lineWidth = 2; k.strokeRect(x0 + 13, 23, x1 - x0 - 26, 100); k.strokeRect(x0 + 13, 155, x1 - x0 - 26, 206);
    k.beginPath(); k.arc((x0 + x1)/2, 258, 30, 0, Math.PI*2); k.strokeStyle = '#1f5c96'; k.lineWidth = 5; k.stroke();
    k.beginPath(); k.arc((x0 + x1)/2, 258, 16, 0, Math.PI*2); k.stroke();
  });
  k.fillStyle = '#123e66'; k.fillRect(126, 0, 4, 384);
  k.fillStyle = '#c9a64a'; k.fillRect(112, 196, 6, 26); k.fillRect(138, 196, 6, 26);
});

function add(geo, m, x, y, z, parent){ var o = new THREE.Mesh(geo, m); o.position.set(x||0, y||0, z||0); o.castShadow = o.receiveShadow = true; (parent||church).add(o); return o; }
var church = new THREE.Group(); scene.add(church);
function box(w, h, d, x, y, z, m, parent){ return add(new THREE.BoxGeometry(w, h, d), m, x, y + h/2, z, parent); }
function boxX(x0, x1, y0, y1, z0, z1, m, parent){ return box(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), (x0 + x1)/2, Math.min(y0, y1), (z0 + z1)/2, m, parent); }
/* face-local group: x across the face (to the right seen from outside), y up, +z out of the wall */
function face(x, z, rotY){ var g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rotY||0; church.add(g); return g; }
var S_ = 0, E_ = Math.PI/2, N_ = Math.PI, W_ = -Math.PI/2;
function ext(shape, depth, seg){ return new THREE.ExtrudeGeometry(shape, {depth:depth, bevelEnabled:false, curveSegments:seg||20}); }
function V(x, y){ return new THREE.Vector2(x, y); }
function poly(pts, path){ var s = path ? new THREE.Path() : new THREE.Shape(); s.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(function(p){ s.lineTo(p[0], p[1]); }); s.lineTo(pts[0][0], pts[0][1]); return s; }
function archS(w, yb, yc, path){ var r = w/2, s = path ? new THREE.Path() : new THREE.Shape(); s.moveTo(-r, yb); s.lineTo(r, yb); s.lineTo(r, yc); s.absarc(0, yc, r, 0, Math.PI, false); s.lineTo(-r, yb); return s; }
function rectS(w, yb, yt, path){ return poly([[-w/2, yb], [w/2, yb], [w/2, yt], [-w/2, yt]], path); }
function circS(r, path){ var s = path ? new THREE.Path() : new THREE.Shape(); s.absarc(0, 0, r, 0, Math.PI*2, !!path); return s; }
function ringS(r0, r1){ var s = circS(r1); s.holes.push(circS(r0, true)); return s; }
/* a mesh with explicit positions and uvs (metres) */
function geo(pos, uv, idx){ var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); if (idx) g.setIndex(idx); g.computeVertexNormals(); return g; }
/* a flat quad a-b-c-d (counter-clockwise seen from outside), u along a→b, v along a→d */
function quad(a, b, c, d, m, parent){
  var A = new THREE.Vector3().fromArray(a), B = new THREE.Vector3().fromArray(b), C = new THREE.Vector3().fromArray(c), D = new THREE.Vector3().fromArray(d);
  var ux = B.clone().sub(A), L = ux.length(); ux.normalize();
  var nrm = B.clone().sub(A).cross(D.clone().sub(A)).normalize(), vy = nrm.clone().cross(ux);
  function uv(P){ var q = P.clone().sub(A); return [q.dot(ux), q.dot(vy)]; }
  return add(geo([].concat(a, b, c, d), [].concat(uv(A), uv(B), uv(C), uv(D)), nrm.y >= 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]), m, 0, 0, 0, parent);
}
function tri(a, b, c, m, parent){
  var A = new THREE.Vector3().fromArray(a), B = new THREE.Vector3().fromArray(b), C = new THREE.Vector3().fromArray(c);
  var ux = B.clone().sub(A).normalize(), nrm = B.clone().sub(A).cross(C.clone().sub(A)).normalize(), vy = nrm.clone().cross(ux);
  function uv(P){ var q = P.clone().sub(A); return [q.dot(ux), q.dot(vy)]; }
  return add(geo([].concat(a, b, c), [].concat(uv(A), uv(B), uv(C)), [0, 1, 2]), m, 0, 0, 0, parent);
}
/* a round bar between two points */
function rod(a, b, r, m, parent){
  var A = new THREE.Vector3().fromArray(a), B = new THREE.Vector3().fromArray(b), d = B.clone().sub(A);
  var o = add(new THREE.CylinderGeometry(r, r, d.length(), 8), m, (A.x + B.x)/2, (A.y + B.y)/2, (A.z + B.z)/2, parent);
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return o;
}

/* ── openings cut into solid walls at draw time: a mask resets the depth inside the outline,
      then the reveals and whatever sits in the opening are drawn into it ── */
var holeStencil = new THREE.MeshBasicMaterial({colorWrite: false, depthWrite: false, stencilWrite: true, stencilRef: 1,
  stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp});
var holeDepth = new THREE.ShaderMaterial({
  vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w * 0.999999; }',
  fragmentShader: 'void main(){ gl_FragColor = vec4(0.0); }',
  colorWrite: false, depthWrite: true, depthFunc: THREE.AlwaysDepth,
  stencilWrite: true, stencilRef: 1, stencilFunc: THREE.EqualStencilFunc, stencilZPass: THREE.KeepStencilOp
});
var revealW = mat('#eef0ec', {side: THREE.BackSide}), revealB = mat('#4f9fd4', {side: THREE.BackSide});
function sunk(o, order){ o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; return o; }
/* cut an opening of any outline (shape in face-local coords) and line it */
function hole(g, shapeFn, x, y, depth, revealM, zf){
  zf = zf || 0;
  var hg = new THREE.ShapeGeometry(shapeFn(), 32);
  [holeStencil, holeDepth].forEach(function(hm, i){ var m = new THREE.Mesh(hg, hm); m.position.set(x, y, zf + .02); m.renderOrder = 1 + i; m.frustumCulled = false; g.add(m); });
  sunk(add(ext(shapeFn(), depth, 32), revealM || revealW, x, y, zf - depth, g), 3);
}
/* arched or square window with a white surround, sill, glazing bars */
function win(g, x, y, w, h, arched, fw, bars, glassMat, depth, opt){
  fw = fw || .2; depth = depth || .35; opt = opt || {};
  var yc = y + h - w/2;
  function opening(path){ return arched ? archS(w, y, yc, path) : rectS(w, y, y + h, path); }
  var frameM = opt.frame === undefined ? M.trim : opt.frame, sillM = opt.sill === undefined ? M.trim : opt.sill;
  if (frameM){ var sh = arched ? archS(w + 2*fw, y - fw*.6, yc) : rectS(w + 2*fw, y - fw*.6, y + h + fw); sh.holes.push(opening(true)); add(ext(sh, .07), frameM, x, 0, 0, g); }
  if (sillM) box(w + 2*fw + .12, .09, .22, x, y - fw*.6 - .09, .11, sillM, g);
  hole(g, function(){ return opening(); }, x, 0, depth, opt.reveal || revealW);
  sunk(add(new THREE.ShapeGeometry(opening(), 24), glassMat || M.glass, x, 0, -depth + .03, g), 3);
  if (!bars) return;
  var zb = -depth + .05, f = .06, b = .04, top = arched ? yc : y + h, sashM = opt.sash || M.trim;
  var frame = arched ? archS(w, y, yc) : rectS(w, y, y + h);
  frame.holes.push(arched ? archS(w - 2*f, y + f, yc, true) : rectS(w - 2*f, y + f, y + h - f, true));
  sunk(add(ext(frame, .05, 24), sashM, x, 0, zb, g), 3);
  sunk(box(b, (arched ? yc + w/2 : top) - y - 2*f, .05, x, y + f, zb, sashM, g), 3);
  var tr = Array.isArray(bars) ? bars : Array.from({length: bars - 1}, function(_, i){ return (i + 1)/bars; });
  if (arched) tr = tr.concat([1]);
  tr.forEach(function(t){ sunk(box(w - 2*f, b, .05, x, y + (top - y)*t - b/2, zb, sashM, g), 3); });
  if (arched){ [-.55, .55].forEach(function(a){ var r = w/2 - f; sunk(box(b, r, .05, x + Math.sin(a)*r/2, yc + Math.cos(a)*r/2 - r/2, zb, sashM, g), 3).rotation.z = -a; }); }
}
/* raised moulding round a flat panel */
function panel(g, x, y, w, h, t, d){
  t = t || .13; var s = rectS(w, y, y + h); s.holes.push(rectS(w - 2*t, y + t, y + h - t, true));
  add(ext(s, d || .06), M.trim, x, 0, 0, g);
}
/* horizontal entablature piece on a face: architrave band + projecting cornice */
function belt(g, x0, x1, y, zf, big){
  var a = big ? .22 : .16, c = big ? .3 : .22;
  boxX(x0, x1, y, y + a, zf - .1, zf + .06, M.trim, g);
  boxX(x0 - .06, x1 + .06, y + a, y + a + c, zf - .1, zf + (big ? .3 : .22), M.trim, g);
}
/* raking cornices of a pediment on a face: from (±hw, yb) up to (0, yb + rise) */
function rakes(g, hw, yb, rise, zf, th, dp){
  th = th || .3; dp = dp || .45;
  var a = Math.atan2(rise, hw), L = Math.hypot(hw, rise) + .16;
  [-1, 1].forEach(function(s){
    var b = box(L, th, dp, s*hw/2, yb + rise/2 - th/2 + .04, zf + dp/2 - .12, M.trim, g); b.rotation.z = -s*a;
  });
}
/* round window with a white ring and a cross in the glass */
var oculusTex = canvasTex(256, 256, function(k){
  var g = k.createRadialGradient(128, 110, 10, 128, 128, 128); g.addColorStop(0, '#bfe0f5'); g.addColorStop(1, '#5d9fcc');
  k.fillStyle = g; k.fillRect(0, 0, 256, 256);
  k.fillStyle = '#a5322b'; k.save(); k.translate(128, 128);
  for (var i = 0; i < 4; i++){ k.rotate(Math.PI/2); k.beginPath(); k.moveTo(-14, 0); k.lineTo(-24, 66); k.quadraticCurveTo(0, 54, 24, 66); k.lineTo(14, 0); k.closePath(); k.fill(); }
  k.beginPath(); k.arc(0, 0, 18, 0, Math.PI*2); k.fill(); k.restore();
});
function oculus(g, x, y, r, zf){
  add(ext(ringS(r - .02, r + .22), .14, 40), M.trim, x, y, zf, g);
  add(ext(ringS(r + .22, r + .3), .06, 40), M.trim, x, y, zf, g);
  hole(g, function(){ return circS(r); }, x, y, .25, revealW, zf);
  var t = oculusTex.clone(); t.needsUpdate = true; t.repeat.set(1/(2*r), 1/(2*r)); t.offset.set(.5, .5);
  sunk(add(new THREE.ShapeGeometry(circS(r), 40), mat('#ffffff', {map: t, roughness: .2, envMap: envTex, envMapIntensity: .5}), x, y, zf - .22, g), 3);
}
/* Orthodox cross: top plate, main bar, slanted footrest (raised to the north), facing west; an optional crescent */
function cross(x, y, z, h, crescent){
  var gr = new THREE.Group(); gr.position.set(x, y, z); gr.rotation.y = W_; church.add(gr);
  var t = h*.045;
  box(t, h, t, 0, 0, 0, M.gold, gr);
  box(h*.3, t, t, 0, h*.86, 0, M.gold, gr);
  box(h*.52, t*1.1, t, 0, h*.68, 0, M.gold, gr);
  box(h*.34, t, t, 0, h*.27, 0, M.gold, gr).rotation.z = -.42;
  [[0, h + t*.6], [-h*.26, h*.68 + t*.55], [h*.26, h*.68 + t*.55], [-h*.15, h*.86 + t*.5], [h*.15, h*.86 + t*.5]].forEach(function(p){ add(new THREE.SphereGeometry(t*.9, 10, 8), M.gold, p[0], p[1], 0, gr); });
  if (crescent){ var c = new THREE.Shape(); c.absarc(0, 0, h*.2, Math.PI*1.08, Math.PI*1.92, false); c.absarc(0, h*.06, h*.17, Math.PI*1.86, Math.PI*1.14, true); add(ext(c, t*.8, 16), M.gold, 0, h*.2, -t*.4, gr); }
}
/* octagonal prism (faces looking ±x, ±z and the diagonals) and an octagonal tent */
var C8 = Math.cos(Math.PI/8), T8 = Math.tan(Math.PI/8);
function octS(a){ var R = a/C8, p = []; for (var i = 0; i < 8; i++){ var t = Math.PI/8 + i*Math.PI/4; p.push([R*Math.cos(t), R*Math.sin(t)]); } return poly(p); }
function octPrism(a, y0, y1, m, cx, cz){ var o = add(ext(octS(a), y1 - y0, 1), m, cx, y0, cz); o.rotation.x = -Math.PI/2; return o; }
function octVert(a, i, y, cx, cz){ var R = a/C8, t = Math.PI/8 + i*Math.PI/4; return [cx + R*Math.cos(t), y, cz - R*Math.sin(t)]; }
function tent(a0, y0, a1, y1, m, cx, cz){
  for (var i = 0; i < 8; i++){
    var j = (i + 1) % 8;
    quad(octVert(a0, j, y0, cx, cz), octVert(a0, i, y0, cx, cz), octVert(a1, i, y1, cx, cz), octVert(a1, j, y1, cx, cz), m);
    rod(octVert(a0 + .04, i, y0 + .03, cx, cz), octVert(a1 + .02, i, y1, cx, cz), .055, M.roof);
  }
}
function apron(cx, cz, h, y, a, ya, m){
  var R = a/C8;
  for (var i = 0; i < 8; i++){
    var t0 = Math.PI/8 + i*Math.PI/4, t1 = t0 + Math.PI/4;
    function sq(t){ var c = Math.cos(t), s = -Math.sin(t), k = h/Math.max(Math.abs(c), Math.abs(s)); return [cx + c*k, y, cz + s*k]; }
    var pts = [[cx + R*Math.cos(t0), ya, cz - R*Math.sin(t0)], sq(t0)];
    var mid = (t0 + t1)/2; if (Math.abs(Math.cos(mid)) > .5 && Math.abs(Math.sin(mid)) > .5) pts.push(sq(mid));
    pts.push(sq(t1), [cx + R*Math.cos(t1), ya, cz - R*Math.sin(t1)]);
    for (var j = 1; j < pts.length - 1; j++) quad(pts[0], pts[j], pts[j + 1], pts[j + 1], m);
  }
}
/* the 8 face groups of an octagon: k = 0 east, 2 north, 4 west, 6 south … */
function octFaces(a, cx, cz){ var f = []; for (var i = 0; i < 8; i++){ var th = Math.PI/2 + i*Math.PI/4; f.push({g: face(cx + a*Math.sin(th), cz + a*Math.cos(th), th), cardinal: i % 2 === 0, i: i}); } return f; }
/* gilded onion dome on a blue neck */
function smooth(list, n){ var c = new THREE.CatmullRomCurve3(list.map(function(p){ return new THREE.Vector3(p[0], p[1], 0); }), false, 'centripetal'); return c.getPoints(n).map(function(v){ return V(Math.max(0, v.x), v.y); }); }
var ONION = [[.6,0],[.7,.08],[.86,.22],[.99,.45],[1.02,.66],[.95,.92],[.76,1.2],[.5,1.48],[.26,1.74],[.11,1.95],[.06,2.06],[0,2.1]];
var neckTex = canvasTex(128, 256, function(k){
  k.fillStyle = '#4f9fd4'; k.fillRect(0, 0, 128, 256);
  k.fillStyle = '#d9a83c'; k.fillRect(0, 0, 128, 22); k.fillRect(0, 234, 128, 22);
  k.strokeStyle = '#e3b043'; k.lineWidth = 9; k.lineJoin = 'miter';
  k.beginPath(); k.moveTo(-4, 60); k.lineTo(32, 196); k.lineTo(64, 60); k.lineTo(96, 196); k.lineTo(132, 60); k.stroke();
  k.fillStyle = '#e3b043'; [[32, 70], [96, 70]].forEach(function(p){ k.beginPath(); k.moveTo(p[0], p[1]); k.lineTo(p[0] + 14, p[1] + 26); k.lineTo(p[0], p[1] + 52); k.lineTo(p[0] - 14, p[1] + 26); k.closePath(); k.fill(); });
});
/* gilded onion on an octagonal neck decorated with a zigzag, as on the archival photographs */
function dome(cx, cz, yb, a, r, crossH, crescent, nh){
  nh = nh || a*1.25;
  octPrism(a + .08, yb, yb + .16, M.gold, cx, cz);
  var t = neckTex.clone(); t.needsUpdate = true; t.wrapS = THREE.RepeatWrapping; t.repeat.set(8, 1);
  var nk = add(new THREE.CylinderGeometry(a/C8, a/C8, nh - .3, 8, 1, true), mat('#ffffff', {map: t, roughness: .5, metalness: .2, envMap: envTex, envMapIntensity: .4}), cx, yb + .16 + (nh - .3)/2, cz);
  nk.rotation.y = Math.PI/8;
  octPrism(a + .1, yb + nh - .14, yb + nh, M.gold, cx, cz);
  var y = yb + nh;
  octPrism(a + .18, y, y + .06, M.goldD, cx, cz);
  add(new THREE.LatheGeometry(smooth(ONION.map(function(p){ return [p[0]*r, p[1]*r]; }), 40), 32), M.gold, cx, y + .04, cz);
  y += 2.1*r;
  add(new THREE.CylinderGeometry(.04*r + .02, .07*r + .03, .25*r, 10), M.gold, cx, y + .1*r, cz);
  add(new THREE.SphereGeometry(.11*r + .03, 14, 10), M.gold, cx, y + .25*r, cz);
  cross(cx, y + .3*r, cz, crossH, crescent);
}
/* dormer on a tent face: white front with a small window, a slate gablet running back into the roof */
function dormer(g, y, w, h, d, bars){
  box(w, h, d, 0, y, -d/2, M.trim, g);
  win(g, 0, y + h*.16, w*.56, h*.66, false, .05, bars || 0, M.glass, .12, {frame: M.teal, sill: null, sash: M.teal});
  var r = h*.55, gs = poly([[-w/2 - .1, 0], [w/2 + .1, 0], [0, r]]);
  add(ext(gs, d + .04), M.slate, 0, y + h, -d, g);
  add(ext(poly([[-w/2 + .02, .02], [w/2 - .02, .02], [0, r - .07]]), .02), M.trim, 0, y + h, .05, g);
}

/* ═══════════ DIMENSIONS (metres) — proportions measured on the archival photographs (1930s, 1960s) and on the frontal
   photographs of the 2010s–2020s; details (lesenes, cornices, frames) traced facade by facade.
   naos 15 × 15 m, eaves 11.8 m; drum a chamfered octagon 9.2 m across (wide faces with the arcades, narrow corner faces);
   porch 7 × 13 m in two tiers; the bell tower a chamfered octagon 6 m across on a square base;
   sanctuary 7.6 × 7.6 m with an attic band under the eaves */
var NH = 7.5, PL = .6;
var WX0 = -21.2, WX1 = -15.0, WH = 6.5, WC = -18.1;       // porch (6.2 m deep, measured on the 1930s photograph)
var BX = -16.6, BQ = 3.6;                                // the bell tower's square body: its east part stands proud of the porch
var TX1 = BX + BQ;                                       // east face of the tower body; the link runs from here to the naos
var LX1 = -7.5, LH = 4.6;                                // link
var EX1 = 14.2, EH = 4.1;                                // sanctuary
var DS = Math.SQRT2;

/* ── chamfered octagon: faces i = 0..7 look E, NE, N, NW, W, SW, S, SE; the cardinal faces stand at distance A,
      the corner faces are cut off with legs c (c = A(2 − √2) gives a regular octagon) ── */
function chfGrow(P, d){ return {A: P.A + d, c: P.c + d*(2 - DS)}; }
function chfReg(a){ return {A: a, c: a*(2 - DS)}; }
function chfApo(P, i){ return i % 2 ? (2*P.A - P.c)/DS : P.A; }
function chfLen(P, i){ return i % 2 ? P.c*DS : 2*(P.A - P.c); }
function chfDir(i){ var th = Math.PI/2 + i*Math.PI/4; return [Math.sin(th), Math.cos(th), th]; }
function chfVert(P, i){
  var a = chfDir(i), b = chfDir((i + 1) % 8), pa = chfApo(P, i), pb = chfApo(P, (i + 1) % 8), det = a[0]*b[1] - a[1]*b[0];
  return [(pa*b[1] - pb*a[1])/det, (a[0]*pb - b[0]*pa)/det];
}
function chfPts(P){ var p = []; for (var i = 0; i < 8; i++) p.push(chfVert(P, i)); return p; }
function chfPrism(P, y0, y1, m, cx, cz){ var o = add(ext(poly(chfPts(P).map(function(v){ return [v[0], -v[1]]; })), y1 - y0, 1), m, cx || 0, y0, cz || 0); o.rotation.x = -Math.PI/2; return o; }
function chfFaces(P, cx, cz){ var f = []; for (var i = 0; i < 8; i++){ var d = chfDir(i), a = chfApo(P, i); f.push({g: face((cx || 0) + a*d[0], (cz || 0) + a*d[1], d[2]), cardinal: i % 2 === 0, i: i, len: chfLen(P, i), apo: a, dir: d}); } return f; }
function chfTent(P0, y0, P1, y1, m, cx, cz){
  var b = chfPts(P0), t = chfPts(P1);
  for (var k = 0; k < 8; k++){
    var j = (k + 1) % 8;
    quad([cx + b[k][0], y0, cz + b[k][1]], [cx + b[j][0], y0, cz + b[j][1]], [cx + t[j][0], y1, cz + t[j][1]], [cx + t[k][0], y1, cz + t[k][1]], m);
    rod([cx + b[k][0]*1.012, y0 + .03, cz + b[k][1]*1.012], [cx + t[k][0], y1, cz + t[k][1]], .055, M.roof);
  }
}
function triU(a, b, c, m){
  var A = new THREE.Vector3().fromArray(a), B = new THREE.Vector3().fromArray(b), C = new THREE.Vector3().fromArray(c);
  if (B.clone().sub(A).cross(C.clone().sub(A)).y < 0){ var t = b; b = c; c = t; }
  return tri(a, b, c, m);
}
/* sloping skirt from a square of half-side h (at y) up to a chamfered octagon (at ya) */
function apronChf(cx, cz, h, y, P, ya, m){
  var v = chfPts(P);
  function sq(p){ var k = h/Math.max(Math.abs(p[0]), Math.abs(p[1])); return [cx + p[0]*k, y, cz + p[1]*k]; }
  for (var k = 0; k < 8; k++){
    var j = (k + 1) % 8, p = v[k], q = v[j], t0 = [cx + p[0], ya, cz + p[1]], t1 = [cx + q[0], ya, cz + q[1]], a = sq(p), b = sq(q);
    if ((k + 1) % 2){ var d = chfDir((k + 1) % 8), cor = [cx + Math.sign(Math.round(d[0]*10))*h, y, cz + Math.sign(Math.round(d[1]*10))*h];
      triU(t0, a, cor, m); triU(t0, cor, t1, m); triU(t1, cor, b, m); }
    else { triU(t0, a, b, m); triU(t0, b, t1, m); }
  }
}

/* ── facade vocabulary: lesenes (shallow blue pilasters outlined in white), plain white frames, cornices ── */
function frameR(g, x, y0, w, h, z, t){
  t = t || .09; var sh = rectS(w, y0, y0 + h); sh.holes.push(rectS(w - 2*t, y0 + t, y0 + h - t, true));
  add(ext(sh, .045), M.trim, x, 0, z || 0, g);
}
function lesene(g, x0, x1, y0, y1, zf, d, noFrame, noBase){
  d = d || .12;
  boxX(x0, x1, y0, y1, zf - .02, zf + d, M.wall, g);
  if (!noBase) boxX(x0 - .03, x1 + .03, y0, y0 + .3, zf - .02, zf + d + .04, M.trim, g);
  if (!noFrame) frameR(g, (x0 + x1)/2, y0 + (noBase ? .2 : .45), Math.abs(x1 - x0) - .14, y1 - y0 - (noBase ? .4 : .62), zf + d, .085);
}
/* the two-storey entablature between the tiers: a band (with capitals over the lesenes), a frieze, a projecting cornice */
function midEntab(g, x0, x1, y, zf, out){
  out = out || 0;
  boxX(x0, x1, y, y + .22, zf - .05, zf + .1 + out, M.trim, g);
  boxX(x0, x1, y + .22, y + .62, zf - .05, zf + out + .02, M.wall, g);
  boxX(x0 - .03, x1 + .03, y + .62, y + .76, zf - .05, zf + .14 + out, M.trim, g);
  boxX(x0 - .06, x1 + .06, y + .76, y + .94, zf - .05, zf + .3 + out, M.trim, g);
  boxX(x0 - .08, x1 + .08, y + .94, y + 1.04, zf - .05, zf + .38 + out, M.trim, g);
  return y + 1.04;
}
/* a corner lesene wrapped round both faces; with a band level it is split into two storeys under the mid entablature */
function cornerBlock(cx, cz, sx, sz, y0, y1, w, band){
  w = w || 1.0;
  [face(cx + sx*.0, cz - sz*w/2, sx > 0 ? E_ : W_), face(cx - sx*w/2, cz + sz*.0, sz > 0 ? S_ : N_)].forEach(function(g){
    if (!band){ lesene(g, -w/2, w/2, y0, y1, 0, .12); return; }
    lesene(g, -w/2, w/2, y0, band, 0, .12);
    boxX(-w/2, w/2, band, band + 1.04, -.02, .12, M.wall, g);
    midEntab(g, -w/2, w/2, band, 0, .12);
    lesene(g, -w/2, w/2, band + 1.04, y1, 0, .12, false, true);
  });
}
/* the eaves entablature as a piece on one face (used where it breaks forward over a lesene) */
function entabPiece(g, x0, x1, y, zf){
  boxX(x0, x1, y, y + .2, zf - .05, zf + .14, M.trim, g); y += .2;
  boxX(x0, x1, y, y + .2, zf - .05, zf + .12, M.wall, g); y += .2;
  [[.14, .2], [.18, .36], [.2, .5]].forEach(function(L){ boxX(x0 - L[1]*.3, x1 + L[1]*.3, y, y + L[0], zf - .05, zf + L[1], M.trim, g); y += L[0]; });
}
/* entablature round a rectangular block: architrave, frieze (wall), cornice */
function entab(x0, x1, z0, z1, y, sides, big){
  sides = sides || {n:1, s:1, e:1, w:1};
  var a = big ? .25 : .2, f = big ? .3 : .2;
  function ring(y0, y1, p, m){ boxX(x0 - (sides.w ? p : 0), x1 + (sides.e ? p : 0), y0, y1, z0 - (sides.n ? p : 0), z1 + (sides.s ? p : 0), m); }
  ring(y, y + a, .14, M.trim); y += a;
  ring(y, y + f, .12, M.wall); y += f;
  [[.14, .2], [.18, .36], [.2, .5]].forEach(function(L){ ring(y, y + L[0], L[1], M.trim); y += L[0]; });
  return y;
}
function gableX(x0, x1, zc, hw, ye, k){ var yr = ye + hw*k;
  quad([x1, ye, zc + hw], [x0, ye, zc + hw], [x0, yr, zc], [x1, yr, zc], M.roof);
  quad([x0, ye, zc - hw], [x1, ye, zc - hw], [x1, yr, zc], [x0, yr, zc], M.roof);
  rod([x0, yr + .03, zc], [x1, yr + .03, zc], .07, M.roof); return yr; }
function gableZ(z0, z1, xc, hw, ye, k){ var yr = ye + hw*k;
  quad([xc - hw, ye, z0], [xc - hw, ye, z1], [xc, yr, z1], [xc, yr, z0], M.roof);
  quad([xc + hw, ye, z1], [xc + hw, ye, z0], [xc, yr, z0], [xc, yr, z1], M.roof);
  rod([xc, yr + .03, z0], [xc, yr + .03, z1], .07, M.roof); return yr; }
/* half ring (an arch band) centred on (0, yc) */
function halfRing(r0, r1, yc){ var s = new THREE.Shape(); s.moveTo(r1, yc); s.absarc(0, yc, r1, 0, Math.PI, false); s.lineTo(-r0, yc); s.absarc(0, yc, r0, Math.PI, 0, true); s.lineTo(r1, yc); return s; }
/* a deep round-headed porch with a broad white archivolt on imposts; at its back the blue double door
   under a fanlight, framed by its own white archivolt */
function porch(F, zf, nw, crown, dw, dcrown, nd){
  var ny = crown - nw/2, r = nw/2, AW = .48;                   // the archivolt runs unbroken down to the plinth
  add(ext(halfRing(r, r + AW, ny), .1, 40), M.trim, 0, 0, zf, F);
  [-1, 1].forEach(function(s){ boxX(s*r, s*(r + AW), PL, ny, zf, zf + .1, M.trim, F); });
  hole(F, function(){ return archS(nw, PL, ny); }, 0, 0, nd + zf, revealB, zf);
  var zb = -nd + .03, dr = dw/2, dy = dcrown - dr;
  sunk(add(ext(halfRing(dr, dr + .34, dy), .07, 40), M.trim, 0, 0, zb, F), 3);
  [-1, 1].forEach(function(s){ sunk(boxX(s*dr, s*(dr + .34), PL, dy, zb, zb + .07, M.trim, F), 3); });
  sunk(box(dw, dy - PL, .06, 0, PL, zb + .02, M.door, F), 3);
  sunk(box(dw + .02, .1, .08, 0, dy - .05, zb + .03, M.trim, F), 3);
  sunk(add(new THREE.ShapeGeometry(archS(dw, dy, dy), 32), M.glass, 0, 0, zb + .02, F), 3);
  sunk(add(ext(halfRing(dr - .07, dr, dy), .05, 32), M.trim, 0, 0, zb + .03, F), 3);
  sunk(add(ext(halfRing(.22, .28, dy), .05, 20), M.trim, 0, 0, zb + .04, F), 3);
  for (var i = 1; i < 8; i++){ var t = i/8*Math.PI, r0 = .28, r1 = dr - .07, L = r1 - r0, rm = (r0 + r1)/2;
    sunk(box(.035, L, .04, Math.cos(t)*rm, dy + Math.sin(t)*rm - L/2, zb + .05, M.trim, F), 3).rotation.z = t - Math.PI/2; }
}
/* portico: a risalit .3 proud carrying lesenes, the cornice pieces, an open-bed pediment, the oculus, the porch and steps */
function portico(F, o){
  var RZ = .18, hw = o.hw, pb = o.pedBase, rx = o.rake, apex = pb + rx*o.slope;
  add(ext(poly([[-hw, PL], [hw, PL], [hw, pb], [0, apex - .25], [-hw, pb]]), RZ), M.wall, 0, 0, 0, F);
  [-1, 1].forEach(function(s){
    var x0 = Math.min(s*o.les[0], s*o.les[1]), x1 = Math.max(s*o.les[0], s*o.les[1]);
    lesene(F, x0, x1, PL, o.band, RZ, .1);
    var lo = Math.min(s*o.cor, s*hw), hi = Math.max(s*o.cor, s*hw);
    midEntab(F, Math.min(x0, lo), Math.max(x1, hi), o.band, RZ, 0);
  });
  rakes(F, rx, pb - .04, rx*o.slope, RZ, .3, .52);
  box(.46, .32, .52, 0, apex - .14, RZ + .14, M.trim, F);
  oculus(F, 0, o.oc[0], o.oc[1], RZ);
  porch(F, RZ, o.niche[0], o.niche[1], o.door[0], o.door[1], .42);
  if (o.steps){
    o.steps.forEach(function(S){ boxX(-S[2], S[2], 0, S[0], RZ - .1, RZ + S[1], M.step, F); });
  }
  return apex;
}

/* ═══════════ NAOS · on north and south a portico; side bays with a tall window under the double cornice and a frame
   above it; wide corner lesenes ═══════════ */
var NW = 10.8, NB = 7.15;                                      // wall top, band of the mid entablature
boxX(-NH - .15, NH + .15, 0, PL, -NH - .15, NH + .15, M.plinth);
boxX(-NH, NH, PL, NW, -NH, NH, M.wall);
[[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function(c){ cornerBlock(c[0]*NH, c[1]*NH, c[0], c[1], PL, NW, 1.05, NB); });
var NE = entab(-NH, NH, -NH, NH, NW, null, true);             // → 11.87
[S_, N_].forEach(function(rot){
  var F = face(0, rot === S_ ? NH : -NH, rot);
  portico(F, {hw: 3.75, les: [2.5, 3.75], band: NB, cor: 2.3, pedBase: NB + 1.04, rake: 4.25, slope: .43,
              oc: [7.95, .58], niche: [3.0, 6.2], door: [1.75, 5.6], steps: [[.6, 1.25, 3.0], [.4, 1.6, 3.3], [.2, 1.95, 3.6]]});
  [-1, 1].forEach(function(s){
    midEntab(F, Math.min(s*3.75, s*6.45), Math.max(s*3.75, s*6.45), NB, 0, 0);
    win(F, s*5.1, 2.55, 1.0, 3.15, true, .2, 3, M.glass, .4);
    frameR(F, s*5.1, 8.65, 2.05, 1.85, .02);
    frameR(F, s*5.1, 1.0, 1.3, .95, .02);
  });
});
[[E_, NH, EH], [W_, -NH, LH]].forEach(function(A){
  var F = face(A[1], 0, A[0]);
  [-1, 1].forEach(function(s){
    var c = s*(A[2] + 6.45)/2, w = 6.45 - A[2] - .6;
    midEntab(F, Math.min(s*A[2], s*6.45), Math.max(s*A[2], s*6.45), NB, 0, 0);
    frameR(F, c, 8.65, w, 1.85, .02);
    if (A[0] === E_) frameR(F, c, 1.2, w*.75, 5.4, .02);
  });
});
/* low hipped roof from the eaves up to the drum: four planes, each cut by the chamfered octagon */
var DP = {A: 4.6, c: 1.7};                                      // drum: wide faces 5.8 m, corner faces 2.4 m
(function(){
  var ee = NH + .5, k = .19, P = chfGrow(DP, -.02), h = P.A - P.c, dg = (2*P.A - P.c)/2, a = P.A;
  function y(d){ return NE + k*d; }
  for (var q = 0; q < 4; q++){
    var th = q*Math.PI/2, cs = Math.cos(th), sn = Math.sin(th);
    var Pt = function(u, d){ var zz = ee - d; return [u*cs + zz*sn, y(d), -u*sn + zz*cs]; };
    var U = [-ee, ee, dg, h, -h, -dg], D = [0, 0, ee - dg, ee - a, ee - a, ee - dg], pos = [], uv = [];
    for (var i = 0; i < 6; i++){ var p = Pt(U[i], D[i]); pos.push(p[0], p[1], p[2]); uv.push(U[i], D[i]*1.02); }
    add(geo(pos, uv, [0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5]), M.roof);
    rod(Pt(ee, 0), Pt(dg, ee - dg), .06, M.roof);
  }
})();

/* ═══════════ DRUM · chamfered: on each wide face three arches (a window between two blind arches), on each narrow
   corner face one blind arch; a plain base band, a ledge, a frieze, a deep cornice; slate tent with four dormers ═══════════ */
(function(){
  var y0 = NE - .1, yl = 13.9, ya = 14.15, ah = 2.55, yf = 17.4;
  chfPrism(DP, y0, yf + .22, M.wall);
  chfPrism(chfGrow(DP, .1), yl, yl + .2, M.trim);
  chfPrism(chfGrow(DP, .05), yf - .2, yf, M.trim);
  var y = yf + .22; [[.1, .08], [.12, .18], [.14, .3]].forEach(function(L){ chfPrism(chfGrow(DP, L[1]), y, y + L[0], M.trim); y += L[0]; });
  var EO = chfGrow(DP, .32);                                  // the tent springs straight from the cornice's edge
  chfFaces(DP).forEach(function(F){
    if (F.cardinal){
      win(F.g, 0, ya, .95, ah, true, .14, 3, M.glass, .45, {sill: null});
      [-1, 1].forEach(function(k){ win(F.g, k*1.65, ya, .95, ah, true, .14, 0, M.wall, .16, {reveal: revealB, sill: null}); });
    } else win(F.g, 0, ya, .95, ah, true, .14, 0, M.wall, .16, {reveal: revealB, sill: null});
  });
  var ye = y, P0 = EO, yt = 23.7, P1 = chfReg(.62);
  chfTent(P0, ye, P1, yt, M.slate, 0, 0);
  chfFaces(DP).forEach(function(F){
    if (!F.cardinal) return;
    var t = .36, aa = P0.A - t*(P0.A - P1.A), yy = ye + t*(yt - ye);
    dormer(face(F.dir[0]*(aa + .04), F.dir[1]*(aa + .04), F.dir[2]), yy - .2, 1.2, 1.25, 1.5, [.55]);
  });
  dome(0, 0, yt - .05, .62, .8, 1.6, true, 1.5);
})();

/* ═══════════ LINK between the porch and the naos ═══════════ */
boxX(TX1, LX1, 0, PL, -LH - .12, LH + .12, M.plinth);
boxX(TX1, LX1, PL, 6.2, -LH, LH, M.wall);
var LE = entab(TX1, LX1, -LH, LH, 6.2, {n:1, s:1, e:0, w:0});
gableX(TX1, LX1, 0, LH + .42, LE, .3);
[S_, N_].forEach(function(rot){
  var F = face((TX1 + LX1)/2, rot === S_ ? LH : -LH, rot);
  win(F, 0, 2.1, .95, 3.0, true, .18, 3, M.glass, .4);
  var hl = (LX1 - TX1)/2; [-1, 1].forEach(function(s){ lesene(F, Math.min(s*(hl - .55), s*hl), Math.max(s*(hl - .55), s*hl), PL, 6.2, 0, .1, true); });
});

/* ═══════════ PORCH · two tiers: lower tier up to the double mid cornice that runs round the block, upper tier to the eaves;
   gables north and south; on the west the main portico ═══════════ */
var WB = 6.5, WW = 10.0;
boxX(WX0 - .15, WX1, 0, PL, -WH - .15, WH + .15, M.plinth);
boxX(WX0, WX1, PL, WW, -WH, WH, M.wall);
[[WX0, -1], [WX1, 1]].forEach(function(c){ [-1, 1].forEach(function(sz){ cornerBlock(c[0], sz*WH, c[1], sz, PL, WW, .75, WB); }); });
var WE = entab(WX0, WX1, -WH, WH, WW, null, false);             // → 10.92
var WK = .3, WRID = gableZ(-WH - .35, WH + .35, WC, (WX1 - WX0)/2 + .42, WE, WK);
/* gable ends (north, south): lower tier an arched window between two tall frames, upper tier a small square window
   in a frame, frames either side; the pediment */
[S_, N_].forEach(function(rot){
  var F = face(WC, rot === S_ ? WH : -WH, rot), hw = (WX1 - WX0)/2;
  midEntab(F, -hw + .75, hw - .75, WB, 0, 0);
  add(ext(poly([[-hw, 0], [hw, 0], [0, hw*WK]]), .3), M.wall, 0, WE, -.3, F);
  rakes(F, hw + .42, WE - .05, (hw + .42)*WK, .02, .26, .42);
  win(F, 0, 2.2, .95, 3.2, true, .18, 3, M.glass, .4);
  [-1, 1].forEach(function(s){ frameR(F, s*2.1, 1.2, .95, 4.95, .02); frameR(F, s*2.1, 7.95, .95, 1.6, .02); });
  win(F, 0, 8.2, .62, .78, false, .13, 2, M.glass, .35);
  frameR(F, 0, 7.95, 1.3, 1.6, .02);
});
/* west front, measured on the frontal photograph */
(function(){
  var F = face(WX0, 0, W_);
  portico(F, {hw: 3.7, les: [2.45, 3.7], band: WB, cor: 2.05, pedBase: WB + 1.04, rake: 3.55, slope: .45,
              oc: [7.45, .46], niche: [3.05, 6.0], door: [1.75, 5.45], steps: [[.6, 1.3, 2.7], [.4, 1.65, 3.0], [.2, 2.0, 3.3]]});
  [-1, 1].forEach(function(s){
    midEntab(F, Math.min(s*3.7, s*5.75), Math.max(s*3.7, s*5.75), WB, 0, 0);
    frameR(F, s*4.55, 8.55, 1.85, 1.15, .02);                 // upper tier: wide frame over the outer bay
  });
  frameR(F, 0, 9.0, 4.6, .8, .02);                             // a long frame under the eaves, behind the pediment
})();
(function(){ var F = face(WX1, 0, E_); [-1, 1].forEach(function(s){ midEntab(F, Math.min(s*BQ, s*5.75), Math.max(s*BQ, s*5.75), WB, 0, 0); frameR(F, s*5.0, 7.95, 1.1, 1.6, .02); frameR(F, s*5.0, 1.3, 1.1, 4.7, .02); }); })();

/* ═══════════ BELL TOWER · a square base rising out of the porch roof, skirted up to a chamfered octagon: louvred openings
   with railings on the wide faces, blind arches on the narrow ones, a gable over every face (large over the wide faces,
   small over the narrow), a slate spire with four dormers ═══════════ */
(function(){
  /* measured on the 1930s photograph and the close-ups of the 2020s. The tower's square body rises inside the porch and
     stands 2.2 m proud of its east wall, carrying the porch's two cornices round; above the porch roof a short square base
     is skirted up to the chamfered octagon (wide faces with louvres, narrow faces with blind arches). Every gable rises the
     same height from the corners, so over the narrow faces they are steeper; the spire springs from the octagon itself, so
     between the gables only short valleys show */
  var cx = BX, Q = BQ, sbt = 12.3, oy = 12.45, ye = 16.8, BP = {A: 3.4, c: 1.82}, GR = 2.05;   // wide faces 3.15 m, narrow 2.6 m
  /* body: the part east of the porch, with corner lesenes, the porch's mid cornice and eaves entablature run round it */
  boxX(WX1, cx + Q, 0, PL, -Q - .12, Q + .12, M.plinth);
  boxX(WX1, cx + Q, PL, WW, -Q, Q, M.wall);
  [-1, 1].forEach(function(sz){ cornerBlock(cx + Q, sz*Q, 1, sz, PL, WW, .7, WB); });
  entab(WX1, cx + Q, -Q, Q, WW, {n:1, s:1, e:1, w:0}, false);
  [S_, N_].forEach(function(rot){
    var F = face((WX1 + cx + Q)/2, rot === S_ ? Q : -Q, rot), L = (cx + Q - WX1)/2;
    midEntab(F, -L, L - .7, WB, 0, 0);
    frameR(F, -.3, 8.0, L*2 - 1.6, 1.55, .02);
  });
  (function(){ var F = face(cx + Q, 0, E_); midEntab(F, -Q + .7, Q - .7, WB, 0, 0); frameR(F, 0, 8.0, 2*Q - 2.3, 1.55, .02); })();
  /* the square base above the porch roof */
  boxX(cx - Q, cx + Q, WE - .4, sbt, -Q, Q, M.wall);
  boxX(cx - Q - .08, cx + Q + .08, sbt - .16, sbt, -Q - .08, Q + .08, M.trim);
  apronChf(cx, 0, Q + .02, sbt, chfGrow(BP, .03), oy, M.wall);
  chfPrism(BP, sbt, ye, M.wall, cx, 0);
  chfPrism(chfGrow(BP, .07), oy, oy + .15, M.trim, cx, 0);
  /* the arched heads of the openings rise above the corners, into the gables, as on the photographs */
  var ob = oy + .35, oh = ye + .5 - (oy + .35), st = 26.3, saP = chfReg(.42);
  chfFaces(BP, cx, 0).forEach(function(F){
    if (F.cardinal) win(F.g, 0, ob, 1.0, oh, true, .14, 0, M.louv, .55, {reveal: revealW});
    else {
      win(F.g, 0, ob, 1.05, oh, true, .14, 0, M.trim, .1, {reveal: revealW});
      box(1.03, .06, .05, 0, ob + oh - .525 - .04, -.07, M.trim, F.g);
      box(1.03, .05, .05, 0, ob + .55, -.07, M.trim, F.g);
    }
    var hw = F.len/2, k = GR/hw;
    add(ext(poly([[-hw - .01, 0], [hw + .01, 0], [0, GR]]), .35), M.wall, 0, ye, -.35, F.g);
    rakes(F.g, hw + .05, ye - .03, (hw + .05)*k, .02, .17, .3);
    [-1, 1].forEach(function(sd){ box(.34, .12, .3, sd*(hw - .08), ye - .14, .1, M.trim, F.g); });   // short cornice returns at the feet of the rakes
    /* the gable's own little roof, running back into the spire */
    add(ext(poly([[-hw, 0], [hw, 0], [0, GR + .03]]), 1.3), M.slate, 0, ye + .04, -1.3 - .06, F.g);   // kept behind the wall plane so the arched heads stay clean
  });
  chfTent(BP, ye, saP, st, M.slate, cx, 0);
  chfFaces(BP, cx, 0).forEach(function(F){
    if (!F.cardinal) return;
    var t = .48, r = BP.A - t*(BP.A - saP.A), yy = ye + t*(st - ye);
    dormer(face(cx + F.dir[0]*(r + .03), F.dir[1]*(r + .03), F.dir[2]), yy - .2, .66, .78, 1.1, [.55]);
  });
  dome(cx, 0, st - .05, .42, .66, 1.45, true, 1.05);
})();

/* ═══════════ SANCTUARY · on the sides a lesene at the naos, a bay with a tall window, a broad projecting lesene at the
   east end; a lower cornice, an attic band and the eaves cornice breaking forward over the lesenes; on the east
   an open-bed pediment with a round window, a deep niche with the painted Resurrection, the small dome ═══════════ */
var ECX = (NH + EX1)/2, EW = 7.0, EC = 5.95;                   // wall top, lower cornice
boxX(NH, EX1 + .15, 0, PL, -EH - .15, EH + .15, M.plinth);
boxX(NH, EX1, PL, EW, -EH, EH, M.wall);
var EE = entab(NH, EX1 - .06, -EH, EH, EW, {n:1, s:1, e:0, w:0}, false); // → 7.62
var EK = .46, ER = gableX(NH, EX1 + .45, 0, EH + .45, EE, EK);
function lowCornice(g, x0, x1, y, zf){
  boxX(x0, x1, y, y + .14, zf - .05, zf + .1, M.trim, g);
  boxX(x0 - .04, x1 + .04, y + .14, y + .3, zf - .05, zf + .26, M.trim, g);
  boxX(x0 - .07, x1 + .07, y + .3, y + .38, zf - .05, zf + .34, M.trim, g);
}
[S_, N_].forEach(function(rot){
  var F = face(ECX, rot === S_ ? EH : -EH, rot), L = (EX1 - NH)/2, sg = rot === S_ ? 1 : -1;
  /* along the face, local x runs west → east on the south side and east → west on the north side */
  function X(wx){ return sg*(wx - ECX); }
  var a0 = X(NH), a1 = X(NH + .95), e0 = X(EX1 - 2.05), e1 = X(EX1);
  lesene(F, Math.min(a0, a1), Math.max(a0, a1), PL, EC, 0, .1);
  boxX(Math.min(e0, e1), Math.max(e0, e1), PL, EW, -.02, .16, M.wall, F);
  boxX(Math.min(e0, e1) - .03, Math.max(e0, e1) + .03, PL, PL + .3, -.02, .2, M.trim, F);
  frameR(F, (e0 + e1)/2, PL + .5, 2.05 - .5, EC - PL - .8, .16, .09);
  lowCornice(F, Math.min(a1, e0), Math.max(a1, e0), EC, 0);
  lowCornice(F, Math.min(e0, e1), Math.max(e0, e1) + (sg > 0 ? .1 : -.1)*0, EC, .16);
  lowCornice(F, Math.min(a0, a1), Math.max(a0, a1), EC, .1);
  frameR(F, X((NH + .95 + EX1 - 2.05)/2), EC + .48, (EX1 - 2.05) - (NH + .95) - .5, EW - EC - .64, .02, .07);
  var ex = X(EX1 + .66); entabPiece(F, Math.min(e0, ex), Math.max(e0, ex), EW, .16);
  win(F, X((NH + .95 + EX1 - 2.05)/2), 2.4, 1.0, 3.25, true, .18, 3, M.glass, .4);
});
(function(){
  var F = face(EX1, 0, E_);
  /* broad corner lesenes, carrying the cornice pieces from which the pediment rakes spring */
  [-1, 1].forEach(function(s){
    var x0 = Math.min(s*2.75, s*EH), x1 = Math.max(s*2.75, s*EH);
    boxX(x0, x1, PL, EW, -.02, .16, M.wall, F);
    boxX(x0 - .03, x1 + .03, PL, PL + .3, -.02, .2, M.trim, F);
    frameR(F, (x0 + x1)/2, PL + .45, (x1 - x0) - .4, EC - PL - .7, .16, .09);
    lowCornice(F, x0, x1, EC, .16);
    frameR(F, (x0 + x1)/2, EC + .55, (x1 - x0) - .4, EW - EC - .75, .16, .07);
  });
  [-1, 1].forEach(function(s){ entabPiece(F, Math.min(s*2.75, s*(EH + .66)), Math.max(s*2.75, s*(EH + .66)), EW, .16); });
  add(ext(poly([[-EH, EW - EE], [EH, EW - EE], [EH, 0], [0, EH*EK], [-EH, 0]]), .3), M.wall, 0, EE, -.3, F);
  rakes(F, EH + .45, EE - .06, (EH + .45)*EK, .18, .28, .44);
  oculus(F, 0, EE + .05, .34, 0);
  var nw = 2.75, ny = 4.95 - nw/2, nd = .5;
  add(ext(halfRing(nw/2, nw/2 + .34, ny), .12, 40), M.trim, 0, 0, 0, F);
  [-1, 1].forEach(function(s){ boxX(s*nw/2, s*(nw/2 + .34), PL, ny, 0, .1, M.trim, F); boxX(s*(nw/2 - .04), s*(nw/2 + .38), ny - .24, ny, 0, .16, M.trim, F); });
  hole(F, function(){ return archS(nw, PL, ny); }, 0, 0, nd, revealW);
  var icon = canvasTex(512, 768, function(k){
    var g = k.createLinearGradient(0, 0, 0, 768); g.addColorStop(0, '#f6e7b8'); g.addColorStop(.55, '#e6c06a'); g.addColorStop(1, '#b58b45');
    k.fillStyle = g; k.fillRect(0, 0, 512, 768);
    var m = k.createRadialGradient(256, 300, 30, 256, 300, 230); m.addColorStop(0, 'rgba(255,255,255,.95)'); m.addColorStop(.6, 'rgba(210,232,248,.75)'); m.addColorStop(1, 'rgba(120,170,210,0)');
    k.fillStyle = m; k.beginPath(); k.ellipse(256, 320, 170, 250, 0, 0, Math.PI*2); k.fill();
    k.strokeStyle = 'rgba(255,240,190,.7)'; k.lineWidth = 2; for (var i = 0; i < 28; i++){ var a = i/28*Math.PI*2; k.beginPath(); k.moveTo(256 + Math.cos(a)*120, 300 + Math.sin(a)*170); k.lineTo(256 + Math.cos(a)*200, 300 + Math.sin(a)*260); k.stroke(); }
    k.fillStyle = '#e9b949'; k.beginPath(); k.arc(256, 168, 44, 0, Math.PI*2); k.fill();
    k.fillStyle = '#c99a72'; k.beginPath(); k.ellipse(256, 172, 20, 26, 0, 0, Math.PI*2); k.fill();
    k.fillStyle = '#5a3a24'; k.beginPath(); k.ellipse(256, 160, 22, 16, 0, Math.PI, 0); k.fill();
    k.fillStyle = '#fbfaf4'; k.beginPath(); k.moveTo(236, 200); k.lineTo(276, 200); k.lineTo(330, 470); k.lineTo(182, 470); k.closePath(); k.fill();
    k.strokeStyle = 'rgba(160,150,130,.6)'; k.lineWidth = 3; [[240, 230, 214, 460], [256, 220, 256, 466], [272, 230, 298, 460]].forEach(function(l){ k.beginPath(); k.moveTo(l[0], l[1]); k.lineTo(l[2], l[3]); k.stroke(); });
    k.fillStyle = '#fbfaf4'; k.beginPath(); k.moveTo(240, 214); k.lineTo(150, 150); k.lineTo(140, 166); k.lineTo(236, 240); k.closePath(); k.fill();
    k.beginPath(); k.moveTo(272, 214); k.lineTo(362, 150); k.lineTo(372, 166); k.lineTo(276, 240); k.closePath(); k.fill();
    k.fillStyle = '#b5302a'; k.beginPath(); k.moveTo(262, 205); k.lineTo(300, 230); k.lineTo(316, 440); k.lineTo(280, 300); k.closePath(); k.fill();
    k.fillStyle = '#8c6a4a'; k.fillRect(230, 470, 52, 8);
    [[110, 600, -1], [402, 600, 1]].forEach(function(p){ k.fillStyle = '#f4f1e8'; k.beginPath(); k.ellipse(p[0], p[1], 34, 70, p[2]*.2, 0, Math.PI*2); k.fill(); k.fillStyle = '#e9b949'; k.beginPath(); k.arc(p[0], p[1] - 72, 20, 0, Math.PI*2); k.fill(); k.fillStyle = 'rgba(200,170,120,.8)'; k.beginPath(); k.ellipse(p[0] - p[2]*30, p[1] - 10, 40, 22, p[2]*.6, 0, Math.PI*2); k.fill(); });
    k.fillStyle = 'rgba(70,52,30,.35)'; k.fillRect(0, 700, 512, 68);
  });
  icon.repeat.set(1/nw, 1/(ny + nw/2 - PL)); icon.offset.set(.5, -PL/(ny + nw/2 - PL));
  sunk(add(new THREE.ShapeGeometry(archS(nw, PL, ny), 32), mat('#ffffff', {map: icon, roughness: .85}), 0, 0, -nd + .02, F), 3);
})();
(function(){
  var x = EX1 - .9, y0 = ER - .55;
  boxX(x - .5, x + .5, y0, y0 + 1.0, -.5, .5, M.wall);
  boxX(x - .58, x + .58, y0 + 1.0, y0 + 1.14, -.58, .58, M.trim);
  dome(x, 0, y0 + 1.14, .34, .5, 1.05, false, .75);
})();

/* ═══════════ rainwater downpipes at the corners, as on the photographs ═══════════ */
(function(){
  var pipe = mat('#e9ebe7', {roughness:.5, metalness:.2});
  function dp(x, z, ytop, dx, dz){
    rod([x, .35, z], [x, ytop - .55, z], .065, pipe);
    rod([x, ytop - .55, z], [x - dx*.35, ytop - .2, z - dz*.35], .065, pipe);
    add(new THREE.CylinderGeometry(.13, .08, .22, 10), pipe, x - dx*.35, ytop - .1, z - dz*.35);
    [1.4, ytop*.45, ytop - 1.2].forEach(function(y){ add(new THREE.CylinderGeometry(.085, .085, .06, 10), pipe, x, y, z); });
  }
  var o = .33;
  [-1, 1].forEach(function(s){
    dp(WX0 - o, s*(WH - .25), 10.35, -1, 0);          // west front
    dp(WX1 + .25, s*(WH + o), 10.35, 0, s);
    dp(TX1 - .95, s*(BQ + o), 10.35, 0, s);           // tower body            // porch, east corners
    dp(-NH - .25, s*(NH + o), 11.3, 0, s);            // naos
    dp(NH + .25, s*(NH + o), 11.3, 0, s);
    dp(EX1 - .3, s*(EH + o), 7.4, 0, s);              // sanctuary
  });
})();

/* ═══════════ a cast-iron street lantern by the south porch, as on the photographs ═══════════ */
(function(){
  var x = -4.9, z = NH + 3.0;
  add(new THREE.CylinderGeometry(.16, .2, .5, 12), M.dark, x, .25, z);
  add(new THREE.CylinderGeometry(.06, .08, 3.3, 10), M.dark, x, 1.9, z);
  var lamp = mat('#fff2cc', {emissive: '#ffcf7a', emissiveIntensity: .25, roughness: .3});
  for (var i = 0; i < 4; i++){
    var a = i*Math.PI/2 + Math.PI/4, lx = x + Math.cos(a)*.45, lz = z + Math.sin(a)*.45;
    rod([x, 3.1, z], [lx, 3.25, lz], .025, M.dark);
    box(.2, .3, .2, lx, 3.25, lz, lamp); add(new THREE.ConeGeometry(.17, .16, 4), M.dark, lx, 3.63, lz).rotation.y = Math.PI/4;
  }
  box(.24, .38, .24, x, 3.55, z, lamp); add(new THREE.ConeGeometry(.2, .2, 4), M.dark, x, 4.03, z).rotation.y = Math.PI/4;
})();

/* ═══════════ PERFORMANCE · bake the static parts into one mesh per material and pass ═══════════ */
(function mergeStatic(root){
  root.updateMatrixWorld(true);
  var groups = {}, order = [], gone = [];
  root.traverse(function(o){
    if (!o.isMesh || Array.isArray(o.material)) return;
    var key = o.material.uuid + '|' + o.renderOrder + '|' + o.castShadow + '|' + o.receiveShadow + '|' + o.frustumCulled;
    if (!groups[key]){ groups[key] = {o: o, list: []}; order.push(key); }
    groups[key].list.push(o);
  });
  function cat(arrs){ var len = 0; arrs.forEach(function(a){ len += a.length; }); var out = new Float32Array(len), at = 0; arrs.forEach(function(a){ out.set(a, at); at += a.length; }); return out; }
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
  root.children.slice().forEach(function(c){ if (!c.isMesh && c.children.length === 0) root.remove(c); });
})(church);

/* ═══════════ GROUND · a turntable engraved with the church's name ═══════════ */
var GX = -3.0;                                        // centre of the church on its long axis
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
    arc('ЦЕРКВА  РІЗДВА  БОГОРОДИЦІ', 0, false, fs*.22);
    arc('ДУБРОВИЦЯ  ·  1861', Math.PI, true, fs*.22);
    [Math.PI/2, -Math.PI/2].forEach(function(t){ k.save(); k.translate(c + Math.sin(t)*rt, c - Math.cos(t)*rt); k.rotate(t + Math.PI/4); k.fillRect(-fs*.13, -fs*.13, fs*.26, fs*.26); k.restore(); });
  });
  var gm = new THREE.MeshStandardMaterial({map:tex, roughness:1, transparent:true, depthWrite:false});
  var g = add(new THREE.CircleGeometry(R, 128), gm, GX, 0, 0, scene); g.rotation.x = -Math.PI/2; g.castShadow = false; g.renderOrder = -1;
})();

/* ── dust in the lamplight ── */
var motes = null, MN = 160, mv = [];
if (o.motes){
  var mp = new Float32Array(MN*3);
  for (var mi = 0; mi < MN; mi++){ mp[mi*3] = GX + (Math.random() - .5)*64; mp[mi*3 + 1] = Math.random()*40; mp[mi*3 + 2] = (Math.random() - .5)*64; mv.push(.25 + Math.random()*.6, Math.random()*6.28); }
  var mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
  var dot = canvasTex(64, 64, function(k){ var r = k.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.35, 'rgba(255,255,255,.45)'); r.addColorStop(1, 'rgba(255,255,255,0)'); k.fillStyle = r; k.fillRect(0, 0, 64, 64); });
  motes = new THREE.Points(mg, new THREE.PointsMaterial({map:dot, color:'#ffd99a', size:.42, sizeAttenuation:true, transparent:true, opacity:.55, depthWrite:false, blending:THREE.AdditiveBlending}));
  scene.add(motes);
}

/* ── light: a low western sun, as on the archival photographs ── */
scene.add(new THREE.HemisphereLight('#fff4de', '#3a2c1c', .72));
var sun = new THREE.DirectionalLight('#ffeccd', 1.5);
sun.position.set(-44, 50, 30); sun.target.position.set(GX, 8, 0);
sun.castShadow = true; sun.shadow.mapSize.set(o.shadow, o.shadow);
var sc = sun.shadow.camera; sc.left = -36; sc.right = 36; sc.top = 36; sc.bottom = -36; sc.near = 20; sc.far = 160;
sun.shadow.bias = -.0003; sun.shadow.normalBias = .035;
scene.add(sun); scene.add(sun.target);
var fill = new THREE.DirectionalLight('#d3dcff', .5); fill.position.set(40, 18, -26); scene.add(fill);

/* ── camera + controls ── */
var controls = new THREE.OrbitControls(camera, canvas);
controls.target.set(GX, o.targetY || 11.5, 0);
var viewDir = new THREE.Vector3(o.view[0], o.view[1], o.view[2]).normalize(), touched = false;
controls.enableDamping = true; controls.dampingFactor = .07;
controls.minDistance = 16; controls.maxDistance = 180;
controls.maxPolarAngle = Math.PI/2 - .05;
controls.enablePan = false;
controls.enableZoom = !!o.zoom;
controls.rotateSpeed = .7;
canvas.style.touchAction = o.touch;
var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
controls.autoRotate = !!o.autoRotate && !reduced; controls.autoRotateSpeed = o.autoRotateSpeed;
controls.addEventListener('start', function(){ controls.autoRotate = false; touched = true; tween = null; if (o.onStart) o.onStart(); });

function home(){
  var t = Math.tan(camera.fov*Math.PI/360), dist = Math.max(19/t, 24/(t*camera.aspect))*o.fit;
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
      if (a[i*3 + 1] > 40) a[i*3 + 1] = 0;
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
