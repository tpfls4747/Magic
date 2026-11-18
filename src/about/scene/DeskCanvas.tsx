import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useRef } from 'react'
import * as THREE from 'three'
import type { AboutContent, DeskObjectLink } from '../types'
import { CameraDirector } from './CameraDirector'
import { Desk, Room } from './Desk'
import { DeskLighting } from './DeskLighting'
import { Diary } from './Diary'
import type { DiaryAnim } from './diaryAnim'
import { Interactive } from './Interactive'
import { PROPS, DESK } from './layout'
import { Key, Lamp, Memo, Orb, PencilCup, Pen, Sketches, Swatches } from './props/Props'

type DeskObject = DeskObjectLink['object']

export interface DeskCanvasProps {
  content: AboutContent
  quality: 'high' | 'low'
  open: boolean
  spread: number
  reducedMotion: boolean
  /** 화면에 보이는 동안만 렌더링 */
  active: boolean
  /** 호버 또는 키보드 포커스로 강조 중인 소품 */
  highlighted: DeskObject | null
  readingInset: number
  anim: DiaryAnim
  onHighlight: (object: DeskObject | null) => void
  onSelect: (object: DeskObject) => void
  onTurn: (dir: 1 | -1) => void
  onOpened: () => void
  onClosed: () => void
  /** 장면의 첫 프레임들이 그려진 뒤 한 번 호출 */
  onReady?: () => void
}

/** 셰이더 컴파일과 첫 렌더가 끝난 뒤(몇 프레임 후) 한 번 알림 */
function FirstFrames({ onDone }: { onDone?: () => void }) {
  const frames = useRef(0)
  useFrame(() => {
    if (frames.current > 3) return
    frames.current += 1
    if (frames.current === 3) onDone?.()
  })
  return null
}

/** 소품 → 라벨 */
const labelOf = (content: AboutContent, o: DeskObject) =>
  content.deskObjects.find((d) => d.object === o)?.label ?? o

/**
 * Designer's Desk 3D 캔버스.
 * DOM 쪽 상태(open, spread, highlighted)를 받아 그리기만 하며, 사용자의 3D 조작은 콜백으로 올려 보냅니다.
 */
export function DeskCanvas(props: DeskCanvasProps) {
  const { content, quality, open, spread, reducedMotion, active, highlighted, anim } = props
  const shadows = quality === 'high'
  const hoverRef = useRef<DeskObject | null>(null)

  const hover = (o: DeskObject) => (on: boolean) => {
    if (on) {
      hoverRef.current = o
      props.onHighlight(o)
    } else if (hoverRef.current === o) {
      hoverRef.current = null
      props.onHighlight(null)
    }
  }
  const propsDisabled = open

  return (
    <Canvas
      shadows="percentage"
      dpr={quality === 'high' ? [1, 2] : [1, 1.5]}
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: 32, near: 0.03, far: 20, position: [0, 1.45, 1.3] }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.86,
      }}
      onPointerMissed={() => props.onHighlight(null)}
      aria-hidden="true"
    >
      <color attach="background" args={['#ece2d6']} />
      <fog attach="fog" args={['#ece2d6', 3.2, 8]} />
      <CameraDirector anim={anim} reducedMotion={reducedMotion} readingInset={props.readingInset} />
      <Suspense fallback={null}>
        <DeskLighting quality={quality} />
        <Room />
        <Desk />
        <Diary
          content={content}
          quality={quality}
          open={open}
          spread={spread}
          reducedMotion={reducedMotion}
          hovered={highlighted === 'diary'}
          anim={anim}
          onHover={hover('diary')}
          onActivate={() => props.onSelect('diary')}
          onTurn={props.onTurn}
          onOpened={props.onOpened}
          onClosed={props.onClosed}
        />

        <Interactive
          active={highlighted === 'memo'}
          disabled={propsDisabled}
          label={labelOf(content, 'memo')}
          labelAt={[PROPS.memo[0], DESK.top + 0.08, PROPS.memo[1]]}
          reducedMotion={reducedMotion}
          onHover={hover('memo')}
          onActivate={() => props.onSelect('memo')}
        >
          <Memo castShadow={shadows} />
        </Interactive>
        <Interactive
          active={highlighted === 'swatches'}
          disabled={propsDisabled}
          label={labelOf(content, 'swatches')}
          labelAt={[PROPS.swatches[0], DESK.top + 0.08, PROPS.swatches[1]]}
          reducedMotion={reducedMotion}
          onHover={hover('swatches')}
          onActivate={() => props.onSelect('swatches')}
        >
          <Swatches castShadow={shadows} />
        </Interactive>
        <Interactive
          active={highlighted === 'pencil-cup'}
          disabled={propsDisabled}
          label={labelOf(content, 'pencil-cup')}
          labelAt={[PROPS.pencilCup[0], DESK.top + 0.25, PROPS.pencilCup[1]]}
          lift={0.016}
          reducedMotion={reducedMotion}
          onHover={hover('pencil-cup')}
          onActivate={() => props.onSelect('pencil-cup')}
        >
          <PencilCup castShadow={shadows} />
        </Interactive>

        {/* 장식 소품 */}
        <Lamp shadowMapSize={quality === 'high' ? 1024 : 512} />
        <Pen castShadow={shadows} />
        <Sketches castShadow={shadows} />
        <Orb />
        <Key castShadow={shadows} />
        <FirstFrames onDone={props.onReady} />
      </Suspense>
    </Canvas>
  )
}
