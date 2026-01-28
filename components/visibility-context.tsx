"use client"

import type React from "react"

import { createContext, useContext, useState } from "react"

type VisibilityContextType = {
  showContent: boolean
  setShowContent: (show: boolean) => void
}

const VisibilityContext = createContext<VisibilityContextType>({
  showContent: false,
  setShowContent: () => {},
})

export function VisibilityProvider({ children }: { children: React.ReactNode }) {
  const [showContent, setShowContent] = useState(false)

  return <VisibilityContext.Provider value={{ showContent, setShowContent }}>{children}</VisibilityContext.Provider>
}

export const useVisibility = () => useContext(VisibilityContext)

