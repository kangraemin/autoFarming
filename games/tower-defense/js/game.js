function gameLoop(timestamp) {
  if (!state.lastTime) state.lastTime = timestamp;
  let dt = (timestamp - state.lastTime) / 1000;
  state.lastTime = timestamp;

  if (dt > 0.1) dt = 0.1;

  const rawDt = dt;
  dt *= state.speed;

  // Always advance gameTime at real speed (for animations)
  state.gameTime += rawDt;

  if (state.phase === 'wave') {
    for (const enemy of state.enemies) updateEnemy(enemy, dt);
    for (const tower of state.towers) updateTower(tower, dt);
    for (const proj of state.projectiles) updateProjectile(proj, dt);
    state.projectiles = state.projectiles.filter(p => p.alive);
    checkWaveEnd();
  }

  // Prep countdown uses real time (not speed-scaled)
  if (state.phase === 'prep' && state.prepCountdown > 0) {
    updatePrepCountdown(rawDt);
    updateUI(); // keep button text synced with countdown
  } else {
    updatePrepCountdown(rawDt);
  }

  // Recompute tower synergies every frame (cheap: O(towers²), max ~20 towers)
  if (typeof computeSynergies === 'function') computeSynergies();

  // Particles and soul drops always update at real speed
  updateParticles(rawDt);
  updateSoulDrops(rawDt);
  updateSkillCooldowns(rawDt);
  updateSkillUI();

  render();

  requestAnimationFrame(gameLoop);
}

function init() {
  state.canvas = document.getElementById('game-canvas');
  state.ctx = state.canvas.getContext('2d');

  resizeCanvas();
  generatePath();
  generateDecorations();
  setupInput();
  updateUI();

  window.addEventListener('resize', () => {
    resizeCanvas();
    generatePath();
    generateDecorations();
    state.towers = state.towers.filter(t =>
      t.col < CONFIG.COLS && t.row < CONFIG.ROWS && !isPathTile(t.col, t.row)
    );
  });

  requestAnimationFrame(gameLoop);

  // Show stage select on first load
  showStageSelect();
}

document.addEventListener('DOMContentLoaded', init);
