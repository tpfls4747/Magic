import * as THREE from 'three'
import { PALETTE } from './constants'

// 여러 메시가 공유하는 머티리얼 — 한 번만 만들어 GPU 프로그램과 메모리를 절약합니다.

/** 미세한 결이 느껴지는 석회 미장 벽 */
export const plasterMaterial = new THREE.MeshStandardMaterial({
  color: PALETTE.plaster,
  roughness: 0.88,
  metalness: 0,
  envMapIntensity: 0.9,
})

/** 기둥과 몰딩 — 살짝 윤기가 있는 크림 스톤 */
export const stoneMaterial = new THREE.MeshPhysicalMaterial({
  color: PALETTE.stone,
  roughness: 0.42,
  metalness: 0,
  clearcoat: 0.25,
  clearcoatRoughness: 0.5,
  envMapIntensity: 1,
})

/** 아이보리 몰딩 (아키볼트, 리브) */
export const ivoryMaterial = new THREE.MeshStandardMaterial({
  color: PALETTE.ivory,
  roughness: 0.6,
  metalness: 0,
})

/** 샴페인 골드 — 무광에 가까운 브러시드 금속 */
export const champagneGoldMaterial = new THREE.MeshPhysicalMaterial({
  color: PALETTE.champagne,
  metalness: 1,
  roughness: 0.24,
  clearcoat: 0.4,
  clearcoatRoughness: 0.18,
  envMapIntensity: 1.35,
})

/** 가는 금색 장식선 (조금 더 밝고 반짝임) */
export const goldTrimMaterial = new THREE.MeshStandardMaterial({
  color: PALETTE.champagneLight,
  metalness: 1,
  roughness: 0.18,
  envMapIntensity: 1.6,
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

/** 아치 너머 외부 회랑 — 빛이 가득한 공간처럼 은은하게 자체 발광 */
export const glowWallMaterial = new THREE.MeshStandardMaterial({
  color: PALETTE.ivory,
  fog: false,
  emissive: new THREE.Color(PALETTE.warmLight),
  emissiveIntensity: 1.05,
  roughness: 1,
})

/** 뒤쪽 벽 니치 안쪽 — 라벤더가 아주 옅게 감도는 패널 */
export const nicheMaterial = new THREE.MeshStandardMaterial({
  color: PALETTE.lavenderMist,
  emissive: new THREE.Color(PALETTE.lavenderMist),
  emissiveIntensity: 0.18,
  roughness: 0.95,
})

/** 천장 꼭대기 채광창 */
export const skylightMaterial = new THREE.MeshBasicMaterial({
  color: new THREE.Color(PALETTE.warmLight).multiplyScalar(1.4),
  toneMapped: true,
})
