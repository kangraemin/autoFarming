import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // 프로그레스바용 그래픽은 PreloadScene에서 직접 생성
  }

  create() {
    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2, 'Soul Tower Defense', {
      fontSize: '48px',
      color: '#e0c872',
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 60, 'Initializing...', {
      fontSize: '18px',
      color: '#aaaaaa',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.time.delayedCall(500, () => {
      this.scene.start('PreloadScene');
    });
  }
}
