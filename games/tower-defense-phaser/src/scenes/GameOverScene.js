import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';
import { STAGES } from '../config/StageConfig.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.stageIndex = data.stageIndex || 0;
    this.wave = data.wave || 0;
    this.score = data.score || 0;
    this.stageClear = data.stageClear || false;
    this.stars = data.stars || 0;
    this.lives = data.lives || 0;
  }

  create() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0e0618, 0x0e0618, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const stage = STAGES[this.stageIndex];

    if (this.stageClear) {
      // 스테이지 클리어
      const starStr = '★'.repeat(this.stars) + '☆'.repeat(3 - this.stars);
      this.add.text(GAME_WIDTH / 2, 180, `${stage.name} 클리어!`, {
        fontSize: '42px', color: '#e0c872', fontFamily: 'Georgia, serif', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 4,
      }).setOrigin(0.5);

      this.add.text(GAME_WIDTH / 2, 240, starStr, {
        fontSize: '48px', color: '#ffd700', fontFamily: 'Arial',
      }).setOrigin(0.5);

      this.add.text(GAME_WIDTH / 2, 310, `체력 ${this.lives}/20 · 점수 ${this.score}`, {
        fontSize: '18px', color: '#aaaacc', fontFamily: 'Arial',
      }).setOrigin(0.5);
    } else {
      // 게임 오버
      this.add.text(GAME_WIDTH / 2, 200, 'Game Over', {
        fontSize: '48px', color: '#ff4444', fontFamily: 'Georgia, serif', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 4,
      }).setOrigin(0.5);

      this.add.text(GAME_WIDTH / 2, 280, `Wave ${this.wave} · Score ${this.score}`, {
        fontSize: '20px', color: '#aaaacc', fontFamily: 'Arial',
      }).setOrigin(0.5);
    }

    // 스테이지 선택 버튼
    this._createButton(GAME_WIDTH / 2, 420, 'Stage Select', () => {
      this.scene.start('StageSelectScene');
    });

    // 다시하기 버튼
    this._createButton(GAME_WIDTH / 2, 480, 'Retry', () => {
      this.scene.start('GameScene', { stageIndex: this.stageIndex });
    });
  }

  _createButton(x, y, label, callback) {
    const w = 180;
    const h = 40;
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xe0c872, 1);
    btnBg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);

    this.add.text(x, y, label, {
      fontSize: '18px', color: '#1a1a2e', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0xf0d882, 1);
      btnBg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
    });
    zone.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0xe0c872, 1);
      btnBg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
    });
    zone.on('pointerdown', callback);
  }
}
