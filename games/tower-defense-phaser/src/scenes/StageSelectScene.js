import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';
import { STAGES, loadStageProgress, isStageUnlocked } from '../config/StageConfig.js';

export default class StageSelectScene extends Phaser.Scene {
  constructor() {
    super('StageSelectScene');
  }

  create() {
    // 배경
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 타이틀
    this.add.text(GAME_WIDTH / 2, 50, 'Select Stage', {
      fontSize: '36px',
      color: '#e0c872',
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 스테이지 카드 배치
    const progress = loadStageProgress();
    const cardWidth = 200;
    const cardHeight = 240;
    const gap = 20;
    const totalWidth = STAGES.length * cardWidth + (STAGES.length - 1) * gap;
    const startX = (GAME_WIDTH - totalWidth) / 2 + cardWidth / 2;
    const cardY = GAME_HEIGHT / 2 + 10;

    STAGES.forEach((stage, i) => {
      const x = startX + i * (cardWidth + gap);
      const unlocked = isStageUnlocked(i);
      const stars = progress[i].stars || 0;

      this._createStageCard(x, cardY, cardWidth, cardHeight, stage, i, unlocked, stars);
    });

    // 뒤로가기
    const backBtn = this.add.text(40, GAME_HEIGHT - 40, '← Menu', {
      fontSize: '18px',
      color: '#aaaaaa',
      fontFamily: 'Arial',
    }).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => backBtn.setColor('#ffffff'));
    backBtn.on('pointerout', () => backBtn.setColor('#aaaaaa'));
    backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
  }

  _createStageCard(x, y, w, h, stage, index, unlocked, stars) {
    const gfx = this.add.graphics();

    // 카드 배경
    const bgColor = unlocked ? 0x2a2a4e : 0x1a1a2e;
    const borderColor = unlocked ? 0xe0c872 : 0x444466;
    gfx.fillStyle(bgColor, 0.9);
    gfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);
    gfx.lineStyle(2, borderColor, 1);
    gfx.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);

    // 스테이지 번호
    this.add.text(x, y - h / 2 + 25, `${index + 1}`, {
      fontSize: '28px',
      color: unlocked ? '#e0c872' : '#555577',
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 스테이지 이름
    this.add.text(x, y - h / 2 + 60, stage.name, {
      fontSize: '16px',
      color: unlocked ? '#ffffff' : '#666688',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 힌트
    this.add.text(x, y - h / 2 + 85, stage.hint, {
      fontSize: '11px',
      color: '#8888aa',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    // 난이도 도트
    const diffStr = '●'.repeat(stage.difficulty) + '○'.repeat(5 - stage.difficulty);
    this.add.text(x, y + 10, diffStr, {
      fontSize: '14px',
      color: unlocked ? '#e0c872' : '#555577',
      fontFamily: 'Arial',
    }).setOrigin(0.5);

    // 별점
    const starColors = [0xff6b6b, 0xffa500, 0xffd700];
    for (let s = 0; s < 3; s++) {
      const sx = x + (s - 1) * 25;
      const sy = y + 40;
      const earned = stars >= s + 1;
      this.add.text(sx, sy, '★', {
        fontSize: '20px',
        color: earned ? `#${starColors[s].toString(16).padStart(6, '0')}` : '#333355',
        fontFamily: 'Arial',
      }).setOrigin(0.5);
    }

    if (unlocked) {
      // 플레이 버튼
      const btnY = y + h / 2 - 35;
      const btnGfx = this.add.graphics();
      btnGfx.fillStyle(0xe0c872, 1);
      btnGfx.fillRoundedRect(x - 40, btnY - 14, 80, 28, 8);

      const btnText = this.add.text(x, btnY, '▶ PLAY', {
        fontSize: '14px',
        color: '#1a1a2e',
        fontFamily: 'Arial',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      const btnZone = this.add.zone(x, btnY, 80, 28).setInteractive({ useHandCursor: true });

      btnZone.on('pointerover', () => {
        btnGfx.clear();
        btnGfx.fillStyle(0xf0d882, 1);
        btnGfx.fillRoundedRect(x - 40, btnY - 14, 80, 28, 8);
      });
      btnZone.on('pointerout', () => {
        btnGfx.clear();
        btnGfx.fillStyle(0xe0c872, 1);
        btnGfx.fillRoundedRect(x - 40, btnY - 14, 80, 28, 8);
      });
      btnZone.on('pointerdown', () => {
        this.scene.start('GameScene', { stageIndex: index });
      });
    } else {
      // 잠금 아이콘
      this.add.text(x, y + h / 2 - 35, '🔒', {
        fontSize: '24px',
      }).setOrigin(0.5);
    }
  }
}
