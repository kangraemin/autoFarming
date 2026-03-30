function generateWave(waveNum) {
  const enemies = [];
  const baseCount = 5 + waveNum * 2;
  const hpScale = 1 + (waveNum - 1) * 0.3;

  for (let i = 0; i < baseCount; i++) {
    let type = 'basic';

    if (waveNum >= 3 && Math.random() < 0.3) type = 'fast';
    if (waveNum >= 5 && Math.random() < 0.2) type = 'tank';
    if (waveNum % 5 === 0 && i === baseCount - 1) type = 'boss';

    const enemy = createEnemy(type, i * 0.6);
    enemy.hp = Math.floor(enemy.hp * hpScale);
    enemy.maxHp = enemy.hp;
    enemies.push(enemy);
  }

  return enemies;
}

function startWave() {
  if (state.phase !== 'prep') return;
  state.wave++;
  state.phase = 'wave';
  state.enemies = generateWave(state.wave);
  updateUI();
}

function checkWaveEnd() {
  if (state.phase !== 'wave') return;

  const allDead = state.enemies.every(e => !e.alive || e.reached);
  if (!allDead) return;

  // Count leaked enemies
  const leaked = state.enemies.filter(e => e.reached).length;
  state.lives -= leaked;

  if (state.lives <= 0) {
    state.lives = 0;
    state.phase = 'gameover';
    showOverlay('Game Over', `You survived ${state.wave} waves!\nScore: ${state.score}`, 'Restart');
  } else {
    // Wave bonus
    const bonus = state.wave * 20;
    state.gold += bonus;
    state.score += bonus;
    state.phase = 'prep';
  }

  state.enemies = [];
  state.projectiles = [];
  updateUI();
}
