"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { MousePointer2, Keyboard, X } from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// Xbox Virtual Cursor + Mini Keyboard v28.3
//
// Press RSB (right stick click) on an Xbox controller to toggle MOUSE MODE:
//   • Right stick  → moves an on-screen cursor
//   • A (or RT)    → clicks whatever is under the cursor (buttons, tabs, inputs)
//   • Y            → toggles the on-screen mini keyboard
//   • B / RSB      → exits mouse mode
//
// The mini keyboard types into whichever input/textarea was last focused
// (clicking an input with the cursor focuses it), using native value setters
// so React controlled inputs update correctly. Also fully touch-usable on iPad.
// ─────────────────────────────────────────────────────────────────────────────

interface VirtualCursorProps {
  enabled: boolean
  onExit: () => void
}

const KEY_ROWS: string[][] = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ":"],
  ["z", "x", "c", "v", "b", "n", "m", ".", "-", "/"],
]

// Write into a (possibly React-controlled) input using the native setter,
// then fire an input event so onChange handlers run.
const typeIntoElement = (element: HTMLElement | null, updater: (value: string) => string) => {
  if (!element) return false
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    const proto = element instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set
    const next = updater(element.value)
    if (setter) setter.call(element, next)
    else element.value = next
    element.dispatchEvent(new Event("input", { bubbles: true }))
    return true
  }
  if (element.isContentEditable) {
    element.textContent = updater(element.textContent || "")
    element.dispatchEvent(new Event("input", { bubbles: true }))
    return true
  }
  return false
}

export function VirtualCursor({ enabled, onExit }: VirtualCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null)
  const positionRef = useRef({ x: typeof window !== "undefined" ? window.innerWidth / 2 : 400, y: typeof window !== "undefined" ? window.innerHeight / 2 : 300 })
  const prevButtonsRef = useRef<boolean[]>([])
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const [shift, setShift] = useState(false)
  const targetRef = useRef<HTMLElement | null>(null)
  const keyboardOpenRef = useRef(false)
  keyboardOpenRef.current = keyboardOpen

  const clickAtCursor = useCallback(() => {
    const { x, y } = positionRef.current
    // Hide the cursor element for the hit test so we don't click ourselves
    const cursorEl = cursorRef.current
    if (cursorEl) cursorEl.style.pointerEvents = "none"
    const element = document.elementFromPoint(x, y) as HTMLElement | null
    if (!element) return
    // Remember focusable targets so the mini keyboard knows where to type
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element.isContentEditable) {
      targetRef.current = element
      element.focus()
    }
    element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: x, clientY: y }))
    element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, clientX: x, clientY: y }))
    element.click?.()
  }, [])

  // Gamepad poll loop while mouse mode is on
  useEffect(() => {
    if (!enabled) return
    let raf = 0

    const loop = () => {
      raf = requestAnimationFrame(loop)
      const pads = navigator.getGamepads ? navigator.getGamepads() : []
      const pad = Array.from(pads).find((candidate) => candidate && candidate.connected)
      if (!pad) return

      // Right stick moves the cursor (axes 2/3), left stick also works (0/1)
      const dead = 0.18
      const ax = Math.abs(pad.axes[2]) > dead ? pad.axes[2] : Math.abs(pad.axes[0]) > dead ? pad.axes[0] : 0
      const ay = Math.abs(pad.axes[3]) > dead ? pad.axes[3] : Math.abs(pad.axes[1]) > dead ? pad.axes[1] : 0
      if (ax !== 0 || ay !== 0) {
        const speed = 11
        positionRef.current.x = Math.max(0, Math.min(window.innerWidth - 2, positionRef.current.x + ax * speed))
        positionRef.current.y = Math.max(0, Math.min(window.innerHeight - 2, positionRef.current.y + ay * speed))
        if (cursorRef.current) {
          cursorRef.current.style.transform = `translate(${positionRef.current.x}px, ${positionRef.current.y}px)`
        }
      }

      // Edge-triggered buttons
      const buttons = pad.buttons.map((button) => button.pressed)
      const wasPressed = (index: number) => buttons[index] && !prevButtonsRef.current[index]

      if (wasPressed(0) || wasPressed(7)) clickAtCursor() // A or RT = click
      if (wasPressed(3)) setKeyboardOpen((prev) => !prev) // Y = keyboard
      if (wasPressed(1) || wasPressed(11)) {
        // B or RSB = exit (RSB toggles from the parent too; B always exits)
        if (keyboardOpenRef.current) setKeyboardOpen(false)
        else onExit()
      }

      // SCROLLING shortcut: hold LB/RB (bumpers) or D-pad up/down to scroll
      // whatever scrollable panel is under the cursor (voice panel, directory,
      // WP shortcode sheet, settings…). Falls back to scrolling the page.
      const scrollUp = buttons[4] || buttons[12] // LB or D-pad up
      const scrollDown = buttons[5] || buttons[13] // RB or D-pad down
      if (scrollUp || scrollDown) {
        const step = 14 * (scrollDown ? 1 : -1)
        const { x, y } = positionRef.current
        let element = document.elementFromPoint(x, y) as HTMLElement | null
        // Walk up to the nearest actually-scrollable ancestor
        while (element) {
          const style = window.getComputedStyle(element)
          const canScroll =
            element.scrollHeight > element.clientHeight + 2 &&
            /(auto|scroll)/.test(style.overflowY)
          if (canScroll) break
          element = element.parentElement
        }
        if (element) element.scrollBy({ top: step })
        else window.scrollBy({ top: step })
      }

      prevButtonsRef.current = buttons
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [enabled, clickAtCursor, onExit])

  if (!enabled) return null

  const pressKey = (key: string) => {
    const value = shift ? key.toUpperCase() : key
    typeIntoElement(targetRef.current || (document.activeElement as HTMLElement | null), (current) => current + value)
    if (shift) setShift(false)
  }

  return (
    <>
      {/* Cursor */}
      <div
        ref={cursorRef}
        className="pointer-events-none fixed left-0 top-0 z-[95]"
        style={{ transform: `translate(${positionRef.current.x}px, ${positionRef.current.y}px)` }}
      >
        <MousePointer2 size={26} className="fill-cyan-300 text-slate-950 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]" />
      </div>

      {/* Mode badge */}
      <div className="fixed left-1/2 top-3 z-[94] -translate-x-1/2 rounded-full border border-cyan-300/40 bg-slate-950/90 px-4 py-1.5 text-[11px] font-black text-cyan-200 shadow-lg backdrop-blur">
        🎮 MOUSE MODE · Stick = move · A = click · LB/RB = scroll · Y = keyboard · B = exit
      </div>

      {/* Mini keyboard */}
      {keyboardOpen && (
        <div className="fixed bottom-4 left-1/2 z-[94] w-[min(560px,calc(100vw-1rem))] -translate-x-1/2 rounded-2xl border border-white/20 bg-slate-950/95 p-2 shadow-2xl backdrop-blur">
          <div className="mb-1 flex items-center justify-between px-1 text-[10px] font-black uppercase text-slate-400">
            <span className="flex items-center gap-1"><Keyboard size={12} /> Mini Keyboard — aim + A to type</span>
            <button onClick={() => setKeyboardOpen(false)} className="rounded bg-white/10 p-1 hover:bg-white/25"><X size={12} /></button>
          </div>
          {KEY_ROWS.map((row, rowIndex) => (
            <div key={rowIndex} className="mb-1 flex justify-center gap-1">
              {row.map((key) => (
                <button
                  key={key}
                  onClick={() => pressKey(key)}
                  className="h-9 min-w-9 flex-1 rounded-lg bg-white/10 text-sm font-bold text-white hover:bg-cyan-500 hover:text-slate-950"
                >
                  {shift ? key.toUpperCase() : key}
                </button>
              ))}
            </div>
          ))}
          <div className="flex justify-center gap-1">
            <button onClick={() => setShift((prev) => !prev)} className={`h-9 rounded-lg px-3 text-xs font-black ${shift ? "bg-cyan-500 text-slate-950" : "bg-white/10 text-white hover:bg-white/25"}`}>⇧ Shift</button>
            <button onClick={() => pressKey(" ")} className="h-9 flex-1 rounded-lg bg-white/10 text-xs font-bold text-white hover:bg-white/25">Space</button>
            <button
              onClick={() => typeIntoElement(targetRef.current || (document.activeElement as HTMLElement | null), (current) => current.slice(0, -1))}
              className="h-9 rounded-lg bg-white/10 px-3 text-xs font-black text-white hover:bg-rose-500"
            >
              ⌫
            </button>
            <button
              onClick={() => {
                const target = targetRef.current
                if (target) {
                  target.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
                  target.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", bubbles: true }))
                }
              }}
              className="h-9 rounded-lg bg-emerald-500 px-3 text-xs font-black text-slate-950 hover:bg-emerald-400"
            >
              ⏎ Enter
            </button>
          </div>
        </div>
      )}
    </>
  )
}
