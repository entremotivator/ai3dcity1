import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js"
import * as THREE from "three"
import { createWalkingAnimation, createIdleAnimation } from "./programmatic-animations"

// Animation cache to store loaded animations
const animationCache = new Map<string, THREE.AnimationClip>()

// Animation types
export enum AnimationType {
  IDLE = "idle",
  WALKING = "walking",
  DANCING = "dancing",
}

// Default animation URLs
const ANIMATION_URLS = {
  [AnimationType.WALKING]: "/animations/walking.fbx",
  [AnimationType.IDLE]: "/animations/idle.fbx",
  [AnimationType.DANCING]: "/animations/dancing.fbx",
}

// Function to create a simple procedural animation as fallback
export const createProceduralAnimation = (type: AnimationType, model?: THREE.Object3D): THREE.AnimationClip => {
  if (model) {
    // If we have a model, use the more advanced programmatic animations
    if (type === AnimationType.WALKING) {
      return createWalkingAnimation(model)
    }
    return createIdleAnimation(model)
  }

  // Simple fallback if no model is provided
  const times = [0, 0.5, 1]
  const values = []

  if (type === AnimationType.WALKING) {
    // Simple walking animation - leg movement
    values.push(
      0,
      0,
      0, // Initial position
      0,
      0.1,
      0, // Up
      0,
      0,
      0, // Back to center
    )
  } else {
    // Simple idle animation - slight up and down movement
    values.push(
      0,
      0,
      0, // Initial position
      0,
      0.05,
      0, // Slight up
      0,
      0,
      0, // Back to center
    )
  }

  // Create keyframe tracks
  const positionKF = new THREE.KeyframeTrack(".position", times, values)

  // Create animation clip
  const clip = new THREE.AnimationClip(type, 1, [positionKF])
  return clip
}

// Function to load an animation from an FBX file
export const loadAnimation = async (
  type: AnimationType,
  url: string = ANIMATION_URLS[type],
): Promise<THREE.AnimationClip | null> => {
  // Check if animation is already cached
  if (animationCache.has(url)) {
    return animationCache.get(url) || null
  }

  try {
    // Create a procedural animation as fallback first
    const proceduralClip = createProceduralAnimation(type)

    // Try to load the FBX file, but be prepared for failure
    try {
      const loader = new FBXLoader()
      const fbx = await new Promise<THREE.Group>((resolve, reject) => {
        loader.load(
          url,
          (object) => resolve(object),
          undefined,
          (error) => {
            console.warn(`Error loading FBX animation ${type}, using procedural animation:`, error)
            reject(error)
          },
        )
      })

      // Get animation from the loaded FBX
      const animationClip = fbx.animations[0]

      if (animationClip) {
        // Rename the animation to match the type
        animationClip.name = type

        // Cache the animation
        animationCache.set(url, animationClip)
        console.log(`Successfully loaded animation: ${type}`)

        return animationClip
      } else {
        console.warn(`No animation found in FBX file: ${url}, using procedural animation`)
        // Use the procedural animation we created earlier
        animationCache.set(url, proceduralClip)
        return proceduralClip
      }
    } catch (error) {
      // FBX loading failed, use the procedural animation
      console.warn(`Failed to load FBX animation ${type}, using procedural animation:`, error)
      animationCache.set(url, proceduralClip)
      return proceduralClip
    }
  } catch (error) {
    console.error(`Error in animation loading for ${type}:`, error)

    // Create a very simple fallback animation as last resort
    const simpleClip = new THREE.AnimationClip(type, 1, [
      new THREE.KeyframeTrack(".position[y]", [0, 0.5, 1], [0, 0.05, 0]),
    ])

    animationCache.set(url, simpleClip)
    return simpleClip
  }
}

// Function to preload all animations
export const preloadAnimations = async (): Promise<boolean> => {
  try {
    // Create procedural animations for all types as fallbacks
    Object.values(AnimationType).forEach((type) => {
      const proceduralClip = createProceduralAnimation(type as AnimationType)
      const url = ANIMATION_URLS[type as AnimationType]
      animationCache.set(url, proceduralClip)
    })

    console.log("Procedural animations created as fallbacks")

    // Try to load actual FBX animations, but continue if they fail
    try {
      const promises = Object.values(AnimationType).map((type) => loadAnimation(type as AnimationType))
      await Promise.allSettled(promises)
      console.log("Animation loading attempts completed")
    } catch (error) {
      console.warn("Some animations failed to load, using procedural animations as fallback:", error)
    }

    return true
  } catch (error) {
    console.error("Error preloading animations:", error)
    return true // Return true anyway to allow the app to continue
  }
}

// Function to get a cached animation
export const getAnimation = (type: AnimationType, model?: THREE.Object3D): THREE.AnimationClip => {
  const url = ANIMATION_URLS[type]
  const cachedAnimation = animationCache.get(url)

  if (cachedAnimation) {
    return cachedAnimation
  }

  // If not cached, create a procedural animation
  console.log(`Animation ${type} not found in cache, creating procedural animation`)
  const proceduralAnimation = createProceduralAnimation(type, model)
  animationCache.set(url, proceduralAnimation)
  return proceduralAnimation
}

// Function to apply animation to a model
export const applyAnimationToModel = (model: THREE.Object3D, type: AnimationType): THREE.AnimationMixer | null => {
  const animation = getAnimation(type, model)
  if (!animation) return null

  const mixer = new THREE.AnimationMixer(model)
  const action = mixer.clipAction(animation)
  action.play()

  return mixer
}
