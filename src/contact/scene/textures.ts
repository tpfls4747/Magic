import * as THREE from 'three'

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** 문 너머의 세계 — 아이보리 빛의 중심에서 라벤더 안개로, 아주 옅은 별빛 */
export function beyondTexture() {
  return canvasTexture(512, 512, (ctx) => {
    const g = ctx.createRadialGradient(256, 300, 10, 256, 300, 360)
    g.addColorStop(0, '#fffaf0')
    g.addColorStop(0.18, '#fbefdc')
    g.addColorStop(0.45, '#e9dcf6')
    g.addColorStop(1, '#bfaee6')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 512, 512)
    // 지평선의 따뜻한 띠
    const hz = ctx.createLinearGradient(0, 300, 0, 420)
    hz.addColorStop(0, 'rgba(255,240,214,0)')
    hz.addColorStop(0.5, 'rgba(255,240,214,0.55)')
    hz.addColorStop(1, 'rgba(255,240,214,0)')
    ctx.fillStyle = hz
    ctx.fillRect(0, 300, 512, 120)
    let seed = 7
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < 90; i++) {
      ctx.globalAlpha = 0.25 + rnd() * 0.5
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(rnd() * 512, rnd() * 280, 0.6 + rnd() * 1.3, 0, Math.PI * 2)
      ctx.fill()
    }
  })
}

/** 가로 방향 가우시안 띠 (문틈 빛) */
export function seamTexture() {
  return canvasTexture(64, 4, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 64, 0)
    g.addColorStop(0, 'rgba(255,255,255,0)')
    g.addColorStop(0.5, 'rgba(255,255,255,1)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 4)
  })
}

/** 바닥에 드리우는 빛 — 문 쪽(위)이 밝고 앞으로 갈수록 옅어짐, 좌우도 부드럽게 */
export function spillTexture() {
  return canvasTexture(128, 256, (ctx) => {
    const v = ctx.createLinearGradient(0, 0, 0, 256)
    v.addColorStop(0, 'rgba(255,255,255,1)')
    v.addColorStop(0.35, 'rgba(255,255,255,0.55)')
    v.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = v
    ctx.fillRect(0, 0, 128, 256)
    ctx.globalCompositeOperation = 'destination-in'
    const h = ctx.createLinearGradient(0, 0, 128, 0)
    h.addColorStop(0, 'rgba(0,0,0,0)')
    h.addColorStop(0.25, 'rgba(0,0,0,1)')
    h.addColorStop(0.75, 'rgba(0,0,0,1)')
    h.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = h
    ctx.fillRect(0, 0, 128, 256)
  })
}

/** 부드러운 원형 점 */
export function dotTexture() {
  return canvasTexture(64, 64, (ctx) => {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.3, 'rgba(255,255,255,0.8)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 64)
    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.fillRect(31, 6, 2, 52)
    ctx.fillRect(6, 31, 52, 2)
  })
}
