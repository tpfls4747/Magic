import type { ComponentType } from 'react'
import type { IllustrationKey } from '../types'
import { ConfirmScreen, RequestScreen, SeatMapScreen, SeatSwapHero } from './SeatSwap'

/**
 * 코드 기반 시각 자료 레지스트리.
 * 데이터에서는 문자열 키만 사용하고, 실제 컴포넌트는 여기서 연결합니다.
 */
export const illustrations: Record<IllustrationKey, ComponentType> = {
  'seat-swap/hero': SeatSwapHero,
  'seat-swap/screen-seat-map': SeatMapScreen,
  'seat-swap/screen-request': RequestScreen,
  'seat-swap/screen-confirm': ConfirmScreen,
}
