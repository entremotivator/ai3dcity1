import * as THREE from "three"

export enum TimeOfDay {
  DAWN = "dawn",
  DAY = "day",
  DUSK = "dusk",
  NIGHT = "night",
}

interface SkyColors {
  topColor: THREE.Color
  bottomColor: THREE.Color
}

interface LightSettings {
  directionalIntensity: number
  directionalColor: THREE.Color
  ambientIntensity: number
  ambientColor: THREE.Color
}

export class DayNightCycle {
  private scene: THREE.Scene
  private skyMesh: THREE.Mesh
  private directionalLight: THREE.DirectionalLight
  private ambientLight: THREE.AmbientLight
  private stars: THREE.Points | null = null
  private currentTime: TimeOfDay = TimeOfDay.DAY
  private timeProgress = 0.5 // 0 to 1 for current time period
  private cycleDuration = 300 // seconds for a full day-night cycle
  private autoRotate = true
  private skyDome: THREE.Mesh

  // Sky colors for different times of day
  private skyColors: Record<TimeOfDay, SkyColors> = {
    [TimeOfDay.DAWN]: {
      topColor: new THREE.Color(0x9494ff),
      bottomColor: new THREE.Color(0xff9e5e),
    },
    [TimeOfDay.DAY]: {
      topColor: new THREE.Color(0x0077ff),
      bottomColor: new THREE.Color(0xffffff),
    },
    [TimeOfDay.DUSK]: {
      topColor: new THREE.Color(0x0033aa),
      bottomColor: new THREE.Color(0xff9955),
    },
    [TimeOfDay.NIGHT]: {
      topColor: new THREE.Color(0x000022),
      bottomColor: new THREE.Color(0x000033),
    },
  }

  // Light settings for different times of day
  private lightSettings: Record<TimeOfDay, LightSettings> = {
    [TimeOfDay.DAWN]: {
      directionalIntensity: 0.6,
      directionalColor: new THREE.Color(0xffeecc),
      ambientIntensity: 0.4,
      ambientColor: new THREE.Color(0xffddaa),
    },
    [TimeOfDay.DAY]: {
      directionalIntensity: 0.8,
      directionalColor: new THREE.Color(0xffffff),
      ambientIntensity: 0.6,
      ambientColor: new THREE.Color(0xffffff),
    },
    [TimeOfDay.DUSK]: {
      directionalIntensity: 0.5,
      directionalColor: new THREE.Color(0xffaa77),
      ambientIntensity: 0.3,
      ambientColor: new THREE.Color(0xff7744),
    },
    [TimeOfDay.NIGHT]: {
      directionalIntensity: 0.1,
      directionalColor: new THREE.Color(0x3344ff),
      ambientIntensity: 0.2,
      ambientColor: new THREE.Color(0x111122),
    },
  }

  constructor(scene: THREE.Scene, directionalLight: THREE.DirectionalLight, ambientLight: THREE.AmbientLight) {
    this.scene = scene
    this.directionalLight = directionalLight
    this.ambientLight = ambientLight

    // Create sky dome
    this.skyDome = this.createSkyDome()
    this.scene.add(this.skyDome)

    // Create stars (initially hidden)
    this.createStars()

    // Set initial time
    this.setTime(TimeOfDay.DAY)
  }

  private createSkyDome(): THREE.Mesh {
    // Create a large sphere for the sky
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32)

    // Invert the geometry so we see the inside
    skyGeometry.scale(-1, 1, 1)

    // Create shader material for gradient sky
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x0077ff) },
        bottomColor: { value: new THREE.Color(0xffffff) },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          float t = max(0.0, h);
          gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
        }
      `,
      side: THREE.BackSide,
    })

    const sky = new THREE.Mesh(skyGeometry, skyMaterial)
    return sky
  }

  private createStars() {
    // Create star particles
    const starsGeometry = new THREE.BufferGeometry()
    const starCount = 2000
    const starsPositions = new Float32Array(starCount * 3)

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3
      // Create stars in a sphere around the scene
      const radius = 450 + Math.random() * 50
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      starsPositions[i3] = radius * Math.sin(phi) * Math.cos(theta)
      starsPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      starsPositions[i3 + 2] = radius * Math.cos(phi)
    }

    starsGeometry.setAttribute("position", new THREE.BufferAttribute(starsPositions, 3))

    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      transparent: true,
      opacity: 0,
      sizeAttenuation: false,
    })

    this.stars = new THREE.Points(starsGeometry, starsMaterial)
    this.scene.add(this.stars)
  }

  // Update the sky and lighting based on current time
  private updateSkyAndLighting() {
    // Get current and next time period
    const currentTimeIndex = Object.values(TimeOfDay).indexOf(this.currentTime)
    const nextTimeIndex = (currentTimeIndex + 1) % Object.values(TimeOfDay).length
    const nextTime = Object.values(TimeOfDay)[nextTimeIndex] as TimeOfDay

    // Get colors and settings for current and next time
    const currentSky = this.skyColors[this.currentTime]
    const nextSky = this.skyColors[nextTime]
    const currentLight = this.lightSettings[this.currentTime]
    const nextLight = this.lightSettings[nextTime]

    // Interpolate between current and next time
    const skyMaterial = this.skyDome.material as THREE.ShaderMaterial

    // Interpolate sky colors
    const topColor = new THREE.Color().lerpColors(currentSky.topColor, nextSky.topColor, this.timeProgress)
    const bottomColor = new THREE.Color().lerpColors(currentSky.bottomColor, nextSky.bottomColor, this.timeProgress)

    skyMaterial.uniforms.topColor.value = topColor
    skyMaterial.uniforms.bottomColor.value = bottomColor

    // Interpolate light settings
    const directionalIntensity = THREE.MathUtils.lerp(
      currentLight.directionalIntensity,
      nextLight.directionalIntensity,
      this.timeProgress,
    )
    const directionalColor = new THREE.Color().lerpColors(
      currentLight.directionalColor,
      nextLight.directionalColor,
      this.timeProgress,
    )
    const ambientIntensity = THREE.MathUtils.lerp(
      currentLight.ambientIntensity,
      nextLight.ambientIntensity,
      this.timeProgress,
    )
    const ambientColor = new THREE.Color().lerpColors(
      currentLight.ambientColor,
      nextLight.ambientColor,
      this.timeProgress,
    )

    this.directionalLight.intensity = directionalIntensity
    this.directionalLight.color = directionalColor
    this.ambientLight.intensity = ambientIntensity
    this.ambientLight.color = ambientColor

    // Update stars visibility
    if (this.stars) {
      const starsMaterial = this.stars.material as THREE.PointsMaterial

      // Stars are visible at night and partially at dusk/dawn
      if (this.currentTime === TimeOfDay.NIGHT) {
        starsMaterial.opacity = 1 - this.timeProgress
      } else if (this.currentTime === TimeOfDay.DUSK) {
        starsMaterial.opacity = this.timeProgress
      } else if (this.currentTime === TimeOfDay.DAWN) {
        starsMaterial.opacity = 1 - this.timeProgress
      } else {
        starsMaterial.opacity = 0
      }
    }
  }

  // Set the time of day
  setTime(time: TimeOfDay, progress = 0) {
    this.currentTime = time
    this.timeProgress = progress
    this.updateSkyAndLighting()
    return this.currentTime
  }

  // Toggle auto rotation of day-night cycle
  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate
    return this.autoRotate
  }

  // Get current time of day
  getTime() {
    return this.currentTime
  }

  // Update the day-night cycle
  update(deltaTime: number) {
    if (!this.autoRotate) return

    // Progress through the day-night cycle
    this.timeProgress += deltaTime / (this.cycleDuration / 4) // 4 time periods in a cycle

    // Move to next time period when progress reaches 1
    if (this.timeProgress >= 1) {
      this.timeProgress = 0
      const currentTimeIndex = Object.values(TimeOfDay).indexOf(this.currentTime)
      const nextTimeIndex = (currentTimeIndex + 1) % Object.values(TimeOfDay).length
      this.currentTime = Object.values(TimeOfDay)[nextTimeIndex] as TimeOfDay
    }

    this.updateSkyAndLighting()
  }

  // Set the cycle duration in seconds
  setCycleDuration(seconds: number) {
    this.cycleDuration = seconds
    return this.cycleDuration
  }

  // Dispose of resources
  dispose() {
    if (this.skyDome) {
      this.scene.remove(this.skyDome)
      if (this.skyDome.geometry) this.skyDome.geometry.dispose()
      if (this.skyDome.material) {
        if (Array.isArray(this.skyDome.material)) {
          this.skyDome.material.forEach((material) => material.dispose())
        } else {
          this.skyDome.material.dispose()
        }
      }
    }

    if (this.stars) {
      this.scene.remove(this.stars)
      if (this.stars.geometry) this.stars.geometry.dispose()
      if (this.stars.material) {
        if (Array.isArray(this.stars.material)) {
          this.stars.material.forEach((material) => material.dispose())
        } else {
          this.stars.material.dispose()
        }
      }
    }
  }
}
