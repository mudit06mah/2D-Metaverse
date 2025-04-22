import { useRef, useEffect } from "react"

interface RemoteVideoProps {
  userId: string
  stream: MediaStream
  visible: boolean
}

export default function RemoteVideo({ userId, stream, visible }: RemoteVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div
      className={`relative w-[240px] h-[180px] rounded-lg overflow-hidden bg-gray-900 border border-gray-700/50
                 transition-all duration-500 ease-in-out transform
                 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
    >
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md">
        {userId.substring(0, 8)}
      </div>

      {/* Audio indicator - this would need logic to detect if audio is active */}
      <div className="absolute top-2 right-2 flex space-x-1">
        <div className="w-1.5 h-3 bg-green-500/70 rounded-sm animate-pulse"></div>
        <div className="w-1.5 h-4 bg-green-500/70 rounded-sm animate-pulse" style={{ animationDelay: "0.2s" }}></div>
        <div className="w-1.5 h-2 bg-green-500/70 rounded-sm animate-pulse" style={{ animationDelay: "0.4s" }}></div>
      </div>
    </div>
  )
}
