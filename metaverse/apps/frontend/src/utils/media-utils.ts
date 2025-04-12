export async function getLocalMediaStream(video = true, audio = true): Promise<MediaStream | null> {
  try {
    const constraints = {
      audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
      video: video ? { width: 320, height: 240, facingMode: "user" } : false,
    }

    return await navigator.mediaDevices.getUserMedia(constraints)
  } catch (error) {
    console.error("Error accessing media devices:", error)
    return null
  }
}

export function stopMediaStream(stream: MediaStream | null) {
  if (!stream) return

  stream.getTracks().forEach((track) => {
    track.stop()
  })
}