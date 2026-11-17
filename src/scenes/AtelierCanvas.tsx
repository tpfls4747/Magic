import { Canvas } from '@react-three/fiber'
import { Suspense, useState } from 'react'
import * as THREE from 'three'
import { usePrefersReducedMotion, useQuality } from '@/hooks/useMediaQuery'
import { Architecture } from './atelier/Architecture'
import { Atmosphere } from './atelier/Atmosphere'
import { CameraRig } from './atelier/CameraRig'
import { PALETTE } from './atelier/constants'
import { Floor } from './atelier/Floor'
import { Lighting } from './atelier/Lighting'
import { Pedestals } from './atelier/Pedestals'
import { SeatSwapExhibit } from './atelier/exhibits/SeatSwapExhibit'
import './AtelierCanvas.css'

/** The Floating Atelier — 3D 전시관 */
export function AtelierCanvas() {
  const quality = useQuality()
  const reducedMotion = usePrefersReducedMotion()
  const [ready, setReady] = useState(false)
  const animate = !reducedMotion

  return (
    <div className={`atelier-canvas${ready ? ' is-ready' : ''}`}>
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
          <Atmosphere quality={quality} animate={animate} />
        </Suspense>
      </Canvas>
    </div>
  )
}
