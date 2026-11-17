import * as THREE from 'three'
import { INTRO_PALETTE } from './palette'

/**
 * 금속은 대부분 환경 반사(StudioEnvironment 의 라이트포머)로 표현됩니다.
 * metalness 1 + 낮은 roughness + clearcoat 로 "광택 낸 샴페인 골드" 느낌을 만듭니다.
 */
export function createIntroMaterials() {
  const gold = new THREE.MeshPhysicalMaterial({
    color: INTRO_PALETTE.champagne,
    metalness: 1,
    roughness: 0.2,
    clearcoat: 0.6,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.35,
  })

  /** 몸체 — 아주 약간 더 부드러운 반사로 형태감을 살림 */
  const goldBody = gold.clone()
  goldBody.roughness = 0.26
  goldBody.color.set('#ebcd94')

  /** 테두리·필리그리 — 따뜻하고 진한 금 */
  const goldDeep = gold.clone()
  goldDeep.color.set(INTRO_PALETTE.goldWarm)
  goldDeep.roughness = 0.16

  /** 로즈 골드 포인트 */
  const roseGold = gold.clone()
  roseGold.color.set(INTRO_PALETTE.roseGold)
  roseGold.roughness = 0.22

  /** 열쇠 — 더 맑고 밝은 금 (빛을 흡수해 사라질 때 emissive 사용) */
  const keyGold = gold.clone()
  keyGold.color.set('#f1d7a2')
  keyGold.roughness = 0.14
  keyGold.emissive.set(INTRO_PALETTE.glow)
  keyGold.emissiveIntensity = 0
  keyGold.transparent = true

  /** 라벤더 보석 — 무지갯빛 간섭 반사 */
  const gem = new THREE.MeshPhysicalMaterial({
    color: INTRO_PALETTE.lavender,
    metalness: 0.1,
    roughness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    iridescence: 1,
    iridescenceIOR: 1.6,
    emissive: INTRO_PALETTE.lavenderDeep,
    emissiveIntensity: 0.15,
    envMapIntensity: 1.6,
    flatShading: true,
  })

  /** 진주 */
  const pearl = new THREE.MeshPhysicalMaterial({
    color: INTRO_PALETTE.ivory,
    roughness: 0.28,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    sheen: 1,
    sheenColor: new THREE.Color(INTRO_PALETTE.lavender),
    sheenRoughness: 0.4,
    iridescence: 0.4,
    envMapIntensity: 1.2,
  })

  /** 열쇠 구멍 안쪽 — 평소엔 깊은 어둠, 해제 순간 빛이 새어 나옴 */
  const keyhole = new THREE.MeshStandardMaterial({
    color: INTRO_PALETTE.keyholeDark,
    roughness: 0.9,
    metalness: 0,
    emissive: INTRO_PALETTE.glow,
    emissiveIntensity: 0,
  })

  const all = [gold, goldBody, goldDeep, roseGold, keyGold, gem, pearl, keyhole]
  return {
    gold,
    goldBody,
    goldDeep,
    roseGold,
    keyGold,
    gem,
    pearl,
    keyhole,
    dispose: () => all.forEach((m) => m.dispose()),
  }
}

export type IntroMaterials = ReturnType<typeof createIntroMaterials>
