import { useEffect, useRef, useState } from 'react'
import { GRID_SIZE } from '../utils/constants'
import { snapToGrid } from '../utils/snap'

export default function Editor2D({ svgRef, elements, selectedId, onSelect, onUpdate }) {
  const [dragging, setDragging] = useState(null) // { id, offsetX, offsetY }
  const [resizing, setResizing] = useState(null) // { id, corner }
  const containerRef = useRef(null)

  useEffect(() => {
    const onMove = (e) => {
      if (dragging) {
        const { id, offsetX, offsetY } = dragging
        const rect = containerRef.current.getBoundingClientRect()
        const x = snapToGrid(e.clientX - rect.left - offsetX, GRID_SIZE)
        const y = snapToGrid(e.clientY - rect.top - offsetY, GRID_SIZE)
        onUpdate(id, { x, y })
      } else if (resizing) {
        const { id, corner, startX, startY, orig } = resizing
        const rect = containerRef.current.getBoundingClientRect()
        const curX = e.clientX - rect.left
        const curY = e.clientY - rect.top
        let x = orig.x
        let y = orig.y
        let w = orig.w
        let h = orig.h
        if (corner === 'nw') {
          x = snapToGrid(Math.min(orig.x + orig.w, curX), GRID_SIZE)
          y = snapToGrid(Math.min(orig.y + orig.h, curY), GRID_SIZE)
          w = snapToGrid(orig.x + orig.w - x, GRID_SIZE)
          h = snapToGrid(orig.y + orig.h - y, GRID_SIZE)
        } else if (corner === 'ne') {
          y = snapToGrid(Math.min(orig.y + orig.h, curY), GRID_SIZE)
          w = snapToGrid(Math.max(0, curX - orig.x), GRID_SIZE)
          h = snapToGrid(orig.y + orig.h - y, GRID_SIZE)
        } else if (corner === 'sw') {
          x = snapToGrid(Math.min(orig.x + orig.w, curX), GRID_SIZE)
          w = snapToGrid(orig.x + orig.w - x, GRID_SIZE)
          h = snapToGrid(Math.max(0, curY - orig.y), GRID_SIZE)
        } else if (corner === 'se') {
          w = snapToGrid(Math.max(0, curX - orig.x), GRID_SIZE)
          h = snapToGrid(Math.max(0, curY - orig.y), GRID_SIZE)
        }
        // En caso de valores negativos, normalizar
        if (w < 0) { x = x + w; w = -w }
        if (h < 0) { y = y + h; h = -h }
        onUpdate(id, { x, y, w, h })
      }
    }
    const onUp = () => {
      setDragging(null)
      setResizing(null)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging, resizing, onUpdate])

  const onElementMouseDown = (e, el) => {
    const rect = containerRef.current.getBoundingClientRect()
    const offsetX = e.clientX - rect.left - el.x
    const offsetY = e.clientY - rect.top - el.y
    setDragging({ id: el.id, offsetX, offsetY })
    onSelect(el.id)
  }

  const startResize = (corner, el) => {
    setResizing({ id: el.id, corner, startX: el.x, startY: el.y, orig: { x: el.x, y: el.y, w: el.w, h: el.h } })
    onSelect(el.id)
  }

  return (
    <div className="editor2d" ref={containerRef}>
      <svg ref={svgRef} className="editor-svg">
        <defs>
          <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
            <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="#eee" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
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
              {/* Paredes del módulo */}
              {el.type === 'module' && (
                <g stroke="#333" strokeWidth={2}>
                  {el.wallN && <line x1={el.x} y1={el.y} x2={el.x + el.w} y2={el.y} />}
                  {el.wallS && <line x1={el.x} y1={el.y + el.h} x2={el.x + el.w} y2={el.y + el.h} />}
                  {el.wallE && <line x1={el.x + el.w} y1={el.y} x2={el.x + el.w} y2={el.y + el.h} />}
                  {el.wallW && <line x1={el.x} y1={el.y} x2={el.x} y2={el.y + el.h} />}
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
      </svg>
    </div>
  )
}