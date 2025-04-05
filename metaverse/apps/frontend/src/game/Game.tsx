import { useEffect, useRef } from "react"
import Phaser from "phaser"
import { GameScene } from "./game-scene.ts"

interface GameProps {
  token: string
  spaceId: string
}

export default function Game({ token = "", spaceId = "" }: GameProps) {
  const gameRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const gameInstanceRef = useRef<Phaser.Game | null>(null)

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
          gravity: { x:0,y: 0 },
          debug: false,
        },
      },
      scene: GameScene,
      audio:{
        disableWebAudio: true
      }
    }

    // Create game instance
    gameInstanceRef.current = new Phaser.Game(config)

    //waiting for scene:
    let interval = setInterval(()=>{
      const scene = gameInstanceRef.current!.scene.getScene("GameScene") as GameScene
      if (scene) {
        clearInterval(interval);

        wsRef.current = new WebSocket("ws://localhost:3001");

        wsRef.current.onopen = () => {
          if(!wsRef.current)  return;
          console.log("Scene init");
          scene.init({ wsClient: wsRef.current, token, spaceId })
        }
        
      }
    },1000)

    window.addEventListener("unload",()=>{
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
    <div className="w-full h-screen">
      <div ref={gameRef} className="w-full h-full" />
    </div>
  )
}

