import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import type { ArtifactKind } from '../types'
import { artifactArt } from './art'
import { face, slab } from './geometry'
import type { ArtifactSlot } from './layout'
import { glass, gold, goldBright, ivoryDevice, lavender, paper, printMaterial, softShadow } from './materials'

/** 마운트 시 한 번 만들고 언마운트 시 해제하는 인쇄면 머티리얼 */
function usePrint(make: () => THREE.Texture, roughness = 0.88) {
  const [mat] = useState(() => printMaterial(make(), roughness))
  useEffect(
    () => () => {
      mat.map?.dispose()
      mat.dispose()
    },
    [mat],
  )
  return mat
}

function useGeom<T extends THREE.BufferGeometry>(make: () => T) {
  const [g] = useState(make)
  useEffect(() => () => g.dispose(), [g])
  return g
}

/* ───────────────────────────── 기본 부품 ───────────────────────────── */

/** 종이 한 장 — 얇은 두께 + 앞면 인쇄 */
function Sheet({ w, h, make, t = 0.0025, color }: { w: number; h: number; make: () => THREE.Texture; t?: number; color?: string }) {
  const mat = usePrint(make)
  const body = useGeom(() => slab(w, h, t, 0.006))
  const top = useGeom(() => face(w - 0.002, h - 0.002, 0.006))
  const sideMat = useMemo(
    () => (color ? new THREE.MeshStandardMaterial({ color, roughness: 0.85 }) : null),
    [color],
  )
  useEffect(() => () => sideMat?.dispose(), [sideMat])
  return (
    <group>
      <mesh geometry={body} material={sideMat ?? paper()} castShadow receiveShadow />
      <mesh geometry={top} position={[0, 0, t + 0.0004]} material={mat} receiveShadow />
    </group>
  )
}

/** 금색 핀 */
function Pin({ x = 0, y = 0, z = 0.004 }: { x?: number; y?: number; z?: number }) {
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0, 0.006]} material={gold()} castShadow>
        <sphereGeometry args={[0.009, 16, 12]} />
      </mesh>
      <mesh position={[0, 0, 0.001]} rotation={[Math.PI / 2, 0, 0]} material={goldBright()}>
        <cylinderGeometry args={[0.0045, 0.006, 0.005, 16]} />
      </mesh>
    </group>
  )
}

/** 금색 바인더 클립 */
function Clip({ y = 0 }: { y?: number }) {
  return (
    <group position={[0, y, 0.006]}>
      <mesh material={gold()} castShadow>
        <boxGeometry args={[0.05, 0.022, 0.008]} />
      </mesh>
      <mesh position={[0, 0.022, 0.006]} rotation={[0.5, 0, 0]} material={goldBright()} castShadow>
        <torusGeometry args={[0.014, 0.0016, 8, 20, Math.PI]} />
      </mesh>
    </group>
  )
}

/* ───────────────────────────── 소품 종류 ───────────────────────────── */

function ResearchNote() {
  return (
    <group>
      <Sheet w={0.19} h={0.24} make={artifactArt.researchNote} />
      <Clip y={0.12} />
    </group>
  )
}

function ObservationMemo() {
  return (
    <group>
      <Sheet w={0.14} h={0.14} make={artifactArt.observationMemo} color="#efe3cc" />
      <Pin y={0.05} />
    </group>
  )
}

/** 작은 돋보기 — 금 테 + 유리 + 손잡이 */
function Magnifier() {
  return (
    <group rotation={[0, 0, -0.7]}>
      <mesh material={gold()} castShadow>
        <torusGeometry args={[0.045, 0.006, 16, 48]} />
      </mesh>
      <mesh material={glass()} renderOrder={2}>
        <circleGeometry args={[0.044, 40]} />
      </mesh>
      <mesh position={[0, -0.09, 0]} material={ivoryDevice()} castShadow>
        <cylinderGeometry args={[0.008, 0.01, 0.085, 16]} />
      </mesh>
      <mesh position={[0, -0.05, 0]} material={goldBright()}>
        <cylinderGeometry args={[0.0095, 0.0095, 0.012, 16]} />
      </mesh>
    </group>
  )
}

function ProblemCard() {
  return (
    <group>
      <Sheet w={0.22} h={0.157} make={artifactArt.problemCard} />
      <Pin x={-0.08} y={0.055} />
    </group>
  )
}

function StickyNotes() {
  const notes: [string, string, number, number, number][] = [
    ['#d9cdef', 'Insight', -0.04, 0.03, 0.08],
    ['#f1e2bf', 'Pain', 0.05, 0.0, -0.06],
    ['#efe7f8', 'Need', 0.0, -0.06, 0.03],
  ]
  return (
    <group>
      {notes.map(([c, word, x, y, r], i) => (
        <group key={word} position={[x, y, i * 0.003]} rotation={[0, 0, r]}>
          <Sheet w={0.1} h={0.1} make={artifactArt.sticky(c, word)} color={c} />
        </group>
      ))}
    </group>
  )
}

function HmwMemo() {
  return <Sheet w={0.15} h={0.15} make={artifactArt.hmw} color="#ddd1f4" />
}

function WireframeSheet() {
  return (
    <group>
      <Sheet w={0.22} h={0.165} make={artifactArt.wireframe} />
      <Clip y={0.082} />
    </group>
  )
}

function FlowDiagram() {
  return (
    <group>
      <Sheet w={0.22} h={0.15} make={artifactArt.flow} />
      <Pin x={-0.09} y={0.055} />
      <Pin x={0.09} y={0.055} />
    </group>
  )
}

function UiSketch() {
  return <Sheet w={0.12} h={0.177} make={artifactArt.uiSketch} />
}

/** 미니 브라우저 — 두께 있는 아이보리 기기 + 화면 */
function MiniBrowser() {
  const mat = usePrint(artifactArt.browserScreen, 0.5)
  const body = useGeom(() => slab(0.24, 0.165, 0.014, 0.012, 0.003))
  const screen = useGeom(() => face(0.226, 0.148, 0.006))
  return (
    <group>
      <mesh geometry={body} material={[ivoryDevice(), gold()]} castShadow receiveShadow />
      <mesh geometry={screen} position={[0, 0, 0.0145]} material={mat} />
    </group>
  )
}

function Smartphone() {
  const mat = usePrint(artifactArt.phoneScreen, 0.4)
  const body = useGeom(() => slab(0.08, 0.164, 0.01, 0.014, 0.003))
  const screen = useGeom(() => face(0.071, 0.146, 0.01))
  return (
    <group>
      <mesh geometry={body} material={[ivoryDevice(), gold()]} castShadow />
      <mesh geometry={screen} position={[0, 0, 0.0105]} material={mat} />
    </group>
  )
}

/** UI 컴포넌트 칩 — 버튼 · 토글 · 카드를 입체 부품처럼 */
function UiComponents() {
  const pill = useGeom(() => slab(0.11, 0.036, 0.01, 0.018, 0.003))
  const toggle = useGeom(() => slab(0.06, 0.032, 0.01, 0.016, 0.003))
  const card = useGeom(() => slab(0.1, 0.07, 0.008, 0.01, 0.002))
  return (
    <group>
      <mesh geometry={pill} position={[-0.03, 0.05, 0]} castShadow>
        <meshPhysicalMaterial color="#3a3140" roughness={0.35} clearcoat={0.6} />
      </mesh>
      <group position={[0.07, 0.0, 0]}>
        <mesh geometry={toggle} material={lavender()} castShadow />
        <mesh position={[0.014, 0, 0.012]} material={ivoryDevice()} castShadow>
          <sphereGeometry args={[0.012, 16, 12]} />
        </mesh>
      </group>
      <mesh geometry={card} position={[-0.04, -0.035, 0]} material={[ivoryDevice(), gold()]} castShadow />
    </group>
  )
}

function Checklist() {
  return (
    <group>
      <Sheet w={0.17} h={0.216} make={artifactArt.checklist} />
      <Clip y={0.108} />
    </group>
  )
}

function RevisedScreen() {
  return (
    <group>
      <Sheet w={0.16} h={0.198} make={artifactArt.revisedScreen} />
      <Pin y={0.085} />
    </group>
  )
}

function FeedbackCards() {
  return (
    <group>
      <group position={[-0.02, 0.025, 0]} rotation={[0, 0, 0.06]}>
        <Sheet w={0.14} h={0.1} make={artifactArt.feedback('Feedback')} />
      </group>
      <group position={[0.03, -0.035, 0.02]} rotation={[0, 0, -0.08]}>
        <Sheet w={0.14} h={0.1} make={artifactArt.feedback('Better!')} color="#efe7f8" />
      </group>
    </group>
  )
}

const ARTIFACTS: Record<ArtifactKind, () => ReactNode> = {
  'research-note': ResearchNote,
  magnifier: Magnifier,
  'observation-memo': ObservationMemo,
  'sticky-notes': StickyNotes,
  'problem-card': ProblemCard,
  'hmw-memo': HmwMemo,
  'wireframe-sheet': WireframeSheet,
  'flow-diagram': FlowDiagram,
  'ui-sketch': UiSketch,
  'mini-browser': MiniBrowser,
  smartphone: Smartphone,
  'ui-components': UiComponents,
  'feedback-cards': FeedbackCards,
  checklist: Checklist,
  'revised-screen': RevisedScreen,
}

/**
 * 한 단계의 자료 묶음.
 * 보드에 붙은 자료와 보드 앞에 떠 있는 자료(z > 0)를 배치하고,
 * 해당 단계가 선택되거나 강조되면 미세하게 움직이며 반응합니다.
 */
export function StageArtifacts({
  kinds,
  slots,
  origin,
  active,
  index,
  reducedMotion,
}: {
  kinds: ArtifactKind[]
  slots: ArtifactSlot[]
  /** 카드 중심 (월드) */
  origin: [number, number]
  active: boolean
  index: number
  reducedMotion: boolean
}) {
  const refs = useRef<(THREE.Group | null)[]>([])
  const amt = useRef(0)

  // 떠 있는 자료는 실제 그림자 대신 보드 위 부드러운 그림자만 — 이웃 카드 글자 위에 얼룩이 지지 않도록
  useEffect(() => {
    refs.current.forEach((g, i) => {
      if (g && slots[i]?.z > 0) g.traverse((o) => (o.castShadow = false))
    })
  }, [slots])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    amt.current = reducedMotion ? (active ? 1 : 0) : THREE.MathUtils.damp(amt.current, active ? 1 : 0, 4, Math.min(dt, 0.05))
    refs.current.forEach((g, i) => {
      if (!g) return
      const slot = slots[i]
      const floating = slot.z > 0
      const motion = reducedMotion ? 0 : 1
      const phase = t * 0.9 + index * 1.7 + i
      // 떠 있는 자료는 항상 천천히 부유, 선택된 단계의 자료는 조금 더 앞으로 나오며 흔들림
      const bob = floating ? Math.sin(phase) * 0.012 * motion : 0
      g.position.set(
        origin[0] + slot.x,
        origin[1] + slot.y + bob,
        slot.z + 0.002 + amt.current * (floating ? 0.06 : 0.012),
      )
      g.scale.setScalar(slot.scale ?? 1)
      g.rotation.z = slot.tilt + Math.sin(phase * 1.3) * 0.02 * amt.current * motion
      g.rotation.y = floating ? Math.sin(phase * 0.6) * 0.18 * motion : 0
    })
  })

  return (
    <>
      {kinds.map((k, i) => {
        const Comp = ARTIFACTS[k]
        const slot = slots[i]
        return (
          <group key={k}>
            <group ref={(el) => void (refs.current[i] = el)}>
              <Comp />
            </group>
            {slot.z > 0 && (
              <mesh
                position={[origin[0] + slot.x + 0.03, origin[1] + slot.y - 0.05, 0.003]}
                material={softShadow()}
                renderOrder={1}
              >
                <planeGeometry args={[0.24, 0.24]} />
              </mesh>
            )}
          </group>
        )
      })}
    </>
  )
}
