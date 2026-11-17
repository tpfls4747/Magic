import * as THREE from 'three'
import type { TourProjectId } from '@/lib/tour'
import { PEDESTALS } from '../constants'
import { PEDESTAL_TOP } from '../Pedestals'

/** 기본(전체 구도) 카메라 위치 — 작품이 이 방향을 바라보도록 배치합니다. */
export const OVERVIEW_CAMERA = new THREE.Vector3(0, 1.72, 7.2)

/** 전시대 상판 위 작품 중심 높이 */
const EXHIBIT_LIFT = 0.5

/**
 * 근접 구도에서 작품이 놓일 화면 위치와 차지할 비율.
 * w·h: 작품이 화면 폭·높이에서 차지할 최대 비율, x·y: 작품 중심의 화면 위치(0~1, 좌상단 기준)
 */
export interface Framing {
  w: number
  h: number
  x: number
  y: number
}

/** 스크롤 투어에서 카메라가 찾아가는 전시 작품 */
export interface TourExhibit {
  center: THREE.Vector3
  /** 카메라가 작품을 바라보는 방향 (작품 정면 기준 y 회전) */
  viewYaw: number
  /** 떠 있는 움직임·전환 연출까지 포함한 대략의 범위 (m) — 잘리지 않도록 여유를 둡니다 */
  extent: { width: number; height: number }
  /** 가로 화면: 작품은 왼쪽, 설명은 오른쪽 / 세로 화면: 작품은 위쪽, 설명은 아래쪽 */
  framing: { landscape: Framing; portrait: Framing }
}

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
  framing: {
    landscape: { w: 0.36, h: 0.4, x: 0.33, y: 0.47 },
    portrait: { w: 0.8, h: 0.3, x: 0.5, y: 0.33 },
  },
} as const

const [px, , pz] = PEDESTALS[2].position

const signUpYaw = yawToward(px, pz, OVERVIEW_CAMERA)
/** 휴대폰이 카메라에서 살짝 비껴 선 각도 — 레이어가 떠오르는 깊이가 읽히도록 */
const PHONE_TURN = -0.3

/** 작품 2 — Sign-up Redesign (오른쪽 전시대의 3D 스마트폰) */
export const SIGN_UP = {
  /** 휴대폰 중심 — 아래쪽이 상판 위로 약 0.14m 떠 있도록 */
  center: new THREE.Vector3(px, PEDESTAL_TOP + 0.52, pz),
  yaw: signUpYaw,
  turn: PHONE_TURN,
  tilt: -0.06,
  /** 근접 화면에서는 휴대폰 정면에 가깝게, 비껴 선 각도의 절반만 남겨 입체감을 유지 */
  viewYaw: signUpYaw + PHONE_TURN * 0.5,
  /** 분리되는 UI 레이어까지 포함한 범위 */
  extent: { width: 0.56, height: 0.86 },
  framing: {
    landscape: { w: 0.34, h: 0.66, x: 0.32, y: 0.5 },
    portrait: { w: 0.66, h: 0.42, x: 0.5, y: 0.3 },
  },
} as const

/**
 * 투어에 포함되는 작품의 배치 — 프로젝트 id 로 찾습니다.
 * 순서는 tour.ts 의 TOUR_PROJECT_IDS 가 정하고, 새 작품은 여기와 그 목록에 한 줄씩 추가합니다.
 */
export const EXHIBIT_LAYOUT: Record<TourProjectId, TourExhibit> = {
  'seat-swap': { ...SEAT_SWAP, viewYaw: SEAT_SWAP.yaw },
  'signup-redesign': SIGN_UP,
}
