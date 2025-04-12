import { useEffect, useRef, useState } from "react"
import Phaser from "phaser"
import { GameScene } from "./game-scene.ts"
import { MediaProvider } from "../contexts/MediaContext.tsx"
import VideoCallUI from "../components/video-call/VideoCallUI"
import { MediasoupClient } from "../mediasoup/client.ts"
import { useMedia } from "../contexts/MediaContext.tsx"
import type { Consumer } from "mediasoup-client/lib/types"

interface GameProps {
  token: string
  spaceId: string
}

// This is the main component that will be exported
export default function Game({ token = "", spaceId = "" }: GameProps) {
  return (
    <MediaProvider>
      <GameContent token={token} spaceId={spaceId} />
    </MediaProvider>
  )
}

function GameContent({ token, spaceId }: GameProps) {
  const gameRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const gameInstanceRef = useRef<Phaser.Game | null>(null)
  const [mediasoupClient, setMediasoupClient] = useState<MediasoupClient | null>(null)

  useEffect(() => {
    if (!gameRef.current) return

    // Initialize Phaser
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      backgroundColor: "#ffffff",
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: "100vw",
        height: "100vh",
      },
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: GameScene,
      audio: {
        disableWebAudio: true,
      },
    }

    // Create game instance
    gameInstanceRef.current = new Phaser.Game(config)

    // Waiting for scene:
    const interval = setInterval(() => {
      const scene = gameInstanceRef.current!.scene.getScene("GameScene") as GameScene
      if (scene) {
        clearInterval(interval)

        wsRef.current = new WebSocket("ws://localhost:3001")

        wsRef.current.onopen = () => {
          if (!wsRef.current) return
          console.log("Scene init")
          scene.init({ wsClient: wsRef.current, token, spaceId })

          // Create MediasoupClient instance
          const client = new MediasoupClient(wsRef.current, spaceId, token)
          setMediasoupClient(client)

          // Store the client reference in the scene for proximity detection
          scene.setMediasoupClient(client)
        }
      }
    }, 1000)

    window.addEventListener("unload", () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true)
      }
    })

    // Cleanup
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true)
      }
    }
  }, [token, spaceId])

  return (
    <div className="w-full h-screen relative overflow-hidden">
      <div ref={gameRef} className="w-full h-full" />
      <div className="fixed top-2 right-2 left-2 w-[10%] h-[10%] bg-amber-600">
        <VideoCallUI />
      </div>
      
      {mediasoupClient && <MediasoupHandler mediasoupClient={mediasoupClient} />}
    </div>
  )
}

// This component handles the mediasoup integration
function MediasoupHandler({ mediasoupClient }: { mediasoupClient: MediasoupClient }) {
  // Now this hook is safely used within the MediaProvider context
  const { addRemoteStream, removeRemoteStream } = useMedia()

  useEffect(() => {
    if (!mediasoupClient) return

    const handleNewConsumer = (consumer: Consumer, peerId: string) => {
      const { track } = consumer
      const stream = new MediaStream([track])

      addRemoteStream(peerId, stream)

      consumer.on("trackended", () => {
        removeRemoteStream(peerId)
      })
    }

    const handleConsumerClosed = (consumerId: string) => {
      // Since we don't have a direct mapping from consumerId to peerId,
      // we might need to implement a more sophisticated tracking mechanism
      // For now, we'll just log it
      console.log("Consumer closed:", consumerId)
    }

    mediasoupClient.setOnNewConsumer(handleNewConsumer)
    mediasoupClient.setOnConsumerClosed(handleConsumerClosed)

    return () => {
      // Clean up by setting null callbacks
      mediasoupClient.setOnNewConsumer(null)
      mediasoupClient.setOnConsumerClosed(null)
    }
  }, [mediasoupClient, addRemoteStream, removeRemoteStream])

  return null
}

