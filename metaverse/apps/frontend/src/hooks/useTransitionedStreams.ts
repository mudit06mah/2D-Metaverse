import { useState, useEffect } from "react"

interface Streams {
  userId: string
  stream: MediaStream
  visible: boolean
}

export function useTransitionedStreams(remoteStreams: Map<string, MediaStream>) {
  const [existingStreams, setExistingStreams] = useState<Streams[]>([])

  useEffect(() => {
    // Handle new streams and updates
    const currentStreamIds = Array.from(remoteStreams.keys())
    const existingStreamIds = existingStreams.map((ts) => ts.userId)

    // Find new streams to add
    const newStreams = currentStreamIds.filter((id) => !existingStreamIds.includes(id));

    // Find streams to remove
    const streamsToRemove = existingStreamIds.filter((id) => !currentStreamIds.includes(id));

    // Update state with new streams (initially invisible)
    if (newStreams.length > 0) {
      setExistingStreams((prev) => [
        ...prev,
        ...newStreams.map((id) => ({
          userId: id,
          stream: remoteStreams.get(id)!,
          visible: false,
        })),
      ])

      // After a short delay, make them visible to trigger the transition
      setTimeout(() => {
        setExistingStreams((prev) =>
          prev.map((ts) => (newStreams.includes(ts.userId) ? { ...ts, visible: true } : ts)),
        )
      }, 50)
    }

    // Mark streams for removal (start fade-out)
    if (streamsToRemove.length > 0) {
      setExistingStreams((prev) =>
        prev.map((ts) => (streamsToRemove.includes(ts.userId) ? { ...ts, visible: false } : ts)),
      )

      // After transition completes, remove them completely
      setTimeout(() => {
        setExistingStreams((prev) => prev.filter((ts) => !streamsToRemove.includes(ts.userId)))
      }, 500) // Match this with the CSS transition duration
    }
  }, [remoteStreams])

  return existingStreams
}
