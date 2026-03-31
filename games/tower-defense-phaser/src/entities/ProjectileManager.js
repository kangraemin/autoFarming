import { GRID_SIZE } from '../config/GameConfig.js';
import { TOWER_TYPES } from '../config/TowerConfig.js';
import Projectile from './Projectile.js';

export default class ProjectileManager {
  constructor(scene) {
    this.scene = scene;
    this.projectiles = [];
  }

  fire(tower, target) {
    const template = TOWER_TYPES[tower.towerType];
    const proj = new Projectile(this.scene, tower, target, template);
    this.projectiles.push(proj);
    this._spawnMuzzleFlash(tower.x, tower.y, template.projectileColor);
    return proj;
  }

  update(dt, enemies, gameState) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      const hit = proj.update(dt);

      if (hit) {
        this._onHit(proj, enemies, gameState);
      }

      if (!proj.alive) {
        proj.destroy();
        this.projectiles.splice(i, 1);
      }
    }
  }

  _onHit(proj, enemies, gameState) {
    const target = proj.target;
    if (!target || !target.alive) return;

    // 메인 데미지
    const wasAlive = target.alive;
    target.takeDamage(proj.damage);

    if (wasAlive && !target.alive && proj.towerRef) {
      proj.towerRef.kills++;
      gameState.gold += target.reward;
      gameState.score += target.reward;
      this._spawnGoldPopup(target.x, target.y, target.reward);

      if (target.enemyType === 'boss') {
        this._spawnBossDeathEffect(target.x, target.y);
      } else {
        this._spawnDeathParticles(target.x, target.y);
      }
    }

    // Splash (cannon)
    if (proj.splash > 0) {
      const splashPx = proj.splash * GRID_SIZE;
      for (const enemy of enemies) {
        if (enemy === target || !enemy.alive || enemy.delay > 0) continue;
        const ex = enemy.x - target.x;
        const ey = enemy.y - target.y;
        if (Math.sqrt(ex * ex + ey * ey) <= splashPx) {
          const splashWasAlive = enemy.alive;
          enemy.takeDamage(Math.floor(proj.damage * 0.5));
          if (splashWasAlive && !enemy.alive && proj.towerRef) {
            proj.towerRef.kills++;
            gameState.gold += enemy.reward;
            gameState.score += enemy.reward;
            this._spawnGoldPopup(enemy.x, enemy.y, enemy.reward);
            this._spawnDeathParticles(enemy.x, enemy.y);
          }
        }
      }
      this._spawnExplosion(target.x, target.y, 0xff8833);
    }

    // Slow (ice)
    if (proj.slow > 0 && target.alive) {
      target.applySlow(proj.slow, proj.slowDuration);
    }

    // Chain (lightning)
    if (proj.chain > 0) {
      const chainTargets = [];
      for (const enemy of enemies) {
        if (enemy === target || !enemy.alive || enemy.delay > 0) continue;
        const ex = enemy.x - target.x;
        const ey = enemy.y - target.y;
        if (Math.sqrt(ex * ex + ey * ey) <= 2 * GRID_SIZE) {
          chainTargets.push(enemy);
        }
      }
      chainTargets.slice(0, proj.chain).forEach(e => {
        const chainWasAlive = e.alive;
        e.takeDamage(Math.floor(proj.damage * 0.5));
        if (chainWasAlive && !e.alive && proj.towerRef) {
          proj.towerRef.kills++;
          gameState.gold += e.reward;
          gameState.score += e.reward;
          this._spawnGoldPopup(e.x, e.y, e.reward);
        }
        this._spawnChainLightning(target, e);
      });
    }

    // 히트 이펙트
    this._spawnHitParticles(target.x, target.y, proj.towerType);
  }

  _spawnGoldPopup(x, y, amount) {
    const text = this.scene.add.text(x, y - 10, `+${amount}g`, {
      fontSize: '14px',
      color: '#ffd700',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(15);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 40,
      alpha: 0,
      duration: 1000,
      onComplete: () => text.destroy(),
    });
  }

  _spawnDeathParticles(x, y) {
    const colors = [0xff4444, 0xff8844, 0xffcc44];
    for (let i = 0; i < 8; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const particle = this.scene.add.circle(
        x + (Math.random() - 0.5) * 10,
        y + (Math.random() - 0.5) * 10,
        2 + Math.random() * 3,
        color
      ).setDepth(12);

      this.scene.tweens.add({
        targets: particle,
        x: particle.x + (Math.random() - 0.5) * 50,
        y: particle.y + (Math.random() - 0.5) * 50,
        alpha: 0,
        scale: 0,
        duration: 400 + Math.random() * 300,
        onComplete: () => particle.destroy(),
      });
    }
  }

  _spawnHitParticles(x, y, towerType) {
    let color = 0xffffff;
    if (towerType === 'cannon') color = 0xff6b6b;
    else if (towerType === 'ice') color = 0x88ccff;
    else if (towerType === 'lightning') color = 0xffee88;
    else if (towerType === 'arrow') color = 0xffd700;

    for (let i = 0; i < 4; i++) {
      const particle = this.scene.add.circle(
        x + (Math.random() - 0.5) * 8,
        y + (Math.random() - 0.5) * 8,
        1.5 + Math.random() * 2,
        color
      ).setDepth(12);

      this.scene.tweens.add({
        targets: particle,
        x: particle.x + (Math.random() - 0.5) * 30,
        y: particle.y + (Math.random() - 0.5) * 30,
        alpha: 0,
        duration: 300,
        onComplete: () => particle.destroy(),
      });
    }
  }

  _spawnExplosion(x, y, color) {
    const circle = this.scene.add.circle(x, y, 5, color, 0.7).setDepth(12);
    this.scene.tweens.add({
      targets: circle,
      scale: 3,
      alpha: 0,
      duration: 400,
      onComplete: () => circle.destroy(),
    });

    for (let i = 0; i < 10; i++) {
      const p = this.scene.add.circle(
        x, y, 2 + Math.random() * 3, color
      ).setDepth(12);

      this.scene.tweens.add({
        targets: p,
        x: p.x + (Math.random() - 0.5) * 60,
        y: p.y + (Math.random() - 0.5) * 60,
        alpha: 0,
        scale: 0,
        duration: 300 + Math.random() * 300,
        onComplete: () => p.destroy(),
      });
    }
  }

  _spawnChainLightning(from, to) {
    const line = this.scene.add.graphics().setDepth(12);
    line.lineStyle(2, 0xffee88, 0.8);
    line.beginPath();
    line.moveTo(from.x, from.y);

    // 번개 효과: 2~3개 중간점
    const segments = 3;
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const mx = from.x + (to.x - from.x) * t + (Math.random() - 0.5) * 20;
      const my = from.y + (to.y - from.y) * t + (Math.random() - 0.5) * 20;
      line.lineTo(mx, my);
    }
    line.lineTo(to.x, to.y);
    line.strokePath();

    this.scene.tweens.add({
      targets: line,
      alpha: 0,
      duration: 200,
      onComplete: () => line.destroy(),
    });
  }

  _spawnBossDeathEffect(x, y) {
    // 큰 폭발 원
    const bigCircle = this.scene.add.circle(x, y, 10, 0xff4444, 0.8).setDepth(12);
    this.scene.tweens.add({
      targets: bigCircle,
      scale: 5,
      alpha: 0,
      duration: 600,
      onComplete: () => bigCircle.destroy(),
    });

    // 20개 파티클
    const colors = [0xff4444, 0xff8844, 0xffcc44, 0xffffff];
    for (let i = 0; i < 20; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const particle = this.scene.add.circle(
        x + (Math.random() - 0.5) * 10,
        y + (Math.random() - 0.5) * 10,
        3 + Math.random() * 4,
        color
      ).setDepth(12);

      this.scene.tweens.add({
        targets: particle,
        x: particle.x + (Math.random() - 0.5) * 80,
        y: particle.y + (Math.random() - 0.5) * 80,
        alpha: 0,
        scale: 0,
        duration: 500 + Math.random() * 400,
        onComplete: () => particle.destroy(),
      });
    }

    // 카메라 쉐이크
    this.scene.cameras.main.shake(200, 0.005);
  }

  _spawnMuzzleFlash(x, y, color) {
    const flash = this.scene.add.circle(x, y, 6, color || 0xffffff, 1).setDepth(12).setScale(0);

    this.scene.tweens.add({
      targets: flash,
      scale: { from: 0, to: 1 },
      alpha: { from: 1, to: 0 },
      duration: 50,
      onComplete: () => flash.destroy(),
    });
  }

  clear() {
    for (const proj of this.projectiles) {
      proj.destroy();
    }
    this.projectiles = [];
  }

  destroy() {
    this.clear();
  }
}
