import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { DoorAnim } from '../animState'
import { arcPath3, gemGeometry, leafShape, panelRingShape, roundedRect, roundedRectCurve } from './geometry'
import { DOOR, LEAF_FRONT_Z } from './layout'
import type { DoorMaterials } from './materials'

interface DoorLeafProps {
  side: 'left' | 'right'
  anim: DoorAnim
  materials: DoorMaterials
}

/**
 * 아치형 문짝 하나. 왼쪽 문짝을 기준으로 만들고, 오른쪽은 x 방향으로 반전(scale -1)합니다.
 * 피벗은 실제 힌지 축(개구부 가장자리, 벽 뒷면)에 있어 그 축을 중심으로 회전합니다.
 */
export function DoorLeaf({ side, anim, materials }: DoorLeafProps) {
  const swing = useRef<THREE.Group>(null)
  const lever = useRef<THREE.Group>(null)
  const { halfWidth: H, spring, leafThickness: T, seamGap, inset } = DOOR
  const xr = H - seamGap / 2

  const geo = useMemo(() => {
    const leaf = new THREE.ExtrudeGeometry(leafShape(H, spring, seamGap, inset), {
      depth: T - 0.012,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.006,
      bevelSegments: 3,
      curveSegments: 64,
    })
    leaf.translate(0, 0, -T + 0.006)

    // 위아래 두 개의 돋을새김 패널
    const px = 0.15
    const pw = xr - px - 0.13
    const panels = [
      { y: 0.26, h: 0.66 },
      { y: 1.22, h: 1.06 },
    ]
    const ring = (y: number, h: number) => {
      const g = new THREE.ExtrudeGeometry(panelRingShape(px, y, pw, h, 0.05, 0.035), {
        depth: 0.012,
        bevelEnabled: true,
        bevelThickness: 0.008,
        bevelSize: 0.006,
        bevelSegments: 3,
        curveSegments: 12,
      })
      return g
    }
    const field = (y: number, h: number) => {
      const g = new THREE.ExtrudeGeometry(roundedRect(new THREE.Shape(), px + 0.08, y + 0.08, pw - 0.16, h - 0.16, 0.02) as THREE.Shape, {
        depth: 0.008,
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: 0.012,
        bevelSegments: 4,
        curveSegments: 8,
      })
      return g
    }
    const panelRings = panels.map((p) => ring(p.y, p.h))
    const panelFields = panels.map((p) => field(p.y, p.h))
    const inlays = panels.map(
      (p) => new THREE.TubeGeometry(roundedRectCurve(px + 0.065, p.y + 0.065, pw - 0.13, p.h - 0.13, 0.025, 0.012), 140, 0.0045, 6, true),
    )

    // 가로대(트랜섬) 금장 + 위쪽 부채꼴(팬라이트) 장식
    const transom = new THREE.CylinderGeometry(0.012, 0.012, xr - inset - 0.06, 12)
    transom.rotateZ(Math.PI / 2)
    transom.translate((xr + inset) / 2, spring - 0.06, 0.012)
    const fan: THREE.BufferGeometry[] = []
    const cx = H
    const cy = spring - 0.06
    const R = H - inset - 0.1
    for (const r of [0.34, 0.7, R]) {
      fan.push(new THREE.TubeGeometry(arcPath3(cx, cy, r, Math.PI / 2 + 0.03, Math.PI - 0.02, 0.012), 48, 0.008, 6, false))
    }
    for (const deg of [105, 125, 145, 165]) {
      const a = THREE.MathUtils.degToRad(deg)
      const p0 = new THREE.Vector3(cx + Math.cos(a) * 0.12, cy + Math.sin(a) * 0.12, 0.012)
      const p1 = new THREE.Vector3(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 0.012)
      fan.push(new THREE.TubeGeometry(new THREE.LineCurve3(p0, p1), 4, 0.006, 6, false))
    }
    const rosette = new THREE.CylinderGeometry(0.06, 0.07, 0.02, 32, 1, false, Math.PI / 2, Math.PI)
    rosette.rotateX(Math.PI / 2)
    rosette.translate(xr, cy, 0.012)
    const gem = gemGeometry(0.03, 1.2)

    // 힌지(경첩) — 문짝 가장자리, 벽 뒤쪽이라 열렸을 때 보임
    const hinge = new THREE.CylinderGeometry(0.018, 0.018, 0.12, 16)

    // 손잡이: 받침판, 로제트, 레버
    const plate = new THREE.ExtrudeGeometry(roundedRect(new THREE.Shape(), -0.032, -0.15, 0.064, 0.27, 0.03) as THREE.Shape, {
      depth: 0.008,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.004,
      bevelSegments: 3,
    })
    const rose = new THREE.CylinderGeometry(0.026, 0.03, 0.03, 32)
    rose.rotateX(Math.PI / 2)
    rose.translate(0, 0, 0.026)
    const arm = new THREE.CapsuleGeometry(0.0125, 0.13, 6, 16)
    arm.rotateZ(Math.PI / 2)
    arm.translate(-0.085, 0, 0.05)
    const neck = new THREE.CylinderGeometry(0.012, 0.012, 0.035, 12)
    neck.rotateX(Math.PI / 2)
    neck.translate(-0.01, 0, 0.04)
    const knob = new THREE.SphereGeometry(0.02, 20, 12)
    knob.translate(-0.16, 0, 0.05)
    const keyhole = new THREE.CircleGeometry(0.008, 16)
    keyhole.translate(0, -0.1, 0.0135)

    return { leaf, panelRings, panelFields, inlays, transom, fan, rosette, gem, hinge, plate, rose, arm, neck, knob, keyhole, cy }
  }, [H, spring, T, seamGap, inset, xr])

  useLayoutEffect(
    () => () => {
      const all: THREE.BufferGeometry[] = [
        geo.leaf,
        ...geo.panelRings,
        ...geo.panelFields,
        ...geo.inlays,
        geo.transom,
        ...geo.fan,
        geo.rosette,
        geo.gem,
        geo.hinge,
        geo.plate,
        geo.rose,
        geo.arm,
        geo.neck,
        geo.knob,
        geo.keyhole,
      ]
      all.forEach((g) => g.dispose())
    },
    [geo],
  )

  useFrame(() => {
    // 왼쪽 문짝 기준: +각도 → 안쪽(-z)으로 열림. 오른쪽은 부모 반전으로 대칭.
    // (열림 곡선은 GSAP ease 가 담당)
    const angle = anim.unlatch * 0.035 + Math.min(1, Math.max(0, anim.leaf)) * DOOR.openAngle
    if (swing.current) swing.current.rotation.y = angle
    if (lever.current) lever.current.rotation.z = anim.handle * 0.6
  })

  const m = materials
  return (
    <group scale={side === 'right' ? [-1, 1, 1] : [1, 1, 1]}>
      <group position={[-H, 0, LEAF_FRONT_Z]}>
        <group ref={swing}>
          <mesh geometry={geo.leaf} material={m.doorPaint} castShadow />
          {geo.panelRings.map((g, i) => (
            <mesh key={`r${i}`} geometry={g} material={m.molding} castShadow />
          ))}
          {geo.panelFields.map((g, i) => (
            <mesh key={`f${i}`} geometry={g} material={m.doorPaint} />
          ))}
          {geo.inlays.map((g, i) => (
            <mesh key={`i${i}`} geometry={g} material={m.goldDeep} />
          ))}
          <mesh geometry={geo.transom} material={m.gold} />
          {geo.fan.map((g, i) => (
            <mesh key={`a${i}`} geometry={g} material={m.goldDeep} />
          ))}
          <mesh geometry={geo.rosette} material={m.gold} />
          <mesh geometry={geo.gem} material={m.gem} position={[xr - 0.032, geo.cy + 0.03, 0.03]} />
          {[0.35, 1.5, 2.45].map((y) => (
            <mesh key={y} geometry={geo.hinge} material={m.goldDeep} position={[0.004, y, -T / 2]} />
          ))}

          {/* 손잡이 — 레버가 로제트 축을 중심으로 실제로 내려감 */}
          <group position={[xr - 0.1, DOOR.handleY, 0]}>
            <mesh geometry={geo.plate} material={m.handleGold} castShadow />
            <mesh geometry={geo.keyhole}>
              <meshBasicMaterial color="#2b2230" />
            </mesh>
            <mesh geometry={geo.rose} material={m.handleGold} />
            <group ref={lever}>
              <mesh geometry={geo.neck} material={m.handleGold} />
              <mesh geometry={geo.arm} material={m.handleGold} castShadow />
              <mesh geometry={geo.knob} material={m.handleGold} />
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}
