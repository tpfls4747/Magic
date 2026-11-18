import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { createLeafGeometry, bendLeaf } from '../diaryGeometry'
import { DESK, PROPS } from '../layout'
import { bulb, glass, gold, goldBright, graphite, ivoryGloss, memoPaper } from '../materials'
import { drawMemo, drawSketch, drawSwatch } from '../propArt'

const TOP = DESK.top

/** 상판 위 [x, z] 위치 */
const at = (p: readonly [number, number], y = 0): [number, number, number] => [p[0], TOP + y, p[1]]

/** 마운트할 때 한 번 만들고 언마운트할 때 해제하는 GPU 자원 */
function useDisposable<T extends { dispose: () => void }>(make: () => T) {
  const [v] = useState(make)
  useEffect(() => () => v.dispose(), [v])
  return v
}

/* ───────────────────────────── 골드 펜 ───────────────────────────── */

export function Pen({ castShadow }: { castShadow: boolean }) {
  const body = useDisposable(() => {
    // 몸통 옆모습 — 끝이 둥글고 가운데가 살짝 굵은 라인
    const pts = [
      [0, 0],
      [0.0035, 0.003],
      [0.0052, 0.012],
      [0.0056, 0.06],
      [0.0054, 0.098],
      [0.0048, 0.104],
    ].map(([r, y]) => new THREE.Vector2(r, y))
    return new THREE.LatheGeometry(pts, 32)
  })
  const r = 0.0056
  return (
    // 책상 위에 비스듬히 누운 펜 (축: x 방향)
    <group position={at(PROPS.pen, r)} rotation={[0, -0.75, Math.PI / 2]}>
      <mesh geometry={body} position={[0, -0.06, 0]} material={ivoryGloss()} castShadow={castShadow} receiveShadow />
      {/* 금색 캡 */}
      <mesh position={[0, 0.062, 0]} material={gold()} castShadow={castShadow}>
        <cylinderGeometry args={[0.0058, 0.0058, 0.048, 32]} />
      </mesh>
      <mesh position={[0, 0.087, 0]} material={gold()}>
        <sphereGeometry args={[0.0058, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {/* 클립 */}
      <mesh position={[0.0068, 0.066, 0]} material={goldBright()} castShadow={castShadow}>
        <boxGeometry args={[0.0016, 0.04, 0.0032]} />
      </mesh>
      {/* 몸통 띠 */}
      <mesh position={[0, 0.037, 0]} material={goldBright()}>
        <cylinderGeometry args={[0.0059, 0.0059, 0.0025, 32]} />
      </mesh>
      {/* 펜촉 */}
      <mesh position={[0, -0.066, 0]} rotation={[Math.PI, 0, 0]} material={goldBright()}>
        <coneGeometry args={[0.0028, 0.012, 24]} />
      </mesh>
    </group>
  )
}

/* ───────────────────────────── 라벤더 메모 ───────────────────────────── */

export function Memo({ castShadow }: { castShadow: boolean }) {
  const topMat = useDisposable(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: drawMemo(),
      roughness: 0.85,
      side: THREE.DoubleSide,
      envMapIntensity: 0.4,
    })
    const dispose = mat.dispose.bind(mat)
    mat.dispose = () => {
      mat.map?.dispose()
      dispose()
    }
    return mat
  })
  const S = 0.078
  // 맨 위 장은 바깥 모서리가 살짝 말려 올라감
  const sheet = useDisposable(() => {
    const g = createLeafGeometry(S, S, 12)
    bendLeaf(g, S, 12, { t: 0.04, yRight: 0, yLeft: 0, slopeLeft: 0, curl: -0.9 })
    return g
  })
  return (
    <group position={at(PROPS.memo)} rotation={[0, 0.32, 0]}>
      <mesh position={[0, 0.006, 0]} material={memoPaper()} castShadow={castShadow} receiveShadow>
        <boxGeometry args={[S, 0.012, S]} />
      </mesh>
      <mesh geometry={sheet} position={[-S / 2, 0.0125, 0]} material={topMat} castShadow={castShadow} receiveShadow />
    </group>
  )
}

/* ───────────────────────────── 컬러 스와치 부채 ───────────────────────────── */

const SWATCHES: [string, string, string][] = [
  ['#f3ebdd', 'Cream', 'UMW 01'],
  ['#e7d3a8', 'Champagne', 'UMW 02'],
  ['#d9cdef', 'Lavender Mist', 'UMW 03'],
  ['#b9a6dc', 'Lavender', 'UMW 04'],
  ['#e8c9c9', 'Blush', 'UMW 05'],
  ['#3a3140', 'Ink', 'UMW 06'],
]

export function Swatches({ castShadow }: { castShadow: boolean }) {
  const maps = useMemo(() => SWATCHES.map(([c, l, code]) => drawSwatch(c, l, code)), [])
  const mats = useMemo(
    () => maps.map((map) => new THREE.MeshStandardMaterial({ map, roughness: 0.7, envMapIntensity: 0.5 })),
    [maps],
  )
  useEffect(
    () => () => {
      maps.forEach((m) => m.dispose())
      mats.forEach((m) => m.dispose())
    },
    [maps, mats],
  )
  const L = 0.13
  const Wd = 0.032
  return (
    <group position={at(PROPS.swatches)} rotation={[0, -0.5, 0]}>
      {mats.map((m, i) => (
        // 고정 리벳(카드 아래쪽 끝)을 축으로 부채꼴로 펼침
        <group key={i} rotation={[0, (i - 2.5) * 0.17, 0]} position={[0, 0.0012 + i * 0.0011, 0]}>
          <mesh position={[0, 0, -L / 2 + 0.012]} rotation={[-Math.PI / 2, 0, 0]} castShadow={castShadow} receiveShadow>
            <planeGeometry args={[Wd, L]} />
            <primitive object={m} attach="material" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.009, 0]} material={gold()} castShadow={castShadow}>
        <cylinderGeometry args={[0.0042, 0.0042, 0.012, 20]} />
      </mesh>
    </group>
  )
}

/* ───────────────────────────── 펜 꽂이 ───────────────────────────── */

export function PencilCup({ castShadow }: { castShadow: boolean }) {
  const cup = useDisposable(() => {
    // 벽 두께가 있는 세라믹 컵 (안쪽 · 바깥쪽 프로파일)
    const pts = [
      [0, 0],
      [0.034, 0],
      [0.037, 0.004],
      [0.037, 0.098],
      [0.0345, 0.1],
      [0.0325, 0.096],
      [0.0325, 0.006],
      [0, 0.006],
    ].map(([r, y]) => new THREE.Vector2(r, y))
    return new THREE.LatheGeometry(pts, 48)
  })
  const tools: { r: number; len: number; tilt: [number, number]; kind: 'pencil' | 'brush' | 'pen' }[] = [
    { r: 0.0042, len: 0.17, tilt: [0.16, 0.1], kind: 'pencil' },
    { r: 0.0042, len: 0.16, tilt: [-0.12, 0.18], kind: 'pencil' },
    { r: 0.004, len: 0.19, tilt: [0.06, -0.18], kind: 'brush' },
    { r: 0.005, len: 0.15, tilt: [-0.2, -0.06], kind: 'pen' },
  ]
  return (
    <group position={at(PROPS.pencilCup)}>
      <mesh geometry={cup} material={ivoryGloss()} castShadow={castShadow} receiveShadow />
      <mesh position={[0, 0.099, 0]} rotation={[Math.PI / 2, 0, 0]} material={gold()}>
        <torusGeometry args={[0.0352, 0.0018, 10, 48]} />
      </mesh>
      {tools.map((t, i) => (
        <group key={i} position={[(i % 2 ? 1 : -1) * 0.01, 0.006, (i < 2 ? 1 : -1) * 0.009]} rotation={[t.tilt[0], 0, t.tilt[1]]}>
          {t.kind === 'pencil' && (
            <>
              <mesh position={[0, t.len / 2, 0]} castShadow={castShadow}>
                <cylinderGeometry args={[t.r, t.r, t.len, 6]} />
                <meshStandardMaterial color={i ? '#d9cdef' : '#f3ebdd'} roughness={0.5} />
              </mesh>
              <mesh position={[0, t.len + 0.008, 0]} material={goldBright()}>
                <cylinderGeometry args={[t.r * 1.02, t.r * 1.02, 0.012, 12]} />
              </mesh>
            </>
          )}
          {t.kind === 'brush' && (
            <>
              <mesh position={[0, t.len / 2, 0]} castShadow={castShadow}>
                <cylinderGeometry args={[t.r * 0.7, t.r, t.len, 16]} />
                <meshStandardMaterial color="#3a3140" roughness={0.3} />
              </mesh>
              <mesh position={[0, t.len + 0.012, 0]} material={gold()}>
                <cylinderGeometry args={[t.r * 0.75, t.r * 0.7, 0.024, 16]} />
              </mesh>
              <mesh position={[0, t.len + 0.034, 0]} material={graphite()}>
                <coneGeometry args={[t.r * 0.72, 0.022, 16]} />
              </mesh>
            </>
          )}
          {t.kind === 'pen' && (
            <mesh position={[0, t.len / 2, 0]} material={gold()} castShadow={castShadow}>
              <cylinderGeometry args={[t.r, t.r, t.len, 24]} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

/* ───────────────────────────── 데스크 램프 ───────────────────────────── */

/** 황동 데스크 램프 — 갓 안에서 따뜻한 스포트라이트가 다이어리를 비춥니다 */
export function Lamp({ shadowMapSize }: { shadowMapSize: number }) {
  const shade = useDisposable(() => {
    const pts = [
      [0.012, 0],
      [0.03, 0.01],
      [0.07, 0.062],
      [0.074, 0.066],
    ].map(([r, y]) => new THREE.Vector2(r, -y))
    return new THREE.LatheGeometry(pts, 48)
  })
  const target = useMemo(() => new THREE.Object3D(), [])
  const [x, z] = PROPS.lamp
  // 갓 위치 (책상 기준)
  const head: [number, number, number] = [-0.19, 0.36, 0.12]
  const armLen = Math.hypot(head[0], head[1] - 0.04, head[2])
  return (
    <group position={[x, TOP, z]}>
      <primitive object={target} position={[-0.66, 0, 0.32]} />
      {/* 받침 */}
      <mesh position={[0, 0.008, 0]} material={gold()} castShadow receiveShadow>
        <cylinderGeometry args={[0.07, 0.078, 0.016, 48]} />
      </mesh>
      <mesh position={[0, 0.02, 0]} material={goldBright()}>
        <cylinderGeometry args={[0.022, 0.03, 0.01, 32]} />
      </mesh>
      {/* 팔 — 받침에서 갓까지 기울어진 막대 */}
      <mesh
        position={[head[0] / 2, (head[1] + 0.04) / 2, head[2] / 2]}
        quaternion={new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(head[0], head[1] - 0.04, head[2]).normalize(),
        )}
        material={gold()}
        castShadow
      >
        <cylinderGeometry args={[0.0045, 0.0055, armLen, 16]} />
      </mesh>
      <group position={head} rotation={[0.35, 0, 0.55]}>
        <mesh material={goldBright()} castShadow>
          <sphereGeometry args={[0.012, 20, 12]} />
        </mesh>
        <mesh geometry={shade}>
          <meshPhysicalMaterial color="#f5eee2" roughness={0.45} clearcoat={0.5} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.03, 0]} material={bulb()}>
          <sphereGeometry args={[0.016, 20, 12]} />
        </mesh>
        <spotLight
          position={[0, -0.03, 0]}
          target={target}
          color="#ffdcae"
          intensity={2.2}
          angle={0.62}
          penumbra={0.9}
          distance={2.4}
          decay={1.6}
          castShadow
          shadow-mapSize={[shadowMapSize, shadowMapSize]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.01}
          shadow-camera-near={0.02}
          shadow-radius={5}
        />
      </group>
    </group>
  )
}

/* ───────────────────────────── 스케치 카드 · 문진 · 열쇠 ───────────────────────────── */

export function Sketches({ castShadow }: { castShadow: boolean }) {
  const maps = useMemo(() => [drawSketch(2), drawSketch(3)], [])
  useEffect(() => () => maps.forEach((m) => m.dispose()), [maps])
  return (
    <group position={at(PROPS.sketches)}>
      {maps.map((map, i) => (
        <mesh
          key={i}
          position={[i * 0.03, 0.0012 + i * 0.0014, i * 0.02]}
          rotation={[-Math.PI / 2, 0, 0.12 - i * 0.2]}
          castShadow={castShadow}
          receiveShadow
        >
          <boxGeometry args={[0.2, 0.14, 0.0012]} />
          <meshStandardMaterial map={map} roughness={0.85} envMapIntensity={0.4} />
        </mesh>
      ))}
    </group>
  )
}

/** 금색 받침 위의 유리 구슬 — 마법의 아틀리에를 상징하는 문진 */
export function Orb() {
  return (
    <group position={at(PROPS.orb)}>
      <mesh position={[0, 0.006, 0]} material={gold()} castShadow>
        <cylinderGeometry args={[0.028, 0.032, 0.012, 40]} />
      </mesh>
      <mesh position={[0, 0.013, 0]} rotation={[Math.PI / 2, 0, 0]} material={goldBright()}>
        <torusGeometry args={[0.022, 0.0025, 10, 40]} />
      </mesh>
      <mesh position={[0, 0.046, 0]} renderOrder={2}>
        <sphereGeometry args={[0.036, 48, 32]} />
        <primitive object={glass()} attach="material" />
      </mesh>
      {/* 구슬 안의 작은 금빛 별 */}
      <mesh position={[0, 0.046, 0]} material={goldBright()}>
        <octahedronGeometry args={[0.008, 0]} />
      </mesh>
    </group>
  )
}

/** 다이어리 옆의 작은 금 열쇠 — Unlock My World */
export function Key({ castShadow }: { castShadow: boolean }) {
  return (
    <group position={at(PROPS.key, 0.0022)} rotation={[0, 0.9, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={gold()} castShadow={castShadow}>
        <torusGeometry args={[0.011, 0.0022, 12, 32]} />
      </mesh>
      <mesh position={[0.034, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={gold()} castShadow={castShadow}>
        <cylinderGeometry args={[0.0019, 0.0019, 0.046, 12]} />
      </mesh>
      <mesh position={[0.05, 0, 0.0045]} material={gold()} castShadow={castShadow}>
        <boxGeometry args={[0.004, 0.003, 0.007]} />
      </mesh>
      <mesh position={[0.042, 0, 0.0035]} material={gold()} castShadow={castShadow}>
        <boxGeometry args={[0.003, 0.003, 0.005]} />
      </mesh>
    </group>
  )
}
