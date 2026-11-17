import * as THREE from 'three'
import { PALETTE } from './constants'

// 여러 메시가 공유하는 머티리얼 — 한 번만 만들어 GPU 프로그램과 메모리를 절약합니다.

/**
 * 세로 그라데이션 텍스처 (emissiveMap 용).
 * stops: [위치 0(아래)~1(위), 색]
 */
function verticalGradient(stops: [number, string][]) {
  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createLinearGradient(0, 256, 0, 0)
  for (const [at, color] of stops) grad.addColorStop(at, color)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 4, 256)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/** 미세한 결이 느껴지는 석회 미장 벽 */
export const plasterMaterial = new THREE.MeshStandardMaterial({
  color: PALETTE.plaster,
  roughness: 0.9,
  metalness: 0,
  envMapIntensity: 0.65,
})

/** 기둥과 몰딩 — 살짝 윤기가 있는 크림 스톤 */
export const stoneMaterial = new THREE.MeshPhysicalMaterial({
  color: PALETTE.stone,
  roughness: 0.42,
  metalness: 0,
  clearcoat: 0.3,
  clearcoatRoughness: 0.45,
  envMapIntensity: 0.75,
})

/** 아이보리 몰딩 (아키볼트, 리브) */
export const ivoryMaterial = new THREE.MeshStandardMaterial({
  color: '#f5efe4',
  roughness: 0.62,
  metalness: 0,
  envMapIntensity: 0.75,
})

/** 샴페인 골드 — 무광에 가까운 브러시드 금속 */
export const champagneGoldMaterial = new THREE.MeshPhysicalMaterial({
  color: '#d8b97f',
  metalness: 1,
  roughness: 0.3,
  // 선반 가공한 듯한 원형 결 — 하이라이트가 가로로 부드럽게 퍼집니다.
  anisotropy: 0.55,
  anisotropyRotation: Math.PI / 2,
  // 얇은 래커층: 넓고 부드러운 금속 반사 위에 맺히는 선명한 하이라이트
  clearcoat: 0.35,
  clearcoatRoughness: 0.08,
  envMapIntensity: 1.5,
})

/** 가는 금색 장식선 (조금 더 밝고 반짝임) */
export const goldTrimMaterial = new THREE.MeshStandardMaterial({
  color: '#e2c48f',
  metalness: 1,
  roughness: 0.22,
  envMapIntensity: 1.5,
})

/** 바닥에 상감된 금색 선 — 바닥 반사면과 겹치지 않도록 polygonOffset */
export const floorInlayMaterial = new THREE.MeshStandardMaterial({
  color: PALETTE.champagne,
  metalness: 1,
  roughness: 0.3,
  envMapIntensity: 1.4,
  polygonOffset: true,
  polygonOffsetFactor: -2,
  polygonOffsetUnits: -2,
})

/** 아치 너머 외부 회랑 — 아래는 따뜻한 빛, 위로 갈수록 라벤더빛 간접조명 */
export const glowWallMaterial = new THREE.MeshStandardMaterial({
  color: '#000000',
  fog: false,
  emissive: new THREE.Color('#ffffff'),
  emissiveMap: verticalGradient([
    [0, '#efe3d2'],
    [0.12, '#f2e8de'],
    [0.32, '#e2d7ec'],
    [0.55, '#cdbfe6'],
    [1, '#c3b4e0'],
  ]),
  emissiveIntensity: 0.92,
  roughness: 1,
})

/** 뒤쪽 벽 니치 안쪽 — 라벤더가 아주 옅게 감도는 패널 */
export const nicheMaterial = new THREE.MeshStandardMaterial({
  color: '#000000',
  emissive: new THREE.Color('#ffffff'),
  emissiveMap: verticalGradient([
    [0, '#e6dccf'],
    [0.35, '#d9cdea'],
    [1, '#bfaedf'],
  ]),
  emissiveIntensity: 0.78,
  roughness: 1,
})

/** 천장 꼭대기 채광창 */
export const skylightMaterial = new THREE.MeshBasicMaterial({
  color: new THREE.Color('#f6eefa'),
  toneMapped: true,
})

/**
 * 전면 유리 — 바탕색은 더하지 않고(가산 혼합 + 검정) 환경 반사와 하이라이트만 얹습니다.
 * 화면 콘텐츠를 가리지 않으면서 유리 표면처럼 보이게 합니다.
 */
export const screenGlassMaterial = new THREE.MeshPhysicalMaterial({
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
