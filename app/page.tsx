'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Gamepad2, Users, Monitor, Zap, ArrowRight, Sparkles } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [player1Name, setPlayer1Name] = useState('')
  const [player2Name, setPlayer2Name] = useState('')

  const handleStartGame = () => {
    if (player1Name.trim() && player2Name.trim()) {
      const params = new URLSearchParams({
        player: player1Name.trim(),
        opponent: player2Name.trim(),
      })
      router.push(`/play?${params.toString()}`)
    }
  }

  const handleOpenPresentation = () => {
    router.push('/present')
  }

  return (
    <div className="game-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Animated Header */}
        <div className="text-center mb-10 anim-slide-up">
          {/* Floating Game Icon */}
          <div className="inline-flex items-center justify-center mb-4 anim-float">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: 'var(--g-accent)', boxShadow: '0 0 30px var(--g-glow)' }}
            >
              <Gamepad2 size={40} className="text-white" />
            </div>
          </div>

          <h1
            className="text-5xl font-extrabold tracking-tight mb-3"
            style={{ color: 'var(--g-text)' }}
          >
            Tic Tac Toe
          </h1>
          <p className="text-lg font-medium" style={{ color: 'var(--g-text-2)' }}>
            Challenge your friend in real-time
          </p>
        </div>

        {/* Game Setup Card */}
        <div
          className="game-surface rounded-3xl p-8 shadow-xl mb-6 anim-slide-up"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Zap size={20} style={{ color: 'var(--g-accent)' }} />
            <h2 className="text-xl font-bold" style={{ color: 'var(--g-text)' }}>
              New Game
            </h2>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--g-text-2)' }}
              >
                Player 1
              </label>
              <input
                type="text"
                value={player1Name}
                onChange={(e) => setPlayer1Name(e.target.value)}
                placeholder="Enter your name"
                className="game-input w-full px-4 py-3 rounded-xl text-base"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleStartGame()
                }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--g-text-2)' }}
              >
                Player 2
              </label>
              <input
                type="text"
                value={player2Name}
                onChange={(e) => setPlayer2Name(e.target.value)}
                placeholder="Enter opponent name"
                className="game-input w-full px-4 py-3 rounded-xl text-base"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleStartGame()
                }}
              />
            </div>
          </div>

          <button
            onClick={handleStartGame}
            disabled={!player1Name.trim() || !player2Name.trim()}
            className="game-btn-primary w-full px-6 py-4 rounded-xl text-lg flex items-center justify-center gap-2"
          >
            Start Game
            <ArrowRight size={20} />
          </button>
        </div>

        {/* How to Play */}
        <div
          className="game-surface rounded-3xl p-6 shadow-xl mb-6 anim-slide-up"
          style={{ animationDelay: '0.2s' }}
        >
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--g-text)' }}>
            How to Play
          </h3>
          <div className="space-y-3">
            {[
              { icon: <Zap size={16} />, text: 'Enter both player names and start the game' },
              { icon: <Sparkles size={16} />, text: 'Player 1 picks X or O, then copies the link' },
              { icon: <Users size={16} />, text: 'Player 2 opens the shared link on their device' },
              { icon: <Gamepad2 size={16} />, text: 'Take turns placing marks to win!' },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'var(--g-accent-bg)', color: 'var(--g-accent)' }}
                >
                  {step.icon}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--g-text-2)' }}>
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Presentation Mode Card */}
        <div
          className="rounded-3xl p-6 shadow-xl anim-slide-up"
          style={{
            animationDelay: '0.3s',
            background: 'var(--g-accent-bg)',
            border: '2px solid var(--g-accent)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Monitor size={20} style={{ color: 'var(--g-accent)' }} />
            <h3 className="text-lg font-bold" style={{ color: 'var(--g-text)' }}>
              Presentation Mode
            </h3>
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--g-text-2)' }}>
            Display the game on a projector or big screen. Auto-updates in real-time.
          </p>
          <button
            onClick={handleOpenPresentation}
            className="w-full px-5 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ background: 'var(--g-text)' }}
          >
            <Monitor size={18} />
            Open Presentation
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 mb-4">
          <p className="text-xs" style={{ color: 'var(--g-text-3)' }}>
            Real-time sync powered by Firebase
          </p>
        </div>
      </div>
    </div>
  )
}
