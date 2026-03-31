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
    this.totalKills = data.totalKills || 0;
    this.towersBuilt = data.towersBuilt || 0;
  }

  create() {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0e0618, 0x0e0618, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const stage = STAGES[this.stageIndex];
    const cx = GAME_WIDTH / 2;

    if (this.stageClear) {
      this._renderStageClear(cx, stage);
    } else {
      this._renderGameOver(cx, stage);
    }

    // 버튼
    this._createButton(cx, 460, 'Retry', () => {
      this.scene.start('GameScene', { stageIndex: this.stageIndex });
    });
    this._createButton(cx, 510, 'Stage Select', () => {
      this.scene.start('StageSelectScene');
    }, 0x555577);

    // 다음 스테이지 (클리어 시)
    if (this.stageClear && this.stageIndex + 1 < STAGES.length) {
      this._createButton(cx, 410, 'Next Stage →', () => {
        this.scene.start('GameScene', { stageIndex: this.stageIndex + 1 });
      }, 0x44aa44);
    }
  }

  _renderStageClear(cx, stage) {
    // 타이틀
    this.add.text(cx, 120, `${stage.name} 클리어!`, {
      fontSize: '42px', color: '#e0c872', fontFamily: 'Georgia, serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    // 별점
    const starColors = ['#ff6b6b', '#ffa500', '#ffd700'];
    for (let i = 0; i < 3; i++) {
      const earned = this.stars >= i + 1;
      const star = this.add.text(cx + (i - 1) * 50, 185, '★', {
        fontSize: '48px', color: earned ? starColors[i] : '#333355', fontFamily: 'Arial',
      }).setOrigin(0.5);

      if (earned) {
        star.setScale(0);
        this.tweens.add({
          targets: star,
          scale: 1,
          duration: 400,
          delay: i * 200,
          ease: 'Back.easeOut',
        });
      }
    }

    // 통계
    const stats = [
      `체력 ${this.lives}/20`,
      `점수 ${this.score}`,
      `처치 ${this.totalKills}`,
      `타워 ${this.towersBuilt}`,
    ];
    stats.forEach((line, i) => {
      this.add.text(cx, 250 + i * 28, line, {
        fontSize: '16px', color: '#aaaacc', fontFamily: 'Arial',
      }).setOrigin(0.5);
    });
  }

  _renderGameOver(cx, stage) {
    // 타이틀
    this.add.text(cx, 140, 'Game Over', {
      fontSize: '52px', color: '#ff4444', fontFamily: 'Georgia, serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    // 서브타이틀
    this.add.text(cx, 200, `${stage.name}`, {
      fontSize: '20px', color: '#888899', fontFamily: 'Arial',
    }).setOrigin(0.5);

    // 통계
    const stats = [
      `도달 웨이브: ${this.wave}/${stage.waves}`,
      `점수: ${this.score}`,
      `처치: ${this.totalKills}`,
      `타워: ${this.towersBuilt}`,
    ];
    stats.forEach((line, i) => {
      this.add.text(cx, 250 + i * 28, line, {
        fontSize: '16px', color: '#aaaacc', fontFamily: 'Arial',
      }).setOrigin(0.5);
    });

    // 팁
    const tips = [
      '타워를 경로 굽이에 배치하면 효과적입니다.',
      'Ice 타워로 적을 늦추고 Cannon으로 마무리!',
      'Lightning 체인으로 밀집된 적을 처리하세요.',
      '조기시작 보너스로 골드를 절약하세요.',
    ];
    const tip = tips[Math.floor(Math.random() * tips.length)];
    this.add.text(cx, 380, `💡 ${tip}`, {
      fontSize: '13px', color: '#e0c872', fontFamily: 'Arial', fontStyle: 'italic',
      wordWrap: { width: 400 },
    }).setOrigin(0.5);
  }

  _createButton(x, y, label, callback, color) {
    const w = 200;
    const h = 38;
    const fillColor = color || 0xe0c872;
    const textColor = fillColor === 0xe0c872 ? '#1a1a2e' : '#ffffff';

    const btnBg = this.add.graphics();
    btnBg.fillStyle(fillColor, 1);
    btnBg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);

    this.add.text(x, y, label, {
      fontSize: '16px', color: textColor, fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);

    const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(fillColor, 0.8);
      btnBg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
    });
    zone.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(fillColor, 1);
      btnBg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
    });
    zone.on('pointerdown', callback);
  }
}
