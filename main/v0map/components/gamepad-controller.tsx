"use client"

import { useEffect, useState, useCallback } from "react"

interface GamepadState {
  connected: boolean
  leftStick: { x: number; y: number }
  rightStick: { x: number; y: number }
  buttons: boolean[]
  id: string
}

interface GamepadControllerProps {
  onLeftStickMove: (x: number, y: number) => void
  onRightStickMove: (x: number, y: number) => void
  onButtonPress?: (index: number, pressed: boolean) => void
  onControllerConnect?: (connected: boolean) => void
}

export function GamepadController({
  onLeftStickMove,
  onRightStickMove,
  onButtonPress,
  onControllerConnect,
}: GamepadControllerProps) {
  const [gamepadState, setGamepadState] = useState<GamepadState>({
    connected: false,
    leftStick: { x: 0, y: 0 },
    rightStick: { x: 0, y: 0 },
    buttons: [],
    id: "",
  })

  // Apply a small deadzone to prevent drift
  const applyDeadzone = useCallback((value: number, deadzone = 0.1) => {
    return Math.abs(value) < deadzone ? 0 : value
  }, [])

  // Handle gamepad connection/disconnection
  const handleGamepadConnected = useCallback(
    (event: GamepadEvent) => {
      console.log("Gamepad connected:", event.gamepad.id)
      if (onControllerConnect) onControllerConnect(true)
    },
    [onControllerConnect],
  )

  const handleGamepadDisconnected = useCallback(
    (event: GamepadEvent) => {
      console.log("Gamepad disconnected:", event.gamepad.id)
      if (onControllerConnect) onControllerConnect(false)
    },
    [onControllerConnect],
  )

  // Poll for gamepad state
  useEffect(() => {
    window.addEventListener("gamepadconnected", handleGamepadConnected)
    window.addEventListener("gamepaddisconnected", handleGamepadDisconnected)

    // Check if the GameSir X5 Lite or other controllers are connected
    const checkForGameSir = () => {
      const gamepads = navigator.getGamepads()
      let foundGamepad = false
      let gamepadData: GamepadState = {
        connected: false,
        leftStick: { x: 0, y: 0 },
        rightStick: { x: 0, y: 0 },
        buttons: [],
        id: "",
      }

      for (const gamepad of gamepads) {
        if (gamepad) {
          foundGamepad = true

          // Get left stick (usually axes 0 and 1)
          const leftX = applyDeadzone(gamepad.axes[0] || 0)
          const leftY = applyDeadzone(gamepad.axes[1] || 0)

          // Get right stick (usually axes 2 and 3)
          const rightX = applyDeadzone(gamepad.axes[2] || 0)
          const rightY = applyDeadzone(gamepad.axes[3] || 0)

          // Get button states
          const buttonStates = Array.from(gamepad.buttons).map((btn) => btn.pressed)

          gamepadData = {
            connected: true,
            leftStick: { x: leftX, y: leftY },
            rightStick: { x: rightX, y: rightY },
            buttons: buttonStates,
            id: gamepad.id,
          }

          // Send stick movements to parent component
          onLeftStickMove(leftX, leftY)
          onRightStickMove(rightX, rightY)

          // Send button presses if callback provided
          if (onButtonPress) {
            buttonStates.forEach((pressed, index) => {
              if (pressed !== gamepadState.buttons[index]) {
                onButtonPress(index, pressed)
              }
            })
          }

          break // Use the first connected gamepad
        }
      }

      // Update state
      setGamepadState((prev) => {
        // Only update if there's a change to minimize re-renders
        if (
          foundGamepad !== prev.connected ||
          gamepadData.leftStick.x !== prev.leftStick.x ||
          gamepadData.leftStick.y !== prev.leftStick.y ||
          gamepadData.rightStick.x !== prev.rightStick.x ||
          gamepadData.rightStick.y !== prev.rightStick.y ||
          gamepadData.id !== prev.id
        ) {
          return gamepadData
        }
        return prev
      })

      // If controller was connected but now disconnected
      if ((prev) => prev.connected && !foundGamepad) {
        if (onControllerConnect) onControllerConnect(false)
      } else if ((prev) => !prev.connected && foundGamepad) {
        if (onControllerConnect) onControllerConnect(true)
      }
    }

    // Poll for gamepad state every frame
    const intervalId = setInterval(checkForGameSir, 16) // ~60fps

    return () => {
      clearInterval(intervalId)
      window.removeEventListener("gamepadconnected", handleGamepadConnected)
      window.removeEventListener("gamepaddisconnected", handleGamepadDisconnected)
    }
  }, [applyDeadzone, onLeftStickMove, onRightStickMove, onButtonPress, onControllerConnect, gamepadState.buttons])

  // This component doesn't render anything visible
  return null
}
