import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { GameThemeProvider } from '@/components/GameThemeContext'
import { ThemeSelector } from '@/components/ThemeSelector'

import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'Tic Tac Toe | Play with Friends',
  description: 'Play Tic Tac Toe with a friend on different devices. Real-time gameplay powered by Firebase.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-game-theme="neon" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <GameThemeProvider>
          <ThemeSelector />
          {children}
        </GameThemeProvider>
      </body>
    </html>
  )
}
