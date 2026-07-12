import * as THREE from "three"

// Animation types
export enum AnimationType {
  IDLE = "idle",
  WALKING = "walking",
}

// Create a walking animation programmatically
export const createWalkingAnimation = (root: THREE.Object3D): THREE.AnimationClip => {
  // Find the bones or parts we want to animate
  const parts: THREE.Object3D[] = []

  // Collect all meshes that could be animated
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      parts.push(object)
    }
  })

  // If no parts found, animate the whole model with a simple up/down motion
  if (parts.length === 0) {
    parts.push(root)
  }

  // Create keyframes for a simple walking animation
  const times = [0, 0.25, 0.5, 0.75, 1]
  const tracks: THREE.KeyframeTrack[] = []

  // Create a simple up and down motion for walking
  const positionKF = new THREE.KeyframeTrack(".position[y]", times, [0, 0.1, 0, 0.1, 0])
  tracks.push(positionKF)

  // Add some forward leaning when walking
  const rotationKF = new THREE.KeyframeTrack(".rotation[x]", times, [0, 0.05, 0, 0.05, 0])
  tracks.push(rotationKF)

  // Create the animation clip
  return new THREE.AnimationClip("walking", 1, tracks)
}

// Create an idle animation programmatically
export const createIdleAnimation = (root: THREE.Object3D): THREE.AnimationClip => {
  // Create keyframes for a simple idle animation (subtle breathing motion)
  const times = [0, 0.5, 1]
  const tracks: THREE.KeyframeTrack[] = []

  // Subtle up and down motion for breathing
  const positionKF = new THREE.KeyframeTrack(".position[y]", times, [0, 0.05, 0])
  tracks.push(positionKF)

  // Subtle rotation for swaying
  const rotationKF = new THREE.KeyframeTrack(".rotation[y]", times, [0, 0.02, 0])
  tracks.push(rotationKF)

  // Create the animation clip
  return new THREE.AnimationClip("idle", 2, tracks)
}

// Apply programmatic animations to a model
export const applyProgrammaticAnimations = (
  model: THREE.Object3D,
): {
  mixer: THREE.AnimationMixer
  actions: Map<AnimationType, THREE.AnimationAction>
} => {
  const mixer = new THREE.AnimationMixer(model)
  const actions = new Map<AnimationType, THREE.AnimationAction>()

  // Create and add walking animation
  const walkingClip = createWalkingAnimation(model)
  const walkingAction = mixer.clipAction(walkingClip)
  walkingAction.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY)
  actions.set(AnimationType.WALKING, walkingAction)

  // Create and add idle animation
  const idleClip = createIdleAnimation(model)
  const idleAction = mixer.clipAction(idleClip)
  idleAction.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY)
  actions.set(AnimationType.IDLE, idleAction)

  return { mixer, actions }
}
