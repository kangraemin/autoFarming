function setupInput() {
  const canvas = state.canvas;

  // Tower shop selection
  document.getElementById('tower-shop').addEventListener('click', (e) => {
    const btn = e.target.closest('.tower-btn');
    if (!btn) return;
    document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    state.selectedTower = btn.dataset.tower;
    closePopup();
    if (typeof playUIClick === 'function') playUIClick();
  });

  // Shared canvas input handler for click and touch
  function handleCanvasInput(x, y) {
    // Airstrike targeting mode — deliver skill
    if (state.targetingSkill) {
      const skillId = state.targetingSkill;
      state.targetingSkill = null;
      document.body.classList.remove('targeting-mode');
      activateSkill(skillId, x, y);
      return;
    }

    // Check if clicking a soul drop (priority over tower placement)
    for (const drop of state.soulDrops) {
      const dx = x - drop.x;
      const dy = y - drop.y;
      if (Math.sqrt(dx * dx + dy * dy) <= drop.radius * 2.5) {
        collectSoul(drop);
        return;
      }
    }

    const col = Math.floor(x / CONFIG.GRID_SIZE);
    const row = Math.floor(y / CONFIG.GRID_SIZE);

    // Check if clicking an existing tower
    const existingTower = state.towers.find(t => t.col === col && t.row === row);
    if (existingTower) {
      showUpgradePopup(existingTower);
      return;
    }

    // Place new tower
    if (state.phase === 'prep' || state.phase === 'wave') {
      placeTower(state.selectedTower, col, row);
      updateUI();
    }
  }

  // Canvas click
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    handleCanvasInput(e.clientX - rect.left, e.clientY - rect.top);
  });

  // Canvas hover
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    state.hoverCol = Math.floor((e.clientX - rect.left) / CONFIG.GRID_SIZE);
    state.hoverRow = Math.floor((e.clientY - rect.top) / CONFIG.GRID_SIZE);
  });

  canvas.addEventListener('mouseleave', () => {
    state.hoverCol = null;
    state.hoverRow = null;
  });

  // Touch support
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    handleCanvasInput(touch.clientX - rect.left, touch.clientY - rect.top);
  });

  // Start wave button
  document.getElementById('start-wave-btn').addEventListener('click', () => {
    startWave(true); // earlyStart = true for manual clicks
  });

  // Speed button
  document.getElementById('speed-btn').addEventListener('click', () => {
    if (state.speed === 1) state.speed = 2;
    else if (state.speed === 2) state.speed = 3;
    else state.speed = 1;
    document.getElementById('speed-btn').textContent = `⏩ ${state.speed}x`;
  });

  // Upgrade popup buttons
  document.getElementById('upgrade-btn').addEventListener('click', () => {
    if (state.selectedPlacedTower) {
      upgradeTower(state.selectedPlacedTower);
      showUpgradePopup(state.selectedPlacedTower); // refresh
      updateUI();
    }
  });

  document.getElementById('sell-btn').addEventListener('click', () => {
    if (state.selectedPlacedTower) {
      sellTower(state.selectedPlacedTower);
      closePopup();
      updateUI();
    }
  });

  document.getElementById('close-popup').addEventListener('click', closePopup);

  // Fusion button clicks (delegated)
  document.getElementById('fusion-options').addEventListener('click', (e) => {
    const btn = e.target.closest('.fusion-btn');
    if (!btn || !state.selectedPlacedTower) return;
    const recipeId = btn.dataset.recipe;
    const success = performFusion(state.selectedPlacedTower, recipeId);
    if (success) {
      showUpgradePopup(state.selectedPlacedTower); // refresh popup
      updateUI();
    }
  });

  // Skills bar
  document.getElementById('skills-bar').addEventListener('click', (e) => {
    const btn = e.target.closest('.skill-btn');
    if (!btn) return;
    const skillId = btn.dataset.skill;
    const def = SKILL_DEFS[skillId];
    if (!def) return;

    if (!isSkillReady(skillId)) return; // on cooldown

    if (def.requiresTarget) {
      // Toggle targeting mode
      if (state.targetingSkill === skillId) {
        state.targetingSkill = null;
        document.body.classList.remove('targeting-mode');
      } else {
        state.targetingSkill = skillId;
        document.body.classList.add('targeting-mode');
      }
      updateSkillUI();
    } else {
      activateSkill(skillId, 0, 0);
    }
  });

  // Stage select button (top bar)
  document.getElementById('stage-select-btn').addEventListener('click', () => {
    showStageSelect();
  });

  // Codex button
  document.getElementById('codex-btn').addEventListener('click', () => {
    const modal = document.getElementById('codex-modal');
    document.getElementById('codex-list').innerHTML = renderCodexList();
    document.getElementById('codex-count').textContent = `${state.codex.length} / ${FUSION_RECIPES.length}`;
    modal.classList.remove('hidden');
  });

  document.getElementById('codex-close').addEventListener('click', () => {
    document.getElementById('codex-modal').classList.add('hidden');
  });

  // Overlay button
  document.getElementById('overlay-btn').addEventListener('click', () => {
    const action = document.getElementById('overlay-btn').dataset.action;
    document.getElementById('overlay').classList.add('hidden');
    // Remove secondary back button if present
    const backBtn = document.getElementById('overlay-back-btn');
    if (backBtn) backBtn.remove();

    if (action === 'gameover' || action === 'stageselect') {
      showStageSelect();
    } else if (action === 'nextstage') {
      const nextIdx = state.currentStageIndex + 1;
      if (nextIdx < STAGES.length && isStageUnlocked(nextIdx)) {
        startStage(nextIdx);
      } else {
        showStageSelect();
      }
    } else {
      // Legacy: restart current stage
      startStage(state.currentStageIndex);
    }
  });
}

function showUpgradePopup(tower) {
  state.selectedPlacedTower = tower;
  const baseTowerType = tower.fusedSpec ? tower.fusedSpec.baseType : tower.type;
  const template = CONFIG.TOWER_TYPES[baseTowerType];
  const upgCost = template.upgradeCost(tower.level);

  const fusedLabel = tower.fusedSpec
    ? `<span style="color:${tower.fusedSpec.color}">${tower.fusedSpec.name}</span>`
    : template.name;

  document.getElementById('popup-title').innerHTML = `${template.icon} ${fusedLabel} Lv${tower.level}`;
  document.getElementById('popup-stats').innerHTML =
    `Damage: ${tower.damage} | Range: ${tower.range.toFixed(1)} | Kills: ${tower.kills}<br>` +
    `Upgrade: ${upgCost}g | Sell: ${Math.floor(template.cost * 0.6)}g`;
  document.getElementById('upgrade-btn').textContent = `⬆ Upgrade (${upgCost}g)`;
  document.getElementById('upgrade-btn').disabled = state.gold < upgCost;

  // Fusion options
  const fusionOptions = getFusionOptions(tower);
  const fusionEl = document.getElementById('fusion-options');
  if (fusionOptions.length > 0) {
    fusionEl.innerHTML = '<div class="fusion-label">✨ 합성 가능</div>' +
      fusionOptions.map(r => {
        const soulInfo = SOUL_TYPES[r.soul];
        return `<button class="fusion-btn" data-recipe="${r.id}"
          style="border-color:${r.color};color:${r.color}"
          title="${r.desc}">
          ${r.name}
          <span class="fusion-cost" style="color:${soulInfo.color}">${soulInfo.name.split(' ')[0]} ×1</span>
        </button>`;
      }).join('');
    fusionEl.style.display = 'block';
  } else {
    fusionEl.innerHTML = '';
    fusionEl.style.display = 'none';
  }

  document.getElementById('upgrade-popup').classList.remove('hidden');
}

function closePopup() {
  state.selectedPlacedTower = null;
  document.getElementById('upgrade-popup').classList.add('hidden');
}

function showOverlay(title, text, btnText, action, stats) {
  document.getElementById('overlay-title').textContent = title;
  document.getElementById('overlay-text').textContent = text;
  const btn = document.getElementById('overlay-btn');
  btn.textContent = btnText;
  btn.dataset.action = action || '';

  // Stats panel (game over only)
  const statsEl = document.getElementById('overlay-stats');
  if (stats) {
    statsEl.innerHTML = stats;
    statsEl.style.display = 'block';
  } else {
    statsEl.innerHTML = '';
    statsEl.style.display = 'none';
  }

  document.getElementById('overlay').classList.remove('hidden');
}

function updateUI() {
  document.getElementById('gold').textContent = state.gold;
  document.getElementById('wave').textContent = state.wave;
  document.getElementById('lives').textContent = state.lives;
  document.getElementById('score').textContent = state.score;

  // Lives warning: critical < 5, warning < 10
  const livesStat = document.getElementById('lives').parentElement;
  livesStat.classList.toggle('lives-critical', state.lives > 0 && state.lives < 5);
  livesStat.classList.toggle('lives-warning', state.lives >= 5 && state.lives < 10);

  // Gold flash on change
  const goldStat = document.getElementById('gold').parentElement;
  if (state._prevGold !== undefined && state._prevGold !== state.gold) {
    goldStat.classList.add('gold-flash');
    clearTimeout(state._goldFlashTimer);
    state._goldFlashTimer = setTimeout(() => goldStat.classList.remove('gold-flash'), 400);
  }
  state._prevGold = state.gold;

  // Update tower shop affordability
  document.querySelectorAll('.tower-btn').forEach(btn => {
    const cost = parseInt(btn.dataset.cost);
    btn.classList.toggle('disabled', state.gold < cost);
  });

  // Start wave button
  const startBtn = document.getElementById('start-wave-btn');
  startBtn.disabled = state.phase === 'wave';
  if (state.phase === 'wave') {
    startBtn.textContent = '🌊 진행 중...';
  } else if (state.prepCountdown > 0) {
    const bonus = Math.floor(state.prepCountdown * 3);
    startBtn.textContent = `▶ 조기시작 (+${bonus}g) ${Math.ceil(state.prepCountdown)}s`;
  } else {
    startBtn.textContent = `▶ Wave ${state.wave + 1} 시작`;
  }
}
