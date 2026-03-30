function createProjectile(tower, target, template) {
  return {
    x: tower.x,
    y: tower.y,
    targetId: target,
    speed: template.projectileSpeed * CONFIG.GRID_SIZE,
    damage: tower.damage,
    color: template.projectileColor,
    splash: template.splash || 0,
    slow: template.slow || 0,
    slowDuration: template.slowDuration || 0,
    chain: template.chain || 0,
    alive: true,
    tower,
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

  if (dist < moveSpeed + 5) {
    // Hit!
    damageEnemy(target, proj.damage);

    // Splash damage
    if (proj.splash > 0) {
      const splashPx = proj.splash * CONFIG.GRID_SIZE;
      for (const enemy of state.enemies) {
        if (enemy === target || !enemy.alive || enemy.delay > 0) continue;
        const ex = enemy.x - target.x;
        const ey = enemy.y - target.y;
        if (Math.sqrt(ex * ex + ey * ey) <= splashPx) {
          damageEnemy(enemy, Math.floor(proj.damage * 0.5));
        }
      }
    }

    // Slow effect
    if (proj.slow > 0) {
      target.slowAmount = proj.slow;
      target.slowTimer = proj.slowDuration;
    }

    // Chain lightning
    if (proj.chain > 0) {
      let chainTargets = [];
      for (const enemy of state.enemies) {
        if (enemy === target || !enemy.alive || enemy.delay > 0) continue;
        const ex = enemy.x - target.x;
        const ey = enemy.y - target.y;
        if (Math.sqrt(ex * ex + ey * ey) <= 2 * CONFIG.GRID_SIZE) {
          chainTargets.push(enemy);
        }
      }
      chainTargets.slice(0, proj.chain).forEach(e => {
        damageEnemy(e, Math.floor(proj.damage * 0.5));
      });
    }

    if (!target.alive && proj.tower) {
      proj.tower.kills++;
    }

    proj.alive = false;
  } else {
    proj.x += (dx / dist) * moveSpeed;
    proj.y += (dy / dist) * moveSpeed;
  }
}
