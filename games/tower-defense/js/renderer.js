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
}

function render() {
  const ctx = state.ctx;
  const gs = CONFIG.GRID_SIZE;

  ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);

  // Draw grid (subtle)
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= CONFIG.COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * gs, 0);
    ctx.lineTo(c * gs, CONFIG.ROWS * gs);
    ctx.stroke();
  }
  for (let r = 0; r <= CONFIG.ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * gs);
    ctx.lineTo(CONFIG.COLS * gs, r * gs);
    ctx.stroke();
  }

  // Draw path
  ctx.fillStyle = '#2a2a3e';
  for (const p of state.path) {
    ctx.fillRect(p.col * gs, p.row * gs, gs, gs);
  }

  // Path direction indicators
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < state.path.length - 1; i += 3) {
    const p = state.path[i];
    const cx = p.col * gs + gs / 2;
    const cy = p.row * gs + gs / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw towers
  for (const tower of state.towers) {
    const template = CONFIG.TOWER_TYPES[tower.type];
    const x = tower.col * gs;
    const y = tower.row * gs;

    // Base
    ctx.fillStyle = template.color;
    ctx.fillRect(x + 4, y + 4, gs - 8, gs - 8);

    // Level indicator
    if (tower.level > 1) {
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`Lv${tower.level}`, x + gs - 2, y + gs - 2);
    }

    // Range circle when selected
    if (state.selectedPlacedTower === tower) {
      ctx.strokeStyle = 'rgba(233, 69, 96, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, tower.range * gs, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Draw enemies
  for (const enemy of state.enemies) {
    if (!enemy.alive || enemy.reached || enemy.delay > 0) continue;

    const size = gs * 0.35 * (enemy.size || 1);

    // Body
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, size, 0, Math.PI * 2);
    ctx.fill();

    // HP bar
    const hpPct = enemy.hp / enemy.maxHp;
    const barW = gs * 0.7;
    const barH = 4;
    const barX = enemy.x - barW / 2;
    const barY = enemy.y - size - 6;

    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = hpPct > 0.5 ? '#4c4' : hpPct > 0.25 ? '#cc4' : '#c44';
    ctx.fillRect(barX, barY, barW * hpPct, barH);

    // Slow indicator
    if (enemy.slowTimer > 0) {
      ctx.fillStyle = 'rgba(100, 180, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, size + 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw projectiles
  for (const proj of state.projectiles) {
    if (!proj.alive) continue;
    ctx.fillStyle = proj.color;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Hover preview (handled in input.js via hoverCol/hoverRow)
  if (state.phase === 'prep' && state.hoverCol != null) {
    const col = state.hoverCol;
    const row = state.hoverRow;
    const canPlace = !isPathTile(col, row) && !isOccupied(col, row) &&
      col >= 0 && col < CONFIG.COLS && row >= 0 && row < CONFIG.ROWS;

    ctx.fillStyle = canPlace ? 'rgba(100, 255, 100, 0.2)' : 'rgba(255, 100, 100, 0.2)';
    ctx.fillRect(col * gs, row * gs, gs, gs);

    if (canPlace) {
      const template = CONFIG.TOWER_TYPES[state.selectedTower];
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(col * gs + gs / 2, row * gs + gs / 2, template.range * gs, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}
