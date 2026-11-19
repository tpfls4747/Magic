import { Component, type ReactNode } from 'react'
import { ContactSection } from '@/contact'
import { SPACE_HASH } from '@/lib/space'
import { SpaceBar } from './SpaceBar'
import './ContactDoor.css'

interface ContactDoorProps {
  onReady: () => void
  onBack: () => void
  /** 공간 전환의 빛이 걷히기 시작함 — 이때 문이 스스로 열립니다 */
  revealed: boolean
}

/** 3D 문이 실행 중 실패해도 연락처는 남도록 — 3D 없이 같은 섹션을 다시 그림 */
class DoorErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/**
 * Contact · The Final Door 공간 — 기존 Contact 모듈(src/contact)을 띄우고 공통 상단 바를 덧붙입니다.
 * 들어오면 문이 스스로 열리고, 카메라가 열린 문을 지나 들어간 뒤 Contact 전용 화면이 나타납니다.
 * 전시관으로 돌아가기는 상단 바의 Back to Gallery.
 */
export default function ContactDoor({ onReady, onBack, revealed }: ContactDoorProps) {
  const id = SPACE_HASH.contact.slice(1)
  return (
    <div className="space-page contact-space">
      <SpaceBar current="contact" onBack={onBack} />
      <DoorErrorBoundary
        fallback={<ContactSection id={id} className="contact-space__door" webgl={false} onReady={onReady} autoOpen startSignal={revealed} />}
      >
        <ContactSection id={id} className="contact-space__door" onReady={onReady} autoOpen startSignal={revealed} />
      </DoorErrorBoundary>
    </div>
  )
}
