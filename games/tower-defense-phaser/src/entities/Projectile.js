import Phaser from 'phaser';
import { GRID_SIZE } from '../config/GameConfig.js';

export default class Projectile extends Phaser.GameObjects.Container {
  constructor(scene, tower, target, template) {
    const x = tower.x;
    const y = tower.y;
    super(scene, x, y);

    this.target = target;
    this.speed = template.projectileSpeed * GRID_SIZE;
    this.damage = tower.damage;
    this.towerType = tower.towerType;
    this.towerRef = tower;

    // 특수효과 파라미터
    this.splash = template.splash || 0;
    this.slow = template.slow || 0;
    this.slowDuration = template.slowDuration || 0;
    this.chain = template.chain || 0;

    this.alive = true;

    // 비주얼: arrow는 이미지, 나머지는 원형
    if (this.towerType === 'arrow') {
      this.visual = scene.add.image(0, 0, 'arrow_1').setScale(0.3).setOrigin(0.5);
    } else {
      const color = template.projectileColor || 0xffffff;
      this.visual = scene.add.circle(0, 0, 4, color);
    }
    this.add(this.visual);

    // 초기 회전
    const dx = target.x - x;
    const dy = target.y - y;
    this.rotation = Math.atan2(dy, dx);

    scene.add.existing(this);
  }

  update(dt) {
    if (!this.alive) return;

    // 타겟이 죽었으면 소멸
    if (!this.target || !this.target.alive) {
      this.alive = false;
      return;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const moveSpeed = this.speed * dt;

    // 회전 업데이트
    this.rotation = Math.atan2(dy, dx);

    if (dist < moveSpeed + 5) {
      // 명중
      this.alive = false;
      return true; // hit signal
    }

    this.x += (dx / dist) * moveSpeed;
    this.y += (dy / dist) * moveSpeed;
    return false;
  }
}
