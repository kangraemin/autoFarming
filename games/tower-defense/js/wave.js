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
  const stageScale = STAGES[state.currentStageIndex].enemyScale || 1.0;

  for (let i = 0; i < baseCount; i++) {
    let type = 'basic';

    if (waveNum >= 3 && Math.random() < 0.3) type = 'fast';
    if (waveNum >= 5 && Math.random() < 0.2) type = 'tank';
    if (waveNum % 5 === 0 && i === baseCount - 1) type = 'boss';

    const enemy = createEnemy(type, i * 0.6);
    enemy.hp = Math.floor(enemy.hp * hpScale * stageScale);
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

  state.enemies = [];
  state.projectiles = [];

  if (state.lives <= 0) {
    state.lives = 0;
    state.phase = 'gameover';
    showOverlay('Game Over', `${state.wave} 웨이브 생존\n점수: ${state.score}`, '스테이지 선택', 'gameover');
    updateUI();
    return;
  }

  // Check stage completion
  const stage = STAGES[state.currentStageIndex];
  if (state.wave >= stage.waves) {
    const stars = getStageStars(state.lives);
    saveStageProgress(state.currentStageIndex, stars);
    state.phase = 'stageclear';
    showStageClearOverlay(stars);
    updateUI();
    return;
  }

  // Wave clear bonus
  const bonus = state.wave * 20;
  state.gold += bonus;
  state.score += bonus;
  state.phase = 'prep';
  state.prepCountdown = Math.max(10, 18 - state.wave * 0.5);
  updateUI();
}

function showStageClearOverlay(stars) {
  const stage = STAGES[state.currentStageIndex];
  const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  const nextIdx = state.currentStageIndex + 1;
  const hasNext = nextIdx < STAGES.length;

  const title = `${stage.name} 클리어! ${starStr}`;
  const text = `체력 ${state.lives}/20 · 점수 ${state.score}`;
  const btnText = hasNext ? `다음 스테이지 →` : '스테이지 선택';
  const btnAction = hasNext ? 'nextstage' : 'stageselect';

  showOverlay(title, text, btnText, btnAction);
  if (hasNext) {
    // Show "Stage Select" as secondary button
    const overlayContent = document.querySelector('.overlay-content');
    if (!document.getElementById('overlay-back-btn')) {
      const backBtn = document.createElement('button');
      backBtn.id = 'overlay-back-btn';
      backBtn.className = 'action-btn';
      backBtn.style.background = '#555';
      backBtn.style.marginTop = '8px';
      backBtn.textContent = '스테이지 선택';
      backBtn.addEventListener('click', () => {
        document.getElementById('overlay').classList.add('hidden');
        document.getElementById('overlay-back-btn').remove();
        showStageSelect();
      });
      overlayContent.appendChild(backBtn);
    }
  }
}
