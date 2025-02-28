import type React from "react"
import { useState } from "react"
import axios from "axios"

const AdminDashboard: React.FC = () => {
  const [elementName, setElementName] = useState("")
  const [elementWidth, setElementWidth] = useState("")
  const [elementHeight, setElementHeight] = useState("")
  const [elementImg, setElementImg] = useState("")
  const [isStatic, setIsStatic] = useState(false)

  const createElement = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await axios.post("/admin/element", {
        name: elementName,
        width: Number.parseInt(elementWidth),
        height: Number.parseInt(elementHeight),
        elementImg,
        static: isStatic,
      })
      console.log("Element created:", response.data)
      // Reset form or show success message
    } catch (error) {
      console.error("Error creating element:", error)
    }
  }

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <h3>Create Element</h3>
      <form onSubmit={createElement}>
        <input
          type="text"
          placeholder="Element Name"
          value={elementName}
          onChange={(e) => setElementName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Width"
          value={elementWidth}
          onChange={(e) => setElementWidth(e.target.value)}
        />
        <input
          type="number"
          placeholder="Height"
          value={elementHeight}
          onChange={(e) => setElementHeight(e.target.value)}
        />
        <input type="text" placeholder="Image URL" value={elementImg} onChange={(e) => setElementImg(e.target.value)} />
        <label>
          <input type="checkbox" checked={isStatic} onChange={(e) => setIsStatic(e.target.checked)} />
          Static
        </label>
        <button type="submit">Create Element</button>
      </form>
    </div>
  )
}

export default AdminDashboard

