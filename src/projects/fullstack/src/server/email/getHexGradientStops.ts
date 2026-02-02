export function getHexGradientStops({
  startColor,
  endColor,
  stops,
}: {
  startColor: string
  endColor: string
  stops: number
}): string[] {
  if (stops < 2) {
    throw new Error('stops must be at least 2')
  }

  if (stops === 2) {
    return [startColor, endColor]
  }

  const hexToRgba = (hex: string) => {
    const cleanHex = hex.replace('#', '')

    if (cleanHex.length === 6) {
      return {
        r: Number.parseInt(cleanHex.substring(0, 2), 16),
        g: Number.parseInt(cleanHex.substring(2, 4), 16),
        b: Number.parseInt(cleanHex.substring(4, 6), 16),
        a: 1,
      }
    }

    if (cleanHex.length === 8) {
      return {
        r: Number.parseInt(cleanHex.substring(0, 2), 16),
        g: Number.parseInt(cleanHex.substring(2, 4), 16),
        b: Number.parseInt(cleanHex.substring(4, 6), 16),
        a: Number.parseInt(cleanHex.substring(6, 8), 16) / 255,
      }
    }

    throw new Error(`Invalid hex color: ${hex}`)
  }

  const rgbaToHex = (r: number, g: number, b: number, a: number) => {
    const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0')
    const alphaHex = a < 1 ? toHex(a * 255) : ''
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex}`
  }

  const start = hexToRgba(startColor)
  const end = hexToRgba(endColor)

  const result = [startColor]

  for (let i = 1; i < stops - 1; i++) {
    const ratio = i / (stops - 1)

    const r = start.r + (end.r - start.r) * ratio
    const g = start.g + (end.g - start.g) * ratio
    const b = start.b + (end.b - start.b) * ratio
    const a = start.a + (end.a - start.a) * ratio

    result.push(rgbaToHex(r, g, b, a))
  }

  result.push(endColor)

  return result
}
