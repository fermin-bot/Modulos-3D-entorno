// Lista de modelos disponibles en la carpeta public/models
// Puedes ampliar esta lista añadiendo más entradas.
export const MODEL_LIBRARY = [
  { id: 'silla', label: 'Silla', url: '/models/silla.glb' },
  { id: 'sofa', label: 'Sofá', url: '/models/sofa.glb' },
  { id: 'mesa', label: 'Mesa', url: '/models/mesa.glb' },
]

export function getLibraryIdByUrl(url) {
  const item = MODEL_LIBRARY.find((m) => m.url === url)
  return item ? item.id : ''
}

export function getLibraryUrlById(id) {
  const item = MODEL_LIBRARY.find((m) => m.id === id)
  return item ? item.url : ''
}

// Intenta cargar dinámicamente la librería desde /models/index.json.
// Si falla, devuelve la lista estática MODEL_LIBRARY.
export async function fetchModelLibrary() {
  try {
    const res = await fetch('/models/index.json')
    if (!res.ok) throw new Error('fetch failed')
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) return data
    return MODEL_LIBRARY
  } catch (e) {
    return MODEL_LIBRARY
  }
}