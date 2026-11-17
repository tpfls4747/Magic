// 전시관에 배치될 프로젝트 목록 (콘텐츠 데이터만 정의, 장면은 아직 미구현)
export type ExhibitObject = 'golden-ticket' | 'smartphone' | 'browser'

export interface Project {
  id: string
  title: string
  object: ExhibitObject
}

export const projects: Project[] = [
  { id: 'seat-exchange', title: '공연 좌석 교환 UX', object: 'golden-ticket' },
  { id: 'signup-redesign', title: '회원가입 UX 리디자인', object: 'smartphone' },
  { id: 'web-prototype', title: '개인 웹 프로토타입', object: 'browser' },
]
