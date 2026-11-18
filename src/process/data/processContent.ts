import { draft, pending, type ProcessContent } from '../types'

/**
 * Process — How I Create 콘텐츠.
 *
 * ⚠️ 아래 '목적 · 방법 · 산출물'은 일반적인 UX 설계 방법론 설명입니다.
 *    실제로 수행한 리서치 · 검증 · 성과가 아니며, 개인 사례(examples)는 모두 pending() 으로 비워 두었습니다.
 *    실제 경험이 생기면 examples 를 일반 문자열로 바꾸고, 필요하면 purpose 를 내 방식에 맞게 고쳐 쓰세요.
 *
 * 3D 보드에는 title · label · keywords 만 표시되고, 나머지는 HTML 패널에 표시됩니다.
 * artifacts 의 세 번째 소품은 보드 앞에 떠 있는 자료로 배치됩니다.
 * keywords 는 카드에 크게 들어가므로 짧게(2~3개, 각 14자 이내) 유지해주세요.
 */
export const processContent: ProcessContent = {
  lead: draft('문제를 발견하고, 정의하고, 설계하고, 만들어 보고, 다시 확인하는 과정을 작업 보드 위에 펼쳐 두었습니다.'),
  note: '일반적인 UX 설계 과정을 소개하는 예시입니다. 실제 프로젝트 사례는 작성 예정입니다.',

  stages: [
    {
      id: 'discover',
      number: '01',
      title: 'Discover',
      label: '발견',
      keywords: ['User', 'Context', 'Observe'],
      purpose: '사용자와 문제 상황을 이해하는 단계입니다. 사용자가 어떤 맥락에서 어떤 어려움을 겪는지 관찰하고 기록합니다.',
      methods: ['사용자 인터뷰', '맥락 관찰', '데스크 리서치', '경쟁 서비스 분석'],
      deliverables: ['리서치 노트', '관찰 메모', '인터뷰 요약'],
      examples: [pending('이 단계를 실제로 진행한 프로젝트 사례와 자료 이미지')],
      artifacts: ['research-note', 'observation-memo', 'magnifier'],
    },
    {
      id: 'define',
      number: '02',
      title: 'Define',
      label: '정의',
      keywords: ['Insight', 'Problem', 'HMW'],
      purpose: '발견한 내용을 정리해 해결할 문제를 명확히 하고, 핵심 질문(How Might We)을 세우는 단계입니다.',
      methods: ['어피니티 다이어그램', '페르소나', '문제 정의문 작성', 'HMW 질문'],
      deliverables: ['Problem Statement', 'HMW 질문', '핵심 인사이트'],
      examples: [pending('실제로 정의한 문제와 HMW 질문 사례')],
      artifacts: ['problem-card', 'sticky-notes', 'hmw-memo'],
    },
    {
      id: 'design',
      number: '03',
      title: 'Design',
      label: '설계',
      keywords: ['Flow', 'IA', 'Wireframe'],
      purpose: '사용자 흐름과 정보 구조를 설계하고, 와이어프레임으로 화면의 뼈대를 구성하는 단계입니다.',
      methods: ['유저 플로우', '정보 구조(IA)', '와이어프레임', 'UI 스케치'],
      deliverables: ['User Flow 다이어그램', 'IA 맵', '와이어프레임'],
      examples: [pending('실제 플로우 · 와이어프레임 이미지')],
      artifacts: ['wireframe-sheet', 'flow-diagram', 'ui-sketch'],
    },
    {
      id: 'prototype',
      number: '04',
      title: 'Prototype',
      label: '구현',
      keywords: ['Interactive', 'UI', 'Build'],
      purpose: '아이디어를 실제로 만져 볼 수 있는 프로토타입으로 구현해 경험을 미리 확인하는 단계입니다.',
      methods: ['인터랙티브 프로토타입', 'UI 컴포넌트 설계', '웹 구현'],
      deliverables: ['프로토타입 링크', 'UI 컴포넌트', '디자인 시스템 초안'],
      examples: [pending('실제 프로토타입 링크와 화면')],
      artifacts: ['mini-browser', 'ui-components', 'smartphone'],
    },
    {
      id: 'validate',
      number: '05',
      title: 'Validate',
      label: '검증',
      keywords: ['Test', 'Feedback', 'Iterate'],
      purpose: '사용성을 확인하고, 발견한 문제를 바탕으로 디자인을 개선하는 단계입니다.',
      methods: ['사용성 테스트', '피드백 수집', '휴리스틱 평가', '개선 반복'],
      deliverables: ['피드백 정리', '개선 체크리스트', '수정된 화면'],
      examples: [pending('실제 테스트 · 개선 사례 (진행한 경우에만)')],
      artifacts: ['checklist', 'revised-screen', 'feedback-cards'],
    },
  ],
}
