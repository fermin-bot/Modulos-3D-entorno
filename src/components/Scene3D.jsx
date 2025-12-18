import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { useRef } from 'react'
import { SCALE_CM_PER_PX, WALL_HEIGHT_CM, WALL_THICKNESS_CM, SLAB_THICKNESS_CM } from '../utils/constants'

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
  return (
    <mesh position={[px, heightM / 2, pz]}>
      <boxGeometry args={[sx, heightM, sz]} />
      <meshStandardMaterial color={color || '#aaaaaa'} />
    </mesh>
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
        {elements.map((el) => (
          <group key={el.id}>
            {el.type === 'module' ? (
              <>
                <Floor x={el.x} y={el.y} w={el.w} h={el.h} />
                {/* Paredes según toggles */}
                {el.wallN && (
                  <Wall x1={el.x} y1={el.y} x2={el.x + el.w} y2={el.y} />
                )}
                {el.wallS && (
                  <Wall x1={el.x} y1={el.y + el.h} x2={el.x + el.w} y2={el.y + el.h} />
                )}
                {el.wallE && (
                  <Wall x1={el.x + el.w} y1={el.y} x2={el.x + el.w} y2={el.y + el.h} />
                )}
                {el.wallW && (
                  <Wall x1={el.x} y1={el.y} x2={el.x} y2={el.y + el.h} />
                )}
              </>
            ) : (
              <FurnitureBox x={el.x} y={el.y} w={el.w} h={el.h} color={el.color} />
            )}
          </group>
        ))}
        <CameraUI />
      </Canvas>
    </div>
  )
}