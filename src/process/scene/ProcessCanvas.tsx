import { Environment, Lightformer } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import type { ProcessContent } from '../types'
import { loadArtFonts } from './art'
import { StageArtifacts } from './Artifacts'
import { Board, Room } from './Board'
import { CameraDirector } from './CameraDirector'
import { GoldThread } from './GoldThread'
import { getLayout, type BoardOrientation } from './layout'
import { StageCard, type FocusFrame } from './StageCard'

export interface ProcessCanvasProps {
  content: ProcessContent
  orientation: BoardOrientation
  quality: 'high' | 'low'
  selected: number | null
  highlighted: number | null
  reducedMotion: boolean
  /** 화면에 보일 때만 렌더링 */
  active: boolean
  focus: FocusFrame
  /** 3D 보드를 피해야 할 화면 가장자리 비율 (소개 글 · 메뉴 영역) */
  insets: { left: number; top: number; bottom: number }
  onHover: (i: number | null) => void
  onSelect: (i: number) => void
}

function Lighting({ quality, height }: { quality: 'high' | 'low'; height: number }) {
  const target = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.set(0, height, 0)
    return o
  }, [height])
  const map = quality === 'high' ? 2048 : 1024
  return (
    <>
      <primitive object={target} />
      <hemisphereLight args={['#fff4e6', '#cbbfe6', 0.42]} />
      {/* 왼쪽 위 창가의 따뜻한 주광 — 카드가 떠오르면 그림자가 보드에서 멀어집니다 */}
      <directionalLight
        position={[-2.4, height + 2.6, 3.2]}
        target={target}
        color="#fff0dc"
        intensity={2.1}
        castShadow
        shadow-mapSize={[map, map]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.01}
        shadow-radius={5}
        shadow-camera-left={-2.4}
        shadow-camera-right={2.4}
        shadow-camera-top={2.4}
        shadow-camera-bottom={-2.4}
        shadow-camera-near={0.5}
        shadow-camera-far={10}
      />
      <directionalLight position={[2.4, height + 1, 2.4]} target={target} color="#e6dcf6" intensity={0.45} />
      <Environment resolution={128} frames={1} environmentIntensity={0.45}>
        <color attach="background" args={['#e6dacb']} />
        <Lightformer form="rect" intensity={2.2} color="#fff3e2" position={[-3, 3, 3]} rotation-y={-Math.PI / 4} scale={[3, 2, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#e4dbf4" position={[3, 2, 2]} rotation-y={Math.PI / 4} scale={[2, 3, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#fffaf2" position={[0, 5, 1]} rotation-x={Math.PI / 2} scale={[5, 3, 1]} />
        <Lightformer form="rect" intensity={0.6} color="#f6efe6" position={[0, 1.5, 5]} rotation-y={Math.PI} scale={[6, 3, 1]} />
      </Environment>
    </>
  )
}

/**
 * The Process Board — 3D 캔버스.
 * DOM 상태(selected, highlighted)를 받아 그리기만 하고, 3D 조작은 콜백으로 올려 보냅니다.
 */
export function ProcessCanvas(props: ProcessCanvasProps) {
  const { content, orientation, quality, selected, highlighted, reducedMotion, active, focus } = props
  const layout = getLayout(orientation)
  const [fontsReady, setFontsReady] = useState(false)
  useEffect(() => {
    let alive = true
    loadArtFonts().then(() => alive && setFontsReady(true))
    return () => {
      alive = false
    }
  }, [])

  return (
    <Canvas
      shadows="percentage"
      dpr={quality === 'high' ? [1, 2] : [1, 1.5]}
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: 30, near: 0.05, far: 30, position: [0, 1.7, 7] }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.95,
      }}
      onPointerMissed={() => props.onHover(null)}
      aria-hidden="true"
    >
      <color attach="background" args={['#ebe2d6']} />
      <fog attach="fog" args={['#ebe2d6', 7, 16]} />
      <CameraDirector layout={layout} selected={selected} reducedMotion={reducedMotion} insets={props.insets} />
      <Suspense fallback={null}>
        <Lighting quality={quality} height={layout.centerY} />
        <Room layout={layout} />
        <Board layout={layout} />
        <GoldThread layout={layout} selected={selected} reducedMotion={reducedMotion} />
        {fontsReady &&
          content.stages.map((stage, i) => {
            const slot = layout.cards[i]
            const cx = slot.x
            const cy = layout.centerY + slot.y
            return (
              <group key={`${stage.id}-${orientation}`}>
                <StageCard
                  stage={stage}
                  index={i}
                  x={cx}
                  y={cy}
                  tilt={slot.tilt}
                  selected={selected === i}
                  hovered={highlighted === i}
                  dimmed={selected !== null && selected !== i}
                  reducedMotion={reducedMotion}
                  quality={quality}
                  focus={focus}
                  onHover={props.onHover}
                  onSelect={props.onSelect}
                />
                <StageArtifacts
                  kinds={stage.artifacts}
                  slots={layout.artifacts(i)}
                  origin={[cx, cy]}
                  active={selected === i || highlighted === i}
                  index={i}
                  reducedMotion={reducedMotion}
                />
              </group>
            )
          })}
      </Suspense>
    </Canvas>
  )
}
