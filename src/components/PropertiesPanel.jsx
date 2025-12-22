import { useEffect, useState } from 'react'
import { snapToGrid } from '../utils/snap'
import { MODEL_LIBRARY, fetchModelLibrary } from '../utils/modelLibrary'
import { SCALE_CM_PER_PX } from '../utils/constants'

export default function PropertiesPanel({ element, onChange, gridSize }) {
  const [libraryOptions, setLibraryOptions] = useState(MODEL_LIBRARY)
  useEffect(() => {
    let mounted = true
    fetchModelLibrary().then((list) => { if (mounted) setLibraryOptions(list) }).catch(() => {})
    return () => { mounted = false }
  }, [])
  if (!element) {
    return (
      <div className="panel">
        <h3>Propiedades</h3>
        <p>Selecciona un elemento.</p>
      </div>
    )
  }

  const updateNum = (key, value) => {
    const num = Number(value)
    onChange({ [key]: Number.isFinite(num) ? num : 0 })
  }

  const snapPosition = () => {
    onChange({
      x: snapToGrid(element.x, gridSize),
      y: snapToGrid(element.y, gridSize),
      w: snapToGrid(element.w, gridSize),
      h: snapToGrid(element.h, gridSize),
    })
  }

  return (
    <div className="panel">
      <h3>Propiedades</h3>
      <div className="form-row"><label>Tipo</label><div>{element.type}</div></div>
      <div className="form-row"><label>Etiqueta</label><input value={element.label || ''} onChange={(e) => onChange({ label: e.target.value })} /></div>
      <div className="form-row"><label>Color</label><input type="color" value={element.color || '#cccccc'} onChange={(e) => onChange({ color: e.target.value })} /></div>
      <div className="form-row"><label>X</label><input type="number" value={element.x} onChange={(e) => updateNum('x', e.target.value)} /></div>
      <div className="form-row"><label>Y</label><input type="number" value={element.y} onChange={(e) => updateNum('y', e.target.value)} /></div>
      <div className="form-row"><label>W</label><input type="number" value={element.w} onChange={(e) => updateNum('w', e.target.value)} /></div>
      <div className="form-row"><label>H</label><input type="number" value={element.h} onChange={(e) => updateNum('h', e.target.value)} /></div>
      <div className="form-row"><label>Rot</label><input type="number" value={element.rot || 0} onChange={(e) => updateNum('rot', e.target.value)} /></div>
      {element.type === 'module' && (
        <div className="walls">
          {['N','S','E','W'].map((side) => {
            const wdata = (element.walls && element.walls[side]) || { enabled: !!element[`wall${side}`], pct: 100, offset: 0 }
            const setWalls = (patch) => {
              const prevWalls = element.walls || {}
              const prev = prevWalls[side] || wdata
              const merged = { ...prev, ...patch }
              // Clamp valores
              merged.pct = Math.max(0, Math.min(100, Number(merged.pct ?? 0)))
              merged.offset = Math.max(0, Math.min(100, Number(merged.offset ?? 0)))
              // Reglas de coherencia sin bloquear reactivación
              if (Object.prototype.hasOwnProperty.call(patch, 'enabled')) {
                if (merged.enabled) {
                  // Al habilitar, si pct quedó 0, asignar 100 por defecto
                  if (merged.pct === 0) merged.pct = 100
                } else {
                  // Al deshabilitar, pct a 0
                  merged.pct = 0
                }
              } else if (Object.prototype.hasOwnProperty.call(patch, 'pct')) {
                // Si el usuario cambia pct: 0 => disabled, >0 => enabled
                merged.enabled = merged.pct > 0
              }
              const next = { ...prevWalls, [side]: merged }
              onChange({ walls: next })
            }
            return (
              <div key={side} className="wall-control">
                <div className="form-row"><label>{`Pared ${side}`}</label><input type="checkbox" checked={!!wdata.enabled} onChange={(e) => setWalls({ enabled: e.target.checked })} /></div>
                <div className="form-row"><label>Longitud (%)</label><input type="number" min={0} max={100} step={5} value={wdata.pct} onChange={(e) => setWalls({ pct: Number(e.target.value) })} /></div>
                <div className="form-row"><label>Offset (%)</label><input type="number" min={0} max={100} step={5} value={wdata.offset} onChange={(e) => setWalls({ offset: Number(e.target.value) })} /></div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modelo 3D para muebles */}
      {element.type !== 'module' && (
        <div className="model3d">
          <div className="form-row"><label>Modelo 3D</label><select value={element.model3d?.type || 'default'} onChange={(e) => onChange({ model3d: { ...(element.model3d || { url: null, scale: 1, rotationY: 0, fitFootprint: true, heightCm: null }), type: e.target.value } })}>
            <option value="default">Default</option>
            <option value="custom">Subido</option>
            <option value="library">Librería</option>
          </select></div>
          <div className="form-row"><label>Scale</label><input type="number" step={0.1} value={element.model3d?.scale ?? 1} onChange={(e) => onChange({ model3d: { ...(element.model3d || { type: 'default', url: null, fitFootprint: true, heightCm: null, offsetY: 0 }), scale: Number(e.target.value) } })} /></div>
          <div className="form-row"><label>RotY</label><input type="number" step={5} value={element.model3d?.rotationY ?? 0} onChange={(e) => onChange({ model3d: { ...(element.model3d || { type: 'default', url: null, fitFootprint: true, heightCm: null, offsetY: 0 }), rotationY: Number(e.target.value) } })} /></div>
          <div className="form-row"><label>Altura (cm)</label><input type="number" step={1} value={element.model3d?.offsetY ?? 0} onChange={(e) => onChange({ model3d: { ...(element.model3d || {}), offsetY: Number(e.target.value) } })} /></div>
          <div className="form-row"><button onClick={() => onChange({ model3d: { ...(element.model3d || {}), offsetY: 0 } })}>Reset altura</button></div>
          <div className="form-row"><label>Ajustar a huella (W/H)</label><input type="checkbox" checked={!!element.model3d?.fitFootprint} onChange={(e) => onChange({ model3d: { ...(element.model3d || {}), fitFootprint: e.target.checked } })} /></div>
          <div className="form-row"><label>Altura (cm)</label><input type="number" step={1} value={element.model3d?.heightCm ?? ''} placeholder="(opcional)" onChange={(e) => onChange({ model3d: { ...(element.model3d || {}), heightCm: e.target.value ? Number(e.target.value) : null } })} /></div>
          <div className="form-row">
            <label>Subir modelo 3D</label>
            <input type="file" accept=".glb,.gltf" onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                try {
                  // Revocar previo si es blob
                  if (element.model3d?.url && String(element.model3d.url).startsWith('blob:')) {
                    try { URL.revokeObjectURL(element.model3d.url) } catch {}
                  }
                  const url = URL.createObjectURL(file)
                  onChange({ model3d: { ...(element.model3d || { scale: 1, rotationY: 0, fitFootprint: true, heightCm: null }), type: 'custom', url } })
                } catch (err) {
                  console.error('Error creando ObjectURL', err)
                }
              }
            }} />
          </div>
          {element.model3d?.type === 'library' && (
            <>
              <div className="form-row">
                <label>Seleccionar modelo</label>
                <select
                  value={libraryOptions.find((m) => m.url === (element.model3d?.url || ''))?.id || ''}
                  onChange={(e) => {
                    const picked = libraryOptions.find((m) => m.id === e.target.value)
                    const nextUrl = picked?.url || ''
                    const fp = picked?.footprintCm
                    const nextPatch = { model3d: { ...(element.model3d || {}), type: 'library', url: nextUrl } }
                    if (fp && Number.isFinite(fp.w) && Number.isFinite(fp.h)) {
                      // 1px = 1cm, ajustar W/H del elemento a la huella
                      nextPatch.w = Math.round(fp.w / SCALE_CM_PER_PX)
                      nextPatch.h = Math.round(fp.h / SCALE_CM_PER_PX)
                    }
                    if (Number.isFinite(picked?.heightCm)) {
                      nextPatch.model3d.heightCm = picked.heightCm
                    }
                    onChange(nextPatch)
                  }}
                >
                  <option value="">(elige un modelo)</option>
                  {libraryOptions.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label>Ruta personalizada</label>
                <input
                  value={element.model3d?.url || ''}
                  placeholder="/models/silla.glb"
                  onChange={(e) => onChange({ model3d: { ...(element.model3d || {}), type: 'library', url: e.target.value } })}
                />
              </div>
            </>
          )}
          <div className="form-row"><button onClick={() => {
            // Revocar blob si corresponde
            try {
              if (element.model3d?.url && String(element.model3d.url).startsWith('blob:')) URL.revokeObjectURL(element.model3d.url)
            } catch {}
            onChange({ model3d: { type: 'default', url: null, scale: 1, rotationY: 0, fitFootprint: true, heightCm: null, offsetY: 0 } })
          }}>Quitar modelo</button></div>
        </div>
      )}
      <div className="form-row"><button onClick={snapPosition}>Snap a grid</button></div>
    </div>
  )
}