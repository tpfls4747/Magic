import * as THREE from 'three'

/**
 * 티켓 표면의 인쇄 디테일을 캔버스로 그립니다.
 * - ink: 잉크로 인쇄된 글자·바코드·절취선 (컬러 텍스처)
 * - foil: 금박으로 찍힌 부분 (금속 재질의 alphaMap)
 * - back: 뒷면의 라벤더 지문 무늬
 *
 * 캔버스 좌표는 티켓 실제 크기와 1:1 로 대응합니다. (TICKET 상수 참고)
 */

export const TICKET = {
  width: 0.64,
  height: 0.25,
  /** 오른쪽 절취 스텁 폭 */
  stubWidth: 0.17,
  /** 절취선 양끝의 반원 노치 반지름 */
  notchRadius: 0.02,
  cornerRadius: 0.018,
  /** 카드 두께 (베벨 제외) */
  depth: 0.006,
  bevel: 0.0016,
} as const

/** 절취선의 x 좌표 (티켓 중심 기준, m) */
export const PERF_X = TICKET.width / 2 - TICKET.stubWidth

const PX_W = 1024
const PX_H = 400
const toPxX = (x: number) => ((x + TICKET.width / 2) / TICKET.width) * PX_W
const PERF_PX = toPxX(PERF_X)

export interface TicketInfo {
  row: string
  seat: string
  gate: string
  serial: string
  /** 스텁 색 — 두 장이 자리를 바꿀 때 한눈에 구분되도록 */
  accent: 'gold' | 'lavender'
}

const STUB_WASH = {
  gold: 'rgba(214, 186, 132, 0.30)',
  lavender: 'rgba(170, 150, 215, 0.34)',
}

const INK = '#3d3346'
const INK_SOFT = 'rgba(61, 51, 70, 0.62)'
const LAVENDER = '#8e7bc2'
const SERIF = '"Cormorant Garamond", "Times New Roman", serif'
const SANS = 'system-ui, -apple-system, "Segoe UI", "Noto Sans KR", sans-serif'

function makeCanvas() {
  const canvas = document.createElement('canvas')
  canvas.width = PX_W
  canvas.height = PX_H
  return canvas
}

type Ctx = CanvasRenderingContext2D & { letterSpacing?: string }

function spaced(ctx: Ctx, value: string) {
  // letterSpacing 미지원 브라우저에서는 그냥 무시됩니다.
  if ('letterSpacing' in ctx) ctx.letterSpacing = value
}

/** 결정적인 의사 난수 (바코드 패턴용) */
function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
}

function drawInk(ctx: Ctx, info: TicketInfo) {
  ctx.clearRect(0, 0, PX_W, PX_H)
  ctx.textBaseline = 'alphabetic'

  // ── 본문 영역
  ctx.fillStyle = INK_SOFT
  ctx.font = `500 16px ${SANS}`
  spaced(ctx, '5px')
  ctx.fillText('UNLOCK MY WORLD  ·  LIVE', 62, 90)

  ctx.fillStyle = INK
  ctx.font = `400 25px ${SANS}`
  spaced(ctx, '1px')
  ctx.fillText('공연 좌석 교환 UX', 64, 222)

  ctx.strokeStyle = 'rgba(61, 51, 70, 0.28)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(62, 250)
  ctx.lineTo(PERF_PX - 70, 250)
  ctx.stroke()

  const cols: [string, string, number][] = [
    ['DATE', '12.24', 62],
    ['TIME', '19:30', 196],
    ['ROW', info.row, 330],
    ['SEAT', info.seat, 432],
    ['GATE', info.gate, 548],
  ]
  for (const [label, value, x] of cols) {
    ctx.fillStyle = LAVENDER
    ctx.font = `600 13px ${SANS}`
    spaced(ctx, '3px')
    ctx.fillText(label, x, 290)
    ctx.fillStyle = INK
    ctx.font = `400 40px ${SERIF}`
    spaced(ctx, '0px')
    ctx.fillText(value, x - 1, 338)
  }

  // ── 스텁 바탕색 (노치에 닿지 않도록 절취선에서 조금 떨어져 시작)
  ctx.fillStyle = STUB_WASH[info.accent]
  ctx.beginPath()
  ctx.roundRect(PERF_PX + 34, 12, PX_W - PERF_PX - 46, PX_H - 24, 20)
  ctx.fill()

  // ── 절취선 (작은 타공)
  ctx.fillStyle = 'rgba(110, 96, 132, 0.42)'
  for (let y = 46; y <= PX_H - 46; y += 19) {
    ctx.beginPath()
    ctx.arc(PERF_PX, y, 2.6, 0, Math.PI * 2)
    ctx.fill()
  }

  // ── 스텁
  const cx = PERF_PX + (PX_W - PERF_PX) / 2
  ctx.textAlign = 'center'
  ctx.fillStyle = LAVENDER
  ctx.font = `600 13px ${SANS}`
  spaced(ctx, '4px')
  ctx.fillText('ADMIT ONE', cx + 2, 92)

  ctx.fillStyle = INK
  ctx.font = `400 62px ${SERIF}`
  spaced(ctx, '0px')
  ctx.fillText(`${info.row}·${info.seat}`, cx, 196)

  ctx.fillStyle = INK_SOFT
  ctx.font = `500 12px ${SANS}`
  spaced(ctx, '3px')
  ctx.fillText('ROW · SEAT', cx + 2, 228)

  // 바코드
  const rand = seeded(info.serial.split('').reduce((a, c) => a + c.charCodeAt(0), 7))
  ctx.fillStyle = INK
  let x = cx - 84
  while (x < cx + 84) {
    const w = rand() > 0.62 ? 3.2 : 1.4
    ctx.fillRect(x, 262, w, 56)
    x += w + 1.6 + rand() * 3
  }
  ctx.fillStyle = INK_SOFT
  ctx.font = `500 11px ${SANS}`
  spaced(ctx, '2px')
  ctx.fillText(info.serial, cx + 1, 340)
  ctx.textAlign = 'left'
}

/** 금박 부분 — 흰색이 금박, 검정은 투명 (alphaMap) */
function drawFoil(ctx: Ctx) {
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, PX_W, PX_H)
  ctx.fillStyle = '#fff'
  ctx.strokeStyle = '#fff'

  ctx.font = `italic 400 92px ${SERIF}`
  spaced(ctx, '0px')
  ctx.fillText('Seat Swap', 56, 182)

  // 본문 프레임 안쪽의 가는 두 번째 선 (지오메트리 프레임과 이중선을 이룸)
  ctx.lineWidth = 1.4
  const inset = 47
  ctx.beginPath()
  // 지오메트리 프레임(좌 35px, 우 절취선-56px)보다 12px 안쪽
  ctx.roundRect(inset, inset, PERF_PX - 68 - inset, PX_H - inset * 2, 10)
  ctx.stroke()

  // 스텁 상단의 작은 다이아몬드 장식
  const cx = PERF_PX + (PX_W - PERF_PX) / 2
  for (const dx of [-62, 62]) {
    ctx.save()
    ctx.translate(cx + dx, 87)
    ctx.rotate(Math.PI / 4)
    ctx.fillRect(-3, -3, 6, 6)
    ctx.restore()
  }
}

/** 뒷면 — 라벤더 지문(기요셰) 무늬 */
function drawBack(ctx: Ctx) {
  ctx.clearRect(0, 0, PX_W, PX_H)
  ctx.strokeStyle = 'rgba(142, 123, 194, 0.32)'
  ctx.lineWidth = 1.1
  for (let i = 0; i < 26; i++) {
    ctx.beginPath()
    for (let x = 40; x <= PX_W - 40; x += 6) {
      const y =
        PX_H / 2 +
        Math.sin(x * 0.018 + i * 0.42) * (36 + i * 4.2) * Math.cos(x * 0.004 + i * 0.1)
      if (x === 40) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  ctx.fillStyle = 'rgba(61, 51, 70, 0.55)'
  ctx.font = `500 14px ${SANS}`
  ctx.textAlign = 'center'
  spaced(ctx, '6px')
  ctx.fillText('SEAT SWAP  ·  UNLOCK MY WORLD', PX_W / 2, PX_H - 46)
  ctx.textAlign = 'left'
}

function toTexture(canvas: HTMLCanvasElement, color: boolean) {
  const texture = new THREE.CanvasTexture(canvas)
  if (color) texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

export interface TicketArt {
  ink: THREE.CanvasTexture
  foil: THREE.CanvasTexture
  back: THREE.CanvasTexture
  dispose: () => void
}

/**
 * 티켓 한 장의 인쇄면 텍스처를 만듭니다.
 * 웹폰트가 늦게 로드되면 한 번 더 그려 텍스처를 갱신합니다.
 */
export function createTicketArt(info: TicketInfo): TicketArt {
  const inkCanvas = makeCanvas()
  const foilCanvas = makeCanvas()
  const backCanvas = makeCanvas()
  const ink = toTexture(inkCanvas, true)
  const foil = toTexture(foilCanvas, false)
  const back = toTexture(backCanvas, true)

  const draw = () => {
    drawInk(inkCanvas.getContext('2d') as Ctx, info)
    drawFoil(foilCanvas.getContext('2d') as Ctx)
    drawBack(backCanvas.getContext('2d') as Ctx)
    ink.needsUpdate = foil.needsUpdate = back.needsUpdate = true
  }
  draw()

  let disposed = false
  if (document.fonts?.load) {
    Promise.all([
      document.fonts.load(`italic 400 92px "Cormorant Garamond"`),
      document.fonts.load(`400 40px "Cormorant Garamond"`),
    ])
      .then(() => !disposed && draw())
      .catch(() => {})
  }

  return {
    ink,
    foil,
    back,
    dispose: () => {
      disposed = true
      ink.dispose()
      foil.dispose()
      back.dispose()
    },
  }
}
