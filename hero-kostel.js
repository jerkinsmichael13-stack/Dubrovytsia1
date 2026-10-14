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

  /* ── the land, after the aerial photograph: the church stands on the edge of the town's hill. Behind it and to the south the
     ground breaks and falls to the flood-plain of the Horyn — a broad river with sandbanks, wet meadows, reeds and old bends,
     and beyond it a long field, a small winding stream, and woods far off. In front: the little square and the street;
     to the north (left) the plebania and the town. Distances in metres, the church's middle at (0, −15). ── */
  var GX = 0, GZ = -15;
  var VX = .45, VZ = -.893, TX = .893, TZ = .45;                                     // s: from the town down toward the river; t: along the valley
  function sOf(x, z){ return (x - GX)*VX + (z - GZ)*VZ; }
  function tOf(x, z){ return (x - GX)*TX + (z - GZ)*TZ; }
  function at(s, t){ return [GX + s*VX + t*TX, GZ + s*VZ + t*TZ]; }
  function scarp(t){ return 40 + 6*Math.sin(t/47 + 1) + 4*Math.sin(t/23 + .3); }    // where the hill breaks: close behind the churchyard
  function riverS(t){ return 186 + 30*Math.sin(t/170 + .6) + 10*Math.sin(t/61 + 2); }
  function brookS(t){ return riverS(t) + 260 + 30*Math.sin(t/41 + 1.3) + 12*Math.sin(t/17); }
  var RW = 86, PLAIN = -21, WATER = -22.3;                                          // the bank is a good twenty metres high
  var OXB = [[-170, 100, 16, .4, 3.7], [240, 300, 28, 2.3, 5.7], [-420, 320, 24, -.4, 2.6]];   // old bends: t, s of the centre, radius, arc
  function oxDist(s, t){ var m = 1e9; OXB.forEach(function(o){ var dt = t - o[0], ds = s - o[1], a = Math.atan2(ds, dt); if (a < o[3]) a += 6.283;
    if (a > o[3] && a < o[4] || a - 6.283 > o[3] && a - 6.283 < o[4]) m = Math.min(m, Math.abs(Math.hypot(dt, ds) - o[2])); }); return m; }
  function H(x, z){
    var s = sOf(x, z), t = tOf(x, z), r = Math.hypot(x - GX, z - GZ), sc = scarp(t);
    var h = (fbm(x*.016, z*.016) - .5)*1.8*ss(42, 95, r)*(1 - ss(sc - 25, sc, s));   // the town's ground: gently uneven, level round the church
    h += PLAIN*ss(sc - 4, sc + 22, s);                                                // the bank down to the flood-plain
    var pl = ss(sc + 18, sc + 34, s);
    h += pl*(fbm(x*.022 + 7, z*.022 + 3) - .5)*.9;                                    // hummocks on the meadow
    h -= pl*.7*ss(.58, .78, fbm(x*.008 + 20, z*.008 + 4));                             // wet hollows
    var d = Math.abs(s - riverS(t)); h -= 2.6*(1 - ss(RW/2 - 9, RW/2 + 2, d))*pl;
    var d2 = Math.abs(s - brookS(t)); h -= 1.9*(1 - ss(6, 15, d2))*pl;
    var od = oxDist(s, t); if (od < 12) h -= 1.8*(1 - ss(3, 10, od))*pl;
    h += 7*ss(600, 950, s);                                                            // far off the land rises to the woods
    return h;
  }
  /* roads: the street before the square, the lane past the plebania, a few town streets, and the track down the bank to the ferry */
  var ROADS = [[[-560, 66], [150, 66]], [[-48, 66], [-48, -110]], [[-48, -100], [-430, -100]], [[-140, 66], [-140, -150]], [[-260, 160], [-260, -100]], [[-48, -45], [-430, -45]], [[-95, 66], [-95, -100]], [[-200, 160], [-200, -100]], [[-430, 112], [60, 112]], [[-330, 160], [-330, -100]],
    [[80, 66], [104, 30], [126, -10], [150, -50], [178, -88], [202, -150]]];
  var STAIR = [at(30, -6), at(76, -6)];                                             // steps down the bank behind the church, to the lower town
  ROADS.push([[0, -43], STAIR[0]], STAIR);
  ROADS.push((function(){ var R = []; for (var t = -560; t <= 420; t += 40){ var q = at(scarp(t) + 34, t); R.push(q); } return R; })());   // the street along the foot of the bank
  function roadD(x, z){ var m = 1e9; ROADS.forEach(function(R){ for (var i = 1; i < R.length; i++){ var a = R[i - 1], b = R[i], dx = b[0] - a[0], dz = b[1] - a[1], L = dx*dx + dz*dz,
    k = Math.max(0, Math.min(1, ((x - a[0])*dx + (z - a[1])*dz)/L)), ex = a[0] + dx*k - x, ez = a[1] + dz*k - z; m = Math.min(m, Math.hypot(ex, ez)); } }); return m; }
  function roadDir(x, z){ var m = 1e9, ang = 0; ROADS.forEach(function(R){ for (var i = 1; i < R.length; i++){ var a = R[i - 1], b = R[i], dx = b[0] - a[0], dz = b[1] - a[1], L = dx*dx + dz*dz,
    k = Math.max(0, Math.min(1, ((x - a[0])*dx + (z - a[1])*dz)/L)), d = Math.hypot(a[0] + dx*k - x, a[1] + dz*k - z); if (d < m){ m = d; ang = Math.atan2(dz, dx); } } }); return ang; }
  var YARD = {x0: -20, x1: 20, z0: -41, z1: 11};                                     // the churchyard fence
  var SQ = {x0: -44, x1: 56, z0: 11, z1: 62};                                         // the market square before it
  var PLEB = {x: -33, z: -6, len: 14, wid: 10.5};                                    // the plebania: beside the front of the church, its long side parallel to it, gable to the square
  function plateau(x, z){ return sOf(x, z) < scarp(tOf(x, z)) - 14; }
  function keepClear(x, z, m){ m = m || 0;
    return (x > YARD.x0 - 6 - m && x < YARD.x1 + 6 + m && z > YARD.z0 - 8 - m && z < 26 + m) || (x > SQ.x0 - 3 - m && x < SQ.x1 + 3 + m && z > SQ.z0 - 2 - m && z < SQ.z1 + 7 + m) ||
      (x > -44 - m && x < -21 + m && z > -20 - m && z < 6 + m); }

  /* the town: wooden and plastered houses along the streets, each with its yard and a few fruit trees */
  var HOUSES = [], rndH = (function(seed){ return function(){ seed = (seed*16807) % 2147483647; return (seed - 1)/2147483646; }; })(1742);
  for (var hx = -470; hx < 260; hx += 19) for (var hz = -330; hz < 200; hz += 19){
    var px = hx + (rndH() - .5)*9, pz = hz + (rndH() - .5)*9, rd = roadD(px, pz);
    var sp2 = sOf(px, pz), tp2 = tOf(px, pz), low = sp2 > scarp(tp2) + 24 && sp2 < riverS(tp2) - RW/2 - 12;   // the lower town along the river
    if (rndH() > .74 || rd < 8 || rd > 22 || !(plateau(px, pz) || low) || keepClear(px, pz, 4)) continue;
    HOUSES.push({x: px, z: pz, a: roadDir(px, pz) + (rndH() < .5 ? 0 : Math.PI), w: 8 + rndH()*4, d: 6 + rndH()*2, h: 2.9 + rndH()*.7, k: rndH()});
  }
  function nearHouse(x, z, r){ for (var i = 0; i < HOUSES.length; i++){ var q = HOUSES[i]; if (Math.abs(q.x - x) < r && Math.abs(q.z - z) < r) return true; } return false; }

  /* trees and woods: none on the open meadow but here and there; willows along the river; woods far off */
  function forest(x, z){
    var s = sOf(x, z), t = tOf(x, z), sc = scarp(t), f = 0, r = Math.hypot(x - GX, z - GZ);
    if (s > sc - 14 && s < sc + 30) f = .5*ss(.4, .7, fbm(x*.02 + 4, z*.02 + 9));        // clumps on the bank
    if (s < sc - 14 && r > 420) f = .75;                                               // woods behind the town
    if (s > 620) f = .8*ss(620, 680, s);                                               // the far woods
    var wet = ss(.6, .75, fbm(x*.008 + 20, z*.008 + 4)); if (s > sc + 40 && s < 600) f = Math.max(f, .35*wet);   // alders in the wet hollows
    if (Math.abs(s - riverS(t)) < RW/2 + 4 || Math.abs(s - brookS(t)) < 6 || oxDist(s, t) < 7) f = 0;
    if (roadD(x, z) < 6 || keepClear(x, z, 6)) f = 0;
    return Math.min(1, f);
  }

  /* ── terrain mesh with painted zones ── */
  var SIZE = 1700, SEG = lite ? 150 : 250, CX = 120, CZ = -250;
  var tg = new T.PlaneGeometry(SIZE, SIZE, SEG, SEG); tg.rotateX(-Math.PI/2); tg.translate(CX, 0, CZ);
  var tp = tg.attributes.position, col = new Float32Array(tp.count*3), C = new T.Color();
  var cTown = lin('#6b7a40'), cGard = lin('#7d6c48'), cBank = lin('#647a3c'), cMead = lin('#7f9446'), cMeadY = lin('#a39c58'), cMud = lin('#6b5f43'), cFloor = lin('#465230'),
      cField = [lin('#a3954f'), lin('#7c8b42'), lin('#b8a462'), lin('#919049'), lin('#6e7d3d'), lin('#8a7a4a')], cRoad = lin('#8a7652'), cWet = lin('#4f5a35'),
      cReed = lin('#8b8650'), cSand = lin('#cdbb8c');
  for (var i = 0; i < tp.count; i++){
    var x = tp.getX(i), z = tp.getZ(i), h = H(x, z); tp.setY(i, h);
    var s = sOf(x, z), t = tOf(x, z), sc = scarp(t), n = fbm(x*.08, z*.08), rs = riverS(t), d = Math.abs(s - rs);
    if (s < sc - 10){ C.copy(cTown); var plot = hash(Math.floor((x + 2000)/26), Math.floor((z + 2000)/34)); if (plot > .55 && Math.hypot(x - GX, z - GZ) > 60) C.lerp(cGard, .4); }
    else if (s < sc + 30) C.copy(cBank).lerp(cMeadY, ss(.5, .8, n)*.4);
    else if (s > rs + RW/2 + 30 && s < 600 && Math.abs(s - brookS(t)) > 22){ var k = Math.floor(hash(Math.floor((s + 2000)/24), Math.floor((t + 3000)/150))*6); C.copy(cField[k]); }
    else { C.copy(cMead).lerp(cMeadY, ss(.45, .8, n)*.6); C.lerp(cWet, ss(.55, .75, fbm(x*.008 + 20, z*.008 + 4))*.8); }
    if (s > sc + 30 && s < 600){                                                       // reeds round still water, sand on the river's edges
      var od = oxDist(s, t); C.lerp(cReed, (1 - ss(4, 16, od))*.8);
      C.lerp(cReed, (1 - ss(4, 12, Math.abs(s - brookS(t))))*.6);
      if (d > RW/2 - 7 && d < RW/2 + 6) C.lerp(cSand, ss(.42, .62, fbm(t*.02 + 3, s*.05))*(1 - ss(RW/2 + 2, RW/2 + 6, d)));
      C.lerp(cMud, (1 - ss(RW/2 - 6, RW/2 - 2, d))*.9);
    }
    var fr = forest(x, z); C.lerp(cFloor, ss(.15, .5, fr)*.8);
    if (roadD(x, z) < 3.2) C.copy(cRoad).multiplyScalar(.92 + .16*n);
    C.multiplyScalar(.86 + .28*n);
    col[i*3] = C.r; col[i*3 + 1] = C.g; col[i*3 + 2] = C.b;
  }
  tg.setAttribute('color', new T.BufferAttribute(col, 3)); tg.computeVertexNormals();
  var terrM = new T.MeshStandardMaterial({vertexColors: true, roughness: 1});
  /* surface detail: grass tussocks, bare patches and furrows drawn from world position, fading with distance */
  terrM.userData.noSnow = true;
  terrM.onBeforeCompile = function(sh){
    sh.uniforms.uWSnow = U.uWSnow; sh.uniforms.uAut = U.uAut;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vTW;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvTW = (modelMatrix*vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vTW;\nuniform float uWSnow, uAut;\nfloat th(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }\nfloat tn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f); return mix(mix(th(i), th(i + vec2(1, 0)), f.x), mix(th(i + vec2(0, 1)), th(i + vec2(1, 1)), f.x), f.y); }')
      .replace('#include <color_fragment>', ['#include <color_fragment>',
        'float dd = length(vTW - cameraPosition), fd = 1.0 - smoothstep(60.0, 260.0, dd);',
        'float g1 = tn(vTW.xz*1.7), g2 = tn(vTW.xz*6.3 + 3.1), g3 = tn(vTW.xz*.33 + 7.7);',
        'float tuft = (g1*.6 + g2*.4 - .5)*.34*fd + (g3 - .5)*.22;',
        'diffuseColor.rgb *= 1.0 + tuft;',
        'diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb*vec3(1.12, 1.05, .78), smoothstep(.62, .82, g3)*.5);',      // drier, yellower patches
        'float sv = dot(vTW.xz - vec2(0.0, -15.0), vec2(.45, -.893));',
        'float fur = abs(sin(sv*.9 + tn(vTW.xz*.05)*4.0));',
        'float field = step(335.0, sv)*step(sv, 600.0);',
        'diffuseColor.rgb *= mix(1.0, .9 + .14*fur, field*(1.0 - smoothstep(250.0, 700.0, dd)));',      // furrows in the fields
        /* autumn: the grass goes to straw and rust; winter: snow lies everywhere but thins in the furrows and under the trees */
        'diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb*vec3(1.42, 1.0, .5) + vec3(.014, .004, 0.0), uAut*(.68 + .32*g3));',
        'float snw = uWSnow*smoothstep(.12, .42, g1*.45 + g3*.55 + .12 - field*fur*.12);',
        'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.80, .83, .88)*(.93 + .1*g2), snw);'].join('\n'));
  };
  var terrain = new T.Mesh(tg, terrM); terrain.receiveShadow = true; scene.add(terrain);

  /* the model's own ground disc gives way to the land */
  scene.children.forEach(function(c){ if (c.isMesh && c.geometry && c.geometry.type === 'CircleGeometry' && c.geometry.parameters.radius > 40) c.visible = false; });

  /* ── the churchyard and the square, painted onto a skin that follows the ground: grass inside the fence, a stone path from the
     gate to the portal, gravel round the church, the trodden square with cart ruts, the street and the lane ── */
  (function(){
    var S = 180, N = lite ? 110 : 170, CW = 2048, cv = document.createElement('canvas'); cv.width = cv.height = CW;
    var K = cv.getContext('2d'), px = CW/S, ox = -4, oz = 4;
    function X(x){ return (x - ox)*px + CW/2; } function Z(z){ return (z - oz)*px + CW/2; }
    function rect(x0, z0, x1, z1, c){ K.fillStyle = c; K.fillRect(X(x0), Z(z0), (x1 - x0)*px, (z1 - z0)*px); }
    function speck(x0, z0, x1, z1, cols, n, r){ for (var i = 0; i < n; i++){ K.fillStyle = cols[i % cols.length]; K.globalAlpha = .35 + Math.random()*.4;
      K.beginPath(); K.ellipse(X(x0 + Math.random()*(x1 - x0)), Z(z0 + Math.random()*(z1 - z0)), r*px*(.6 + Math.random()), r*px*(.4 + Math.random()*.6), Math.random()*3, 0, 6.283); K.fill(); } K.globalAlpha = 1; }
    /* the street and the lane */
    rect(-94, 63.2, 86, 68.8, 'rgba(140,118,82,.9)'); rect(-50.8, -86, -45.2, 63.2, 'rgba(140,118,82,.9)');
    speck(-94, 63.2, 86, 68.8, ['#7a6648', '#9c8a66', '#6c5a40'], 1400, .25); speck(-50.8, -86, -45.2, 63.2, ['#7a6648', '#9c8a66'], 700, .25);
    /* the market square: trodden earth, cobbles near the gate, wheel ruts, grass creeping in at the edges */
    rect(SQ.x0, SQ.z0 + .4, SQ.x1, SQ.z1 + 1.2, '#a08d6c'); speck(SQ.x0, SQ.z0, SQ.x1, SQ.z1, ['#8c7a5a', '#b5a283', '#7b6a4e', '#c2b190'], 9000, .24);
    rect(-8, 11.4, 8, 20, 'rgba(150,140,118,.6)'); speck(-8, 11.4, 8, 20, ['#b9ae98', '#958a76'], 1600, .2);
    K.strokeStyle = 'rgba(92,76,52,.4)'; K.lineWidth = .35*px;
    for (var r2 = 0; r2 < 9; r2++){ var z0 = 18 + r2*4.6 + Math.random()*2; K.beginPath(); K.moveTo(X(SQ.x0), Z(z0)); K.bezierCurveTo(X(-10), Z(z0 - 3 + Math.random()*6), X(20), Z(z0 - 3 + Math.random()*6), X(SQ.x1), Z(z0 + Math.random()*4 - 2)); K.stroke(); }
    [[SQ.x0, SQ.z0, SQ.x0 + 4, SQ.z1], [SQ.x1 - 5, SQ.z0, SQ.x1, SQ.z1], [SQ.x0, SQ.z1 - 3, SQ.x1, SQ.z1 + 1]].forEach(function(b){ speck(b[0], b[1], b[2], b[3], ['#6d7a40', '#7e8a4a', '#5f6e38'], 1200, .5); });
    /* the churchyard: grass, a stone path to the portal, gravel round the church */
    rect(YARD.x0, YARD.z0, YARD.x1, YARD.z1, '#5d7136');
    for (var i = 0; i < 26; i++) rect(YARD.x0 + i*(YARD.x1 - YARD.x0)/26, YARD.z0, YARD.x0 + (i + .5)*(YARD.x1 - YARD.x0)/26, YARD.z1, 'rgba(255,255,220,.035)');
    speck(YARD.x0, YARD.z0, YARD.x1, YARD.z1, ['#4f6430', '#6c8040', '#7a8a48'], 2400, .3);
    K.fillStyle = '#b3a68c'; K.beginPath(); K.roundRect ? K.roundRect(X(-13.4), Z(-32.9), 26.8*px, 35.2*px, 1.2*px) : K.rect(X(-13.4), Z(-32.9), 26.8*px, 35.2*px); K.fill();
    speck(-13.4, -32.9, 13.4, 2.3, ['#9c907a', '#c6baa0', '#8a7f6a'], 2200, .12);
    rect(-1.7, 1.5, 1.7, YARD.z1 + .4, '#a39985');
    for (var zz = 1.6; zz < YARD.z1 + .3; zz += .55) for (var xx = -1.6 + (Math.round(zz/.55) % 2)*.27; xx < 1.6; xx += .55){ K.fillStyle = Math.random() < .5 ? '#b9ae98' : '#958a76'; K.fillRect(X(xx) + 1, Z(zz) + 1, .5*px - 2, .5*px - 2); }
    /* the plebania's yard and the path to its door */
    rect(-44.5, -20, -21, 1, 'rgba(104,120,62,.7)'); speck(-44.5, -20, -21, 1, ['#5f7038', '#7d8a4a'], 900, .3); rect(-30.6, 1, -28.4, SQ.z0 + 1, '#9a8a6c');
    K.save(); K.globalCompositeOperation = 'destination-in';                          // soft outer edge
    var rg = K.createRadialGradient(CW/2, CW/2, CW*.38, CW/2, CW/2, CW*.5); rg.addColorStop(0, '#000'); rg.addColorStop(1, 'rgba(0,0,0,0)'); K.fillStyle = rg; K.fillRect(0, 0, CW, CW); K.restore();
    var g = new T.PlaneGeometry(S, S, N, N); g.rotateX(-Math.PI/2); g.translate(ox, 0, oz);
    var p = g.attributes.position; for (var j = 0; j < p.count; j++) p.setY(j, H(p.getX(j), p.getZ(j)) + .04);
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
  /* the Horyn: a broad ribbon following its bends; the small stream beyond; still water in the old bends */
  function ribbon(fn, W, y, flow, t0, t1, segs){
    var pos = [], uv = [], idx = [];
    for (var i = 0; i <= segs; i++){
      var t = t0 + (t1 - t0)*i/segs, s = fn(t), ds = (fn(t + .5) - fn(t - .5));
      var nl = Math.hypot(1, ds), ns = 1/nl, nt = -ds/nl;                             // the normal across the ribbon, in (s, t)
      var a = at(s - ns*W/2, t - nt*W/2), b = at(s + ns*W/2, t + nt*W/2);
      pos.push(a[0], y, a[1], b[0], y, b[1]); uv.push(0, i/segs, 1, i/segs);
      if (i) idx.push(2*i - 2, 2*i - 1, 2*i, 2*i - 1, 2*i + 1, 2*i);
    }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    var m = waterM; if (flow !== 1){ m = waterM.clone(); m.uniforms = Object.assign({}, waterM.uniforms, {uFlow: {value: flow}}); }
    var me = new T.Mesh(g, m); me.renderOrder = 2; scene.add(me); return me;
  }
  ribbon(riverS, RW + 4, WATER, 1, -1000, 1000, lite ? 300 : 520);
  ribbon(brookS, 22, WATER + .45, .35, -1000, 1000, lite ? 360 : 600);
  (function(){
    var pm = waterM.clone(); pm.uniforms = Object.assign({}, waterM.uniforms, {uFlow: {value: .05}});
    OXB.forEach(function(o){
      var segs = 60, W = 12, pos = [], uv = [], idx = [], a0 = o[3], a1 = o[4];
      for (var i = 0; i <= segs; i++){ var a = a0 + (a1 - a0)*i/segs, w = W*(.35 + .65*Math.sin(Math.PI*i/segs)), ca = Math.cos(a), sa = Math.sin(a);
        var p = at(o[1] + sa*(o[2] - w/2), o[0] + ca*(o[2] - w/2)), q = at(o[1] + sa*(o[2] + w/2), o[0] + ca*(o[2] + w/2));
        pos.push(p[0], WATER + .5, p[1], q[0], WATER + .5, q[1]); uv.push(0, i/segs, 1, i/segs); if (i) idx.push(2*i - 2, 2*i - 1, 2*i, 2*i - 1, 2*i + 1, 2*i); }
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      var m = new T.Mesh(g, pm); m.renderOrder = 2; scene.add(m);
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

  /* ── the town: small houses of logs or whitewashed plaster under shingle, thatch or tile ── */
  (function(){
    var walls = new Batch(), roofs = new Batch(), WALL = ['#e8e1d0', '#ddd2bb', '#a88a64', '#c7b394', '#efe9dc', '#9c7d58'].map(lin), ROOF = ['#5b524a', '#7a6646', '#8d5a40', '#4f4b47', '#6e5a44'].map(lin);
    var dark = lin('#2a2622'), trimC = lin('#f0ebe0');
    HOUSES.forEach(function(q){
      var y = H(q.x, q.z), wc = WALL[Math.floor(q.k*WALL.length)], rc = ROOF[Math.floor(hash(q.x, q.z)*ROOF.length)];
      walls.add(BOX, mtx(q.x, y + q.h/2 - .3, q.z, -q.a, q.w, q.h + .6, q.d), wc);
      var gable = q.k > .45, rh = q.d*(gable ? .62 : .5);
      if (gable) roofs.add(GAB, mtx(q.x, y + q.h - .3, q.z, -q.a + Math.PI/2, q.d*1.12, rh, q.w*1.06), rc);
      else roofs.add(HIP, mtx(q.x, y + q.h - .3, q.z, -q.a, q.w*1.1, rh, q.d*1.14), rc);
      var ca = Math.cos(-q.a), sa = Math.sin(-q.a);                                    // windows on the long sides
      [-1, 1].forEach(function(side){ for (var k = -1; k <= 1; k++){ var lx = k*q.w*.3, lz = side*(q.d/2 + .02);
        walls.add(BOX, mtx(q.x + lx*ca + lz*sa, y + q.h*.55, q.z - lx*sa + lz*ca, -q.a, .95, 1.05, .08), trimC);
        walls.add(BOX, mtx(q.x + lx*ca + (lz + side*.03)*sa, y + q.h*.55, q.z - lx*sa + (lz + side*.03)*ca, -q.a, .7, .8, .06), dark); } });
      if (q.k > .3) walls.add(BOX, mtx(q.x + q.w*.2*ca, y + q.h + rh*.6, q.z - q.w*.2*sa, -q.a, .55, 1.6, .55), lin('#8a7a6a'));   // chimney
    });
    var m1 = new T.MeshStandardMaterial({vertexColors: true, roughness: .92}), m2 = new T.MeshStandardMaterial({vertexColors: true, roughness: .85, flatShading: true});
    walls.mesh(m1); roofs.mesh(m2);
  })();

  /* the steps down the bank behind the church: stone treads on the slope with a low kerb either side */
  (function(){
    var a = STAIR[0], b = STAIR[1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[0] - a[0], b[1] - a[1]), st = new Batch(), c1 = lin('#b9b2a2'), c2 = lin('#9a9384');
    for (var d = 0; d < len; d += .55){ var x = a[0] + (b[0] - a[0])*d/len, z = a[1] + (b[1] - a[1])*d/len, yy = H(x, z);
      st.add(BOX, mtx(x, yy + .05, z, ang, 2.6, .3, .62), c1);
      [-1, 1].forEach(function(sd){ st.add(BOX, mtx(x + Math.cos(ang)*sd*1.5, yy + .2, z - Math.sin(ang)*sd*1.5, ang, .3, .45, .62), c2); }); }
    st.mesh(new T.MeshStandardMaterial({vertexColors: true, roughness: .95}));
  })();

  /* market day on the square: peasant carts with their horses unharnessed or standing in the shafts, a few stalls under canvas */
  (function(){
    var wb = new Batch(), wood = lin('#6b5236'), dark = lin('#3e3024'), cloth = [lin('#e7e0cf'), lin('#c9b48a'), lin('#d8cbb0')], HC = [lin('#5a3a26'), lin('#3b2a1e'), lin('#8a6a48'), lin('#2a221c')];
    var wheel = new T.TorusGeometry(.42, .06, 5, 12), rr = function(){ return Math.random(); };
    function cart(x, z, a, horse){
      var yy = H(x, z), ca = Math.cos(a), sa = Math.sin(a);
      function P(lx, ly, lz){ return [x + lx*ca + lz*sa, yy + ly, z - lx*sa + lz*ca]; }
      var q = P(0, .95, 0); wb.add(BOX, mtx(q[0], q[1], q[2], a, 1.25, .12, 2.8), wood);              // the bed
      [-1, 1].forEach(function(sd){ q = P(sd*.62, 1.22, 0); wb.add(BOX, mtx(q[0], q[1], q[2], a, .06, .5, 2.8), wood);   // ladder sides
        [-1.0, 1.0].forEach(function(lz){ q = P(sd*.7, .45, lz); wb.add(wheel, mtx(q[0], q[1], q[2], a + Math.PI/2), dark); }); });
      [-1, 1].forEach(function(sd){ q = P(sd*.32, .85, 2.4); wb.add(BOX, mtx(q[0], q[1], q[2], a, .07, .07, 2.2), wood); });   // shafts
      if (rr() < .6){ q = P(0, 1.35, -.3); wb.add(BOX, mtx(q[0], q[1], q[2], a, 1.0, .5, 1.6), cloth[Math.floor(rr()*3)]); }  // a load under a sheet
      if (!horse) return;
      var hc = HC[Math.floor(rr()*HC.length)], hz = 3.3;
      q = P(0, 1.25, hz); wb.add(BOX, mtx(q[0], q[1], q[2], a, .55, .62, 1.55), hc);
      q = P(0, 1.68, hz + .9); var nk = new T.Matrix4().compose(V1.set(q[0], q[1], q[2]), Q.setFromEuler(E.set(-.7, a, 0, 'YXZ')), V2.set(.32, .38, .8)); wb.add(BOX, nk, hc);
      q = P(0, 1.95, hz + 1.3); wb.add(BOX, mtx(q[0], q[1], q[2], a, .26, .3, .62), hc);
      [[-.18, .6], [.18, .6], [-.18, -.6], [.18, -.6]].forEach(function(l){ q = P(l[0], .48, hz + l[1]); wb.add(BOX, mtx(q[0], q[1], q[2], a, .13, .96, .13), hc); });
    }
    var spots = [[14, 30, .4], [22, 36, 1.9], [30, 27, -.6], [-6, 44, 2.6], [8, 49, .2], [38, 46, 1.2], [-18, 52, -1.0], [44, 22, 2.2], [-30, 22, .9], [26, 55, -2.4]];
    spots.forEach(function(q, k){ cart(q[0], q[1], q[2], k % 3 !== 2); });
    [[-34, 44], [-36, 30], [48, 33]].forEach(function(q){ var yy = H(q[0], q[1]);                  // stalls
      wb.add(BOX, mtx(q[0], yy + .45, q[1], .2, 3.2, .9, 1.4), wood);
      [[-1.5, -.6], [1.5, -.6], [-1.5, .6], [1.5, .6]].forEach(function(o){ wb.add(BOX, mtx(q[0] + o[0], yy + 1.2, q[1] + o[1], .2, .08, 2.4, .08), dark); });
      wb.add(GAB, mtx(q[0], yy + 2.35, q[1], .2 + Math.PI/2, 1.9, .7, 3.5), cloth[0]); });
    wb.mesh(new T.MeshStandardMaterial({vertexColors: true, roughness: .9}));
  })();

  /* ── the plebania: a stone house under a tiled roof beside the front of the church, its long side parallel to the church and its
     gable to the square — a pediment with two round windows, windows below, and on the right a porch with its own little roof
     on posts, as on the houses of the town (as it was before the later wing on the left) ── */
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
    win('f', -3.4, 2.3, 1.1, 1.5); win('f', -.9, 2.3, 1.1, 1.5); win('f', 1.4, 2.75, 1.2, .55);
    for (var k = -2; k <= 2; k++){ win('e', k*2.7, 2.3, 1.05, 1.5); if (k) win('w', k*2.7, 2.3, 1.05, 1.5); }
    /* the porch: a door on the right of the gable under a little gabled roof on four posts, with wooden steps */
    var px = P.x + 3.2;
    bx(1.15, 2.3, .1, px, 1.15 + .3, zf + .05, woodM).castShadow = false;
    bx(1.45, 2.55, .12, px, 1.3 + .3, zf + .03, frameM);
    gableRoof(2.5, 2.4, .95, px, 3.05, zf + 1.15);
    var pt = new T.Shape([new T.Vector2(-1.15, 0), new T.Vector2(1.15, 0), new T.Vector2(0, .85)]); pt.holes.push(new T.Path([new T.Vector2(-.9, .1), new T.Vector2(.9, .1), new T.Vector2(0, .66)]));
    var pg = new T.ExtrudeGeometry(pt, {depth: .08, bevelEnabled: false}); pg.translate(px, 3.05, zf + 2.3); g.add(new T.Mesh(pg, woodM));   // the little gable's boards
    [[-1, 1], [1, 1], [-1, .05], [1, .05]].forEach(function(q){ bx(.13, 2.75, .13, px + q[0]*1.0, 1.65, zf + q[1]*2.2, woodM); });
    [[-1], [1]].forEach(function(q){ bx(.06, .06, 2.2, px + q[0]*1.0, 1.25, zf + 1.1, woodM); bx(.06, .9, .06, px + q[0]*1.0, .85, zf + 1.6, woodM); });
    bx(2.2, .2, 2.4, px, .4, zf + 1.15, woodM); bx(1.6, .2, .5, px, .15, zf + 2.55, woodM);
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
    var FP = [-20, -13.5, -7.2, 7.2, 13.5, 20];
    FP.forEach(function(x){ mas.add(BOX, mtx(x, yF + 1.3, fz, 0, .78, 2.6, .78), wC); mas.add(BOX, mtx(x, yF + 2.68, fz, 0, .98, .16, .98), wC);
      mas.add(BOX, mtx(x, yF + 2.85, fz, 0, .62, .2, .62), wC); mas.add(HIP, mtx(x, yF + 2.95, fz, 0, .6, .55, .6), wC); });
    mas.add(BOX, mtx(-16.75, yF + 1.05, fz, 0, 5.7, 2.1, .45), wC); mas.add(BOX, mtx(-16.75, yF + 2.14, fz, 0, 5.9, .12, .55), wC);   // the solid stretch
    [[-13.5, -7.2], [-7.2, -3.3], [3.3, 7.2], [7.2, 13.5], [13.5, 20]].forEach(function(b){
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
    var cx = -24, cz = 34, yc = y(cx, cz);
    var c1 = new T.Mesh(new T.BoxGeometry(.24, 5.2, .24), woodM); c1.position.set(cx, yc + 2.6, cz); c1.castShadow = true; scene.add(c1);
    var c2 = new T.Mesh(new T.BoxGeometry(1.9, .22, .22), woodM); c2.position.set(cx, yc + 4.1, cz); c2.castShadow = true; scene.add(c2);
    var c3 = new T.Mesh(new T.BoxGeometry(2.0, .5, 2.0), postM); c3.position.set(cx, yc + .25, cz); scene.add(c3);
  })();

  /* ── trees: instanced crowns, a breath of wind in the vertex shader ── */
  function blobCrown(){                                                              // three lumps of foliage, merged
    var parts = [[0, 0, 0, 1], [.55, -.25, .2, .72], [-.45, -.2, -.35, .7], [.05, .45, -.1, .62]], P = [], N = [];
    parts.forEach(function(q){ var g = new T.IcosahedronGeometry(q[3], 1); g.translate(q[0], q[1], q[2]); P.push(g.attributes.position.array); N.push(g.attributes.normal.array); });
    return merge(P, N);
  }
  function coneCrown(){ var P = [], N = []; [[0, 0, 1, 1.6], [0, 1.0, .74, 1.3], [0, 1.85, .48, 1.0]].forEach(function(q){ var g = new T.ConeGeometry(q[2], q[3], 9).toNonIndexed(); g.translate(0, q[1], 0); P.push(g.attributes.position.array); N.push(g.attributes.normal.array); }); return merge(P, N); }
  function poplarCrown(){ var P = [], N = []; [[0, 0, .55, 1.0], [0, 1.1, .5, 1.0], [0, 2.1, .38, .9]].forEach(function(q){ var g = new T.IcosahedronGeometry(q[2], 1); g.scale(1, 1.7, 1); g.translate(0, q[1], 0); P.push(g.attributes.position.array); N.push(g.attributes.normal.array); }); return merge(P, N); }
  function merge(P, N){ var len = 0; P.forEach(function(a){ len += a.length; }); var p = new Float32Array(len), n = new Float32Array(len), at = 0;
    P.forEach(function(a, i){ p.set(a, at); n.set(N[i], at); at += a.length; }); var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(p, 3)); g.setAttribute('normal', new T.BufferAttribute(n, 3)); return g; }
  function windy(m, amt, bare){                                                      // bare: the crown thins in winter (uWSnow)
    m.customProgramCacheKey = function(){ return 'windy' + amt + (bare ? 'b' : ''); };   // each variant its own program
    m.onBeforeCompile = function(sh){
      sh.uniforms.uTime = U.uTime; sh.uniforms.uWSnow = U.uWSnow;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime, uWSnow;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + (bare ? 'transformed *= 1.0 - .3*uWSnow;\n' : '') + '#ifdef USE_INSTANCING\n vec3 ip = instanceMatrix[3].xyz;\n#else\n vec3 ip = vec3(0.0);\n#endif\n' +
          ' float k = max(0.0, position.y + 1.0);\n transformed.x += (sin(uTime*1.1 + ip.x*.13 + ip.z*.07) + .35*sin(uTime*2.7 + ip.z*.3))*' + amt.toFixed(3) + '*k;\n transformed.z += cos(uTime*.9 + ip.z*.11)*' + (amt*.6).toFixed(3) + '*k;\n vLY = position.y; vLN = normal;')
        .replace('#include <common>', '#include <common>\nvarying float vLY; varying vec3 vLN;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vLY; varying vec3 vLN;')
        .replace('#include <color_fragment>', '#include <color_fragment>\n float ao = smoothstep(-1.1, 1.0, vLY); diffuseColor.rgb *= .55 + .6*ao;\n diffuseColor.rgb *= 1.0 + .18*smoothstep(.3, 1.0, vLN.y);\n diffuseColor.rgb *= .9 + .2*fract(sin(dot(floor(vLN*7.0), vec3(12.9, 78.2, 37.7)))*43758.5);');
    };
  }
  var LEAF = ['#4f6f33', '#5b7a38', '#46652e', '#62803c', '#557334', '#6a8640'].map(lin), CON = ['#2e4a2f', '#33503a', '#2a4430'].map(lin), POP = lin('#7f9168');
  var crownM = new T.MeshStandardMaterial({roughness: .9, flatShading: true}); windy(crownM, .05, true);
  var conM = new T.MeshStandardMaterial({roughness: .95, flatShading: true}); windy(conM, .025);
  var trunkM = new T.MeshStandardMaterial({color: '#4a3826', roughness: 1});
  var list = {blob: [], cone: [], pop: []};
  function add(kind, x, z, s){ list[kind].push([x, H(x, z), z, s]); }
  /* the woods, the clumps on the bank and the alders in the wet hollows */
  var step = lite ? 13 : 9, rnd = (function(seed){ return function(){ seed = (seed*16807) % 2147483647; return (seed - 1)/2147483646; }; })(1740);
  for (var fx = CX - SIZE/2 + 4; fx < CX + SIZE/2 - 4; fx += step) for (var fz = CZ - SIZE/2 + 4; fz < CZ + SIZE/2 - 4; fz += step){
    var rr = Math.hypot(fx - GX, fz - GZ), thin = rr < 260 ? 1 : rr < 500 ? .45 : .2;   // farther off, fewer but bigger trees
    if (rnd() > thin) continue;
    var x2 = fx + (rnd() - .5)*step*.9, z2 = fz + (rnd() - .5)*step*.9, f = forest(x2, z2);
    if (rnd() > f) continue;
    var big = 1/Math.sqrt(thin);
    add(rnd() < .28 ? 'cone' : 'blob', x2, z2, (2.0 + rnd()*1.3)*Math.min(1.9, .75 + .25*big));
  }
  /* willows and poplars along the Horyn and the stream, a few lone oaks on the meadow */
  for (var tt = -900; tt < 900; tt += lite ? 16 : 11){
    [-1, 1].forEach(function(sd){ if (rnd() < .45){ var p = at(riverS(tt) + sd*(RW/2 + 5 + rnd()*9), tt); if (!keepClear(p[0], p[1])) add(rnd() < .3 ? 'pop' : 'blob', p[0], p[1], 1.5 + rnd()*.8); } });
    if (rnd() < .5){ var q2 = at(brookS(tt) + (rnd() < .5 ? -1 : 1)*(7 + rnd()*4), tt); add('blob', q2[0], q2[1], 1.1 + rnd()*.5); }
  }
  for (var k2 = 0; k2 < (lite ? 30 : 60); k2++){ var ls = 110 + rnd()*480, lt = rnd()*1400 - 700, lp = at(ls, lt);
    if (Math.abs(ls - riverS(lt)) < RW/2 + 10 || Math.abs(ls - brookS(lt)) < 10 || oxDist(ls, lt) < 10) continue; add('blob', lp[0], lp[1], 1.6 + rnd()*1.0); }
  /* the town's yards: a few fruit trees behind every house */
  HOUSES.forEach(function(q){ var n = 1 + Math.floor(rnd()*3), ca = Math.cos(-q.a), sa = Math.sin(-q.a);
    for (var i = 0; i < n; i++){ var lx = (rnd() - .5)*q.w*1.4, lz = (q.d/2 + 4 + rnd()*7)*(q.k > .5 ? 1 : -1), x = q.x + lx*ca + lz*sa, z = q.z - lx*sa + lz*ca;
      if (roadD(x, z) > 5 && !keepClear(x, z)) add('blob', x, z, 1.1 + rnd()*.5); } });
  /* the churchyard: limes and a few firs along the long sides (none along the front), an old lime by the corner of the facade
     as in the photograph; outside, a row of trees behind the back fence and a few round the square */
  [[15.8, -3.5, 2.5], [-15.8, -5, 2.0], [-16, -33, 1.8], [16.2, -34.5, 1.7]].forEach(function(q){ add('blob', q[0], q[1], q[2]); });
  [[16.4, -17, 1.25], [16.6, -24.5, 1.1], [-16.5, -19, 1.2], [-16.3, -26, 1.05]].forEach(function(q){ add('cone', q[0], q[1], q[2]); });
  for (var bx2 = -19; bx2 <= 19; bx2 += 7.6) add('blob', bx2 + (rnd() - .5)*2, YARD.z0 - 6 - rnd()*3, 1.9 + rnd()*.5);
  [[YARD.x1 + 6, -8], [YARD.x1 + 7, -24], [YARD.x1 + 6, -38]].forEach(function(q){ add('blob', q[0], q[1], 1.8 + rnd()*.6); });
  [[-40, -16], [-25, -18], [-41, 3]].forEach(function(q){ add('blob', q[0], q[1], 1.5); });   // the plebania's garden
  [[SQ.x1 + 4, 20], [SQ.x1 + 5, 40], [SQ.x1 + 3, 58], [-38, 60], [30, 64.5 + 6], [-10, 71]].forEach(function(q){ add('blob', q[0], q[1], 1.7 + rnd()*.6); });
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
  instance('blob', blobCrown(), crownM, LEAF, 1.7, .9, true);
  instance('cone', coneCrown(), conM, CON, .9, 1.0, true);
  instance('pop', poplarCrown(), crownM, [POP, lin('#71865c')], 1.2, 1.0, true);

  /* ── lanterns by the gate, round the square and along the street: posts by day, warm pools of light at dusk and night ── */
  var lampsK = 0, lanterns = (function(){
    var P = [[-4.2, 13], [4.2, 13], [-24, 24], [24, 24], [-42, 42], [52, 42], [-30, 61.5], [0, 61.5], [30, 61.5], [-44.5, -24], [-44.5, -60]];
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
      /* clouds: a layer drifting with the wind, lit from the sun's side, burning orange at sunset */
      '  if (y > 0.0){',
      '    vec2 cp = d.xz/(y + .12)*1.6 + vec2(uTime*.006, uTime*.0025);',
      '    float f = fbm(cp), f2 = fbm(cp*2.3 + 4.1);',
      '    float cl = smoothstep(1.0 - uCov, 1.0 - uCov + .28, f*.8 + f2*.3)*smoothstep(0.0, .12, y);',
      '    float lit = clamp(.3 + .7*pow(sd, 1.5) + (f - fbm(cp + uSun.xz*.08))*2.2, 0.0, 1.3);',
      '    vec3 cc = mix(uCSh, uCLit, lit);',
      '    cc += uGlow*pow(sd, 10.0)*.6*uGlowI*(1.0 - cl*.5);',                          // a silver lining near the sun
      '    c = mix(c, cc, cl*.92);',
      '  }',
      '  gl_FragColor = vec4(c, 1.0);',
      '  #include <encodings_fragment>',
      '}'].join('\n')}));
  sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);
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
      b.userData = {l: l, r: r, ph: i*.7, rad: 40 + (i % 3)*12, h: 34 + (i % 4)*3, sp: .07 + (i % 3)*.012, cx: 120 + (i % 2)*20, cz: -150 + (i % 3)*16};
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
