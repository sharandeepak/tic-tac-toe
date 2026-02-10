'use client'

import { useState, useRef, useEffect } from 'react'
import { useGameTheme, THEMES, type GameTheme } from './GameThemeContext'
import { Sun, Moon, Palette } from 'lucide-react'

export function ThemeSelector() {
  const { gameTheme, setGameTheme, isDark, toggleDark } = useGameTheme()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
    }
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="fixed top-4 right-4 z-50" ref={panelRef}>
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="game-surface rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:scale-105"
        style={{ color: 'var(--g-accent)' }}
        aria-label="Theme settings"
      >
        <Palette size={20} />
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-64 game-surface rounded-2xl shadow-2xl p-4 anim-slide-up"
        >
          {/* Dark/Light Toggle */}
          <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid var(--g-border)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--g-text)' }}>
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </span>
            <button
              onClick={toggleDark}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: 'var(--g-accent-bg)',
                color: 'var(--g-accent)',
              }}
            >
              {isDark ? <Sun size={14} /> : <Moon size={14} />}
              {isDark ? 'Light' : 'Dark'}
            </button>
          </div>

          {/* Theme Grid */}
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--g-text-3)' }}>
            Color Theme
          </p>
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setGameTheme(theme.id)}
                className={`
                  flex flex-col items-center gap-1 p-2 rounded-xl transition-all text-xs font-medium
                  ${gameTheme === theme.id ? 'ring-2 scale-105' : 'hover:scale-105 opacity-70 hover:opacity-100'}
                `}
                style={{
                  background: gameTheme === theme.id ? 'var(--g-accent-bg)' : 'transparent',
                  ringColor: gameTheme === theme.id ? 'var(--g-accent)' : 'transparent',
                  borderColor: gameTheme === theme.id ? 'var(--g-accent)' : 'transparent',
                  border: gameTheme === theme.id ? '2px solid var(--g-accent)' : '2px solid transparent',
                  color: 'var(--g-text)',
                }}
              >
                {/* Color Preview Dots */}
                <div className="flex gap-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: theme.xColor }}
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: theme.oColor }}
                  />
                </div>
                <span className="text-[10px] leading-tight">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
