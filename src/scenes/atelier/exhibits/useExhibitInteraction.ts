import type { ThreeEvent } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import {
  goToStop,
  setHoveredProject,
  stopOfProject,
  useActiveStop,
  type TourProjectId,
} from '@/lib/tour'

/** 모바일 탭 후 원래 상태로 돌아오기까지 (ms) */
const TOUCH_RETURN_DELAY = 3200

/**
 * 전시 작품 공통 인터랙션 — 작품 앞에 와 있는지(focused)에 따라 역할이 나뉩니다.
 *
 * 작품 앞이 아닐 때 (전시관 전체·다른 작품 화면)
 *   - 마우스 hover: 커서와 작품 이름 안내만 표시 (작품 애니메이션은 시작하지 않음)
 *   - 클릭 / 탭: 그 작품의 근접 화면으로 이동
 * 작품 앞일 때
 *   - 마우스: hover 하는 동안 active (티켓 교환, UI 전환 등)
 *   - 터치: 탭하면 active, 일정 시간 뒤(또는 다시 탭하면) 원래대로
 *
 * 탭은 pointerup 에서 처리합니다. 화면을 끌어 스크롤하면 브라우저가 pointercancel 을 보내므로
 * 스크롤하려다 작품이 반응하는 일이 없습니다.
 * 반환한 handlers 를 감지 영역 메시에 펼쳐 넣으면 됩니다.
 */
export function useExhibitInteraction(projectId: TourProjectId, returnDelay = TOUCH_RETURN_DELAY) {
  const stop = stopOfProject(projectId)
  const activeStop = useActiveStop()
  const focused = activeStop === stop
  /**
   * 마우스가 작품 위에 있을 때, 그 순간 머물던 정류장 (없으면 null).
   * 전체 화면에서 클릭해 이동한 뒤 마우스를 움직이지 않았다면 작품 앞에서 hover 로 치지 않아,
   * 도착하자마자 애니메이션이 저절로 시작되지 않습니다.
   */
  const [hoverAt, setHoverAt] = useState<number | null>(null)
  const hovering = hoverAt !== null
  const [tapped, setTapped] = useState(false)
  const touchTimer = useRef<number | undefined>(undefined)
  const lastPointer = useRef<string>('mouse')

  useEffect(() => () => window.clearTimeout(touchTimer.current), [])
  useEffect(
    () => () => {
      document.body.style.cursor = ''
      setHoveredProject(null)
    },
    [],
  )

  // 작품 앞을 벗어나면 이름 안내는 숨기고, 다시 hover 하는 중에 작품 앞에 도착하면 안내를 지웁니다.
  useEffect(() => {
    if (focused) setHoveredProject(null)
    else if (hovering) setHoveredProject(projectId)
  }, [focused, hovering, projectId])

  const handlers = {
    onPointerDown: (e: ThreeEvent<PointerEvent>) => {
      lastPointer.current = e.pointerType
    },
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      if (e.pointerType === 'touch') return
      e.stopPropagation()
      document.body.style.cursor = 'pointer'
      setHoverAt(activeStop ?? -1)
    },
    onPointerMove: (e: ThreeEvent<PointerEvent>) => {
      if (e.pointerType === 'touch') return
      setHoverAt(activeStop ?? -1)
    },
    onPointerOut: (e: ThreeEvent<PointerEvent>) => {
      if (e.pointerType === 'touch') return
      document.body.style.cursor = ''
      setHoverAt(null)
      setHoveredProject(null)
    },
    // 마우스 클릭: 작품 앞이 아닐 때만 이동 (작품 앞에서는 hover 가 이미 동작 중)
    onClick: (e: ThreeEvent<MouseEvent>) => {
      if (lastPointer.current === 'touch' || focused) return
      e.stopPropagation()
      goToStop(stop)
    },
    onPointerUp: (e: ThreeEvent<PointerEvent>) => {
      if (e.pointerType !== 'touch') return
      e.stopPropagation()
      if (!focused) {
        goToStop(stop)
        return
      }
      window.clearTimeout(touchTimer.current)
      const next = !tapped
      setTapped(next)
      if (next) touchTimer.current = window.setTimeout(() => setTapped(false), returnDelay)
    },
  }

  return { active: focused && (hoverAt === stop || tapped), handlers }
}
