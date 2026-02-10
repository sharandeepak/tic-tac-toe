'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { PresentationMode } from '@/components/PresentationMode'

function PresentationContent() {
  const searchParams = useSearchParams()
  const gameId = searchParams.get('gameId') || 'tic-tac-toe-game'

  return <PresentationMode gameId={gameId} />
}

export default function PresentationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="text-center">
            <p className="text-slate-600 text-lg">Loading presentation...</p>
          </div>
        </div>
      }
    >
      <PresentationContent />
    </Suspense>
  )
}
