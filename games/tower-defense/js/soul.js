// ── Soul System ────────────────────────────────────────────────────
// Enemies drop souls when killed. Souls are collected by clicking them.
// Collected souls go to the soul inventory and can be used for Tower Fusion.

const SOUL_TYPES = {
  goblin: { name: 'Goblin Soul', color: '#66ff66', glow: '#33cc33', dropChance: 0.4 },
  wolf:   { name: 'Wolf Soul',   color: '#66ccff', glow: '#3399ff', dropChance: 0.5 },
  golem:  { name: 'Stone Soul',  color: '#ffbb66', glow: '#dd8833', dropChance: 0.6 },
  dragon: { name: 'Dragon Soul', color: '#ff5555', glow: '#ff1100', dropChance: 1.0 },
};

const ENEMY_SOUL_MAP = {
  basic: 'goblin',
  fast:  'wolf',
  tank:  'golem',
  boss:  'dragon',
};

function tryDropSoul(enemy) {
  const soulType = ENEMY_SOUL_MAP[enemy.type];
  if (!soulType) return;
  const info = SOUL_TYPES[soulType];
  if (Math.random() > info.dropChance) return;

  state.soulDrops.push({
    x: enemy.x + (Math.random() - 0.5) * 20,
    y: enemy.y + (Math.random() - 0.5) * 20,
    type: soulType,
    life: 14.0,
    maxLife: 14.0,
    pulse: Math.random() * Math.PI * 2,
    alive: true,
    radius: 10,
  });
}

function collectSoul(drop) {
  drop.alive = false;
  state.souls[drop.type] = (state.souls[drop.type] || 0) + 1;
  if (typeof playSoulCollect === 'function') playSoulCollect();

  const info = SOUL_TYPES[drop.type];

  // Burst particles
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI * 2 * i) / 16;
    const sp = 70 + Math.random() * 90;
    createParticle(drop.x, drop.y, Math.cos(a) * sp, Math.sin(a) * sp, info.color, 0.7 + Math.random() * 0.3, 3 + Math.random() * 5);
  }
  createParticle(drop.x, drop.y, 0, 0, '#ffffff', 0.3, 16);

  state.floatingTexts.push({
    x: drop.x, y: drop.y - 10,
    text: info.name,
    color: info.color,
    life: 1.5, maxLife: 1.5, vy: -50,
  });

  updateSoulUI();
}

function updateSoulDrops(rawDt) {
  for (const drop of state.soulDrops) {
    drop.life -= rawDt;
    drop.pulse += rawDt * 3.5;
    if (drop.life <= 0) drop.alive = false;
  }
  state.soulDrops = state.soulDrops.filter(d => d.alive);
}

function _getSoulGlowCache(type, radius) {
  if (!state._soulGlowCache) state._soulGlowCache = {};
  const key = type + '_' + radius;
  if (state._soulGlowCache[key]) return state._soulGlowCache[key];

  const info = SOUL_TYPES[type];
  const r = radius;
  const outerR = r * 3.2;
  const size = Math.ceil(outerR * 2) + 4;
  const cx = size / 2;
  const cy = size / 2;

  // Outer glow canvas
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = size; glowCanvas.height = size;
  const gCtx = glowCanvas.getContext('2d');
  const grd = gCtx.createRadialGradient(cx, cy, 0, cx, cy, outerR);
  grd.addColorStop(0, info.glow + 'aa');
  grd.addColorStop(0.5, info.glow + '44');
  grd.addColorStop(1, 'transparent');
  gCtx.fillStyle = grd;
  gCtx.beginPath(); gCtx.arc(cx, cy, outerR, 0, Math.PI * 2); gCtx.fill();

  // Core orb canvas
  const coreCanvas = document.createElement('canvas');
  const coreSize = Math.ceil(r * 2) + 4;
  const coreCx = coreSize / 2;
  const coreCy = coreSize / 2;
  coreCanvas.width = coreSize; coreCanvas.height = coreSize;
  const cCtx = coreCanvas.getContext('2d');
  const coreGrd = cCtx.createRadialGradient(coreCx - r * 0.3, coreCy - r * 0.3, 0, coreCx, coreCy, r);
  coreGrd.addColorStop(0, '#ffffff');
  coreGrd.addColorStop(0.3, info.color);
  coreGrd.addColorStop(1, info.glow);
  cCtx.fillStyle = coreGrd;
  cCtx.beginPath(); cCtx.arc(coreCx, coreCy, r, 0, Math.PI * 2); cCtx.fill();

  const entry = { glowCanvas, coreCanvas, outerR, r, size, coreSize };
  state._soulGlowCache[key] = entry;
  return entry;
}

function drawSoulDrops(ctx) {
  for (const drop of state.soulDrops) {
    const info = SOUL_TYPES[drop.type];
    const fadeAlpha = Math.min(1.0, drop.life / 2.5);
    const pulse = Math.sin(drop.pulse) * 0.28 + 0.72;
    const r = drop.radius * pulse;

    const cache = _getSoulGlowCache(drop.type, drop.radius);

    ctx.save();
    ctx.globalAlpha = fadeAlpha;

    // Outer glow (from cached canvas, scaled by pulse)
    const scale = pulse;
    const glowW = cache.size * scale;
    const glowH = cache.size * scale;
    ctx.drawImage(cache.glowCanvas, drop.x - glowW / 2, drop.y - glowH / 2, glowW, glowH);

    // Core orb (from cached canvas, scaled by pulse)
    const coreW = cache.coreSize * scale;
    const coreH = cache.coreSize * scale;
    ctx.drawImage(cache.coreCanvas, drop.x - coreW / 2, drop.y - coreH / 2, coreW, coreH);

    // Orbit ring
    ctx.strokeStyle = info.color + 'cc';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(drop.x, drop.y, r * 1.6, drop.pulse * 0.6, drop.pulse * 0.6 + Math.PI * 1.4);
    ctx.stroke();

    // Collect hint text (when life < 4s)
    if (drop.life < 4 && drop.life > 0) {
      ctx.globalAlpha = fadeAlpha * 0.8;
      ctx.font = 'bold 8px sans-serif';
      ctx.fillStyle = info.color;
      ctx.textAlign = 'center';
      ctx.fillText('클릭!', drop.x, drop.y - r * 2.2);
    }

    ctx.restore();
  }
}

function updateSoulUI() {
  const el = document.getElementById('soul-inventory');
  if (!el) return;
  const parts = [];
  for (const [type, info] of Object.entries(SOUL_TYPES)) {
    const count = state.souls[type] || 0;
    if (count > 0) {
      parts.push(`<span class="soul-item" style="color:${info.color}" title="${info.name}: ${count}개">${info.name.split(' ')[0]} ×${count}</span>`);
    }
  }
  el.innerHTML = parts.length
    ? parts.join('')
    : '<span class="soul-empty">소울을 모아 타워를 합성하세요!</span>';
}
