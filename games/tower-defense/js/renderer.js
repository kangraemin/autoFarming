function resizeCanvas() {
  const canvas = state.canvas;
  const topBar = document.querySelector('.top-bar');
  const bottomPanel = document.querySelector('.bottom-panel');
  const availH = window.innerHeight - topBar.offsetHeight - bottomPanel.offsetHeight;
  const availW = window.innerWidth;

  canvas.width = availW;
  canvas.height = availH;

  CONFIG.COLS = Math.floor(availW / CONFIG.GRID_SIZE);
  CONFIG.ROWS = Math.floor(availH / CONFIG.GRID_SIZE);

  state._bgDirty = true;
}

// ── Map decorations ────────────────────────────────────────────────
function generateDecorations() {
  state.decorations = [];
  const rng = mulberry32(42); // deterministic seed
  for (let col = 0; col < CONFIG.COLS; col++) {
    for (let row = 0; row < CONFIG.ROWS; row++) {
      if (isPathTile(col, row)) continue;
      const r = rng();
      if (r < 0.06) {
        const types = ['tree', 'tree', 'tree', 'rock', 'bush'];
        state.decorations.push({ col, row, type: types[Math.floor(rng() * types.length)] });
      }
    }
  }
}

function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── Drawing helpers ────────────────────────────────────────────────
function drawRoundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
}

// ── Background ─────────────────────────────────────────────────────
function drawBackground(ctx) {
  const W = state.canvas.width;
  const H = state.canvas.height;

  // Base ground gradient — use stage colors if available
  const stage = (typeof STAGES !== 'undefined') ? STAGES[state.currentStageIndex] : null;
  const colorA = stage ? stage.bgColorA : '#2d5016';
  const colorB = stage ? stage.bgColorB : '#162d06';
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, colorA);
  grad.addColorStop(1, colorB);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Subtle grid
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1;
  const gs = CONFIG.GRID_SIZE;
  for (let c = 0; c <= CONFIG.COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c * gs, 0); ctx.lineTo(c * gs, CONFIG.ROWS * gs); ctx.stroke();
  }
  for (let r = 0; r <= CONFIG.ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * gs); ctx.lineTo(CONFIG.COLS * gs, r * gs); ctx.stroke();
  }
}

// ── Path ───────────────────────────────────────────────────────────
function drawPath(ctx) {
  const gs = CONFIG.GRID_SIZE;
  for (const p of state.path) {
    const x = p.col * gs;
    const y = p.row * gs;

    // Base dirt
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(x, y, gs, gs);

    // Lighter center strip
    ctx.fillStyle = '#A07820';
    ctx.fillRect(x + 3, y + 3, gs - 6, gs - 6);

    // Texture dots
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    const seed = (p.col * 7 + p.row * 13) % 5;
    if (seed === 0) ctx.fillRect(x + 5, y + 8, 3, 3);
    if (seed === 1) ctx.fillRect(x + 12, y + 5, 2, 2);
    if (seed === 2) ctx.fillRect(x + 8, y + 14, 3, 2);
    if (seed === 3) ctx.fillRect(x + 3, y + 12, 2, 3);
  }

  // Path direction arrows (subtle)
  ctx.fillStyle = 'rgba(255,220,100,0.15)';
  for (let i = 4; i < state.path.length - 4; i += 6) {
    const p = state.path[i];
    const next = state.path[i + 1];
    if (!next) continue;
    const cx = p.col * gs + gs / 2;
    const cy = p.row * gs + gs / 2;
    const dx = next.col - p.col;
    const dy = next.row - p.row;
    const angle = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(5, 0); ctx.lineTo(-3, -4); ctx.lineTo(-3, 4);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

// ── Decorations ────────────────────────────────────────────────────
function drawDecorations(ctx) {
  const gs = CONFIG.GRID_SIZE;
  for (const d of state.decorations) {
    if (isOccupied(d.col, d.row)) continue; // tower placed here
    const cx = d.col * gs + gs / 2;
    const cy = d.row * gs + gs / 2;
    if (d.type === 'tree') drawTree(ctx, cx, cy, gs);
    else if (d.type === 'rock') drawRock(ctx, cx, cy, gs);
    else if (d.type === 'bush') drawBush(ctx, cx, cy, gs);
  }
}

function drawTree(ctx, cx, cy, gs) {
  const s = gs * 0.42;
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.7, s * 0.6, s * 0.2, 0, 0, Math.PI * 2); ctx.fill();
  // Trunk
  ctx.fillStyle = '#5C3A1E';
  ctx.fillRect(cx - s * 0.12, cy, s * 0.24, s * 0.5);
  // Canopy layers
  ctx.fillStyle = '#2d6e1a';
  ctx.beginPath(); ctx.moveTo(cx, cy - s); ctx.lineTo(cx + s * 0.6, cy + s * 0.1); ctx.lineTo(cx - s * 0.6, cy + s * 0.1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3a8a22';
  ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.7); ctx.lineTo(cx + s * 0.5, cy + s * 0.35); ctx.lineTo(cx - s * 0.5, cy + s * 0.35); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#4aa62a';
  ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.4); ctx.lineTo(cx + s * 0.4, cy + s * 0.6); ctx.lineTo(cx - s * 0.4, cy + s * 0.6); ctx.closePath(); ctx.fill();
}

function drawRock(ctx, cx, cy, gs) {
  const s = gs * 0.32;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(cx + 2, cy + s * 0.6, s * 0.8, s * 0.25, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a7a7a';
  ctx.beginPath();
  ctx.moveTo(cx - s, cy + s * 0.3); ctx.lineTo(cx - s * 0.3, cy - s * 0.5);
  ctx.lineTo(cx + s * 0.2, cy - s * 0.6); ctx.lineTo(cx + s, cy - s * 0.1);
  ctx.lineTo(cx + s * 0.8, cy + s * 0.4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#9a9a9a';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.3, cy - s * 0.5); ctx.lineTo(cx + s * 0.2, cy - s * 0.6);
  ctx.lineTo(cx + s * 0.4, cy - s * 0.1); ctx.lineTo(cx - s * 0.1, cy); ctx.closePath(); ctx.fill();
}

function drawBush(ctx, cx, cy, gs) {
  const s = gs * 0.3;
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.5, s * 0.9, s * 0.25, 0, 0, Math.PI * 2); ctx.fill();
  const colors = ['#1a5c0e', '#236b11', '#2a7d14', '#317a12'];
  for (let i = 0; i < 4; i++) {
    const ox = (i === 0 ? 0 : i === 1 ? -s * 0.5 : i === 2 ? s * 0.5 : 0);
    const oy = (i === 0 ? -s * 0.3 : i === 3 ? s * 0.1 : 0);
    ctx.fillStyle = colors[i];
    ctx.beginPath(); ctx.arc(cx + ox, cy + oy, s * 0.5, 0, Math.PI * 2); ctx.fill();
  }
}

// ── Towers ─────────────────────────────────────────────────────────
function drawTowers(ctx) {
  const gs = CONFIG.GRID_SIZE;
  for (const tower of state.towers) {
    const x = tower.col * gs + gs / 2;
    const y = tower.row * gs + gs / 2;

    // Range circle when selected
    if (state.selectedPlacedTower === tower) {
      ctx.strokeStyle = 'rgba(255,200,50,0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(x, y, tower.range * gs, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.save();
    ctx.translate(x, y);

    // Synergy aura (drawn behind fused aura)
    drawSynergyAura(ctx, tower, gs);

    // Fused tower glow aura (drawn behind tower)
    if (tower.fusedSpec) {
      const fc = tower.fusedSpec.color;
      const t = state.gameTime;
      const pulse = Math.sin(t * 3) * 0.15 + 0.85;
      const auraR = gs * 0.62 * pulse;
      const auraGrd = ctx.createRadialGradient(0, 0, auraR * 0.2, 0, 0, auraR);
      auraGrd.addColorStop(0, fc + '55');
      auraGrd.addColorStop(0.6, fc + '22');
      auraGrd.addColorStop(1, 'transparent');
      ctx.fillStyle = auraGrd;
      ctx.beginPath(); ctx.arc(0, 0, auraR, 0, Math.PI * 2); ctx.fill();

      // Spinning dashed ring
      ctx.strokeStyle = fc + 'bb';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, gs * 0.52, t * 1.8, t * 1.8 + Math.PI * 1.5);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const drawType = tower.fusedSpec ? tower.fusedSpec.baseType : tower.type;
    switch (drawType) {
      case 'arrow': drawArrowTower(ctx, gs, tower); break;
      case 'cannon': drawCannonTower(ctx, gs, tower); break;
      case 'ice': drawIceTower(ctx, gs, tower); break;
      case 'lightning': drawLightningTower(ctx, gs, tower); break;
    }

    // Fusion badge (top-left corner)
    if (tower.fusedSpec) {
      const fc = tower.fusedSpec.color;
      ctx.fillStyle = fc;
      ctx.beginPath(); ctx.arc(-gs * 0.38, -gs * 0.38, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', -gs * 0.38, -gs * 0.38);
    }

    // Level badge (top-right)
    if (tower.level > 1) {
      ctx.fillStyle = '#ffd700';
      ctx.beginPath(); ctx.arc(gs * 0.38, -gs * 0.38, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tower.level, gs * 0.38, -gs * 0.38);
    }

    ctx.restore();
  }
}

function drawArrowTower(ctx, gs, tower) {
  const s = gs * 0.45;
  // Stone base platform
  ctx.fillStyle = '#7a8a6a';
  ctx.beginPath(); ctx.roundRect(-s, -s * 0.3, s * 2, s * 1.3, 3); ctx.fill();
  ctx.strokeStyle = '#4a5a3a'; ctx.lineWidth = 1.5; ctx.stroke();
  // Tower body
  ctx.fillStyle = '#9aaa8a';
  ctx.beginPath(); ctx.roundRect(-s * 0.55, -s * 1.0, s * 1.1, s * 0.9, 2); ctx.fill();
  ctx.strokeStyle = '#5a6a4a'; ctx.lineWidth = 1; ctx.stroke();
  // Battlements
  ctx.fillStyle = '#9aaa8a';
  const bw = s * 0.28;
  for (let i = -1; i <= 1; i += 2) {
    ctx.fillRect(i * s * 0.25, -s * 1.2, bw, s * 0.25);
  }
  ctx.strokeStyle = '#5a6a4a'; ctx.lineWidth = 1;
  ctx.strokeRect(-s * 0.38, -s * 1.2, bw, s * 0.25);
  ctx.strokeRect(s * 0.1, -s * 1.2, bw, s * 0.25);
  // Arrow slit window
  ctx.fillStyle = '#1a2a1a';
  ctx.fillRect(-2, -s * 0.85, 4, s * 0.45);
  // Archer (stick figure hint)
  ctx.fillStyle = '#3a2a1a';
  ctx.beginPath(); ctx.arc(0, -s * 0.65, s * 0.14, 0, Math.PI * 2); ctx.fill();
  // Bow
  ctx.strokeStyle = '#8B5E3C'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(s * 0.1, -s * 0.65, s * 0.18, -Math.PI * 0.6, Math.PI * 0.6); ctx.stroke();
  // Arrow on bow
  ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(s * 0.05, -s * 0.65); ctx.lineTo(s * 0.38, -s * 0.65); ctx.stroke();
}

function drawCannonTower(ctx, gs, tower) {
  const s = gs * 0.45;
  // Stone base
  ctx.fillStyle = '#5a5a6a';
  ctx.beginPath(); ctx.roundRect(-s, -s * 0.2, s * 2, s * 1.2, 4); ctx.fill();
  ctx.strokeStyle = '#3a3a4a'; ctx.lineWidth = 1.5; ctx.stroke();
  // Tower body
  ctx.fillStyle = '#7a7a8a';
  ctx.beginPath(); ctx.arc(0, -s * 0.35, s * 0.65, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#4a4a5a'; ctx.lineWidth = 1.5; ctx.stroke();
  // Inner ring
  ctx.fillStyle = '#6a6a7a';
  ctx.beginPath(); ctx.arc(0, -s * 0.35, s * 0.45, 0, Math.PI * 2); ctx.fill();
  // Cannon barrel (point right by default, rotated by tower angle)
  const angle = tower.barrelAngle || 0;
  ctx.save();
  ctx.translate(0, -s * 0.35);
  ctx.rotate(angle);
  ctx.fillStyle = '#2a2a3a';
  ctx.beginPath(); ctx.roundRect(0, -s * 0.12, s * 0.7, s * 0.24, 3); ctx.fill();
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.stroke();
  // Barrel highlight
  ctx.fillStyle = '#4a4a5a';
  ctx.fillRect(s * 0.05, -s * 0.06, s * 0.5, s * 0.06);
  // Wheel bolts
  ctx.fillStyle = '#ffcc44';
  ctx.beginPath(); ctx.arc(0, 0, s * 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawIceTower(ctx, gs, tower) {
  const s = gs * 0.45;
  const t = state.gameTime;
  // Glow
  const grd = ctx.createRadialGradient(0, -s * 0.5, 0, 0, -s * 0.5, s * 0.9);
  grd.addColorStop(0, 'rgba(100,200,255,0.25)');
  grd.addColorStop(1, 'rgba(100,200,255,0)');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(0, -s * 0.5, s * 0.9, 0, Math.PI * 2); ctx.fill();
  // Base crystal cluster
  ctx.fillStyle = '#5588bb';
  ctx.beginPath(); ctx.roundRect(-s, -s * 0.1, s * 2, s * 1.1, 3); ctx.fill();
  ctx.strokeStyle = '#3366aa'; ctx.lineWidth = 1.5; ctx.stroke();
  // Main spire
  ctx.fillStyle = '#88ccff';
  ctx.beginPath(); ctx.moveTo(0, -s * 1.4); ctx.lineTo(s * 0.3, -s * 0.1); ctx.lineTo(-s * 0.3, -s * 0.1); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#aaddff'; ctx.lineWidth = 1; ctx.stroke();
  // Side spires
  ctx.fillStyle = 'rgba(170,220,255,0.7)';
  ctx.beginPath(); ctx.moveTo(-s * 0.35, -s * 0.8); ctx.lineTo(-s * 0.1, -s * 0.1); ctx.lineTo(-s * 0.55, -s * 0.1); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(s * 0.35, -s * 0.8); ctx.lineTo(s * 0.55, -s * 0.1); ctx.lineTo(s * 0.1, -s * 0.1); ctx.closePath(); ctx.fill();
  // Inner sparkle
  ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.4 * Math.sin(t * 3)})`;
  ctx.beginPath(); ctx.arc(0, -s * 0.7, s * 0.1, 0, Math.PI * 2); ctx.fill();
}

function drawLightningTower(ctx, gs, tower) {
  const s = gs * 0.45;
  const t = state.gameTime;
  // Electric glow
  const grd = ctx.createRadialGradient(0, -s * 0.6, 0, 0, -s * 0.6, s * 0.8);
  grd.addColorStop(0, `rgba(220,220,80,${0.2 + 0.1 * Math.sin(t * 8)})`);
  grd.addColorStop(1, 'rgba(220,220,80,0)');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(0, -s * 0.6, s * 0.8, 0, Math.PI * 2); ctx.fill();
  // Metal base
  ctx.fillStyle = '#4a4a3a';
  ctx.beginPath(); ctx.roundRect(-s, -s * 0.1, s * 2, s * 1.1, 3); ctx.fill();
  ctx.strokeStyle = '#2a2a1a'; ctx.lineWidth = 1.5; ctx.stroke();
  // Tower body metal
  ctx.fillStyle = '#6a6a5a';
  ctx.beginPath(); ctx.roundRect(-s * 0.35, -s * 1.1, s * 0.7, s * 1.1, 2); ctx.fill();
  ctx.strokeStyle = '#3a3a2a'; ctx.lineWidth = 1; ctx.stroke();
  // Metal bands
  ctx.fillStyle = '#8a8a7a';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(-s * 0.4, -s * 0.3 - i * s * 0.28, s * 0.8, s * 0.08);
  }
  // Lightning rod
  ctx.strokeStyle = '#ffee44'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -s * 1.1); ctx.lineTo(0, -s * 1.5); ctx.stroke();
  // Rod tip orb
  const orbAlpha = 0.7 + 0.3 * Math.sin(t * 12);
  ctx.fillStyle = `rgba(255,230,50,${orbAlpha})`;
  ctx.beginPath(); ctx.arc(0, -s * 1.5, s * 0.12, 0, Math.PI * 2); ctx.fill();
  // Electric arcs (animated)
  if (Math.sin(t * 15) > 0.3) {
    ctx.strokeStyle = `rgba(255,255,150,${0.5 + 0.5 * Math.random()})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -s * 1.5);
    ctx.lineTo((Math.random() - 0.5) * s * 0.6, -s * 1.1);
    ctx.stroke();
  }
}

// ── Enemies ────────────────────────────────────────────────────────
function drawEnemies(ctx) {
  const gs = CONFIG.GRID_SIZE;
  for (const enemy of state.enemies) {
    if (!enemy.alive || enemy.reached || enemy.delay > 0) continue;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    const bob = Math.sin(state.gameTime * 8 + enemy.pathIndex) * 1.5;

    switch (enemy.type) {
      case 'basic': drawGoblin(ctx, gs, enemy, bob); break;
      case 'fast': drawWolf(ctx, gs, enemy, bob); break;
      case 'tank': drawGolem(ctx, gs, enemy, bob); break;
      case 'boss': drawDragon(ctx, gs, enemy, bob); break;
    }

    // Slow overlay
    if (enemy.slowTimer > 0 && (!enemy.stunTimer || enemy.stunTimer <= 0)) {
      ctx.strokeStyle = 'rgba(100,200,255,0.5)';
      ctx.lineWidth = 2;
      const s = gs * 0.35 * (enemy.size || 1);
      ctx.beginPath(); ctx.arc(0, 0, s + 3, 0, Math.PI * 2); ctx.stroke();
    }

    // Stun overlay
    if (enemy.stunTimer > 0) {
      ctx.strokeStyle = 'rgba(255,180,0,0.8)';
      ctx.lineWidth = 2.5;
      const s = gs * 0.35 * (enemy.size || 1);
      ctx.beginPath(); ctx.arc(0, 0, s + 4, 0, Math.PI * 2); ctx.stroke();
      // Stars above head
      const starAlpha = Math.sin(state.gameTime * 10) * 0.3 + 0.7;
      ctx.globalAlpha = starAlpha;
      ctx.fillStyle = '#ffcc00';
      ctx.font = `${Math.floor(gs * 0.22)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', 0, -s - 10);
      ctx.globalAlpha = 1;
    }

    // DoT overlay (poison/fire)
    if (enemy.dots && enemy.dots.length > 0) {
      const dotColor = enemy.dots[enemy.dots.length - 1].color;
      ctx.strokeStyle = dotColor + '88';
      ctx.lineWidth = 1.5;
      const s = gs * 0.35 * (enemy.size || 1);
      ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.arc(0, 0, s + 6, state.gameTime * 4, state.gameTime * 4 + Math.PI * 1.6); ctx.stroke();
      ctx.setLineDash([]);
    }

    // HP bar
    drawEnemyHPBar(ctx, gs, enemy);

    ctx.restore();
  }
}

function drawGoblin(ctx, gs, enemy, bob) {
  const s = gs * 0.3;
  ctx.translate(0, bob * 0.5);
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, s * 1.1, s * 0.7, s * 0.2, 0, 0, Math.PI * 2); ctx.fill();
  // Legs (animated)
  const legSwing = Math.sin(state.gameTime * 12 + enemy.pathIndex) * 5;
  ctx.fillStyle = '#2a5a2a';
  ctx.fillRect(-s * 0.35, s * 0.4, s * 0.28, s * 0.7 + legSwing * 0.1);
  ctx.fillRect(s * 0.08, s * 0.4, s * 0.28, s * 0.7 - legSwing * 0.1);
  // Body
  ctx.fillStyle = '#3a8a3a';
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.65, s * 0.75, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#1a5a1a'; ctx.lineWidth = 1.5; ctx.stroke();
  // Belly
  ctx.fillStyle = '#5aaa5a';
  ctx.beginPath(); ctx.ellipse(0, s * 0.15, s * 0.35, s * 0.4, 0, 0, Math.PI * 2); ctx.fill();
  // Head
  ctx.fillStyle = '#4a9a4a';
  ctx.beginPath(); ctx.ellipse(0, -s * 0.9, s * 0.55, s * 0.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#1a5a1a'; ctx.lineWidth = 1; ctx.stroke();
  // Ears
  ctx.fillStyle = '#3a8a3a';
  ctx.beginPath(); ctx.moveTo(-s * 0.5, -s * 1.0); ctx.lineTo(-s * 0.8, -s * 1.4); ctx.lineTo(-s * 0.25, -s * 1.0); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(s * 0.5, -s * 1.0); ctx.lineTo(s * 0.8, -s * 1.4); ctx.lineTo(s * 0.25, -s * 1.0); ctx.closePath(); ctx.fill();
  // Eyes
  ctx.fillStyle = '#ff4';
  ctx.beginPath(); ctx.arc(-s * 0.22, -s * 0.95, s * 0.14, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(s * 0.22, -s * 0.95, s * 0.14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(-s * 0.2, -s * 0.95, s * 0.07, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(s * 0.2, -s * 0.95, s * 0.07, 0, Math.PI * 2); ctx.fill();
  // Nose
  ctx.fillStyle = '#2a6a2a';
  ctx.beginPath(); ctx.ellipse(0, -s * 0.82, s * 0.1, s * 0.07, 0, 0, Math.PI * 2); ctx.fill();
  // Weapon stub
  ctx.strokeStyle = '#8B5E3C'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(s * 0.6, -s * 0.2); ctx.lineTo(s * 0.6, -s * 0.9); ctx.stroke();
}

function drawWolf(ctx, gs, enemy, bob) {
  const s = gs * 0.32;
  const run = Math.sin(state.gameTime * 16 + enemy.pathIndex) * 3;
  ctx.translate(0, bob * 0.3);
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(0, s * 0.9, s * 0.9, s * 0.2, 0, 0, Math.PI * 2); ctx.fill();
  // Legs
  ctx.fillStyle = '#3a6a8a';
  ctx.fillRect(-s * 0.55, s * 0.2, s * 0.22, s * 0.7 + run * 0.05);
  ctx.fillRect(-s * 0.2, s * 0.2, s * 0.22, s * 0.7 - run * 0.05);
  ctx.fillRect(s * 0.05, s * 0.2, s * 0.22, s * 0.7 + run * 0.05);
  ctx.fillRect(s * 0.35, s * 0.2, s * 0.22, s * 0.7 - run * 0.05);
  // Body (elongated)
  ctx.fillStyle = '#5a9acc';
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.9, s * 0.55, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3a6a8a'; ctx.lineWidth = 1.5; ctx.stroke();
  // Tail
  ctx.fillStyle = '#5a9acc';
  ctx.beginPath(); ctx.moveTo(-s * 0.8, -s * 0.1); ctx.quadraticCurveTo(-s * 1.3, -s * 0.8, -s * 0.9, -s * 0.6); ctx.fill();
  // Head
  ctx.fillStyle = '#6aaadd';
  ctx.beginPath(); ctx.ellipse(s * 0.7, -s * 0.35, s * 0.55, s * 0.42, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3a6a8a'; ctx.lineWidth = 1; ctx.stroke();
  // Ears
  ctx.fillStyle = '#5a9acc';
  ctx.beginPath(); ctx.moveTo(s * 0.55, -s * 0.65); ctx.lineTo(s * 0.42, -s * 1.0); ctx.lineTo(s * 0.7, -s * 0.7); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(s * 0.8, -s * 0.65); ctx.lineTo(s * 0.9, -s * 1.0); ctx.lineTo(s * 1.0, -s * 0.65); ctx.closePath(); ctx.fill();
  // Eye
  ctx.fillStyle = '#ff4';
  ctx.beginPath(); ctx.arc(s * 0.88, -s * 0.42, s * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(s * 0.88, -s * 0.42, s * 0.05, 0, Math.PI * 2); ctx.fill();
  // Snout
  ctx.fillStyle = '#4a8acc';
  ctx.beginPath(); ctx.ellipse(s * 1.1, -s * 0.25, s * 0.22, s * 0.14, 0.3, 0, Math.PI * 2); ctx.fill();
  // Nose
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(s * 1.22, -s * 0.2, s * 0.06, 0, Math.PI * 2); ctx.fill();
}

function drawGolem(ctx, gs, enemy, bob) {
  const s = gs * 0.42;
  ctx.translate(0, bob * 0.3);
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(0, s * 1.1, s * 1.0, s * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  // Legs (thick)
  ctx.fillStyle = '#7a5a3a';
  ctx.fillRect(-s * 0.55, s * 0.3, s * 0.45, s * 0.85);
  ctx.fillRect(s * 0.1, s * 0.3, s * 0.45, s * 0.85);
  ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 1.5;
  ctx.strokeRect(-s * 0.55, s * 0.3, s * 0.45, s * 0.85);
  ctx.strokeRect(s * 0.1, s * 0.3, s * 0.45, s * 0.85);
  // Body
  ctx.fillStyle = '#9a7a5a';
  ctx.beginPath(); ctx.roundRect(-s * 0.8, -s * 0.5, s * 1.6, s * 1.0, 4); ctx.fill();
  ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 2; ctx.stroke();
  // Arms
  ctx.fillStyle = '#8a6a4a';
  ctx.beginPath(); ctx.roundRect(-s * 1.2, -s * 0.4, s * 0.45, s * 0.9, 3); ctx.fill();
  ctx.beginPath(); ctx.roundRect(s * 0.75, -s * 0.4, s * 0.45, s * 0.9, 3); ctx.fill();
  ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 1.5; ctx.stroke();
  // Crack lines
  ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.4); ctx.lineTo(-s * 0.1, s * 0.1); ctx.lineTo(-s * 0.35, s * 0.4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s * 0.2, -s * 0.3); ctx.lineTo(s * 0.35, s * 0.2); ctx.stroke();
  // Head
  ctx.fillStyle = '#aa8a6a';
  ctx.beginPath(); ctx.roundRect(-s * 0.55, -s * 1.35, s * 1.1, s * 0.9, 3); ctx.fill();
  ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 2; ctx.stroke();
  // Eyes (glowing)
  const glowAlpha = 0.6 + 0.4 * Math.sin(state.gameTime * 3);
  ctx.fillStyle = `rgba(255,80,0,${glowAlpha})`;
  ctx.beginPath(); ctx.arc(-s * 0.25, -s * 0.97, s * 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(s * 0.25, -s * 0.97, s * 0.15, 0, Math.PI * 2); ctx.fill();
  // Mouth line
  ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.6); ctx.lineTo(s * 0.3, -s * 0.6); ctx.stroke();
  // Stone studs
  ctx.fillStyle = '#cc9966';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath(); ctx.arc(i * s * 0.3, -s * 0.1, s * 0.09, 0, Math.PI * 2); ctx.fill();
  }
}

function drawDragon(ctx, gs, enemy, bob) {
  const s = gs * 0.52;
  const t = state.gameTime;
  ctx.translate(0, bob * 0.6);
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(0, s * 1.2, s * 1.2, s * 0.3, 0, 0, Math.PI * 2); ctx.fill();

  // Wings (flapping)
  const wingAngle = Math.sin(t * 6) * 0.3;
  ctx.fillStyle = 'rgba(180,40,40,0.7)';
  ctx.save(); ctx.rotate(-wingAngle);
  ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.2); ctx.lineTo(-s * 1.6, -s * 0.9); ctx.lineTo(-s * 1.2, s * 0.1); ctx.lineTo(-s * 0.5, s * 0.15); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.rotate(wingAngle);
  ctx.beginPath(); ctx.moveTo(s * 0.3, -s * 0.2); ctx.lineTo(s * 1.6, -s * 0.9); ctx.lineTo(s * 1.2, s * 0.1); ctx.lineTo(s * 0.5, s * 0.15); ctx.closePath(); ctx.fill();
  ctx.restore();
  // Wing membranes
  ctx.fillStyle = 'rgba(220,80,80,0.4)';
  ctx.save(); ctx.rotate(-wingAngle);
  ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.2); ctx.lineTo(-s * 1.6, -s * 0.9); ctx.lineTo(-s * 0.9, s * 0.1); ctx.closePath(); ctx.fill();
  ctx.restore();

  // Tail
  ctx.strokeStyle = '#cc3333'; ctx.lineWidth = s * 0.3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-s * 0.3, s * 0.4);
  ctx.quadraticCurveTo(-s * 1.0, s * 0.9, -s * 0.7, s * 0.2);
  ctx.stroke();
  ctx.lineCap = 'butt';

  // Body
  ctx.fillStyle = '#cc3333';
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.75, s * 0.65, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#881111'; ctx.lineWidth = 2; ctx.stroke();
  // Belly scales
  ctx.fillStyle = '#ff8888';
  ctx.beginPath(); ctx.ellipse(0, s * 0.1, s * 0.4, s * 0.45, 0, 0, Math.PI * 2); ctx.fill();
  // Spine spikes
  ctx.fillStyle = '#ff4444';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath(); ctx.moveTo(i * s * 0.25, -s * 0.65); ctx.lineTo(i * s * 0.25 - s * 0.1, -s * 0.9); ctx.lineTo(i * s * 0.25 + s * 0.1, -s * 0.9); ctx.closePath(); ctx.fill();
  }
  // Head
  ctx.fillStyle = '#dd4444';
  ctx.beginPath(); ctx.ellipse(s * 0.55, -s * 0.5, s * 0.6, s * 0.48, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#881111'; ctx.lineWidth = 2; ctx.stroke();
  // Horns
  ctx.fillStyle = '#881111';
  ctx.beginPath(); ctx.moveTo(s * 0.35, -s * 0.85); ctx.lineTo(s * 0.15, -s * 1.25); ctx.lineTo(s * 0.5, -s * 0.95); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(s * 0.65, -s * 0.85); ctx.lineTo(s * 0.6, -s * 1.3); ctx.lineTo(s * 0.85, -s * 0.95); ctx.closePath(); ctx.fill();
  // Eyes (glowing)
  ctx.fillStyle = '#ffff00';
  ctx.beginPath(); ctx.arc(s * 0.75, -s * 0.58, s * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff8800';
  ctx.beginPath(); ctx.arc(s * 0.75, -s * 0.58, s * 0.07, 0, Math.PI * 2); ctx.fill();
  // Nostril fire
  const fireAlpha = 0.5 + 0.5 * Math.sin(t * 8);
  ctx.fillStyle = `rgba(255,120,0,${fireAlpha})`;
  ctx.beginPath(); ctx.arc(s * 1.05, -s * 0.38, s * 0.07, 0, Math.PI * 2); ctx.fill();
}

function drawEnemyHPBar(ctx, gs, enemy) {
  const s = gs * 0.35 * (enemy.size || 1);
  const hpPct = enemy.hp / enemy.maxHp;
  const barW = gs * 0.75 * (enemy.size || 1);
  const barH = 5;
  const barX = -barW / 2;
  const barY = -s - 10;

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
  ctx.fillStyle = '#333';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = hpPct > 0.6 ? '#44cc44' : hpPct > 0.3 ? '#cccc44' : '#cc4444';
  ctx.fillRect(barX, barY, barW * hpPct, barH);
  // Boss label
  if (enemy.type === 'boss') {
    ctx.fillStyle = '#ff4';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('BOSS', 0, barY - 2);
  }
}

// ── Projectiles ────────────────────────────────────────────────────
function drawProjectiles(ctx) {
  for (const proj of state.projectiles) {
    if (!proj.alive) continue;
    ctx.save();
    ctx.translate(proj.x, proj.y);

    switch (proj.towerType) {
      case 'arrow': drawArrowProjectile(ctx, proj); break;
      case 'cannon': drawCannonProjectile(ctx, proj); break;
      case 'ice': drawIceProjectile(ctx, proj); break;
      case 'lightning': drawLightningProjectile(ctx, proj); break;
      default:
        ctx.fillStyle = proj.color;
        ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}

function drawArrowProjectile(ctx, proj) {
  const angle = proj.angle || 0;
  ctx.rotate(angle);
  // Arrow shaft
  ctx.strokeStyle = '#8B5E3C'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(6, 0); ctx.stroke();
  // Arrow head
  ctx.fillStyle = '#aaa';
  ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(2, -3); ctx.lineTo(2, 3); ctx.closePath(); ctx.fill();
  // Feathers
  ctx.strokeStyle = '#888'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-9, -3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-9, 3); ctx.stroke();
}

function drawCannonProjectile(ctx, proj) {
  // Cannonball
  const grd = ctx.createRadialGradient(-1, -1, 0, 0, 0, 5);
  grd.addColorStop(0, '#888');
  grd.addColorStop(1, '#222');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
}

function drawIceProjectile(ctx, proj) {
  const t = state.gameTime;
  ctx.fillStyle = '#aaddff';
  ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.stroke();
  // Sparkle
  ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 20)})`;
  ctx.beginPath(); ctx.arc(1, -1, 1.5, 0, Math.PI * 2); ctx.fill();
}

function drawLightningProjectile(ctx, proj) {
  // Animated electric bolt — bright stroke instead of shadowBlur
  ctx.strokeStyle = '#ffff88'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,100,0.8)';
  ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
}

// ── Particles ──────────────────────────────────────────────────────
function drawParticles(ctx) {
  for (const p of state.particles) {
    if (!p.alive) continue;
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFloatingTexts(ctx) {
  for (const ft of state.floatingTexts) {
    const alpha = Math.min(1, ft.life / ft.maxLife * 2);
    ctx.globalAlpha = alpha;
    const fontSize = ft.fontSize || 14;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Outline
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
  }
  ctx.globalAlpha = 1;
}

// ── Hover preview ──────────────────────────────────────────────────
function drawHoverPreview(ctx) {
  if (state.phase === 'prep' && state.hoverCol != null) {
    const col = state.hoverCol;
    const row = state.hoverRow;
    const gs = CONFIG.GRID_SIZE;
    const canPlace = !isPathTile(col, row) && !isOccupied(col, row) &&
      col >= 0 && col < CONFIG.COLS && row >= 0 && row < CONFIG.ROWS;

    ctx.fillStyle = canPlace ? 'rgba(100,255,100,0.2)' : 'rgba(255,100,100,0.2)';
    ctx.fillRect(col * gs, row * gs, gs, gs);
    ctx.strokeStyle = canPlace ? 'rgba(100,255,100,0.6)' : 'rgba(255,100,100,0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(col * gs, row * gs, gs, gs);

    if (canPlace) {
      const template = CONFIG.TOWER_TYPES[state.selectedTower];
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(col * gs + gs / 2, row * gs + gs / 2, template.range * gs, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

// ── Wave prep UI (countdown + next wave preview) ───────────────────
const ENEMY_ICONS = { basic: '👺', fast: '🐺', tank: '🪨', boss: '🐉' };

function drawPrepUI(ctx) {
  if (state.phase !== 'prep' || state.prepCountdown <= 0) return;

  const W = state.canvas.width;
  const H = state.canvas.height;
  const cx = W / 2;
  const nextWave = state.wave + 1;
  const preview = getNextWavePreview(nextWave);
  const countdown = Math.ceil(state.prepCountdown);
  const earlyBonus = Math.floor(state.prepCountdown * 3);

  // Panel background
  const panelW = Math.min(320, W - 32);
  const panelH = 120;
  const px = cx - panelW / 2;
  const py = H * 0.18;

  ctx.globalAlpha = 0.88;
  ctx.fillStyle = '#0a0f1e';
  ctx.beginPath();
  ctx.roundRect(px, py, panelW, panelH, 14);
  ctx.fill();
  ctx.strokeStyle = '#2a4080';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Title
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#aabbd0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`WAVE ${nextWave} 준비`, cx, py + 18);

  // Countdown circle
  const circX = px + panelW - 38;
  const circY = py + panelH / 2;
  const radius = 26;
  const progress = state.prepCountdown / state.prepDuration;

  ctx.beginPath();
  ctx.arc(circX, circY, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
  ctx.strokeStyle = countdown <= 3 ? '#ff4444' : '#44aaff';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.font = `bold ${countdown >= 10 ? 18 : 22}px sans-serif`;
  ctx.fillStyle = countdown <= 3 ? '#ff6666' : '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(countdown, circX, circY);

  // Enemy preview badges
  const startX = px + 14;
  let bx = startX;
  const by = py + 50;
  for (const { type, count } of preview) {
    const cfg = CONFIG.ENEMY_TYPES[type];
    const icon = ENEMY_ICONS[type] || '?';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = cfg.color;
    ctx.fillText(`${icon} ×${count}`, bx, by);
    bx += 64;
    if (bx > px + panelW - 60) { bx = startX; }
  }

  // Early start bonus hint
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#ffd700';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`조기 시작 시 +${earlyBonus}g 보너스`, cx, py + panelH - 14);
}

// ── Main render ────────────────────────────────────────────────────
function render() {
  const ctx = state.ctx;
  const gs = CONFIG.GRID_SIZE;

  // Screen shake offset
  let shakeX = 0, shakeY = 0;
  if (state.screenShake > 0) {
    shakeX = (Math.random() - 0.5) * state.screenShake;
    shakeY = (Math.random() - 0.5) * state.screenShake;
  }

  ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
  ctx.save();
  if (shakeX || shakeY) ctx.translate(shakeX, shakeY);

  // Cached background (ground gradient + grid)
  if (!state._bgCanvas || state._bgDirty) {
    if (!state._bgCanvas) {
      state._bgCanvas = document.createElement('canvas');
    }
    state._bgCanvas.width = state.canvas.width;
    state._bgCanvas.height = state.canvas.height;
    const bgCtx = state._bgCanvas.getContext('2d');
    drawBackground(bgCtx);
    drawPath(bgCtx);
    state._bgDirty = false;
  }
  ctx.drawImage(state._bgCanvas, 0, 0);
  drawDecorations(ctx);
  drawHoverPreview(ctx);
  drawSynergyConnections(ctx);
  drawTowers(ctx);
  drawSoulDrops(ctx);
  drawEnemies(ctx);
  drawProjectiles(ctx);
  drawParticles(ctx);
  drawFloatingTexts(ctx);
  drawPrepUI(ctx);
  drawAirstrikeTargeting(ctx);

  ctx.restore();
}

function drawAirstrikeTargeting(ctx) {
  if (state.targetingSkill !== 'airstrike') return;
  if (state.hoverCol == null || state.hoverRow == null) return;

  const gs = CONFIG.GRID_SIZE;
  const cx = state.hoverCol * gs + gs / 2;
  const cy = state.hoverRow * gs + gs / 2;
  const radius = gs * 2.5;

  // Pulsing targeting ring
  const pulse = 0.7 + 0.3 * Math.sin(state.gameTime * 6);

  ctx.save();
  ctx.globalAlpha = 0.55 * pulse;
  ctx.strokeStyle = '#ff6600';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Fill tint
  ctx.globalAlpha = 0.12 * pulse;
  ctx.fillStyle = '#ff6600';
  ctx.fill();

  // Crosshair lines
  ctx.globalAlpha = 0.7 * pulse;
  ctx.setLineDash([]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.4, cy); ctx.lineTo(cx + radius * 0.4, cy);
  ctx.moveTo(cx, cy - radius * 0.4); ctx.lineTo(cx, cy + radius * 0.4);
  ctx.stroke();
  ctx.restore();
}
