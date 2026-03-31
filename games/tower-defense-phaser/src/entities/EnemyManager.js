import Enemy from './Enemy.js';

export default class EnemyManager {
  constructor(scene) {
    this.scene = scene;
    this.enemies = [];
  }

  spawn(type, path, delay, hpMultiplier) {
    const enemy = new Enemy(this.scene, type, path, delay);
    if (hpMultiplier && hpMultiplier !== 1) {
      enemy.hp = Math.floor(enemy.hp * hpMultiplier);
      enemy.maxHp = enemy.hp;
    }
    this.enemies.push(enemy);
    return enemy;
  }

  getAliveEnemies() {
    return this.enemies.filter(e => e.alive && !e.reached && e.delay <= 0);
  }

  update(dt) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt);

      // dying 애니메이션 완료 후 제거됨 (enemy.destroy() 호출됨)
      if (enemy.dying && enemy.currentFrame >= enemy.dyingFrameKeys.length) {
        this.enemies.splice(i, 1);
      }
    }
  }

  countReached() {
    let count = 0;
    for (const enemy of this.enemies) {
      if (enemy.reached) count++;
    }
    return count;
  }

  removeReached() {
    const reached = this.enemies.filter(e => e.reached);
    for (const enemy of reached) {
      enemy.destroy();
    }
    this.enemies = this.enemies.filter(e => !e.reached);
    return reached.length;
  }

  isAllDone() {
    return this.enemies.every(e => !e.alive || e.reached);
  }

  clear() {
    for (const enemy of this.enemies) {
      if (!enemy.dying) {
        enemy.destroy();
      }
    }
    this.enemies = [];
  }

  destroy() {
    this.clear();
  }
}
