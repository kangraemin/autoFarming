// Tower Synergy System
// Injects bonus effects when compatible towers are placed adjacent to each other.

const SYNERGY_DEFS = [
  {
    id: 'steam_burst',
    name: '증기폭발',
    desc: '캐논 폭발범위 +60%, 얼음 슬로우 지속 +60%',
    types: ['cannon', 'ice'],
    color: '#88ddff',
  },
  {
    id: 'electro_freeze',
    name: '감전빙결',
    desc: '번개가 빙결/슬로우된 적 전체에 연쇄, 얼음 슬로우 강도 강화',
    types: ['lightning', 'ice'],
    color: '#aaeeff',
  },
  {
    id: 'storm_arrow',
    name: '폭풍화살',
    desc: '화살 공격속도 +40%, 데미지 +20%',
    types: ['arrow', 'lightning'],
    color: '#ffee44',
  },
  {
    id: 'thunder_bomb',
    name: '번개포탄',
    desc: '캐논 포탄 피격 시 번개 DoT 1.5초',
    types: ['cannon', 'lightning'],
    color: '#ffcc33',
  },
  {
    id: 'frost_arrow',
    name: '서리화살',
    desc: '화살 피격 시 슬로우 40% 1.5초',
    types: ['arrow', 'ice'],
    color: '#88aaff',
  },
  {
    id: 'explosive_arrow',
    name: '폭발화살',
    desc: '화살에 소형 범위 폭발 추가 (0.7 타일)',
    types: ['arrow', 'cannon'],
    color: '#ff8844',
  },
];

// Two towers are synergized if within this many grid tiles (Euclidean)
const SYNERGY_RANGE = 2.5;

// Use global getTowerBaseType() from utils.js
const _towerBaseType = getTowerBaseType;

// Called every frame in the game loop.
// Recomputes which towers are synergized and stores pairs in state.synergies.
function computeSynergies() {
  if (!state.synergies) state.synergies = [];
  if (!state.synergyNotified) state.synergyNotified = new Set();

  const newPairs = [];
  const prevKeys = new Set(state.synergies.map(p => p.key));

  // Clear per-tower synergy list
  for (const tower of state.towers) {
    tower.activeSynergies = tower.activeSynergies || [];
    tower.activeSynergies.length = 0;
  }

  for (let i = 0; i < state.towers.length; i++) {
    for (let j = i + 1; j < state.towers.length; j++) {
      const a = state.towers[i];
      const b = state.towers[j];
      const dx = a.col - b.col;
      const dy = a.row - b.row;
      if (Math.sqrt(dx * dx + dy * dy) > SYNERGY_RANGE) continue;

      const typeA = _towerBaseType(a);
      const typeB = _towerBaseType(b);

      for (const def of SYNERGY_DEFS) {
        if (
          !((def.types[0] === typeA && def.types[1] === typeB) ||
            (def.types[0] === typeB && def.types[1] === typeA))
        ) continue;

        if (!a.activeSynergies.includes(def.id)) a.activeSynergies.push(def.id);
        if (!b.activeSynergies.includes(def.id)) b.activeSynergies.push(def.id);

        const key = `${i}-${j}-${def.id}`;
        newPairs.push({ a, b, def, key });

        // Announce new synergy discovery (once per pair per game session)
        if (!prevKeys.has(key) && !state.synergyNotified.has(key)) {
          state.synergyNotified.add(key);
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          state.floatingTexts.push({
            x: mx, y: my - 18,
            text: `✨ ${def.name}!`,
            color: def.color,
            life: 2.4, maxLife: 2.4, vy: -30, fontSize: 13,
          });
          spawnExplosion(mx, my, def.color, 10);
        }
      }
    }
  }

  state.synergies = newPairs;
}

// Apply synergy effects to a newly created projectile.
// Called from tower.js immediately after createProjectile().
function applySynergyToProjectile(proj, tower) {
  const synergies = tower.activeSynergies;
  if (!synergies || synergies.length === 0) return;

  const baseType = _towerBaseType(tower);

  // steam_burst — cannon: wider splash; ice: longer slow
  if (synergies.includes('steam_burst')) {
    if (baseType === 'cannon') {
      proj.splash = (proj.splash || 0) * 1.6 || 1.6;
      proj.synergyId = 'steam_burst';
    }
    if (baseType === 'ice') {
      proj.slowDuration = (proj.slowDuration || 2.0) * 1.6;
    }
  }

  // electro_freeze — lightning: chain to all slowed; ice: stronger slow
  if (synergies.includes('electro_freeze')) {
    if (baseType === 'lightning') {
      proj.synergyId = 'electro_freeze';
    }
    if (baseType === 'ice') {
      proj.slow = Math.min((proj.slow || 0.5) * 0.7, 0.18); // even slower (lower = more slow)
      proj.slowDuration = (proj.slowDuration || 2.0) * 1.4;
    }
  }

  // storm_arrow — arrow: +20% damage (fire rate handled in tower.js)
  if (synergies.includes('storm_arrow') && baseType === 'arrow') {
    proj.damage = Math.ceil(proj.damage * 1.2);
    proj.color = '#ffee44';
  }

  // thunder_bomb — cannon: apply lightning DoT on hit
  if (synergies.includes('thunder_bomb') && baseType === 'cannon') {
    proj.synergyId = proj.synergyId || 'thunder_bomb'; // don't overwrite steam_burst
    if (!proj.synergyIds) proj.synergyIds = [];
    proj.synergyIds.push('thunder_bomb');
  }

  // frost_arrow — arrow: add slow effect
  if (synergies.includes('frost_arrow') && baseType === 'arrow') {
    proj.slow = Math.max(proj.slow || 0, 0.4);
    proj.slowDuration = Math.max(proj.slowDuration || 0, 1.5);
    proj.color = '#88aaff';
  }

  // explosive_arrow — arrow: add small splash
  if (synergies.includes('explosive_arrow') && baseType === 'arrow') {
    proj.splash = Math.max(proj.splash || 0, 0.7);
    if (!proj.synergyIds) proj.synergyIds = [];
    proj.synergyIds.push('explosive_arrow');
  }
}

// ── Rendering ──────────────────────────────────────────────────────────────

// Draw animated dashed connection lines between all active synergy pairs.
// Call this BEFORE drawTowers (so lines appear under towers).
function drawSynergyConnections(ctx) {
  if (!state.synergies || state.synergies.length === 0) return;

  const t = state.gameTime;
  const dashLen = 7;
  const gapLen = 4;
  const cycleLen = dashLen + gapLen;

  for (const { a, b, def } of state.synergies) {
    const offset = (t * 38) % cycleLen;

    ctx.save();
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 3.5;
    ctx.globalAlpha = 0.38 + 0.18 * Math.sin(t * 2.8 + a.col);
    ctx.setLineDash([dashLen, gapLen]);
    ctx.lineDashOffset = -offset;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  }
}

// Draw synergy aura ring around a single tower.
// Call inside the translated ctx (tower.x/y as origin).
function drawSynergyAura(ctx, tower, gs) {
  const synergies = tower.activeSynergies;
  if (!synergies || synergies.length === 0) return;

  const t = state.gameTime;
  // Use first synergy for color (most towers will only have one)
  const def = SYNERGY_DEFS.find(d => d.id === synergies[0]);
  if (!def) return;

  const r = gs * 0.5 + 3 + Math.sin(t * 3.5 + tower.col) * 2;

  ctx.save();
  // Outer ring
  ctx.globalAlpha = 0.15 + 0.08 * Math.sin(t * 4);
  ctx.strokeStyle = def.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r + 2, 0, Math.PI * 2);
  ctx.stroke();
  // Inner ring
  ctx.globalAlpha = 0.25 + 0.12 * Math.sin(t * 4);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
