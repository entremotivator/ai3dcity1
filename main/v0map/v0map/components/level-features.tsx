import * as THREE from "three"
import { FLOOR_HEIGHT, ROOFTOP_FLOOR } from "./office-building"

// ─────────────────────────────────────────────────────────────────────────────
// Level Features v28
// Themed rooms + props on every floor, room signs, glowing teleport pads,
// and a named-destination registry used by voice commands and the Rooms panel.
// Everything is procedural low-poly so it adds almost no load cost.
// ─────────────────────────────────────────────────────────────────────────────

export interface RoomDestination {
  id: string
  name: string
  description: string
  floor: number
  position: { x: number; y: number; z: number }
  keywords: string[]
  color: string
}

export const ROOM_DESTINATIONS: RoomDestination[] = [
  {
    id: "lobby",
    name: "Lobby & Reception",
    description: "Ground-floor welcome area with reception desk and planters",
    floor: 0,
    position: { x: 0, y: 0, z: 20 },
    keywords: ["lobby", "reception", "front desk", "entrance"],
    color: "#22d3ee",
  },
  {
    id: "cafe",
    name: "Cafe Corner",
    description: "Coffee bar with stools on the ground floor",
    floor: 0,
    position: { x: -18, y: 0, z: 14 },
    keywords: ["cafe", "coffee", "coffee bar", "break room"],
    color: "#f59e0b",
  },
  {
    id: "boardroom",
    name: "Boardroom",
    description: "Second-floor conference room with a long table and whiteboard",
    floor: 1,
    position: { x: 14, y: FLOOR_HEIGHT, z: -14 },
    keywords: ["boardroom", "conference", "conference room", "meeting room"],
    color: "#818cf8",
  },
  {
    id: "focus-pods",
    name: "Focus Pods",
    description: "Quiet second-floor pods for deep work",
    floor: 1,
    position: { x: -16, y: FLOOR_HEIGHT, z: 12 },
    keywords: ["focus", "focus pod", "quiet room", "deep work", "pods"],
    color: "#34d399",
  },
  {
    id: "arcade",
    name: "Arcade Lounge",
    description: "Third-floor lounge with arcade cabinets and neon",
    floor: 2,
    position: { x: 15, y: FLOOR_HEIGHT * 2, z: 15 },
    keywords: ["arcade", "lounge", "game room", "games"],
    color: "#f472b6",
  },
  {
    id: "media-wall",
    name: "Media Wall",
    description: "Third-floor screening wall with sofas",
    floor: 2,
    position: { x: -15, y: FLOOR_HEIGHT * 2, z: -12 },
    keywords: ["media wall", "screening", "theater", "cinema"],
    color: "#fb923c",
  },
  {
    id: "ai-lab",
    name: "AI Lab",
    description: "Fourth-floor server racks and hologram core",
    floor: 3,
    position: { x: 14, y: FLOOR_HEIGHT * 3, z: -12 },
    keywords: ["ai lab", "lab", "server room", "servers"],
    color: "#2dd4bf",
  },
  {
    id: "podcast-studio",
    name: "Podcast Studio",
    description: "Fourth-floor recording desk with mics and ON AIR sign",
    floor: 3,
    position: { x: -15, y: FLOOR_HEIGHT * 3, z: 13 },
    keywords: ["podcast", "studio", "recording", "on air"],
    color: "#c084fc",
  },
  {
    id: "trading-floor",
    name: "Trading Floor",
    description: "Fifth-floor desk rows with glowing ticker wall",
    floor: 4,
    position: { x: 14, y: FLOOR_HEIGHT * 4, z: 13 },
    keywords: ["trading", "trading floor", "ticker", "market"],
    color: "#4ade80",
  },
  {
    id: "training-dojo",
    name: "Training Dojo",
    description: "Fifth-floor mats, targets, and gong",
    floor: 4,
    position: { x: -14, y: FLOOR_HEIGHT * 4, z: -12 },
    keywords: ["dojo", "training", "gym", "practice"],
    color: "#fb7185",
  },
  {
    id: "showcase",
    name: "Innovation Showcase",
    description: "Ground-floor pedestals with glowing exhibits",
    floor: 0,
    position: { x: 17, y: 0, z: -14 },
    keywords: ["showcase", "innovation", "exhibits", "demo"],
    color: "#38bdf8",
  },
  {
    id: "library",
    name: "Library",
    description: "Second-floor shelves and reading lamps",
    floor: 1,
    position: { x: 0, y: FLOOR_HEIGHT, z: 16 },
    keywords: ["library", "books", "study", "reading"],
    color: "#eab308",
  },
  {
    id: "music-stage",
    name: "Music Stage",
    description: "Third-floor stage with speakers and spotlights",
    floor: 2,
    position: { x: 0, y: FLOOR_HEIGHT * 2, z: -16 },
    keywords: ["music", "stage", "concert", "band", "dj"],
    color: "#a78bfa",
  },
  {
    id: "observatory",
    name: "Data Observatory",
    description: "Fourth-floor holographic data globe",
    floor: 3,
    position: { x: 0, y: FLOOR_HEIGHT * 3, z: -16 },
    keywords: ["observatory", "data globe", "analytics", "globe"],
    color: "#22d3ee",
  },
  {
    id: "war-room",
    name: "War Room",
    description: "Fifth-floor round strategy table with holo column",
    floor: 4,
    position: { x: 0, y: FLOOR_HEIGHT * 4, z: 16 },
    keywords: ["war room", "strategy", "command", "planning"],
    color: "#f97316",
  },
  {
    id: "sky-bar",
    name: "Sky Bar",
    description: "Rooftop counter with stools and an umbrella",
    floor: ROOFTOP_FLOOR,
    position: { x: 0, y: FLOOR_HEIGHT * ROOFTOP_FLOOR, z: 22 },
    keywords: ["sky bar", "bar", "drinks", "rooftop bar"],
    color: "#f43f5e",
  },
  {
    id: "garden",
    name: "Rooftop Garden",
    description: "Planters, benches, and string lights on the roof",
    floor: ROOFTOP_FLOOR,
    position: { x: -12, y: FLOOR_HEIGHT * ROOFTOP_FLOOR, z: 10 },
    keywords: ["garden", "rooftop garden", "roof garden", "green"],
    color: "#4ade80",
  },
  {
    id: "helipad",
    name: "Helipad",
    description: "Rooftop landing circle with beacon lights",
    floor: ROOFTOP_FLOOR,
    position: { x: 12, y: FLOOR_HEIGHT * ROOFTOP_FLOOR, z: -10 },
    keywords: ["helipad", "landing pad", "heliport"],
    color: "#fbbf24",
  },
  // ── v28.6 outdoor city destinations (built by city-district.tsx) ──────────
  {
    id: "fountain-plaza",
    name: "Fountain Plaza",
    description: "Outdoor plaza with a glowing fountain just south of the tower",
    floor: 0,
    position: { x: 0, y: 0, z: 72 },
    keywords: ["fountain", "plaza", "outside", "go outside", "fountain plaza", "front plaza"],
    color: "#22d3ee",
  },
  {
    id: "central-park",
    name: "Central Park",
    description: "City park with trees, a pond, and benches west of the tower",
    floor: 0,
    position: { x: -150, y: 0, z: 130 },
    keywords: ["park", "central park", "trees", "pond", "green space"],
    color: "#4ade80",
  },
  {
    id: "market-street",
    name: "Market Street",
    description: "Outdoor market with colorful vendor stalls east of the plaza",
    floor: 0,
    position: { x: 138, y: 0, z: 72 },
    keywords: ["market", "market street", "stalls", "vendors", "shopping"],
    color: "#fbbf24",
  },
  {
    id: "downtown",
    name: "Downtown Crossing",
    description: "Skyline crossing north of the tower with brand towers all around",
    floor: 0,
    position: { x: 0, y: 0, z: -160 },
    keywords: ["downtown", "crossing", "skyline", "city center", "towers"],
    color: "#818cf8",
  },
  {
    id: "city-gate",
    name: "City Gate",
    description: "Glowing welcome arch at the south entrance road",
    floor: 0,
    position: { x: 0, y: 0, z: 205 },
    keywords: ["gate", "city gate", "arch", "entrance", "welcome arch"],
    color: "#7dd3fc",
  },
]

// ── Small prop builders ─────────────────────────────────────────────────────

const makeMaterial = (color: string | number, opts: { emissive?: boolean; roughness?: number } = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.7,
    metalness: 0.15,
    emissive: opts.emissive ? new THREE.Color(color) : new THREE.Color(0x000000),
    emissiveIntensity: opts.emissive ? 0.55 : 0,
  })

const makeTextSprite = (text: string, color = "#ffffff", scale = 4) => {
  const canvas = document.createElement("canvas")
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext("2d")
  if (ctx) {
    ctx.fillStyle = "rgba(2, 6, 23, 0.72)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.font = "bold 56px Arial"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillStyle = color
    ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  }
  const texture = new THREE.CanvasTexture(canvas)
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }))
  sprite.scale.set(scale, scale / 4, 1)
  return sprite
}

const makeBox = (w: number, h: number, d: number, color: string | number, emissive = false) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), makeMaterial(color, { emissive }))
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

const makeCylinder = (rTop: number, rBottom: number, h: number, color: string | number, emissive = false, segments = 16) => {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments), makeMaterial(color, { emissive }))
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

const makePlant = () => {
  const plant = new THREE.Group()
  const pot = makeCylinder(0.32, 0.24, 0.5, 0xb45309)
  pot.position.y = 0.25
  plant.add(pot)
  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.9, 6), makeMaterial(0x16a34a))
    const angle = (i / 5) * Math.PI * 2
    leaf.position.set(Math.cos(angle) * 0.14, 0.95, Math.sin(angle) * 0.14)
    leaf.rotation.set(Math.cos(angle) * 0.35, 0, Math.sin(angle) * 0.35)
    leaf.castShadow = true
    plant.add(leaf)
  }
  return plant
}

const makeSofa = (color: string | number = 0x475569) => {
  const sofa = new THREE.Group()
  const base = makeBox(2.4, 0.5, 1, color)
  base.position.y = 0.35
  const back = makeBox(2.4, 0.7, 0.25, color)
  back.position.set(0, 0.85, -0.38)
  const armL = makeBox(0.25, 0.5, 1, color)
  armL.position.set(-1.08, 0.6, 0)
  const armR = armL.clone()
  armR.position.x = 1.08
  sofa.add(base, back, armL, armR)
  return sofa
}

const makeArcadeCabinet = (accent: string) => {
  const cab = new THREE.Group()
  const body = makeBox(0.9, 1.9, 0.8, 0x1e293b)
  body.position.y = 0.95
  const screen = makeBox(0.7, 0.5, 0.06, accent, true)
  screen.position.set(0, 1.35, 0.41)
  screen.rotation.x = -0.18
  const panel = makeBox(0.85, 0.1, 0.5, 0x0f172a)
  panel.position.set(0, 0.95, 0.5)
  panel.rotation.x = -0.35
  const marquee = makeBox(0.9, 0.25, 0.15, accent, true)
  marquee.position.set(0, 1.95, 0.3)
  cab.add(body, screen, panel, marquee)
  return cab
}

const makeTeleportPad = (color: string) => {
  const pad = new THREE.Group()
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.09, 10, 32), makeMaterial(color, { emissive: true }))
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.06
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 0.06, 24),
    new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.35, emissive: new THREE.Color(color), emissiveIntensity: 0.4 }),
  )
  disc.position.y = 0.03
  pad.add(ring, disc)
  return pad
}

// ── Room builders ───────────────────────────────────────────────────────────

const buildLobby = (group: THREE.Group, y: number) => {
  const lobby = new THREE.Group()
  lobby.position.set(0, y, 20)

  // Curved-ish reception desk from three segments
  const deskMat = 0x0e7490
  const deskC = makeBox(4, 1.1, 0.8, deskMat)
  deskC.position.set(0, 0.55, 0)
  const deskL = makeBox(1.6, 1.1, 0.8, deskMat)
  deskL.position.set(-2.6, 0.55, -0.5)
  deskL.rotation.y = Math.PI / 5
  const deskR = makeBox(1.6, 1.1, 0.8, deskMat)
  deskR.position.set(2.6, 0.55, -0.5)
  deskR.rotation.y = -Math.PI / 5
  const deskTop = makeBox(4.4, 0.08, 1, 0x67e8f9, true)
  deskTop.position.set(0, 1.14, 0)
  lobby.add(deskC, deskL, deskR, deskTop)

  // Welcome rug
  const rug = new THREE.Mesh(new THREE.CircleGeometry(3.2, 24), new THREE.MeshStandardMaterial({ color: 0x155e75, roughness: 0.95 }))
  rug.rotation.x = -Math.PI / 2
  rug.position.set(0, 0.01, 3.4)
  rug.receiveShadow = true
  lobby.add(rug)

  const plantL = makePlant()
  plantL.position.set(-4.4, 0, 1.4)
  const plantR = makePlant()
  plantR.position.set(4.4, 0, 1.4)
  lobby.add(plantL, plantR)

  const sign = makeTextSprite("LOBBY · RECEPTION", "#67e8f9", 5)
  sign.position.set(0, 3, 0)
  lobby.add(sign)
  group.add(lobby)
}

const buildCafe = (group: THREE.Group, y: number) => {
  const cafe = new THREE.Group()
  cafe.position.set(-18, y, 14)

  const counter = makeBox(3.2, 1, 0.9, 0x92400e)
  counter.position.y = 0.5
  const counterTop = makeBox(3.4, 0.08, 1, 0xfbbf24, true)
  counterTop.position.y = 1.04
  const machine = makeBox(0.6, 0.7, 0.5, 0x334155)
  machine.position.set(-0.9, 1.43, 0)
  cafe.add(counter, counterTop, machine)

  for (let i = 0; i < 3; i++) {
    const stool = new THREE.Group()
    const seat = makeCylinder(0.28, 0.28, 0.08, 0xdc2626)
    seat.position.y = 0.72
    const leg = makeCylinder(0.05, 0.05, 0.7, 0x64748b)
    leg.position.y = 0.35
    stool.add(seat, leg)
    stool.position.set(-1 + i, 0, 1.2)
    cafe.add(stool)
  }

  const sign = makeTextSprite("CAFE CORNER", "#fbbf24", 4)
  sign.position.set(0, 2.6, 0)
  cafe.add(sign)
  group.add(cafe)
}

const buildBoardroom = (group: THREE.Group, y: number) => {
  const room = new THREE.Group()
  room.position.set(14, y, -14)

  const table = makeBox(4.5, 0.12, 1.8, 0x7c3aed)
  table.position.y = 1
  const tableBaseA = makeCylinder(0.2, 0.35, 1, 0x312e81)
  tableBaseA.position.set(-1.5, 0.5, 0)
  const tableBaseB = tableBaseA.clone()
  tableBaseB.position.x = 1.5
  room.add(table, tableBaseA, tableBaseB)

  // Chairs around the table
  for (let i = 0; i < 8; i++) {
    const chair = new THREE.Group()
    const seat = makeBox(0.5, 0.08, 0.5, 0x1e293b)
    seat.position.y = 0.55
    const back = makeBox(0.5, 0.55, 0.08, 0x1e293b)
    back.position.set(0, 0.85, -0.22)
    chair.add(seat, back)
    const side = i < 4 ? 1 : -1
    chair.position.set(-1.7 + (i % 4) * 1.15, 0, side * 1.4)
    chair.rotation.y = side > 0 ? Math.PI : 0
    room.add(chair)
  }

  // Whiteboard + wall screen
  const board = makeBox(3, 1.6, 0.08, 0xf8fafc)
  board.position.set(0, 1.9, -3.2)
  const screen = makeBox(2.4, 1.35, 0.08, 0x38bdf8, true)
  screen.position.set(3.4, 1.9, -3.2)
  room.add(board, screen)

  const sign = makeTextSprite("BOARDROOM", "#a5b4fc", 4)
  sign.position.set(0, 3.4, 0)
  room.add(sign)
  group.add(room)
}

const buildFocusPods = (group: THREE.Group, y: number) => {
  const pods = new THREE.Group()
  pods.position.set(-16, y, 12)

  for (let i = 0; i < 3; i++) {
    const pod = new THREE.Group()
    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 16, 12, 0, Math.PI * 1.35),
      makeMaterial(0x0f766e, { roughness: 0.5 }),
    )
    shell.position.y = 1.1
    shell.rotation.y = Math.PI
    const seat = makeBox(1, 0.15, 0.9, 0x134e4a)
    seat.position.y = 0.55
    const glow = makeCylinder(0.9, 0.9, 0.05, 0x2dd4bf, true, 20)
    glow.position.y = 0.02
    pod.add(shell, seat, glow)
    pod.position.set(i * 2.8, 0, 0)
    pod.rotation.y = -0.4 + i * 0.4
    pods.add(pod)
  }

  const sign = makeTextSprite("FOCUS PODS", "#5eead4", 3.6)
  sign.position.set(2.8, 3, 0)
  pods.add(sign)
  group.add(pods)
}

const buildArcade = (group: THREE.Group, y: number) => {
  const arcade = new THREE.Group()
  arcade.position.set(15, y, 15)

  const accents = ["#f472b6", "#22d3ee", "#a3e635", "#fb923c"]
  accents.forEach((accent, index) => {
    const cab = makeArcadeCabinet(accent)
    cab.position.set(index * 1.3 - 2, 0, 0)
    cab.rotation.y = Math.PI
    arcade.add(cab)
  })

  const sofa = makeSofa(0x9d174d)
  sofa.position.set(-0.5, 0, 3.4)
  sofa.rotation.y = Math.PI
  arcade.add(sofa)

  // Neon sign bar
  const neon = makeBox(5.4, 0.14, 0.14, 0xf472b6, true)
  neon.position.set(-0.4, 2.6, -0.6)
  arcade.add(neon)

  const sign = makeTextSprite("ARCADE LOUNGE", "#f9a8d4", 4.4)
  sign.position.set(-0.4, 3.2, 0)
  arcade.add(sign)
  group.add(arcade)
}

const buildMediaWall = (group: THREE.Group, y: number) => {
  const media = new THREE.Group()
  media.position.set(-15, y, -12)

  const wall = makeBox(5.5, 3, 0.2, 0x0f172a)
  wall.position.set(0, 1.7, -1.5)
  const screen = makeBox(4.8, 2.4, 0.06, 0xfb923c, true)
  screen.position.set(0, 1.7, -1.36)
  media.add(wall, screen)

  const sofaA = makeSofa(0x7c2d12)
  sofaA.position.set(-1.4, 0, 1.6)
  const sofaB = makeSofa(0x7c2d12)
  sofaB.position.set(1.4, 0, 2.6)
  media.add(sofaA, sofaB)

  const sign = makeTextSprite("MEDIA WALL", "#fdba74", 3.8)
  sign.position.set(0, 3.7, 0)
  media.add(sign)
  group.add(media)
}

const buildRooftopGarden = (group: THREE.Group, y: number) => {
  const garden = new THREE.Group()
  garden.position.set(-12, y, 10)

  // Planter boxes with greenery
  for (let i = 0; i < 4; i++) {
    const planter = new THREE.Group()
    const boxMesh = makeBox(2.2, 0.5, 0.8, 0x78350f)
    boxMesh.position.y = 0.25
    planter.add(boxMesh)
    for (let j = 0; j < 4; j++) {
      const bush = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), makeMaterial(0x22c55e))
      bush.position.set(-0.75 + j * 0.5, 0.62, 0)
      bush.castShadow = true
      planter.add(bush)
    }
    planter.position.set((i % 2) * 3.2, 0, Math.floor(i / 2) * 2.4)
    garden.add(planter)
  }

  // Benches
  for (let i = 0; i < 2; i++) {
    const bench = new THREE.Group()
    const seat = makeBox(1.8, 0.1, 0.5, 0xa16207)
    seat.position.y = 0.5
    const legA = makeBox(0.1, 0.5, 0.5, 0x525252)
    legA.position.set(-0.8, 0.25, 0)
    const legB = legA.clone()
    legB.position.x = 0.8
    bench.add(seat, legA, legB)
    bench.position.set(1.6, 0, -1.8 - i * 1.4)
    garden.add(bench)
  }

  // String lights: emissive bulbs along a gentle arc
  for (let i = 0; i < 12; i++) {
    const t = i / 11
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), makeMaterial(0xfde68a, { emissive: true }))
    bulb.position.set(-1 + t * 7, 2.7 + Math.sin(t * Math.PI) * -0.5, 1.2)
    garden.add(bulb)
  }

  const sign = makeTextSprite("ROOFTOP GARDEN", "#86efac", 4.4)
  sign.position.set(1.6, 3.4, 0)
  garden.add(sign)
  group.add(garden)
}

const buildHelipad = (group: THREE.Group, y: number) => {
  const heli = new THREE.Group()
  heli.position.set(12, y, -10)

  const pad = makeCylinder(4, 4, 0.12, 0x1e293b, false, 28)
  pad.position.y = 0.06
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.12, 8, 36), makeMaterial(0xfbbf24, { emissive: true }))
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.14
  heli.add(pad, ring)

  // Big "H"
  const hLeft = makeBox(0.35, 0.06, 2.2, 0xfbbf24, true)
  hLeft.position.set(-0.7, 0.14, 0)
  const hRight = hLeft.clone()
  hRight.position.x = 0.7
  const hMid = makeBox(1.4, 0.06, 0.35, 0xfbbf24, true)
  hMid.position.y = 0.14
  heli.add(hLeft, hRight, hMid)

  // Corner beacons
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4
    const beacon = makeCylinder(0.08, 0.12, 0.5, 0xef4444, true)
    beacon.position.set(Math.cos(angle) * 3.8, 0.3, Math.sin(angle) * 3.8)
    heli.add(beacon)
  }

  const sign = makeTextSprite("HELIPAD", "#fde68a", 3.6)
  sign.position.set(0, 3, 0)
  heli.add(sign)
  group.add(heli)
}

const buildAiLab = (group: THREE.Group, y: number) => {
  const lab = new THREE.Group()
  lab.position.set(14, y, -12)

  // Server racks with blinking-style emissive strips
  for (let i = 0; i < 4; i++) {
    const rack = new THREE.Group()
    const body = makeBox(1, 2.4, 0.8, 0x0f172a)
    body.position.y = 1.2
    rack.add(body)
    for (let s = 0; s < 5; s++) {
      const strip = makeBox(0.8, 0.08, 0.05, s % 2 === 0 ? 0x2dd4bf : 0x38bdf8, true)
      strip.position.set(0, 0.5 + s * 0.42, 0.42)
      rack.add(strip)
    }
    rack.position.set(i * 1.5 - 2.2, 0, -2)
    lab.add(rack)
  }

  // Hologram core: glowing sphere on a pedestal ring
  const pedestal = makeCylinder(1, 1.2, 0.3, 0x134e4a)
  pedestal.position.set(0, 0.15, 1.5)
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x2dd4bf, emissive: new THREE.Color(0x2dd4bf), emissiveIntensity: 0.9, transparent: true, opacity: 0.8 }),
  )
  core.position.set(0, 1.4, 1.5)
  lab.add(pedestal, core)

  const sign = makeTextSprite("AI LAB", "#5eead4", 3.4)
  sign.position.set(0, 3.4, 0)
  lab.add(sign)
  group.add(lab)
}

const buildPodcastStudio = (group: THREE.Group, y: number) => {
  const studio = new THREE.Group()
  studio.position.set(-15, y, 13)

  const desk = makeBox(3.4, 0.12, 1.4, 0x581c87)
  desk.position.y = 1
  const deskBase = makeBox(3, 0.9, 1.1, 0x3b0764)
  deskBase.position.y = 0.45
  studio.add(desk, deskBase)

  // Two mics on arms
  for (let i = 0; i < 2; i++) {
    const mic = new THREE.Group()
    const arm = makeCylinder(0.04, 0.04, 0.8, 0x94a3b8)
    arm.rotation.z = 0.5
    arm.position.set(0, 1.35, 0)
    const head = makeCylinder(0.12, 0.12, 0.3, 0x111827)
    head.rotation.z = Math.PI / 2
    head.position.set(0.32, 1.62, 0)
    mic.add(arm, head)
    mic.position.set(i * 1.6 - 0.8, 0, 0)
    studio.add(mic)
  }

  // ON AIR sign
  const onAir = makeBox(1.6, 0.5, 0.12, 0xef4444, true)
  onAir.position.set(0, 2.8, -1)
  studio.add(onAir)

  const sign = makeTextSprite("PODCAST STUDIO", "#d8b4fe", 4)
  sign.position.set(0, 3.6, 0)
  studio.add(sign)
  group.add(studio)
}

const buildTradingFloor = (group: THREE.Group, y: number) => {
  const trading = new THREE.Group()
  trading.position.set(14, y, 13)

  // Ticker wall: long glowing strip on a dark wall
  const wall = makeBox(6, 2.6, 0.2, 0x052e16)
  wall.position.set(0, 1.6, -2)
  const ticker = makeBox(5.6, 0.5, 0.06, 0x4ade80, true)
  ticker.position.set(0, 2.2, -1.86)
  const ticker2 = makeBox(5.6, 0.35, 0.06, 0xfbbf24, true)
  ticker2.position.set(0, 1.5, -1.86)
  trading.add(wall, ticker, ticker2)

  // Desk rows with monitor pairs
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 3; i++) {
      const desk = new THREE.Group()
      const top = makeBox(1.6, 0.08, 0.8, 0x14532d)
      top.position.y = 0.85
      const leg = makeBox(1.4, 0.8, 0.6, 0x052e16)
      leg.position.y = 0.4
      const monA = makeBox(0.6, 0.4, 0.05, 0x4ade80, true)
      monA.position.set(-0.35, 1.25, -0.2)
      const monB = makeBox(0.6, 0.4, 0.05, 0x38bdf8, true)
      monB.position.set(0.35, 1.25, -0.2)
      desk.add(top, leg, monA, monB)
      desk.position.set(i * 2.2 - 2.2, 0, row * 1.8 + 0.5)
      trading.add(desk)
    }
  }

  const sign = makeTextSprite("TRADING FLOOR", "#86efac", 4)
  sign.position.set(0, 3.6, 0)
  trading.add(sign)
  group.add(trading)
}

const buildTrainingDojo = (group: THREE.Group, y: number) => {
  const dojo = new THREE.Group()
  dojo.position.set(-14, y, -12)

  // Mats: alternating floor pads
  for (let mx = 0; mx < 3; mx++) {
    for (let mz = 0; mz < 2; mz++) {
      const mat = makeBox(2, 0.06, 2, (mx + mz) % 2 === 0 ? 0x9f1239 : 0x1e293b)
      mat.position.set(mx * 2 - 2, 0.03, mz * 2 - 1)
      dojo.add(mat)
    }
  }

  // Practice targets
  for (let i = 0; i < 3; i++) {
    const stand = makeCylinder(0.06, 0.1, 1.6, 0x525252)
    stand.position.set(i * 1.6 - 1.6, 0.8, -2.4)
    const pad = makeBox(0.5, 0.7, 0.2, 0xfb7185)
    pad.position.set(i * 1.6 - 1.6, 1.5, -2.4)
    dojo.add(stand, pad)
  }

  // Gong
  const gongFrame = makeBox(0.15, 2.2, 0.15, 0x78350f)
  gongFrame.position.set(2.8, 1.1, 0)
  const gongFrame2 = gongFrame.clone()
  gongFrame2.position.set(4, 1.1, 0)
  const gongBar = makeBox(1.4, 0.15, 0.15, 0x78350f)
  gongBar.position.set(3.4, 2.15, 0)
  const gong = makeCylinder(0.6, 0.6, 0.08, 0xfbbf24, true)
  gong.rotation.x = Math.PI / 2
  gong.position.set(3.4, 1.3, 0)
  dojo.add(gongFrame, gongFrame2, gongBar, gong)

  const sign = makeTextSprite("TRAINING DOJO", "#fda4af", 4)
  sign.position.set(0, 3.4, 0)
  dojo.add(sign)
  group.add(dojo)
}

const buildShowcase = (group: THREE.Group, y: number) => {
  const showcase = new THREE.Group()
  showcase.position.set(17, y, -14)
  const exhibitColors = [0x38bdf8, 0xf472b6, 0xa3e635, 0xfbbf24]
  exhibitColors.forEach((color, index) => {
    const pedestal = makeCylinder(0.45, 0.55, 1, 0x1e293b)
    pedestal.position.set(index * 1.8 - 2.7, 0.5, 0)
    const exhibit = new THREE.Mesh(
      index % 2 === 0 ? new THREE.OctahedronGeometry(0.4) : new THREE.TorusKnotGeometry(0.28, 0.1, 48, 8),
      makeMaterial(color, { emissive: true }),
    )
    exhibit.position.set(index * 1.8 - 2.7, 1.5, 0)
    exhibit.castShadow = true
    showcase.add(pedestal, exhibit)
  })
  const sign = makeTextSprite("INNOVATION SHOWCASE", "#7dd3fc", 5)
  sign.position.set(0, 3, 0)
  showcase.add(sign)
  group.add(showcase)
}

const buildLibrary = (group: THREE.Group, y: number) => {
  const library = new THREE.Group()
  library.position.set(0, y, 16)
  // Shelf rows with colored book blocks
  for (let s = 0; s < 3; s++) {
    const shelf = new THREE.Group()
    const frame = makeBox(3, 2.2, 0.4, 0x78350f)
    frame.position.y = 1.1
    shelf.add(frame)
    for (let row = 0; row < 3; row++) {
      for (let b = 0; b < 7; b++) {
        const book = makeBox(0.22, 0.44, 0.3, [0xdc2626, 0x2563eb, 0x16a34a, 0xca8a04, 0x7c3aed][(s + row + b) % 5])
        book.position.set(-1.2 + b * 0.4, 0.55 + row * 0.62, 0.06)
        shelf.add(book)
      }
    }
    shelf.position.set(s * 3.6 - 3.6, 0, -1)
    library.add(shelf)
  }
  // Reading table with lamp
  const table = makeCylinder(1, 0.15, 0.1, 0x92400e)
  table.position.set(0, 0.85, 1.6)
  const tableLeg = makeCylinder(0.12, 0.2, 0.8, 0x78350f)
  tableLeg.position.set(0, 0.4, 1.6)
  const lamp = makeCylinder(0.22, 0.3, 0.25, 0xfde68a, true)
  lamp.position.set(0, 1.1, 1.6)
  library.add(table, tableLeg, lamp)
  const sign = makeTextSprite("LIBRARY", "#fde047", 3.4)
  sign.position.set(0, 3.2, 0)
  library.add(sign)
  group.add(library)
}

const buildMusicStage = (group: THREE.Group, y: number) => {
  const stage = new THREE.Group()
  stage.position.set(0, y, -16)
  const platform = makeBox(6, 0.5, 3.4, 0x312e81)
  platform.position.y = 0.25
  stage.add(platform)
  // Speaker stacks
  for (const side of [-1, 1]) {
    const bottom = makeBox(0.9, 1, 0.8, 0x0f172a)
    bottom.position.set(side * 2.4, 1, -0.6)
    const top = makeBox(0.7, 0.7, 0.6, 0x1e293b)
    top.position.set(side * 2.4, 1.85, -0.6)
    const cone = makeCylinder(0.22, 0.3, 0.06, 0xa78bfa, true)
    cone.rotation.x = Math.PI / 2
    cone.position.set(side * 2.4, 1, -0.18)
    stage.add(bottom, top, cone)
  }
  // Spotlight bar
  const bar = makeBox(5.6, 0.12, 0.12, 0x334155)
  bar.position.set(0, 3.4, -0.6)
  stage.add(bar)
  for (let i = 0; i < 4; i++) {
    const light = makeCylinder(0.12, 0.2, 0.3, [0xf472b6, 0x22d3ee, 0xa3e635, 0xfbbf24][i], true)
    light.position.set(i * 1.5 - 2.25, 3.2, -0.5)
    light.rotation.x = 0.5
    stage.add(light)
  }
  const sign = makeTextSprite("MUSIC STAGE", "#c4b5fd", 4)
  sign.position.set(0, 4.1, 0)
  stage.add(sign)
  group.add(stage)
}

const buildObservatory = (group: THREE.Group, y: number) => {
  const observatory = new THREE.Group()
  observatory.position.set(0, y, -16)
  const base = makeCylinder(1.6, 1.9, 0.4, 0x0e7490)
  base.position.y = 0.2
  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 20, 14),
    new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: new THREE.Color(0x22d3ee), emissiveIntensity: 0.5, wireframe: true }),
  )
  globe.position.y = 1.9
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.06, 8, 40), makeMaterial(0x38bdf8, { emissive: true }))
  ring.rotation.x = Math.PI / 2.6
  ring.position.y = 1.9
  const ring2 = ring.clone()
  ring2.rotation.x = -Math.PI / 2.6
  observatory.add(base, globe, ring, ring2)
  const sign = makeTextSprite("DATA OBSERVATORY", "#67e8f9", 4.6)
  sign.position.set(0, 4, 0)
  observatory.add(sign)
  group.add(observatory)
}

const buildWarRoom = (group: THREE.Group, y: number) => {
  const warRoom = new THREE.Group()
  warRoom.position.set(0, y, 16)
  const table = makeCylinder(2, 2, 0.14, 0x7c2d12)
  table.position.y = 1
  const tableBase = makeCylinder(0.4, 0.7, 0.9, 0x431407)
  tableBase.position.y = 0.45
  warRoom.add(table, tableBase)
  // Holo column rising from the table
  const holo = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.7, 1.6, 16),
    new THREE.MeshStandardMaterial({ color: 0xf97316, emissive: new THREE.Color(0xf97316), emissiveIntensity: 0.6, transparent: true, opacity: 0.5 }),
  )
  holo.position.y = 1.95
  warRoom.add(holo)
  // Chairs around
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2
    const chair = new THREE.Group()
    const seat = makeBox(0.5, 0.08, 0.5, 0x1e293b)
    seat.position.y = 0.55
    const back = makeBox(0.5, 0.55, 0.08, 0x1e293b)
    back.position.set(0, 0.85, -0.22)
    chair.add(seat, back)
    chair.position.set(Math.cos(angle) * 3, 0, Math.sin(angle) * 3)
    // Face the table center (local space)
    chair.rotation.y = Math.atan2(-Math.cos(angle), -Math.sin(angle))
    warRoom.add(chair)
  }
  const sign = makeTextSprite("WAR ROOM", "#fdba74", 3.6)
  sign.position.set(0, 3.8, 0)
  warRoom.add(sign)
  group.add(warRoom)
}

const buildSkyBar = (group: THREE.Group, y: number) => {
  const bar = new THREE.Group()
  bar.position.set(0, y, 22)
  const counter = makeBox(4, 1.05, 0.9, 0x9f1239)
  counter.position.y = 0.52
  const counterTop = makeBox(4.2, 0.08, 1, 0xfda4af, true)
  counterTop.position.y = 1.09
  bar.add(counter, counterTop)
  for (let i = 0; i < 4; i++) {
    const stool = new THREE.Group()
    const seat = makeCylinder(0.28, 0.28, 0.08, 0xf43f5e)
    seat.position.y = 0.72
    const leg = makeCylinder(0.05, 0.05, 0.7, 0x64748b)
    leg.position.y = 0.35
    stool.add(seat, leg)
    stool.position.set(-1.5 + i, 0, 1.2)
    bar.add(stool)
  }
  // Umbrella
  const pole = makeCylinder(0.06, 0.06, 2.6, 0xe2e8f0)
  pole.position.set(2.8, 1.3, 0.6)
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.7, 8), makeMaterial(0xf43f5e))
  canopy.position.set(2.8, 2.8, 0.6)
  bar.add(pole, canopy)
  const sign = makeTextSprite("SKY BAR", "#fecdd3", 3.2)
  sign.position.set(0, 3.4, 0)
  bar.add(sign)
  group.add(bar)
}

// ── Rooftop door portals ────────────────────────────────────────────────────
// Ten glowing door portals on the roof — back row 3001-3005, front row 3006-3010.
// WALK THROUGH a doorway (no click needed) to navigate THIS tab to the local URL;
// clicking the door still works too.

export interface PortalDestination {
  port: number
  label: string
  url: string
  color: string
  x: number
  z: number
  /** Direction the doorway faces (toward roof center) — used for the trigger zone */
  facing: number
}

// Player must pass within this XZ distance of a door panel to trigger walk-through
export const PORTAL_TRIGGER_RADIUS = 1.35

const PORTAL_COLORS = ["#22d3ee", "#a3e635", "#f472b6", "#fbbf24", "#818cf8", "#34d399", "#fb923c", "#e879f9", "#38bdf8", "#facc15"]

export const PORTAL_DESTINATIONS: PortalDestination[] = Array.from({ length: 10 }, (_, index) => {
  const port = 3001 + index
  const backRow = index < 5
  return {
    port,
    label: `PORT ${port}`,
    url: `http://localhost:${port}`,
    color: PORTAL_COLORS[index],
    x: -16 + (index % 5) * 8,
    z: backRow ? -34 : 34,
    facing: backRow ? 1 : -1, // toward roof center
  }
})

const buildRoofPortals = (group: THREE.Group, y: number) => {
  const portals = new THREE.Group()
  portals.name = "roof-portals"

  PORTAL_DESTINATIONS.forEach((destination) => {
    const portal = new THREE.Group()
    portal.position.set(destination.x, y, destination.z)

    // Door frame: two jambs + lintel
    const frameMat = makeMaterial(0x0f172a, { roughness: 0.4 })
    const jambL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.6, 0.5), frameMat)
    jambL.position.set(-1.15, 1.8, 0)
    const jambR = jambL.clone()
    jambR.position.x = 1.15
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.4, 0.5), frameMat)
    lintel.position.set(0, 3.75, 0)
    portal.add(jambL, jambR, lintel)

    // Glowing door panel — the clickable surface
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 3.5),
      new THREE.MeshStandardMaterial({
        color: destination.color,
        emissive: new THREE.Color(destination.color),
        emissiveIntensity: 0.75,
        transparent: true,
        opacity: 0.82,
        side: THREE.DoubleSide,
      }),
    )
    panel.position.set(0, 1.78, 0)
    portal.add(panel)

    // Step pad in front
    const step = makeCylinder(1.2, 1.4, 0.12, destination.color, true, 20)
    step.position.set(0, 0.06, 1.4)
    portal.add(step)

    // Label above the door
    const sign = makeTextSprite(destination.label, destination.color, 4)
    sign.position.set(0, 4.6, 0)
    portal.add(sign)

    // Face the roof center
    portal.lookAt(new THREE.Vector3(0, y, 0))
    portal.rotateY(Math.PI) // lookAt points -Z; flip so the panel faces inward

    // Tag EVERY mesh so any raycast hit anywhere on the portal navigates
    portal.traverse((child) => {
      child.userData = { type: "portal", url: destination.url, port: destination.port, label: destination.label }
    })

    portals.add(portal)
  })

  group.add(portals)
}

// ── Main builder ────────────────────────────────────────────────────────────

export function buildLevelFeatures(scene: THREE.Scene): THREE.Group {
  const group = new THREE.Group()
  group.name = "LevelFeaturesV28"

  // Floor 1 (y = 0)
  buildLobby(group, 0)
  buildCafe(group, 0)
  buildShowcase(group, 0)

  // Floor 2
  buildBoardroom(group, FLOOR_HEIGHT)
  buildFocusPods(group, FLOOR_HEIGHT)
  buildLibrary(group, FLOOR_HEIGHT)

  // Floor 3
  buildArcade(group, FLOOR_HEIGHT * 2)
  buildMediaWall(group, FLOOR_HEIGHT * 2)
  buildMusicStage(group, FLOOR_HEIGHT * 2)

  // Floor 4
  buildAiLab(group, FLOOR_HEIGHT * 3)
  buildPodcastStudio(group, FLOOR_HEIGHT * 3)
  buildObservatory(group, FLOOR_HEIGHT * 3)

  // Floor 5
  buildTradingFloor(group, FLOOR_HEIGHT * 4)
  buildTrainingDojo(group, FLOOR_HEIGHT * 4)
  buildWarRoom(group, FLOOR_HEIGHT * 4)

  // Rooftop
  buildRooftopGarden(group, FLOOR_HEIGHT * ROOFTOP_FLOOR)
  buildHelipad(group, FLOOR_HEIGHT * ROOFTOP_FLOOR)
  buildSkyBar(group, FLOOR_HEIGHT * ROOFTOP_FLOOR)
  // Ten door portals to localhost:3001-3010 (walk through OR click to navigate same-tab)
  buildRoofPortals(group, FLOOR_HEIGHT * ROOFTOP_FLOOR)

  // Glowing teleport pads marking every named destination
  ROOM_DESTINATIONS.forEach((room) => {
    const pad = makeTeleportPad(room.color)
    pad.position.set(room.position.x + 3.5, room.position.y, room.position.z + 3.5)
    pad.userData = { type: "teleport-pad", roomId: room.id }
    group.add(pad)
  })

  scene.add(group)
  return group
}
