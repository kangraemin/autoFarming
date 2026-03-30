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

  // Canvas click — place tower or select existing
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
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
  const template = CONFIG.TOWER_TYPES[tower.type];
  const upgCost = template.upgradeCost(tower.level);

  document.getElementById('popup-title').textContent = `${template.icon} ${template.name} Lv${tower.level}`;
  document.getElementById('popup-stats').innerHTML =
    `Damage: ${tower.damage} | Range: ${tower.range.toFixed(1)} | Kills: ${tower.kills}<br>` +
    `Upgrade: ${upgCost}g | Sell: ${Math.floor(template.cost * 0.6)}g`;
  document.getElementById('upgrade-btn').textContent = `⬆ Upgrade (${upgCost}g)`;
  document.getElementById('upgrade-btn').disabled = state.gold < upgCost;
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
