import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';

export default class ParticleEffects {
  constructor(scene) {
    this.scene = scene;
    this.currentWave = 1;
  }

  setWave(wave) {
    this.currentWave = wave;
  }

  _scaleCount(count) {
    if (this.currentWave >= 16) return Math.max(1, Math.floor(count * 0.4));
    if (this.currentWave >= 6) return Math.max(1, Math.floor(count * 0.6));
    return count;
  }

  explosion(x, y, color, count = 12) {
    count = this._scaleCount(count);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 50 + Math.random() * 90;
      const size = 2 + Math.random() * 3;
      const p = this.scene.add.circle(x, y, size, color).setDepth(12);

      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: 300 + Math.random() * 400,
        onComplete: () => p.destroy(),
      });
    }
  }

  killExplosion(x, y, color) {
    this.explosion(x, y, color, 18);
    const whiteCount = this._scaleCount(8);
    for (let i = 0; i < whiteCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 70;
      const p = this.scene.add.circle(x, y, 4 + Math.random() * 4, 0xffffff).setDepth(12);

      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: 500 + Math.random() * 300,
        onComplete: () => p.destroy(),
      });
    }
  }

  hitSpark(x, y, color) {
    const count = this._scaleCount(5);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 50;
      const p = this.scene.add.circle(x, y, 2 + Math.random() * 2, color).setDepth(12);

      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: 200 + Math.random() * 200,
        onComplete: () => p.destroy(),
      });
    }
  }

  iceShatter(x, y) {
    const colors = [0x88ccff, 0xaaddff, 0x66aaee, 0xbbddff];
    const count = this._scaleCount(8);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 60;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const p = this.scene.add.circle(x, y, 3 + Math.random() * 3, color).setDepth(12);

      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: 300 + Math.random() * 300,
        onComplete: () => p.destroy(),
      });
    }
  }

  muzzleFlash(x, y, color) {
    const count = this._scaleCount(5);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 40;
      const p = this.scene.add.circle(x, y, 3 + Math.random() * 3, color).setDepth(12);

      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: 100 + Math.random() * 100,
        onComplete: () => p.destroy(),
      });
    }
  }

  smokeTrail(x, y) {
    const count = this._scaleCount(4);
    for (let i = 0; i < count; i++) {
      const gray = 0x888888 + Math.floor(Math.random() * 0x444444);
      const p = this.scene.add.circle(
        x + (Math.random() - 0.5) * 8,
        y + (Math.random() - 0.5) * 8,
        3 + Math.random() * 3,
        gray
      ).setDepth(11).setAlpha(0.6);

      this.scene.tweens.add({
        targets: p,
        y: p.y - 20 - Math.random() * 20,
        x: p.x + (Math.random() - 0.5) * 15,
        alpha: 0,
        scale: 1.5,
        duration: 400 + Math.random() * 300,
        onComplete: () => p.destroy(),
      });
    }
  }

  waveStartBanner(waveNum, isBoss) {
    const text = isBoss ? `⚠ BOSS WAVE ${waveNum} ⚠` : `Wave ${waveNum}`;
    const color = isBoss ? '#ff4444' : '#e0c872';
    const size = isBoss ? '32px' : '28px';

    const banner = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.3, text, {
      fontSize: size, color, fontFamily: 'Georgia, serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(20).setScale(0);

    this.scene.tweens.add({
      targets: banner,
      scale: { from: 0, to: 1 },
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: banner,
          alpha: 0,
          y: banner.y - 30,
          duration: 1200,
          delay: 800,
          onComplete: () => banner.destroy(),
        });
      },
    });
  }
}
