# Unlock My World

마법의 황금 자물쇠를 열고 들어가는 **인터랙티브 3D 전시관** 형태의 개인 포트폴리오 웹사이트입니다.
크몽 외주 포트폴리오와 UX/UI 취업용 포트폴리오로 함께 사용합니다.

## 콘셉트

- 크림 · 라벤더 · 샴페인 골드 컬러
- 아치형 건축 구조와 공중에 떠 있는 3D 전시 오브젝트
- 게임이 아닌, 고급스럽고 시네마틱한 디자인 전시 경험
- 스크롤 기반 카메라 이동과 정교한 인터랙션

## 전시 프로젝트

| # | 프로젝트 | 전시 오브젝트 |
|---|----------|---------------|
| 1 | 공연 좌석 교환 UX | 황금 티켓 |
| 2 | 회원가입 UX 리디자인 | 3D 스마트폰 |
| 3 | 개인 웹 프로토타입 | 입체 브라우저 |

## 개발 환경

- **React + Vite + TypeScript**
- **React Three Fiber + Three.js + Drei** — 3D 장면
- **GSAP + ScrollTrigger** (`@gsap/react`) — 스크롤 기반 애니메이션
- **CSS** 기반 반응형 UI
- Node.js 20.19+ (또는 22.12+) 권장

## 시작하기

```bash
npm install
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # 프로덕션 빌드 (dist/)
npm run preview  # 빌드 결과 미리보기
npm run lint     # 코드 검사 (oxlint)
```

## 폴더 구조

```
public/
  models/       3D 모델 (glb/gltf)
  textures/     텍스처 이미지
src/
  components/   공통 UI 컴포넌트
  scenes/       React Three Fiber 3D 장면·오브젝트
  sections/     페이지 섹션 (스크롤 구간)
  hooks/        커스텀 훅
  lib/          설정·유틸 (gsap.ts: GSAP 플러그인 등록)
  data/         프로젝트 콘텐츠 데이터
  styles/       전역 스타일과 디자인 토큰
  types/        공용 타입
```

`@/` 경로 별칭은 `src/`를 가리킵니다. (예: `import { projects } from '@/data/projects'`)

## 진행 상태

- [x] 프로젝트 초기 설정
- [ ] 디자인 시스템 · 레이아웃
- [ ] 3D 전시관 장면 · 황금 자물쇠 인트로
- [ ] 스크롤 카메라 연출 · 인터랙션
