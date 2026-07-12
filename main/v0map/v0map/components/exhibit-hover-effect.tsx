import * as THREE from "three"

interface ExhibitItem {
  title: string
  description: string
  streamlitUrl?: string
  liveUrl?: string
  shortcode?: string
  shortcodeTag?: string
  wordpressUrl?: string
}

export class ExhibitHoverEffect {
  private camera: THREE.Camera
  private scene: THREE.Scene
  private raycaster: THREE.Raycaster
  private onHover: (item: ExhibitItem | null) => void
  private hoveredObject: THREE.Object3D | null = null

  constructor(camera: THREE.Camera, scene: THREE.Scene, onHover: (item: ExhibitItem | null) => void) {
    this.camera = camera
    this.scene = scene
    this.raycaster = new THREE.Raycaster()
    this.onHover = onHover
  }

  update(mouseX: number, mouseY: number, width: number, height: number) {
    // Convert mouse position to normalized device coordinates (-1 to +1)
    const normalizedX = (mouseX / width) * 2 - 1
    const normalizedY = -(mouseY / height) * 2 + 1

    // Update the picking ray with the camera and mouse position
    const mouseVector = new THREE.Vector2(normalizedX, normalizedY)
    this.raycaster.setFromCamera(mouseVector, this.camera)

    // Calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects(this.scene.children, true)

    // Check if we're hovering over an exhibit
    if (intersects.length > 0) {
      const intersectedObject = this.findExhibitInIntersectedObjects(intersects)

      if (intersectedObject) {
        if (this.hoveredObject !== intersectedObject) {
          // We've hovered over a new object
          this.hoveredObject = intersectedObject
          if (intersectedObject.userData && intersectedObject.userData.type === "exhibit") {
            this.onHover(intersectedObject.userData.item)
          }
        }
        return
      }
    }

    // If we get here, we're not hovering over any exhibit
    if (this.hoveredObject) {
      this.hoveredObject = null
      this.onHover(null)
    }
  }

  private findExhibitInIntersectedObjects(intersects: THREE.Intersection[]): THREE.Object3D | null {
    for (const intersect of intersects) {
      let object: THREE.Object3D | null = intersect.object

      // Traverse up the parent chain to find an object with exhibit userData
      while (object) {
        if (object.userData && object.userData.type === "exhibit") {
          return object
        }
        object = object.parent
      }
    }
    return null
  }

  dispose() {
    // Clean up any resources
    this.hoveredObject = null
  }
}
