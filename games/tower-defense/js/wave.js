// Deterministic wave composition shared by preview and generation
function _buildWaveComposition(waveNum) {
  const baseCount = 5 + waveNum * 2;
  const types = [];

  for (let i = 0; i < baseCount; i++) {
    if (waveNum % 5 === 0 && i === baseCount - 1) {
      types.push('boss');
    } else if (waveNum >= 5 && i % 5 === 4) {
      types.push('tank');
    } else if (waveNum >= 3 && i % 3 === 2) {
      types.push('fast');
    } else {
      types.push('basic');
    }
  }

  return types;
}

// Returns a summary of what enemies will appear in the given wave
function getNextWavePreview(waveNum) {
  const types = _buildWaveComposition(waveNum);
  const counts = { basic: 0, fast: 0, tank: 0, boss: 0 };

  for (const t of types) counts[t]++;

  return Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(([type, count]) => ({ type, count }));
}

function generateWave(waveNum) {
  const types = _buildWaveComposition(waveNum);
  const enemies = [];
  const hpScale = 1 + (waveNum - 1) * 0.3;
  const stageScale = STAGES[state.currentStageIndex].enemyScale || 1.0;

  for (let i = 0; i < types.length; i++) {
    const enemy = createEnemy(types[i], i * 0.6);
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
  if (typeof playWaveStart === 'function') playWaveStart();
  // Boss wave announcement
  if (state.wave % 5 === 0 && typeof playBossAppear === 'function') {
    setTimeout(playBossAppear, 600);
  }
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

  // Deduct lives individually for each leaked enemy
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    if (state.enemies[i].reached) {
      state.lives--;
      state.enemies.splice(i, 1);
    }
  }

  state.enemies = [];
  state.projectiles = [];

  if (state.lives <= 0) {
    state.lives = 0;
    state.phase = 'gameover';
    // Compute game over stats
    const totalKills = state.towers.reduce((sum, t) => sum + t.kills, 0);
    let mostUsedType = '-';
    if (state.towers.length > 0) {
      const counts = {};
      for (const t of state.towers) {
        const type = getTowerBaseType(t);
        counts[type] = (counts[type] || 0) + 1;
      }
      mostUsedType = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      const tmpl = CONFIG.TOWER_TYPES[mostUsedType];
      if (tmpl) mostUsedType = `${tmpl.icon} ${tmpl.name}`;
    }
    const statsHTML =
      `<span class="stat-label">도달 웨이브</span> <span class="stat-value">${state.wave}</span><br>` +
      `<span class="stat-label">총 처치</span> <span class="stat-value">${totalKills}</span><br>` +
      `<span class="stat-label">최다 타워</span> <span class="stat-value">${mostUsedType}</span>`;
    showOverlay('Game Over', `점수: ${state.score}`, '스테이지 선택', 'gameover', statsHTML);
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
