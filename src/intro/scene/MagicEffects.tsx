import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { IntroAnim } from '../animState'
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

  useFrame((_, dt) => {
    const speed = animate ? 1 + anim.glow * 6 : 0
    if (outer.current) outer.current.rotation.z += dt * 0.05 * speed
    if (inner.current) inner.current.rotation.z -= dt * 0.08 * speed
    const o = 0.42 + anim.glow * 0.45
    if (matA.current) matA.current.opacity = o * (1 - anim.zoom)
    if (matB.current) matB.current.opacity = o * 0.6 * (1 - anim.zoom)
  })

  return (
    <group position={[0, 0.2, -1.4]}>
      <mesh ref={outer}>
        <planeGeometry args={[5.6, 5.6]} />
        <meshBasicMaterial ref={matA} map={tex} color="#c9a46a" transparent depthWrite={false} toneMapped={false} />
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

  useFrame((state) => {
    const t = animate ? state.clock.elapsedTime : 0
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

  useFrame((state) => {
    const b = anim.burst
    const pos = geometry.attributes.position as THREE.BufferAttribute
    const t = state.clock.elapsedTime
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
    if (glow.current) {
      const s = 0.2 + g * 1.0 + anim.zoom * 1.5
      glow.current.scale.set(s, s, 1)
      glow.current.material.opacity = Math.min(1, g * 1.4)
    }
    if (halo.current) {
      const s = 0.6 + g * 3.2 + Math.sin(t * 2.4) * 0.08 * g
      halo.current.scale.set(s, s, 1)
      halo.current.material.opacity = g * 0.55
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
