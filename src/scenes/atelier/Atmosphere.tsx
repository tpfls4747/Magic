import { Sparkles } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import { HALL, PALETTE } from './constants'
import { archedWallShape } from './geometry'

/**
 * 포털과 오큘러스 너머로 보이는 몽환적인 빛의 배경.
 * 아래쪽은 따뜻한 아이보리, 위로 갈수록 아주 옅은 라벤더로 번집니다.
 */
function Backdrop() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uGlow: { value: new THREE.Color('#fbeed6') },
          uMid: { value: new THREE.Color('#e8dde6') },
          uTop: { value: new THREE.Color('#c9badf') },
          uIntensity: { value: 1.12 },
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
            // 위로 갈수록 라벤더빛 하늘
            vec3 col = mix(uMid, uTop, smoothstep(0.3, 0.95, vUv.y));
            // 지평선을 따라 낮게 깔린 샴페인빛 — 넓고 부드럽게
            float horizon = exp(-pow((vUv.y - 0.2) / 0.11, 2.0));
            float center = smoothstep(0.75, 0.0, abs(vUv.x - 0.5) * 1.4);
            col = mix(col, uGlow, horizon * (0.55 + 0.45 * center));
            gl_FragColor = vec4(col * uIntensity, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
        fog: false,
        depthWrite: false,
      }),
    [],
  )

  return (
    <mesh position={[0, 7, HALL.backZ - 12]} material={material}>
      <planeGeometry args={[44, 24]} />
    </mesh>
  )
}

/**
 * 포털 너머 안개 속으로 이어지는 또 하나의 아치 회랑.
 * 빛 한 덩어리 대신 겹겹의 공간이 보이도록 해 깊이감을 만듭니다.
 */
function DistantArcade() {
  const geometry = useMemo(() => {
    const shape = archedWallShape(18, 9, [
      { x: -5.2, width: 2.6, spring: 3.6 },
      { x: 0, width: 3.2, spring: 4.2 },
      { x: 5.2, width: 2.6, spring: 3.6 },
    ])
    return new THREE.ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: false, curveSegments: 48 })
  }, [])
  return (
    <mesh geometry={geometry} position={[0, 0, HALL.backZ - 6.5]}>
      <meshStandardMaterial color="#e9e0dc" roughness={0.95} envMapIntensity={0.7} />
    </mesh>
  )
}

export function Atmosphere({ quality, animate }: { quality: 'high' | 'low'; animate: boolean }) {
  return (
    <>
      <Backdrop />
      <DistantArcade />
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
