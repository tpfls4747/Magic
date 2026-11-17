import { useState, type ReactNode } from 'react'
import type { IntroCallbacks } from './events'
import { GoldenLockIntro, type GoldenLockIntroProps } from './GoldenLockIntro'

interface IntroGateProps extends IntroCallbacks {
  /** Intro 이후 보여 줄 화면 (예: 기존 <App />) */
  children: ReactNode
  /** false 면 Intro 없이 바로 children 을 렌더 (개발 중 우회용) */
  enabled?: boolean
  introProps?: Omit<GoldenLockIntroProps, keyof IntroCallbacks>
}

/**
 * 연결 도우미 — 전시관을 감싸기만 하면
 *  · 빛이 화면을 덮는 순간(onCovered) children 을 아래에 마운트하고
 *  · 빛이 걷힌 뒤(onComplete) Intro 를 언마운트합니다.
 *
 *   <IntroGate><App /></IntroGate>
 *
 * (현재 main.tsx/App.tsx 에는 연결하지 않았습니다.)
 */
export function IntroGate({ children, enabled = true, introProps, ...callbacks }: IntroGateProps) {
  const [showContent, setShowContent] = useState(!enabled)
  const [showIntro, setShowIntro] = useState(enabled)

  return (
    <>
      {showContent && children}
      {showIntro && (
        <GoldenLockIntro
          {...introProps}
          {...callbacks}
          onCovered={() => {
            setShowContent(true)
            callbacks.onCovered?.()
          }}
          onComplete={() => {
            setShowIntro(false)
            callbacks.onComplete?.()
          }}
        />
      )}
    </>
  )
}
