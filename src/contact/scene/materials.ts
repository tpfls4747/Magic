import * as THREE from 'three'

/** The Floating Atelier 와 같은 계열의 팔레트 (독립 정의) */
export const DOOR_PALETTE = {
  ivory: '#faf6ee',
  ivoryWarm: '#f5eee2',
  plaster: '#ebe7df',
  stone: '#f2ede4',
  floor: '#e9e0d3',
  champagne: '#e2c48e',
  goldDeep: '#c9a061',
  lavender: '#cdbff0',
  lavenderDeep: '#9a85d0',
  ink: '#3a3140',
  glow: '#fff4e2',
} as const

export function createDoorMaterials() {
  /** 아이보리 도장 문 — 은은한 광택 */
  const doorPaint = new THREE.MeshPhysicalMaterial({
    color: DOOR_PALETTE.ivory,
    roughness: 0.4,
    metalness: 0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.35,
    envMapIntensity: 0.8,
  })
  /** 문 패널 몰딩 — 살짝 더 따뜻한 아이보리 */
  const molding = doorPaint.clone()
  molding.color.set(DOOR_PALETTE.ivoryWarm)
  molding.roughness = 0.38

  /** 석회 미장 벽 */
  const plaster = new THREE.MeshStandardMaterial({ color: DOOR_PALETTE.plaster, roughness: 0.95, envMapIntensity: 0.45 })
  /** 문틀·몰딩 — 크림 스톤 */
  const stone = new THREE.MeshPhysicalMaterial({
    color: DOOR_PALETTE.stone,
    roughness: 0.5,
    clearcoat: 0.25,
    clearcoatRoughness: 0.5,
    envMapIntensity: 0.75,
  })
  /** 바닥 — 은은하게 반사하는 석재 */
  const floor = new THREE.MeshStandardMaterial({ color: DOOR_PALETTE.floor, roughness: 0.55, envMapIntensity: 0.55 })

  /** 샴페인 골드 — hover 시 emissive 로 미세하게 빛남 */
  const gold = new THREE.MeshPhysicalMaterial({
    color: DOOR_PALETTE.champagne,
    metalness: 1,
    roughness: 0.22,
    clearcoat: 0.5,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.2,
    emissive: '#c9944a',
    emissiveIntensity: 0,
  })
  const goldDeep = gold.clone()
  goldDeep.color.set(DOOR_PALETTE.goldDeep)
  goldDeep.roughness = 0.18
  /** 손잡이 전용 (hover 하이라이트를 따로 주기 위해) */
  const handleGold = gold.clone()
  handleGold.roughness = 0.14

  const gem = new THREE.MeshPhysicalMaterial({
    color: '#bba6ea',
    metalness: 0,
    roughness: 0.03,
    ior: 2.3,
    specularIntensity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    iridescence: 0.7,
    emissive: DOOR_PALETTE.lavenderDeep,
    emissiveIntensity: 0.15,
    envMapIntensity: 2,
    flatShading: true,
  })

  const all = [doorPaint, molding, plaster, stone, floor, gold, goldDeep, handleGold, gem]
  return {
    doorPaint,
    molding,
    plaster,
    stone,
    floor,
    gold,
    goldDeep,
    handleGold,
    gem,
    dispose: () => all.forEach((m) => m.dispose()),
  }
}

export type DoorMaterials = ReturnType<typeof createDoorMaterials>
