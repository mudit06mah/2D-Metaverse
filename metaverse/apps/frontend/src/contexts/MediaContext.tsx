import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getLocalMediaStream, stopMediaStream } from "../utils/media-utils"
import type { MediasoupClient } from "../mediasoup/client"

interface MediaContextProps {
  localStream: MediaStream | null
  remoteStreams: Map<string, MediaStream>
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  toggleAudio: () => void
  toggleVideo: () => void
  setMediasoupClient: (client: MediasoupClient | null) => void
  addOrUpdateRemoteStream: (userId: string, track: MediaStreamTrack) => void
  removeRemoteStream: (userId: string) => void
}

const MediaContext = createContext<MediaContextProps | undefined>(undefined)

export function MediaProvider({ children }: { children: ReactNode }) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map())
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [mediasoupClient, setMediasoupClient] = useState<MediasoupClient | null>(null)

  useEffect(() => {
    async function initLocalStream() {
      try {
        const stream = await getLocalMediaStream(true, true)
        setLocalStream(stream)
      } catch (error) {
        console.error("Failed to get local media stream:", error)
        // Try again with just audio if video fails
        try {
          const audioOnlyStream = await getLocalMediaStream(false, true)
          setLocalStream(audioOnlyStream)
          setIsVideoEnabled(false)
        } catch (audioError) {
          console.error("Failed to get audio-only stream:", audioError)
        }
      }
    }

    initLocalStream()

    return () => {
      stopMediaStream(localStream)
    }
  }, [])

  useEffect(() => {
    // Connect local stream to mediasoup
    async function setupMediasoupProducers() {
      try {
        if (!localStream || !mediasoupClient) {
          return
        }

        const audioTrack = localStream.getAudioTracks()[0]
        const videoTrack = localStream.getVideoTracks()[0]

        if (audioTrack) {
          await mediasoupClient.produceAudio(audioTrack);
          console.log("Producing Audio!");
        }

        if (videoTrack) {
          await mediasoupClient.produceVideo(videoTrack);
          console.log("Producing Video!");
        }
      } catch (error) {
        console.error("Error setting up mediasoup producers:", error)
      }
    }

    setupMediasoupProducers()
  }, [localStream, mediasoupClient])

  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks()
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsAudioEnabled(!isAudioEnabled)
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks()
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsVideoEnabled(!isVideoEnabled)
    }
  }

  function addOrUpdateRemoteStream(peerId:string, track: MediaStreamTrack) {
    setRemoteStreams(prev => {
      const newMap = new Map(prev);
      const stream = newMap.get(peerId) ?? new MediaStream();
      stream.addTrack(track);
      console.log(peerId,track);
      newMap.set(peerId, stream);
      return newMap;
    })
  }


  const removeRemoteStream = (userId: string) => {
    setRemoteStreams((prev) => {
      const newStreams = new Map(prev);
      const stream = newStreams.get(userId);
      if (stream) {
        stopMediaStream(stream);
        newStreams.delete(userId);
      }
      return newStreams
    })
  }

  return (
    <MediaContext.Provider
      value={{
        localStream,
        remoteStreams,
        isAudioEnabled,
        isVideoEnabled,
        toggleAudio,
        toggleVideo,
        setMediasoupClient,
        addOrUpdateRemoteStream,
        removeRemoteStream,
      }}
    >
      {children}
    </MediaContext.Provider>
  )
}

export function useMedia() {
  const context = useContext(MediaContext)
  if (context === undefined) {
    throw new Error("useMedia must be used within a MediaProvider")
  }
  return context
}
