function createEnemy(type, delay) {
  const template = CONFIG.ENEMY_TYPES[type];
  const startPos = state.path[0];
  return {
    type,
    x: startPos.col * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
    y: startPos.row * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2,
    hp: template.hp,
    maxHp: template.hp,
    speed: template.speed,
    reward: template.reward,
    color: template.color,
    size: template.size || 1,
    pathIndex: 0,
    slowTimer: 0,
    slowAmount: 1,
    delay: delay || 0,
    alive: true,
    reached: false,
  };
}

function updateEnemy(enemy, dt) {
  if (enemy.delay > 0) {
    enemy.delay -= dt;
    return;
  }

  if (!enemy.alive || enemy.reached) return;

  // Slow effect
  let speedMult = 1;
  if (enemy.slowTimer > 0) {
    speedMult = enemy.slowAmount;
    enemy.slowTimer -= dt;
  }

  const speed = enemy.speed * speedMult * CONFIG.GRID_SIZE * dt;
  const target = getPathPosition(enemy.pathIndex + 1);

  if (!target) {
    enemy.reached = true;
    return;
  }

  const tx = target.col * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2;
  const ty = target.row * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2;
  const dx = tx - enemy.x;
  const dy = ty - enemy.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < speed) {
    enemy.x = tx;
    enemy.y = ty;
    enemy.pathIndex++;

    if (enemy.pathIndex >= state.path.length - 1) {
      enemy.reached = true;
    }
  } else {
    enemy.x += (dx / dist) * speed;
    enemy.y += (dy / dist) * speed;
  }
}

function damageEnemy(enemy, damage) {
  enemy.hp -= damage;
  if (enemy.hp <= 0) {
    enemy.alive = false;
    state.gold += enemy.reward;
    state.score += enemy.reward;
  }
}
