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
  });

  // Canvas click — collect soul, place tower or select existing
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Check soul orbs first
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

    const existingTower = state.towers.find(t => t.col === col && t.row === row);
    if (existingTower) {
      showUpgradePopup(existingTower);
      return;
    }

    placeTower(state.selectedTower, col, row);
    updateUI();
  });

  // Start wave button
  document.getElementById('start-wave-btn').addEventListener('click', () => {
    startWave();
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
    document.getElementById('overlay').classList.add('hidden');
    if (state.phase === 'gameover') {
      initState();
      generatePath();
      updateUI();
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

function showOverlay(title, text, btnText) {
  document.getElementById('overlay-title').textContent = title;
  document.getElementById('overlay-text').textContent = text;
  document.getElementById('overlay-btn').textContent = btnText;
  document.getElementById('overlay').classList.remove('hidden');
}

function updateUI() {
  document.getElementById('gold').textContent = state.gold;
  document.getElementById('wave').textContent = state.wave;
  document.getElementById('lives').textContent = state.lives;
  document.getElementById('score').textContent = state.score;

  // Update tower shop affordability
  document.querySelectorAll('.tower-btn').forEach(btn => {
    const cost = parseInt(btn.dataset.cost);
    btn.classList.toggle('disabled', state.gold < cost);
  });

  // Start wave button
  const startBtn = document.getElementById('start-wave-btn');
  startBtn.disabled = state.phase === 'wave';
  startBtn.textContent = state.phase === 'wave' ? '🌊 In Progress...' : `▶ Wave ${state.wave + 1}`;
}
