export async function exportSVGToPNG(svgNode, filename = 'export.png') {
  const serializer = new XMLSerializer()
  const svgStr = serializer.serializeToString(svgNode)
  const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)
  const img = new Image()
  const rect = svgNode.getBoundingClientRect()
  const width = Math.ceil(rect.width)
  const height = Math.ceil(rect.height)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  await new Promise((resolve) => {
    img.onload = resolve
    img.src = url
  })
  ctx.drawImage(img, 0, 0)
  URL.revokeObjectURL(url)
  const pngUrl = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = pngUrl
  a.download = filename
  a.click()
}