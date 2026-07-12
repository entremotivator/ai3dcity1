import * as THREE from "three"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js"
import { SSAOPass } from "three/examples/jsm/postprocessing/SSAOPass.js"
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js"
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js"

export class PostProcessingManager {
  private composer: EffectComposer
  private bloomPass: UnrealBloomPass
  private ssaoPass: SSAOPass
  private fxaaPass: ShaderPass
  private enabled = true
  private quality: "low" | "medium" | "high" = "medium"

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    // Initialize the composer
    this.composer = new EffectComposer(renderer)

    // Add render pass
    const renderPass = new RenderPass(scene, camera)
    this.composer.addPass(renderPass)

    // Add bloom pass for glow effects
    const bloomParams = {
      exposure: 1,
      bloomStrength: 0.5,
      bloomThreshold: 0.85,
      bloomRadius: 0.33,
    }
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      bloomParams.bloomStrength,
      bloomParams.bloomRadius,
      bloomParams.bloomThreshold,
    )
    this.composer.addPass(this.bloomPass)

    // Add SSAO pass for ambient occlusion
    this.ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight)
    this.ssaoPass.kernelRadius = 16
    this.ssaoPass.minDistance = 0.005
    this.ssaoPass.maxDistance = 0.1
    this.composer.addPass(this.ssaoPass)

    // Add FXAA pass for anti-aliasing
    this.fxaaPass = new ShaderPass(FXAAShader)
    const pixelRatio = renderer.getPixelRatio()
    this.fxaaPass.material.uniforms["resolution"].value.x = 1 / (window.innerWidth * pixelRatio)
    this.fxaaPass.material.uniforms["resolution"].value.y = 1 / (window.innerHeight * pixelRatio)
    this.composer.addPass(this.fxaaPass)

    // Set initial quality
    this.setQuality(this.quality)
  }

  // Method to resize the composer when the window is resized
  resize(width: number, height: number, pixelRatio: number) {
    this.composer.setSize(width, height)
    this.fxaaPass.material.uniforms["resolution"].value.x = 1 / (width * pixelRatio)
    this.fxaaPass.material.uniforms["resolution"].value.y = 1 / (height * pixelRatio)
  }

  // Method to render the scene with post-processing
  render() {
    if (this.enabled) {
      this.composer.render()
    }
  }

  // Method to toggle post-processing on/off
  toggle() {
    this.enabled = !this.enabled
    return this.enabled
  }

  // Method to set the quality of post-processing
  setQuality(quality: "low" | "medium" | "high") {
    this.quality = quality

    switch (quality) {
      case "low":
        this.bloomPass.enabled = false
        this.ssaoPass.enabled = false
        this.fxaaPass.enabled = true
        break
      case "medium":
        this.bloomPass.enabled = true
        this.bloomPass.strength = 0.5
        this.ssaoPass.enabled = false
        this.fxaaPass.enabled = true
        break
      case "high":
        this.bloomPass.enabled = true
        this.bloomPass.strength = 0.8
        this.ssaoPass.enabled = true
        this.fxaaPass.enabled = true
        break
    }

    return this.quality
  }

  // Method to update bloom settings
  updateBloom(strength: number, radius: number, threshold: number) {
    this.bloomPass.strength = strength
    this.bloomPass.radius = radius
    this.bloomPass.threshold = threshold
  }

  // Method to update SSAO settings
  updateSSAO(kernelRadius: number, minDistance: number, maxDistance: number) {
    this.ssaoPass.kernelRadius = kernelRadius
    this.ssaoPass.minDistance = minDistance
    this.ssaoPass.maxDistance = maxDistance
  }

  // Method to dispose of resources
  dispose() {
    this.composer.dispose()
  }
}
