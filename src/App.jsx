import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import Palette from './components/Palette'
import Editor2D from './components/Editor2D'
import PropertiesPanel from './components/PropertiesPanel'
import Scene3D from './components/Scene3D'
import { GRID_SIZE, SCALE_CM_PER_PX } from './utils/constants'
import { snapToGrid } from './utils/snap'
import { exportSVGToPNG } from './utils/exportPNG'

const LOCAL_KEY = 'app2_scene'

function App() {
  const [elements, setElements] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [mode3D, setMode3D] = useState(false)
  const svgRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (Array.isArray(data)) setElements(data)
      } catch (e) {}
    }
  }, [])

  const selectedEl = useMemo(
    () => elements.find((e) => e.id === selectedId) || null,
    [elements, selectedId]
  )

  const addElement = (type) => {
    const id = `${type}_${Date.now()}`
    const defaults = {
      module: { w: 400, h: 300, color: '#d0d0d0', label: 'Módulo', wallN: true, wallS: true, wallE: true, wallW: true },
      sofa: { w: 200, h: 90, color: '#c58c72', label: 'Sofá' },
      table: { w: 180, h: 90, color: '#a3c5d9', label: 'Mesa' },
      chair: { w: 60, h: 60, color: '#b5b5b5', label: 'Silla' },
      bed: { w: 200, h: 150, color: '#9fc59f', label: 'Cama' },
    }
    const d = defaults[type]
    const el = {
      id,
      type,
      x: snapToGrid(100 + Math.random() * 200, GRID_SIZE),
      y: snapToGrid(100 + Math.random() * 200, GRID_SIZE),
      w: d.w,
      h: d.h,
      rot: 0,
      label: d.label,
      color: d.color,
      wallN: type === 'module' ? d.wallN : undefined,
      wallS: type === 'module' ? d.wallS : undefined,
      wallE: type === 'module' ? d.wallE : undefined,
      wallW: type === 'module' ? d.wallW : undefined,
    }
    setElements((prev) => [...prev, el])
    setSelectedId(id)
  }

  const updateElement = (id, patch) => {
    setElements((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }

  const deleteAll = () => {
    setElements([])
    setSelectedId(null)
  }

  const saveScene = () => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(elements))
  }

  const loadScene = () => {
    const saved = localStorage.getItem(LOCAL_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (Array.isArray(data)) setElements(data)
      } catch (e) {}
    }
  }

  const exportPNG = async () => {
    if (svgRef.current) {
      await exportSVGToPNG(svgRef.current, 'scene.png')
    }
  }

  return (
    <div className="app-root">
      <header className="topbar">
        <div className="topbar-left">
          <button onClick={saveScene}>Guardar</button>
          <button onClick={loadScene}>Cargar</button>
          <button onClick={deleteAll}>Limpiar</button>
          {!mode3D && <button onClick={exportPNG}>Exportar PNG</button>}
        </div>
        <div className="topbar-center">
          <button onClick={() => setMode3D((m) => !m)}>{mode3D ? '3D' : '2D'} / {mode3D ? '2D' : '3D'}</button>
        </div>
        <div className="topbar-right">
          {mode3D && <span className="help-text">Ratón: orbitar, zoom rueda, pan click derecho</span>}
        </div>
      </header>
      <div className="content">
        <aside className="sidebar left">
          <Palette onAdd={addElement} />
        </aside>
        <main className="main">
          {!mode3D ? (
            <Editor2D
              svgRef={svgRef}
              elements={elements}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onUpdate={updateElement}
            />
          ) : (
            <Scene3D elements={elements} />
          )}
        </main>
        <aside className="sidebar right">
          <PropertiesPanel
            element={selectedEl}
            onChange={(patch) => selectedEl && updateElement(selectedEl.id, patch)}
          />
        </aside>
      </div>
      <footer className="statusbar">
        <div>Grid: {GRID_SIZE}px | Escala: {SCALE_CM_PER_PX} cm/px</div>
      </footer>
    </div>
  )
}

export default App