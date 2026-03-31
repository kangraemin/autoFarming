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
  if (typeof playTowerPlace === 'function') playTowerPlace();
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
  if (typeof playUpgrade === 'function') playUpgrade();
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
  // Periodic fusion abilities (freeze_all, judgment)
  if (tower.fusedSpec) {
    const spec = tower.fusedSpec;
    spec.fusedCooldown -= dt;

    if (spec.special === 'freeze_all' && spec.fusedCooldown <= 0) {
      spec.fusedCooldown = spec.specialParams.cooldown;
      const rangePx = tower.range * CONFIG.GRID_SIZE;
      let frozeAny = false;
      for (const enemy of state.enemies) {
        if (!enemy.alive || enemy.delay > 0) continue;
        const dx = enemy.x - tower.x;
        const dy = enemy.y - tower.y;
        if (Math.sqrt(dx * dx + dy * dy) <= rangePx) {
          enemy.slowAmount = 0.0;
          enemy.slowTimer = spec.specialParams.freezeDuration;
          spawnIceShatter(enemy.x, enemy.y);
          frozeAny = true;
        }
      }
      if (frozeAny) {
        spawnExplosion(tower.x, tower.y, '#88eeff', 22);
        state.screenShake = 4;
        state.floatingTexts.push({
          x: tower.x, y: tower.y - 20,
          text: 'ABSOLUTE ZERO!', color: '#88eeff',
          life: 1.5, maxLife: 1.5, vy: -35, fontSize: 14,
        });
      }
    }

    if (spec.special === 'judgment' && spec.fusedCooldown <= 0) {
      spec.fusedCooldown = spec.specialParams.cooldown;
      let hit = 0;
      for (const enemy of state.enemies) {
        if (!enemy.alive || enemy.delay > 0) continue;
        hitEnemy(enemy, tower.damage, false, '#ffff00');
        spawnExplosion(enemy.x, enemy.y, '#ffff88', 8);
        hit++;
      }
      if (hit > 0) {
        spawnExplosion(tower.x, tower.y, '#ffff00', 30);
        state.screenShake = 8;
        state.floatingTexts.push({
          x: tower.x, y: tower.y - 20,
          text: `JUDGMENT! ×${hit}`, color: '#ffff00',
          life: 1.8, maxLife: 1.8, vy: -40, fontSize: 16,
        });
      }
    }
  }

  tower.fireCooldown -= dt;
  if (tower.fireCooldown > 0) return;

  const target = findTarget(tower);
  if (!target) return;

  // Apply synergy fire-rate bonus for storm_arrow (arrow + lightning)
  let effectiveFireRate = tower.fireRate;
  if (tower.activeSynergies?.includes('storm_arrow') &&
      (tower.type === 'arrow' || tower.fusedSpec?.baseType === 'arrow')) {
    effectiveFireRate *= 1.4;
  }
  tower.fireCooldown = 1 / effectiveFireRate;

  // Use base tower template for projectile properties (color, splash, slow, chain)
  const baseTowerType = getTowerBaseType(tower);
  const template = CONFIG.TOWER_TYPES[baseTowerType];

  // Override splash for siege/dragon cannon
  let effectiveTemplate = template;
  if (tower.fusedSpec?.splashMult) {
    effectiveTemplate = { ...template, splash: (template.splash || 0) * tower.fusedSpec.splashMult };
  }
  if (tower.fusedSpec?.special === 'chain_plus') {
    const extra = tower.fusedSpec.specialParams.extraChains || 0;
    effectiveTemplate = { ...template, chain: (template.chain || 0) + extra };
  }

  // Create projectile, then apply synergy bonuses
  const proj = createProjectile(tower, target, effectiveTemplate);
  if (typeof applySynergyToProjectile === 'function') applySynergyToProjectile(proj, tower);
  state.projectiles.push(proj);
}
