/* Обкладинка головної: костел Іоанна Хрестителя таким, яким його показують світлини 1916 року й 1930-х, — на краю міського
   пагорба над Горинню. Перед фасадом невеличка площа й мурований паркан із брамою; за костелом і праворуч схил спадає до широкої
   ріки з піщаними косами, мокрими луками, очеретами й старицями; за рікою поля, струмок, далі ліс. Ліворуч — плебанія й містечко.
   Підключається після Kostel3D.mount(canvas, {historic: true, ...}):  HeroLand.attach(api, {lite: true/false, shift: 0.17})
   Осі моделі: фасад дивиться на +z (захід), вівтар на −z (схід), −x — північ, +x — південь. Географія — за аерофотознімком. */
(function(){
'use strict';

function attach(api, o){
  o = o || {};
  var T = THREE, scene = api.scene, cam = api.camera, renderer = api.renderer, model = api.model;
  var lite = !!o.lite, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var U = {uTime: {value: 0}, uFogC: {value: new T.Color()}, uFogD: {value: .005}, uSunDir: {value: new T.Vector3(0, 1, 0)}, uHor: {value: new T.Color()}, uGlowW: {value: new T.Color()}, uDeep: {value: new T.Color()}, uGlint: {value: 1}, uNightG: {value: 0}, uIce: {value: 0}, uWSnow: {value: 0}, uAut: {value: 0}};
  function ss(a, b, x){ var t = Math.max(0, Math.min(1, (x - a)/(b - a))); return t*t*(3 - 2*t); }
  function lin(c){ return new T.Color(c).convertSRGBToLinear(); }
  function hash(x, z){ var s = Math.sin(x*127.1 + z*311.7)*43758.5453; return s - Math.floor(s); }
  function vnoise(x, z){ var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz; fx = fx*fx*(3 - 2*fx); fz = fz*fz*(3 - 2*fz);
    var a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1); return a + (b - a)*fx + (c - a)*fz + (a - b - c + d)*fx*fz; }
  function fbm(x, z){ return vnoise(x, z)*.5 + vnoise(x*2.03 + 5.2, z*2.03 + 1.3)*.25 + vnoise(x*4.1 + 2.7, z*4.1 + 8.1)*.125; }

  /* ── the land, traced from the plan of the town (drawn over the aerial photographs) and checked against them: the church on the
     town's hill, its yard and the small square before the front, the big church plot of gardens and orchards behind it; south-east,
     past the gardens, the ground goes down gently and then a little more steeply to the Horyn, some forty metres wide, with trees
     along both banks; beyond it the flat green flood-plain with old channels, hay meadows and fields, and woods on the horizon.
     Distances in metres; the church's front at (0, 0), its middle at (0, −15). Plan pixels → metres by MP(). ── */
  var GX = 0, GZ = -15, MS = 2.5;
  function MP(mx, my){ var dx = mx - 145.4, dy = my - 258; return [(-.167*dx + .986*dy)/MS, -(.986*dx + .167*dy)/MS]; }
  function PM(x, z){ return [145.4 - .167*MS*x - .986*MS*z, 258 + .986*MS*x - .167*MS*z]; }        // back to the plan
  function inPlan(x, z){ var p = PM(x, z); return p[0] > 0 && p[0] < 1338 && p[1] > 0 && p[1] < 613; }
  function poly(list){ return list.map(function(p){ return MP(p[0], p[1]); }); }
  function inPoly(P, x, z){ var c = false; for (var i = 0, j = P.length - 1; i < P.length; j = i++){ var a = P[i], b = P[j];
    if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0])*(z - a[1])/(b[1] - a[1]) + a[0]) c = !c; } return c; }
  /* the Horyn: its middle line from the plan, carried on beyond it both ways */
  var RIV = (function(){
    var raw = [[-700, 1120], [-250, 960], [160, 760], [470, 558], [730, 414], [1000, 270], [1250, 95], [1520, -40], [1880, -170], [2300, -230]];   // the plan's line, smoothed
    var P = raw.map(function(p){ return MP(p[0], p[1]); });
    var c = new T.CatmullRomCurve3(P.map(function(p){ return new T.Vector3(p[0], 0, p[1]); }), false, 'centripetal');
    return c.getSpacedPoints(260).map(function(v){ return [v.x, v.z]; });
  })();
  var RW = 40, PL = -13, WATER = -14.2;
  function rivNear(x, z){                                                            // distance to the river's middle, which side, and where along it
    var best = 1e9, side = 1, at = 0, bi = 1, q;
    for (q = 0; q < RIV.length; q += 8){ var ddx = x - RIV[q][0], ddz = z - RIV[q][1], dd = ddx*ddx + ddz*ddz; if (dd < best){ best = dd; bi = q; } }   // rough, then fine
    best = 1e9;
    for (var i = Math.max(1, bi - 14); i < Math.min(RIV.length, bi + 15); i++){ var a = RIV[i - 1], b = RIV[i], dx = b[0] - a[0], dz = b[1] - a[1], L = dx*dx + dz*dz,
      k = Math.max(0, Math.min(1, ((x - a[0])*dx + (z - a[1])*dz)/L)), ex = x - a[0] - dx*k, ez = z - a[1] - dz*k, d = ex*ex + ez*ez;
      if (d < best){ best = d; side = dx*ez - dz*ex > 0 ? 1 : -1; at = i - 1 + k; } }
    return {d: Math.sqrt(best), side: side, at: at};
  }
  var TOWN = rivNear(GX, GZ).side;                                                   // which side of the river the town is on
  /* old channels and ponds on the far side, a side arm round an island (as on the plan, north-east) */
  var OXB = [[MP(1300, 300), 34, 2.2, 5.0], [MP(900, 760), 30, 3.4, 6.1], [MP(1500, 420), 26, .2, 3.3], [MP(600, 900), 28, 2.6, 5.6]];
  function oxDist(x, z){ var m = 1e9; OXB.forEach(function(o){ var dx = x - o[0][0], dz = z - o[0][1], a = Math.atan2(dz, dx); if (a < o[2]) a += 6.283;
    if (a > o[2] && a < o[3] || a - 6.283 > o[2] && a - 6.283 < o[3]) m = Math.min(m, Math.abs(Math.hypot(dx, dz) - o[1])); }); return m; }
  var POND = {x: -28, z: -115, a: 15, b: 4.6};                                       // the pond in the church plot, with a bank of dug earth round it
  function pondQ(x, z){ return Math.hypot((x - POND.x)/POND.a, (z - POND.z)/POND.b); }
  function townField(x, z){ return !inPoly(PLOT, x, z) && z < -40 && x > -150 && x < 60 && rivNear(x, z).d - RW/2 > 28; }   // strip fields between the plot and the bank
  function H(x, z){
    var R = rivNear(x, z), e = R.d - RW/2, r = Math.hypot(x - GX, z - GZ), h;
    if (R.side === TOWN){
      var bank = .45*ss(0, 30, e) + .55*ss(22, 150, e);                              // a short steeper bank, then the long gentle rise to the town
      h = PL*(1 - bank) + (fbm(x*.017, z*.017) - .5)*1.6*ss(45, 110, r)*ss(10, 40, e);
    } else {
      h = PL + .35 + (fbm(x*.02 + 7, z*.02 + 3) - .5)*.8 - .6*ss(.6, .78, fbm(x*.008 + 20, z*.008 + 4)) + 6*ss(650, 1100, e);
      var od = oxDist(x, z); if (od < 12) h -= 1.9*(1 - ss(3, 10, od));
    }
    if (R.d < RW/2 + 2) h = Math.min(h, PL - 2.8*(1 - ss(RW/2 - 9, RW/2 + 1, R.d)));  // the river bed
    var pq = pondQ(x, z); if (pq < 2.2) h += .7*Math.exp(-Math.pow((pq - 1.35)*3, 2)) - 1.6*(1 - ss(.75, 1.1, pq));
    return h;
  }
  /* the plan's zones: the church plot (gardens and orchard), the yard, the small square, the streets */
  var PLOT = poly([[125, 0], [73, 307], [245, 345], [541, 366], [660, 367], [738, 332], [696, 0]]);
  var YARD = {x0: -25, x1: 23, z0: -48, z1: 22};
  var SQ = poly([[33, 200], [18, 279], [73, 288], [85, 207]]);
  var ROADS = [poly([[64, 0], [54, 50], [44.5, 100], [35, 150], [24.5, 200], [14.5, 250], [6, 300], [1, 350], [-6, 420], [-14, 520]]),
    poly([[-60, 378], [0, 381], [45, 388], [90, 383], [150, 379], [210, 379], [255, 383.5], [285, 393.5], [315, 419], [345, 448.5], [375, 480], [405, 513], [420, 540]]),
    poly([[60, 394.5], [105, 404], [150, 417.5], [195, 434], [240, 453], [262, 463]]),
    poly([[64, 0], [80, -120], [96, -300]]), poly([[24.5, 200], [-120, 180], [-300, 160]]), poly([[-6, 420], [-180, 470], [-360, 520]])];
  function roadD(x, z){ var m = 1e9; ROADS.forEach(function(R){ for (var i = 1; i < R.length; i++){ var a = R[i - 1], b = R[i], dx = b[0] - a[0], dz = b[1] - a[1], L = dx*dx + dz*dz,
    k = Math.max(0, Math.min(1, ((x - a[0])*dx + (z - a[1])*dz)/L)); m = Math.min(m, Math.hypot(a[0] + dx*k - x, a[1] + dz*k - z)); } }); return m; }
  var PLEB = {x: -36, z: -15, len: 12, wid: 8.5};                                    // the sexton's house beside the church on the north, long side parallel to it, porch toward the church
  function keepClear(x, z, m){ m = m || 0;
    return (x > YARD.x0 - 5 - m && x < YARD.x1 + 5 + m && z > YARD.z0 - 6 - m && z < YARD.z1 + 4 + m) || inPoly(SQ, x, z) ||
      (x > PLEB.x - PLEB.wid/2 - 6 - m && x < PLEB.x + PLEB.wid/2 + 5 + m && z > PLEB.z - PLEB.len/2 - 5 - m && z < PLEB.z + PLEB.len/2 + 7 + m); }

  /* houses: every building drawn on the plan, where it stood; beyond the plan the town goes on in the same manner */
  var HOUSES = [], rndH = (function(seed){ return function(){ seed = (seed*16807) % 2147483647; return (seed - 1)/2147483646; }; })(1742);
  [[279.3, 516.3, 73.8, 29.2, -70.0], [223.5, 491.3, 73.9, 29.3, -66.8], [406.0, 461.2, 28.6, 12.0, -36.9], [291.6, 451.3, 15.2, 20.1, -63.4], [176.5, 477.4, 83.1, 25.2, -65.2],
   [452.8, 444.0, 12.2, 47.0, -59.0], [155.9, 451.7, 53.2, 19.2, -63.4], [465.3, 426.8, 8.9, 21.8, -71.6], [368.6, 433.6, 42.3, 11.7, -38.7],
   [227.1, 425.8, 17.4, 9.8, -63.4], [495.9, 419.1, 12.6, 47.1, -73.7], [351.7, 419.1, 39.9, 13.7, -40.6], [161.3, 408.6, 13.6, 23.7, -71.6], [285.1, 410.9, 11.7, 25.8, -51.8],
   [328.7, 406.8, 24.8, 10.8, -40.6], [259.7, 401.2, 16.9, 9.7, -68.2], [433.4, 393.0, 63.1, 13.6, -1.6], [188.5, 391.0, 10.0, 31.0, -90.0], [559.5, 388.4, 10.3, 32.7, -87.1],
   [499.0, 387.0, 12.6, 49.5, -76.0], [201.8, 366.4, 9.6, 21.2, -85.2], [158.5, 366.0, 12.0, 19.0, -90.0], [42.2, 301.1, 22.3, 36.2, -80.0], [67.7, 184.8, 19.6, 31.6, -82.2],
   [63.2, 142.9, 12.4, 19.8, -81.9], [142.3, 106.3, 43.8, 15.6, -79.9], [170.3, 81.6, 12.8, 29.1, -80.5], [5.0, 71.5, 15.0, 10.0, -90.0], [19.7, 35.6, 9.9, 9.0, -76.0], [9.0, 10.9, 16.7, 22.8, -76.0]]
  .forEach(function(b){
    var c = MP(b[0], b[1]), th = b[4]*Math.PI/180, d1 = MP(b[0] + Math.cos(th), b[1] + Math.sin(th)), ux = d1[0] - c[0], uz = d1[1] - c[1];
    var w = b[2]/MS, d = b[3]/MS, a = Math.atan2(uz, ux);
    if (w < d){ var t = w; w = d; d = t; a += Math.PI/2; }                            // the long side along local x
    HOUSES.push({x: c[0], z: c[1], a: a, w: Math.max(5.5, Math.min(w*.62, 11)), d: Math.max(4.5, Math.min(d*.62, 6.5)), h: 2.6 + rndH()*.5, k: rndH(), plan: true});   // the plan draws them generously
  });
  for (var hx = -560; hx < 620; hx += 21) for (var hz = -620; hz < 420; hz += 21){
    var px = hx + (rndH() - .5)*10, pz = hz + (rndH() - .5)*10;
    if (rndH() > .22 || inPlan(px, pz) || inPoly(PLOT, px, pz) || keepClear(px, pz, 6)) continue;
    var Rr = rivNear(px, pz); if (Rr.side !== TOWN || Rr.d < RW/2 + 26 || Math.hypot(px - GX, pz - GZ) > 400) continue;
    HOUSES.push({x: px, z: pz, a: (rndH() < .5 ? 0 : Math.PI/2) + .17 + (rndH() - .5)*.2, w: 7 + rndH()*3, d: 5 + rndH()*1.5, h: 2.6 + rndH()*.5, k: rndH()});
  }

  /* trees: the town is full of them, thickest along the banks; an orchard in rows on the church plot; willows on the far bank,
     clumps and hedges on the flood-plain, woods on the horizon */
  function forest(x, z){
    var R = rivNear(x, z), e = R.d - RW/2, f = 0, r = Math.hypot(x - GX, z - GZ);
    if (e < 2) return 0;
    if (R.side === TOWN){
      f = .55*ss(.45, .7, fbm(x*.022 + 3, z*.022 + 8));                               // groups of trees round the yards, open ground between
      if (e < 22) f = .85;                                                             // the belt along the bank
      if (inPoly(PLOT, x, z)) f = 0;                                                   // the orchard is planted in rows
      if (r > 650) f = .7;
    } else {
      f = e < 14 ? .8 : .95*ss(.5, .6, fbm(x*.011 + 2, z*.011 + 7));             // groves of willow and alder on the meadows, open hay between
      var wet = ss(.66, .76, fbm(x*.008 + 20, z*.008 + 4)); f = Math.max(f, .5*wet);
      if (oxDist(x, z) < 12) f = Math.max(f, .6);
      if (e > 640) f = Math.max(f, .85*ss(640, 720, e));                              // the woods on the horizon
    }
    var rd = roadD(x, z); if (R.side === TOWN && rd > 5 && rd < 10 && Math.hypot(x - GX, z - GZ) < 320) f = Math.max(f, .45);   // trees along the lanes
    if (rd < 5 || keepClear(x, z, 3) || pondQ(x, z) < 1.7 || (R.side === TOWN && townField(x, z))) f = 0;
    return Math.min(1, f);
  }

  /* ── terrain mesh with painted zones ── */
  var SIZE = 2400, SEG = lite ? 200 : 340, CX = 100, CZ = -200;
  var tg = new T.PlaneGeometry(SIZE, SIZE, SEG, SEG); tg.rotateX(-Math.PI/2); tg.translate(CX, 0, CZ);
  var tp = tg.attributes.position, col = new Float32Array(tp.count*3), fld = new Float32Array(tp.count), C = new T.Color();
  var cTown = lin('#62763a'), cGard = lin('#7a6b47'), cOrch = lin('#6c8040'), cMead = lin('#6f8c3c'), cMeadY = lin('#94983f'), cMud = lin('#6b5f43'), cFloor = lin('#465230'),
      cField = [lin('#a3954f'), lin('#7c8b42'), lin('#b8a462'), lin('#86904a'), lin('#6e7d3d')], cRoad = lin('#8a7652'), cWet = lin('#4a5c33'), cReed = lin('#7f8a4a'), cSand = lin('#c9b78a');
  for (var i = 0; i < tp.count; i++){
    var x = tp.getX(i), z = tp.getZ(i), h = H(x, z); tp.setY(i, h);
    var R = rivNear(x, z), e = R.d - RW/2, n = fbm(x*.08, z*.08);
    if (R.side === TOWN){
      C.copy(cTown);
      if (inPoly(PLOT, x, z)) C.copy(cOrch).lerp(cGard, .2*ss(.5, .7, fbm(x*.03, z*.03)));
      else if (townField(x, z)){ var kf = Math.floor(hash(Math.floor((z + 3000)/14), Math.floor((x + 3000)/90))*5); C.copy(cField[kf]); fld[i] = 1; }
      else if (hash(Math.floor((x + 2000)/24), Math.floor((z + 2000)/30)) > .6 && Math.hypot(x - GX, z - GZ) > 60) C.lerp(cGard, .35);
    } else {
      C.copy(cMead).lerp(cMeadY, ss(.45, .8, n)*.5); C.lerp(cWet, ss(.55, .75, fbm(x*.008 + 20, z*.008 + 4))*.8);
      if (e > 60 && e < 650 && fbm(x*.004 + 9, z*.004 + 1) > .52){ var k = Math.floor(hash(Math.floor((x + 3000)/26), Math.floor((z + 3000)/120))*5); C.lerp(cField[k], .85); fld[i] = 1; }
      C.lerp(cReed, (1 - ss(4, 16, oxDist(x, z)))*.7);
    }
    if (e < 6 && e > -4) C.lerp(R.side === TOWN ? cMud : cSand, .7*(1 - ss(2, 6, e)));
    var pq2 = pondQ(x, z); if (pq2 < 1.6) C.lerp(cMud, .5*(1 - ss(1.1, 1.6, pq2)));
    var fr = forest(x, z); C.lerp(cFloor, ss(.45, .8, fr)*.6);
    if (roadD(x, z) < 3.4) C.copy(cRoad).multiplyScalar(.92 + .16*n);
    C.multiplyScalar(.86 + .28*n);
    col[i*3] = C.r; col[i*3 + 1] = C.g; col[i*3 + 2] = C.b;
  }
  tg.setAttribute('color', new T.BufferAttribute(col, 3)); tg.setAttribute('aField', new T.BufferAttribute(fld, 1)); tg.computeVertexNormals();
  var terrM = new T.MeshStandardMaterial({vertexColors: true, roughness: 1});
  /* surface detail: grass tussocks, bare patches and furrows drawn from world position, fading with distance */
  terrM.userData.noSnow = true;
  terrM.onBeforeCompile = function(sh){
    sh.uniforms.uWSnow = U.uWSnow; sh.uniforms.uAut = U.uAut;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vTW;\nattribute float aField;\nvarying float vField;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvTW = (modelMatrix*vec4(transformed, 1.0)).xyz; vField = aField;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vTW;\nvarying float vField;\nuniform float uWSnow, uAut;\nfloat th(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }\nfloat tn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f); return mix(mix(th(i), th(i + vec2(1, 0)), f.x), mix(th(i + vec2(0, 1)), th(i + vec2(1, 1)), f.x), f.y); }')
      .replace('#include <color_fragment>', ['#include <color_fragment>',
        'float dd = length(vTW - cameraPosition), fd = 1.0 - smoothstep(60.0, 260.0, dd);',
        'float g1 = tn(vTW.xz*1.7), g2 = tn(vTW.xz*6.3 + 3.1), g3 = tn(vTW.xz*.33 + 7.7);',
        'float tuft = (g1*.6 + g2*.4 - .5)*.34*fd + (g3 - .5)*.22;',
        'diffuseColor.rgb *= 1.0 + tuft;',
        'diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb*vec3(1.12, 1.05, .78), smoothstep(.62, .82, g3)*.5);',      // drier, yellower patches
        'float fur = abs(sin(vTW.z*1.1 + tn(vTW.xz*.05)*4.0));',
        'float field = smoothstep(.5, .9, vField);',
        'diffuseColor.rgb *= mix(1.0, .86 + .2*fur, field*(1.0 - smoothstep(250.0, 900.0, dd)));',      // furrows in the fields
        /* autumn: the grass goes to straw and rust; winter: snow lies everywhere but thins in the furrows and under the trees */
        'diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb*vec3(1.42, 1.0, .5) + vec3(.014, .004, 0.0), uAut*(.68 + .32*g3));',
        'float snw = uWSnow*smoothstep(.12, .42, g1*.45 + g3*.55 + .12 - field*fur*.12);',
        'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.80, .83, .88)*(.93 + .1*g2), snw);'].join('\n'));
  };
  var terrain = new T.Mesh(tg, terrM); terrain.receiveShadow = true; scene.add(terrain);

  /* the model's own ground disc gives way to the land */
  scene.children.forEach(function(c){ if (c.isMesh && c.geometry && c.geometry.type === 'CircleGeometry' && c.geometry.parameters.radius > 40) c.visible = false; });

  /* ── round the church, painted onto a skin that follows the ground: the yard's grass, the stone path from the gate to the portal and
     gravel round the church, the small trodden square, the streets, the plebania's yard, and the beds and orchard grass of the plot ── */
  (function(){
    var S = 210, N = lite ? 120 : 190, CW = 2048, cv = document.createElement('canvas'); cv.width = cv.height = CW;
    var K = cv.getContext('2d'), px = CW/S, ox = -22, oz = -34;
    function X(x){ return (x - ox)*px + CW/2; } function Z(z){ return (z - oz)*px + CW/2; }
    function rect(x0, z0, x1, z1, c){ K.fillStyle = c; K.fillRect(X(x0), Z(z0), (x1 - x0)*px, (z1 - z0)*px); }
    function shape(P, c){ K.fillStyle = c; K.beginPath(); P.forEach(function(p, i){ i ? K.lineTo(X(p[0]), Z(p[1])) : K.moveTo(X(p[0]), Z(p[1])); }); K.closePath(); K.fill(); }
    function speck(x0, z0, x1, z1, cols, n, r, test){ for (var i = 0; i < n; i++){ var x = x0 + Math.random()*(x1 - x0), z = z0 + Math.random()*(z1 - z0); if (test && !test(x, z)) continue;
      K.fillStyle = cols[i % cols.length]; K.globalAlpha = .35 + Math.random()*.4;
      K.beginPath(); K.ellipse(X(x), Z(z), r*px*(.6 + Math.random()), r*px*(.4 + Math.random()*.6), Math.random()*3, 0, 6.283); K.fill(); } K.globalAlpha = 1; }
    /* vegetable beds on the church plot, in a few blocks near the buildings */
    [[-60, -40, 16, 22], [-48, -66, 20, 14], [-30, -70, 14, 18]].forEach(function(b){
      for (var k = 0; k < b[2]; k += 1.4) rect(b[0] + k, b[1], b[0] + k + .8, b[1] + b[3], k % 2.8 < 1.4 ? 'rgba(122,104,70,.85)' : 'rgba(104,92,60,.75)'); });
    /* streets */
    K.lineCap = K.lineJoin = 'round';
    ROADS.forEach(function(R){ K.strokeStyle = 'rgba(120,100,70,.5)'; K.lineWidth = 7.4*px; K.beginPath(); R.forEach(function(p, i){ i ? K.lineTo(X(p[0]), Z(p[1])) : K.moveTo(X(p[0]), Z(p[1])); }); K.stroke();
      K.strokeStyle = '#8f7b58'; K.lineWidth = 6*px; K.stroke(); });
    /* the plebania's yard and the path to its porch */
    rect(PLEB.x - 9, PLEB.z - 14, PLEB.x + 8, PLEB.z + 14, 'rgba(104,120,62,.6)');
    rect(PLEB.x + PLEB.wid/2 + 1.4, PLEB.z - 1.2, PLEB.x + PLEB.wid/2 + 3.2, YARD.z1 + 6, '#9a8a6c');
    K.save(); K.globalCompositeOperation = 'destination-in';                          // soft outer edge
    var rg = K.createRadialGradient(CW/2, CW/2, CW*.4, CW/2, CW/2, CW*.5); rg.addColorStop(0, '#000'); rg.addColorStop(1, 'rgba(0,0,0,0)'); K.fillStyle = rg; K.fillRect(0, 0, CW, CW); K.restore();
    var g = new T.PlaneGeometry(S, S, N, N); g.rotateX(-Math.PI/2); g.translate(ox, 0, oz);
    var p = g.attributes.position; for (var j = 0; j < p.count; j++) p.setY(j, H(p.getX(j), p.getZ(j)) + .05);
    g.computeVertexNormals();
    var tx = new T.CanvasTexture(cv); tx.encoding = T.sRGBEncoding; tx.anisotropy = 8;
    var m = new T.Mesh(g, new T.MeshStandardMaterial({map: tx, transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2}));
    m.receiveShadow = true; m.renderOrder = 1; scene.add(m);
  })();

  /* ── water: the Horyn, the stream and the old bends; ripples drift downstream, the sky glints off them ── */
  var waterM = new T.ShaderMaterial({
    transparent: true, depthWrite: false, side: T.DoubleSide,
    uniforms: {uTime: U.uTime, uFlow: {value: 1}, uFogC: U.uFogC, uFogD: U.uFogD, uSun: U.uSunDir, uSkyW: U.uHor, uWarmW: U.uGlowW, uDeep: U.uDeep, uGlint: U.uGlint, uIce: U.uIce},
    vertexShader: 'varying vec2 vUv; varying vec3 vW; varying float vD; void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix*w; vD = -mv.z; gl_Position = projectionMatrix*mv; }',
    fragmentShader: [
      'uniform float uTime, uFlow, uFogD, uGlint, uIce; uniform vec3 uFogC, uSun, uSkyW, uWarmW, uDeep; varying vec2 vUv; varying vec3 vW; varying float vD;',
      'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }',
      'float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }',
      'void main(){',
      '  vec2 q = vW.xz*vec2(.35, .12) + vec2(0.0, uTime*.55*uFlow);',
      '  float r = n(q) + .5*n(q*2.3 + vec2(uTime*.2, uTime*.9*uFlow)) + .25*n(q*5.1 - vec2(0.0, uTime*1.4*uFlow));',
      '  vec3 V = normalize(cameraPosition - vW); float fr = pow(1.0 - max(V.y, 0.0), 3.0);',
      '  vec3 deep = uDeep, sky = uSkyW, warm = uWarmW;',
      '  float rip = smoothstep(.95, 1.45, r);',
      '  vec3 c = mix(deep, sky, .08 + .62*fr);',
      '  c = mix(c, warm, rip*(.25 + .5*fr)*.3);',                                     // ripples catch the evening sky
      '  c *= .85 + .3*n(vW.xz*.05 + vec2(0.0, uTime*.05));',
      '  vec3 Rf = reflect(-V, normalize(vec3((r - .9)*.25, 1.0, (n(q*1.7) - .5)*.25))); float g = pow(max(dot(Rf, uSun), 0.0), 60.0);',
      '  c += warm*g*1.6*uGlint*(1.0 - uIce*.7);',
      '  vec3 ice = mix(vec3(.46, .54, .6), sky, .35)*(.82 + .3*n(vW.xz*.4)) + vec3(.1)*smoothstep(.55, .9, n(vW.xz*.9));',     // winter: grey-blue ice, dusted with snow
      '  c = mix(c, ice, uIce);',
      '  float edge = smoothstep(0.0, .14, vUv.x)*smoothstep(1.0, .86, vUv.x);',
      '  float fogf = 1.0 - exp(-uFogD*uFogD*vD*vD);',
      '  gl_FragColor = vec4(mix(c, uFogC, fogf), mix((.78 + .2*fr)*edge, edge, uIce));',
      '  #include <encodings_fragment>',
      '}'].join('\n')
  });
  /* ── the churchyard and the square, finely painted: mown grass darker under the walls and the fence, a paved apron before the
     facade and a stone path from the gate, gravel walks round the church edged with stones, flower beds by the portal; the square
     cobbled, worn to earth in the middle where the carts stand ── */
  (function(){
    var x0 = -34, x1 = 34, z0 = -58, z1 = 54, CW = lite ? 1536 : 2048, CH = Math.round(CW*(z1 - z0)/(x1 - x0)), cv = document.createElement('canvas'); cv.width = CW; cv.height = CH;
    var K = cv.getContext('2d'), px = CW/(x1 - x0);
    function X(x){ return (x - x0)*px; } function Z(z){ return (z - z0)*px; }
    function rect(a, b, c, d, col){ K.fillStyle = col; K.fillRect(X(a), Z(b), (c - a)*px, (d - b)*px); }
    function dots(a, b, c, d, cols, n, r, test){ for (var i = 0; i < n; i++){ var x = a + Math.random()*(c - a), z = b + Math.random()*(d - b); if (test && !test(x, z)) continue;
      K.fillStyle = cols[i % cols.length]; K.globalAlpha = .3 + Math.random()*.5; K.beginPath(); K.ellipse(X(x), Z(z), r*px*(.5 + Math.random()), r*px*(.4 + Math.random()*.6), Math.random()*3, 0, 6.283); K.fill(); } K.globalAlpha = 1; }
    function stones(a, b, c, d, sz, cols, mortar){ rect(a, b, c, d, mortar);
      for (var z = b; z < d; z += sz*.9) for (var x = a + (Math.round((z - b)/(sz*.9)) % 2)*sz*.45; x < c; x += sz){
        K.fillStyle = cols[Math.floor(Math.random()*cols.length)]; K.beginPath(); K.ellipse(X(x + sz*.45), Z(z + sz*.42), sz*.42*px*(.85 + Math.random()*.2), sz*.38*px*(.85 + Math.random()*.2), Math.random(), 0, 6.283); K.fill(); } }
    /* the square: cobbles, a worn earthen middle with ruts, grass at the edges */
    K.save(); K.beginPath(); SQ.forEach(function(p, i){ i ? K.lineTo(X(p[0]), Z(p[1])) : K.moveTo(X(p[0]), Z(p[1])); }); K.closePath(); K.clip();
    stones(-30, 20, 30, 54, .32, ['#a39a88', '#8f8676', '#b3aa96', '#7f786a', '#9c9282'], '#6e665a');
    var g0 = K.createRadialGradient(X(1), Z(38), 0, X(1), Z(38), 13*px); g0.addColorStop(0, 'rgba(140,118,86,.92)'); g0.addColorStop(.7, 'rgba(140,118,86,.55)'); g0.addColorStop(1, 'rgba(140,118,86,0)');
    K.fillStyle = g0; K.fillRect(0, 0, CW, CH);
    K.strokeStyle = 'rgba(80,64,44,.45)'; K.lineWidth = .28*px; [[-1.9, 0], [-.6, 0], [1.4, 1], [2.7, 1]].forEach(function(q){ K.beginPath(); K.moveTo(X(-18), Z(46 + q[0])); K.bezierCurveTo(X(-4), Z(40 + q[0]), X(4), Z(33 + q[0]), X(19), Z(27 + q[0])); K.stroke(); });
    K.restore();
    /* the churchyard */
    rect(YARD.x0, YARD.z0, YARD.x1, YARD.z1, '#5f7437');
    for (var i = 0; i < 30; i++) rect(YARD.x0 + i*(YARD.x1 - YARD.x0)/30, YARD.z0, YARD.x0 + (i + .5)*(YARD.x1 - YARD.x0)/30, YARD.z1, 'rgba(240,255,200,.035)');   // mowing
    dots(YARD.x0, YARD.z0, YARD.x1, YARD.z1, ['#4e6330', '#6b8040', '#7d8f4a', '#56703a'], 9000, .16);
    dots(YARD.x0, YARD.z0, YARD.x1, YARD.z1, ['#f2efe0', '#e6d27a', '#c9b6d8'], 700, .05);   // daisies, buttercups
    ['x0', 'x1'].forEach(function(e){ var gx = YARD[e], gr = K.createLinearGradient(X(gx), 0, X(gx + (e === 'x0' ? 2.5 : -2.5)), 0); gr.addColorStop(0, 'rgba(30,40,18,.35)'); gr.addColorStop(1, 'rgba(30,40,18,0)'); K.fillStyle = gr; K.fillRect(Math.min(X(gx), X(gx + (e === 'x0' ? 2.5 : -2.5))), Z(YARD.z0), 2.5*px, (YARD.z1 - YARD.z0)*px); });
    /* gravel walks round the church, edged with stones */
    function walk(a, b, c, d){ rect(a, b, c, d, '#b5aa92'); dots(a, b, c, d, ['#a0957e', '#c8bea6', '#8f8570'], Math.round((c - a)*(d - b)*14), .07);
      K.strokeStyle = '#8a8374'; K.lineWidth = .14*px; K.strokeRect(X(a), Z(b), (c - a)*px, (d - b)*px); }
    walk(-13.9, -33.2, -11.6, 1); walk(11.6, -33.2, 13.9, 1); walk(-13.9, -33.2, 13.9, -30.9);
    stones(-14, .6, 14, 3.2, .45, ['#b8b0a0', '#a69e8e', '#c4bcaa'], '#8d8676');                              // the apron before the facade
    stones(-1.8, 3.2, 1.8, YARD.z1 + .3, .45, ['#b8b0a0', '#a69e8e', '#c4bcaa'], '#8d8676');                 // the path from the gate
    [-1, 1].forEach(function(sd){ var bx = sd*4.6; rect(Math.min(bx, bx + sd*3.2), 3.6, Math.max(bx, bx + sd*3.2), 7.2, '#5a4632');   // flower beds by the portal
      dots(Math.min(bx, bx + sd*3.2), 3.6, Math.max(bx, bx + sd*3.2), 7.2, ['#c9563f', '#e3c26a', '#efe6d4', '#b8506e', '#5f7a3a'], 260, .12); });
    var g = new T.PlaneGeometry(x1 - x0, z1 - z0, lite ? 60 : 90, lite ? 100 : 150); g.rotateX(-Math.PI/2); g.translate((x0 + x1)/2, 0, (z0 + z1)/2);
    var p = g.attributes.position; for (var j = 0; j < p.count; j++) p.setY(j, H(p.getX(j), p.getZ(j)) + .07);
    g.computeVertexNormals();
    var tx = new T.CanvasTexture(cv); tx.encoding = T.sRGBEncoding; tx.anisotropy = 8;
    var mask = document.createElement('canvas'); mask.width = CW >> 2; mask.height = CH >> 2; var MK = mask.getContext('2d'); MK.fillStyle = '#000'; MK.fillRect(0, 0, mask.width, mask.height);
    MK.fillStyle = '#fff'; MK.beginPath(); SQ.forEach(function(q, i){ var a = X(q[0])/4, b = Z(q[1])/4; i ? MK.lineTo(a, b) : MK.moveTo(a, b); }); MK.closePath(); MK.fill();
    MK.fillRect(X(YARD.x0)/4, Z(YARD.z0)/4, (YARD.x1 - YARD.x0)*px/4, (YARD.z1 - YARD.z0)*px/4); MK.fillRect(X(-8)/4, Z(YARD.z1)/4, 16*px/4, 6*px/4);
    var mt = new T.CanvasTexture(mask);
    var m = new T.Mesh(g, new T.MeshStandardMaterial({map: tx, alphaMap: mt, transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3}));
    m.receiveShadow = true; m.renderOrder = 1; scene.add(m);
  })();

  /* the Horyn: a ribbon along its middle line; still water in the old channels on the far side */
  (function(){
    var pos = [], uv = [], idx = [], n = RIV.length, W = RW + 6;
    for (var i = 0; i < n; i++){
      var a = RIV[Math.max(0, i - 1)], b = RIV[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), nx = -dz/L, nz = dx/L, p = RIV[i];
      pos.push(p[0] - nx*W/2, WATER, p[1] - nz*W/2, p[0] + nx*W/2, WATER, p[1] + nz*W/2); uv.push(0, i/(n - 1), 1, i/(n - 1));
      if (i) idx.push(2*i - 2, 2*i - 1, 2*i, 2*i - 1, 2*i + 1, 2*i);
    }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    var m = new T.Mesh(g, waterM); m.renderOrder = 2; scene.add(m);
    var pm = waterM.clone(); pm.uniforms = Object.assign({}, waterM.uniforms, {uFlow: {value: .05}});
    var pg = new T.CircleGeometry(1, 40); pg.rotateX(-Math.PI/2); var pu = pg.attributes.uv, pp = pg.attributes.position;
    for (var q = 0; q < pu.count; q++) pu.setX(q, .5 - .5*Math.hypot(pp.getX(q), pp.getZ(q)));
    var pond = new T.Mesh(pg, pm); pond.scale.set(POND.a*1.02, 1, POND.b*1.02); pond.position.set(POND.x, H(POND.x + POND.a*2.4, POND.z) - .75, POND.z); pond.renderOrder = 2; scene.add(pond);
    OXB.forEach(function(o){
      var segs = 64, W2 = 13, P = [], U = [], I = [];
      for (var k = 0; k <= segs; k++){ var an = o[2] + (o[3] - o[2])*k/segs, w = W2*(.35 + .65*Math.sin(Math.PI*k/segs)), ca = Math.cos(an), sa = Math.sin(an);
        P.push(o[0][0] + ca*(o[1] - w/2), WATER + .55, o[0][1] + sa*(o[1] - w/2), o[0][0] + ca*(o[1] + w/2), WATER + .55, o[0][1] + sa*(o[1] + w/2)); U.push(0, k/segs, 1, k/segs);
        if (k) I.push(2*k - 2, 2*k - 1, 2*k, 2*k - 1, 2*k + 1, 2*k); }
      var g2 = new T.BufferGeometry(); g2.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g2.setAttribute('uv', new T.Float32BufferAttribute(U, 2)); g2.setIndex(I);
      var m2 = new T.Mesh(g2, pm); m2.renderOrder = 2; scene.add(m2);
    });
  })();

  /* ── a batch: many plain parts merged into one mesh with vertex colours (the town would be hundreds of draw calls otherwise) ── */
  function Batch(){ this.P = []; this.N = []; this.C = []; }
  Batch.prototype.add = function(geo, mtx, colr){
    var g = geo.index ? geo.toNonIndexed() : geo.clone(); g.applyMatrix4(mtx); if (!g.attributes.normal) g.computeVertexNormals();
    var n = g.attributes.position.count, c = new Float32Array(n*3); for (var i = 0; i < n; i++){ c[i*3] = colr.r; c[i*3 + 1] = colr.g; c[i*3 + 2] = colr.b; }
    this.P.push(g.attributes.position.array); this.N.push(g.attributes.normal.array); this.C.push(c); g.dispose();
  };
  Batch.prototype.mesh = function(mat){
    function cat(L){ var len = 0; L.forEach(function(a){ len += a.length; }); var o = new Float32Array(len), k = 0; L.forEach(function(a){ o.set(a, k); k += a.length; }); return o; }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(cat(this.P), 3)); g.setAttribute('normal', new T.BufferAttribute(cat(this.N), 3)); g.setAttribute('color', new T.BufferAttribute(cat(this.C), 3));
    var m = new T.Mesh(g, mat); m.castShadow = m.receiveShadow = true; scene.add(m); return m;
  };
  var M4 = new T.Matrix4(), Q = new T.Quaternion(), E = new T.Euler(), V1 = new T.Vector3(), V2 = new T.Vector3();
  function mtx(x, y, z, ry, sx, sy, sz){ return new T.Matrix4().compose(V1.set(x, y, z), Q.setFromEuler(E.set(0, ry || 0, 0)), V2.set(sx || 1, sy || 1, sz || 1)); }
  var BOX = new T.BoxGeometry(1, 1, 1);
  function hipGeo(){ var g = new T.ConeGeometry(Math.SQRT1_2, 1, 4, 1); g.rotateY(Math.PI/4); g.translate(0, .5, 0); return g; }
  function gableGeo(){ var s = new T.Shape([new T.Vector2(-.5, 0), new T.Vector2(.5, 0), new T.Vector2(0, 1)]); var g = new T.ExtrudeGeometry(s, {depth: 1, bevelEnabled: false}); g.translate(0, 0, -.5); return g; }
  var HIP = hipGeo(), GAB = gableGeo();

  var M4 = new T.Matrix4(), Q = new T.Quaternion(), E = new T.Euler(), V1 = new T.Vector3(), V2 = new T.Vector3();
  function mtx(x, y, z, ry, sx, sy, sz){ return new T.Matrix4().compose(V1.set(x, y, z), Q.setFromEuler(E.set(0, ry || 0, 0)), V2.set(sx || 1, sy || 1, sz || 1)); }
  function mtxE(x, y, z, rx, ry, rz, sx, sy, sz){ return new T.Matrix4().compose(V1.set(x, y, z), Q.setFromEuler(E.set(rx, ry, rz, 'YXZ')), V2.set(sx || 1, sy || 1, sz || 1)); }
  var BOX = new T.BoxGeometry(1, 1, 1);
  function hipGeo(){ var g = new T.ConeGeometry(Math.SQRT1_2, 1, 4, 1); g.rotateY(Math.PI/4); g.translate(0, .5, 0); return g; }
  function gableGeo(){ var s = new T.Shape([new T.Vector2(-.5, 0), new T.Vector2(.5, 0), new T.Vector2(0, 1)]); var g = new T.ExtrudeGeometry(s, {depth: 1, bevelEnabled: false}); g.translate(0, 0, -.5); return g; }
  var HIP = hipGeo(), GAB = gableGeo();

  /* ── the town: Polesian houses of logs under thatch or shingle, low, with small windows in white frames, mostly hidden in their gardens ── */
  (function(){
    var walls = new Batch(), roofs = new Batch(), trims = new Batch(), WALL = ['#8c7354', '#7d6649', '#98805c', '#73604a', '#9c8664'].map(lin), ROOF = ['#a8956a', '#9a8862', '#8a8068', '#7c766a', '#a3916a'].map(lin);
    var dark = lin('#1f1c19'), trimC = lin('#e8e2d4'), board = lin('#5a4834');
    HOUSES.forEach(function(q){
      var y = H(q.x, q.z), wc = WALL[Math.floor(q.k*WALL.length)], rc = ROOF[Math.floor(hash(q.x, q.z)*ROOF.length)], w = Math.min(q.w, 10), d = Math.min(q.d, 6.2), hh = 2.5;
      walls.add(BOX, mtx(q.x, y + hh/2 - .35, q.z, -q.a, w, hh + .7, d), wc);
      var hip = q.k < .6, rh = d*(hip ? .72 : .78);                                    // steep roofs, mostly hipped thatch
      if (hip) roofs.add(HIP, mtx(q.x, y + hh - .4, q.z, -q.a, w*1.16, rh, d*1.26), rc);
      else { roofs.add(GAB, mtx(q.x, y + hh - .4, q.z, -q.a + Math.PI/2, d*1.22, rh, w*1.1), rc);
        [-1, 1].forEach(function(sd){ var lx = sd*(w/2 + .02); trims.add(GAB, mtx(q.x + lx*Math.cos(-q.a), y + hh - .38, q.z - lx*Math.sin(-q.a), -q.a + Math.PI/2, d*.98, rh*.9, .05), board); }); }
      var ca = Math.cos(-q.a), sa = Math.sin(-q.a), nwin = Math.max(1, Math.round(w/3.4) - 1);
      [-1, 1].forEach(function(side){ for (var k = 0; k < nwin; k++){ var lx = (k - (nwin - 1)/2)*w/(nwin + .4), lz = side*(d/2 + .02);
        trims.add(BOX, mtx(q.x + lx*ca + lz*sa, y + hh*.52, q.z - lx*sa + lz*ca, -q.a, .85, .95, .07), trimC);
        trims.add(BOX, mtx(q.x + lx*ca + (lz + side*.03)*sa, y + hh*.52, q.z - lx*sa + (lz + side*.03)*ca, -q.a, .6, .72, .05), dark); } });
      if (q.k > .25) trims.add(BOX, mtx(q.x + w*.18*ca, y + hh + rh*.62, q.z - w*.18*sa, -q.a, .5, 1.3, .5), lin('#8a8070'));   // a chimney of clay
    });
    /* logs: a groove every 22 cm, each log its own shade; thatch: combed straw, darker in the courses */
    var wm = new T.MeshStandardMaterial({vertexColors: true, roughness: .95});
    wm.onBeforeCompile = function(sh){
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLW;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvLW = (modelMatrix*vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vLW;\nfloat lh(float n){ return fract(sin(n)*43758.5453); }')
        .replace('#include <color_fragment>', '#include <color_fragment>\nfloat lc = vLW.y/.22, lr = floor(lc), lv = fract(lc);\ndiffuseColor.rgb *= (.62 + .38*sin(lv*3.14159))*(.86 + .26*lh(lr*7.1 + floor(vLW.x*.2 + vLW.z*.2)));');
    };
    wm.customProgramCacheKey = function(){ return 'logs'; };
    var rm = new T.MeshStandardMaterial({vertexColors: true, roughness: .95, flatShading: true});
    rm.onBeforeCompile = function(sh){
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vRW;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvRW = (modelMatrix*vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vRW;\nfloat rh2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }')
        .replace('#include <color_fragment>', '#include <color_fragment>\nfloat st = rh2(floor(vec2(vRW.x*9.0 + vRW.z*9.0, vRW.y*1.2)));\nfloat course = fract(vRW.y/.55);\ndiffuseColor.rgb *= (.8 + .3*st)*(.78 + .22*smoothstep(0.0, .3, course));');
    };
    rm.customProgramCacheKey = function(){ return 'thatch'; };
    walls.mesh(wm); roofs.mesh(rm); trims.mesh(new T.MeshStandardMaterial({vertexColors: true, roughness: .85}));
  })();

  /* ── a few peasant carts by the gate, as on the photograph of the square: a four-wheeled cart with ladder sides on spoked wheels,
     the horse in the shafts under its wooden arch ── */
  (function(){
    var wb = new Batch(), wood = lin('#6e5638'), wood2 = lin('#57442c'), iron = lin('#2c2824'), cloth = [lin('#e7e0cf'), lin('#c9b48a')], HC = [lin('#5a3a26'), lin('#3b2a1e'), lin('#8a6a48'), lin('#6b5a4a')];
    var rim = new T.TorusGeometry(1, .07, 5, 18), CAP = function(r, l){ return new T.CapsuleGeometry(r, l, 3, 8); };
    var legG = CAP(.07, .78), bodyG = CAP(.36, .95), neckG = CAP(.17, .62), headG = CAP(.12, .42), tailG = CAP(.06, .5);
    function cart(x, z, a, horse, load){
      var y0 = H(x, z), ca = Math.cos(a), sa = Math.sin(a);
      function P(lx, ly, lz){ return [x + lx*ca + lz*sa, y0 + ly, z - lx*sa + lz*ca]; }
      function put(geo, lx, ly, lz, rx, ry, rz, sx, sy, sz, c){ var q = P(lx, ly, lz); wb.add(geo, mtxE(q[0], q[1], q[2], rx || 0, a + (ry || 0), rz || 0, sx, sy, sz), c); }
      put(BOX, 0, .92, 0, 0, 0, 0, .9, .1, 2.9, wood);                                  // the floor
      [-1, 1].forEach(function(sd){                                                     // ladder sides leaning outward
        put(BOX, sd*.62, 1.32, 0, 0, 0, -sd*.35, .07, .07, 3.2, wood2);
        for (var k = -5; k <= 5; k++) put(BOX, sd*.54, 1.12, k*.28, 0, 0, -sd*.35, .04, .46, .04, wood);
      });
      [[-1.05, .36], [1.0, .45]].forEach(function(w){ [-1, 1].forEach(function(sd){             // wheels: rim, spokes, hub
        put(rim, sd*.72, w[1], w[0], 0, Math.PI/2, 0, w[1], w[1], 1, iron);
        for (var s = 0; s < 6; s++) put(BOX, sd*.72, w[1], w[0], s*Math.PI/6, 0, 0, .04, w[1]*1.9, .04, wood2);
        put(BOX, sd*.72, w[1], w[0], 0, 0, 0, .16, .16, .16, iron); }); put(BOX, 0, w[1], w[0], 0, 0, 0, 1.5, .08, .08, wood2); });
      if (load) put(BOX, 0, 1.3, -.2, 0, 0, 0, .95, .55, 1.9, cloth[load - 1]);         // a load under a sheet
      [-1, 1].forEach(function(sd){ put(BOX, sd*.36, .95, 2.45, -.05, 0, 0, .06, .06, 2.4, wood2); });   // the shafts
      if (!horse) return;
      var hc = HC[Math.floor(hash(x, z)*HC.length)], hz = 3.0;
      put(bodyG, 0, 1.28, hz, Math.PI/2, 0, 0, 1, 1, 1, hc);
      put(neckG, 0, 1.72, hz + .82, .75, 0, 0, 1, 1, 1, hc);
      put(headG, 0, 1.92, hz + 1.34, 2.3, 0, 0, 1, 1, 1, hc);
      [[-.07, 2.16, hz + 1.16], [.07, 2.16, hz + 1.16]].forEach(function(e){ put(BOX, e[0], e[1], e[2], 0, 0, 0, .05, .14, .05, hc); });
      put(BOX, 0, 1.84, hz + .74, .75, 0, 0, .06, .7, .16, lin('#1e1712'));             // the mane
      [[-.17, .52], [.17, .52], [-.17, -.5], [.17, -.5]].forEach(function(l){ put(legG, l[0], .5, hz + l[1], 0, 0, 0, 1, 1, 1, hc); });
      put(tailG, 0, 1.08, hz - .86, .5, 0, 0, 1, 1, 1, lin('#1e1712'));
      var arc = new T.TorusGeometry(.48, .045, 5, 12, Math.PI); put(arc, 0, 1.5, hz + .58, 0, 0, 0, 1, 1, 1, wood);   // the arch over the collar
      put(new T.TorusGeometry(.22, .06, 5, 10), 0, 1.58, hz + .64, -.82, 0, 0, 1, 1, 1, lin('#2a1e14'));                    // the collar
    }
    cart(5, 35, .35, true, 1); cart(-6, 43, 1.75, true, 0); cart(13, 29, -.5, false, 2);
    wb.mesh(new T.MeshStandardMaterial({vertexColors: true, roughness: .85}));
  })();

  /* ── the sexton's house: a plastered house under a tiled roof on the north side of the church, its long side parallel to it,
     the gable with its pediment and two round windows to the square, and the porch with its own little roof on posts toward the church ── */
  (function(){
    var P = PLEB, y0 = H(P.x, P.z), WH = 4.3, zf = P.z + P.len/2, zb = P.z - P.len/2, hw = P.wid/2, g = new T.Group(); g.position.set(0, y0, 0); scene.add(g);
    var wallM = new T.MeshStandardMaterial({color: '#ece5d7', roughness: .9}), trimM = new T.MeshStandardMaterial({color: '#f7f3ea', roughness: .8}),
        roofM = new T.MeshStandardMaterial({color: '#7e4a36', roughness: .85}), glassM = new T.MeshStandardMaterial({color: '#1f2326', roughness: .25, metalness: .1}),
        frameM = new T.MeshStandardMaterial({color: '#dccfb9', roughness: .8}), woodM = new T.MeshStandardMaterial({color: '#4a3424', roughness: .8}), baseM = new T.MeshStandardMaterial({color: '#8d8478', roughness: .95});
    function bx(w, h, d, x, y, z, m){ var o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; }
    bx(P.wid, WH, P.len, P.x, WH/2, P.z, wallM);
    bx(P.wid + .16, .6, P.len + .16, P.x, .3, P.z, baseM);                            // stone plinth
    var pitch = .78, rh = (hw + .55)*pitch;
    function gableRoof(w, len, h, x, y, z){ var sh = new T.Shape([new T.Vector2(-w/2, 0), new T.Vector2(w/2, 0), new T.Vector2(0, h)]);
      var gg = new T.ExtrudeGeometry(sh, {depth: len, bevelEnabled: false}); gg.translate(x, y, z - len/2); var o = new T.Mesh(gg, roofM); o.castShadow = o.receiveShadow = true; g.add(o); return o; }
    gableRoof(P.wid + 1.1, P.len + .5, rh, P.x, WH - .05, P.z);
    roofM.onBeforeCompile = function(sh){                                               // clay tiles
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vRP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvRP = (modelMatrix*vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vRP;\nfloat rH(vec2 n){ return fract(sin(dot(n, vec2(12.9898, 78.233)))*43758.5453); }')
        .replace('#include <map_fragment>', '#include <map_fragment>\nfloat c = vRP.y/.2, row = floor(c), v = fract(c); float u = vRP.z/.24 + .5*mod(row, 2.0), cl = floor(u), f = fract(u);\ndiffuseColor.rgb *= (.74 + .26*sin(f*3.14159))*(.55 + .45*smoothstep(0.0, .18, v))*(.88 + .24*rH(vec2(cl, row)));');
    };
    roofM.customProgramCacheKey = function(){ return 'plebTiles'; };
    /* gable walls, the front one a pediment closed by a cornice */
    var tri = new T.Shape([new T.Vector2(-hw, 0), new T.Vector2(hw, 0), new T.Vector2(0, hw*pitch)]);
    [zf - .25, zb].forEach(function(zz){ var tg2 = new T.ExtrudeGeometry(tri, {depth: .25, bevelEnabled: false}); tg2.translate(P.x, WH, zz); var o = new T.Mesh(tg2, wallM); o.castShadow = o.receiveShadow = true; g.add(o); });
    bx(P.wid + .5, .32, .5, P.x, WH + .02, zf + .1, trimM);
    var ra = Math.atan(pitch), rl = Math.hypot(hw + .4, (hw + .4)*pitch);
    [-1, 1].forEach(function(sd){ var o = bx(rl, .26, .42, P.x + sd*(hw/2 + .1), WH + hw*pitch/2 + .08, zf + .14, trimM); o.rotation.z = -sd*ra; });
    bx(P.wid + .3, .22, .4, P.x, WH - .6, zf + .08, trimM);                              // a band under the eaves
    function hole(x, y, r){ var o = new T.Mesh(new T.CircleGeometry(r, 20), glassM); o.position.set(x, y, zf + .03); g.add(o);
      var rr = new T.Mesh(new T.TorusGeometry(r + .06, .06, 6, 20), trimM); rr.position.set(x, y, zf + .04); g.add(rr); }
    hole(P.x - hw*.36, WH + 1.2, .25); hole(P.x + hw*.36, WH + 1.2, .25);
    function win(face, u, y, w, h){                                                     // face 'f' (front gable), 'e' / 'w' (long sides)
      var fx, fz, ry, nx = 0, nz = 0;
      if (face === 'f'){ fx = P.x + u; fz = zf + .03; ry = 0; nz = 1; } else { fz = P.z + u; fx = P.x + (face === 'e' ? 1 : -1)*(hw + .03); ry = Math.PI/2; nx = face === 'e' ? 1 : -1; }
      var f = bx(w + .32, h + .32, .08, fx, y, fz, frameM); f.rotation.y = ry;
      var gl = bx(w, h, .06, fx + nx*.04, y, fz + nz*.04, glassM); gl.rotation.y = ry; gl.castShadow = false;
      var mb = bx(.07, h, .08, fx + nx*.06, y, fz + nz*.06, frameM); mb.rotation.y = ry; mb.castShadow = false;
      var tb = bx(w, .07, .08, fx + nx*.06, y + h*.18, fz + nz*.06, frameM); tb.rotation.y = ry; tb.castShadow = false;
    }
    win('f', -2.0, 2.3, 1.05, 1.45); win('f', 2.0, 2.3, 1.05, 1.45);
    [-4.3, -2.2, 2.2, 4.3].forEach(function(u){ win('e', u, 2.3, 1.0, 1.45); });
    [-4.3, -1.45, 1.45, 4.3].forEach(function(u){ win('w', u, 2.3, 1.0, 1.45); });
    /* the porch, toward the church: a door in the middle of the long side under a little gabled roof on four posts, wooden steps */
    var pg = new T.Group(); pg.position.set(P.x + hw, 0, P.z); pg.rotation.y = Math.PI/2; g.add(pg);
    function pb(w, h, d, x, y, z, m){ var o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; pg.add(o); return o; }
    pb(1.1, 2.25, .1, 0, 1.45, .05, woodM).castShadow = false; pb(1.4, 2.5, .1, 0, 1.55, .02, frameM);
    var rs = new T.Shape([new T.Vector2(-1.3, 0), new T.Vector2(1.3, 0), new T.Vector2(0, .95)]), rg2 = new T.ExtrudeGeometry(rs, {depth: 2.5, bevelEnabled: false});
    var pr = new T.Mesh(rg2, roofM); pr.position.set(0, 3.05, -.1); pr.castShadow = true; pg.add(pr);
    var tri2 = new T.Shape([new T.Vector2(-1.15, 0), new T.Vector2(1.15, 0), new T.Vector2(0, .82)]); tri2.holes.push(new T.Path([new T.Vector2(-.88, .1), new T.Vector2(.88, .1), new T.Vector2(0, .64)]));
    var tb2 = new T.Mesh(new T.ExtrudeGeometry(tri2, {depth: .07, bevelEnabled: false}), woodM); tb2.position.set(0, 3.07, 2.3); pg.add(tb2);
    [[-1, 2.25], [1, 2.25], [-1, .12], [1, .12]].forEach(function(q){ pb(.13, 2.75, .13, q[0]*1.0, 1.65, q[1], woodM); });
    [-1, 1].forEach(function(sd){ pb(.06, .06, 2.1, sd*1.0, 1.25, 1.2, woodM); for (var k = 0; k < 5; k++) pb(.04, .55, .04, sd*1.0, .95, .4 + k*.42, woodM); });
    pb(2.2, .22, 2.4, 0, .45, 1.2, woodM); pb(1.5, .2, .5, 0, .17, 2.6, woodM);
    [[-2.4, -3], [2.2, 3.4]].forEach(function(c){ bx(.7, 1.6, .7, P.x + c[0]*.5, WH + rh*.72 + .4, P.z + c[1], wallM); bx(.86, .14, .86, P.x + c[0]*.5, WH + rh*.72 + 1.25, P.z + c[1], trimM); });   // chimneys
  })();

  /* ── the churchyard fence: along the square a whitewashed wall of posts with iron railings between them and a solid stretch on
     the left, and in the middle an arched masonry gate under a little pediment (as in the photograph of the square, 1920s–30s);
     along the sides and the back, white posts with pointed wooden palings on two rails ── */
  (function(){
    var posts = [], pales = [], rails = [], y = function(x, z){ return H(x, z); };
    var L = [[YARD.x0, YARD.z1, YARD.x1, YARD.z1], [YARD.x1, YARD.z1, YARD.x1, YARD.z0], [YARD.x1, YARD.z0, YARD.x0, YARD.z0], [YARD.x0, YARD.z0, YARD.x0, YARD.z1]];
    L.forEach(function(e, side){
      if (side === 0) return;
      var len = Math.hypot(e[2] - e[0], e[3] - e[1]), n = Math.round(len/3.4), ux = (e[2] - e[0])/len, uz = (e[3] - e[1])/len;
      for (var i = 0; i < n; i++){
        var x = e[0] + ux*len*i/n, z = e[1] + uz*len*i/n;
        if (i || side >= 2) posts.push([x, z]);
        var xa = x, za = z, xb = e[0] + ux*len*(i + 1)/n, zb = e[1] + uz*len*(i + 1)/n;
        rails.push([xa, za, xb, zb]);
        var seg = Math.hypot(xb - xa, zb - za), m = Math.floor(seg/.15);
        for (var k = 2; k < m - 1; k++) pales.push([xa + (xb - xa)*k/m, za + (zb - za)*k/m, Math.atan2(xb - xa, zb - za)]);
      }
    });
    var postM = new T.MeshStandardMaterial({color: '#efebe2', roughness: .9}), woodM = new T.MeshStandardMaterial({color: '#57503f', roughness: .95});
    var pg = new T.BoxGeometry(.5, 1.9, .5), cap = new T.ConeGeometry(.46, .32, 4, 1); cap.rotateY(Math.PI/4);
    var pim = new T.InstancedMesh(pg, postM, posts.length), cim = new T.InstancedMesh(cap, postM, posts.length);
    posts.forEach(function(q, i){ var yy = y(q[0], q[1]); pim.setMatrixAt(i, mtx(q[0], yy + .95, q[1])); cim.setMatrixAt(i, mtx(q[0], yy + 1.98, q[1], 0, 1, 1, 1)); });
    pim.castShadow = cim.castShadow = true; pim.receiveShadow = true; scene.add(pim); scene.add(cim);
    var pal = new T.BoxGeometry(.075, 1.55, .03);
    var tip = new T.ConeGeometry(.055, .14, 4, 1); tip.translate(0, .84, 0);
    var palM = new T.InstancedMesh(pal, woodM, pales.length), tipM = new T.InstancedMesh(tip, woodM, pales.length);
    pales.forEach(function(q, i){ var yy = y(q[0], q[1]), mm = mtx(q[0], yy + .9, q[1], q[2] + Math.PI/2, 1, 1, 1); palM.setMatrixAt(i, mm); tipM.setMatrixAt(i, mm); });
    palM.castShadow = true; scene.add(palM); scene.add(tipM);
    var rb = new Batch(), wc = lin('#4c4537');
    rails.forEach(function(r){ var mx = (r[0] + r[2])/2, mz = (r[1] + r[3])/2, len = Math.hypot(r[2] - r[0], r[3] - r[1]), a = Math.atan2(r[2] - r[0], r[3] - r[1]), yy = y(mx, mz);
      [.45, 1.3].forEach(function(h){ rb.add(BOX, mtx(mx, yy + h, mz, a, .06, .09, len), wc); }); });
    rb.mesh(new T.MeshStandardMaterial({vertexColors: true, roughness: .95}));
    /* the front: masonry posts with stepped caps, a low wall with iron railings, a solid wall on the left, the arched gate */
    var fz = YARD.z1, yF = y(0, fz), mas = new Batch(), iron = new Batch(), wC = lin('#f1ede4'), iC = lin('#22201d');
    var FP = [YARD.x0, -17, -9.5, 9.5, 16, YARD.x1];
    FP.forEach(function(x){ mas.add(BOX, mtx(x, yF + 1.3, fz, 0, .78, 2.6, .78), wC); mas.add(BOX, mtx(x, yF + 2.68, fz, 0, .98, .16, .98), wC);
      mas.add(BOX, mtx(x, yF + 2.85, fz, 0, .62, .2, .62), wC); mas.add(HIP, mtx(x, yF + 2.95, fz, 0, .6, .55, .6), wC); });
    mas.add(BOX, mtx(-21, yF + 1.05, fz, 0, 7.3, 2.1, .45), wC); mas.add(BOX, mtx(-21, yF + 2.14, fz, 0, 7.5, .12, .55), wC);   // the solid stretch
    [[-17, -9.5], [-9.5, -3.3], [3.3, 9.5], [9.5, 16], [16, YARD.x1]].forEach(function(b){
      var a = b[0] + .4, c = b[1] - .4, mid = (a + c)/2, w = c - a;
      mas.add(BOX, mtx(mid, yF + .28, fz, 0, w + .1, .56, .42), wC); mas.add(BOX, mtx(mid, yF + .6, fz, 0, w + .2, .08, .5), wC);
      iron.add(BOX, mtx(mid, yF + 1.95, fz, 0, w, .06, .05), iC); iron.add(BOX, mtx(mid, yF + .82, fz, 0, w, .06, .05), iC);
      for (var xx = a + .07; xx < c; xx += .14){ iron.add(BOX, mtx(xx, yF + 1.4, fz, 0, .025, 1.25, .025), iC); iron.add(HIP, mtx(xx, yF + 2.02, fz, 0, .06, .12, .06), iC); }
    });
    (function(){                                                                       // the gate: piers, the arch, a cornice and the pediment
      var o = new T.Shape([new T.Vector2(-3.3, 0), new T.Vector2(3.3, 0), new T.Vector2(3.3, 4.6), new T.Vector2(-3.3, 4.6)]);
      var hole = new T.Path(); hole.moveTo(-1.6, 0); hole.lineTo(1.6, 0); hole.lineTo(1.6, 2.9); hole.absarc(0, 2.9, 1.6, 0, Math.PI, false); hole.lineTo(-1.6, 0); o.holes.push(hole);
      var gg = new T.ExtrudeGeometry(o, {depth: .9, bevelEnabled: false, curveSegments: 18}); gg.translate(0, yF, fz - .45);
      var gm = new T.Mesh(gg, new T.MeshStandardMaterial({color: '#f1ede4', roughness: .9})); gm.castShadow = gm.receiveShadow = true; scene.add(gm);
      mas.add(BOX, mtx(0, yF + 4.7, fz, 0, 7.0, .2, 1.1), wC); mas.add(BOX, mtx(0, yF + 4.88, fz, 0, 6.8, .16, 1.0), wC);
      mas.add(GAB, mtx(0, yF + 4.96, fz, 0, 6.2, 1.25, .9), wC);
      [-2.45, 2.45].forEach(function(x){ mas.add(BOX, mtx(x, yF + 2.2, fz + .48, 0, .5, 4.2, .08), wC); });       // flat pilasters on the piers
      mas.add(BOX, mtx(0, yF + 5.9, fz, 0, .1, 1.0, .1), iC); mas.add(BOX, mtx(0, yF + 6.15, fz, 0, .5, .1, .1), iC);   // a small cross on top
      [-1, 1].forEach(function(sd){                                                      // iron leaves standing open
        var leaf = new T.Group(); leaf.position.set(sd*1.58, yF, fz - .4); leaf.rotation.y = -sd*1.2; scene.add(leaf);
        var lb = new Batch(); for (var k = 0; k < 11; k++) lb.add(BOX, mtx(-sd*(.08 + k*.14), 1.5, 0, 0, .03, 2.7, .03), iC);
        [.3, 1.5, 2.75].forEach(function(h){ lb.add(BOX, mtx(-sd*.78, h, 0, 0, 1.56, .06, .05), iC); });
        var lm = lb.mesh(new T.MeshStandardMaterial({vertexColors: true, roughness: .5, metalness: .4})); scene.remove(lm); leaf.add(lm);
      });
    })();
    mas.mesh(new T.MeshStandardMaterial({vertexColors: true, roughness: .9}));
    iron.mesh(new T.MeshStandardMaterial({vertexColors: true, roughness: .5, metalness: .4}));
    /* a wooden cross on the square, as stood by many churches */
    var cx = -11, cz = 41, yc = y(cx, cz);
    var c1 = new T.Mesh(new T.BoxGeometry(.24, 5.2, .24), woodM); c1.position.set(cx, yc + 2.6, cz); c1.castShadow = true; scene.add(c1);
    var c2 = new T.Mesh(new T.BoxGeometry(1.9, .22, .22), woodM); c2.position.set(cx, yc + 4.1, cz); c2.castShadow = true; scene.add(c2);
    var c3 = new T.Mesh(new T.BoxGeometry(2.0, .5, 2.0), postM); c3.position.set(cx, yc + .25, cz); scene.add(c3);
  })();

  /* ── trees: instanced crowns, a breath of wind in the vertex shader ── */
  /* broadleaf crowns: seven or eight lumps of foliage of different sizes, their surfaces knocked about by noise so the outline is
     never a ball; the normals lean out from the crown's centre, so the whole crown shades softly like real foliage */
  function lumpy(parts, seed, rough){
    var P = [], N = [], r = function(i){ var v = Math.sin(seed*91.7 + i*12.989)*43758.5453; return v - Math.floor(v); };
    parts.forEach(function(q, j){ var g = new T.IcosahedronGeometry(q[3], 1).toNonIndexed(), pa = g.attributes.position, na = g.attributes.normal, v = new T.Vector3(), c = new T.Vector3(0, 0, 0);
      for (var i = 0; i < pa.count; i++){ v.fromBufferAttribute(pa, i);
        var d = 1 + rough*(Math.sin(v.x*5.1 + j*1.7 + seed)*Math.sin(v.y*4.3 + j)*Math.sin(v.z*5.7 + seed*.3)) + rough*.5*(r(i*3 + j*101 + Math.round(v.x*9 + v.y*13 + v.z*7)) - .5);
        v.multiplyScalar(d); v.x += q[0]; v.y += q[1]; v.z += q[2]; pa.setXYZ(i, v.x, v.y, v.z);
        var rn = v.clone().sub(c).normalize(), ln = new T.Vector3().fromBufferAttribute(na, i); ln.lerp(rn, .7).normalize(); na.setXYZ(i, ln.x, ln.y, ln.z); }
      P.push(pa.array); N.push(na.array); });
    return merge(P, N);
  }
  function blobCrown(){
    return lumpy([[0, .05, 0, .95], [.62, -.2, .18, .66], [-.5, -.18, -.38, .64], [.08, .5, -.12, .6], [-.3, .25, .55, .55], [.42, .32, -.5, .5], [-.62, .12, .2, .5], [.25, -.42, -.42, .48]], 3.1, .16);
  }
  function coneCrown(){ var P = [], N = []; [[0, 0, 1, 1.6], [0, 1.0, .74, 1.3], [0, 1.85, .48, 1.0]].forEach(function(q){ var g = new T.ConeGeometry(q[2], q[3], 9).toNonIndexed(); g.translate(0, q[1], 0); P.push(g.attributes.position.array); N.push(g.attributes.normal.array); }); return merge(P, N); }
  function poplarCrown(){ var g = lumpy([[0, 0, 0, .55], [.12, .9, .05, .5], [-.08, 1.8, -.05, .42], [0, 2.6, 0, .3], [.2, .45, -.15, .4], [-.2, 1.35, .15, .4]], 7.7, .14); g.scale(1, 1.25, 1); return g; }
  function merge(P, N){ var len = 0; P.forEach(function(a){ len += a.length; }); var p = new Float32Array(len), n = new Float32Array(len), at = 0;
    P.forEach(function(a, i){ p.set(a, at); n.set(N[i], at); at += a.length; }); var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(p, 3)); g.setAttribute('normal', new T.BufferAttribute(n, 3)); return g; }
  function windy(m, amt, bare){                                                      // bare: the crown thins in winter (uWSnow)
    m.customProgramCacheKey = function(){ return 'windy' + amt + (bare ? 'b' : ''); };   // each variant its own program
    m.onBeforeCompile = function(sh){
      sh.uniforms.uTime = U.uTime; sh.uniforms.uWSnow = U.uWSnow;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime, uWSnow;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + (bare ? 'transformed *= 1.0 - .3*uWSnow;\n' : '') + '#ifdef USE_INSTANCING\n vec3 ip = instanceMatrix[3].xyz;\n#else\n vec3 ip = vec3(0.0);\n#endif\n' +
          ' float k = max(0.0, position.y + 1.0);\n transformed.x += (sin(uTime*1.1 + ip.x*.13 + ip.z*.07) + .35*sin(uTime*2.7 + ip.z*.3))*' + amt.toFixed(3) + '*k;\n transformed.z += cos(uTime*.9 + ip.z*.11)*' + (amt*.6).toFixed(3) + '*k;\n vLY = position.y; vLN = normal; vLP = position;')
        .replace('#include <common>', '#include <common>\nvarying float vLY; varying vec3 vLN, vLP;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vLY; varying vec3 vLN, vLP;')
        .replace('#include <color_fragment>', '#include <color_fragment>\n float ao = smoothstep(-1.1, 1.0, vLY); diffuseColor.rgb *= .55 + .6*ao;\n float lf = .5 + .5*sin(vLP.x*11.0 + sin(vLP.y*9.0)*2.2)*sin(vLP.z*10.0 + sin(vLP.x*8.0)*2.0)*sin(vLP.y*12.0 + vLP.z*3.0); diffuseColor.rgb *= .78 + .38*lf;\n diffuseColor.rgb *= 1.0 + .18*smoothstep(.3, 1.0, vLN.y);\n diffuseColor.rgb *= .9 + .2*fract(sin(dot(floor(vLN*7.0), vec3(12.9, 78.2, 37.7)))*43758.5);');
    };
  }
  var LEAF = ['#4f6f33', '#5b7a38', '#5f8a3a', '#6e9442', '#557334', '#7a9a48', '#4a6a30'].map(lin), CON = ['#2e4a2f', '#33503a', '#2a4430'].map(lin), POP = lin('#7f9168');
  var crownM = new T.MeshStandardMaterial({roughness: .9}); windy(crownM, .05, true);
  var conM = new T.MeshStandardMaterial({roughness: .95, flatShading: true}); windy(conM, .025);
  var trunkM = new T.MeshStandardMaterial({color: '#4a3826', roughness: 1});
  var list = {blob: [], cone: [], pop: [], bush: []};
  function add(kind, x, z, s){ list[kind].push([x, H(x, z), z, s*1.22]); }            // fuller crowns: in this view the trees stand in masses
  /* the town's trees, the belts along the banks, clumps on the flood-plain and the far woods */
  var step = lite ? 12 : 8, rnd = (function(seed){ return function(){ seed = (seed*16807) % 2147483647; return (seed - 1)/2147483646; }; })(1740);
  for (var fx = CX - SIZE/2 + 4; fx < CX + SIZE/2 - 4; fx += step) for (var fz = CZ - SIZE/2 + 4; fz < CZ + SIZE/2 - 4; fz += step){
    var rr = Math.hypot(fx - GX, fz - GZ), thin = rr < 300 ? 1 : rr < 650 ? .4 : .16;
    if (rr > 1150) continue;   // farther off, fewer but bigger trees
    if (rnd() > thin) continue;
    var x2 = fx + (rnd() - .5)*step*.9, z2 = fz + (rnd() - .5)*step*.9, f = forest(x2, z2);
    if (rnd() > f) continue;
    var big = 1/Math.sqrt(thin), Rn = rivNear(x2, z2), bankT = Rn.d - RW/2 < 18;
    add(bankT && rnd() < .35 ? 'pop' : rnd() < .16 ? 'cone' : 'blob', x2, z2, (1.9 + rnd()*1.3)*Math.min(1.9, .75 + .25*big));
  }
  /* the church plot: fruit trees in loose groups among the beds */
  for (var k3 = 0; k3 < (lite ? 500 : 1100); k3++){
    var x3 = -140 + rnd()*200, z3 = -240 + rnd()*300;
    if (!inPoly(PLOT, x3, z3) || keepClear(x3, z3, 3) || pondQ(x3, z3) < 1.8 || fbm(x3*.03 + 5, z3*.03 + 1) < .44) continue;
    add('blob', x3, z3, 1.0 + rnd()*.45);
  }
  /* yards: a fruit tree or two beside every house */
  HOUSES.forEach(function(q){ var n = 1 + Math.floor(rnd()*2), ca = Math.cos(-q.a), sa = Math.sin(-q.a);
    for (var i = 0; i < n; i++){ var lx = (rnd() - .5)*q.w*1.4, lz = (q.d/2 + 4 + rnd()*6)*(q.k > .5 ? 1 : -1), x = q.x + lx*ca + lz*sa, z = q.z - lx*sa + lz*ca;
      if (roadD(x, z) > 5 && !keepClear(x, z)) add('blob', x, z, 1.2 + rnd()*.5); } });
  /* the churchyard: limes and a few firs along the long sides, none before the front; trees outside behind the back fence */
  [[YARD.x1 - 4.5, -6, 2.4], [YARD.x0 + 4.5, -8, 2.1], [YARD.x0 + 4.5, -36, 1.9], [YARD.x1 - 4.5, -38, 1.9]].forEach(function(q){ add('blob', q[0], q[1], q[2]); });
  [[YARD.x1 - 4, -18, 1.25], [YARD.x1 - 3.8, -27, 1.1], [YARD.x0 + 4, -20, 1.2], [YARD.x0 + 4, -28, 1.05]].forEach(function(q){ add('cone', q[0], q[1], q[2]); });
  for (var bx2 = YARD.x0 + 3; bx2 <= YARD.x1 - 3; bx2 += 8) add('blob', bx2 + (rnd() - .5)*2, YARD.z0 - 5 - rnd()*3, 2.0 + rnd()*.5);
  /* lilac and elder along the inside of the fences, a few by the sexton's house */
  for (var bz = YARD.z0 + 3; bz < YARD.z1 - 6; bz += 3.2 + rnd()*2.5){ if (rnd() < .7) add('bush', YARD.x0 + 1.2 + rnd()*.6, bz, .55 + rnd()*.3); if (rnd() < .7) add('bush', YARD.x1 - 1.2 - rnd()*.6, bz, .55 + rnd()*.3); }
  for (var bx3 = YARD.x0 + 3; bx3 < YARD.x1 - 3; bx3 += 3 + rnd()*2.5) if (rnd() < .6) add('bush', bx3, YARD.z0 + 1.3, .55 + rnd()*.3);
  [[-9, YARD.z1 - 1.4], [9, YARD.z1 - 1.4], [-15, YARD.z1 - 1.4], [15.5, YARD.z1 - 1.4], [PLEB.x + 1, PLEB.z + PLEB.len/2 + 2.5], [PLEB.x - 3, PLEB.z + PLEB.len/2 + 2.2], [PLEB.x + PLEB.wid/2 + 1.5, PLEB.z + 4]].forEach(function(q){ add('bush', q[0], q[1], .6 + rnd()*.25); });
  [[PLEB.x - 8, PLEB.z - 6], [PLEB.x - 7, PLEB.z + 6], [YARD.x1 + 7, 4], [YARD.x1 + 8, -20], [-21, 49], [21, 47]].forEach(function(q){ add('blob', q[0], q[1], 1.8 + rnd()*.5); });
  function instance(kind, geo, mat, colors, trunkH, crownY, cast){
    var L = list[kind]; if (!L.length) return;
    var im = new T.InstancedMesh(geo, mat, L.length), tr = new T.InstancedMesh(new T.CylinderGeometry(.12, .2, 1, 6), trunkM, L.length), m4 = new T.Matrix4(), q = new T.Quaternion(), sv = new T.Vector3(), pv = new T.Vector3(), e = new T.Euler();
    L.forEach(function(t, i){
      var s = t[3]; q.setFromEuler(e.set(0, hash(t[0], t[2])*6.28, 0));
      m4.compose(pv.set(t[0], t[1] + trunkH*s + crownY*s, t[2]), q, sv.set(s, s*(kind === 'blob' ? .9 : 1), s)); im.setMatrixAt(i, m4);
      im.setColorAt(i, colors[Math.floor(hash(t[2], t[0])*colors.length)]);
      m4.compose(pv.set(t[0], t[1] + trunkH*s/2, t[2]), q, sv.set(s, trunkH*s + .2, s)); tr.setMatrixAt(i, m4);
    });
    im.castShadow = tr.castShadow = cast; im.receiveShadow = true; scene.add(im); scene.add(tr);
    if (kind !== 'cone') CROWNS.push({im: im, base: im.instanceColor.array.slice(), L: L});
  }
  var CROWNS = [];
  instance('blob', blobCrown(), crownM, LEAF, 1.15, .8, true);
  instance('cone', coneCrown(), conM, CON, .9, 1.0, true);
  instance('pop', poplarCrown(), crownM, [POP, lin('#71865c')], 1.2, 1.0, true);
  instance('bush', blobCrown(), crownM, LEAF, .05, .55, true);

  /* ── lanterns by the gate, round the square and along the street: posts by day, warm pools of light at dusk and night ── */
  var lampsK = 0, lanterns = (function(){
    var P = [[-4.4, YARD.z1 + 1.2], [4.4, YARD.z1 + 1.2], [-15.5, 31], [17, 30], [-15.5, 47], [17, 47.5], [36, 44], [-34, 50]];
    var n = P.length, post = new T.InstancedMesh(new T.CylinderGeometry(.05, .07, 2.6, 6), new T.MeshStandardMaterial({color: '#1d1c1a', roughness: .6, metalness: .4}), n);
    var headM = new T.MeshStandardMaterial({color: '#2a2622', emissive: new T.Color('#ffc070'), emissiveIntensity: 0, roughness: .5});
    var head = new T.InstancedMesh(new T.CylinderGeometry(.16, .11, .36, 6), headM, n), m4 = new T.Matrix4();
    var c = document.createElement('canvas'); c.width = c.height = 128; var k = c.getContext('2d'), g = k.createRadialGradient(64, 64, 0, 64, 64, 62);
    g.addColorStop(0, 'rgba(255,214,150,1)'); g.addColorStop(.25, 'rgba(255,190,110,.55)'); g.addColorStop(1, 'rgba(255,170,80,0)'); k.fillStyle = g; k.fillRect(0, 0, 128, 128);
    var tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding;
    var poolM = new T.MeshBasicMaterial({map: tex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0, fog: true});
    var pg = new T.PlaneGeometry(7, 7); pg.rotateX(-Math.PI/2);
    var pool = new T.InstancedMesh(pg, poolM, n);
    var gp = new Float32Array(n*3);
    P.forEach(function(q, i){ var y = H(q[0], q[1]);
      m4.makeTranslation(q[0], y + 1.3, q[1]); post.setMatrixAt(i, m4);
      m4.makeTranslation(q[0], y + 2.75, q[1]); head.setMatrixAt(i, m4);
      m4.makeTranslation(q[0], y + .06, q[1]); pool.setMatrixAt(i, m4);
      gp.set([q[0], y + 2.78, q[1]], i*3); });
    post.castShadow = true; scene.add(post); scene.add(head); pool.renderOrder = 3; scene.add(pool);
    var gg = new T.BufferGeometry(); gg.setAttribute('position', new T.BufferAttribute(gp, 3));
    var glowM = new T.PointsMaterial({map: tex, size: 3.2, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0, sizeAttenuation: true});
    var glow = new T.Points(gg, glowM); glow.renderOrder = 4; scene.add(glow);
    return {set: function(v){ headM.emissiveIntensity = 2.4*v; poolM.opacity = .55*v; glowM.opacity = .9*v; pool.visible = glow.visible = v > .01; }};
  })();

  /* ── SKY · the real hour over Dubrovytsia: the sun where it stands now, a sky to match — dawn, a bright day with clouds,
     golden hour, the afterglow, a starry night with the moon and the house floodlit ── */
  var hemi2 = new T.HemisphereLight('#ffe9c4', '#3a3420', .3); scene.add(hemi2);
  scene.fog = new T.FogExp2(new T.Color(), .005);
  var SKYU = {uSun: U.uSunDir, uTime: U.uTime, uZen: {value: new T.Color()}, uHor: U.uHor, uSunH: {value: new T.Color()}, uAnti: {value: new T.Color()},
    uGlow: {value: new T.Color()}, uGlowI: {value: 1}, uDisk: {value: 1}, uCLit: {value: new T.Color()}, uCSh: {value: new T.Color()}, uCov: {value: .5}, uStars: {value: 0},
    uMoon: {value: new T.Vector3(-.3, .5, .8).normalize()}};
  var sky = new T.Mesh(new T.SphereGeometry(560, 48, 24), new T.ShaderMaterial({side: T.BackSide, depthWrite: false, fog: false, uniforms: SKYU,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }',
    fragmentShader: [
      'uniform vec3 uSun, uZen, uHor, uSunH, uAnti, uGlow, uCLit, uCSh, uMoon; uniform float uTime, uGlowI, uDisk, uCov, uStars; varying vec3 vD;',
      'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }',
      'float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }',
      'float fbm(vec2 p){ float a = .5, s = 0.0; for (int i = 0; i < ' + (lite ? 3 : 5) + '; i++){ s += a*n(p); p = p*2.07 + vec2(1.7, 9.2); a *= .5; } return s; }',
      'void main(){',
      '  vec3 d = normalize(vD); float y = d.y;',
      '  vec3 sh = normalize(vec3(uSun.x, 0.0, uSun.z) + 1e-5), dh = normalize(vec3(d.x, 0.0, d.z) + 1e-5);',
      '  float side = dot(dh, sh)*.5 + .5;',
      '  vec3 hor = mix(uAnti, uSunH, pow(side, 2.2)); hor = mix(uHor, hor, .7);',
      '  vec3 c = mix(hor, uZen, pow(clamp(y, 0.0, 1.0), .5));',
      '  c = mix(c, hor*.8, smoothstep(0.0, -.15, y));',
      '  float sd = max(dot(d, uSun), 0.0);',
      '  c += uGlow*(pow(sd, 6.0)*.28 + pow(sd, 48.0)*.55)*uGlowI;',                 // the bright air round the sun
      '  c += uGlow*smoothstep(.99955, .9998, sd)*6.0*uDisk;',                      // the disc
      /* stars and the moon */
      '  vec3 sp = d*260.0; vec3 cell = floor(sp); float sh2 = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719)))*43758.5453);',
      '  float star = step(.9935, sh2)*smoothstep(.62, .2, length(fract(sp) - .5))*(.6 + .4*sin(uTime*2.0 + sh2*80.0));',
      '  c += vec3(.9, .92, 1.0)*star*uStars*smoothstep(.02, .2, y)*2.2*(.4 + .6*fract(sh2*91.0));',
      '  float md = dot(d, uMoon);',
      '  c += vec3(.95, .92, .82)*smoothstep(.99925, .9995, md)*uStars*1.4 + vec3(.25, .3, .4)*pow(max(md, 0.0), 40.0)*uStars*.25;',
      /* clouds: heaps of cumulus whose shapes are folded by a second noise (no streaks), darker and thicker in their cores, lit from
         the sun's side and burning orange at sunset; a thin veil of cirrus above them; both dissolve into the haze at the horizon */
      '  float hzn = 1.0 - smoothstep(0.0, .09, y);',
      '  c = mix(c, mix(hor, vec3(1.0), .12), hzn*.35*(1.0 - uStars));',                     // the pale band of air along the horizon
      '  if (y > 0.0){',
      '    vec2 cp = d.xz/(y + .1)*1.35 + vec2(uTime*.006, uTime*.0025);',
      '    vec2 wq = vec2(fbm(cp*.55 + 3.1), fbm(cp*.55 + 7.3)); vec2 q = cp + (wq - .5)*1.7;',
      '    float f = fbm(q), f2 = fbm(q*2.9 + 4.1), dens = f*.82 + f2*.32;',
      '    float cl = smoothstep(1.0 - uCov, 1.0 - uCov + .2, dens)*smoothstep(0.0, .1, y);',
      '    float toward = fbm(q + uSun.xz*.14)*.82 + f2*.32;',
      '    float lit = clamp(.42 + .5*pow(sd, 1.6) + (dens - toward)*3.2, 0.0, 1.35);',
      '    vec3 cc = mix(uCSh, uCLit, lit);',
      '    cc = mix(cc, uCSh*.86, smoothstep(1.0 - uCov + .12, 1.0 - uCov + .45, dens)*.38);',   // thick cores go grey
      '    cc += uGlow*pow(sd, 10.0)*.7*uGlowI*(1.0 - cl*.4);',                               // a silver lining near the sun
      '    c = mix(c, cc, cl*.94*(1.0 - .6*hzn));',
      '    vec2 cq = d.xz/(y + .04)*.45 + vec2(uTime*.011, uTime*.003);',
      '    float ci = fbm(vec2(cq.x*3.4 + cq.y*.8, cq.y*.7)), veil = smoothstep(.52, .8, ci)*smoothstep(.04, .3, y)*(1.0 - cl);',
      '    c = mix(c, mix(uCLit, uGlow, .25*pow(sd, 4.0)), veil*.32*(.5 + .5*uCov));',
      '  }',
      '  gl_FragColor = vec4(c, 1.0);',
      '  #include <encodings_fragment>',
      '}'].join('\n')}));
  sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);

  /* ── the far woods as one continuous belt along the horizon: crowns running into each other, with clearings, blued by the air ── */
  (function(){
    var NS = lite ? 1000 : 2200;
    [[455, 1, 0], [535, .85, 2.3]].forEach(function(r){
      var R = r[0], pos = [], col = [], idx = [], c1 = lin('#26321f'), c2 = lin('#3c4f2f'), c3 = lin('#4a5a36');
      for (var i = 0; i <= NS; i++){
        var a = i/NS*Math.PI*2, x = GX + Math.cos(a)*R, z = GZ + Math.sin(a)*R, g = H(x, z) - 2, s = a*R;
        var lump = Math.sqrt(Math.abs(Math.sin(s*.45 + r[2] + 2.0*Math.sin(s*.061)))) + .4*Math.sqrt(Math.abs(Math.sin(s*1.07 + 1.3*r[2])));   // rounded crowns, V-shaped gaps
        var clear = .35 + .65*Math.min(1, Math.max(0, (fbm(x*.006 + r[2], z*.006) - .3)*3));
        var top = g + (8 + 6*fbm(x*.012, z*.012) + 2.2*lump)*clear;
        var cc = c2.clone().lerp(c3, hash(i*.37, r[2]));
        pos.push(x, g - 8, z, x, top, z); col.push(c1.r, c1.g, c1.b, cc.r, cc.g, cc.b);
        if (i) idx.push(2*i - 2, 2*i - 1, 2*i, 2*i - 1, 2*i + 1, 2*i);
      }
      var g2 = new T.BufferGeometry(); g2.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g2.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g2.setIndex(idx); g2.computeVertexNormals();
      var m2 = new T.MeshLambertMaterial({vertexColors: true, side: T.DoubleSide, fog: true}); m2.userData.noLamp = true;
      var belt = new T.Mesh(g2, m2); belt.frustumCulled = false; scene.add(belt);
    });
  })();
  cam.far = 1200; cam.updateProjectionMatrix();

  /* palette by the sun's height (degrees): zenith, horizon, horizon toward the sun, horizon away from it, sun glow, lit and shaded cloud */
  var PAL = [
    [-18, '#070c1c', '#17213c', '#19233a', '#131b32', '#000000', '#2a3450', '#0e1322'],
    [-9,  '#101b3e', '#36426c', '#6c4c68', '#2c355a', '#4a2a2a', '#5c4c6a', '#1c2238'],
    [-4,  '#22346a', '#9c7c92', '#f08c5c', '#6c6c94', '#ff8c4c', '#ffaa82', '#4c3c5c'],
    [1,   '#33528e', '#e8b28c', '#ffad60', '#a69eb8', '#ffba62', '#ffc892', '#7c6070'],
    [7,   '#3a62a8', '#e6c39c', '#ffc475', '#b8c0cc', '#ffd38a', '#fff0d8', '#8b8b98'],
    [22,  '#3a72c2', '#b9d3e8', '#e8eef2', '#a9c6dc', '#fff4dc', '#ffffff', '#a8b2c4'],
    [70,  '#2e66bf', '#b2cde6', '#dfe9f1', '#a6c3dc', '#fff8ea', '#ffffff', '#aab4c6']];
  function palAt(alt){
    var i = 0; while (i < PAL.length - 2 && alt > PAL[i + 1][0]) i++;
    var a = PAL[i], b = PAL[i + 1], t = Math.max(0, Math.min(1, (alt - a[0])/(b[0] - a[0])));
    var out = []; for (var k = 1; k < 8; k++) out.push(new T.Color(a[k]).lerp(new T.Color(b[k]), t).convertSRGBToLinear()); return out;
  }
  /* the sun over Dubrovytsia (51.57° N, 26.57° E) */
  var LAT = 51.573, LON = 26.567, RAD = Math.PI/180;
  function sunPos(date){
    var d = date.getTime()/864e5 + 2440587.5 - 2451545.0;
    var g = (357.529 + .98560028*d)*RAD, q = 280.459 + .98564736*d;
    var L = (q + 1.915*Math.sin(g) + .020*Math.sin(2*g))*RAD, e = (23.439 - .00000036*d)*RAD;
    var ra = Math.atan2(Math.cos(e)*Math.sin(L), Math.cos(L)), dec = Math.asin(Math.sin(e)*Math.sin(L));
    var gmst = ((18.697374558 + 24.06570982441908*d) % 24 + 24) % 24;
    var Hh = (gmst*15 + LON)*RAD - ra, la = LAT*RAD;
    var alt = Math.asin(Math.sin(la)*Math.sin(dec) + Math.cos(la)*Math.cos(dec)*Math.cos(Hh));
    var az = Math.atan2(-Math.sin(Hh), Math.tan(dec)*Math.cos(la) - Math.sin(la)*Math.cos(Hh));
    return {alt: alt/RAD, az: (az/RAD + 360) % 360};
  }
  function moonPos(date){                                                             // good enough for a moon in the picture
    var d = date.getTime()/864e5 + 2440587.5 - 2451545.0, L = (218.316 + 13.176396*d)*RAD, M = (134.963 + 13.064993*d)*RAD, F = (93.272 + 13.229350*d)*RAD;
    var lon = L + 6.289*RAD*Math.sin(M), lat = 5.128*RAD*Math.sin(F), e = 23.439*RAD;
    var ra = Math.atan2(Math.sin(lon)*Math.cos(e) - Math.tan(lat)*Math.sin(e), Math.cos(lon)), dec = Math.asin(Math.sin(lat)*Math.cos(e) + Math.cos(lat)*Math.sin(e)*Math.sin(lon));
    var gmst = ((18.697374558 + 24.06570982441908*d) % 24 + 24) % 24, Hh = (gmst*15 + LON)*RAD - ra, la = LAT*RAD;
    var alt = Math.asin(Math.sin(la)*Math.sin(dec) + Math.cos(la)*Math.cos(dec)*Math.cos(Hh)), az = Math.atan2(-Math.sin(Hh), Math.tan(dec)*Math.cos(la) - Math.sin(la)*Math.cos(Hh));
    return {alt: alt/RAD, az: (az/RAD + 360) % 360};
  }
  function ss2(a, b, x){ var t = Math.max(0, Math.min(1, (x - a)/(b - a))); return t*t*(3 - 2*t); }
  function hex(c){ return '#' + c.clone().convertLinearToSRGB().getHexString(); }
  function dirOf(p){ var E = api.compass.east, N = api.compass.north, h = p.alt*RAD, A = p.az*RAD, ce = Math.cos(h)*Math.sin(A), cn = Math.cos(h)*Math.cos(A);
    return new T.Vector3(E[0]*ce + N[0]*cn, Math.sin(h), E[1]*ce + N[1]*cn).normalize(); }
  var override = (function(){ var m = /[?&#]hero-time=(\d{1,2})[:.](\d{2})/.exec(location.href); return m ? +m[1]*60 + +m[2] : null; })();
  function kyivOff(){                                                                // minutes Kyiv is ahead of UTC today (summer or winter time)
    try { var n = new Date(), p = n.toLocaleString('en-GB', {timeZone: 'Europe/Kyiv', hour: '2-digit', minute: '2-digit', hour12: false}).split(':'),
      o = (+p[0] % 24)*60 + +p[1] - (n.getUTCHours()*60 + n.getUTCMinutes()); return o > 720 ? o - 1440 : o < -720 ? o + 1440 : o; } catch (e){ return 180; }
  }
  function kyivNow(){ var n = new Date(); return ((n.getUTCHours()*60 + n.getUTCMinutes() + kyivOff()) % 1440 + 1440) % 1440; }
  function when(){                                                                   // now, or a time of day picked by hand (the hero's slider, or ?hero-time=19:40)
    var n = new Date(); if (override == null) return n;
    var k = new Date(n.getTime()); k.setUTCHours(0, 0, 0, 0);
    return new Date(k.getTime() + (override - kyivOff())*6e4);
  }
  function setSky(){
    var date = when(), s = sunPos(date), mo = moonPos(date), alt = s.alt;
    var P = palAt(alt), sd = dirOf(s);
    if (SW > .001) P.forEach(function(c, i){ if (i > 3 && i < 5) return; var l = c.r*.3 + c.g*.59 + c.b*.11; c.lerp(new T.Color(l*.94, l, l*1.1), (i > 4 ? .3 : .45)*SW); });   // winter: a paler, overcast sky
    /* below the horizon the sun still lights the sky from where it is: keep its direction, but the light itself goes */
    U.uSunDir.value.copy(sd);
    SKYU.uZen.value.copy(P[0]); U.uHor.value.copy(P[1]); SKYU.uSunH.value.copy(P[2]); SKYU.uAnti.value.copy(P[3]); SKYU.uGlow.value.copy(P[4]);
    SKYU.uCLit.value.copy(P[5]); SKYU.uCSh.value.copy(P[6]);
    SKYU.uDisk.value = ss2(-1.2, .4, alt); SKYU.uGlowI.value = .35 + .9*ss2(-10, -1, alt)*(1 - .55*ss2(15, 40, alt));
    var night = 1 - ss2(-12, -4, alt);
    SKYU.uStars.value = night*(mo.alt > -2 ? .85 : 1);
    SKYU.uMoon.value.copy(mo.alt > -4 ? dirOf(mo) : new T.Vector3(.2, -1, .1));
    SKYU.uCov.value = .5 + .32*SW + .1*SA;
    /* haze: morning mist, clear day, a warm evening, a deep blue night */
    var fogCol = P[1].clone().lerp(P[3], .3); var lum = fogCol.r*.3 + fogCol.g*.59 + fogCol.b*.11; fogCol.lerp(new T.Color(lum, lum, lum), .42).multiplyScalar(.8);
    fogCol.lerp(new T.Color(lum*1.02, lum*1.08, lum*1.2), .6*SW).lerp(new T.Color(lum*1.22, lum*.98, lum*.68), .45*SA);
    scene.fog.color.copy(fogCol); U.uFogC.value.copy(fogCol);
    var dens = .0032 + .0018*(1 - ss2(-2, 14, alt)) + .0008*ss2(-6, 3, alt)*(1 - ss2(3, 12, alt));
    dens *= (1 + .9*SW + .4*SA)*.48;                                                 // the valley is wide: a lighter haze than round the pavilion
    scene.fog.density = dens; U.uFogD.value = dens;
    U.uGlowW.value.copy(P[4]).lerp(P[5], .3); U.uDeep.value.copy(P[0]).multiplyScalar(.18).add(new T.Color(.012, .03, .032));
    U.uGlint.value = ss2(-1, 3, alt);
    /* the model's own lights: sun, fill, sky, exposure, floodlights at night */
    var day = ss2(-1, 12, alt), high = ss2(6, 40, alt), twi = ss2(-10, 0, alt);
    /* at night the moon takes over as the key light: cool, soft, from where it stands (or from high up when it's down) */
    var moonLit = night*(mo.alt > 3 ? 1 : .6), md = mo.alt > 3 ? dirOf(mo) : new T.Vector3(-.35, .8, .45).normalize();
    var useMoon = moonLit > .05 && alt < -4;
    var sunC = alt < 8 ? new T.Color('#ff7a3a').lerp(new T.Color('#ffd09a'), ss2(-1, 8, alt)) : new T.Color('#ffe2b8').lerp(new T.Color('#fff6e8'), high);
    sunC.lerp(new T.Color('#ffc480'), .35*SA*high).lerp(new T.Color('#e8eef8'), .5*SW*high);
    api.light({dir: useMoon ? [md.x, md.y, md.z] : [sd.x, Math.max(sd.y, .02), sd.z], sunColor: useMoon ? '#9fb2e2' : '#' + sunC.getHexString(),
      sunI: (useMoon ? .42*moonLit : 1.9*ss2(-.8, 4, alt)*(.78 + .22*high))*(1 - .38*SW),
      fillColor: hex(P[0].clone().lerp(new T.Color('#d3dcff'), day*.5)), fillI: .06 + .22*day + .05*night,
      sky: hex(P[0].clone().lerp(P[1], .5)), ground: alt > 0 ? '#3d3020' : '#121522', hemiI: .14 + .3*day + .06*night,
      exposure: (.62 + .16*twi + .3*day)*(1 - .1*SW), env: .08 + .12*twi + .3*day, lamps: 1 - ss2(-5, 1.5, alt)});
    hemi2.color.copy(P[1]).lerp(new T.Color('#6a7cb0'), night*.6); hemi2.groundColor.set(alt > 0 ? '#3a3420' : '#141826'); hemi2.intensity = .12 + .24*day + .16*(1 - day)*twi + .3*night;
    birds.forEach(function(b){ b.visible = alt > -6; });
    lampsK = 1 - ss2(-5, 1.5, alt); lanterns.set(lampsK);
    api.heroSun = s;
  }

  /* ── birds over the river ── */
  var birds = [];
  (function(){
    var bm = new T.MeshBasicMaterial({color: '#20180f', side: T.DoubleSide, fog: true});
    var wg = new T.BufferGeometry(); wg.setAttribute('position', new T.Float32BufferAttribute([0, 0, -.12, 0, 0, .14, .62, 0, 0], 3));
    for (var i = 0; i < (lite ? 5 : 9); i++){
      var b = new T.Group(), l = new T.Mesh(wg, bm), r = new T.Mesh(wg, bm); r.scale.x = -1; b.add(l); b.add(r);
      b.userData = {l: l, r: r, ph: i*.7, rad: 40 + (i % 3)*12, h: 34 + (i % 4)*3, sp: .07 + (i % 3)*.012, cx: 60 + (i % 2)*20, cz: -220 + (i % 3)*16};
      b.scale.setScalar(2.4); scene.add(b); birds.push(b);
    }
  })();


  /* ── seasons, picked by hand in the hero (summer by default): autumn turns the park to gold and rust and sends leaves
     drifting down; winter strips the broadleaves, lays snow on the land, the roofs and the crowns, and freezes the water ── */
  var SEASON = 'summer', SW = 0, SA = 0, ctT = 1;
  var AUTC = ['#c8862e', '#e0a93a', '#b4542a', '#e8c04a', '#9c3c22', '#d07a28', '#c9a23a', '#8f8a38'].map(lin), BARE = [lin('#a0968a'), lin('#928879'), lin('#aaa196')];
  function crownTarget(c, k){
    var a = c.base.slice(), L = c.L, col = new T.Color();
    if (k === 'summer') return a;
    for (var i = 0; i < L.length; i++){ var h = hash(L[i][0]*1.7, L[i][2]*2.3);
      if (k === 'autumn'){ col.copy(AUTC[Math.floor(h*AUTC.length)]); if (hash(L[i][2], L[i][0]*3.1) < .16) col.lerp(new T.Color(a[i*3], a[i*3 + 1], a[i*3 + 2]), .65); }   // a few still green
      else col.copy(BARE[Math.floor(h*BARE.length)]);
      a[i*3] = col.r; a[i*3 + 1] = col.g; a[i*3 + 2] = col.b; }
    return a;
  }
  /* snow on whatever faces the sky: one small patch for every lit material in the scene, added the first time winter is chosen */
  function patchSnow(){
    if (patchSnow.done) return; patchSnow.done = true;
    scene.traverse(function(ob){ if (!ob.isMesh || ob === sky) return;
      (Array.isArray(ob.material) ? ob.material : [ob.material]).forEach(function(m){
        if (!m || !m.isMeshStandardMaterial || m.userData.noSnow || m.userData.snowP) return; m.userData.snowP = true;
        var prev = m.onBeforeCompile, key = m.customProgramCacheKey();
        m.onBeforeCompile = function(sh, r){ if (prev) prev.call(this, sh, r); sh.uniforms.uWSnow = U.uWSnow;
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uWSnow;')
            .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n{ float up = dot(normal, normalize((viewMatrix*vec4(0.0, 1.0, 0.0, 0.0)).xyz)); float sn = uWSnow*smoothstep(.12, .62, up);\n  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.82, .85, .9), sn); roughnessFactor = mix(roughnessFactor, .8, sn); }'); };
        m.customProgramCacheKey = function(){ return key + '|snow'; }; m.needsUpdate = true; }); });
  }
  /* falling snow and leaves round the house: the fall itself runs in the vertex shader */
  function sprite(draw){ var c = document.createElement('canvas'); c.width = c.height = 64; draw(c.getContext('2d')); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t; }
  function fall(n, o2){
    var g = new T.BufferGeometry(), p = new Float32Array(n*3), c = new Float32Array(n*3), R0 = 85;
    for (var i = 0; i < n; i++){ p[i*3] = GX + (Math.random()*2 - 1)*R0; p[i*3 + 1] = Math.random()*o2.h; p[i*3 + 2] = GZ + (Math.random()*2 - 1)*R0;
      var q = o2.cols[i % o2.cols.length]; c[i*3] = q.r; c[i*3 + 1] = q.g; c[i*3 + 2] = q.b; }
    g.setAttribute('position', new T.BufferAttribute(p, 3)); g.setAttribute('color', new T.BufferAttribute(c, 3));
    var m = new T.PointsMaterial({size: o2.size, map: o2.map, transparent: true, depthWrite: false, opacity: 0, vertexColors: true, alphaTest: o2.at || 0});
    m.onBeforeCompile = function(sh){ sh.uniforms.uTime = U.uTime;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace('#include <begin_vertex>', 'vec3 transformed = position; float rr = fract(position.x*.173 + position.z*.311);\n' +
          'transformed.y = mod(position.y - uTime*' + o2.v.toFixed(2) + '*(.7 + .6*rr), ' + o2.h.toFixed(1) + ') - 4.0;\n' +
          'transformed.x += sin(uTime*.7 + rr*40.0)*' + o2.sw.toFixed(2) + ' + sin(uTime*.23 + rr*9.0)*' + (o2.sw*2).toFixed(2) + ';\n transformed.z += cos(uTime*.55 + rr*30.0)*' + o2.sw.toFixed(2) + ';'); };
    var pts = new T.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 5; pts.visible = false; scene.add(pts); return pts;
  }
  var snowFx = null, leafFx = null;
  function makeSnow(){ return snowFx || (snowFx = fall(lite ? 1400 : 3200, {h: 60, v: 1.6, sw: .5, size: .8, cols: [new T.Color(1, 1, 1)],
    map: sprite(function(k){ var g = k.createRadialGradient(32, 32, 0, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.45, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); k.fillStyle = g; k.fillRect(0, 0, 64, 64); })})); }
  function makeLeaves(){ return leafFx || (leafFx = fall(lite ? 160 : 320, {h: 46, v: .9, sw: 1.5, size: 1.25, at: .35, cols: AUTC.slice(0, 6), map: sprite(function(k){
    k.translate(32, 32); k.rotate(.6); k.fillStyle = '#fff'; k.beginPath(); k.moveTo(0, -26); k.quadraticCurveTo(17, -6, 0, 26); k.quadraticCurveTo(-17, -6, 0, -26); k.fill(); })})); }
  function setSeason(k, at){
    if (k === SEASON) return; SEASON = k;
    if (k === 'winter'){ patchSnow(); makeSnow(); } if (k === 'autumn') makeLeaves();
    CROWNS.forEach(function(c){ c.from = c.im.instanceColor.array.slice(); c.to = crownTarget(c, k); }); ctT = 0;
    if (at){ ctT = .999; SW = k === 'winter' ? .999 : 0; SA = k === 'autumn' ? .999 : 0; }                    // at once (for stills)
  }
  var skyTick = 0;
  function stepSeason(dt){
    var w = SEASON === 'winter' ? 1 : 0, a = SEASON === 'autumn' ? 1 : 0, moving = Math.abs(w - SW) > .002 || Math.abs(a - SA) > .002;
    if (!moving && SW === w && SA === a && ctT >= 1) return;
    var kk = Math.min(1, dt*1.3); SW = moving ? SW + (w - SW)*kk : w; SA = moving ? SA + (a - SA)*kk : a;
    U.uWSnow.value = SW; U.uIce.value = SW; U.uAut.value = SA;
    if (snowFx){ snowFx.visible = SW > .02; snowFx.material.opacity = .9*SW; }
    if (leafFx){ leafFx.visible = SA > .02; leafFx.material.opacity = SA; }
    if (ctT < 1){ ctT = Math.min(1, ctT + dt/1.8); var e = ctT*ctT*(3 - 2*ctT);
      CROWNS.forEach(function(c){ var A = c.im.instanceColor.array; for (var i = 0; i < A.length; i++) A[i] = c.from[i] + (c.to[i] - c.from[i])*e; c.im.instanceColor.needsUpdate = true; }); }
    if (!moving || ++skyTick % 3 === 0) setSky();
  }

  var NOWS = (function(){ var m; try { m = +new Date().toLocaleString('en-GB', {timeZone: 'Europe/Kyiv', month: 'numeric'}); } catch (e){ m = new Date().getMonth() + 1; }
    var q = /[?&#]hero-season=(summer|autumn|winter)/.exec(location.href); return q ? q[1] : m === 12 || m <= 2 ? 'winter' : m >= 9 ? 'autumn' : 'summer'; })();
  setSeason(NOWS, true);

  /* ── a quiet control in the corner of the hero: the hour and the season, for whoever wants to turn them ── */
  (function(){
    var host = renderer.domElement.closest('.hx-cover') || renderer.domElement.parentNode; if (!host || o.noUi) return;
    var css = document.createElement('style'); css.textContent = [
      '.hxw{position:absolute;right:max(2rem,calc((100vw - 1240px)/2));bottom:.8rem;z-index:4;width:30px;height:30px;pointer-events:none;text-shadow:none;font-family:Manrope,system-ui,sans-serif}',
      '.hxw-row{display:inline-flex;align-items:center;gap:.5rem;flex:0 0 auto}',
      '.hxw-row .hxw{position:relative;right:auto;bottom:auto;width:38px;height:38px;flex:0 0 auto}',
      '.hxw-row .hxw-b{width:38px;height:38px;border-color:rgba(244,233,200,.24);background:rgba(23,18,11,.55);opacity:.6}',
      '.hxw-row .hxw-b svg{width:16px;height:16px}',
      '.hxw-b{width:30px;height:30px;padding:0;border-radius:50%;border:1px solid rgba(212,178,90,.2);background:rgba(18,14,8,.22);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);color:#f4e9c8;display:grid;place-items:center;cursor:pointer;opacity:.42;pointer-events:auto;transition:opacity .3s,border-color .3s,background .3s}',
      '.hxw-b:hover,.hxw-b:focus-visible,.hxw.open .hxw-b{opacity:1;border-color:rgba(212,178,90,.5);background:rgba(18,14,8,.5)}',
      '.hxw-b svg{width:15px;height:15px}',
      '.hxw-p{position:absolute;right:0;bottom:calc(100% + .55rem);width:250px;padding:.85rem .95rem .8rem;border-radius:14px;background:rgba(16,12,7,.66);border:1px solid rgba(212,178,90,.2);-webkit-backdrop-filter:blur(14px) saturate(1.2);backdrop-filter:blur(14px) saturate(1.2);box-shadow:0 18px 40px rgba(0,0,0,.35);color:#f4e9c8;',
      'opacity:0;transform:translateY(6px) scale(.98);transform-origin:100% 100%;pointer-events:none;visibility:hidden;transition:opacity .28s,transform .28s,visibility 0s .28s}',
      '.hxw.open .hxw-p{opacity:1;transform:none;pointer-events:auto;visibility:visible;transition:opacity .28s,transform .28s}',
      '.hxw-h{display:flex;align-items:baseline;justify-content:space-between;gap:.6rem;margin-bottom:.45rem}',
      '.hxw-k{font-size:.56rem;letter-spacing:.26em;text-transform:uppercase;color:rgba(212,178,90,.75)}',
      '.hxw-t{font-family:"Cormorant Garamond",Georgia,serif;font-style:italic;font-size:1.15rem;line-height:1;color:#f4e9c8;margin-left:auto}',
      '.hxw-now{padding:0;border:0;background:none;color:rgba(244,233,200,.55);font:inherit;font-size:.62rem;letter-spacing:.06em;cursor:pointer;text-decoration:underline;text-underline-offset:3px;text-decoration-color:rgba(212,178,90,.4)}',
      '.hxw-now[hidden]{display:none}.hxw-now:hover{color:#f4e9c8}',
      '.hxw-r{-webkit-appearance:none;appearance:none;width:100%;height:18px;margin:0 0 .7rem;background:transparent;cursor:pointer;display:block}',
      '.hxw-r::-webkit-slider-runnable-track{height:3px;border-radius:3px;background:linear-gradient(90deg,#16203c 0%,#16203c 17%,#c9788a 24%,#e9b07a 28%,#8fb8de 38%,#a9cbe6 55%,#e8b56c 72%,#d9764a 78%,#2a2f52 85%,#16203c 100%)}',
      '.hxw-r::-moz-range-track{height:3px;border-radius:3px;background:linear-gradient(90deg,#16203c 0%,#16203c 17%,#c9788a 24%,#e9b07a 28%,#8fb8de 38%,#a9cbe6 55%,#e8b56c 72%,#d9764a 78%,#2a2f52 85%,#16203c 100%)}',
      '.hxw-r::-webkit-slider-thumb{-webkit-appearance:none;width:13px;height:13px;margin-top:-5px;border-radius:50%;background:#f4e9c8;border:2px solid #d4b25a;box-shadow:0 0 0 4px rgba(212,178,90,.15)}',
      '.hxw-r::-moz-range-thumb{width:10px;height:10px;border-radius:50%;background:#f4e9c8;border:2px solid #d4b25a;box-shadow:0 0 0 4px rgba(212,178,90,.15)}',
      '.hxw-s{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;padding:2px;border-radius:9px;background:rgba(255,255,255,.05);border:1px solid rgba(212,178,90,.12)}',
      '.hxw-s button{padding:.36rem 0;border:0;border-radius:7px;background:none;color:rgba(244,233,200,.6);font:inherit;font-size:.68rem;letter-spacing:.04em;cursor:pointer;transition:background .25s,color .25s}',
      '.hxw-s button{position:relative}.hxw-s button.is-now::after{content:"";position:absolute;left:50%;bottom:3px;width:3px;height:3px;margin-left:-1.5px;border-radius:50%;background:rgba(212,178,90,.8)}',
      '.hxw-s button:hover{color:#f4e9c8}.hxw-s button[aria-pressed="true"]{background:rgba(212,178,90,.2);color:#f4e9c8}',
      '@media(max-width:980px){.hxw{right:.9rem;bottom:.7rem}.hxw-p{width:min(250px,calc(100vw - 2rem))}.hxw-row{align-self:stretch;justify-content:space-between}}'].join('');
    document.head.appendChild(css);
    var box = document.createElement('div'); box.className = 'hxw';
    box.innerHTML = '<div class="hxw-p" id="hxwP" role="group" aria-label="Пора доби й року">' +
      '<div class="hxw-h"><span class="hxw-k">Пора доби</span><span class="hxw-t"></span><button type="button" class="hxw-now" hidden>зараз</button></div>' +
      '<input class="hxw-r" type="range" min="0" max="1439" step="5" aria-label="Час доби">' +
      '<div class="hxw-h" style="margin-bottom:.4rem"><span class="hxw-k">Пора року</span></div>' +
      '<div class="hxw-s">' + [['summer', 'Літо'], ['autumn', 'Осінь'], ['winter', 'Зима']].map(function(q){ return '<button type="button" data-s="' + q[0] + '" aria-pressed="' + (q[0] === SEASON) + '"' + (q[0] === NOWS ? ' class="is-now" title="Пора року зараз"' : '') + '>' + q[1] + '</button>'; }).join('') + '</div></div>' +
      '<button type="button" class="hxw-b" aria-label="Змінити пору доби й року" aria-expanded="false" aria-controls="hxwP"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M4.5 13.5a5.5 5.5 0 0 1 11 0"/><path d="M2 13.5h16M10 3.2v1.6M4.2 5.6l1.1 1.1M15.8 5.6l-1.1 1.1M6 16.5h8"/></svg></button>';
    var full = document.getElementById('hxFull');                                   // sits in line with «Розглянути зблизька», same height
    if (full && full.parentNode){ var row = document.createElement('div'); row.className = 'hxw-row'; full.parentNode.insertBefore(row, full); row.appendChild(full); row.appendChild(box); }
    else host.appendChild(box);
    var btn = box.querySelector('.hxw-b'), rng = box.querySelector('.hxw-r'), lab = box.querySelector('.hxw-t'), now = box.querySelector('.hxw-now');
    function fmt(m){ m = Math.round(m) % 1440; return ('0' + Math.floor(m/60)).slice(-2) + ':' + ('0' + m % 60).slice(-2); }
    function show(){ var m = override == null ? kyivNow() : override; rng.value = m; lab.textContent = fmt(m); now.hidden = override == null; }
    var raf = 0;
    rng.addEventListener('input', function(){ override = +rng.value; lab.textContent = fmt(override); now.hidden = false; if (!raf) raf = requestAnimationFrame(function(){ raf = 0; setSky(); }); });
    now.addEventListener('click', function(){ override = null; show(); setSky(); });
    box.querySelectorAll('[data-s]').forEach(function(b){ b.addEventListener('click', function(){
      box.querySelectorAll('[data-s]').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); }); setSeason(b.dataset.s); }); });
    function open(v){ box.classList.toggle('open', v); btn.setAttribute('aria-expanded', String(v)); if (v) show(); }
    btn.addEventListener('click', function(e){ e.stopPropagation(); open(!box.classList.contains('open')); });
    document.addEventListener('pointerdown', function(e){ if (box.classList.contains('open') && !box.contains(e.target)) open(false); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') open(false); });
    setInterval(function(){ if (override == null && box.classList.contains('open')) show(); }, 30000);
    show();
  })();
  api.heroSeason = setSeason; api.heroTime = function(m){ override = m; setSky(); };

  var smoke = null;
  setSky(); setInterval(setSky, 60000);

  /* ── frame the church on the right, so the copy on the left has open sky and land behind it ── */
  var shift = o.shift || 0;
  function frame(){
    var w = renderer.domElement.clientWidth, h = renderer.domElement.clientHeight; if (!w || !h) return;
    if (shift) cam.setViewOffset(w, h, -w*shift, 0, w, h); else cam.clearViewOffset();
    cam.far = 1200; cam.updateProjectionMatrix();
  }
  frame(); requestAnimationFrame(frame);
  if ('ResizeObserver' in window) new ResizeObserver(function(){ requestAnimationFrame(frame); }).observe(renderer.domElement);
  api.setShift = function(s){ shift = s; frame(); };
  window.__heroApi = api;

  /* ── a view, not a turntable: the camera stays before the church, swinging between the front-left (north-west, the river
     valley behind) and the front-right — what lies behind the visitor, the town before the square, is never turned to;
     left alone it drifts slowly back and forth ── */
  var ctl = api.controls, A0 = -1.08, A1 = .72;                                      // azimuth: 0 is straight before the facade
  ctl.autoRotate = false; ctl.minAzimuthAngle = A0; ctl.maxAzimuthAngle = A1;
  ctl.minPolarAngle = Math.PI*.33; ctl.maxPolarAngle = Math.PI*.47;
  var lastTouch = -1e9, swayT = 0, sp = new T.Spherical(), off = new T.Vector3();
  ctl.addEventListener('start', function(){ lastTouch = performance.now(); });
  ctl.addEventListener('end', function(){ lastTouch = performance.now(); });
  function sway(now, dt){
    if (reduced || now - lastTouch < 7000 || api.__hold) return;
    swayT += dt;
    off.copy(cam.position).sub(ctl.target); sp.setFromVector3(off);
    var mid = (A0 + A1)/2, amp = (A1 - A0)/2*.82, goal = mid + amp*Math.sin(swayT*.045 - .9);
    var k = Math.min(1, dt*.35);                                                       // ease in after the visitor lets go
    sp.theta += (goal - sp.theta)*k*Math.min(1, (now - lastTouch - 7000)/4000);
    off.setFromSpherical(sp); cam.position.copy(ctl.target).add(off); cam.lookAt(ctl.target);
  }

  /* ── animation ── */
  var t0 = performance.now();
  var lastNow = t0;
  (function tick(now){
    var t = (now - t0)/1000; U.uTime.value = reduced ? 0 : t;
    var dtt = Math.min(.1, (now - lastNow)/1000); sway(now, dtt); stepSeason(dtt); lastNow = now;
    birds.forEach(function(b){ var d = b.userData, a = t*d.sp + d.ph; b.position.set(d.cx + Math.cos(a)*d.rad, d.h + Math.sin(t*.4 + d.ph)*1.2, d.cz + Math.sin(a)*d.rad);
      b.rotation.y = -a; var f = Math.sin(t*7 + d.ph*5)*.55; d.l.rotation.z = f; d.r.rotation.z = -f; });
    if (smoke){ var P = smoke.geometry.attributes.position, s = smoke.userData;
      for (var i = 0; i < P.count; i++){ var u = (s.seed[i] + t*.05) % 1, top = s.tops[i % s.tops.length]; P.setXYZ(i, top.x + u*6 + Math.sin(u*9 + i)*u*.8, top.y + u*9, top.z + u*2.5 + Math.cos(u*7 + i)*u*.6); }
      P.needsUpdate = true; }
    requestAnimationFrame(tick);
  })(t0);
  return api;
}
window.HeroLand = {attach: attach};
})();
