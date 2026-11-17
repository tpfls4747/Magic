import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { AboutContent } from '../types'
import { bendLeaf, createBoardGeometry, createLeafGeometry } from './diaryGeometry'
import { DESK, DIARY, DIARY_PLACEMENT } from './layout'
import { gildedEdge, leather, paper } from './materials'
import { drawCover, drawEndpaper, drawPage, loadPageFonts, type PageKind } from './pageArt'
import type { DiaryAnim } from './diaryAnim'
import { ease, segment, easeInOut } from './diaryAnim'

const { pageW, pageH, coverW, coverH, coverT, blockT, leafGap: gap, leafSegments: SEG } = DIARY

/* 높이 계산 — diaryGeometry.ts 의 좌표계 설명 참고 */
const Y_BLOCK_TOP = coverT + blockT
/** 낱장 순서: 0 = 장식 1, 1 = 장식 2(목차), 2 = 낱장 A, 3 = 낱장 B */
const LEAF_COUNT = 4
const yRight = (k: number) => Y_BLOCK_TOP + gap * (2 + (LEAF_COUNT - 1 - k))
const Y_COVER = Y_BLOCK_TOP + gap * (LEAF_COUNT + 2)
/** 펼친 앞표지가 책상에 닿도록 기울이는 각도 */
const COVER_SLOPE = Math.asin((Y_COVER - coverT * 0.4) / coverW)
const yLeft = (k: number) => Y_COVER + gap * (k + 2)

/** 펼침면별 페이지 구성 (앞면 = 오른쪽 페이지, 뒷면 = 왼쪽 페이지) */
const LEAVES: { front: PageKind; back: PageKind }[] = [
  { front: { kind: 'title' }, back: { kind: 'ornament' } },
  { front: { kind: 'contents' }, back: { kind: 'section-left', page: 0 } },
  { front: { kind: 'section-right', page: 0 }, back: { kind: 'section-left', page: 1 } },
  { front: { kind: 'section-right', page: 1 }, back: { kind: 'section-left', page: 2 } },
]
const LAST_RIGHT: PageKind = { kind: 'section-right', page: 2 }

/** 표지 금박에 흐르는 빛 (셰이더 uniform) */
class FoilUniforms {
  uniforms = { uSweep: { value: -1 }, uGlow: { value: 0 }, uStatic: { value: 0 } }
  set(sweep: number, glow: number, base: number) {
    this.uniforms.uSweep.value = sweep
    this.uniforms.uGlow.value = glow
    this.uniforms.uStatic.value = base
  }
}

/** 다이어리 여닫기 · 넘기기 시간 (초) */
const OPEN_DURATION = 2.7
const CLOSE_DURATION = 2.1
const FLIP_DURATION = 0.95

interface DiaryProps {
  content: AboutContent
  quality: 'high' | 'low'
  open: boolean
  spread: number
  reducedMotion: boolean
  hovered: boolean
  anim: DiaryAnim
  onHover: (hovered: boolean) => void
  onActivate: () => void
  onTurn: (dir: 1 | -1) => void
  onOpened: () => void
  onClosed: () => void
}

function useDiaryTextures(content: AboutContent, quality: 'high' | 'low') {
  const [fontsReady, setFontsReady] = useState(false)
  useEffect(() => {
    let alive = true
    loadPageFonts().then(() => alive && setFontsReady(true))
    return () => {
      alive = false
    }
  }, [])

  const textures = useMemo(() => {
    if (!fontsReady) return null
    const px = quality === 'high' ? 1024 : 720
    const mirror = (t: THREE.Texture) => {
      t.wrapS = THREE.RepeatWrapping
      t.repeat.x = -1
      t.offset.x = 1
      return t
    }
    return {
      leaves: LEAVES.map((l) => ({
        front: drawPage(l.front, 'right', content, px),
        back: mirror(drawPage(l.back, 'left', content, px)),
      })),
      lastRight: drawPage(LAST_RIGHT, 'right', content, px),
      endpaper: drawEndpaper(quality === 'high' ? 512 : 384),
      cover: drawCover(quality === 'high' ? 1024 : 640),
    }
  }, [fontsReady, content, quality])

  useEffect(
    () => () => {
      if (!textures) return
      for (const l of textures.leaves) {
        l.front.dispose()
        l.back.dispose()
      }
      textures.lastRight.dispose()
      textures.endpaper.dispose()
      textures.cover.map.dispose()
      textures.cover.metalnessMap.dispose()
      textures.cover.roughnessMap.dispose()
    },
    [textures],
  )
  return textures
}

/**
 * 3D 다이어리.
 * - 닫힘: 책상 위 비스듬히 놓인 하드커버. 금박 테두리에 주기적으로 빛이 흐르며 선택 가능함을 알림
 * - 호버: 살짝 들리고 금박에 빛이 계속 흐름
 * - 열기: 정렬 → 앞표지 회전 → 장식 낱장 두 장이 넘어가며 첫 펼침면 도착
 * - 펼침면 이동: 실제 낱장 메시가 휘어지며 넘어감
 */
export function Diary(props: DiaryProps) {
  const { content, quality, open, spread, reducedMotion, hovered, anim } = props
  const textures = useDiaryTextures(content, quality)

  const root = useRef<THREE.Group>(null)
  const coverPivot = useRef<THREE.Group>(null)
  const lift = useRef(0)
  const leafProgress = useRef([0, 0])
  const prevP = useRef(0)
  const timeline = useRef(0)

  // 최신 콜백을 프레임 루프에서 사용
  const cb = useRef(props)
  useLayoutEffect(() => {
    cb.current = props
  })

  const geoms = useMemo(
    () => ({
      board: createBoardGeometry(coverW, coverH, coverT, 0.006),
      leaves: Array.from({ length: LEAF_COUNT }, () => createLeafGeometry(pageW, pageH, SEG)),
      flat: new THREE.PlaneGeometry(pageW, pageH).rotateX(-Math.PI / 2).translate(pageW / 2, 0, 0),
      endpaper: new THREE.PlaneGeometry(coverW - 0.004, coverH - 0.004)
        .rotateX(Math.PI / 2)
        .translate(coverW / 2, -0.0003, 0),
    }),
    [],
  )
  useEffect(
    () => () => {
      geoms.board.dispose()
      geoms.flat.dispose()
      geoms.endpaper.dispose()
      for (const g of geoms.leaves) g.dispose()
    },
    [geoms],
  )

  // 금박에 빛이 흐르는 표지 머티리얼
  const [foil] = useState(() => new FoilUniforms())
  const coverMat = useMemo(() => {
    const cover = new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      roughness: 0.78,
      metalness: 1,
      clearcoat: 0.15,
      clearcoatRoughness: 0.5,
      sheen: 0.25,
      sheenColor: new THREE.Color('#d8cdef'),
      envMapIntensity: 1.1,
    })
    if (textures) {
      cover.map = textures.cover.map
      cover.metalnessMap = textures.cover.metalnessMap
      cover.roughnessMap = textures.cover.roughnessMap
    } else {
      cover.color.set('#6c5c96')
      cover.metalness = 0
    }
    cover.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, foil.uniforms)
      shader.fragmentShader =
        'uniform float uSweep;\nuniform float uGlow;\nuniform float uStatic;\n' +
        shader.fragmentShader.replace(
          '#include <emissivemap_fragment>',
          `#include <emissivemap_fragment>
          #ifdef USE_METALNESSMAP
            float foilMask = texture2D(metalnessMap, vMetalnessMapUv).g;
            float sweepD = (vMetalnessMapUv.x * 0.7 + vMetalnessMapUv.y) - uSweep;
            float band = exp(-sweepD * sweepD * 70.0);
            totalEmissiveRadiance += vec3(1.0, 0.82, 0.55) * foilMask * (band * uGlow + uStatic);
          #endif`,
        )
    }
    return cover
  }, [textures, foil])
  useEffect(() => () => coverMat.dispose(), [coverMat])

  const mats = useMemo(() => {
    const pageMat = (map?: THREE.Texture, side: THREE.Side = THREE.FrontSide) =>
      new THREE.MeshStandardMaterial({
        // 흰 종이가 조명에 하얗게 날아가지 않도록 살짝 낮춘 반사율 → 글자 대비 확보
        color: '#efe8de',
        map: map ?? null,
        roughness: 0.92,
        side,
        envMapIntensity: 0.25,
        // 넘기는 낱장이 양면 모두 그림자를 만들도록
        shadowSide: THREE.DoubleSide,
      })
    return { pageMat }
  }, [])

  // 텍스처가 준비되면 머티리얼에 연결
  const leafMats = useMemo(
    () =>
      LEAVES.map((_, i) => ({
        front: mats.pageMat(textures?.leaves[i].front),
        back: mats.pageMat(textures?.leaves[i].back, THREE.BackSide),
      })),
    [mats, textures],
  )
  const lastRightMat = useMemo(() => mats.pageMat(textures?.lastRight), [mats, textures])
  // 면지는 닫혔을 때 아래(-y)를 향하고, 표지가 펼쳐지면 위를 향합니다 (앞면)
  const endpaperMat = useMemo(() => mats.pageMat(textures?.endpaper), [mats, textures])
  useEffect(
    () => () => {
      for (const m of leafMats) {
        m.front.dispose()
        m.back.dispose()
      }
      lastRightMat.dispose()
      endpaperMat.dispose()
    },
    [leafMats, lastRightMat, endpaperMat],
  )

  // 표지 측면은 가죽, 윗면(그림) · 아랫면은 표지 머티리얼
  const coverMaterials = useMemo(() => [coverMat, leather()], [coverMat])
  const backMaterials = useMemo(() => [leather(), leather()], [])
  const blockMaterials = useMemo(
    () => [gildedEdge(), paper(), paper(), paper(), gildedEdge(), gildedEdge()],
    [],
  )

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const target = open ? 1 : 0
    const lp = leafProgress.current
    const leafTargets = [open && spread >= 1 ? 1 : 0, open && spread >= 2 ? 1 : 0]

    let p = timeline.current
    if (reducedMotion) {
      p = target
      lp[0] = p >= 1 ? leafTargets[0] : 0
      lp[1] = p >= 1 ? leafTargets[1] : 0
    } else {
      // 닫을 때는 펼친 낱장을 먼저 되돌린 뒤 표지를 닫습니다
      const leavesOut = lp[0] > 0.001 || lp[1] > 0.001
      if (!(target === 0 && leavesOut)) {
        const dur = target ? OPEN_DURATION : CLOSE_DURATION
        p = THREE.MathUtils.clamp(p + Math.sign(target - p) * (dt / dur), 0, 1)
      }
      const step = dt / FLIP_DURATION
      const canFlip = p >= 1 || target === 0
      if (canFlip) {
        // 여러 장을 넘길 때 한 장씩 시차를 두고
        const t0 = leafTargets[0]
        const t1 = leafTargets[1]
        if (t0 > lp[0]) lp[0] = Math.min(t0, lp[0] + step)
        else if (t0 < lp[0] && lp[1] <= 0.55) lp[0] = Math.max(t0, lp[0] - step)
        if (t1 > lp[1] && lp[0] >= 0.45) lp[1] = Math.min(t1, lp[1] + step)
        else if (t1 < lp[1]) lp[1] = Math.max(t1, lp[1] - step)
      }
    }

    // 단계별 진행도
    timeline.current = p
    const camT = ease(segment(p, 0, 0.42))
    anim.update(p, camT)
    const cover = easeInOut(segment(p, 0.28, 0.62))
    const d1 = easeInOut(segment(p, 0.5, 0.82))
    const d2 = easeInOut(segment(p, 0.6, 0.94))

    // 정렬 이동 + 호버 들림
    const g = root.current
    if (g) {
      const c = DIARY_PLACEMENT.closed
      const o = DIARY_PLACEMENT.open
      const m = camT
      const wantLift = hovered && p === 0 ? 0.014 : 0
      lift.current = reducedMotion ? wantLift : THREE.MathUtils.damp(lift.current, wantLift, 9, dt)
      // 닫힌 상태에서 그룹 원점(책등)이 다이어리 중심 왼쪽에 오도록 보정
      g.position.set(
        THREE.MathUtils.lerp(c.x - pageW / 2, o.x, m),
        DESK.top + lift.current,
        THREE.MathUtils.lerp(c.z, o.z, m),
      )
      g.rotation.y = THREE.MathUtils.lerp(c.yaw, o.yaw, m)
      // 들릴 때 아주 살짝 기울어 손에 잡히는 느낌
      g.rotation.z = lift.current * 0.9
    }
    if (coverPivot.current) coverPivot.current.rotation.z = cover * (Math.PI - COVER_SLOPE)

    const flips = [d1, d2, easeInOut(lp[0]), easeInOut(lp[1])]
    for (let k = 0; k < LEAF_COUNT; k++) {
      bendLeaf(geoms.leaves[k], pageW, SEG, {
        t: flips[k],
        yRight: yRight(k),
        yLeft: yLeft(k),
        slopeLeft: COVER_SLOPE,
        curl: k < 2 ? 0.8 : 1,
      })
    }

    // 금박 빛 흐름: 닫혀 있을 때 6초마다 은은하게, 호버하면 계속
    const time = state.clock.elapsedTime
    if (reducedMotion) {
      foil.set(-1, 0, hovered && p === 0 ? 0.35 : 0.05)
    } else {
      const period = hovered ? 2.2 : 6
      const phase = (time % period) / period
      const u = foil.uniforms
      const wantGlow = p > 0.05 ? 0 : hovered ? 1.1 : 0.45
      foil.set(
        phase * 2.6 - 0.5,
        THREE.MathUtils.damp(u.uGlow.value, wantGlow, 6, dt),
        THREE.MathUtils.damp(u.uStatic.value, hovered && p === 0 ? 0.12 : 0.02, 6, dt),
      )
    }

    // 여닫기 완료 알림
    if (prevP.current < 1 && p >= 1) cb.current.onOpened()
    if (prevP.current > 0 && p <= 0) cb.current.onClosed()
    prevP.current = p
  })

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (timeline.current <= 0) {
      cb.current.onActivate()
      return
    }
    if (timeline.current >= 1 && root.current) {
      const local = root.current.worldToLocal(e.point.clone())
      cb.current.onTurn(local.x >= 0 ? 1 : -1)
    }
  }

  const castShadow = true

  return (
    <group
      ref={root}
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation()
        cb.current.onHover(true)
      }}
      onPointerOut={() => cb.current.onHover(false)}
    >
      {/* 뒤표지 */}
      <mesh geometry={geoms.board} material={backMaterials} castShadow={castShadow} receiveShadow />
      {/* 책등 */}
      <mesh
        position={[-0.0012, Y_COVER / 2 + coverT / 2, 0]}
        material={leather()}
        castShadow={castShadow}
        receiveShadow
      >
        <boxGeometry args={[coverT * 0.95, Y_COVER + coverT, coverH]} />
      </mesh>
      {/* 내지 묶음 (금박 단면) */}
      <mesh
        position={[0.0015 + (pageW - 0.0015) / 2, coverT + blockT / 2, 0]}
        material={blockMaterials}
        castShadow={castShadow}
        receiveShadow
      >
        <boxGeometry args={[pageW - 0.0015, blockT, pageH]} />
      </mesh>
      {/* 마지막 펼침면의 오른쪽 페이지 */}
      <mesh geometry={geoms.flat} position={[0, Y_BLOCK_TOP + gap, 0]} material={lastRightMat} receiveShadow />
      {/* 넘어가는 낱장 */}
      {geoms.leaves.map((geom, k) => (
        <group key={k}>
          <mesh geometry={geom} material={leafMats[k].front} castShadow={castShadow} receiveShadow frustumCulled={false} />
          <mesh geometry={geom} material={leafMats[k].back} receiveShadow frustumCulled={false} />
        </group>
      ))}
      {/* 앞표지 — 책등 위쪽 모서리를 축으로 회전 */}
      <group ref={coverPivot} position={[0, Y_COVER, 0]}>
        <mesh geometry={geoms.board} material={coverMaterials} castShadow={castShadow} receiveShadow />
        <mesh geometry={geoms.endpaper} material={endpaperMat} receiveShadow />
      </group>
      {/* 가름끈 (라벤더 새틴) */}
      <mesh position={[0.112, 0.0006, pageH / 2 + 0.026]} rotation={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[0.0065, 0.0008, 0.06]} />
        <meshStandardMaterial color="#b9a6dc" roughness={0.35} metalness={0.1} />
      </mesh>
    </group>
  )
}
