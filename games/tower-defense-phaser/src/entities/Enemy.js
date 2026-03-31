import Phaser from 'phaser';
import { GRID_SIZE } from '../config/GameConfig.js';
import { ENEMY_TYPES } from '../config/EnemyConfig.js';

export default class Enemy extends Phaser.GameObjects.Container {
  constructor(scene, type, path, delay) {
    const startPos = path[0];
    const x = startPos.col * GRID_SIZE + GRID_SIZE / 2;
    const y = startPos.row * GRID_SIZE + GRID_SIZE / 2;
    super(scene, x, y);

    this.enemyType = type;
    this.path = path;
    this.pathIndex = 0;

    const template = ENEMY_TYPES[type];
    this.hp = template.hp;
    this.maxHp = template.hp;
    this.speed = template.speed;
    this.reward = template.reward;
    this.enemySize = template.size || 1;

    this.slowTimer = 0;
    this.slowAmount = 1;
    this.delay = delay || 0;
    this.alive = true;
    this.reached = false;
    this.dying = false;

    // Walking 스프라이트 프레임
    const spriteConfig = template.sprite;
    this.frameKeys = [];
    this.dyingFrameKeys = [];
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.frameInterval = 0.05; // 20fps 애니메이션

    for (let i = 0; i < spriteConfig.frameCount; i++) {
      this.frameKeys.push(`${spriteConfig.walking}_${i}`);
      this.dyingFrameKeys.push(`${spriteConfig.dying}_${i}`);
    }

    // 메인 스프라이트
    this.sprite = scene.add.image(0, 0, this.frameKeys[0]);
    const spriteScale = spriteConfig.scale || 0.08;
    this.sprite.setScale(spriteScale * this.enemySize);
    this.add(this.sprite);

    // HP 바 배경
    const barWidth = GRID_SIZE * 0.8;
    const barHeight = 4;
    const barY = -this.sprite.displayHeight / 2 - 6;

    this.hpBarBg = scene.add.rectangle(0, barY, barWidth, barHeight, 0x333333);
    this.hpBarBg.setOrigin(0.5);
    this.add(this.hpBarBg);

    // HP 바
    this.hpBar = scene.add.rectangle(0, barY, barWidth, barHeight, 0x44ff44);
    this.hpBar.setOrigin(0.5);
    this.add(this.hpBar);

    // 딜레이 중 숨김
    if (this.delay > 0) {
      this.setVisible(false);
    }

    scene.add.existing(this);
  }

  takeDamage(damage) {
    if (!this.alive) return;
    this.hp -= damage;

    // HP 바 업데이트
    const ratio = Math.max(0, this.hp / this.maxHp);
    const barWidth = GRID_SIZE * 0.8;
    this.hpBar.width = barWidth * ratio;

    // HP 바 색상 변경
    if (ratio > 0.5) {
      this.hpBar.setFillStyle(0x44ff44);
    } else if (ratio > 0.25) {
      this.hpBar.setFillStyle(0xffaa00);
    } else {
      this.hpBar.setFillStyle(0xff4444);
    }

    if (this.hp <= 0) {
      this.alive = false;
      this._playDyingAnimation();
    }
  }

  _playDyingAnimation() {
    this.dying = true;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.hpBarBg.setVisible(false);
    this.hpBar.setVisible(false);

    if (this.dyingFrameKeys.length > 0) {
      this.sprite.setTexture(this.dyingFrameKeys[0]);
    }
  }

  applySlow(amount, duration) {
    this.slowAmount = Math.min(this.slowAmount, amount);
    this.slowTimer = Math.max(this.slowTimer, duration);
    this.sprite.setTint(0x88ccff);
  }

  update(dt) {
    // 딜레이 처리
    if (this.delay > 0) {
      this.delay -= dt;
      if (this.delay <= 0) {
        this.setVisible(true);
      }
      return;
    }

    // 사망 애니메이션
    if (this.dying) {
      this.frameTimer += dt;
      if (this.frameTimer >= this.frameInterval) {
        this.frameTimer = 0;
        this.currentFrame++;
        if (this.currentFrame >= this.dyingFrameKeys.length) {
          this.destroy();
          return;
        }
        this.sprite.setTexture(this.dyingFrameKeys[this.currentFrame]);
      }
      return;
    }

    if (!this.alive || this.reached) return;

    // Walking 애니메이션
    this.frameTimer += dt;
    if (this.frameTimer >= this.frameInterval) {
      this.frameTimer = 0;
      this.currentFrame = (this.currentFrame + 1) % this.frameKeys.length;
      this.sprite.setTexture(this.frameKeys[this.currentFrame]);
    }

    // 감속 처리
    let speedMult = 1;
    if (this.slowTimer > 0) {
      speedMult = this.slowAmount;
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.slowAmount = 1;
        this.sprite.clearTint();
      }
    }

    // 이동
    const speed = this.speed * speedMult * GRID_SIZE * dt;
    const nextIdx = this.pathIndex + 1;
    if (nextIdx >= this.path.length) {
      this.reached = true;
      return;
    }

    const target = this.path[nextIdx];
    const tx = target.col * GRID_SIZE + GRID_SIZE / 2;
    const ty = target.row * GRID_SIZE + GRID_SIZE / 2;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // flipX: 이동 방향에 따라
    if (dx < -0.1) {
      this.sprite.setFlipX(true);
    } else if (dx > 0.1) {
      this.sprite.setFlipX(false);
    }

    if (dist < speed) {
      this.x = tx;
      this.y = ty;
      this.pathIndex++;
      if (this.pathIndex >= this.path.length - 1) {
        this.reached = true;
      }
    } else {
      this.x += (dx / dist) * speed;
      this.y += (dy / dist) * speed;
    }
  }
}
