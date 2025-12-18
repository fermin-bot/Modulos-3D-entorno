export default function Palette({ onAdd }) {
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
    </div>
  )
}