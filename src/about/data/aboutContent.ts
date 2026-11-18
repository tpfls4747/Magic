import { draft, pending, type AboutContent } from '../types'

/**
 * About — Behind the Magic 콘텐츠.
 *
 * ⚠️ 실제 자기소개 자료가 아직 없습니다.
 *    - pending(): 실제 내용으로 채워야 하는 자리 — 다이어리에는 빈 줄과 '작성 필요' 안내로 표시
 *    - draft():   방향을 보여주는 임시 문구 — '임시' 표시
 *    - 일반 문자열: 확정된 내용 (현재는 섹션 제목과 항목 이름만 확정)
 *    경력, 능숙도, 성과, 수상 경력은 넣지 않았습니다.
 *
 * 다이어리 3D 페이지 · 모바일 읽기 화면 · '자기소개 바로 보기' 텍스트가 모두 이 파일 하나에서 그려집니다.
 * 3D 페이지 공간에 맞도록 문단은 3~4문장 이내를 권장합니다.
 */
export const aboutContent: AboutContent = {
  name: pending('디자이너 이름'),
  role: draft('UX/UI Designer'),
  lead: draft('마법 같은 경험 뒤에 있는 디자이너의 작업 책상입니다. 다이어리를 열어 저를 소개합니다.'),

  pages: [
    {
      id: 'who',
      number: '01',
      title: 'Who I Am',
      subtitle: '디자이너 소개',
      intro: pending('자기소개 2~3문장 — 어떤 디자이너인지, 무엇에 관심이 있는지'),
      blocks: [
        {
          type: 'paragraph',
          heading: '디자인에 대한 관점',
          text: pending('디자인을 바라보는 나만의 관점 1~2문장'),
        },
        {
          type: 'items',
          heading: '나만의 강점',
          items: [
            { name: 'Strength 01', description: pending('강점 1 — 실제 경험에 근거한 한 줄') },
            { name: 'Strength 02', description: pending('강점 2 — 실제 경험에 근거한 한 줄') },
            { name: 'Strength 03', description: pending('강점 3 — 실제 경험에 근거한 한 줄') },
          ],
        },
      ],
    },
    {
      id: 'what',
      number: '02',
      title: 'What I Do',
      subtitle: '하는 일',
      intro: pending('내가 하는 일을 한두 문장으로 요약'),
      blocks: [
        {
          type: 'items',
          items: [
            {
              name: 'UX Research',
              label: '사용자 조사',
              description: draft('사용자의 맥락을 이해하고 문제를 정의합니다.'),
            },
            {
              name: 'UI Design',
              label: '인터페이스 디자인',
              description: draft('명확하고 아름다운 화면으로 흐름을 정리합니다.'),
            },
            {
              name: 'Interactive Prototyping',
              label: '인터랙티브 프로토타입',
              description: draft('움직이는 프로토타입으로 경험을 미리 확인합니다.'),
            },
            {
              name: 'Creative Development',
              label: '크리에이티브 개발',
              description: draft('디자인을 직접 웹으로 구현합니다.'),
            },
          ],
        },
      ],
    },
    {
      id: 'toolkit',
      number: '03',
      title: 'My Toolkit',
      subtitle: '작업 도구',
      intro: pending('도구를 고르고 쓰는 나만의 방식 한두 문장'),
      blocks: [
        {
          type: 'items',
          items: [
            { name: 'Figma', label: '디자인 · 프로토타입', description: pending('어떻게 활용하는지') },
            { name: 'React', label: '웹 구현', description: pending('어떻게 활용하는지') },
            { name: 'Three.js', label: '3D 인터랙션', description: pending('어떻게 활용하는지') },
            {
              name: 'AI-assisted Prototyping',
              label: 'AI 활용 프로토타입',
              description: pending('어떻게 활용하는지'),
            },
          ],
        },
      ],
    },
  ],

  deskObjects: [
    { object: 'diary', label: 'Diary', hint: '다이어리를 열어 처음부터 읽기', page: 'who' },
    { object: 'memo', label: 'Who I Am', hint: '라벤더 메모 — 디자이너 소개', page: 'who' },
    { object: 'swatches', label: 'What I Do', hint: '컬러 스와치 — 하는 일', page: 'what' },
    { object: 'pencil-cup', label: 'My Toolkit', hint: '펜 꽂이 — 작업 도구', page: 'toolkit' },
  ],
}
