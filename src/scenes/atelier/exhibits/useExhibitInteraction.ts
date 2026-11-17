import type { ThreeEvent } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'

/** 모바일 탭 후 원래 상태로 돌아오기까지 (ms) */
const TOUCH_RETURN_DELAY = 3200

/**
 * 전시 작품 공통 인터랙션.
 * - 마우스: hover 하는 동안 active, 벗어나면 원래대로
 * - 터치: 탭하면 active, 일정 시간 뒤(또는 다시 탭하면) 원래대로
 *   탭은 pointerup 에서 처리합니다. 화면을 끌어 스크롤하면 브라우저가 pointercancel 을 보내므로
 *   스크롤하려다 작품이 반응하는 일이 없습니다.
 *
 * 반환한 handlers 를 감지 영역 메시에 펼쳐 넣으면 됩니다.
 */
export function useExhibitInteraction(returnDelay = TOUCH_RETURN_DELAY) {
  const [active, setActive] = useState(false)
  const touchTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(touchTimer.current), [])
  useEffect(() => () => void (document.body.style.cursor = ''), [])

  const handlers = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      if (e.pointerType === 'touch') return
      e.stopPropagation()
      document.body.style.cursor = 'pointer'
      setActive(true)
    },
    onPointerOut: (e: ThreeEvent<PointerEvent>) => {
      if (e.pointerType === 'touch') return
      document.body.style.cursor = ''
      setActive(false)
    },
    onPointerUp: (e: ThreeEvent<PointerEvent>) => {
      if (e.pointerType !== 'touch') return
      e.stopPropagation()
      window.clearTimeout(touchTimer.current)
      const next = !active
      setActive(next)
      if (next) touchTimer.current = window.setTimeout(() => setActive(false), returnDelay)
    },
  }

  return { active, handlers }
}
