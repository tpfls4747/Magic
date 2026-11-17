# 황금 자물쇠 Intro (`src/intro/`)

Unlock My World 첫 화면 — 황금 열쇠를 눌러 하트형 황금 자물쇠를 열고, 자물쇠가 카메라 쪽으로 다가와 화면을 채운 뒤 마법의 빛과 함께 전시관으로 넘어가는 인트로입니다.

이 폴더는 **독립 모듈**입니다. 기존 전시관 코드(`App.tsx`, `CameraRig.tsx`, `ScrollTour.tsx`, `src/styles/*` 등)를 import하지도, 수정하지도 않습니다.
외부 모델·HDR 파일 없이 Three.js 절차적 지오메트리만으로 만들었습니다.

## 스크린샷 (2.0)

| 1. 첫 화면 | 2. 열쇠 삽입 | 3. 잠금 해제 | 4. 화면 50% |
|---|---|---|---|
| ![](screenshots/01-idle.jpg) | ![](screenshots/02-insert.jpg) | ![](screenshots/03-unlock.jpg) | ![](screenshots/04-zoom-half.jpg) |
| **5. 화면 가득 (정적)** | **6. 마법 폭발 (직후)** | **6. 마법 폭발 (확산)** | **7. 빛이 덮음 → 걷힘** |
| ![](screenshots/05-fill.jpg) | ![](screenshots/06-burst-a.jpg) | ![](screenshots/06-burst-b.jpg) | ![](screenshots/07-reveal.jpg) |

| 8. 모바일 첫 화면 | 모바일 해제 | 모바일 가득 | 모바일 폭발 |
|---|---|---|---|
| ![](screenshots/08-mobile-idle.jpg) | ![](screenshots/08-mobile-unlock.jpg) | ![](screenshots/08-mobile-fill.jpg) | ![](screenshots/08-mobile-burst.jpg) |

전체 시퀀스 영상: [`screenshots/intro-sequence.mp4`](screenshots/intro-sequence.mp4) (약 8.6초, 슬로 모션으로 녹화한 뒤 실제 속도로 되돌림)

캡처는 GPU가 없는 헤드리스 브라우저(소프트웨어 렌더링)에서 타임라인을 정확한 시점에 멈춰 찍었습니다. 왼쪽 아래 패널은 `?debug` 이벤트 로그입니다.

## 미리보기

```bash
npm run dev
```

브라우저에서 **http://localhost:5173/src/intro/preview/** 를 엽니다. (기존 앱 `http://localhost:5173/` 은 그대로입니다.)

| 쿼리 | 설명 |
|---|---|
| `?debug` | 이벤트 로그 패널 (phase + 콜백 호출 시각) |
| `?reveal=manual` | 빛이 화면을 덮은 상태에서 멈춤 → "전시관 준비 완료" 버튼으로 걷기 |
| `?slow=0.25` | 해제 시퀀스와 장면 시계를 함께 느리게 재생 (연출 점검용) |

예: `http://localhost:5173/src/intro/preview/?debug&slow=0.3`

## 연출 순서 (2.0)

시점은 `timeline.ts`의 `INTRO_TIMING`과 같습니다.

| 시간(초) | 단계 | phase | 이벤트 |
|---|---|---|---|
| 0 | 첫 프레임 렌더, 자물쇠가 숨 쉬듯 흔들리고 열쇠가 떠 있음 | `idle` | `onEnter` |
| 클릭 | 열쇠(또는 "열쇠로 열기" 버튼) 클릭·탭 | `unlocking` | `onUnlockStart` |
| **Stage A · Unlock** | | | |
| 0 – 1.0 | 열쇠가 포물선으로 날아와 구멍 앞에서 감속, 카메라는 3/4 측면으로 | | |
| 0.95 – 1.25 | 긴장: 조준한 채 살짝 뒤로 물러서며 숨 고르기 | | |
| 1.25 – 1.5 | 단번에 삽입 → 찰칵 반동, 열쇠 구멍에 첫 빛 | | |
| 1.78 – 2.46 | 2단 회전: 텀블러가 하나씩 걸리며 자물쇠와 걸쇠가 들썩 | | |
| 2.44 | 걸쇠가 튀어 오르고 이음새·열쇠 구멍에서 금빛이 새어 나옴, 열쇠는 빛으로 흩어짐 | | `onUnlocked` |
| **Stage B · Cinematic Zoom** | | | |
| 3.15 – 5.0 | 자물쇠가 카메라를 향해 다가옴. 거리가 지수적으로 줄어 처음엔 느리고 끝에서 급가속. 열쇠 구멍을 축으로 살짝 비틀었다가 정면으로 정렬, 시야각이 넓어지며 원근감 강조, 주변 금빛 티끌이 카메라를 스쳐 지나감 | `zooming` | |
| 5.0 – 5.2 | 화면을 가득 채운 채 짧은 정적 (빛이 응축됨) | | |
| **Stage C · Magical Burst** | | | |
| 5.2 – | 코어 섬광, 라벤더 후광, 에너지 링 3겹, 금빛 스파크, 라벤더 입자, 별 스파클, 빛의 궤적, 금박 파편 (모두 Three.js) + 시야각 펀치 | | |
| **Stage D · Transition** | | | |
| 5.45 – 5.95 | 폭발과 같은 색조(아이보리·샴페인 골드·라벤더)의 빛이 화면을 덮음 | `covered` | `onCovered` |
| 6.17 – 7.47 | 빛이 바깥으로 퍼지며 걷히고 다음 화면이 드러남 | `revealing` → `done` | `onComplete` |

- `prefers-reduced-motion`: 확대·폭발·흔들림 없이 짧은 삽입·회전 후 크로스페이드.
- "건너뛰기" 버튼과 `Esc` 키: 같은 시퀀스를 4배속으로 재생합니다 (이벤트 순서·횟수 동일).
- 열쇠·버튼을 여러 번 눌러도 시퀀스는 한 번만 시작되고, 모든 이벤트는 정확히 한 번씩 발행됩니다.

## 2.0에서 바뀐 점

- **확대**: 자물쇠를 시선축 위로 끌어오는 방식은 그대로, 거리를 지수 보간해서 갈수록 가속. 열쇠 구멍 피벗을 축으로 한 3D 비틀림, 시야각 확대, 속도감 티끌 추가. 최종 거리는 화면 비율에 맞춰 계산해서 하트 몸체가 화면 경계 밖까지 채우고, 근접 클리핑이 생기지 않습니다.
- **마법 폭발** (`MagicEffects.tsx`의 `MagicBurst`): 카메라에 붙은 그룹에서 GPU 셰이더로 움직이는 입자·링·궤적. 포스트프로세싱 없이 구현했고, 모바일에서는 입자 수를 약 55%로 줄입니다.
- **재질·조명**: ACES → Neutral 톤 매핑으로 바꿔 금색이 갈색으로 눌리지 않게 했습니다. 정면 대형 소프트박스로 확대 중에도 앞면이 밝은 샴페인 골드로 유지되고, 베벨이 두꺼워졌으며, 보석은 브릴리언트 컷 형태와 높은 굴절률을 씁니다. 열쇠 두께도 키웠습니다.
- **첫 화면**: 아래쪽 약 30%는 제목 영역으로 비워 두고, 제목 뒤에 옅은 크림 안개를 깔았으며, 마법진은 더 옅게 했습니다.

## 폴더 구조

```
src/intro/
├── index.ts               공개 API (GoldenLockIntro, IntroGate, INTRO_EVENTS, 타입)
├── GoldenLockIntro.tsx    전체 화면 Intro 컴포넌트 (Canvas + 안내 UI + 빛 오버레이)
├── GoldenLockIntro.css    .gl-intro 범위 스타일 (공통 스타일 미사용)
├── IntroGate.tsx          연결 도우미: <IntroGate><App /></IntroGate>
├── events.ts              진입·완료 이벤트 계약 (props 콜백 + window CustomEvent)
├── animState.ts           GSAP ↔ useFrame 공유 애니메이션 값
├── timeline.ts            열쇠 클릭 이후 GSAP 타임라인
├── scene/
│   ├── IntroScene.tsx     장면 구성, 반응형 카메라, 확대 연출
│   ├── Padlock.tsx        하트형 자물쇠 (베벨 압출 몸체, U자 걸쇠, 열쇠 구멍 장식판, 진주, 보석)
│   ├── GoldenKey.tsx      입체 열쇠 (하트 고리, 진주 원환, 선반 칼라, 이), 클릭 판정
│   ├── MagicEffects.tsx   마법진, 떠다니는 반짝임, 열쇠 구멍 빛, 빛 입자 폭발
│   ├── StudioEnvironment.tsx  라이트포머 기반 반사 환경 (외부 HDR 없음)
│   ├── materials.ts       샴페인 골드, 로즈 골드, 라벤더 보석, 진주 머티리얼
│   ├── geometry.ts        하트, 열쇠 구멍, 걸쇠 경로, 열쇠 이 윤곽
│   ├── textures.ts        캔버스 텍스처 (글로우, 별, 마법진)
│   ├── layout.ts          치수, 열쇠 구멍 좌표
│   └── palette.ts         크림 · 라벤더 · 샴페인 골드
├── preview/               독립 미리보기 (index.html, main.tsx, preview.css)
└── screenshots/           README용 캡처
```

## 전시관에 연결하는 방법 (추후)

### 1) 가장 간단한 방법 — `IntroGate`

```tsx
// main.tsx (나중에 연결할 때)
import { IntroGate } from './intro'

<IntroGate>
  <App />
</IntroGate>
```

빛이 화면을 덮는 순간(`onCovered`) `<App />`을 아래에 마운트하고, 빛이 걷히면(`onComplete`) Intro를 언마운트합니다.

### 2) 직접 제어

```tsx
<GoldenLockIntro
  onEnter={() => {}}
  onUnlockStart={() => {}}
  onUnlocked={() => {}}
  onCovered={() => setShowExhibition(true)} // 이 시점에 전시관 마운트
  onComplete={() => setShowIntro(false)}    // 이후 Intro 언마운트
/>
```

전시관 로딩이 오래 걸리면 `autoReveal={false}`로 두고, 준비가 끝났을 때 `revealSignal={true}`로 바꿔 빛을 걷어 주세요.

### 3) 컴포넌트 결합 없이 — window 이벤트

```ts
import { INTRO_EVENTS } from './intro'
window.addEventListener(INTRO_EVENTS.complete, () => { /* 스크롤 투어 시작 등 */ })
```

| 이벤트 | 이름 |
|---|---|
| 진입 | `unlockmyworld:intro-enter` |
| 해제 시작 | `unlockmyworld:intro-unlock-start` |
| 해제 완료 | `unlockmyworld:intro-unlocked` |
| 화면 덮음 | `unlockmyworld:intro-covered` |
| 완료 | `unlockmyworld:intro-complete` |

> 주의: Intro는 `position: fixed; z-index: 1000` 오버레이입니다. 필요하면 `--gl-intro-z` CSS 변수로 바꿀 수 있습니다.
> 전시관이 `onCovered`에 마운트되면 Intro와 전시관 Canvas 두 개가 잠시 동시에 존재합니다. 빛이 덮은 뒤 Intro 캔버스는 숨겨지고, `onComplete` 후 언마운트됩니다.

## 외부 3D 모델 제안 (선택)

지금 버전은 외부 파일 없이 완성되어 있습니다. 더 정교한 조형이 필요하면 아래 모델로 교체할 수 있습니다. `Padlock.tsx` / `GoldenKey.tsx`만 `useGLTF` 기반으로 바꾸면 되고, 애니메이션 계약(`IntroAnim`)은 그대로 쓸 수 있습니다.

| 모델 | 요구 사항 | 파일 |
|---|---|---|
| **하트형(또는 앤티크) 장식 자물쇠** | 걸쇠(샤클)를 별도 메시로 분리하고 피벗을 왼쪽 다리 축에 둘 것. 몸체, 걸쇠, 열쇠 구멍 장식판, 보석을 메시별로 나눠 머티리얼 교체 가능하게. 열쇠 구멍은 실제로 뚫린 깊이가 있을 것. 20k–40k tris | `public/models/intro/padlock.glb` (Draco 압축) |
| **장식 열쇠 (빅토리안 / 마법 지팡이풍)** | 원점을 열쇠 끝(tip)에, 샤프트는 +Y 방향. 고리(bow), 샤프트, 이(bit)를 분리. 고리에 보석 소켓. 10k–20k tris | `public/models/intro/key.glb` |
| **HDR 환경맵 (선택)** | 따뜻한 스튜디오 소프트박스 계열 1k HDR (예: Poly Haven의 studio 계열, CC0) — 현재 라이트포머 환경 대신 사용 | `public/textures/intro/studio_1k.hdr` |
| **노멀/러프니스 맵 (선택)** | 브러시드 골드 미세 결, 각인 문양(필리그리) 노멀 맵 1k, 타일 가능 | `public/textures/intro/` |

작업 조건: PBR Metal/Rough, 금속 부분은 `metalness=1`, 실측 비율(자물쇠 높이 약 2.6 단위), Y-up, glTF 2.0. Sketchfab의 CC-BY/CC0 모델을 쓸 경우 라이선스와 출처 표기를 확인해야 합니다.
