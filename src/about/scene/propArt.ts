import { grain, makeCanvas, seeded, toTexture } from './textures'

const SERIF = "'Cormorant Garamond', 'Times New Roman', serif"
const INK = '#4a3f58'

/** 라벤더 메모 맨 위 장 — 손글씨처럼 기울인 짧은 메모 */
export function drawMemo() {
  const S = 512
  const { canvas, ctx } = makeCanvas(S, S)
  ctx.fillStyle = '#d6cbee'
  ctx.fillRect(0, 0, S, S)
  // 위쪽 접착 띠
  ctx.fillStyle = 'rgba(255,255,255,0.18)'
  ctx.fillRect(0, 0, S, 70)
  grain(ctx, S, S, 10, 5)
  ctx.save()
  ctx.translate(60, 190)
  ctx.rotate(-0.06)
  ctx.fillStyle = INK
  ctx.font = `italic 400 92px ${SERIF}`
  ctx.fillText('Who I am', 0, 0)
  ctx.font = `italic 400 52px ${SERIF}`
  ctx.fillStyle = 'rgba(74,63,88,0.75)'
  ctx.fillText('— open the diary', 10, 90)
  // 작은 별과 화살표
  ctx.strokeStyle = '#a8874f'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(30, 190)
  ctx.bezierCurveTo(120, 240, 230, 230, 330, 180)
  ctx.moveTo(300, 168)
  ctx.lineTo(332, 180)
  ctx.lineTo(312, 208)
  ctx.stroke()
  ctx.restore()
  star(ctx, 420, 110, 18)
  return toTexture(canvas)
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.fillStyle = '#a8874f'
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const rr = i % 2 ? r * 0.28 : r
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
  }
  ctx.fill()
}

/** 컬러 스와치 카드 — 위는 색, 아래는 흰 라벨 */
export function drawSwatch(color: string, label: string, code: string) {
  const W = 128
  const H = 512
  const { canvas, ctx } = makeCanvas(W, H)
  ctx.fillStyle = '#fbf8f2'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = color
  ctx.fillRect(0, 0, W, H * 0.7)
  ctx.fillStyle = INK
  ctx.font = `600 18px system-ui, sans-serif`
  ctx.fillText(label, 12, H * 0.7 + 40)
  ctx.font = `400 15px system-ui, sans-serif`
  ctx.fillStyle = 'rgba(74,63,88,0.6)'
  ctx.fillText(code, 12, H * 0.7 + 66)
  // 아래 구멍 자리
  ctx.beginPath()
  ctx.arc(W / 2, H - 28, 9, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(74,63,88,0.25)'
  ctx.lineWidth = 2
  ctx.stroke()
  grain(ctx, W, H, 5, code.length)
  return toTexture(canvas)
}

/** 스케치 카드 — 와이어프레임을 연필로 그린 듯한 추상 레이아웃 (실제 작업물이 아닌 장식) */
export function drawSketch(seed: number) {
  const W = 512
  const H = 360
  const { canvas, ctx } = makeCanvas(W, H)
  ctx.fillStyle = '#fbf7ef'
  ctx.fillRect(0, 0, W, H)
  grain(ctx, W, H, 8, seed)
  const rand = seeded(seed)
  ctx.strokeStyle = 'rgba(74,63,88,0.55)'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  const wobble = (x0: number, y0: number, x1: number, y1: number) => {
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    const mx = (x0 + x1) / 2 + (rand() - 0.5) * 3
    const my = (y0 + y1) / 2 + (rand() - 0.5) * 3
    ctx.quadraticCurveTo(mx, my, x1, y1)
    ctx.stroke()
  }
  const box = (x: number, y: number, w: number, h: number) => {
    wobble(x, y, x + w, y)
    wobble(x + w, y, x + w, y + h)
    wobble(x + w, y + h, x, y + h)
    wobble(x, y + h, x, y)
  }
  if (seed % 2) {
    // 모바일 화면 두 개
    for (const ox of [70, 280]) {
      box(ox, 40, 160, 280)
      box(ox + 16, 70, 128, 80)
      for (let i = 0; i < 4; i++) wobble(ox + 16, 180 + i * 22, ox + 16 + 60 + rand() * 60, 180 + i * 22)
      ctx.strokeStyle = 'rgba(127,108,179,0.7)'
      box(ox + 16, 280, 128, 24)
      ctx.strokeStyle = 'rgba(74,63,88,0.55)'
    }
    ctx.strokeStyle = 'rgba(168,135,79,0.8)'
    wobble(232, 180, 276, 180)
    wobble(266, 172, 276, 180)
    wobble(266, 188, 276, 180)
  } else {
    // 웹 레이아웃
    box(40, 40, 432, 280)
    wobble(40, 80, 472, 80)
    box(64, 108, 200, 120)
    for (let i = 0; i < 5; i++) wobble(290, 116 + i * 24, 290 + 100 + rand() * 70, 116 + i * 24)
    ctx.strokeStyle = 'rgba(127,108,179,0.7)'
    box(64, 252, 120, 36)
    ctx.strokeStyle = 'rgba(168,135,79,0.8)'
    ctx.beginPath()
    ctx.arc(420, 270, 22, 0, Math.PI * 2)
    ctx.stroke()
  }
  return toTexture(canvas)
}
