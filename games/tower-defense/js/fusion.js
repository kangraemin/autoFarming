// ── Tower Fusion System ────────────────────────────────────────────
// Collect souls from defeated enemies, then fuse them with towers
// to unlock powerful new abilities. 10 unique fusion combinations.

const FUSION_RECIPES = [
  // ── Goblin Soul ──────────────────────────────────────────────────
  {
    id: 'poison_arrow',
    soul: 'goblin', tower: 'arrow',
    name: '☠ Poison Arrow',
    desc: '독 지속 피해 (3초) + 공격 속도 ↑',
    color: '#88ff44',
    statMult: { damage: 1.4, range: 1.0, fireRate: 1.3 },
    special: 'dot',
    specialParams: { damage: 7, duration: 3.0, interval: 0.5, color: '#88ff44' },
  },
  {
    id: 'cursed_frost',
    soul: 'goblin', tower: 'ice',
    name: '☣ Cursed Frost',
    desc: '독+슬로우 조합 — 독이 슬로우를 심화',
    color: '#cc88ff',
    statMult: { damage: 1.5, range: 1.1, fireRate: 1.3 },
    special: 'dot',
    specialParams: { damage: 5, duration: 4.0, interval: 0.5, color: '#cc88ff' },
  },
  // ── Wolf Soul ────────────────────────────────────────────────────
  {
    id: 'swift_arrow',
    soul: 'wolf', tower: 'arrow',
    name: '💨 Swift Arrow',
    desc: '발사 속도 2배 + 사거리 증가',
    color: '#88ddff',
    statMult: { damage: 1.2, range: 1.3, fireRate: 2.0 },
    special: null,
    specialParams: {},
  },
  {
    id: 'chain_storm',
    soul: 'wolf', tower: 'lightning',
    name: '⛈ Chain Storm',
    desc: '5체인 번개 + 감전 효과',
    color: '#ffff44',
    statMult: { damage: 1.5, range: 1.3, fireRate: 1.3 },
    special: 'chain_plus',
    specialParams: { extraChains: 3 },
  },
  // ── Golem Soul ───────────────────────────────────────────────────
  {
    id: 'stone_shot',
    soul: 'golem', tower: 'arrow',
    name: '🗿 Stone Shot',
    desc: '2배 데미지 + 3체 관통',
    color: '#ddaa66',
    statMult: { damage: 2.0, range: 1.1, fireRate: 0.85 },
    special: 'pierce',
    specialParams: { pierceCount: 2 },
  },
  {
    id: 'siege_cannon',
    soul: 'golem', tower: 'cannon',
    name: '💥 Siege Cannon',
    desc: '광역 폭발 2배 + 기절 1.5초',
    color: '#ff8833',
    statMult: { damage: 1.8, range: 1.2, fireRate: 0.9 },
    special: 'stun',
    specialParams: { duration: 1.5, splashMult: 2.0 },
  },
  // ── Dragon Soul (Boss) ───────────────────────────────────────────
  {
    id: 'dragon_fang',
    soul: 'dragon', tower: 'arrow',
    name: '🔥 Dragon Fang',
    desc: '화염 DoT (5초) + 3체 관통',
    color: '#ff6622',
    statMult: { damage: 2.0, range: 1.2, fireRate: 1.0 },
    special: 'fire_dot',
    specialParams: { damage: 15, duration: 5.0, interval: 0.5, color: '#ff6622', pierce: 2 },
  },
  {
    id: 'dragon_cannon',
    soul: 'dragon', tower: 'cannon',
    name: '🐉 Dragon Cannon',
    desc: '3배 데미지 + 초대형 폭발',
    color: '#ff4400',
    statMult: { damage: 3.0, range: 1.3, fireRate: 0.75 },
    special: 'mega_splash',
    specialParams: { splashMult: 2.5 },
  },
  {
    id: 'absolute_zero',
    soul: 'dragon', tower: 'ice',
    name: '❄ Absolute Zero',
    desc: '범위 내 전체 완전 동결 (8초 주기)',
    color: '#88eeff',
    statMult: { damage: 2.0, range: 1.5, fireRate: 0.8 },
    special: 'freeze_all',
    specialParams: { freezeDuration: 3.5, cooldown: 8.0 },
  },
  {
    id: 'judgment',
    soul: 'dragon', tower: 'lightning',
    name: '⚡ Judgment',
    desc: '화면 내 모든 적에게 번개 (10초 주기)',
    color: '#ffff00',
    statMult: { damage: 2.5, range: 1.5, fireRate: 0.85 },
    special: 'judgment',
    specialParams: { cooldown: 10.0 },
  },
];

// Returns fusion options available for a tower given current soul inventory
function getFusionOptions(tower) {
  const baseTowerType = tower.fusedSpec ? tower.fusedSpec.baseType : tower.type;
  return FUSION_RECIPES.filter(r => {
    if (r.tower !== baseTowerType) return false;
    if (tower.fusedSpec && tower.fusedSpec.id === r.id) return false; // already this fusion
    return (state.souls[r.soul] || 0) > 0;
  });
}

// Perform fusion: consume soul, upgrade tower stats, apply fusion spec
function performFusion(tower, recipeId) {
  const recipe = FUSION_RECIPES.find(r => r.id === recipeId);
  if (!recipe) return false;
  if ((state.souls[recipe.soul] || 0) <= 0) return false;

  const baseTowerType = tower.fusedSpec ? tower.fusedSpec.baseType : tower.type;
  if (recipe.tower !== baseTowerType) return false;

  // Consume soul
  state.souls[recipe.soul]--;
  updateSoulUI();

  // Compute base stats (from original tower type at current level)
  const baseTemplate = CONFIG.TOWER_TYPES[baseTowerType];
  const baseRange = baseTemplate.range + (tower.level - 1) * 0.2;
  const baseDmg = baseTemplate.upgradeDamage(tower.level);
  const baseFireRate = baseTemplate.fireRate * Math.pow(1.1, tower.level - 1);

  // Apply fusion spec
  tower.fusedSpec = {
    id: recipe.id,
    baseType: baseTowerType,
    name: recipe.name,
    color: recipe.color,
    special: recipe.special,
    specialParams: { ...recipe.specialParams },
    fusedCooldown: 0,
  };

  // Override stats
  tower.damage = Math.floor(baseDmg * recipe.statMult.damage);
  tower.range = baseRange * recipe.statMult.range;
  tower.fireRate = baseFireRate * recipe.statMult.fireRate;

  // Extra splash for siege/dragon cannon
  if (recipe.special === 'stun' || recipe.special === 'mega_splash') {
    tower.fusedSpec.splashMult = recipe.specialParams.splashMult || 2.0;
  }

  // Pierce count
  if (recipe.special === 'pierce' || recipe.special === 'fire_dot') {
    tower.fusedSpec.pierceCount = recipe.specialParams.pierce || recipe.specialParams.pierceCount || 0;
  }

  // Register in codex
  if (!state.codex.includes(recipe.id)) {
    state.codex.push(recipe.id);
    spawnCodexUnlockText(recipe);
  }

  // Spectacular evolution animation + sound
  spawnFusionEffect(tower, recipe.color);
  if (typeof playFusion === 'function') playFusion();

  return true;
}

function spawnFusionEffect(tower, color) {
  const x = tower.x;
  const y = tower.y;

  // Ring burst
  for (let i = 0; i < 64; i++) {
    const a = (Math.PI * 2 * i) / 64 + Math.random() * 0.2;
    const sp = 60 + Math.random() * 220;
    createParticle(x, y, Math.cos(a) * sp, Math.sin(a) * sp,
      i % 3 === 0 ? '#ffffff' : color,
      0.9 + Math.random() * 0.8, 3 + Math.random() * 9);
  }

  // Central flash
  createParticle(x, y, 0, 0, '#ffffff', 0.5, 50);
  createParticle(x, y, 0, 0, color, 0.7, 35);

  // Rising streaks
  for (let i = 0; i < 24; i++) {
    createParticle(
      x + (Math.random() - 0.5) * 50, y + (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 60, -120 - Math.random() * 120,
      color, 1.0 + Math.random() * 0.6, 4 + Math.random() * 7
    );
  }

  state.screenShake = 8;
}

function spawnCodexUnlockText(recipe) {
  state.floatingTexts.push({
    x: state.canvas.width / 2,
    y: state.canvas.height * 0.28,
    text: `도감 등록! ${recipe.name}`,
    color: recipe.color,
    life: 2.8, maxLife: 2.8, vy: -25,
    fontSize: 18,
  });
}

// Render codex modal content
function renderCodexList() {
  return FUSION_RECIPES.map(r => {
    const discovered = state.codex.includes(r.id);
    const soulInfo = SOUL_TYPES[r.soul];
    const baseName = CONFIG.TOWER_TYPES[r.tower]?.name || r.tower;
    if (discovered) {
      return `<div class="codex-entry discovered" style="border-color:${r.color}20">
        <span class="codex-icon" style="color:${r.color}">${r.name}</span>
        <span class="codex-recipe" style="color:#aaa">${soulInfo.name} + ${baseName} 타워</span>
        <span class="codex-desc" style="color:#ccc">${r.desc}</span>
      </div>`;
    } else {
      return `<div class="codex-entry undiscovered">
        <span class="codex-icon">???</span>
        <span class="codex-recipe" style="color:#555">${soulInfo.name} + ${baseName} 타워</span>
        <span class="codex-desc" style="color:#444">미발견</span>
      </div>`;
    }
  }).join('');
}
