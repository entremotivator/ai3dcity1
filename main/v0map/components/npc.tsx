import * as THREE from "three"
import { AnimationType } from "./animation-manager"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"

// Procedural gesture types NPCs can perform (voice/UI triggered or ambient)
export type GestureType = "wave" | "nod" | "point" | "cheer" | "clap" | "think" | "salute"
export const GESTURE_TYPES: GestureType[] = ["wave", "nod", "point", "cheer", "clap", "think", "salute"]

// Add tablePosition property to NPCData interface
export interface NPCData {
  id: number
  name: string
  model: string
  color: string
  streamlitUrl: string // Backward-compatible alias for the live WordPress shortcode render URL
  shortcode?: string
  shortcodeTag?: string
  wordpressUrl?: string
  liveUrl?: string
  position: THREE.Vector3
  targetPosition: THREE.Vector3
  speed: number
  rotationSpeed: number
  interactionRadius: number
  glbUrl?: string
  dialogue?: string[]
  tablePosition?: THREE.Vector3 // Add this line
  team?: string
  role?: string
  skills?: string[]
  features?: string[]
  commands?: string[]
  tools?: string[]
  bio?: string
  priority?: "low" | "normal" | "high" | "critical"
  floor?: number
  status?: string
  // v28.6: outdoor city NPC support — anchors an NPC to an outdoor home spot
  outdoor?: boolean
  homeCenter?: { x: number; z: number }
  wanderRange?: number
}

export class NPC {
  public mesh: THREE.Mesh | THREE.Group
  public id: number
  public name: string
  public streamlitUrl: string
  private targetPosition: THREE.Vector3
  private speed: number
  private rotationSpeed: number
  public interactionRadius: number
  private direction: THREE.Vector3
  private isMoving: boolean
  private wanderTimer: number
  private scene: THREE.Scene
  private isActive = true
  private nameLabel: THREE.Sprite | null = null
  private isInMeeting = false
  private originalPosition: THREE.Vector3
  private originalTargetPosition: THREE.Vector3
  private meetingPosition: THREE.Vector3 | null = null
  private modelType: string
  private glbModel: THREE.Group | null = null
  private loadingAttempted = false
  private camera: THREE.Camera | null = null
  private rootY: number
  private velocity = new THREE.Vector3()
  private desiredVelocity = new THREE.Vector3()
  private steeringForce = new THREE.Vector3()
  private maxWalkSpeed = 1
  private maxSteeringForce = 1
  private slowDownRadius = 4
  private strideClock = Math.random() * Math.PI * 2
  private isDancing = false
  private danceTimer = 0
  private danceSpin = 0
  // Gesture system (wave, nod, point, cheer, clap, think)
  private gestureType: GestureType | null = null
  private gestureTimer = 0
  private gestureClock = 0
  private ambientGestureCooldown = Math.random() * 8 + 4
  // Separation steering from nearby NPCs (set each frame by NPCManager)
  private separationPush = new THREE.Vector3()
  // Frozen: statue mode — no movement, no wander, until unfrozen
  private frozen = false

  setFrozen(frozen: boolean) {
    this.frozen = frozen
    if (frozen) {
      this.velocity.set(0, 0, 0)
      this.isMoving = false
      if (this.animationEnabled) {
        this.playAnimation(AnimationType.IDLE)
      }
    } else {
      this.isMoving = true
      if (this.animationEnabled) {
        this.playAnimation(AnimationType.WALKING)
      }
    }
  }

  isFrozen() {
    return this.frozen
  }
  private pathWaypoints: THREE.Vector3[] = []
  private routeMode: "wander" | "direct" | "patrol" | "summon" = "wander"

  // Animation properties
  private mixer: THREE.AnimationMixer | null = null
  private animations: Map<string, THREE.AnimationAction> = new Map()
  private currentAnimation: string | null = null
  private animationEnabled = true
  private dialogue: string[]

  // Add tablePosition and atTable properties to NPC class
  private tablePosition: THREE.Vector3 | null = null
  private atTable = false

  // v28.6: outdoor wander anchor (defaults keep original indoor behavior)
  private isOutdoor = false
  private homeX = 0
  private homeZ = 0
  private wanderRange = 38

  // Lets the manager skip city citizens for building-wide floor moves
  get isOutdoorCitizen(): boolean {
    return this.isOutdoor
  }

  constructor(scene: THREE.Scene, data: NPCData, camera: THREE.Camera | null = null) {
    this.id = data.id
    this.name = data.name
    this.streamlitUrl = data.streamlitUrl
    this.speed = data.speed
    this.rotationSpeed = data.rotationSpeed
    this.interactionRadius = data.interactionRadius
    this.targetPosition = data.targetPosition.clone()
    this.originalPosition = data.position.clone()
    this.originalTargetPosition = data.targetPosition.clone()
    this.direction = new THREE.Vector3()
    this.isMoving = true
    this.wanderTimer = 0
    this.scene = scene
    this.modelType = data.model
    this.glbModel = null
    this.dialogue = data.dialogue || [] // Initialize dialogue
    this.camera = camera
    this.rootY = data.position.y
    this.targetPosition.y = this.rootY
    this.originalTargetPosition.y = this.rootY
    this.maxWalkSpeed = Math.max(0.55, data.speed * 2.1)
    this.maxSteeringForce = Math.max(0.9, data.rotationSpeed * 0.55)
    this.slowDownRadius = 3.5 + (data.id % 4) * 0.65

    // v28.6: outdoor NPCs wander around a home anchor out in the city instead
    // of the default indoor 38-unit room square centered at the origin.
    this.isOutdoor = data.outdoor === true
    this.homeX = data.homeCenter?.x ?? 0
    this.homeZ = data.homeCenter?.z ?? 0
    this.wanderRange = data.wanderRange ?? (this.isOutdoor ? 44 : 38)

    // Initialize table position if provided
    this.tablePosition = data.tablePosition ? data.tablePosition.clone() : null

    // Create default NPC mesh that will be used as fallback
    const geometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8)
    const material = new THREE.MeshStandardMaterial({
      color: data.color,
      transparent: true,
      opacity: 0.9,
    })
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.copy(data.position)
    this.mesh.position.y = this.rootY
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    this.mesh.userData = { type: "npc", npcId: this.id }
    scene.add(this.mesh)

    // Add name label above NPC
    this.addNameLabel()

    // If GLB URL is provided, try to load it
    if (data.glbUrl) {
      // Make the default mesh semi-transparent while loading
      if (this.mesh instanceof THREE.Mesh) {
        const mat = this.mesh.material as THREE.MeshStandardMaterial
        mat.opacity = 0.5
      }

      // Try to load the GLB model
      this.loadGLBModel(data.glbUrl, data.position, data.color)
    }
  }

  // Getter for NPC color
  private get color(): string {
    if (this.mesh instanceof THREE.Mesh && this.mesh.material instanceof THREE.MeshStandardMaterial) {
      return "#" + this.mesh.material.color.getHexString()
    }
    return "#ffffff" // Default to white if color can't be determined
  }

  // Add name label above NPC
  private addNameLabel() {
    // Create a canvas for the name label
    const canvas = document.createElement("canvas")
    canvas.width = 256
    canvas.height = 64
    const context = canvas.getContext("2d")

    if (context) {
      // Draw name on canvas
      context.fillStyle = "rgba(0, 0, 0, 0.5)"
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.font = "bold 32px Arial"
      context.textAlign = "center"
      context.textBaseline = "middle"
      context.fillStyle = this.color
      context.fillText(this.name, canvas.width / 2, canvas.height / 2)

      // Create sprite from canvas
      const texture = new THREE.CanvasTexture(canvas)
      const material = new THREE.SpriteMaterial({ map: texture })
      this.nameLabel = new THREE.Sprite(material)

      // Position label above NPC
      this.nameLabel.position.set(0, 2.2, 0)
      this.nameLabel.scale.set(2, 0.5, 1)

      // Add label to mesh
      this.mesh.add(this.nameLabel)
    }
  }

  // Also add a method to update the name label position in case the NPC model changes
  // Add this method after the addNameLabel method

  // Update name label position when model changes
  private updateNameLabelPosition() {
    if (this.nameLabel) {
      // Remove from current parent
      if (this.nameLabel.parent) {
        this.nameLabel.parent.remove(this.nameLabel)
      }

      // Add to current mesh
      this.mesh.add(this.nameLabel)

      // Position above the current mesh
      this.nameLabel.position.set(0, 2.2, 0)
    }
  }

  // Add these methods after the updateNameLabelPosition method and before the loadGLBModel method

  // Play animation by type
  private playAnimation(type: AnimationType) {
    // Skip if animations are disabled
    if (!this.animationEnabled) return

    try {
      // Skip if already playing this animation
      if (this.currentAnimation === type) return

      // Stop current animation if any
      if (this.currentAnimation && this.animations.has(this.currentAnimation)) {
        const currentAction = this.animations.get(this.currentAnimation)
        if (currentAction) {
          currentAction.fadeOut(0.5)
        }
      }

      // Start new animation if available
      if (this.animations.has(type)) {
        const newAction = this.animations.get(type)
        if (newAction) {
          newAction.reset()
          newAction.fadeIn(0.5)
          newAction.play()
          this.currentAnimation = type
        }
      } else {
        // If animation not available, create a simple animation on the fly
        this.currentAnimation = type
      }
    } catch (error) {
      console.warn(`Error playing animation ${type} for NPC ${this.name}:`, error)
      // Disable animations if there's an error to prevent further issues
      this.animationEnabled = false
    }
  }

  // Stop all animations
  private stopAnimations() {
    if (!this.mixer) return

    this.animations.forEach((action) => {
      action.stop()
    })
    this.currentAnimation = null
  }

  private loadGLBModel(url: string, position: THREE.Vector3, color: string) {
    if (this.loadingAttempted) return
    this.loadingAttempted = true

    try {
      const loader = new GLTFLoader()
      loader.load(
        url,
        (gltf) => {
          // Successfully loaded the model
          this.glbModel = gltf.scene

          // Scale and position the model
          this.glbModel.scale.set(1.5, 1.5, 1.5)
          this.glbModel.position.copy(position)
          this.rootY = Math.max(0, position.y - 1) // Keep GLB feet on the current floor
          this.glbModel.position.y = this.rootY
          this.targetPosition.y = this.rootY
          this.originalPosition.y = this.rootY
          this.originalTargetPosition.y = this.rootY

          // Add to scene
          this.scene.add(this.glbModel)

          // Remove the placeholder mesh
          this.scene.remove(this.mesh)

          // Update the mesh reference to the new model
          this.mesh = this.glbModel

          // Update the name label position
          this.updateNameLabelPosition()

          // Add userData for raycasting
          this.glbModel.traverse((object) => {
            object.userData = { type: "npc", npcId: this.id }
          })
        },
        undefined,
        (error) => {
          console.error(`Error loading GLB model for NPC ${this.name}:`, error)
        },
      )
    } catch (error) {
      console.error(`Failed to load GLB model for NPC ${this.name}:`, error)
    }
  }

  // Add method to make NPC go to their table
  goToTable() {
    if (this.tablePosition) {
      this.isInMeeting = false
      this.meetingPosition = null
      this.atTable = true
      this.isMoving = true

      // Set target position to table position
      this.targetPosition = this.tablePosition.clone()
      this.targetPosition.y = this.rootY
    }
  }

  sendToPosition(position: THREE.Vector3) {
    this.isInMeeting = false
    this.meetingPosition = null
    this.atTable = false
    this.isMoving = true
    this.isPaused = false
    this.rootY = Math.max(0, position.y)
    this.routeMode = "direct"
    const target = position.clone()
    target.y = Math.max(0, position.y)
    this.rootY = target.y
    this.pathWaypoints = this.buildPathTo(target)
    this.targetPosition = (this.pathWaypoints.shift() || target).clone()
    this.targetPosition.y = this.rootY
    this.velocity.set(0, 0, 0)

    if (this.animationEnabled) {
      this.playAnimation(AnimationType.WALKING)
    }
  }

  // Modify the update method to handle table positioning
  update(deltaTime: number, playerPosition: THREE.Vector3, neighbors: THREE.Vector3[] = []) {
    if (!this.isActive) return

    // Clamp huge frame deltas (tab was backgrounded / hitch) so NPCs never teleport or spaz out
    deltaTime = Math.min(Math.max(deltaTime, 0), 0.1)

    // Statue mode: animate the idle mixer only, no movement at all
    if (this.frozen) {
      if (this.mixer && this.animationEnabled) {
        try { this.mixer.update(deltaTime) } catch {}
      }
      return
    }

    // Build separation push away from nearby NPCs on this floor (prevents overlap/clipping glitches)
    this.separationPush.set(0, 0, 0)
    for (const other of neighbors) {
      if (Math.abs(other.y - this.mesh.position.y) > 3) continue
      const dx = this.mesh.position.x - other.x
      const dz = this.mesh.position.z - other.z
      const distSq = dx * dx + dz * dz
      if (distSq > 0.0001 && distSq < 2.25) {
        const dist = Math.sqrt(distSq)
        const strength = (1.5 - dist) / 1.5
        this.separationPush.x += (dx / dist) * strength * 1.6
        this.separationPush.z += (dz / dist) * strength * 1.6
      }
    }

    try {
      // Update animation mixer
      if (this.mixer && this.animationEnabled) {
        try {
          this.mixer.update(deltaTime)
        } catch (error) {
          console.error(`Error updating animation mixer for NPC ${this.name}:`, error)
          this.animationEnabled = false
        }
      }

      // Gesture playback takes over the body briefly (wave, nod, cheer, ...)
      if (this.gestureType) {
        this.gestureTimer -= deltaTime
        this.applyGesturePose(deltaTime, playerPosition)
        if (this.gestureTimer <= 0) {
          this.endGesture()
        }
        return
      }

      if (this.isDancing) {
        this.danceTimer -= deltaTime
        this.applyDancePose(deltaTime)
        if (this.danceTimer <= 0) {
          this.isDancing = false
          this.mesh.rotation.z = 0
          this.mesh.rotation.x = 0
          this.mesh.position.y = this.rootY
          if (this.animationEnabled) {
            this.playAnimation(AnimationType.IDLE)
          }
        }
        return
      }

      if (this.isInMeeting && this.meetingPosition) {
        // Move towards meeting position
        this.moveToPosition(this.meetingPosition, deltaTime)

        // If close to meeting position, face center
        if (this.mesh.position.distanceTo(this.meetingPosition) < 0.5) {
          const centerDirection = new THREE.Vector3(0, 0, 0).sub(this.mesh.position).normalize()
          centerDirection.y = 0
          const targetRotation = Math.atan2(centerDirection.x, centerDirection.z)
          this.mesh.rotation.y = this.smoothRotateTowards(
            this.mesh.rotation.y,
            targetRotation,
            this.rotationSpeed * deltaTime,
          )

          // Stop walking animation when reached destination
          if (this.animationEnabled) {
            this.playAnimation(AnimationType.IDLE)
          }
        } else {
          // Play walking animation while moving
          if (this.animationEnabled) {
            this.playAnimation(AnimationType.WALKING)
          }
        }
        return
      }

      if (this.atTable && this.tablePosition) {
        const tableTarget = this.tablePosition.clone()
        tableTarget.y = this.rootY

        // Move towards table position
        this.moveToPosition(tableTarget, deltaTime)

        // If close to table position, face forward
        if (this.mesh.position.distanceTo(tableTarget) < 0.5) {
          // Face a consistent direction (e.g., towards center)
          const centerDirection = new THREE.Vector3(0, 0, 0).sub(this.mesh.position).normalize()
          centerDirection.y = 0
          const targetRotation = Math.atan2(centerDirection.x, centerDirection.z)
          this.mesh.rotation.y = this.smoothRotateTowards(
            this.mesh.rotation.y,
            targetRotation,
            this.rotationSpeed * deltaTime,
          )

          // Stop walking animation when reached destination
          if (this.animationEnabled) {
            this.playAnimation(AnimationType.IDLE)
          }
          this.velocity.multiplyScalar(0.82)
        } else {
          // Play walking animation while moving
          if (this.animationEnabled) {
            this.playAnimation(AnimationType.WALKING)
          }
        }
        return
      }

      // Regular behavior when not in meeting
      // Check if player is within interaction radius
      const distanceToPlayer = this.mesh.position.distanceTo(playerPosition)

      if (distanceToPlayer < this.interactionRadius) {
        // Stop moving when player is near
        this.isMoving = false

        // Rotate to face the player
        const directionToPlayer = new THREE.Vector3().subVectors(playerPosition, this.mesh.position).normalize()
        directionToPlayer.y = 0 // Keep rotation on the horizontal plane

        const targetRotation = Math.atan2(directionToPlayer.x, directionToPlayer.z)
        this.mesh.rotation.y = this.smoothRotateTowards(
          this.mesh.rotation.y,
          targetRotation,
          this.rotationSpeed * deltaTime,
        )

        // Play idle animation when not moving
        if (this.animationEnabled) {
          this.playAnimation(AnimationType.IDLE)
        }
      } else {
        this.isMoving = true
        this.wander(deltaTime)

        // Play walking animation when moving
        if (this.isMoving && this.animationEnabled) {
          this.playAnimation(AnimationType.WALKING)
        } else if (this.animationEnabled) {
          this.playAnimation(AnimationType.IDLE)
        }
      }
    } catch (error) {
      console.error(`Error in update method for NPC ${this.name}:`, error)
      // Reset to idle state if anything goes wrong
      if (this.animationEnabled) {
        this.playAnimation(AnimationType.IDLE)
      }
    }
  }

  dance(duration = 8) {
    this.isDancing = true
    this.danceTimer = Math.max(2, duration)
    this.isMoving = false
    this.isPaused = false
    this.velocity.set(0, 0, 0)
    this.danceSpin = Math.random() > 0.5 ? 1 : -1

    if (this.animationEnabled) {
      this.playAnimation(AnimationType.DANCING as AnimationType)
    }
  }

  stopDance() {
    this.isDancing = false
    this.danceTimer = 0
    this.mesh.rotation.z = 0
    this.mesh.rotation.x = 0
    this.mesh.position.y = this.rootY
    if (this.animationEnabled) {
      this.playAnimation(AnimationType.IDLE)
    }
  }

  private applyDancePose(deltaTime: number) {
    this.strideClock += deltaTime * 7.5
    const bounce = Math.abs(Math.sin(this.strideClock)) * 0.35
    const sway = Math.sin(this.strideClock * 1.5) * 0.22
    const lean = Math.cos(this.strideClock * 1.2) * 0.12

    this.mesh.position.y = this.rootY + bounce
    this.mesh.rotation.y += deltaTime * this.danceSpin * 1.2
    this.mesh.rotation.z = sway
    this.mesh.rotation.x = lean
  }

  // ── Gesture system ──────────────────────────────────────────────────────
  gesture(type: GestureType, duration = 3) {
    this.gestureType = type
    this.gestureTimer = Math.max(1, duration)
    this.gestureClock = 0
    this.isMoving = false
    this.isPaused = false
    this.velocity.set(0, 0, 0)
    if (this.animationEnabled) {
      this.playAnimation(AnimationType.IDLE)
    }
  }

  stopGesture() {
    this.endGesture()
  }

  isGesturing() {
    return this.gestureType !== null
  }

  private endGesture() {
    this.gestureType = null
    this.gestureTimer = 0
    this.mesh.rotation.z = 0
    this.mesh.rotation.x = 0
    this.mesh.position.y = this.rootY
    if (this.animationEnabled) {
      this.playAnimation(AnimationType.IDLE)
    }
  }

  private applyGesturePose(deltaTime: number, playerPosition: THREE.Vector3) {
    this.gestureClock += deltaTime

    // Face the player while gesturing so gestures read as social
    const toPlayer = new THREE.Vector3().subVectors(playerPosition, this.mesh.position)
    toPlayer.y = 0
    if (toPlayer.lengthSq() > 0.01) {
      const facing = Math.atan2(toPlayer.x, toPlayer.z)
      this.mesh.rotation.y = this.smoothRotateTowards(this.mesh.rotation.y, facing, this.rotationSpeed * 1.4 * deltaTime)
    }

    const t = this.gestureClock
    switch (this.gestureType) {
      case "wave": {
        // Quick side-to-side lean with a slight bounce, like waving an arm
        this.mesh.rotation.z = Math.sin(t * 9) * 0.16
        this.mesh.position.y = this.rootY + Math.abs(Math.sin(t * 4.5)) * 0.05
        this.mesh.rotation.x = 0
        break
      }
      case "nod": {
        // Forward pitch pulses
        this.mesh.rotation.x = Math.max(0, Math.sin(t * 5)) * 0.18
        this.mesh.rotation.z = 0
        this.mesh.position.y = this.rootY
        break
      }
      case "point": {
        // Lean forward and hold, tiny emphasis pulses
        this.mesh.rotation.x = 0.14 + Math.sin(t * 3) * 0.03
        this.mesh.rotation.z = 0.06
        this.mesh.position.y = this.rootY
        break
      }
      case "cheer": {
        // Big hops with arm-throw lean-backs
        this.mesh.position.y = this.rootY + Math.abs(Math.sin(t * 6)) * 0.4
        this.mesh.rotation.x = -0.12 + Math.sin(t * 6) * 0.05
        this.mesh.rotation.z = Math.sin(t * 3) * 0.08
        break
      }
      case "clap": {
        // Rhythmic small pulses toward the player
        this.mesh.rotation.x = Math.abs(Math.sin(t * 8)) * 0.07
        this.mesh.position.y = this.rootY + Math.abs(Math.sin(t * 8)) * 0.03
        this.mesh.rotation.z = 0
        break
      }
      case "think": {
        // Slow head-tilt sway, weight shifting
        this.mesh.rotation.z = Math.sin(t * 1.2) * 0.1
        this.mesh.rotation.x = 0.05
        this.mesh.position.y = this.rootY
        break
      }
      case "salute": {
        // Snap upright, tiny hold tremble
        this.mesh.rotation.x = -0.05
        this.mesh.rotation.z = Math.sin(t * 20) * 0.008
        this.mesh.position.y = this.rootY + 0.02
        break
      }
      default:
        break
    }
  }

  summonToPlayer(playerObject: THREE.Vector3 | THREE.Object3D) {
    const objectPosition = playerObject instanceof THREE.Object3D ? playerObject.position : playerObject
    const yaw = playerObject instanceof THREE.Object3D ? playerObject.rotation.y : 0
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)),
    )
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw)
    const targetPos = new THREE.Vector3(objectPosition.x, objectPosition.y, objectPosition.z)
      .add(forward.multiplyScalar(3.2))
      .add(right.multiplyScalar((this.id % 3 - 1) * 0.85))
    targetPos.y = Math.max(0, objectPosition.y - 1.7)

    this.isInMeeting = true
    this.meetingPosition = targetPos.clone()
    this.rootY = targetPos.y
    this.routeMode = "summon"
    this.isMoving = true
    this.isPaused = false
    this.pathWaypoints = this.buildPathTo(targetPos)
    this.targetPosition = (this.pathWaypoints.shift() || targetPos).clone()
    this.velocity.multiplyScalar(0.25)

    if (this.animationEnabled) {
      this.playAnimation(AnimationType.WALKING)
    }

    return targetPos
  }

  // Add method to break from table and return to random roaming
  breakFromTable() {
    this.atTable = false
    this.isMoving = true
    this.generateNewTargetPosition()
    this.velocity.set(0, 0, 0)

    // Start walking animation
    if (this.animationEnabled) {
      this.playAnimation(AnimationType.WALKING)
    }
  }

  private moveToPosition(position: THREE.Vector3, deltaTime: number) {
    try {
      const target = position.clone()
      target.y = this.rootY
      const toTarget = this.direction.subVectors(target, this.mesh.position)
      toTarget.y = 0
      const distance = toTarget.length()

      if (distance < 0.12) {
        if (this.pathWaypoints.length > 0) {
          this.targetPosition = (this.pathWaypoints.shift() as THREE.Vector3).clone()
          this.targetPosition.y = this.rootY
          return
        }
        this.velocity.multiplyScalar(0.8)
        this.mesh.position.y = this.rootY
        this.applyWalkingPose(deltaTime, 0)
        return
      }

      const desiredSpeed = Math.min(this.maxWalkSpeed * 1.15, distance / Math.max(deltaTime, 0.016))
      this.applySteering(toTarget.normalize(), desiredSpeed, deltaTime)
    } catch (error) {
      console.error("Error in moveToPosition:", error)
    }
  }

  // Yaku-style random motion for realistic NPC walking behavior.
  // This uses persistent steering instead of frame-by-frame random turns.
  private wanderAngle = Math.random() * Math.PI * 2 // Current wander angle
  private wanderRadius = 3 // Circle radius for wander behavior
  private wanderDistance = 5 // Distance to wander circle
  private wanderJitter = 0.5 // Random jitter amount
  private pauseTimer = 0 // Timer for pausing behavior
  private isPaused = false // Whether NPC is currently paused
  private lookAroundTimer = 0 // Timer for looking around behavior
  private isLookingAround = false // Whether NPC is looking around
  private lookTarget = 0 // Target rotation when looking around

  // Modify the wander method to add more realistic movement patterns with Yuka-style steering
  private wander(deltaTime: number) {
    try {
      this.mesh.position.y = this.rootY

      // Handle pause behavior - NPCs occasionally stop and look around
      if (this.isPaused) {
        this.pauseTimer -= deltaTime
        this.velocity.multiplyScalar(Math.max(0, 1 - deltaTime * 4))
        this.applyWalkingPose(deltaTime, 0)
        
        // Look around while paused
        if (this.isLookingAround) {
          this.lookAroundTimer -= deltaTime
          this.mesh.rotation.y = this.smoothRotateTowards(
            this.mesh.rotation.y,
            this.lookTarget,
            this.rotationSpeed * 0.5 * deltaTime,
          )
          
          if (this.lookAroundTimer <= 0) {
            // Pick new look direction or stop looking
            if (Math.random() < 0.6) {
              this.lookTarget = this.mesh.rotation.y + (Math.random() - 0.5) * Math.PI
              this.lookAroundTimer = Math.random() * 2 + 0.5
            } else {
              this.isLookingAround = false
            }
          }
        }
        
        // Occasionally play a small ambient gesture while paused (think, nod, wave)
        this.ambientGestureCooldown -= deltaTime
        if (this.ambientGestureCooldown <= 0 && Math.random() < 0.35) {
          const ambient: GestureType[] = ["think", "nod", "wave"]
          this.gesture(ambient[Math.floor(Math.random() * ambient.length)], 1.6 + Math.random() * 1.4)
          this.ambientGestureCooldown = Math.random() * 14 + 8
          return
        }

        if (this.pauseTimer <= 0) {
          this.isPaused = false
          this.isMoving = true
          if (this.animationEnabled) {
            this.playAnimation(AnimationType.WALKING)
          }
        }
        return
      }

      // Random chance to pause and look around (more realistic behavior)
      if (Math.random() < 0.003 && this.isMoving && !this.isPaused) {
        this.isPaused = true
        this.isMoving = false
        this.pauseTimer = Math.random() * 4 + 1 // 1-5 seconds pause
        this.isLookingAround = Math.random() < 0.7 // 70% chance to look around
        this.lookAroundTimer = Math.random() * 1.5 + 0.5
        this.lookTarget = this.mesh.rotation.y + (Math.random() - 0.5) * Math.PI * 0.8
        
        if (this.animationEnabled) {
          this.playAnimation(AnimationType.IDLE)
        }
        return
      }

      this.wanderTimer -= deltaTime

      // Generate new target position when timer expires or NPC is close to target
      if (this.wanderTimer <= 0 || this.mesh.position.distanceTo(this.targetPosition) < 1.6) {
        this.generateNewTargetPosition()
        // More varied timer for more natural movement patterns
        this.wanderTimer = Math.random() * 10 + 5 // 5-15 seconds
      }

      this.wanderAngle += (Math.random() - 0.5) * this.wanderJitter * deltaTime * 5
      
      const toTarget = new THREE.Vector3().subVectors(this.targetPosition, this.mesh.position)
      toTarget.y = 0
      const distanceToTarget = toTarget.length()
      
      if (distanceToTarget < 0.01) return

      const forward = this.velocity.lengthSq() > 0.0001
        ? this.velocity.clone().normalize()
        : toTarget.clone().normalize()
      const wanderCenter = forward.multiplyScalar(this.wanderDistance)
      const wanderOffset = new THREE.Vector3(
        Math.cos(this.wanderAngle) * this.wanderRadius,
        0,
        Math.sin(this.wanderAngle) * this.wanderRadius,
      )
      const seekDirection = toTarget.normalize().multiplyScalar(1.45)
      const wanderDirection = wanderCenter.add(wanderOffset).normalize().multiplyScalar(0.55)
      const edgeAvoidance = this.getBoundaryAvoidance()
      const desiredDirection = seekDirection.add(wanderDirection).add(edgeAvoidance).add(this.separationPush).normalize()
      
      const arrivalScale = THREE.MathUtils.clamp(distanceToTarget / this.slowDownRadius, 0.45, 1)
      const strideVariation = 1 + Math.sin(this.strideClock + this.id) * 0.06
      this.applySteering(desiredDirection, this.maxWalkSpeed * arrivalScale * strideVariation, deltaTime)
    } catch (error) {
      console.error("Error in wander method:", error)
      // Reset the wander timer to try again later
      this.wanderTimer = 5
    }
  }

  private applySteering(direction: THREE.Vector3, desiredSpeed: number, deltaTime: number) {
    if (!Number.isFinite(direction.x) || !Number.isFinite(direction.z) || direction.lengthSq() === 0) return

    // Realism: if the NPC needs to turn sharply, rotate in place first instead of
    // gliding sideways (the old "moonwalk" glitch). Only translate once mostly facing the way it moves.
    const desiredHeading = Math.atan2(direction.x, direction.z)
    let headingDelta = (desiredHeading - this.mesh.rotation.y) % (Math.PI * 2)
    if (headingDelta > Math.PI) headingDelta -= Math.PI * 2
    if (headingDelta < -Math.PI) headingDelta += Math.PI * 2
    if (Math.abs(headingDelta) > 1.1 && this.velocity.length() < this.maxWalkSpeed * 0.4) {
      this.mesh.rotation.y = this.smoothRotateTowards(
        this.mesh.rotation.y,
        desiredHeading,
        this.rotationSpeed * 1.6 * deltaTime,
      )
      this.velocity.multiplyScalar(Math.max(0, 1 - deltaTime * 6))
      this.applyWalkingPose(deltaTime, 0.15)
      return
    }

    this.desiredVelocity.copy(direction).normalize().multiplyScalar(desiredSpeed)
    this.steeringForce.subVectors(this.desiredVelocity, this.velocity)

    const maxForce = this.maxSteeringForce * deltaTime
    if (this.steeringForce.length() > maxForce) {
      this.steeringForce.setLength(maxForce)
    }

    this.velocity.add(this.steeringForce)

    if (this.velocity.length() > this.maxWalkSpeed) {
      this.velocity.setLength(this.maxWalkSpeed)
    }

    const currentSpeed = this.velocity.length()
    if (currentSpeed < 0.01) {
      this.applyWalkingPose(deltaTime, 0)
      return
    }

    const moveStep = Math.min(currentSpeed * deltaTime, this.maxWalkSpeed * deltaTime)
    const moveDirection = this.velocity.clone().normalize()
    const newPosition = new THREE.Vector3(
      this.mesh.position.x + moveDirection.x * moveStep,
      this.rootY,
      this.mesh.position.z + moveDirection.z * moveStep,
    )

    if (this.isInsideWalkableBounds(newPosition)) {
      this.mesh.position.copy(newPosition)
    } else {
      this.velocity.multiplyScalar(0.25)
      this.wanderAngle += Math.PI * 0.65
      this.generateNewTargetPosition()
    }

    const targetRotation = Math.atan2(moveDirection.x, moveDirection.z)
    const speedRatio = THREE.MathUtils.clamp(currentSpeed / this.maxWalkSpeed, 0, 1)
    this.mesh.rotation.y = this.smoothRotateTowards(
      this.mesh.rotation.y,
      targetRotation,
      this.rotationSpeed * (0.55 + speedRatio * 0.65) * deltaTime,
    )
    this.applyWalkingPose(deltaTime, speedRatio)
  }

  private buildPathTo(target: THREE.Vector3): THREE.Vector3[] {
    const start = this.mesh.position.clone()
    const floorY = Math.max(0, target.y)
    const mid1 = new THREE.Vector3(start.x, floorY, (start.z + target.z) / 2)
    const mid2 = new THREE.Vector3((start.x + target.x) / 2, floorY, target.z)
    const waypoints = [mid1, mid2, target.clone()]
      .map((point) => {
        point.y = floorY
        const half = this.wanderRange / 2 + 3
        point.x = THREE.MathUtils.clamp(point.x, this.homeX - half, this.homeX + half)
        point.z = THREE.MathUtils.clamp(point.z, this.homeZ - half, this.homeZ + half)
        return point
      })
      .filter((point, index, list) => index === 0 || point.distanceTo(list[index - 1]) > 1.2)
    return waypoints
  }

  private getBoundaryAvoidance(): THREE.Vector3 {
    // v28.6: bounds are relative to the NPC's home anchor so outdoor NPCs
    // steer back toward their plaza/park/market spot (indoor: unchanged 23).
    const bounds = this.wanderRange / 2 + 4
    const margin = 5
    const avoidance = new THREE.Vector3()
    const relX = this.mesh.position.x - this.homeX
    const relZ = this.mesh.position.z - this.homeZ
    const xDistance = bounds - Math.abs(relX)
    const zDistance = bounds - Math.abs(relZ)

    if (xDistance < margin) {
      avoidance.x = -Math.sign(relX) * (1 - xDistance / margin) * 2
    }

    if (zDistance < margin) {
      avoidance.z = -Math.sign(relZ) * (1 - zDistance / margin) * 2
    }

    return avoidance
  }

  private isInsideWalkableBounds(position: THREE.Vector3): boolean {
    const bounds = this.wanderRange / 2 + 4
    return Math.abs(position.x - this.homeX) < bounds && Math.abs(position.z - this.homeZ) < bounds
  }

  private applyWalkingPose(deltaTime: number, speedRatio: number) {
    this.strideClock += deltaTime * (4.4 + this.speed * 2.2) * Math.max(speedRatio, 0.2)

    const walkingAmount = THREE.MathUtils.clamp(speedRatio, 0, 1)
    const sway = Math.sin(this.strideClock) * 0.045 * walkingAmount
    const lean = Math.sin(this.strideClock * 0.5 + this.id) * 0.03 * walkingAmount
    const bob = Math.abs(Math.sin(this.strideClock * 1.05)) * 0.035 * walkingAmount

    this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, sway, Math.min(1, deltaTime * 8))
    this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, lean, Math.min(1, deltaTime * 8))
    this.mesh.position.y = this.rootY + bob
  }

  // Update target position generation to avoid walls
  private generateNewTargetPosition() {
    try {
      // v28.6: wander inside a square centered on the NPC's home anchor.
      // Indoor NPCs keep the original behavior (home 0,0 / range 38); outdoor
      // NPCs roam plazas, the park, market street, and downtown crossings.
      const roomSize = this.wanderRange // Slightly smaller than actual area to keep NPCs away from edges
      const currentY = this.rootY // Keep the same floor level
      let localX = 0
      let localZ = 0

      // 70% chance to use a more natural distribution
      if (Math.random() < 0.7) {
        // Create paths that follow along edges or through central areas
        if (Math.random() < 0.5) {
          // Path near edges (but not too close)
          const wallDistance = 3 + Math.random() * 2 // 3-5 units from edge
          const side = Math.floor(Math.random() * 4) // Choose an edge

          switch (side) {
            case 0: // North edge
              localX = Math.random() * roomSize - roomSize / 2
              localZ = roomSize / 2 - wallDistance
              break
            case 1: // East edge
              localX = roomSize / 2 - wallDistance
              localZ = Math.random() * roomSize - roomSize / 2
              break
            case 2: // South edge
              localX = Math.random() * roomSize - roomSize / 2
              localZ = -roomSize / 2 + wallDistance
              break
            case 3: // West edge
              localX = -roomSize / 2 + wallDistance
              localZ = Math.random() * roomSize - roomSize / 2
              break
          }
        } else {
          // Path through central areas
          const centerRadius = roomSize * 0.3 // Central 30% of area
          const angle = Math.random() * Math.PI * 2
          const radius = Math.random() * centerRadius
          localX = Math.cos(angle) * radius
          localZ = Math.sin(angle) * radius
        }
      } else {
        // Standard random position (30% chance)
        localX = Math.random() * roomSize - roomSize / 2
        localZ = Math.random() * roomSize - roomSize / 2
      }

      this.targetPosition.set(this.homeX + localX, currentY, this.homeZ + localZ)

      // Check if position is too close to current position (avoid short meaningless movements)
      if (this.mesh.position.distanceTo(this.targetPosition) < 5) {
        // If too close, try again with a different approach
        this.targetPosition.set(
          this.homeX + Math.random() * roomSize - roomSize / 2,
          currentY,
          this.homeZ + Math.random() * roomSize - roomSize / 2,
        )
      }

      this.targetPosition.y = currentY
    } catch (error) {
      console.error("Error in generateNewTargetPosition:", error)

      // Fallback to a simple random position if anything goes wrong - keep current Y
      const roomSize = Math.min(30, this.wanderRange) // Even smaller for safety
      const x = this.homeX + Math.random() * roomSize - roomSize / 2
      const z = this.homeZ + Math.random() * roomSize - roomSize / 2
      const fallbackY = this.rootY
      this.targetPosition.set(x, fallbackY, z)
    }
  }

  private smoothRotateTowards(current: number, target: number, maxDelta: number): number {
    // Normalize angles
    let delta = (target - current) % (Math.PI * 2)
    if (delta > Math.PI) delta -= Math.PI * 2
    if (delta < -Math.PI) delta += Math.PI * 2

    // Apply smooth rotation
    if (Math.abs(delta) > maxDelta) {
      return current + Math.sign(delta) * maxDelta
    } else {
      return target
    }
  }

  moveToPlayer(playerPosition: THREE.Vector3) {
    // Calculate position in front of the player
    // Get direction player is facing - use the yaw rotation directly instead of trying to access userData
    const playerRotation = playerPosition instanceof THREE.Object3D ? playerPosition.rotation.y : 0
    const playerDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, playerRotation, 0)),
    )

    // Position 3 units in front of player
    const targetPos = new THREE.Vector3(playerPosition.x, playerPosition.y, playerPosition.z).add(
      playerDirection.multiplyScalar(3),
    )

    // Keep the avatar on the player's current floor.
    targetPos.y = Math.max(0, playerPosition.y - 1.7)

    // Set as meeting position to use existing movement logic
    this.isInMeeting = true
    this.meetingPosition = targetPos
    this.rootY = targetPos.y

    // Start walking animation
    if (this.animationEnabled) {
      this.playAnimation(AnimationType.WALKING)
    }

    return targetPos
  }

  joinMeeting(position: THREE.Vector3) {
    this.isInMeeting = true
    this.meetingPosition = position
    this.rootY = Math.max(0, position.y)

    // Start walking animation
    if (this.animationEnabled) {
      this.playAnimation(AnimationType.WALKING)
    }
  }

  leaveMeeting() {
    this.isInMeeting = false
    this.meetingPosition = null
    this.targetPosition = this.originalTargetPosition.clone()
    // Generate a new random position to avoid all NPCs going to the same spot
    this.generateNewTargetPosition()

    // Start walking animation
    if (this.animationEnabled) {
      this.playAnimation(AnimationType.WALKING)
    }
  }

  setActive(active: boolean) {
    this.isActive = active
    this.mesh.visible = active

    // Stop animations if NPC is not active
    if (!active && this.mixer && this.animationEnabled) {
      this.stopAnimations()
    }
  }

  isVisible() {
    return this.isActive
  }

  dispose() {
    this.scene.remove(this.mesh)

    // Stop and dispose animations
    if (this.mixer && this.animationEnabled) {
      this.stopAnimations()
      this.mixer = null
    }

    // Dispose of geometries and materials
    if (this.glbModel) {
      this.glbModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose()
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((material) => material.dispose())
            } else {
              child.material.dispose()
            }
          }
        }
      })
    } else if (this.mesh instanceof THREE.Mesh) {
      if (this.mesh.geometry) this.mesh.geometry.dispose()
      if (this.mesh.material) {
        if (Array.isArray(this.mesh.material)) {
          this.mesh.material.forEach((material) => material.dispose())
        } else {
          this.mesh.material.dispose()
        }
      }
    }
  }

  // Method to get the next dialogue line
  getNextDialogue(): string | undefined {
    if (this.dialogue.length > 0) {
      return this.dialogue[Math.floor(Math.random() * this.dialogue.length)]
    }
    return undefined
  }

  // Set camera for raycasting against sprites
  setCamera(camera: THREE.Camera) {
    this.camera = camera
  }

  // ── Live directory editing support ─────────────────────────────────────
  // Apply lightweight edits (name, color, speed, dialogue, floor) without
  // recreating the NPC — no model reload, no scene rebuild, no glitches.
  updateFromData(data: Partial<NPCData>) {
    let labelNeedsRefresh = false

    if (typeof data.name === "string" && data.name !== this.name) {
      this.name = data.name
      labelNeedsRefresh = true
    }

    if (typeof data.color === "string" && this.mesh instanceof THREE.Mesh && this.mesh.material instanceof THREE.MeshStandardMaterial) {
      if ("#" + this.mesh.material.color.getHexString() !== data.color.toLowerCase()) {
        this.mesh.material.color.set(data.color)
        labelNeedsRefresh = true
      }
    }

    if (typeof data.speed === "number" && Number.isFinite(data.speed)) {
      this.speed = data.speed
      this.maxWalkSpeed = Math.max(0.55, data.speed * 2.1)
    }

    if (typeof data.rotationSpeed === "number" && Number.isFinite(data.rotationSpeed)) {
      this.rotationSpeed = data.rotationSpeed
      this.maxSteeringForce = Math.max(0.9, data.rotationSpeed * 0.55)
    }

    if (typeof data.interactionRadius === "number" && Number.isFinite(data.interactionRadius)) {
      this.interactionRadius = data.interactionRadius
    }

    if (Array.isArray(data.dialogue)) {
      this.dialogue = data.dialogue
    }

    if (typeof data.streamlitUrl === "string") {
      this.streamlitUrl = data.streamlitUrl
    }

    // Floor change: walk/teleport the NPC to the new floor level
    if (typeof data.floor === "number") {
      const targetY = Math.max(0, data.floor * 20)
      if (Math.abs(this.rootY - targetY) > 1) {
        const angle = Math.random() * Math.PI * 2
        const radius = 8 + Math.random() * 8
        this.sendToPosition(new THREE.Vector3(this.homeX + Math.cos(angle) * radius, targetY, this.homeZ + Math.sin(angle) * radius))
      }
    }

    // v28.6: keep outdoor anchor fields in sync through the live diff
    if (typeof data.outdoor === "boolean") {
      this.isOutdoor = data.outdoor
    }
    if (data.homeCenter && typeof data.homeCenter.x === "number" && typeof data.homeCenter.z === "number") {
      this.homeX = data.homeCenter.x
      this.homeZ = data.homeCenter.z
    }
    if (typeof data.wanderRange === "number" && Number.isFinite(data.wanderRange)) {
      this.wanderRange = data.wanderRange
    }

    if (labelNeedsRefresh) {
      this.refreshNameLabel()
    }
  }

  private refreshNameLabel() {
    if (this.nameLabel) {
      if (this.nameLabel.parent) {
        this.nameLabel.parent.remove(this.nameLabel)
      }
      if (this.nameLabel.material.map) {
        this.nameLabel.material.map.dispose()
      }
      this.nameLabel.material.dispose()
      this.nameLabel = null
    }
    this.addNameLabel()
  }
}

export class NPCManager {
  private npcs: NPC[] = []
  private scene: THREE.Scene
  private isMeetingActive = false
  private camera: THREE.Camera | null = null

  constructor(scene: THREE.Scene, camera: THREE.Camera | null = null) {
    this.scene = scene
    this.camera = camera
  }

  createNPCs(npcData: NPCData[]) {
    npcData.forEach((data) => {
      const npc = new NPC(this.scene, data, this.camera)
      this.npcs.push(npc)
    })
  }

  update(deltaTime: number, playerPosition: THREE.Vector3) {
    // Gather visible NPC positions once so each NPC can steer away from its neighbors
    const visiblePositions = this.npcs.filter((npc) => npc.isVisible()).map((npc) => npc.mesh.position)
    this.npcs.forEach((npc) => {
      const neighbors = npc.isVisible()
        ? visiblePositions.filter((pos) => pos !== npc.mesh.position && pos.distanceToSquared(npc.mesh.position) < 16)
        : []
      npc.update(deltaTime, playerPosition, neighbors)
    })

    // Advance Yuka-style patrol routes: on waypoint arrival, walk to the next node
    if (this.patrolStates.size > 0) {
      this.patrolStates.forEach((state, id) => {
        const npc = this.getNPCById(id)
        if (!npc || !npc.isVisible() || npc.isFrozen()) return
        const current = state.points[state.index]
        const dx = npc.mesh.position.x - current.x
        const dz = npc.mesh.position.z - current.z
        if (dx * dx + dz * dz < 3.2) {
          state.index = (state.index + 1) % state.points.length
          npc.sendToPosition(state.points[state.index])
        }
      })
    }

    // ── Social encounters: ambient office life ──────────────────────────────
    // Every so often, two nearby wandering NPCs on the same floor stop, face
    // each other, and trade gestures (wave → nod/think) before parting ways.
    this.socialCooldown -= deltaTime
    if (this.socialCooldown <= 0) {
      this.socialCooldown = 10 + Math.random() * 14
      const candidates = this.npcs.filter(
        (npc) => npc.isVisible() && !npc.isFrozen() && !npc.isGesturing() && !this.patrolStates.has(npc.id),
      )
      outer: for (let i = 0; i < candidates.length; i++) {
        for (let j = i + 1; j < candidates.length; j++) {
          const a = candidates[i]
          const b = candidates[j]
          if (Math.abs(a.mesh.position.y - b.mesh.position.y) > 3) continue
          const distSq = a.mesh.position.distanceToSquared(b.mesh.position)
          if (distSq > 4 && distSq < 100) {
            // Meet in the middle, then exchange gestures facing each other
            const mid = a.mesh.position.clone().add(b.mesh.position).multiplyScalar(0.5)
            const offset = b.mesh.position.clone().sub(a.mesh.position).normalize().multiplyScalar(0.9)
            const meetY = Math.min(a.mesh.position.y, b.mesh.position.y)
            const pointA = mid.clone().sub(offset)
            const pointB = mid.clone().add(offset)
            pointA.y = meetY
            pointB.y = meetY
            a.sendToPosition(pointA)
            b.sendToPosition(pointB)
            const greetings: GestureType[][] = [
              ["wave", "wave"],
              ["wave", "nod"],
              ["nod", "think"],
              ["salute", "salute"],
            ]
            const [gestureA, gestureB] = greetings[Math.floor(Math.random() * greetings.length)]
            setTimeout(() => a.gesture(gestureA, 2.4), 2600)
            setTimeout(() => b.gesture(gestureB, 2.4), 3100)
            break outer
          }
        }
      }
    }
  }

  private socialCooldown = 8

  // Lightweight live snapshot for HUD overlays (minimap floor layers, etc.)
  getSnapshot() {
    return this.npcs.map((npc) => ({
      id: npc.id,
      name: npc.name,
      x: npc.mesh.position.x,
      y: npc.mesh.position.y,
      z: npc.mesh.position.z,
      visible: npc.isVisible(),
      frozen: npc.isFrozen(),
    }))
  }

  // ── Yuka-style patrol routes with glowing path visualization ────────────
  private patrolStates = new Map<number, { points: THREE.Vector3[]; index: number }>()
  private pathLinesGroup: THREE.Group | null = null

  startPatrolRoute(ids: number[] = [], points: THREE.Vector3[], showPath = true, color: number = 0x22d3ee) {
    if (points.length < 2) return 0
    const idSet = ids.length > 0 ? new Set(ids) : null
    const selected = this.npcs.filter((npc) => npc.isVisible() && (!idSet || idSet.has(npc.id)))
    selected.forEach((npc, index) => {
      // Stagger starting waypoints so the crowd spreads along the route
      const startIndex = index % points.length
      this.patrolStates.set(npc.id, { points, index: startIndex })
      npc.setFrozen(false)
      npc.sendToPosition(points[startIndex])
    })
    if (showPath && selected.length > 0) {
      this.drawPath(points, color)
    }
    return selected.length
  }

  stopPatrols(ids: number[] = []) {
    let count = 0
    if (ids.length === 0) {
      count = this.patrolStates.size
      this.patrolStates.clear()
    } else {
      ids.forEach((id) => {
        if (this.patrolStates.delete(id)) count++
      })
    }
    if (this.patrolStates.size === 0) {
      this.clearPaths()
    }
    return count
  }

  drawPath(points: THREE.Vector3[], color: number = 0x22d3ee) {
    if (!this.pathLinesGroup) {
      this.pathLinesGroup = new THREE.Group()
      this.pathLinesGroup.name = "npc-patrol-paths"
      this.scene.add(this.pathLinesGroup)
    }
    const lifted = points.map((point) => new THREE.Vector3(point.x, point.y + 0.15, point.z))
    lifted.push(lifted[0].clone()) // close the loop
    const geometry = new THREE.BufferGeometry().setFromPoints(lifted)
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 }))
    this.pathLinesGroup.add(line)
    // Glowing node markers at each waypoint
    points.forEach((point) => {
      const node = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 6),
        new THREE.MeshStandardMaterial({ color, emissive: new THREE.Color(color), emissiveIntensity: 0.8 }),
      )
      node.position.set(point.x, point.y + 0.18, point.z)
      this.pathLinesGroup!.add(node)
    })
  }

  clearPaths() {
    if (!this.pathLinesGroup) return
    this.pathLinesGroup.children.forEach((child) => {
      if (child instanceof THREE.Line || child instanceof THREE.Mesh) {
        child.geometry.dispose()
        const material = (child as THREE.Mesh).material
        if (Array.isArray(material)) material.forEach((m) => m.dispose())
        else material?.dispose()
      }
    })
    this.pathLinesGroup.clear()
  }

  // ── Freeze / resume ──────────────────────────────────────────────────────
  freezeNPCs(frozen: boolean, ids: number[] = []) {
    const idSet = ids.length > 0 ? new Set(ids) : null
    const selected = this.npcs.filter((npc) => npc.isVisible() && (!idSet || idSet.has(npc.id)))
    selected.forEach((npc) => npc.setFrozen(frozen))
    return selected.length
  }

  // ── Formations: send visible NPCs to a set of points (staggered) ────────
  sendToFormation(points: THREE.Vector3[], ids: number[] = []) {
    if (points.length === 0) return 0
    const idSet = ids.length > 0 ? new Set(ids) : null
    const selected = this.npcs.filter((npc) => npc.isVisible() && (!idSet || idSet.has(npc.id)))
    selected.forEach((npc, index) => {
      this.patrolStates.delete(npc.id)
      npc.setFrozen(false)
      const target = points[index % points.length].clone()
      // Nudge duplicates so two NPCs never stack on the same point
      if (index >= points.length) {
        target.x += (Math.random() - 0.5) * 1.6
        target.z += (Math.random() - 0.5) * 1.6
      }
      setTimeout(() => npc.sendToPosition(target), index * 90)
    })
    return selected.length
  }

  // ── Gestures ────────────────────────────────────────────────────────────
  gestureNPCs(ids: number[] = [], type: GestureType = "wave", duration = 3) {
    const idSet = ids.length > 0 ? new Set(ids) : null
    const selected = this.npcs.filter((npc) => npc.isVisible() && (!idSet || idSet.has(npc.id)))
    selected.forEach((npc, index) => {
      // Slight stagger so a crowd gesture looks organic, not robotic
      setTimeout(() => npc.gesture(type, duration), index * 120)
    })
    return selected.length
  }

  stopGestures(ids: number[] = []) {
    const idSet = ids.length > 0 ? new Set(ids) : null
    const selected = this.npcs.filter((npc) => !idSet || idSet.has(npc.id))
    selected.forEach((npc) => npc.stopGesture())
    return selected.length
  }

  // ── Live directory sync ─────────────────────────────────────────────────
  // Diff incoming data against live NPCs: update in place, add new, remove missing.
  // This replaces the old dispose-everything-and-rebuild pattern that caused
  // model reloads and visible glitches on every edit.
  syncNPCs(npcData: NPCData[]) {
    const incomingIds = new Set(npcData.map((item) => item.id))

    // Remove NPCs no longer in the directory
    for (let i = this.npcs.length - 1; i >= 0; i--) {
      if (!incomingIds.has(this.npcs[i].id)) {
        this.npcs[i].dispose()
        this.npcs.splice(i, 1)
      }
    }

    // Update existing / add new
    npcData.forEach((data) => {
      const existing = this.getNPCById(data.id)
      if (existing) {
        existing.updateFromData(data)
      } else {
        const npc = new NPC(this.scene, data, this.camera)
        this.npcs.push(npc)
      }
    })
  }

  getNPCById(id: number): NPC | undefined {
    return this.npcs.find((npc) => npc.id === id)
  }

  getNPCsInRange(position: THREE.Vector3, range: number): NPC[] {
    return this.npcs.filter((npc) => {
      return npc.mesh.position.distanceTo(position) <= range && npc.isVisible()
    })
  }

  toggleNPC(id: number) {
    const npc = this.getNPCById(id)
    if (npc) {
      npc.setActive(!npc.isVisible())
    }
  }

  setAllNPCs(active: boolean) {
    this.npcs.forEach((npc) => npc.setActive(active))
  }

  setNPCsActive(ids: number[], active: boolean) {
    const idSet = new Set(ids)
    this.npcs.forEach((npc) => {
      if (idSet.has(npc.id)) {
        npc.setActive(active)
      }
    })
  }

  getActiveNPCIds(): Set<number> {
    return new Set(this.npcs.filter((npc) => npc.isVisible()).map((npc) => npc.id))
  }

  callMeeting() {
    if (this.isMeetingActive) return

    this.isMeetingActive = true
    // v28.6: building meetings are for indoor agents — outdoor city citizens
    // keep living their plaza/park/market life.
    const activeNpcs = this.npcs.filter((npc) => npc.isVisible() && !npc.isOutdoorCitizen)

    // Calculate positions in a circle formation
    const radius = 5 // Radius of the circle
    const center = new THREE.Vector3(0, 1, 0) // Center of the room

    activeNpcs.forEach((npc, index) => {
      const angle = (index / activeNpcs.length) * Math.PI * 2
      const x = center.x + Math.sin(angle) * radius
      const z = center.z + Math.cos(angle) * radius
      const position = new THREE.Vector3(x, 1, z)
      npc.joinMeeting(position)
    })
  }

  endMeeting() {
    if (!this.isMeetingActive) return

    this.isMeetingActive = false
    this.npcs.forEach((npc) => {
      npc.leaveMeeting()
    })
  }

  toggleMeeting() {
    if (this.isMeetingActive) {
      this.endMeeting()
    } else {
      this.callMeeting()
    }
    return this.isMeetingActive
  }

  callNPC(id: number, playerPosition: THREE.Vector3 | THREE.Object3D) {
    const npc = this.getNPCById(id)
    if (!npc) return null

    // Move this NPC to the player
    const targetPosition = npc.moveToPlayer(playerPosition)

    return targetPosition
  }

  callNPCs(ids: number[], playerPosition: THREE.Vector3 | THREE.Object3D) {
    return ids
      .map((id) => this.callNPC(id, playerPosition))
      .filter(Boolean) as THREE.Vector3[]
  }

  summonNPC(id: number, playerPosition: THREE.Vector3 | THREE.Object3D) {
    const npc = this.getNPCById(id)
    if (!npc || !npc.isVisible()) return null
    return npc.summonToPlayer(playerPosition)
  }

  danceNPCs(ids: number[] = [], duration = 8) {
    const idSet = ids.length > 0 ? new Set(ids) : null
    const selected = this.npcs.filter((npc) => npc.isVisible() && (!idSet || idSet.has(npc.id)))
    selected.forEach((npc) => npc.dance(duration))
    return selected.length
  }

  stopDancing(ids: number[] = []) {
    const idSet = ids.length > 0 ? new Set(ids) : null
    const selected = this.npcs.filter((npc) => npc.isVisible() && (!idSet || idSet.has(npc.id)))
    selected.forEach((npc) => npc.stopDance())
    return selected.length
  }

  sendNPCToPosition(id: number, position: THREE.Vector3) {
    const npc = this.getNPCById(id)
    if (!npc || !npc.isVisible()) return false

    npc.sendToPosition(position)
    return true
  }

  sendNPCsToFloor(ids: number[], floor: number) {
    const activeIds = ids.length > 0 ? new Set(ids) : null
    const floorBaseY = Math.max(0, floor * 20)
    const ringRadius = floor >= 3 ? 16 : 14
    // v28.6: a building-wide floor move (no explicit ids) leaves outdoor city
    // citizens where they live — otherwise they'd hover in the sky over the
    // plaza. Explicitly targeted ids are still honored.
    const selected = this.npcs.filter(
      (npc) => npc.isVisible() && (activeIds ? activeIds.has(npc.id) : !npc.isOutdoorCitizen),
    )

    selected.forEach((npc, index) => {
      const angle = (index / Math.max(selected.length, 1)) * Math.PI * 2
      const radius = ringRadius + (index % 3) * 2.5
      npc.sendToPosition(new THREE.Vector3(Math.cos(angle) * radius, floorBaseY, Math.sin(angle) * radius))
    })

    return selected.length
  }

  scatterNPCs(ids: number[] = []) {
    const idSet = ids.length > 0 ? new Set(ids) : null
    const selected = this.npcs.filter((npc) => npc.isVisible() && (!idSet || idSet.has(npc.id)))

    selected.forEach((npc) => {
      const floorBaseY = Math.max(0, Math.round(npc.mesh.position.y / 20) * 20)
      npc.sendToPosition(
        new THREE.Vector3(
          Math.random() * 40 - 20,
          floorBaseY,
          Math.random() * 40 - 20,
        ),
      )
    })

    return selected.length
  }

  gatherNPCs(ids: number[] = [], center = new THREE.Vector3(0, 0, 0)) {
    const idSet = ids.length > 0 ? new Set(ids) : null
    // v28.6: gathering "everyone" keeps outdoor citizens out in the city;
    // gather them explicitly by id if you really want them inside.
    const selected = this.npcs.filter(
      (npc) => npc.isVisible() && (idSet ? idSet.has(npc.id) : !npc.isOutdoorCitizen),
    )

    selected.forEach((npc, index) => {
      const angle = (index / Math.max(selected.length, 1)) * Math.PI * 2
      const radius = 4 + Math.floor(index / 8) * 2.5
      npc.sendToPosition(
        new THREE.Vector3(
          center.x + Math.cos(angle) * radius,
          Math.max(0, center.y),
          center.z + Math.sin(angle) * radius,
        ),
      )
    })

    return selected.length
  }

  replaceNPC(id: number, newNPCData: NPCData) {
    // Find the NPC to replace
    const index = this.npcs.findIndex((npc) => npc.id === id)
    if (index === -1) return false

    // Remove the old NPC
    this.npcs[index].dispose()

    // Create a new NPC with the new data but keep the same ID
    const updatedData = {
      ...newNPCData,
      id: id, // Keep the original ID
    }

    const newNPC = new NPC(this.scene, updatedData, this.camera)
    this.npcs[index] = newNPC

    return true
  }

  isMeeting() {
    return this.isMeetingActive
  }

  dispose() {
    this.npcs.forEach((npc) => npc.dispose())
    this.npcs = []
    this.patrolStates.clear()
    this.clearPaths()
    if (this.pathLinesGroup) {
      this.scene.remove(this.pathLinesGroup)
      this.pathLinesGroup = null
    }
  }

  // Method to get the next dialogue line from an NPC
  getNPCNextDialogue(id: number): string | undefined {
    const npc = this.getNPCById(id)
    if (npc) {
      return npc.getNextDialogue()
    }
    return undefined
  }

  // Set camera for all NPCs
  setCamera(camera: THREE.Camera) {
    this.camera = camera
    this.npcs.forEach((npc) => {
      npc.setCamera(camera)
    })
  }

  // Add methods to make all NPCs go to their tables or break from tables

  sendAllToTables() {
    this.npcs.forEach((npc) => {
      if (npc.isVisible()) {
        npc.goToTable()
      }
    })
  }

  breakAllFromTables() {
    this.npcs.forEach((npc) => {
      if (npc.isVisible()) {
        npc.breakFromTable()
      }
    })
  }

  returnToRandomRoaming() {
    this.breakAllFromTables()
  }

  // Add method to check if NPCs are at tables
  areNPCsAtTables(): boolean {
    return this.npcs.some((npc) => npc.isVisible() && (npc as any).atTable)
  }
}
