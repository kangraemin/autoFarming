const state = {
  gold: 100,
  lives: 20,
  wave: 0,
  score: 0,
  speed: 1,
  phase: 'prep', // 'prep' | 'wave' | 'gameover'
  selectedTower: 'arrow',
  towers: [],
  enemies: [],
  projectiles: [],
  particles: [],
  floatingTexts: [],
  screenShake: 0,
  path: [],
  pathSet: null,
  gridOccupied: null,
  decorations: [], // {col, row, type} — trees, rocks, bushes
  canvas: null,
  ctx: null,
  lastTime: 0,
  selectedPlacedTower: null,
  gameTime: 0, // total elapsed time for animations
};

function initState() {
  state.gold = 100;
  state.lives = 20;
  state.wave = 0;
  state.score = 0;
  state.speed = 1;
  state.phase = 'prep';
  state.towers = [];
  state.enemies = [];
  state.projectiles = [];
  state.particles = [];
  state.floatingTexts = [];
  state.screenShake = 0;
  state.selectedPlacedTower = null;
  state.gameTime = 0;
}
