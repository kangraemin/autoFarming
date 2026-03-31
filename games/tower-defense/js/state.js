const state = {
  gold: 100,
  lives: 20,
  wave: 0,
  score: 0,
  speed: 1,
  phase: 'prep', // 'prep' | 'wave' | 'gameover' | 'stageclear'
  selectedTower: 'arrow',
  towers: [],
  enemies: [],
  projectiles: [],
  particles: [],
  floatingTexts: [],
  screenShake: 0,
  closeCallFlash: 0,
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
  // Stage system
  currentStageIndex: 0,  // which stage is being played
  // Active skills
  skills: [],         // [{ id, cooldown }]
  targetingSkill: null, // skill id waiting for canvas click target
  // Tower synergies
  synergies: [],      // [{ a, b, def, key }] — active pairs this frame
  synergyNotified: null, // Set of keys already announced (init lazily)
};

function initState() {
  const stage = (typeof STAGES !== 'undefined') ? STAGES[state.currentStageIndex] : null;
  state.gold = stage ? stage.startGold : 100;
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
  state.closeCallFlash = 0;
  state.selectedPlacedTower = null;
  state.gameTime = 0;
  state.souls = {};
  state.soulDrops = [];
  state.prepCountdown = 0;
  state.targetingSkill = null;
  state.synergies = [];
  state.synergyNotified = new Set();
  if (typeof initSkills === 'function') initSkills();
  // codex and currentStageIndex are NOT reset — permanent progress
}
