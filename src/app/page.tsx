"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useRouter } from 'next/navigation'


function createSessionId() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const numbers = "0123456789"
  let sessionId = ""
  for (let i = 0; i < 6; i++) {
    sessionId += i < 3 ? letters[Math.floor(Math.random() * letters.length)] : numbers[Math.floor(Math.random() * numbers.length)]
  }
  // add a dash in the middle
  sessionId = sessionId.slice(0, 3) + "-" + sessionId.slice(3)

  return sessionId
}

export default function Home() {
  const [gameCode, setGameCode] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
    if (value.length > 3) {
      value = value.slice(0, 3) + "-" + value.slice(3, 6)
    }
    setGameCode(value)
    setError("")
  }

  const handleJoinGame = () => {
    const pattern = /^[A-Z]{3}-\d{3}$/
    if (!pattern.test(gameCode)) {
      setError("Invalid game code format. Expected format: ABC-123")
    } else {
      // Proceed with joining the game
    }
  }

  const handleCreateLocalGame = () => {
    router.push('/singleplayer')
  }

  const handleCreateOnlineGame = () => {
    const randomCode = `SDC-${Math.floor(100 + Math.random() * 900)}`
    router.push(`/multiplayer/${randomCode}?player=p1&sessionId=${createSessionId()}`)
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 bg-dotted-pattern">
      <h1 className="mb-8 text-3xl font-bold">Welcome to the Dots and Dashes</h1>
      <div className="flex flex-col items-center gap-6">
        <Button className="w-40" onClick={handleCreateLocalGame}>Create Local Game</Button>
        <Button className="w-40" onClick={handleCreateOnlineGame}>Create Online Game</Button>
        <div className="w-full border-t border-gray-300 my-6"></div>
        <div className="flex flex-col items-center gap-3">
          <Input
            id="game-code"
            placeholder="ABC-123"
            className="w-64 text-center bg-white"
            value={gameCode}
            onChange={handleInputChange}
            maxLength={7}
          />
          {error && <p className="text-red-500">{error}</p>}
        </div>
        <Button className="w-40 " onClick={handleJoinGame}>Join a Game</Button>
      </div>
    </div>
  )
}
