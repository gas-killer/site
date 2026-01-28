"use client"

import { useEffect, useState } from "react"
import { useVisibility } from "./visibility-context"

export function Cover() {
  const [isVisible, setIsVisible] = useState(true)
  const [shouldRender, setShouldRender] = useState(true)
  const { setShowContent } = useVisibility()

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setShowContent(true) // Show the header as the cover starts to fade
      // Wait for the fade animation to complete before unmounting
      setTimeout(() => setShouldRender(false), 1000)
    }, 2000)

    return () => {
      clearTimeout(timer)
    }
  }, [setShowContent])

  if (!shouldRender) return null

  return (
    <div
      className={`fixed inset-0 z-50 bg-black transition-opacity duration-1000 ease-in-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <img
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-aTYxiWBdSQdtc0mKQtgcpqWyc4JxuM.png"
        alt="Gas Killer Cover"
        className="h-full w-full object-cover"
      />
    </div>
  )
}

