export type Mark = 'X' | 'O'
export type CellValue = 'X' | 'O' | ''

export interface MoveRecord {
  player: Mark
  cellIndex: number
  action: 'place' | 'replace'
  previousValue: CellValue // what was in the cell before ('' or opponent mark)
}

export interface GameState {
  board: CellValue[]
  lastPlayer: Mark // who made the last move (for display only, no turn enforcement)
  gameStatus: 'active' | 'finished'
  winner: Mark | ''
  playerX: string
  playerO: string
  lastMoveTime: number
  moveHistory: MoveRecord[] // for undo support in presentation mode
}

export const INITIAL_GAME_STATE: Omit<GameState, 'playerX' | 'playerO'> = {
  board: Array(9).fill(''),
  lastPlayer: 'O', // so display shows X as "next" logically
  gameStatus: 'active',
  winner: '',
  lastMoveTime: Date.now(),
  moveHistory: [],
}

export function checkWinner(board: CellValue[]): Mark | null {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]

  for (let line of lines) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as Mark
    }
  }
  return null
}

export function isBoardFull(board: CellValue[]): boolean {
  return board.every(cell => cell !== '')
}

export function makeMove(
  board: CellValue[],
  index: number,
  player: Mark
): CellValue[] {
  if (board[index] !== '') return board
  const newBoard = [...board]
  newBoard[index] = player
  return newBoard
}

export function getGameResult(
  board: CellValue[]
): 'win' | 'draw' | 'active' {
  const winner = checkWinner(board)
  if (winner) return 'win'
  if (isBoardFull(board)) return 'draw'
  return 'active'
}

/** Count how many marks a player currently has on the board */
export function countMarks(board: CellValue[], player: Mark): number {
  return board.filter(cell => cell === player).length
}
