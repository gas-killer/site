"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useVisibility } from "./visibility-context"

export function Cover() {
  const [isVisible, setIsVisible] = useState(true)
  const [shouldRender, setShouldRender] = useState(true)
  const { setShowContent } = useVisibility()

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setShowContent(true)
      setTimeout(() => setShouldRender(false), 1000)
    }, 1800)

    return () => clearTimeout(timer)
  }, [setShowContent])

  if (!shouldRender) return null

  return (
    <div
      className={`fixed inset-0 z-50 bg-black flex items-center justify-center transition-opacity duration-1000 ease-in-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <Image
        src="/brand/gk-eclipse.png"
        alt="Gas Killer"
        width={720}
        height={720}
        priority
        className="w-[min(80vw,720px)] h-auto"
      />
    </div>
  )
}
