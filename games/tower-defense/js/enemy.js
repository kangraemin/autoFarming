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

  // Damage over time (from poison/fire fused towers)
  if (enemy.dots && enemy.dots.length > 0) {
    for (let i = enemy.dots.length - 1; i >= 0; i--) {
      const dot = enemy.dots[i];
      dot.duration -= dt;
      dot.timer -= dt;
      if (dot.timer <= 0) {
        dot.timer = dot.interval;
        hitEnemy(enemy, dot.damage, false, dot.color);
        createParticle(
          enemy.x + (Math.random() - 0.5) * 12,
          enemy.y + (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 25, -20 - Math.random() * 30,
          dot.color, 0.45, 3 + Math.random() * 3
        );
      }
      if (dot.duration <= 0 || !enemy.alive) enemy.dots.splice(i, 1);
    }
    if (!enemy.alive) return;
  }

  let speedMult = 1;

  // Stun overrides slow
  if (enemy.stunTimer > 0) {
    enemy.stunTimer -= dt;
    speedMult = 0;
  } else if (enemy.slowTimer > 0) {
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
    if (enemy.pathIndex >= state.path.length - 1) enemy.reached = true;
  } else {
    enemy.x += (dx / dist) * speed;
    enemy.y += (dy / dist) * speed;
  }
}

// Main hit function used by projectiles
function hitEnemy(enemy, damage, isMajorHit, hitColor) {
  if (!enemy.alive) return;
  enemy.hp -= damage;

  if (isMajorHit) {
    spawnHitSpark(enemy.x, enemy.y, hitColor || enemy.color);
    if (typeof playEnemyHit === 'function') playEnemyHit();
  }

  if (enemy.hp <= 0) {
    enemy.alive = false;
    state.gold += enemy.reward;
    state.score += enemy.reward;

    // Death FX + sound
    if (enemy.type === 'boss') {
      spawnBossKillExplosion(enemy.x, enemy.y);
      if (typeof playBossDeath === 'function') playBossDeath();
    } else {
      spawnKillExplosion(enemy.x, enemy.y, enemy.color);
      if (typeof playEnemyDeath === 'function') playEnemyDeath();
    }
    spawnGoldPopup(enemy.x, enemy.y, enemy.reward);
    if (typeof playGoldGain === 'function') playGoldGain();

    // Soul drop
    tryDropSoul(enemy);

    // Track kill on tower
    // (projectile.js already does this via proj.tower.kills++)
  }
}

// Legacy function used by older code paths
function damageEnemy(enemy, damage) {
  hitEnemy(enemy, damage, false, null);
}
