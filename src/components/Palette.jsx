import { useEffect, useState } from 'react'
import { MODEL_LIBRARY, fetchModelLibrary } from '../utils/modelLibrary'
import { SCALE_CM_PER_PX } from '../utils/constants'

export default function Palette({ onAdd }) {
  const [library, setLibrary] = useState(MODEL_LIBRARY)
  const [selectedId, setSelectedId] = useState('')

  useEffect(() => {
    let mounted = true
    fetchModelLibrary().then((list) => { if (mounted) setLibrary(list) }).catch(() => {})
    return () => { mounted = false }
  }, [])

  const addSelectedModel = () => {
    const m = library.find((x) => x.id === selectedId)
    if (!m) return
    const fp = m.footprintCm
    const w = fp && Number.isFinite(fp.w) ? Math.round(fp.w / SCALE_CM_PER_PX) : undefined
    const h = fp && Number.isFinite(fp.h) ? Math.round(fp.h / SCALE_CM_PER_PX) : undefined
    onAdd('furniture', {
      label: m.label,
      w,
      h,
      model3d: { type: 'library', url: m.url, scale: 1, rotationY: 0, fitFootprint: true, heightCm: Number.isFinite(m.heightCm) ? m.heightCm : null, offsetY: 0 },
    })
  }

  return (
    <div className="panel">
      <h3>Paleta</h3>
      <div className="palette-buttons">
        <button onClick={() => onAdd('module')}>Añadir Módulo</button>
        <button onClick={() => onAdd('sofa')}>Añadir Sofá</button>
        <button onClick={() => onAdd('table')}>Añadir Mesa</button>
        <button onClick={() => onAdd('chair')}>Añadir Silla</button>
        <button onClick={() => onAdd('bed')}>Añadir Cama</button>
      </div>

      <div className="form-row" style={{ marginTop: 12 }}>
        <label>Modelos 3D</label>
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          <option value="">(elige un modelo)</option>
          {library.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>
      <div className="palette-buttons" style={{ marginTop: 8 }}>
        <button disabled={!selectedId} onClick={addSelectedModel}>Añadir modelo seleccionado</button>
      </div>
    </div>
  )
}