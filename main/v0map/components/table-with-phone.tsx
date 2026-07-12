"use client"

import * as THREE from "three"
import { useRef, useEffect } from "react"

interface TableWithPhoneProps {
  position: [number, number, number]
  rotation?: [number, number, number]
  tableId: number
}

export function TableWithPhone({ position, rotation = [0, 0, 0], tableId }: TableWithPhoneProps) {
  const groupRef = useRef<THREE.Group | null>(null)

  useEffect(() => {
    // Create a new group if it doesn't exist
    if (!groupRef.current) {
      const group = new THREE.Group()
      group.position.set(position[0], position[1], position[2])
      group.rotation.set(rotation[0], rotation[1], rotation[2])
      groupRef.current = group

      // Create table top
      const tableTopGeometry = new THREE.BoxGeometry(2, 0.1, 1.5)
      const tableTopMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513, // Brown wood color
        roughness: 0.7,
        metalness: 0.2,
      })
      const tableTop = new THREE.Mesh(tableTopGeometry, tableTopMaterial)
      tableTop.position.y = 1 // Table height
      tableTop.castShadow = true
      tableTop.receiveShadow = true
      group.add(tableTop)

      // Create table legs
      const legGeometry = new THREE.BoxGeometry(0.1, 1, 0.1)
      const legMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.7,
        metalness: 0.2,
      })

      // Position of the four legs
      const legPositions = [
        [-0.9, 0.5, -0.7], // front left
        [0.9, 0.5, -0.7], // front right
        [-0.9, 0.5, 0.7], // back left
        [0.9, 0.5, 0.7], // back right
      ]

      legPositions.forEach((pos) => {
        const leg = new THREE.Mesh(legGeometry, legMaterial)
        leg.position.set(pos[0], pos[1], pos[2])
        leg.castShadow = true
        leg.receiveShadow = true
        group.add(leg)
      })

      // Create a phone on the table
      const phoneBaseGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.2)
      const phoneBaseMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.5,
        metalness: 0.8,
      })
      const phoneBase = new THREE.Mesh(phoneBaseGeometry, phoneBaseMaterial)
      phoneBase.position.set(0, 1.1, 0)
      phoneBase.castShadow = true
      phoneBase.receiveShadow = true
      group.add(phoneBase)

      // Create phone handset
      const handsetGeometry = new THREE.BoxGeometry(0.25, 0.05, 0.1)
      const handsetMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.5,
        metalness: 0.7,
      })
      const handset = new THREE.Mesh(handsetGeometry, handsetMaterial)
      handset.position.set(0, 1.17, 0)
      handset.castShadow = true
      handset.receiveShadow = true
      group.add(handset)

      // Add table number
      const canvas = document.createElement("canvas")
      canvas.width = 128
      canvas.height = 64
      const context = canvas.getContext("2d")
      if (context) {
        context.fillStyle = "white"
        context.font = "bold 48px Arial"
        context.textAlign = "center"
        context.textBaseline = "middle"
        context.fillText(`${tableId}`, 64, 32)

        const texture = new THREE.CanvasTexture(canvas)
        const material = new THREE.SpriteMaterial({ map: texture })
        const sprite = new THREE.Sprite(material)
        sprite.position.set(0, 1.5, 0)
        sprite.scale.set(0.5, 0.25, 1)
        group.add(sprite)
      }

      // Add userData for interaction
      group.userData = { type: "table", tableId }
    }

    return () => {
      // Clean up the group when component unmounts
      if (groupRef.current) {
        groupRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose()
            if (object.material instanceof THREE.Material) {
              object.material.dispose()
            } else if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose())
            }
          }
        })
      }
    }
  }, [position, rotation, tableId])

  // We need to add the group to the scene in the VirtualGallery component
  return null
}
