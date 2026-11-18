import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { CARD, type BoardLayout } from './layout'
import { gold, goldBright } from './materials'

/** 실 위로 흐르는 빛 (셰이더 uniform) — 메서드로만 갱신 */
class FlowUniforms {
  uniforms = {
    uFrom: { value: 0 },
    uTo: { value: 1 },
    uPhase: { value: 0 },
    uGlow: { value: 0 },
    uSeg: { value: 0 },
  }
  set(from: number, to: number, phase: number, glow: number, seg: number) {
    const u = this.uniforms
    u.uFrom.value = from
    u.uTo.value = to
    u.uPhase.value = phase
    u.uGlow.value = glow
    u.uSeg.value = seg
  }
}

interface ThreadPlan {
  points: THREE.Vector3[]
  /** 카드 k 의 실이 들어오는 점 / 나가는 점 (points 인덱스) */
  entry: number[]
  exit: number[]
  /** 카드를 고정하는 핀 (실에 걸리지 않는 핀 포함) */
  pins: THREE.Vector3[]
}

/**
 * 각 카드는 윗모서리 양쪽 두 개의 금색 핀으로 고정됩니다.
 * 실은 이전 카드 쪽 핀으로 들어와 다음 카드 쪽 핀으로 나가며, 카드 사이 빈 공간에서 살짝 늘어집니다.
 * (카드 앞면을 가로지르지 않도록)
 */
function planThread(layout: BoardLayout): ThreadPlan {
  const inset = CARD.width / 2 - 0.05
  const z = 0.024
  const pinOf = (i: number, side: number) => {
    const c = layout.cards[i]
    const top = layout.centerY + c.y + CARD.height / 2 - 0.04
    // 카드 기울기만큼 핀 높이도 보정
    return new THREE.Vector3(c.x + side * inset, top + Math.sin(c.tilt) * side * inset, z)
  }
  const n = layout.cards.length
  const points: THREE.Vector3[] = []
  const entry: number[] = []
  const exit: number[] = []
  const pins: THREE.Vector3[] = []
  const sag = layout.orientation === 'portrait' ? 0.05 : 0.035
  for (let i = 0; i < n; i++) {
    const c = layout.cards[i]
    const next = layout.cards[i + 1]
    const prev = layout.cards[i - 1]
    const exitSide = next ? Math.sign(next.x - c.x) || 1 : prev ? -(Math.sign(prev.x - c.x) || -1) : 1
    const entrySide = prev ? Math.sign(prev.x - c.x) || -1 : -exitSide
    const a = pinOf(i, entrySide)
    const b = pinOf(i, exitSide)
    pins.push(pinOf(i, -1), pinOf(i, 1))
    entry.push(points.length)
    points.push(a)
    if (entrySide !== exitSide) points.push(b)
    exit.push(points.length - 1)
    if (next) {
      const nb = pinOf(i + 1, Math.sign(c.x - next.x) || -1)
      const from = points[points.length - 1]
      const mid = from.clone().add(nb).multiplyScalar(0.5)
      mid.y -= sag
      mid.z = z - 0.006
      points.push(mid)
    }
  }
  return { points, entry, exit, pins }
}

/**
 * 다섯 단계를 잇는 얇은 금실.
 * 각 카드 위의 금색 핀에 걸려 핀 사이에서 살짝 늘어지고,
 * 선택한 단계에서 다음 단계 쪽으로 은은한 빛이 흐릅니다. (선택 전에는 전체를 아주 천천히 흐름)
 */
export function GoldThread({
  layout,
  selected,
  reducedMotion,
}: {
  layout: BoardLayout
  selected: number | null
  reducedMotion: boolean
}) {
  const plan = useMemo(() => planThread(layout), [layout])

  const { geometry, entryAt, exitAt } = useMemo(() => {
    const pts = plan.points
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
    const div = 600
    const lengths = curve.getLengths(div)
    const total = lengths[div]
    // 점 인덱스 → 실 전체 길이 대비 위치 (빛이 흐를 구간 계산용)
    const at = (idx: number) => lengths[Math.round((idx / (pts.length - 1)) * div)] / total
    return {
      geometry: new THREE.TubeGeometry(curve, 600, 0.003, 6, false),
      entryAt: plan.entry.map(at),
      exitAt: plan.exit.map(at),
    }
  }, [plan])
  useEffect(() => () => geometry.dispose(), [geometry])

  const [flow] = useState(() => new FlowUniforms())
  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: '#d8b77c',
      metalness: 1,
      roughness: 0.25,
      clearcoat: 0.4,
      envMapIntensity: 1.5,
      emissive: new THREE.Color('#000000'),
    })
    m.defines = { USE_UV: '' }
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, flow.uniforms)
      shader.fragmentShader =
        'uniform float uFrom;\nuniform float uTo;\nuniform float uPhase;\nuniform float uGlow;\nuniform float uSeg;\n' +
        shader.fragmentShader.replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
          float flowPos = mix(uFrom, uTo, uPhase);
          float flowBand = exp(-pow((vUv.x - flowPos) / 0.018, 2.0));
          float inSeg = step(min(uFrom, uTo), vUv.x) * step(vUv.x, max(uFrom, uTo));
          totalEmissiveRadiance += vec3(1.0, 0.8, 0.52) * (flowBand * uGlow + inSeg * uSeg);`,
        )
    }
    return m
  }, [flow])
  useEffect(() => () => material.dispose(), [material])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (selected === null) {
      // 전체 흐름을 아주 천천히
      flow.set(0, 1, reducedMotion ? 0 : (t % 7) / 7, reducedMotion ? 0 : 0.55, 0)
    } else {
      // 선택한 단계에서 다음 단계로 (마지막 단계는 이전 단계에서 들어오는 구간)
      const last = entryAt.length - 1
      const from = selected < last ? exitAt[selected] : exitAt[last - 1]
      const to = selected < last ? entryAt[selected + 1] : entryAt[last]
      if (reducedMotion) flow.set(from, to, 0, 0, 0.35)
      else flow.set(from, to, (t % 1.8) / 1.8, 1.4, 0.12)
    }
  })

  return (
    <group>
      <mesh geometry={geometry} material={material} />
      {plan.pins.map((p, i) => (
        <group key={i} position={p}>
          <mesh position={[0, 0, 0.004]} material={gold()} castShadow>
            <sphereGeometry args={[0.013, 20, 14]} />
          </mesh>
          <mesh position={[0, 0, -0.008]} rotation={[Math.PI / 2, 0, 0]} material={goldBright()}>
            <cylinderGeometry args={[0.005, 0.007, 0.012, 16]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
