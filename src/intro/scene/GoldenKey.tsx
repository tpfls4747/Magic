import { useCursor } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { IntroAnim } from '../animState'
import { heartCurve, keyBitShape } from './geometry'
import { KEYHOLE } from './layout'
import type { IntroMaterials } from './materials'

interface GoldenKeyProps {
  anim: IntroAnim
  materials: IntroMaterials
  animate: boolean
  interactive: boolean
  portrait: boolean
  onActivate: () => void
}

const KEY_SCALE = 0.82
const BOW_Y = 1.62

// 회전 상태 (모델은 XY 평면, 끝(tip)이 원점, 샤프트가 +Y)
const _x = new THREE.Vector3(1, 0, 0)
const _y = new THREE.Vector3(0, 1, 0)
const _z = new THREE.Vector3(0, 0, 1)
/** 열쇠 구멍 조준: 샤프트가 -Z(자물쇠 쪽), 이(bit)가 아래(-Y) */
const Q_AIM = new THREE.Quaternion()
  .setFromAxisAngle(_x, Math.PI / 2)
  .multiply(new THREE.Quaternion().setFromAxisAngle(_y, -Math.PI / 2))
/** 90° 돌린 상태 */
const Q_TURN = new THREE.Quaternion().setFromAxisAngle(_z, -Math.PI / 2).multiply(Q_AIM)

const AIM_POS = KEYHOLE.clone().add(new THREE.Vector3(0, 0, 0.95))
const INSERT_POS = KEYHOLE.clone().add(new THREE.Vector3(0, 0, -0.32))

const _q = new THREE.Quaternion()
const _qIdle = new THREE.Quaternion()
const _p = new THREE.Vector3()
const _pIdle = new THREE.Vector3()

/** 입체 황금 열쇠 — 하트 고리 · 진주 원환 · 보석 · 선반 가공 칼라 · 이(bit) */
export function GoldenKey({ anim, materials, animate, interactive, portrait, onActivate }: GoldenKeyProps) {
  const rig = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  useCursor(hovered && interactive)

  // 열쇠는 사라지는 연출이 있어 투명 머티리얼을 따로 둡니다
  const mats = useMemo(() => {
    const gem = materials.gem.clone()
    gem.transparent = true
    const pearl = materials.pearl.clone()
    pearl.transparent = true
    return { gold: materials.keyGold, gem, pearl }
  }, [materials])

  const geo = useMemo(() => {
    const shaft = new THREE.CylinderGeometry(0.048, 0.048, 1.0, 32)
    shaft.translate(0, 0.5, 0)
    const tip = new THREE.SphereGeometry(0.048, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)
    const bit = new THREE.ExtrudeGeometry(keyBitShape(), {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 3,
    })
    bit.translate(0, 0, -0.025)
    const band = new THREE.TorusGeometry(0.056, 0.013, 10, 40)
    band.rotateX(Math.PI / 2)
    const collar = new THREE.LatheGeometry(
      [
        [0.046, 0.92],
        [0.07, 0.95],
        [0.092, 0.99],
        [0.072, 1.03],
        [0.06, 1.05],
        [0.11, 1.09],
        [0.088, 1.14],
        [0.05, 1.17],
        [0.044, 1.2],
      ].map(([r, y]) => new THREE.Vector2(r, y)),
      48,
    )
    const neck = new THREE.CylinderGeometry(0.04, 0.046, 0.16, 24)
    neck.translate(0, 1.26, 0)
    const heart = new THREE.TubeGeometry(heartCurve(0.3, 0), 160, 0.036, 14, true)
    heart.translate(0, BOW_Y + 0.02, 0)
    const ring = new THREE.TorusGeometry(0.44, 0.03, 16, 96)
    ring.translate(0, BOW_Y, 0)
    const ringInner = new THREE.TorusGeometry(0.4, 0.011, 8, 96)
    ringInner.translate(0, BOW_Y, 0)
    const gem = new THREE.OctahedronGeometry(0.1, 0)
    gem.scale(1, 1.2, 0.6)
    const pearl = new THREE.SphereGeometry(0.038, 20, 12)
    const finial = new THREE.SphereGeometry(0.055, 24, 12)
    const finialStar = new THREE.OctahedronGeometry(0.06, 0)
    finialStar.scale(0.6, 1.4, 0.6)
    // 클릭 판정을 넉넉하게 — 보이지 않는 상자
    const hit = new THREE.BoxGeometry(1.1, 2.3, 0.5)
    hit.translate(0, 1.1, 0)

    const pearls: [number, number, number][] = []
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + ((i + 1) / 11) * Math.PI * 2
      pearls.push([Math.cos(a) * 0.44, BOW_Y + Math.sin(a) * 0.44, 0])
    }
    return { shaft, tip, bit, band, collar, neck, heart, ring, ringInner, gem, pearl, finial, finialStar, hit, pearls }
  }, [])

  useLayoutEffect(
    () => () => {
      Object.values(geo).forEach((g) => g instanceof THREE.BufferGeometry && g.dispose())
      mats.gem.dispose()
      mats.pearl.dispose()
    },
    [geo, mats],
  )

  useFrame((state) => {
    const g = rig.current
    if (!g) return
    const t = state.clock.elapsedTime

    // 대기 위치 — 가로 화면에서는 자물쇠 오른쪽
    const bob = animate ? Math.sin(t * 1.3) * 0.07 : 0
    if (portrait) {
      // 세로 화면: 자물쇠 아래에 가로로 누운 열쇠 (끝이 왼쪽, 고리가 오른쪽)
      _pIdle.set(-0.82, -1.68 + bob, 0.9)
      _qIdle.setFromAxisAngle(_z, -Math.PI / 2 + (animate ? Math.sin(t * 0.9) * 0.05 : 0))
    } else {
      _pIdle.set(1.72, -1.05 + bob, 0.95)
      _qIdle.setFromAxisAngle(_z, -0.38 + (animate ? Math.sin(t * 0.9) * 0.06 : 0))
    }
    _qIdle.multiply(_q.setFromAxisAngle(_y, animate ? Math.sin(t * 0.55) * 0.35 : 0.2))

    // 대기 → 조준 (포물선으로 날아옴)
    const f = anim.keyFly
    _p.lerpVectors(_pIdle, AIM_POS, f)
    _p.y += Math.sin(f * Math.PI) * 0.45
    _p.z += Math.sin(f * Math.PI) * 0.6
    _q.slerpQuaternions(_qIdle, Q_AIM, f)
    // 조준 → 삽입
    _p.lerp(INSERT_POS, anim.keyInsert)
    // 회전
    if (anim.keyTurn > 0) _q.slerp(Q_TURN, anim.keyTurn)

    g.position.copy(_p)
    g.quaternion.copy(_q)

    const d = anim.keyDissolve
    const s = KEY_SCALE * (1 + anim.hover * 0.07) * (1 - d * 0.35)
    g.scale.setScalar(s)
    g.visible = d < 0.999

    mats.gold.emissiveIntensity = anim.hover * 0.18 + anim.glow * 0.5 + Math.sin(d * Math.PI) * 2.2
    mats.gold.opacity = 1 - d
    mats.gem.opacity = 1 - d
    mats.pearl.opacity = 1 - d
    const dw = d < 0.5
    mats.gold.depthWrite = dw
    mats.gem.depthWrite = dw
    mats.pearl.depthWrite = dw
  })

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (!interactive) return
    setHovered(true)
    anim.hover = 1
  }
  const out = () => {
    setHovered(false)
    anim.hover = 0
  }
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (!interactive) return
    out()
    onActivate()
  }

  const { gold, gem, pearl } = mats
  return (
    <group ref={rig}>
      <group rotation={[0, 0, 0]}>
        <mesh geometry={geo.tip} material={gold} rotation={[Math.PI, 0, 0]} />
        <mesh geometry={geo.shaft} material={gold} castShadow />
        <mesh geometry={geo.bit} material={gold} castShadow />
        <mesh geometry={geo.band} material={gold} position={[0, 0.58, 0]} />
        <mesh geometry={geo.band} material={gold} position={[0, 0.66, 0]} />
        <mesh geometry={geo.collar} material={gold} />
        <mesh geometry={geo.neck} material={gold} />
        <mesh geometry={geo.heart} material={gold} />
        <mesh geometry={geo.ring} material={gold} castShadow />
        <mesh geometry={geo.ringInner} material={gold} />
        <mesh geometry={geo.gem} material={gem} position={[0, BOW_Y + 0.01, 0]} />
        {geo.pearls.map((p, i) => (
          <mesh key={i} geometry={geo.pearl} material={pearl} position={p} />
        ))}
        <mesh geometry={geo.finial} material={gold} position={[0, BOW_Y + 0.49, 0]} />
        <mesh geometry={geo.finialStar} material={gem} position={[0, BOW_Y + 0.6, 0]} />
        <mesh geometry={geo.hit} onPointerOver={over} onPointerOut={out} onClick={click}>
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
      </group>
    </group>
  )
}
