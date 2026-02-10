import {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  off,
} from 'firebase/database'
import { database } from './firebase'
import {
  GameState,
  INITIAL_GAME_STATE,
  checkWinner,
  isBoardFull,
  Mark,
  CellValue,
  MoveRecord,
} from './game'

const GAME_REF = 'currentGame'

/**
 * Normalize game state coming from Firebase.
 * Firebase strips null/undefined values and can convert arrays to objects,
 * so we need to reconstruct the board and moveHistory properly.
 */
function normalizeGameState(data: any): GameState {
  // Reconstruct board: Firebase may return an object or a partial array
  let board: CellValue[] = Array(9).fill('')
  if (data.board) {
    if (Array.isArray(data.board)) {
      board = data.board.map((v: any) => (v === 'X' || v === 'O' ? v : ''))
      // Pad to 9 if needed
      while (board.length < 9) board.push('')
    } else if (typeof data.board === 'object') {
      // Firebase may store sparse arrays as objects like {0: "X", 4: "O"}
      for (let i = 0; i < 9; i++) {
        const val = data.board[i]
        board[i] = val === 'X' || val === 'O' ? val : ''
      }
    }
  }

  // Reconstruct moveHistory: Firebase strips empty arrays and may convert to object
  let moveHistory: MoveRecord[] = []
  if (data.moveHistory) {
    if (Array.isArray(data.moveHistory)) {
      moveHistory = data.moveHistory.map((m: any) => ({
        player: m.player || 'X',
        cellIndex: m.cellIndex ?? 0,
        action: m.action || 'place',
        previousValue: m.previousValue ?? '',
      }))
    } else if (typeof data.moveHistory === 'object') {
      // Firebase may store sparse arrays as objects
      const keys = Object.keys(data.moveHistory).map(Number).sort((a, b) => a - b)
      for (const key of keys) {
        const m = data.moveHistory[key]
        if (m) {
          moveHistory.push({
            player: m.player || 'X',
            cellIndex: m.cellIndex ?? 0,
            action: m.action || 'place',
            previousValue: m.previousValue ?? '',
          })
        }
      }
    }
  }

  return {
    board,
    lastPlayer: data.lastPlayer || data.currentPlayer || 'O',
    gameStatus: data.gameStatus || 'active',
    winner: data.winner || '',
    playerX: data.playerX || 'Player X',
    playerO: data.playerO || 'Player O',
    lastMoveTime: data.lastMoveTime || Date.now(),
    moveHistory,
  }
}

export async function createNewGame(
  playerXName: string,
  playerOName: string
): Promise<string> {
  const gameId = 'tic-tac-toe-game'

  const newGame: GameState = {
    ...INITIAL_GAME_STATE,
    playerX: playerXName,
    playerO: playerOName,
    lastMoveTime: Date.now(),
  }

  await set(ref(database, `${GAME_REF}/${gameId}`), newGame)
  return gameId
}

export async function getGameState(gameId: string): Promise<GameState | null> {
  const gameRef = ref(database, `${GAME_REF}/${gameId}`)
  const snapshot = await get(gameRef)
  if (!snapshot.exists()) return null
  return normalizeGameState(snapshot.val())
}

/**
 * Make a game move. No turn enforcement - either player can move at any time.
 * Rules:
 *  - Player can place on any empty cell
 *  - Player can replace any opponent's mark at any time
 */
export async function makeGameMove(
  gameId: string,
  cellIndex: number,
  player: Mark,
  action: 'place' | 'replace' = 'place'
): Promise<boolean> {
  try {
    const gameState = await getGameState(gameId)
    if (!gameState || gameState.gameStatus === 'finished') return false

    const newBoard = [...gameState.board]
    const opponent: Mark = player === 'X' ? 'O' : 'X'
    const previousValue = gameState.board[cellIndex]

    if (action === 'place') {
      // Can only place on empty cells
      if (gameState.board[cellIndex] !== '') return false
      newBoard[cellIndex] = player
    } else if (action === 'replace') {
      // Can replace opponent's marks at any time
      if (gameState.board[cellIndex] !== opponent) return false
      newBoard[cellIndex] = player
    }

    const winner = checkWinner(newBoard)
    const isFull = isBoardFull(newBoard)

    // Build the move record for undo
    const moveRecord: MoveRecord = {
      player,
      cellIndex,
      action,
      previousValue,
    }

    const newMoveHistory = [...gameState.moveHistory, moveRecord]

    const updates: Partial<GameState> = {
      board: newBoard,
      lastMoveTime: Date.now(),
      lastPlayer: player,
      moveHistory: newMoveHistory,
    }

    if (winner) {
      updates.gameStatus = 'finished'
      updates.winner = winner
    } else if (isFull) {
      // A full board doesn't mean a draw - players can always replace opponent marks.
      // Game only ends when there's a winner.
    }

    await update(ref(database, `${GAME_REF}/${gameId}`), updates)
    return true
  } catch (error) {
    console.error('Error making move:', error)
    return false
  }
}

/**
 * Undo the last move. Used by presentation mode.
 * Pops the last move from history and restores the board.
 */
export async function undoLastMove(gameId: string): Promise<boolean> {
  try {
    const gameState = await getGameState(gameId)
    if (!gameState || gameState.moveHistory.length === 0) return false

    const newHistory = [...gameState.moveHistory]
    const lastMove = newHistory.pop()!

    // Restore the board
    const newBoard = [...gameState.board]
    newBoard[lastMove.cellIndex] = lastMove.previousValue

    // Recalculate game status
    const winner = checkWinner(newBoard)

    const updates: Partial<GameState> = {
      board: newBoard,
      moveHistory: newHistory,
      lastMoveTime: Date.now(),
      gameStatus: winner ? 'finished' : 'active',
      winner: winner || '',
    }

    // Update lastPlayer to the previous move's player (if any)
    if (newHistory.length > 0) {
      updates.lastPlayer = newHistory[newHistory.length - 1].player
    } else {
      updates.lastPlayer = 'O' // reset to initial
    }

    await update(ref(database, `${GAME_REF}/${gameId}`), updates)
    return true
  } catch (error) {
    console.error('Error undoing move:', error)
    return false
  }
}

export async function resetGame(gameId: string): Promise<void> {
  try {
    const currentGame = await getGameState(gameId)
    if (currentGame) {
      const resetState: GameState = {
        ...INITIAL_GAME_STATE,
        playerX: currentGame.playerX,
        playerO: currentGame.playerO,
        lastMoveTime: Date.now(),
      }
      await set(ref(database, `${GAME_REF}/${gameId}`), resetState)
    }
  } catch (error) {
    console.error('Error resetting game:', error)
  }
}

export async function deleteGame(gameId: string): Promise<void> {
  try {
    await remove(ref(database, `${GAME_REF}/${gameId}`))
  } catch (error) {
    console.error('Error deleting game:', error)
  }
}

export async function deleteAllGames(): Promise<void> {
  try {
    await remove(ref(database, GAME_REF))
  } catch (error) {
    console.error('Error deleting all games:', error)
  }
}

export function subscribeToGame(
  gameId: string,
  callback: (gameState: GameState | null) => void
): () => void {
  const gameRef = ref(database, `${GAME_REF}/${gameId}`)

  const unsubscribe = onValue(gameRef, snapshot => {
    if (snapshot.exists()) {
      callback(normalizeGameState(snapshot.val()))
    } else {
      callback(null)
    }
  })

  return () => {
    off(gameRef)
    unsubscribe()
  }
}
