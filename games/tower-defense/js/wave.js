// Returns a summary of what enemies will appear in the given wave
function getNextWavePreview(waveNum) {
  const baseCount = 5 + waveNum * 2;
  const counts = { basic: 0, fast: 0, tank: 0, boss: 0 };

  for (let i = 0; i < baseCount; i++) {
    if (waveNum % 5 === 0 && i === baseCount - 1) {
      counts.boss++;
    } else if (waveNum >= 5 && i % 5 === 4) {
      counts.tank++;
    } else if (waveNum >= 3 && i % 3 === 2) {
      counts.fast++;
    } else {
      counts.basic++;
    }
  }

  return Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(([type, count]) => ({ type, count }));
}

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

// earlyStart: true when player clicks start button before countdown ends
function startWave(earlyStart) {
  if (state.phase !== 'prep') return;

  // Early start bonus: 3g per remaining second
  if (earlyStart && state.prepCountdown > 0) {
    const bonus = Math.floor(state.prepCountdown * 3);
    state.gold += bonus;
    state.score += bonus;
    // Floating text feedback
    if (state.canvas) {
      const cx = state.canvas.width / 2;
      const cy = state.canvas.height * 0.4;
      state.floatingTexts.push({ x: cx, y: cy, text: `+${bonus}g 조기시작!`, color: '#ffd700', life: 2.0, maxLife: 2.0, vy: -55, fontSize: 22 });
    }
  }

  state.prepCountdown = 0;
  state.wave++;
  state.phase = 'wave';
  state.enemies = generateWave(state.wave);
  updateUI();
}

function updatePrepCountdown(rawDt) {
  if (state.phase !== 'prep' || state.prepCountdown <= 0) return;

  state.prepCountdown -= rawDt;

  if (state.prepCountdown <= 0) {
    state.prepCountdown = 0;
    startWave(false); // auto-start, no bonus
  }
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
    // Wave clear bonus
    const bonus = state.wave * 20;
    state.gold += bonus;
    state.score += bonus;
    state.phase = 'prep';
    // Start countdown for next wave
    state.prepCountdown = Math.max(10, 18 - state.wave * 0.5);
  }

  state.enemies = [];
  state.projectiles = [];
  updateUI();
}
