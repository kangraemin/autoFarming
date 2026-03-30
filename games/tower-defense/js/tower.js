function createTower(type, col, row) {
  const template = CONFIG.TOWER_TYPES[type];
  return {
    type,
    col,
    row,
    x: col * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
    y: row * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
    level: 1,
    damage: template.damage,
    range: template.range,
    fireRate: template.fireRate,
    fireCooldown: 0,
    kills: 0,
  };
}

function placeTower(type, col, row) {
  const template = CONFIG.TOWER_TYPES[type];
  if (state.gold < template.cost) return false;
  if (isPathTile(col, row)) return false;
  if (isOccupied(col, row)) return false;
  if (col < 0 || col >= CONFIG.COLS || row < 0 || row >= CONFIG.ROWS) return false;

  state.gold -= template.cost;
  const tower = createTower(type, col, row);
  state.towers.push(tower);
  state.gridOccupied.add(`${col},${row}`);
  return true;
}

function upgradeTower(tower) {
  const template = CONFIG.TOWER_TYPES[tower.type];
  const cost = template.upgradeCost(tower.level);
  if (state.gold < cost) return false;

  state.gold -= cost;
  tower.level++;
  tower.damage = template.upgradeDamage(tower.level);
  tower.range += 0.2;
  tower.fireRate *= 1.1;
  return true;
}

function sellTower(tower) {
  const template = CONFIG.TOWER_TYPES[tower.type];
  const refund = Math.floor(template.cost * 0.6);
  state.gold += refund;
  state.gridOccupied.delete(`${tower.col},${tower.row}`);
  state.towers = state.towers.filter(t => t !== tower);
  return refund;
}

function findTarget(tower) {
  const rangePx = tower.range * CONFIG.GRID_SIZE;
  let closest = null;
  let closestDist = Infinity;

  for (const enemy of state.enemies) {
    if (!enemy.alive || enemy.reached || enemy.delay > 0) continue;
    const dx = enemy.x - tower.x;
    const dy = enemy.y - tower.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= rangePx && dist < closestDist) {
      closest = enemy;
      closestDist = dist;
    }
  }
  return closest;
}

function updateTower(tower, dt) {
  tower.fireCooldown -= dt;
  if (tower.fireCooldown > 0) return;

  const target = findTarget(tower);
  if (!target) return;

  tower.fireCooldown = 1 / tower.fireRate;
  const template = CONFIG.TOWER_TYPES[tower.type];

  // Create projectile
  state.projectiles.push(createProjectile(tower, target, template));
}
