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
  var U = {uTime: {value: 0}};
  function ss(a, b, x){ var t = Math.max(0, Math.min(1, (x - a)/(b - a))); return t*t*(3 - 2*t); }
  function lin(c){ return new T.Color(c).convertSRGBToLinear(); }
  function hash(x, z){ var s = Math.sin(x*127.1 + z*311.7)*43758.5453; return s - Math.floor(s); }
  function vnoise(x, z){ var ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz; fx = fx*fx*(3 - 2*fx); fz = fz*fz*(3 - 2*fz);
    var a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1); return a + (b - a)*fx + (c - a)*fz + (a - b - c + d)*fx*fz; }
  function fbm(x, z){ return vnoise(x, z)*.5 + vnoise(x*2.03 + 5.2, z*2.03 + 1.3)*.25 + vnoise(x*4.1 + 2.7, z*4.1 + 8.1)*.125; }

  /* ── the land ── */
  var GX = -3.4, GZ = -.4;                                                          // centre of the model's turntable
  function near(x){ return -1.75*ss(-5, 9, x) - 2.2*ss(9.5, 22, x); }               // the same slope the model stands on
  function riverX(z){ return 46 + 10*Math.sin(z/41 + .6) + 4.5*Math.sin(z/17.5 + 2.1); }
  var WATER = -5.0;
  function H(x, z){
    var h = near(x);
    var rx = riverX(z), d = Math.abs(x - rx);
    h -= 1.55*(1 - ss(4.5, 9.5, d));                                                // the river bed and its banks
    h += 1.1*ss(0, 1, (x - rx - 22)/60) + 1.2*ss(0, 1, (x - rx - 70)/90);              // the far bank rises to a wooded terrace
    h += .9*ss(-30, -140, x) + .5*ss(70, 200, Math.abs(z));                           // gentle rise westwards and far off
    var r = Math.hypot(x - GX, z - GZ), wild = ss(26, 70, r);
    h += (fbm(x*.018, z*.018) - .5)*2.4*wild*ss(10, 30, d);
    PONDS.forEach(function(p){ var q = Math.hypot((x - p[0])/p[2], (z - p[1])/p[3]); if (q < 1.6) h = Math.min(h, h - .9*(1 - ss(.75, 1.6, q))); });
    return h;
  }
  var PONDS = [[24.5, 17, 6.5, 4.2], [27, -21, 5.4, 3.6]];                          // the two ponds on the lower level
  function pondLevel(p){ return near(p[0]) - .55; }

  /* forest: belts along the horizon and the far bank, a copse north of the park; none on the fields and meadows */
  function forest(x, z){
    var rx = riverX(z), f = 0;
    f = Math.max(f, ss(0, 1, (x - rx - 24)/20));                                     // beyond the river
    f = Math.max(f, ss(-58, -90, z)*(1 - ss(70, 90, x - rx + 70)));                   // north
    f = Math.max(f, ss(64, 96, z));                                                   // south
    f = Math.max(f, ss(-120, -150, x));                                               // far west, beyond the fields
    if (Math.hypot(x + 22, z + 44) < 18) f = Math.max(f, 1 - ss(10, 18, Math.hypot(x + 22, z + 44)));   // a copse north-west of the park
    f *= .55 + .9*fbm(x*.03 + 3, z*.03 + 9);
    if (Math.hypot(x - GX, z - GZ) < 36) f = 0;
    if (Math.abs(x - rx) < 12) f = 0;
    return Math.min(1, f);
  }

  /* ── terrain mesh with painted zones ── */
  var SIZE = 640, SEG = lite ? 150 : 220, CX = 30;
  var tg = new T.PlaneGeometry(SIZE, SIZE, SEG, SEG); tg.rotateX(-Math.PI/2); tg.translate(CX, 0, 0);
  var tp = tg.attributes.position, col = new Float32Array(tp.count*3), C = new T.Color();
  var cLawn = lin('#6a7a42'), cMead = lin('#82904a'), cMeadY = lin('#a09a58'), cMud = lin('#6b5f43'), cFloor = lin('#465230'),
      cField = [lin('#a3954f'), lin('#7c8b42'), lin('#b8a462'), lin('#919049'), lin('#6e7d3d')], cRoad = lin('#8a7652');
  for (var i = 0; i < tp.count; i++){
    var x = tp.getX(i), z = tp.getZ(i), h = H(x, z); tp.setY(i, h);
    var rx = riverX(z), d = Math.abs(x - rx), n = fbm(x*.08, z*.08);
    if (x < -44){ var strip = Math.floor((z + 1000)/15), k = Math.floor(hash(strip, Math.floor((x + 1000)/90))*5); C.copy(cField[k]); }
    else if (x > 12) C.copy(cMead).lerp(cMeadY, ss(.45, .8, n));
    else C.copy(cLawn);
    if (x > -44 && x < -40) C.lerp(cLawn, .5);
    var fr = forest(x, z); C.lerp(cFloor, ss(.15, .5, fr));
    C.lerp(cMud, 1 - ss(5.5, 8.5, d));
    if (Math.abs(x + 58 + Math.sin(z/60)*3) < 2.4) C.copy(cRoad);                     // the road north–south, west of the estate
    C.multiplyScalar(.86 + .28*n);
    col[i*3] = C.r; col[i*3 + 1] = C.g; col[i*3 + 2] = C.b;
  }
  tg.setAttribute('color', new T.BufferAttribute(col, 3)); tg.computeVertexNormals();
  var terrain = new T.Mesh(tg, new T.MeshStandardMaterial({vertexColors: true, roughness: 1})); terrain.receiveShadow = true; scene.add(terrain);

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
    uniforms: {uTime: U.uTime, uFlow: {value: 1}, uFogC: {value: lin('#55452e')}, uFogD: {value: .0052}, uSun: {value: new T.Vector3(.62, .3, -.42).normalize()}},
    vertexShader: 'varying vec2 vUv; varying vec3 vW; varying float vD; void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position, 1.0); vW = w.xyz; vec4 mv = viewMatrix*w; vD = -mv.z; gl_Position = projectionMatrix*mv; }',
    fragmentShader: [
      'uniform float uTime, uFlow, uFogD; uniform vec3 uFogC, uSun; varying vec2 vUv; varying vec3 vW; varying float vD;',
      'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }',
      'float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }',
      'void main(){',
      '  vec2 q = vW.xz*vec2(.35, .12) + vec2(0.0, uTime*.55*uFlow);',
      '  float r = n(q) + .5*n(q*2.3 + vec2(uTime*.2, uTime*.9*uFlow)) + .25*n(q*5.1 - vec2(0.0, uTime*1.4*uFlow));',
      '  vec3 V = normalize(cameraPosition - vW); float fr = pow(1.0 - max(V.y, 0.0), 3.0);',
      '  vec3 deep = vec3(.03, .055, .06), sky = vec3(.40, .29, .17), warm = vec3(.72, .5, .26);',
      '  float rip = smoothstep(.95, 1.45, r);',
      '  vec3 c = mix(deep, sky, .08 + .62*fr);',
      '  c = mix(c, warm, rip*(.25 + .5*fr));',                                     // ripples catch the evening sky
      '  c *= .85 + .3*n(vW.xz*.05 + vec2(0.0, uTime*.05));',
      '  vec3 Rf = reflect(-V, normalize(vec3((r - .9)*.25, 1.0, (n(q*1.7) - .5)*.25))); float g = pow(max(dot(Rf, uSun), 0.0), 60.0);',
      '  c += vec3(1.0, .84, .58)*g*1.3;',
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
          ' float k = max(0.0, position.y + 1.0);\n transformed.x += (sin(uTime*1.1 + ip.x*.13 + ip.z*.07) + .35*sin(uTime*2.7 + ip.z*.3))*' + amt.toFixed(3) + '*k;\n transformed.z += cos(uTime*.9 + ip.z*.11)*' + (amt*.6).toFixed(3) + '*k;');
    };
  }
  var LEAF = ['#4f6f33', '#5b7a38', '#46652e', '#62803c', '#557334', '#6a8640'].map(lin), CON = ['#2e4a2f', '#33503a', '#2a4430'].map(lin), POP = lin('#7f9168');
  var crownM = new T.MeshStandardMaterial({roughness: .9, flatShading: true}); windy(crownM, .05);
  var conM = new T.MeshStandardMaterial({roughness: .95, flatShading: true}); windy(conM, .025);
  var trunkM = new T.MeshStandardMaterial({color: '#4a3826', roughness: 1});
  var list = {blob: [], cone: [], pop: []};
  function add(kind, x, z, s){ list[kind].push([x, H(x, z), z, s]); }
  /* the forest */
  var step = lite ? 7.5 : 5.2, rnd = (function(seed){ return function(){ seed = (seed*16807) % 2147483647; return (seed - 1)/2147483646; }; })(1918);
  for (var fx = CX - SIZE/2 + 4; fx < CX + SIZE/2 - 4; fx += step) for (var fz = -SIZE/2 + 4; fz < SIZE/2 - 4; fz += step){
    var x2 = fx + (rnd() - .5)*step*.9, z2 = fz + (rnd() - .5)*step*.9, f = forest(x2, z2);
    if (rnd() > f) continue;
    add(rnd() < .38 ? 'cone' : 'blob', x2, z2, 1.6 + rnd()*1.4);
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

  /* ── sky and haze: the land melts into the page's own dusk ── */
  var fogC = lin('#55452e');
  scene.fog = new T.FogExp2(fogC, .0052);
  scene.add(new T.HemisphereLight('#ffe9c4', '#3a3420', .38));
  var sky = new T.Mesh(new T.SphereGeometry(520, 32, 16), new T.ShaderMaterial({side: T.BackSide, depthWrite: false, fog: false,
    uniforms: {uTop: {value: lin('#211a10')}, uHor: {value: fogC}, uGlow: {value: lin('#a07a48')}, uSun: {value: new T.Vector3(.62, .1, -.42).normalize()}},
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 uTop, uHor, uGlow, uSun; varying vec3 vD; void main(){ float y = max(vD.y, 0.0); vec3 c = mix(uHor, uTop, pow(y, .55)); float s = max(dot(normalize(vD), uSun), 0.0); c += uGlow*pow(s, 6.0)*(1.0 - y)*.55; gl_FragColor = vec4(c, 1.0);\n#include <encodings_fragment>\n}'}));
  sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);
  cam.far = 1200; cam.updateProjectionMatrix();

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

  /* ── animation ── */
  var t0 = performance.now();
  (function tick(now){
    var t = (now - t0)/1000; U.uTime.value = reduced ? 0 : t;
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
