import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { IntroAnim } from '../animState'
import { heartCurve, heartShape, keyholePath, shacklePath } from './geometry'
import { LOCK } from './layout'
import type { IntroMaterials } from './materials'

interface PadlockProps {
  anim: IntroAnim
  materials: IntroMaterials
  animate: boolean
}

/** 하트형 황금 자물쇠 — 몸체(베벨 압출) · U자 걸쇠 · 열쇠 구멍 장식판 · 진주와 보석 */
export function Padlock({ anim, materials, animate }: PadlockProps) {
  const root = useRef<THREE.Group>(null)
  const shackleLift = useRef<THREE.Group>(null)
  const shackleSwing = useRef<THREE.Group>(null)
  const keyholeLight = useRef<THREE.PointLight>(null)

  const geo = useMemo(() => {
    const { bodyDepth, bevelThickness, bevelSize, frontZ, keyholeY, shackle } = LOCK

    const body = new THREE.ExtrudeGeometry(heartShape(1), {
      depth: bodyDepth,
      bevelEnabled: true,
      bevelThickness,
      bevelSize,
      bevelSegments: 12,
      curveSegments: 72,
    })
    body.translate(0, 0, -bodyDepth / 2)
    body.computeVertexNormals()

    // 앞면 테두리 장식 (두 줄)
    const rimOuter = new THREE.TubeGeometry(heartCurve(0.87, frontZ), 220, 0.03, 12, true)
    const rimInner = new THREE.TubeGeometry(heartCurve(0.79, frontZ), 220, 0.013, 8, true)

    // 진주 배치 위치 — 바깥 테두리를 따라 균등 간격 (중앙 홈 부근 제외)
    const pearlCurve = heartCurve(0.87, frontZ + 0.03)
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
      bevelThickness: 0.025,
      bevelSize: 0.022,
      bevelSegments: 6,
      curveSegments: 64,
    })
    plate.translate(0, keyholeY, frontZ)

    const plateRingCurve = new THREE.EllipseCurve(0, -0.12, 0.34, 0.49, 0, Math.PI * 2, false, 0)
    const plateRing = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(
        plateRingCurve.getSpacedPoints(96).slice(0, -1).map((p) => new THREE.Vector3(p.x, p.y + keyholeY, frontZ)),
        true,
      ),
      160,
      0.02,
      10,
      true,
    )

    // 열쇠 구멍 안쪽 (어두운 면 — 해제 시 빛남)
    const keyholeFill = new THREE.ShapeGeometry(
      keyholePath(new THREE.Shape(), 0.122, 0.054, 0.087, 0.342),
      48,
    )
    keyholeFill.translate(0, keyholeY, frontZ + 0.004)

    // 걸쇠
    const shackleGeo = new THREE.TubeGeometry(
      shacklePath(shackle.halfSpan, shackle.top, shackle.leftBottom, shackle.rightBottom),
      200,
      shackle.radius,
      40,
      false,
    )
    // 걸쇠는 왼쪽 다리를 축으로 회전하므로 축(x=-halfSpan)을 원점으로 옮깁니다
    shackleGeo.translate(shackle.halfSpan, 0, 0)
    const shackleCap = new THREE.SphereGeometry(shackle.radius, 32, 16)

    // 걸쇠가 몸체로 들어가는 자리의 금속 링
    const ferrule = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.1, -0.06),
        new THREE.Vector2(0.155, -0.04),
        new THREE.Vector2(0.17, 0),
        new THREE.Vector2(0.155, 0.04),
        new THREE.Vector2(0.115, 0.06),
      ],
      48,
    )

    const gemBig = new THREE.OctahedronGeometry(0.12, 0)
    gemBig.scale(1, 1.25, 0.55)
    const gemSmall = new THREE.OctahedronGeometry(0.07, 0)
    gemSmall.scale(1, 1.2, 0.55)
    const pearl = new THREE.SphereGeometry(0.034, 20, 12)
    const bezel = new THREE.TorusGeometry(0.115, 0.018, 10, 40)

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

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const { shackle } = LOCK
    if (shackleLift.current) shackleLift.current.position.y = anim.shackleLift * shackle.lift
    if (shackleSwing.current) shackleSwing.current.rotation.y = anim.shackleSwing * 0.95

    if (root.current) {
      // 대기 중엔 아주 느리게 숨 쉬듯 흔들리고, 반동은 뒤로 살짝 밀림
      const idle = animate ? 1 - anim.zoom : 0
      root.current.rotation.y = Math.sin(t * 0.45) * 0.07 * idle * anim.parallax
      root.current.rotation.x = Math.sin(t * 0.6) * 0.025 * idle - anim.recoil * 0.05
      root.current.position.z = -anim.recoil * 0.07
      root.current.position.y = Math.sin(t * 0.8) * 0.04 * idle
    }

    materials.keyhole.emissiveIntensity = anim.glow * 7
    materials.gem.emissiveIntensity = 0.15 + anim.glow * 1.4
    if (keyholeLight.current) keyholeLight.current.intensity = anim.glow * 6
  })

  const { shackle, frontZ, keyholeY } = LOCK
  const m = materials

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
        distance={4}
        decay={2}
      />

      {/* 보석: 가운데 위 큰 보석 + 좌우 작은 보석 */}
      <group position={[0, 0.36, frontZ + 0.04]}>
        <mesh geometry={geo.gemBig} material={m.gem} />
        <mesh geometry={geo.bezel} material={m.goldDeep} scale={[1, 1.28, 1]} />
      </group>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.6, 0.22, frontZ + 0.03]} rotation={[0, 0, side * -0.35]}>
          <mesh geometry={geo.gemSmall} material={m.gem} />
          <mesh geometry={geo.bezel} material={m.goldDeep} scale={[0.62, 0.78, 0.8]} />
        </group>
      ))}

      {/* 걸쇠 링 (몸체에 고정) */}
      {[-1, 1].map((side) => (
        <mesh key={side} geometry={geo.ferrule} material={m.goldDeep} position={[side * shackle.halfSpan, 1.02, 0]} />
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
