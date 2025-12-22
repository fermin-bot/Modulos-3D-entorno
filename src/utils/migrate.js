// Funciones de migración de escenas para mantener compatibilidad

export function migrateElement(el) {
  const out = { ...el }
  if (out.type === 'module') {
    // Crear estructura walls si no existe
    if (!out.walls) {
      out.walls = {
        N: { enabled: !!out.wallN, pct: out.wallN === false ? 0 : 100, offset: 0 },
        S: { enabled: !!out.wallS, pct: out.wallS === false ? 0 : 100, offset: 0 },
        E: { enabled: !!out.wallE, pct: out.wallE === false ? 0 : 100, offset: 0 },
        W: { enabled: !!out.wallW, pct: out.wallW === false ? 0 : 100, offset: 0 },
      }
    } else {
      // Clamp y coherencia
      ;['N', 'S', 'E', 'W'].forEach((k) => {
        const w = out.walls[k]
        if (!w) out.walls[k] = { enabled: true, pct: 100, offset: 0 }
        const pct = Number(out.walls[k].pct ?? 100)
        const off = Number(out.walls[k].offset ?? 0)
        out.walls[k].pct = Math.max(0, Math.min(100, pct))
        out.walls[k].offset = Math.max(0, Math.min(100, off))
        if (out.walls[k].pct === 0) out.walls[k].enabled = false
        if (out.walls[k].enabled === false) out.walls[k].pct = 0
      })
    }
    // Remover claves legacy para evitar inconsistencias (optativo): las dejamos por compatibilidad de lectura
  } else {
    // Muebles: preparar model3d por defecto si no existe
    if (!out.model3d) {
      out.model3d = { type: 'default', url: null, scale: 1, rotationY: 0, fitFootprint: true, heightCm: null, offsetY: 0 }
    } else {
      if (out.model3d.fitFootprint === undefined) out.model3d.fitFootprint = true
      if (out.model3d.heightCm === undefined) out.model3d.heightCm = null
      if (out.model3d.scale === undefined) out.model3d.scale = 1
      if (out.model3d.rotationY === undefined) out.model3d.rotationY = 0
      if (out.model3d.offsetY === undefined) out.model3d.offsetY = 0
    }
  }
  return out
}

export function migrateScene(elements) {
  if (!Array.isArray(elements)) return []
  return elements.map((e) => migrateElement(e))
}