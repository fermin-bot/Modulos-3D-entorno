export function snapToGrid(value, grid) {
  return Math.round(value / grid) * grid
}