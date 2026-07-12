import * as THREE from "three"

export enum WeatherType {
  CLEAR = "clear",
  RAIN = "rain",
  SNOW = "snow",
  FOG = "fog",
}

export class WeatherSystem {
  private scene: THREE.Scene
  private camera: THREE.Camera
  private currentWeather: WeatherType = WeatherType.CLEAR
  private particles: THREE.Points | null = null
  private particleCount = 5000
  private particleSystem: THREE.Points | null = null
  private fog: THREE.FogExp2 | null = null
  private updateCallback: (() => void) | null = null

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene
    this.camera = camera
  }

  // Set the weather type
  setWeather(type: WeatherType) {
    // Clear existing weather effects
    this.clearWeather()

    // Set new weather type
    this.currentWeather = type

    // Apply the new weather effect
    switch (type) {
      case WeatherType.RAIN:
        this.createRain()
        break
      case WeatherType.SNOW:
        this.createSnow()
        break
      case WeatherType.FOG:
        this.createFog()
        break
      case WeatherType.CLEAR:
      default:
        // No additional effects for clear weather
        break
    }

    return this.currentWeather
  }

  // Clear all weather effects
  private clearWeather() {
    // Remove particle system if it exists
    if (this.particleSystem) {
      this.scene.remove(this.particleSystem)
      if (this.particleSystem.geometry) {
        this.particleSystem.geometry.dispose()
      }
      if (this.particleSystem.material) {
        if (Array.isArray(this.particleSystem.material)) {
          this.particleSystem.material.forEach((material) => material.dispose())
        } else {
          this.particleSystem.material.dispose()
        }
      }
      this.particleSystem = null
    }

    // Remove fog
    if (this.fog) {
      this.scene.fog = null
      this.fog = null
    }

    // Clear update callback
    this.updateCallback = null
  }

  // Create rain effect
  private createRain() {
    const rainGeometry = new THREE.BufferGeometry()
    const rainVertices = []

    // Create rain drop positions
    for (let i = 0; i < this.particleCount; i++) {
      const x = Math.random() * 400 - 200
      const y = Math.random() * 200 - 100
      const z = Math.random() * 400 - 200
      rainVertices.push(x, y, z)
    }

    rainGeometry.setAttribute("position", new THREE.Float32BufferAttribute(rainVertices, 3))

    // Create rain material
    const rainMaterial = new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 0.1,
      transparent: true,
      opacity: 0.6,
    })

    // Create rain particle system
    this.particleSystem = new THREE.Points(rainGeometry, rainMaterial)
    this.scene.add(this.particleSystem)

    // Add light fog for rain
    this.fog = new THREE.FogExp2(0x999999, 0.007)
    this.scene.fog = this.fog

    // Update function for rain animation
    this.updateCallback = () => {
      if (!this.particleSystem) return

      const positions = this.particleSystem.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < positions.length; i += 3) {
        // Move rain drops down
        positions[i + 1] -= 0.2

        // Reset rain drops that go below a certain point
        if (positions[i + 1] < -100) {
          positions[i + 1] = 100
        }
      }
      this.particleSystem.geometry.attributes.position.needsUpdate = true
    }
  }

  // Create snow effect
  private createSnow() {
    const snowGeometry = new THREE.BufferGeometry()
    const snowVertices = []

    // Create snowflake positions
    for (let i = 0; i < this.particleCount; i++) {
      const x = Math.random() * 400 - 200
      const y = Math.random() * 200 - 100
      const z = Math.random() * 400 - 200
      snowVertices.push(x, y, z)
    }

    snowGeometry.setAttribute("position", new THREE.Float32BufferAttribute(snowVertices, 3))

    // Create snow material
    const snowMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.2,
      transparent: true,
      opacity: 0.8,
    })

    // Create snow particle system
    this.particleSystem = new THREE.Points(snowGeometry, snowMaterial)
    this.scene.add(this.particleSystem)

    // Add light fog for snow
    this.fog = new THREE.FogExp2(0xcccccc, 0.005)
    this.scene.fog = this.fog

    // Update function for snow animation
    this.updateCallback = () => {
      if (!this.particleSystem) return

      const positions = this.particleSystem.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < positions.length; i += 3) {
        // Move snowflakes down and slightly to the side
        positions[i + 1] -= 0.05
        positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.01

        // Reset snowflakes that go below a certain point
        if (positions[i + 1] < -100) {
          positions[i + 1] = 100
          positions[i] = Math.random() * 400 - 200
          positions[i + 2] = Math.random() * 400 - 200
        }
      }
      this.particleSystem.geometry.attributes.position.needsUpdate = true
    }
  }

  // Create fog effect
  private createFog() {
    // Create dense fog
    this.fog = new THREE.FogExp2(0xcccccc, 0.02)
    this.scene.fog = this.fog
  }

  // Update weather effects
  update() {
    if (this.updateCallback) {
      this.updateCallback()
    }
  }

  // Get current weather type
  getWeather() {
    return this.currentWeather
  }

  // Dispose of resources
  dispose() {
    this.clearWeather()
  }
}
