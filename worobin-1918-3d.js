/* Облога Воробина, 21–22 листопада 1918 — 3D-реконструкція.
   Розташування — за аерофотознімками: маєток (парк від шляху до схилу над лугами Горині), на північ за річкою — житлові
   будинки й, імовірно, спиртовий завод; на захід через шлях — будівлі лісництва. Масштаб і сторони світу — за павільйоном «Бібліотека».
   Осі: +x — схід (Горинь), +z — південь (Дубровиця), −z — північ. Одиниця — метр. */
(function(){
'use strict';
var T = THREE;
T.ColorManagement.legacyMode = false;
var DTMAX = /[?&]fast/.test(location.search) ? .3 : .06;
var MOBILE = matchMedia('(max-width:640px)').matches, LOW = MOBILE || (navigator.deviceMemory || 8) < 4;

/* ═════════════ допоміжне ═════════════ */
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
function polyAt(P, z){ for (var i = 0; i < P.length - 1; i++){ var a = P[i], b = P[i + 1]; if ((z - a[1])*(z - b[1]) <= 0) return lerp(a[0], b[0], (z - a[1])/((b[1] - a[1]) || 1)); } return P[0][0]; }
function cen(r){ return [(r.x0 + r.x1)/2, (r.z0 + r.z1)/2]; }

/* ═════════════ план ═════════════ */
var S = .28; function W(px, py){ return [(py - 760)*S, -(px - 900)*S]; }
var LIB = W(646, 1074);
var PAL = {N: {x0: -104, x1: -76, z0: -57, z1: -44}, M: {x0: -104, x1: -91, z0: -44, z1: -18.6}, S: {x0: -104, x1: -76, z0: -18.6, z1: -5.6}};
var AXZ = -31.3;
var LAWN = [-58, AXZ];
var ROAD = [[-262, 470], [-197, 252], [-146, 0], [-132, -70], [-115, -198], [-78, -376], [-60, -480]];
function roadX(z){ return polyAt(ROAD, z); }
var PARK = {z0: -124, z1: 106};
var GARDEN = [[775, 620], [772, 1082], [1295, 1090], [1365, 752], [1180, 742], [1180, 580], [1095, 548], [1040, 610]].map(function(p){ return W(p[0], p[1]); });
/* вода — за обрисами, які позначив автор на аерофотознімку (знімок 7: ↑ захід, → північ; I() переводить пікселі в метри):
   канал із заходу → під шляхом → довгий став з острівцем → перешийок із мостом → другий став → два рукави довкола трикутного острова →
   річка, що тече попід схилом (під «Бібліотекою») і далі на північ. */
function I(px, py){ return [-90 + (py - 592)*.415, -31.3 - (px - 1000)*.415]; }
function IP(a){ return a.map(function(p){ var q = I(p[0], p[1]); if (p.length > 2) q.push(p[2]); return q; }); }
function chaikin(P, closed, it){                                                    // згладжування ламаних (берегів)
  for (var n = 0; n < it; n++){ var Q = [], L = P.length, m = closed ? L : L - 1;
    if (!closed) Q.push(P[0].slice());
    for (var i = 0; i < m; i++){ var a = P[i], b = P[(i + 1) % L]; Q.push(a.map(function(v, k){ return v*.75 + b[k]*.25; }), a.map(function(v, k){ return v*.25 + b[k]*.75; })); }
    if (!closed) Q.push(P[L - 1].slice()); P = Q; }
  return P; }
function SP(a){ return chaikin(IP(a), true, 3); }
function SL(a){ return chaikin(IP(a), false, 3); }
var WPOLY = [
  SP([[1318, -80], [1322, 0], [1335, 100], [1348, 200], [1362, 300], [1378, 380], [1392, 450], [1398, 490], [1400, 522], [1440, 526], [1478, 513], [1445, 495], [1425, 460], [1408, 400], [1392, 300], [1375, 200], [1355, 100], [1342, 0], [1338, -80]]),
  SP([[1402, 545], [1452, 548], [1460, 600], [1466, 660], [1462, 720], [1452, 800], [1440, 870], [1432, 903], [1362, 895], [1356, 850], [1356, 780], [1362, 700], [1376, 640], [1396, 600], [1400, 565]]),
  SP([[1293, 935], [1305, 915], [1330, 907], [1425, 910], [1412, 945], [1410, 975], [1430, 1010], [1446, 1045], [1395, 1050], [1350, 1048], [1352, 1000], [1350, 965], [1320, 962], [1298, 958]]),
  SP([[395, 1059], [430, 1062], [462, 1078], [500, 1080], [560, 1077], [620, 1075], [700, 1074], [800, 1074], [900, 1073], [1000, 1070], [1080, 1069], [1115, 1073], [1140, 1090], [1158, 1130], [1166, 1180], [1175, 1225],
      [1195, 1250], [1230, 1262], [1265, 1272], [1300, 1290], [1335, 1300], [1335, 1318], [1300, 1312], [1260, 1300], [1215, 1288], [1182, 1268], [1165, 1235], [1157, 1190], [1145, 1140], [1125, 1108], [1090, 1093],
      [1000, 1097], [920, 1106], [880, 1124], [850, 1142], [815, 1150], [790, 1143], [765, 1115], [720, 1100], [660, 1094], [590, 1094], [520, 1102], [470, 1110], [440, 1092], [395, 1074]])
];
var ISLAND = SP([[1410, 643], [1432, 655], [1444, 700], [1443, 760], [1432, 790], [1408, 795], [1390, 770], [1386, 715], [1393, 670]]);
var BUP = SL([[-260, 1290, 7], [-20, 1250, 7], [40, 1225, 7], [200, 1160, 8], [330, 1090, 9], [400, 1066, 10]]), BDOWN = SL([[1320, 1306, 15], [1450, 1316, 15], [1560, 1325, 15], [1660, 1345, 15], [1720, 1370, 15], [1900, 1420, 15], [2150, 1470, 15]]);
var BBANK = chaikin(IP([[-260, 1286], [-20, 1246], [40, 1221], [200, 1156], [330, 1086], [395, 1059], [430, 1062], [462, 1078], [500, 1080], [560, 1077], [620, 1075], [700, 1074], [800, 1074], [900, 1073], [1000, 1070], [1080, 1069], [1115, 1073], [1140, 1090], [1158, 1130], [1166, 1180]]), false, 3);
var RIVB = BUP.concat(BDOWN);                                                       // для сумісності (вибірки точок)
var WLINES = [
  SL([[1335, 1040, 11], [1334, 1100, 11], [1335, 1180, 11], [1338, 1240, 12], [1330, 1290, 12], [1318, 1304, 12]]),                       // лівий рукав
  SL([[1440, 1040, 10], [1462, 1090, 11], [1485, 1150, 13], [1505, 1200, 15], [1535, 1250, 16], [1575, 1300, 16], [1630, 1340, 16]]),     // правий рукав
  IP([[1420, 512, 15], [1424, 562, 15]]),                                                                                                    // під шляхом
  IP([[1396, 888, 27], [1396, 922, 27]])                                                                                                     // під мостом
];
var BRIDGE = {x: I(0, 902)[0], z0: -177, z1: -212.5};
var NPATH = [[-62, -58], [-30, -88], [4, -124], [28, -158], [BRIDGE.x, BRIDGE.z0]], NPATH2 = [[BRIDGE.x, BRIDGE.z1], [52, -213], [56, -232], [58, -256]];
function closedDist(x, z, P){ var m = segDist(x, z, P[P.length - 1], P[0]); return Math.min(m, polyDist(x, z, P)); }
function sdPoly(x, z, P){ var d = closedDist(x, z, P); return inPoly(x, z, P) ? -d : d; }
function sdLine(x, z, P){ var m = 1e9; for (var i = 0; i < P.length - 1; i++){ var a = P[i], b = P[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0])*dx + (z - a[1])*dz)/(dx*dx + dz*dz)));
  m = Math.min(m, Math.hypot(x - a[0] - dx*t, z - a[1] - dz*t) - lerp(a[2], b[2], t)/2); } return m; }
function dWaterA(x, z){ var d = Math.max(sdPoly(x, z, WPOLY[1]), -sdPoly(x, z, ISLAND)); d = Math.min(d, sdPoly(x, z, WPOLY[0]), sdPoly(x, z, WPOLY[2]));
  for (var k = 0; k < WLINES.length; k++) d = Math.min(d, sdLine(x, z, WLINES[k])); return d; }
function dWaterB(x, z){ return Math.min(sdPoly(x, z, WPOLY[3]), sdLine(x, z, BUP), sdLine(x, z, BDOWN)); }
function dWater(x, z){ return Math.min(dWaterA(x, z), dWaterB(x, z)); }
var LOWLAND = BBANK.filter(function(p){ return p[1] > -100; }).map(function(p){ return [p[0] + .5, p[1]]; }).concat([[100, -112], [96, -150], [100, -232], [150, -345], [430, -345], [430, 520], [190, 520]]);
function bX(z){ return polyAt(BBANK, Math.max(-95, Math.min(500, z))); }
function edgeX(z){ return z > -100 ? bX(z) - 22 : 92; }
function nearWater(rng, d0, d1, box){ box = box || [-360, 300, -500, 460];        // випадкова точка на відстані d0..d1 від води
  for (var k = 0; k < 400; k++){ var x = lerp(box[0], box[1], rng()), z = lerp(box[2], box[3], rng()), d = dWater(x, z); if (d >= d0 && d <= d1) return [x, z, d]; } return null; }
function riverX(z){ return 330 + 18*Math.sin(z/130 + .5) + 8*Math.sin(z/47 + 1); }
var GATE_Z = 2, BACK_Z = AXZ;
var DRIVE = [[roadX(GATE_Z) + 4, GATE_Z], [-112, GATE_Z], [-80, GATE_Z + 1], [-66, -6], [-58, -15]];
var BACKPATH = [[roadX(BACK_Z) + 4, BACK_Z], [-104, BACK_Z]];
var LANE = chaikin([[-48, -6], [-47, 22], [-38, 42], [-12, 62], [26, 72], [58, 74], [LIB[0] - 20, LIB[1]]], false, 3);       // доріжка до «Бібліотеки» попід муром
/* пейзажний парк: звивисті доріжки (умовні), гаї й галявини */
var PATHS = [
  chaikin([[-30, 24], [2, 27], [38, 22], [72, 27], [83, 6], [80, -34], [84, -74], [72, -100], [42, -112], [14, -116], [6, -96], [-12, -72], [-38, -62], [-31, -36], [-35, -6]], true, 3).concat([[-30, 24]]),
  chaikin([[-41, -8], [-22, -4], [-4, -16], [16, -8], [34, -24], [56, -14], [70, -30], [81, -36]], false, 3),
  chaikin([[14, -116], [22, -88], [8, -62], [24, -40], [16, -8]], false, 3),
  chaikin([[34, -24], [46, 0], [38, 22]], false, 3),
  chaikin([[-12, 62], [-22, 86], [-58, 96], [-96, 84], [-112, 60]], false, 3),
  chaikin([[26, 72], [40, 92], [70, 96], [82, 88]], false, 3),
  chaikin([[-62, -58], [-82, -78], [-104, -96], [-118, -88]], false, 3)
];
function pathDist(x, z){ var m = 1e9; for (var k = 0; k < PATHS.length; k++) m = Math.min(m, polyDist(x, z, PATHS[k])); return m; }
function PARKD(x, z){ return fbm(x*.028 + .5, z*.028 + 2.1); }                      // «щільність» гаїв: високе — гай, низьке — галявина
var PORTICO = [], CHIMNEY = new T.Vector3(), GATES = {};

/* ═════════════ рельєф ═════════════ */
var MEADOW = -3.8, WL = -4.4, RIVER_W = -5;
function H(x, z){
  var dB = dWaterB(x, z), dA = dWaterA(x, z), wd = Math.min(dA, dB), h;
  if (wd < 0){ var din = -wd; h = -4.28 - .35*Math.min(din, 3) - (.5 + Math.min(1.2, din*.12))*ss(2.5, 7, din); }
  else {
    h = Math.min(-1.75*ss(27, 13, dB) - 2.2*ss(12.5, 0, dB), -3.95*(1 - ss(0, 40, dA)), -4.28 + .3*wd);
    h += ((fbm(x*.02, z*.02) - .5)*.7 + (fbm(x*.05 + 9, z*.05) - .5)*.25)*ss(3, 14, wd);
    if (inPoly(x, z, LOWLAND)){ var dl = closedDist(x, z, LOWLAND); h = lerp(h, MEADOW + (fbm(x*.015, z*.015) - .5)*.55*ss(2, 10, wd), ss(0, 12, dl)*ss(0, 3, wd)); }
  }
  var dr = Math.abs(x - riverX(z)); if (dr < 40) h = Math.min(h, MEADOW - 2.6*(1 - ss(22, 36, dr)));
  return h;
}

/* ═════════════ рендер і постобробка ═════════════ */
var cv = document.getElementById('view');
var renderer = new T.WebGLRenderer({canvas: cv, antialias: false, powerPreference: 'high-performance'});
var DPR = Math.min(devicePixelRatio, LOW ? 1.25 : 1.75);
renderer.setPixelRatio(DPR);
renderer.outputEncoding = T.sRGBEncoding;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
var GL2 = renderer.capabilities.isWebGL2;
var scene = new T.Scene();
scene.fog = new T.FogExp2(0x101828, .002);
/* атмосфера: до звичайного туману додано приземний (у долинах і над водою) та відсвіт пожежі в серпанку */
var HFOG = {uHF: {value: new T.Vector4(0, -3.6, 2, .8)}, uHFC: {value: new T.Color(.2, .24, .3)}, uFG: {value: new T.Vector4(0, 0, 0, 60)}, uFP: {value: new T.Vector3(-90, 6, -31)}};
T.ShaderChunk.fog_pars_vertex = '#ifdef USE_FOG\nvarying float vFogDepth; varying vec3 vFogWP;\n#endif';
T.ShaderChunk.fog_vertex = '#ifdef USE_FOG\nvFogDepth = - mvPosition.z; { vec3 fp = mvPosition.xyz - viewMatrix[3].xyz; vFogWP = vec3(dot(viewMatrix[0].xyz, fp), dot(viewMatrix[1].xyz, fp), dot(viewMatrix[2].xyz, fp)); }\n#endif';
T.ShaderChunk.fog_pars_fragment = '#ifdef USE_FOG\nuniform vec3 fogColor; varying float vFogDepth; varying vec3 vFogWP; uniform vec4 uHF; uniform vec3 uHFC; uniform vec4 uFG; uniform vec3 uFP;\n#ifdef FOG_EXP2\nuniform float fogDensity;\n#else\nuniform float fogNear; uniform float fogFar;\n#endif\n#endif';
T.ShaderChunk.fog_fragment = ['#ifdef USE_FOG',
  '#ifdef FOG_EXP2', 'float fogFactor = 1.0 - exp(- fogDensity*fogDensity*vFogDepth*vFogDepth);', '#else', 'float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);', '#endif',
  '{ float hfd = uHF.x*vFogDepth*exp(-max(vFogWP.y - uHF.y, 0.)/max(uHF.z, .01)); float hf = uHF.w*(1. - exp(-hfd));',
  '  vec3 fc = mix(fogColor, uHFC, hf/(fogFactor + hf + 1e-4)) + uFG.rgb*exp(-distance(vFogWP, uFP)/max(uFG.w, 1.));',
  '  fogFactor = max(fogFactor, hf); gl_FragColor.rgb = mix(gl_FragColor.rgb, fc, fogFactor); }', '#endif'].join('\n');
function applyHF(root){ root.traverse(function(o){ if (!o.material) return; (Array.isArray(o.material) ? o.material : [o.material]).forEach(function(m){
  if (m.isShaderMaterial || m.userData.hf) return; m.userData.hf = 1; m.onBeforeCompile = function(sh){ sh.uniforms.uHF = HFOG.uHF; sh.uniforms.uHFC = HFOG.uHFC; sh.uniforms.uFG = HFOG.uFG; sh.uniforms.uFP = HFOG.uFP; }; m.needsUpdate = true; }); }); }
var camera = new T.PerspectiveCamera(36, 1, 1.2, 7000);
var controls = new T.OrbitControls(camera, cv);
controls.enableDamping = true; controls.dampingFactor = .07; controls.maxPolarAngle = 1.45; controls.minDistance = 8; controls.maxDistance = 900; controls.screenSpacePanning = true;

var PP = (function(){
  if (!GL2){ renderer.toneMapping = T.ACESFilmicToneMapping; return null; }
  var VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
  var qs = new T.Scene(), qc = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1), quad = new T.Mesh(new T.PlaneGeometry(2, 2)); qs.add(quad); quad.frustumCulled = false;
  function rt(w, h, ms){ var r = new T.WebGLRenderTarget(w, h, {type: T.HalfFloatType, minFilter: T.LinearFilter, magFilter: T.LinearFilter, depthBuffer: !!ms, stencilBuffer: !!ms}); if (ms) r.samples = LOW ? 2 : 4; return r; }
  var main = rt(4, 4, true), L = [], N = 5, S = [[rt(4, 4), rt(4, 4)], [rt(4, 4), rt(4, 4)]];
  for (var i = 0; i < N; i++) L.push([rt(4, 4), rt(4, 4)]);
  var bright = new T.ShaderMaterial({uniforms: {t: {value: null}, th: {value: .85}}, vertexShader: VS, depthTest: false, depthWrite: false,
    fragmentShader: 'uniform sampler2D t; uniform float th; varying vec2 vUv; vec3 sn(vec3 c){ return (c.r == c.r && c.g == c.g && c.b == c.b) ? clamp(c, 0., 60.) : vec3(0.); } void main(){ vec3 c = sn(texture2D(t, vUv).rgb); float l = max(max(c.r, c.g), c.b); gl_FragColor = vec4(c*smoothstep(th, th*1.7 + .2, l), 1.); }'});
  var blur = new T.ShaderMaterial({uniforms: {t: {value: null}, d: {value: new T.Vector2()}}, vertexShader: VS, depthTest: false, depthWrite: false,
    fragmentShader: 'uniform sampler2D t; uniform vec2 d; varying vec2 vUv; void main(){ vec3 c = texture2D(t, vUv).rgb*.227; c += (texture2D(t, vUv + d*1.385).rgb + texture2D(t, vUv - d*1.385).rgb)*.316; c += (texture2D(t, vUv + d*3.231).rgb + texture2D(t, vUv - d*3.231).rgb)*.07; gl_FragColor = vec4(c, 1.); }'});
  var copy = new T.ShaderMaterial({uniforms: {t: {value: null}}, vertexShader: VS, depthTest: false, depthWrite: false, fragmentShader: 'uniform sampler2D t; varying vec2 vUv; void main(){ vec4 c = texture2D(t, vUv); gl_FragColor = (c.r == c.r && c.g == c.g && c.b == c.b) ? clamp(c, 0., 60.) : vec4(0., 0., 0., 1.); }'});
  var comp = new T.ShaderMaterial({uniforms: {t: {value: null}, b0: {value: null}, b1: {value: null}, b2: {value: null}, b3: {value: null}, b4: {value: null}, s0: {value: null}, s1: {value: null},
      bloom: {value: 1.2}, exposure: {value: 1}, time: {value: 0}, sat: {value: .9}, lift: {value: new T.Vector3()}, gain: {value: new T.Vector3(1, 1, 1)}, vig: {value: 1.1}, res: {value: new T.Vector2(1, 1)},
      tilt: {value: 0}, focus: {value: .5}, shT: {value: new T.Vector3(1, 1, 1)}, hiT: {value: new T.Vector3(1, 1, 1)}, vigC: {value: new T.Vector3(1, 1, 1)}, contrast: {value: .28}},
    vertexShader: VS, depthTest: false, depthWrite: false,
    fragmentShader: [
      'uniform sampler2D t, b0, b1, b2, b3, b4, s0, s1; uniform float bloom, exposure, time, sat, vig, tilt, focus, contrast; uniform vec3 lift, gain, shT, hiT, vigC; uniform vec2 res; varying vec2 vUv;',
      'vec3 sn(vec3 c){ return (c.r == c.r && c.g == c.g && c.b == c.b) ? clamp(c, 0., 60.) : vec3(0.); }',
      'vec3 aces(vec3 x){ return clamp((x*(2.51*x + .03))/(x*(2.43*x + .59) + .14), 0., 1.); }',
      'float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)))*43758.5453); }',
      'void main(){ vec2 d = vUv - .5; float r2 = dot(d, d);',
      '  vec2 ca = d*r2*.0035; vec3 c = sn(vec3(texture2D(t, vUv + ca).r, texture2D(t, vUv).g, texture2D(t, vUv - ca).b));',
      '  float tm = clamp(tilt*(smoothstep(.16, .5, abs(vUv.y - focus)) + r2*.7), 0., 1.);',                                          // м'який «об'єктив»: розмиття країв кадру
      '  vec3 sc = mix(texture2D(s0, vUv).rgb, texture2D(s1, vUv).rgb, smoothstep(.35, 1., tm)); c = mix(c, sc, tm);',
      '  vec3 b = texture2D(b0, vUv).rgb*.5 + texture2D(b1, vUv).rgb*.7 + texture2D(b2, vUv).rgb*.85 + texture2D(b3, vUv).rgb*.95 + texture2D(b4, vUv).rgb*1.05;',
      '  b *= vec3(1.12, .96, .86);',                                                                                                      // теплий ореол (галяція плівки)
      '  c = (c + b*bloom*.36)*exposure; c = aces(c); c = mix(c, c*c*(3. - 2.*c), contrast);',
      '  float l = dot(c, vec3(.2126, .7152, .0722)); c *= mix(shT, hiT, smoothstep(.04, .7, l));',                                    // роздільне тонування тіней і світла
      '  l = dot(c, vec3(.2126, .7152, .0722)); c = mix(vec3(l), c, sat); c = c*gain + lift*(1. - c);',
      '  float vg = clamp(1. - r2*vig, 0., 1.); c *= mix(vigC*.7, vec3(1.), vg*vg);',
      '  c = pow(max(c, 0.), vec3(1./2.2));',
      '  float g = h(vUv*res + fract(time)*91.7) - .5; c += g*(.026 - l*.014) + (h(vUv*res*1.3 + 7.) - .5)/255.; gl_FragColor = vec4(c, 1.); }'].join('\n')});
  function size(w, h){ main.setSize(w, h); var ww = w, hh = h; for (var i = 0; i < N; i++){ ww = Math.max(2, ww >> 1); hh = Math.max(2, hh >> 1); L[i][0].setSize(ww, hh); L[i][1].setSize(ww, hh); }
    S[0][0].setSize(Math.max(2, w >> 1), Math.max(2, h >> 1)); S[0][1].setSize(Math.max(2, w >> 1), Math.max(2, h >> 1)); S[1][0].setSize(Math.max(2, w >> 2), Math.max(2, h >> 2)); S[1][1].setSize(Math.max(2, w >> 2), Math.max(2, h >> 2));
    comp.uniforms.res.value.set(w, h); }
  function pass(m, target){ quad.material = m; renderer.setRenderTarget(target); renderer.render(qs, qc); }
  function blur2(P, n){ for (var k = 0; k < n; k++){ var w = P[0].width, h = P[0].height;
    blur.uniforms.t.value = P[0].texture; blur.uniforms.d.value.set(1/w, 0); pass(blur, P[1]); blur.uniforms.t.value = P[1].texture; blur.uniforms.d.value.set(0, 1/h); pass(blur, P[0]); } }
  function render(){
    renderer.setRenderTarget(main); renderer.render(scene, camera);
    bright.uniforms.t.value = main.texture; pass(bright, L[0][0]);
    for (var i = 0; i < N; i++){
      if (i > 0){ copy.uniforms.t.value = L[i - 1][0].texture; pass(copy, L[i][0]); }
      blur2(L[i], 1);
    }
    var tl = comp.uniforms.tilt.value > .01;
    if (tl){ copy.uniforms.t.value = main.texture; pass(copy, S[0][0]); blur2(S[0], 1); copy.uniforms.t.value = S[0][0].texture; pass(copy, S[1][0]); blur2(S[1], 2); }
    comp.uniforms.t.value = main.texture; ['b0', 'b1', 'b2', 'b3', 'b4'].forEach(function(k, i){ comp.uniforms[k].value = L[i][0].texture; });
    comp.uniforms.s0.value = tl ? S[0][0].texture : main.texture; comp.uniforms.s1.value = tl ? S[1][0].texture : main.texture;
    pass(comp, null);
  }
  return {size: size, render: render, U: comp.uniforms, bright: bright.uniforms};
})();

/* ═════════════ небо, світло ═════════════ */
var hemi = new T.HemisphereLight(0xffffff, 0x3a3326, .5); scene.add(hemi);
var sun = new T.DirectionalLight(0xffffff, 1); sun.castShadow = true;
sun.shadow.mapSize.set(LOW ? 1024 : 2048, LOW ? 1024 : 2048);
var sc = sun.shadow.camera; sc.left = -170; sc.right = 170; sc.top = 170; sc.bottom = -170; sc.near = 20; sc.far = 1400; sun.shadow.bias = -.0004; sun.shadow.normalBias = .5;
scene.add(sun); scene.add(sun.target);
var skyU = {top: {value: col(0x0b1222)}, hor: {value: col(0x26324a)}, sunDir: {value: new T.Vector3(0, 1, 0)}, sunCol: {value: col(0xffd9a0)}, sunK: {value: 0},
  moonDir: {value: new T.Vector3(.45, .55, -.7).normalize()}, moonK: {value: 0}, cloudC: {value: col(0x666a70)}, cloudK: {value: .7}, time: {value: 0}, glow: {value: 0}};
var sky = new T.Mesh(new T.SphereGeometry(3500, 48, 24), new T.ShaderMaterial({side: T.BackSide, depthWrite: false, fog: false, uniforms: skyU,
  vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }',
  fragmentShader: [
    'uniform vec3 top, hor, sunDir, sunCol, moonDir, cloudC; uniform float sunK, moonK, cloudK, time, glow; varying vec3 vD;',
    'float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }',
    'float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f); return mix(mix(hs(i), hs(i + vec2(1, 0)), f.x), mix(hs(i + vec2(0, 1)), hs(i + vec2(1, 1)), f.x), f.y); }',
    'float fb(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ s += n2(p)*a; p = p*2.03 + 1.7; a *= .5; } return s; }',
    'void main(){ vec3 d = normalize(vD); float y = max(d.y, 0.); vec3 c = mix(hor, top, pow(y, .5));',
    '  float s = max(dot(d, normalize(sunDir)), 0.); c += sunCol*(pow(s, 5.)*.4 + pow(s, 600.)*3.)*sunK;',
    '  float m = max(dot(d, normalize(moonDir)), 0.); c += vec3(.75, .82, 1.)*(smoothstep(.99955, .9997, m)*2.2 + pow(m, 40.)*.12)*moonK;',
    '  vec2 p = d.xz/(d.y + .18)*1.3 + vec2(time*.004, time*.0015); float cl = smoothstep(.42, .78, fb(p*1.6)); cl *= smoothstep(0., .25, d.y);',
    '  vec3 cc = cloudC*(.75 + .5*fb(p*3.2)) + sunCol*pow(s, 3.)*sunK*.5 + vec3(.6, .7, .9)*pow(m, 6.)*moonK*.25 + vec3(1., .42, .12)*glow*(1. - y)*.9;',
    '  c = mix(c, cc, cl*cloudK); c += vec3(1., .4, .1)*glow*pow(1. - y, 6.)*.35; c = mix(c, hor*.85, smoothstep(0., -.18, d.y)); gl_FragColor = vec4(c, 1.); }'].join('\n')}));
sky.renderOrder = -10; scene.add(sky);
var starGeo = new T.BufferGeometry(), sp = [];
for (var i = 0; i < 1600; i++){ var u = rnd()*2 - 1, a = rnd()*6.283, r = Math.sqrt(1 - u*u); if (u < .08) continue; sp.push(Math.cos(a)*r*3300, u*3300, Math.sin(a)*r*3300); }
starGeo.setAttribute('position', new T.Float32BufferAttribute(sp, 3));
var stars = new T.Points(starGeo, new T.PointsMaterial({color: 0xdfe6ff, size: 1.8, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false}));
scene.add(stars);
function dotTex(soft){ var c = document.createElement('canvas'); c.width = c.height = 64; var g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(soft ? .3 : .4, 'rgba(255,255,255,' + (soft ? .5 : .75) + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new T.CanvasTexture(c); }
var DOT = dotTex(false), PUFF = dotTex(true);

/* ═════════════ текстури й матеріали ═════════════ */
function canvasTex(size, draw, rep){ var c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size); var t = new T.CanvasTexture(c);
  t.wrapS = t.wrapT = T.RepeatWrapping; t.encoding = T.sRGBEncoding; t.anisotropy = 4; if (rep) t.repeat.set(rep, rep); return t; }
var plasterTex = canvasTex(256, function(g, s){ g.fillStyle = '#d8d0bf'; g.fillRect(0, 0, s, s);
  for (var k = 0; k < 3000; k++){ var v = Math.random(); g.fillStyle = 'rgba(' + (v < .5 ? '60,50,40' : '255,250,240') + ',' + (Math.random()*.06) + ')'; g.fillRect(Math.random()*s, Math.random()*s, 2 + Math.random()*5, 2 + Math.random()*5); }
  for (k = 0; k < 14; k++){ var x = Math.random()*s, gr = g.createLinearGradient(x, 0, x, s); gr.addColorStop(0, 'rgba(70,60,50,0)'); gr.addColorStop(.6, 'rgba(70,60,50,.08)'); gr.addColorStop(1, 'rgba(70,60,50,0)'); g.fillStyle = gr; g.fillRect(x, s*.3, 3 + Math.random()*6, s*.7); } });
var seamTex = canvasTex(128, function(g, s){ g.fillStyle = '#b7bcbc'; g.fillRect(0, 0, s, s); for (var x = 0; x < s; x += 16){ g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x, 0, 2, s); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x + 2, 0, 1, s); }
  for (var k = 0; k < 400; k++){ g.fillStyle = 'rgba(80,60,40,' + Math.random()*.08 + ')'; g.fillRect(Math.random()*s, Math.random()*s, 3, 6); } });
var tileTex = canvasTex(128, function(g, s){ g.fillStyle = '#9a5a40'; g.fillRect(0, 0, s, s); for (var y = 0; y < s; y += 8){ for (var x = (y/8 % 2)*6; x < s; x += 12){ g.fillStyle = 'rgba(0,0,0,' + (.12 + Math.random()*.12) + ')'; g.fillRect(x, y + 6, 11, 2); g.fillStyle = 'rgba(255,200,170,' + Math.random()*.08 + ')'; g.fillRect(x, y, 11, 5); } } });
var brickTex = canvasTex(128, function(g, s){ g.fillStyle = '#7d3f2c'; g.fillRect(0, 0, s, s); for (var y = 0; y < s; y += 8){ g.fillStyle = 'rgba(210,190,170,.45)'; g.fillRect(0, y, s, 1); for (var x = (y/8 % 2)*8; x < s; x += 16){ g.fillStyle = 'rgba(210,190,170,.45)'; g.fillRect(x, y, 1, 8); g.fillStyle = 'rgba(0,0,0,' + Math.random()*.2 + ')'; g.fillRect(x + 1, y + 1, 15, 7); } } });
var woodTex = canvasTex(128, function(g, s){ g.fillStyle = '#5a4532'; g.fillRect(0, 0, s, s); for (var x = 0; x < s; x += 10){ g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, 0, 1.5, s); for (var k = 0; k < 8; k++){ g.fillStyle = 'rgba(255,230,200,' + Math.random()*.06 + ')'; g.fillRect(x + 2, Math.random()*s, 7, 10 + Math.random()*20); } } });
var thatchTex = canvasTex(128, function(g, s){ g.fillStyle = '#6e5b3c'; g.fillRect(0, 0, s, s); for (var k = 0; k < 900; k++){ g.strokeStyle = 'rgba(' + (Math.random() < .5 ? '40,30,15' : '170,140,90') + ',' + (.15 + Math.random()*.2) + ')'; g.beginPath(); var x = Math.random()*s, y = Math.random()*s; g.moveTo(x, y); g.lineTo(x + (Math.random() - .5)*3, y + 8 + Math.random()*8); g.stroke(); } });
function worldUV(g, sc0){
  var p = g.attributes.position, n = g.attributes.normal, uv = new Float32Array(p.count*2);
  for (var k = 0; k < p.count; k++){ var x = p.getX(k), y = p.getY(k), z = p.getZ(k), ax = Math.abs(n.getX(k)), ay = Math.abs(n.getY(k)), az = Math.abs(n.getZ(k));
    if (ay > ax && ay > az){ uv[k*2] = x/sc0; uv[k*2 + 1] = z/sc0; } else if (ax > az){ uv[k*2] = z/sc0; uv[k*2 + 1] = y/sc0; } else { uv[k*2] = x/sc0; uv[k*2 + 1] = y/sc0; } }
  g.setAttribute('uv', new T.BufferAttribute(uv, 2)); return g; }
var M = {
  plaster: function(c){ return new T.MeshStandardMaterial({color: c || 0xf0e6cf, map: plasterTex, roughness: .92}); },
  trim: new T.MeshStandardMaterial({color: 0xf6f0e2, map: plasterTex, roughness: .85}),
  stone: new T.MeshStandardMaterial({color: 0x9b958a, map: plasterTex, roughness: 1}),
  tin: new T.MeshStandardMaterial({color: 0x59665f, map: seamTex, roughness: .5, metalness: .35, side: T.DoubleSide}),
  tile: new T.MeshStandardMaterial({color: 0xffffff, map: tileTex, roughness: .85, side: T.DoubleSide}),
  brick: new T.MeshStandardMaterial({color: 0xffffff, map: brickTex, roughness: .95}),
  wood: new T.MeshStandardMaterial({color: 0xffffff, map: woodTex, roughness: .95}),
  thatch: new T.MeshStandardMaterial({color: 0xffffff, map: thatchTex, roughness: 1, side: T.DoubleSide}),
  door: new T.MeshStandardMaterial({color: 0x3e2a1c, roughness: .7}),
  dark: new T.MeshStandardMaterial({color: 0x26221e, roughness: .9}),
  iron: new T.MeshStandardMaterial({color: 0x1f2224, roughness: .5, metalness: .6}),
  char: new T.MeshBasicMaterial({color: 0x120e0b})
};

/* ═════════════ земля ═════════════ */
var GX0 = -360, GX1 = 380, GZ0 = -500, GZ1 = 460;
var gGeo = new T.PlaneGeometry(GX1 - GX0, GZ1 - GZ0, LOW ? 240 : 370, LOW ? 310 : 480); gGeo.rotateX(-Math.PI/2); gGeo.translate((GX0 + GX1)/2, 0, (GZ0 + GZ1)/2);
var gp = gGeo.attributes.position, gc = new Float32Array(gp.count*3), tmpC = new T.Color(), tmp2 = new T.Color();
var C = {field1: col(0x5d4a37), field2: col(0x6f5b42), winter: col(0x4f5a34), park: col(0x3f4a2a), leaf: col(0x5d4a2c), lawn: col(0x55633a), meadow: col(0x7b7848), wet: col(0x4f5d3c),
  road: col(0x6a543b), gravel: col(0xa89a80), slope: col(0x4c4a2c), garden: col(0x47502f), bank: col(0x5a5a3c), yard: col(0x6b5c46), mud: col(0x4b3d2d)};
for (i = 0; i < gp.count; i++){
  var x = gp.getX(i), z = gp.getZ(i), h = H(x, z); gp.setY(i, h);
  var e = edgeX(z), rx = roadX(z), n = fbm(x*.08, z*.08), c;
  var inPark = z > PARK.z0 && z < PARK.z1 && x > rx + 6 && x < e + 6;
  if (x < rx - 6){ var band = Math.floor((z + 30*Math.sin(x*.004))/46), strip = Math.sin((x*.9 + z*.12)*1.7)*.5 + .5; c = tmpC.copy(hash(band, 3) > .6 ? C.winter : C.field1).lerp(C.field2, strip*.5); }
  else if (inPark){ var pd = PARKD(x, z); c = tmpC.copy(C.lawn).lerp(C.park, ss(.36, .5, pd)).lerp(C.leaf, ss(.45, .62, pd)*ss(.4, .7, fbm(x*.05 + 3, z*.05))*.9); }
  else if (z < PARK.z0){ c = tmpC.copy(C.field1).lerp(C.field2, Math.sin((z*.8 + x*.2)*1.4)*.5 + .5); if (x > -40 && x < 110 && z < -205 && z > -350) c.lerp(C.yard, .75); }
  else c = tmpC.copy(C.field1).lerp(C.winter, ss(.45, .6, fbm(x*.01, z*.01)));
  var dwA = dWaterA(x, z), dwB = dWaterB(x, z);
  if (h < -.7) c.lerp(C.slope, ss(-.7, -1.8, h)*.85);                                     // схили долин
  if (h < -2.6){ tmp2.copy(C.meadow).lerp(C.wet, ss(.35, .7, fbm(x*.02 + 4, z*.02))*.8 + (1 - ss(5, 26, Math.min(dwA, dwB)))*.55); c.lerp(tmp2, ss(-2.6, -3.6, h)); }   // заплава
  var dwat = Math.min(dwA, dwB, Math.abs(x - riverX(z)) - 24); if (dwat < 7) c.lerp(C.bank, (1 - ss(1, 7, dwat))*.8);
  var dl = Math.hypot(x - LIB[0] + 15, z - LIB[1] + 3); if (dl < 62 && x < e) c.lerp(C.lawn, (1 - ss(38, 62, dl))*.85);
  if (x > -92 && x < -36 && z > -50 && z < 8) c.lerp(C.gravel, .8);
  if (x > -91 && x < -76 && z > -44 && z < -18.6) c.lerp(C.gravel, .9);
  var dlw = Math.hypot(x - LAWN[0], z - LAWN[1]); if (dlw < 10.5) c.copy(C.lawn); else if (dlw < 16) c.lerp(C.gravel, 1);
  var d1 = polyDist(x, z, ROAD); if (d1 < 6.5){ c.lerp(C.road, 1 - ss(3.5, 6.5, d1)); if (d1 < 3.2) c.lerp(C.mud, ss(.55, .8, fbm(x*.3, z*.3))*.6); }
  var d2 = Math.min(polyDist(x, z, DRIVE), polyDist(x, z, LANE), polyDist(x, z, BACKPATH), polyDist(x, z, NPATH) + .6, polyDist(x, z, NPATH2) + .6);  if (inPark || inPoly(x, z, GARDEN)){ var pdd = pathDist(x, z); if (pdd < 2.2) c.lerp(tmp2.copy(C.gravel).multiplyScalar(.85), (1 - ss(.9, 2.2, pdd))*.7); }
  if (d2 < 3.6) c.lerp(C.gravel, (1 - ss(1.8, 3.6, d2))*.9);
  c.multiplyScalar(.8 + .32*n);
  gc[i*3] = c.r; gc[i*3 + 1] = c.g; gc[i*3 + 2] = c.b;
}
gGeo.setAttribute('color', new T.BufferAttribute(gc, 3)); gGeo.computeVertexNormals();
var grainTex = canvasTex(256, function(g, s){ var d = g.createImageData(s, s); for (var k = 0; k < d.data.length; k += 4){ var v = 190 + Math.random()*65; d.data[k] = d.data[k + 1] = d.data[k + 2] = v; d.data[k + 3] = 255; } g.putImageData(d, 0, 0); });
grainTex.encoding = T.LinearEncoding; grainTex.repeat.set(160, 200);
var ground = new T.Mesh(gGeo, new T.MeshStandardMaterial({vertexColors: true, roughness: 1, map: grainTex}));
ground.receiveShadow = true; scene.add(ground);
(function(){
  var g = new T.PlaneGeometry(6000, 6000, 90, 90); g.rotateX(-Math.PI/2);
  var p = g.attributes.position, cc = new Float32Array(p.count*3);
  for (var k = 0; k < p.count; k++){ var x = p.getX(k), z = p.getZ(k), e = edgeX(Math.max(-600, Math.min(600, z)));
    var y0 = x > e + 30 ? MEADOW - .3 : -.35;                                     // далека площина ніде не вища за рельєф у своїй клітинці
    if (Math.abs(x) < 900 && Math.abs(z) < 900){ var hm = 0; for (var sx = -66; sx <= 66; sx += 12) for (var sz = -66; sz <= 66; sz += 12) hm = Math.min(hm, H(x + sx, z + sz)); y0 = hm < -3.4 ? -8 : Math.min(y0, hm); }
    p.setY(k, y0 - .3);
    var c = x > e + 30 ? tmpC.copy(C.meadow).lerp(C.wet, .4) : tmpC.copy(C.field1).lerp(C.winter, hash(Math.floor(x/140), Math.floor(z/140)) > .5 ? .6 : .1);
    c.multiplyScalar(.75 + .25*hash(Math.floor(x/70), Math.floor(z/70))); cc[k*3] = c.r; cc[k*3 + 1] = c.g; cc[k*3 + 2] = c.b; }
  g.setAttribute('color', new T.BufferAttribute(cc, 3)); g.computeVertexNormals(); scene.add(new T.Mesh(g, new T.MeshStandardMaterial({vertexColors: true, roughness: 1})));
})();

/* ═════════════ вода ═════════════ */
var waterU = {uHF: HFOG.uHF, uHFC: HFOG.uHFC, uFG: HFOG.uFG, uFP: HFOG.uFP, uTime: {value: 0}, uSky: {value: col(0x26324a)}, uDeep: {value: col(0x13202a)}, uSun: {value: new T.Vector3(0, 1, 0)}, uSunC: {value: col(0xffffff)}, uFire: {value: 0}, uFireP: {value: new T.Vector3(-90, 8, -31)},
  fogColor: {value: new T.Color()}, fogDensity: {value: .002}, uFlow: {value: 1}};
var waterMat = new T.ShaderMaterial({uniforms: waterU, transparent: true, fog: true, depthWrite: false,
  vertexShader: 'attribute float aEdge; varying vec3 vW; varying float vE;\n#include <fog_pars_vertex>\nvoid main(){ vE = aEdge; vec4 w = modelMatrix*vec4(position, 1.); vW = w.xyz; vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
  fragmentShader: ['uniform float uTime, uFire, uFlow; uniform vec3 uSky, uDeep, uSun, uSunC, uFireP; varying vec3 vW; varying float vE;',
    '#include <fog_pars_fragment>',
    'float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }',
    'float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f); return mix(mix(hs(i), hs(i + vec2(1, 0)), f.x), mix(hs(i + vec2(0, 1)), hs(i + vec2(1, 1)), f.x), f.y); }',
    'float hgt(vec2 p){ return n2(p*.35 + vec2(0., -uTime*.25*uFlow))*.6 + n2(p*.9 + vec2(uTime*.07, -uTime*.5*uFlow))*.3 + n2(p*2.3 - vec2(0., uTime*.9*uFlow))*.12; }',
    'void main(){ vec2 p = vW.xz; float e = .25; float h0 = hgt(p); vec3 n = normalize(vec3(h0 - hgt(p + vec2(e, 0.)), .32, h0 - hgt(p + vec2(0., e))));',
    '  vec3 v = normalize(cameraPosition - vW); float fr = .04 + .96*pow(1. - max(dot(n, v), 0.), 5.);',
    '  vec3 r = reflect(-v, n); vec3 sk = mix(uSky*.85, uSky*1.15, clamp(r.y, 0., 1.));',
    '  vec3 c = mix(uDeep, sk, clamp(fr*1.25, 0., 1.)); float s = pow(max(dot(r, normalize(uSun)), 0.), 180.); c += uSunC*s*2.2;',
    '  vec3 fd = uFireP - vW; float fdist = length(fd); float fs = pow(max(dot(r, fd/fdist), 0.), 12.); c += vec3(1., .45, .12)*uFire*(fs*2.5 + fr*.3)*clamp(260./fdist, 0., 1.);',
    '  float sh = smoothstep(.0, .22, vE); c = mix(uDeep*1.6 + vec3(.04, .05, .03), c, sh); float fo = (1. - smoothstep(.02, .09, vE))*(.5 + .5*n2(p*2. + uTime*.3));',
    '  c += vec3(.6, .65, .62)*fo*.35; gl_FragColor = vec4(c, mix(.55, .94, sh));',
    '#include <fog_fragment>', '}'].join('\n')});
function waterStrip(fx, w, level, z0, z1, path){
  var segs = 160, pos = [], idx = [], edge = [], pts = [], k;
  if (path){ var cv2 = new T.CatmullRomCurve3(path.map(function(p){ return new T.Vector3(p[0], 0, p[1]); })); for (k = 0; k <= segs; k++) pts.push(cv2.getPointAt(k/segs)); }
  for (k = 0; k <= segs; k++){
    var px, pz, nx, nz;
    if (path){ var P = pts[k], Q = pts[Math.min(segs, k + 1)], R0 = pts[Math.max(0, k - 1)]; px = P.x; pz = P.z; var tx = Q.x - R0.x, tz = Q.z - R0.z, L = Math.hypot(tx, tz) || 1; nx = -tz/L; nz = tx/L; }
    else { pz = lerp(z0, z1, k/segs); px = fx(pz); nx = 1; nz = 0; }
    for (var j = 0; j < 9; j++){ var f = j/8 - .5, qx = px + nx*w*f, qz = pz + nz*w*f; pos.push(qx, level, qz); edge.push(Math.min(.5, Math.max(0, (level - H(qx, qz))/1.4))); }
    if (k){ var a = (k - 1)*9; for (j = 0; j < 8; j++) idx.push(a + j, a + j + 9, a + j + 1, a + j + 1, a + j + 9, a + j + 10); }
  }
  var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('aEdge', new T.Float32BufferAttribute(edge, 1)); g.setIndex(idx);
  var m = new T.Mesh(g, waterMat); m.renderOrder = 1; scene.add(m); return m; }
function waterDisc(x, z, rx, rz, level){
  var g = new T.PlaneGeometry(2*rx, 2*rz, 64, 28); g.rotateX(-Math.PI/2); var p = g.attributes.position, edge = new Float32Array(p.count);
  for (var k = 0; k < p.count; k++) edge[k] = Math.min(.5, Math.max(0, (level - H(x + p.getX(k), z + p.getZ(k)))/1.4));
  g.setAttribute('aEdge', new T.BufferAttribute(edge, 1));
  var m = new T.Mesh(g, waterMat); m.position.set(x, level, z); m.renderOrder = 1; scene.add(m); return m; }
waterStrip(riverX, 52, RIVER_W, GZ0 - 400, GZ1 + 400);
(function(){                                                                    // уся вода маєтку — одна площина на рівні WL, береги дає рельєф
  var x0 = -362, x1 = 262, z0 = -500, z1 = 462, st = LOW ? 3.2 : 2.4, nx = Math.ceil((x1 - x0)/st), nz = Math.ceil((z1 - z0)/st), hv = new Float32Array((nx + 1)*(nz + 1)), pos = [], edge = [], idx = [], map = new Int32Array((nx + 1)*(nz + 1)).fill(-1);
  for (var j = 0; j <= nz; j++) for (var i2 = 0; i2 <= nx; i2++){ var x = x0 + i2*st, z = z0 + j*st; hv[j*(nx + 1) + i2] = (dWater(x, z) < 6) ? H(x, z) : 0; }
  function vid(i2, j){ var k = j*(nx + 1) + i2; if (map[k] < 0){ map[k] = pos.length/3; pos.push(x0 + i2*st, WL, z0 + j*st); edge.push(Math.min(.5, Math.max(0, (WL - hv[k])/1.4))); } return map[k]; }
  for (j = 0; j < nz; j++) for (i2 = 0; i2 < nx; i2++){ var k = j*(nx + 1) + i2;
    if (Math.min(hv[k], hv[k + 1], hv[k + nx + 1], hv[k + nx + 2]) < WL + .02){ var a = vid(i2, j), b = vid(i2 + 1, j), c = vid(i2, j + 1), d = vid(i2 + 1, j + 1); idx.push(a, c, b, b, c, d); } }
  var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('aEdge', new T.Float32BufferAttribute(edge, 1)); g.setIndex(idx);
  var m = new T.Mesh(g, waterMat); m.renderOrder = 1; scene.add(m);
})();
(function(){                                                                    // очерет
  var reed = (function(){ var P = [], Nn = [], Cc = []; for (var k = 0; k < 7; k++){ var g = new T.ConeGeometry(.05, 1.6 + Math.random(), 3); g.translate((Math.random() - .5)*.6, .8, (Math.random() - .5)*.6); g.rotateZ((Math.random() - .5)*.3);
    g = g.toNonIndexed(); g.computeVertexNormals(); var c = col(Math.random() < .5 ? 0x8a7a48 : 0x6c6a3e); P.push.apply(P, g.attributes.position.array); Nn.push.apply(Nn, g.attributes.normal.array); for (var q = 0; q < g.attributes.position.count; q++) Cc.push(c.r, c.g, c.b); }
    var g2 = new T.BufferGeometry(); g2.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g2.setAttribute('normal', new T.Float32BufferAttribute(Nn, 3)); g2.setAttribute('color', new T.Float32BufferAttribute(Cc, 3)); return g2; })();
  var L = [];
  for (var k = 0; k < (LOW ? 500 : 1100); k++){
    var t = rnd(), x, z;
    if (t < .25){ z = GZ0 + rnd()*(GZ1 - GZ0); x = riverX(z) + (rnd() < .5 ? -1 : 1)*(24 + rnd()*5); }
    else { var nw = nearWater(rnd, -1.6, 1.8); if (!nw){ continue; } x = nw[0]; z = nw[1]; if (polyDist(x, z, ROAD) < 6 || Math.abs(x - BRIDGE.x) < 4 && z < BRIDGE.z0 + 2 && z > BRIDGE.z1 - 2) continue; }
    if (x < GX0 || x > GX1 || z < GZ0 || z > GZ1 || H(x, z) > -3.7) continue;
    L.push([x, H(x, z), z, .8 + rnd()*.7, rnd()*6.28]);
  }
  var im = new T.InstancedMesh(reed, new T.MeshStandardMaterial({vertexColors: true, roughness: 1}), L.length), d = new T.Object3D();
  L.forEach(function(q, j){ d.position.set(q[0], q[1], q[2]); d.rotation.set(0, q[4], 0); d.scale.set(q[3], q[3]*(.8 + rnd()*.6), q[3]); d.updateMatrix(); im.setMatrixAt(j, d.matrix); });
  scene.add(im);
})();

/* ═════════════ будівлі ═════════════ */
function mergeG(list, withColor){
  var P = [], N = [], Cc = [];
  list.forEach(function(q){ var g = q[0].index ? q[0].toNonIndexed() : q[0]; if (!g.attributes.normal) g.computeVertexNormals(); var p = g.attributes.position.array, n = g.attributes.normal.array;
    for (var k = 0; k < p.length; k++){ P.push(p[k]); N.push(n[k]); } if (withColor){ var c = col(q[1] || 0xffffff); for (k = 0; k < p.length/3; k++) Cc.push(c.r, c.g, c.b); } });
  var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(N, 3)); if (withColor) g.setAttribute('color', new T.Float32BufferAttribute(Cc, 3)); return g;
}
function bx(w, h, d, x, y, z){ var g = new T.BoxGeometry(w, h, d); g.translate(x, y, z); return g; }
function hipRoof(w, d, rh, gable){
  var along = w >= d, ins = gable ? 0 : Math.min(w, d)/2;
  var p = along ? [[-w/2, -d/2], [w/2, -d/2], [w/2, d/2], [-w/2, d/2], [-w/2 + ins, 0], [w/2 - ins, 0]] : [[-w/2, -d/2], [w/2, -d/2], [w/2, d/2], [-w/2, d/2], [0, -d/2 + ins], [0, d/2 - ins]];
  var B = function(i){ return [p[i][0], 0, p[i][1]]; }, Rr = function(i){ return [p[i][0], rh, p[i][1]]; };
  var tris = along ? [[B(0), Rr(4), Rr(5)], [B(0), Rr(5), B(1)], [B(1), Rr(5), B(2)], [B(2), Rr(5), Rr(4)], [B(2), Rr(4), B(3)], [B(3), Rr(4), B(0)]]
                   : [[B(0), Rr(4), B(1)], [B(1), Rr(4), Rr(5)], [B(1), Rr(5), B(2)], [B(2), Rr(5), B(3)], [B(3), Rr(5), Rr(4)], [B(3), Rr(4), B(0)]];
  var arr = []; tris.forEach(function(t){ arr.push.apply(arr, t[0].concat(t[2], t[1])); });
  var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(arr, 3)); g.computeVertexNormals();
  var pn = g.attributes.position, nn = g.attributes.normal, uv = new Float32Array(pn.count*2);
  for (var k = 0; k < pn.count; k++){ var nx = nn.getX(k), nz = nn.getZ(k); var u0 = Math.abs(nx) > Math.abs(nz) ? pn.getZ(k) : pn.getX(k); uv[k*2] = u0/3; uv[k*2 + 1] = pn.getY(k)/3; }
  g.setAttribute('uv', new T.BufferAttribute(uv, 2)); return g;
}
var GLASS_MATS = [];
function building(o){
  var r = o.r, w = r.x1 - r.x0, d = r.z1 - r.z0, cx = (r.x0 + r.x1)/2, cz = (r.z0 + r.z1)/2;
  var fl = o.floors || 1, fh = o.fh || 4.2, pl = o.plinth == null ? .9 : o.plinth, Hh = pl + fl*fh + .35;
  var y0 = o.y0 != null ? o.y0 : Math.min(H(r.x0, r.z0), H(r.x1, r.z1), H(r.x0, r.z1), H(r.x1, r.z0), H(cx, cz)) - .15;
  var grp = new T.Group(); grp.position.set(cx, y0, cz); scene.add(grp);
  var wallMat = M.plaster(o.wall);
  var body = new T.Mesh(worldUV(bx(w, Hh, d, 0, Hh/2, 0), 3.5), wallMat); body.castShadow = body.receiveShadow = true; grp.add(body);
  var trim = [], glass = [], doors = [];
  trim.push(bx(w + .45, pl, d + .45, 0, pl/2, 0));
  for (var f = 1; f < fl; f++) trim.push(bx(w + .22, .26, d + .22, 0, pl + f*fh, 0));
  trim.push(bx(w + .7, .32, d + .7, 0, Hh - .1, 0), bx(w + 1.05, .22, d + 1.05, 0, Hh + .12, 0));
  if (o.rust !== false) [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function(s){
    for (var y = pl + .1, k = 0; y < Hh - .5; y += .52, k++){ var a = k % 2 ? .62 : .92;
      trim.push(bx(a, .44, .1, s[0]*(w/2 - a/2), y + .22, s[1]*(d/2 + .04)), bx(.1, .44, a, s[0]*(w/2 + .04), y + .22, s[1]*(d/2 - a/2))); } });
  var FACES = {n: {L: w, nx: 0, nz: -1}, s: {L: w, nx: 0, nz: 1}, w: {L: d, nx: -1, nz: 0}, e: {L: d, nx: 1, nz: 0}};
  Object.keys(FACES).forEach(function(fk){
    var F = FACES[fk], L = F.L, axes = Math.max(1, Math.round((L - 2.2)/(o.axis || 3.4))), step = (L - 2.2)/axes;
    var cover = (o.cover && o.cover[fk]) || [], dl = (o.doors && o.doors[fk]) || [];
    var rot = new T.Matrix4().makeRotationY(fk === 's' ? 0 : fk === 'n' ? Math.PI : fk === 'e' ? Math.PI/2 : -Math.PI/2);
    var mtx = new T.Matrix4().makeTranslation(F.nx*(w/2), 0, F.nz*(d/2)).multiply(rot);
    for (var a = 0; a < axes; a++){
      var u = -L/2 + 1.1 + step*(a + .5), uu = fk === 'n' || fk === 'e' ? 1 - (u + L/2)/L : (u + L/2)/L;
      if (cover.some(function(c){ return uu > c[0] && uu < c[1]; })) continue;
      for (var fi = 0; fi < fl; fi++){
        var isDoor = fi === 0 && dl.some(function(t){ return Math.abs(t - uu) < .5/axes; });
        var ww = isDoor ? 1.7 : 1.18, wh = isDoor ? 3.1 : (fi === 0 ? 2.35 : 2.15), yb = pl + fi*fh + (isDoor ? .05 : .95), yc = yb + wh/2;
        var parts = [bx(ww + .34, .16, .16, u, yb + wh + .08, .08), bx(.16, wh, .14, u - ww/2 - .08, yc, .07), bx(.16, wh, .14, u + ww/2 + .08, yc, .07)];
        if (!isDoor) parts.push(bx(ww + .44, .1, .26, u, yb - .05, .13), bx(ww + .5, .12, .22, u, yb + wh + .3, .11), bx(.06, wh, .05, u, yc, .03), bx(ww, .06, .05, u, yb + wh*.66, .03));
        var gq = new T.PlaneGeometry(ww, wh); gq.translate(u, yc, .025);
        parts.forEach(function(q){ q.applyMatrix4(mtx); trim.push(q); });
        gq.applyMatrix4(mtx); (isDoor ? doors : glass).push(gq);
      }
    }
  });
  var trimMesh = new T.Mesh(worldUV(mergeG(trim.map(function(g){ return [g]; })), 3.5), M.trim); trimMesh.castShadow = true; trimMesh.receiveShadow = true; grp.add(trimMesh);
  var gmat = new T.MeshStandardMaterial({color: 0x1b2026, roughness: .18, metalness: .55, emissive: 0xffb466, emissiveIntensity: 0}); GLASS_MATS.push({m: gmat, kind: o.kind || 'other'});
  if (glass.length) grp.add(new T.Mesh(mergeG(glass.map(function(g){ return [g]; })), gmat));
  if (doors.length) grp.add(new T.Mesh(mergeG(doors.map(function(g){ return [g]; })), M.door));
  var roof = new T.Group(); roof.position.y = Hh + .2; grp.add(roof);
  var rh = Math.min(w, d)*(o.pitch || .34);
  var rf = new T.Mesh(hipRoof(w + 1.6, d + 1.6, rh, o.gable), o.roofMat || M.tin); rf.castShadow = true; rf.receiveShadow = true; roof.add(rf);
  for (var k = 0; k < (o.chim || 0); k++){ var along = w >= d, t = o.chim > 1 ? k/(o.chim - 1) : .5;
    var chx = along ? lerp(-w*.3, w*.3, t) : (k % 2 ? 1.4 : -1.4), chz = along ? (k % 2 ? 1.4 : -1.4) : lerp(-d*.3, d*.3, t);
    var ch = new T.Mesh(worldUV(mergeG([[bx(1, 2.6, 1, chx, rh*.72 + .6, chz)], [bx(1.3, .22, 1.3, chx, rh*.72 + 1.95, chz)]]), 1.2), M.brick); ch.castShadow = true; roof.add(ch); }
  grp.userData = {body: body, trim: trimMesh, roof: roof, wallMat: wallMat, wall: wallMat.color.clone(), h: Hh, rh: rh, gmat: gmat, r: r};
  return grp;
}
function simpleHouse(r, o){
  o = o || {}; var w = r.x1 - r.x0, d = r.z1 - r.z0, cx = (r.x0 + r.x1)/2, cz = (r.z0 + r.z1)/2, hh = o.h || 3.6, y0 = Math.min(H(r.x0, r.z0), H(r.x1, r.z1), H(cx, cz)) - .15;
  var grp = new T.Group(); grp.position.set(cx, y0, cz); scene.add(grp);
  var b = new T.Mesh(worldUV(bx(w, hh, d, 0, hh/2, 0), o.brick ? 2.5 : 3), o.brick ? M.brick : o.white ? M.plaster(0xcfc6b2) : M.wood); b.castShadow = b.receiveShadow = true; grp.add(b);
  var rf = new T.Mesh(hipRoof(w + 1.2, d + 1.2, Math.min(w, d)*(o.pitch || .5), true), o.roof || M.thatch); rf.position.y = hh; rf.castShadow = true; grp.add(rf);
  var gm = new T.MeshStandardMaterial({color: 0x1b2026, emissive: 0xffa850, emissiveIntensity: 0}); GLASS_MATS.push({m: gm, kind: 'house'});
  var along = w >= d, L = along ? w : d, nW = Math.max(1, Math.floor(L/5));
  for (var k = 0; k < nW; k++){ var u = -L/2 + (k + .5)*L/nW; [-1, 1].forEach(function(s){ var q = new T.Mesh(new T.PlaneGeometry(.9, 1.1), gm);
    if (along){ q.position.set(u, hh*.5, s*(d/2 + .03)); q.rotation.y = s > 0 ? 0 : Math.PI; } else { q.position.set(s*(w/2 + .03), hh*.5, u); q.rotation.y = s*Math.PI/2; } grp.add(q); }); }
  return grp;
}
function pedimentGeo(wd, ht, depth){ var sh = new T.Shape(); sh.moveTo(-wd/2, 0); sh.lineTo(wd/2, 0); sh.lineTo(0, ht); sh.lineTo(-wd/2, 0); return new T.ExtrudeGeometry(sh, {depth: depth, bevelEnabled: false}); }

/* палац: два двоповерхові крила й одноповерхова середина */
var WALL = 0xf1e6cd;
var palN = building({r: PAL.N, floors: 2, fh: 4.4, wall: WALL, chim: 4, kind: 'palace', cover: {s: [[0, .5]]}, doors: {e: [.5]}});
var palS = building({r: PAL.S, floors: 2, fh: 4.4, wall: WALL, chim: 4, kind: 'palace', cover: {n: [[.5, 1]]}, doors: {e: [.5]}});
var palM = building({r: PAL.M, floors: 1, fh: 5.6, wall: 0xece0c6, chim: 2, kind: 'palace', axis: 3.6, cover: {n: [[0, 1]], s: [[0, 1]]}, doors: {e: [.5], w: [.5]}, pitch: .32});
var PGRP = [palN, palM, palS], PARTS = [PAL.N, PAL.M, PAL.S];
(function(){ var x = PAL.M.x1, y = palM.position.y, H0 = palM.userData.h, P = [];                 // портик парадного входу
  for (var k = 0; k < 4; k++){ var zc = AXZ - 4.2 + k*2.8, cg = new T.CylinderGeometry(.34, .4, H0 - 1.2, 16); cg.translate(x + 2.6, y + .9 + (H0 - 1.2)/2, zc); P.push([cg]);
    P.push([bx(.95, .25, .95, x + 2.6, y + .95, zc)], [bx(.95, .25, .95, x + 2.6, y + H0 - .3, zc)]); }
  P.push([bx(3.6, .75, 10.6, x + 1.9, y + H0 + .02, AXZ)]);
  for (k = 0; k < 4; k++) P.push([bx(5.8 - k*.55, .22, 11.4 - k*.4, x + 2.2 + (3 - k)*.27, y + .11 + k*.22, AXZ)]);
  var pm = new T.Mesh(worldUV(mergeG(P), 3), M.trim); pm.castShadow = pm.receiveShadow = true; scene.add(pm);
  var pd = new T.Mesh(pedimentGeo(11, 2.6, 3.6), M.trim); pd.rotation.y = Math.PI/2; pd.position.set(x + .1, y + H0 + .38, AXZ); pd.castShadow = true; scene.add(pd);
  var ow = new T.Mesh(new T.CircleGeometry(.6, 24), M.dark); ow.rotation.y = Math.PI/2; ow.position.set(x + 3.72, y + H0 + 1.25, AXZ); scene.add(ow);
  PORTICO.push(pm, pd); })();
(function(){ var x = PAL.M.x0, y = palM.position.y;                                                // чорний вхід
  scene.add(new T.Mesh(mergeG([[bx(1.8, .12, 2.8, x - .9, y + 4.2, BACK_Z)], [bx(.1, 1.2, .1, x - 1.6, y + 3.6, BACK_Z - 1.2)], [bx(.1, 1.2, .1, x - 1.6, y + 3.6, BACK_Z + 1.2)]]), M.iron));
  var st = new T.Mesh(mergeG([[bx(1.6, .25, 2.4, x - .8, y + .12, BACK_Z)], [bx(.9, .25, 2.2, x - .45, y + .37, BACK_Z)]]), M.stone); st.receiveShadow = true; scene.add(st); })();
var OF1 = {x0: -75, x1: -42, z0: 27.4, z1: 40.6}, OF2 = {x0: -54, x1: -42, z0: 11.8, z1: 27.4};
var ofc1 = building({r: OF1, floors: 1, fh: 4.3, wall: 0xeee3ca, chim: 3, kind: 'ofc', doors: {n: [.3]}});
var ofc2 = building({r: OF2, floors: 1, fh: 4.3, wall: 0xeee3ca, chim: 1, kind: 'ofc', cover: {s: [[0, 1]]}, doors: {w: [.5]}});
(function(){ var x = -64.5, z = OF1.z0, y = ofc1.position.y, Hh = ofc1.userData.h;                // ризаліт із фронтоном до подвір'я
  var rz = new T.Mesh(worldUV(bx(8.6, Hh + .2, 1.2, x, y + (Hh + .2)/2, z - .6), 3.5), M.plaster(0xeee3ca)); rz.castShadow = true; scene.add(rz);
  var pd = new T.Mesh(pedimentGeo(9.4, 2.2, 1.6), M.trim); pd.position.set(x, y + Hh + .2, z + .3); pd.rotation.y = Math.PI; pd.castShadow = true; scene.add(pd); })();
var NB = {x0: -63.8, x1: -37.8, z0: -54.6, z1: -43.4};
var nbld = building({r: NB, floors: 1, fh: 4, wall: 0xe4d8bd, chim: 1, kind: 'other', roofMat: M.tile, doors: {s: [.3, .7]}, rust: false});
function R(px0, px1, py0, py1){ var a = W(px0, py0), b = W(px1, py1); return {x0: Math.min(a[0], b[0]), x1: Math.max(a[0], b[0]), z0: Math.min(a[1], b[1]), z1: Math.max(a[1], b[1])}; }
var SMALL = [R(1170, 1285, 685, 740), R(1045, 1072, 1037, 1090), R(1073, 1105, 1060, 1095), R(1230, 1290, 1115, 1165)];
SMALL.forEach(function(r){ building({r: r, floors: 1, fh: 3.6, wall: 0xe3d7bb, chim: 1, roofMat: M.tile, kind: 'other', rust: false}); });
var NORTH = [R(1380, 1460, 850, 900), R(1670, 1780, 860, 935), R(1700, 1780, 995, 1075), R(1795, 2030, 1020, 1085), R(1835, 2065, 815, 910), R(2040, 2100, 690, 835), {x0: 54, x1: 77, z0: -219, z1: -208.5}, {x0: 140, x1: 158, z0: -312, z1: -266}];
var DIST = NORTH[3];
NORTH.forEach(function(r, k){ if (k === 3 || k === 4) simpleHouse(r, {brick: true, h: 6.5, roof: M.tile, pitch: .3}); else simpleHouse(r, {white: k % 2 === 0, h: 3.4}); });
(function(){ var c = cen(DIST), x = c[0] + 4, z = DIST.z0 + 6, y = H(x, z);
  var g = new T.CylinderGeometry(.9, 1.5, 26, 14); g.translate(x, y + 13, z); var m = new T.Mesh(worldUV(g, 1.5), M.brick); m.castShadow = true; scene.add(m);
  var cap = new T.Mesh(new T.CylinderGeometry(1.15, 1.15, .6, 14), M.brick); cap.position.set(x, y + 26.2, z); scene.add(cap); CHIMNEY.set(x, y + 27, z); })();
[R(1220, 1330, 165, 225), R(1250, 1340, 15, 50), R(1160, 1210, 298, 330), R(1230, 1290, 318, 360), R(1060, 1130, 200, 250)].forEach(function(r){ simpleHouse(r, {h: 3.2}); });
var libGroup = new T.Group(); libGroup.position.set(LIB[0], 0, LIB[1]); scene.add(libGroup);

/* мур саду, паркан, брами */
(function(){
  var wallM = M.plaster(0xdcd2bb), P = [];
  function seg(a, b){ var L = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = -Math.atan2(b[1] - a[1], b[0] - a[0]), mx = (a[0] + b[0])/2, mz = (a[1] + b[1])/2, y = H(mx, mz) - .1;
    var g = bx(L, 2.2, .5, 0, 1.1, 0); g.rotateY(ang); g.translate(mx, y, mz); P.push([g]); var g2 = bx(L + .3, .18, .7, 0, 2.25, 0); g2.rotateY(ang); g2.translate(mx, y, mz); P.push([g2]); }
  for (var k = 0; k < GARDEN.length - 1; k++) seg(GARDEN[k], GARDEN[k + 1]);
  var A = GARDEN[GARDEN.length - 1], B = GARDEN[0], gz = -8, gx = lerp(A[0], B[0], (gz - A[1])/(B[1] - A[1]));
  seg(A, [gx, gz - 2.6]); seg([gx, gz + 2.6], B);
  var wm = new T.Mesh(worldUV(mergeG(P), 3), wallM); wm.castShadow = wm.receiveShadow = true; scene.add(wm);
  GATES.garden = [gx, gz];
  var F = [];
  for (var z = PARK.z0; z < PARK.z1; z += 2.6){
    if (Math.abs(z - GATE_Z) < 4.2 || Math.abs(z - BACK_Z) < 1.8) continue;
    var x = roadX(z) + 7.2, y = H(x, z), x2 = roadX(z + 2.6) + 7.2;
    F.push([bx(.18, 2.1, .18, x, y + 1.05, z)]);
    var gg = bx(.08, 1.7, 2.6, 0, 0, 0); gg.rotateY(Math.atan2(x2 - x, 2.6)); gg.translate((x + x2)/2, y + .95, z + 1.3); F.push([gg]);
  }
  var fm = new T.Mesh(worldUV(mergeG(F), 2), M.wood); fm.castShadow = true; scene.add(fm);
  function pillars(z, wdt, tall){ var x = roadX(z) + 7.2, y = H(x, z), Q = [];
    [-1, 1].forEach(function(s){ Q.push([bx(1.1, tall, 1.1, x, y + tall/2, z + s*wdt/2)], [bx(1.35, .3, 1.35, x, y + tall + .15, z + s*wdt/2)], [bx(.7, .5, .7, x, y + tall + .55, z + s*wdt/2)]); });
    var m = new T.Mesh(worldUV(mergeG(Q), 1.5), M.brick); m.castShadow = true; scene.add(m);
    var nb = Math.floor(wdt*3), bars = [];
    for (var k = 0; k < nb; k++){ var zz = z - wdt/2 + .6 + k*(wdt - 1.2)/(nb - 1), open = zz < z ? -1 : 1, t = Math.abs(zz - z)/(wdt/2); bars.push([bx(.05, tall*.78, .05, x + 1.4*t*(1 - t*.2), y + tall*.39, z + (zz - z)*(1 - t*.25))]); }
    bars.push([bx(.05, .06, wdt - 1.2, x + .5, y + tall*.7, z)]);
    scene.add(new T.Mesh(mergeG(bars), M.iron)); return [x, z]; }
  GATES.main = pillars(GATE_Z, 7.2, 3.4); GATES.back = pillars(BACK_Z, 2.6, 2.4);
})();

/* ═════════════ мости ═════════════ */
var BRIDGES = {};
function bridge(a, b, w, ya, yb, o){
  o = o || {}; var dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ux = dx/L, uz = dz/L, ang = -Math.atan2(dz, dx), Q = [], Pl = [];
  function put(g, t, off, y){ g.rotateY(ang); g.translate(a[0] + ux*L*t - uz*off, y, a[1] + uz*L*t + ux*off); return g; }
  function yAt(t){ var m = o.arch ? o.arch*Math.sin(Math.PI*t) : 0; return lerp(ya, yb, t) + m; }
  var n = Math.ceil(L/1.2);
  for (var k = 0; k < n; k++){ var t = (k + .5)/n; Pl.push([put(bx(L/n - .06, .14, w, 0, 0, 0), t, 0, yAt(t))]); }          // настил із дощок
  [-1, 1].forEach(function(sd){
    for (var k = 0; k < n; k++){ var t = (k + .5)/n; Q.push([put(bx(L/n + .02, .3, .22, 0, 0, 0), t, sd*(w/2 - .1), yAt(t) - .22)]); }   // прогони
    var np = Math.max(2, Math.round(L/2.2));
    for (k = 0; k <= np; k++){ var t2 = k/np, y = yAt(t2); Q.push([put(bx(.14, 1.05, .14, 0, 0, 0), t2, sd*(w/2 + .02), y + .55)]);
      if (k < np){ var t3 = (k + .5)/np, y3 = yAt(t3); Q.push([put(bx(L/np + .05, .1, .1, 0, 0, 0), t3, sd*(w/2 + .02), y3 + 1.05)], [put(bx(L/np, .07, .07, 0, 0, 0), t3, sd*(w/2 + .02), y3 + .55)]); } }
  });
  var ns = Math.max(1, Math.round(L/(o.span || 4.5)));                                                                  // палі й насадки
  for (var k = 0; k <= ns; k++){ var t = k/ns, cx = a[0] + dx*t, cz = a[1] + dz*t, y = yAt(t) - .37, g0 = Math.min(H(cx, cz), o.water != null ? o.water - .4 : 1e9) - .5;
    if (y - g0 < .25) continue;
    Q.push([put(bx(.32, .26, w + .8, 0, 0, 0), t, 0, y)]);
    [-1, 1].forEach(function(sd){ var gy = Math.min(H(cx - uz*sd*w*.42, cz + ux*sd*w*.42), g0 + .5) - .5, hh = y - gy; Q.push([put(new T.CylinderGeometry(.16, .19, hh, 7).translate(0, 0, 0), t, sd*w*.42, gy + hh/2)]); });
    if (y - g0 > 2.2){ var hh2 = y - g0 - .4, br = new T.BoxGeometry(.1, Math.hypot(hh2, w*.84), .1); br.rotateX(Math.atan2(w*.84, hh2)); Q.push([put(br, t, 0, g0 + .4 + hh2/2)]); }
  }
  var m1 = new T.Mesh(worldUV(mergeG(Pl), 1.6), M.wood), m2 = new T.Mesh(worldUV(mergeG(Q), 1.6), new T.MeshStandardMaterial({color: 0x6e5d48, map: M.wood.map, roughness: .95}));
  m1.castShadow = m1.receiveShadow = m2.castShadow = m2.receiveShadow = true; scene.add(m1, m2);
  return {a: a, b: b, w: w, L: L, ux: ux, uz: uz, yAt: yAt, at: function(t){ return new T.Vector3(a[0] + dx*t, yAt(t) + .1, a[1] + dz*t); }};
}
(function(){
  var za = BRIDGE.z0, zb = BRIDGE.z1;                                                                                    // міст через перешийок між ставами
  BRIDGES.north = bridge([BRIDGE.x, za], [BRIDGE.x, zb], 3.6, H(BRIDGE.x, za) + .3, H(BRIDGE.x, zb) + .3, {arch: .7, span: 3.6, water: WL});
  var z0 = -194, z1 = -217, a = [roadX(z0), z0], b = [roadX(z1), z1];                                                    // міст на шляху
  BRIDGES.road = bridge(a, b, 6.2, H(a[0], a[1]) + .25, H(b[0], b[1]) + .25, {arch: .45, span: 3.6, water: WL});
})();
function deckY(x, z){ var best = -1e9; for (var k in BRIDGES){ var B = BRIDGES[k], rx = x - B.a[0], rz = z - B.a[1], t = (rx*B.ux + rz*B.uz)/B.L, off = Math.abs(-rx*B.uz + rz*B.ux);
  if (t > -.01 && t < 1.01 && off < B.w/2 + .4) best = Math.max(best, B.yAt(Math.max(0, Math.min(1, t))) + .07); } return best; }
function gY(x, z){ return Math.max(H(x, z), deckY(x, z)); }

/* ═════════════ дерева: листопад ═════════════ */
function branchTree(seed, o){
  var rr = rngF(seed), parts = [];
  function br(p0, dir, len, rad, depth){
    var p1 = p0.clone().addScaledVector(dir, len);
    var g = new T.CylinderGeometry(rad*.68, rad, len, depth > 2 ? 6 : 4, 1, true); g.translate(0, len/2, 0);
    g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dir)); g.translate(p0.x, p0.y, p0.z); parts.push([g, depth > 2 ? (o.bark || 0x3d342c) : (o.bark2 || 0x4a4038)]);
    if (depth === 0){ if (rr() < o.tuft){ var t = new T.IcosahedronGeometry(o.tuftR*(.6 + rr()*.6), 0); t.translate(p1.x, p1.y, p1.z); parts.push([t, o.tuftC]); } return; }
    var nch = depth > 2 ? o.ch0 : 3;
    for (var k = 0; k < nch; k++){
      var a = rr()*6.283, sp = o.spread*(.6 + rr()*.6);
      var nd = new T.Vector3(Math.cos(a)*Math.sin(sp), Math.cos(sp), Math.sin(a)*Math.sin(sp)); nd.lerp(dir, o.up).normalize();
      br(p1.clone().addScaledVector(dir, -len*rr()*.25), nd, len*(o.decay + rr()*.12), rad*.62, depth - 1);
    }
  }
  br(new T.Vector3(0, 0, 0), new T.Vector3(0, 1, 0), o.trunk, o.rad, o.depth);
  return mergeG(parts, true);
}
function cyl(r0, r1, h, y, seg){ var g = new T.CylinderGeometry(r1, r0, h, seg || 6); g.translate(0, y + h/2, 0); return g; }
var TG = {
  oak: branchTree(3, {trunk: 3.6, rad: .42, depth: LOW ? 3 : 4, ch0: 3, spread: .9, up: .25, decay: .68, tuft: .6, tuftR: .95, tuftC: 0x5e4a2e}),
  lime: branchTree(7, {trunk: 4.2, rad: .36, depth: LOW ? 3 : 4, ch0: 3, spread: .65, up: .4, decay: .7, tuft: .45, tuftR: .75, tuftC: 0x3f3a30}),
  birch: branchTree(11, {trunk: 5, rad: .22, depth: LOW ? 3 : 4, ch0: 2, spread: .5, up: .5, decay: .72, tuft: .35, tuftR: .5, tuftC: 0x5a5236}),
  poplar: branchTree(17, {trunk: 3, rad: .34, depth: LOW ? 3 : 4, ch0: 3, spread: .22, up: .75, decay: .8, tuft: .5, tuftR: .55, tuftC: 0x3d3a30}),
  spruce: mergeG([[cyl(.3, .16, 3, 0), 0x3a2e24]].concat([0, 1, 2, 3, 4, 5].map(function(k){ var g = new T.ConeGeometry(3 - k*.42, 3.1, 9); g.translate(0, 2.6 + k*1.55, 0); return [g, k % 2 ? 0x1f3320 : 0x22381f]; })), true),
  pine: mergeG([[cyl(.34, .2, 9, 0), 0x6a4a32], [(function(){ var g = new T.IcosahedronGeometry(2.4, 1); g.scale(1.3, .6, 1.3); g.translate(0, 10, 0); return g; })(), 0x2a3d24], [(function(){ var g = new T.IcosahedronGeometry(1.7, 1); g.scale(1.2, .6, 1.2); g.translate(1.4, 9, .6); return g; })(), 0x263a22]], true),
  willow: (function(){                                                    // вербa-«голова»: товстий стовбур і пучок голих прутів
    var rr = rngF(41), P = [[cyl(.55, .42, 2.3, 0), 0x4a3c2c]], hd = new T.IcosahedronGeometry(.75, 1); hd.scale(1.2, .8, 1.2); hd.translate(0, 2.5, 0); P.push([hd, 0x3d3226]);
    for (var k = 0; k < (LOW ? 18 : 30); k++){ var a = rr()*6.283, sp = .15 + rr()*.55, len = 2.2 + rr()*2.2, d = new T.Vector3(Math.cos(a)*Math.sin(sp), Math.cos(sp), Math.sin(a)*Math.sin(sp));
      var g = new T.CylinderGeometry(.025, .06, len, 3, 1, true); g.translate(0, len/2, 0); g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), d)); g.translate(Math.cos(a)*.5, 2.6, Math.sin(a)*.5);
      P.push([g, rr() < .5 ? 0x6e5432 : 0x5a4630]);
      if (rr() < .16){ var t = new T.IcosahedronGeometry(.28 + rr()*.22, 0); t.translate(Math.cos(a)*.5 + d.x*len*.85, 2.6 + d.y*len*.85, Math.sin(a)*.5 + d.z*len*.85); P.push([t, rr() < .5 ? 0x6a6338 : 0x55562f]); } }
    return mergeG(P, true); })(),
  chestnut: branchTree(43, {trunk: 3.2, rad: .5, depth: LOW ? 3 : 4, ch0: 4, spread: 1.05, up: .22, decay: .66, tuft: .75, tuftR: .9, tuftC: 0x6a4626}),
  ash: branchTree(47, {trunk: 5.2, rad: .4, depth: LOW ? 3 : 4, ch0: 3, spread: .6, up: .45, decay: .7, tuft: .2, tuftR: .5, tuftC: 0x4e4a34}),
  wpoplar: branchTree(53, {trunk: 5.5, rad: .62, depth: LOW ? 3 : 4, ch0: 3, spread: .75, up: .35, decay: .74, tuft: .28, tuftR: .7, tuftC: 0x625d4a, bark: 0x7f7c72, bark2: 0x6a675e}),
  shrub: (function(){ var rr = rngF(61), P = [];                                     // голий кущ: віяло прутів і кілька сухих жмутів листя
    for (var k = 0; k < (LOW ? 12 : 20); k++){ var a = rr()*6.283, sp = .25 + rr()*.7, len = .9 + rr()*1.3, d = new T.Vector3(Math.cos(a)*Math.sin(sp), Math.cos(sp), Math.sin(a)*Math.sin(sp));
      var g = new T.CylinderGeometry(.015, .04, len, 3, 1, true); g.translate(0, len/2, 0); g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), d)); g.translate((rr() - .5)*.4, 0, (rr() - .5)*.4); P.push([g, rr() < .5 ? 0x4a3828 : 0x5a4630]);
      if (rr() < .25){ var t = new T.IcosahedronGeometry(.18 + rr()*.15, 0); t.translate(d.x*len*.8, d.y*len*.8, d.z*len*.8); P.push([t, rr() < .5 ? 0x6a5230 : 0x55502e]); } }
    return mergeG(P, true); })(),
  wbig: branchTree(31, {trunk: 3, rad: .58, depth: LOW ? 3 : 4, ch0: 4, spread: 1, up: .15, decay: .72, tuft: .55, tuftR: .7, tuftC: 0x5c5a35}),
  fruit: branchTree(23, {trunk: 1.4, rad: .16, depth: LOW ? 2 : 3, ch0: 3, spread: 1, up: .2, decay: .7, tuft: .25, tuftR: .35, tuftC: 0x4e4436})
};
var TREES = {}; Object.keys(TG).forEach(function(k){ TREES[k] = []; });
var CAMCLR = [[[-36, 7, -6], [-92, 7, -33]], [[-26, 34, 24], [-90, 6, -31]], [[-46, 20, 36], [-92, 8, -12]], [[-12, 20, 40], [-50, 2, 14]], [[-108, 24, 52], [-142, 1, 0]], [[-46, 22, -4], [-94, 9, -31]],
  [[-44, 16, -2], [-86, 6, -36]], [[-110, 13, -84], [-142, 2, -28]], [[-112, 26, 40], [-145, 1, -10]]].map(function(c){ var p = c[0], t = c[1], m = [t[0] + (p[0] - t[0])*1.4, t[2] + (p[2] - t[2])*1.4]; return [m, [lerp(p[0], t[0], .3), lerp(p[2], t[2], .3)]]; });
function blocked(x, z, r){
  for (var ci = 0; ci < CAMCLR.length; ci++) if (segDist(x, z, CAMCLR[ci][0], CAMCLR[ci][1]) < 9) return true;
  r = r || 4; var boxes = [PAL.S, PAL.M, PAL.N, OF1, OF2, NB].concat(SMALL, NORTH);
  for (var k = 0; k < boxes.length; k++){ var b = boxes[k]; if (x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r) return true; }
  if (Math.hypot(x - LIB[0], z - LIB[1]) < 24) return true;
  if (polyDist(x, z, ROAD) < 8 || polyDist(x, z, DRIVE) < 5 || polyDist(x, z, LANE) < 4.5 || polyDist(x, z, BACKPATH) < 3) return true;
  if (x > -94 && x < -34 && z > -52 && z < 10) return true;
  if (Math.hypot(x - LAWN[0], z - LAWN[1]) < 17) return true;
  if (polyDist(x, z, NPATH) < 3.5 || polyDist(x, z, NPATH2) < 3.5) return true;
  return false;
}
function addT(k, x, z, s){ TREES[k].push([x, H(x, z), z, s, rnd()*6.283, (rnd() - .5)*.12]); }
var rt = rngF(21);
/* пейзажний парк: гаї з однієї-двох порід, галявини, поодинокі велетні на галявинах, кущі на узліссях */
var GROVE = ['lime', 'oak', 'chestnut', 'ash', 'wpoplar', 'spruce', 'lime', 'oak', 'birch', 'spruce'];
function inParkArea(x, z){ return z > PARK.z0 && z < PARK.z1 && x > roadX(z) + 9 && x < edgeX(z) + 3; }
var STEP = LOW ? 7.5 : 5.6;
for (var px = -125; px < 110; px += STEP) for (var pz = PARK.z0; pz < PARK.z1; pz += STEP){
  var tx = px + (rt() - .5)*STEP*.9, tz = pz + (rt() - .5)*STEP*.9;
  if (!inParkArea(tx, tz) && !inPoly(tx, tz, GARDEN)) continue;
  if (blocked(tx, tz) || pathDist(tx, tz) < 3.2 || polyDist(tx, tz, GARDEN.concat([GARDEN[0]])) < 2.5) continue;
  if (tz > 38 && tz < 66 && tx > -16 && tx < 64) continue;                                  // галявина з гарматами
  var dd = PARKD(tx, tz), pr = ss(.37, .53, dd);
  if (rt() < pr*.92){ var gk = GROVE[(hash(Math.floor(tx/28), Math.floor(tz/28))*GROVE.length)|0], sp = rt() < .72 ? gk : GROVE[(rt()*GROVE.length)|0];
    addT(sp, tx, tz, (sp === 'spruce' ? 1.05 : .9) + rt()*.5); }
  else if (dd > .35 && dd < .39 && rt() < .3) addT('shrub', tx, tz, .9 + rt()*.5);
}
for (i = 0; i < 400 && i >= 0; i++){                                                     // поодинокі старі дерева на галявинах
  var sx = -120 + rt()*230, sz = PARK.z0 + rt()*(PARK.z1 - PARK.z0);
  if ((!inParkArea(sx, sz) && !inPoly(sx, sz, GARDEN)) || PARKD(sx, sz) > .4 || blocked(sx, sz, 6) || pathDist(sx, sz) < 6) continue;
  if (TREES.oak.length + TREES.lime.length > 4000) break;
  if (rt() < .1){ var kk = rt(); addT(kk < .35 ? 'oak' : kk < .6 ? 'lime' : kk < .8 ? 'chestnut' : 'wpoplar', sx, sz, 1.35 + rt()*.35); }
}
[[-112, -62], [-113, -4], [-74, -64], [-84, 9], [-40, -34], [-34, 6], [-62, -62]].forEach(function(p){ for (var ci = 0; ci < CAMCLR.length; ci++) if (segDist(p[0], p[1], CAMCLR[ci][0], CAMCLR[ci][1]) < 9) return; addT('poplar', p[0], p[1], 1.5 + rt()*.25); });   // пірамідальні тополі, як в Орди
for (var zz = PARK.z0 - 60; zz < PARK.z1 + 160; zz += 10){ var rx2 = roadX(zz); [-1, 1].forEach(function(sd){ if (rt() < .85) addT('poplar', rx2 + sd*(5.5 + rt()*.8), zz + rt()*2, 1 + rt()*.25); }); }
for (var ax = roadX(GATE_Z) + 12; ax < -84; ax += 7){ addT('lime', ax, GATE_Z - 5.5, 1.05); addT('lime', ax, GATE_Z + 5.5, 1.05); }
for (i = 0; i < 80; i++){ var sz2 = -130 + rt()*250, sx2 = edgeX(sz2) + (rt() - .3)*14; if (!blocked(sx2, sz2)) addT(rt() < .4 ? 'spruce' : 'oak', sx2, sz2, .8 + rt()*.5); }
for (i = 0; i < 70; i++){ var wz = GZ0 + rt()*(GZ1 - GZ0), wx = riverX(wz) + (rt() < .5 ? -1 : 1)*(30 + rt()*6); addT('willow', wx, wz, .8 + rt()*.5); }
for (i = 0; i < (LOW ? 150 : 260); i++){ var nw = nearWater(rt, 3, 13); if (!nw) continue; var wx2 = nw[0], wz2 = nw[1];
  if (wx2 < GX0 || wx2 > GX1 || polyDist(wx2, wz2, ROAD) < 9 || Math.abs(wx2 - BRIDGE.x) < 7 && wz2 < BRIDGE.z0 + 6 && wz2 > BRIDGE.z1 - 6 || blocked(wx2, wz2, 2) || inPoly(wx2, wz2, GARDEN)) continue;
  var wr = rt(); addT(wr < .55 ? 'willow' : wr < .85 ? 'wbig' : 'birch', wx2, wz2, .75 + rt()*.5); }
for (i = 0; i < 9; i++){ var ic = ISLAND[(rt()*ISLAND.length)|0], ix = lerp(ic[0], -38, .45 + rt()*.4), iz = lerp(ic[1], -203, .45 + rt()*.4); if (dWater(ix, iz) > 1.5) addT(rt() < .6 ? 'willow' : 'wbig', ix, iz, .8 + rt()*.4); }
for (i = 0; i < (LOW ? 280 : 520); i++){ var fa = rt()*6.283, fr = 480 + rt()*320, fx2 = 10 + Math.cos(fa)*fr*1.1, fz2 = -20 + Math.sin(fa)*fr; if (fx2 > 230 && Math.abs(fz2) < 340) continue; (TREES[rt() < .55 ? 'spruce' : 'pine']).push([fx2, -3.8, fz2, 2.2 + rt()*1.6, rt()*6.283, 0]); }
var treeMat = new T.MeshStandardMaterial({vertexColors: true, roughness: .95, flatShading: true});
var dummy = new T.Object3D();
Object.keys(TREES).forEach(function(k){
  var L = TREES[k]; if (!L.length) return;
  var im = new T.InstancedMesh(TG[k], treeMat, L.length); im.castShadow = true;
  L.forEach(function(q, j){ dummy.position.set(q[0], q[1] - .1, q[2]); dummy.rotation.set(q[5], q[4], q[5]*.7); dummy.scale.setScalar(q[3]); dummy.updateMatrix(); im.setMatrixAt(j, dummy.matrix);
    var v = .8 + hash(q[0], q[2])*.4; im.setColorAt(j, new T.Color(v, v, v)); });
  scene.add(im);
});
(function(){                                                                        // жердяна огорожа довкола газону (Орда, 1870) і лавки в парку
  var F = [], n = 34, R = 10.2;
  for (var k = 0; k < n; k++){ var a0 = k/n*6.283, a1 = (k + 1)/n*6.283, x0 = LAWN[0] + Math.cos(a0)*R, z0 = LAWN[1] + Math.sin(a0)*R, x1 = LAWN[0] + Math.cos(a1)*R, z1 = LAWN[1] + Math.sin(a1)*R, y = H(x0, z0);
    if (Math.abs(Math.sin(a0)) < .12 && Math.cos(a0) < 0) continue;
    F.push([bx(.12, .9, .12, x0, y + .45, z0)]); var L = Math.hypot(x1 - x0, z1 - z0);
    [.42, .78].forEach(function(hh){ var g = bx(L, .06, .06, 0, 0, 0); g.rotateY(-Math.atan2(z1 - z0, x1 - x0)); g.translate((x0 + x1)/2, y + hh, (z0 + z1)/2); F.push([g]); }); }
  var fm = new T.Mesh(worldUV(mergeG(F), 2), M.wood); fm.castShadow = true; scene.add(fm);
  var B = [], br = rngF(77), placed = 0;
  for (var t = 0; t < 400 && placed < 12; t++){ var P = PATHS[(br()*PATHS.length)|0], s0 = (br()*(P.length - 1))|0, a = P[s0], b = P[s0 + 1], L2 = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1])/L2, nz = (b[0] - a[0])/L2;
    var x = a[0] + nx*2.6, z = a[1] + nz*2.6; if (blocked(x, z, 1)) continue; var ang = -Math.atan2(b[1] - a[1], b[0] - a[0]), y = H(x, z);
    [[bx(1.8, .07, .45, 0, .46, 0)], [bx(1.8, .4, .06, 0, .78, .22)], [bx(.08, .46, .4, -.8, .23, 0)], [bx(.08, .46, .4, .8, .23, 0)]].forEach(function(q){ q[0].rotateY(ang); q[0].translate(x, y, z); B.push(q); }); placed++; }
  if (B.length){ var bm = new T.Mesh(worldUV(mergeG(B), 1), M.wood); bm.castShadow = true; scene.add(bm); }
})();
(function(){ var m = new T.Mesh(TG.spruce, treeMat); m.scale.setScalar(1.5); m.position.set(LAWN[0], H(LAWN[0], LAWN[1]), LAWN[1]); m.castShadow = true; scene.add(m); })();

/* дрібниці */
(function(){
  var hay = new T.MeshStandardMaterial({color: 0x8a7448, map: thatchTex, roughness: 1});
  [[-230, 160], [-250, 120], [-215, 60], [-190, 230], [-60, 150], [-20, 175], [10, 140], [-280, -40], [-240, -100], [-10, -230], [100, -290]].forEach(function(p){
    var y = H(p[0], p[1]), g = new T.Mesh(new T.ConeGeometry(2.4, 4.2, 10), hay); g.position.set(p[0], y + 2.6, p[1]); g.castShadow = true; scene.add(g);
    var b = new T.Mesh(new T.CylinderGeometry(2.4, 2.5, 1.2, 10), hay); b.position.set(p[0], y + .5, p[1]); scene.add(b); });
  function well(x, z){ var y = H(x, z); var m = new T.Mesh(worldUV(mergeG([[bx(1.4, .9, 1.4, x, y + .45, z)], [bx(.25, 5.5, .25, x + 2.6, y + 2.75, z)]]), 2), M.wood); m.castShadow = true; scene.add(m);
    var pole = new T.Mesh(new T.CylinderGeometry(.08, .12, 9, 5), M.wood); pole.position.set(x + 1, y + 6.2, z); pole.rotation.z = -1.05; pole.castShadow = true; scene.add(pole); }
  well(-44, 50); well(30, -262); well(-8, -300);
  var logs = []; for (var k = 0; k < 9; k++){ var g = new T.CylinderGeometry(.22, .22, 3.2, 7); g.rotateX(Math.PI/2); g.translate(-38 + (k % 4)*.46 + (k > 3 ? .23 : 0) + (k > 6 ? .23 : 0), H(-38, 47) + .22 + Math.floor(k/4)*.4, 47); logs.push([g]); }
  var lm = new T.Mesh(mergeG(logs), M.wood); lm.castShadow = true; scene.add(lm);
})();

/* німецька артилерія з боку саду */
var GUNS = [[-6, 50], [18, 52], [42, 50]];
(function(){
  var dark = new T.MeshStandardMaterial({color: 0x3c4236, roughness: .7, metalness: .3});
  GUNS.forEach(function(p){
    var g = new T.Group();
    var br = new T.Mesh(new T.CylinderGeometry(.14, .2, 3.2, 10), dark); br.rotation.x = Math.PI/2 - .25; br.position.set(0, 1.25, -1.1); g.add(br);
    var sh = new T.Mesh(new T.BoxGeometry(1.8, 1.1, .12), dark); sh.position.set(0, 1.1, -.2); g.add(sh);
    [-.85, .85].forEach(function(sx){ var wh = new T.Mesh(new T.TorusGeometry(.62, .08, 6, 16), M.wood); wh.rotation.y = Math.PI/2; wh.position.set(sx, .65, 0); g.add(wh); });
    var tl = new T.Mesh(new T.BoxGeometry(.25, .2, 3), M.wood); tl.position.set(0, .35, 1.4); tl.rotation.x = -.12; g.add(tl);
    g.traverse(function(o){ if (o.isMesh) o.castShadow = true; });
    g.position.set(p[0], H(p[0], p[1]), p[1]); g.rotation.y = Math.PI; scene.add(g);
  });
  var tent = new T.Mesh(hipRoof(4, 5, 2.4, true), new T.MeshStandardMaterial({color: 0x585c48, roughness: 1, side: T.DoubleSide})); tent.position.set(56, H(56, 60), 60); tent.castShadow = true; scene.add(tent);
})();
var campfire = new T.PointLight(0xff8a3a, 0, 36, 2); campfire.position.set(30, H(30, 58) + 1.5, 58); scene.add(campfire);

/* ═════════════ хроніка ═════════════ */
var cN = cen(PAL.N), cM = cen(PAL.M), cS = cen(PAL.S), DUB = [-235, 400];
var STEPS = [
 {t: 13.2, cam: [[150, 92, 168], [-42, 0, -16]], time: 'листопад 1918', day: 'маєток Плятерів', h: 'Воробин перед повстанням',
  p: 'Маєток стоїть у старому парку між шляхом на Дубровицю і схилом над лугами Горині. Палацу як такого Плятери не збудували: жили в офіцинах. Найбільша — двоповерхова будівля біля шляху з двома крилами й одноповерховою серединою. Парадний вхід із портиком веде з двору, чорний — із боку шляху. На подвір\'ї газон з ялиною, довкола — пейзажний парк із доріжками, гаями й галявинами, частина його за муром, і павільйон «Бібліотека» над схилом. На північ, за ставами, куди веде міст через перешийок, — житлові будинки й, імовірно, спиртовий завод. Натисніть на будь-яку будівлю, щоб дізнатися про неї більше.',
  s: 'Розташування — за аерофотознімками; будівлі — за історією резиденції, малюнком Н. Орди (1870) і описом Ліпінського (1922). Брами й входи — умовно.'},
 {t: 21, cam: [[-36, 7, -6], [-92, 7, -33]], time: '21:00', day: '21 листопада, четвер', h: 'Вечір перед нападом',
  p: 'У палаці брати Ігнацій та Антоній Плятери, повірений Пшедзимирський і службовці. Маєток стереже найнята варта — шістнадцять чоловік під командою Кальтенберга з Рівного, з кулеметом. Біля саду стоїть німецька артилерія, її пости тримають варту з цього боку. А в Дубровиці о 10-й вечора повстанці захоплюють державну варту.',
  s: 'Ліпінський, 6.IX.1922, арк. 395; Буйновський, Латта, 1920; Ф. Пирішко, «Червоний прапор», 1958'},
 {t: 22, cam: [[-104, 58, 205], [-140, 0, 60]], time: '22:00', day: '21 листопада', h: 'Облога',
  p: 'З темряви виходять натовпи селян із навколишніх сіл, з карабінами, револьверами й гранатами, зі смолоскипами. За схемою 1927 року загін № 1 іде шляхом з Дубровиці, № 2 і № 3 обходять маєток з флангів, а № 4 стоїть на півночі й чекає сигналу ракетою. Варта сурмить тривогу й займає позиції.',
  s: 'Обвинувальний акт, арк. 3; Ліпінський, арк. 395 зв.; «Красная звезда», 1927. Інші свідки називають 23:00, північ або 1–2-гу ночі.'},
 {t: 22.33, cam: [[-26, 34, 24], [-90, 6, -31]], time: '≈ 22:20', day: '21 листопада', h: 'Перші двадцять хвилин',
  p: 'Злітає ракета, і загін з півночі теж іде в атаку. Селяни відразу стріляють і кидають гранати. На подвір\'ї падає вартовий Піскунов, поранений в обидві ноги; поранено й ветеринара Росіна. Кулемет оборонців заклинює. Німецькі пости з боку саду пропускають селян крізь свої ряди. За двадцять хвилин оборонці відступають до палацу й заносять туди поранених.',
  s: 'Ліпінський, арк. 395 зв.; Латта й Галушкевич, 1920: кулемет зіпсувався на початку бою'},
 {t: 23.7, cam: [[-46, 20, 36], [-92, 8, -12]], time: 'до 24:00', day: 'ніч на 22 листопада', h: 'Оборона в правому крилі',
  p: '«Двадцять з чимось людей» обороняються в правому крилі, від дороги. Будинок має два двоповерхові крила й одноповерхову середину. Кілька гранат влітає всередину, на щастя, до порожньої зали. Ще до півночі куля влучає в ногу самому Ліпінському.',
  s: 'Ліпінський, арк. 395 зв.–396. «Праве від дороги» — якщо дивитися зі шляху на схід, тобто південне.'},
 {t: 24, cam: [[-12, 20, 40], [-50, 2, 14]], time: '00:00', day: '22 листопада, п\'ятниця', h: 'Опівночі у дворі',
  p: 'Гурти нападників обшукують помешкання службовців і шукають вартових. До садівника Галушкевича вдираються п\'ятнадцятеро з криком «Де гайдамаки?!». Радванського, якого взяли за вартового, відпускає чоловік з червоною кокардою — Михайло Конончук. Сибіковського хочуть розстріляти як «гайдамаку», поки за нього не заступається Петро Кустов.',
  s: 'Радванський і Галушкевич, 1920, арк. 569, 580; Сибіковський, 1922, арк. 398'},
 {t: 28, cam: [[-108, 24, 52], [-142, 1, 0]], time: '00:00–11:00', day: '22 листопада', h: 'Поранених везуть до Дубровиці',
  p: 'Поранених селян по одному чи по двоє везуть до лікарні в Дубровиці на підводі, яку повстанці заздалегідь виділили для цього. У книзі хворих їх запишуть 22 листопада; серед них Теодор Пирішко, Іван Дем\'янець і Онуфрій Харківець. Облога триває всю ніч.',
  s: 'Фельдшери Пальонка й Калінський, 1920 і 1922; книга хворих'},
 {t: 34.5, cam: [[-46, 22, -4], [-94, 9, -31]], time: '≈ 10:30', day: '22 листопада', h: 'Підпал',
  p: 'Селяни підпалюють будинок, і він горить зсередини. Середина вже в огні, тож оборонці через горище переходять із правого крила в ліве. У Дубровиці озброєний чоловік вимагає в аптеці два пуди бензину, «щоби підпалити палац Плятерів».',
  s: 'Ліпінський, арк. 396; Більчинська, 1920, арк. 566 зв.–567 (вона датує це 23 листопада)'},
 {t: 37, cam: [[-310, 80, 40], [-165, 0, -22]], time: 'удень', day: '22 листопада', h: 'Підмога із сіл',
  p: 'До Острівців прискакує вершник: «Воробин оточений!». Лук\'ян і Хома Гончарі беруть карабіни й біжать до маєтку. З Мочулища приходить загін із сорока чоловік на чолі з Ісааком Петрушком і веде з собою управителя Мольського. Палац горить.',
  s: 'Голяк і Латта, 1920, арк. 571–573; Мольський, 1920 і 1922, арк. 565, 374'},
 {t: 40, cam: [[-44, 16, -2], [-86, 6, -36]], time: '≈ 16:00', day: '22 листопада', h: 'Капітуляція',
  p: 'Набої скінчилися, будинок горить, дах провалюється. Оборонці складають зброю й виходять: селяни пообіцяли, що їх лише заарештують і що буде суд. На них кидаються з багнетами, але один із ватажків зупиняє натовп. Сибіковський чув, як Олександр Конончук поставив долю полонених «на голосування».',
  s: 'Буйновський, 1920, арк. 579 зв.; Ліпінський, арк. 396; Сибіковський, арк. 398'},
 {t: 41, cam: [[-110, 13, -84], [-142, 2, -28]], time: '15:00–17:00', day: '22 листопада', h: 'Розстріл',
  p: 'Полонених виводять на дорогу, шикують у шеренгу й розстрілюють. Повіреного Пшедзимирського вбивають раніше, коли він кидається тікати. Мітлюх казав, що графів відвели вбік на дорогу й розстріляли окремо. Згодом Свириденко бачить 21 тіло, покладене рядком.',
  s: 'Ліпінський, арк. 396–397; Сибіковський, арк. 398; Мітлюх, 1919. Час: близько 15:00 (Мольський, Калінський, Свириденко, Литвинчук) або 17:00 (Ліпінський).'},
 {t: 42.5, cam: [[-112, 26, 40], [-145, 1, -10]], time: '17:00–18:00', day: '22 листопада, вечір', h: 'Після',
  p: 'Поранених Ліпінського й Піскунова три-чотири години б\'ють прикладами. Ліпінського рятує селянин, який просить віддати його під «революційний трибунал»: пораненого кладуть на воза під два трупи. Увечері обох привозять до лікарні в Дубровиці. Литвинчук зустрічає п\'яного Нашору, за яким везуть бочку горілки. Палац догоряє.',
  s: 'Ліпінський, арк. 396 зв.; Литвинчук; фельдшери, 1920'}
];
var N = STEPS.length;
var FIRE = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 1, .35], [.35, 1, 1], [1, 1, 1], [.8, .6, .75], [.5, .35, .45]];   // [північне (ліве), середина, південне (праве)]
var ROOF_GONE = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 1], [1, 1, 1], [1, 1, 1]];
var SHOTS = [0, 0, .5, 1, .55, .35, .3, .65, .5, 0, 0, 0];
var WINDOWS = [.2, 1, .3, .12, .06, .05, .05, 0, 0, 0, 0, 0];
var RAIN = [0, .3, .5, .6, .7, .6, .5, .2, .1, .25, .35, .45];      // мряка (погода умовна)

/* ═════════════ люди ═════════════ */
function Cc(x, z, r, o){ o = o || {}; o.c = [x, z]; o.r = r; return o; }
var POSTS = [[-136, 2], [-136, -31], [-110, -62], [-112, -2], [-80, -31], [-70, -52], [-70, -10], [-60, -22], [-48, -42], [-40, 2], [-30, 26], [-60, 48], [-90, 20], [-22, -30], [-100, -68], [66, 58]];
var IN_N = [cN[0] + 4, cN[1]], IN_S = [cS[0] + 4, cS[1]];
var INNER = [[-80, -30], [-80, -33], [-80, -27], [-82, -36], [-82, -25], [-78, -31]];
var GROUPS = [
  {id: 'def', cls: 'def', col: 0x3c5f9f, n: 22,
   st: [{pts: POSTS.concat(INNER)}, {pts: POSTS.concat(INNER)}, {pts: POSTS.map(function(p){ return [lerp(p[0], -80, .3), lerp(p[1], -31, .3)]; }).concat(INNER)},
        {c: IN_S, r: 2, hide: true}, {c: IN_S, r: 2, hide: true}, {c: IN_S, r: 2, hide: true}, {c: IN_S, r: 2, hide: true}, {c: IN_N, r: 2, hide: true}, {c: IN_N, r: 2, hide: true},
        Cc(-72, -31, 4.2), {line: [-139.5, -54, -144.8, -8], fallAt: 4.2}, {line: [-139.5, -54, -144.8, -8], down: true}],
   lab: ['', 'варта на постах', 'варта займає позиції', 'оборонці в палаці (двадцять з гаком)', 'оборонці в правому крилі', 'оборонці в правому крилі', 'оборонці в правому крилі', 'оборонці перейшли в ліве крило', 'оборонці в лівому крилі', 'полонені', 'полонених вивели на дорогу', '']},
  {id: 'a1', cls: 'att', col: 0xa33a2a, n: 34, spawn: [-262, 470],
   st: [null, null, Cc(-182, 210, 11), Cc(-118, 10, 9), Cc(-96, 12, 9), Cc(-54, 18, 9), Cc(-96, 12, 9), Cc(-96, 12, 9), Cc(-98, 14, 10), Cc(-62, -12, 9), Cc(-158, -30, 6), {hide: true, c: [-255, 450], r: 10}],
   lab: ['', '', 'загін № 1 · шляхом з Дубровиці', 'загін № 1 · крізь браму', 'нападники', 'обшук у дворі', 'нападники', 'нападники', 'нападники', 'нападники', 'нападники', '']},
  {id: 'a3', cls: 'att', col: 0xa33a2a, n: 26, spawn: [-350, 120],
   st: [null, null, Cc(-245, 40, 10), Cc(-124, -42, 8), Cc(-122, -42, 8), Cc(-122, -42, 8), Cc(-122, -42, 8), Cc(-122, -40, 8), Cc(-122, -40, 8), Cc(-70, -48, 7), Cc(-128, -40, 5), {hide: true, c: [-350, 60], r: 8}],
   lab: ['', '', 'загін № 3 · з флангу', 'загін № 3 · за палацом, від шляху', '', '', '', '', '', '', '', '']},
  {id: 'a2', cls: 'att', col: 0xa33a2a, n: 26, spawn: [70, 460],
   st: [null, null, Cc(52, 140, 10), Cc(-30, 22, 9), Cc(-62, -16, 9), Cc(-34, 22, 9), Cc(-62, -18, 9), Cc(-60, -20, 9), Cc(-60, -20, 9), Cc(-52, -31, 8), Cc(-128, -18, 5), {hide: true, c: [70, 450], r: 8}],
   lab: ['', '', 'загін № 2 · з флангу, крізь сад', 'загін № 2 пройшов повз німецькі пости', 'загін № 2 на подвір\'ї', 'обшук службових помешкань', '', '', '', '', '', '']},
  {id: 'a4', cls: 'att', col: 0xa33a2a, n: 20, spawn: [40, -500], via: {3: [[56, -226], [48, -214], [BRIDGE.x, -212.5], [BRIDGE.x, -177], [26, -158]]},
   st: [null, null, Cc(57, -238, 6), Cc(-90, -78, 8), Cc(-90, -74, 8), Cc(-90, -74, 8), Cc(-90, -74, 8), Cc(-90, -72, 8), Cc(-90, -72, 8), Cc(-62, -52, 7), Cc(-126, -60, 4), {hide: true, c: [-80, -490], r: 8}],
   lab: ['', '', 'загін № 4 чекає ракети', 'загін № 4 іде в атаку', '', '', '', '', '', '', '', '']},
  {id: 'ost', cls: 'att', col: 0xa33a2a, n: 10, spawn: [-360, 70],
   st: [null, null, null, null, null, null, null, null, Cc(-205, 44, 5), Cc(-104, 18, 5), Cc(-116, 4, 4), {hide: true, c: [-360, 70], r: 5}],
   lab: ['', '', '', '', '', '', '', '', 'з Острівців · Гончарі', '', '', '']},
  {id: 'moch', cls: 'att', col: 0xa33a2a, n: 18, spawn: [-360, -100],
   st: [null, null, null, null, null, null, null, null, Cc(-212, -90, 6), Cc(-112, -66, 6), Cc(-118, -70, 5), {hide: true, c: [-360, -100], r: 6}],
   lab: ['', '', '', '', '', '', '', '', 'з Мочулища · загін Петрушка', '', '', '']},
  {id: 'ger', cls: 'ger', col: 0x6f7a5e, n: 9,
   st: STEPS.map(function(){ return {pts: [[-14, 44], [12, 44], [36, 44], [58, 44], [-6, 55], [18, 57], [42, 55], [30, 62], [26, 60]]}; }),
   lab: ['', 'німецька артилерія · пости з боку саду', 'німецькі пости', 'пости пропускають селян', '', '', '', '', '', '', '', '']}
];
var PINS = [
  [],
  [[[-80, -24], 'кулемет'], [DUB, 'Дубровиця: повстанці захопили варту ↓']],
  [[[-70, -31], 'варта сурмить тривогу']],
  [[[-64, -24], 'Піскунова й Росіна поранено'], [[-82, -24], 'кулемет заклинило'], [[24, 42], 'пости пропускають селян']],
  [[[cS[0], cS[1]], 'Ліпінського поранено в ногу'], [[cM[0], cM[1]], 'гранати в порожню залу']],
  [[[-40, 26], 'шукають «гайдамаків»']],
  [[DUB, 'до лікарні в Дубровиці ↓']],
  [[[cM[0], cM[1]], 'середина в огні'], [[cN[0], cN[1]], 'через горище — в ліве крило'], [DUB, 'аптека: «два пуди бензину» ↓']],
  [[[-300, 50], 'вершник: «Воробин оточений!»'], [[-232, -96], 'з Мольським під конвоєм']],
  [[[-76, -36], 'складають зброю'], [[-56, -22], '«на голосування»']],
  [[[-141, -62], 'розстріл на дорозі'], [[-120, -76], 'Пшедзимирського вбито при втечі']],
  [[[-142, -32], '21 тіло рядком'], [[-200, 250], 'Нашора з бочкою горілки']]
];
var ROUTES_DEF = [
  {pts: [[-262, 470], [-218, 330], [-172, 150], [-146, 50], [-122, 12]], on: [2, 3], tag: '1'},
  {pts: [[-360, 120], [-285, 62], [-205, 4], [-150, -32], [-130, -42]], on: [2, 3], tag: '3'},
  {pts: [[70, 460], [60, 285], [40, 135], [10, 52], [-26, 24]], on: [2, 3], tag: '2'},
  {pts: [[40, -500], [60, -380], [62, -300], [58, -250]], on: [2], tag: '4'},
  {pts: [[57, -236], [52, -218], [BRIDGE.x, -212], [BRIDGE.x, -195], [BRIDGE.x, -177], [8, -124], [-40, -92], [-84, -84]], on: [3], tag: '4'},
  {pts: [[-360, 70], [-285, 56], [-212, 44]], on: [8]},
  {pts: [[-360, -100], [-292, -95], [-218, -90]], on: [8]},
  {pts: [[-138, -26], [-148, 40], [-178, 200], [-214, 330], [-262, 470]], on: [6, 11], gold: true}
];

/* фігурки: свита/кожух у кольорі сторони, обличчя, шапка, рушниця */
function personGeo(kind){
  var body = [], rest = [];
  var coat = new T.CylinderGeometry(.24, .38, 1.12, 8); coat.translate(0, 1.04, 0); body.push([coat]);
  var sh = new T.SphereGeometry(.27, 8, 6); sh.scale(1.15, .55, .9); sh.translate(0, 1.6, 0); body.push([sh]);
  [-1, 1].forEach(function(s){ var a = new T.CylinderGeometry(.07, .09, .7, 5); a.translate(0, -.35, 0); a.rotateZ(s*.18); a.rotateX(-.25); a.translate(s*.33, 1.58, .02); body.push([a]); });
  [-1, 1].forEach(function(s){ var l = new T.CylinderGeometry(.08, .09, .55, 5); l.translate(s*.11, .27, 0); rest.push([l, 0x2a241d]); });
  var hd = new T.SphereGeometry(.15, 8, 7); hd.translate(0, 1.84, 0); rest.push([hd, 0xd9b796]);
  var hat = kind === 'ger' ? (function(){ var g = new T.SphereGeometry(.19, 8, 5, 0, 6.283, 0, 1.4); g.translate(0, 1.88, 0); return g; })() : kind === 'def' ? cyl(.15, .15, .14, 1.93, 8) : cyl(.17, .14, .2, 1.9, 8);
  rest.push([hat, kind === 'ger' ? 0x4c5446 : kind === 'def' ? 0x232b3c : 0x3a2a1e]);
  var gun = new T.BoxGeometry(.05, 1.15, .07); gun.rotateZ(.25); gun.translate(.28, 1.45, -.16); rest.push([gun, 0x3a2a1c]);
  return {body: mergeG(body), rest: mergeG(rest, true)};
}
var FIG = {def: personGeo('def'), att: personGeo('att'), ger: personGeo('ger')}, FIG_S = 1.45;
var restMat = new T.MeshStandardMaterial({vertexColors: true, roughness: .8});
GROUPS.forEach(function(G){
  var geo = FIG[G.cls];
  G.mesh = new T.InstancedMesh(geo.body, new T.MeshStandardMaterial({color: G.col, roughness: .85, emissive: G.col, emissiveIntensity: 0}), G.n);
  G.rest = new T.InstancedMesh(geo.rest, restMat, G.n);
  [G.mesh, G.rest].forEach(function(m){ m.castShadow = true; m.instanceMatrix.setUsage(T.DynamicDrawUsage); scene.add(m); });
  for (var k = 0; k < G.n; k++) G.mesh.setColorAt(k, new T.Color(1, 1, 1).offsetHSL(0, 0, (hash(k, 3) - .5)*.2));
  G.from = []; G.to = []; G.cur = []; for (k = 0; k < G.n; k++){ G.from.push([0, 0, 0, 0]); G.to.push([0, 0, 0, 0]); G.cur.push([0, 0, 0, 0]); }
  G.ring = new T.Mesh(new T.RingGeometry(.92, 1, 64), new T.MeshBasicMaterial({color: G.col, transparent: true, opacity: 0, depthWrite: false, fog: false})); G.ring.rotation.x = -Math.PI/2; G.ring.renderOrder = 3; scene.add(G.ring);
  G.disc = new T.Mesh(new T.CircleGeometry(1, 48), new T.MeshBasicMaterial({color: G.col, transparent: true, opacity: 0, depthWrite: false, fog: false})); G.disc.rotation.x = -Math.PI/2; G.disc.renderOrder = 2; scene.add(G.disc);
});
function layout(G, k){
  var st = G.st[k], out = [];
  for (var i = 0; i < G.n; i++){
    if (!st){ var sp0 = G.spawn || [0, 0]; out.push([sp0[0], sp0[1], 0, 0]); continue; }
    var x, z;
    if (st.pts){ var p = st.pts[i % st.pts.length]; x = p[0] + (i >= st.pts.length ? 1.4 : 0); z = p[1] + (i >= st.pts.length ? 1.1 : 0); }
    else if (st.line){ var f = G.n > 1 ? i/(G.n - 1) : .5; x = lerp(st.line[0], st.line[2], f); z = lerp(st.line[1], st.line[3], f); }
    else { var a = i*2.39996, rr = st.r*Math.sqrt((i + .5)/G.n); x = st.c[0] + Math.cos(a)*rr; z = st.c[1] + Math.sin(a)*rr; }
    out.push([x, z, st.hide ? 0 : 1, st.down ? 1 : 0]);
  }
  return out;
}

/* маршрути: світлі стрічки з «біжучими» шевронами і стрілкою */
var chevTex = (function(){ var c = document.createElement('canvas'); c.width = 64; c.height = 64; var g = c.getContext('2d');
  var gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.25, 'rgba(255,255,255,.22)'); gr.addColorStop(.75, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); g.strokeStyle = '#fff'; g.lineWidth = 8; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(18, 16); g.lineTo(40, 32); g.lineTo(18, 48); g.stroke(); var t = new T.CanvasTexture(c); t.wrapS = T.RepeatWrapping; return t; })();
var ROUTES = ROUTES_DEF.map(function(R0){
  var curve = new T.CatmullRomCurve3(R0.pts.map(function(p){ return new T.Vector3(p[0], 0, p[1]); })), L = curve.getLength(), segs = Math.ceil(L/2.5), pos = [], uv = [], idx = [];
  for (var k = 0; k <= segs; k++){ var tt = k/segs, p = curve.getPointAt(tt), tg = curve.getTangentAt(tt), nx = -tg.z, nz = tg.x, w = 3.6;
    var dk = deckY(p.x, p.z); pos.push(p.x + nx*w, Math.max(dk, H(p.x + nx*w, p.z + nz*w)) + .7, p.z + nz*w, p.x - nx*w, Math.max(dk, H(p.x - nx*w, p.z - nz*w)) + .7, p.z - nz*w); uv.push(tt*L/7.2, 0, tt*L/7.2, 1);
    if (k){ var a = (k - 1)*2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  var t = chevTex.clone(); t.needsUpdate = true;
  var colr = R0.gold ? new T.Color(1.6, 1.25, .6) : new T.Color(1.9, .55, .35);
  var mat = new T.MeshBasicMaterial({map: t, color: colr, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide, fog: false, toneMapped: false});
  var m = new T.Mesh(g, mat); m.renderOrder = 2; scene.add(m);
  var end = curve.getPointAt(1), tg2 = curve.getTangentAt(1), sh = new T.Shape(); sh.moveTo(0, 7); sh.lineTo(-5.5, -2); sh.lineTo(0, 0); sh.lineTo(5.5, -2); sh.lineTo(0, 7);
  var hd = new T.Mesh(new T.ShapeGeometry(sh), new T.MeshBasicMaterial({color: colr, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide, fog: false, toneMapped: false}));
  hd.rotation.x = -Math.PI/2; hd.rotation.z = -Math.atan2(tg2.x, -tg2.z) + Math.PI; hd.rotation.order = 'XYZ'; hd.position.set(end.x, gY(end.x, end.z) + .9, end.z); hd.renderOrder = 2; scene.add(hd);
  var st0 = curve.getPointAt(.12);
  return {m: m, hd: hd, tex: t, on: R0.on, op: 0, tag: R0.tag, tagP: new T.Vector3(st0.x, H(st0.x, st0.z) + 4, st0.z)};
});

/* ═════════════ частинки ═════════════ */
function particles(n, additive, tex, boost, shape){
  var g = new T.BufferGeometry();
  g.setAttribute('position', new T.BufferAttribute(new Float32Array(n*3), 3));
  g.setAttribute('aCol', new T.BufferAttribute(new Float32Array(n*3), 3));
  g.setAttribute('aSize', new T.BufferAttribute(new Float32Array(n), 1));
  g.setAttribute('aA', new T.BufferAttribute(new Float32Array(n), 1));
  var m = new T.ShaderMaterial({transparent: true, depthWrite: false, blending: additive ? T.AdditiveBlending : T.NormalBlending, uniforms: {map: {value: tex}, uScale: {value: 400}, uBoost: {value: boost || 1}, uNear: {value: 0}, uShape: {value: shape || 0}},
    vertexShader: 'attribute vec3 aCol; attribute float aSize, aA; uniform float uScale, uNear; varying vec3 vC; varying float vA; void main(){ vC = aCol; vec4 mv = modelViewMatrix*vec4(position, 1.); vA = aA*smoothstep(uNear*.35, uNear, -mv.z); gl_PointSize = aSize*uScale/-mv.z; gl_Position = projectionMatrix*mv; }',
    fragmentShader: ['uniform sampler2D map; uniform float uBoost, uShape; varying vec3 vC; varying float vA;',
      'void main(){ vec2 p = gl_PointCoord - .5; p.y = -p.y; float a; vec3 c = vC;',
      '  if (uShape > 1.5){ float r = length(p); a = exp(-r*r*70.) + exp(-r*12.)*.22; c *= 1. + exp(-r*r*120.); }',                       // іскра
      '  else if (uShape > .5){ float r = length(vec2(p.x*(1.15 + p.y*1.3), (p.y + .08)*.85)); a = 1. - smoothstep(0., .5, r); a *= a; c *= 1. + (1. - smoothstep(0., .25, r))*1.1; }',   // язик полум'я
      '  else a = texture2D(map, gl_PointCoord).a;',
      '  gl_FragColor = vec4(c*uBoost, a*vA); if (gl_FragColor.a < .01) discard; }'].join('\n')});
  var p = new T.Points(g, m); p.frustumCulled = false; scene.add(p);
  var st = []; for (var k = 0; k < n; k++) st.push({life: 1, max: 1, x: 0, y: -999, z: 0, vx: 0, vy: 0, vz: 0, s0: 1, kind: 0});
  return {g: g, m: m, st: st, n: n, i: 0};
}
var FLAME = particles(LOW ? 800 : 1500, true, DOT, 2.6, 1), EMBER = particles(LOW ? 220 : 420, true, DOT, 5, 2), SMOKE = particles(LOW ? 640 : 1300, false, PUFF, 1), FLASH = particles(140, true, DOT, 6, 2);
var TORCH = particles(240, true, DOT, 3.2, 1), MIST = particles(LOW ? 70 : 130, false, PUFF, 1); MIST.m.uniforms.uNear.value = 140; SMOKE.m.uniforms.uNear.value = 14;
function emit(P, x, y, z, vx, vy, vz, life, size, kind){ var s = P.st[P.i]; P.i = (P.i + 1) % P.n; s.x = x; s.y = y; s.z = z; s.vx = vx; s.vy = vy; s.vz = vz; s.life = 0; s.max = life; s.s0 = size; s.kind = kind || 0; }
var smokeAcc = [0, 0, 0];
var fireLights = [0, 1, 2].map(function(k){ var l = new T.PointLight(0xff7a2a, 0, 90, 1.8), c = cen(PARTS[k]); l.position.set(c[0] + 10, 18, c[1]); scene.add(l); return l; });
var FLAME_GEO = (function(){ var g = new T.ConeGeometry(1, 1, 14, 1, true); g.translate(0, .5, 0); return g; })();
var flameMatO = new T.MeshBasicMaterial({color: new T.Color(2.6, .8, .2), transparent: true, opacity: .2, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false, toneMapped: false});
var flameMatI = new T.MeshBasicMaterial({color: new T.Color(3, 1.7, .5), transparent: true, opacity: .26, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false, toneMapped: false});
var FLAMES = PARTS.map(function(R0){
  var arr = [], n = Math.round((R0.x1 - R0.x0)*(R0.z1 - R0.z0)/24);
  for (var k = 0; k < n; k++){
    var o = new T.Mesh(FLAME_GEO, flameMatO), i2 = new T.Mesh(FLAME_GEO, flameMatI); i2.scale.set(.55, .6, .55); o.add(i2);
    o.position.set(lerp(R0.x0 + 1.5, R0.x1 - 1.5, rnd()), 0, lerp(R0.z0 + 1.5, R0.z1 - 1.5, rnd())); o.visible = false; o.userData = {ph: rnd()*6.283, w: 1.1 + rnd()*1.5, h: 4 + rnd()*5}; scene.add(o); arr.push(o);
  }
  return arr; });
/* трасери */
var TRN = 80, trPos = new Float32Array(TRN*6), trCol = new Float32Array(TRN*6), TR = [];
var trGeo = new T.BufferGeometry(); trGeo.setAttribute('position', new T.BufferAttribute(trPos, 3)); trGeo.setAttribute('color', new T.BufferAttribute(trCol, 3));
var tracers = new T.LineSegments(trGeo, new T.LineBasicMaterial({vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false})); tracers.frustumCulled = false; scene.add(tracers);
for (i = 0; i < TRN; i++) TR.push({on: false});
/* мряка */
var RN = LOW ? 900 : 1800, rnPos = new Float32Array(RN*6), RS = [];
var rnGeo = new T.BufferGeometry(); rnGeo.setAttribute('position', new T.BufferAttribute(rnPos, 3));
var rainLines = new T.LineSegments(rnGeo, new T.LineBasicMaterial({color: 0x9fb0c8, transparent: true, opacity: 0, depthWrite: false})); rainLines.frustumCulled = false; scene.add(rainLines);
for (i = 0; i < RN; i++) RS.push([rnd()*240 - 120, rnd()*70, rnd()*240 - 120]);
/* вибухи гранат */
var BOOMS = [];
for (i = 0; i < 6; i++){ var bm = new T.Mesh(new T.SphereGeometry(1, 16, 10), new T.MeshBasicMaterial({color: new T.Color(4, 1.8, .5), transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false})); scene.add(bm);
  var bl = new T.PointLight(0xffa040, 0, 60, 2); scene.add(bl); BOOMS.push({m: bm, l: bl, t: 9}); }
/* ракета */
var rocket = {t: -1, light: new T.PointLight(0xff5a40, 0, 200, 1.5), head: new T.Mesh(new T.SphereGeometry(.7, 10, 8), new T.MeshBasicMaterial({color: new T.Color(6, 2, 1.5), toneMapped: false}))};
scene.add(rocket.light); scene.add(rocket.head); rocket.head.visible = false;
var torchLights = [0, 1, 2, 3].map(function(){ var l = new T.PointLight(0xff9a40, 0, 40, 2); scene.add(l); return l; });
/* підвода */
var cart = (function(){ var g = new T.Group();
  var bd = new T.Mesh(worldUV(mergeG([[bx(1.6, .5, 3.4, 0, 1, 0)], [bx(.1, .6, 3.4, -.8, 1.4, 0)], [bx(.1, .6, 3.4, .8, 1.4, 0)], [bx(.08, .08, 3, 0, .8, -3.2)]]), 1), M.wood); bd.castShadow = true; g.add(bd);
  [[-.9, 1.1], [.9, 1.1], [-.9, -1.1], [.9, -1.1]].forEach(function(q){ var w = new T.Mesh(new T.TorusGeometry(.5, .07, 6, 14), M.wood); w.rotation.y = Math.PI/2; w.position.set(q[0], .55, q[1]); g.add(w); });
  var hs = mergeG([[(function(){ var b = new T.CylinderGeometry(.42, .42, 1.6, 8); b.rotateX(Math.PI/2); b.translate(0, 1.5, -4.6); return b; })()], [bx(.38, .5, .9, 0, 2, -5.4)]].concat([[-1, -1], [1, -1], [-1, 1], [1, 1]].map(function(q){ return [bx(.14, 1.2, .14, q[0]*.25, .6, -4.6 + q[1]*.6)]; })));
  var horse = new T.Mesh(hs, new T.MeshStandardMaterial({color: 0x3b2a1c, roughness: .8})); horse.castShadow = true; g.add(horse);
  var lamp = new T.PointLight(0xffb060, 0, 26, 2); lamp.position.set(0, 2.4, -1.4); g.add(lamp); g.userData.lamp = lamp;
  var lg = new T.Mesh(new T.SphereGeometry(.14, 8, 6), new T.MeshBasicMaterial({color: new T.Color(4, 2.6, 1.2), toneMapped: false})); lg.position.copy(lamp.position); g.add(lg);
  g.visible = false; scene.add(g); return g; })();
var CART_PATH = new T.CatmullRomCurve3([[-138, -26], [-148, 40], [-178, 200], [-214, 330], [-262, 470]].map(function(p){ return new T.Vector3(p[0], 0, p[1]); }));
for (i = 0; i < MIST.n; i++){ var mr = rnd(), mx, mz;
  if (mr < .7){ var nw = nearWater(rnd, -8, 30) || [0, -190]; mx = nw[0]; mz = nw[1]; }
  else { mz = GZ0 + rnd()*(GZ1 - GZ0); mx = 140 + rnd()*230; } MIST.st[i] = {x: mx, y: H(mx, mz) + .8 + rnd()*1.6, z: mz, ph: rnd()*6.283, s0: 20 + rnd()*22, life: 0, max: 1e9}; }
var PIN_RINGS = [];

/* ═════════════ підписи ═════════════ */
var LBL = document.getElementById('labels');
function mkLabel(text, cls, pr){ var d = document.createElement('div'); d.className = 'lb ' + (cls || ''); d.innerHTML = '<span>' + text + '</span>'; LBL.appendChild(d); d._pr = pr || 0; return d; }
var INFO = {
  palace: {k: 'резиденція Плятерів', h: 'Палац', p: ['Найбільша будівля маєтку, біля самого шляху. Справжнього палацу Плятери так і не збудували, тож жили в офіцинах. Та, що стала резиденцією, була двоповерхова: на першому поверсі три великі салони, їдальня, кабінет і 12 гостьових кімнат, на другому — бібліотечна зала й ще 17 кімнат. Селяни називали її палацом.', 'Вартовий Ліпінський 1922 року описав будинок так: два двоповерхові крила й одноповерхова середина. Тут 21–22 листопада 1918 року двадцять з гаком людей трималися майже вісімнадцять годин.', 'На аерофотознімку — П-подібна руїна біля шляху. Вікна, портик і двері на схемі умовні.'], s: 'Історія резиденції; Ліпінський, 6.IX.1922, арк. 395 зв.–396'},
  portico: {k: 'вхід', h: 'Парадний вхід', p: ['Портик посередині палацу, з боку двору. Сюди під\'їжджали від головної брами повз газон з ялиною.', 'Вигляд портика й розташування входів умовні: їх відтворено за звичайним планом таких садиб, а не за документом.'], s: ''},
  back: {k: 'вхід', h: 'Чорний вхід', p: ['Двері із заднього боку палацу, від шляху, і хвіртка в паркані навпроти них.', 'Розташування умовне.'], s: ''},
  gate: {k: 'в\'їзд', h: 'Головна брама', p: ['В\'їзд у маєток зі шляху Дубровиця — Воробин: мурований стовп із кованою брамою, далі липова алея й під\'їзд до двору.', 'Розташування умовне. Саме шляхом з Дубровиці, за схемою 1927 року, ішов загін № 1.'], s: '«Красная звезда», 1927'},
  wingS: {k: 'крило палацу', h: 'Праве (південне) крило', p: ['Двоповерхове крило. Ліпінський пише, що спершу оборонялися «в правому крилі, від дороги», а коли середина загорілася, перейшли через горище до лівого.', 'Чому праве — південне: Ліпінський сам уточнює, що рахує «від дороги». Якщо стати на шляху обличчям до будинку (на схід), праворуч буде південне крило. Будинок довгою стороною стоїть уздовж шляху, тож обидва крила однаково близькі до дороги, і «від дороги» означає саме точку погляду.'], s: 'Ліпінський, арк. 395 зв.–396; аерофотознімок'},
  wingN: {k: 'крило палацу', h: 'Ліве (північне) крило', p: ['Сюди оборонці перейшли через горище, коли середина палацу загорілася. Тут вони трималися до капітуляції близько 4-ї години пополудні.', 'Ліве — якщо дивитися від шляху, як Ліпінський.'], s: 'Ліпінський, арк. 396'},
  ofc: {k: 'службова будівля', h: 'Менша офіцина', p: ['Одноповерхова, тринадцять осей, з рустованими кутами й ризалітом під трикутним фронтоном. Тут були кухні, комори, пральня й контора.', 'На аерофотознімку — Г-подібна руїна з багатьма кімнатами на південь від подвір\'я. Ототожнення приблизне.'], s: 'Історія резиденції; фото 1938 року'},
  nb: {k: 'господарство', h: 'Господарська будівля', p: ['Довга одноповерхова будівля на північ від подвір\'я. Призначення невідоме: можливо, стайня чи каретня.'], s: 'Аерофотознімок'},
  lib: {k: 'павільйон', h: '«Бібліотека»', p: ['Квадратний павільйон на високому цоколі над лугами Горині: із заходу — портик із чотирьох дорицьких колон, з півдня — колонада, з півночі — вежа. До 1914 року тут була книгозбірня на 8000 томів і родинний архів.', 'Під час повстання павільйон не згадують. Його ще фотографували 1937 року.'], s: 'Історія резиденції; 3D-модель за фото до 1917 і 1937 років', link: ['worobin-3d.html', 'Окрема 3D-модель «Бібліотеки» →']},
  court: {k: 'подвір\'я', h: 'Газон з ялиною', p: ['Старий дерев\'яний двір під високим ламаним дахом стояв між двома офіцинами. Його розібрали, щоб звести на цьому місці палац, але палац так і не збудували. Тож у 1918 році двору вже не було, і на схемі його немає.', 'Перед двором і офіциною Орда 1870 року намалював газон за низькою жердяною огорожею з ялиною посередині, довкола нього — під\'їзну дорогу, а над усім — високі пірамідальні тополі. Так і показано на схемі.'], s: 'Історія резиденції; Н. Орда, 1870'},
  garden: {k: 'парк', h: 'Парк за муром', p: ['Будинки Воробина потопали в зелені нерегулярного пейзажного парку на кілька гектарів, з могутніми старими деревами: білими тополями, тополями, липами, високими ялинами, ясенами, каштанами. На верхньому рівні — офіцини й «Бібліотека», на нижньому — ставки, обсаджені старими деревами. Частину парку обнесено муром (його видно на аерофотознімку).', 'Доріжки, гаї й галявини на схемі — умовні: плану парку не збереглося.', 'З цього боку маєток стерегли німецькі пости. Ліпінський пише, що саме вони пропустили селян. Брама з двору — умовно.'], s: 'Історія резиденції; Ліпінський, арк. 395 зв.'},
  guns: {k: 'німецька армія', h: 'Німецька артилерія', p: ['У листопаді 1918 року у Воробині стояв полк німецької артилерії. Німецька армія вже поверталася додому, а 15 листопада в Домбровиці солдати заарештували своїх офіцерів. Пости з боку саду пропустили нападників, а спогад 1927 року пише, що німецька солдатська рада дала повстанцям гвинтівки, набої й бомби.', 'Місце гармат на схемі умовне.'], s: 'Ліпінський, арк. 395 зв.; телеграма № 410; «Красная звезда», 1927'},
  north: {k: 'за ставами', h: 'Житлові будинки й завод', p: ['На північ від маєтку, за ставами: житлові будинки й, найімовірніше, спиртовий завод. Будівлі — за обрисами на аерофотознімках.'], s: 'Аерофотознімки'},
  bridge: {k: 'переправа', h: 'Міст', p: ['Міст на перешийку між двома ставами на північ від маєтку — до житлових будинків і заводу. Місце — за аерофотознімком, вигляд умовний.'], s: 'Аерофотознімок'},
  road: {k: 'шлях', h: 'Шлях Дубровиця — Воробин', p: ['Шлях на південь до Дубровиці, близько 5 км, обсаджений тополями. Ним ішов загін № 1, ним везли поранених до лікарні, і на ньому розстріляли полонених.'], s: '«Красная звезда», 1927; Ліпінський; Мітлюх'}
};
var BL = [
  ['palace', [cM[0] - 4, 22, cM[1]]], ['portico', [PAL.M.x1 + 3, 8, AXZ]], ['back', [PAL.M.x0 - 2, 6, AXZ]], ['gate', [GATES.main[0], 7, GATES.main[1]]],
  ['wingN', [cN[0], 17, cN[1]]], ['wingS', [cS[0], 17, cS[1]]], ['ofc', [-58, 11, 34]], ['nb', [-51, 10, -49]], ['lib', [LIB[0], 25, LIB[1]]], ['court', [LAWN[0], 14, LAWN[1]]],
  ['garden', [26, 6, -46]], ['guns', [18, 7, 52]], ['north', [40, 12, -270]], ['bridge', [BRIDGE.x, 6, -190]], ['road', [-168, 6, 160]]
].map(function(b){ var el = mkLabel(INFO[b[0]].h, 'b', 1); el.addEventListener('click', function(){ openInfo(b[0]); }); return {el: el, p: new T.Vector3(b[1][0], b[1][1], b[1][2]), k: b[0]}; });
var DIRS = [
  ['↓ Дубровиця · 5 км', [-240, 8, 430]], ['↑ Висоцьк · униз Горинню', [-70, 8, -480]], ['← Острівці · Мочулище · Крупове', [-345, 8, -10]], ['Горинь →', [riverX(-60), 2, -60]]
].map(function(d){ return {el: mkLabel(d[0], 'dir', 0), p: new T.Vector3(d[1][0], d[1][1], d[1][2])}; });
GROUPS.forEach(function(G){ G.lab$ = mkLabel('', 'g-' + G.cls, 2); G.labPos = new T.Vector3(); });
ROUTES.forEach(function(r){ if (r.tag) r.tagEl = mkLabel(r.tag, 'tag', 3); });
var pinEls = [], cartLab = mkLabel('', 'pin', 4);

/* ═════════════ небо й світло за годиною ═════════════ */
var K = {night: 1, dusk: 0}, cSky = new T.Color(), cHor = new T.Color();
var tmp3 = new T.Vector3(), NIGHT_T = col(0x060a14), NIGHT_H = col(0x18202f), DAY_T = col(0x5d7088), DAY_H = col(0xb7bcbc), DUSK_T = col(0x2e3048), DUSK_H = col(0xb7805a);
function setTime(hour){
  var h = hour % 24, rise = 7.3, set = 15.9;
  var d = ss(rise - .6, rise + .9, h)*(1 - ss(set - .7, set + .5, h));
  var dusk = Math.min(1, Math.max(0, 1 - Math.abs(h - set)/1.1)*(h > 12 ? 1 : 0) + Math.max(0, 1 - Math.abs(h - rise)/1.0)*(h < 12 ? 1 : 0));
  cSky.copy(NIGHT_T).lerp(DAY_T, d).lerp(DUSK_T, dusk*.55); cHor.copy(NIGHT_H).lerp(DAY_H, d).lerp(DUSK_H, dusk*.7);
  skyU.top.value.copy(cSky); skyU.hor.value.copy(cHor);
  scene.fog.color.copy(cHor).multiplyScalar(.9); scene.fog.density = .0006 + .0014*(1 - d) + .0005*dusk;
  var az = (h - 12)/12*Math.PI*.95, el = Math.max(-.2, Math.sin((h - rise)/(set - rise)*Math.PI))*.38 + .02;
  var sdir = new T.Vector3(Math.sin(az)*Math.cos(el), Math.sin(el), Math.cos(az)*Math.cos(el)*.6 + .4).normalize();
  var moon = skyU.moonDir.value, night = 1 - d;
  skyU.sunDir.value.copy(sdir); skyU.sunK.value = Math.max(d*.45, dusk*.9); skyU.sunCol.value.copy(tmp2.set(0xffd9a0).lerp(col(0xff8a50), dusk*.75));
  skyU.moonK.value = night*(1 - dusk); skyU.cloudC.value.copy(tmp2.set(0x1a2030).lerp(col(0x8a8e92), d).lerp(col(0x7a5a4a), dusk*.5)); skyU.cloudK.value = .62 + .18*night;
  var L = d > .08 ? sdir : moon; sun.position.copy(controls.target).addScaledVector(L, 520); sun.target.position.copy(controls.target);
  sun.intensity = d > .08 ? lerp(.4, 2.4, d) + dusk*.5 : .5; sun.color.copy(d > .08 ? tmp2.set(0xfff1d6).lerp(col(0xffa868), dusk*.7) : tmp2.set(0x8aa2e6));
  hemi.intensity = lerp(.42, .7, d); hemi.color.copy(tmp2.set(0x5c74b8).lerp(col(0xdfe6ee), d)); hemi.groundColor.set(d > .4 ? 0x4c412e : 0x14131a);
  stars.material.opacity = Math.max(0, 1 - d*1.6 - dusk*.7)*.75;
  waterU.uSky.value.copy(cHor).multiplyScalar(lerp(.5, 1, d)); waterU.uDeep.value.set(0x13202a).multiplyScalar(lerp(.45, 1, d)); waterU.uSun.value.copy(L); waterU.uSunC.value.copy(sun.color).multiplyScalar(d > .08 ? 1 : .6);
  HFOG.uHF.value.set(lerp(.0085, .005, d) + dusk*.002, -3.6, lerp(1.6, 1.4, d), lerp(.7, .5, d));                          // приземний туман
  HFOG.uHFC.value.setRGB(.06, .08, .12).lerp(tmp2.copy(cHor).multiplyScalar(1.05), d).lerp(tmp2.set(0x9a7c6c), dusk*.4);
  if (PP){ var U = PP.U;                                                                                                       // кольорова корекція: ніч — холодні тіні й теплі вогні, день — м'яке листопадове світло, сутінки — бурштин
    U.exposure.value = lerp(1.5, 1.02, d) + dusk*.06; U.sat.value = lerp(.8, .86, d) - dusk*.04; U.contrast.value = lerp(.32, .24, d) + dusk*.06;
    U.shT.value.set(lerp(.86, .97, d), lerp(.97, 1, d), lerp(1.14, 1.04, d)).lerp(tmp3.set(.9, .97, 1.06), dusk*.8);
    U.hiT.value.set(lerp(1.1, 1.04, d), lerp(1, 1, d), lerp(.86, .95, d)).lerp(tmp3.set(1.1, 1, .84), dusk*.8);
    U.lift.value.set(lerp(.006, .012, d), lerp(.012, .012, d), lerp(.032, .013, d)); U.gain.value.set(lerp(.96, 1.02, d), lerp(.99, 1, d), lerp(1.04, .97, d));
    U.vigC.value.set(lerp(.72, .92, d), lerp(.82, .9, d), lerp(1.08, .92, d)).lerp(tmp3.set(.95, .86, .78), dusk*.5); }
  else renderer.toneMappingExposure = lerp(1.6, 1, d);
  K.night = night; K.dusk = dusk; return d;
}

/* ═════════════ кроки ═════════════ */
var volleyDone = false, step = -1, twStart = 0, TW = 2600, tw = 1, curHour = 13.2, fromHour = 13.2;
var fireCur = [0, 0, 0], fireFrom = [0, 0, 0], roofCur = [0, 0, 0], roofFrom = [0, 0, 0], rainCur = 0;
var camFrom = {p: new T.Vector3(), t: new T.Vector3()}, camTo = {p: new T.Vector3(), t: new T.Vector3()}, camFly = 1, CAMDUR = 3400, camStart = 0, userMoved = false;
var cT = document.getElementById('cT'), cD = document.getElementById('cD'), cH = document.getElementById('cH'), cP = document.getElementById('cP'), cS2 = document.getElementById('cS');
var ticks = document.getElementById('ticks'), fill = document.getElementById('fill'), tickEls = [];
STEPS.forEach(function(s, k){
  var b = document.createElement('button'); b.type = 'button'; b.style.left = (k/(N - 1)*100) + '%';
  b.setAttribute('aria-label', s.time + ' — ' + s.h); b.innerHTML = '<span>' + (k ? s.time : 'маєток') + '</span>';
  b.addEventListener('click', function(){ stop(); go(k); }); ticks.appendChild(b); tickEls.push(b);
});
function camFor(k){ var c = STEPS[k].cam, p = new T.Vector3(c[0][0], c[0][1], c[0][2]), t = new T.Vector3(c[1][0], c[1][1], c[1][2]); if (MOBILE) p.sub(t).multiplyScalar(1.4).add(t); return {p: p, t: t}; }
function flyTo(k, instant){ var c = camFor(k); camFrom.p.copy(camera.position); camFrom.t.copy(controls.target); camTo.p.copy(c.p); camTo.t.copy(c.t);
  camStart = performance.now(); camFly = instant ? 1 : 0; if (instant){ camera.position.copy(c.p); controls.target.copy(c.t); } }
function viaPos(a, via, b, t, off){                                    // рух ламаною (через міст): позиція, напрям
  var P = [a].concat(via, [b]), L = [0], k;
  for (k = 1; k < P.length; k++) L.push(L[k - 1] + Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]));
  var s = t*L[L.length - 1]; for (k = 1; k < P.length - 1 && L[k] < s; k++);
  var u = (s - L[k - 1])/((L[k] - L[k - 1]) || 1), dx = P[k][0] - P[k - 1][0], dz = P[k][1] - P[k - 1][1], ln = Math.hypot(dx, dz) || 1, ed = Math.min(1, Math.min(s, L[L.length - 1] - s)/6);
  return [lerp(P[k - 1][0], P[k][0], u) - dz/ln*off*ed, lerp(P[k - 1][1], P[k][1], u) + dx/ln*off*ed, dx, dz]; }
function go(k, instant){
  k = Math.max(0, Math.min(N - 1, k)); if (k === step && !instant) return;
  var first = step < 0, prev = step;
  GROUPS.forEach(function(G){ var L = layout(G, k);
    for (var i = 0; i < G.n; i++){ G.from[i] = first ? L[i].slice() : G.cur[i].slice();
      if (!first && G.cur[i][2] < .05 && L[i][2] === 1 && !G.st[prev] && G.spawn) G.from[i] = [G.spawn[0], G.spawn[1], 0, 0];
      G.to[i] = L[i]; }
    G.labText = (G.lab && G.lab[k]) || ''; G.curVia = (!first && G.via && G.via[k] && k === prev + 1) ? G.via[k] : null; });
  fromHour = curHour; fireFrom = fireCur.slice(); roofFrom = roofCur.slice();
  step = k; twStart = performance.now(); tw = first ? 1 : 0; volleyDone = false;
  var s = STEPS[k]; cT.textContent = s.time; cD.textContent = s.day; cH.textContent = s.h; cP.textContent = s.p; cS2.textContent = s.s;
  var card = document.getElementById('card'); card.classList.remove('fresh'); void card.offsetWidth; card.classList.add('fresh');
  tickEls.forEach(function(b, j){ b.classList.toggle('cur', j === k); b.classList.toggle('done', j < k); });
  fill.style.width = (k/(N - 1)*100) + '%';
  pinEls.forEach(function(p){ p.el.remove(); }); pinEls = [];
  PIN_RINGS.forEach(function(r){ scene.remove(r); }); PIN_RINGS = [];
  (PINS[k] || []).forEach(function(q){ var x = q[0][0], z = q[0][1], y = Math.max(H(x, z), -1);
    pinEls.push({el: mkLabel(q[1], 'pin', 5), p: new T.Vector3(x, y + 10, z)});
    var rg = new T.Mesh(new T.RingGeometry(2.2, 2.8, 48), new T.MeshBasicMaterial({color: new T.Color(2.2, 1.7, .7), transparent: true, opacity: .9, depthWrite: false, fog: false, toneMapped: false}));
    rg.rotation.x = -Math.PI/2; rg.position.set(x, y + .8, z); rg.renderOrder = 3; scene.add(rg); PIN_RINGS.push(rg); });
  ROUTES.forEach(function(r){ r.target = r.on.indexOf(k) > -1 ? 1 : 0; });
  if (k === 3 && prev !== 3) rocket.t = 0;
  if (k === 3){ [900, 1900, 3000, 4300].forEach(function(t, j){ setTimeout(function(){ boomAt([-74, -84, -96, -70][j], [-28, -18, -36, -44][j]); }, t); }); }
  if (k === 4) setTimeout(function(){ boomAt(cM[0] + 4, cM[1]); }, 1200);
  userMoved = false; flyTo(k, first || instant);
  var bt = document.getElementById('bigt'); if (bt && !first && k > 0){ bt.firstChild.textContent = s.time; bt.lastChild.textContent = s.h; bt.classList.remove('show'); void bt.offsetWidth; bt.classList.add('show'); }
  document.body.classList.toggle('overview', k === 0);
}
function boomAt(x, z){ if (step !== 3 && step !== 4) return; var b = BOOMS.find(function(q){ return q.t > 1.2; }) || BOOMS[0]; b.t = 0; var y = H(x, z); b.m.position.set(x, y + 1, z); b.l.position.set(x, y + 3, z);
  for (var k = 0; k < 26; k++) emit(SMOKE, x + (rnd() - .5)*4, y + 1.5, z + (rnd() - .5)*4, (rnd() - .5)*3, 1.5 + rnd()*2, (rnd() - .5)*3, 4, 4 + rnd()*3, 1);
  for (k = 0; k < 28; k++) emit(EMBER, x, y + 1, z, (rnd() - .5)*16, 6 + rnd()*10, (rnd() - .5)*16, 1.2, 1); }

var playing = false, nextAt = 0, playBtn = document.getElementById('play'), playIc = document.getElementById('playIc'), DWELL = 10000;
function stop(){ playing = false; playIc.setAttribute('d', 'M4 2.5v11l9-5.5z'); playBtn.setAttribute('aria-label', 'Відтворити'); }
function play(){ playing = true; playIc.setAttribute('d', 'M4 2.5h3v11H4zM9 2.5h3v11H9z'); playBtn.setAttribute('aria-label', 'Пауза'); if (step >= N - 1) go(0); nextAt = performance.now() + DWELL; }
playBtn.onclick = function(){ playing ? stop() : play(); };
document.getElementById('prev').onclick = function(){ stop(); go(step - 1); };
document.getElementById('next').onclick = function(){ stop(); go(step + 1); };
addEventListener('keydown', function(e){ if (e.key === 'ArrowRight'){ stop(); go(step + 1); } if (e.key === 'ArrowLeft'){ stop(); go(step - 1); } if (e.key === ' '){ e.preventDefault(); playing ? stop() : play(); } });
controls.addEventListener('start', function(){ userMoved = true; camFly = 1; });
document.getElementById('recam').onclick = function(){ flyTo(step); userMoved = false; };
document.getElementById('lblBtn').onclick = function(){ var on = document.body.classList.toggle('lbl'); this.setAttribute('aria-pressed', on); };

var infoBox = document.getElementById('binfo');
function openInfo(k){ var I = INFO[k]; if (!I) return;
  infoBox.innerHTML = '<button type="button" class="x" aria-label="Закрити">×</button><p class="k">' + I.k + '</p><h2>' + I.h + '</h2>' + I.p.map(function(t){ return '<p>' + t + '</p>'; }).join('') +
    (I.link ? '<a class="go" href="' + I.link[0] + '">' + I.link[1] + '</a>' : '') + (I.s ? '<p class="src">' + I.s + '</p>' : '');
  infoBox.classList.add('open'); document.getElementById('info').classList.remove('open'); infoBox.querySelector('.x').onclick = function(){ infoBox.classList.remove('open'); }; }
var PICK = [];
[[palN, 'wingN'], [palS, 'wingS'], [palM, 'palace'], [ofc1, 'ofc'], [ofc2, 'ofc'], [nbld, 'nb']].forEach(function(q){ q[0].traverse(function(o){ if (o.isMesh){ o.userData.info = q[1]; PICK.push(o); } }); });
PORTICO.forEach(function(m){ m.userData.info = 'portico'; PICK.push(m); });
var ray = new T.Raycaster(), mv = new T.Vector2(), downAt = null;
cv.addEventListener('pointerdown', function(e){ downAt = [e.clientX, e.clientY]; });
cv.addEventListener('pointerup', function(e){ if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
  mv.set(e.clientX/innerWidth*2 - 1, -e.clientY/innerHeight*2 + 1); ray.setFromCamera(mv, camera);
  var hit = ray.intersectObjects(PICK, false)[0]; if (hit) openInfo(hit.object.userData.info); });

fetch('worobin-1k.glb?v=20261019c').then(function(r){ return r.arrayBuffer(); }).then(function(buf){
  var dr = new T.DRACOLoader(); dr.setDecoderPath('draco/'); var gl = new T.GLTFLoader(); gl.setDRACOLoader(dr);
  gl.parse(buf, '', function(g){ g.scene.traverse(function(o){ if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; o.userData.info = 'lib'; PICK.push(o); } }); libGroup.add(g.scene); applyHF(g.scene); dr.dispose(); });
}).catch(function(){});

/* ═════════════ кадр ═════════════ */
var v3 = new T.Vector3(), clock = new T.Clock(), lastShot = 0, needle = document.getElementById('needle'), UPV = new T.Vector3(0, 1, 0);
var placed = [];
function project(el, p, hide){
  v3.copy(p).project(camera);
  var off = hide || v3.z > 1 || Math.abs(v3.x) > 1.05 || Math.abs(v3.y) > 1.05;
  if (off){ el.classList.add('off'); return; }
  el.classList.remove('off');
  placed.push({el: el, x: (v3.x*.5 + .5)*innerWidth, y: (-v3.y*.5 + .5)*innerHeight, pr: el._pr, w: el._w || (el._w = el.offsetWidth || 80), h: el._h || (el._h = el.offsetHeight || 22)});
}
function layoutLabels(){                                                        // розсуваємо підписи, щоб не накладалися
  placed.sort(function(a, b){ return b.pr - a.pr; });
  var boxes = [];
  placed.forEach(function(L){
    var y = L.y, tries = 0, x0 = L.x - L.w/2, x1 = L.x + L.w/2;
    while (tries++ < 12){ var y0 = y - L.h, hit = false;
      for (var k = 0; k < boxes.length; k++){ var b = boxes[k]; if (x0 < b[2] && x1 > b[0] && y0 < b[3] && y > b[1]){ hit = true; y = b[1] - 3; break; } }
      if (!hit) break; }
    boxes.push([x0, y - L.h, x1, y]);
    L.el.style.transform = 'translate(' + L.x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-100%)';
    L.el.style.setProperty('--lead', Math.max(0, (L.y - y)).toFixed(0) + 'px');
  });
  placed = [];
}
function ease(t){ return t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2; }
function randomFrom(G){ for (var k = 0; k < 6; k++){ var c = G.cur[(Math.random()*G.n)|0]; if (c[2] > .6 && !c[3]) return c; } return null; }
function shoot(inten){
  var att = GROUPS.filter(function(G){ return G.cls === 'att'; }), defWing = step >= 7 ? PAL.N : PAL.S, y0 = palN.position.y;
  var n = Math.random() < inten*.9 ? 1 + (Math.random()*2*inten|0) : 0;
  for (var q = 0; q < n; q++){
    var tr2 = TR.find(function(t){ return !t.on; }); if (!tr2) return;
    var src = randomFrom(att[(Math.random()*att.length)|0]); if (!src) continue;
    var face = Math.random(), win = face < .5 ? [defWing.x1 + .2, y0 + 2 + Math.random()*7, lerp(defWing.z0, defWing.z1, Math.random())] : [lerp(defWing.x0, defWing.x1, Math.random()), y0 + 2 + Math.random()*7, Math.random() < .5 ? defWing.z0 - .2 : defWing.z1 + .2];
    var out = Math.random() < .42;
    var a = out ? win : [src[0], H(src[0], src[1]) + 3.4, src[1]], b = out ? [src[0] + (Math.random() - .5)*6, H(src[0], src[1]) + 1.5, src[1] + (Math.random() - .5)*6] : win;
    tr2.on = true; tr2.t = 0; tr2.a = a; tr2.b = b; tr2.len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); tr2.c = out ? [2.2, 2, 1.4] : [2.6, 1.2, .4];
    emit(FLASH, a[0], a[1], a[2], 0, 0, 0, .09, out ? 3 : 2.4, 0);
  }
}
function upd(P, dt, fn){ var pos = P.g.attributes.position.array, cl = P.g.attributes.aCol.array, sz = P.g.attributes.aSize.array, al = P.g.attributes.aA.array;
  for (var k = 0; k < P.n; k++){ var s = P.st[k]; if (s.life >= s.max){ al[k] = 0; continue; } s.life += dt; var u = s.life/s.max;
    s.x += s.vx*dt; s.y += s.vy*dt; s.z += s.vz*dt; pos[k*3] = s.x; pos[k*3 + 1] = s.y; pos[k*3 + 2] = s.z; fn(s, u, k, cl, sz, al); }
  P.g.attributes.position.needsUpdate = P.g.attributes.aCol.needsUpdate = P.g.attributes.aSize.needsUpdate = P.g.attributes.aA.needsUpdate = true; }
var HOT = PARTS.map(function(R0, p){ var r = rngF(90 + p), out = []; for (var k = 0; k < 4; k++) out.push([lerp(R0.x0 + 2, R0.x1 - 2, r()), lerp(R0.z0 + 2, R0.z1 - 2, r())]); return out; });   // осередки вогню
function frame(now){
  requestAnimationFrame(frame);
  var dt = Math.min(DTMAX, clock.getDelta()), time = now*.001;
  if (playing && now > nextAt){ if (step < N - 1){ go(step + 1); nextAt = now + DWELL; } else stop(); }
  tw = Math.min(1, (now - twStart)/TW); var e = ease(tw);
  curHour = lerp(fromHour, STEPS[step].t, e);
  for (var p = 0; p < 3; p++){ fireCur[p] = lerp(fireFrom[p], FIRE[step][p], e); roofCur[p] = lerp(roofFrom[p], ROOF_GONE[step][p], ss(.3, 1, tw)); }
  rainCur = lerp(rainCur, RAIN[step], .02);
  var day = setTime(curHour), night = K.night, fireMax = Math.max.apply(null, fireCur);
  skyU.time.value = time; skyU.glow.value = fireMax*night*.8;
  HFOG.uFG.value.set(fireMax*.34, fireMax*.14, fireMax*.05, 75).multiplyScalar(1).setW(75); HFOG.uFG.value.x *= lerp(.35, 1.4, night); HFOG.uFG.value.y *= lerp(.35, 1.4, night); HFOG.uFG.value.z *= lerp(.35, 1.4, night);
  HFOG.uFP.value.set(cM[0], 10, cM[1]);
  if (PP){ PP.U.tilt.value = LOW ? 0 : ss(14, 95, camera.position.y - controls.target.y)*.72; PP.bright.th.value = lerp(.85, 1.3, day); PP.U.exposure.value *= 1 - fireMax*.14*day - fireMax*.06; }
  waterU.uTime.value = time; waterU.uFire.value = fireMax*(.3 + night); waterU.fogColor.value.copy(scene.fog.color); waterU.fogDensity.value = scene.fog.density;
  // камера: проліт, далі повільний наїзд
  if (camFly < 1){ camFly = Math.min(1, Math.max(0, (now - camStart)/CAMDUR)); var ce = ease(camFly);
    camera.position.lerpVectors(camFrom.p, camTo.p, ce); controls.target.lerpVectors(camFrom.t, camTo.t, ce);
    camera.position.y += Math.sin(ce*Math.PI)*Math.min(70, camFrom.p.distanceTo(camTo.p)*.18); }
  else if (!userMoved && (step === 6 || step === 11) && cart.visible){ var cg = new T.Vector3(cart.position.x, cart.position.y + 2, cart.position.z);
    var off = camera.position.clone().sub(controls.target); off.lerp(new T.Vector3(34, 18, 42), .015); controls.target.lerp(cg, .04); camera.position.copy(controls.target).add(off); }
  else if (!userMoved && step >= 0){ camera.position.sub(controls.target).applyAxisAngle(UPV, .00022).multiplyScalar(.99982).add(controls.target); }
  // вікна
  var wl = WINDOWS[step]*night;
  GLASS_MATS.forEach(function(g){ var k2 = g.kind === 'palace' ? wl*2.6 : g.kind === 'ofc' ? (step <= 1 ? 2 : .25)*night : g.kind === 'house' ? (step === 0 ? .5 : 1.4)*night : (step <= 1 ? 1.2 : .1)*night; g.m.emissiveIntensity = lerp(g.m.emissiveIntensity, k2, .05); });
  // пожежа
  for (p = 0; p < 3; p++){
    var f = fireCur[p], grp = PGRP[p], ud = grp.userData, R0 = PARTS[p], gy = grp.position.y, burnt = Math.max(f*.8, roofCur[p]);
    ud.gmat.emissive.setRGB(1, lerp(.7, .32, f), lerp(.4, .08, f)); if (f > .02) ud.gmat.emissiveIntensity = Math.max(ud.gmat.emissiveIntensity, f*(3 + 1.2*Math.sin(time*9 + p)));
    ud.wallMat.color.copy(ud.wall).lerp(tmp2.set(0x2a221c), burnt*.8); M.trim.color.setRGB(1, 1, 1);
    ud.roof.position.y = ud.h + .2 - roofCur[p]*(ud.h*.55); ud.roof.rotation.z = roofCur[p]*.06; ud.roof.visible = roofCur[p] < .97;
    FLAMES[p].forEach(function(o, j){ var u = o.userData, fl = f*(.75 + .25*Math.sin(time*11 + u.ph) + .15*Math.sin(time*23 + j));
      o.visible = false; if (!o.visible) return; var top = gy + ud.h*(1 - roofCur[p]*.5) + (1 - roofCur[p])*ud.rh*.35;
      o.position.y = top - .5; o.scale.set(u.w*fl, u.h*fl*(1 + .2*Math.sin(time*7 + u.ph)), u.w*fl); o.rotation.y = time*.5 + u.ph; });
    fireLights[p].intensity = f*(1.6 + Math.sin(time*13 + p*2)*.4 + Math.sin(time*7.3)*.3)*(.18 + .9*night);
    var rate = f*(LOW ? 120 : 210)*dt;
    for (var k = 0; k < rate; k++){
      var hs = HOT[p][(Math.random()*HOT[p].length)|0], spread = .4 + roofCur[p]*.6, fx = lerp(hs[0], lerp(R0.x0 + 1, R0.x1 - 1, Math.random()), spread*.35) + (Math.random() - .5)*2.4, fz = lerp(hs[1], lerp(R0.z0 + 1, R0.z1 - 1, Math.random()), spread*.35) + (Math.random() - .5)*2.4, fy = gy + ud.h*(1 - roofCur[p]*.4) + Math.random()*ud.rh*.4*(1 - roofCur[p]);
      emit(FLAME, fx, fy, fz, (Math.random() - .5)*1.4 + .9, 3 + Math.random()*4, (Math.random() - .5)*1.4, .7 + Math.random()*.8, 3.2 + Math.random()*3.6, 0);
      if (Math.random() < .1) emit(EMBER, fx, fy + 2, fz, (Math.random() - .5)*3 + 2.5, 5 + Math.random()*6, (Math.random() - .5)*3, 2.5 + Math.random()*2.5, .45 + Math.random()*.3, 0);
    }
    smokeAcc[p] += f*(LOW ? 11 : 21)*dt;
    while (smokeAcc[p] >= 1){ smokeAcc[p]--; var hs2 = HOT[p][(Math.random()*HOT[p].length)|0]; emit(SMOKE, hs2[0] + (Math.random() - .5)*5, gy + ud.h + 2 + Math.random()*2, hs2[1] + (Math.random() - .5)*5, 1 + Math.random()*1.5, 4 + Math.random()*3, -.5 + (Math.random() - .5), 12 + Math.random()*7, 7 + Math.random()*6, 0); }
  }
  if (Math.random() < dt*2) emit(SMOKE, CHIMNEY.x, CHIMNEY.y, CHIMNEY.z, .8, 2.5, -.3, 9, 3, 2);          // заводський комин куриться
  waterU.uFireP.value.set(cM[0] + 10, 12, cM[1]);
  upd(FLAME, dt, function(s, u, k, cl, sz, al){ cl[k*3] = lerp(1, .75, u*u); cl[k*3 + 1] = u < .3 ? lerp(.78, .45, u/.3) : lerp(.45, .1, (u - .3)/.7); cl[k*3 + 2] = lerp(.38, .02, Math.min(1, u*2)); sz[k] = s.s0*(1 - u*.5); al[k] = (1 - u)*Math.min(1, u*8)*.5; s.vy *= .985; s.vx += Math.sin(now*.004 + k)*dt*.8; });
  upd(EMBER, dt, function(s, u, k, cl, sz, al){ cl[k*3] = 1; cl[k*3 + 1] = lerp(.6, .3, u); cl[k*3 + 2] = .12; sz[k] = s.s0; al[k] = (1 - u)*(.55 + .45*Math.sin(now*.03 + k)); s.vy -= 2.2*dt; s.vx *= .99; });
  var sCol = tmp2.set(0x3a332e).lerp(col(0x635c54), day).clone();
  upd(SMOKE, dt, function(s, u, k, cl, sz, al){ var soot = s.kind === 0 ? (1 - ss(.05, .5, u))*.45 - ss(.5, 1, u)*.35 : 0; cl[k*3] = sCol.r*(1 - soot); cl[k*3 + 1] = sCol.g*(1 - soot); cl[k*3 + 2] = sCol.b*(1 - soot);
    if (s.kind === 0 && u < .35){ var gl = (1 - u/.35)*lerp(.22, .7, night); cl[k*3] += gl; cl[k*3 + 1] += gl*.36; cl[k*3 + 2] += gl*.08; }
    sz[k] = s.s0*(1 + u*3); al[k] = Math.min(1, u*5)*(1 - u)*(s.kind === 2 ? .25 : s.kind ? .35 : lerp(.62, .9, day)); s.vx += .3*dt; });
  upd(FLASH, dt, function(s, u, k, cl, sz, al){ cl[k*3] = 1; cl[k*3 + 1] = .85; cl[k*3 + 2] = .55; sz[k] = s.s0*(1 + u); al[k] = 1 - u; });
  // залп на дорозі
  if (step === 10 && !volleyDone && (now - twStart)/1000 > 4.1){ volleyDone = true;
    GROUPS.forEach(function(G){ if (G.id !== 'a1') return; G.cur.forEach(function(c){ if (c[2] > .6) emit(FLASH, c[0] + .8, H(c[0], c[1]) + 3.2, c[1], 0, 0, 0, .16, 3.4, 0); }); });
    var bv = BOOMS[0]; bv.t = .55; bv.m.position.set(-160, -50, -30); bv.l.position.set(-150, H(-150, -30) + 4, -30); }
  var inten = lerp(SHOTS[Math.max(0, step - 1)] || 0, SHOTS[step], e)*(tw < .5 && step < 2 ? 0 : 1);
  if (now - lastShot > 70){ lastShot = now; if (inten > 0) shoot(inten); }
  for (var j = 0; j < TRN; j++){ var t2 = TR[j], o = j*6;
    if (!t2.on){ trPos[o] = trPos[o + 3] = 1e6; continue; }
    t2.t += dt*420/Math.max(20, t2.len); if (t2.t >= 1){ t2.on = false; continue; }
    var u0 = Math.max(0, t2.t - 7/t2.len), u1 = t2.t;
    for (var q = 0; q < 3; q++){ trPos[o + q] = lerp(t2.a[q], t2.b[q], u0); trPos[o + 3 + q] = lerp(t2.a[q], t2.b[q], u1); }
    trCol[o] = t2.c[0]*.2; trCol[o + 1] = t2.c[1]*.2; trCol[o + 2] = t2.c[2]*.2; trCol[o + 3] = t2.c[0]; trCol[o + 4] = t2.c[1]; trCol[o + 5] = t2.c[2]; }
  trGeo.attributes.position.needsUpdate = trGeo.attributes.color.needsUpdate = true;
  BOOMS.forEach(function(b){ if (b.t > 1.2){ b.m.material.opacity = 0; b.l.intensity = 0; return; } b.t += dt; var u = b.t/1.2;
    b.m.scale.setScalar(1 + u*5); b.m.material.opacity = Math.pow(1 - u, 2)*.7; b.l.intensity = Math.pow(1 - u, 2)*(3 + night*6); });
  if (rocket.t >= 0){ rocket.t += dt; var rt2 = rocket.t, r0 = [-150, -120];
    if (rt2 < 4.8){ var hh = Math.min(rt2, 2.3), y = H(r0[0], r0[1]) + 64*hh - 13.5*hh*hh + (rt2 > 2.3 ? -5*(rt2 - 2.3) : 0);
      rocket.head.visible = true; rocket.head.position.set(r0[0] + rt2*3, y, r0[1] + rt2*10); rocket.light.position.copy(rocket.head.position);
      rocket.light.intensity = (rt2 < 2.3 ? 1.2 : 4*(1 - (rt2 - 2.3)/2.5))*(.3 + night*.9);
      emit(FLAME, rocket.head.position.x, rocket.head.position.y, rocket.head.position.z, 0, -2, 0, .5, rt2 > 2.3 ? 4 : 1.6, 0);
      if (rt2 > 2.3 && rt2 < 2.4) for (var bb = 0; bb < 40; bb++) emit(EMBER, rocket.head.position.x, rocket.head.position.y, rocket.head.position.z, (rnd() - .5)*22, (rnd() - .3)*18, (rnd() - .5)*22, 2.2, 1.4);
    } else { rocket.t = -1; rocket.head.visible = false; rocket.light.intensity = 0; } }
  // люди
  var tIdx = 0, ta = TORCH.g.attributes, torchArr = ta.position.array, tCol = ta.aCol.array, tSz = ta.aSize.array, tA = ta.aA.array, gIdx = 0;
  GROUPS.forEach(function(G){
    var sx = 0, sz2 = 0, nv = 0, stc = G.st[step];
    for (var i = 0; i < G.n; i++){
      var a = G.from[i], b = G.to[i], c = G.cur[i], ei = ease(Math.min(1, Math.max(0, tw*1.25 - (i % 7)*.03)));
      c[0] = lerp(a[0], b[0], ei); c[1] = lerp(a[1], b[1], ei); c[2] = lerp(a[2], b[2], ei); c[3] = lerp(a[3], b[3], ei);
      var dirx = b[0] - a[0], dirz = b[1] - a[1];
      if (G.curVia && ei > 0 && ei < 1){ var vp = viaPos(a, G.curVia, b, ei, (hash(i, 3) - .5)*2.2); c[0] = vp[0]; c[1] = vp[1]; dirx = vp[2]; dirz = vp[3]; }
      var moving = ei > 0 && ei < 1 && c[2] > .5, bob = moving ? Math.abs(Math.sin(now*.014 + i))*.18 : 0, gy = gY(c[0], c[1]);
      if (stc && stc.fallAt){ var el2 = (now - twStart)/1000 - stc.fallAt - (i % 6)*.07; if (el2 > 0) c[3] = Math.max(c[3], Math.min(1, el2*2.5)); }
      var face = moving ? Math.atan2(dirx, dirz) : (G.cls === 'def' ? -Math.PI/2 : Math.atan2(-88 - c[0], -31 - c[1])) + (hash(i, 7) - .5)*.8;
      dummy.position.set(c[0], gy + bob, c[1]); dummy.rotation.set(c[3]*Math.PI/2, face, moving ? Math.sin(now*.014 + i)*.06 : 0); dummy.scale.setScalar(Math.max(.001, c[2])*FIG_S);
      dummy.updateMatrix(); G.mesh.setMatrixAt(i, dummy.matrix); G.rest.setMatrixAt(i, dummy.matrix);
      if (c[2] > .3 && !c[3]){ sx += c[0]; sz2 += c[1]; nv++; }
      if (G.cls === 'att' && i % 4 === 0 && c[2] > .5 && night > .2 && tIdx < TORCH.n){
        torchArr[tIdx*3] = c[0] + .45; torchArr[tIdx*3 + 1] = gy + 3.6 + bob + Math.sin(now*.02 + i)*.1; torchArr[tIdx*3 + 2] = c[1];
        tCol[tIdx*3] = 1; tCol[tIdx*3 + 1] = .55 + Math.sin(now*.03 + i)*.08; tCol[tIdx*3 + 2] = .18; tSz[tIdx] = 1.5 + Math.sin(now*.025 + i*3)*.35; tA[tIdx] = night*c[2]; tIdx++; }
    }
    G.mesh.instanceMatrix.needsUpdate = G.rest.instanceMatrix.needsUpdate = true;
    G.mesh.material.emissiveIntensity = night*.12;
    var txt = G.labText;
    if (nv && txt) G.labPos.set(sx/nv, H(sx/nv, sz2/nv) + 7, sz2/nv);
    else if (txt && stc && stc.hide) G.labPos.set(stc.c[0], 17, stc.c[1]);
    if (G.lab$.firstChild.textContent !== txt){ G.lab$.firstChild.textContent = txt; G.lab$._w = 0; }
    project(G.lab$, G.labPos, !txt || tw < .55);
    var showR = nv > 3 && G.cls !== 'ger' && txt;
    if (showR){ var rr = (stc && stc.r ? stc.r : 6) + 2.5, cx2 = sx/nv, cz2 = sz2/nv, cy = H(cx2, cz2) + .45;
      G.ring.position.set(cx2, cy, cz2); G.ring.scale.setScalar(rr*(1 + .04*Math.sin(time*2.5))); G.disc.position.set(cx2, cy - .05, cz2); G.disc.scale.setScalar(rr); }
    G.ring.material.opacity = lerp(G.ring.material.opacity, showR ? .8 : 0, .08); G.disc.material.opacity = lerp(G.disc.material.opacity, showR ? .16 : 0, .08);
    if (G.cls === 'att' && gIdx < 4 && nv){ torchLights[gIdx].position.set(sx/nv, H(sx/nv, sz2/nv) + 5, sz2/nv); torchLights[gIdx].intensity = night*1.3*(1 + .15*Math.sin(now*.02 + gIdx)); gIdx++; }
  });
  for (var z2 = tIdx; z2 < TORCH.n; z2++) tA[z2] = 0;
  for (var gi = gIdx; gi < 4; gi++) torchLights[gi].intensity = 0;
  ta.position.needsUpdate = ta.aCol.needsUpdate = ta.aSize.needsUpdate = ta.aA.needsUpdate = true;
  campfire.intensity = night*(1.6 + Math.sin(now*.02)*.4);
  // туман і мряка
  var ma = MIST.g.attributes, mk = Math.max(night*.5, K.dusk*.55, .12);
  for (var mi = 0; mi < MIST.n; mi++){ var s = MIST.st[mi]; ma.position.array[mi*3] = s.x + Math.sin(time*.05 + s.ph)*10; ma.position.array[mi*3 + 1] = s.y; ma.position.array[mi*3 + 2] = s.z + Math.cos(time*.04 + s.ph)*6;
    ma.aCol.array[mi*3] = lerp(.55, .8, day); ma.aCol.array[mi*3 + 1] = lerp(.6, .8, day); ma.aCol.array[mi*3 + 2] = lerp(.72, .8, day); ma.aSize.array[mi] = s.s0; ma.aA.array[mi] = mk*.24; }
  ma.position.needsUpdate = ma.aA.needsUpdate = ma.aCol.needsUpdate = ma.aSize.needsUpdate = true;
  var tgt = controls.target;
  for (var ri = 0; ri < RN; ri++){ var R1 = RS[ri]; R1[1] -= dt*26; R1[0] += dt*4; if (R1[1] < 0){ R1[1] += 70; R1[0] = rnd()*240 - 120; R1[2] = rnd()*240 - 120; }
    var bx0 = tgt.x + R1[0], bz0 = tgt.z + R1[2], by0 = H(bx0, bz0) + R1[1]; rnPos[ri*6] = bx0; rnPos[ri*6 + 1] = by0; rnPos[ri*6 + 2] = bz0; rnPos[ri*6 + 3] = bx0 + .25; rnPos[ri*6 + 4] = by0 - 1.4; rnPos[ri*6 + 5] = bz0; }
  rnGeo.attributes.position.needsUpdate = true; rainLines.material.opacity = rainCur*.22;
  // підвода
  if (step === 6 || step === 11){ cart.visible = true; var cu = Math.max(.001, Math.min(.995, step === 6 ? (time*.04) % 1 : tw*.5)); var cp = CART_PATH.getPointAt(cu), ct = CART_PATH.getTangentAt(cu);
    cart.position.set(cp.x, H(cp.x, cp.z), cp.z); cart.rotation.y = Math.atan2(ct.x, ct.z) + Math.PI; cart.userData.lamp.intensity = night*2.2; }
  else cart.visible = false;
  cartLab.firstChild.textContent = step === 6 ? 'підвода з пораненими' : 'віз: Ліпінський під двома трупами';
  project(cartLab, new T.Vector3(cart.position.x, cart.position.y + 6, cart.position.z), !cart.visible || camFly < 1);
  // маршрути
  ROUTES.forEach(function(r){ r.op += ((r.target || 0) - r.op)*.05; r.m.material.opacity = r.op*.95; r.hd.material.opacity = r.op; r.m.visible = r.hd.visible = r.op > .01; r.tex.offset.x -= dt*1.1;
    if (r.tagEl) project(r.tagEl, r.tagP, r.op < .5); });
  PIN_RINGS.forEach(function(rg, k){ var u = ((time*.6 + k*.3) % 1); rg.scale.setScalar(1 + u*2.2); rg.material.opacity = (1 - u)*.9*Math.min(1, tw*2); });
  // підписи й компас
  controls.update();
  var showB = step === 0 || document.body.classList.contains('lbl');
  var lblOn = document.body.classList.contains('lbl');
  BL.forEach(function(b){ var wing = b.k === 'wingN' || b.k === 'wingS'; project(b.el, b.p, wing ? !(lblOn || step === 4 || step === 7) : !showB); });
  DIRS.forEach(function(d){ project(d.el, d.p, !(step === 0 || step === 2 || step === 6 || step === 8 || document.body.classList.contains('lbl'))); });
  pinEls.forEach(function(p2){ project(p2.el, p2.p, tw < .45); });
  layoutLabels();
  var az0 = Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z); needle.style.transform = 'rotate(' + (az0*180/Math.PI) + 'deg)';
  var us = innerHeight*.9; [FLAME, EMBER, SMOKE, FLASH, TORCH, MIST].forEach(function(P){ P.m.uniforms.uScale.value = us; });
  if (PP){ PP.U.time.value = time; PP.render(); } else renderer.render(scene, camera);
}
function size(){ renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
  if (PP) PP.size(Math.floor(innerWidth*DPR), Math.floor(innerHeight*DPR)); BL.forEach(function(b){ b.el._w = 0; }); }
addEventListener('resize', size); size();

camera.position.set(460, 420, 640); controls.target.set(-40, 0, -20);
go(0, true);
camera.position.set(460, 420, 640); controls.target.set(-40, 0, -20);
var c0 = camFor(0); camFrom.p.copy(camera.position); camFrom.t.copy(controls.target); camTo.p.copy(c0.p); camTo.t.copy(c0.t); camStart = performance.now() + 300; camFly = 0; CAMDUR = 5600;
setTimeout(function(){ CAMDUR = 3400; }, 6500);
applyHF(scene);
document.getElementById('load').classList.add('off');
requestAnimationFrame(frame);
window.W18S = {go: go, step: function(){ return step; }, cam: function(p, t){ userMoved = true; camFly = 1; camera.position.set(p[0], p[1], p[2]); controls.target.set(t[0], t[1], t[2]); controls.update(); }};
})();
