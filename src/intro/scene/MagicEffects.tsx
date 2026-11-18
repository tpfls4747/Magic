import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { introClock, type IntroAnim } from '../animState'
import { INTRO_PALETTE } from './palette'
import { getGlowTexture, getMagicCircleTexture, getStarTexture } from './textures'

/** 결정적 의사 난수 — 렌더마다 같은 배치 */
function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 자물쇠 뒤에서 천천히 도는 샴페인 골드 마법진 */
export function MagicCircle({ anim, animate }: { anim: IntroAnim; animate: boolean }) {
  const outer = useRef<THREE.Mesh>(null)
  const inner = useRef<THREE.Mesh>(null)
  const matA = useRef<THREE.MeshBasicMaterial>(null)
  const matB = useRef<THREE.MeshBasicMaterial>(null)
  const tex = getMagicCircleTexture()

  useFrame(() => {
    const dt = introClock.delta
    const speed = animate ? 1 + anim.glow * 6 : 0
    if (outer.current) outer.current.rotation.z += dt * 0.05 * speed
    if (inner.current) inner.current.rotation.z -= dt * 0.08 * speed
    // 대기 화면에서는 자물쇠보다 눈에 띄지 않도록 옅게, 해제 순간에만 또렷해짐
    const o = 0.2 + anim.glow * 0.5
    if (matA.current) matA.current.opacity = o * (1 - anim.zoom)
    if (matB.current) matB.current.opacity = o * 0.45 * (1 - anim.zoom)
  })

  return (
    <group position={[0, 0.2, -1.4]}>
      <mesh ref={outer}>
        <planeGeometry args={[5.6, 5.6]} />
        <meshBasicMaterial ref={matA} map={tex} color="#c8a56e" transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={inner} scale={0.56} position={[0, 0, 0.01]}>
        <planeGeometry args={[5.6, 5.6]} />
        <meshBasicMaterial ref={matB} map={tex} color={INTRO_PALETTE.lavenderDeep} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** 공중에 떠 있는 작은 반짝임 — 금빛과 라벤더빛 */
export function FloatingGlints({ count = 70, animate }: { count?: number; animate: boolean }) {
  const points = useRef<THREE.Points>(null)
  const { geometry, material, seeds } = useMemo(() => {
    const rand = seeded(7)
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const seeds = new Float32Array(count * 4)
    const gold = new THREE.Color('#c99a4e')
    const lav = new THREE.Color('#9a86cf')
    for (let i = 0; i < count; i++) {
      seeds[i * 4] = (rand() - 0.5) * 9
      seeds[i * 4 + 1] = (rand() - 0.5) * 6
      seeds[i * 4 + 2] = -2 + rand() * 3.5
      seeds[i * 4 + 3] = rand() * Math.PI * 2
      const c = rand() < 0.6 ? gold : lav
      col.set([c.r, c.g, c.b], i * 3)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(col, 3))
    const material = new THREE.PointsMaterial({
      size: 0.11,
      map: getStarTexture(),
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      opacity: 0.9,
      sizeAttenuation: true,
    })
    return { geometry, material, seeds }
  }, [count])

  useLayoutEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame(() => {
    const t = animate ? introClock.time : 0
    const pos = geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < count; i++) {
      const ph = seeds[i * 4 + 3]
      pos.setXYZ(
        i,
        seeds[i * 4] + Math.sin(t * 0.2 + ph) * 0.25,
        seeds[i * 4 + 1] + ((t * 0.08 + ph) % 1.5) - 0.75 + Math.sin(t * 0.5 + ph) * 0.1,
        seeds[i * 4 + 2],
      )
    }
    pos.needsUpdate = true
    material.opacity = 0.55 + Math.sin(t * 2) * 0.1
  })

  return <points ref={points} geometry={geometry} material={material} />
}

/**
 * 열쇠 구멍에서 터져 나오는 빛 입자 + 구멍 위의 글로우.
 * 자물쇠와 함께 움직이도록 lockRig 안에 둡니다.
 */
export function KeyholeLight({ anim, origin }: { anim: IntroAnim; origin: THREE.Vector3 }) {
  const COUNT = 180
  const glow = useRef<THREE.Sprite>(null)
  const halo = useRef<THREE.Sprite>(null)

  const { geometry, material, dirs } = useMemo(() => {
    const rand = seeded(42)
    const dirs = new Float32Array(COUNT * 4)
    const v = new THREE.Vector3()
    for (let i = 0; i < COUNT; i++) {
      // +Z 쪽으로 치우친 반구 방향
      v.set(rand() * 2 - 1, rand() * 2 - 1, rand() * 1.4 - 0.2).normalize()
      dirs.set([v.x, v.y, v.z, 0.6 + rand() * 1.8], i * 4)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3))
    const colors = new Float32Array(COUNT * 3)
    const palette = ['#fff6dc', '#f0d49a', '#d9c8ff', '#ffffff'].map((c) => new THREE.Color(c))
    for (let i = 0; i < COUNT; i++) {
      const c = palette[i % palette.length]
      colors.set([c.r, c.g, c.b], i * 3)
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const material = new THREE.PointsMaterial({
      size: 0.14,
      map: getStarTexture(),
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      opacity: 0,
    })
    return { geometry, material, dirs }
  }, [])

  useLayoutEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame(() => {
    const b = anim.burst
    const pos = geometry.attributes.position as THREE.BufferAttribute
    const t = introClock.time
    for (let i = 0; i < COUNT; i++) {
      const sp = dirs[i * 4 + 3]
      const r = b * sp * 2.2
      pos.setXYZ(
        i,
        origin.x + dirs[i * 4] * r + Math.sin(t * 3 + i) * 0.02 * b,
        origin.y + dirs[i * 4 + 1] * r - b * b * 0.3,
        origin.z + 0.05 + dirs[i * 4 + 2] * r,
      )
    }
    pos.needsUpdate = true
    material.opacity = b > 0 ? Math.min(1, b * 6) * (1 - b) : 0
    material.size = 0.1 + (1 - b) * 0.08

    const g = anim.glow
    // 확대 중에는 크기를 줄여 빛이 열쇠 구멍 주변에만 머물게 함 (화면을 미리 하얗게 덮지 않도록)
    const z = anim.zoom
    if (glow.current) {
      const s = (0.2 + g * 0.95) * (1 - 0.72 * z)
      glow.current.scale.set(s, s, 1)
      glow.current.material.opacity = Math.min(1, g * 1.4) * (1 - anim.magicBurst)
    }
    if (halo.current) {
      const s = (0.6 + g * 3.0 + Math.sin(t * 2.4) * 0.08 * g) * (1 - 0.8 * z)
      halo.current.scale.set(s, s, 1)
      halo.current.material.opacity = g * 0.5 * (1 - z)
    }
  })

  const glowTex = getGlowTexture()
  return (
    <group>
      <points geometry={geometry} material={material} />
      <sprite ref={halo} position={[origin.x, origin.y, origin.z + 0.08]}>
        <spriteMaterial map={glowTex} color="#e3d4ff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
      <sprite ref={glow} position={[origin.x, origin.y, origin.z + 0.12]}>
        <spriteMaterial map={glowTex} color={INTRO_PALETTE.glow} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
    </group>
  )
}

/* ────────────────────────────────────────────────────────────
 * 확대 중 속도감 — 자물쇠 주변에 떠 있다가 함께 다가오는 금빛 티끌.
 * 자물쇠와 같은 그룹(lockRig) 안에 있어 카메라를 스쳐 지나가며 원근감을 강조합니다.
 * ──────────────────────────────────────────────────────────── */
export function ZoomMotes({ anim, origin, count = 90 }: { anim: IntroAnim; origin: THREE.Vector3; count?: number }) {
  const { geometry, material } = useMemo(() => {
    const rand = seeded(99)
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const palette = ['#f3d9a4', '#fff3dc', '#cdb8f2'].map((c) => new THREE.Color(c))
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2
      const r = 0.9 + rand() * 2.6
      pos.set([origin.x + Math.cos(a) * r * 1.25, origin.y + Math.sin(a) * r, origin.z - 1.4 + rand() * 2.0], i * 3)
      const c = palette[i % 3]
      col.set([c.r, c.g, c.b], i * 3)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(col, 3))
    const material = new THREE.PointsMaterial({
      size: 0.05,
      map: getStarTexture(),
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      opacity: 0,
    })
    return { geometry, material }
  }, [count, origin])

  useLayoutEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  const points = useRef<THREE.Points>(null)
  useFrame(() => {
    const z = anim.zoom
    material.opacity = Math.min(1, z * 4) * (1 - anim.magicBurst)
    if (points.current) points.current.visible = material.opacity > 0.001
  })
  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
}

/* ────────────────────────────────────────────────────────────
 * MAGICAL BURST — 자물쇠가 화면을 가득 채운 직후의 마법 폭발.
 *
 * 카메라에 붙은 그룹(카메라 앞 BURST_DEPTH) 안에서 GPU 셰이더로 움직입니다.
 * 모든 요소는 depthTest=false 로 자물쇠 위에 그려지고, 진행도 anim.magicBurst(0→1, 선형) 하나로 구동됩니다.
 *   · 코어 섬광과 라벤더 후광      · 원형으로 퍼지는 에너지 링 3겹(두 개는 기울어져 입체적)
 *   · 금빛 스파크 / 라벤더 입자     · 별 모양 스파클         · 짧은 빛의 궤적
 *   · 빛을 반사하며 회전하는 금박 파편
 * ──────────────────────────────────────────────────────────── */
const BURST_DEPTH = 1.4

const POINTS_VERT = /* glsl */ `
  attribute vec3 aDir;
  attribute float aSpeed;
  attribute float aSize;
  attribute float aSeed;
  attribute vec3 aColor;
  uniform float uP;
  uniform float uPx;
  uniform float uMaxPx;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vRot;
  void main() {
    float delay = aSeed * 0.14;
    float p = clamp((uP - delay) / (1.0 - delay), 0.0, 1.0);
    float travel = 1.0 - pow(1.0 - p, 3.2);
    vec3 pos = aDir * (0.05 + aSpeed * travel);       // 중심에 겹쳐 하얗게 뭉치지 않도록 작은 반경에서 출발
    pos.y += p * p * 0.12 * aSpeed;               // 위로 살짝 떠오르는 잔광
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float twinkle = 0.7 + 0.3 * sin(aSeed * 61.0 + uP * 46.0);
    vAlpha = smoothstep(0.0, 0.04, p) * (1.0 - smoothstep(0.45, 1.0, p)) * twinkle * step(0.0001, uP);
    gl_PointSize = min(aSize * uPx / max(-mv.z, 0.05) * (1.0 - 0.45 * p), uMaxPx);
    vColor = aColor;
    vRot = aSeed * 6.2831 + uP * 2.0;
  }
`
const POINTS_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vRot;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float s = sin(vRot), co = cos(vRot);
    vec2 uv = vec2(co * c.x - s * c.y, s * c.x + co * c.y) + 0.5;
    vec4 t = texture2D(uMap, uv);
    gl_FragColor = vec4(vColor * t.rgb, t.a * vAlpha);
    #include <colorspace_fragment>
  }
`

const STREAK_VERT = /* glsl */ `
  attribute vec3 aDir;
  attribute float aSpeed;
  attribute float aLen;
  attribute float aSeed;
  uniform float uP;
  varying vec2 vUv;
  varying float vAlpha;
  void main() {
    float delay = aSeed * 0.08;
    float p = clamp((uP - delay) / 0.72, 0.0, 1.0);
    float head = 1.0 - pow(1.0 - p, 2.6);
    float tail = max(head - aLen * (1.0 - p * 0.7), 0.0);
    vec3 dir = normalize(aDir);
    vec3 h = dir * aSpeed * head;
    vec3 tl = dir * aSpeed * tail;
    vec3 side = normalize(cross(dir, vec3(0.0, 0.0, 1.0)) + vec3(1e-5));
    vec3 pos = mix(tl, h, uv.x) + side * (uv.y - 0.5) * (0.006 + 0.006 * aSeed) * (1.0 - p * 0.5);
    vUv = uv;
    vAlpha = smoothstep(0.0, 0.05, p) * (1.0 - smoothstep(0.45, 1.0, p)) * step(0.0001, uP);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`
const STREAK_FRAG = /* glsl */ `
  uniform vec3 uColor;
  varying vec2 vUv;
  varying float vAlpha;
  void main() {
    float across = 1.0 - pow(abs(vUv.y - 0.5) * 2.0, 2.0);
    float along = pow(vUv.x, 1.8);
    gl_FragColor = vec4(uColor, along * across * vAlpha);
    #include <colorspace_fragment>
  }
`

const RING_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const RING_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAlpha;
  uniform float uWidth;
  uniform float uTicks;
  varying vec2 vUv;
  void main() {
    vec2 q = vUv * 2.0 - 1.0;
    float r = length(q);
    float d = abs(r - 0.9);
    float ring = exp(-(d * d) / (uWidth * uWidth));
    float glow = exp(-d / (uWidth * 7.0)) * 0.3;
    float ang = atan(q.y, q.x);
    float ticks = uTicks > 0.0 ? 0.55 + 0.45 * step(0.55, fract(ang * uTicks / 6.28318)) : 1.0;
    float a = (ring * ticks + glow) * uAlpha * smoothstep(1.0, 0.96, r);
    gl_FragColor = vec4(uColor, a);
    #include <colorspace_fragment>
  }
`

const easeOutCubic = (x: number) => 1 - (1 - x) ** 3
const easeOutQuart = (x: number) => 1 - (1 - x) ** 4
const easeOutExpo = (x: number) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x))
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const window01 = (p: number, a: number, b: number) => clamp01((p - a) / (b - a))

function makePointsMaterial(map: THREE.Texture, blending: THREE.Blending) {
  return new THREE.ShaderMaterial({
    vertexShader: POINTS_VERT,
    fragmentShader: POINTS_FRAG,
    uniforms: { uP: { value: 0 }, uPx: { value: 600 }, uMaxPx: { value: 120 }, uMap: { value: map } },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending,
  })
}

interface PointSpec {
  count: number
  seed: number
  colors: string[]
  speed: [number, number]
  size: [number, number]
  /** 카메라 쪽(+Z)으로 튀어나오는 정도 */
  forward: number
}

function makePointsGeometry(spec: PointSpec) {
  const rand = seeded(spec.seed)
  const n = spec.count
  const dir = new Float32Array(n * 3)
  const speed = new Float32Array(n)
  const size = new Float32Array(n)
  const seed = new Float32Array(n)
  const color = new Float32Array(n * 3)
  const palette = spec.colors.map((c) => new THREE.Color(c))
  const v = new THREE.Vector3()
  for (let i = 0; i < n; i++) {
    // 화면 평면 방향으로 고르게 퍼지되, 일부는 카메라 쪽으로 날아와 스쳐 지나감
    const a = rand() * Math.PI * 2
    v.set(Math.cos(a), Math.sin(a) * 0.92, (rand() - 0.3) * spec.forward).normalize()
    dir.set([v.x, v.y, v.z], i * 3)
    speed[i] = spec.speed[0] + rand() ** 1.6 * (spec.speed[1] - spec.speed[0])
    size[i] = spec.size[0] + rand() * (spec.size[1] - spec.size[0])
    seed[i] = rand()
    const c = palette[Math.floor(rand() * palette.length)]
    color.set([c.r, c.g, c.b], i * 3)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3))
  g.setAttribute('aDir', new THREE.BufferAttribute(dir, 3))
  g.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1))
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
  g.setAttribute('aColor', new THREE.BufferAttribute(color, 3))
  return g
}

export function MagicBurst({ anim, lowQuality, origin }: { anim: IntroAnim; lowQuality: boolean; origin: THREE.Vector3 }) {
  const group = useRef<THREE.Group>(null)
  const center = useRef<THREE.Group>(null)
  const core = useRef<THREE.Mesh>(null)
  const halo = useRef<THREE.Mesh>(null)
  const rings = useRef<(THREE.Mesh | null)[]>([])
  const flakes = useRef<THREE.InstancedMesh>(null)
  const q = lowQuality ? 0.55 : 1

  const res = useMemo(() => {
    const star = getStarTexture()
    const glow = getGlowTexture()
    const goldGeo = makePointsGeometry({
      count: Math.round(240 * q),
      seed: 11,
      colors: ['#fff6e2', '#f6dca6', '#e8c47e', '#ffffff'],
      speed: [0.35, 2.3],
      size: [0.018, 0.05],
      forward: 1.1,
    })
    const lavGeo = makePointsGeometry({
      count: Math.round(200 * q),
      seed: 23,
      colors: ['#b9a0ee', '#a58ae0', '#d6c6fb'],
      speed: [0.25, 1.6],
      size: [0.04, 0.11],
      forward: 0.6,
    })
    const starGeo = makePointsGeometry({
      count: Math.round(70 * q),
      seed: 37,
      colors: ['#ffffff', '#fff1d2', '#e9dcff'],
      speed: [0.3, 1.3],
      size: [0.06, 0.15],
      forward: 0.8,
    })
    const goldMat = makePointsMaterial(star, THREE.AdditiveBlending)
    const lavMat = makePointsMaterial(glow, THREE.NormalBlending)
    const starMat = makePointsMaterial(star, THREE.AdditiveBlending)

    // 빛의 궤적 (인스턴스 사각형)
    const STREAKS = Math.round(40 * q)
    const rand = seeded(51)
    const streakGeo = new THREE.InstancedBufferGeometry()
    const plane = new THREE.PlaneGeometry(1, 1)
    streakGeo.index = plane.index
    streakGeo.setAttribute('position', plane.getAttribute('position'))
    streakGeo.setAttribute('uv', plane.getAttribute('uv'))
    const sDir = new Float32Array(STREAKS * 3)
    const sSpeed = new Float32Array(STREAKS)
    const sLen = new Float32Array(STREAKS)
    const sSeed = new Float32Array(STREAKS)
    for (let i = 0; i < STREAKS; i++) {
      const a = (i / STREAKS) * Math.PI * 2 + rand() * 0.2
      sDir.set([Math.cos(a), Math.sin(a) * 0.9, (rand() - 0.4) * 0.5], i * 3)
      sSpeed[i] = 0.8 + rand() * 1.4
      sLen[i] = 0.1 + rand() * 0.14
      sSeed[i] = rand()
    }
    streakGeo.setAttribute('aDir', new THREE.InstancedBufferAttribute(sDir, 3))
    streakGeo.setAttribute('aSpeed', new THREE.InstancedBufferAttribute(sSpeed, 1))
    streakGeo.setAttribute('aLen', new THREE.InstancedBufferAttribute(sLen, 1))
    streakGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(sSeed, 1))
    streakGeo.instanceCount = STREAKS
    const streakMat = new THREE.ShaderMaterial({
      vertexShader: STREAK_VERT,
      fragmentShader: STREAK_FRAG,
      uniforms: { uP: { value: 0 }, uColor: { value: new THREE.Color('#f5d395') } },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    })

    // 에너지 링 3겹
    const ringGeo = new THREE.PlaneGeometry(2, 2)
    const ringSpecs = [
      { color: '#ffe9bd', width: 0.012, ticks: 0, delay: 0, max: 2.3, tilt: [0, 0] },
      { color: '#cbb5f3', width: 0.02, ticks: 48, delay: 0.05, max: 1.9, tilt: [0.55, 0.15] },
      { color: '#f3d6a0', width: 0.008, ticks: 0, delay: 0.11, max: 2.7, tilt: [-0.35, -0.4] },
    ]
    const ringMats = ringSpecs.map(
      (r) =>
        new THREE.ShaderMaterial({
          vertexShader: RING_VERT,
          fragmentShader: RING_FRAG,
          uniforms: {
            uColor: { value: new THREE.Color(r.color) },
            uAlpha: { value: 0 },
            uWidth: { value: r.width },
            uTicks: { value: r.ticks },
          },
          transparent: true,
          depthWrite: false,
          depthTest: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        }),
    )

    // 코어 섬광 · 후광
    const glowGeo = new THREE.PlaneGeometry(1, 1)
    const coreMat = new THREE.MeshBasicMaterial({
      map: glow,
      color: new THREE.Color(1.05, 0.9, 0.66),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    })
    const haloMat = new THREE.MeshBasicMaterial({
      map: glow,
      color: new THREE.Color('#d9c6ff'),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
    })

    // 금박 파편
    const FLAKES = Math.round(46 * q)
    const flakeGeo = new THREE.OctahedronGeometry(0.022, 0)
    flakeGeo.scale(1, 1.4, 0.28)
    const flakeMat = new THREE.MeshStandardMaterial({
      color: '#f0d29a',
      metalness: 1,
      roughness: 0.22,
      emissive: '#8a6a34',
      emissiveIntensity: 0.6,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      envMapIntensity: 1.6,
    })
    const fr = seeded(73)
    const flakeData = Array.from({ length: FLAKES }, () => {
      const a = fr() * Math.PI * 2
      return {
        dir: new THREE.Vector3(Math.cos(a), Math.sin(a) * 0.9, (fr() - 0.2) * 0.9).normalize(),
        speed: 0.4 + fr() * 1.3,
        spin: new THREE.Vector3(fr() * 9, fr() * 9, fr() * 9),
        seed: fr(),
      }
    })

    return {
      goldGeo,
      lavGeo,
      starGeo,
      goldMat,
      lavMat,
      starMat,
      streakGeo,
      streakMat,
      plane,
      ringGeo,
      ringSpecs,
      ringMats,
      glowGeo,
      coreMat,
      haloMat,
      flakeGeo,
      flakeMat,
      flakeData,
    }
  }, [q])

  useLayoutEffect(
    () => () => {
      const r = res
      ;[r.goldGeo, r.lavGeo, r.starGeo, r.streakGeo, r.plane, r.ringGeo, r.glowGeo, r.flakeGeo].forEach((g) => g.dispose())
      ;[r.goldMat, r.lavMat, r.starMat, r.streakMat, r.coreMat, r.haloMat, r.flakeMat, ...r.ringMats].forEach((m) => m.dispose())
    },
    [res],
  )

  const _m = useMemo(() => new THREE.Matrix4(), [])
  const _q = useMemo(() => new THREE.Quaternion(), [])
  const _e = useMemo(() => new THREE.Euler(), [])
  const _v = useMemo(() => new THREE.Vector3(), [])
  const _s = useMemo(() => new THREE.Vector3(), [])
  const _buf = useMemo(() => new THREE.Vector2(), [])

  useFrame((state) => {
    const g = group.current
    if (!g) return
    const p = anim.magicBurst
    g.visible = p > 0 && p < 1
    if (!g.visible) return

    // 카메라에 붙이고, 발원점을 화면 속 열쇠 구멍 방향(깊이 BURST_DEPTH)에 맞춤
    const cam = state.camera as THREE.PerspectiveCamera
    g.position.copy(cam.position)
    g.quaternion.copy(cam.quaternion)
    if (center.current) {
      cam.updateMatrixWorld()
      _v.copy(origin).applyMatrix4(cam.matrixWorldInverse)
      if (_v.z < -0.01) center.current.position.copy(_v.multiplyScalar(BURST_DEPTH / -_v.z))
    }

    // 점 크기: 화면 높이(px) 기준 원근 스케일
    state.gl.getDrawingBufferSize(_buf)
    const px = _buf.y / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)))
    for (const m of [res.goldMat, res.lavMat, res.starMat]) {
      m.uniforms.uP.value = p
      m.uniforms.uPx.value = px
      m.uniforms.uMaxPx.value = _buf.y * 0.12
    }
    res.streakMat.uniforms.uP.value = p

    // 코어 섬광: 순간적으로 확 커졌다가 빠르게 잦아듦 (펑!)
    if (core.current) {
      const s = 0.2 + 1.8 * easeOutExpo(window01(p, 0, 0.3))
      core.current.scale.set(s, s, 1)
      res.coreMat.opacity = 0.9 * window01(p, 0, 0.03) * (1 - window01(p, 0.08, 0.42))
    }
    // 라벤더 후광: 조금 늦게, 더 넓게
    if (halo.current) {
      const s = 0.6 + 4.6 * easeOutCubic(window01(p, 0.02, 0.6))
      halo.current.scale.set(s, s, 1)
      res.haloMat.opacity = 0.75 * window01(p, 0.02, 0.1) * (1 - window01(p, 0.3, 0.85))
    }
    // 에너지 링
    rings.current.forEach((r, i) => {
      if (!r) return
      const spec = res.ringSpecs[i]
      const lp = window01(p, spec.delay, spec.delay + 0.6)
      const s = 0.05 + spec.max * easeOutQuart(lp)
      r.scale.set(s, s, 1)
      res.ringMats[i].uniforms.uAlpha.value = window01(lp, 0, 0.04) * (1 - lp) ** 1.4 * 1.6
    })
    // 금박 파편
    const fm = flakes.current
    if (fm) {
      const t = introClock.time
      res.flakeData.forEach((f, i) => {
        const lp = window01(p, f.seed * 0.1, 1)
        const travel = 1 - (1 - lp) ** 3
        _v.copy(f.dir).multiplyScalar(f.speed * travel)
        _v.y -= lp * lp * 0.18
        _e.set(f.spin.x * (t + lp * 2), f.spin.y * (t + lp * 2), f.spin.z * lp)
        _q.setFromEuler(_e)
        const sc = 1 - lp * 0.4
        _s.set(sc, sc, sc)
        fm.setMatrixAt(i, _m.compose(_v, _q, _s))
      })
      fm.instanceMatrix.needsUpdate = true
      res.flakeMat.opacity = window01(p, 0.01, 0.06) * (1 - window01(p, 0.55, 0.95))
    }
  })

  return (
    <group ref={group} visible={false}>
      <group ref={center} position={[0, 0, -BURST_DEPTH]}>
        <mesh ref={halo} geometry={res.glowGeo} material={res.haloMat} renderOrder={20} frustumCulled={false} />
        {res.ringSpecs.map((spec, i) => (
          <mesh
            key={i}
            ref={(el) => {
              rings.current[i] = el
            }}
            geometry={res.ringGeo}
            material={res.ringMats[i]}
            rotation={[spec.tilt[0], spec.tilt[1], 0]}
            renderOrder={21}
            frustumCulled={false}
          />
        ))}
        <points geometry={res.lavGeo} material={res.lavMat} renderOrder={22} frustumCulled={false} />
        <mesh geometry={res.streakGeo} material={res.streakMat} renderOrder={23} frustumCulled={false} />
        <instancedMesh
          ref={flakes}
          args={[res.flakeGeo, res.flakeMat, res.flakeData.length]}
          renderOrder={24}
          frustumCulled={false}
        />
        <points geometry={res.goldGeo} material={res.goldMat} renderOrder={25} frustumCulled={false} />
        <points geometry={res.starGeo} material={res.starMat} renderOrder={26} frustumCulled={false} />
        <mesh ref={core} geometry={res.glowGeo} material={res.coreMat} renderOrder={27} frustumCulled={false} />
      </group>
    </group>
  )
}
