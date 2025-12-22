import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import Palette from './components/Palette'
import Editor2D from './components/Editor2D'
import PropertiesPanel from './components/PropertiesPanel'
import Scene3D from './components/Scene3D'
import { SCALE_CM_PER_PX } from './utils/constants'
import { snapToGrid } from './utils/snap'
import { exportSVGToPNG } from './utils/exportPNG'
import { migrateScene, migrateElement } from './utils/migrate'

const LOCAL_KEY = 'app2_scene'

function App() {
  const [elements, setElements] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [mode3D, setMode3D] = useState(false)
  const [gridSize, setGridSize] = useState(10) // configurable
  const [viewport2D, setViewport2D] = useState({ offsetX: 0, offsetY: 0, zoom: 1 })
  const svgRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (Array.isArray(data)) setElements(migrateScene(data))
      } catch (e) {}
    }
  }, [])

  const selectedEl = useMemo(
    () => elements.find((e) => e.id === selectedId) || null,
    [elements, selectedId]
  )

  const addElement = (type, opts = {}) => {
    const id = `${type}_${Date.now()}`
    const defaults = {
      module: { w: 400, h: 300, color: '#d0d0d0', label: 'Módulo', walls: {
        N: { enabled: true, pct: 100, offset: 0 },
        S: { enabled: true, pct: 100, offset: 0 },
        E: { enabled: true, pct: 100, offset: 0 },
        W: { enabled: true, pct: 100, offset: 0 },
      } },
      sofa: { w: 200, h: 90, color: '#c58c72', label: 'Sofá' },
      table: { w: 180, h: 90, color: '#a3c5d9', label: 'Mesa' },
      chair: { w: 60, h: 60, color: '#b5b5b5', label: 'Silla' },
      bed: { w: 200, h: 150, color: '#9fc59f', label: 'Cama' },
      furniture: { w: 100, h: 100, color: '#bfbfbf', label: 'Mueble' },
    }
    const d = defaults[type]
    const el = {
      id,
      type,
      x: snapToGrid(100 + Math.random() * 200, gridSize),
      y: snapToGrid(100 + Math.random() * 200, gridSize),
      w: (opts.w ?? d?.w ?? 100),
      h: (opts.h ?? d?.h ?? 100),
      rot: 0,
      label: opts.label ?? d?.label ?? 'Elemento',
      color: opts.color ?? d?.color ?? '#bfbfbf',
      walls: type === 'module' ? (opts.walls ?? d.walls) : undefined,
      model3d: type !== 'module'
        ? (opts.model3d ?? { type: 'default', url: null, scale: 1, rotationY: 0, fitFootprint: true, heightCm: null })
        : undefined,
    }
    setElements((prev) => [...prev, el])
    setSelectedId(id)
  }

  const updateElement = (id, patch) => {
    setElements((prev) => prev.map((e) => (e.id === id ? migrateElement({ ...e, ...patch }) : e)))
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
        if (Array.isArray(data)) setElements(migrateScene(data))
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
          {!mode3D && (
            <label style={{ marginLeft: 12 }}>
              Grid:
              <select value={gridSize} onChange={(e) => setGridSize(Number(e.target.value))} style={{ marginLeft: 6 }}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
          )}
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
              gridSize={gridSize}
              viewport={viewport2D}
              onViewportChange={setViewport2D}
            />
          ) : (
            <Scene3D elements={elements} />
          )}
        </main>
        <aside className="sidebar right">
          <PropertiesPanel
            element={selectedEl}
            onChange={(patch) => selectedEl && updateElement(selectedEl.id, patch)}
            gridSize={gridSize}
          />
        </aside>
      </div>
      <footer className="statusbar">
        <div>Grid: {gridSize}px | Escala: {SCALE_CM_PER_PX} cm/px</div>
      </footer>
    </div>
  )
}

export default App