import { useEffect, useState } from 'react'

interface ScrollSpyState {
  /** 현재 읽고 있는 섹션의 DOM id (첫 섹션 이전이면 null) */
  activeId: string | null
  /** 페이지 전체 읽기 진행률 0–1 */
  progress: number
  /** 히어로를 지나 스크롤했는지 (맨 위로 버튼 표시용) */
  scrolledPastFold: boolean
}

/**
 * 스크롤 위치로 현재 섹션과 읽기 진행률을 계산합니다.
 * 섹션의 윗변이 화면 위쪽 30% 지점을 지나면 '읽는 중'으로 봅니다.
 */
export function useScrollSpy(domIds: string[]): ScrollSpyState {
  const [state, setState] = useState<ScrollSpyState>({
    activeId: null,
    progress: 0,
    scrolledPastFold: false,
  })
  const key = domIds.join('|')

  useEffect(() => {
    const ids = key.split('|')
    let frame = 0

    const measure = () => {
      frame = 0
      const vh = window.innerHeight
      const line = vh * 0.3
      let activeId: string | null = null
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) activeId = id
      }
      const doc = document.documentElement
      const max = doc.scrollHeight - vh
      const y = window.scrollY
      // 페이지 끝에 닿으면 마지막 섹션을 활성화 (짧은 마지막 섹션 대응)
      if (max > 0 && y >= max - 2) activeId = ids[ids.length - 1]
      const progress = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0
      const scrolledPastFold = y > vh * 0.9

      setState((prev) =>
        prev.activeId === activeId &&
        Math.abs(prev.progress - progress) < 0.001 &&
        prev.scrolledPastFold === scrolledPastFold
          ? prev
          : { activeId, progress, scrolledPastFold },
      )
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [key])

  return state
}
