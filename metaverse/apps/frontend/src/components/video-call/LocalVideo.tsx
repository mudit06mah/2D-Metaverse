import { useRef, useEffect } from "react"
import { useMedia } from "../../contexts/MediaContext"

export default function LocalVideo() {
  const { localStream, isVideoEnabled } = useMedia()
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream
    }
  }, [localStream])

  return (
    <div className=" max-w-[200px] max-h-[100px] w-[160px] h-[120px] rounded-md overflow-hidden bg-gray-900">
      {isVideoEnabled ? (
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <span className="text-white text-xs">Camera Off</span>
        </div>
      )}
      <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">You</div>
    </div>
  )
}