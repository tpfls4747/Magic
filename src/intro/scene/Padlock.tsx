import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { introClock, type IntroAnim } from '../animState'
import { gemGeometry, heartCurve, heartShape, keyholePath, shacklePath } from './geometry'
import { LOCK } from './layout'
import type { IntroMaterials } from './materials'
import { getGlowTexture, getStarTexture } from './textures'

interface PadlockProps {
  anim: IntroAnim
  materials: IntroMaterials
  animate: boolean
}

/** 보석 위에서 반짝이는 별빛 위치 (자물쇠 로컬 좌표) */
const GEM_SPARKLES: [number, number, number, number][] = [
  // x, y, z, 위상
  [0.04, 0.42, LOCK.frontZ + 0.1, 0],
  [-0.56, 0.26, LOCK.frontZ + 0.08, 2.1],
  [0.63, 0.25, LOCK.frontZ + 0.08, 4.2],
]

/** 하트형 황금 자물쇠 — 몸체(베벨 압출) · U자 걸쇠 · 열쇠 구멍 장식판 · 진주와 보석 */
export function Padlock({ anim, materials, animate }: PadlockProps) {
  const root = useRef<THREE.Group>(null)
  const shackleLift = useRef<THREE.Group>(null)
  const shackleSwing = useRef<THREE.Group>(null)
  const keyholeLight = useRef<THREE.PointLight>(null)
  const seams = useRef<(THREE.Sprite | null)[]>([])
  const sparkles = useRef<(THREE.Sprite | null)[]>([])

  const geo = useMemo(() => {
    const { bodyDepth, bevelThickness, bevelSize, frontZ, keyholeY, shackle } = LOCK

    // 몸체 — 두툼한 베벨로 가장자리가 둥글게 말려 들어가며 빛을 받습니다
    const body = new THREE.ExtrudeGeometry(heartShape(1), {
      depth: bodyDepth,
      bevelEnabled: true,
      bevelThickness,
      bevelSize,
      bevelSegments: 16,
      curveSegments: 80,
    })
    body.translate(0, 0, -bodyDepth / 2)
    body.computeVertexNormals()

    // 앞면 테두리 장식 (두 줄)
    const rimOuter = new THREE.TubeGeometry(heartCurve(0.87, frontZ), 240, 0.034, 14, true)
    const rimInner = new THREE.TubeGeometry(heartCurve(0.79, frontZ), 220, 0.014, 8, true)

    // 진주 — 바깥 테두리를 따라 균등 간격 (중앙 홈 부근 제외)
    const pearlCurve = heartCurve(0.87, frontZ + 0.034)
    const pearls: THREE.Vector3[] = []
    const PEARL_COUNT = 22
    for (let i = 0; i < PEARL_COUNT; i++) {
      const p = pearlCurve.getPointAt((i + 0.5) / PEARL_COUNT)
      if (p.y > 0.42 && Math.abs(p.x) < 0.18) continue
      pearls.push(p)
    }

    // 열쇠 구멍 장식판: 타원형 판 + 열쇠 구멍 모양 구멍
    const plateShape = new THREE.Shape()
    plateShape.absellipse(0, -0.12, 0.27, 0.42, 0, Math.PI * 2, false, 0)
    plateShape.holes.push(keyholePath(new THREE.Path(), 0.12, 0.052, 0.085, 0.34))
    const plate = new THREE.ExtrudeGeometry(plateShape, {
      depth: 0.03,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.024,
      bevelSegments: 8,
      curveSegments: 72,
    })
    plate.translate(0, keyholeY, frontZ)

    const plateRingCurve = new THREE.EllipseCurve(0, -0.12, 0.34, 0.49, 0, Math.PI * 2, false, 0)
    const plateRing = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(
        plateRingCurve.getSpacedPoints(96).slice(0, -1).map((p) => new THREE.Vector3(p.x, p.y + keyholeY, frontZ)),
        true,
      ),
      160,
      0.022,
      12,
      true,
    )

    // 열쇠 구멍 안쪽 (어두운 면 — 해제 시 빛남). 장식판 두께만큼 안쪽에 있어 깊이가 생깁니다
    const keyholeFill = new THREE.ShapeGeometry(keyholePath(new THREE.Shape(), 0.122, 0.054, 0.087, 0.342), 48)
    keyholeFill.translate(0, keyholeY, frontZ + 0.003)

    // 걸쇠
    const shackleGeo = new THREE.TubeGeometry(
      shacklePath(shackle.halfSpan, shackle.top, shackle.leftBottom, shackle.rightBottom),
      200,
      shackle.radius,
      40,
      false,
    )
    // 왼쪽 다리(x=-halfSpan)가 회전축이 되도록 원점으로 옮김
    shackleGeo.translate(shackle.halfSpan, 0, 0)
    const shackleCap = new THREE.SphereGeometry(shackle.radius, 32, 16)

    // 걸쇠가 몸체로 들어가는 자리의 금속 링
    const ferrule = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.1, -0.06),
        new THREE.Vector2(0.155, -0.04),
        new THREE.Vector2(0.172, 0),
        new THREE.Vector2(0.155, 0.04),
        new THREE.Vector2(0.115, 0.06),
      ],
      48,
    )

    const gemBig = gemGeometry(0.12, 1.25)
    const gemSmall = gemGeometry(0.072, 1.2)
    const pearl = new THREE.SphereGeometry(0.034, 20, 12)
    const bezel = new THREE.TorusGeometry(0.122, 0.02, 10, 48)

    return {
      body,
      rimOuter,
      rimInner,
      pearls,
      plate,
      plateRing,
      keyholeFill,
      shackleGeo,
      shackleCap,
      ferrule,
      gemBig,
      gemSmall,
      pearl,
      bezel,
    }
  }, [])

  useLayoutEffect(
    () => () => {
      Object.values(geo).forEach((g) => {
        if (g instanceof THREE.BufferGeometry) g.dispose()
      })
    },
    [geo],
  )

  useFrame(() => {
    const t = introClock.time
    const { shackle } = LOCK
    if (shackleLift.current) shackleLift.current.position.y = anim.shackleLift * shackle.lift
    if (shackleSwing.current) shackleSwing.current.rotation.y = anim.shackleSwing * 0.95

    if (root.current) {
      // 대기 중엔 숨 쉬듯 흔들리고, 반동은 뒤로 살짝 밀림
      const idle = animate ? (1 - anim.zoom) * anim.parallax : 0
      root.current.rotation.y = Math.sin(t * 0.45) * 0.07 * idle
      root.current.rotation.x = Math.sin(t * 0.6) * 0.025 * idle - anim.recoil * 0.05
      root.current.rotation.z = anim.recoil * 0.012
      root.current.position.z = -anim.recoil * 0.07
      root.current.position.y = Math.sin(t * 0.8) * 0.04 * idle
    }

    // 열쇠 구멍 속 빛 — 하얗게 날아가지 않는 따뜻한 금빛 범위로
    materials.keyhole.emissiveIntensity = anim.glow * 1.5
    materials.gem.emissiveIntensity = 0.12 + anim.glow * 0.9
    // 카메라에 아주 가까워지면 점광원이 표면을 하얗게 태우지 않도록 줄임
    if (keyholeLight.current) keyholeLight.current.intensity = anim.glow * 5 * (1 - anim.zoom * 0.85)

    seams.current.forEach((s) => {
      if (!s) return
      const o = anim.seam
      s.material.opacity = o * (0.85 + Math.sin(t * 7) * 0.15) * (1 - anim.zoom)
      const sc = 0.35 + o * 0.5
      s.scale.set(sc, sc, 1)
    })
    sparkles.current.forEach((s, i) => {
      if (!s) return
      const ph = GEM_SPARKLES[i][3]
      const tw = animate ? Math.max(0, Math.sin(t * 1.3 + ph)) ** 8 : 0.4
      const o = Math.min(1, tw + anim.glow * 0.6) * (1 - anim.zoom)
      s.material.opacity = o
      const sc = 0.1 + o * 0.16
      s.scale.set(sc, sc, 1)
      s.material.rotation = t * 0.6 + ph
    })
  })

  const { shackle, frontZ, keyholeY } = LOCK
  const m = materials
  const glowTex = getGlowTexture()
  const starTex = getStarTexture()

  return (
    <group ref={root}>
      <mesh geometry={geo.body} material={m.goldBody} castShadow receiveShadow />
      <mesh geometry={geo.rimOuter} material={m.goldDeep} />
      <mesh geometry={geo.rimInner} material={m.roseGold} />
      {geo.pearls.map((p, i) => (
        <mesh key={i} geometry={geo.pearl} material={m.pearl} position={p} />
      ))}

      {/* 열쇠 구멍 */}
      <mesh geometry={geo.plate} material={m.goldDeep} />
      <mesh geometry={geo.plateRing} material={m.gold} />
      <mesh geometry={geo.keyholeFill} material={m.keyhole} />
      <pointLight
        ref={keyholeLight}
        position={[0, keyholeY, frontZ + 0.35]}
        color="#fff1d0"
        intensity={0}
        distance={3.5}
        decay={2}
      />

      {/* 보석: 가운데 위 큰 보석 + 좌우 작은 보석 */}
      <group position={[0, 0.36, frontZ + 0.035]}>
        <mesh geometry={geo.gemBig} material={m.gem} />
        <mesh geometry={geo.bezel} material={m.goldDeep} scale={[1, 1.28, 1]} />
      </group>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.6, 0.22, frontZ + 0.025]} rotation={[0, 0, side * -0.35]}>
          <mesh geometry={geo.gemSmall} material={m.gem} />
          <mesh geometry={geo.bezel} material={m.goldDeep} scale={[0.62, 0.78, 0.8]} />
        </group>
      ))}
      {GEM_SPARKLES.map(([x, y, z], i) => (
        <sprite
          key={i}
          ref={(el) => {
            sparkles.current[i] = el
          }}
          position={[x, y, z]}
        >
          <spriteMaterial
            map={starTex}
            color="#fff6e6"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </sprite>
      ))}

      {/* 걸쇠 링 (몸체에 고정) + 해제 시 이음새에서 새는 빛 */}
      {[-1, 1].map((side, i) => (
        <group key={side} position={[side * shackle.halfSpan, 1.05, 0]}>
          <mesh geometry={geo.ferrule} material={m.goldDeep} />
          <sprite
            ref={(el) => {
              seams.current[i] = el
            }}
            position={[0, 0.06, 0.12]}
          >
            <spriteMaterial
              map={glowTex}
              color="#ffe7b0"
              transparent
              opacity={0}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
        </group>
      ))}

      {/* 걸쇠: 들어 올림 → 왼쪽 다리를 축으로 회전 */}
      <group ref={shackleLift}>
        <group position={[-shackle.halfSpan, 0, 0]}>
          <group ref={shackleSwing}>
            <mesh geometry={geo.shackleGeo} material={m.gold} castShadow />
            <mesh geometry={geo.shackleCap} material={m.gold} position={[shackle.halfSpan * 2, shackle.rightBottom, 0]} />
          </group>
        </group>
      </group>
    </group>
  )
}
