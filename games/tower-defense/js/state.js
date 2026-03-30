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
  path: [],
  pathSet: null, // Set of "col,row" for path tiles
  gridOccupied: null, // Set of "col,row" for tower tiles
  canvas: null,
  ctx: null,
  lastTime: 0,
  selectedPlacedTower: null, // tower object for upgrade popup
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
  state.selectedPlacedTower = null;
}
