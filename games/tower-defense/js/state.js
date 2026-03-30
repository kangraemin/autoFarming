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
  // Tower Fusion
  souls: {},      // { goblin: 0, wolf: 0, golem: 0, dragon: 0 }
  soulDrops: [],  // soul orbs waiting on canvas to be clicked
  codex: [],      // discovered fusion ids (persists across waves)
  // Wave prep
  prepCountdown: 0,   // seconds remaining in prep phase (0 = manual start only)
  prepDuration: 15,   // total prep time between waves
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
  state.souls = {};
  state.soulDrops = [];
  state.prepCountdown = 0;
  // codex is NOT reset — permanent collection progress
}
