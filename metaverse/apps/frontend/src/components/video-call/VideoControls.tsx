import { useMedia } from "../../contexts/MediaContext"

// Create custom icon components using SVG directly
const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" x2="12" y1="19" y2="22"></line>
  </svg>
)

const MicOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" x2="22" y1="2" y2="22"></line>
    <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"></path>
    <path d="M5 10v2a7 7 0 0 0 12 0v-2"></path>
    <path d="M12 19v3"></path>
    <path d="M8 22h8"></path>
    <path d="M15 6a3 3 0 0 1-1.89 2.78"></path>
    <path d="M8.59 8.59A3 3 0 0 1 9 5v7c0 .13.01.26.04.39"></path>
    <path d="M12 15c.35 0 .69-.07 1-.18"></path>
  </svg>
)

const VideoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 8-6 4 6 4V8Z"></path>
    <rect width="14" height="12" x="2" y="6" rx="2" ry="2"></rect>
  </svg>
)

const VideoOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" x2="22" y1="2" y2="22"></line>
    <path d="M10.66 6H14a2 2 0 0 1 2 2v2.34l1 1L22 8v8"></path>
    <rect width="14" height="12" x="2" y="6" rx="2" ry="2"></rect>
  </svg>
)

export default function VideoControls() {
  const { isAudioEnabled, isVideoEnabled, toggleAudio, toggleVideo } = useMedia()

  return (
    <div className="flex justify-center mt-3 gap-2">
      <button
        onClick={toggleAudio}
        className={`p-2.5 rounded-full transition-all duration-200 flex items-center justify-center
                  ${isAudioEnabled ? "bg-gray-700/70 hover:bg-gray-600/70" : "bg-red-600/80 hover:bg-red-700/80"}`}
        title={isAudioEnabled ? "Mute" : "Unmute"}
      >
        {isAudioEnabled ? <MicIcon /> : <MicOffIcon />}
      </button>

      <button
        onClick={toggleVideo}
        className={`p-2.5 rounded-full transition-all duration-200 flex items-center justify-center
                  ${isVideoEnabled ? "bg-gray-700/70 hover:bg-gray-600/70" : "bg-red-600/80 hover:bg-red-700/80"}`}
        title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
      >
        {isVideoEnabled ? <VideoIcon /> : <VideoOffIcon />}
      </button>
    </div>
  )
}