// ── Active Skills ─────────────────────────────────────────────────

const SKILL_DEFS = {
  airstrike: {
    id: 'airstrike',
    name: '폭격',
    icon: '💥',
    desc: '범위 폭격 (클릭 위치)',
    maxCooldown: 20,
    color: '#ff6600',
    requiresTarget: true,
  },
  freeze: {
    id: 'freeze',
    name: '동결',
    icon: '❄️',
    desc: '전체 적 슬로우 4초',
    maxCooldown: 25,
    color: '#66ccff',
    requiresTarget: false,
  },
  heal: {
    id: 'heal',
    name: '치유',
    icon: '💚',
    desc: '체력 +3 회복',
    maxCooldown: 30,
    color: '#44ff88',
    requiresTarget: false,
  },
};

function initSkills() {
  state.skills = [
    { id: 'airstrike', cooldown: 0 },
    { id: 'freeze',    cooldown: 0 },
    { id: 'heal',      cooldown: 0 },
  ];
  state.targetingSkill = null; // 'airstrike' when in targeting mode
}

function updateSkillCooldowns(rawDt) {
  for (const sk of state.skills) {
    if (sk.cooldown > 0) sk.cooldown = Math.max(0, sk.cooldown - rawDt);
  }
}

function getSkill(id) {
  return state.skills.find(s => s.id === id);
}

function isSkillReady(id) {
  const sk = getSkill(id);
  return sk && sk.cooldown === 0;
}

// Returns true if activated (handled by caller for targeting skills)
function activateSkill(id, targetX, targetY) {
  const sk = getSkill(id);
  const def = SKILL_DEFS[id];
  if (!sk || !def) return false;
  if (sk.cooldown > 0) return false;

  switch (id) {
    case 'airstrike':
      doAirstrike(targetX, targetY);
      break;
    case 'freeze':
      doFreeze();
      break;
    case 'heal':
      doHeal();
      break;
  }

  sk.cooldown = def.maxCooldown;
  updateSkillUI();
  return true;
}

// ── Airstrike ─────────────────────────────────────────────────────
function doAirstrike(cx, cy) {
  const radius = CONFIG.GRID_SIZE * 2.5;
  const damage = 80;

  // Big explosion particle burst
  spawnExplosion(cx, cy, '#ff6600', 20);
  spawnExplosion(cx, cy, '#ffcc00', 14);
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * radius * 0.8;
    spawnExplosion(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, '#ff4400', 8);
  }
  state.screenShake = 10;

  // Floating text
  state.floatingTexts.push({ x: cx, y: cy - 20, text: '💥 폭격!', color: '#ff6600', life: 1.4, vy: -35, size: 18 });

  // Damage all enemies in radius
  for (const enemy of state.enemies) {
    if (!enemy.alive || enemy.reached) continue;
    const dx = enemy.x - cx;
    const dy = enemy.y - cy;
    if (Math.sqrt(dx * dx + dy * dy) <= radius + CONFIG.GRID_SIZE * enemy.size * 0.5) {
      hitEnemy(enemy, damage, true, '#ff6600');
    }
  }
}

// ── Freeze ────────────────────────────────────────────────────────
function doFreeze() {
  const duration = 4;
  let frozenCount = 0;

  for (const enemy of state.enemies) {
    if (!enemy.alive || enemy.reached) continue;
    enemy.slowTimer = duration;
    enemy.slowAmount = 0.15; // 85% slow
    // Ice particles on each enemy
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const speed = 25 + Math.random() * 30;
      createParticle(
        enemy.x, enemy.y,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        '#aaeeff', 0.6 + Math.random() * 0.3, 3 + Math.random() * 3
      );
    }
    frozenCount++;
  }

  // Full-screen ice flash — large burst from center
  const cx = state.canvas.width / 2;
  const cy = state.canvas.height / 2;
  spawnExplosion(cx, cy, '#66ccff', 30);
  spawnExplosion(cx, cy, '#ffffff', 16);

  state.floatingTexts.push({ x: cx, y: cy - 40, text: `❄️ 동결! (${frozenCount}마리)`, color: '#66ccff', life: 1.6, vy: -30, size: 18 });
}

// ── Heal ──────────────────────────────────────────────────────────
function doHeal() {
  const healAmount = 3;
  const prevLives = state.lives;
  state.lives = Math.min(20, state.lives + healAmount);
  const gained = state.lives - prevLives;

  // Healing particles rising from bottom center
  const cx = state.canvas.width / 2;
  const cy = state.canvas.height * 0.7;
  for (let i = 0; i < 20; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
    const speed = 40 + Math.random() * 60;
    createParticle(
      cx + (Math.random() - 0.5) * 80, cy,
      Math.cos(angle) * speed, Math.sin(angle) * speed,
      '#44ff88', 0.7 + Math.random() * 0.5, 3 + Math.random() * 4
    );
  }

  state.floatingTexts.push({ x: cx, y: cy - 30, text: `💚 +${gained} 체력`, color: '#44ff88', life: 1.5, vy: -28, size: 18 });
  updateUI();
}

// ── Skill UI ──────────────────────────────────────────────────────
function updateSkillUI() {
  for (const sk of state.skills) {
    const def = SKILL_DEFS[sk.id];
    const btn = document.getElementById(`skill-btn-${sk.id}`);
    if (!btn) continue;

    const ready = sk.cooldown === 0;
    btn.classList.toggle('ready', ready);
    btn.classList.toggle('on-cooldown', !ready);
    btn.classList.toggle('targeting', state.targetingSkill === sk.id);

    const overlay = btn.querySelector('.skill-cd-overlay');
    const cdText = btn.querySelector('.skill-cd-text');

    if (overlay && cdText) {
      if (ready) {
        overlay.style.height = '0%';
        cdText.textContent = '';
      } else {
        const pct = (sk.cooldown / def.maxCooldown) * 100;
        overlay.style.height = pct + '%';
        cdText.textContent = Math.ceil(sk.cooldown) + 's';
      }
    }
  }
}
