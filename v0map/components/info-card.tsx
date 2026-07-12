"use client"

import { useEffect, useRef, useState } from "react"
import { X } from "lucide-react"

interface InfoCardProps {
  item: {
    title: string
    description: string
    streamlitUrl?: string
    liveUrl?: string
    shortcode?: string
  }
  onClose: () => void
  fullScreen?: boolean
  isNPC?: boolean
}

export function InfoCard({ item, onClose, fullScreen = false, isNPC = false }: InfoCardProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isIframeLoaded, setIsIframeLoaded] = useState(false)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if ((event.data === "wordpress:render" || event.data === "v0map:shortcode-render" || event.data === "streamlit:render") && iframeRef.current) {
        setIsIframeLoaded(true)
      }
    }

    window.addEventListener("message", handleMessage)

    return () => {
      window.removeEventListener("message", handleMessage)
    }
  }, [])

  const handleIframeLoad = () => {
    setIsIframeLoaded(true)
  }

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center ${fullScreen ? "bg-black" : "bg-black/50"} z-50`}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-lg shadow-xl ${fullScreen ? "w-full h-full" : "p-6 max-w-4xl w-full mx-4"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{isNPC ? `Conversation with ${item.title}` : item.title}</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800 transition-colors" aria-label="Close">
            <X size={24} />
          </button>
        </div>
        <p className="mb-2 text-gray-600">{item.description}</p>
        {item.shortcode && <code className="mb-4 block rounded bg-gray-100 px-3 py-2 text-sm text-gray-700">{item.shortcode}</code>}
        <div
          className={`${fullScreen ? "h-[calc(100vh-120px)]" : "aspect-video"} w-full rounded-lg overflow-hidden shadow-lg bg-gray-200 relative`}
        >
          {!isIframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={item.liveUrl || item.streamlitUrl}
            className={`w-full h-full border-0 ${isIframeLoaded ? "opacity-100" : "opacity-0"}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={handleIframeLoad}
          />
        </div>
      </div>
    </div>
  )
}
