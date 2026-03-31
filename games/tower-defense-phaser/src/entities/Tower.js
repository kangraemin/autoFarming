import Phaser from 'phaser';
import { GRID_SIZE } from '../config/GameConfig.js';
import { TOWER_TYPES } from '../config/TowerConfig.js';

export default class Tower extends Phaser.GameObjects.Container {
  constructor(scene, type, col, row) {
    const x = col * GRID_SIZE + GRID_SIZE / 2;
    const y = row * GRID_SIZE + GRID_SIZE / 2;
    super(scene, x, y);

    this.towerType = type;
    this.col = col;
    this.row = row;

    const template = TOWER_TYPES[type];
    this.level = 1;
    this.damage = template.damage;
    this.range = template.range;
    this.fireRate = template.fireRate;
    this.fireCooldown = 0;
    this.kills = 0;

    // Stone base 스프라이트
    this.baseSprite = scene.add.image(0, 0, 'stone_base');
    this.baseSprite.setDisplaySize(GRID_SIZE, GRID_SIZE);
    this.add(this.baseSprite);

    // Unit 스프라이트
    const unitConfig = template.sprite?.units;
    if (unitConfig) {
      const unitKey = unitConfig[1]?.idle || unitConfig['1']?.idle;
      if (unitKey) {
        this.unitSprite = scene.add.image(0, -GRID_SIZE * 0.3, unitKey);
        this.unitSprite.setDisplaySize(GRID_SIZE * 0.7, GRID_SIZE * 0.7);
        if (template.sprite?.tint) {
          this.unitSprite.setTint(template.sprite.tint);
        }
        this.add(this.unitSprite);
      }
    }

    // 사거리 표시 (기본 비활성)
    this.rangeCircle = scene.add.graphics();
    this.rangeCircle.setVisible(false);
    this._drawRangeCircle();

    scene.add.existing(this);
    this.setSize(GRID_SIZE, GRID_SIZE);
    this.setInteractive();
  }

  _drawRangeCircle() {
    this.rangeCircle.clear();
    this.rangeCircle.lineStyle(1, 0xffffff, 0.3);
    this.rangeCircle.strokeCircle(this.x, this.y, this.range * GRID_SIZE);
  }

  showRange() {
    this._drawRangeCircle();
    this.rangeCircle.setVisible(true);
  }

  hideRange() {
    this.rangeCircle.setVisible(false);
  }

  upgrade() {
    const template = TOWER_TYPES[this.towerType];
    const cost = template.upgradeCost(this.level);

    this.level++;
    this.damage = template.upgradeDamage(this.level);
    this.range += 0.2;
    this.fireRate *= 1.1;
    this._drawRangeCircle();

    // 업그레이드 레벨에 따라 base 스프라이트 변경 (arrow만)
    if (this.towerType === 'arrow' && this.level <= 7) {
      this.baseSprite.setTexture(`archer_level_${this.level}`);
    }

    return cost;
  }

  getUpgradeCost() {
    return TOWER_TYPES[this.towerType].upgradeCost(this.level);
  }

  getSellRefund() {
    return Math.floor(TOWER_TYPES[this.towerType].cost * 0.6);
  }

  findTarget(enemies) {
    const rangePx = this.range * GRID_SIZE;
    let best = null;
    let highestPathIndex = -1;

    for (const enemy of enemies) {
      if (!enemy.alive || enemy.reached) continue;
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= rangePx && enemy.pathIndex > highestPathIndex) {
        best = enemy;
        highestPathIndex = enemy.pathIndex;
      }
    }
    return best;
  }

  update(dt, enemies) {
    this.fireCooldown -= dt;
    if (this.fireCooldown > 0) return null;

    const target = this.findTarget(enemies);
    if (!target) return null;

    this.fireCooldown = 1 / this.fireRate;
    return target;
  }

  destroy() {
    if (this.rangeCircle) {
      this.rangeCircle.destroy();
    }
    super.destroy();
  }
}
