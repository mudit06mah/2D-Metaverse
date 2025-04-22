import { useMedia } from "../../contexts/MediaContext"
import LocalVideo from "./LocalVideo"
import RemoteVideo from "./RemoteVideo"
import VideoControls from "./VideoControls"
import { useTransitionedStreams } from "../../hooks/useTransitionedStreams"
import { useState } from "react"

export default function VideoCallUI() {
  const { remoteStreams, isAudioEnabled, isVideoEnabled } = useMedia()
  const transitionedStreams = useTransitionedStreams(remoteStreams)
  const hasRemoteStreams = transitionedStreams.length > 0
  const [minimized, setMinimized] = useState(false)

  return (
    <div className="fixed top-2 right-2 z-50 transition-all duration-300">
      <div
        className={`bg-black/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700/50 
                   transition-all duration-300 ease-in-out overflow-hidden
                   ${minimized ? "w-[60px] h-[60px]" : "p-3"}`}
      >
        {/* Header with user count and minimize button */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setMinimized(!minimized)}
            className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs font-medium transition-colors"
          >
            {minimized ? (
              <div className="w-[60px] h-[60px] flex items-center justify-center">
                {hasRemoteStreams && (
                  <span className="absolute top-1 right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {transitionedStreams.length}
                  </span>
                )}
              </div>
            ) : (
              <>
                <span>{hasRemoteStreams ? `${transitionedStreams.length} nearby` : "No users nearby"}</span>
              </>
            )}
          </button>

          {!minimized && (
            <div className="flex gap-1">
              {!isAudioEnabled && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
              {!isVideoEnabled && <div className="w-2 h-2 rounded-full bg-yellow-500"></div>}
            </div>
          )}
        </div>

        {/* Video grid */}
        {!minimized && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-[600px]">
              <LocalVideo />

              {transitionedStreams.map(({ userId, stream, visible }) => (
                <RemoteVideo key={userId} userId={userId} stream={stream} visible={visible} />
              ))}
            </div>

            <VideoControls />
          </>
        )}
      </div>
    </div>
  )
}
