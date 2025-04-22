import { useRef, useEffect } from "react"
import { useMedia } from "../../contexts/MediaContext"

export default function LocalVideo() {
  const { localStream, isVideoEnabled } = useMedia()
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && localStream && isVideoEnabled) {
      videoRef.current.srcObject = localStream
      videoRef.current.play()
      }
    }, [localStream, isVideoEnabled])

  return (
    <div className="relative w-[240px] h-[180px] rounded-lg overflow-hidden bg-gray-900 border border-gray-700/50">
      {isVideoEnabled && localStream ? (
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800/80">
          {/*<UserCircle2 size={48} className="text-gray-400 mb-2" />*/}
          <span className="text-white/80 text-xs">Camera Off</span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-green-500"></span>
        You
      </div>
    </div>
  )
}

