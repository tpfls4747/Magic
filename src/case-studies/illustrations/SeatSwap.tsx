/**
 * Seat Swap 콘셉트 시안 (코드로 그린 임시 목업).
 * 실제 디자인 시안이 아니며, 화면 속 공연명·좌석 번호는 모두 예시입니다.
 * 실제 시안 이미지가 준비되면 데이터에서 illustration 대신 image 를 지정하세요.
 */
import { useId, type ReactNode } from 'react'

const C = {
  ink: '#3a3140',
  inkSoft: '#7a6f80',
  line: '#e6dccb',
  paper: '#fffdf8',
  ivory: '#faf6ee',
  seat: '#ebe3d4',
  seatTaken: '#f4efe6',
  gold: '#c9a868',
  goldDeep: '#a8874f',
  lav: '#b9a8dc',
  lavInk: '#7f6cb3',
  lavPale: '#efeaf8',
}

const FONT = "'Pretendard', system-ui, -apple-system, 'Segoe UI', 'Noto Sans KR', sans-serif"
const SERIF = "'Cormorant Garamond', 'Times New Roman', serif"

/** 스마트폰 프레임 — 화면 내용은 300×620 좌표계 */
function Phone({ children, title }: { children: ReactNode; title: string }) {
  // 한 페이지에 여러 대가 그려지므로 SVG 정의 id 를 인스턴스마다 다르게
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const rim = `cs-rim-${uid}`
  const clip = `cs-clip-${uid}`
  return (
    <svg
      viewBox="0 0 300 620"
      className="cs-illu-phone"
      role="img"
      aria-label={title}
      style={{ fontFamily: FONT }}
    >
      <defs>
        <linearGradient id={rim} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#efe2c6" />
          <stop offset="0.5" stopColor="#c9a868" />
          <stop offset="1" stopColor="#e9d8b4" />
        </linearGradient>
        <clipPath id={clip}>
          <rect x="10" y="10" width="280" height="600" rx="34" />
        </clipPath>
      </defs>
      <rect x="1" y="1" width="298" height="618" rx="43" fill={`url(#${rim})`} />
      <rect x="5" y="5" width="290" height="610" rx="39" fill="#2f2834" />
      <g clipPath={`url(#${clip})`}>
        <rect x="10" y="10" width="280" height="600" fill={C.paper} />
        {children}
      </g>
      {/* 다이내믹 아일랜드 */}
      <rect x="116" y="20" width="68" height="20" rx="10" fill="#2f2834" />
    </svg>
  )
}

function StatusBar() {
  return (
    <g fill={C.ink} fontSize="11" fontWeight="600">
      <text x="34" y="35">9:41</text>
      <rect x="236" y="27" width="20" height="10" rx="3" fill="none" stroke={C.ink} strokeWidth="1.2" />
      <rect x="238" y="29" width="14" height="6" rx="1.5" />
    </g>
  )
}

function AppBar({ title, step }: { title: string; step?: string }) {
  return (
    <g>
      <path d="M34 72 l-7 7 7 7" fill="none" stroke={C.ink} strokeWidth="1.8" strokeLinecap="round" />
      <text x="150" y="84" textAnchor="middle" fontSize="14" fontWeight="600" fill={C.ink}>
        {title}
      </text>
      {step && (
        <text x="266" y="84" textAnchor="end" fontSize="10" fill={C.inkSoft} letterSpacing="1">
          {step}
        </text>
      )}
    </g>
  )
}

function Button({ y, label, tone = 'ink' }: { y: number; label: string; tone?: 'ink' | 'gold' }) {
  return (
    <g>
      <rect x="28" y={y} width="244" height="46" rx="23" fill={tone === 'ink' ? C.ink : C.gold} />
      <text x="150" y={y + 28} textAnchor="middle" fontSize="13" fontWeight="600" fill={C.ivory} letterSpacing="0.5">
        {label}
      </text>
    </g>
  )
}

/* ───────────────────────── 화면 1: 좌석 배치도 ───────────────────────── */

const ROWS = 9
const COLS = 10
const MINE = { r: 2, c: 2 }
const CANDIDATE = { r: 5, c: 6 }

function seatPos(r: number, c: number) {
  const aisle = c >= 5 ? 12 : 0
  return { x: 42 + c * 20 + aisle, y: 168 + r * 21 }
}

function SeatMap() {
  const seats: ReactNode[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const { x, y } = seatPos(r, c)
      const mine = r === MINE.r && c === MINE.c
      const cand = r === CANDIDATE.r && c === CANDIDATE.c
      const taken = !mine && !cand && (r * 7 + c * 3) % 5 === 0
      seats.push(
        <rect
          key={`${r}-${c}`}
          x={x}
          y={y}
          width="15"
          height="13"
          rx="3.5"
          fill={mine ? C.gold : cand ? C.lav : taken ? C.seatTaken : C.seat}
          stroke={mine ? C.goldDeep : cand ? C.lavInk : 'none'}
          strokeWidth="1"
        />,
      )
    }
  }
  const a = seatPos(MINE.r, MINE.c)
  const b = seatPos(CANDIDATE.r, CANDIDATE.c)
  return (
    <g>
      {/* 무대 */}
      <path d="M58 132 Q150 108 242 132" fill="none" stroke={C.gold} strokeWidth="2" strokeLinecap="round" />
      <text x="150" y="150" textAnchor="middle" fontSize="9" letterSpacing="3" fill={C.inkSoft}>
        STAGE
      </text>
      {seats}
      {/* 교환 경로 */}
      <path
        d={`M${a.x + 7.5} ${a.y + 16} C ${a.x + 20} ${a.y + 60}, ${b.x - 30} ${b.y - 40}, ${b.x + 7.5} ${b.y - 3}`}
        fill="none"
        stroke={C.lavInk}
        strokeWidth="1.4"
        strokeDasharray="3 4"
        strokeLinecap="round"
      />
      <circle cx={b.x + 7.5} cy={b.y - 3} r="2.4" fill={C.lavInk} />
    </g>
  )
}

export function SeatMapScreen() {
  return (
    <Phone title="좌석 배치도 콘셉트 화면">
      <StatusBar />
      <AppBar title="좌석 교환" step="1 / 3" />
      <text x="34" y="116" fontSize="10" fill={C.inkSoft} letterSpacing="0.5">
        예시 공연 · Sample Concert
      </text>
      <SeatMap />
      {/* 범례 */}
      <g fontSize="9" fill={C.inkSoft}>
        <rect x="40" y="370" width="10" height="9" rx="2.5" fill={C.gold} />
        <text x="55" y="378">내 좌석</text>
        <rect x="104" y="370" width="10" height="9" rx="2.5" fill={C.lav} />
        <text x="119" y="378">교환 후보</text>
        <rect x="178" y="370" width="10" height="9" rx="2.5" fill={C.seatTaken} stroke={C.line} />
        <text x="193" y="378">선택 불가</text>
      </g>
      {/* 하단 시트 */}
      <rect x="10" y="400" width="280" height="210" rx="26" fill={C.ivory} />
      <rect x="132" y="410" width="36" height="4" rx="2" fill={C.line} />
      <g>
        <text x="34" y="446" fontSize="9" letterSpacing="1.5" fill={C.inkSoft}>MY SEAT</text>
        <text x="34" y="472" fontSize="22" fill={C.ink} style={{ fontFamily: SERIF }}>B · 03</text>
        <path d="M130 462 h34 m-6 -5 l6 5 -6 5" fill="none" stroke={C.goldDeep} strokeWidth="1.4" strokeLinecap="round" />
        <text x="184" y="446" fontSize="9" letterSpacing="1.5" fill={C.lavInk}>CANDIDATE</text>
        <text x="184" y="472" fontSize="22" fill={C.ink} style={{ fontFamily: SERIF }}>E · 07</text>
      </g>
      <line x1="34" y1="494" x2="266" y2="494" stroke={C.line} />
      <text x="34" y="516" fontSize="10" fill={C.inkSoft}>같은 구역 · 같은 등급 좌석</text>
      <Button y={536} label="교환 요청하기" />
    </Phone>
  )
}

/* ───────────────────────── 화면 2: 교환 요청 ───────────────────────── */

function MiniTicket({
  y,
  label,
  seat,
  accent,
}: {
  y: number
  label: string
  seat: string
  accent: string
}) {
  return (
    <g>
      <path
        d={`M28 ${y} h244 a6 6 0 0 1 6 6 v24 a10 10 0 0 0 0 20 v24 a6 6 0 0 1 -6 6 h-244 a6 6 0 0 1 -6 -6 v-24 a10 10 0 0 0 0 -20 v-24 a6 6 0 0 1 6 -6 z`}
        fill={C.paper}
        stroke={C.line}
      />
      <rect x="22" y={y} width="5" height="80" fill={accent} opacity="0.9" />
      <text x="44" y={y + 26} fontSize="9" letterSpacing="1.5" fill={C.inkSoft}>{label}</text>
      <text x="44" y={y + 58} fontSize="28" fill={C.ink} style={{ fontFamily: SERIF }}>{seat}</text>
      <line x1="196" y1={y + 14} x2="196" y2={y + 66} stroke={C.line} strokeDasharray="3 3" />
      <text x="234" y={y + 36} textAnchor="middle" fontSize="9" fill={C.inkSoft}>구역</text>
      <text x="234" y={y + 56} textAnchor="middle" fontSize="15" fill={C.ink}>A</text>
    </g>
  )
}

export function RequestScreen() {
  return (
    <Phone title="교환 요청 콘셉트 화면">
      <StatusBar />
      <AppBar title="교환 요청" step="2 / 3" />
      <text x="34" y="128" fontSize="17" fontWeight="600" fill={C.ink}>바뀌는 내용을</text>
      <text x="34" y="150" fontSize="17" fontWeight="600" fill={C.ink}>확인해 주세요</text>
      <MiniTicket y={176} label="현재 좌석" seat="B · 03" accent={C.gold} />
      <g>
        <circle cx="150" cy="276" r="15" fill={C.lavPale} stroke={C.lav} />
        <path d="M144 270 v12 m0 0 l-3 -3 m3 3 l3 -3 M156 282 v-12 m0 0 l-3 3 m3 -3 l3 3" fill="none" stroke={C.lavInk} strokeWidth="1.4" strokeLinecap="round" />
      </g>
      <MiniTicket y={296} label="교환할 좌석" seat="E · 07" accent={C.lav} />
      <g fontSize="11" fill={C.ink}>
        {['좌석 등급 동일', '양쪽 모두 동의 후 진행', '확정 전까지 취소 가능'].map((t, i) => (
          <g key={t} transform={`translate(0 ${410 + i * 30})`}>
            <circle cx="40" cy="0" r="7" fill={C.lavPale} />
            <path d="M36.5 0 l2.5 2.5 4.5 -5" fill="none" stroke={C.lavInk} strokeWidth="1.4" strokeLinecap="round" />
            <text x="56" y="4">{t}</text>
          </g>
        ))}
      </g>
      <Button y={536} label="요청 보내기" />
    </Phone>
  )
}

/* ───────────────────────── 화면 3: 교환 완료 ───────────────────────── */

export function ConfirmScreen() {
  return (
    <Phone title="교환 완료 콘셉트 화면">
      <StatusBar />
      <AppBar title="교환 완료" step="3 / 3" />
      <circle cx="150" cy="160" r="34" fill="#f6eedc" />
      <circle cx="150" cy="160" r="24" fill="none" stroke={C.gold} strokeWidth="1.6" />
      <path d="M139 160 l8 8 15 -16" fill="none" stroke={C.goldDeep} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="150" y="228" textAnchor="middle" fontSize="17" fontWeight="600" fill={C.ink}>좌석이 교환되었어요</text>
      <text x="150" y="250" textAnchor="middle" fontSize="11" fill={C.inkSoft}>새 좌석이 티켓에 반영되었습니다</text>
      {/* 새 티켓 */}
      <g>
        <rect x="40" y="278" width="220" height="216" rx="16" fill={C.paper} stroke={C.gold} strokeWidth="1.2" />
        <rect x="48" y="286" width="204" height="200" rx="11" fill="none" stroke={C.gold} strokeWidth="0.6" opacity="0.7" />
        <text x="150" y="318" textAnchor="middle" fontSize="9" letterSpacing="3" fill={C.goldDeep}>ADMIT ONE</text>
        <text x="150" y="350" textAnchor="middle" fontSize="15" fill={C.ink} style={{ fontFamily: SERIF, fontStyle: 'italic' }}>
          Sample Concert
        </text>
        <line x1="70" y1="370" x2="230" y2="370" stroke={C.line} strokeDasharray="3 3" />
        <text x="150" y="398" textAnchor="middle" fontSize="9" letterSpacing="1.5" fill={C.inkSoft}>NEW SEAT</text>
        <text x="150" y="440" textAnchor="middle" fontSize="38" fill={C.ink} style={{ fontFamily: SERIF }}>E · 07</text>
        <text x="150" y="468" textAnchor="middle" fontSize="9" fill={C.inkSoft}>예시 좌석 정보</text>
      </g>
      <Button y={536} label="티켓 보기" tone="gold" />
    </Phone>
  )
}

/* ───────────────────────── 히어로 구성 ───────────────────────── */

function TicketArt({ tone, seat }: { tone: 'gold' | 'lavender'; seat: string }) {
  const edge = tone === 'gold' ? C.gold : C.lav
  const ink = tone === 'gold' ? C.goldDeep : C.lavInk
  return (
    <svg viewBox="0 0 260 120" aria-hidden="true" style={{ fontFamily: FONT }}>
      <path
        d="M8 2 h244 a6 6 0 0 1 6 6 v38 a14 14 0 0 0 0 28 v38 a6 6 0 0 1 -6 6 h-244 a6 6 0 0 1 -6 -6 v-38 a14 14 0 0 0 0 -28 v-38 a6 6 0 0 1 6 -6 z"
        fill={tone === 'gold' ? '#fbf3e2' : '#f3eefa'}
        stroke={edge}
        strokeWidth="1.5"
      />
      <rect x="22" y="14" width="216" height="92" rx="4" fill="none" stroke={edge} strokeWidth="0.6" />
      <line x1="178" y1="18" x2="178" y2="102" stroke={edge} strokeDasharray="3 4" />
      <text x="36" y="42" fontSize="9" letterSpacing="3" fill={ink}>ADMIT ONE</text>
      <text x="36" y="82" fontSize="32" fill={C.ink} style={{ fontFamily: SERIF, fontStyle: 'italic' }}>
        {seat}
      </text>
      <text x="208" y="66" textAnchor="middle" fontSize="9" letterSpacing="2" fill={ink}>SEAT</text>
    </svg>
  )
}

export function SeatSwapHero() {
  return (
    <div className="cs-illu-hero" role="img" aria-label="좌석 교환 콘셉트 화면과 두 장의 티켓">
      <div className="cs-illu-hero__ticket cs-illu-hero__ticket--a" data-depth="-1">
        <TicketArt tone="gold" seat="B · 03" />
      </div>
      <div className="cs-illu-hero__ticket cs-illu-hero__ticket--b" data-depth="1.4">
        <TicketArt tone="lavender" seat="E · 07" />
      </div>
      <div className="cs-illu-hero__phone" data-depth="0.5">
        <SeatMapScreen />
      </div>
    </div>
  )
}
