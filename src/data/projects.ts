// 전시관에 배치될 프로젝트 목록
export type ExhibitObject = 'golden-ticket' | 'smartphone' | 'browser'

export interface Project {
  id: string
  /** 전시 번호 (전시관 안의 순서) */
  index: number
  title: string
  /** 한국어 부제 */
  subtitle: string
  /** 근접 화면에 표시할 짧은 설명 */
  summary: string
  tags: string[]
  object: ExhibitObject
  /**
   * 상세 페이지(케이스 스터디) 주소.
   * 아직 페이지가 없으면 비워 두고, 버튼은 '준비 중' 상태로 표시합니다.
   */
  caseStudyUrl?: string
}

export const projects: Project[] = [
  {
    id: 'seat-swap',
    index: 1,
    title: 'Seat Swap',
    subtitle: '공연 좌석 교환 UX',
    summary:
      '예매한 공연 좌석을 다른 관객과 맞바꾸는 과정을 더 쉽고 안심할 수 있게 설계한 UX 프로젝트입니다.',
    tags: ['UX Design', 'Mobile'],
    object: 'golden-ticket',
  },
  {
    id: 'signup-redesign',
    index: 2,
    title: 'Sign-up Redesign',
    subtitle: '회원가입 UX 리디자인',
    summary: '',
    tags: [],
    object: 'smartphone',
  },
  {
    id: 'web-prototype',
    index: 3,
    title: 'Web Prototype',
    subtitle: '개인 웹 프로토타입',
    summary: '',
    tags: [],
    object: 'browser',
  },
]

export const getProject = (id: string) => projects.find((p) => p.id === id)
