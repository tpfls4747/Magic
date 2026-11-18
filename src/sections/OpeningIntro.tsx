import { Component, type ReactNode } from 'react'
import { GoldenLockIntro, type GoldenLockIntroProps } from '@/intro'
import './OpeningIntro.css'

/** Intro 의 3D 가 실패하면 Intro 를 건너뛰고 전시관으로 보냅니다 (빈 화면 방지) */
class IntroErrorBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

type OpeningIntroProps = Pick<GoldenLockIntroProps, 'revealSignal' | 'onCovered' | 'onComplete'> & {
  onError: () => void
}

/**
 * 황금 자물쇠 Intro(src/intro)를 전시관 앞에 연결하는 얇은 래퍼.
 * 빛이 화면을 덮은 채 멈추고(autoReveal=false), 전시관이 준비되면 App 이 revealSignal 로 걷습니다.
 */
export function OpeningIntro({ onError, ...props }: OpeningIntroProps) {
  return (
    <IntroErrorBoundary onError={onError}>
      <GoldenLockIntro {...props} autoReveal={false} className="opening-intro" />
    </IntroErrorBoundary>
  )
}
