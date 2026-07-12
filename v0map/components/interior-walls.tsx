import * as THREE from "three"

interface WallSegment {
  startX: number
  startZ: number
  endX: number
  endZ: number
  height?: number
  width?: number
  texture?: string
}

export class InteriorWalls {
  private scene: THREE.Scene
  private wallGroup: THREE.Group
  private textureLoader: THREE.TextureLoader
  private wallSegments: WallSegment[] = []

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.wallGroup = new THREE.Group()
    this.scene.add(this.wallGroup)
    this.textureLoader = new THREE.TextureLoader()

    // Define the wall layout for a maze-like office environment
    this.defineWallLayout()
  }

  // Replace the defineWallLayout method with this empty version that doesn't create any interior walls
  private defineWallLayout() {
    // We're not adding any interior walls, only the outer walls will be created in the createWalls method
    this.wallSegments = []
  }

  create() {
    try {
      this.createWalls()
    } catch (error) {
      console.error("Error creating interior walls:", error)
    }
  }

  // Update the createWalls method to only create the outer walls of the room
  private createWalls() {
    // Create concrete texture for walls using placeholder
    const concreteTexture = this.textureLoader.load("/weathered-concrete-wall.png")
    concreteTexture.wrapS = THREE.RepeatWrapping
    concreteTexture.wrapT = THREE.RepeatWrapping
    concreteTexture.repeat.set(4, 2)

    const wallMaterial = new THREE.MeshStandardMaterial({
      map: concreteTexture,
      roughness: 0.7,
      metalness: 0.1,
      side: THREE.DoubleSide,
    })

    const createWall = (
      width: number,
      height: number,
      depth: number,
      position: THREE.Vector3,
      rotation: THREE.Euler,
      name: string,
    ) => {
      const wallGeometry = new THREE.BoxGeometry(width, height, depth)
      const wall = new THREE.Mesh(wallGeometry, wallMaterial)
      wall.position.copy(position)
      wall.rotation.copy(rotation)
      wall.castShadow = true
      wall.receiveShadow = true
      wall.name = name
      wall.userData = { ...wall.userData, solid: true } // v28.6: raycast-blocking shell
      this.wallGroup.add(wall)
    }

    const roomSize = 60
    const wallHeight = 20
    const wallThickness = 0.5
    const doorWidth = 10 // v28.6: matches the front entrance in gallery.tsx
    const doorHeight = 9

    // Only create the outer walls (no interior walls)

    // Front Wall (North)
    createWall(
      roomSize,
      wallHeight,
      wallThickness,
      new THREE.Vector3(0, wallHeight / 2, -roomSize / 2),
      new THREE.Euler(0, 0, 0),
      "northWall",
    )

    // Back Wall (South) — split around the walk-through front entrance
    const sideWidth = (roomSize - doorWidth) / 2
    createWall(
      sideWidth,
      wallHeight,
      wallThickness,
      new THREE.Vector3(-(doorWidth / 2 + sideWidth / 2), wallHeight / 2, roomSize / 2),
      new THREE.Euler(0, Math.PI, 0),
      "southWallLeft",
    )
    createWall(
      sideWidth,
      wallHeight,
      wallThickness,
      new THREE.Vector3(doorWidth / 2 + sideWidth / 2, wallHeight / 2, roomSize / 2),
      new THREE.Euler(0, Math.PI, 0),
      "southWallRight",
    )
    createWall(
      doorWidth,
      wallHeight - doorHeight,
      wallThickness,
      new THREE.Vector3(0, doorHeight + (wallHeight - doorHeight) / 2, roomSize / 2),
      new THREE.Euler(0, Math.PI, 0),
      "southWallLintel",
    )

    // Left Wall (West)
    createWall(
      roomSize,
      wallHeight,
      wallThickness,
      new THREE.Vector3(-roomSize / 2, wallHeight / 2, 0),
      new THREE.Euler(0, Math.PI / 2, 0),
      "westWall",
    )

    // Right Wall (East)
    createWall(
      roomSize,
      wallHeight,
      wallThickness,
      new THREE.Vector3(roomSize / 2, wallHeight / 2, 0),
      new THREE.Euler(0, -Math.PI / 2, 0),
      "eastWall",
    )

    this.wallGroup.name = "wallGroup"
  }

  // Add a method to get all wall meshes for collision detection
  getWalls(): THREE.Object3D[] {
    try {
      return this.wallGroup.children
    } catch (error) {
      console.error("Error getting walls:", error)
      return []
    }
  }
}
