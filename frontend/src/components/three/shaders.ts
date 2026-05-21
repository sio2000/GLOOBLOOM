// ─────────────────────────────────────────────────────────
// Simplex 3D Noise — shared across all shaders
// ─────────────────────────────────────────────────────────
export const NOISE_GLSL = /* glsl */ `
vec3 mod289_3(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289_4(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute4(vec4 x){return mod289_4(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt4(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289_3(i);
  vec4 p=permute4(permute4(permute4(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt4(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

// ─────────────────────────────────────────────────────────
// ORGANISM — vertex shader
// Adds organic noise displacement + breathing animation.
// Keeps displacement moderate so shape stays recognisable.
// ─────────────────────────────────────────────────────────
export const ORGANISM_VERT = /* glsl */ `
${NOISE_GLSL}
uniform float uTime;
uniform float uHydration;
uniform float uGrowth;
uniform float uDecay;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vFresnel;
varying float vNoise;
varying float vNoise2;
varying float vHeight;

void main(){
  vec3 pos = position;

  // Large-scale organic shape
  float n1 = snoise(pos * 1.8 + uTime * 0.18);
  // Medium detail — veins / bumps
  float n2 = snoise(pos * 4.5 + uTime * 0.25) * 0.45;
  // Fine surface texture
  float n3 = snoise(pos * 9.0 - uTime * 0.1) * 0.18;

  vNoise  = n1;
  vNoise2 = n2 + n3;

  // Breathing — very gentle so you can still see the surface
  float breath = sin(uTime * 0.85 + pos.y * 2.2) * 0.016;

  // Displacement — kept moderate (max ~0.12 units) so shape is clear
  float dispStr = 0.035 + uGrowth * 0.0005;
  float disp = (n1 * dispStr) + (n2 * dispStr * 0.5) + breath;

  if(uDecay > 0.2){
    float dw = snoise(pos * 3.5 + uTime * 0.07) * uDecay * 0.003;
    pos.y -= dw;
  }

  pos += normal * disp;
  vHeight = pos.y;

  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vWorldPos = worldPos.xyz;
  vNormal = normalize(normalMatrix * normal);

  vec4 mvPos = viewMatrix * worldPos;
  // Fresnel — angle-based edge highlight
  vFresnel = pow(clamp(1.0 - abs(dot(vNormal, normalize(-mvPos.xyz))), 0.0, 1.0), 2.2);

  gl_Position = projectionMatrix * mvPos;
}
`;

// ─────────────────────────────────────────────────────────
// ORGANISM — fragment shader
// Goal: clearly visible, detailed, saturated organic surface.
// Bloom is handled externally — do NOT oversaturate here.
// ─────────────────────────────────────────────────────────
export const ORGANISM_FRAG = /* glsl */ `
uniform float uTime;
uniform float uHydration;
uniform float uGrowth;
uniform float uDecay;
uniform float uStage;
uniform vec3  uColorCore;
uniform vec3  uColorGlow;
uniform vec3  uColorAccent;

varying vec3  vWorldPos;
varying vec3  vNormal;
varying float vFresnel;
varying float vNoise;
varying float vNoise2;
varying float vHeight;

void main(){
  // ── Base colour blended from noise ──────────────────────
  // n mapped 0→1
  float n01 = vNoise * 0.5 + 0.5;
  vec3 base = mix(uColorCore, uColorGlow, n01);

  // Height tint — slightly different colour toward top
  float hFactor = clamp(vHeight * 0.35 + 0.4, 0.0, 1.0);
  base = mix(base, uColorAccent * 0.65, hFactor * 0.25);

  // ── Vein / surface pattern ──────────────────────────────
  // Fine noise creates visible vein-like streaks
  float veinMask = smoothstep(0.12, 0.38, abs(vNoise2));
  vec3 veinCol   = mix(uColorGlow * 1.1, uColorAccent * 0.6, n01);
  base = mix(base, veinCol, veinMask * 0.35);

  // ── Translucent inner glow ──────────────────────────────
  // Only on the lit side — not a full-object bloom
  float innerGlow = max(0.0, dot(vNormal, vec3(0.0, 1.0, 0.0))) * 0.18;
  base += uColorGlow * innerGlow * (uHydration / 100.0);

  // ── Soft Fresnel rim ───────────────────────────────────
  // Adds a glow edge WITHOUT washing out the body
  vec3 rimCol = mix(uColorGlow, uColorAccent, 0.55);
  base = mix(base, rimCol, vFresnel * 0.28);

  // ── Gentle pulse on accent highlights only ──────────────
  float pulse = sin(uTime * 1.6) * 0.5 + 0.5;
  base += uColorAccent * vFresnel * pulse * 0.08 * (uHydration / 100.0);

  // ── Plant-green base — fades out at higher stages ──────
  // Keeps the organism body clearly green at stages 1–35.
  // Fades to full stage-color by stage 42.
  vec3 plantGreen = vec3(0.06, 0.34, 0.10);
  float greenBias = max(0.0, 1.0 - uStage * 0.024);
  base = mix(base, mix(base, plantGreen, 0.65), greenBias);

  // ── Decay tint ─────────────────────────────────────────
  if(uDecay > 0.1){
    vec3 dryCol = vec3(0.20, 0.26, 0.10);
    base = mix(base, dryCol, clamp(uDecay * 0.008, 0.0, 0.50));
    float mold = step(0.6, n01) * step(0.5, uDecay * 0.012);
    base = mix(base, vec3(0.10, 0.38, 0.06), mold * 0.45);
  }

  // ── Stage shimmer (stage 40+) ───────────────────────────
  if(uStage >= 40.0){
    float t2 = (uStage - 40.0) / 60.0; // 0→1 from stage 40→100
    float shimmer = sin(vWorldPos.x * 4.0 + uTime * 0.8) * 0.5 + 0.5;
    shimmer *= sin(vWorldPos.z * 3.0 - uTime * 0.5) * 0.5 + 0.5;
    base += uColorAccent * shimmer * 0.12 * t2;
  }

  // ── CRITICAL: clamp below bloom luminance threshold ─────
  // Organism body must NOT bloom — bloom is reserved for tips only.
  // Scene bloom threshold = 0.92; we clamp at 0.72 for a wide safety margin.
  base = clamp(base, 0.0, 0.72);

  float alpha = 0.90 + vFresnel * 0.10;

  gl_FragColor = vec4(base, alpha);
}
`;

// ─────────────────────────────────────────────────────────
// PETAL — vertex shader (unchanged, still uses snoise)
// ─────────────────────────────────────────────────────────
export const PETAL_VERT = /* glsl */ `
${NOISE_GLSL}
uniform float uTime;
attribute float aPhase;
attribute float aRadius;
attribute float aHeight;

varying float vFresnel;
varying float vNoise;

void main(){
  float angle = aPhase + uTime * 0.18;
  float r = aRadius * (1.0 + sin(uTime * 0.7 + aPhase) * 0.06);
  vec3 pos = position;
  pos.x += r * cos(angle);
  pos.z += r * sin(angle);
  pos.y += aHeight + sin(uTime * 1.1 + aPhase * 2.3) * 0.08;
  float n = snoise(pos * 2.0 + uTime * 0.3) * 0.1;
  pos += normal * n;
  vNoise = n * 10.0 + 0.5;
  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  vFresnel = pow(clamp(1.0 - abs(dot(normalize(normalMatrix * normal), normalize(-mvPos.xyz))), 0.0, 1.0), 2.0);
  gl_Position = projectionMatrix * mvPos;
}
`;

// ─────────────────────────────────────────────────────────
// PETAL — fragment shader
// Keeps petal clearly coloured, not washed out.
// ─────────────────────────────────────────────────────────
export const PETAL_FRAG = /* glsl */ `
uniform float uTime;
uniform vec3  uColor;
uniform float uHydration;

varying float vFresnel;
varying float vNoise;

void main(){
  vec3 col = uColor;

  // Fresnel rim adds depth without blowing out
  col = mix(col, col * 1.4 + vec3(0.1, 0.12, 0.18), vFresnel * 0.45);

  // Vein pattern
  float vein = smoothstep(0.42, 0.58, vNoise);
  col = mix(col, col * 0.55 + vec3(0.0, 0.2, 0.12), vein * 0.35);

  // Very subtle pulse
  float pulse = (sin(uTime * 2.0) * 0.5 + 0.5) * (uHydration / 100.0) * 0.1;
  col += col * pulse;

  // Clamp — never pure white
  col = clamp(col, 0.0, 0.90);

  float alpha = 0.78 + vFresnel * 0.22;
  gl_FragColor = vec4(col, alpha);
}
`;

// ─────────────────────────────────────────────────────────
// SPORE PARTICLE — vertex shader
// ─────────────────────────────────────────────────────────
export const SPORE_VERT = /* glsl */ `
${NOISE_GLSL}
uniform float uTime;
attribute vec3  aVelocity;
attribute float aPhase;
attribute float aSize;

varying float vAlpha;

void main(){
  vec3 pos = position;
  float t = mod(uTime * 0.35 + aPhase, 1.0);
  pos += aVelocity * t * 3.0;
  pos.y += t * 2.2 + sin(uTime * 1.1 + aPhase * 6.28) * 0.25;
  float n = snoise(pos * 1.2 + uTime * 0.18) * 0.28;
  pos.xz += vec2(n, n * 0.65);

  vAlpha = smoothstep(0.0, 0.12, t) * smoothstep(1.0, 0.65, t);

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = aSize * (1.0 - t * 0.45) * (380.0 / -mvPos.z);
  gl_Position  = projectionMatrix * mvPos;
}
`;

// ─────────────────────────────────────────────────────────
// SPORE PARTICLE — fragment shader
// ─────────────────────────────────────────────────────────
export const SPORE_FRAG = /* glsl */ `
uniform vec3  uColor;
varying float vAlpha;

void main(){
  vec2  uv     = gl_PointCoord - 0.5;
  float d      = length(uv);
  float circle = smoothstep(0.5, 0.05, d);
  float glow   = exp(-d * 5.5) * 0.5;
  vec3  col    = uColor * (circle + glow);
  gl_FragColor = vec4(col, vAlpha * (circle + glow * 0.6));
}
`;
