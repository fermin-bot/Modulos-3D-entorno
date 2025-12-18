import { GRID_SIZE } from '../utils/constants'
import { snapToGrid } from '../utils/snap'

export default function PropertiesPanel({ element, onChange }) {
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
      x: snapToGrid(element.x, GRID_SIZE),
      y: snapToGrid(element.y, GRID_SIZE),
      w: snapToGrid(element.w, GRID_SIZE),
      h: snapToGrid(element.h, GRID_SIZE),
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
          <div className="form-row"><label>Pared N</label><input type="checkbox" checked={!!element.wallN} onChange={(e) => onChange({ wallN: e.target.checked })} /></div>
          <div className="form-row"><label>Pared S</label><input type="checkbox" checked={!!element.wallS} onChange={(e) => onChange({ wallS: e.target.checked })} /></div>
          <div className="form-row"><label>Pared E</label><input type="checkbox" checked={!!element.wallE} onChange={(e) => onChange({ wallE: e.target.checked })} /></div>
          <div className="form-row"><label>Pared W</label><input type="checkbox" checked={!!element.wallW} onChange={(e) => onChange({ wallW: e.target.checked })} /></div>
        </div>
      )}
      <div className="form-row"><button onClick={snapPosition}>Snap a grid</button></div>
    </div>
  )
}