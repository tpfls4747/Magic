import { Component, useState, type ReactNode } from 'react'
import './WebGLGate.css'

/** WebGL 을 쓸 수 있는 환경인지 미리 확인합니다 (렌더러를 만들기 전에). */
function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/** 캔버스 초기화 중 오류가 나도 페이지 전체가 사라지지 않도록 3D 영역만 대체 화면으로 바꿉니다. */
class CanvasErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/** 3D 를 표시할 수 없을 때의 정적인 배경 — 타이틀·메뉴·작품 설명은 HTML 이라 그대로 보입니다. */
function StaticBackdrop() {
  return (
    <div className="webgl-fallback" role="img" aria-label="The Floating Atelier 전시관 배경">
      <div className="webgl-fallback__arches" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="webgl-fallback__note">
        이 환경에서는 3D 전시관을 표시할 수 없어, 작품 소개를 기본 화면으로 보여드립니다.
      </p>
    </div>
  )
}

/**
 * WebGL 이 없거나 3D 캔버스가 실패해도 포트폴리오 내용에 접근할 수 있게 하는 안전장치.
 * children 에 3D 캔버스를 넣습니다.
 */
export function WebGLGate({ children }: { children: ReactNode }) {
  const [supported] = useState(canUseWebGL)
  if (!supported) return <StaticBackdrop />
  return <CanvasErrorBoundary fallback={<StaticBackdrop />}>{children}</CanvasErrorBoundary>
}
