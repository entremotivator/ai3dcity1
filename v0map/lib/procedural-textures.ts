import * as THREE from "three"

// ─────────────────────────────────────────────────────────────────────────────
// Procedural Textures v28.2
// Canvas-generated textures — zero downloads, zero network, instant load.
// Wood planks, polished tile, carpet, wall panels, concrete, and grass.
// All textures are cached so repeated calls reuse the same GPU texture.
// ─────────────────────────────────────────────────────────────────────────────

const cache = new Map<string, THREE.CanvasTexture>()

const makeCanvas = (size = 512) => {
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  return canvas
}

const finalize = (key: string, canvas: HTMLCanvasElement, repeatX = 8, repeatY = 8) => {
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(repeatX, repeatY)
  texture.anisotropy = 4
  texture.colorSpace = THREE.SRGBColorSpace
  cache.set(key, texture)
  return texture
}

const noise = (ctx: CanvasRenderingContext2D, size: number, alpha: number, light = true) => {
  for (let i = 0; i < size * 6; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const v = Math.floor(Math.random() * 255)
    ctx.fillStyle = light ? `rgba(${v},${v},${v},${alpha})` : `rgba(0,0,0,${alpha * Math.random()})`
    ctx.fillRect(x, y, 1.5, 1.5)
  }
}

/** Warm wood planks with grain and seams. */
export function woodFloorTexture(repeat = 10): THREE.CanvasTexture {
  const key = `wood-${repeat}`
  if (cache.has(key)) return cache.get(key)!
  const size = 512
  const canvas = makeCanvas(size)
  const ctx = canvas.getContext("2d")!
  const plankH = size / 8

  for (let row = 0; row < 8; row++) {
    const hue = 26 + Math.random() * 6
    const lightness = 26 + Math.random() * 10
    ctx.fillStyle = `hsl(${hue}, 42%, ${lightness}%)`
    ctx.fillRect(0, row * plankH, size, plankH)

    // Grain streaks
    for (let g = 0; g < 26; g++) {
      ctx.strokeStyle = `hsla(${hue - 4}, 40%, ${lightness - 8 + Math.random() * 16}%, 0.35)`
      ctx.lineWidth = 1 + Math.random() * 1.5
      ctx.beginPath()
      const gy = row * plankH + Math.random() * plankH
      ctx.moveTo(0, gy)
      ctx.bezierCurveTo(size * 0.3, gy + (Math.random() - 0.5) * 6, size * 0.7, gy + (Math.random() - 0.5) * 6, size, gy)
      ctx.stroke()
    }

    // Plank seam + staggered end joints
    ctx.fillStyle = "rgba(0,0,0,0.55)"
    ctx.fillRect(0, row * plankH, size, 2)
    const joint = ((row * 197) % size + size * 0.3) % size
    ctx.fillRect(joint, row * plankH, 2, plankH)
  }
  noise(ctx, size, 0.03)
  return finalize(key, canvas, repeat, repeat)
}

/** Large polished tiles with grout lines and subtle sheen variation. */
export function tileFloorTexture(baseHue = 210, repeat = 12): THREE.CanvasTexture {
  const key = `tile-${baseHue}-${repeat}`
  if (cache.has(key)) return cache.get(key)!
  const size = 512
  const canvas = makeCanvas(size)
  const ctx = canvas.getContext("2d")!
  const tile = size / 4

  for (let ty = 0; ty < 4; ty++) {
    for (let tx = 0; tx < 4; tx++) {
      const lightness = 30 + Math.random() * 8
      const gradient = ctx.createLinearGradient(tx * tile, ty * tile, (tx + 1) * tile, (ty + 1) * tile)
      gradient.addColorStop(0, `hsl(${baseHue}, 14%, ${lightness + 6}%)`)
      gradient.addColorStop(1, `hsl(${baseHue}, 16%, ${lightness - 4}%)`)
      ctx.fillStyle = gradient
      ctx.fillRect(tx * tile, ty * tile, tile, tile)
      // Sheen streak
      ctx.fillStyle = `hsla(${baseHue}, 30%, 80%, 0.05)`
      ctx.fillRect(tx * tile + tile * 0.15, ty * tile, tile * 0.12, tile)
    }
  }
  // Grout
  ctx.strokeStyle = "rgba(6, 10, 16, 0.85)"
  ctx.lineWidth = 4
  for (let i = 0; i <= 4; i++) {
    ctx.beginPath(); ctx.moveTo(i * tile, 0); ctx.lineTo(i * tile, size); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, i * tile); ctx.lineTo(size, i * tile); ctx.stroke()
  }
  noise(ctx, size, 0.025)
  return finalize(key, canvas, repeat, repeat)
}

/** Office carpet with woven fleck pattern. */
export function carpetTexture(baseHue = 260, repeat = 16): THREE.CanvasTexture {
  const key = `carpet-${baseHue}-${repeat}`
  if (cache.has(key)) return cache.get(key)!
  const size = 256
  const canvas = makeCanvas(size)
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = `hsl(${baseHue}, 18%, 24%)`
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 5200; i++) {
    const shade = 18 + Math.random() * 18
    ctx.fillStyle = `hsla(${baseHue + (Math.random() - 0.5) * 24}, 22%, ${shade}%, 0.8)`
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2)
  }
  // Faint checker weave
  ctx.fillStyle = "rgba(255,255,255,0.02)"
  for (let y = 0; y < size; y += 16) {
    for (let x = (y / 16) % 2 === 0 ? 0 : 16; x < size; x += 32) {
      ctx.fillRect(x, y, 16, 16)
    }
  }
  return finalize(key, canvas, repeat, repeat)
}

/** Wall panels with seams and brushed vertical texture (use white material color * this map, or tint). */
export function wallPanelTexture(repeat = 4): THREE.CanvasTexture {
  const key = `wall-${repeat}`
  if (cache.has(key)) return cache.get(key)!
  const size = 512
  const canvas = makeCanvas(size)
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#cfd6dd"
  ctx.fillRect(0, 0, size, size)
  // Brushed vertical strokes
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * size
    const shade = 190 + Math.random() * 45
    ctx.strokeStyle = `rgba(${shade},${shade + 4},${shade + 8},0.25)`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + (Math.random() - 0.5) * 4, size)
    ctx.stroke()
  }
  // Panel seams
  ctx.strokeStyle = "rgba(40, 50, 60, 0.5)"
  ctx.lineWidth = 3
  for (let i = 1; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo((i * size) / 3, 0); ctx.lineTo((i * size) / 3, size); ctx.stroke()
  }
  ctx.beginPath(); ctx.moveTo(0, size * 0.82); ctx.lineTo(size, size * 0.82); ctx.stroke()
  return finalize(key, canvas, repeat, 1)
}

/** Weathered concrete for the rooftop, with cracks and expansion joints. */
export function concreteTexture(repeat = 10): THREE.CanvasTexture {
  const key = `concrete-${repeat}`
  if (cache.has(key)) return cache.get(key)!
  const size = 512
  const canvas = makeCanvas(size)
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#7d838a"
  ctx.fillRect(0, 0, size, size)
  noise(ctx, size, 0.08)
  // Stains
  for (let i = 0; i < 14; i++) {
    const gradient = ctx.createRadialGradient(
      Math.random() * size, Math.random() * size, 4,
      Math.random() * size, Math.random() * size, 40 + Math.random() * 70,
    )
    gradient.addColorStop(0, "rgba(50,54,58,0.18)")
    gradient.addColorStop(1, "rgba(50,54,58,0)")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
  }
  // Cracks
  ctx.strokeStyle = "rgba(30,32,36,0.5)"
  for (let i = 0; i < 8; i++) {
    ctx.lineWidth = 0.8 + Math.random()
    ctx.beginPath()
    let x = Math.random() * size
    let y = Math.random() * size
    ctx.moveTo(x, y)
    for (let s = 0; s < 6; s++) {
      x += (Math.random() - 0.5) * 60
      y += (Math.random() - 0.5) * 60
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  // Expansion joints
  ctx.strokeStyle = "rgba(20,22,26,0.7)"
  ctx.lineWidth = 5
  ctx.beginPath(); ctx.moveTo(size / 2, 0); ctx.lineTo(size / 2, size); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, size / 2); ctx.lineTo(size, size / 2); ctx.stroke()
  return finalize(key, canvas, repeat, repeat)
}

/** Acoustic ceiling tiles. */
export function ceilingTexture(repeat = 12): THREE.CanvasTexture {
  const key = `ceiling-${repeat}`
  if (cache.has(key)) return cache.get(key)!
  const size = 256
  const canvas = makeCanvas(size)
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#3a3f45"
  ctx.fillRect(0, 0, size, size)
  noise(ctx, size, 0.05)
  ctx.strokeStyle = "rgba(12,14,18,0.9)"
  ctx.lineWidth = 3
  for (let i = 0; i <= 2; i++) {
    ctx.beginPath(); ctx.moveTo((i * size) / 2, 0); ctx.lineTo((i * size) / 2, size); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, (i * size) / 2); ctx.lineTo(size, (i * size) / 2); ctx.stroke()
  }
  return finalize(key, canvas, repeat, repeat)
}
