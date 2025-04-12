import { useMedia } from "../../contexts/MediaContext"
import LocalVideo from "./LocalVideo"
import RemoteVideo from "./RemoteVideo"
import VideoControls from "./VideoControls"

export default function VideoCallUI() {
  const { remoteStreams } = useMedia()
  const hasRemoteStreams = remoteStreams.size > 0

  return (

      <div
        className={`bg-black/70 rounded-lg p-2 transition-all duration-300 w-full h-[300px]`}
      >
        <div className="relative flex gap-2 items-start w-[200px]">
          <LocalVideo />

          {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
            <RemoteVideo key={userId} userId={userId} stream={stream} />
          ))}
        </div>

        {/*<VideoControls /> */}
      </div>
   
  )
}
