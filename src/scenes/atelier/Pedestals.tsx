import { useMemo } from 'react'
import * as THREE from 'three'
import { PEDESTALS } from './constants'
import { pedestalProfile, Profile } from './geometry'
import { champagneGoldMaterial, stoneMaterial } from './materials'

export const PEDESTAL_HEIGHT = 1.36
const PLINTH_HEIGHT = 0.08

/** 전시대 아래 크림 스톤 원형 단 */
function plinthProfile() {
  return new Profile()
    .to(0, 0)
    .to(0.86, 0)
    .to(0.86, PLINTH_HEIGHT - 0.02)
    .ovolo(0.86, PLINTH_HEIGHT - 0.02, 0.84, PLINTH_HEIGHT, 4)
    .to(0, PLINTH_HEIGHT).points
}

export function Pedestals() {
  const pedestalGeo = useMemo(
    () => new THREE.LatheGeometry(pedestalProfile(PEDESTAL_HEIGHT), 128),
    [],
  )
  const plinthGeo = useMemo(() => new THREE.LatheGeometry(plinthProfile(), 128), [])

  return (
    <group>
      {PEDESTALS.map(({ position }, i) => (
        <group key={i} position={position}>
          <mesh geometry={plinthGeo} material={stoneMaterial} castShadow receiveShadow />
          <mesh
            geometry={pedestalGeo}
            material={champagneGoldMaterial}
            position-y={PLINTH_HEIGHT}
            castShadow
            receiveShadow
          />
        </group>
      ))}
    </group>
  )
}
