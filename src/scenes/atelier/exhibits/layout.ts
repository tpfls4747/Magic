import * as THREE from 'three'
import { PEDESTALS } from '../constants'
import { PEDESTAL_TOP } from '../Pedestals'

/** 기본(전체 구도) 카메라 위치 — 작품이 이 방향을 바라보도록 배치합니다. */
export const OVERVIEW_CAMERA = new THREE.Vector3(0, 1.72, 7.2)

/** 전시대 상판 위 작품 중심 높이 */
const EXHIBIT_LIFT = 0.5

/** 카메라 쪽을 향하도록 하는 y 회전 */
function yawToward(x: number, z: number, target: THREE.Vector3) {
  return Math.atan2(target.x - x, target.z - z)
}

const [sx, , sz] = PEDESTALS[0].position

/** 작품 1 — Seat Swap 의 배치와 크기 (카메라 근접 구도 계산에도 사용) */
export const SEAT_SWAP = {
  center: new THREE.Vector3(sx, PEDESTAL_TOP + EXHIBIT_LIFT, sz),
  yaw: yawToward(sx, sz, OVERVIEW_CAMERA),
  /** 원거리에서도 읽히도록 실제 티켓보다 약간 크게 */
  scale: 1.22,
  /**
   * 두 티켓이 떠 있는 움직임과 교환 경로까지 포함한 대략의 범위 (m, 스케일 적용 후)
   * 근접 화면에서 잘리지 않도록 여유를 둡니다.
   */
  extent: { width: 1.2, height: 0.62 },
} as const

const [px, , pz] = PEDESTALS[2].position

/** 작품 2 — Sign-up Redesign (오른쪽 전시대의 3D 스마트폰) */
export const SIGN_UP = {
  /** 휴대폰 중심 — 아래쪽이 상판 위로 약 0.14m 떠 있도록 */
  center: new THREE.Vector3(px, PEDESTAL_TOP + 0.52, pz),
  yaw: yawToward(px, pz, OVERVIEW_CAMERA),
  /** 근접 구도용 대략의 범위 (분리되는 UI 레이어 포함) */
  extent: { width: 0.62, height: 0.86 },
} as const
