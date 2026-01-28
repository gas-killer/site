"use client"

import { useMemo } from "react"

interface YouTubeVideoProps {
  videoId: string
  startTime?: number
  title?: string
}

export function YouTubeVideo({ videoId, startTime = 0, title = "YouTube Video" }: YouTubeVideoProps) {
  // Construct the URL with the start time parameter using useMemo instead of useState + useEffect
  const videoUrl = useMemo(() => {
    return `https://www.youtube.com/embed/${videoId}${startTime ? `?start=${startTime}` : ""}`
  }, [videoId, startTime])

  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg">
      {videoId && (
        <iframe
          src={videoUrl}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      )}
    </div>
  )
}

