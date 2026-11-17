import { forwardRef, useMemo, type ReactNode } from 'react'
import * as THREE from 'three'
import { goldTrimMaterial } from '../materials'
import { PHONE, PHONE_FACE_Z, roundedRectGeometry, roundedRectShape } from './phoneGeometry'

let shared: ReturnType<typeof build> | null = null

function build() {
  const { width: W, height: H, depth: D, cornerRadius: R, bevel: B } = PHONE
  const coreDepth = D - B * 2
  const body = new THREE.ExtrudeGeometry(roundedRectShape(W - B * 2, H - B * 2, R - B), {
    depth: coreDepth,
    bevelEnabled: true,
    bevelThickness: B,
    bevelSize: B,
    bevelSegments: 6,
    curveSegments: 24,
  })
  body.translate(0, 0, -coreDepth / 2)

  // 앞면의 얇은 검정 베젤 (평평한 면 전체)
  const bezel = roundedRectGeometry(W - B * 2 - 0.001, H - B * 2 - 0.001, R - B, 16)
  // 디스플레이 위 유리 — 반사만 더합니다
  const glass = roundedRectGeometry(W - B * 2 - 0.002, H - B * 2 - 0.002, R - B, 16)

  // 측면 버튼 (캡슐)
  const button = new THREE.CapsuleGeometry(0.0042, 0.05, 4, 12)
  const buttonShort = new THREE.CapsuleGeometry(0.0042, 0.028, 4, 12)

  // 후면 카메라 모듈
  const module = new THREE.ExtrudeGeometry(roundedRectShape(0.13, 0.13, 0.036), {
    depth: 0.004,
    bevelEnabled: true,
    bevelThickness: 0.0025,
    bevelSize: 0.0025,
    bevelSegments: 3,
    curveSegments: 16,
  })
  const lens = new THREE.CylinderGeometry(0.022, 0.024, 0.006, 40)
  lens.rotateX(Math.PI / 2)
  const lensGlass = new THREE.CircleGeometry(0.016, 40)

  return { body, bezel, glass, button, buttonShort, module, lens, lensGlass }
}

/** 라벤더빛이 도는 아이보리 무광 유리 (후면) */
const backGlassMaterial = new THREE.MeshPhysicalMaterial({
  color: '#ece4f0',
  roughness: 0.38,
  metalness: 0,
  clearcoat: 1,
  clearcoatRoughness: 0.12,
  envMapIntensity: 1,
})

const bezelMaterial = new THREE.MeshStandardMaterial({
  color: '#141118',
  roughness: 0.35,
  metalness: 0,
})

/**
 * 전면 유리 — 바탕색은 더하지 않고(가산 혼합 + 검정) 환경 반사와 하이라이트만 얹습니다.
 * 화면 콘텐츠를 가리지 않으면서 유리 표면처럼 보이게 합니다.
 */
const frontGlassMaterial = new THREE.MeshPhysicalMaterial({
  color: '#000000',
  roughness: 0.05,
  metalness: 0,
  clearcoat: 1,
  clearcoatRoughness: 0.03,
  envMapIntensity: 2.2,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
})

const lensMaterial = new THREE.MeshPhysicalMaterial({
  color: '#1a1620',
  roughness: 0.1,
  metalness: 0.2,
  clearcoat: 1,
  clearcoatRoughness: 0.02,
})

/**
 * 전시용 3D 스마트폰 본체.
 * 화면 콘텐츠는 children 으로 받아 화면 좌표계(중심 원점, +z 가 화면 바깥) 안에 배치합니다.
 */
export interface PhoneProps {
  castShadow?: boolean
  /** 화면 콘텐츠 (화면 중심 기준 좌표계, z=0 이 디스플레이 표면) */
  children?: ReactNode
}

export const Phone = forwardRef<THREE.Group, PhoneProps>(function Phone(
  { castShadow = true, children },
  ref,
) {
  shared ??= build()
  const g = shared
  const { width: W, height: H } = PHONE
  const faceZ = PHONE_FACE_Z

  const buttons = useMemo(
    () => [
      { geo: g.buttonShort, pos: [-W / 2 - 0.0012, 0.2, 0] as const },
      { geo: g.button, pos: [-W / 2 - 0.0012, 0.11, 0] as const },
      { geo: g.button, pos: [-W / 2 - 0.0012, 0.035, 0] as const },
      { geo: g.button, pos: [W / 2 + 0.0012, 0.1, 0] as const },
    ],
    [g, W],
  )

  return (
    <group ref={ref}>
      {/* 본체: 앞뒤 면은 후면 유리, 옆면(두께와 둥근 모서리)은 샴페인 골드 금속 프레임 */}
      <mesh
        geometry={g.body}
        material={[backGlassMaterial, goldTrimMaterial]}
        castShadow={castShadow}
        receiveShadow
      />
      {buttons.map((b, i) => (
        <mesh key={i} geometry={b.geo} material={goldTrimMaterial} position={b.pos} />
      ))}

      {/* 앞면 */}
      {/* 층 간격은 비스듬한 각도에서도 깊이 충돌이 없도록 1mm 이상 */}
      <mesh geometry={g.bezel} material={bezelMaterial} position-z={faceZ + 0.0004} />
      <group position-z={faceZ + 0.0014}>{children}</group>
      <mesh geometry={g.glass} material={frontGlassMaterial} position-z={faceZ + 0.0032} renderOrder={10} />

      {/* 후면 카메라 모듈 */}
      <group position={[-W / 2 + 0.1, H / 2 - 0.1, -faceZ]} rotation-y={Math.PI}>
        <mesh geometry={g.module} material={backGlassMaterial} castShadow={false} />
        {[
          [-0.032, 0.032],
          [0.032, -0.032],
          [-0.032, -0.032],
        ].map(([x, y], i) => (
          <group key={i} position={[x, y, 0.007]}>
            <mesh geometry={g.lens} material={goldTrimMaterial} />
            <mesh geometry={g.lensGlass} material={lensMaterial} position-z={0.0031} />
          </group>
        ))}
      </group>
    </group>
  )
})
