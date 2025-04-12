"use client"

import { useMedia } from "../../contexts/MediaContext"
import { Mic, MicOff, Video, VideoOff } from "lucide-react"

export default function VideoControls() {
  const { isAudioEnabled, isVideoEnabled, toggleAudio, toggleVideo } = useMedia()

  return (
    <div className="flex justify-center mt-2 gap-2">
      <button
        onClick={toggleAudio}
        className={`p-2 rounded-full ${isAudioEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"}`}
        title={isAudioEnabled ? "Mute" : "Unmute"}
      >
        {isAudioEnabled ? (
          <span className="flex items-center justify-center">
            <Mic size={16} className="text-white" />
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <MicOff size={16} className="text-white" />
          </span>
        )}
      </button>

      <button
        onClick={toggleVideo}
        className={`p-2 rounded-full ${isVideoEnabled ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"}`}
        title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
      >
        {isVideoEnabled ? (
          <span className="flex items-center justify-center">
            <Video size={16} className="text-white" />
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <VideoOff size={16} className="text-white" />
          </span>
        )}
      </button>
    </div>
  )
}
