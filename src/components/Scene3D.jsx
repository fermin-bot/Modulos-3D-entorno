import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useRef, Suspense } from 'react'
import { SCALE_CM_PER_PX, WALL_HEIGHT_CM, WALL_THICKNESS_CM, SLAB_THICKNESS_CM } from '../utils/constants'
import { getAllWallSegments } from '../utils/walls'

function Floor({ x, y, w, h }) {
  const sx = (w * SCALE_CM_PER_PX) / 100
  const sz = (h * SCALE_CM_PER_PX) / 100
  const px = (x + w / 2) * SCALE_CM_PER_PX / 100
  const pz = (y + h / 2) * SCALE_CM_PER_PX / 100
  const ty = SLAB_THICKNESS_CM / 100 / 2
  return (
    <mesh position={[px, ty, pz]}>
      <boxGeometry args={[sx, SLAB_THICKNESS_CM / 100, sz]} />
      <meshStandardMaterial color="#dddddd" />
    </mesh>
  )
}

function Wall({ x1, y1, x2, y2 }) {
  // Convertir segmento 2D a caja 3D con grosor WALL_THICKNESS y altura WALL_HEIGHT
  const cx = (x1 + x2) / 2
  const cy = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const lengthPx = Math.sqrt(dx * dx + dy * dy)
  const lengthM = (lengthPx * SCALE_CM_PER_PX) / 100
  const thicknessM = WALL_THICKNESS_CM / 100
  const heightM = WALL_HEIGHT_CM / 100
  const angle = Math.atan2(dy, dx)
  const px = (cx * SCALE_CM_PER_PX) / 100
  const pz = (cy * SCALE_CM_PER_PX) / 100
  return (
    <mesh position={[px, heightM / 2, pz]} rotation={[0, -angle, 0]}>
      <boxGeometry args={[lengthM, heightM, thicknessM]} />
      <meshStandardMaterial color="#cfcfcf" />
    </mesh>
  )
}

function FurnitureBox({ x, y, w, h, color }) {
  const sx = (w * SCALE_CM_PER_PX) / 100
  const sz = (h * SCALE_CM_PER_PX) / 100
  const heightM = 0.5 // 50 cm por defecto
  const px = (x + w / 2) * SCALE_CM_PER_PX / 100
  const pz = (y + h / 2) * SCALE_CM_PER_PX / 100
  const offsetYcm = 0 // se aplicará en render principal para no elevar módulos
  return (
    <mesh position={[px, heightM / 2 + offsetYcm / 100, pz]}>
      <boxGeometry args={[sx, heightM, sz]} />
      <meshStandardMaterial color={color || '#aaaaaa'} />
    </mesh>
  )
}

function Chair({ x, y, w, h, color }) {
  const seatHeightM = 0.45
  const backHeightM = 0.9
  const seatThicknessM = 0.05
  const legThicknessM = 0.03
  const sx = (w * SCALE_CM_PER_PX) / 100
  const sz = (h * SCALE_CM_PER_PX) / 100
  const px = (x + w / 2) * SCALE_CM_PER_PX / 100
  const pz = (y + h / 2) * SCALE_CM_PER_PX / 100
  const materialColor = color || '#aaaaaa'
  return (
    <group position={[px, 0, pz]}>
      <mesh position={[0, seatHeightM, 0]}>
        <boxGeometry args={[sx, seatThicknessM, sz]} />
        <meshStandardMaterial color={materialColor} />
      </mesh>
      <mesh position={[0, (backHeightM + seatHeightM) / 2, -sz / 2 + legThicknessM / 2]}>
        <boxGeometry args={[sx, backHeightM - seatHeightM, legThicknessM]} />
        <meshStandardMaterial color={materialColor} />
      </mesh>
      {[
        [-sx / 2 + legThicknessM / 2, seatHeightM / 2, -sz / 2 + legThicknessM / 2],
        [sx / 2 - legThicknessM / 2, seatHeightM / 2, -sz / 2 + legThicknessM / 2],
        [-sx / 2 + legThicknessM / 2, seatHeightM / 2, sz / 2 - legThicknessM / 2],
        [sx / 2 - legThicknessM / 2, seatHeightM / 2, sz / 2 - legThicknessM / 2],
      ].map((p, i) => (
        <mesh key={i} position={p}>
          <boxGeometry args={[legThicknessM, seatHeightM, legThicknessM]} />
          <meshStandardMaterial color={materialColor} />
        </mesh>
      ))}
    </group>
  )
}

function CustomModel({ el }) {
  const url = el.model3d?.url
  const scale = el.model3d?.scale ?? 1
  const rotY = (el.model3d?.rotationY ?? 0) * Math.PI / 180
  const px = (el.x + el.w / 2) * SCALE_CM_PER_PX / 100
  const pz = (el.y + el.h / 2) * SCALE_CM_PER_PX / 100
  const gltf = useGLTF(url || '', true)
  // Calcular bounding box para escalado por huella y altura
  const bbox = new THREE.Box3().setFromObject(gltf.scene)
  const size = new THREE.Vector3()
  bbox.getSize(size)
  const targetX = (el.w * SCALE_CM_PER_PX) / 100
  const targetZ = (el.h * SCALE_CM_PER_PX) / 100
  const fit = el.model3d?.fitFootprint ?? true
  const targetY = el.model3d?.heightCm ? (el.model3d.heightCm / 100) : size.y * scale
  const sx = fit && size.x > 0 ? (targetX / size.x) * scale : scale
  const sz = fit && size.z > 0 ? (targetZ / size.z) * scale : scale
  const sy = el.model3d?.heightCm && size.y > 0 ? (targetY / size.y) : scale
  const offsetY = (el.model3d?.offsetY ?? 0) / 100
  return (
    <group position={[px, offsetY, pz]} rotation={[0, rotY, 0]} scale={[sx, sy, sz]}>
      <primitive object={gltf.scene} />
    </group>
  )
}

function CameraUI() {
  const { camera } = useThree()
  const controls = useRef()
  useFrame(() => {
    controls.current && controls.current.update()
  })

  const setView = (type) => {
    const target = { x: 0, y: 0, z: 0 }
    if (type === 'iso') {
      camera.position.set(5, 5, 5)
    } else if (type === 'top') {
      camera.position.set(0, 10, 0.001)
    } else if (type === 'front') {
      camera.position.set(0, 3, 8)
    } else if (type === 'left') {
      camera.position.set(-8, 3, 0)
    }
    controls.current && controls.current.target.set(target.x, target.y, target.z)
    camera.updateProjectionMatrix()
  }

  return (
    <>
      <OrbitControls ref={controls} makeDefault />
      <Html prepend>
        <div className="camera-ui">
          <button onClick={() => setView('iso')}>Isométrica</button>
          <button onClick={() => setView('top')}>Superior</button>
          <button onClick={() => setView('front')}>Frontal</button>
          <button onClick={() => setView('left')}>Izquierda</button>
        </div>
      </Html>
    </>
  )
}

export default function Scene3D({ elements }) {
  return (
    <div className="scene3d">
      <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} />
        <Suspense fallback={null}>
          {elements.map((el) => (
            <group key={el.id}>
              {el.type === 'module' ? (
                <>
                  <Floor x={el.x} y={el.y} w={el.w} h={el.h} />
                  {/* Paredes según porcentaje/offset */}
                  {getAllWallSegments(el).map((s, idx) => (
                    <Wall key={idx} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />
                  ))}
                </>
              ) : (
                el.model3d?.type && el.model3d.type !== 'default' && el.model3d?.url ? (
                  <CustomModel el={el} />
                ) : el.type === 'chair' ? (
                  // aplicar offsetY también a procedural
                  (() => {
                    const oy = (el.model3d?.offsetY ?? 0) / 100
                    const px = (el.x + el.w / 2) * SCALE_CM_PER_PX / 100
                    const pz = (el.y + el.h / 2) * SCALE_CM_PER_PX / 100
                    return (
                      <group position={[px, oy, pz]}>
                        <Chair x={el.x} y={el.y} w={el.w} h={el.h} color={el.color} />
                      </group>
                    )
                  })()
                ) : (
                  (() => {
                    const oy = (el.model3d?.offsetY ?? 0) / 100
                    const sx = (el.w * SCALE_CM_PER_PX) / 100
                    const sz = (el.h * SCALE_CM_PER_PX) / 100
                    const heightM = 0.5
                    const px = (el.x + el.w / 2) * SCALE_CM_PER_PX / 100
                    const pz = (el.y + el.h / 2) * SCALE_CM_PER_PX / 100
                    return (
                      <mesh position={[px, heightM / 2 + oy, pz]}>
                        <boxGeometry args={[sx, heightM, sz]} />
                        <meshStandardMaterial color={el.color || '#aaaaaa'} />
                      </mesh>
                    )
                  })()
                )
              )}
            </group>
          ))}
        </Suspense>
        <CameraUI />
      </Canvas>
    </div>
  )
}