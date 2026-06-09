import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GOMOKU_AI_PIECE,
  GOMOKU_PLAYER_PIECE,
  checkGomokuDraw,
  checkGomokuWin,
  createEmptyGomokuBoard,
} from '../src/utils/gomokuRules.ts';

describe('gomoku rules', () => {
  it('detects horizontal, vertical, and diagonal wins', () => {
    const horizontal = createEmptyGomokuBoard();
    for (let c = 2; c <= 6; c++) horizontal[4][c] = GOMOKU_PLAYER_PIECE;
    assert.equal(checkGomokuWin(4, 4, GOMOKU_PLAYER_PIECE, horizontal).hasWin, true);

    const vertical = createEmptyGomokuBoard();
    for (let r = 1; r <= 5; r++) vertical[r][8] = GOMOKU_AI_PIECE;
    assert.equal(checkGomokuWin(3, 8, GOMOKU_AI_PIECE, vertical).hasWin, true);

    const diagonal = createEmptyGomokuBoard();
    for (let step = 0; step < 5; step++) diagonal[step + 2][step + 3] = GOMOKU_PLAYER_PIECE;
    assert.equal(checkGomokuWin(4, 5, GOMOKU_PLAYER_PIECE, diagonal).hasWin, true);

    const antiDiagonal = createEmptyGomokuBoard();
    for (let step = 0; step < 5; step++) antiDiagonal[step + 1][8 - step] = GOMOKU_AI_PIECE;
    assert.equal(checkGomokuWin(3, 6, GOMOKU_AI_PIECE, antiDiagonal).hasWin, true);
  });

  it('does not treat four in a row as a win', () => {
    const board = createEmptyGomokuBoard();
    for (let c = 0; c < 4; c++) board[0][c] = GOMOKU_PLAYER_PIECE;

    const result = checkGomokuWin(0, 3, GOMOKU_PLAYER_PIECE, board);

    assert.equal(result.hasWin, false);
    assert.deepEqual(result.cells, []);
  });

  it('detects a full-board draw without a five-piece line', () => {
    const drawBoard = [
      [1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1],
      [2, 1, 2, 1, 1, 2, 2, 1, 1, 1, 1],
      [2, 1, 2, 2, 2, 1, 2, 1, 2, 1, 2],
      [2, 2, 1, 2, 1, 1, 2, 2, 2, 1, 2],
      [2, 2, 1, 2, 1, 1, 2, 1, 1, 2, 2],
      [1, 2, 1, 1, 2, 1, 1, 2, 2, 1, 1],
      [1, 1, 2, 1, 1, 2, 1, 2, 1, 2, 1],
      [2, 1, 1, 2, 2, 1, 1, 1, 1, 2, 1],
      [1, 2, 1, 2, 1, 1, 2, 2, 2, 1, 1],
      [1, 2, 1, 2, 2, 2, 1, 2, 1, 2, 2],
      [2, 2, 1, 2, 1, 1, 2, 1, 1, 1, 1],
    ];

    assert.equal(checkGomokuDraw(drawBoard), true);

    for (let r = 0; r < drawBoard.length; r++) {
      for (let c = 0; c < drawBoard[r].length; c++) {
        assert.equal(checkGomokuWin(r, c, drawBoard[r][c], drawBoard).hasWin, false);
      }
    }
  });
});
