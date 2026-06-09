export const GOMOKU_BOARD_SIZE = 11;
export const GOMOKU_EMPTY_CELL = 0;
export const GOMOKU_PLAYER_PIECE = 1;
export const GOMOKU_AI_PIECE = 2;
export const GOMOKU_DRAW = 3;

export type GomokuBoard = number[][];

export interface GomokuWinResult {
  hasWin: boolean;
  cells: [number, number][];
}

export function createEmptyGomokuBoard(size = GOMOKU_BOARD_SIZE): GomokuBoard {
  return Array(size).fill(null).map(() => Array(size).fill(GOMOKU_EMPTY_CELL));
}

export function checkGomokuDraw(board: GomokuBoard): boolean {
  return board.every(row => row.every(cell => cell !== GOMOKU_EMPTY_CELL));
}

export function checkGomokuWin(
  row: number,
  col: number,
  piece: number,
  board: GomokuBoard
): GomokuWinResult {
  const boardSize = board.length;
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (const [dr, dc] of directions) {
    let count = 1;
    const cells: [number, number][] = [[row, col]];

    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < boardSize && c >= 0 && c < boardSize && board[r][c] === piece) {
      count++;
      cells.push([r, c]);
      r += dr;
      c += dc;
    }

    r = row - dr;
    c = col - dc;
    while (r >= 0 && r < boardSize && c >= 0 && c < boardSize && board[r][c] === piece) {
      count++;
      cells.push([r, c]);
      r -= dr;
      c -= dc;
    }

    if (count >= 5) {
      return { hasWin: true, cells };
    }
  }

  return { hasWin: false, cells: [] };
}
