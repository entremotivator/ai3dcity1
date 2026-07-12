"use client"

import { useEffect, useRef } from "react"

interface JoystickProps {
  onMove: (x: number, y: number) => void
  className?: string
  size?: number
  label?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Joystick v28.1 — glitch-fixed rewrite
//
// Fixes over the previous version:
// 1. The joystick's screen rect was measured ONCE at mount — while the
//    "Loading 3D models…" overlay was still up. Any layout shift afterwards
//    (overlay hiding, panels, resize, rotation) left a stale center, and if the
//    element wasn't laid out yet the max distance came out NEGATIVE — flipping
//    or NaN-ing every output. The rect is now measured fresh at the start of
//    every drag.
// 2. Drag state lived in React state inside a stale closure, and the effect
//    re-subscribed all listeners on every drag start/end. Now everything runs
//    through refs with pointer events + setPointerCapture — one subscription,
//    zero stale closures, and the knob can't be "lost" mid-drag.
// 3. `transition-transform` made the knob rubber-band behind the finger.
//    Transitions now only apply on release (snap back), never while dragging.
// 4. Touch drags no longer scroll/pull-to-refresh the page (touch-action: none
//    + pointer capture).
// ─────────────────────────────────────────────────────────────────────────────

export function Joystick({
  onMove,
  className = "",
  size = 120,
  label = "Move",
  externalControllerActive = false,
}: JoystickProps & { externalControllerActive?: boolean }) {
  const joystickRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const pointerIdRef = useRef<number | null>(null)
  const centerRef = useRef({ x: 0, y: 0 })
  const maxDistanceRef = useRef(1)
  const onMoveRef = useRef(onMove)
  onMoveRef.current = onMove

  useEffect(() => {
    const joystick = joystickRef.current
    const knob = knobRef.current
    if (!joystick || !knob) return

    const measure = () => {
      // Fresh rect every drag start — never stale, never pre-layout
      const rect = joystick.getBoundingClientRect()
      centerRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      // Guard: if the element isn't laid out yet, fall back to the size prop
      const width = rect.width > 0 ? rect.width : size
      maxDistanceRef.current = Math.max(8, width / 2 - (knob.offsetWidth || size / 2) / 2)
    }

    const applyDelta = (clientX: number, clientY: number) => {
      let deltaX = clientX - centerRef.current.x
      let deltaY = clientY - centerRef.current.y
      const maxDistance = maxDistanceRef.current
      const distance = Math.hypot(deltaX, deltaY)

      if (distance > maxDistance) {
        const angle = Math.atan2(deltaY, deltaX)
        deltaX = Math.cos(angle) * maxDistance
        deltaY = Math.sin(angle) * maxDistance
      }

      knob.style.transition = "none" // follow the finger 1:1, no rubber-banding
      knob.style.transform = `translate(${deltaX}px, ${deltaY}px)`

      const normalizedX = deltaX / maxDistance
      const normalizedY = -deltaY / maxDistance // Invert Y-axis (up = forward)
      if (Number.isFinite(normalizedX) && Number.isFinite(normalizedY)) {
        onMoveRef.current(normalizedX, normalizedY)
      }
    }

    const release = () => {
      if (!draggingRef.current) return
      draggingRef.current = false
      pointerIdRef.current = null
      knob.style.transition = "transform 120ms ease-out" // smooth snap back only on release
      knob.style.transform = "translate(0px, 0px)"
      onMoveRef.current(0, 0)
    }

    const handlePointerDown = (e: PointerEvent) => {
      e.preventDefault()
      draggingRef.current = true
      pointerIdRef.current = e.pointerId
      measure()
      try {
        joystick.setPointerCapture(e.pointerId) // keep receiving moves even off-element
      } catch {}
      applyDelta(e.clientX, e.clientY)
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!draggingRef.current || (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current)) return
      e.preventDefault()
      applyDelta(e.clientX, e.clientY)
    }

    const handlePointerUp = (e: PointerEvent) => {
      if (pointerIdRef.current !== null && e.pointerId !== pointerIdRef.current) return
      release()
    }

    joystick.addEventListener("pointerdown", handlePointerDown)
    joystick.addEventListener("pointermove", handlePointerMove)
    joystick.addEventListener("pointerup", handlePointerUp)
    joystick.addEventListener("pointercancel", handlePointerUp)
    joystick.addEventListener("lostpointercapture", handlePointerUp)
    // Safety net: releasing outside capture (older browsers)
    window.addEventListener("pointerup", handlePointerUp)
    window.addEventListener("blur", release)

    return () => {
      joystick.removeEventListener("pointerdown", handlePointerDown)
      joystick.removeEventListener("pointermove", handlePointerMove)
      joystick.removeEventListener("pointerup", handlePointerUp)
      joystick.removeEventListener("pointercancel", handlePointerUp)
      joystick.removeEventListener("lostpointercapture", handlePointerUp)
      window.removeEventListener("pointerup", handlePointerUp)
      window.removeEventListener("blur", release)
      release()
    }
  }, [size])

  return (
    <div className={`${className} flex flex-col items-center`}>
      {label && (
        <div className="text-white text-sm mb-1 flex items-center">
          {label}
          {externalControllerActive && (
            <span className="ml-2 text-xs bg-green-500 text-white px-1 rounded animate-pulse">Controller</span>
          )}
        </div>
      )}
      <div
        ref={joystickRef}
        className={`bg-gray-800/80 rounded-full flex items-center justify-center select-none ${externalControllerActive ? "border-2 border-green-500" : ""}`}
        style={{ width: size, height: size, touchAction: "none" }}
      >
        <div
          ref={knobRef}
          className={`rounded-full cursor-pointer pointer-events-none ${externalControllerActive ? "bg-green-600" : "bg-gray-600"}`}
          style={{ width: size / 2, height: size / 2 }}
        />
      </div>
    </div>
  )
}

// Update the RotationJoystick to support external controllers
export function RotationJoystick({
  onRotate,
  className = "",
  size = 120,
  externalControllerActive = false,
}: {
  onRotate: (value: number) => void
  className?: string
  size?: number
  externalControllerActive?: boolean
}) {
  return (
    <Joystick
      onMove={(x) => onRotate(x)}
      className={className}
      size={size}
      label="Rotate"
      externalControllerActive={externalControllerActive}
    />
  )
}
