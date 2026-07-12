interface NavigationPanelProps {
  className?: string
}

export function NavigationPanel({ className = "" }: NavigationPanelProps) {
  return (
    <div className={`flex gap-4 ${className}`}>
      <div className="bg-red-500 p-4 rounded-lg transform rotate-3 hover:rotate-0 transition-transform">
        SCHOOL OF A.I.
      </div>
      <div className="bg-red-500 p-4 rounded-lg transform -rotate-2 hover:rotate-0 transition-transform">
        AI WORLD BUILDER
      </div>
      <div className="bg-red-500 p-4 rounded-lg transform rotate-1 hover:rotate-0 transition-transform">
        AI DIRECTORIES
      </div>
      <div className="bg-red-500 p-4 rounded-lg transform -rotate-3 hover:rotate-0 transition-transform">
        AI AGENT LIBRARY
      </div>
      <div className="bg-red-500 p-4 rounded-lg transform rotate-2 hover:rotate-0 transition-transform">
        A.I. GAMEROOM
      </div>
    </div>
  )
}
