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
  var U = {uTime: {value: 0}, uFogC: {value: new T.Color()}, uFogD: {value: .005}, uSunDir: {value: new T.Vector3(0, 1, 0)}, uHor: {value: new T.Color()}, uGlowW: {value: new T.Color()}, uDeep: {value: new T.Color()}, uGlint: {value: 1}, uNightG: {value: 0}};
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
  terrM.onBeforeCompile = function(sh){
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vTW;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvTW = (modelMatrix*vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vTW;\nfloat th(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }\nfloat tn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f); return mix(mix(th(i), th(i + vec2(1, 0)), f.x), mix(th(i + vec2(0, 1)), th(i + vec2(1, 1)), f.x), f.y); }')
      .replace('#include <color_fragment>', ['#include <color_fragment>',
        'float dd = length(vTW - cameraPosition), fd = 1.0 - smoothstep(60.0, 260.0, dd);',
        'float g1 = tn(vTW.xz*1.7), g2 = tn(vTW.xz*6.3 + 3.1), g3 = tn(vTW.xz*.33 + 7.7);',
        'float tuft = (g1*.6 + g2*.4 - .5)*.34*fd + (g3 - .5)*.22;',
        'diffuseColor.rgb *= 1.0 + tuft;',
        'diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb*vec3(1.12, 1.05, .78), smoothstep(.62, .82, g3)*.5);',      // drier, yellower patches
        'float fur = abs(sin(vTW.z*.9 + tn(vTW.xz*.05)*4.0));',
        'float field = 1.0 - step(-360.0, vTW.x)*step(vTW.x, 26.0)*step(-310.0, vTW.z)*step(vTW.z, 290.0);',
        'diffuseColor.rgb *= mix(1.0, .9 + .14*fur, field*step(vTW.x, 30.0)*fd);'].join('\n'));      // furrows in the fields
  };
  var terrain = new T.Mesh(tg, terrM); terrain.receiveShadow = true; scene.add(terrain);

  /* the model's own turntable gives way to the land */
  scene.children.forEach(function(c){ if (c.isMesh && c.geometry && c.geometry.type === 'PlaneGeometry' && c.geometry.parameters.width > 40 && c !== terrain) c.visible = false; });

  /* ── the estate grounds: drive, forecourt, park walks and the parterre, painted onto a skin that follows the slope ── */
  (function(){
    var S = 130, N = lite ? 110 : 170, CW = 2048, cv = document.createElement('canvas'); cv.width = cv.height = CW;
    var K = cv.getContext('2d'), px = CW/S, ox = -8, oz = 0;
    function X(x){ return (x - ox)*px + CW/2; } function Z(z){ return (z - oz)*px + CW/2; }
    function line(pts, w, colr){ K.save(); K.lineCap = K.lineJoin = 'round'; K.strokeStyle = colr; K.lineWidth = w*px; K.beginPath(); pts.forEach(function(q, i){ i ? K.lineTo(X(q[0]), Z(q[1])) : K.moveTo(X(q[0]), Z(q[1])); }); K.stroke(); K.restore(); }
    function path(pts, w){ line(pts, w + .9, 'rgba(105,88,60,.35)'); line(pts, w, '#8b7553'); }
    path([[-72, 0], [-19, 0]], 4.2);                                                  // the drive from the road
    K.fillStyle = 'rgba(105,88,60,.35)'; K.beginPath(); K.ellipse(X(-18.4), Z(0), 3.6*px, 6*px, 0, 0, 6.283); K.fill();
    K.fillStyle = '#8b7553'; K.beginPath(); K.ellipse(X(-18.4), Z(0), 3.1*px, 5.5*px, 0, 0, 6.283); K.fill();
    path([[-17.2, 3], [-17.8, 7], [-17.9, 12], [-16, 20], [-8, 25], [4, 24], [14, 19], [20, 12]], 1.3);   // the park walk round the south
    path([[-16, -3.5], [-12, -9], [-5, -15], [3, -16], [11, -12], [17, -4], [20, 6]], 1.1);               // and round the north
    path([[20, 12], [23.5, 13]], 1.0); path([[17, -4], [22, -14], [26, -18]], 1.0);    // down to the ponds
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
    uniforms: {uTime: U.uTime, uFlow: {value: 1}, uFogC: U.uFogC, uFogD: U.uFogD, uSun: U.uSunDir, uSkyW: U.uHor, uWarmW: U.uGlowW, uDeep: U.uDeep, uGlint: U.uGlint},
    vertexShader: 'varying vec2 vUv; varying vec3 vW; varying float vD; void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix*w; vD = -mv.z; gl_Position = projectionMatrix*mv; }',
    fragmentShader: [
      'uniform float uTime, uFlow, uFogD, uGlint; uniform vec3 uFogC, uSun, uSkyW, uWarmW, uDeep; varying vec2 vUv; varying vec3 vW; varying float vD;',
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
      '  c += warm*g*1.6*uGlint;',
      '  float edge = smoothstep(0.0, .14, vUv.x)*smoothstep(1.0, .86, vUv.x);',
      '  float fogf = 1.0 - exp(-uFogD*uFogD*vD*vD);',
      '  gl_FragColor = vec4(mix(c, uFogC, fogf), (.78 + .2*fr)*edge);',
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
  function blobCrown(){                                                              // three lumps of foliage, merged
    var parts = [[0, 0, 0, 1], [.55, -.25, .2, .72], [-.45, -.2, -.35, .7], [.05, .45, -.1, .62]], P = [], N = [];
    parts.forEach(function(q){ var g = new T.IcosahedronGeometry(q[3], 1); g.translate(q[0], q[1], q[2]); P.push(g.attributes.position.array); N.push(g.attributes.normal.array); });
    return merge(P, N);
  }
  function coneCrown(){ var P = [], N = []; [[0, 0, 1, 1.6], [0, 1.0, .74, 1.3], [0, 1.85, .48, 1.0]].forEach(function(q){ var g = new T.ConeGeometry(q[2], q[3], 9).toNonIndexed(); g.translate(0, q[1], 0); P.push(g.attributes.position.array); N.push(g.attributes.normal.array); }); return merge(P, N); }
  function poplarCrown(){ var P = [], N = []; [[0, 0, .55, 1.0], [0, 1.1, .5, 1.0], [0, 2.1, .38, .9]].forEach(function(q){ var g = new T.IcosahedronGeometry(q[2], 1); g.scale(1, 1.7, 1); g.translate(0, q[1], 0); P.push(g.attributes.position.array); N.push(g.attributes.normal.array); }); return merge(P, N); }
  function merge(P, N){ var len = 0; P.forEach(function(a){ len += a.length; }); var p = new Float32Array(len), n = new Float32Array(len), at = 0;
    P.forEach(function(a, i){ p.set(a, at); n.set(N[i], at); at += a.length; }); var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(p, 3)); g.setAttribute('normal', new T.BufferAttribute(n, 3)); return g; }
  function windy(m, amt){
    m.onBeforeCompile = function(sh){
      sh.uniforms.uTime = U.uTime;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\n vec3 ip = instanceMatrix[3].xyz;\n#else\n vec3 ip = vec3(0.0);\n#endif\n' +
          ' float k = max(0.0, position.y + 1.0);\n transformed.x += (sin(uTime*1.1 + ip.x*.13 + ip.z*.07) + .35*sin(uTime*2.7 + ip.z*.3))*' + amt.toFixed(3) + '*k;\n transformed.z += cos(uTime*.9 + ip.z*.11)*' + (amt*.6).toFixed(3) + '*k;\n vLY = position.y; vLN = normal;')
        .replace('#include <common>', '#include <common>\nvarying float vLY; varying vec3 vLN;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vLY; varying vec3 vLN;')
        .replace('#include <color_fragment>', '#include <color_fragment>\n float ao = smoothstep(-1.1, 1.0, vLY); diffuseColor.rgb *= .55 + .6*ao;\n diffuseColor.rgb *= 1.0 + .18*smoothstep(.3, 1.0, vLN.y);\n diffuseColor.rgb *= .9 + .2*fract(sin(dot(floor(vLN*7.0), vec3(12.9, 78.2, 37.7)))*43758.5);');
    };
  }
  var LEAF = ['#4f6f33', '#5b7a38', '#46652e', '#62803c', '#557334', '#6a8640'].map(lin), CON = ['#2e4a2f', '#33503a', '#2a4430'].map(lin), POP = lin('#7f9168');
  var crownM = new T.MeshStandardMaterial({roughness: .9, flatShading: true}); windy(crownM, .05);
  var conM = new T.MeshStandardMaterial({roughness: .95, flatShading: true}); windy(conM, .025);
  var trunkM = new T.MeshStandardMaterial({color: '#4a3826', roughness: 1});
  var list = {blob: [], cone: [], pop: []};
  function add(kind, x, z, s){ list[kind].push([x, H(x, z), z, s]); }
  /* the forest */
  var step = lite ? 9 : 6, rnd = (function(seed){ return function(){ seed = (seed*16807) % 2147483647; return (seed - 1)/2147483646; }; })(1918);
  for (var fx = CX - SIZE/2 + 4; fx < CX + SIZE/2 - 4; fx += step) for (var fz = -SIZE/2 + 4; fz < SIZE/2 - 4; fz += step){
    var rr = Math.hypot(fx - GX, fz - GZ), thin = rr < 140 ? 1 : rr < 260 ? .4 : .18;   // farther off, fewer but bigger trees
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
  }
  instance('blob', blobCrown(), crownM, LEAF, 1.7, .9, true);
  instance('cone', coneCrown(), conM, CON, .9, 1.0, true);
  instance('pop', poplarCrown(), crownM, [POP, lin('#71865c')], 1.2, 1.0, true);

  /* ── lanterns along the drive and round the forecourt: posts by day, warm pools of light at dusk and night ── */
  var lampsK = 0, lanterns = (function(){
    var P = [];
    for (var lx = -26; lx >= -64; lx -= 9.5){ P.push([lx, -3.3]); P.push([lx - 4.75, 3.3]); }
    [[-21.6, -4.4], [-21.6, 4.4], [-15.2, -6.2], [-15.2, 6.2], [-16.6, 11], [-12, 18.5], [2, 19], [12.5, 15.5], [-12.5, -11.5], [2, -17.6]].forEach(function(q){ P.push(q); });
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
  function when(){                                                                   // now, or a set time of day for a preview (?hero-time=19:40)
    var n = new Date(); if (override == null) return n;
    var k = new Date(n.getTime()); k.setUTCHours(0, 0, 0, 0);
    var kyiv = 180;                                                                  // close enough for a preview: Kyiv summer time
    return new Date(k.getTime() + (override - kyiv)*6e4);
  }
  function setSky(){
    var date = when(), s = sunPos(date), mo = moonPos(date), alt = s.alt;
    var P = palAt(alt), sd = dirOf(s);
    /* below the horizon the sun still lights the sky from where it is: keep its direction, but the light itself goes */
    U.uSunDir.value.copy(sd);
    SKYU.uZen.value.copy(P[0]); U.uHor.value.copy(P[1]); SKYU.uSunH.value.copy(P[2]); SKYU.uAnti.value.copy(P[3]); SKYU.uGlow.value.copy(P[4]);
    SKYU.uCLit.value.copy(P[5]); SKYU.uCSh.value.copy(P[6]);
    SKYU.uDisk.value = ss2(-1.2, .4, alt); SKYU.uGlowI.value = .35 + .9*ss2(-10, -1, alt)*(1 - .55*ss2(15, 40, alt));
    var night = 1 - ss2(-12, -4, alt);
    SKYU.uStars.value = night*(mo.alt > -2 ? .85 : 1);
    SKYU.uMoon.value.copy(mo.alt > -4 ? dirOf(mo) : new T.Vector3(.2, -1, .1));
    SKYU.uCov.value = .5;
    /* haze: morning mist, clear day, a warm evening, a deep blue night */
    var fogCol = P[1].clone().lerp(P[3], .3); var lum = fogCol.r*.3 + fogCol.g*.59 + fogCol.b*.11; fogCol.lerp(new T.Color(lum, lum, lum), .42).multiplyScalar(.8);
    scene.fog.color.copy(fogCol); U.uFogC.value.copy(fogCol);
    var dens = .0032 + .0018*(1 - ss2(-2, 14, alt)) + .0008*ss2(-6, 3, alt)*(1 - ss2(3, 12, alt));
    scene.fog.density = dens; U.uFogD.value = dens;
    U.uGlowW.value.copy(P[4]).lerp(P[5], .3); U.uDeep.value.copy(P[0]).multiplyScalar(.18).add(new T.Color(.012, .03, .032));
    U.uGlint.value = ss2(-1, 3, alt);
    /* the model's own lights: sun, fill, sky, exposure, floodlights at night */
    var day = ss2(-1, 12, alt), high = ss2(6, 40, alt), twi = ss2(-10, 0, alt);
    /* at night the moon takes over as the key light: cool, soft, from where it stands (or from high up when it's down) */
    var moonLit = night*(mo.alt > 3 ? 1 : .6), md = mo.alt > 3 ? dirOf(mo) : new T.Vector3(-.35, .8, .45).normalize();
    var useMoon = moonLit > .05 && alt < -4;
    var sunC = alt < 8 ? new T.Color('#ff7a3a').lerp(new T.Color('#ffd09a'), ss2(-1, 8, alt)) : new T.Color('#ffe2b8').lerp(new T.Color('#fff6e8'), high);
    api.light({dir: useMoon ? [md.x, md.y, md.z] : [sd.x, Math.max(sd.y, .02), sd.z], sunColor: useMoon ? '#9fb2e2' : '#' + sunC.getHexString(),
      sunI: useMoon ? .42*moonLit : 1.9*ss2(-.8, 4, alt)*(.78 + .22*high),
      fillColor: hex(P[0].clone().lerp(new T.Color('#d3dcff'), day*.5)), fillI: .06 + .22*day + .05*night,
      sky: hex(P[0].clone().lerp(P[1], .5)), ground: alt > 0 ? '#3d3020' : '#121522', hemiI: .14 + .3*day + .06*night,
      exposure: .62 + .16*twi + .3*day, env: .08 + .12*twi + .3*day, lamps: 1 - ss2(-5, 1.5, alt)});
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
      b.userData = {l: l, r: r, ph: i*.7, rad: 26 + (i % 3)*7, h: 20 + (i % 4)*2.2, sp: .09 + (i % 3)*.015, cx: 38 + (i % 2)*8, cz: -10 + (i % 3)*9};
      b.scale.setScalar(1.6); scene.add(b); birds.push(b);
    }
  })();

  var smoke = null;
  setSky(); setInterval(setSky, 60000);

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
    sway(now, Math.min(.1, (now - lastNow)/1000)); lastNow = now;
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
