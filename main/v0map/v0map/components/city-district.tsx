import * as THREE from "three"

// ─────────────────────────────────────────────────────────────────────────────
// City District v28.6 — "Bigger City" expansion
// A full procedural downtown built AROUND the existing office tower:
//   • 640×640 ground with grass, a central concrete plaza, and a road grid
//   • 45+ skyline buildings with emissive window textures + named brand towers
//   • Central Park (trees, pond, benches), Market Street (stalls), Fountain Plaza
//   • Street lamps, parked cars, crosswalks, billboards, city gate arch
//   • OUTDOOR_SPOTS: named home anchors that outdoor NPCs wander around
// Everything is low-poly with shared geometries/materials — near-zero load cost.
// Nothing inside the original building is touched.
// ─────────────────────────────────────────────────────────────────────────────

// Horizontal player clamp when at ground level or flying (see use-movement.tsx)
export const CITY_BOUNDS = 290

export interface OutdoorSpot {
  id: string
  label: string
  x: number
  z: number
  range: number // wander square size for NPCs anchored here
}

export const OUTDOOR_SPOTS: OutdoorSpot[] = [
  { id: "plaza-south", label: "Fountain Plaza", x: 0, z: 72, range: 38 },
  { id: "plaza-north", label: "North Plaza", x: 0, z: -72, range: 34 },
  { id: "plaza-east", label: "East Promenade", x: 72, z: 0, range: 34 },
  { id: "plaza-west", label: "West Promenade", x: -72, z: 0, range: 34 },
  { id: "central-park", label: "Central Park", x: -150, z: 130, range: 46 },
  { id: "market-street", label: "Market Street", x: 138, z: 72, range: 34 },
  { id: "downtown", label: "Downtown Crossing", x: 0, z: -160, range: 40 },
]

// ── shared low-poly resources ────────────────────────────────────────────────

const box = new THREE.BoxGeometry(1, 1, 1)
const cyl = new THREE.CylinderGeometry(0.5, 0.5, 1, 10)

const mat = (color: number, opts: { rough?: number; metal?: number; emissive?: number; emissiveIntensity?: number } = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: opts.rough ?? 0.85,
    metalness: opts.metal ?? 0.05,
    emissive: opts.emissive !== undefined ? new THREE.Color(opts.emissive) : undefined,
    emissiveIntensity: opts.emissiveIntensity ?? (opts.emissive !== undefined ? 0.6 : 0),
  })

const addBox = (
  parent: THREE.Group,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  material: THREE.Material,
  name = "",
) => {
  const mesh = new THREE.Mesh(box, material)
  mesh.scale.set(w, h, d)
  mesh.position.set(x, y, z)
  if (name) mesh.name = name
  parent.add(mesh)
  return mesh
}

// Deterministic pseudo-random so the skyline is identical every load
const seeded = (seed: number) => {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}

// ── canvas textures ──────────────────────────────────────────────────────────

const windowTexture = (rand: () => number, tint: string, litColor: string) => {
  const canvas = document.createElement("canvas")
  canvas.width = 128
  canvas.height = 256
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = tint
  ctx.fillRect(0, 0, 128, 256)
  const cols = 6
  const rows = 16
  const cw = 128 / cols
  const rh = 256 / rows
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = rand() < 0.42
      ctx.fillStyle = lit ? litColor : "rgba(12, 18, 32, 0.92)"
      ctx.fillRect(c * cw + 2, r * rh + 2, cw - 4, rh - 4)
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 2
  return texture
}

const makeTextSprite = (text: string, color: string, width = 26, fontSize = 84) => {
  const canvas = document.createElement("canvas")
  canvas.width = 1024
  canvas.height = 160
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "rgba(8, 14, 28, 0.85)"
  ctx.fillRect(0, 0, 1024, 160)
  ctx.strokeStyle = color
  ctx.lineWidth = 8
  ctx.strokeRect(6, 6, 1012, 148)
  ctx.fillStyle = color
  ctx.font = `900 ${fontSize}px Arial`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(text, 512, 84)
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true }))
  sprite.scale.set(width, width * (160 / 1024), 1)
  return sprite
}

// ── named brand towers (D's ecosystem gets its own skyline) ──────────────────

const NAMED_TOWERS = [
  { name: "ATM AGENCY TOWER", x: 150, z: -150, w: 30, d: 30, h: 96, tint: 0x1e2a4a, sign: "#22d3ee" },
  { name: "ENTREMOTIVATOR HQ", x: -150, z: -150, w: 32, d: 26, h: 88, tint: 0x2a1e4a, sign: "#f472b6" },
  { name: "MATRIX CRM TOWER", x: 150, z: 150, w: 26, d: 26, h: 78, tint: 0x1e3a2a, sign: "#34d399" },
  { name: "AI BUILD A BOT", x: -210, z: 40, w: 24, d: 24, h: 70, tint: 0x3a2a1e, sign: "#fbbf24" },
  { name: "AI TUBE STUDIOS", x: 210, z: -40, w: 24, d: 28, h: 64, tint: 0x3a1e2a, sign: "#fb7185" },
  { name: "V0MAP LABS", x: -60, z: -215, w: 26, d: 22, h: 72, tint: 0x1e3040, sign: "#38bdf8" },
]

// ── builders ─────────────────────────────────────────────────────────────────

const buildGroundAndRoads = (group: THREE.Group) => {
  // Grass base
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(640, 640), mat(0x3f7a44, { rough: 1 }))
  grass.rotation.x = -Math.PI / 2
  grass.position.y = -0.08
  grass.receiveShadow = true
  grass.name = "city-grass"
  group.add(grass)

  // Central plaza pad around the tower
  const plaza = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), mat(0x8f9aa8, { rough: 0.95 }))
  plaza.rotation.x = -Math.PI / 2
  plaza.position.y = -0.04
  plaza.receiveShadow = true
  plaza.name = "city-plaza"
  group.add(plaza)

  // Road grid: inner ring at ±105, outer ring at ±215 (full spans)
  const asphalt = mat(0x2b2f36, { rough: 1 })
  const sidewalk = mat(0xb9c2cc, { rough: 1 })
  const lane = new THREE.MeshBasicMaterial({ color: 0xf5e05a })
  const roadY = -0.02
  const roadPositions = [-215, -105, 105, 215]

  roadPositions.forEach((p) => {
    // East-west road at z = p
    const ew = new THREE.Mesh(new THREE.PlaneGeometry(640, 12), asphalt)
    ew.rotation.x = -Math.PI / 2
    ew.position.set(0, roadY, p)
    group.add(ew)
    // North-south road at x = p
    const ns = new THREE.Mesh(new THREE.PlaneGeometry(12, 640), asphalt)
    ns.rotation.x = -Math.PI / 2
    ns.position.set(p, roadY, 0)
    group.add(ns)
    // Sidewalks flanking each road
    ;[-8.5, 8.5].forEach((offset) => {
      const sw1 = new THREE.Mesh(new THREE.PlaneGeometry(640, 3), sidewalk)
      sw1.rotation.x = -Math.PI / 2
      sw1.position.set(0, roadY + 0.005, p + offset)
      group.add(sw1)
      const sw2 = new THREE.Mesh(new THREE.PlaneGeometry(3, 640), sidewalk)
      sw2.rotation.x = -Math.PI / 2
      sw2.position.set(p + offset, roadY + 0.005, 0)
      group.add(sw2)
    })
    // Dashed center lines
    for (let i = -300; i <= 300; i += 20) {
      const dashEW = new THREE.Mesh(new THREE.PlaneGeometry(8, 0.7), lane)
      dashEW.rotation.x = -Math.PI / 2
      dashEW.position.set(i, roadY + 0.01, p)
      group.add(dashEW)
      const dashNS = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 8), lane)
      dashNS.rotation.x = -Math.PI / 2
      dashNS.position.set(p, roadY + 0.01, i)
      group.add(dashNS)
    }
  })

  // Crosswalks at the four plaza entrances
  const stripe = new THREE.MeshBasicMaterial({ color: 0xffffff })
  const crossSpots = [
    { x: 0, z: 105, rot: 0 },
    { x: 0, z: -105, rot: 0 },
    { x: 105, z: 0, rot: Math.PI / 2 },
    { x: -105, z: 0, rot: Math.PI / 2 },
  ]
  crossSpots.forEach((spot) => {
    for (let i = -3; i <= 3; i++) {
      const bar = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 10), stripe)
      bar.rotation.x = -Math.PI / 2
      bar.rotation.z = spot.rot
      const off = i * 2
      bar.position.set(spot.x + (spot.rot === 0 ? off : 0), 0.012, spot.z + (spot.rot === 0 ? 0 : off))
      group.add(bar)
    }
  })
}

const buildSkyline = (group: THREE.Group, collisions: THREE.Object3D[]) => {
  const rand = seeded(28600)
  const roofMat = mat(0x39404a, { rough: 0.95 })
  const litColors = ["#ffd977", "#bde3ff", "#ffe9c2", "#c8ffe1"]
  const tints = ["#141c2e", "#1a1426", "#101f24", "#22160f", "#182018"]

  // Named brand towers first
  NAMED_TOWERS.forEach((tower) => {
    const texture = windowTexture(rand, "#101828", "#ffd977")
    const sideMat = new THREE.MeshStandardMaterial({
      map: texture,
      color: 0xffffff,
      roughness: 0.6,
      metalness: 0.2,
      emissive: new THREE.Color(0xffe9b0),
      emissiveMap: texture,
      emissiveIntensity: 0.35,
    })
    const body = new THREE.Mesh(box, [sideMat, sideMat, roofMat, roofMat, sideMat, sideMat])
    body.scale.set(tower.w, tower.h, tower.d)
    body.position.set(tower.x, tower.h / 2, tower.z)
    body.name = `tower-${tower.name}`
    body.userData = { solid: true, type: "wall" }
    group.add(body)
    collisions.push(body)

    // Trim crown + antenna
    addBox(group, tower.w + 1.5, 1.4, tower.d + 1.5, tower.x, tower.h + 0.7, tower.z, mat(tower.tint, { emissive: tower.tint, emissiveIntensity: 0.9 }))
    const antenna = new THREE.Mesh(cyl, mat(0xd7dee8, { metal: 0.6, rough: 0.3 }))
    antenna.scale.set(0.5, 10, 0.5)
    antenna.position.set(tower.x, tower.h + 6.4, tower.z)
    group.add(antenna)
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), mat(0xff4455, { emissive: 0xff4455, emissiveIntensity: 1.4 }))
    beacon.position.set(tower.x, tower.h + 11.6, tower.z)
    group.add(beacon)

    const sign = makeTextSprite(tower.name, tower.sign, Math.max(26, tower.w + 4))
    sign.position.set(tower.x, tower.h + 4, tower.z)
    group.add(sign)
  })

  // Procedural filler skyline in the blocks between roads
  const blockCenters: { x: number; z: number }[] = []
  const lots = [-160, -60, 60, 160, 250, -250]
  lots.forEach((x) =>
    lots.forEach((z) => {
      // Keep the central plaza + park + market clear
      if (Math.abs(x) <= 60 && Math.abs(z) <= 60) return
      if (Math.abs(x + 150) < 45 && Math.abs(z - 130) < 45) return // park
      if (Math.abs(x - 138) < 40 && Math.abs(z - 72) < 32) return // market
      blockCenters.push({ x, z })
    }),
  )

  blockCenters.forEach((lot, index) => {
    // Skip lots already used by named towers
    if (NAMED_TOWERS.some((tower) => Math.abs(tower.x - lot.x) < 40 && Math.abs(tower.z - lot.z) < 40)) return
    const count = 1 + Math.floor(rand() * 2)
    for (let i = 0; i < count; i++) {
      const w = 12 + rand() * 14
      const d = 12 + rand() * 14
      const h = 18 + rand() * 62
      const x = lot.x + (rand() - 0.5) * 26
      const z = lot.z + (rand() - 0.5) * 26
      if (Math.abs(x) < 66 && Math.abs(z) < 66) continue

      const texture = windowTexture(rand, tints[Math.floor(rand() * tints.length)], litColors[Math.floor(rand() * litColors.length)])
      const sideMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.65,
        metalness: 0.15,
        emissive: new THREE.Color(0xffffff),
        emissiveMap: texture,
        emissiveIntensity: 0.28,
      })
      const building = new THREE.Mesh(box, [sideMat, sideMat, roofMat, roofMat, sideMat, sideMat])
      building.scale.set(w, h, d)
      building.position.set(x, h / 2, z)
      building.name = `city-building-${index}-${i}`
      building.userData = { solid: true, type: "wall" }
      group.add(building)
      collisions.push(building)

      // Rooftop details
      if (rand() < 0.6) addBox(group, w * 0.3, 2.2, d * 0.3, x + (rand() - 0.5) * w * 0.3, h + 1.1, z + (rand() - 0.5) * d * 0.3, roofMat)
      if (rand() < 0.35) {
        const antenna = new THREE.Mesh(cyl, mat(0xaab4c0, { metal: 0.5, rough: 0.35 }))
        antenna.scale.set(0.3, 6, 0.3)
        antenna.position.set(x, h + 3, z)
        group.add(antenna)
      }
    }
  })
}

const buildFountainPlaza = (group: THREE.Group, collisions: THREE.Object3D[]) => {
  const spot = OUTDOOR_SPOTS[0]
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(7, 7.6, 1.1, 28), mat(0x9aa6b4, { rough: 0.8 }))
  basin.position.set(spot.x, 0.55, spot.z)
  basin.userData = { solid: true }
  group.add(basin)
  collisions.push(basin)

  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(6.3, 6.3, 0.2, 28),
    new THREE.MeshStandardMaterial({ color: 0x3ec6ff, roughness: 0.15, metalness: 0.4, transparent: true, opacity: 0.85, emissive: new THREE.Color(0x1c6f9c), emissiveIntensity: 0.4 }),
  )
  water.position.set(spot.x, 1.05, spot.z)
  group.add(water)

  const jet = new THREE.Mesh(new THREE.ConeGeometry(0.9, 4.6, 12), mat(0xbfe9ff, { emissive: 0x9adcff, emissiveIntensity: 0.8 }))
  jet.position.set(spot.x, 3.3, spot.z)
  group.add(jet)

  const sign = makeTextSprite("FOUNTAIN PLAZA", "#22d3ee", 20)
  sign.position.set(spot.x, 8, spot.z)
  group.add(sign)

  // Benches ringing the fountain
  const benchMat = mat(0x7a5636)
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2
    const bench = addBox(group, 4, 0.4, 1.2, spot.x + Math.cos(angle) * 11, 0.55, spot.z + Math.sin(angle) * 11, benchMat)
    bench.rotation.y = -angle
    addBox(group, 4, 0.9, 0.25, spot.x + Math.cos(angle) * 11.5, 1.0, spot.z + Math.sin(angle) * 11.5, benchMat).rotation.y = -angle
  }
}

const buildTree = (group: THREE.Group, x: number, z: number, scale = 1) => {
  const trunk = new THREE.Mesh(cyl, mat(0x6b4a2a))
  trunk.scale.set(0.6 * scale, 3.2 * scale, 0.6 * scale)
  trunk.position.set(x, 1.6 * scale, z)
  group.add(trunk)
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(2.1 * scale, 10, 8), mat(0x2f7a3a, { rough: 1 }))
  canopy.position.set(x, 4.4 * scale, z)
  canopy.scale.y = 1.15
  group.add(canopy)
}

const buildCentralPark = (group: THREE.Group) => {
  const spot = OUTDOOR_SPOTS[4]
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(88, 88), mat(0x4f9a52, { rough: 1 }))
  lawn.rotation.x = -Math.PI / 2
  lawn.position.set(spot.x, -0.02, spot.z)
  group.add(lawn)

  const pond = new THREE.Mesh(
    new THREE.CircleGeometry(11, 26),
    new THREE.MeshStandardMaterial({ color: 0x2f9fd8, roughness: 0.2, metalness: 0.35, transparent: true, opacity: 0.9 }),
  )
  pond.rotation.x = -Math.PI / 2
  pond.position.set(spot.x + 14, 0.01, spot.z - 10)
  group.add(pond)

  const rand = seeded(7431)
  for (let i = 0; i < 18; i++) {
    const angle = rand() * Math.PI * 2
    const radius = 12 + rand() * 30
    const x = spot.x + Math.cos(angle) * radius
    const z = spot.z + Math.sin(angle) * radius
    if (Math.abs(x - (spot.x + 14)) < 12 && Math.abs(z - (spot.z - 10)) < 12) continue
    buildTree(group, x, z, 0.85 + rand() * 0.7)
  }

  const benchMat = mat(0x7a5636)
  for (let i = 0; i < 4; i++) {
    addBox(group, 4, 0.4, 1.2, spot.x - 16 + i * 9, 0.55, spot.z + 16, benchMat)
  }

  const sign = makeTextSprite("CENTRAL PARK", "#4ade80", 20)
  sign.position.set(spot.x, 9, spot.z)
  group.add(sign)
}

const buildMarketStreet = (group: THREE.Group, collisions: THREE.Object3D[]) => {
  const spot = OUTDOOR_SPOTS[5]
  const stallColors = [0xef4444, 0xf59e0b, 0x22c55e, 0x3b82f6, 0xa855f7, 0xec4899]
  for (let i = 0; i < 6; i++) {
    const x = spot.x - 20 + i * 8
    const z = spot.z + (i % 2 === 0 ? -8 : 8)
    const counter = addBox(group, 5, 1.4, 2.4, x, 0.7, z, mat(0x8a6a44))
    counter.userData = { solid: true }
    collisions.push(counter)
    // Canopy on posts
    addBox(group, 0.25, 2.6, 0.25, x - 2.2, 1.3 + 1.3, z - 1, mat(0x5a4630))
    addBox(group, 0.25, 2.6, 0.25, x + 2.2, 1.3 + 1.3, z - 1, mat(0x5a4630))
    const canopy = addBox(group, 6, 0.25, 3.4, x, 4.1, z, mat(stallColors[i], { emissive: stallColors[i], emissiveIntensity: 0.25 }))
    canopy.rotation.x = -0.12
  }
  const sign = makeTextSprite("MARKET STREET", "#fbbf24", 20)
  sign.position.set(spot.x, 9, spot.z)
  group.add(sign)
}

const buildStreetProps = (group: THREE.Group, collisions: THREE.Object3D[]) => {
  const rand = seeded(9911)

  // Street lamps along the inner ring
  const lampPole = mat(0x39424e, { metal: 0.5, rough: 0.4 })
  const lampGlow = mat(0xfff2c0, { emissive: 0xffe9a0, emissiveIntensity: 1.6 })
  for (let i = -90; i <= 90; i += 36) {
    ;[
      { x: i, z: 96 },
      { x: i, z: -96 },
      { x: 96, z: i },
      { x: -96, z: i },
    ].forEach((position) => {
      const pole = new THREE.Mesh(cyl, lampPole)
      pole.scale.set(0.3, 7, 0.3)
      pole.position.set(position.x, 3.5, position.z)
      group.add(pole)
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), lampGlow)
      bulb.position.set(position.x, 7.2, position.z)
      group.add(bulb)
    })
  }

  // Street trees along the plaza edge
  for (let i = -80; i <= 80; i += 32) {
    buildTree(group, i, 88, 1)
    buildTree(group, i, -88, 1)
    buildTree(group, 88, i, 1)
    buildTree(group, -88, i, 1)
  }

  // Parked cars along inner roads
  const carColors = [0xd6453c, 0x3b82f6, 0xf4f4f5, 0x1f2937, 0xf59e0b, 0x10b981]
  const wheelMat = mat(0x14181e, { rough: 0.9 })
  for (let i = 0; i < 14; i++) {
    const along = -130 + i * 20 + rand() * 6
    const side = i % 2 === 0 ? 99.5 : -99.5
    const horizontal = i % 4 < 2
    const x = horizontal ? along : side
    const z = horizontal ? side : along
    const car = new THREE.Group()
    const bodyMat = mat(carColors[i % carColors.length], { rough: 0.35, metal: 0.4 })
    const body = addBox(car, 4.2, 1.0, 1.9, 0, 0.75, 0, bodyMat)
    body.userData = { solid: true }
    collisions.push(body)
    addBox(car, 2.3, 0.8, 1.7, -0.2, 1.55, 0, bodyMat)
    ;[-1.4, 1.4].forEach((wx) =>
      [-0.85, 0.85].forEach((wz) => {
        const wheel = new THREE.Mesh(cyl, wheelMat)
        wheel.scale.set(0.55, 0.3, 0.55)
        wheel.rotation.z = Math.PI / 2
        wheel.position.set(wx, 0.35, wz)
        car.add(wheel)
      }),
    )
    car.position.set(x, 0, z)
    car.rotation.y = horizontal ? 0 : Math.PI / 2
    group.add(car)
  }

  // Billboards facing the plaza
  const billboards = [
    { text: "THE ATM AGENCY", color: "#22d3ee", x: 60, z: -96, rotY: 0 },
    { text: "ENTREMOTIVATOR.COM", color: "#f472b6", x: -60, z: 96, rotY: Math.PI },
    { text: "V0MAP CITY v28.6", color: "#fbbf24", x: -96, z: -60, rotY: Math.PI / 2 },
  ]
  billboards.forEach((board) => {
    const post = new THREE.Mesh(cyl, mat(0x3a4350, { metal: 0.5, rough: 0.4 }))
    post.scale.set(0.7, 10, 0.7)
    post.position.set(board.x, 5, board.z)
    group.add(post)
    const panel = makeTextSprite(board.text, board.color, 26, 78)
    panel.position.set(board.x, 11.5, board.z)
    group.add(panel)
  })

  // City gate arch at the south entrance road
  const archMat = mat(0x223148, { emissive: 0x2a4a72, emissiveIntensity: 0.5 })
  const pillarL = addBox(group, 2.5, 14, 2.5, -9, 7, 212, archMat)
  const pillarR = addBox(group, 2.5, 14, 2.5, 9, 7, 212, archMat)
  pillarL.userData = { solid: true }
  pillarR.userData = { solid: true }
  collisions.push(pillarL, pillarR)
  addBox(group, 21, 2.5, 2.5, 0, 15.2, 212, archMat)
  const gateSign = makeTextSprite("WELCOME TO V0MAP CITY", "#7dd3fc", 24, 70)
  gateSign.position.set(0, 18.6, 212)
  group.add(gateSign)
}

// ── main entry point ─────────────────────────────────────────────────────────

export function buildCityDistrict(scene: THREE.Scene): { group: THREE.Group; collisions: THREE.Object3D[] } {
  const group = new THREE.Group()
  group.name = "CityDistrictV286"
  const collisions: THREE.Object3D[] = []

  buildGroundAndRoads(group)
  buildSkyline(group, collisions)
  buildFountainPlaza(group, collisions)
  buildCentralPark(group)
  buildMarketStreet(group, collisions)
  buildStreetProps(group, collisions)

  // Soft distance fog gives the skyline depth without touching interiors
  // (starts well beyond any indoor sightline)
  scene.fog = new THREE.Fog(0xaed7ff, 230, 620)

  scene.add(group)
  return { group, collisions }
}
