export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const GRID_SIZE = 40;

// 그리드 기반 계산
export const COLS = Math.floor(GAME_WIDTH / GRID_SIZE);   // 32
export const ROWS = Math.floor(GAME_HEIGHT / GRID_SIZE);  // 18

export const INITIAL_LIVES = 20;

export default {
  GAME_WIDTH,
  GAME_HEIGHT,
  GRID_SIZE,
  COLS,
  ROWS,
  INITIAL_LIVES,
};
