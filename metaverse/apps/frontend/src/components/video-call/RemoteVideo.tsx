import { useRef, useEffect } from "react"

interface RemoteVideoProps {
  userId: string
  stream: MediaStream
}

export default function RemoteVideo({ userId, stream }: RemoteVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div className="relative w-[160px] h-[120px] rounded-md overflow-hidden bg-gray-900">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
        {userId.substring(0, 8)}
      </div>
    </div>
  )
}