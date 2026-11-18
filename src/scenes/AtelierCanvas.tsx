import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useRef, useState } from 'react'
import * as THREE from 'three'
import { WebGLGate } from '@/components/WebGLGate'
import { usePrefersReducedMotion, useQuality } from '@/hooks/useMediaQuery'
import { Architecture } from './atelier/Architecture'
import { Atmosphere } from './atelier/Atmosphere'
import { CameraRig } from './atelier/CameraRig'
import { PALETTE } from './atelier/constants'
import { Floor } from './atelier/Floor'
import { Lighting } from './atelier/Lighting'
import { Pedestals } from './atelier/Pedestals'
import { SeatSwapExhibit } from './atelier/exhibits/SeatSwapExhibit'
import { SignupExhibit } from './atelier/exhibits/SignupExhibit'
import { WebPrototypeExhibit } from './atelier/exhibits/WebPrototypeExhibit'
import './AtelierCanvas.css'

/**
 * 장면이 실제로 몇 프레임 그려진 뒤 한 번 알려줍니다.
 * (셰이더 컴파일과 첫 렌더가 끝난 시점 — 인트로의 빛을 걷어도 끊김이 없는 때)
 */
function FirstFrames({ count = 3, onDone }: { count?: number; onDone?: () => void }) {
  const frames = useRef(0)
  const done = useRef(false)
  useFrame(() => {
    if (done.current) return
    frames.current += 1
    if (frames.current >= count) {
      done.current = true
      onDone?.()
    }
  })
  return null
}

interface AtelierCanvasProps {
  /** 장면의 첫 프레임들이 그려진 뒤 한 번 호출 */
  onReady?: () => void
  /** false: 서서히 나타나는 효과 없이 바로 표시 (Intro 의 빛 아래에서 미리 준비할 때) */
  fadeIn?: boolean
}

/** The Floating Atelier — 3D 전시관 */
export function AtelierCanvas({ onReady, fadeIn = true }: AtelierCanvasProps = {}) {
  const quality = useQuality()
  const reducedMotion = usePrefersReducedMotion()
  const [ready, setReady] = useState(false)
  const animate = !reducedMotion

  return (
    <WebGLGate>
      <div className={`atelier-canvas${ready ? ' is-ready' : ''}${fadeIn ? '' : ' is-instant'}`}>
        <Canvas
          shadows="percentage"
          dpr={quality === 'high' ? [1, 1.75] : [1, 1.5]}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.92,
          }}
          onCreated={() => requestAnimationFrame(() => setReady(true))}
        >
          <color attach="background" args={[PALETTE.fog]} />
          <fog attach="fog" args={[PALETTE.fog, 22, 62]} />
          <CameraRig enableParallax={animate} reducedMotion={reducedMotion} />
          <Suspense fallback={null}>
            <Lighting quality={quality} />
            <Architecture />
            <Floor quality={quality} />
            <Pedestals />
            <SeatSwapExhibit animate={animate} castShadow={quality === 'high'} />
            <SignupExhibit animate={animate} castShadow={quality === 'high'} />
            <WebPrototypeExhibit animate={animate} castShadow={quality === 'high'} />
            <Atmosphere quality={quality} animate={animate} />
            <FirstFrames onDone={onReady} />
          </Suspense>
        </Canvas>
      </div>
    </WebGLGate>
  )
}
