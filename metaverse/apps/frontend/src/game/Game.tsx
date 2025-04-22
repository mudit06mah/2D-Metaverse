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
  const {setMediasoupClient} = useMedia();
  const [localClient,setLocalClient] = useState<MediasoupClient|null>(null);

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
      const scene = gameInstanceRef.current!.scene.getScene("GameScene") as GameScene;
      if (scene) {
        clearInterval(interval);

        wsRef.current = new WebSocket("ws://localhost:3001");

        wsRef.current.onopen = () => {
          if (!wsRef.current) return;

          const onProduceTransportCreated = (client: MediasoupClient) => {
            setMediasoupClient(client);
          }
          
          const onUserIdRecieved = (userId: string) => {
            // Create MediasoupClient instance
            const client = new MediasoupClient(wsRef.current!, spaceId, userId,onProduceTransportCreated); 
            setLocalClient(client);

            // Store the client reference in the scene for proximity detection
            scene.setMediasoupClient(client);
          }

          scene.init({ wsClient: wsRef.current, token, spaceId, onUserIdRecieved});
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

        <VideoCallUI />
        {localClient && <MediasoupHandler mediasoupClient={localClient} />}
    </div>
  )
}

// This component handles the mediasoup integration
function MediasoupHandler({ mediasoupClient }: { mediasoupClient: MediasoupClient }) {
  const { addOrUpdateRemoteStream, removeRemoteStream } = useMedia()

  useEffect(() => {
    if (!mediasoupClient) return

    const handleNewConsumer = (consumer: Consumer, username: string) => {
      const { track } = consumer;

      addOrUpdateRemoteStream(username, track);

      consumer.on("trackended", () => {
        removeRemoteStream(username);
      })
    }

    const handleConsumerClosed = (producerId: string) => {

      removeRemoteStream(producerId);
    }

    mediasoupClient.setOnNewConsumer(handleNewConsumer);
    mediasoupClient.setOnConsumerClosed(handleConsumerClosed);

    return () => {
      // Clean up:
      mediasoupClient.setOnNewConsumer(null);
      mediasoupClient.setOnConsumerClosed(null);
    }
  }, [mediasoupClient, addOrUpdateRemoteStream, removeRemoteStream]);

  return null
}

