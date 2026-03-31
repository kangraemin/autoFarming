import { GAME_WIDTH } from '../config/GameConfig.js';

export default class SpeedControl {
  constructor(scene) {
    this.scene = scene;
    this.speeds = [1, 2, 3];
    this.currentIndex = 0;
    this.D = 10;

    const x = GAME_WIDTH - 40;
    const y = 56;

    this.bg = scene.add.graphics().setDepth(this.D);
    this.label = scene.add.text(x, y, '1x', {
      fontSize: '14px', color: '#e0c872', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(this.D);

    this.zone = scene.add.zone(x, y, 44, 28)
      .setInteractive({ useHandCursor: true }).setDepth(this.D);

    this._draw();

    this.hovered = false;

    this.zone.on('pointerover', () => {
      this.hovered = true;
      this._draw();
    });
    this.zone.on('pointerout', () => {
      this.hovered = false;
      this._draw();
    });
    this.zone.on('pointerdown', () => {
      this.currentIndex = (this.currentIndex + 1) % this.speeds.length;
      this._draw();
    });
  }

  _draw() {
    const speed = this.speeds[this.currentIndex];
    this.bg.clear();
    const bgColor = this.hovered ? 0x333366 : 0x222244;
    const borderAlpha = this.hovered ? 1 : 0.5;
    this.bg.fillStyle(bgColor, 0.8);
    this.bg.fillRoundedRect(GAME_WIDTH - 62, 42, 44, 28, 6);
    this.bg.lineStyle(1, 0xe0c872, borderAlpha);
    this.bg.strokeRoundedRect(GAME_WIDTH - 62, 42, 44, 28, 6);
    this.label.setText(`${speed}x`);
  }

  getSpeed() {
    return this.speeds[this.currentIndex];
  }
}
