import Phaser from 'phaser';

export default class StageSelectScene extends Phaser.Scene {
  constructor() {
    super('StageSelectScene');
  }

  create() {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, 'Stage Select (WIP)', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
  }
}
