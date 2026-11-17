import { ContactShadows, MeshReflectorMaterial } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import { HALL, HALL_CENTER_Z, PALETTE, PEDESTALS } from './constants'
import { floorInlayMaterial } from './materials'

const FLOOR_SIZE: [number, number] = [40, 56]
const FLOOR_CENTER_Z = -8
/** 한 장의 텍스처가 표현하는 실제 크기 (2m 대리석 슬래브 4×4장) */
const TEXTURE_METERS = 8

/** 결정적인 난수 — 새로고침해도 같은 바닥 패턴 */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * 크림 대리석 슬래브 텍스처를 캔버스로 생성합니다.
 * 슬래브마다 미세한 톤 차이, 아주 옅은 결(vein), 가는 줄눈을 넣어
 * 공간의 스케일과 원근감을 읽을 수 있게 합니다.
 */
function createMarbleTexture(size: number, anisotropy: number) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const rand = mulberry32(7)
  const tiles = 4
  const t = size / tiles

  ctx.fillStyle = PALETTE.floor
  ctx.fillRect(0, 0, size, size)

  for (let ix = 0; ix < tiles; ix++) {
    for (let iy = 0; iy < tiles; iy++) {
      const x = ix * t
      const y = iy * t
      // 슬래브별 톤 변화
      const shade = (rand() - 0.5) * 10
      ctx.fillStyle = `rgba(${shade > 0 ? '255,250,240' : '200,185,165'},${Math.abs(shade) / 60})`
      ctx.fillRect(x, y, t, t)

      // 부드러운 구름 무늬
      for (let i = 0; i < 6; i++) {
        const gx = x + rand() * t
        const gy = y + rand() * t
        const gr = t * (0.2 + rand() * 0.5)
        const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr)
        grad.addColorStop(0, `rgba(255,252,246,${0.08 + rand() * 0.06})`)
        grad.addColorStop(1, 'rgba(255,252,246,0)')
        ctx.fillStyle = grad
        ctx.save()
        ctx.beginPath()
        ctx.rect(x, y, t, t)
        ctx.clip()
        ctx.fillRect(x, y, t, t)
        ctx.restore()
      }

      // 아주 옅은 결 (슬래브 안에서만)
      ctx.save()
      ctx.beginPath()
      ctx.rect(x, y, t, t)
      ctx.clip()
      const veins = 2 + Math.floor(rand() * 3)
      for (let v = 0; v < veins; v++) {
        ctx.beginPath()
        const sx = x - t * 0.1
        const sy = y + rand() * t
        ctx.moveTo(sx, sy)
        ctx.bezierCurveTo(
          x + t * 0.3,
          sy + (rand() - 0.5) * t * 0.6,
          x + t * 0.7,
          sy + (rand() - 0.5) * t * 0.6,
          x + t * 1.1,
          sy + (rand() - 0.5) * t * 0.5,
        )
        ctx.strokeStyle = `rgba(176,160,140,${0.05 + rand() * 0.06})`
        ctx.lineWidth = 0.6 + rand() * 1.4
        ctx.stroke()
      }
      ctx.restore()
    }
  }

  // 줄눈
  ctx.strokeStyle = 'rgba(150,132,110,0.32)'
  ctx.lineWidth = Math.max(1, size / 700)
  for (let i = 0; i <= tiles; i++) {
    const p = i * t
    ctx.beginPath()
    ctx.moveTo(p, 0)
    ctx.lineTo(p, size)
    ctx.moveTo(0, p)
    ctx.lineTo(size, p)
    ctx.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(FLOOR_SIZE[0] / TEXTURE_METERS, FLOOR_SIZE[1] / TEXTURE_METERS)
  texture.anisotropy = anisotropy
  return texture
}

/** 바닥에 상감된 가는 금색 선 */
function Inlays() {
  const ringGeo = useMemo(() => new THREE.RingGeometry(1.02, 1.045, 128), [])
  const outerRingGeo = useMemo(() => new THREE.RingGeometry(1.14, 1.15, 128), [])
  const lineLength = HALL.frontZ - HALL.backZ - 0.6
  const lineZ = (HALL.frontZ + HALL.backZ) / 2 + 0.3

  return (
    <group position-y={0.002}>
      {PEDESTALS.map(({ position: [x, , z] }) => (
        <group key={`${x}${z}`} position={[x, 0, z]} rotation-x={-Math.PI / 2}>
          <mesh geometry={ringGeo} material={floorInlayMaterial} />
          <mesh geometry={outerRingGeo} material={floorInlayMaterial} />
        </group>
      ))}
      {[-4.9, 4.9].map((x) => (
        <mesh key={x} position={[x, 0, lineZ]} rotation-x={-Math.PI / 2} material={floorInlayMaterial}>
          <planeGeometry args={[0.025, lineLength]} />
        </mesh>
      ))}
    </group>
  )
}

export function Floor({ quality }: { quality: 'high' | 'low' }) {
  const high = quality === 'high'
  const marble = useMemo(() => createMarbleTexture(high ? 2048 : 1024, high ? 8 : 4), [high])

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-z={FLOOR_CENTER_Z} receiveShadow>
        <planeGeometry args={FLOOR_SIZE} />
        <MeshReflectorMaterial
          map={marble}
          color="#ffffff"
          resolution={1024}
          blur={high ? [300, 60] : [220, 60]}
          mixBlur={0.8}
          mixStrength={high ? 0.95 : 0.85}
          mixContrast={1.18}
          mirror={0.5}
          depthScale={1.5}
          minDepthThreshold={0.5}
          maxDepthThreshold={1.6}
          roughness={0.4}
          metalness={0.05}
          envMapIntensity={0.42}
        />
      </mesh>
      <Inlays />
      {/* 기둥·전시대·벽 밑동이 바닥에 닿는 부분의 부드러운 접지 그림자 (정적이라 한 번만 렌더) */}
      <ContactShadows
        frames={1}
        position={[0, 0.004, HALL_CENTER_Z]}
        scale={[13, 30]}
        resolution={high ? 1024 : 512}
        far={2.4}
        blur={2.4}
        opacity={0.42}
        color="#5b4a40"
      />
    </group>
  )
}
