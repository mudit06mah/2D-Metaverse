import './App.css'
import Game from './game/Game'

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token') ?? "";
  const spaceId = urlParams.get('spaceId') ?? "";
  return (
    <>
      <Game token={token} spaceId={spaceId}/>
    </>
  )
}

export default App
