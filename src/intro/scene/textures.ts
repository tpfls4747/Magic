import * as THREE from 'three'

function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  draw(ctx, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

let glowTex: THREE.Texture | null = null
/** 부드러운 원형 글로우 (가산 혼합 스프라이트용) */
export function getGlowTexture() {
  glowTex ??= canvasTexture(128, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.18, 'rgba(255,246,226,0.85)')
    g.addColorStop(0.45, 'rgba(226,210,255,0.28)')
    g.addColorStop(1, 'rgba(226,210,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, s, s)
  })
  return glowTex
}

let starTex: THREE.Texture | null = null
/** 네 갈래 반짝임 (빛 입자) */
export function getStarTexture() {
  starTex ??= canvasTexture(64, (ctx, s) => {
    const c = s / 2
    const core = ctx.createRadialGradient(c, c, 0, c, c, c * 0.5)
    core.addColorStop(0, 'rgba(255,255,255,1)')
    core.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = core
    ctx.fillRect(0, 0, s, s)
    ctx.globalCompositeOperation = 'lighter'
    for (const horizontal of [true, false]) {
      const g = horizontal ? ctx.createLinearGradient(0, c, s, c) : ctx.createLinearGradient(c, 0, c, s)
      g.addColorStop(0, 'rgba(255,255,255,0)')
      g.addColorStop(0.5, 'rgba(255,255,255,0.95)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      if (horizontal) ctx.fillRect(0, c - 1.5, s, 3)
      else ctx.fillRect(c - 1.5, 0, 3, s)
    }
  })
  return starTex
}

let circleTex: THREE.Texture | null = null
/** 자물쇠 뒤에서 천천히 도는 마법진 (선만, 투명 배경) */
export function getMagicCircleTexture() {
  circleTex ??= canvasTexture(1024, (ctx, s) => {
    const c = s / 2
    ctx.translate(c, c)
    ctx.strokeStyle = 'rgba(255,255,255,1)'
    ctx.fillStyle = 'rgba(255,255,255,1)'
    ctx.lineCap = 'round'

    const ring = (r: number, w: number, alpha = 1) => {
      ctx.globalAlpha = alpha
      ctx.lineWidth = w
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, Math.PI * 2)
      ctx.stroke()
    }
    ring(490, 3)
    ring(474, 1.2, 0.7)
    ring(400, 2)
    ring(250, 1.5, 0.8)
    ring(236, 0.8, 0.5)

    // 바깥 눈금
    ctx.globalAlpha = 0.8
    for (let i = 0; i < 120; i++) {
      const a = (i / 120) * Math.PI * 2
      const long = i % 5 === 0
      ctx.lineWidth = long ? 2 : 1
      ctx.beginPath()
      ctx.moveTo(Math.cos(a) * 474, Math.sin(a) * 474)
      ctx.lineTo(Math.cos(a) * (long ? 446 : 460), Math.sin(a) * (long ? 446 : 460))
      ctx.stroke()
    }

    // 링 사이의 작은 별 장식
    const star = (x: number, y: number, r: number) => {
      ctx.beginPath()
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2
        const rr = k % 2 === 0 ? r : r * 0.32
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
      }
      ctx.closePath()
      ctx.fill()
    }
    ctx.globalAlpha = 1
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      star(Math.cos(a) * 425, Math.sin(a) * 425, i % 3 === 0 ? 16 : 9)
    }
    // 점선 원
    ctx.globalAlpha = 0.75
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(Math.cos(a) * 325, Math.sin(a) * 325, 2.4, 0, Math.PI * 2)
      ctx.fill()
    }

    // 겹친 두 정사각형 → 8각 별
    ctx.globalAlpha = 0.9
    ctx.lineWidth = 2
    for (const rot of [0, Math.PI / 4]) {
      ctx.beginPath()
      for (let k = 0; k < 4; k++) {
        const a = rot + (k / 4) * Math.PI * 2
        ctx.lineTo(Math.cos(a) * 400, Math.sin(a) * 400)
      }
      ctx.closePath()
      ctx.stroke()
    }
    // 육각 별
    ctx.lineWidth = 1.4
    ctx.globalAlpha = 0.7
    for (const rot of [Math.PI / 2, -Math.PI / 2]) {
      ctx.beginPath()
      for (let k = 0; k < 3; k++) {
        const a = rot + (k / 3) * Math.PI * 2
        ctx.lineTo(Math.cos(a) * 250, Math.sin(a) * 250)
      }
      ctx.closePath()
      ctx.stroke()
    }
  })
  return circleTex
}
