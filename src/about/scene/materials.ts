import * as THREE from 'three'
import { deskTopTextures, leatherRoughness, pageEdgeTexture, paperRoughness } from './textures'

/**
 * 책상 장면의 공유 머티리얼.
 * 전시관(The Floating Atelier)과 같은 샴페인 골드 · 아이보리 톤을 쓰되,
 * 이 모듈만으로 동작하도록 전시관 코드에 의존하지 않습니다.
 * 텍스처가 필요한 머티리얼은 캔버스가 있는 브라우저에서만 만들어지도록 함수로 지연 생성합니다.
 */

const lazy = <T,>(make: () => T) => {
  let v: T | null = null
  return () => (v ??= make())
}

/** 샴페인 골드 — 브러시드 금속 + 얇은 래커 */
export const gold = lazy(
  () =>
    new THREE.MeshPhysicalMaterial({
      color: '#d6b67c',
      metalness: 1,
      roughness: 0.28,
      anisotropy: 0.5,
      clearcoat: 0.35,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.45,
    }),
)

/** 조금 더 밝고 매끈한 금 (펜촉 · 장식선) */
export const goldBright = lazy(
  () =>
    new THREE.MeshStandardMaterial({
      color: '#e6c992',
      metalness: 1,
      roughness: 0.18,
      envMapIntensity: 1.6,
    }),
)

/** 아이보리 래커 상판 */
export const deskTop = lazy(() => {
  const { map, rough } = deskTopTextures()
  return new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    map,
    roughness: 0.5,
    roughnessMap: rough,
    clearcoat: 0.25,
    clearcoatRoughness: 0.35,
    envMapIntensity: 0.5,
  })
})

/** 상판 외 책상 몸체 — 무광에 가까운 아이보리 */
export const deskBody = lazy(
  () =>
    new THREE.MeshPhysicalMaterial({
      color: '#efe6d6',
      roughness: 0.5,
      clearcoat: 0.3,
      clearcoatRoughness: 0.4,
      envMapIntensity: 0.7,
    }),
)

/** 아이보리 세라믹 · 래커 (펜 몸통, 펜꽂이) */
export const ivoryGloss = lazy(
  () =>
    new THREE.MeshPhysicalMaterial({
      color: '#f6f0e5',
      roughness: 0.22,
      clearcoat: 0.8,
      clearcoatRoughness: 0.08,
      envMapIntensity: 0.9,
    }),
)

/** 다이어리 내지 (종이) */
export const paper = lazy(
  () =>
    new THREE.MeshStandardMaterial({
      color: '#f7f1e4',
      roughness: 0.92,
      roughnessMap: paperRoughness(),
      envMapIntensity: 0.35,
    }),
)

/** 금박 입힌 내지 단면 */
export const gildedEdge = lazy(
  () =>
    new THREE.MeshStandardMaterial({
      color: '#ffffff',
      map: pageEdgeTexture(),
      metalness: 0.75,
      roughness: 0.42,
      envMapIntensity: 1.2,
    }),
)

/** 다이어리 가죽 (표지 측면 · 책등 · 뒤표지) */
export const leather = lazy(
  () =>
    new THREE.MeshPhysicalMaterial({
      color: '#6c5c96',
      roughness: 0.62,
      roughnessMap: leatherRoughness(),
      sheen: 0.3,
      sheenColor: new THREE.Color('#d8cdef'),
      sheenRoughness: 0.5,
      clearcoat: 0.12,
      clearcoatRoughness: 0.6,
      envMapIntensity: 0.7,
    }),
)

/** 라벤더 메모지 */
export const memoPaper = lazy(
  () =>
    new THREE.MeshStandardMaterial({
      color: '#d4c8ec',
      roughness: 0.88,
      roughnessMap: paperRoughness(),
      envMapIntensity: 0.4,
    }),
)

/**
 * 유리 구슬 (마법의 문진).
 * transmission 은 장면 전체를 한 번 더 그리므로, 반사 + 투명도로 가볍게 표현합니다.
 */
export const glass = lazy(
  () =>
    new THREE.MeshPhysicalMaterial({
      color: '#f3eefb',
      roughness: 0.03,
      metalness: 0,
      transparent: true,
      opacity: 0.32,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      iridescence: 0.35,
      iridescenceIOR: 1.3,
      envMapIntensity: 1.8,
      depthWrite: false,
    }),
)

/** 흑연 / 짙은 잉크 (연필심 등 작은 부분) */
export const graphite = lazy(
  () => new THREE.MeshStandardMaterial({ color: '#3a3140', roughness: 0.5, metalness: 0.2 }),
)

/** 빛을 내는 전구 */
export const bulb = lazy(
  () =>
    new THREE.MeshStandardMaterial({
      color: '#000000',
      emissive: new THREE.Color('#fff1d6'),
      emissiveIntensity: 2.4,
      toneMapped: true,
    }),
)
