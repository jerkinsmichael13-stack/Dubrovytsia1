/* Облога Воробина, 21–22 листопада 1918 — 3D-схема.
   Власний рельєф (не аерофото): тераса з маєтком, схил до лугів Горині, стави внизу, сад за муром, парк, шлях на Дубровицю.
   Розташування будівель — за обрисами руїн на аерофотознімку (масштаб і орієнтацію визначено за павільйоном «Бібліотека»).
   Осі: +x — схід (до Горині), +z — південь (на Дубровицю), −z — північ. Одиниця — метр. */
(function(){
'use strict';
var T = THREE;
T.ColorManagement.legacyMode = false;
var DTMAX = /[?&]fast/.test(location.search) ? .3 : .06;
var MOBILE = matchMedia('(max-width:640px)').matches, LOW = MOBILE || (navigator.deviceMemory || 8) < 4;

/* ───────────── допоміжне ───────────── */
function ss(a, b, x){ var t = Math.max(0, Math.min(1, (x - a)/(b - a))); return t*t*(3 - 2*t); }
function lerp(a, b, t){ return a + (b - a)*t; }
function rngF(s){ return function(){ s = (s*16807) % 2147483647; return (s - 1)/2147483646; }; }
var rnd = rngF(11);
function hash(x, z){ var s = Math.sin(x*127.1 + z*311.7)*43758.5453; return s - Math.floor(s); }
function vnoise(x, z){ var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz; fx = fx*fx*(3 - 2*fx); fz = fz*fz*(3 - 2*fz);
  return lerp(lerp(hash(ix, iz), hash(ix + 1, iz), fx), lerp(hash(ix, iz + 1), hash(ix + 1, iz + 1), fx), fz); }
function fbm(x, z){ return vnoise(x, z)*.5 + vnoise(x*2.1 + 5.2, z*2.1 + 1.3)*.25 + vnoise(x*4.3 + 2.7, z*4.3 + 8.1)*.125; }
function col(h){ return new T.Color(h); }
function inPoly(x, z, P){ var c = false; for (var i = 0, j = P.length - 1; i < P.length; j = i++){ var a = P[i], b = P[j];
  if (((a[1] > z) !== (b[1] > z)) && (x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0])) c = !c; } return c; }
function segDist(x, z, a, b){ var dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0])*dx + (z - a[1])*dz)/(dx*dx + dz*dz))); return Math.hypot(x - a[0] - dx*t, z - a[1] - dz*t); }
function polyDist(x, z, P){ var m = 1e9; for (var i = 0; i < P.length - 1; i++) m = Math.min(m, segDist(x, z, P[i], P[i + 1])); return m; }

/* ───────────── план (метри) ───────────── */
var S = .28; function W(px, py){ return [(py - 760)*S, -(px - 900)*S]; }
var LIB = W(646, 1074);                                   // «Бібліотека»
var PAL = {S: {x0: -104.2, x1: -81.2, z0: -19.0, z1: -5.6}, M: {x0: -100.8, x1: -87.9, z0: -45.9, z1: -19.0}, N: {x0: -99.4, x1: -72.8, z0: -57.1, z1: -45.9}};
function cen(r){ return [(r.x0 + r.x1)/2, (r.z0 + r.z1)/2]; }
var COURT = [-58, -18], LAWN = [-56, -6];
var ROAD = [[-232, 420], [-197, 252], [-132, -70], [-108, -196], [-78, -376], [-60, -470]];
var DRIVE = [[-140, -1], [-110, -1], [-80, 0], [-66, -4]];
var LANE = [[-44, -6], [-10, 12], [30, 40], [LIB[0] - 22, LIB[1] - 2]];
var GARDEN = [[775, 620], [772, 1082], [1295, 1090], [1365, 752], [1180, 742], [1180, 580], [1095, 548], [1040, 610]].map(function(p){ return W(p[0], p[1]); });
function roadX(z){ for (var i = 0; i < ROAD.length - 1; i++){ var a = ROAD[i], b = ROAD[i + 1]; if (z <= a[1] && z >= b[1]) return lerp(a[0], b[0], (z - a[1])/(b[1] - a[1])); } return ROAD[0][0]; }

/* ───────────── рельєф ───────────── */
function edgeX(z){ return LIB[0] + 7*Math.sin((z - LIB[1])/80) + 3*Math.sin((z - LIB[1])/31); }      // бровка схилу
function creekX(z){ return LIB[0] + 40 + 5*Math.sin(z/60 + 2) + 3*Math.sin(z/23); }                  // старе русло під схилом
function riverX(z){ return LIB[0] + 125 + 16*Math.sin(z/120 + .5) + 7*Math.sin(z/47 + 1); }          // Горинь
var PONDS = [[LIB[0] + 24, LIB[1] - 44, 10, 6.5], [LIB[0] + 22, LIB[1] + 38, 8, 5.5]];               // стави на нижньому рівні парку
var MILL = [52, -192, 14, 26];                                                                         // став біля фільварку
var MEADOW = -5.15, POND_W = -5.55, CREEK_W = -5.85, RIVER_W = -6.3, MILL_W = -.55;
function H(x, z){
  var e = edgeX(z), h = -1.75*ss(e - 5, e + 9, x) - 2.2*ss(e + 9.5, e + 22, x) - 1.2*ss(e + 22, e + 40, x);
  h += (fbm(x*.02, z*.02) - .5)*.9*(1 - ss(e - 30, e, x)) + (fbm(x*.05 + 9, z*.05) - .5)*.35;
  var dc = Math.abs(x - creekX(z)); h -= 1.3*(1 - ss(2.5, 7, dc));
  var dr = Math.abs(x - riverX(z)); h -= 2.4*(1 - ss(18, 30, dr));
  PONDS.forEach(function(p){ var q = Math.hypot((x - p[0])/p[2], (z - p[1])/p[3]); if (q < 1.6) h -= 1.1*(1 - ss(.8, 1.5, q)); });
  var q = Math.hypot((x - MILL[0])/MILL[2], (z - MILL[1])/MILL[3]); if (q < 1.6) h -= 1.4*(1 - ss(.8, 1.5, q));
  return h;
}
function flatAt(x, z){ return Math.max(H(x, z), -1e9); }

/* ───────────── сцена ───────────── */
var cv = document.getElementById('view');
var renderer = new T.WebGLRenderer({canvas: cv, antialias: !LOW, powerPreference: 'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, LOW ? 1.5 : 2));
renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
var scene = new T.Scene();
scene.fog = new T.FogExp2(0x101828, .0021);
var camera = new T.PerspectiveCamera(40, 1, .5, 6000);
var controls = new T.OrbitControls(camera, cv);
controls.enableDamping = true; controls.dampingFactor = .07; controls.maxPolarAngle = 1.42; controls.minDistance = 18; controls.maxDistance = 900; controls.screenSpacePanning = true;

var hemi = new T.HemisphereLight(0xffffff, 0x3a3326, .5); scene.add(hemi);
var sun = new T.DirectionalLight(0xffffff, 1); sun.castShadow = true;
sun.shadow.mapSize.set(LOW ? 1024 : 2048, LOW ? 1024 : 2048);
var sc = sun.shadow.camera; sc.left = -190; sc.right = 190; sc.top = 190; sc.bottom = -190; sc.near = 20; sc.far = 1400; sun.shadow.bias = -.0005; sun.shadow.normalBias = .4;
scene.add(sun); scene.add(sun.target);

/* небо: градієнт, сонце, зорі */
var skyU = {top: {value: col(0x0b1222)}, hor: {value: col(0x26324a)}, sunDir: {value: new T.Vector3(0, 1, 0)}, sunCol: {value: col(0xffd9a0)}, sunK: {value: 0}};
var sky = new T.Mesh(new T.SphereGeometry(3000, 32, 16), new T.ShaderMaterial({side: T.BackSide, depthWrite: false, fog: false, uniforms: skyU,
  vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: 'uniform vec3 top,hor,sunDir,sunCol; uniform float sunK; varying vec3 vD; void main(){ float y = max(vD.y,0.); vec3 c = mix(hor, top, pow(y,.55)); float s = max(dot(normalize(vD), normalize(sunDir)),0.); c += sunCol*(pow(s,6.)*.35 + pow(s,400.)*2.)*sunK; c = mix(c, hor*.8, smoothstep(0.,-.2,vD.y)); gl_FragColor = vec4(c,1.); }'}));
sky.renderOrder = -10; scene.add(sky);
var starGeo = new T.BufferGeometry(), sp = [];
for (var i = 0; i < 1400; i++){ var u = rnd()*2 - 1, a = rnd()*6.283, r = Math.sqrt(1 - u*u); if (u < .06) continue; sp.push(Math.cos(a)*r*2800, u*2800, Math.sin(a)*r*2800); }
starGeo.setAttribute('position', new T.Float32BufferAttribute(sp, 3));
var stars = new T.Points(starGeo, new T.PointsMaterial({color: 0xdfe6ff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false}));
scene.add(stars);

/* текстура-точка для частинок */
function dotTex(soft){ var c = document.createElement('canvas'); c.width = c.height = 64; var g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(soft ? .25 : .45, 'rgba(255,255,255,' + (soft ? .55 : .8) + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new T.CanvasTexture(c); }
var DOT = dotTex(false), PUFF = dotTex(true);

/* ───────────── земля ───────────── */
var GX0 = -330, GX1 = 360, GZ0 = -470, GZ1 = 430;
var gSegX = LOW ? 230 : 330, gSegZ = LOW ? 300 : 430;
var gGeo = new T.PlaneGeometry(GX1 - GX0, GZ1 - GZ0, gSegX, gSegZ); gGeo.rotateX(-Math.PI/2); gGeo.translate((GX0 + GX1)/2, 0, (GZ0 + GZ1)/2);
var gp = gGeo.attributes.position, gc = new Float32Array(gp.count*3);
var C_FIELD1 = col(0x6c5843), C_FIELD2 = col(0x7f6a4d), C_WINTER = col(0x55623a), C_PARK = col(0x4f5b33), C_LAWN = col(0x5f6c3a), C_MEADOW = col(0x8a8550),
    C_WET = col(0x5b6a44), C_ROAD = col(0x7c6648), C_GRAVEL = col(0xb4a68a), C_SLOPE = col(0x5a5732), C_GARDEN = col(0x535d35), C_BANK = col(0x6b6a48), C_FARM = col(0x75654c);
var tmpC = new T.Color();
for (i = 0; i < gp.count; i++){
  var x = gp.getX(i), z = gp.getZ(i), h = H(x, z); gp.setY(i, h);
  var e = edgeX(z), rx = roadX(z), n = fbm(x*.08, z*.08), c;
  if (x < rx - 7){                                                        // поля на захід від шляху: смуги ріллі й озимини
    var band = Math.floor((z + 30*Math.sin(x*.004))/46), strip = Math.sin((x*.9 + z*.15)*1.6)*.5 + .5;
    c = tmpC.copy(hash(band, 3) > .62 ? C_WINTER : C_FIELD1).lerp(C_FIELD2, strip*.45);
  } else if (x > e + 14){                                                 // луки над Горинню
    c = tmpC.copy(C_MEADOW).lerp(C_WET, ss(.35, .7, fbm(x*.02 + 4, z*.02)) + (1 - ss(4, 18, Math.abs(x - creekX(z))))*.6);
    var dr = Math.abs(x - riverX(z)); if (dr < 30) c.lerp(C_BANK, 1 - ss(20, 30, dr));
  } else if (x > e - 6){ c = tmpC.copy(C_SLOPE).lerp(C_PARK, .3); }       // схил
  else if (inPoly(x, z, GARDEN)){ c = tmpC.copy(C_GARDEN); }
  else if (z < -120 || x > 95 && z < 0){ c = tmpC.copy(C_FIELD1).lerp(C_FIELD2, Math.sin((z*.8 + x*.2)*1.4)*.5 + .5); if (z < -150 && x > -10) c.lerp(C_FARM, .5); }
  else c = tmpC.copy(C_PARK).lerp(C_LAWN, ss(.4, .7, fbm(x*.03 + 1, z*.03)));
  // газон біля «Бібліотеки» й на подвір'ї
  var dl = Math.hypot(x - LIB[0] + 14, z - LIB[1] + 4); if (dl < 60 && x < e) c.lerp(C_LAWN, (1 - ss(36, 60, dl))*.8);
  if (x > -82 && x < -36 && z > -44 && z < 14) c.lerp(C_GRAVEL, .85);
  if (Math.hypot(x - LAWN[0], z - LAWN[1]) < 11) c.copy(C_LAWN);
  // шлях, під'їзд, алея
  var d1 = polyDist(x, z, ROAD); if (d1 < 6) c.lerp(C_ROAD, 1 - ss(3.2, 6, d1));
  var d2 = Math.min(polyDist(x, z, DRIVE), polyDist(x, z, LANE)); if (d2 < 3.4) c.lerp(C_GRAVEL, (1 - ss(1.6, 3.4, d2))*.9);
  c.multiplyScalar(.82 + .3*n);
  gc[i*3] = c.r; gc[i*3 + 1] = c.g; gc[i*3 + 2] = c.b;
}
gGeo.setAttribute('color', new T.BufferAttribute(gc, 3)); gGeo.computeVertexNormals();
var grainTex = (function(){ var c = document.createElement('canvas'); c.width = c.height = 256; var g = c.getContext('2d'), d = g.createImageData(256, 256);
  for (var k = 0; k < d.data.length; k += 4){ var v = 200 + Math.random()*55; d.data[k] = d.data[k + 1] = d.data[k + 2] = v; d.data[k + 3] = 255; } g.putImageData(d, 0, 0);
  var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(140, 180); return t; })();
var ground = new T.Mesh(gGeo, new T.MeshStandardMaterial({vertexColors: true, roughness: 1, map: grainTex}));
ground.receiveShadow = true; scene.add(ground);
(function(){
  var g = new T.PlaneGeometry(5200, 5200, 90, 90); g.rotateX(-Math.PI/2);
  var p = g.attributes.position, cc = new Float32Array(p.count*3);
  for (var k = 0; k < p.count; k++){ var x = p.getX(k), z = p.getZ(k), e = edgeX(Math.max(-600, Math.min(600, z)));
    var h = x > e + 30 ? MEADOW - .3 : -.35; p.setY(k, h - .25);
    var c = x > e + 30 ? tmpC.copy(C_MEADOW).lerp(C_WET, .4) : tmpC.copy(C_FIELD1).lerp(C_PARK, hash(Math.floor(x/120), Math.floor(z/120)) > .5 ? .7 : .1);
    c.multiplyScalar(.75 + .25*hash(Math.floor(x/60), Math.floor(z/60))); cc[k*3] = c.r; cc[k*3 + 1] = c.g; cc[k*3 + 2] = c.b; }
  g.setAttribute('color', new T.BufferAttribute(cc, 3)); g.computeVertexNormals();
  var m = new T.Mesh(g, new T.MeshStandardMaterial({vertexColors: true, roughness: 1})); m.position.y = 0; scene.add(m);
})();

/* вода */
var waterU = {uTime: {value: 0}, uSky: {value: col(0x26324a)}, uDeep: {value: col(0x1a2730)}, uSun: {value: new T.Vector3(0, 1, 0)}, uSunC: {value: col(0xffffff)}, uFire: {value: 0},
  fogColor: {value: new T.Color()}, fogDensity: {value: .002}};
var waterMat = new T.ShaderMaterial({uniforms: waterU, transparent: true, fog: true,
  vertexShader: 'varying vec3 vW;\n#include <fog_pars_vertex>\nvoid main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition; \n#include <fog_vertex>\n}',
  fragmentShader: 'uniform float uTime,uFire; uniform vec3 uSky,uDeep,uSun,uSunC; varying vec3 vW;\n#include <fog_pars_fragment>\n' +
    'void main(){ vec2 p = vW.xz; float r = sin(p.x*.35 + uTime*1.1 + sin(p.y*.2)*2.)*.5 + sin(p.y*.45 - uTime*.8 + p.x*.1)*.5; vec3 n = normalize(vec3(r*.18, 1., cos(p.x*.3 + p.y*.25 + uTime)*.12));' +
    'vec3 v = normalize(cameraPosition - vW); float fr = pow(1. - max(dot(n, v), 0.), 3.); vec3 c = mix(uDeep, uSky, .35 + .65*fr); vec3 h = reflect(-normalize(uSun), n); float s = pow(max(dot(h, v), 0.), 90.);' +
    'c += uSunC*s*.9 + vec3(1.,.45,.12)*uFire*fr*.4; gl_FragColor = vec4(c, .9); \n#include <fog_fragment>\n}'});
function waterStrip(fx, w, level){
  var z0 = GZ0, z1 = GZ1, segs = 120, pos = [], idx = [];
  for (var k = 0; k <= segs; k++){ var zz = lerp(z0, z1, k/segs), xx = fx(zz); pos.push(xx - w/2, level, zz, xx + w/2, level, zz); if (k){ var a = (k - 1)*2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
  var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); var m = new T.Mesh(g, waterMat); scene.add(m); return m; }
waterStrip(riverX, 46, RIVER_W); waterStrip(creekX, 7, CREEK_W);
PONDS.forEach(function(p){ var m = new T.Mesh(new T.CircleGeometry(1, 40), waterMat); m.scale.set(p[2]*1.25, p[3]*1.25, 1); m.rotation.x = -Math.PI/2; m.position.set(p[0], POND_W, p[1]); scene.add(m); });
(function(){ var m = new T.Mesh(new T.CircleGeometry(1, 48), waterMat); m.scale.set(MILL[2]*1.22, MILL[3]*1.22, 1); m.rotation.x = -Math.PI/2; m.position.set(MILL[0], MILL_W, MILL[1]); scene.add(m); })();

/* ───────────── будівлі ───────────── */
var PICK = [];                                                     // меші, на які можна натиснути
var WIN_MATS = {palace: [], ofc: [], other: []};
function facade(L, floors, wall, o){
  o = o || {};
  var axes = Math.max(1, Math.round(L/(o.axis || 3.3))), aw = 56, fh = 110, cw = axes*aw, ch = floors*fh + 16;
  var c = document.createElement('canvas'); c.width = Math.min(2048, cw); c.height = ch; var g = c.getContext('2d'), sx = c.width/cw;
  var e = document.createElement('canvas'); e.width = c.width; e.height = ch; var ge = e.getContext('2d');
  g.fillStyle = wall; g.fillRect(0, 0, c.width, ch); ge.fillStyle = '#000'; ge.fillRect(0, 0, c.width, ch);
  for (var k = 0; k < 700; k++){ g.fillStyle = 'rgba(' + (Math.random() < .5 ? '0,0,0' : '255,255,255') + ',' + (Math.random()*.05) + ')'; g.fillRect(Math.random()*c.width, Math.random()*ch, 3, 3); }
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, ch - 16, c.width, 16);                                        // цоколь
  g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(0, 0, c.width, 7); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, 7, c.width, 3);   // карниз
  if (!o.plain){ for (var y = 12; y < ch - 16; y += 11){ g.fillStyle = 'rgba(0,0,0,.13)'; g.fillRect(0, y, 14*sx, 2); g.fillRect(c.width - 14*sx, y, 14*sx, 2); } }   // боні на кутах
  for (var f = 0; f < floors; f++){
    if (f > 0){ g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(0, f*fh + 2, c.width, 4); }
    for (var a = 0; a < axes; a++){
      var cx = (a + .5)*aw*sx, ww = aw*.42*sx, wh = fh*.56, wy = f*fh + fh*.24 + 8;
      var door = o.door && f === floors - 1 && a === Math.floor(axes/2);
      if (door){ wh = fh*.74; wy = f*fh + fh*.2 + 8; }
      g.fillStyle = 'rgba(245,238,220,.9)'; g.fillRect(cx - ww/2 - 3, wy - 3, ww + 6, wh + 6);
      g.fillStyle = door ? '#4a3524' : '#262a30'; g.fillRect(cx - ww/2, wy, ww, wh);
      if (!door){ g.fillStyle = 'rgba(245,238,220,.75)'; g.fillRect(cx - 1, wy, 2, wh); g.fillRect(cx - ww/2, wy + wh*.36, ww, 2); }
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(cx - ww/2 - 5, wy + wh + 3, ww + 10, 3);
      if (!door){ var lit = Math.random(); ge.fillStyle = lit < .25 ? '#000' : 'rgba(255,' + (170 + Math.random()*50|0) + ',' + (90 + Math.random()*40|0) + ',' + (.45 + lit*.55).toFixed(2) + ')'; ge.fillRect(cx - ww/2, wy, ww, wh); }
    }
  }
  var t1 = new T.CanvasTexture(c), t2 = new T.CanvasTexture(e); t1.encoding = t2.encoding = T.sRGBEncoding; t1.anisotropy = 4; return {map: t1, em: t2};
}
function hipRoof(w, d, rh, gable){
  var along = w >= d, ins = gable ? 0 : Math.min(w, d)/2;
  var p = along ? [[-w/2, -d/2], [w/2, -d/2], [w/2, d/2], [-w/2, d/2], [-w/2 + ins, 0], [w/2 - ins, 0]] : [[-w/2, -d/2], [w/2, -d/2], [w/2, d/2], [-w/2, d/2], [0, -d/2 + ins], [0, d/2 - ins]];
  var B = function(i){ return [p[i][0], 0, p[i][1]]; }, Rr = function(i){ return [p[i][0], rh, p[i][1]]; };
  var tris = along ? [[B(0), Rr(4), Rr(5)], [B(0), Rr(5), B(1)], [B(1), Rr(5), B(2)], [B(2), Rr(5), Rr(4)], [B(2), Rr(4), B(3)], [B(3), Rr(4), B(0)]]
                   : [[B(0), Rr(4), B(1)], [B(1), Rr(4), Rr(5)], [B(1), Rr(5), B(2)], [B(2), Rr(5), B(3)], [B(3), Rr(5), Rr(4)], [B(3), Rr(4), B(0)]];
  var arr = []; tris.forEach(function(t){ arr.push.apply(arr, t[0].concat(t[2], t[1])); });
  var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(arr, 3)); g.computeVertexNormals(); return g;
}
var ROOF_TIN = new T.MeshStandardMaterial({color: 0x5c6261, roughness: .55, metalness: .25, side: T.DoubleSide});
var ROOF_RED = new T.MeshStandardMaterial({color: 0x7a4c39, roughness: .85, side: T.DoubleSide});
var ROOF_THATCH = new T.MeshStandardMaterial({color: 0x6b5a3c, roughness: 1, side: T.DoubleSide});
var CHAR = new T.MeshBasicMaterial({color: 0x17120e});
var CORN = new T.MeshStandardMaterial({color: 0xf1e9d6, roughness: .9}), PLINTH = new T.MeshStandardMaterial({color: 0x9a8f7c, roughness: 1});
function block(r, h, floors, wall, o){
  o = o || {};
  var w = r.x1 - r.x0, d = r.z1 - r.z0, x = (r.x0 + r.x1)/2, z = (r.z0 + r.z1)/2, y0 = o.y0 != null ? o.y0 : Math.min(H(r.x0, r.z0), H(r.x1, r.z1), H(x, z)) - .2;
  var grp = new T.Group(); grp.position.set(x, y0, z); scene.add(grp);
  var fx = o.timber ? null : facade(d, floors, wall, {door: o.doorX, plain: o.plain}), fz = o.timber ? null : facade(w, floors, wall, {door: o.doorZ, plain: o.plain});
  function m(f){ if (!f) return new T.MeshStandardMaterial({color: wall, roughness: 1});
    var mm = new T.MeshStandardMaterial({map: f.map, emissiveMap: f.em, emissive: 0xffc27a, emissiveIntensity: 0, roughness: .95}); (o.kind ? WIN_MATS[o.kind] : WIN_MATS.other).push(mm); return mm; }
  var cn = null, mats = [m(fx), m(fx), new T.MeshStandardMaterial({color: wall}), new T.MeshStandardMaterial({color: wall}), m(fz), m(fz)];
  var body = new T.Mesh(new T.BoxGeometry(w, h, d), mats.slice()); body.position.y = h/2; body.castShadow = body.receiveShadow = true; grp.add(body);
  if (!o.timber){
    var pl = new T.Mesh(new T.BoxGeometry(w + .35, .8, d + .35), PLINTH); pl.position.y = .4; grp.add(pl);
    cn = new T.Mesh(new T.BoxGeometry(w + .7, .45, d + .7), CORN); cn.position.y = h; cn.castShadow = true; grp.add(cn);
  }
  var roof = new T.Group(); roof.position.y = h + (o.timber ? 0 : .22); grp.add(roof);
  var rh = Math.min(w, d)*(o.pitch || .33);
  var rf = new T.Mesh(hipRoof(w + 1.4, d + 1.4, rh, o.gable), o.roofMat || ROOF_TIN); rf.castShadow = true; roof.add(rf);
  if (o.chim){ for (var k = 0; k < o.chim; k++){ var ch = new T.Mesh(new T.BoxGeometry(.9, 2.4, .9), PLINTH); var along = w >= d;
    ch.position.set(along ? lerp(-w/4, w/4, o.chim > 1 ? k/(o.chim - 1) : .5) : (k % 2 ? 1.2 : -1.2), rh*.75, along ? (k % 2 ? 1.2 : -1.2) : lerp(-d/4, d/4, o.chim > 1 ? k/(o.chim - 1) : .5)); ch.castShadow = true; roof.add(ch); } }
  grp.userData = {body: body, roof: roof, mats: mats, wall: col(wall), h: h, rh: rh, w: w, d: d, cn: cn};
  return grp;
}
function pediment(x, z, y, face, wall, wdt){            // ризаліт із трикутним фронтоном; face: напрямок нормалі ('n','s','e','w')
  var grp = new T.Group(), h = y;
  var rz = new T.Mesh(new T.BoxGeometry(wdt, h + .5, 1.6), new T.MeshStandardMaterial({color: wall})); rz.position.y = (h + .5)/2; rz.castShadow = true; grp.add(rz);
  var sh = new T.Shape(); sh.moveTo(-wdt/2 - .4, 0); sh.lineTo(wdt/2 + .4, 0); sh.lineTo(0, wdt*.3); sh.lineTo(-wdt/2 - .4, 0);
  var pd = new T.Mesh(new T.ExtrudeGeometry(sh, {depth: 1.8, bevelEnabled: false}), CORN); pd.position.set(0, h + .5, -.9); pd.castShadow = true; grp.add(pd);
  var ow = new T.Mesh(new T.CircleGeometry(.55, 20), new T.MeshStandardMaterial({color: 0x2b2a2c})); ow.position.set(0, h + .5 + wdt*.12, .92); grp.add(ow);
  grp.rotation.y = {s: 0, n: Math.PI, e: Math.PI/2, w: -Math.PI/2}[face]; grp.position.set(x, H(x, z) - .2, z); scene.add(grp); return grp;
}

/* палац: два двоповерхові крила й одноповерхова середина (так описав його Ліпінський) */
var WALL = '#e9dfc6', WALL2 = '#e2d6ba';
var palS = block(PAL.S, 9.2, 2, WALL, {kind: 'palace', chim: 3, doorZ: true});
var palM = block(PAL.M, 5.4, 1, WALL2, {kind: 'palace', chim: 2, doorX: true});
var palN = block(PAL.N, 9.2, 2, WALL, {kind: 'palace', chim: 3, doorZ: true});
var PALACE = {S: palS, M: palM, N: palN};
// ґанок у середині, з боку подвір'я
(function(){ var c = cen(PAL.M), x = PAL.M.x1 + 1.6, y = H(x, c[1]);
  for (var k = 0; k < 4; k++){ var col4 = new T.Mesh(new T.CylinderGeometry(.32, .36, 5.4, 12), CORN); col4.position.set(x + 1.2, y + 2.7, c[1] - 4.5 + k*3); col4.castShadow = true; scene.add(col4); }
  var ent = new T.Mesh(new T.BoxGeometry(3.4, .5, 11), CORN); ent.position.set(x + .6, y + 5.6, c[1]); ent.castShadow = true; scene.add(ent);
  var st = new T.Mesh(new T.BoxGeometry(3, .6, 10), PLINTH); st.position.set(x + .8, y + .3, c[1]); scene.add(st); })();
// менша офіцина (Г-подібна руїна на знімку): одноповерхова, з ризалітом і фронтоном до подвір'я
var OF1 = {x0: -75, x1: -42, z0: 27.4, z1: 40.6}, OF2 = {x0: -54, x1: -42, z0: 11.8, z1: 27.4};
var ofc1 = block(OF1, 5.2, 1, WALL, {kind: 'ofc', chim: 3}), ofc2 = block(OF2, 5.2, 1, WALL, {kind: 'ofc', chim: 1});
pediment(-64.5, OF1.z0 - .7, 5.2, 'n', WALL, 9);
// господарська будівля на північ від подвір'я
var NB = {x0: -63.8, x1: -37.8, z0: -54.6, z1: -43.4};
var nbld = block(NB, 4.6, 1, '#ddd0b2', {kind: 'other', chim: 1, roofMat: ROOF_RED});
// інші будівлі за знімком
function R(px0, px1, py0, py1){ var a = W(px0, py0), b = W(px1, py1); return {x0: Math.min(a[0], b[0]), x1: Math.max(a[0], b[0]), z0: Math.min(a[1], b[1]), z1: Math.max(a[1], b[1])}; }
var SMALL = [R(1170, 1285, 685, 740), R(1045, 1072, 1037, 1090), R(1073, 1105, 1060, 1095), R(1230, 1290, 1115, 1165)];
SMALL.forEach(function(r){ block(r, 4, 1, '#d6c9aa', {roofMat: ROOF_RED, chim: 1}); });
var FARM = [R(1380, 1460, 850, 900), R(1670, 1780, 860, 935), R(1700, 1780, 995, 1075), R(1795, 2030, 1020, 1085), R(1835, 2065, 815, 910), R(2040, 2100, 690, 835), R(1615, 1665, 945, 1015)];
FARM.forEach(function(r){ block(r, 4.2, 1, '#6a5640', {timber: true, gable: true, pitch: .55, roofMat: ROOF_THATCH}); });
// село Воробин уздовж шляху
var rv = rngF(5), VIL = [];
for (i = 0; i < 46; i++){
  var vz = -150 - rv()*300, side = rv() < .55 ? -1 : 1, vx = roadX(vz) + side*(14 + rv()*26);
  if (Math.abs(vx - MILL[0]) < 30 && Math.abs(vz - MILL[1]) < 40) continue;
  var hw = 6 + rv()*3, hd = 4.5 + rv()*1.5, rot = rv() < .5;
  var rr = {x0: vx - (rot ? hd : hw)/2, x1: vx + (rot ? hd : hw)/2, z0: vz - (rot ? hw : hd)/2, z1: vz + (rot ? hw : hd)/2};
  VIL.push(block(rr, 2.8, 1, rv() < .7 ? '#e6ddc8' : '#9b8364', {timber: true, gable: true, pitch: .75, roofMat: ROOF_THATCH}));
}
// мур саду
(function(){
  var mat = new T.MeshStandardMaterial({color: 0xd9ceb4, roughness: 1});
  for (var k = 0; k < GARDEN.length; k++){ var a = GARDEN[k], b = GARDEN[(k + 1) % GARDEN.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (k === GARDEN.length - 1) continue;
    var m = new T.Mesh(new T.BoxGeometry(L, 2, .45), mat); m.position.set((a[0] + b[0])/2, H((a[0] + b[0])/2, (a[1] + b[1])/2) + .9, (a[1] + b[1])/2);
    m.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]); m.castShadow = m.receiveShadow = true; scene.add(m); }
})();
// «Бібліотека»
var libGroup = new T.Group(); libGroup.position.set(LIB[0], 0, LIB[1]); scene.add(libGroup);

/* ───────────── дерева ───────────── */
function mergeColored(parts){                                   // [[geometry, color]] → одна геометрія з кольорами вершин
  var P = [], N = [], C = [];
  parts.forEach(function(q){ var g = q[0].index ? q[0].toNonIndexed() : q[0], c = col(q[1]); g.computeVertexNormals();
    var p = g.attributes.position.array, n = g.attributes.normal.array; for (var k = 0; k < p.length; k += 3){ P.push(p[k], p[k + 1], p[k + 2]); N.push(n[k], n[k + 1], n[k + 2]); C.push(c.r, c.g, c.b); } });
  var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(N, 3)); g.setAttribute('color', new T.Float32BufferAttribute(C, 3)); return g;
}
function tr(g, x, y, z, s){ g.scale(s[0], s[1], s[2]); g.translate(x, y, z); return g; }
var TREE_GEO = {
  spruce: mergeColored([[tr(new T.CylinderGeometry(.18, .3, 2, 6), 0, 1, 0, [1, 1, 1]), 0x4a3828], [tr(new T.ConeGeometry(2.6, 4.2, 8), 0, 3.6, 0, [1, 1, 1]), 0x24361f], [tr(new T.ConeGeometry(2.05, 3.6, 8), 0, 5.8, 0, [1, 1, 1]), 0x27391f], [tr(new T.ConeGeometry(1.4, 3.2, 8), 0, 7.9, 0, [1, 1, 1]), 0x2b3e22]]),
  oak: mergeColored([[tr(new T.CylinderGeometry(.3, .5, 4, 6), 0, 2, 0, [1, 1, 1]), 0x4a3a2a], [tr(new T.IcosahedronGeometry(2.6, 1), 0, 5.6, 0, [1.1, .85, 1.1]), 0x6e5832], [tr(new T.IcosahedronGeometry(2, 1), 1.6, 6.6, .8, [1, .9, 1]), 0x5f4a2a], [tr(new T.IcosahedronGeometry(1.9, 1), -1.5, 6.2, -.9, [1, .9, 1]), 0x7a6036]]),
  bare: mergeColored([[tr(new T.CylinderGeometry(.22, .4, 5, 5), 0, 2.5, 0, [1, 1, 1]), 0x3f3226], [tr(new T.IcosahedronGeometry(2.6, 1), 0, 6, 0, [1, 1.05, 1]), 0x4f4538], [tr(new T.IcosahedronGeometry(1.7, 0), 1.2, 7.6, .5, [1, 1, 1]), 0x5a4e40]]),
  poplar: mergeColored([[tr(new T.CylinderGeometry(.2, .35, 3, 6), 0, 1.5, 0, [1, 1, 1]), 0x463828], [tr(new T.IcosahedronGeometry(1.6, 1), 0, 8, 0, [1, 4.2, 1]), 0x5a5634]]),
  fruit: mergeColored([[tr(new T.CylinderGeometry(.14, .2, 1.6, 5), 0, .8, 0, [1, 1, 1]), 0x4a3b2c], [tr(new T.IcosahedronGeometry(1.4, 0), 0, 2.5, 0, [1.2, .8, 1.2]), 0x6e5e48]]),
  willow: mergeColored([[tr(new T.CylinderGeometry(.3, .45, 2.4, 6), 0, 1.2, 0, [1, 1, 1]), 0x4a3c2c], [tr(new T.IcosahedronGeometry(2.4, 1), 0, 3.8, 0, [1.25, .8, 1.25]), 0x7b8466]])
};
var TREES = {spruce: [], oak: [], bare: [], poplar: [], fruit: [], willow: []};
function canTree(x, z, r){
  r = r || 4;
  var boxes = [PAL.S, PAL.M, PAL.N, OF1, OF2, NB].concat(SMALL, FARM);
  for (var k = 0; k < boxes.length; k++){ var b = boxes[k]; if (x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r) return false; }
  if (Math.hypot(x - LIB[0], z - LIB[1]) < 22) return false;
  if (polyDist(x, z, ROAD) < 7 || polyDist(x, z, DRIVE) < 5 || polyDist(x, z, LANE) < 4.5) return false;
  if (x > -84 && x < -34 && z > -46 && z < 16) return false;
  return true;
}
function addT(k, x, z, s){ TREES[k].push([x, H(x, z), z, s, rnd()*6.283]); }
var rt = rngF(21);
// старий парк на південь і довкола «Бібліотеки»
for (i = 0; i < (LOW ? 330 : 520); i++){
  var tx = -200 + rt()*300, tz = 44 + rt()*260, e2 = edgeX(tz);
  if (tx > e2 + 4 || tx < roadX(tz) + 8) continue;
  var dl2 = Math.hypot(tx - LIB[0] + 18, tz - LIB[1] + 2); if (dl2 < 46 && rt() < .92) continue;            // галявина перед портиком і колонадою
  if (fbm(tx*.025, tz*.025) < .38) continue;
  if (!canTree(tx, tz)) continue;
  var kk = rt(); addT(kk < .22 ? 'spruce' : kk < .55 ? 'oak' : kk < .9 ? 'bare' : 'poplar', tx, tz, .85 + rt()*.6);
}
// дерева на схилі й між будівлями
for (i = 0; i < 120; i++){ var sz = -130 + rt()*420, sx2 = edgeX(sz) + (rt() - .4)*16; if (canTree(sx2, sz)) addT(rt() < .3 ? 'spruce' : 'bare', sx2, sz, .8 + rt()*.6); }
for (i = 0; i < 60; i++){ var bx = -126 + rt()*90, bz = -95 + rt()*55; if (bz > -60 && bx > -108) continue; if (canTree(bx, bz)) addT(rt() < .4 ? 'spruce' : 'oak', bx, bz, .9 + rt()*.5); }
// тополі вздовж шляху
for (var zz = -300; zz < 330; zz += 11){ var rx2 = roadX(zz); [-1, 1].forEach(function(sd){ if (rt() < .82) addT('poplar', rx2 + sd*(6.5 + rt()*1.2), zz + rt()*2, .9 + rt()*.3); }); }
// липова алея від шляху до подвір'я
for (var ax = -128; ax < -84; ax += 7){ addT('bare', ax, -6.5, 1); addT('bare', ax, 4.8, 1); }
// сад: ряди фруктових дерев
for (var gx = -36; gx < 100; gx += 8) for (var gz = -126; gz < 34; gz += 8){ var jx = gx + (rt() - .5)*1.6, jz = gz + (rt() - .5)*1.6; if (inPoly(jx, jz, GARDEN) && canTree(jx, jz, 3) && polyDist(jx, jz, GARDEN) > 3) addT('fruit', jx, jz, .9 + rt()*.3); }
// верби над водою
for (i = 0; i < 110; i++){ var wz = -400 + rt()*800, onR = rt() < .5, wx = onR ? riverX(wz) + (rt() < .5 ? -1 : 1)*(25 + rt()*5) : creekX(wz) + (rt() < .5 ? -1 : 1)*(5 + rt()*3); addT('willow', wx, wz, .8 + rt()*.5); }
PONDS.forEach(function(p){ for (var k = 0; k < 7; k++){ var a = k/7*6.283 + rt(); addT('willow', p[0] + Math.cos(a)*p[2]*1.5, p[1] + Math.sin(a)*p[3]*1.6, .8 + rt()*.4); } });
for (i = 0; i < 14; i++){ var a2 = rt()*6.283; addT('willow', MILL[0] + Math.cos(a2)*MILL[2]*1.45, MILL[1] + Math.sin(a2)*MILL[3]*1.35, .8 + rt()*.4); }
// ліс на обрії
for (i = 0; i < (LOW ? 260 : 420); i++){ var fa = rt()*6.283, fr = 420 + rt()*260, fxx = 15 + Math.cos(fa)*fr*1.1, fzz = -20 + Math.sin(fa)*fr; if (fxx > 230 && Math.abs(fzz) < 300) continue; TREES[rt() < .6 ? 'spruce' : 'oak'].push([fxx, -3.5, fzz, 2 + rt()*1.4, rt()*6.283]); }
var treeMat = new T.MeshStandardMaterial({vertexColors: true, roughness: .95, flatShading: true});
var dummy = new T.Object3D();
Object.keys(TREES).forEach(function(k){
  var L = TREES[k]; if (!L.length) return;
  var im = new T.InstancedMesh(TREE_GEO[k], treeMat, L.length); im.castShadow = true; im.receiveShadow = false;
  L.forEach(function(q, j){ dummy.position.set(q[0], q[1], q[2]); dummy.rotation.set(0, q[4], 0); dummy.scale.setScalar(q[3]); dummy.updateMatrix(); im.setMatrixAt(j, dummy.matrix);
    var v = .82 + hash(q[0], q[2])*.36; im.setColorAt(j, new T.Color(v, v, v)); });
  scene.add(im);
});
// ялина на газоні подвір'я (на малюнку Орди 1870 року)
(function(){ var m = new T.Mesh(TREE_GEO.spruce, treeMat); m.scale.setScalar(1.35); m.position.set(LAWN[0], H(LAWN[0], LAWN[1]), LAWN[1]); m.castShadow = true; scene.add(m); })();

/* ───────────── німецька артилерія з боку саду ───────────── */
var GUNS = [[-6, 50], [18, 52], [42, 50]];
(function(){
  var dark = new T.MeshStandardMaterial({color: 0x3c4236, roughness: .7, metalness: .3}), wood = new T.MeshStandardMaterial({color: 0x4a3a2a});
  GUNS.forEach(function(p){
    var g = new T.Group();
    var br = new T.Mesh(new T.CylinderGeometry(.14, .2, 3.2, 10), dark); br.rotation.x = Math.PI/2 - .25; br.position.set(0, 1.25, -1.1); g.add(br);
    var sh = new T.Mesh(new T.BoxGeometry(1.8, 1.1, .12), dark); sh.position.set(0, 1.1, -.2); g.add(sh);
    [-0.85, .85].forEach(function(sx){ var wh = new T.Mesh(new T.TorusGeometry(.62, .08, 6, 16), wood); wh.rotation.y = Math.PI/2; wh.position.set(sx, .65, 0); g.add(wh); });
    var tl = new T.Mesh(new T.BoxGeometry(.25, .2, 3), wood); tl.position.set(0, .35, 1.4); tl.rotation.x = -.12; g.add(tl);
    g.traverse(function(o){ if (o.isMesh) o.castShadow = true; });
    g.position.set(p[0], H(p[0], p[1]), p[1]); g.rotation.y = Math.PI; scene.add(g);
  });
})();
var campfire = new T.PointLight(0xff8a3a, 0, 40, 2); campfire.position.set(30, H(30, 58) + 1.5, 58); scene.add(campfire);

/* ───────────── хроніка ───────────── */
var cN = cen(PAL.N), cM = cen(PAL.M), cS = cen(PAL.S);
var STEPS = [
 {t: 13.2, cam: [[120, 128, 178], [-28, 0, 6]], time: 'листопад 1918', day: 'маєток Плятерів', h: 'Воробин перед повстанням',
  p: 'Резиденція дубровицьких Плятерів на терасі над лугами Горині. Палацу як такого Плятери так і не збудували: жили в офіцинах. Найбільша — двоповерхова будівля біля шляху з двома крилами й одноповерховою серединою. Навпроти неї подвір\'я з газоном і ялиною, далі сад за муром і павільйон «Бібліотека» над схилом. Натисніть на будь-яку будівлю, щоб дізнатися про неї більше.',
  s: 'Розташування — за обрисами руїн на аерофотознімку; будівлі — за історією резиденції, малюнком Н. Орди (1870) і описом Ліпінського (1922)'},
 {t: 21, cam: [[-6, 62, 78], [-78, 4, -26]], time: '21:00', day: '21 листопада, четвер', h: 'Вечір перед нападом',
  p: 'У палаці брати Ігнацій та Антоній Плятери, повірений Пшедзимирський і службовці. Маєток стереже найнята варта — шістнадцять чоловік під командою Кальтенберга з Рівного, з кулеметом. Біля саду стоїть німецька артилерія, її пости тримають варту з цього боку. А в Дубровиці о 10-й вечора повстанці захоплюють державну варту.',
  s: 'Ліпінський, 6.IX.1922, арк. 395; Буйновський, Латта, 1920; Ф. Пирішко, «Червоний прапор», 1958'},
 {t: 22, cam: [[-20, 175, 190], [-105, 0, -20]], time: '22:00', day: '21 листопада', h: 'Облога',
  p: 'З темряви виходять натовпи селян із навколишніх сіл, з карабінами, револьверами й гранатами, зі смолоскипами. За схемою 1927 року загін № 1 іде шляхом з Дубровиці, № 2 і № 3 обходять маєток з флангів, а № 4 стоїть на півночі й чекає сигналу ракетою. Варта сурмить тривогу й займає позиції.',
  s: 'Обвинувальний акт, арк. 3; Ліпінський, арк. 395 зв.; «Красная звезда», 1927. Інші свідки називають 23:00, північ або 1–2-гу ночі.'},
 {t: 22.33, cam: [[-10, 95, 95], [-82, 2, -24]], time: '≈ 22:20', day: '21 листопада', h: 'Перші двадцять хвилин',
  p: 'Злітає ракета, і загін з півночі теж іде в атаку. Селяни відразу стріляють і кидають гранати. На подвір\'ї падає вартовий Піскунов, поранений в обидві ноги; поранено й ветеринара Росіна. Кулемет оборонців заклинює. Німецькі пости з боку саду пропускають селян крізь свої ряди. За двадцять хвилин оборонці відступають до палацу й заносять туди поранених.',
  s: 'Ліпінський, арк. 395 зв.; Латта й Галушкевич, 1920: кулемет зіпсувався на початку бою'},
 {t: 23.7, cam: [[-10, 48, -118], [-88, 5, -46]], time: 'до 24:00', day: 'ніч на 22 листопада', h: 'Оборона у правому крилі',
  p: '«Двадцять з чимось людей» обороняються в правому крилі, від дороги. Будинок має два двоповерхові крила й одноповерхову середину. Кілька гранат влітає всередину, на щастя, до порожньої зали. Ще до півночі куля влучає в ногу самому Ліпінському.',
  s: 'Ліпінський, арк. 395 зв.–396'},
 {t: 24, cam: [[16, 70, 72], [-56, 0, 4]], time: '00:00', day: '22 листопада, п\'ятниця', h: 'Опівночі у дворі',
  p: 'Гурти нападників обшукують помешкання службовців і шукають вартових. До садівника Галушкевича вдираються п\'ятнадцятеро з криком «Де гайдамаки?!». Радванського, якого взяли за вартового, відпускає чоловік з червоною кокардою — Михайло Конончук. Сибіковського хочуть розстріляти як «гайдамаку», поки за нього не заступається Петро Кустов.',
  s: 'Радванський і Галушкевич, 1920, арк. 569, 580; Сибіковський, 1922, арк. 398'},
 {t: 28, cam: [[-70, 45, 95], [-118, 2, 30]], time: '00:00–11:00', day: '22 листопада', h: 'Поранених везуть до Дубровиці',
  p: 'Поранених селян по одному чи по двоє везуть до лікарні в Дубровиці на підводі, яку повстанці заздалегідь виділили для цього. У книзі хворих їх запишуть 22 листопада; серед них Теодор Пирішко, Іван Дем\'янець і Онуфрій Харківець. Облога триває всю ніч.',
  s: 'Фельдшери Пальонка й Калінський, 1920 і 1922; книга хворих'},
 {t: 34.5, cam: [[-24, 62, 34], [-92, 8, -32]], time: '≈ 10:30', day: '22 листопада', h: 'Підпал',
  p: 'Селяни підпалюють будинок, і він горить зсередини. Середина вже в огні, тож оборонці через горище переходять із правого крила в ліве. У Дубровиці озброєний чоловік вимагає в аптеці два пуди бензину, «щоби підпалити палац Плятерів».',
  s: 'Ліпінський, арк. 396; Більчинська, 1920, арк. 566 зв.–567 (вона датує це 23 листопада)'},
 {t: 37, cam: [[-340, 150, 40], [-150, 0, -25]], time: 'удень', day: '22 листопада', h: 'Підмога із сіл',
  p: 'До Острівців прискакує вершник: «Воробин оточений!». Лук\'ян і Хома Гончарі беруть карабіни й біжать до маєтку. З Мочулища приходить загін із сорока чоловік на чолі з Ісааком Петрушком і веде з собою управителя Мольського. Палац горить.',
  s: 'Голяк і Латта, 1920, арк. 571–573; Мольський, 1920 і 1922, арк. 565, 374'},
 {t: 40, cam: [[-8, 58, 44], [-70, 2, -22]], time: '≈ 16:00', day: '22 листопада', h: 'Капітуляція',
  p: 'Набої скінчилися, будинок горить, дах провалюється. Оборонці складають зброю й виходять: селяни пообіцяли, що їх лише заарештують і що буде суд. На них кидаються з багнетами, але один із ватажків зупиняє натовп. Сибіковський чув, як Олександр Конончук поставив долю полонених «на голосування».',
  s: 'Буйновський, 1920, арк. 579 зв.; Ліпінський, арк. 396; Сибіковський, арк. 398'},
 {t: 41, cam: [[-66, 92, 44], [-136, 0, -22]], time: '15:00–17:00', day: '22 листопада', h: 'Розстріл',
  p: 'Полонених виводять на дорогу, шикують у шеренгу й розстрілюють. Повіреного Пшедзимирського вбивають раніше, коли він кидається тікати. Мітлюх казав, що графів відвели вбік на дорогу й розстріляли окремо. Згодом Свириденко бачить 21 тіло, покладене рядком.',
  s: 'Ліпінський, арк. 396–397; Сибіковський, арк. 398; Мітлюх, 1919. Час: близько 15:00 (Мольський, Калінський, Свириденко, Литвинчук) або 17:00 (Ліпінський).'},
 {t: 42.5, cam: [[-60, 110, 150], [-120, 0, 30]], time: '17:00–18:00', day: '22 листопада, вечір', h: 'Після',
  p: 'Поранених Ліпінського й Піскунова три-чотири години б\'ють прикладами. Ліпінського рятує селянин, який просить віддати його під «революційний трибунал»: пораненого кладуть на воза під два трупи. Увечері обох привозять до лікарні в Дубровиці. Литвинчук зустрічає п\'яного Нашору, за яким везуть бочку горілки. Палац догоряє.',
  s: 'Ліпінський, арк. 396 зв.; Литвинчук; фельдшери, 1920'}
];
var N = STEPS.length;
// вогонь по частинах палацу на кожному кроці: [північне (праве) крило, середина, південне (ліве) крило]
var FIRE = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [.35, 1, 0], [1, 1, .35], [1, 1, 1], [.75, .6, .8], [.45, .35, .5]];
var ROOF_GONE = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 1], [1, 1, 1], [1, 1, 1]];
var SHOTS = [0, 0, .5, 1, .55, .35, .3, .65, .5, 0, 0, 0];         // інтенсивність стрілянини
var WINDOWS = [.35, 1, .25, .1, .05, .05, .05, 0, 0, 0, 0, 0];     // світло у вікнах палацу

/* ───────────── люди ───────────── */
function C(x, z, r, o){ o = o || {}; o.c = [x, z]; o.r = r; return o; }
var POSTS = [[-72, -40], [-76, -14], [-62, -26], [-50, 8], [-128, 0], [-108, 1], [-38, -32], [-26, 14], [66, 58], [-62, -66], [-92, -66], [-116, -30], [-114, -52], [-62, 48], [-30, 44], [-96, 14]];
var IN_N = [cN[0] + 6, cN[1] + 1], IN_S = [cS[0] + 6, cS[1] - 1];
var GROUPS = [
  {id: 'def', cls: 'def', col: 0x3f68c4, n: 22, h: 1,
   st: [{pts: POSTS.concat([[-70, -30], [-70, -34], [-70, -22], [-70, -26], [-68, -28], [-68, -32]])}, {pts: POSTS.concat([[-70, -30], [-70, -34], [-70, -22], [-70, -26], [-68, -28], [-68, -32]])},
        {pts: POSTS.map(function(p){ return [lerp(p[0], -70, .25), lerp(p[1], -28, .25)]; }).concat([[-70, -30], [-70, -34], [-70, -22], [-70, -26], [-68, -28], [-68, -32]])},
        {c: IN_N, r: 2, hide: true}, {c: IN_N, r: 2, hide: true}, {c: IN_N, r: 2, hide: true}, {c: IN_N, r: 2, hide: true}, {c: IN_S, r: 2, hide: true}, {c: IN_S, r: 2, hide: true},
        C(-64, -20, 4.5), {line: [-135, -56, -135, 2], fallAt: 4.2}, {line: [-135, -56, -135, 2], down: true}],
   lab: ['', 'варта на постах', 'варта займає позиції', 'оборонці в палаці (двадцять з гаком)', 'оборонці у правому крилі', 'оборонці у правому крилі', 'оборонці у правому крилі', 'оборонці перейшли в ліве крило', 'оборонці в лівому крилі', 'полонені', 'полонених вивели на дорогу', '']},
  {id: 'a1', cls: 'att', col: 0xa8382a, n: 34, spawn: [-226, 400],
   st: [null, null, C(-168, 170, 11), C(-112, 24, 10), C(-108, 22, 10), C(-60, 22, 9), C(-108, 24, 10), C(-108, 24, 10), C(-110, 24, 11), C(-62, -6, 10), C(-120, -6, 8), {hide: true, c: [-220, 380], r: 10}],
   lab: ['', '', 'загін № 1 · шляхом з Дубровиці', 'загін № 1', 'нападники', 'обшук у дворі', 'нападники', 'нападники', 'нападники', 'нападники', 'нападники', '']},
  {id: 'a3', cls: 'att', col: 0xa8382a, n: 26, spawn: [-320, 120],
   st: [null, null, C(-220, 40, 10), C(-128, -32, 9), C(-126, -32, 9), C(-126, -32, 9), C(-126, -32, 9), C(-126, -30, 9), C(-128, -30, 9), C(-78, -32, 8), C(-121, -28, 6), {hide: true, c: [-320, 60], r: 8}],
   lab: ['', '', 'загін № 3 · з флангу', 'загін № 3 · за палацом, від дороги', '', '', '', '', '', '', '', '']},
  {id: 'a2', cls: 'att', col: 0xa8382a, n: 26, spawn: [70, 410],
   st: [null, null, C(52, 130, 10), C(-34, 24, 9), C(-46, -12, 9), C(-30, 20, 9), C(-46, -12, 9), C(-44, -14, 9), C(-44, -14, 9), C(-56, -34, 8), C(-118, 8, 6), {hide: true, c: [70, 400], r: 8}],
   lab: ['', '', 'загін № 2 · з флангу, крізь сад', 'загін № 2 пройшов повз німецькі пости', 'загін № 2 на подвір\'ї', 'обшук службових помешкань', '', '', '', '', '', '']},
  {id: 'a4', cls: 'att', col: 0xa8382a, n: 20, spawn: [-72, -470],
   st: [null, null, C(-74, -205, 8), C(-82, -78, 8), C(-82, -76, 8), C(-82, -76, 8), C(-82, -76, 8), C(-82, -74, 8), C(-82, -74, 8), C(-74, -44, 7), C(-122, -48, 5), {hide: true, c: [-72, -460], r: 8}],
   lab: ['', '', 'загін № 4 чекає ракети', 'загін № 4 іде в атаку', '', '', '', '', '', '', '', '']},
  {id: 'ost', cls: 'att', col: 0xa8382a, n: 10, spawn: [-330, 70],
   st: [null, null, null, null, null, null, null, null, C(-170, 46, 5), C(-100, 30, 5), C(-112, 20, 4), {hide: true, c: [-330, 70], r: 5}],
   lab: ['', '', '', '', '', '', '', '', 'з Острівців · Гончарі', '', '', '']},
  {id: 'moch', cls: 'att', col: 0xa8382a, n: 18, spawn: [-330, -90],
   st: [null, null, null, null, null, null, null, null, C(-175, -86, 6), C(-104, -62, 6), C(-114, -62, 5), {hide: true, c: [-330, -90], r: 6}],
   lab: ['', '', '', '', '', '', '', '', 'з Мочулища · загін Петрушка', '', '', '']},
  {id: 'ger', cls: 'ger', col: 0x7d8a6a, n: 9,
   st: STEPS.map(function(){ return {pts: [[-14, 44], [12, 44], [36, 44], [58, 44], [-6, 54], [18, 56], [42, 54], [30, 61], [27, 59]]}; }),
   lab: ['', 'німецька артилерія · пости з боку саду', 'німецькі пости', 'пости пропускають селян', '', '', '', '', '', '', '', '']}
];
var PINS = [
  [],
  [[[-70, -26], 'кулемет'], [[-215, 330], 'Дубровиця: повстанці захопили варту ↓']],
  [[[-74, -205], 'чекають ракети'], [[-64, -26], 'варта сурмить тривогу']],
  [[[-50, -12], 'Піскунова й Росіна поранено'], [[-74, -32], 'кулемет заклинило'], [[24, 42], 'пости пропускають селян']],
  [[[cN[0], cN[1]], 'Ліпінського поранено в ногу'], [[cM[0], cM[1]], 'гранати в порожню залу']],
  [[[-36, 24], 'шукають «гайдамаків»']],
  [[[-205, 300], 'до лікарні в Дубровиці ↓']],
  [[[cM[0], cM[1]], 'середина в огні'], [[cS[0], cS[1]], 'оборонці через горище — в ліве крило'], [[-215, 330], 'аптека: «два пуди бензину» ↓']],
  [[[-250, 50], 'вершник: «Воробин оточений!»'], [[-200, -92], 'з Мольським під конвоєм']],
  [[[-70, -26], 'складають зброю'], [[-48, -6], '«на голосування»']],
  [[[-140, -48], 'розстріл на дорозі'], [[-64, -62], 'Пшедзимирського вбито при втечі']],
  [[[-135, -27], '21 тіло рядком'], [[-190, 230], 'Нашора з бочкою горілки']]
];
var ROUTES_DEF = [
  {pts: [[-226, 400], [-205, 280], [-160, 150], [-130, 70], [-114, 30]], on: [2, 3]},
  {pts: [[-320, 120], [-260, 60], [-200, 10], [-150, -30], [-132, -32]], on: [2, 3]},
  {pts: [[70, 410], [60, 250], [40, 120], [10, 52], [-30, 26]], on: [2, 3]},
  {pts: [[-72, -470], [-74, -320], [-74, -215]], on: [2]},
  {pts: [[-74, -205], [-78, -130], [-82, -85]], on: [3]},
  {pts: [[-330, 70], [-260, 58], [-180, 46]], on: [8]},
  {pts: [[-330, -90], [-260, -88], [-185, -86]], on: [8]},
  {pts: [[-112, 14], [-150, 120], [-190, 250], [-226, 410]], on: [6, 11], gold: true}
];

var figGeo = (function(){ return mergeColored([[tr(new T.CapsuleGeometry(.55, 1.5, 3, 8), 0, 1.3, 0, [1, 1, 1]), 0xffffff], [tr(new T.SphereGeometry(.42, 10, 8), 0, 2.75, 0, [1, 1, 1]), 0xe9c9a4]]); })();
GROUPS.forEach(function(G){
  G.mesh = new T.InstancedMesh(figGeo, new T.MeshStandardMaterial({vertexColors: true, roughness: .6, emissive: G.col, emissiveIntensity: .0}), G.n);
  G.mesh.castShadow = true; G.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
  for (var k = 0; k < G.n; k++) G.mesh.setColorAt(k, col(G.col).offsetHSL(0, 0, (hash(k, 3) - .5)*.12));
  scene.add(G.mesh);
  G.from = []; G.to = []; G.cur = []; for (k = 0; k < G.n; k++){ G.from.push([0, 0, 0, 0]); G.to.push([0, 0, 0, 0]); G.cur.push([0, 0, 0, 0]); }
  G.ring = new T.Mesh(new T.RingGeometry(1, 1.25, 48), new T.MeshBasicMaterial({color: G.col, transparent: true, opacity: 0, depthWrite: false})); G.ring.rotation.x = -Math.PI/2; scene.add(G.ring);
});
var FIG_S = 1.45;                                                     // фігурки трохи збільшено, щоб їх було видно
function layout(G, k){
  var st = G.st[k], out = [];
  for (var i = 0; i < G.n; i++){
    if (!st){ var sp0 = G.spawn || [0, 0]; out.push([sp0[0], sp0[1], 0, 0]); continue; }
    var x, z;
    if (st.pts){ var p = st.pts[i % st.pts.length]; x = p[0] + (i >= st.pts.length ? 1.6 : 0); z = p[1] + (i >= st.pts.length ? 1.2 : 0); }
    else if (st.line){ var f = G.n > 1 ? i/(G.n - 1) : .5; x = lerp(st.line[0], st.line[2], f); z = lerp(st.line[1], st.line[3], f); }
    else { var a = i*2.39996, rr = st.r*Math.sqrt((i + .5)/G.n); x = st.c[0] + Math.cos(a)*rr; z = st.c[1] + Math.sin(a)*rr; }
    out.push([x, z, st.hide ? 0 : 1, st.down ? 1 : 0]);
  }
  return out;
}

/* ───────────── маршрути: стрічки з «біжучими» шевронами ───────────── */
var chevTex = (function(){ var c = document.createElement('canvas'); c.width = 64; c.height = 64; var g = c.getContext('2d');
  g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(0, 0, 64, 64); g.strokeStyle = '#fff'; g.lineWidth = 12; g.lineCap = 'round';
  g.beginPath(); g.moveTo(14, 12); g.lineTo(40, 32); g.lineTo(14, 52); g.stroke(); var t = new T.CanvasTexture(c); t.wrapS = T.RepeatWrapping; return t; })();
var ROUTES = ROUTES_DEF.map(function(R0){
  var curve = new T.CatmullRomCurve3(R0.pts.map(function(p){ return new T.Vector3(p[0], 0, p[1]); })), L = curve.getLength(), segs = Math.ceil(L/3), pos = [], uv = [], idx = [];
  for (var k = 0; k <= segs; k++){ var tt = k/segs, p = curve.getPointAt(tt), tg = curve.getTangentAt(tt), nx = -tg.z, nz = tg.x, w = 4.6*(k > segs - 4 ? (segs - k)/4 + .1 : 1);
    pos.push(p.x + nx*w, H(p.x + nx*w, p.z + nz*w) + .6, p.z + nz*w, p.x - nx*w, H(p.x - nx*w, p.z - nz*w) + .6, p.z - nz*w); uv.push(tt*L/7, 0, tt*L/7, 1);
    if (k){ var a = (k - 1)*2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  var t = chevTex.clone(); t.needsUpdate = true; t.repeat.set(1, 1);
  var m = new T.Mesh(g, new T.MeshBasicMaterial({map: t, color: R0.gold ? 0xffd27a : 0xff5a3c, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide, fog: false}));
  m.renderOrder = 2; scene.add(m); return {m: m, tex: t, on: R0.on, op: 0};
});

/* ───────────── частинки (вогонь, іскри, дим, спалахи) ───────────── */
function particles(n, additive, tex){
  var g = new T.BufferGeometry();
  g.setAttribute('position', new T.BufferAttribute(new Float32Array(n*3), 3));
  g.setAttribute('aCol', new T.BufferAttribute(new Float32Array(n*3), 3));
  g.setAttribute('aSize', new T.BufferAttribute(new Float32Array(n), 1));
  g.setAttribute('aA', new T.BufferAttribute(new Float32Array(n), 1));
  var m = new T.ShaderMaterial({transparent: true, depthWrite: false, blending: additive ? T.AdditiveBlending : T.NormalBlending, uniforms: {map: {value: tex}, uScale: {value: 400}},
    vertexShader: 'attribute vec3 aCol; attribute float aSize, aA; uniform float uScale; varying vec3 vC; varying float vA; void main(){ vC = aCol; vA = aA; vec4 mv = modelViewMatrix*vec4(position,1.); gl_PointSize = aSize*uScale/-mv.z; gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform sampler2D map; varying vec3 vC; varying float vA; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC, t.a*vA); if (gl_FragColor.a < .01) discard; }'});
  var p = new T.Points(g, m); p.frustumCulled = false; scene.add(p);
  var st = []; for (var k = 0; k < n; k++) st.push({life: 1, max: 1, x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, s0: 1, kind: 0});
  return {g: g, m: m, st: st, n: n, i: 0};
}
var smokeAcc = [0, 0, 0];
var FLAME = particles(LOW ? 600 : 1100, true, DOT), EMBER = particles(LOW ? 160 : 300, true, DOT), SMOKE = particles(LOW ? 360 : 640, false, PUFF), FLASH = particles(120, true, DOT);
function emit(P, x, y, z, vx, vy, vz, life, size, kind){ var s = P.st[P.i]; P.i = (P.i + 1) % P.n; s.x = x; s.y = y; s.z = z; s.vx = vx; s.vy = vy; s.vz = vz; s.life = 0; s.max = life; s.s0 = size; s.kind = kind || 0; }
var fireLights = [0, 1, 2].map(function(){ var l = new T.PointLight(0xff7a2a, 0, 85, 1.8); scene.add(l); return l; });
var PARTS = [PAL.N, PAL.M, PAL.S], PGRP = [palN, palM, palS];
var FLAME_GEO = (function(){ var g = new T.ConeGeometry(1, 1, 7, 1, true); g.translate(0, .5, 0); return g; })();
var flameMatO = new T.MeshBasicMaterial({color: 0xe8480e, transparent: true, opacity: .5, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false});
var flameMatI = new T.MeshBasicMaterial({color: 0xffa630, transparent: true, opacity: .55, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false});
var FLAMES = PARTS.map(function(R0, p){
  var arr = [], n = Math.round((R0.x1 - R0.x0)*(R0.z1 - R0.z0)/26);
  for (var k = 0; k < n; k++){
    var x = lerp(R0.x0 + 1.5, R0.x1 - 1.5, rnd()), z = lerp(R0.z0 + 1.5, R0.z1 - 1.5, rnd());
    var o = new T.Mesh(FLAME_GEO, flameMatO), i2 = new T.Mesh(FLAME_GEO, flameMatI); i2.scale.set(.55, .6, .55); i2.position.y = .05; o.add(i2);
    o.position.set(x, 0, z); o.visible = false; o.userData = {ph: rnd()*6.283, w: 1.2 + rnd()*1.6, h: 4 + rnd()*5}; scene.add(o); arr.push(o);
  }
  return arr; });
fireLights.forEach(function(l, k){ var c = cen(PARTS[k]); l.position.set(c[0] + 9, 20, c[1]); });

/* трасери */
var TRN = 70, trPos = new Float32Array(TRN*6), trCol = new Float32Array(TRN*6), TR = [];
var trGeo = new T.BufferGeometry(); trGeo.setAttribute('position', new T.BufferAttribute(trPos, 3)); trGeo.setAttribute('color', new T.BufferAttribute(trCol, 3));
var tracers = new T.LineSegments(trGeo, new T.LineBasicMaterial({vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false})); tracers.frustumCulled = false; scene.add(tracers);
for (i = 0; i < TRN; i++) TR.push({on: false});
/* вибухи гранат */
var BOOMS = [];
for (i = 0; i < 6; i++){ var bm = new T.Mesh(new T.SphereGeometry(1, 16, 10), new T.MeshBasicMaterial({color: 0xff9a40, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false})); scene.add(bm);
  var bl = new T.PointLight(0xffa040, 0, 70, 2); scene.add(bl); BOOMS.push({m: bm, l: bl, t: 9}); }
/* ракета */
var rocket = {t: -1, light: new T.PointLight(0xff5a40, 0, 170, 1.6), head: new T.Mesh(new T.SphereGeometry(.9, 10, 8), new T.MeshBasicMaterial({color: 0xffb0a0}))};
scene.add(rocket.light); scene.add(rocket.head); rocket.head.visible = false;
/* смолоскипи */
var TORCH = particles(220, true, DOT);
var torchLights = [0, 1, 2, 3].map(function(){ var l = new T.PointLight(0xff9a40, 0, 42, 2); scene.add(l); return l; });
/* підвода */
var cart = (function(){ var g = new T.Group(), wd = new T.MeshStandardMaterial({color: 0x5a4430});
  var bd = new T.Mesh(new T.BoxGeometry(1.6, .6, 3.4), wd); bd.position.y = 1; g.add(bd);
  [[-.9, 1.1], [.9, 1.1], [-.9, -1.1], [.9, -1.1]].forEach(function(q){ var w = new T.Mesh(new T.TorusGeometry(.5, .08, 6, 14), wd); w.rotation.y = Math.PI/2; w.position.set(q[0], .55, q[1]); g.add(w); });
  var hs = new T.Mesh(new T.CapsuleGeometry(.45, 1.6, 3, 8), new T.MeshStandardMaterial({color: 0x3b2a1c})); hs.rotation.x = Math.PI/2; hs.position.set(0, 1.5, -3.2); g.add(hs);
  var lamp = new T.PointLight(0xffb060, 0, 30, 2); lamp.position.set(0, 2.2, -1.6); g.add(lamp); g.userData.lamp = lamp;
  g.traverse(function(o){ if (o.isMesh) o.castShadow = true; }); g.visible = false; scene.add(g); return g; })();
var cartLab = null;
var CART_PATH = new T.CatmullRomCurve3([[-112, 14], [-132, 50], [-150, 120], [-180, 220], [-205, 300], [-226, 410]].map(function(p){ return new T.Vector3(p[0], 0, p[1]); }));
/* туман над луками */
var MIST = particles(80, false, PUFF);
for (i = 0; i < MIST.n; i++){ var mz = -380 + rnd()*760, mx = edgeX(mz) + 14 + rnd()*150; MIST.st[i] = {x: mx, y: -4.6 + rnd()*1.2, z: mz, ph: rnd()*6.283, s0: 40 + rnd()*40}; }
/* кільця подій */
var PIN_RINGS = [];

/* ───────────── підписи ───────────── */
var LBL = document.getElementById('labels');
function mkLabel(text, cls){ var d = document.createElement('div'); d.className = 'lb ' + (cls || ''); d.innerHTML = '<span>' + text + '</span>'; LBL.appendChild(d); return d; }
var INFO = {
  palace: {k: 'резиденція Плятерів', h: 'Палац', p: ['Найбільша будівля маєтку, біля самого шляху. Справжнього палацу Плятери так і не збудували, тож жили в офіцинах; та, що стала резиденцією, була двоповерхова: на першому поверсі три великі салони, їдальня, кабінет і 12 гостьових кімнат, на другому — бібліотечна зала й ще 17 кімнат. Селяни називали її палацом.', 'Вартовий Ліпінський 1922 року описав будинок так: два двоповерхові крила й одноповерхова середина. Тут 21–22 листопада 1918 року двадцять з гаком людей трималися майже вісімнадцять годин.', 'На аерофотознімку — П-подібна руїна біля шляху.'], s: 'Історія резиденції (Dzieje rezydencji, т. 5); Ліпінський, 6.IX.1922, арк. 395 зв.–396'},
  ofc: {k: 'службова будівля', h: 'Менша офіцина', p: ['Одноповерхова, тринадцять осей, з рустованими кутами й ризалітом під трикутним фронтоном. Тут були кухні, комори, пральня й контора.', 'На аерофотознімку — Г-подібна руїна з багатьма кімнатами на південь від подвір\'я. Ототожнення приблизне.'], s: 'Історія резиденції; фото 1938 року'},
  nb: {k: 'господарство', h: 'Господарська будівля', p: ['Довга одноповерхова будівля на північ від подвір\'я, навпроти меншої офіцини. Призначення невідоме: можливо, стайня чи каретня.'], s: 'Аерофотознімок'},
  lib: {k: 'павільйон', h: '«Бібліотека»', p: ['Найцікавіша будівля Воробина: квадратний павільйон на високому цоколі над лугами Горині. Із заходу — портик із чотирьох дорицьких колон, з півдня — колонада, з півночі — вежа. До 1914 року тут була книгозбірня на 8000 томів і родинний архів.', 'Під час повстання павільйон не згадують. Його ще фотографували 1937 року.'], s: 'Історія резиденції; 3D-модель за фото до 1917 і 1937 років', link: ['worobin-3d.html', 'Окрема 3D-модель «Бібліотеки» →']},
  court: {k: 'подвір\'я', h: 'Газон з ялиною', p: ['Між офіцинами колись стояв старий дерев\'яний двір під високим ламаним дахом. Його розібрали, щоб звести на цьому місці палац, але палац так і не збудували. На малюнку Наполеона Орди 1870 року тут газон, огорожа й ялина.'], s: 'Історія резиденції; Н. Орда, 1870'},
  garden: {k: 'сад', h: 'Сад за муром', p: ['Великий сад, обнесений муром (його видно на аерофотознімку). З цього боку маєток стерегли німецькі пости, і саме тут, за словами Ліпінського, вони пропустили селян.'], s: 'Ліпінський, арк. 395 зв.'},
  guns: {k: 'німецька армія', h: 'Німецька артилерія', p: ['У листопаді 1918 року у Воробині стояв полк німецької артилерії. Німецька армія вже поверталася додому, а 15 листопада в Домбровиці солдати заарештували своїх офіцерів. Пости з боку саду пропустили нападників, а спогад 1927 року пише, що німецька солдатська рада дала повстанцям гвинтівки, набої й бомби.', 'Місце гармат на схемі умовне.'], s: 'Ліпінський, арк. 395 зв.; телеграма № 410; «Красная звезда», 1927'},
  farm: {k: 'господарство', h: 'Фільварок', p: ['Господарський двір маєтку за ставом: клуні, обори, комори. Будівлі — за обрисами на аерофотознімку.'], s: 'Аерофотознімок'},
  village: {k: 'село', h: 'Село Воробин', p: ['Хати вздовж шляху. Хати на схемі умовні: точно, де вони стояли 1918 року, невідомо.'], s: ''},
  road: {k: 'шлях', h: 'Шлях Дубровиця — Воробин', p: ['Шлях на південь до Дубровиці, близько 5 км. Ним ішов загін № 1, ним везли поранених до лікарні, і на ньому розстріляли полонених.'], s: '«Красная звезда», 1927; Ліпінський; Мітлюх'}
};
var BL = [
  {k: 'palace', p: [cM[0] - 2, 18, cM[1]]}, {k: 'ofc', p: [-58, 11, 34]}, {k: 'nb', p: [-51, 10, -49]}, {k: 'lib', p: [LIB[0], 24, LIB[1]]}, {k: 'court', p: [LAWN[0], 13, LAWN[1]]},
  {k: 'garden', p: [26, 6, -46]}, {k: 'guns', p: [18, 7, 52]}, {k: 'farm', p: [30, 9, -260]}, {k: 'village', p: [-150, 8, -250]}, {k: 'road', p: [-166, 5, 160]}
].map(function(b){ var el = mkLabel(INFO[b.k].h, 'b'); el.dataset.k = b.k; el.addEventListener('click', function(){ openInfo(b.k); }); return {el: el, p: new T.Vector3(b.p[0], b.p[1], b.p[2]), k: b.k}; });
GROUPS.forEach(function(G){ G.lab$ = mkLabel('', 'g-' + G.cls); G.labPos = new T.Vector3(); });
var pinEls = [];
// вибір будівель кліком
var pickables = [[palS, 'palace'], [palM, 'palace'], [palN, 'palace'], [ofc1, 'ofc'], [ofc2, 'ofc'], [nbld, 'nb']];
pickables.forEach(function(q){ q[0].traverse(function(o){ if (o.isMesh){ o.userData.info = q[1]; PICK.push(o); } }); });

/* ───────────── небо й світло за годиною ───────────── */
var K = {night: 1}, cSky = new T.Color(), cHor = new T.Color(), tmp2 = new T.Color();
var NIGHT_T = col(0x070c18), NIGHT_H = col(0x1b2538), DAY_T = col(0x6c86a3), DAY_H = col(0xc9cfcf), DUSK_T = col(0x3b3f5c), DUSK_H = col(0xd39a6a);
function setTime(hour){
  var h = hour % 24, rise = 7.3, set = 15.9;
  var d = ss(rise - .6, rise + .9, h)*(1 - ss(set - .7, set + .5, h));
  var dusk = Math.max(0, 1 - Math.abs(h - set)/1.1)*(h > 12 ? 1 : 0) + Math.max(0, 1 - Math.abs(h - rise)/1.0)*(h < 12 ? 1 : 0);
  dusk = Math.min(1, dusk);
  cSky.copy(NIGHT_T).lerp(DAY_T, d).lerp(DUSK_T, dusk*.55); cHor.copy(NIGHT_H).lerp(DAY_H, d).lerp(DUSK_H, dusk*.75);
  skyU.top.value.copy(cSky); skyU.hor.value.copy(cHor);
  scene.fog.color.copy(cHor).multiplyScalar(.92); scene.fog.density = .0007 + .0012*(1 - d) + .0004*dusk;
  var az = (h - 12)/12*Math.PI*.95, el = Math.max(-.2, Math.sin((h - rise)/(set - rise)*Math.PI))*.42;
  var sdir = new T.Vector3(Math.sin(az)*Math.cos(el), Math.sin(el), Math.cos(az)*Math.cos(el)*.6 + .4).normalize();
  if (d < .05) sdir.set(-.3, .8, .35).normalize();                                   // уночі — місячне світло
  skyU.sunDir.value.copy(sdir); skyU.sunK.value = Math.max(d*.6, dusk); skyU.sunCol.value.copy(tmp2.set(0xffd9a0).lerp(col(0xff8a50), dusk*.7));
  sun.position.copy(controls.target).addScaledVector(sdir, 500); sun.target.position.copy(controls.target);
  sun.intensity = lerp(.55, 2.2, d) + dusk*.4; sun.color.copy(tmp2.set(0x8ea8e8).lerp(col(0xfff1d6), d).lerp(col(0xffa868), dusk*.6));
  hemi.intensity = lerp(.5, .72, d); hemi.color.copy(tmp2.set(0x6f86c4).lerp(col(0xe8eef5), d)); hemi.groundColor.set(d > .4 ? 0x5a4c36 : 0x1c1a20);
  stars.material.opacity = Math.max(0, 1 - d*1.6 - dusk*.6)*.9;
  waterU.uSky.value.copy(cHor); waterU.uSun.value.copy(sdir); waterU.uSunC.value.copy(sun.color).multiplyScalar(d*.9 + .2);
  renderer.toneMappingExposure = lerp(1.7, 1.0, d);
  K.night = 1 - d; K.dusk = dusk; return d;
}

/* ───────────── перемикання кроків ───────────── */
var volleyDone = false, step = -1, twStart = 0, TW = 2600, tw = 1, curHour = 13.2, fromHour = 13.2;
var fireCur = [0, 0, 0], fireFrom = [0, 0, 0], roofCur = [0, 0, 0], roofFrom = [0, 0, 0];
var camFrom = {p: new T.Vector3(), t: new T.Vector3()}, camTo = {p: new T.Vector3(), t: new T.Vector3()}, camFly = 1, CAMDUR = 3200, camStart = 0, userMoved = false;
var cT = document.getElementById('cT'), cD = document.getElementById('cD'), cH = document.getElementById('cH'), cP = document.getElementById('cP'), cS2 = document.getElementById('cS');
var ticks = document.getElementById('ticks'), fill = document.getElementById('fill'), tickEls = [];
STEPS.forEach(function(s, k){
  var b = document.createElement('button'); b.type = 'button'; b.style.left = (k/(N - 1)*100) + '%';
  b.setAttribute('aria-label', s.time + ' — ' + s.h); b.innerHTML = '<span>' + (k ? s.time : 'маєток') + '</span>';
  b.addEventListener('click', function(){ stop(); go(k); }); ticks.appendChild(b); tickEls.push(b);
});
function camFor(k){
  var c = STEPS[k].cam, p = new T.Vector3(c[0][0], c[0][1], c[0][2]), t = new T.Vector3(c[1][0], c[1][1], c[1][2]);
  if (MOBILE){ p.sub(t).multiplyScalar(1.45).add(t); }
  return {p: p, t: t};
}
function flyTo(k, instant){
  var c = camFor(k);
  camFrom.p.copy(camera.position); camFrom.t.copy(controls.target); camTo.p.copy(c.p); camTo.t.copy(c.t);
  camStart = performance.now(); camFly = instant ? 1 : 0;
  if (instant){ camera.position.copy(c.p); controls.target.copy(c.t); }
}
function go(k, instant){
  k = Math.max(0, Math.min(N - 1, k)); if (k === step && !instant) return;
  var first = step < 0, prev = step;
  GROUPS.forEach(function(G){ var L = layout(G, k);
    for (var i = 0; i < G.n; i++){
      G.from[i] = first ? L[i].slice() : G.cur[i].slice();
      if (!first && G.cur[i][2] < .05 && L[i][2] === 1 && !G.st[prev] && G.spawn){ G.from[i] = [G.spawn[0], G.spawn[1], 0, 0]; }
      G.to[i] = L[i];
    }
    G.labText = (G.lab && G.lab[k]) || '';
  });
  fromHour = curHour; fireFrom = fireCur.slice(); roofFrom = roofCur.slice();
  step = k; twStart = performance.now(); tw = first ? 1 : 0; volleyDone = false;
  var s = STEPS[k]; cT.textContent = s.time; cD.textContent = s.day; cH.textContent = s.h; cP.textContent = s.p; cS2.textContent = s.s;
  document.getElementById('card').classList.remove('fresh'); void document.getElementById('card').offsetWidth; document.getElementById('card').classList.add('fresh');
  tickEls.forEach(function(b, j){ b.classList.toggle('cur', j === k); b.classList.toggle('done', j < k); });
  fill.style.width = (k/(N - 1)*100) + '%';
  pinEls.forEach(function(p){ p.el.remove(); }); pinEls = [];
  PIN_RINGS.forEach(function(r){ scene.remove(r); }); PIN_RINGS = [];
  (PINS[k] || []).forEach(function(q){ var x = q[0][0], z = q[0][1];
    pinEls.push({el: mkLabel(q[1], 'pin'), p: new T.Vector3(x, H(x, z) + 9, z)});
    var rg = new T.Mesh(new T.RingGeometry(2.4, 3, 48), new T.MeshBasicMaterial({color: 0xffd27a, transparent: true, opacity: .9, depthWrite: false, fog: false}));
    rg.rotation.x = -Math.PI/2; rg.position.set(x, Math.max(H(x, z), 0) + .7, z); rg.renderOrder = 3; scene.add(rg); PIN_RINGS.push(rg); });
  ROUTES.forEach(function(r){ r.target = r.on.indexOf(k) > -1 ? .95 : 0; });
  if (k === 3 && prev !== 3) rocket.t = 0;
  if (k === 3 || k === 4) setTimeout(function(){ boomAt(-74, -30); }, 900), setTimeout(function(){ boomAt(-80, -20); }, 1900), setTimeout(function(){ boomAt(cM[0] + 3, cM[1]); }, 3000);
  userMoved = false; flyTo(k, first || instant);
  var bt = document.getElementById('bigt'); if (bt && !first && k > 0){ bt.firstChild.textContent = s.time; bt.lastChild.textContent = s.h; bt.classList.remove('show'); void bt.offsetWidth; bt.classList.add('show'); }
  document.body.classList.toggle('overview', k === 0);
}
function boomAt(x, z){ if (step !== 3 && step !== 4) return; var b = BOOMS.find(function(q){ return q.t > 1.2; }) || BOOMS[0]; b.t = 0; b.x = x; b.z = z; b.m.position.set(x, H(x, z) + 1, z); b.l.position.set(x, H(x, z) + 3, z);
  for (var k = 0; k < 26; k++) emit(SMOKE, x + (rnd() - .5)*4, H(x, z) + 1.5, z + (rnd() - .5)*4, (rnd() - .5)*3, 1.5 + rnd()*2, (rnd() - .5)*3, 4, 4 + rnd()*3, 1);
  for (k = 0; k < 24; k++) emit(EMBER, x, H(x, z) + 1, z, (rnd() - .5)*16, 6 + rnd()*10, (rnd() - .5)*16, 1.2, 1.1); }

var playing = false, nextAt = 0, playBtn = document.getElementById('play'), playIc = document.getElementById('playIc'), DWELL = 9000;
function stop(){ playing = false; playIc.setAttribute('d', 'M4 2.5v11l9-5.5z'); playBtn.setAttribute('aria-label', 'Відтворити'); }
function play(){ playing = true; playIc.setAttribute('d', 'M4 2.5h3v11H4zM9 2.5h3v11H9z'); playBtn.setAttribute('aria-label', 'Пауза'); if (step >= N - 1) go(0); nextAt = performance.now() + DWELL; }
playBtn.onclick = function(){ playing ? stop() : play(); };
document.getElementById('prev').onclick = function(){ stop(); go(step - 1); };
document.getElementById('next').onclick = function(){ stop(); go(step + 1); };
addEventListener('keydown', function(e){ if (e.target.tagName === 'INPUT') return; if (e.key === 'ArrowRight'){ stop(); go(step + 1); } if (e.key === 'ArrowLeft'){ stop(); go(step - 1); } if (e.key === ' '){ e.preventDefault(); playing ? stop() : play(); } });
controls.addEventListener('start', function(){ userMoved = true; camFly = 1; });
document.getElementById('recam').onclick = function(){ flyTo(step); };

/* інфо про будівлю */
var infoBox = document.getElementById('binfo');
function openInfo(k){ var I = INFO[k]; if (!I) return;
  infoBox.innerHTML = '<button type="button" class="x" aria-label="Закрити">×</button><p class="k">' + I.k + '</p><h2>' + I.h + '</h2>' + I.p.map(function(t){ return '<p>' + t + '</p>'; }).join('') +
    (I.link ? '<a class="go" href="' + I.link[0] + '">' + I.link[1] + '</a>' : '') + (I.s ? '<p class="src">' + I.s + '</p>' : '');
  infoBox.classList.add('open'); infoBox.querySelector('.x').onclick = function(){ infoBox.classList.remove('open'); }; }
var ray = new T.Raycaster(), mv = new T.Vector2(), downAt = null;
cv.addEventListener('pointerdown', function(e){ downAt = [e.clientX, e.clientY]; });
cv.addEventListener('pointerup', function(e){
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
  mv.set(e.clientX/innerWidth*2 - 1, -e.clientY/innerHeight*2 + 1); ray.setFromCamera(mv, camera);
  var hit = ray.intersectObjects(PICK.concat(libHit ? [libHit] : []), false)[0];
  if (hit) openInfo(hit.object.userData.info);
});
var libHit = null;

/* ───────────── «Бібліотека» ───────────── */
fetch('worobin-1k.glb?v=20261019c').then(function(r){ return r.arrayBuffer(); }).then(function(buf){
  var dr = new T.DRACOLoader(); dr.setDecoderPath('draco/'); var gl = new T.GLTFLoader(); gl.setDRACOLoader(dr);
  gl.parse(buf, '', function(g){ g.scene.traverse(function(o){ if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; o.userData.info = 'lib'; if (!libHit) libHit = o; PICK.push(o); } }); libGroup.add(g.scene); dr.dispose(); });
}).catch(function(){});

/* ───────────── кадр ───────────── */
var v3 = new T.Vector3(), clock = new T.Clock(), lastShot = 0;
var needle = document.getElementById('needle');
function place(el, p, hide){
  v3.copy(p).project(camera);
  var off = hide || v3.z > 1 || Math.abs(v3.x) > 1.05 || Math.abs(v3.y) > 1.05;
  el.classList.toggle('off', !!off);
  if (!off) el.style.transform = 'translate(' + ((v3.x*.5 + .5)*innerWidth).toFixed(1) + 'px,' + ((-v3.y*.5 + .5)*innerHeight).toFixed(1) + 'px) translate(-50%,-100%)';
}
function ease(t){ return t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2; }
function randomFrom(G){ for (var k = 0; k < 6; k++){ var c = G.cur[(Math.random()*G.n)|0]; if (c[2] > .6 && !c[3]) return c; } return null; }
function shoot(now, inten){
  var att = GROUPS.filter(function(G){ return G.cls === 'att'; });
  var defWing = step >= 7 ? PAL.S : PAL.N, dw = cen(defWing), y0 = H(dw[0], dw[1]);
  var n = Math.random() < inten*.9 ? 1 + (Math.random()*2*inten|0) : 0;
  for (var q = 0; q < n; q++){
    var tr2 = TR.find(function(t){ return !t.on; }); if (!tr2) return;
    var G = att[(Math.random()*att.length)|0], src = randomFrom(G); if (!src) continue;
    var win = [lerp(defWing.x0, defWing.x1, Math.random()), y0 + 2 + Math.random()*6, lerp(defWing.z0, defWing.z1, Math.random())];
    var out = Math.random() < .42;                                                      // відповідь з вікон
    var a = out ? win : [src[0], H(src[0], src[1]) + 2.6, src[1]], b = out ? [src[0] + (Math.random() - .5)*6, H(src[0], src[1]) + 1.5, src[1] + (Math.random() - .5)*6] : win;
    tr2.on = true; tr2.t = 0; tr2.a = a; tr2.b = b; tr2.len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); tr2.c = out ? [1, .95, .7] : [1, .55, .2];
    emit(FLASH, a[0], a[1], a[2], 0, 0, 0, .09, out ? 3.2 : 2.6, 0);
  }
}
function frame(now){
  requestAnimationFrame(frame);
  var dt = Math.min(DTMAX, clock.getDelta()), time = now*.001;
  if (playing && now > nextAt){ if (step < N - 1){ go(step + 1); nextAt = now + DWELL; } else stop(); }
  tw = Math.min(1, (now - twStart)/TW); var e = ease(tw);
  curHour = lerp(fromHour, STEPS[step].t, e);
  for (var p = 0; p < 3; p++){ fireCur[p] = lerp(fireFrom[p], FIRE[step][p], e); roofCur[p] = lerp(roofFrom[p], ROOF_GONE[step][p], ss(.3, 1, tw)); }
  var day = setTime(curHour), night = K.night;
  waterU.uTime.value = time; waterU.uFire.value = Math.max.apply(null, fireCur)*night; waterU.fogColor.value.copy(scene.fog.color); waterU.fogDensity.value = scene.fog.density;
  // камера
  if (camFly < 1){ camFly = Math.min(1, Math.max(0, (now - camStart)/CAMDUR)); var ce = ease(camFly);
    camera.position.lerpVectors(camFrom.p, camTo.p, ce); controls.target.lerpVectors(camFrom.t, camTo.t, ce);
    camera.position.y += Math.sin(ce*Math.PI)*Math.min(60, camFrom.p.distanceTo(camTo.p)*.15); }
  else if (!userMoved && (step === 6 || step === 11) && cart.visible){ var cg = new T.Vector3(cart.position.x, cart.position.y + 2, cart.position.z);
    var off = camera.position.clone().sub(controls.target); var want = new T.Vector3(48, 34, 62); off.lerp(want, .02); controls.target.lerp(cg, .05); camera.position.copy(controls.target).add(off); }
  else if (!userMoved && step >= 0){ var ang = Math.sin(time*.07)*.0009; camera.position.sub(controls.target).applyAxisAngle(new T.Vector3(0, 1, 0), ang).add(controls.target); }
  // вікна
  var wl = lerp(WINDOWS[Math.max(0, step - (tw < 1 ? 1 : 0))] || 0, WINDOWS[step], e)*night;
  WIN_MATS.palace.forEach(function(m){ m.emissiveIntensity = wl*1.6; });
  WIN_MATS.ofc.forEach(function(m){ m.emissiveIntensity = (step <= 1 ? 1 : .15)*night*1.2; });
  WIN_MATS.other.forEach(function(m){ m.emissiveIntensity = (step <= 1 ? .5 : 0)*night; });
  // пожежа
  var totalF = 0;
  for (p = 0; p < 3; p++){
    var f = fireCur[p], grp = PGRP[p], ud = grp.userData, R0 = PARTS[p], cx = cen(R0), gy = grp.position.y; totalF += f;
    var burnt = Math.max(f, roofCur[p]);
    ud.mats.forEach(function(m){ if (m.map){ m.emissive.setRGB(1, lerp(.75, .38, f), lerp(.45, .1, f)); m.emissiveIntensity = Math.max(m.emissiveIntensity, f*(1.2 + .6*Math.sin(time*9 + p))*(.5 + night)); }
      m.color.copy(ud.wall).lerp(tmp2.set(0x2e2620), burnt*.75); if (m.map) m.color.setRGB(1 - burnt*.68, 1 - burnt*.7, 1 - burnt*.72); });
    ud.body.material[2] = roofCur[p] > .5 ? CHAR : ud.mats[2]; if (ud.cn) ud.cn.visible = roofCur[p] < .5;
    ud.roof.position.y = ud.h + .22 - roofCur[p]*(ud.h*.6); ud.roof.rotation.z = roofCur[p]*.08; ud.roof.visible = roofCur[p] < .97;
    ud.roof.children.forEach(function(r){ if (r.material && r.material.color && r === ud.roof.children[0]){} });
    FLAMES[p].forEach(function(o, j){ var u = o.userData, fl = f*(.75 + .25*Math.sin(time*11 + u.ph) + .15*Math.sin(time*23 + j));
      o.visible = f > .03; if (!o.visible) return; var top = gy + ud.h*(1 - roofCur[p]*.55) + (1 - roofCur[p])*ud.rh*.35;
      o.position.y = top - .5; o.scale.set(u.w*fl, u.h*fl*(1 + .2*Math.sin(time*7 + u.ph)), u.w*fl); o.rotation.y = time*.5 + u.ph; });
    fireLights[p].intensity = f*(1.6 + Math.sin(time*13 + p*2)*.4 + Math.sin(time*7.3)*.3)*(.3 + night*.9);
    var rate = f*(LOW ? 110 : 190)*dt;
    smokeAcc[p] += f*(LOW ? 9 : 14)*dt;
    while (smokeAcc[p] >= 1){ smokeAcc[p]--; var sx0 = lerp(R0.x0 + 1, R0.x1 - 1, Math.random()), sz0 = lerp(R0.z0 + 1, R0.z1 - 1, Math.random());
      emit(SMOKE, sx0, gy + ud.h + 3 + Math.random()*2, sz0, 1 + Math.random()*1.5, 4.5 + Math.random()*2.5, -.5 + (Math.random() - .5), 9 + Math.random()*5, 6 + Math.random()*4, 0); }
    for (var k = 0; k < rate; k++){
      var fx = lerp(R0.x0 + 1, R0.x1 - 1, Math.random()), fz = lerp(R0.z0 + 1, R0.z1 - 1, Math.random()), fy = gy + ud.h*(1 - roofCur[p]*.4) + Math.random()*ud.rh*.5*(1 - roofCur[p]);
      emit(FLAME, fx, fy, fz, (Math.random() - .5)*1.2 + .9, 3 + Math.random()*4, (Math.random() - .5)*1.2, .5 + Math.random()*.6, 1.6 + Math.random()*2.2, 0);
      if (Math.random() < .08) emit(EMBER, fx, fy + 2, fz, (Math.random() - .5)*3 + 2.5, 5 + Math.random()*6, (Math.random() - .5)*3, 2 + Math.random()*2, .9, 0);
    }
  }
  // частинки
  function upd(P, fn){ var pos = P.g.attributes.position.array, cl = P.g.attributes.aCol.array, sz = P.g.attributes.aSize.array, al = P.g.attributes.aA.array;
    for (var k = 0; k < P.n; k++){ var s = P.st[k]; if (s.life >= s.max){ al[k] = 0; continue; } s.life += dt; var u = s.life/s.max;
      s.x += s.vx*dt; s.y += s.vy*dt; s.z += s.vz*dt; pos[k*3] = s.x; pos[k*3 + 1] = s.y; pos[k*3 + 2] = s.z; fn(s, u, k, cl, sz, al); }
    P.g.attributes.position.needsUpdate = P.g.attributes.aCol.needsUpdate = P.g.attributes.aSize.needsUpdate = P.g.attributes.aA.needsUpdate = true; }
  upd(FLAME, function(s, u, k, cl, sz, al){ cl[k*3] = 1; cl[k*3 + 1] = lerp(.7, .22, u); cl[k*3 + 2] = lerp(.25, .03, u); sz[k] = s.s0*(1 - u*.55); al[k] = (1 - u)*Math.min(1, u*8)*.6; s.vy *= .985; });
  upd(EMBER, function(s, u, k, cl, sz, al){ cl[k*3] = 1; cl[k*3 + 1] = .5; cl[k*3 + 2] = .15; sz[k] = s.s0*.7; al[k] = (1 - u)*(.5 + .4*Math.sin(now*.03 + k)); s.vy -= 2.2*dt; s.vx *= .99; });
  var sCol = tmp2.set(0x4d433c).lerp(col(0x67625b), day);
  upd(SMOKE, function(s, u, k, cl, sz, al){ cl[k*3] = sCol.r; cl[k*3 + 1] = sCol.g; cl[k*3 + 2] = sCol.b; if (s.kind === 0 && u < .2 && night > .4){ cl[k*3] += .35*(1 - u*5); cl[k*3 + 1] += .15*(1 - u*5); }
    sz[k] = s.s0*(1 + u*3); al[k] = Math.min(1, u*5)*(1 - u)*(s.kind ? .35 : lerp(.34, .55, day)); s.vx += .3*dt; });
  upd(FLASH, function(s, u, k, cl, sz, al){ cl[k*3] = 1; cl[k*3 + 1] = .85; cl[k*3 + 2] = .55; sz[k] = s.s0*(1 + u); al[k] = 1 - u; });
  // залп на дорозі
  if (step === 10 && !volleyDone && (now - twStart)/1000 > 4.1){ volleyDone = true;
    GROUPS.forEach(function(G){ if (G.cls !== 'att') return; G.cur.forEach(function(c){ if (c[2] > .6 && c[0] < -95 && c[0] > -126) emit(FLASH, c[0] - .8, H(c[0], c[1]) + 2.6, c[1], 0, 0, 0, .14, 3.4, 0); }); });
    var bv = BOOMS[0]; bv.t = .55; bv.m.position.set(-122, -50, -20); bv.l.position.set(-120, H(-120, -20) + 4, -20); }
  // стрілянина
  var inten = lerp(SHOTS[Math.max(0, step - 1)] || 0, SHOTS[step], e)*(tw < .5 && step < 2 ? 0 : 1);
  if (now - lastShot > 70){ lastShot = now; if (inten > 0) shoot(now, inten); }
  for (var j = 0; j < TRN; j++){ var t2 = TR[j], o = j*6;
    if (!t2.on){ trPos[o] = trPos[o + 3] = 1e6; continue; }
    t2.t += dt*420/Math.max(20, t2.len); if (t2.t >= 1){ t2.on = false; continue; }
    var u0 = Math.max(0, t2.t - 6/t2.len), u1 = t2.t;
    for (var q = 0; q < 3; q++){ trPos[o + q] = lerp(t2.a[q], t2.b[q], u0); trPos[o + 3 + q] = lerp(t2.a[q], t2.b[q], u1); }
    trCol[o] = t2.c[0]*.3; trCol[o + 1] = t2.c[1]*.3; trCol[o + 2] = t2.c[2]*.3; trCol[o + 3] = t2.c[0]; trCol[o + 4] = t2.c[1]; trCol[o + 5] = t2.c[2]; }
  trGeo.attributes.position.needsUpdate = trGeo.attributes.color.needsUpdate = true;
  tracers.material.opacity = .5 + night*.5;
  // вибухи
  BOOMS.forEach(function(b){ if (b.t > 1.2){ b.m.material.opacity = 0; b.l.intensity = 0; return; } b.t += dt; var u = b.t/1.2;
    b.m.scale.setScalar(1 + u*5); b.m.material.opacity = Math.pow(1 - u, 2)*.75; b.l.intensity = Math.pow(1 - u, 2)*(3 + night*5); });
  // ракета
  if (rocket.t >= 0){ rocket.t += dt; var rt2 = rocket.t, r0 = [-74, -205];
    if (rt2 < 4.5){ var hh = Math.min(rt2, 2.2), y = H(r0[0], r0[1]) + 60*hh - 13*hh*hh + (rt2 > 2.2 ? -6*(rt2 - 2.2) : 0);
      rocket.head.visible = true; rocket.head.position.set(r0[0] + rt2*4, y, r0[1] + rt2*9); rocket.light.position.copy(rocket.head.position);
      rocket.light.intensity = (rt2 < 2.2 ? 1.5 : 4.5*(1 - (rt2 - 2.2)/2.3))*(.3 + night*.8);
      emit(FLAME, rocket.head.position.x, rocket.head.position.y, rocket.head.position.z, 0, -2, 0, .5, rt2 > 2.2 ? 5 : 2, 0);
      if (rt2 > 2.2 && rt2 < 2.3) for (var bb = 0; bb < 40; bb++) emit(EMBER, rocket.head.position.x, rocket.head.position.y, rocket.head.position.z, (rnd() - .5)*22, (rnd() - .3)*18, (rnd() - .5)*22, 2.2, 1.6);
    } else { rocket.t = -1; rocket.head.visible = false; rocket.light.intensity = 0; } }
  // люди
  var tIdx = 0, torchArr = TORCH.g.attributes.position.array, tCol = TORCH.g.attributes.aCol.array, tSz = TORCH.g.attributes.aSize.array, tA = TORCH.g.attributes.aA.array, gIdx = 0;
  GROUPS.forEach(function(G){
    var sx = 0, sz2 = 0, nv = 0, stc = G.st[step];
    for (var i = 0; i < G.n; i++){
      var a = G.from[i], b = G.to[i], c = G.cur[i], ei = ease(Math.min(1, Math.max(0, (tw*1.25 - (i % 7)*.03))));
      c[0] = lerp(a[0], b[0], ei); c[1] = lerp(a[1], b[1], ei); c[2] = lerp(a[2], b[2], ei); c[3] = lerp(a[3], b[3], ei);
      var moving = ei > 0 && ei < 1 && c[2] > .5, bob = moving ? Math.abs(Math.sin(now*.014 + i))*.35 : 0;
      var gy = H(c[0], c[1]);
      if (stc && stc.fallAt){ var el2 = (now - twStart)/1000 - stc.fallAt - (i % 6)*.07; if (el2 > 0) c[3] = Math.max(c[3], Math.min(1, el2*2.5)); }
      dummy.position.set(c[0], gy + bob, c[1]); dummy.rotation.set(0, Math.atan2(b[0] - a[0], b[1] - a[1]), c[3]*Math.PI/2); dummy.scale.setScalar(Math.max(.001, c[2])*FIG_S);
      dummy.updateMatrix(); G.mesh.setMatrixAt(i, dummy.matrix);
      if (c[2] > .3 && !c[3]){ sx += c[0]; sz2 += c[1]; nv++; }
      if (G.cls === 'att' && i % 4 === 0 && c[2] > .5 && night > .2 && tIdx < TORCH.n){
        torchArr[tIdx*3] = c[0] + .5; torchArr[tIdx*3 + 1] = gy + 4.9 + bob + Math.sin(now*.02 + i)*.12; torchArr[tIdx*3 + 2] = c[1];
        tCol[tIdx*3] = 1; tCol[tIdx*3 + 1] = .62 + Math.sin(now*.03 + i)*.08; tCol[tIdx*3 + 2] = .25; tSz[tIdx] = 2.2 + Math.sin(now*.025 + i*3)*.5; tA[tIdx] = night*c[2]; tIdx++; }
    }
    for (var z2 = tIdx; z2 < TORCH.n && G === GROUPS[GROUPS.length - 1]; z2++) tA[z2] = 0;
    G.mesh.instanceMatrix.needsUpdate = true;
    G.mesh.material.emissiveIntensity = .05 + night*.28;
    var txt = G.labText;
    if (nv && txt) G.labPos.set(sx/nv, H(sx/nv, sz2/nv) + 8, sz2/nv);
    else if (txt && stc && stc.hide) G.labPos.set(stc.c[0], 17, stc.c[1]);
    if (G.lab$.firstChild.textContent !== txt) G.lab$.firstChild.textContent = txt;
    place(G.lab$, G.labPos, !txt || tw < .55);
    // кільце під групою
    if (nv > 3 && G.cls !== 'ger' && txt){ G.ring.position.set(sx/nv, H(sx/nv, sz2/nv) + .5, sz2/nv); var rr = (stc && stc.r ? stc.r : 6) + 2; G.ring.scale.setScalar(rr*(1 + .06*Math.sin(time*3))); G.ring.material.opacity = lerp(G.ring.material.opacity, .55, .05); }
    else G.ring.material.opacity = lerp(G.ring.material.opacity, 0, .1);
    if (G.cls === 'att' && gIdx < 4 && nv){ torchLights[gIdx].position.set(sx/nv, H(sx/nv, sz2/nv) + 6, sz2/nv); torchLights[gIdx].intensity = night*1.1*(1 + .15*Math.sin(now*.02 + gIdx)); gIdx++; }
  });
  for (var gi = gIdx; gi < 4; gi++) torchLights[gi].intensity = 0;
  TORCH.g.attributes.position.needsUpdate = TORCH.g.attributes.aCol.needsUpdate = TORCH.g.attributes.aSize.needsUpdate = TORCH.g.attributes.aA.needsUpdate = true;
  campfire.intensity = night*(1.8 + Math.sin(now*.02)*.4);
  // туман над луками
  var mpos = MIST.g.attributes.position.array, mcol = MIST.g.attributes.aCol.array, msz = MIST.g.attributes.aSize.array, ma = MIST.g.attributes.aA.array;
  var mistK = Math.max(night*.55, K.dusk*.6);
  for (var mi = 0; mi < MIST.n; mi++){ var s = MIST.st[mi]; mpos[mi*3] = s.x + Math.sin(time*.05 + s.ph)*8; mpos[mi*3 + 1] = s.y; mpos[mi*3 + 2] = s.z;
    mcol[mi*3] = .72; mcol[mi*3 + 1] = .76; mcol[mi*3 + 2] = .82; msz[mi] = s.s0; ma[mi] = mistK*.32; }
  MIST.g.attributes.position.needsUpdate = MIST.g.attributes.aA.needsUpdate = MIST.g.attributes.aCol.needsUpdate = MIST.g.attributes.aSize.needsUpdate = true;
  // підвода
  if (step === 6 || step === 11){ cart.visible = true; var cu = Math.max(.001, Math.min(.995, step === 6 ? (time*.05) % 1 : tw*.6)); var cp = CART_PATH.getPointAt(cu), ct = CART_PATH.getTangentAt(cu);
    cart.position.set(cp.x, H(cp.x, cp.z), cp.z); cart.rotation.y = Math.atan2(ct.x, ct.z) + Math.PI; cart.userData.lamp.intensity = night*2; }
  else cart.visible = false;
  if (!cartLab){ cartLab = mkLabel('підвода', 'pin'); }
  cartLab.firstChild.textContent = step === 6 ? 'підвода з пораненими' : 'віз: Ліпінський під двома трупами';
  place(cartLab, new T.Vector3(cart.position.x, cart.position.y + 6, cart.position.z), !cart.visible || camFly < 1);
  // маршрути
  ROUTES.forEach(function(r){ r.op += ((r.target || 0) - r.op)*.05; r.m.material.opacity = r.op; r.m.visible = r.op > .01; r.tex.offset.x -= dt*.9; });
  PIN_RINGS.forEach(function(rg, k){ var u = ((time*.6 + k*.3) % 1); rg.scale.setScalar(1 + u*2.2); rg.material.opacity = (1 - u)*.9*Math.min(1, tw*2); });
  // підписи
  controls.update();
  FLAME.m.uniforms.uScale.value = EMBER.m.uniforms.uScale.value = SMOKE.m.uniforms.uScale.value = FLASH.m.uniforms.uScale.value = TORCH.m.uniforms.uScale.value = MIST.m.uniforms.uScale.value = innerHeight*.9;
  renderer.render(scene, camera);
  var az0 = Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z); needle.style.transform = 'rotate(' + (-az0*180/Math.PI + 180) + 'deg)';
  var showB = step === 0 || document.body.classList.contains('lbl');
  BL.forEach(function(b){ place(b.el, b.p, !showB); });
  pinEls.forEach(function(p2){ place(p2.el, p2.p, tw < .45); });
}
function size(){ renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', size); size();

/* старт: проліт над маєтком */
camera.position.set(420, 420, 620); controls.target.set(-40, 0, -20);
go(0, true);
camera.position.set(420, 420, 620); controls.target.set(-40, 0, -20);
var c0 = camFor(0); camFrom.p.copy(camera.position); camFrom.t.copy(controls.target); camTo.p.copy(c0.p); camTo.t.copy(c0.t); camStart = performance.now() + 300; camFly = 0; CAMDUR = 5200;
setTimeout(function(){ CAMDUR = 3200; }, 6000);
document.getElementById('load').classList.add('off');
document.getElementById('lblBtn').onclick = function(){ var on = document.body.classList.toggle('lbl'); this.setAttribute('aria-pressed', on); };
requestAnimationFrame(frame);
window.W18S = {go: go, step: function(){ return step; }};
})();
