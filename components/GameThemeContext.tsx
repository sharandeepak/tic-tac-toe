'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'

export type GameTheme = 'neon' | 'ocean' | 'sunset' | 'royal' | 'forest' | 'candy'

export interface ThemeInfo {
  id: GameTheme
  name: string
  emoji: string
  xColor: string
  oColor: string
  accent: string
}

export const THEMES: ThemeInfo[] = [
  { id: 'neon', name: 'Neon Arcade', emoji: '🕹️', xColor: '#06b6d4', oColor: '#ec4899', accent: '#06b6d4' },
  { id: 'ocean', name: 'Ocean', emoji: '🌊', xColor: '#2563eb', oColor: '#0d9488', accent: '#2563eb' },
  { id: 'sunset', name: 'Sunset', emoji: '🌅', xColor: '#f59e0b', oColor: '#e11d48', accent: '#f59e0b' },
  { id: 'royal', name: 'Royal', emoji: '👑', xColor: '#7c3aed', oColor: '#ca8a04', accent: '#7c3aed' },
  { id: 'forest', name: 'Forest', emoji: '🌲', xColor: '#059669', oColor: '#d97706', accent: '#059669' },
  { id: 'candy', name: 'Candy', emoji: '🍬', xColor: '#db2777', oColor: '#0284c7', accent: '#db2777' },
]

interface GameThemeContextType {
  gameTheme: GameTheme
  setGameTheme: (theme: GameTheme) => void
  isDark: boolean
  toggleDark: () => void
  currentThemeInfo: ThemeInfo
}

const GameThemeContext = createContext<GameThemeContextType | null>(null)

export function GameThemeProvider({ children }: { children: ReactNode }) {
  const [gameTheme, setGameThemeState] = useState<GameTheme>('neon')
  const [isDark, setIsDark] = useState(false)
  // Initialize from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('game-theme') as GameTheme | null
    const savedDark = localStorage.getItem('game-dark')

    if (savedTheme && THEMES.some((t) => t.id === savedTheme)) {
      setGameThemeState(savedTheme)
      document.documentElement.setAttribute('data-game-theme', savedTheme)
    } else {
      document.documentElement.setAttribute('data-game-theme', 'neon')
    }

    if (savedDark === 'true') {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const setGameTheme = useCallback((theme: GameTheme) => {
    setGameThemeState(theme)
    localStorage.setItem('game-theme', theme)
    document.documentElement.setAttribute('data-game-theme', theme)
  }, [])

  const toggleDark = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev
      localStorage.setItem('game-dark', String(next))
      if (next) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      return next
    })
  }, [])

  const currentThemeInfo = THEMES.find((t) => t.id === gameTheme) || THEMES[0]

  return (
    <GameThemeContext.Provider
      value={{ gameTheme, setGameTheme, isDark, toggleDark, currentThemeInfo }}
    >
      {children}
    </GameThemeContext.Provider>
  )
}

export function useGameTheme() {
  const ctx = useContext(GameThemeContext)
  if (!ctx) {
    throw new Error('useGameTheme must be used within a GameThemeProvider')
  }
  return ctx
}
