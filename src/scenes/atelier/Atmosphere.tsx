import { Sparkles } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import { HALL, PALETTE } from './constants'

/**
 * 포털과 오큘러스 너머로 보이는 몽환적인 빛의 배경.
 * 아래쪽은 따뜻한 아이보리, 위로 갈수록 아주 옅은 라벤더로 번집니다.
 */
function Backdrop() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uGlow: { value: new THREE.Color('#fffaf2') },
          uMid: { value: new THREE.Color('#f8efe4') },
          uTop: { value: new THREE.Color('#e4dbef') },
          uIntensity: { value: 1.0 },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uGlow;
          uniform vec3 uMid;
          uniform vec3 uTop;
          uniform float uIntensity;
          varying vec2 vUv;
          void main() {
            vec3 col = mix(uMid, uTop, smoothstep(0.35, 1.0, vUv.y));
            // 포털 중심의 부드러운 광륜
            float d = distance(vUv * vec2(1.6, 1.0), vec2(0.8, 0.22));
            col = mix(col, uGlow, smoothstep(0.55, 0.0, d));
            gl_FragColor = vec4(col * uIntensity, 1.0);
            #include <colorspace_fragment>
          }
        `,
        fog: false,
        toneMapped: false,
        depthWrite: false,
      }),
    [],
  )

  return (
    <mesh position={[0, 7, HALL.backZ - 7]} material={material}>
      <planeGeometry args={[44, 24]} />
    </mesh>
  )
}

export function Atmosphere({ quality, animate }: { quality: 'high' | 'low'; animate: boolean }) {
  return (
    <>
      <Backdrop />
      {/* 공기 중에 떠다니는 미세한 금빛 입자 */}
      <Sparkles
        count={quality === 'high' ? 70 : 36}
        scale={[10, 5, 18]}
        position={[0, 2.8, -5]}
        size={2.2}
        speed={animate ? 0.18 : 0}
        opacity={0.55}
        color={PALETTE.champagneLight}
        noise={0.6}
      />
    </>
  )
}
