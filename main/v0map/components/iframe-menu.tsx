"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { InfoCard } from "./info-card"

interface IframeMenuItem {
  title: string
  description: string
  streamlitUrl?: string
  liveUrl?: string
  shortcode?: string
}

interface IframeMenuProps {
  items: IframeMenuItem[]
  onClose: () => void
}

export function IframeMenu({ items, onClose }: IframeMenuProps) {
  const [selectedItem, setSelectedItem] = useState<IframeMenuItem | null>(null)

  return (
    <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">Live WordPress Shortcode Displays</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <button
              key={index}
              className="bg-white rounded-lg p-4 text-left hover:bg-gray-100 transition-colors"
              onClick={() => setSelectedItem(item)}
            >
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
            </button>
          ))}
        </div>
      </div>
      {selectedItem && <InfoCard item={selectedItem} onClose={() => setSelectedItem(null)} fullScreen />}
    </div>
  )
}
