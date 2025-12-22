import { useEffect, useRef, useState } from 'react'
import { snapToGrid } from '../utils/snap'
import { getAllWallSegments } from '../utils/walls'

export default function Editor2D({ svgRef, elements, selectedId, onSelect, onUpdate, gridSize, viewport, onViewportChange }) {
  const [dragging, setDragging] = useState(null) // { id, offsetX, offsetY } en pantalla relativo a transform
  const [resizing, setResizing] = useState(null) // { id, corner, orig }
  const [panning, setPanning] = useState(null) // { startX, startY }
  const containerRef = useRef(null)

  useEffect(() => {
    const onMove = (e) => {
      const rect = containerRef.current.getBoundingClientRect()
      if (panning) {
        const dx = e.clientX - panning.startX
        const dy = e.clientY - panning.startY
        onViewportChange({ ...viewport, offsetX: viewport.offsetX + dx, offsetY: viewport.offsetY + dy })
        setPanning({ startX: e.clientX, startY: e.clientY })
      } else if (dragging) {
        const { id, offsetX, offsetY } = dragging
        const screenX = e.clientX - rect.left
        const screenY = e.clientY - rect.top
        const worldX = (screenX - viewport.offsetX - offsetX) / viewport.zoom
        const worldY = (screenY - viewport.offsetY - offsetY) / viewport.zoom
        const x = snapToGrid(worldX, gridSize)
        const y = snapToGrid(worldY, gridSize)
        onUpdate(id, { x, y })
      } else if (resizing) {
        const { id, corner, orig } = resizing
        const screenX = e.clientX - rect.left
        const screenY = e.clientY - rect.top
        const curX = (screenX - viewport.offsetX) / viewport.zoom
        const curY = (screenY - viewport.offsetY) / viewport.zoom
        let x = orig.x
        let y = orig.y
        let w = orig.w
        let h = orig.h
        if (corner === 'nw') {
          x = snapToGrid(Math.min(orig.x + orig.w, curX), gridSize)
          y = snapToGrid(Math.min(orig.y + orig.h, curY), gridSize)
          w = snapToGrid(orig.x + orig.w - x, gridSize)
          h = snapToGrid(orig.y + orig.h - y, gridSize)
        } else if (corner === 'ne') {
          y = snapToGrid(Math.min(orig.y + orig.h, curY), gridSize)
          w = snapToGrid(Math.max(0, curX - orig.x), gridSize)
          h = snapToGrid(orig.y + orig.h - y, gridSize)
        } else if (corner === 'sw') {
          x = snapToGrid(Math.min(orig.x + orig.w, curX), gridSize)
          w = snapToGrid(orig.x + orig.w - x, gridSize)
          h = snapToGrid(Math.max(0, curY - orig.y), gridSize)
        } else if (corner === 'se') {
          w = snapToGrid(Math.max(0, curX - orig.x), gridSize)
          h = snapToGrid(Math.max(0, curY - orig.y), gridSize)
        }
        if (w < 0) { x = x + w; w = -w }
        if (h < 0) { y = y + h; h = -h }
        const minSize = gridSize
        if (w < minSize) w = minSize
        if (h < minSize) h = minSize
        onUpdate(id, { x, y, w, h })
      }
    }
    const onUp = () => {
      setDragging(null)
      setResizing(null)
      setPanning(null)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging, resizing, panning, onUpdate, viewport, onViewportChange])

  const onElementMouseDown = (e, el) => {
    if (e.button === 1) return
    const rect = containerRef.current.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    const offsetX = screenX - (el.x * viewport.zoom + viewport.offsetX)
    const offsetY = screenY - (el.y * viewport.zoom + viewport.offsetY)
    setDragging({ id: el.id, offsetX, offsetY })
    onSelect(el.id)
  }

  const startResize = (corner, el) => {
    setResizing({ id: el.id, corner, orig: { x: el.x, y: el.y, w: el.w, h: el.h } })
    onSelect(el.id)
  }

  const onWheel = (e) => {
    e.preventDefault()
    const rect = containerRef.current.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
    const newZoom = Math.max(0.2, Math.min(4, viewport.zoom * factor))
    const worldX = (screenX - viewport.offsetX) / viewport.zoom
    const worldY = (screenY - viewport.offsetY) / viewport.zoom
    const newOffsetX = screenX - worldX * newZoom
    const newOffsetY = screenY - worldY * newZoom
    onViewportChange({ offsetX: newOffsetX, offsetY: newOffsetY, zoom: newZoom })
  }

  const onMouseDownContainer = (e) => {
    if (e.button === 1) {
      setPanning({ startX: e.clientX, startY: e.clientY })
    }
  }

  return (
    <div className="editor2d" ref={containerRef} onWheel={onWheel} onMouseDown={onMouseDownContainer}>
      <svg ref={svgRef} className="editor-svg">
        <defs>
          <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
            <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="#eee" strokeWidth="1" />
          </pattern>
        </defs>
        <g transform={`translate(${viewport.offsetX},${viewport.offsetY}) scale(${viewport.zoom})`}>
          <rect x={-10000} y={-10000} width={20000} height={20000} fill="url(#grid)" />
          {elements.map((el) => {
            const isSel = el.id === selectedId
            const cx = el.x + el.w / 2
            const cy = el.y + el.h / 2
            const transform = el.rot ? `rotate(${el.rot} ${cx} ${cy})` : undefined
            return (
              <g key={el.id} transform={transform}>
                <rect
                  x={el.x}
                  y={el.y}
                  width={el.w}
                  height={el.h}
                  fill={el.color || '#ccc'}
                  stroke={isSel ? '#0078d4' : '#444'}
                  strokeWidth={isSel ? 2 : 1}
                  onMouseDown={(e) => onElementMouseDown(e, el)}
                />
                {/* Paredes del módulo con porcentaje/offset */}
                {el.type === 'module' && (
                  <g stroke="#333" strokeWidth={2} strokeLinecap="square">
                    {getAllWallSegments(el).map((s, idx) => (
                      <line key={idx} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />
                    ))}
                  </g>
                )}
                {/* Etiqueta */}
                <text x={el.x + 6} y={el.y + 16} fill="#111" fontSize={12}>{el.label}</text>
                {/* Asas de redimensionado */}
                {isSel && (
                  <g>
                    <rect className="handle" x={el.x - 5} y={el.y - 5} width={10} height={10} onMouseDown={() => startResize('nw', el)} />
                    <rect className="handle" x={el.x + el.w - 5} y={el.y - 5} width={10} height={10} onMouseDown={() => startResize('ne', el)} />
                    <rect className="handle" x={el.x - 5} y={el.y + el.h - 5} width={10} height={10} onMouseDown={() => startResize('sw', el)} />
                    <rect className="handle" x={el.x + el.w - 5} y={el.y + el.h - 5} width={10} height={10} onMouseDown={() => startResize('se', el)} />
                  </g>
                )}
              </g>
            )
          })}
        </g>
        <foreignObject x={8} y={8} width={240} height={30}>
          <div xmlns="http://www.w3.org/1999/xhtml" style={{ fontSize: 12, color: '#555', background: 'rgba(255,255,255,0.8)', border: '1px solid #d9dee5', padding: '4px 6px', borderRadius: 4 }}>
            Rueda: zoom · Botón medio: mover
          </div>
        </foreignObject>
      </svg>
    </div>
  )
}