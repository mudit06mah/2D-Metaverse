import { useState, useEffect } from "react"
import axios from "axios"

const UserDashboard: React.FC = () => {
  const [avatars, setAvatars] = useState([])
  const [selectedAvatarId, setSelectedAvatarId] = useState("")

  useEffect(() => {
    fetchAvatars()
  }, [])

  const fetchAvatars = async () => {
    try {
      const response = await axios.get("/avatars")
      setAvatars(response.data.avatars)
    } catch (error) {
      console.error("Error fetching avatars:", error)
    }
  }

  const updateUserMetadata = async () => {
    try {
      await axios.post("/user/metadata", { avatarId: selectedAvatarId })
      alert("User metadata updated successfully")
    } catch (error) {
      console.error("Error updating user metadata:", error)
    }
  }

  return (
    <div>
      <h2>User Dashboard</h2>
      <h3>Select Avatar</h3>
      <select value={selectedAvatarId} onChange={(e) => setSelectedAvatarId(e.target.value)}>
        <option value="">Select an avatar</option>
        {avatars.map((avatar: any) => (
          <option key={avatar.id} value={avatar.id}>
            {avatar.name}
          </option>
        ))}
      </select>
      <button onClick={updateUserMetadata}>Update Avatar</button>
    </div>
  )
}

export default UserDashboard

