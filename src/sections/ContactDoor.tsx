import { Component, type ReactNode } from 'react'
import { ContactSection } from '@/contact'
import { SPACE_HASH } from '@/lib/space'
import { SpaceBar } from './SpaceBar'
import './ContactDoor.css'

interface ContactDoorProps {
  onReady: () => void
  onBack: () => void
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
 * Contact · The Final Door 공간 — 기존 Contact 모듈(src/contact)을 그대로 띄우고 공통 상단 바만 덧붙입니다.
 * 원본의 'Back to the Beginning' 은 사이트의 처음 공간인 전시관으로 돌아가는 동작으로 연결합니다.
 * (Close Door = 문만 닫기 / Back to Gallery · Back to the Beginning = 전시관으로)
 */
export default function ContactDoor({ onReady, onBack }: ContactDoorProps) {
  const id = SPACE_HASH.contact.slice(1)
  return (
    <div className="space-page contact-space">
      <SpaceBar current="contact" onBack={onBack} />
      <DoorErrorBoundary
        fallback={<ContactSection id={id} className="contact-space__door" webgl={false} onReady={onReady} onBackToBeginning={onBack} />}
      >
        <ContactSection id={id} className="contact-space__door" onReady={onReady} onBackToBeginning={onBack} />
      </DoorErrorBoundary>
    </div>
  )
}
