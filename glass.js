const vertexSource = `
attribute vec2 position;
varying vec2 uv;

void main() {
  uv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentSource = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 size;
uniform float time;
uniform float rain;
uniform float fog;
uniform float depth;
uniform float pulse;
uniform float daylight;
uniform sampler2D wipe;
varying vec2 uv;

float hash(float n) {
  return fract(sin(n) * 43758.5453);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec3 city(vec2 p, float blur) {
  float aspect = size.x / size.y;
  vec3 night = mix(vec3(0.012, 0.016, 0.032), vec3(0.03, 0.04, 0.075), p.y);
  vec3 day = mix(vec3(0.10, 0.11, 0.13), vec3(0.19, 0.21, 0.24), p.y);
  vec3 color = mix(night, day, daylight);
  color += vec3(0.06, 0.035, 0.02) * smoothstep(0.7, 0.0, p.y) * (1.0 - daylight);

  for (int i = 0; i < 44; i++) {
    float n = float(i);
    float a = hash(n * 1.31 + 0.17);
    float b = hash(n * 2.77 + 3.10);
    float c = hash(n * 4.13 + 7.90);
    float d = hash(n * 6.91 + 1.30);
    vec2 center = vec2(a * (aspect + 0.4) - 0.2, 0.05 + b * b * 0.85);

    if (d > 0.84) {
      center.x = mod(center.x + 0.2 + time * (0.015 + 0.03 * c) * sign(d - 0.92), aspect + 0.4) - 0.2;
      center.y = 0.08 + 0.1 * b;
    }

    float radius = (0.008 + 0.03 * c) * (1.0 + blur * 4.5);
    float edge = radius * mix(0.1, 0.8, blur);
    float disc = 1.0 - smoothstep(radius - edge, radius, length(p - center));
    vec3 tint = d < 0.45 ? vec3(1.0, 0.58, 0.26) : d < 0.68 ? vec3(0.76, 0.84, 1.0) : d < 0.84 ? vec3(1.0, 0.3, 0.24) : vec3(1.0, 0.88, 0.66);
    float flicker = 1.0 - 0.6 * step(0.988, hash(n * 7.7 + floor(time * 10.0)));
    float energy = (0.35 + 0.65 * b) / (1.0 + blur * 8.0);
    color += tint * disc * energy * flicker * (0.8 - daylight * 0.45) * (1.0 + pulse);
  }

  return color;
}

float headlights(vec2 p) {
  float aspect = size.x / size.y;
  float cycle = mod(time, 23.0);
  float x = cycle / 7.0 * (aspect + 1.2) - 0.6;
  float d = (p.x - x) / 0.45;
  return step(cycle, 7.0) * exp(-d * d) * smoothstep(0.75, 0.05, p.y);
}

vec3 beads(vec2 p) {
  vec2 grid = p * 26.0;
  vec2 cell = floor(grid);
  vec2 q = fract(grid) - 0.5 - (vec2(hash(cell), hash(cell + 17.3)) - 0.5) * 0.6;
  float seed = hash(cell + 41.7);
  float life = fract(time * 0.035 + seed);
  float alive = smoothstep(0.0, 0.06, life) * smoothstep(1.0, 0.75, life) * step(1.0 - rain * 0.45, hash(cell + 83.1));
  float radius = 0.08 + 0.16 * seed * seed;
  float shape = smoothstep(radius, radius * 0.5, length(q)) * alive;
  return vec3(q / radius, shape);
}

vec4 streak(vec2 p, float width, float seed) {
  float column = floor(p.x / width);
  float a = hash(column * 1.7 + seed);
  float b = hash(column * 3.3 + seed * 2.1);
  float active = step(1.0 - rain * 0.9, a);
  float progress = fract(time * (0.05 + 0.08 * b) + a * 7.0);
  float stepped = (floor(progress * 7.0) + smoothstep(0.5, 1.0, fract(progress * 7.0))) / 7.0;
  float x = (column + 0.5) * width + sin(p.y * 29.0 + b * 6.28) * width * 0.07;
  vec2 q = vec2(p.x - x, p.y - (1.15 - stepped * 1.45));
  float radius = width * (0.14 + 0.1 * b);
  float drop = smoothstep(radius, radius * 0.55, length(q * vec2(1.0, 0.75))) * active;
  float trail = smoothstep(radius * 0.5, radius * 0.1, abs(q.x)) * smoothstep(0.35, 0.0, q.y) * step(0.0, q.y) * active;
  vec2 bq = vec2(q.x, (fract(q.y * 30.0) - 0.5) / 30.0);
  float bead = smoothstep(radius * 0.3, radius * 0.1, length(bq)) * trail * step(radius, q.y);
  return vec4(q / radius * drop + bq / (radius * 0.3) * bead, max(drop, bead), trail);
}

void main() {
  vec2 p = vec2(uv.x * size.x / size.y, uv.y);
  vec3 small = beads(p);
  vec4 near = streak(p, 0.06, 1.0);
  vec4 far = streak(p + vec2(0.023, 0.0), 0.1, 7.0);
  float drops = max(small.z, max(near.z, far.z));
  float wiped = smoothstep(0.12, 0.8, texture2D(wipe, uv).r);
  float clear = max(max(drops, max(near.w, far.w) * 0.45), wiped);
  vec2 lens = small.xy * small.z + near.xy + far.xy;
  float haze = clamp(fog + depth * 0.4, 0.0, 1.0);

  vec3 color = city(p - lens * 0.08, mix(haze, 0.05, clear));
  vec3 veil = mix(vec3(0.075, 0.09, 0.125), vec3(0.28, 0.3, 0.33), daylight);
  veil += vec3(1.0, 0.85, 0.65) * headlights(p) * 0.06;
  color = mix(color, color * 0.65 + veil, (1.0 - clear) * haze * 0.8);
  color *= 1.0 - 0.5 * smoothstep(0.5, 1.0, length(lens)) * drops;
  float glint = smoothstep(0.35, 0.0, length(lens - vec2(-0.3, 0.35))) * 0.18 + smoothstep(0.55, 1.0, -lens.y) * 0.03;
  color += vec3(0.85, 0.9, 1.0) * glint * drops;

  vec2 v = uv - 0.5;
  color *= 1.0 - dot(v, v) * 1.1;
  color *= 1.0 - depth * 0.55;
  color += (hash(gl_FragCoord.xy * 0.37 + fract(time * 7.0) * 113.0) - 0.5) * 0.04;
  gl_FragColor = vec4(color, 1.0);
}
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

export function createGlass(canvas, { still = false } = {}) {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, powerPreference: "low-power" });
  if (!gl) return null;

  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) return null;

  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, "position");
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const uniforms = {};
  for (const name of ["size", "time", "rain", "fog", "depth", "pulse", "daylight"]) {
    uniforms[name] = gl.getUniformLocation(program, name);
  }

  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  const mask = document.createElement("canvas");
  const pen = mask.getContext("2d");
  let width = 0;
  let height = 0;
  let writing = null;
  let fadeClock = performance.now();
  let fadeDebt = 0;
  let dirty = true;
  const drips = [];

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === width && h === height) return;

    const scale = Math.min(devicePixelRatio, 2) * 0.5;
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    gl.viewport(0, 0, canvas.width, canvas.height);

    const previous = document.createElement("canvas");
    previous.width = mask.width;
    previous.height = mask.height;
    previous.getContext("2d").drawImage(mask, 0, 0);

    mask.width = Math.ceil(w / 2);
    mask.height = Math.ceil(h / 2);
    pen.fillStyle = "#000";
    pen.fillRect(0, 0, mask.width, mask.height);
    pen.drawImage(previous, 0, 0, mask.width, mask.height);
    pen.setTransform(0.5, 0, 0, 0.5, 0, 0);

    width = w;
    height = h;
    dirty = true;
  }

  function wipe(x0, y0, x1, y1, thickness = 34) {
    pen.globalCompositeOperation = "source-over";
    pen.strokeStyle = "#fff";
    pen.lineWidth = thickness;
    pen.lineCap = "round";
    pen.beginPath();
    pen.moveTo(x0, y0);
    pen.lineTo(x1, y1);
    pen.stroke();
    dirty = true;
  }

  function drip(x, y) {
    if (still) return;
    drips.push({ x, y, length: 0, reach: 30 + Math.random() * 110, size: 3 + Math.random() * 3 });
  }

  function trickle() {
    pen.globalCompositeOperation = "source-over";
    pen.strokeStyle = "#fff";
    pen.fillStyle = "#fff";
    pen.lineCap = "round";
    for (const water of drips) {
      const from = water.y + water.length;
      water.length += (water.reach - water.length) * 0.015;
      const to = water.y + water.length;
      water.x += (Math.random() - 0.5) * 0.6;
      pen.lineWidth = water.size;
      pen.beginPath();
      pen.moveTo(water.x, from);
      pen.lineTo(water.x, to);
      pen.stroke();
      pen.beginPath();
      pen.arc(water.x, to, water.size * 0.9, 0, Math.PI * 2);
      pen.fill();
    }
    for (let i = drips.length - 1; i >= 0; i--) {
      if (drips[i].reach - drips[i].length < 1) drips.splice(i, 1);
    }
    dirty = true;
  }

  function write(words) {
    writing = {
      start: performance.now(),
      words: words.map(({ text, left, top, height: line, font }) => {
        pen.font = font;
        const metrics = pen.measureText(text);
        const ascent = metrics.fontBoundingBoxAscent ?? metrics.actualBoundingBoxAscent;
        const descent = metrics.fontBoundingBoxDescent ?? metrics.actualBoundingBoxDescent;
        return { text, font, x: left, y: top + (line + ascent - descent) / 2, ascent, descent, width: metrics.width };
      }),
    };
    if (still) trace(Infinity);
  }

  function trace(elapsed) {
    const total = writing.words.reduce((sum, word) => sum + word.width, 0);
    let reach = Math.min(elapsed / 2.8, 1) * total;

    pen.globalCompositeOperation = "source-over";
    pen.fillStyle = "#fff";
    for (const word of writing.words) {
      if (reach <= 0) break;
      pen.save();
      pen.beginPath();
      pen.rect(word.x - 40, word.y - word.ascent - 40, Math.min(reach, word.width) + 40, word.ascent + word.descent + 80);
      pen.clip();
      pen.font = word.font;
      pen.fillText(word.text, word.x, word.y);
      pen.restore();
      reach -= word.width;
    }

    dirty = true;
    if (elapsed < 2.8) return;
    for (const word of writing.words) {
      for (let i = 0; i < 3; i++) drip(word.x + Math.random() * word.width, word.y - word.ascent * 0.1);
    }
    writing = null;
  }

  function render(seconds, scene) {
    resize();
    const now = performance.now();
    const deep = scene.depth > 0.5;
    fadeDebt += (now - fadeClock) * (deep ? 0.3 : 1 / 110);
    fadeClock = now;
    if (deep) writing = null;

    if (!still && fadeDebt >= 1) {
      pen.globalCompositeOperation = "difference";
      pen.fillStyle = "#010101";
      for (let step = Math.min(Math.floor(fadeDebt), 40); step > 0; step--) {
        pen.fillRect(0, 0, width, height);
      }
      fadeDebt %= 1;
      dirty = true;
    }

    if (writing) trace((now - writing.start) / 1000);
    if (drips.length) trickle();

    if (dirty) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, mask);
      dirty = false;
    }

    gl.uniform2f(uniforms.size, canvas.width, canvas.height);
    gl.uniform1f(uniforms.time, seconds % 3600);
    gl.uniform1f(uniforms.rain, scene.rain);
    gl.uniform1f(uniforms.fog, scene.fog);
    gl.uniform1f(uniforms.depth, scene.depth);
    gl.uniform1f(uniforms.pulse, scene.pulse);
    gl.uniform1f(uniforms.daylight, scene.daylight);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  return { render, wipe, write, drip };
}
