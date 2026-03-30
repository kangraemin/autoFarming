function gameLoop(timestamp) {
  if (!state.lastTime) state.lastTime = timestamp;
  let dt = (timestamp - state.lastTime) / 1000;
  state.lastTime = timestamp;

  // Clamp dt to prevent spiral of death
  if (dt > 0.1) dt = 0.1;

  // Apply speed multiplier
  dt *= state.speed;

  if (state.phase === 'wave') {
    // Update enemies
    for (const enemy of state.enemies) {
      updateEnemy(enemy, dt);
    }

    // Update towers
    for (const tower of state.towers) {
      updateTower(tower, dt);
    }

    // Update projectiles
    for (const proj of state.projectiles) {
      updateProjectile(proj, dt);
    }

    // Clean up dead projectiles
    state.projectiles = state.projectiles.filter(p => p.alive);

    // Check wave completion
    checkWaveEnd();
  }

  // Render
  render();

  requestAnimationFrame(gameLoop);
}

function init() {
  state.canvas = document.getElementById('game-canvas');
  state.ctx = state.canvas.getContext('2d');

  resizeCanvas();
  generatePath();
  setupInput();
  updateUI();

  window.addEventListener('resize', () => {
    resizeCanvas();
    generatePath();
    // Re-validate existing towers
    state.towers = state.towers.filter(t =>
      t.col < CONFIG.COLS && t.row < CONFIG.ROWS && !isPathTile(t.col, t.row)
    );
  });

  requestAnimationFrame(gameLoop);
}

document.addEventListener('DOMContentLoaded', init);
