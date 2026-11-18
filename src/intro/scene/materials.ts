import * as THREE from 'three'
import { INTRO_PALETTE } from './palette'

/**
 * 금속은 대부분 환경 반사(StudioEnvironment 의 라이트포머)로 표현됩니다.
 * 캔버스는 Neutral 톤 매핑을 쓰므로 base color 가 그대로 보존됩니다
 * (ACES 처럼 노란색이 갈색으로 눌리지 않음). 그래서 금색은 채도를 약간 낮춘 샴페인 톤으로 둡니다.
 */
export function createIntroMaterials() {
  const gold = new THREE.MeshPhysicalMaterial({
    color: '#e9c88e',
    metalness: 1,
    roughness: 0.18,
    clearcoat: 0.5,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.15,
  })

  /** 몸체 — 넓은 면이라 반사를 약간 부드럽게 해서 형태감을 살림 */
  const goldBody = gold.clone()
  goldBody.roughness = 0.19
  goldBody.color.set('#eccf98')

  /** 테두리·필리그리 — 따뜻하고 진한 금, 선명한 하이라이트 */
  const goldDeep = gold.clone()
  goldDeep.color.set('#dcb06a')
  goldDeep.roughness = 0.14
  goldDeep.clearcoat = 0.8

  /** 로즈 골드 포인트 */
  const roseGold = gold.clone()
  roseGold.color.set(INTRO_PALETTE.roseGold)
  roseGold.roughness = 0.2

  /** 열쇠 — 더 맑고 밝은 금 (빛으로 흩어질 때 emissive 사용) */
  const keyGold = gold.clone()
  keyGold.color.set('#f0d6a0')
  keyGold.roughness = 0.13
  keyGold.emissive.set(INTRO_PALETTE.glow)
  keyGold.emissiveIntensity = 0
  keyGold.transparent = true

  /** 라벤더 보석 — 높은 굴절률로 면마다 강한 반사 + 무지갯빛 간섭 */
  const gem = new THREE.MeshPhysicalMaterial({
    color: '#bba6ea',
    metalness: 0,
    roughness: 0.03,
    ior: 2.3,
    specularIntensity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    iridescence: 0.75,
    iridescenceIOR: 1.5,
    emissive: INTRO_PALETTE.lavenderDeep,
    emissiveIntensity: 0.12,
    envMapIntensity: 2.2,
    flatShading: true,
  })

  /** 진주 */
  const pearl = new THREE.MeshPhysicalMaterial({
    color: INTRO_PALETTE.ivory,
    roughness: 0.26,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    sheen: 1,
    sheenColor: new THREE.Color(INTRO_PALETTE.lavender),
    sheenRoughness: 0.4,
    iridescence: 0.4,
    envMapIntensity: 1.1,
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
