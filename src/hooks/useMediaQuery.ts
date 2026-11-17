import { useSyncExternalStore } from 'react'

/** CSS 미디어 쿼리 일치 여부를 구독합니다. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

export type Quality = 'high' | 'low'

/** 작은 화면/터치 기기에서는 반사 해상도·그림자 등을 낮춰 성능을 확보합니다. */
export function useQuality(): Quality {
  const low = useMediaQuery('(max-width: 768px), (pointer: coarse)')
  return low ? 'low' : 'high'
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
