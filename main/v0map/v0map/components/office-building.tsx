import * as THREE from "three"
import { woodFloorTexture, tileFloorTexture, carpetTexture, wallPanelTexture, concreteTexture, ceilingTexture } from "../lib/procedural-textures"

// Office Building Configuration
export const FLOOR_HEIGHT = 20
export const ROOM_SIZE = 60
export const TOTAL_FLOORS = 5
export const ROOFTOP_FLOOR = TOTAL_FLOORS

// Floor definitions
export interface FloorConfig {
  id: number
  name: string
  yPosition: number
  rooms: RoomConfig[]
}

export interface RoomConfig {
  id: string
  name: string
  type: "main" | "conference" | "office" | "breakroom" | "lobby"
  position: THREE.Vector3
  size: { width: number; depth: number; height: number }
  color: number
}

// Define all floors and rooms
export const FLOORS: FloorConfig[] = [
  {
    id: 0,
    name: "Ground Floor - Main Gallery",
    yPosition: 0,
    rooms: [
      {
        id: "main-gallery",
        name: "Main Gallery",
        type: "main",
        position: new THREE.Vector3(0, 0, 0),
        size: { width: 60, depth: 60, height: 20 },
        color: 0x1a1a2e,
      },
      {
        id: "lobby",
        name: "Lobby",
        type: "lobby",
        position: new THREE.Vector3(40, 0, 0),
        size: { width: 20, depth: 30, height: 20 },
        color: 0x16213e,
      },
    ],
  },
  {
    id: 1,
    name: "Second Floor - Offices",
    yPosition: 20,
    rooms: [
      {
        id: "office-1",
        name: "Executive Office",
        type: "office",
        position: new THREE.Vector3(0, 20, 0),
        size: { width: 60, depth: 60, height: 20 },
        color: 0x0f3460,
      },
      {
        id: "conference-1",
        name: "Conference Room A",
        type: "conference",
        position: new THREE.Vector3(40, 20, 20),
        size: { width: 25, depth: 25, height: 20 },
        color: 0x533483,
      },
    ],
  },
  {
    id: 2,
    name: "Third Floor - Break Area",
    yPosition: 40,
    rooms: [
      {
        id: "breakroom",
        name: "Break Room",
        type: "breakroom",
        position: new THREE.Vector3(0, 40, 0),
        size: { width: 60, depth: 60, height: 20 },
        color: 0xe94560,
      },
      {
        id: "conference-2",
        name: "Conference Room B",
        type: "conference",
        position: new THREE.Vector3(-40, 40, 0),
        size: { width: 25, depth: 25, height: 20 },
        color: 0x533483,
      },
    ],
  },
  {
    id: 3,
    name: "Fourth Floor - AI Lab",
    yPosition: 60,
    rooms: [
      {
        id: "ai-lab",
        name: "AI Lab",
        type: "main",
        position: new THREE.Vector3(0, 60, 0),
        size: { width: 60, depth: 60, height: 20 },
        color: 0x0e7490,
      },
      {
        id: "podcast-studio",
        name: "Podcast Studio",
        type: "office",
        position: new THREE.Vector3(40, 60, -10),
        size: { width: 22, depth: 26, height: 20 },
        color: 0x7c3aed,
      },
    ],
  },
  {
    id: 4,
    name: "Fifth Floor - Command Deck",
    yPosition: 80,
    rooms: [
      {
        id: "trading-floor",
        name: "Trading Floor",
        type: "main",
        position: new THREE.Vector3(0, 80, 0),
        size: { width: 60, depth: 60, height: 20 },
        color: 0x14532d,
      },
      {
        id: "training-dojo",
        name: "Training Dojo",
        type: "conference",
        position: new THREE.Vector3(-40, 80, 10),
        size: { width: 25, depth: 25, height: 20 },
        color: 0x9f1239,
      },
    ],
  },
]

export class OfficeBuilding {
  private scene: THREE.Scene
  private textureLoader: THREE.TextureLoader
  private floors: THREE.Group[] = []
  private ramps: THREE.Group[] = []

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.textureLoader = new THREE.TextureLoader()
  }

  create() {
    this.createAllFloors()
    this.createRooftop()
    this.createRamps() // Use ramps instead of stairs
    this.createElevator()
    this.createDoors() // Add doors to access ramps and elevator
    this.createCommandAtrium()
    this.createSkybridges()
    this.createApiServerRacks()
    this.createVoiceCommandDeck()
    this.createYukaPathNetwork()
    this.createHologramBillboards()
    this.addFloorLabels()
  }

  private createAllFloors() {
    FLOORS.forEach((floorConfig) => {
      const floorGroup = new THREE.Group()
      floorGroup.name = `floor-${floorConfig.id}`

      // Create floor plane
      this.createFloorPlane(floorGroup, floorConfig)

      // Create ceiling
      this.createCeiling(floorGroup, floorConfig)

      // Create rooms for this floor
      floorConfig.rooms.forEach((room) => {
        if (room.type !== "main") {
          this.createRoom(floorGroup, room, floorConfig)
        }
      })

      this.scene.add(floorGroup)
      this.floors.push(floorGroup)
    })
  }

  private createFloorPlane(group: THREE.Group, floorConfig: FloorConfig) {
    const floorGeometry = new THREE.PlaneGeometry(ROOM_SIZE + 40, ROOM_SIZE + 40)
    // v28.3: real procedural surfaces per floor instead of flat colors
    const floorMaterial =
      floorConfig.id === 0
        ? new THREE.MeshStandardMaterial({ map: tileFloorTexture(200, 14), roughness: 0.35, metalness: 0.15, side: THREE.DoubleSide })
        : floorConfig.id === 1
          ? new THREE.MeshStandardMaterial({ map: woodFloorTexture(12), roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide })
          : floorConfig.id === 2
            ? new THREE.MeshStandardMaterial({ map: carpetTexture(265, 18), roughness: 0.95, metalness: 0, side: THREE.DoubleSide })
            : floorConfig.id === 3
              ? new THREE.MeshStandardMaterial({ map: tileFloorTexture(170, 14), roughness: 0.3, metalness: 0.2, side: THREE.DoubleSide })
              : new THREE.MeshStandardMaterial({ map: carpetTexture(150, 18), roughness: 0.95, metalness: 0, side: THREE.DoubleSide })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = floorConfig.yPosition
    floor.receiveShadow = true
    floor.name = `floor-plane-${floorConfig.id}`
    group.add(floor)
  }

  private createCeiling(group: THREE.Group, floorConfig: FloorConfig) {
    // Create ceiling with opening for ramp access
    const ceilingGeometry = new THREE.PlaneGeometry(ROOM_SIZE + 40, ROOM_SIZE + 40)
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      map: ceilingTexture(14),
      color: 0xbfc6cd,
      roughness: 0.9,
      side: THREE.DoubleSide,
    })
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial)
    ceiling.rotation.x = Math.PI / 2
    ceiling.position.y = floorConfig.yPosition + FLOOR_HEIGHT
    ceiling.receiveShadow = true
    group.add(ceiling)
  }

  private createRooftop() {
    const roofY = ROOFTOP_FLOOR * FLOOR_HEIGHT
    const roofGroup = new THREE.Group()
    roofGroup.name = "rooftop-deck"

    const deck = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_SIZE + 40, ROOM_SIZE + 40),
      new THREE.MeshStandardMaterial({
        map: concreteTexture(12),
        roughness: 0.9,
        metalness: 0.05,
        side: THREE.DoubleSide,
      }),
    )
    deck.rotation.x = -Math.PI / 2
    deck.position.y = roofY + 0.04
    deck.receiveShadow = true
    deck.name = "rooftop-floor"
    roofGroup.add(deck)

    const railMaterial = new THREE.MeshStandardMaterial({ color: 0xc7d0da, roughness: 0.35, metalness: 0.55 })
    const railHeight = 2.3
    const half = (ROOM_SIZE + 40) / 2
    const railConfigs = [
      { x: 0, z: -half, w: ROOM_SIZE + 40, d: 0.25 },
      { x: 0, z: half, w: ROOM_SIZE + 40, d: 0.25 },
      { x: -half, z: 0, w: 0.25, d: ROOM_SIZE + 40 },
      { x: half, z: 0, w: 0.25, d: ROOM_SIZE + 40 },
    ]

    railConfigs.forEach((config) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(config.w, railHeight, config.d), railMaterial)
      rail.position.set(config.x, roofY + railHeight / 2, config.z)
      rail.castShadow = true
      roofGroup.add(rail)
    })

    const helipad = new THREE.Mesh(
      new THREE.RingGeometry(7, 8, 48),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
    )
    helipad.rotation.x = -Math.PI / 2
    helipad.position.set(0, roofY + 0.08, 0)
    roofGroup.add(helipad)

    this.addRooftopLabel(roofGroup, roofY)
    this.scene.add(roofGroup)
    this.floors.push(roofGroup)
  }

  private addRooftopLabel(group: THREE.Group, roofY: number) {
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 128
    const context = canvas.getContext("2d")
    if (!context) return

    context.fillStyle = "rgba(20, 35, 55, 0.82)"
    context.fillRect(0, 0, 1024, 128)
    context.strokeStyle = "#8fd8ff"
    context.lineWidth = 4
    context.strokeRect(4, 4, 1016, 120)
    context.fillStyle = "#ffffff"
    context.font = "bold 60px Arial"
    context.textAlign = "center"
    context.textBaseline = "middle"
    context.fillText("Rooftop - Sky Deck", 512, 64)

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({ map: texture })
    const sprite = new THREE.Sprite(material)
    sprite.position.set(0, roofY + 8, -22)
    sprite.scale.set(24, 3, 1)
    group.add(sprite)
  }

  private createRoom(group: THREE.Group, room: RoomConfig, floorConfig: FloorConfig) {
    const roomGroup = new THREE.Group()
    roomGroup.name = room.id

    // Room walls - with door openings (v28.2: brushed panel texture tinted by room color)
    const wallMaterial = new THREE.MeshStandardMaterial({
      map: wallPanelTexture(3),
      color: room.color,
      roughness: 0.65,
      metalness: 0.1,
      side: THREE.DoubleSide,
    })

    const wallThickness = 0.3

    // Front wall with door opening
    const frontWallLeft = new THREE.Mesh(
      new THREE.BoxGeometry(room.size.width / 2 - 2, room.size.height, wallThickness),
      wallMaterial
    )
    frontWallLeft.position.set(
      room.position.x - room.size.width / 4 - 1,
      room.position.y + room.size.height / 2,
      room.position.z - room.size.depth / 2
    )
    roomGroup.add(frontWallLeft)

    const frontWallRight = new THREE.Mesh(
      new THREE.BoxGeometry(room.size.width / 2 - 2, room.size.height, wallThickness),
      wallMaterial
    )
    frontWallRight.position.set(
      room.position.x + room.size.width / 4 + 1,
      room.position.y + room.size.height / 2,
      room.position.z - room.size.depth / 2
    )
    roomGroup.add(frontWallRight)

    // Door frame above opening
    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(4, room.size.height - 8, wallThickness),
      wallMaterial
    )
    doorFrame.position.set(
      room.position.x,
      room.position.y + room.size.height - 4,
      room.position.z - room.size.depth / 2
    )
    roomGroup.add(doorFrame)

    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(room.size.width, room.size.height, wallThickness),
      wallMaterial
    )
    backWall.position.set(room.position.x, room.position.y + room.size.height / 2, room.position.z + room.size.depth / 2)
    roomGroup.add(backWall)

    // Left wall
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, room.size.height, room.size.depth),
      wallMaterial
    )
    leftWall.position.set(room.position.x - room.size.width / 2, room.position.y + room.size.height / 2, room.position.z)
    roomGroup.add(leftWall)

    // Right wall
    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, room.size.height, room.size.depth),
      wallMaterial
    )
    rightWall.position.set(room.position.x + room.size.width / 2, room.position.y + room.size.height / 2, room.position.z)
    roomGroup.add(rightWall)

    // Room floor
    const roomFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(room.size.width, room.size.depth),
      new THREE.MeshStandardMaterial({
        color: room.type === "conference" ? 0x4a4a5a : room.type === "breakroom" ? 0x5a4a4a : 0x3a3a3a,
        roughness: 0.8,
      })
    )
    roomFloor.rotation.x = -Math.PI / 2
    roomFloor.position.set(room.position.x, room.position.y + 0.01, room.position.z)
    roomGroup.add(roomFloor)

    // Add furniture based on room type
    this.addFurniture(roomGroup, room)

    // Add room label
    this.addRoomLabel(roomGroup, room)

    group.add(roomGroup)
  }

  private addFurniture(group: THREE.Group, room: RoomConfig) {
    if (room.type === "conference") {
      // Conference table
      const tableGeometry = new THREE.BoxGeometry(8, 0.5, 4)
      const tableMaterial = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.5 })
      const table = new THREE.Mesh(tableGeometry, tableMaterial)
      table.position.set(room.position.x, room.position.y + 1.25, room.position.z)
      table.castShadow = true
      group.add(table)

      // Chairs around table
      const chairMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
      for (let i = 0; i < 6; i++) {
        const chair = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.5, 0.8), chairMaterial)
        const angle = (i / 6) * Math.PI * 2
        chair.position.set(
          room.position.x + Math.cos(angle) * 5,
          room.position.y + 0.75,
          room.position.z + Math.sin(angle) * 3
        )
        chair.castShadow = true
        group.add(chair)
      }
    } else if (room.type === "office") {
      // Desk
      const deskGeometry = new THREE.BoxGeometry(4, 0.5, 2)
      const deskMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.5 })
      const desk = new THREE.Mesh(deskGeometry, deskMaterial)
      desk.position.set(room.position.x, room.position.y + 1.25, room.position.z - 5)
      desk.castShadow = true
      group.add(desk)

      // Office chair
      const chairGeometry = new THREE.BoxGeometry(1, 1.8, 1)
      const chairMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
      const chair = new THREE.Mesh(chairGeometry, chairMaterial)
      chair.position.set(room.position.x, room.position.y + 0.9, room.position.z - 3)
      chair.castShadow = true
      group.add(chair)
    } else if (room.type === "breakroom") {
      // Coffee table
      const coffeeTable = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 0.5, 16),
        new THREE.MeshStandardMaterial({ color: 0x3a3a3a })
      )
      coffeeTable.position.set(room.position.x, room.position.y + 0.75, room.position.z)
      group.add(coffeeTable)

      // Sofas
      const sofaMaterial = new THREE.MeshStandardMaterial({ color: 0x4a6a8a })
      for (let i = 0; i < 3; i++) {
        const sofa = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 1.5), sofaMaterial)
        const angle = (i / 3) * Math.PI * 2
        sofa.position.set(
          room.position.x + Math.cos(angle) * 5,
          room.position.y + 0.75,
          room.position.z + Math.sin(angle) * 5
        )
        sofa.rotation.y = angle + Math.PI / 2
        sofa.castShadow = true
        group.add(sofa)
      }
    } else if (room.type === "lobby") {
      // Reception desk
      const receptionDesk = new THREE.Mesh(
        new THREE.BoxGeometry(6, 1.5, 2),
        new THREE.MeshStandardMaterial({ color: 0x2a4a6a })
      )
      receptionDesk.position.set(room.position.x, room.position.y + 0.75, room.position.z)
      group.add(receptionDesk)

      // Waiting chairs
      const chairMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a3a })
      for (let i = 0; i < 4; i++) {
        const chair = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 1.5), chairMaterial)
        chair.position.set(room.position.x - 5 + i * 3, room.position.y + 0.5, room.position.z + 8)
        group.add(chair)
      }
    }
  }

  private addRoomLabel(group: THREE.Group, room: RoomConfig) {
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 128
    const context = canvas.getContext("2d")
    if (!context) return

    context.fillStyle = "rgba(0, 0, 0, 0.7)"
    context.fillRect(0, 0, 512, 128)
    context.fillStyle = "#ffffff"
    context.font = "bold 48px Arial"
    context.textAlign = "center"
    context.textBaseline = "middle"
    context.fillText(room.name, 256, 64)

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({ map: texture })
    const sprite = new THREE.Sprite(material)
    sprite.position.set(room.position.x, room.position.y + room.size.height - 2, room.position.z)
    sprite.scale.set(10, 2.5, 1)
    group.add(sprite)
  }

  // Create RAMPS instead of stairs for easier movement
  private createRamps() {
    const rampMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a5a6a,
      roughness: 0.4,
      metalness: 0.3,
    })

    const railMaterial = new THREE.MeshStandardMaterial({
      color: 0x8a8a9a,
      roughness: 0.3,
      metalness: 0.6,
    })

    // Create ramps between each floor
    for (let floor = 0; floor < TOTAL_FLOORS - 1; floor++) {
      const rampGroup = new THREE.Group()
      rampGroup.name = `ramp-${floor}-to-${floor + 1}`

      const rampLength = 30 // Longer ramp for gentler slope
      const rampWidth = 6
      const rampStartX = 35
      const rampStartZ = -25

      // Main ramp surface
      const rampGeometry = new THREE.BoxGeometry(rampWidth, 0.3, rampLength)
      const ramp = new THREE.Mesh(rampGeometry, rampMaterial)
      
      // Position and rotate ramp
      ramp.position.set(
        rampStartX,
        floor * FLOOR_HEIGHT + FLOOR_HEIGHT / 2,
        rampStartZ + rampLength / 2
      )
      // Rotate to create slope
      ramp.rotation.x = -Math.atan(FLOOR_HEIGHT / rampLength)
      ramp.castShadow = true
      ramp.receiveShadow = true
      rampGroup.add(ramp)

      // Left railing
      const railHeight = 3
      const leftRailGeometry = new THREE.BoxGeometry(0.15, railHeight, rampLength)
      const leftRail = new THREE.Mesh(leftRailGeometry, railMaterial)
      leftRail.position.set(
        rampStartX - rampWidth / 2,
        floor * FLOOR_HEIGHT + FLOOR_HEIGHT / 2 + railHeight / 2,
        rampStartZ + rampLength / 2
      )
      leftRail.rotation.x = -Math.atan(FLOOR_HEIGHT / rampLength)
      rampGroup.add(leftRail)

      // Right railing
      const rightRail = new THREE.Mesh(leftRailGeometry, railMaterial)
      rightRail.position.set(
        rampStartX + rampWidth / 2,
        floor * FLOOR_HEIGHT + FLOOR_HEIGHT / 2 + railHeight / 2,
        rampStartZ + rampLength / 2
      )
      rightRail.rotation.x = -Math.atan(FLOOR_HEIGHT / rampLength)
      rampGroup.add(rightRail)

      // Handrails on top
      const handrailGeometry = new THREE.CylinderGeometry(0.08, 0.08, rampLength * 1.05, 8)
      
      const leftHandrail = new THREE.Mesh(handrailGeometry, railMaterial)
      leftHandrail.position.set(
        rampStartX - rampWidth / 2,
        floor * FLOOR_HEIGHT + FLOOR_HEIGHT / 2 + railHeight,
        rampStartZ + rampLength / 2
      )
      leftHandrail.rotation.x = Math.PI / 2 + Math.atan(FLOOR_HEIGHT / rampLength)
      rampGroup.add(leftHandrail)

      const rightHandrail = new THREE.Mesh(handrailGeometry, railMaterial)
      rightHandrail.position.set(
        rampStartX + rampWidth / 2,
        floor * FLOOR_HEIGHT + FLOOR_HEIGHT / 2 + railHeight,
        rampStartZ + rampLength / 2
      )
      rightHandrail.rotation.x = Math.PI / 2 + Math.atan(FLOOR_HEIGHT / rampLength)
      rampGroup.add(rightHandrail)

      // Landing platforms at top and bottom
      const landingGeometry = new THREE.BoxGeometry(rampWidth + 2, 0.3, 5)
      
      // Bottom landing
      const bottomLanding = new THREE.Mesh(landingGeometry, rampMaterial)
      bottomLanding.position.set(rampStartX, floor * FLOOR_HEIGHT + 0.15, rampStartZ - 2)
      rampGroup.add(bottomLanding)

      // Top landing
      const topLanding = new THREE.Mesh(landingGeometry, rampMaterial)
      topLanding.position.set(rampStartX, (floor + 1) * FLOOR_HEIGHT + 0.15, rampStartZ + rampLength + 2)
      rampGroup.add(topLanding)

      // Ramp label
      this.addRampLabel(rampGroup, floor, rampStartX, rampStartZ)

      this.scene.add(rampGroup)
      this.ramps.push(rampGroup)
    }
  }

  private addRampLabel(group: THREE.Group, floor: number, x: number, z: number) {
    const canvas = document.createElement("canvas")
    canvas.width = 256
    canvas.height = 64
    const context = canvas.getContext("2d")
    if (!context) return

    context.fillStyle = "rgba(0, 100, 200, 0.8)"
    context.fillRect(0, 0, 256, 64)
    context.fillStyle = "#ffffff"
    context.font = "bold 28px Arial"
    context.textAlign = "center"
    context.textBaseline = "middle"
    context.fillText(`↑ RAMP TO ${floor + 2}F ↑`, 128, 32)

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({ map: texture })
    const sprite = new THREE.Sprite(material)
    sprite.position.set(x, floor * FLOOR_HEIGHT + 3, z - 5)
    sprite.scale.set(6, 1.5, 1)
    group.add(sprite)
  }

  // Create ALWAYS-OPEN elevator
  private createElevator() {
    const elevatorGroup = new THREE.Group()
    elevatorGroup.name = "elevator"

    const elevatorMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a5a,
      roughness: 0.3,
      metalness: 0.7,
    })

    // Elevator shaft - open on all sides for easy access
    const shaftHeight = FLOOR_HEIGHT * (TOTAL_FLOORS + 1)
    
    // Back wall of shaft
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(8, shaftHeight, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.8 })
    )
    backWall.position.set(-35, shaftHeight / 2, -29)
    elevatorGroup.add(backWall)

    // Side walls with openings at each floor
    const sideWallMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, roughness: 0.7 })
    
    // Left side wall segments (with gaps for doors)
    for (let floor = 0; floor <= TOTAL_FLOORS; floor++) {
      // Upper part of wall segment
      const upperSegment = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, FLOOR_HEIGHT - 10, 8),
        sideWallMaterial
      )
      upperSegment.position.set(-39, floor * FLOOR_HEIGHT + FLOOR_HEIGHT - 5, -25)
      elevatorGroup.add(upperSegment)
    }

    // Right side wall segments
    for (let floor = 0; floor <= TOTAL_FLOORS; floor++) {
      const upperSegment = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, FLOOR_HEIGHT - 10, 8),
        sideWallMaterial
      )
      upperSegment.position.set(-31, floor * FLOOR_HEIGHT + FLOOR_HEIGHT - 5, -25)
      elevatorGroup.add(upperSegment)
    }

    // Elevator platforms at each floor (always accessible)
    for (let floor = 0; floor <= TOTAL_FLOORS; floor++) {
      // Platform
      const platformGeometry = new THREE.BoxGeometry(7, 0.5, 7)
      const platform = new THREE.Mesh(platformGeometry, elevatorMaterial)
      platform.position.set(-35, floor * FLOOR_HEIGHT + 0.25, -25)
      platform.name = `elevator-platform-${floor}`
      elevatorGroup.add(platform)

      // Floor indicator light
      const indicatorCanvas = document.createElement("canvas")
      indicatorCanvas.width = 128
      indicatorCanvas.height = 128
      const ctx = indicatorCanvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#1a1a2a"
        ctx.fillRect(0, 0, 128, 128)
        ctx.strokeStyle = "#00ff88"
        ctx.lineWidth = 4
        ctx.strokeRect(8, 8, 112, 112)
        ctx.fillStyle = "#00ff88"
        ctx.font = "bold 60px Arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(floor === ROOFTOP_FLOOR ? "RF" : `${floor + 1}F`, 64, 64)
      }
      const indicatorTexture = new THREE.CanvasTexture(indicatorCanvas)
      const indicatorMaterial = new THREE.SpriteMaterial({ map: indicatorTexture })
      const indicator = new THREE.Sprite(indicatorMaterial)
      indicator.position.set(-35, floor * FLOOR_HEIGHT + 5, -28.5)
      indicator.scale.set(3, 3, 1)
      elevatorGroup.add(indicator)

      // "ELEVATOR" label
      const labelCanvas = document.createElement("canvas")
      labelCanvas.width = 256
      labelCanvas.height = 64
      const labelCtx = labelCanvas.getContext("2d")
      if (labelCtx) {
        labelCtx.fillStyle = "rgba(0, 150, 100, 0.9)"
        labelCtx.fillRect(0, 0, 256, 64)
        labelCtx.fillStyle = "#ffffff"
        labelCtx.font = "bold 32px Arial"
        labelCtx.textAlign = "center"
        labelCtx.textBaseline = "middle"
        labelCtx.fillText("⬆ ELEVATOR ⬇", 128, 32)
      }
      const labelTexture = new THREE.CanvasTexture(labelCanvas)
      const labelMaterial = new THREE.SpriteMaterial({ map: labelTexture })
      const label = new THREE.Sprite(labelMaterial)
      label.position.set(-35, floor * FLOOR_HEIGHT + 8, -21)
      label.scale.set(5, 1.25, 1)
      elevatorGroup.add(label)
    }

    // Ceiling of elevator shaft
    const ceilingGeometry = new THREE.BoxGeometry(8, 0.3, 8)
    const ceiling = new THREE.Mesh(ceilingGeometry, elevatorMaterial)
    ceiling.position.set(-35, shaftHeight + 0.15, -25)
    elevatorGroup.add(ceiling)

    // Elevator lighting
    const elevatorLight = new THREE.PointLight(0x88ffaa, 1, 15)
    elevatorLight.position.set(-35, 15, -25)
    elevatorGroup.add(elevatorLight)

    this.scene.add(elevatorGroup)
  }

  // Create doors to access ramps and elevator
  private createDoors() {
    const doorFrameMaterial = new THREE.MeshStandardMaterial({
      color: 0x6a5a4a,
      roughness: 0.5,
      metalness: 0.3,
    })

    // Door to ramp area (from main gallery)
    for (let floor = 0; floor <= TOTAL_FLOORS; floor++) {
      // Ramp access door frame
      const rampDoorFrame = new THREE.Group()
      rampDoorFrame.name = `ramp-door-${floor}`

      // Door frame sides
      const frameGeometry = new THREE.BoxGeometry(0.5, 8, 0.5)
      const leftFrame = new THREE.Mesh(frameGeometry, doorFrameMaterial)
      leftFrame.position.set(32, floor * FLOOR_HEIGHT + 4, -25)
      rampDoorFrame.add(leftFrame)

      const rightFrame = new THREE.Mesh(frameGeometry, doorFrameMaterial)
      rightFrame.position.set(38, floor * FLOOR_HEIGHT + 4, -25)
      rampDoorFrame.add(rightFrame)

      // Door frame top
      const topFrame = new THREE.Mesh(
        new THREE.BoxGeometry(6.5, 0.5, 0.5),
        doorFrameMaterial
      )
      topFrame.position.set(35, floor * FLOOR_HEIGHT + 8.25, -25)
      rampDoorFrame.add(topFrame)

      // "RAMP ACCESS" sign
      const signCanvas = document.createElement("canvas")
      signCanvas.width = 256
      signCanvas.height = 64
      const ctx = signCanvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "rgba(100, 50, 150, 0.9)"
        ctx.fillRect(0, 0, 256, 64)
        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 28px Arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText("🚶 RAMP ACCESS", 128, 32)
      }
      const signTexture = new THREE.CanvasTexture(signCanvas)
      const signMaterial = new THREE.SpriteMaterial({ map: signTexture })
      const sign = new THREE.Sprite(signMaterial)
      sign.position.set(35, floor * FLOOR_HEIGHT + 10, -25)
      sign.scale.set(5, 1.25, 1)
      rampDoorFrame.add(sign)

      if (floor < TOTAL_FLOORS) {
        this.scene.add(rampDoorFrame)
      }

      // Elevator access door frame
      const elevatorDoorFrame = new THREE.Group()
      elevatorDoorFrame.name = `elevator-door-${floor}`

      // Door frame sides
      const elevLeftFrame = new THREE.Mesh(frameGeometry, doorFrameMaterial)
      elevLeftFrame.position.set(-39, floor * FLOOR_HEIGHT + 4, -21)
      elevatorDoorFrame.add(elevLeftFrame)

      const elevRightFrame = new THREE.Mesh(frameGeometry, doorFrameMaterial)
      elevRightFrame.position.set(-31, floor * FLOOR_HEIGHT + 4, -21)
      elevatorDoorFrame.add(elevRightFrame)

      // Door frame top
      const elevTopFrame = new THREE.Mesh(
        new THREE.BoxGeometry(8.5, 0.5, 0.5),
        doorFrameMaterial
      )
      elevTopFrame.position.set(-35, floor * FLOOR_HEIGHT + 8.25, -21)
      elevatorDoorFrame.add(elevTopFrame)

      this.scene.add(elevatorDoorFrame)
    }
  }


  private createCommandAtrium() {
    const atriumGroup = new THREE.Group()
    atriumGroup.name = "wordpress-command-atrium"

    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.18,
      roughness: 0.08,
      metalness: 0.35,
      side: THREE.DoubleSide,
    })

    const pillarMaterial = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.38, metalness: 0.55 })
    const glowMaterial = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55 })

    const positions = [
      [-26, -26],
      [26, -26],
      [-26, 26],
      [26, 26],
      [0, -29],
      [0, 29],
    ]

    positions.forEach(([x, z], index) => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.85, FLOOR_HEIGHT * TOTAL_FLOORS + 8, 16), pillarMaterial)
      pillar.position.set(x, (FLOOR_HEIGHT * TOTAL_FLOORS) / 2, z)
      pillar.castShadow = true
      pillar.receiveShadow = true
      atriumGroup.add(pillar)

      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.07, 8, 24), glowMaterial)
      ring.position.set(x, 4 + index * 2, z)
      ring.rotation.x = Math.PI / 2
      atriumGroup.add(ring)
    })

    for (let floor = 0; floor <= TOTAL_FLOORS; floor++) {
      const y = floor * FLOOR_HEIGHT + 0.12
      const ring = new THREE.Mesh(new THREE.RingGeometry(12, 13.4, 64), glassMaterial)
      ring.rotation.x = -Math.PI / 2
      ring.position.set(0, y, 0)
      atriumGroup.add(ring)

      const commandPod = new THREE.Mesh(
        new THREE.CylinderGeometry(3.4, 3.8, 1.1, 24),
        new THREE.MeshStandardMaterial({ color: floor === 0 ? 0x312e81 : 0x164e63, roughness: 0.35, metalness: 0.45 }),
      )
      commandPod.position.set(-18 + floor * 8, y + 0.6, 18 - floor * 7)
      commandPod.castShadow = true
      atriumGroup.add(commandPod)
    }

    const coreLight = new THREE.PointLight(0x38bdf8, 1.6, 65)
    coreLight.position.set(0, FLOOR_HEIGHT * 1.5, 0)
    atriumGroup.add(coreLight)

    this.scene.add(atriumGroup)
  }

  private createSkybridges() {
    const bridgeGroup = new THREE.Group()
    bridgeGroup.name = "live-api-skybridges"

    const bridgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      transparent: true,
      opacity: 0.72,
      roughness: 0.18,
      metalness: 0.45,
    })
    const railMaterial = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.22, metalness: 0.6 })

    for (let floor = 1; floor <= TOTAL_FLOORS; floor++) {
      const y = floor * FLOOR_HEIGHT + 2.2
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(54, 0.35, 4), bridgeMaterial)
      bridge.position.set(0, y, -36)
      bridge.castShadow = true
      bridge.receiveShadow = true
      bridgeGroup.add(bridge)

      ;[-2.1, 2.1].forEach((zOffset) => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(54, 1.1, 0.16), railMaterial)
        rail.position.set(0, y + 0.75, -36 + zOffset)
        bridgeGroup.add(rail)
      })
    }

    this.scene.add(bridgeGroup)
  }

  private createApiServerRacks() {
    const rackGroup = new THREE.Group()
    rackGroup.name = "wordpress-api-server-racks"
    const rackMaterial = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.42, metalness: 0.65 })
    const lightMaterial = new THREE.MeshBasicMaterial({ color: 0x22c55e })

    for (let floor = 0; floor < TOTAL_FLOORS; floor++) {
      for (let i = 0; i < 8; i++) {
        const rack = new THREE.Mesh(new THREE.BoxGeometry(1.5, 4.5, 0.8), rackMaterial)
        rack.position.set(-28 + i * 2.2, floor * FLOOR_HEIGHT + 2.25, 31)
        rack.castShadow = true
        rack.receiveShadow = true
        rackGroup.add(rack)

        for (let light = 0; light < 3; light++) {
          const led = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.05), lightMaterial)
          led.position.set(rack.position.x - 0.55 + light * 0.28, rack.position.y + 1.25, rack.position.z - 0.43)
          rackGroup.add(led)
        }
      }
    }

    this.scene.add(rackGroup)
  }


  private createVoiceCommandDeck() {
    const deckGroup = new THREE.Group()
    deckGroup.name = "voice-command-deck"
    const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.34, metalness: 0.48 })
    const micMaterial = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2, metalness: 0.75 })
    const glowMaterial = new THREE.MeshBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.42 })

    for (let floor = 0; floor <= TOTAL_FLOORS; floor++) {
      const y = floor * FLOOR_HEIGHT + 0.35
      const platform = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 6.5, 0.7, 32), platformMaterial)
      platform.position.set(24, y, -18)
      platform.castShadow = true
      platform.receiveShadow = true
      deckGroup.add(platform)

      const pulse = new THREE.Mesh(new THREE.TorusGeometry(5.9, 0.08, 8, 48), glowMaterial)
      pulse.position.set(24, y + 0.55, -18)
      pulse.rotation.x = Math.PI / 2
      deckGroup.add(pulse)

      const micStand = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.4, 12), micMaterial)
      micStand.position.set(24, y + 2, -18)
      deckGroup.add(micStand)

      const micHead = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), micMaterial)
      micHead.position.set(24, y + 3.85, -18)
      deckGroup.add(micHead)
    }

    const light = new THREE.PointLight(0x5eead4, 1.1, 34)
    light.position.set(24, FLOOR_HEIGHT * 1.5, -18)
    deckGroup.add(light)
    this.scene.add(deckGroup)
  }

  private createYukaPathNetwork() {
    const pathGroup = new THREE.Group()
    pathGroup.name = "yuka-style-path-network"
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.72 })
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xfde68a, transparent: true, opacity: 0.5 })

    const nodes = [
      [-22, -22], [-8, -16], [8, -16], [22, -22],
      [-22, 0], [-6, 0], [6, 0], [22, 0],
      [-22, 22], [-8, 16], [8, 16], [22, 22],
    ]

    for (let floor = 0; floor <= TOTAL_FLOORS; floor++) {
      const y = floor * FLOOR_HEIGHT + 0.09
      nodes.forEach(([x, z], index) => {
        const node = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), nodeMaterial)
        node.position.set(x, y + 0.35, z)
        node.name = `yuka-path-node-${floor}-${index}`
        pathGroup.add(node)
      })

      for (let i = 0; i < nodes.length - 1; i++) {
        const [x1, z1] = nodes[i]
        const [x2, z2] = nodes[i + 1]
        const dx = x2 - x1
        const dz = z2 - z1
        const length = Math.sqrt(dx * dx + dz * dz)
        const segment = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, length), lineMaterial)
        segment.position.set((x1 + x2) / 2, y + 0.08, (z1 + z2) / 2)
        segment.rotation.y = Math.atan2(dx, dz)
        pathGroup.add(segment)
      }
    }

    this.scene.add(pathGroup)
  }

  private createHologramBillboards() {
    const billboardGroup = new THREE.Group()
    billboardGroup.name = "wordpress-api-hologram-billboards"
    const material = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.28, side: THREE.DoubleSide })
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 })
    const positions = [
      { x: -32, z: -32, rot: Math.PI / 4, label: "Live WP API" },
      { x: 32, z: -32, rot: -Math.PI / 4, label: "Shortcode OS" },
      { x: -32, z: 32, rot: -Math.PI / 4, label: "Voice Agents" },
      { x: 32, z: 32, rot: Math.PI / 4, label: "Team Import" },
    ]

    positions.forEach((item) => {
      for (let floor = 0; floor < TOTAL_FLOORS; floor++) {
        const y = floor * FLOOR_HEIGHT + 8
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), material)
        panel.position.set(item.x, y, item.z)
        panel.rotation.y = item.rot
        billboardGroup.add(panel)

        const frame = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.18, 0.18), frameMaterial)
        frame.position.set(item.x, y + 2.6, item.z)
        frame.rotation.y = item.rot
        billboardGroup.add(frame)
      }
    })

    this.scene.add(billboardGroup)
  }

  private addFloorLabels() {
    FLOORS.forEach((floorConfig) => {
      const canvas = document.createElement("canvas")
      canvas.width = 1024
      canvas.height = 128
      const context = canvas.getContext("2d")
      if (!context) return

      context.fillStyle = "rgba(0, 0, 0, 0.8)"
      context.fillRect(0, 0, 1024, 128)
      context.strokeStyle = "#4a90e2"
      context.lineWidth = 4
      context.strokeRect(4, 4, 1016, 120)
      context.fillStyle = "#ffffff"
      context.font = "bold 60px Arial"
      context.textAlign = "center"
      context.textBaseline = "middle"
      context.fillText(floorConfig.name, 512, 64)

      const texture = new THREE.CanvasTexture(canvas)
      const material = new THREE.SpriteMaterial({ map: texture })
      const sprite = new THREE.Sprite(material)
      sprite.position.set(0, floorConfig.yPosition + FLOOR_HEIGHT - 3, 0)
      sprite.scale.set(25, 3, 1)
      this.scene.add(sprite)
    })
  }

  // Get the floor at a given Y position
  getFloorAtPosition(y: number): number {
    return Math.floor(y / FLOOR_HEIGHT)
  }

  // Get all collision objects for the building
  getCollisionObjects(): THREE.Object3D[] {
    const objects: THREE.Object3D[] = []
    this.floors.forEach((floor) => {
      floor.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          objects.push(child)
        }
      })
    })
    this.ramps.forEach((ramp) => {
      ramp.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          objects.push(child)
        }
      })
    })
    return objects
  }
}
