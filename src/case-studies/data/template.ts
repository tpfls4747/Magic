import { pending, type CaseSection, type SectionId } from '../types'

/**
 * 빈 Case Study 섹션 템플릿.
 * 새 프로젝트를 추가할 때 전체 구조를 '자료 필요' 상태로 먼저 만들어 두고,
 * 자료가 생기는 대로 섹션 단위로 덮어쓰면 됩니다.
 *
 *   sections: { ...createBlankSections(), overview: { ... 실제 내용 ... } }
 */
export function createBlankSections(): Record<SectionId, CaseSection> {
  return {
    overview: {
      intro: pending('프로젝트 한두 문장 요약'),
      subsections: [
        {
          heading: '프로젝트 배경',
          kicker: 'Background',
          blocks: [{ type: 'prose', paragraphs: [pending('프로젝트의 실제 배경과 맥락')] }],
        },
        {
          heading: '작업 범위',
          kicker: 'Scope',
          blocks: [
            {
              type: 'facts',
              items: [
                { label: '플랫폼', value: pending('대상 플랫폼') },
                { label: '범위', value: pending('담당한 단계') },
                { label: '형태', value: pending('개인 / 팀 구성') },
              ],
            },
          ],
        },
        {
          heading: '핵심 목표',
          kicker: 'Goals',
          blocks: [
            {
              type: 'cards',
              variant: 'numbered',
              items: [
                { title: pending('목표 1') },
                { title: pending('목표 2') },
                { title: pending('목표 3') },
              ],
            },
          ],
        },
      ],
    },
    problem: {
      subsections: [
        {
          heading: '기존 경험의 불편함',
          kicker: 'Pain Points',
          blocks: [
            {
              type: 'cards',
              items: [
                { title: pending('불편 사항 1'), body: pending('근거') },
                { title: pending('불편 사항 2'), body: pending('근거') },
                { title: pending('불편 사항 3'), body: pending('근거') },
              ],
            },
          ],
        },
        {
          heading: '문제 정의',
          kicker: 'Problem Statement',
          blocks: [{ type: 'statement', label: 'How Might We', text: pending('문제 정의 문장') }],
        },
      ],
    },
    research: {
      subsections: [
        {
          heading: '조사 개요',
          kicker: 'Method',
          blocks: [
            {
              type: 'facts',
              items: [
                { label: '조사 방법', value: pending('조사 방법') },
                { label: '참여자', value: pending('실제 참여자 수와 조건') },
              ],
            },
            {
              type: 'media',
              width: 'wide',
              item: { placeholder: '실제 조사 자료 이미지', alt: '사용자 조사 자료', aspect: '16 / 9' },
            },
          ],
        },
        {
          heading: '인사이트',
          kicker: 'Insights',
          blocks: [
            {
              type: 'cards',
              variant: 'numbered',
              items: [
                { title: pending('인사이트 1'), body: pending('근거') },
                { title: pending('인사이트 2'), body: pending('근거') },
                { title: pending('인사이트 3'), body: pending('근거') },
              ],
            },
          ],
        },
        {
          heading: '사용자 흐름과 페인포인트',
          kicker: 'Journey',
          blocks: [
            {
              type: 'media',
              width: 'wide',
              item: { placeholder: '사용자 여정 지도', alt: '사용자 여정 지도', aspect: '21 / 9' },
            },
          ],
        },
      ],
    },
    solution: {
      subsections: [
        {
          heading: '정보 구조 개선',
          kicker: 'Information Architecture',
          blocks: [
            {
              type: 'media',
              width: 'wide',
              item: { placeholder: '정보 구조(IA) 다이어그램', alt: '정보 구조 다이어그램', aspect: '16 / 9' },
            },
          ],
        },
        {
          heading: 'User Flow',
          kicker: 'Flow',
          blocks: [
            {
              type: 'media',
              width: 'wide',
              item: { placeholder: '유저 플로우 다이어그램', alt: '유저 플로우', aspect: '21 / 9' },
            },
          ],
        },
        {
          heading: 'Wireframe',
          kicker: 'Low Fidelity',
          blocks: [
            {
              type: 'gallery',
              columns: 3,
              items: [
                { placeholder: '와이어프레임 1', alt: '와이어프레임 1', aspect: '3 / 4' },
                { placeholder: '와이어프레임 2', alt: '와이어프레임 2', aspect: '3 / 4' },
                { placeholder: '와이어프레임 3', alt: '와이어프레임 3', aspect: '3 / 4' },
              ],
            },
          ],
        },
        {
          heading: 'UI 디자인',
          kicker: 'Visual Design',
          blocks: [
            {
              type: 'media',
              width: 'wide',
              item: { placeholder: 'UI 디자인 시안', alt: 'UI 디자인', aspect: '16 / 10', tone: 'lavender' },
            },
          ],
        },
        {
          heading: '주요 인터랙션',
          kicker: 'Interaction',
          blocks: [{ type: 'list', items: [pending('주요 인터랙션과 의도')] }],
        },
      ],
    },
    prototype: {
      subsections: [
        {
          heading: '최종 UI',
          kicker: 'Final Mockup',
          blocks: [
            {
              type: 'media',
              width: 'full',
              item: { placeholder: '최종 UI 목업', alt: '최종 UI 목업', aspect: '21 / 9', tone: 'champagne' },
            },
          ],
        },
        {
          heading: '인터랙티브 프로토타입',
          kicker: 'Try It',
          blocks: [
            {
              type: 'links',
              items: [
                { label: 'Live Demo', variant: 'primary', description: pending('라이브 데모 주소') },
                { label: 'Prototype', variant: 'secondary', description: pending('프로토타입 링크') },
              ],
            },
          ],
        },
      ],
    },
    reflection: {
      subsections: [
        {
          heading: '설계 과정에서 배운 점',
          kicker: 'Learnings',
          blocks: [{ type: 'prose', paragraphs: [pending('실제로 배운 점')] }],
        },
        {
          heading: '한계와 향후 개선 방향',
          kicker: 'Next Steps',
          blocks: [{ type: 'list', items: [pending('한계'), pending('개선 방향')] }],
        },
      ],
    },
  }
}
