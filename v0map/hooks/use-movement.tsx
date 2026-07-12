"use client"

import type React from "react"
import { useCallback, useRef, useEffect } from "react"
import * as THREE from "three"
import { ROOFTOP_FLOOR } from "../components/office-building"
import { CITY_BOUNDS } from "../components/city-district"

interface Keys {
  ArrowUp: boolean
  ArrowDown: boolean
  ArrowLeft: boolean
  ArrowRight: boolean
  KeyW: boolean
  KeyA: boolean
  KeyS: boolean
  KeyD: boolean
  KeyQ: boolean // Rotate left
  KeyE: boolean // Rotate right
  Space: boolean // Added for flying up
  ShiftLeft: boolean // Added for flying down
}

interface Joystick {
  x: number
  y: number
}

export function useMovement(
  cameraRef: React.RefObject<THREE.PerspectiveCamera | null>,
  keysRef: React.RefObject<Keys>,
  moveJoystickRef: React.RefObject<Joystick>,
  rotateJoystickRef: React.RefObject<Joystick>,
  mouseRef: React.RefObject<{ x: number; y: number }>,
  sceneRef: React.RefObject<THREE.Scene | null>,
  flyingModeRef: React.RefObject<boolean>,
) {
  // Movement parameters
  const moveSpeed = 0.15
  const flyingSpeed = 0.35 // Increased flying speed for better control
  const rotationSpeed = 0.002
  const joystickRotationSpeed = 0.03
  const playerHeight = 1.7
  const movementDamping = 0.85 // Increased damping for smoother movement
  const playerRadius = 0.5 // Collision radius for the player
  const roomSize = 60 // Size of the gallery room
  const wallThickness = 0.5

  // Movement state
  const yawObject = useRef(new THREE.Object3D())
  const pitchObject = useRef(new THREE.Object3D())
  const currentVelocity = useRef(new THREE.Vector3(0, 0, 0))
  const raycaster = useRef(new THREE.Raycaster())
  const collisionObjects = useRef<THREE.Object3D[]>([])

  // Initialize movement objects
  useEffect(() => {
    if (cameraRef.current) {
      pitchObject.current.add(cameraRef.current)
      yawObject.current.add(pitchObject.current)
      yawObject.current.position.y = playerHeight
    }

    // Collect collision objects from the scene
    if (sceneRef.current) {
      sceneRef.current.traverse((object) => {
        // Only add walls and other solid objects to collision detection
        if (
          object instanceof THREE.Mesh &&
          (object.name.includes("Wall") ||
            object.userData.type === "wall" ||
            object.userData.type === "npc" ||
            object.userData.type === "exhibit")
        ) {
          collisionObjects.current.push(object)
        }
      })
    }
  }, [cameraRef, sceneRef])

  // v28.6: rebuild the collision list AFTER the scene has actually been built.
  // The mount-time traversal above runs before the scene is populated, so it
  // never found anything. We only collect meshes explicitly flagged
  // `userData.solid` (outer building shell + city buildings/props) so all
  // prior movement behavior stays identical while the new exterior is solid.
  const refreshCollisionObjects = useCallback(() => {
    const scene = sceneRef.current
    if (!scene) return
    const solids: THREE.Object3D[] = []
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.userData?.solid === true) {
        solids.push(object)
      }
    })
    collisionObjects.current = solids
  }, [sceneRef])

  // Check for collisions in a given direction
  const checkCollision = useCallback(
    (position: THREE.Vector3, direction: THREE.Vector3): boolean => {
      // Skip collision detection when in flying mode
      if (flyingModeRef.current) return false

      raycaster.current.set(position, direction.normalize())
      const intersects = raycaster.current.intersectObjects(collisionObjects.current, true)
      return intersects.length > 0 && intersects[0].distance < playerRadius
    },
    [playerRadius, flyingModeRef],
  )

  // Keep player within bounds.
  // v28.6: at ground level (and while flying) the boundary is now the full
  // CITY_BOUNDS so you can walk out the front entrance and explore the new
  // city district. On upper floors the original tight room clamp is kept so
  // you can't walk off a floor plate into the sky.
  const enforceRoomBounds = useCallback(
    (position: THREE.Vector3): THREE.Vector3 => {
      const halfRoomSize = roomSize / 2 - playerRadius - wallThickness
      const onUpperFloor = !flyingModeRef.current && position.y > 12
      const boundary = onUpperFloor ? halfRoomSize : CITY_BOUNDS

      position.x = Math.max(-boundary, Math.min(boundary, position.x))

      // Only limit Y in flying mode to prevent going too high or below ground
      if (flyingModeRef.current) {
        const minHeight = 0.5 // Minimum height above ground
        const maxHeight = ROOFTOP_FLOOR * 20 + 22 // Allows rooftop navigation above the top floor
        position.y = Math.max(minHeight, Math.min(maxHeight, position.y))
      } else {
        const floorBase = Math.round((position.y - playerHeight) / 20) * 20
        position.y = Math.max(playerHeight, Math.min(20 * ROOFTOP_FLOOR + playerHeight, floorBase + playerHeight))
      }

      position.z = Math.max(-boundary, Math.min(boundary, position.z))

      return position
    },
    [roomSize, playerRadius, wallThickness, flyingModeRef],
  )

  const move = useCallback(() => {
    if (!cameraRef.current || !keysRef.current) return

    // Movement direction
    const direction = new THREE.Vector3()
    const sideVector = new THREE.Vector3()

    // Forward/backward movement
    direction.set(0, 0, -1).applyQuaternion(yawObject.current.quaternion)

    // In flying mode, preserve Y direction for upward/downward flying
    if (!flyingModeRef.current) {
      direction.y = 0
    }

    direction.normalize()

    // Sideways movement
    sideVector.setFromMatrixColumn(yawObject.current.matrix, 0)

    // Same for side vector - in flying mode, allow Y component
    if (!flyingModeRef.current) {
      sideVector.y = 0
    }

    sideVector.normalize()

    // Apply movement based on keys
    const moveVector = new THREE.Vector3(0, 0, 0)

    if (keysRef.current.ArrowUp || keysRef.current.KeyW) moveVector.add(direction)
    if (keysRef.current.ArrowDown || keysRef.current.KeyS) moveVector.sub(direction)
    if (keysRef.current.ArrowLeft || keysRef.current.KeyA) moveVector.sub(sideVector)
    if (keysRef.current.ArrowRight || keysRef.current.KeyD) moveVector.add(sideVector)

    // Flying movement with Space and Shift - increased vertical speed
    if (flyingModeRef.current) {
      if (keysRef.current.Space) moveVector.y += 1.5 // Faster upward movement
      if (keysRef.current.ShiftLeft) moveVector.y -= 1.5 // Faster downward movement
    }

    // Normalize movement vector if moving diagonally
    if (moveVector.length() > 0) {
      moveVector.normalize().multiplyScalar(flyingModeRef.current ? flyingSpeed : moveSpeed)
    }

    // Movement joystick
    if (moveJoystickRef.current && (moveJoystickRef.current.x !== 0 || moveJoystickRef.current.y !== 0)) {
      const joystickDirection = new THREE.Vector3(moveJoystickRef.current.x, 0, -moveJoystickRef.current.y)
      joystickDirection.applyQuaternion(yawObject.current.quaternion)

      // Same for joystick - in flying mode, preserve Y direction
      if (!flyingModeRef.current) {
        joystickDirection.y = 0
      }

      joystickDirection.normalize().multiplyScalar(flyingModeRef.current ? flyingSpeed : moveSpeed)
      moveVector.add(joystickDirection)
    }

    // Apply damping to current velocity for smoother movement
    currentVelocity.current.x = currentVelocity.current.x * movementDamping + moveVector.x * (1 - movementDamping)
    currentVelocity.current.z = currentVelocity.current.z * movementDamping + moveVector.z * (1 - movementDamping)

    // Add Y velocity for flying mode
    if (flyingModeRef.current) {
      currentVelocity.current.y = currentVelocity.current.y * movementDamping + moveVector.y * (1 - movementDamping)
    } else {
      currentVelocity.current.y = 0 // Reset Y velocity when not in flying mode
    }

    // Apply movement with collision detection
    if (currentVelocity.current.length() > 0.001) {
      // Calculate new position
      const newPosition = yawObject.current.position.clone()

      // Try X movement
      if (Math.abs(currentVelocity.current.x) > 0.001) {
        const xDirection = new THREE.Vector3(Math.sign(currentVelocity.current.x), 0, 0)
        if (!checkCollision(newPosition, xDirection)) {
          newPosition.x += currentVelocity.current.x
        } else {
          currentVelocity.current.x = 0 // Stop X movement on collision
        }
      }

      // Try Z movement
      if (Math.abs(currentVelocity.current.z) > 0.001) {
        const zDirection = new THREE.Vector3(0, 0, Math.sign(currentVelocity.current.z))
        if (!checkCollision(newPosition, zDirection)) {
          newPosition.z += currentVelocity.current.z
        } else {
          currentVelocity.current.z = 0 // Stop Z movement on collision
        }
      }

      // Apply Y movement directly when flying (no collision check needed for up/down)
      if (flyingModeRef.current && Math.abs(currentVelocity.current.y) > 0.001) {
        newPosition.y += currentVelocity.current.y
      }

      // Enforce room boundaries
      enforceRoomBounds(newPosition)

      // Apply the new position
      yawObject.current.position.copy(newPosition)
    }

    // Horizontal rotation with 'Q' and 'E' keys (A/D now strafe like a standard FPS)
    if (keysRef.current.KeyQ) yawObject.current.rotation.y += rotationSpeed * 10
    if (keysRef.current.KeyE) yawObject.current.rotation.y -= rotationSpeed * 10

    // Mouse rotation - only affect yaw (horizontal) with x movement
    // and pitch (vertical) with y movement
    if (mouseRef.current) {
      // Horizontal rotation (around y-axis) - full 360 degrees
      yawObject.current.rotation.y -= mouseRef.current.x * rotationSpeed * 2 // Increased sensitivity

      // Vertical rotation (around x-axis)
      pitchObject.current.rotation.x -= mouseRef.current.y * rotationSpeed * 2 // Increased sensitivity

      // Limit vertical rotation to prevent flipping
      pitchObject.current.rotation.x = Math.max(
        -Math.PI / 2 + 0.1,
        Math.min(Math.PI / 2 - 0.1, pitchObject.current.rotation.x),
      )

      // Reset mouse movement
      mouseRef.current.x = 0
      mouseRef.current.y = 0
    }

    // Rotation joystick (dedicated for horizontal rotation)
    if (rotateJoystickRef.current && rotateJoystickRef.current.x !== 0) {
      yawObject.current.rotation.y -= rotateJoystickRef.current.x * joystickRotationSpeed
    }

    // Update camera position and rotation
    if (cameraRef.current) {
      cameraRef.current.position.copy(yawObject.current.position)
      cameraRef.current.rotation.copy(yawObject.current.rotation)
      cameraRef.current.rotateX(pitchObject.current.rotation.x)
    }
  }, [
    cameraRef,
    keysRef,
    moveJoystickRef,
    rotateJoystickRef,
    mouseRef,
    playerHeight,
    checkCollision,
    enforceRoomBounds,
    flyingModeRef,
  ])

  // Save and restore position from localStorage
  const savePosition = useCallback(() => {
    if (yawObject.current) {
      const { x, y, z } = yawObject.current.position
      const rotY = yawObject.current.rotation.y
      const pitchX = pitchObject.current.rotation.x
      // Never persist a corrupted transform
      if (![x, y, z, rotY, pitchX].every((value) => Number.isFinite(value))) return
      const state = {
        position: { x, y, z },
        rotation: { y: rotY },
        pitch: { x: pitchX },
      }
      localStorage.setItem("galleryPlayerState", JSON.stringify(state))
    }
  }, [])

  const loadPosition = useCallback(() => {
    const savedState = localStorage.getItem("galleryPlayerState")
    if (savedState) {
      try {
        const state = JSON.parse(savedState)
        // Validate every number — a corrupted save (NaN/Infinity from an older
        // buggy session) poisons the whole transform chain and makes the player
        // unable to move or see anything from the moment the app starts.
        const px = Number(state?.position?.x)
        const py = Number(state?.position?.y)
        const pz = Number(state?.position?.z)
        const ry = Number(state?.rotation?.y)
        const pitchX = Number(state?.pitch?.x)
        if (![px, py, pz, ry, pitchX].every((value) => Number.isFinite(value))) {
          throw new Error("Saved player state is corrupted — discarding")
        }
        yawObject.current.position.set(px, Math.max(playerHeight, py), pz)
        yawObject.current.rotation.y = ry
        pitchObject.current.rotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitchX))
      } catch (e) {
        console.error("Failed to restore player position:", e)
        localStorage.removeItem("galleryPlayerState")
        yawObject.current.position.set(0, playerHeight, 25)
        yawObject.current.rotation.y = 0
        pitchObject.current.rotation.x = 0
      }
    }
  }, [playerHeight])

  // Return the movement functions and objects
  return {
    move,
    yawObject,
    savePosition,
    loadPosition,
    refreshCollisionObjects,
  }
}
