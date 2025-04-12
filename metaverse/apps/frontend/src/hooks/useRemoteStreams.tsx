import { useEffect } from "react"
import { useMedia } from "../contexts/MediaContext.tsx"
import type { MediasoupClient } from "../mediasoup/client.ts"
import type { Consumer } from "mediasoup-client/lib/types.ts"

export function useRemoteStreams(mediasoupClient: MediasoupClient | null) {
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
}

