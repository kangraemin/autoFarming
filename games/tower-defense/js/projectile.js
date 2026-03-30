function createProjectile(tower, target, template) {
  const dx = target.x - tower.x;
  const dy = target.y - tower.y;
  const angle = Math.atan2(dy, dx);

  // Muzzle flash at tower barrel tip
  const muzzleX = tower.x + Math.cos(angle) * CONFIG.GRID_SIZE * 0.3;
  const muzzleY = tower.y + Math.sin(angle) * CONFIG.GRID_SIZE * 0.3;
  spawnMuzzleFlash(muzzleX, muzzleY, template.projectileColor);
  if (tower.type === 'cannon') spawnSmoke(muzzleX, muzzleY);

  // Track barrel angle for cannon drawing
  tower.barrelAngle = angle;

  return {
    x: tower.x,
    y: tower.y,
    targetId: target,
    speed: template.projectileSpeed * CONFIG.GRID_SIZE,
    damage: tower.damage,
    color: template.projectileColor,
    towerType: tower.type,
    angle,
    splash: template.splash || 0,
    slow: template.slow || 0,
    slowDuration: template.slowDuration || 0,
    chain: template.chain || 0,
    alive: true,
    tower,
    trailTimer: 0,
  };
}

function updateProjectile(proj, dt) {
  if (!proj.alive) return;

  const target = proj.targetId;
  if (!target || !target.alive) {
    proj.alive = false;
    return;
  }

  const dx = target.x - proj.x;
  const dy = target.y - proj.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const moveSpeed = proj.speed * dt;

  // Update angle for rendering
  proj.angle = Math.atan2(dy, dx);

  // Spawn trail particles
  proj.trailTimer -= dt;
  if (proj.trailTimer <= 0) {
    proj.trailTimer = 0.03;
    spawnTrail(proj.x, proj.y, proj.color);
    if (proj.towerType === 'cannon') spawnSmoke(proj.x, proj.y);
  }

  if (dist < moveSpeed + 5) {
    // Hit!
    const hitColor = proj.color;

    if (proj.splash > 0) {
      // Cannon: explosion
      spawnExplosion(target.x, target.y, '#ff8833', 15);
      spawnExplosion(target.x, target.y, '#ffcc44', 8);
      const splashPx = proj.splash * CONFIG.GRID_SIZE;
      for (const enemy of state.enemies) {
        if (enemy === target || !enemy.alive || enemy.delay > 0) continue;
        const ex = enemy.x - target.x;
        const ey = enemy.y - target.y;
        if (Math.sqrt(ex * ex + ey * ey) <= splashPx) {
          hitEnemy(enemy, Math.floor(proj.damage * 0.5), false, hitColor);
        }
      }
    } else if (proj.towerType === 'ice') {
      spawnIceShatter(target.x, target.y);
    } else if (proj.towerType === 'lightning') {
      spawnExplosion(target.x, target.y, '#ffff88', 8);
    } else {
      spawnHitSpark(target.x, target.y, hitColor);
    }

    const wasAlive = target.alive;
    hitEnemy(target, proj.damage, true, hitColor);
    if (wasAlive && !target.alive && proj.tower) proj.tower.kills++;

    // Slow effect
    if (proj.slow > 0) {
      target.slowAmount = proj.slow;
      target.slowTimer = proj.slowDuration;
    }

    // Chain lightning
    if (proj.chain > 0) {
      const chainTargets = [];
      for (const enemy of state.enemies) {
        if (enemy === target || !enemy.alive || enemy.delay > 0) continue;
        const ex = enemy.x - target.x;
        const ey = enemy.y - target.y;
        if (Math.sqrt(ex * ex + ey * ey) <= 2 * CONFIG.GRID_SIZE) chainTargets.push(enemy);
      }
      chainTargets.slice(0, proj.chain).forEach(e => {
        hitEnemy(e, Math.floor(proj.damage * 0.5), false, '#ffff88');
        // Draw chain arc effect via particles
        spawnExplosion(e.x, e.y, '#ffff88', 4);
      });
    }

    proj.alive = false;
  } else {
    proj.x += (dx / dist) * moveSpeed;
    proj.y += (dy / dist) * moveSpeed;
  }
}
