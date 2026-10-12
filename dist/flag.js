'use strict';
// The cover waves slowly like a flag. A fragment shader builds a cloth-like height field (pinned on the left,
// freer on the right), lights it from the upper left, and multiplies the brand blue by a small light factor.
// The average color stays the brand blue; only folds get a few percent lighter or darker.
// Without WebGL, or when the page is in the background, the flat blue background simply stays.
(() => {
  const hero = document.querySelector('.hero');
  const canvas = hero && hero.querySelector('.hero-flag');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', {alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power'});
  if (!gl) return;

  const vertex = 'attribute vec2 a;varying vec2 v;void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
  const fragment = `
    precision mediump float;
    varying vec2 v;
    uniform vec2 size;
    uniform float t;
    uniform vec3 base;

    // Cloth height: three travelling waves, growing from the pinned left edge to the free right edge.
    float height(vec2 p) {
      float free = .2 + .8 * smoothstep(0., 1.5, p.x);
      // Slightly sharpened sines read as folds of cloth rather than as a smooth gradient.
      float a = sin(p.x * 3.6 - t * .42 + p.y * 1.7);
      float b = sin(p.x * 6.2 - t * .63 - p.y * 2.9 + a * .6);
      float c = sin(p.x * 10.5 - t * .9 + p.y * 4.6 + sin(t * .21 + p.y * 2.3));
      return (.55 * a + .32 * b + .13 * c) * free;
    }

    void main() {
      float aspect = size.x / size.y;
      vec2 p = vec2(v.x * clamp(aspect, 1.3, 2.4), v.y * 1.1);
      float e = .01;
      float h = height(p);
      float dx = height(p + vec2(e, 0.)) - h;
      float dy = height(p + vec2(0., e)) - h;
      vec3 n = normalize(vec3(-dx / e * .2, -dy / e * .2, 1.));
      vec3 light = normalize(vec3(-.45, .55, .85));
      float shade = dot(n, light) - dot(vec3(0., 0., 1.), light);
      // Soft, bounded: a fold can lighten or darken the blue by a few percent, never repaint it.
      vec3 color = base * (1.012 + clamp(shade * 1.15, -.09, .045));
      gl_FragColor = vec4(color, 1.);
    }`;

  function shader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }
  const vs = shader(gl.VERTEX_SHADER, vertex), fs = shader(gl.FRAGMENT_SHADER, fragment);
  if (!vs || !fs) return;
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'a');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const uniform = {size: gl.getUniformLocation(program, 'size'), t: gl.getUniformLocation(program, 't'), base: gl.getUniformLocation(program, 'base')};
  gl.uniform3f(uniform.base, 114 / 255, 198 / 255, 239 / 255); // #72C6EF

  // The surface is smooth, so half resolution is enough; the browser scales it up.
  const SCALE = .5;
  function resize() {
    const w = Math.max(2, Math.round(hero.clientWidth * SCALE)), h = Math.max(2, Math.round(hero.clientHeight * SCALE));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uniform.size, w, h);
    }
  }
  function draw(time) {
    resize();
    gl.uniform1f(uniform.t, time);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let raf = 0, visible = true, started = 0, offset = 0, last = 0;
  function frame(now) {
    raf = 0;
    if (!visible || document.hidden || reduce.matches) return;
    raf = requestAnimationFrame(frame);
    // 30 frames a second is plenty for a slow wave and halves the work.
    if (now - last < 33) return;
    last = now;
    draw(offset + (now - started) / 1000);
  }
  function run() {
    if (raf) return;
    started = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function update() {
    if (reduce.matches) {
      // A still frame keeps the fabric look without any motion.
      cancelAnimationFrame(raf);
      raf = 0;
      draw(3.2);
    } else if (visible && !document.hidden) {
      offset += (performance.now() - started) / 1000;
      run();
    }
  }

  draw(3.2);
  hero.classList.add('flag-on');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible) update();
    }).observe(hero);
  }
  if ('ResizeObserver' in window) new ResizeObserver(() => { if (reduce.matches || !raf) draw(offset + (performance.now() - started) / 1000 || 3.2); }).observe(hero);
  document.addEventListener('visibilitychange', update);
  reduce.addEventListener('change', update);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); cancelAnimationFrame(raf); raf = 0; hero.classList.remove('flag-on'); });
  update();
})();
