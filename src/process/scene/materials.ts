import * as THREE from 'three'

/**
 * 공유 머티리얼 — 전시관과 같은 샴페인 골드 · 아이보리 · 라벤더 톤.
 * 브라우저에서만 만들어지도록 지연 생성하고, 모듈 수명 동안 공유합니다.
 * (단계별로 빛이 달라지는 머티리얼은 각 컴포넌트에서 따로 만들고 해제합니다)
 */
const lazy = <T,>(make: () => T) => {
  let v: T | null = null
  return () => (v ??= make())
}

export const gold = lazy(
  () =>
    new THREE.MeshPhysicalMaterial({
      color: '#d6b67c',
      metalness: 1,
      roughness: 0.28,
      clearcoat: 0.35,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.4,
    }),
)

export const goldBright = lazy(
  () => new THREE.MeshStandardMaterial({ color: '#e6c992', metalness: 1, roughness: 0.2, envMapIntensity: 1.5 }),
)

/** 보드 표면 — 결이 고운 아이보리 패브릭 보드 */
export const boardSurface = lazy(
  () =>
    new THREE.MeshStandardMaterial({ color: '#e8ddcc', roughness: 0.95, envMapIntensity: 0.45 }),
)

/** 보드 옆면 · 받침 — 웜 그레이빛 아이보리 래커 */
export const boardEdge = lazy(
  () =>
    new THREE.MeshPhysicalMaterial({
      color: '#ddd3c4',
      roughness: 0.45,
      clearcoat: 0.4,
      clearcoatRoughness: 0.3,
      envMapIntensity: 0.7,
    }),
)

/** 종이 (카드 뒷면 · 메모 옆면) */
export const paper = lazy(
  () => new THREE.MeshStandardMaterial({ color: '#f6f0e5', roughness: 0.9, envMapIntensity: 0.35 }),
)

/** 아이보리 기기 몸체 (미니 브라우저 · 스마트폰) */
export const ivoryDevice = lazy(
  () =>
    new THREE.MeshPhysicalMaterial({
      color: '#f4eee4',
      roughness: 0.3,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      envMapIntensity: 0.9,
    }),
)

export const lavender = lazy(
  () => new THREE.MeshStandardMaterial({ color: '#cbbfe6', roughness: 0.6, envMapIntensity: 0.5 }),
)

/** 돋보기 유리 — transmission 대신 투명 + 반사로 가볍게 */
export const glass = lazy(
  () =>
    new THREE.MeshPhysicalMaterial({
      color: '#f3eefb',
      roughness: 0.03,
      transparent: true,
      opacity: 0.28,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      envMapIntensity: 1.8,
      depthWrite: false,
    }),
)

/** 인쇄면 머티리얼 (텍스처마다 하나) */
export const printMaterial = (map: THREE.Texture | null, roughness = 0.88) =>
  new THREE.MeshStandardMaterial({ color: '#f2ece3', map, roughness, envMapIntensity: 0.3 })

/** 떠 있는 자료 아래 보드에 드리우는 부드러운 그림자 (방사형 그라데이션) */
export const softShadow = lazy(() => {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62)
  g.addColorStop(0, 'rgba(70,52,40,0.32)')
  g.addColorStop(1, 'rgba(70,52,40,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })
})
