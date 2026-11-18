/**
 * Contact 섹션의 모든 문구. 카피를 바꿀 때는 이 파일만 수정하면 됩니다.
 * (컴포넌트에 `content` prop 으로 일부만 덮어쓸 수도 있습니다.)
 */
export interface ContactContent {
  /** 섹션 이름 (화면 낭독기·눈썹 문구) */
  eyebrow: string
  /** 닫힌 문 앞 헤드라인 — 줄 단위. 두 번째 줄은 이탤릭으로 강조됩니다 */
  headlineLines: string[]
  subtitle: string
  cta: string
  /** 문을 열지 않고 연락처로 바로 가기 */
  quickView: string
  /** 문이 열린 뒤 */
  revealEyebrow: string
  revealTitle: string
  revealBody: string
  methods: { email: string; linkedin: string }
  actions: { email: string; linkedin: string }
  /** 주소가 아직 연결되지 않았을 때 버튼·값에 표시 */
  pending: string
  pendingHint: string
  closeDoor: string
  backToBeginning: string
  /** 메일 제목 기본값 */
  mailSubject: string
  a11y: {
    sectionLabel: string
    doorHint: string
    opened: string
    closed: string
    newTab: string
  }
}

export const CONTACT_CONTENT: ContactContent = {
  eyebrow: 'Open the Next Door — Beyond My World',
  headlineLines: ['Every New World', 'Begins with a Hello.'],
  subtitle: '새로운 아이디어와 가능성을 함께 열어갈 이야기를 기다립니다.',
  cta: 'Open the Door',
  quickView: 'Contact 바로 보기',
  revealEyebrow: 'Beyond My World',
  revealTitle: "Let's Create Something Magical.",
  revealBody: '함께 만들고 싶은 이야기가 있다면 편하게 연락해 주세요.',
  methods: { email: 'Email', linkedin: 'LinkedIn' },
  actions: { email: 'Send an Email', linkedin: 'Connect on LinkedIn' },
  pending: '준비 중',
  pendingHint: '연락처를 곧 연결할 예정입니다.',
  closeDoor: 'Close Door',
  backToBeginning: 'Back to the Beginning',
  mailSubject: 'Hello from Unlock My World',
  a11y: {
    sectionLabel: 'Contact — 다음 문 열기',
    doorHint: '문을 열면 연락처가 나타납니다. 문 자체를 눌러도 열립니다.',
    opened: '문이 열렸습니다. 연락처가 표시됩니다.',
    closed: '문이 닫혔습니다.',
    newTab: '새 탭에서 열림',
  },
}
