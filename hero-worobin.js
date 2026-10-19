/* Обкладинка головної: «Бібліотека» у Воробині посеред краєвиду — парк на терасі, луки, що спадають до Горині, ставки внизу,
   поля на заході, ліси по обрію. Вода тече, дерева гойдаються, над рікою кружляють птахи, з комина ледь курить.
   Підключається після Worobin3D.mount:  HeroLand.attach(api, {lite: true/false, shift: 0.18})
   Осі моделі: +x — схід (до Горині), −x — захід (портик), +z — південь, −z — північ. Географія — за аерофото 1944 року:
   ріка на схід від маєтку тече з півдня на північ, на заході поля й дорога. */
(function(){
'use strict';

function attach(api, o){
  o = o || {};
  var T = THREE, scene = api.scene, cam = api.camera, renderer = api.renderer, model = api.model;
  var lite = !!o.lite, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var U = {uTime: {value: 0}, uFogC: {value: new T.Color()}, uFogD: {value: .005}, uSunDir: {value: new T.Vector3(0, 1, 0)}, uHor: {value: new T.Color()}, uGlowW: {value: new T.Color()}, uDeep: {value: new T.Color()}, uGlint: {value: 1}, uNightG: {value: 0}, uIce: {value: 0}, uWSnow: {value: 0}, uAut: {value: 0}, uWind: {value: 1}, uWet: {value: 0}};
  function ss(a, b, x){ var t = Math.max(0, Math.min(1, (x - a)/(b - a))); return t*t*(3 - 2*t); }
  function lin(c){ return new T.Color(c).convertSRGBToLinear(); }
  function hash(x, z){ var s = Math.sin(x*127.1 + z*311.7)*43758.5453; return s - Math.floor(s); }
  function vnoise(x, z){ var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz; fx = fx*fx*(3 - 2*fx); fz = fz*fz*(3 - 2*fz);
    var a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1); return a + (b - a)*fx + (c - a)*fz + (a - b - c + d)*fx*fz; }
  function fbm(x, z){ return vnoise(x, z)*.5 + vnoise(x*2.03 + 5.2, z*2.03 + 1.3)*.25 + vnoise(x*4.1 + 2.7, z*4.1 + 8.1)*.125; }

  /* ── the land, after the aerial photographs of 1944: the park is a large rectangle of old trees with the pavilion near its
     eastern edge; the Horyn runs close below it, and beyond lies open water-meadow with old river bends — no forest there;
     fields lie north, south and west of the park ── */
  var GX = -3.4, GZ = -.4;                                                          // centre of the model's turntable
  function near(x){ return -1.75*ss(-5, 9, x) - 2.2*ss(9.5, 22, x); }               // the same slope the model stands on
  function riverX(z){ return 42 + 4.5*Math.sin(z/57 + .4) + 2.5*Math.sin(z/23 + 2.1); }
  var WATER = -5.0;
  var PARK = {x0: -360, x1: 26, z0: -310, z1: 290};
  /* old river bends out on the meadow: centre, radius, start and end angle */
  var OXBOWS = [[118, -70, 34, .4, 3.6], [170, 60, 26, 2.6, 5.9], [104, 150, 22, -.6, 2.4], [230, -170, 30, 2.0, 5.2]];
  function oxDist(x, z){ var m = 1e9; OXBOWS.forEach(function(o){ var dx = x - o[0], dz = z - o[1], a = Math.atan2(dz, dx); if (a < o[3]) a += 6.283; if (a > o[3] && a < o[4] || a - 6.283 > o[3] && a - 6.283 < o[4]){ m = Math.min(m, Math.abs(Math.hypot(dx, dz) - o[2])); } }); return m; }
  function chan(x, z){ return Math.abs(Math.sin(x*.021 + Math.sin(z*.017)*2.2) *60 - (z*.08 % 60)); }
  function H(x, z){
    var h = near(x);
    var rx = riverX(z), d = Math.abs(x - rx);
    h -= 1.55*(1 - ss(4.5, 9.5, d));                                                // the river bed and its banks
    h += .25*ss(0, 1, (x - rx - 30)/200);                                            // the meadow beyond: flat, barely rising
    h += .9*ss(-30, -200, x) + .5*ss(120, 320, Math.abs(z));                          // the land rises gently away from the river
    var r = Math.hypot(x - GX, z - GZ), wild = ss(26, 70, r);
    h += (fbm(x*.018, z*.018) - .5)*(x > rx ? .7 : 2.2)*wild*ss(10, 30, d);
    var od = oxDist(x, z); if (od < 9) h -= 1.1*(1 - ss(2.5, 8, od));
    PONDS.forEach(function(p){ var q = Math.hypot((x - p[0])/p[2], (z - p[1])/p[3]); if (q < 1.6) h = Math.min(h, h - .9*(1 - ss(.75, 1.6, q))); });
    return h;
  }
  var PONDS = [[22.5, 36, 6.5, 4.2], [21, -40, 5.4, 3.6]];                          // the two ponds on the lower level of the park
  function pondLevel(p){ return near(p[0]) - .55; }
  function inPark(x, z){ return x > PARK.x0 && x < PARK.x1 && z > PARK.z0 && z < PARK.z1; }

  /* trees: the old park (but a lawn kept open before the west and south fronts, where the eye goes), hedgerows on the fields,
     willows along the water, a far line of woods on the horizon; none on the water-meadow */
  function forest(x, z){
    var rx = riverX(z), f = 0;
    if (inPark(x, z)){
      f = .78;
      var dx = x - GX, dz = z - GZ, r = Math.hypot(dx, dz), az = Math.atan2(dz, dx);   // the lawn: a wide sector west and south of the house
      if (r < 44) f = 0;
      else if (dx < 0 && dz > -30 && r < 150) f = Math.min(f, .06 + .3*ss(110, 150, r));
      else if (dz > 0 && r < 120) f = Math.min(f, .1);
      f *= .7 + .6*fbm(x*.04 + 3, z*.04 + 9);
      if (Math.abs(z) < 7 && x < -20) f = 0;                                          // the drive
    } else if (x < rx){
      var hedge = (Math.abs(((z + 1000) % 90) - 45) > 43.5) || (Math.abs(((x + 1000) % 150) - 75) > 73.5);
      f = hedge ? .55 : 0;
    }
    if (Math.hypot(x - GX, z - GZ) > 380) f = Math.max(f, .7*ss(380, 430, Math.hypot(x - GX, z - GZ)));   // the far woods
    if (Math.abs(x - rx) < 9) f = 0;
    return Math.min(1, f);
  }

  /* ── terrain mesh with painted zones ── */
  var SIZE = 960, SEG = lite ? 140 : 250, CX = 20;
  var tg = new T.PlaneGeometry(SIZE, SIZE, SEG, SEG); tg.rotateX(-Math.PI/2); tg.translate(CX, 0, 0);
  var tp = tg.attributes.position, col = new Float32Array(tp.count*3), C = new T.Color();
  var cLawn = lin('#6a7a42'), cMead = lin('#82904a'), cMeadY = lin('#a09a58'), cMud = lin('#6b5f43'), cFloor = lin('#465230'),
      cField = [lin('#a3954f'), lin('#7c8b42'), lin('#b8a462'), lin('#919049'), lin('#6e7d3d')], cRoad = lin('#8a7652'), cWet = lin('#4f5a35');
  for (var i = 0; i < tp.count; i++){
    var x = tp.getX(i), z = tp.getZ(i), h = H(x, z); tp.setY(i, h);
    var rx = riverX(z), d = Math.abs(x - rx), n = fbm(x*.08, z*.08);
    if (inPark(x, z) || x > 12){ C.copy(x > 12 && !inPark(x, z) ? cMead : cLawn); if (x > rx) C.lerp(cMeadY, ss(.45, .8, n)); }
    else { var strip = Math.floor((z + 1000)/15), k = Math.floor(hash(strip, Math.floor((x + 1000)/90))*5); C.copy(cField[k]); }
    var fr = forest(x, z); C.lerp(cFloor, ss(.15, .5, fr)*.8);
    C.lerp(cMud, 1 - ss(5.5, 8.5, d));
    var od = oxDist(x, z); if (x > rx) C.lerp(cWet, (1 - ss(3, 14, od))*.8 + .35*ss(.55, .75, fbm(x*.03 + 11, z*.03)));    // wet hollows and reeds on the meadow
    if (Math.abs(x - PARK.x0 + 55) < 2.6 || (Math.abs(z - PARK.z0 + 22) < 2.2 && x < PARK.x1)) C.copy(cRoad);    // roads round the park
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
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n{ float dn = length(vTW - cameraPosition); float kk = (1.0 - smoothstep(12.0, 70.0, dn))*.12; vec2 q = vTW.xz*2.4; float a0 = tn(q), ax = tn(q + vec2(.15, 0.0)), az = tn(q + vec2(0.0, .15)); normal = normalize(normal + (viewMatrix*vec4((a0 - ax)*kk*6.0, 0.0, (a0 - az)*kk*6.0, 0.0)).xyz); }')
      .replace('#include <color_fragment>', ['#include <color_fragment>',
        'float dd = length(vTW - cameraPosition), fd = 1.0 - smoothstep(60.0, 260.0, dd);',
        'float g1 = tn(vTW.xz*1.7), g2 = tn(vTW.xz*6.3 + 3.1), g3 = tn(vTW.xz*.33 + 7.7);',
        'float tuft = (g1*.6 + g2*.4 - .5)*.34*fd + (g3 - .5)*.22;',
        'float g4 = tn(vTW.xz*23.0 + 1.3), near = 1.0 - smoothstep(10.0, 55.0, dd);',
        'diffuseColor.rgb *= 1.0 + tuft + (g4 - .5)*.22*near;',
        'diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb*vec3(1.12, 1.05, .78), smoothstep(.62, .82, g3)*.5);',      // drier, yellower patches
        'float fur = abs(sin(vTW.z*.9 + tn(vTW.xz*.05)*4.0));',
        'float field = 1.0 - step(-360.0, vTW.x)*step(vTW.x, 26.0)*step(-310.0, vTW.z)*step(vTW.z, 290.0);',
        'diffuseColor.rgb *= mix(1.0, .9 + .14*fur, field*step(vTW.x, 30.0)*fd);',      // furrows in the fields
        /* autumn: the grass goes to straw and rust; winter: snow lies everywhere but thins in the furrows and under the trees */
        'diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb*vec3(1.42, 1.0, .5) + vec3(.014, .004, 0.0), uAut*(.68 + .32*g3));',
        'float snw = uWSnow*smoothstep(.12, .42, g1*.45 + g3*.55 + .12 - field*fur*.12);',
        'diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.80, .83, .88)*(.93 + .1*g2), snw);'].join('\n'));
  };
  var terrain = new T.Mesh(tg, terrM); terrain.receiveShadow = true; scene.add(terrain);

  /* the model's own turntable gives way to the land */
  scene.children.forEach(function(c){ if (c.isMesh && c.geometry && c.geometry.type === 'PlaneGeometry' && c.geometry.parameters.width > 40 && c !== terrain) c.visible = false; });

  /* ── the estate grounds: drive, forecourt, park walks and the parterre, painted onto a skin that follows the slope ── */
  (function(){
    var S = 130, N = lite ? 110 : 170, CW = 2048, cv = document.createElement('canvas'); cv.width = cv.height = CW;
    var K = cv.getContext('2d'), px = CW/S, ox = -8, oz = 0;
    function X(x){ return (x - ox)*px + CW/2; } function Z(z){ return (z - oz)*px + CW/2; }
    /* walks are drawn as smooth curves through their points, with ragged, grass-bitten edges and a worn, gravelly surface */
    function curve(pts, n){ if (pts.length < 3) return pts; var c = new T.CatmullRomCurve3(pts.map(function(q){ return new T.Vector3(q[0], 0, q[1]); }), false, 'centripetal');
      return c.getPoints(n || pts.length*16).map(function(v){ return [v.x, v.z]; }); }
    function line(pts, w, colr, jit){ K.save(); K.lineCap = K.lineJoin = 'round'; K.strokeStyle = colr; K.lineWidth = w*px; K.beginPath();
      pts.forEach(function(q, i){ var jx = jit ? (hash(q[0]*3.1, q[1]*1.7) - .5)*jit : 0, jz = jit ? (hash(q[1]*2.3, q[0]*4.1) - .5)*jit : 0; i ? K.lineTo(X(q[0] + jx), Z(q[1] + jz)) : K.moveTo(X(q[0] + jx), Z(q[1] + jz)); }); K.stroke(); K.restore(); }
    function path(pts, w, ruts){ var c = curve(pts);
      line(c, w + 1.3, 'rgba(92,80,52,.16)', .5); line(c, w + .6, 'rgba(110,92,62,.4)', .35); line(c, w, '#8d7856', .2); line(c, w*.55, 'rgba(160,140,106,.35)');
      if (ruts) [-1, 1].forEach(function(sd){ line(c.map(function(q){ return [q[0], q[1] + sd*w*.22]; }), .32, 'rgba(84,68,46,.45)', .15); }); }
    path([[-72, 0], [-45.5, 0], [-19, 0]], 4.2, true);                                            // the drive from the road, between the limes
    K.fillStyle = 'rgba(105,88,60,.35)'; K.beginPath(); K.ellipse(X(-18.4), Z(0), 4.1*px, 6.5*px, 0, 0, 6.283); K.fill();
    K.fillStyle = '#8d7856'; K.beginPath(); K.ellipse(X(-18.4), Z(0), 3.4*px, 5.8*px, 0, 0, 6.283); K.fill();
    [-1, 1].forEach(function(sd){ K.fillStyle = '#8d7856'; K.beginPath(); K.moveTo(X(-24), Z(sd*2.1)); K.quadraticCurveTo(X(-21.4), Z(sd*2.2), X(-20.6), Z(sd*4.6)); K.lineTo(X(-19), Z(0)); K.closePath(); K.fill(); });   // the drive opens into the forecourt
    path([[-17.4, 3.4], [-18.2, 7.5], [-17.6, 12.5], [-14.8, 19], [-8.5, 23.6], [-1, 25], [6, 23.8], [12.6, 20], [17.6, 14.2], [20, 9.5]], 1.4);   // the park walk round the south
    path([[-16.2, -3.6], [-13.2, -8.6], [-8.4, -13.6], [-1.6, -16.4], [5.6, -15.6], [11.6, -11.6], [16.4, -5.8], [19, .5], [20, 9.5]], 1.2);       // and round the north
    path([[20, 9.5], [21.4, 11.6], [23.6, 13.2]], 1.0); path([[16.4, -5.8], [19.6, -10.4], [22.6, -15.2], [26, -18]], 1.0);   // down to the ponds
    /* gravel: speckles and darker patches, only where something has been painted (the walks and the beds) */
    K.save(); K.globalCompositeOperation = 'source-atop';
    for (var gi = 0; gi < 26000; gi++){ var gx = Math.random()*CW, gz = Math.random()*CW, gl = Math.random(); K.fillStyle = gl < .5 ? 'rgba(70,58,40,.35)' : gl < .85 ? 'rgba(190,172,138,.35)' : 'rgba(120,128,92,.3)'; K.fillRect(gx, gz, 1 + Math.random()*1.6, 1 + Math.random()*1.6); }
    for (gi = 0; gi < 160; gi++){ var px2 = Math.random()*CW, pz2 = Math.random()*CW, pr = (.4 + Math.random()*1.4)*px, rg2 = K.createRadialGradient(px2, pz2, 0, px2, pz2, pr);
      rg2.addColorStop(0, Math.random() < .5 ? 'rgba(80,90,50,.28)' : 'rgba(70,56,38,.22)'); rg2.addColorStop(1, 'rgba(0,0,0,0)'); K.fillStyle = rg2; K.fillRect(px2 - pr, pz2 - pr, pr*2, pr*2); }
    K.restore();
    function bed(x0, z0, x1, z1){ K.fillStyle = '#5a4430'; K.fillRect(X(x0), Z(z0), (x1 - x0)*px, (z1 - z0)*px);
      ['#c9563f', '#e3c26a', '#efe6d4', '#b8506e'].forEach(function(c){ K.fillStyle = c; for (var i = 0; i < 70; i++){ K.beginPath(); K.arc(X(x0 + .3 + Math.random()*(x1 - x0 - .6)), Z(z0 + .3 + Math.random()*(z1 - z0 - .6)), (.06 + Math.random()*.06)*px, 0, 6.283); K.fill(); } });
      K.strokeStyle = '#3f5a2c'; K.lineWidth = .32*px; K.strokeRect(X(x0), Z(z0), (x1 - x0)*px, (z1 - z0)*px); }
    K.fillStyle = '#a5946f'; K.fillRect(X(-1), Z(12.4), 2*px, 4.2*px); bed(-7, 13.2, -1.6, 16.2); bed(1.6, 13.2, 7, 16.2);
    K.save(); K.globalCompositeOperation = 'destination-in';                          // soft outer edge
    var rg = K.createRadialGradient(CW/2, CW/2, CW*.36, CW/2, CW/2, CW*.5); rg.addColorStop(0, '#000'); rg.addColorStop(1, 'rgba(0,0,0,0)'); K.fillStyle = rg; K.fillRect(0, 0, CW, CW); K.restore();
    var g = new T.PlaneGeometry(S, S, N, N); g.rotateX(-Math.PI/2); g.translate(ox, 0, oz);
    var p = g.attributes.position; for (var i = 0; i < p.count; i++) p.setY(i, H(p.getX(i), p.getZ(i)) + .03);
    g.computeVertexNormals();
    var t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; t.anisotropy = 8;
    var m = new T.Mesh(g, new T.MeshStandardMaterial({map: t, transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2}));
    m.receiveShadow = true; m.renderOrder = 1; scene.add(m);
  })();

  /* ── water: the Horyn and the ponds; ripples drift downstream (north), the sky glints off them ── */
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
      '  c = mix(c, warm, rip*(.25 + .5*fr));',                                     // ripples catch the evening sky
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
  (function(){                                                                       // the river ribbon, following the meander
    var segs = lite ? 260 : 420, W = 13, pos = [], uv = [], idx = [];
    for (var i = 0; i <= segs; i++){
      var z = -SIZE/2 + i*SIZE/segs, x = riverX(z), dx = (riverX(z + .5) - riverX(z - .5)), nx = 1, nz = -dx, l = Math.hypot(nx, nz); nx /= l; nz /= l;
      pos.push(x - nx*W/2, WATER, z - nz*W/2, x + nx*W/2, WATER, z + nz*W/2); uv.push(0, i/segs, 1, i/segs);
      if (i) idx.push(2*i - 2, 2*i - 1, 2*i, 2*i - 1, 2*i + 1, 2*i);
    }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    var m = new T.Mesh(g, waterM); m.renderOrder = 2; scene.add(m);
    var pm = waterM.clone(); pm.uniforms = Object.assign({}, waterM.uniforms, {uFlow: {value: .12}});
    PONDS.forEach(function(p){
      var cg = new T.CircleGeometry(1, 48); cg.rotateX(-Math.PI/2);
      var a = cg.attributes.position, u2 = cg.attributes.uv; for (var i = 0; i < a.count; i++){ var rr = Math.hypot(a.getX(i), a.getZ(i)); u2.setX(i, .5 - .5*rr); }
      var mm = new T.Mesh(cg, pm); mm.scale.set(p[2]*1.05, 1, p[3]*1.05); mm.position.set(p[0], pondLevel(p), p[1]); mm.renderOrder = 2; scene.add(mm);
    });
  })();

  /* old bends of the river: still water in long crescents out on the meadow */
  (function(){
    var pm = waterM.clone(); pm.uniforms = Object.assign({}, waterM.uniforms, {uFlow: {value: .05}});
    OXBOWS.forEach(function(o){
      var segs = 60, W = 7, pos = [], uv = [], idx = [], a0 = o[3], a1 = o[4];
      for (var i = 0; i <= segs; i++){ var a = a0 + (a1 - a0)*i/segs, cx = o[0] + Math.cos(a)*o[2], cz = o[1] + Math.sin(a)*o[2], nx = Math.cos(a), nz = Math.sin(a), w = W*(.35 + .65*Math.sin(Math.PI*i/segs));
        var y = H(cx, cz) + .45; pos.push(cx - nx*w/2, y, cz - nz*w/2, cx + nx*w/2, y, cz + nz*w/2); uv.push(0, i/segs, 1, i/segs); if (i) idx.push(2*i - 2, 2*i - 1, 2*i, 2*i - 1, 2*i + 1, 2*i); }
      var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      var m = new T.Mesh(g, pm); m.renderOrder = 2; scene.add(m);
    });
  })();

  /* ── the other buildings of the estate, where the aerial photograph shows their walls: plain plastered houses under hipped
     roofs (their looks are not recorded, so they stay simple and quiet) ── */
  (function(){
    var wallM = new T.MeshStandardMaterial({color: '#ddd5c3', roughness: .92}), roofM = new T.MeshStandardMaterial({color: '#7a5240', roughness: .8});
    var c = document.createElement('canvas'); c.width = 256; c.height = 64; var k = c.getContext('2d'); k.fillStyle = '#ddd5c3'; k.fillRect(0, 0, 256, 64);
    for (var i = 0; i < 8; i++){ k.fillStyle = '#efe9dc'; k.fillRect(8 + i*32, 16, 16, 30); k.fillStyle = '#2b3036'; k.fillRect(10 + i*32, 18, 12, 26); }
    var wt = new T.CanvasTexture(c); wt.encoding = T.sRGBEncoding; wt.wrapS = T.RepeatWrapping;
    function hip(w, d, h){ var g = new T.ConeGeometry(Math.SQRT1_2, 1, 4, 1); g.rotateY(Math.PI/4); g.scale(w*1.06, h, d*1.06); g.translate(0, h/2, 0); return g; }
    function house(x, z, w, d, rot, wallH){
      var y = H(x, z), g = new T.Group(); g.position.set(x, y, z); g.rotation.y = rot || 0; scene.add(g);
      var t = wt.clone(); t.needsUpdate = true; t.repeat.set(Math.max(1, Math.round(w/8)), 1);
      var b = new T.Mesh(new T.BoxGeometry(w, wallH, d), [new T.MeshStandardMaterial({map: t, roughness: .92}), new T.MeshStandardMaterial({map: t, roughness: .92}), wallM, wallM, new T.MeshStandardMaterial({map: t, roughness: .92}), new T.MeshStandardMaterial({map: t, roughness: .92})]);
      b.position.y = wallH/2 - .2; b.castShadow = b.receiveShadow = true; g.add(b);
      var r = new T.Mesh(hip(w, d, Math.min(w, d)*.42), roofM); r.position.y = wallH - .2; r.castShadow = true; g.add(r);
      return g;
    }
    house(-285, -165, 44, 13, Math.PI/2, 5.2); house(-262, -128, 22, 12, 0, 5.2);          // the L-shaped officina
    house(-235, -62, 30, 13, 0, 5.4);
    house(-168, -255, 34, 12, Math.PI/2, 5);
    house(2, -186, 15, 11, 0, 4.6);
    house(-90, -335, 26, 11, 0, 4.6);
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
      sh.uniforms.uTime = U.uTime; sh.uniforms.uWSnow = U.uWSnow; sh.uniforms.uWind = U.uWind;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime, uWSnow, uWind;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + (bare ? 'transformed *= 1.0 - .3*uWSnow;\n' : '') + '#ifdef USE_INSTANCING\n vec3 ip = instanceMatrix[3].xyz;\n#else\n vec3 ip = vec3(0.0);\n#endif\n' +
          ' float k = max(0.0, position.y + 1.0)*uWind*(1.0 + .3*max(0.0, uWind - 1.0)*sin(uTime*.41 + ip.x*.02));\n transformed.x += (sin(uTime*1.1 + ip.x*.13 + ip.z*.07) + .35*sin(uTime*2.7 + ip.z*.3))*' + amt.toFixed(3) + '*k;\n transformed.z += cos(uTime*.9 + ip.z*.11)*' + (amt*.6).toFixed(3) + '*k;\n vLY = position.y; vLN = normal; vLP = position;')
        .replace('#include <common>', '#include <common>\nvarying float vLY; varying vec3 vLN, vLP;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vLY; varying vec3 vLN, vLP;')
        .replace('#include <color_fragment>', '#include <color_fragment>\n float ao = smoothstep(-1.1, 1.0, vLY); diffuseColor.rgb *= .55 + .6*ao;\n float lf = .5 + .5*sin(vLP.x*11.0 + sin(vLP.y*9.0)*2.2)*sin(vLP.z*10.0 + sin(vLP.x*8.0)*2.0)*sin(vLP.y*12.0 + vLP.z*3.0); diffuseColor.rgb *= .78 + .38*lf;\n diffuseColor.rgb *= 1.0 + .18*smoothstep(.3, 1.0, vLN.y);\n diffuseColor.rgb *= .9 + .2*fract(sin(dot(floor(vLN*7.0), vec3(12.9, 78.2, 37.7)))*43758.5);');
    };
  }
  var LEAF = ['#4f6f33', '#5b7a38', '#46652e', '#62803c', '#557334', '#6a8640'].map(lin), CON = ['#2e4a2f', '#33503a', '#2a4430'].map(lin), POP = lin('#7f9168');
  var crownM = new T.MeshStandardMaterial({roughness: .9}); windy(crownM, .05, true);
  var conM = new T.MeshStandardMaterial({roughness: .95, flatShading: true}); windy(conM, .025);
  var trunkM = new T.MeshStandardMaterial({color: '#4a3826', roughness: 1});
  var list = {blob: [], cone: [], pop: []};
  function add(kind, x, z, s){ list[kind].push([x, H(x, z), z, s]); }
  /* the forest */
  var step = lite ? 9 : 6, rnd = (function(seed){ return function(){ seed = (seed*16807) % 2147483647; return (seed - 1)/2147483646; }; })(1918);
  for (var fx = CX - SIZE/2 + 4; fx < CX + SIZE/2 - 4; fx += step) for (var fz = -SIZE/2 + 4; fz < SIZE/2 - 4; fz += step){
    var rr = Math.hypot(fx - GX, fz - GZ), thin = rr < 140 ? 1 : rr < 260 ? .4 : .18;   // farther off, fewer but bigger trees
    if (rr > 300) continue;                                                        // beyond, the woods are one belt on the horizon
    if (rnd() > thin) continue;
    var x2 = fx + (rnd() - .5)*step*.9, z2 = fz + (rnd() - .5)*step*.9, f = forest(x2, z2);
    if (rnd() > f) continue;
    var big = 1/Math.sqrt(thin);
    add(rnd() < (inPark(x2, z2) ? .18 : .3) ? 'cone' : 'blob', x2, z2, (1.7 + rnd()*1.2)*Math.min(1.8, .75 + .25*big));
  }
  /* hedgerows and lone trees on the fields and meadows */
  for (var k2 = 0; k2 < (lite ? 40 : 80); k2++){ var lx = -40 - rnd()*90, lz = Math.floor((rnd()*360 - 180)/15)*15; if (forest(lx, lz) > .2) continue; add('blob', lx, lz, 1.2 + rnd()*.8); }
  for (k2 = 0; k2 < 26; k2++){ var mz = rnd()*300 - 150, mx = riverX(mz) + (rnd() < .5 ? -1 : 1)*(8 + rnd()*5); if (Math.hypot(mx - GX, mz - GZ) < 30) continue; add(rnd() < .5 ? 'pop' : 'blob', mx, mz, 1.3 + rnd()*.6); }   // willows and poplars along the banks
  /* the park: an avenue of limes along the drive, groups of white poplars, spruces behind the tower, chestnuts by the ponds */
  for (var ax = -68; ax <= -24; ax += 6.5){ add('blob', ax, -5.2, 1.25); add('blob', ax + 3.2, 5.2, 1.25); }
  [[-20.5, -7], [-20.5, 7.2], [-15, -8.6], [-11.5, 15], [13, 10.5], [9.5, 14.6], [14.5, 4], [-26, -18], [-30, 14], [-8, 22], [6, 21.5]].forEach(function(q){ add('blob', q[0], q[1], 1.15 + rnd()*.2); });
  [[5, -15.5], [8.5, -14], [11.5, -11.8], [19, -9], [21, 22], [-3, -21]].forEach(function(q){ add('pop', q[0], q[1], 1.15); });
  [[-1.5, -16.5], [-5.5, -16], [-9.5, -13.8], [-13, -18], [-18, -12]].forEach(function(q){ add('cone', q[0], q[1], 1.05); });
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

  /* ── lanterns along the drive and round the forecourt: cast-iron posts with glazed lantern heads. At night every lantern,
     and every lit window of the house, really lights what is round it: a small light loop in the shaders of the ground, the trees,
     the paths and the house adds a warm, quickly fading light from each of them (no shadow maps, so it stays cheap) ── */
  var LAMPC = {value: lin('#ffd09a')}, LAMPK = {value: 0}, LAMPP = [], lampsK = 0;
  var lanterns = (function(){
    var P = [];
    for (var lx = -26; lx >= -64; lx -= 9.5){ P.push([lx, -3.3]); P.push([lx - 4.75, 3.3]); }
    [[-21.6, -4.4], [-21.6, 4.4], [-15.2, -6.2], [-15.2, 6.2], [-16.6, 11], [-12, 18.5], [2, 19], [12.5, 15.5], [-12.5, -11.5], [2, -17.6]].forEach(function(q){ P.push(q); });
    var n = P.length, m4 = new T.Matrix4();
    var iron = new T.MeshStandardMaterial({color: '#191817', roughness: .45, metalness: .6});
    var glassM = new T.MeshStandardMaterial({color: '#3a342a', emissive: new T.Color('#ffc274'), emissiveIntensity: 0, roughness: .2, metalness: 0, transparent: true, opacity: .92});
    glassM.userData.noLamp = true;
    function merge(list){ var P2 = [], N2 = []; list.forEach(function(g){ g = g.index ? g.toNonIndexed() : g; P2.push.apply(P2, g.attributes.position.array); N2.push.apply(N2, g.attributes.normal.array); });
      var g2 = new T.BufferGeometry(); g2.setAttribute('position', new T.Float32BufferAttribute(P2, 3)); g2.setAttribute('normal', new T.Float32BufferAttribute(N2, 3)); return g2; }
    function at(g, x, y, z, ry){ g = g.clone(); if (ry) g.rotateY(ry); g.translate(x, y, z); return g; }
    /* the post: a fluted foot, a slender shaft, a collar and the four-sided lantern with a pyramid cap and a finial */
    var postG = merge([at(new T.CylinderGeometry(.13, .17, .5, 8), 0, .25, 0), at(new T.CylinderGeometry(.2, .2, .08, 8), 0, .04, 0),
      at(new T.CylinderGeometry(.045, .065, 2.0, 8), 0, 1.5, 0), at(new T.CylinderGeometry(.09, .06, .12, 8), 0, 2.52, 0),
      at(new T.BoxGeometry(.34, .04, .34), 0, 2.6, 0), at(new T.ConeGeometry(.3, .26, 4), 0, 3.15, 0, Math.PI/4),
      at(new T.CylinderGeometry(.012, .03, .2, 6), 0, 3.38, 0), at(new T.SphereGeometry(.035, 8, 6), 0, 3.49, 0)]
      .concat([[-1, -1], [-1, 1], [1, -1], [1, 1]].map(function(c){ return at(new T.BoxGeometry(.025, .42, .025), c[0]*.14, 2.83, c[1]*.14); })));
    var post = new T.InstancedMesh(postG, iron, n), head = new T.InstancedMesh(new T.BoxGeometry(.26, .4, .26), glassM, n);
    var gp = new Float32Array(n*3);
    P.forEach(function(q, i){ var y = H(q[0], q[1]);
      m4.makeTranslation(q[0], y, q[1]); post.setMatrixAt(i, m4);
      m4.makeTranslation(q[0], y + 2.83, q[1]); head.setMatrixAt(i, m4);
      gp.set([q[0], y + 2.85, q[1]], i*3); LAMPP.push(new T.Vector4(q[0], y + 2.85, q[1], 1)); });
    post.castShadow = true; scene.add(post); scene.add(head);
    /* halos: a small bright core and a wide soft bloom, both in the fog */
    function halo(stops){ var c = document.createElement('canvas'); c.width = c.height = 128; var k = c.getContext('2d'), g = k.createRadialGradient(64, 64, 0, 64, 64, 63);
      stops.forEach(function(s2){ g.addColorStop(s2[0], s2[1]); }); k.fillStyle = g; k.fillRect(0, 0, 128, 128); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t; }
    var gg = new T.BufferGeometry(); gg.setAttribute('position', new T.BufferAttribute(gp, 3));
    var coreM = new T.PointsMaterial({map: halo([[0, 'rgba(255,240,210,1)'], [.3, 'rgba(255,210,140,.7)'], [1, 'rgba(255,180,90,0)']]), size: .9, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0, sizeAttenuation: true});
    var bloomM = new T.PointsMaterial({map: halo([[0, 'rgba(255,200,120,.55)'], [.35, 'rgba(255,170,90,.18)'], [1, 'rgba(255,150,70,0)']]), size: 5.5, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0, sizeAttenuation: true});
    var core = new T.Points(gg, coreM), bloom = new T.Points(gg, bloomM); core.renderOrder = 5; bloom.renderOrder = 4; scene.add(bloom); scene.add(core);
    return {set: function(v){ glassM.emissiveIntensity = 3.2*v; coreM.opacity = v; bloomM.opacity = .8*v; core.visible = bloom.visible = v > .01; }};
  })();
  /* the lit windows of the house throw a little light out onto the portico, the steps and the lawn */
  (function(){
    var cells = {}; model.updateMatrixWorld(true);
    model.traverse(function(ob){ if (!ob.isMesh || !ob.material || ob.material.name !== 'glass') return;
      var pa = ob.geometry.attributes.position, v = new T.Vector3();
      for (var i = 0; i < pa.count; i++){ v.fromBufferAttribute(pa, i).applyMatrix4(ob.matrixWorld); var k = Math.round(v.x/1.6) + ',' + Math.round(v.y/1.6) + ',' + Math.round(v.z/1.6);
        var c = cells[k] || (cells[k] = [0, 0, 0, 0]); c[0] += v.x; c[1] += v.y; c[2] += v.z; c[3]++; } });
    var bb = new T.Box3().setFromObject(model), mid = bb.getCenter(new T.Vector3()), list = [];
    Object.keys(cells).forEach(function(k){ var c = cells[k]; if (c[3] < 4) return; var p = new T.Vector3(c[0]/c[3], c[1]/c[3], c[2]/c[3]);
      var d = new T.Vector3(p.x - mid.x, 0, p.z - mid.z); if (Math.abs(d.x/(bb.max.x - bb.min.x)) > Math.abs(d.z/(bb.max.z - bb.min.z))) d.set(Math.sign(d.x), 0, 0); else d.set(0, 0, Math.sign(d.z));
      p.addScaledVector(d, 1.1); list.push(p); });
    list.sort(function(a, b){ return a.y - b.y; });
    var seen = []; list.forEach(function(p){ if (seen.length >= (lite ? 6 : 14)) return; if (seen.some(function(q){ return q.distanceTo(p) < 2.2; })) return; seen.push(p); LAMPP.push(new T.Vector4(p.x, p.y, p.z, .45)); });
  })();
  var NLAMP = Math.max(1, LAMPP.length), LAMPU = {value: LAMPP}; api.__lamps = {P: LAMPU, K: LAMPK, C: LAMPC};
  function patchLamps(){
    scene.traverse(function(ob){ if (!ob.isMesh || ob === sky) return;
      (Array.isArray(ob.material) ? ob.material : [ob.material]).forEach(function(m){
        if (!m || !m.isMeshStandardMaterial || m.userData.noLamp || m.userData.lampP) return; m.userData.lampP = true;
        var prev = m.onBeforeCompile, key = m.customProgramCacheKey();
        m.onBeforeCompile = function(sh, r){ if (prev) prev.call(this, sh, r); sh.uniforms.uLampP = LAMPU; sh.uniforms.uLampC = LAMPC; sh.uniforms.uLampK = LAMPK; sh.uniforms.uWet = U.uWet;
          sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec4 uLampP[' + NLAMP + '];\nuniform vec3 uLampC;\nuniform float uLampK, uWet;')
            .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\nif (uWet > 0.001){ float upw = clamp(dot(normal, normalize((viewMatrix*vec4(0.0, 1.0, 0.0, 0.0)).xyz)), 0.0, 1.0); float wt = uWet*smoothstep(.25, .9, upw); diffuseColor.rgb *= 1.0 - .3*wt; roughnessFactor = mix(roughnessFactor, .16, wt*.8); }')
            .replace('#include <lights_fragment_end>', ['#include <lights_fragment_end>',
              'if (uLampK > 0.001){ vec3 vp = -vViewPosition; float acc = 0.0;',
              '  for (int i = 0; i < ' + NLAMP + '; i++){ vec3 Lv = (viewMatrix*vec4(uLampP[i].xyz, 1.0)).xyz - vp; float d2 = dot(Lv, Lv); if (d2 > 64.0) continue;',
              '    float nd = max(dot(normal, Lv*inversesqrt(d2)), 0.0)*.85 + .15; acc += uLampP[i].w*nd/(d2 + .6)*(1.0 - smoothstep(14.0, 64.0, d2)); }',
              '  reflectedLight.directDiffuse += uLampC*(uLampK*8.0*acc)*material.diffuseColor; }'].join('\n')); };
        m.customProgramCacheKey = function(){ return key + '|lamp'; }; m.needsUpdate = true; }); });
  }

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
      '    vec2 cp = d.xz/(y + .2)*1.9 + vec2(uTime*.006, uTime*.0025);',
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
    [[320, 1, 0], [410, 1, 2.3], [500, 1, 4.1]].forEach(function(r){
      var R = r[0], pos = [], col = [], idx = [], c1 = lin('#1c2618'), c2 = lin('#2f4026'), c3 = lin('#3d4f2e');
      for (var i = 0; i <= NS; i++){
        var a = i/NS*Math.PI*2, x = GX + Math.cos(a)*R, z = GZ + Math.sin(a)*R, g = H(x, z) - 2, s = a*R;
        var lump = Math.sqrt(Math.abs(Math.sin(s*.45 + r[2] + 2.0*Math.sin(s*.061)))) + .4*Math.sqrt(Math.abs(Math.sin(s*1.07 + 1.3*r[2])));   // rounded crowns, V-shaped gaps
        var clear = .35 + .65*Math.min(1, Math.max(0, (fbm(x*.006 + r[2], z*.006) - .3)*3));
        if (R < 400) clear *= 1 - .85*ss(50, 150, x - riverX(z));                       // the open water-meadow beyond the Horyn
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
    [-18, '#0b1530', '#22305a', '#24325a', '#1a2546', '#000000', '#344064', '#141b30'],
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
  /* ── «Живий Воробин»: the hero wears the weather that is over Dubrovytsia right now (Open-Meteo, no key), smoothed in so a change
     rolls in rather than snapping; the visitor may also pick a weather by hand ── */
  var WX = {cover: .3, rain: 0, snow: 0, fog: 0, wind: 2.5, storm: 0}, WXc = {cover: .3, rain: 0, snow: 0, fog: 0, wind: 2.5, storm: 0, wet: 0, live: false, day: 1, night: 0};
  var wxLive = null, wxPick = (/[?&#]hero-weather=(\w+)/.exec(location.href) || [])[1] || 'live', baseExp = 1, wxListeners = [];
  var WXPRE = {clear: {cover: .06, wind: 2}, cloudy: {cover: .96, wind: 4}, rain: {cover: 1, rain: .85, wind: 6}, fog: {cover: .85, fog: 1, wind: .8},
    snow: {cover: 1, snow: .9, wind: 3}, storm: {cover: 1, rain: 1, storm: 1, wind: 11}};
  function wxOvercast(){ return Math.min(1, Math.max(ss2(.55, 1, WXc.cover)*.72, WXc.rain*.95, WXc.snow*.8, WXc.fog*.85, WXc.storm)); }
  function wxLabel(c, t, isDay){
    var L = {0: isDay === 0 ? 'ясна ніч' : 'ясно', 1: 'переважно ясно', 2: 'мінлива хмарність', 3: 'хмарно', 45: 'туман', 48: 'туман і паморозь', 51: 'мряка', 53: 'мряка', 55: 'густа мряка',
      56: 'крижана мряка', 57: 'крижана мряка', 61: 'невеликий дощ', 63: 'дощ', 65: 'злива', 66: 'крижаний дощ', 67: 'крижаний дощ', 71: 'невеликий сніг', 73: 'сніг', 75: 'сильний снігопад',
      77: 'снігова крупа', 80: 'короткочасний дощ', 81: 'зливи', 82: 'сильна злива', 85: 'снігопад', 86: 'сильний снігопад', 95: 'гроза', 96: 'гроза з градом', 99: 'гроза з градом'};
    return L[c] || '';
  }
  function wxFrom(c){
    var code = c.weather_code | 0, t = c.temperature_2m, vis = c.visibility, w = {cover: c.cloud_cover == null ? .5 : c.cloud_cover/100, rain: 0, snow: 0, fog: 0, storm: 0,
      wind: Math.max(c.wind_speed_10m || 0, .6*(c.wind_gusts_10m || 0))};
    var lvl = {51: .3, 53: .42, 55: .55, 56: .4, 57: .55, 61: .55, 63: .78, 65: 1, 66: .6, 67: .9, 80: .6, 81: .85, 82: 1, 95: .9, 96: 1, 99: 1}[code];
    var sl = {71: .45, 73: .7, 75: 1, 77: .35, 85: .6, 86: .95}[code];
    if (lvl && t != null && t < -1.5){ sl = lvl; lvl = 0; } if (sl && t != null && t > 2.5){ lvl = sl; sl = 0; }   // the code says one thing, the thermometer another
    if (!lvl && !sl && (c.precipitation || 0) > .05){ if (t != null && t < 0) sl = .4; else lvl = .4; }
    w.rain = lvl || 0; w.snow = sl || 0; if (code >= 95) w.storm = 1;
    if (code === 45 || code === 48) w.fog = 1;
    if (vis != null && vis < 4000) w.fog = Math.max(w.fog, Math.min(1, (4000 - vis)/3200));
    if (w.rain || w.snow || w.fog > .5) w.cover = Math.max(w.cover, .9); else if (code === 3) w.cover = Math.max(w.cover, .85); else if (code <= 1) w.cover = Math.min(w.cover, .35);
    return {w: w, t: t, label: wxLabel(code, t, c.is_day), code: code, at: Date.now()};
  }
  function wxApply(){
    var src = wxPick === 'live' ? (wxLive ? wxLive.w : null) : WXPRE[wxPick];
    var base = {cover: .3, rain: 0, snow: 0, fog: 0, wind: 2.5, storm: 0}; for (var k in base) WX[k] = src && src[k] != null ? src[k] : base[k];
    WXc.live = wxPick !== 'live' || !!wxLive;
    if (WX.snow > .05) makeSnow();
    if (WX.rain > .05){ makeRain(); if (!reduced) makeVeil(); }
    if (WX.rain > .05 || WX.snow > .05 || WX.fog > .05 || WX.cover > .6) patchLamps();
    wxListeners.forEach(function(f){ f(); });
  }
  var wxSnapped = false;
  function wxSnap(){                                                                 // the first reading lands at once: whoever opens the page sees the weather straight away
    if (wxSnapped || wxPick !== 'live') return; wxSnapped = true;
    for (var q in WX) WXc[q] = WX[q]; WXc.wet = WX.rain > .05 ? 1 : 0; setSky();
  }
  var WXURL = 'https://api.open-meteo.com/v1/forecast?latitude=51.573&longitude=26.567&current=temperature_2m,precipitation,snowfall,weather_code,cloud_cover,wind_speed_10m,wind_gusts_10m,visibility,is_day&wind_speed_unit=ms&timezone=Europe%2FKyiv';
  function wxFetch(force){
    if (o.noWeather) return;
    try { var c = JSON.parse(sessionStorage.getItem('dbWx2') || 'null'); if (!force && c && Date.now() - c.t < 9e5){ wxLive = wxFrom(c.d); wxApply(); wxSnap(); return; } } catch (e){}
    fetch(WXURL, {cache: 'no-store'}).then(function(r){ return r.ok ? r.json() : Promise.reject(r.status); }).then(function(j){
      if (!j || !j.current) return; try { sessionStorage.setItem('dbWx2', JSON.stringify({t: Date.now(), d: j.current})); } catch (e){}
      wxLive = wxFrom(j.current); wxApply(); wxSnap();
    }).catch(function(){ /* no network, no weather: the hero stays as it was */ });
  }
  /* rain: long thin streaks, falling fast */
  var rainFx = null;
  function makeRain(){ return rainFx || (rainFx = fall(lite ? 1500 : 3600, {h: 34, v: 17, sw: .04, size: 3.2, cols: [new T.Color(.82, .86, .92)],
    map: sprite(function(k){ var g = k.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.55, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)'); k.fillStyle = g; k.fillRect(30, 2, 4, 60); })})); }
  /* and a veil of streaks right in front of the lens, three layers deep, slanting with the wind */
  var rainVeil = null, RVU = {uTime: U.uTime, uRain: {value: 0}, uLit: {value: 1}, uSlant: {value: .06}, uAsp: {value: 1.6}};
  function makeVeil(){
    if (rainVeil) return rainVeil;
    var m = new T.ShaderMaterial({uniforms: RVU, transparent: true, depthTest: false, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: ['uniform float uTime, uRain, uLit, uSlant, uAsp; varying vec2 vUv;',
        'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }',
        'float lay(vec2 uv, float sc, float v, float len, float th, float seed){',
        '  uv.x += uv.y*uSlant; vec2 g = vec2(uv.x*uAsp*sc, (uv.y + uTime*v)*sc*.16);',
        '  float col = floor(g.x), r = h(vec2(col, seed)); g.y += r*13.0; float cell = floor(g.y), f = fract(g.y), r2 = h(vec2(col + seed, cell));',
        '  float on = step(1.0 - .75*uRain, r2); float x = fract(g.x) - .5 + (r2 - .5)*.7;',
        '  return on*smoothstep(th, 0.0, abs(x))*smoothstep(0.0, .08, f)*(1.0 - smoothstep(len*.4, len, f)); }',
        'void main(){ vec2 uv = vUv; float a = .30*lay(uv, 55.0, 1.9, .75, .07, 1.0) + .22*lay(uv, 105.0, 1.5, .7, .09, 7.0) + .14*lay(uv, 190.0, 1.1, .6, .12, 13.0);',
        '  a *= uRain*(.55 + .45*smoothstep(0.0, .9, uv.y)); gl_FragColor = vec4(vec3(.78, .83, .9)*uLit, a); }'].join('\n')});
    rainVeil = new T.Mesh(new T.PlaneGeometry(2, 2), m); rainVeil.frustumCulled = false; rainVeil.renderOrder = 999; rainVeil.visible = false; scene.add(rainVeil); return rainVeil; }
  /* lightning: the whole scene flashes, thunder follows a few seconds later */
  var flash = 0, nextFlash = 4, thunderQ = [];
  var wxSky = 0;
  function stepWeather(dt){
    var kk = Math.min(1, dt*.45), moved = 0;
    for (var k in WX){ var d = WX[k] - WXc[k]; if (Math.abs(d) > .002){ WXc[k] += d*kk; moved = Math.max(moved, Math.abs(d)); } else WXc[k] = WX[k]; }
    var wetT = Math.max(WXc.rain > .05 ? 1 : 0, WXc.snow > .3 && SW < .5 ? .5 : 0);
    WXc.wet += (wetT - WXc.wet)*Math.min(1, dt*(wetT > WXc.wet ? .25 : .03));        // dries slowly
    U.uWet.value = WXc.wet*(1 - SW); U.uWind.value = Math.max(.45, Math.min(3, .55 + WXc.wind/5));
    var lit = .28 + .72*WXc.day;
    if (rainFx){ rainFx.visible = WXc.rain > .02; rainFx.material.opacity = Math.min(.75, .25 + .55*WXc.rain)*Math.min(1, WXc.rain*6); rainFx.material.color.setScalar(lit); }
    if (rainVeil){ rainVeil.visible = WXc.rain > .02; RVU.uRain.value = WXc.rain; RVU.uLit.value = (.35 + .65*WXc.day)*(1 + 1.5*flash); RVU.uSlant.value = Math.min(.35, .02 + WXc.wind*.022);
      var cv = renderer.domElement; RVU.uAsp.value = (cv.clientWidth || 16)/(cv.clientHeight || 10); }
    if (snowFx){ var sv = Math.max(.9*SW, WXc.snow); snowFx.visible = sv > .02; snowFx.material.opacity = sv; snowFx.material.color.setScalar(.45 + .55*WXc.day); }
    if (WXc.storm > .4 && !reduced){
      nextFlash -= dt; if (nextFlash <= 0){ flash = 1; nextFlash = 5 + Math.random()*14; thunderQ.push(1.2 + Math.random()*3.5); if (Math.random() < .4) setTimeout(function(){ flash = Math.max(flash, .7); }, 140); }
    }
    if (flash > 0){ flash = Math.max(0, flash - dt*3.2); renderer.toneMappingExposure = baseExp*(1 + 2.2*flash*flash*(.6 + .4*Math.random())); if (!flash) renderer.toneMappingExposure = baseExp; }
    for (var i = thunderQ.length - 1; i >= 0; i--){ thunderQ[i] -= dt; if (thunderQ[i] <= 0){ thunderQ.splice(i, 1); if (AU) AU.thunder(); } }
    if (moved > .003 && ++wxSky % 4 === 0) setSky();
  }
  /* ── the sound of the place, made on the spot (no recordings to download): rain on leaves, wind in the crowns, birds by day,
     crickets on a warm night, thunder after the flash. Browsers allow sound only after a click, so it waits for the button. ── */
  var AU = null;
  function makeAudio(){
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    var C = new AC(), out = C.createGain(), master = C.createGain(); out.gain.value = .9; master.gain.value = 0; master.connect(out);
    var comp = C.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3; out.connect(comp); comp.connect(C.destination);
    function noise(brown, sec){ var n = Math.floor(C.sampleRate*sec), b = C.createBuffer(1, n, C.sampleRate), d = b.getChannelData(0), l = 0;
      for (var i = 0; i < n; i++){ var w = Math.random()*2 - 1; if (brown){ l = (l + .02*w)/1.02; d[i] = l*3.5; } else d[i] = w; }
      var f = Math.min(2000, n >> 3); for (var j = 0; j < f; j++){ var a = j/f; d[j] = d[j]*a + d[n - f + j]*(1 - a); }   // seamless loop
      return b; }
    var WN = noise(false, 3), BN = noise(true, 4);
    function loop(buf, off){ var s = C.createBufferSource(); s.buffer = buf; s.loop = true; s.start(0, off || 0); return s; }
    function filt(type, f, q){ var b = C.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q != null) b.Q.value = q; return b; }
    function chain(){ for (var i = 0; i < arguments.length - 1; i++) arguments[i].connect(arguments[i + 1]); return arguments[arguments.length - 1]; }
    function gain(v){ var g = C.createGain(); g.gain.value = v; return g; }
    /* rain: a hiss on the leaves and a soft roar under it, with single drops pattering */
    var rainG = gain(0); chain(loop(WN), filt('highpass', 900), filt('lowpass', 6500), gain(.55), rainG);
    chain(loop(BN, 1.3), filt('lowpass', 700), gain(.9), rainG); rainG.connect(master);
    var dropG = gain(0); dropG.connect(master);
    /* wind: brown noise through a band that wanders, swelling in gusts */
    var windG = gain(0), wbp = filt('bandpass', 380, .6), gust = gain(.5);
    chain(loop(BN, 2.1), wbp, gust, windG); windG.connect(master);
    var lfo = C.createOscillator(), lfoG = gain(220); lfo.frequency.value = .07; chain(lfo, lfoG, wbp.frequency); lfo.start();
    var lfo2 = C.createOscillator(), lfo2G = gain(.35); lfo2.frequency.value = .11; chain(lfo2, lfo2G, gust.gain); lfo2.start();
    var leafG = gain(0); chain(loop(WN, .7), filt('bandpass', 2600, .5), leafG); leafG.connect(master);   // leaves rustling with the wind
    /* birds */
    var birdBus = gain(1.05); birdBus.connect(master);
    function pan(p){ if (C.createStereoPanner){ var s = C.createStereoPanner(); s.pan.value = p; s.connect(birdBus); return s; } return birdBus; }
    function note(t, f0, f1, dur, vol, p, fm){
      var os = C.createOscillator(), g = C.createGain(); os.type = 'sine';
      os.frequency.setValueAtTime(f0, t); os.frequency.exponentialRampToValueAtTime(f1, t + dur);
      if (fm){ var m = C.createOscillator(), mg = C.createGain(); m.frequency.value = fm[0]; mg.gain.value = fm[1]; m.connect(mg); mg.connect(os.frequency); m.start(t); m.stop(t + dur + .05); }
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(.02, dur*.25)); g.gain.setValueAtTime(vol, t + dur*.6); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
      os.connect(g); g.connect(p); os.start(t); os.stop(t + dur + .02);
    }
    var SONGS = [
      function(t, p, v){ var n = 3 + (Math.random()*4 | 0), f = 4200 + Math.random()*1400; for (var i = 0; i < n; i++) note(t + i*.13, f, f*.72, .075, v, p); },          // tsee-tsee-tsee
      function(t, p, v){ note(t, 3100 + Math.random()*600, 3600, .55 + Math.random()*.4, v*.8, p, [34 + Math.random()*14, 650]); },                                     // a trill
      function(t, p, v){ var f = 1900 + Math.random()*500; note(t, f, f*1.32, .2, v, p); note(t + .26, f*1.32, f*1.05, .28, v, p); note(t + .62, f*1.1, f*1.5, .16, v*.8, p); },   // a fluting whistle
      function(t, p, v){ for (var i = 0; i < 2; i++){ note(t + i*.32, 5200, 3000, .1, v*.9, p); note(t + i*.32 + .12, 3400, 4400, .09, v*.7, p); } },                       // teacher-teacher
      function(t, p, v){ var f = 2600 + Math.random()*900; for (var i = 0; i < 7; i++) note(t + i*.06, f + (i % 2)*700, f + (i % 2)*700 + 300, .045, v*.7, p); }          // a quick chatter
    ];
    var nextBird = 0, nextDrop = 0;
    /* crickets: a steady high tone, gated into chirps of three or four pulses */
    var crick = [4300, 4520, 4150].map(function(f, i){ var os = C.createOscillator(), g = gain(0), pg = pan([-.6, .45, .1][i]); os.frequency.value = f; os.connect(g); g.connect(pg); os.start(); return {g: g, next: 0, rate: .55 + i*.13}; });
    var crickG = 0;
    /* thunder: a crack, then a long low roll */
    function thunder(){ if (!on) return; var t = C.currentTime, s = loop(BN, Math.random()*3), lp = filt('lowpass', 260 + Math.random()*180), g = gain(0);
      chain(s, lp, g, master); var v = .9*Math.min(1, .5 + WXc.storm*.5);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .08); g.gain.exponentialRampToValueAtTime(v*.35, t + .9);
      g.gain.linearRampToValueAtTime(v*.55, t + 1.6); g.gain.exponentialRampToValueAtTime(.001, t + 5 + Math.random()*2.5);
      lp.frequency.setValueAtTime(lp.frequency.value*1.8, t); lp.frequency.exponentialRampToValueAtTime(110, t + 4.5); s.stop(t + 8); }
    var on = false, visible = true;
    function level(){ return on && visible && !document.hidden ? 1 : 0; }
    function tickA(){
      var t = C.currentTime, L = level(); master.gain.setTargetAtTime(L*.95, t, .6);
      if (!L) return;
      var r = WXc.rain, day = WXc.day, night = WXc.night, wind = WXc.wind;
      rainG.gain.setTargetAtTime(Math.min(1, r*1.1)*.36, t, 1.2);
      windG.gain.setTargetAtTime(Math.min(.55, .04 + wind/22), t, 1.5);
      leafG.gain.setTargetAtTime((SW > .5 ? .2 : 1)*Math.min(.07, wind/160), t, 1.5);
      if (r > .05 && t > nextDrop){ nextDrop = t + .03 + Math.random()*.25/(.3 + r); var d = C.createBufferSource(), df = filt('bandpass', 1800 + Math.random()*3200, 6), dg = gain(0);
        d.buffer = WN; chain(d, df, dg, master); dg.gain.setValueAtTime(.0, t); dg.gain.linearRampToValueAtTime(.35*Math.random(), t + .004); dg.gain.exponentialRampToValueAtTime(.001, t + .07); d.start(t, Math.random()*2); d.stop(t + .1); }
      var birdy = day*(1 - Math.min(1, r*1.4))*(1 - WXc.snow*.6)*(1 - WXc.storm)*(SW > .5 ? .35 : SA > .5 ? .6 : 1);
      if (birdy > .05 && t > nextBird){ var gap = (1.2 + Math.random()*4.5)/birdy; nextBird = t + gap;
        SONGS[Math.random()*SONGS.length | 0](t + .05, pan(Math.random()*1.6 - .8), (.035 + Math.random()*.05)*(.5 + .5*birdy));
        if (Math.random() < .3) SONGS[Math.random()*SONGS.length | 0](t + .4 + Math.random()*.6, pan(Math.random()*1.6 - .8), .03); }
      var warm = !(wxPick === 'live' && wxLive && wxLive.t != null && wxLive.t < 6);
      crickG = night*(1 - Math.min(1, r*2))*(1 - WXc.snow)*(SW > .5 ? 0 : 1)*(warm ? 1 : .55);
      crick.forEach(function(c){ if (crickG < .05){ c.g.gain.setTargetAtTime(0, t, .1); return; }
        while (c.next < t + .35){ if (c.next < t) c.next = t + .02; var n = 3 + (Math.random() < .3 ? 1 : 0), v = .05*crickG;
          for (var i = 0; i < n; i++){ var a = c.next + i*.034; c.g.gain.setValueAtTime(0, a); c.g.gain.linearRampToValueAtTime(v, a + .006); c.g.gain.linearRampToValueAtTime(0, a + .022); }
          c.next += c.rate + Math.random()*.25; } });
    }
    var iv = setInterval(tickA, 120);
    document.addEventListener('visibilitychange', tickA);
    if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ visible = es[0].isIntersecting; tickA(); }, {threshold: .05}).observe(renderer.domElement);
    return {set: function(v){ on = v; if (v && C.state !== 'running') C.resume(); tickA(); }, thunder: thunder, ctx: C};
  }

  function when(){                                                                   // now, or a time of day picked by hand (the hero's slider, or ?hero-time=19:40)
    var n = new Date(); if (override == null) return n;
    var k = new Date(n.getTime()); k.setUTCHours(0, 0, 0, 0);
    return new Date(k.getTime() + (override - kyivOff())*6e4);
  }
  function setSky(){
    var date = when(), s = sunPos(date), mo = moonPos(date), alt = s.alt;
    var P = palAt(alt), sd = dirOf(s);
    if (SW > .001) P.forEach(function(c, i){ if (i > 3 && i < 5) return; var l = c.r*.3 + c.g*.59 + c.b*.11; c.lerp(new T.Color(l*.94, l, l*1.1), (i > 4 ? .3 : .45)*SW); });   // winter: a paler, overcast sky
    var OC = wxOvercast();                                                          // live weather: a grey, low sky
    if (OC > .001) P.forEach(function(c, i){ var l = c.r*.3 + c.g*.59 + c.b*.11; c.lerp(new T.Color(l*.97, l, l*1.04), (i === 4 ? .85 : .82)*OC); if (i < 4 || i > 4) c.multiplyScalar(1 - .22*OC); });
    /* below the horizon the sun still lights the sky from where it is: keep its direction, but the light itself goes */
    U.uSunDir.value.copy(sd);
    SKYU.uZen.value.copy(P[0]); U.uHor.value.copy(P[1]); SKYU.uSunH.value.copy(P[2]); SKYU.uAnti.value.copy(P[3]); SKYU.uGlow.value.copy(P[4]);
    SKYU.uCLit.value.copy(P[5]); SKYU.uCSh.value.copy(P[6]);
    SKYU.uDisk.value = ss2(-1.2, .4, alt)*(1 - OC); SKYU.uGlowI.value = (.35 + .9*ss2(-10, -1, alt)*(1 - .55*ss2(15, 40, alt)))*(1 - .75*OC);
    var night = 1 - ss2(-12, -4, alt);
    SKYU.uStars.value = night*(mo.alt > -2 ? .85 : 1)*(1 - ss2(.15, .7, OC));
    SKYU.uMoon.value.copy(mo.alt > -4 && OC < .55 ? dirOf(mo) : new T.Vector3(.2, -1, .1));
    SKYU.uCov.value = WXc.live ? Math.max(.12, Math.min(1, .28 + .68*WXc.cover + .3*SW)) : .5 + .32*SW + .1*SA;
    /* haze: morning mist, clear day, a warm evening, a deep blue night */
    var fogCol = P[1].clone().lerp(P[3], .3); var lum = fogCol.r*.3 + fogCol.g*.59 + fogCol.b*.11; fogCol.lerp(new T.Color(lum, lum, lum), .42).multiplyScalar(.8);
    fogCol.lerp(new T.Color(lum*1.02, lum*1.08, lum*1.2), .6*SW).lerp(new T.Color(lum*1.22, lum*.98, lum*.68), .45*SA);
    if (WXc.fog > .01) fogCol.lerp(new T.Color(lum*1.15, lum*1.17, lum*1.2), .55*WXc.fog);
    fogCol.multiplyScalar(1 - .2*Math.max(WXc.rain, WXc.storm));
    scene.fog.color.copy(fogCol); U.uFogC.value.copy(fogCol);
    var dens = .0032 + .0018*(1 - ss2(-2, 14, alt)) + .0008*ss2(-6, 3, alt)*(1 - ss2(3, 12, alt));
    dens *= 1 + .9*SW + .4*SA + 2.6*WXc.fog + .55*WXc.rain + 1.3*WXc.snow;
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
      sunI: (useMoon ? .62*moonLit : 1.9*ss2(-.8, 4, alt)*(.78 + .22*high))*(1 - .38*SW)*(1 - .82*OC),
      fillColor: hex(P[0].clone().lerp(new T.Color('#d3dcff'), day*.5)), fillI: .06 + .22*day + .05*night,
      sky: hex(P[0].clone().lerp(P[1], .5)), ground: alt > 0 ? '#3d3020' : '#121522', hemiI: (.14 + .3*day + .06*night)*(1 + .45*OC*day),
      exposure: (.62 + .16*twi + .3*day + .22*night)*(1 - .1*SW)*(1 - .16*OC - .08*WXc.rain), env: .08 + .12*twi + .3*day, lamps: 1 - ss2(-5, 1.5, alt)});
    hemi2.color.copy(P[1]).lerp(new T.Color('#6a7cb0'), night*.6); hemi2.groundColor.set(alt > 0 ? '#3a3420' : '#141826'); hemi2.intensity = .12 + .24*day + .16*(1 - day)*twi + .42*night;
    birds.forEach(function(b){ b.visible = alt > -6 && WXc.rain < .35 && WXc.fog < .6 && WXc.storm < .3; });
    lampsK = Math.max(1 - ss2(-5, 1.5, alt), .85*OC*(1 - ss2(4, 14, alt))); lanterns.set(lampsK); LAMPK.value = lampsK;
    baseExp = renderer.toneMappingExposure; WXc.day = day; WXc.night = night;
    api.heroSun = s;
  }

  /* ── birds over the river ── */
  var birds = [];
  (function(){
    var bm = new T.MeshBasicMaterial({color: '#20180f', side: T.DoubleSide, fog: true});
    var wg = new T.BufferGeometry(); wg.setAttribute('position', new T.Float32BufferAttribute([0, 0, -.12, 0, 0, .14, .62, 0, 0], 3));
    for (var i = 0; i < (lite ? 5 : 9); i++){
      var b = new T.Group(), l = new T.Mesh(wg, bm), r = new T.Mesh(wg, bm); r.scale.x = -1; b.add(l); b.add(r);
      b.userData = {l: l, r: r, ph: i*.7, rad: 26 + (i % 3)*7, h: 20 + (i % 4)*2.2, sp: .09 + (i % 3)*.015, cx: 38 + (i % 2)*8, cz: -10 + (i % 3)*9};
      b.scale.setScalar(1.6); scene.add(b); birds.push(b);
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
    var g = new T.BufferGeometry(), p = new Float32Array(n*3), c = new Float32Array(n*3), R0 = 58;
    for (var i = 0; i < n; i++){ p[i*3] = GX + 6 + (Math.random()*2 - 1)*R0; p[i*3 + 1] = Math.random()*o2.h; p[i*3 + 2] = GZ + (Math.random()*2 - 1)*R0;
      var q = o2.cols[i % o2.cols.length]; c[i*3] = q.r; c[i*3 + 1] = q.g; c[i*3 + 2] = q.b; }
    g.setAttribute('position', new T.BufferAttribute(p, 3)); g.setAttribute('color', new T.BufferAttribute(c, 3));
    var m = new T.PointsMaterial({size: o2.size, map: o2.map, transparent: true, depthWrite: false, opacity: 0, vertexColors: true, alphaTest: o2.at || 0});
    m.onBeforeCompile = function(sh){ sh.uniforms.uTime = U.uTime;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace('#include <begin_vertex>', 'vec3 transformed = position; float rr = fract(position.x*.173 + position.z*.311);\n' +
          'transformed.y = mod(position.y - uTime*' + o2.v.toFixed(2) + '*(.7 + .6*rr), ' + o2.h.toFixed(1) + ') - 6.0;\n' +
          'transformed.x += sin(uTime*.7 + rr*40.0)*' + o2.sw.toFixed(2) + ' + sin(uTime*.23 + rr*9.0)*' + (o2.sw*2).toFixed(2) + ';\n transformed.z += cos(uTime*.55 + rr*30.0)*' + o2.sw.toFixed(2) + ';'); };
    var pts = new T.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 5; pts.visible = false; scene.add(pts); return pts;
  }
  var snowFx = null, leafFx = null;
  function makeSnow(){ return snowFx || (snowFx = fall(lite ? 1400 : 3200, {h: 36, v: 1.5, sw: .45, size: .7, cols: [new T.Color(1, 1, 1)],
    map: sprite(function(k){ var g = k.createRadialGradient(32, 32, 0, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.45, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); k.fillStyle = g; k.fillRect(0, 0, 64, 64); })})); }
  function makeLeaves(){ return leafFx || (leafFx = fall(lite ? 160 : 320, {h: 30, v: .9, sw: 1.4, size: .95, at: .35, cols: AUTC.slice(0, 6), map: sprite(function(k){
    k.translate(32, 32); k.rotate(.6); k.fillStyle = '#fff'; k.beginPath(); k.moveTo(0, -26); k.quadraticCurveTo(17, -6, 0, 26); k.quadraticCurveTo(-17, -6, 0, -26); k.fill(); })})); }
  function setSeason(k, at){
    if (k === SEASON) return; SEASON = k;
    if (k === 'winter'){ patchSnow(); makeSnow(); } if (k === 'autumn') makeLeaves(); patchLamps();
    CROWNS.forEach(function(c){ c.from = c.im.instanceColor.array.slice(); c.to = crownTarget(c, k); }); ctT = 0;
    if (at){ ctT = .999; SW = k === 'winter' ? .999 : 0; SA = k === 'autumn' ? .999 : 0; }                    // at once (for stills)
  }
  var skyTick = 0;
  function stepSeason(dt){
    var w = SEASON === 'winter' ? 1 : 0, a = SEASON === 'autumn' ? 1 : 0, moving = Math.abs(w - SW) > .002 || Math.abs(a - SA) > .002;
    if (!moving && SW === w && SA === a && ctT >= 1) return;
    var kk = Math.min(1, dt*1.3); SW = moving ? SW + (w - SW)*kk : w; SA = moving ? SA + (a - SA)*kk : a;
    U.uWSnow.value = SW; U.uIce.value = SW; U.uAut.value = SA;
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
      '.hxw-snd{width:38px;height:38px;padding:0;border-radius:50%;border:1px solid rgba(244,233,200,.24);background:rgba(23,18,11,.55);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);color:#f4e9c8;display:grid;place-items:center;cursor:pointer;opacity:.6;flex:0 0 auto;transition:opacity .3s,border-color .3s,background .3s}',
      '.hxw-snd:hover,.hxw-snd:focus-visible{opacity:1;border-color:rgba(212,178,90,.5)}.hxw-snd[aria-pressed="true"]{opacity:1;border-color:rgba(212,178,90,.55);background:rgba(40,30,14,.6)}',
      '.hxw-snd svg{width:17px;height:17px}.hxw-snd .w{opacity:0;transition:opacity .3s}.hxw-snd[aria-pressed="true"] .w{opacity:1;animation:hxwW 1.8s ease-in-out infinite}.hxw-snd[aria-pressed="true"] .x{opacity:0}',
      '@keyframes hxwW{50%{opacity:.35}}',
      '.hxw-live{width:100%;display:flex;align-items:center;gap:.5rem;margin:0 0 .45rem;padding:.42rem .6rem;border-radius:9px;border:1px solid rgba(212,178,90,.12);background:rgba(255,255,255,.05);color:rgba(244,233,200,.65);font:inherit;font-size:.68rem;text-align:left;cursor:pointer;transition:background .25s,color .25s}',
      '.hxw-live[aria-pressed="true"]{background:rgba(212,178,90,.2);color:#f4e9c8}.hxw-live .hxw-ln{font:600 .7rem/1.2 Manrope,system-ui,sans-serif;color:#f4e9c8;white-space:nowrap}.hxw-live .hxw-lv{margin-left:auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:.75;font-size:.68rem}',
      '.hxw-dot{width:6px;height:6px;border-radius:50%;background:#7fc48a;box-shadow:0 0 0 0 rgba(127,196,138,.6);animation:hxwP 2.4s infinite;flex:0 0 auto}.hxw-dot.off{background:rgba(244,233,200,.3);animation:none}',
      '@keyframes hxwP{0%{box-shadow:0 0 0 0 rgba(127,196,138,.55)}70%{box-shadow:0 0 0 6px rgba(127,196,138,0)}100%{box-shadow:0 0 0 0 rgba(127,196,138,0)}}',
      '.hxw-wx{margin-bottom:.75rem}.hx-wx{display:flex!important;align-items:center;gap:.45rem;margin-top:.45rem!important;color:rgba(244,233,200,.78)!important;letter-spacing:.01em}.hx-wx[hidden]{display:none!important}',
      '@media(max-width:980px){.hxw{right:.9rem;bottom:.7rem}.hxw-p{width:min(250px,calc(100vw - 2rem))}.hxw-row{align-self:stretch;justify-content:space-between}}'].join('');
    document.head.appendChild(css);
    var box = document.createElement('div'); box.className = 'hxw';
    box.innerHTML = '<div class="hxw-p" id="hxwP" role="group" aria-label="Погода, пора доби й року">' +
      '<div class="hxw-h" style="margin-bottom:.4rem"><span class="hxw-k">Погода</span></div>' +
      '<div class="hxw-wx"><button type="button" class="hxw-live" data-w="live"><i class="hxw-dot off"></i><span class="hxw-ln">Наживо</span><span class="hxw-lv">…</span></button>' +
      '<div class="hxw-s">' + [['clear', 'Ясно'], ['cloudy', 'Хмарно'], ['rain', 'Дощ'], ['fog', 'Туман'], ['snow', 'Сніг'], ['storm', 'Гроза']].map(function(q){ return '<button type="button" data-w="' + q[0] + '">' + q[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="hxw-h"><span class="hxw-k">Пора доби</span><span class="hxw-t"></span><button type="button" class="hxw-now" hidden>зараз</button></div>' +
      '<input class="hxw-r" type="range" min="0" max="1439" step="5" aria-label="Час доби">' +
      '<div class="hxw-h" style="margin-bottom:.4rem"><span class="hxw-k">Пора року</span></div>' +
      '<div class="hxw-s">' + [['summer', 'Літо'], ['autumn', 'Осінь'], ['winter', 'Зима']].map(function(q){ return '<button type="button" data-s="' + q[0] + '" aria-pressed="' + (q[0] === SEASON) + '"' + (q[0] === NOWS ? ' class="is-now" title="Пора року зараз"' : '') + '>' + q[1] + '</button>'; }).join('') + '</div></div>' +
      '<button type="button" class="hxw-b" aria-label="Змінити пору доби й року" aria-expanded="false" aria-controls="hxwP"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M4.5 13.5a5.5 5.5 0 0 1 11 0"/><path d="M2 13.5h16M10 3.2v1.6M4.2 5.6l1.1 1.1M15.8 5.6l-1.1 1.1M6 16.5h8"/></svg></button>';
    var full = document.getElementById('hxFull');                                   // sits in line with «Розглянути зблизька», same height
    var snd = document.createElement('button'); snd.type = 'button'; snd.className = 'hxw-snd'; snd.setAttribute('aria-pressed', 'false'); snd.setAttribute('aria-label', 'Звуки Воробина: птахи, вітер, дощ'); snd.title = 'Увімкнути звук';
    snd.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5h3l4-3.5v12l-4-3.5H3z"/><path class="w" d="M13 7.2a4 4 0 0 1 0 5.6M15.2 5a7 7 0 0 1 0 10"/><path class="x" d="M13.5 8l4 4M17.5 8l-4 4"/></svg>';
    if (full && full.parentNode){ var row = document.createElement('div'); row.className = 'hxw-row'; full.parentNode.insertBefore(row, full); row.appendChild(full); row.appendChild(snd); row.appendChild(box); }
    else { host.appendChild(box); snd.style.cssText = 'position:absolute;right:3.6rem;bottom:.8rem;z-index:4'; host.appendChild(snd); }
    snd.addEventListener('click', function(){ var v = snd.getAttribute('aria-pressed') !== 'true';
      if (!AU) AU = makeAudio(); if (!AU) return; AU.set(v); snd.setAttribute('aria-pressed', String(v)); snd.title = v ? 'Вимкнути звук' : 'Увімкнути звук'; });
    /* a live line under the caption: the weather in Dubrovytsia right now */
    var sub = document.getElementById('hxSub'), cap = null;
    if (sub && sub.parentNode){ cap = document.createElement('small'); cap.className = 'hx-wx'; cap.hidden = true; sub.parentNode.appendChild(cap); }
    var lv = box.querySelector('.hxw-lv'), dot = box.querySelector('.hxw-dot');
    function deg(t){ t = Math.round(t); return (t > 0 ? '+' : t < 0 ? '−' : '') + Math.abs(t) + '°'; }
    function wxShow(){
      var L = wxLive; lv.textContent = L ? deg(L.t) + (L.label ? ', ' + L.label : '') : 'немає даних'; dot.classList.toggle('off', !L);
      box.querySelectorAll('[data-w]').forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.w === wxPick)); });
      if (cap){ cap.hidden = !L; if (L) cap.innerHTML = '<i class="hxw-dot"></i>Зараз у Дубровиці: ' + deg(L.t) + (L.label ? ', ' + L.label : '') + (wxPick !== 'live' ? ' · на сцені обрано вручну' : ''); }
    }
    wxListeners.push(wxShow);
    box.querySelectorAll('[data-w]').forEach(function(b){ b.addEventListener('click', function(){ wxPick = b.dataset.w; wxApply(); }); });
    wxShow();
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
  setSky(); setInterval(setSky, 60000); patchLamps();
  wxApply(); wxFetch(); setInterval(function(){ wxFetch(true); }, 15*60000);
  api.heroWeather = function(k){ wxPick = k; wxApply(); for (var q in WX) WXc[q] = WX[q]; WXc.wet = WX.rain > .05 ? 1 : 0; setSky(); }; api.__wx = function(){ return {WX: WX, WXc: WXc, live: wxLive}; };

  /* ── frame the house on the right, so the copy on the left has open sky and land behind it ── */
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

  /* ── a view, not a turntable: the camera may swing only between the west front (portico and tower) and the south colonnade,
     and when left alone it drifts slowly back and forth between them ── */
  var ctl = api.controls, A0 = -Math.PI/2 - .32, A1 = .12;                          // azimuth: west (−90°, a little north to show the tower) … south (0°)
  ctl.autoRotate = false; ctl.minAzimuthAngle = A0; ctl.maxAzimuthAngle = A1;
  ctl.minPolarAngle = Math.PI*.36; ctl.maxPolarAngle = Math.PI*.485;
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
    var dtt = Math.min(.1, (now - lastNow)/1000); sway(now, dtt); stepSeason(dtt); stepWeather(dtt); lastNow = now;
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
