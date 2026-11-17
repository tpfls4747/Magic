import type { ThreeEvent } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import {
  goToStop,
  setHoveredProject,
  stopOfProject,
  TOUR_PROJECT_IDS,
  useActiveStop,
  type TourProjectId,
} from '@/lib/tour'

/** 모바일 탭 후 원래 상태로 돌아오기까지 (ms) */
const TOUCH_RETURN_DELAY = 3200

const isTourProject = (id: string): id is TourProjectId =>
  (TOUR_PROJECT_IDS as readonly string[]).includes(id)

export interface ExhibitInteractionOptions {
  /** 터치로 켠 상태가 저절로 돌아오기까지 (toggle 이 아닐 때) */
  returnDelay?: number
  /**
   * true: 클릭/탭할 때마다 켜고 끄는 작품 (예: 레이어 펼치기 — 다시 누르면 닫힘)
   * false: hover 하는 동안 / 탭 후 잠시 동안만 켜지는 작품 (티켓 교환, UI 전환)
   */
  toggle?: boolean
}

/**
 * 전시 작품 공통 인터랙션 — 작품 앞에 와 있는지(focused)에 따라 역할이 나뉩니다.
 *
 * 작품 앞이 아닐 때 (전시관 전체·다른 작품 화면)
 *   - 마우스 hover: 커서와 작품 이름 안내만 표시 (작품 애니메이션은 시작하지 않음)
 *   - 클릭 / 탭: 그 작품의 근접 화면으로 이동
 * 작품 앞일 때
 *   - 마우스 hover: hovered
 *   - toggle 작품: 클릭 / 탭 → toggled 켜기·끄기
 *   - 그 외 작품: hover 또는 탭(일정 시간 뒤 자동 복귀) → active
 *
 * 스크롤 투어에 아직 들어가지 않은 작품은 이동할 정류장이 없으므로 항상 '작품 앞'으로 봅니다.
 * 탭은 pointerup 에서 처리합니다. 화면을 끌어 스크롤하면 브라우저가 pointercancel 을 보내므로
 * 스크롤하려다 작품이 반응하는 일이 없습니다.
 * 반환한 handlers 를 감지 영역 메시에 펼쳐 넣으면 됩니다.
 */
export function useExhibitInteraction(
  projectId: string,
  { returnDelay = TOUCH_RETURN_DELAY, toggle = false }: ExhibitInteractionOptions = {},
) {
  const inTour = isTourProject(projectId)
  const stop = inTour ? stopOfProject(projectId) : null
  const activeStop = useActiveStop()
  const focused = !inTour || activeStop === stop
  /**
   * 마우스가 작품 위에 있을 때, 그 순간 머물던 정류장 (없으면 null).
   * 전체 화면에서 클릭해 이동한 뒤 마우스를 움직이지 않았다면 작품 앞에서 hover 로 치지 않아,
   * 도착하자마자 애니메이션이 저절로 시작되지 않습니다.
   */
  const [hoverAt, setHoverAt] = useState<number | null>(null)
  const hovering = hoverAt !== null
  const hovered = focused && hovering && (!inTour || hoverAt === stop)
  /** 탭으로 켠 상태(일시) 또는 toggle 작품의 켜짐 상태 */
  const [on, setOn] = useState(false)
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

  // 작품 이름 안내: 투어 작품을 작품 앞이 아닌 곳에서 hover 할 때만
  useEffect(() => {
    if (!inTour) return
    if (focused) setHoveredProject(null)
    else if (hovering) setHoveredProject(projectId)
  }, [inTour, focused, hovering, projectId])

  const navigate = () => {
    if (stop !== null) goToStop(stop)
  }

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
      if (inTour) setHoveredProject(null)
    },
    // 마우스 클릭: 작품 앞이 아니면 이동, 작품 앞이면 toggle 작품만 켜고 끔 (hover 작품은 이미 동작 중)
    onClick: (e: ThreeEvent<MouseEvent>) => {
      if (lastPointer.current === 'touch') return
      if (!focused) {
        e.stopPropagation()
        navigate()
      } else if (toggle) {
        e.stopPropagation()
        setOn((v) => !v)
      }
    },
    onPointerUp: (e: ThreeEvent<PointerEvent>) => {
      if (e.pointerType !== 'touch') return
      e.stopPropagation()
      if (!focused) {
        navigate()
        return
      }
      if (toggle) {
        setOn((v) => !v)
        return
      }
      window.clearTimeout(touchTimer.current)
      const next = !on
      setOn(next)
      if (next) touchTimer.current = window.setTimeout(() => setOn(false), returnDelay)
    },
  }

  return {
    /** hover 또는 탭 중 (toggle 이 아닌 작품의 동작 기준) */
    active: focused && (hovered || (!toggle && on)),
    /** 작품 앞에서 마우스가 올라와 있음 */
    hovered,
    /** toggle 작품이 켜져 있음 */
    toggled: focused && toggle && on,
    handlers,
  }
}
