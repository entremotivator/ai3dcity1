import * as THREE from "three"
import { FontLoader } from "three/examples/jsm/loaders/FontLoader"
import type React from "react"

interface GalleryItem {
  title: string
  description: string
  streamlitUrl?: string
  liveUrl?: string
  shortcode?: string
  shortcodeTag?: string
  wordpressUrl?: string
  imageUrl?: string // Optional image URL for the 3D box display
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
}

interface WallSection {
  name: string
  position: THREE.Vector3
  rotation: THREE.Euler
}

export class Gallery {
  private scene: THREE.Scene
  private items: GalleryItem[]
  private font: THREE.Font | null = null
  private wallGroup: THREE.Group
  private textureLoader: THREE.TextureLoader
  private fontLoaded = false
  private spritesRef: React.MutableRefObject<THREE.Sprite[]> = { current: [] }

  constructor(scene: THREE.Scene, items: GalleryItem[], spritesRef?: React.MutableRefObject<THREE.Sprite[]>) {
    this.scene = scene
    this.items = items
    this.wallGroup = new THREE.Group()
    this.scene.add(this.wallGroup)
    this.textureLoader = new THREE.TextureLoader()
    if (spritesRef) {
      this.spritesRef = spritesRef
    }
    this.loadFont()
  }

  private loadFont() {
    const loader = new FontLoader()
    loader.load("https://threejs.org/examples/fonts/helvetiker_regular.typeface.json", (font) => {
      this.font = font
      this.fontLoaded = true
      this.createGalleryItems()
      this.createWallTitles()
    })
  }

  create() {
    this.createRoom()
    if (this.fontLoaded) {
      this.createGalleryItems()
      this.createWallTitles()
    }
  }

  private createRoom() {
    this.createWalls()
    this.createFloor()
    this.createCeiling()
  }

  private createWalls() {
    // Load themed wall textures for each wall
    const northTexture = this.textureLoader.load("/textures/north-wall-tech.png")
    const eastTexture = this.textureLoader.load("/textures/east-wall-business.png")
    const southTexture = this.textureLoader.load("/textures/south-wall-creative.png")
    const westTexture = this.textureLoader.load("/textures/west-wall-analytics.png")

    // Configure texture wrapping
    ;[northTexture, eastTexture, southTexture, westTexture].forEach((texture) => {
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      texture.repeat.set(3, 1.5)
    })

    // Create materials for each wall with unique textures
    const northMaterial = new THREE.MeshStandardMaterial({
      map: northTexture,
      roughness: 0.6,
      metalness: 0.2,
      side: THREE.DoubleSide,
    })

    const eastMaterial = new THREE.MeshStandardMaterial({
      map: eastTexture,
      roughness: 0.6,
      metalness: 0.2,
      side: THREE.DoubleSide,
    })

    const southMaterial = new THREE.MeshStandardMaterial({
      map: southTexture,
      roughness: 0.6,
      metalness: 0.2,
      side: THREE.DoubleSide,
    })

    const westMaterial = new THREE.MeshStandardMaterial({
      map: westTexture,
      roughness: 0.6,
      metalness: 0.2,
      side: THREE.DoubleSide,
    })

    const createWall = (
      width: number,
      height: number,
      depth: number,
      position: THREE.Vector3,
      rotation: THREE.Euler,
      name: string,
      material: THREE.MeshStandardMaterial,
    ) => {
      const wallGeometry = new THREE.BoxGeometry(width, height, depth)
      const wall = new THREE.Mesh(wallGeometry, material)
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
    const doorWidth = 10 // v28.6: front entrance opening to the city
    const doorHeight = 9

    // Front Wall (North) - Tech Theme (Blue)
    createWall(
      roomSize,
      wallHeight,
      wallThickness,
      new THREE.Vector3(0, wallHeight / 2, -roomSize / 2),
      new THREE.Euler(0, 0, 0),
      "northWall",
      northMaterial,
    )

    // Back Wall (South) - Creative Theme (Purple)
    // v28.6: split into two segments + lintel, leaving a walk-through front
    // entrance to the new outdoor city district.
    const sideWidth = (roomSize - doorWidth) / 2
    createWall(
      sideWidth,
      wallHeight,
      wallThickness,
      new THREE.Vector3(-(doorWidth / 2 + sideWidth / 2), wallHeight / 2, roomSize / 2),
      new THREE.Euler(0, Math.PI, 0),
      "southWallLeft",
      southMaterial,
    )
    createWall(
      sideWidth,
      wallHeight,
      wallThickness,
      new THREE.Vector3(doorWidth / 2 + sideWidth / 2, wallHeight / 2, roomSize / 2),
      new THREE.Euler(0, Math.PI, 0),
      "southWallRight",
      southMaterial,
    )
    createWall(
      doorWidth,
      wallHeight - doorHeight,
      wallThickness,
      new THREE.Vector3(0, doorHeight + (wallHeight - doorHeight) / 2, roomSize / 2),
      new THREE.Euler(0, Math.PI, 0),
      "southWallLintel",
      southMaterial,
    )

    // Left Wall (West) - Analytics Theme (Orange)
    createWall(
      roomSize,
      wallHeight,
      wallThickness,
      new THREE.Vector3(-roomSize / 2, wallHeight / 2, 0),
      new THREE.Euler(0, Math.PI / 2, 0),
      "westWall",
      westMaterial,
    )

    // Right Wall (East) - Business Theme (Green)
    createWall(
      roomSize,
      wallHeight,
      wallThickness,
      new THREE.Vector3(roomSize / 2, wallHeight / 2, 0),
      new THREE.Euler(0, -Math.PI / 2, 0),
      "eastWall",
      eastMaterial,
    )

    this.wallGroup.name = "wallGroup"
  }

  private createFloor() {
    // Create wood texture for floor using placeholder
    const woodTexture = this.textureLoader.load("https://root-flu-internet-intense.trycloudflare.com")
    woodTexture.wrapS = THREE.RepeatWrapping
    woodTexture.wrapT = THREE.RepeatWrapping
    woodTexture.repeat.set(10, 10)

    const floorGeometry = new THREE.PlaneGeometry(60, 60)
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: woodTexture,
      roughness: 0.8,
      side: THREE.DoubleSide,
    })
    const floorPlane = new THREE.Mesh(floorGeometry, floorMaterial)
    floorPlane.rotation.x = Math.PI / 2
    floorPlane.position.y = 0
    floorPlane.receiveShadow = true
    this.scene.add(floorPlane)
  }

  private createCeiling() {
    // Create ceiling texture using placeholder
    const ceilingTexture = this.textureLoader.load("https://root-flu-internet-intense.trycloudflare.com")
    ceilingTexture.wrapS = THREE.RepeatWrapping
    ceilingTexture.wrapT = THREE.RepeatWrapping
    ceilingTexture.repeat.set(8, 8)

    const ceilingGeometry = new THREE.PlaneGeometry(60, 60)
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      map: ceilingTexture,
      side: THREE.DoubleSide,
    })
    const ceilingPlane = new THREE.Mesh(ceilingGeometry, ceilingMaterial)
    ceilingPlane.rotation.x = Math.PI / 2
    ceilingPlane.position.y = 20
    ceilingPlane.receiveShadow = true
    this.scene.add(ceilingPlane)
  }

  private createWallTitles() {
    if (!this.font) return

    // Create wall titles using canvas textures instead of geometry
    this.createWallTitleSprites()

    // Add section dividers on each wall
    this.createSectionDividers()

    // Add section titles for each wall section
    this.createSectionTitles()
  }

  private createWallTitleSprites() {
    const wallTitles = [
      { text: "NORTH WALL - AI FUNDAMENTALS", position: new THREE.Vector3(0, 18, -29.5), rotation: 0 },
      { text: "SOUTH WALL - AI APPLICATIONS", position: new THREE.Vector3(0, 18, 29.5), rotation: Math.PI },
      { text: "EAST WALL - AI TECHNOLOGIES", position: new THREE.Vector3(29.5, 18, 0), rotation: -Math.PI / 2 },
      { text: "WEST WALL - AI SOCIETY", position: new THREE.Vector3(-29.5, 18, 0), rotation: Math.PI / 2 },
    ]

    wallTitles.forEach((title) => {
      // Create canvas for text
      const canvas = document.createElement("canvas")
      canvas.width = 1024
      canvas.height = 128
      const context = canvas.getContext("2d")
      if (!context) return

      // Draw text on canvas
      context.fillStyle = "white"
      context.font = "bold 80px Arial"
      context.textAlign = "center"
      context.textBaseline = "middle"
      context.fillText(title.text, canvas.width / 2, canvas.height / 2)

      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas)
      const material = new THREE.SpriteMaterial({ map: texture })
      const sprite = new THREE.Sprite(material)

      // Position and scale sprite
      sprite.position.copy(title.position)
      sprite.scale.set(20, 2.5, 1)

      // Rotate sprite to face correct direction
      sprite.userData.rotation = title.rotation

      this.scene.add(sprite)
    })
  }

  private createSectionDividers() {
    // Empty implementation - no dividers will be created
  }

  private createSectionTitles() {
    const sectionTitles = {
      north: ["ETHICS", "MACHINE LEARNING", "NEURAL NETWORKS", "HEALTHCARE", "FUTURE"],
      south: ["ART", "VEHICLES", "EDUCATION", "QUANTUM", "CLIMATE"],
      east: ["VISION", "LANGUAGE", "LEARNING", "FINANCE", "ROBOTICS"],
      west: ["GAMING", "EMOTION", "SECURITY", "EXPLAINABLE AI", "GOVERNANCE"],
    }

    // Create section titles using sprites
    const createSectionTitleSprites = (
      titles: string[],
      wallPosition: THREE.Vector3,
      rotation: number,
      isHorizontal: boolean,
    ) => {
      titles.forEach((title, index) => {
        // Create canvas for text
        const canvas = document.createElement("canvas")
        canvas.width = 512
        canvas.height = 64
        const context = canvas.getContext("2d")
        if (!context) return

        // Draw text on canvas
        context.fillStyle = "white"
        context.font = "bold 40px Arial"
        context.textAlign = "center"
        context.textBaseline = "middle"
        context.fillText(title, canvas.width / 2, canvas.height / 2)

        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas)
        const material = new THREE.SpriteMaterial({ map: texture })
        const sprite = new THREE.Sprite(material)

        // Position sprite
        const position = wallPosition.clone()
        if (isHorizontal) {
          position.x += (index - 2) * 12 // Distribute horizontally
        } else {
          position.z += (index - 2) * 12 // Distribute vertically
        }
        position.y = 16 // Lower than main title

        sprite.position.copy(position)
        sprite.scale.set(8, 1, 1)
        sprite.userData.rotation = rotation

        this.scene.add(sprite)
      })
    }

    // Add section titles for each wall
    createSectionTitleSprites(sectionTitles.north, new THREE.Vector3(0, 16, -29.5), 0, true)
    createSectionTitleSprites(sectionTitles.south, new THREE.Vector3(0, 16, 29.5), Math.PI, true)
    createSectionTitleSprites(sectionTitles.east, new THREE.Vector3(29.5, 16, 0), -Math.PI / 2, false)
    createSectionTitleSprites(sectionTitles.west, new THREE.Vector3(-29.5, 16, 0), Math.PI / 2, false)
  }

  private createGalleryItems() {
    if (!this.font) return

    this.items.forEach((item) => {
      // Frame with improved design - larger for better visibility
      const frameGeometry = new THREE.BoxGeometry(6.5, 4.5, 0.3)
      const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.3,
        metalness: 0.6,
      })
      const frame = new THREE.Mesh(frameGeometry, frameMaterial)
      frame.position.set(item.position.x, item.position.y, item.position.z)
      frame.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z)
      frame.castShadow = true
      frame.receiveShadow = true
      this.scene.add(frame)

      // Add decorative corners to the frame
      this.addFrameCorners(frame, item)

      // Create title plaque directly on the wall
      this.createWallMountedTitle(item)

      // If item has an imageUrl, load and display the 3D box image
      if (item.imageUrl) {
        const imageTexture = this.textureLoader.load(item.imageUrl)
        imageTexture.colorSpace = THREE.SRGBColorSpace
        
        const imageMaterial = new THREE.MeshBasicMaterial({
          map: imageTexture,
          side: THREE.DoubleSide,
        })
        const imageMesh = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 4.0), imageMaterial)

        // Position the image slightly in front of the frame
        const offset = 0.16
        const offsetVector = new THREE.Vector3(0, 0, offset).applyEuler(
          new THREE.Euler(item.rotation.x, item.rotation.y, item.rotation.z),
        )
        imageMesh.position.set(
          item.position.x + offsetVector.x,
          item.position.y + offsetVector.y,
          item.position.z + offsetVector.z,
        )
        imageMesh.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z)
        this.scene.add(imageMesh)
      } else {
        // Fallback: Create preview content with description if no image
        const previewCanvas = document.createElement("canvas")
        previewCanvas.width = 512
        previewCanvas.height = 300
        const previewContext = previewCanvas.getContext("2d")
        if (previewContext) {
          // Background
          previewContext.fillStyle = "#333333"
          previewContext.fillRect(0, 0, 512, 300)

          // Title
          previewContext.fillStyle = "#ffffff"
          previewContext.font = "bold 28px Arial"
          previewContext.textAlign = "center"
          previewContext.fillText(item.title, 256, 40)

          // Divider
          previewContext.fillStyle = "#4a90e2"
          previewContext.fillRect(128, 60, 256, 2)

          // Description
          previewContext.font = "20px Arial"
          previewContext.fillStyle = "#cccccc"

          // Word wrap for description
          const words = item.description.split(" ")
          let line = ""
          let y = 100
          const maxWidth = 450
          const lineHeight = 24

          for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + " "
            const metrics = previewContext.measureText(testLine)
            const testWidth = metrics.width

            if (testWidth > maxWidth && i > 0) {
              previewContext.fillText(line, 256, y)
              line = words[i] + " "
              y += lineHeight
            } else {
              line = testLine
            }
          }
          previewContext.fillText(line, 256, y)

          // "Click to explore" text
          previewContext.font = "italic 22px Arial"
          previewContext.fillStyle = "#4a90e2"
          previewContext.fillText("Click to explore", 256, 260)

          const previewTexture = new THREE.CanvasTexture(previewCanvas)
          const previewMaterial = new THREE.MeshBasicMaterial({
            map: previewTexture,
            side: THREE.DoubleSide,
          })
          const previewMesh = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 4.0), previewMaterial)

          // Position the preview slightly in front of the frame
          const offset = 0.16
          const offsetVector = new THREE.Vector3(0, 0, offset).applyEuler(
            new THREE.Euler(item.rotation.x, item.rotation.y, item.rotation.z),
          )
          previewMesh.position.set(
            item.position.x + offsetVector.x,
            item.position.y + offsetVector.y,
            item.position.z + offsetVector.z,
          )
          previewMesh.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z)
          this.scene.add(previewMesh)
        }
      }

      // Clickable area (slightly larger than the frame for easier interaction)
      const clickableGeometry = new THREE.BoxGeometry(5.5, 3.5, 0.8)
      const clickableMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
      const clickableMesh = new THREE.Mesh(clickableGeometry, clickableMaterial)
      clickableMesh.position.set(item.position.x, item.position.y, item.position.z)
      clickableMesh.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z)
      clickableMesh.userData = { type: "exhibit", item }
      this.scene.add(clickableMesh)
    })
  }

  // Add decorative corners to the frame
  private addFrameCorners(frame: THREE.Mesh, item: GalleryItem) {
    const cornerSize = 0.4
    const cornerThickness = 0.05
    const cornerGeometry = new THREE.BoxGeometry(cornerSize, cornerSize, cornerThickness)
    const cornerMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.3,
      metalness: 0.7,
    })

    // Calculate corner positions
    const width = 5.2
    const height = 3.2
    const cornerPositions = [
      { x: -width / 2 + cornerSize / 2, y: height / 2 - cornerSize / 2, z: 0.1 }, // Top Left
      { x: width / 2 - cornerSize / 2, y: height / 2 - cornerSize / 2, z: 0.1 }, // Top Right
      { x: -width / 2 + cornerSize / 2, y: -height / 2 + cornerSize / 2, z: 0.1 }, // Bottom Left
      { x: width / 2 - cornerSize / 2, y: -height / 2 + cornerSize / 2, z: 0.1 }, // Bottom Right
    ]

    cornerPositions.forEach((pos) => {
      const corner = new THREE.Mesh(cornerGeometry, cornerMaterial)
      corner.position.set(pos.x, pos.y, pos.z)
      frame.add(corner)
    })
  }

  // Create a title plaque mounted directly on the wall
  private createWallMountedTitle(item: GalleryItem) {
    // Create a plaque for the title
    const plaqueWidth = 5.0
    const plaqueHeight = 0.8
    const plaqueDepth = 0.05

    // Create plaque geometry
    const plaqueGeometry = new THREE.BoxGeometry(plaqueWidth, plaqueHeight, plaqueDepth)

    // Create plaque material with wood texture
    const plaqueMaterial = new THREE.MeshStandardMaterial({
      color: 0x5c3a21, // Dark wood color
      roughness: 0.7,
      metalness: 0.2,
    })

    // Create plaque mesh
    const plaque = new THREE.Mesh(plaqueGeometry, plaqueMaterial)

    // Position plaque above the frame
    const plaquePosition = new THREE.Vector3(item.position.x, item.position.y + 2.0, item.position.z)

    // Adjust position based on wall orientation to place it directly on the wall
    if (item.rotation.y === 0) {
      plaquePosition.z = -29.75 // North wall
    } else if (Math.abs(item.rotation.y) === Math.PI) {
      plaquePosition.z = 29.75 // South wall
    } else if (item.rotation.y === Math.PI / 2) {
      plaquePosition.x = -29.75 // West wall
    } else if (item.rotation.y === -Math.PI / 2) {
      plaquePosition.x = 29.75 // East wall
    }

    plaque.position.copy(plaquePosition)
    plaque.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z)
    this.scene.add(plaque)

    // Create title text on canvas
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 64
    const context = canvas.getContext("2d")

    if (context) {
      // Fill with dark wood color
      context.fillStyle = "#5c3a21"
      context.fillRect(0, 0, 512, 64)

      // Add border
      context.strokeStyle = "#8b4513"
      context.lineWidth = 4
      context.strokeRect(4, 4, 504, 56)

      // Add title text
      context.fillStyle = "#f5f5dc" // Beige color for text
      context.font = "bold 32px serif"
      context.textAlign = "center"
      context.textBaseline = "middle"
      context.fillText(item.title, 256, 32)

      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas)
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
      })

      // Create a plane for the text
      const textPlane = new THREE.PlaneGeometry(plaqueWidth - 0.1, plaqueHeight - 0.1)
      const textMesh = new THREE.Mesh(textPlane, material)

      // Position text slightly in front of plaque
      const textOffset = 0.03
      const textOffsetVector = new THREE.Vector3(0, 0, textOffset).applyEuler(
        new THREE.Euler(item.rotation.x, item.rotation.y, item.rotation.z),
      )

      textMesh.position.set(
        plaque.position.x + textOffsetVector.x,
        plaque.position.y + textOffsetVector.y,
        plaque.position.z + textOffsetVector.z,
      )

      textMesh.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z)
      this.scene.add(textMesh)
    }
  }
}
