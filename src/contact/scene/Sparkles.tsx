import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { doorClock, type DoorAnim } from '../animState'
import { DOOR } from './layout'
import { dotTexture } from './textures'

const VERT = /* glsl */ `
  attribute float aSeed;
  attribute float aSize;
  attribute float aKind;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uOpen;
  uniform float uHover;
  uniform float uPx;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float t = uTime * 0.22 + aSeed * 40.0;
    float a;
    if (aKind < 0.5) {
      // 문 주변을 떠도는 금빛 반짝임 — 열리면 바깥으로 살며시 흩어짐
      p.x += sin(t * 1.3) * 0.09;
      p.y += sin(t) * 0.14;
      vec2 d = p.xy - vec2(0.0, 2.0);
      p.xy += normalize(d + 1e-4) * uOpen * (0.25 + aSeed * 0.7);
      p.z += uOpen * aSeed * 0.6;
      a = (0.55 + 0.45 * sin(t * 4.0)) * (1.0 - uOpen * 0.4) * (0.75 + uHover * 0.25);
    } else {
      // 문 너머에서 천천히 흘러나오는 빛 입자 (열렸을 때만)
      float f = fract(aSeed * 7.31 + uTime * 0.035);
      p.z = mix(-4.0, 2.2, f);
      p.y += f * 0.5 + sin(t) * 0.05;
      p.x *= 1.0 + f * 0.6;
      a = uOpen * sin(f * 3.14159) * (0.6 + 0.4 * sin(t * 3.0));
    }
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = min(aSize * uPx / max(-mv.z, 0.1), 40.0);
    vColor = aColor;
    vAlpha = a;
  }
`
const FRAG = /* glsl */ `
  uniform sampler2D uMap;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 t = texture2D(uMap, gl_PointCoord);
    gl_FragColor = vec4(vColor, t.a * vAlpha);
    #include <colorspace_fragment>
  }
`

function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 문 주변의 은은한 마법 입자 — GPU 셰이더로 움직여 모바일에서도 가볍습니다 */
export function DoorSparkles({ anim, front = 150, beyond = 60, animate }: { anim: DoorAnim; front?: number; beyond?: number; animate: boolean }) {
  const { gl } = useThree()
  const { geometry, material } = useMemo(() => {
    const n = front + beyond
    const rand = seeded(17)
    const pos = new Float32Array(n * 3)
    const seed = new Float32Array(n)
    const size = new Float32Array(n)
    const kind = new Float32Array(n)
    const color = new Float32Array(n * 3)
    const gold = [new THREE.Color('#c99a4e'), new THREE.Color('#dcb26a'), new THREE.Color('#e9cf98')]
    const lav = [new THREE.Color('#9d86d6'), new THREE.Color('#b8a5ea')]
    const ivory = new THREE.Color('#fff6e4')
    for (let i = 0; i < n; i++) {
      const isFront = i < front
      if (isFront) {
        // 아치 둘레에 많이, 멀리 갈수록 드물게
        const a = rand() * Math.PI
        const r = DOOR.halfWidth + 0.3 + rand() ** 1.6 * 2.6
        pos.set([Math.cos(a) * r * (rand() < 0.5 ? 1 : -1), Math.max(0.15, DOOR.spring - 0.6 + Math.sin(a) * r * 0.9 - rand() * 2.2), 0.45 + rand() * 1.4], i * 3)
        const c = rand() < 0.72 ? gold[Math.floor(rand() * 3)] : lav[Math.floor(rand() * 2)]
        color.set([c.r, c.g, c.b], i * 3)
        size[i] = 0.035 + rand() * 0.05
      } else {
        pos.set([(rand() - 0.5) * 1.7, 0.25 + rand() * 2.9, 0], i * 3)
        const c = rand() < 0.5 ? ivory : lav[1]
        color.set([c.r, c.g, c.b], i * 3)
        size[i] = 0.03 + rand() * 0.04
      }
      seed[i] = rand()
      kind[i] = isFront ? 0 : 1
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    geometry.setAttribute('aKind', new THREE.BufferAttribute(kind, 1))
    geometry.setAttribute('aColor', new THREE.BufferAttribute(color, 3))
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uOpen: { value: 0 },
        uHover: { value: 0 },
        uPx: { value: 600 },
        uMap: { value: dotTexture() },
      },
      transparent: true,
      depthWrite: false,
    })
    return { geometry, material }
  }, [front, beyond])

  useLayoutEffect(
    () => () => {
      geometry.dispose()
      ;(material.uniforms.uMap.value as THREE.Texture).dispose()
      material.dispose()
    },
    [geometry, material],
  )

  const buf = useMemo(() => new THREE.Vector2(), [])
  useFrame((state) => {
    const cam = state.camera as THREE.PerspectiveCamera
    gl.getDrawingBufferSize(buf)
    material.uniforms.uPx.value = buf.y / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)))
    material.uniforms.uTime.value = animate ? doorClock.time : 3
    material.uniforms.uOpen.value = anim.light
    material.uniforms.uHover.value = anim.hover
  })

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={5} />
}
