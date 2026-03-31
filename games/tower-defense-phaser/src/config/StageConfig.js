import { COLS, ROWS } from './GameConfig.js';

export const STAGES = [
  {
    id: 'goblin-pass',
    name: '고블린 패스',
    description: '고블린들의 첫 침공',
    hint: '기본 코스 · 적군 입문',
    waves: 5,
    difficulty: 1,
    bgColorA: 0x2d5016,
    bgColorB: 0x162d06,
    enemyScale: 1.0,
    startGold: 100,
  },
  {
    id: 'wolf-canyon',
    name: '늑대 협곡',
    description: '협곡을 누비는 빠른 늑대 무리',
    hint: 'U자 경로 · 속도전',
    waves: 7,
    difficulty: 2,
    bgColorA: 0x1e3828,
    bgColorB: 0x0d1e14,
    enemyScale: 1.3,
    startGold: 120,
  },
  {
    id: 'golem-wastes',
    name: '골렘 황무지',
    description: '황폐한 땅에서 깨어난 돌 골렘',
    hint: 'S자 경로 · 체력전',
    waves: 8,
    difficulty: 3,
    bgColorA: 0x2e2515,
    bgColorB: 0x1a1408,
    enemyScale: 1.6,
    startGold: 150,
  },
  {
    id: 'dragon-trail',
    name: '드래곤 협곡',
    description: '드래곤이 지배하는 불꽃 협곡',
    hint: '빗살 경로 · 고급전',
    waves: 10,
    difficulty: 4,
    bgColorA: 0x2e1212,
    bgColorB: 0x1a0808,
    enemyScale: 2.0,
    startGold: 200,
  },
  {
    id: 'demon-fortress',
    name: '악마의 요새',
    description: '최후의 결전 · 생존자 없음',
    hint: '밀집 경로 · 최고 난이도',
    waves: 12,
    difficulty: 5,
    bgColorA: 0x1e0e2e,
    bgColorB: 0x0e0618,
    enemyScale: 2.5,
    startGold: 250,
  },
];

// ── Path helpers ───────────────────────────────────────────────────

function wp(colRatio, rowRatio) {
  return {
    col: Math.max(0, Math.min(COLS - 1, Math.round(colRatio * (COLS - 1)))),
    row: Math.max(0, Math.min(ROWS - 1, Math.round(rowRatio * (ROWS - 1)))),
  };
}

function pathFromWaypoints(waypoints) {
  const path = [];
  const pathSet = new Set();

  function add(col, row) {
    col = Math.max(0, Math.min(COLS - 1, col));
    row = Math.max(0, Math.min(ROWS - 1, row));
    const key = `${col},${row}`;
    if (!pathSet.has(key)) {
      path.push({ col, row });
      pathSet.add(key);
    }
  }

  for (let i = 0; i < waypoints.length - 1; i++) {
    let { col, row } = waypoints[i];
    const { col: tc, row: tr } = waypoints[i + 1];
    add(col, row);

    const dc = Math.sign(tc - col);
    while (col !== tc) { col += dc; add(col, row); }

    const dr = Math.sign(tr - row);
    while (row !== tr) { row += dr; add(col, row); }
  }

  const last = waypoints[waypoints.length - 1];
  add(last.col, last.row);

  return { path, pathSet };
}

// ── Stage Path Generators ──────────────────────────────────────────

function generateZigzagPath() {
  const path = [];
  const pathSet = new Set();

  let row = Math.floor(ROWS / 2);
  let col = 0;

  for (let i = 0; i < 2; i++) {
    path.push({ col, row });
    pathSet.add(`${col},${row}`);
    col++;
  }

  const segments = 4;
  const segWidth = Math.floor((COLS - 4) / segments);

  for (let s = 0; s < segments; s++) {
    const targetRow = s % 2 === 0 ? 2 : ROWS - 3;
    const dir = targetRow > row ? 1 : -1;
    while (row !== targetRow) {
      row += dir;
      path.push({ col, row });
      pathSet.add(`${col},${row}`);
    }
    for (let i = 0; i < segWidth; i++) {
      col++;
      if (col >= COLS - 1) break;
      path.push({ col, row });
      pathSet.add(`${col},${row}`);
    }
  }

  while (col < COLS) {
    path.push({ col, row });
    pathSet.add(`${col},${row}`);
    col++;
  }

  return { path, pathSet };
}

function generateUShapePath() {
  return pathFromWaypoints([
    wp(0, 0.2), wp(0.82, 0.2), wp(0.82, 0.82),
    wp(0.18, 0.82), wp(0.18, 0.2), wp(1.0, 0.2),
  ]);
}

function generateSCurvePath() {
  return pathFromWaypoints([
    wp(0, 0.15), wp(0.88, 0.15), wp(0.88, 0.5),
    wp(0.12, 0.5), wp(0.12, 0.85), wp(1.0, 0.85),
  ]);
}

function generateCombPath() {
  return pathFromWaypoints([
    wp(0, 0.5), wp(0.12, 0.5), wp(0.12, 0.1),
    wp(0.38, 0.1), wp(0.38, 0.9), wp(0.62, 0.9),
    wp(0.62, 0.1), wp(0.88, 0.1), wp(0.88, 0.5), wp(1.0, 0.5),
  ]);
}

function generateDensePath() {
  return pathFromWaypoints([
    wp(0, 0.5), wp(0.18, 0.5), wp(0.18, 0.12),
    wp(0.38, 0.12), wp(0.38, 0.88), wp(0.58, 0.88),
    wp(0.58, 0.12), wp(0.78, 0.12), wp(0.78, 0.88), wp(1.0, 0.88),
  ]);
}

export function generatePathForStage(stageIdx) {
  switch (stageIdx) {
    case 0: return generateZigzagPath();
    case 1: return generateUShapePath();
    case 2: return generateSCurvePath();
    case 3: return generateCombPath();
    case 4: return generateDensePath();
    default: return generateZigzagPath();
  }
}

// ── Stage Progress (localStorage) ─────────────────────────────────

export function loadStageProgress() {
  try {
    const saved = localStorage.getItem('td_stage_progress');
    if (saved) return JSON.parse(saved);
  } catch (_) { /* ignore */ }
  return STAGES.map(() => ({ stars: 0 }));
}

export function saveStageProgress(stageIdx, stars) {
  const progress = loadStageProgress();
  if (stars > (progress[stageIdx].stars || 0)) {
    progress[stageIdx].stars = stars;
  }
  try {
    localStorage.setItem('td_stage_progress', JSON.stringify(progress));
  } catch (_) { /* ignore */ }
}

export function isStageUnlocked(stageIdx) {
  if (stageIdx === 0) return true;
  const progress = loadStageProgress();
  return (progress[stageIdx - 1].stars || 0) >= 1;
}

export function getStageStars(livesLeft) {
  if (livesLeft >= 16) return 3;
  if (livesLeft >= 10) return 2;
  if (livesLeft >= 1) return 1;
  return 0;
}

export default STAGES;
