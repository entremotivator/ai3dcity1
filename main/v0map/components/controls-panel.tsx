interface ControlsPanelProps {
  className?: string
}

export function ControlsPanel({ className = "" }: ControlsPanelProps) {
  return (
    <div className={`bg-purple-900/80 p-4 rounded-lg text-white ${className}`}>
      <h3 className="font-bold mb-2 flex items-center justify-between">
        Controls
        <span className="text-sm bg-white/20 px-2 py-1 rounded">Hide</span>
      </h3>
      <ul className="space-y-1 text-sm">
        <li>W/A/S/D: Move around</li>
        <li>Mouse: Look around</li>
        <li>Space: Exit mouse</li>
        <li>M: Show Menu</li>
        <li>Enter: Start exploration</li>
        <li>Esc: Stop exploration</li>
        <li>G: Start audio guide</li>
        <li>P: Stop audio guide</li>
      </ul>
    </div>
  )
}
