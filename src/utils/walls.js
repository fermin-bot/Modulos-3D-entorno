// Utilidades para calcular segmentos de paredes a partir de pct y offset
// Lados: 'N' | 'S' | 'E' | 'W'

function clamp01(value) {
  return Math.min(1, Math.max(0, value))
}

// Calcula el segmento de pared parcial para un elemento tipo módulo
// Devuelve { x1, y1, x2, y2 } en coordenadas 2D (px) o null si pct=0 o no habilitada
export function getWallSegment(el, side) {
  if (!el || el.type !== 'module') return null
  const walls = el.walls
  // Compatibilidad: si no existe walls, intentar con toggles antiguos
  const legacyToggle = {
    N: el.wallN,
    S: el.wallS,
    E: el.wallE,
    W: el.wallW,
  }
  const wdata = walls && walls[side] ? walls[side] : null
  const enabled = wdata ? !!wdata.enabled : !!legacyToggle[side]
  if (!enabled) return null
  const pct = wdata ? Number(wdata.pct ?? 100) : 100
  const offset = wdata ? Number(wdata.offset ?? 0) : 0
  const pct01 = clamp01(pct / 100)
  if (pct01 <= 0) return null
  const off01 = clamp01(offset / 100)

  const { x, y, w, h } = el

  if (side === 'N' || side === 'S') {
    const length = w * pct01
    const start = w * off01
    const sx = x + start
    const ex = x + Math.min(w, start + length)
    const yy = side === 'N' ? y : y + h
    return { x1: sx, y1: yy, x2: ex, y2: yy }
  } else if (side === 'E' || side === 'W') {
    const length = h * pct01
    const start = h * off01
    const sy = y + start
    const ey = y + Math.min(h, start + length)
    const xx = side === 'E' ? x + w : x
    return { x1: xx, y1: sy, x2: xx, y2: ey }
  }
  return null
}

// Devuelve todos los segmentos de paredes existentes para el elemento
export function getAllWallSegments(el) {
  const sides = ['N', 'S', 'E', 'W']
  return sides
    .map((s) => getWallSegment(el, s))
    .filter(Boolean)
}