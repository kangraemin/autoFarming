import { GAME_WIDTH } from '../config/GameConfig.js';

export default class HUD {
  constructor(scene) {
    this.scene = scene;
    const D = 10;

    // 상단 바 배경
    this.bg = scene.add.graphics().setDepth(D);
    this.bg.fillStyle(0x000000, 0.6);
    this.bg.fillRect(0, 0, GAME_WIDTH, 36);

    const textStyle = (color) => ({
      fontSize: '15px', color, fontFamily: 'Arial', fontStyle: 'bold',
    });

    // 골드 (금색)
    this.goldIcon = scene.add.text(10, 9, '💰', { fontSize: '14px' }).setDepth(D);
    this.goldText = scene.add.text(30, 9, '', textStyle('#ffd700')).setDepth(D);

    // 라이프 (빨강)
    this.livesIcon = scene.add.text(160, 9, '❤️', { fontSize: '14px' }).setDepth(D);
    this.livesText = scene.add.text(180, 9, '', textStyle('#ff6666')).setDepth(D);

    // 웨이브 (중앙)
    this.waveText = scene.add.text(GAME_WIDTH / 2, 9, '', {
      ...textStyle('#aaaacc'), fontStyle: 'normal',
    }).setOrigin(0.5, 0).setDepth(D);

    // 점수 (우측)
    this.scoreText = scene.add.text(GAME_WIDTH - 10, 9, '', {
      ...textStyle('#e0c872'), fontStyle: 'normal',
    }).setOrigin(1, 0).setDepth(D);

    // 스테이지명 (웨이브 옆)
    this.stageText = scene.add.text(GAME_WIDTH / 2, 9, '', {
      fontSize: '12px', color: '#888899', fontFamily: 'Arial',
    }).setOrigin(0.5, 0).setDepth(D);
  }

  update(gameState, waveManager, stageIndex, stageName) {
    // 값 변경 감지 → scale tween 강조
    if (this._prevGold !== undefined && this._prevGold !== gameState.gold) {
      this._pulseText(this.goldText);
    }
    if (this._prevLives !== undefined && this._prevLives !== gameState.lives) {
      this._pulseText(this.livesText);
    }
    this._prevGold = gameState.gold;
    this._prevLives = gameState.lives;

    this.goldText.setText(`${gameState.gold}`);
    this.livesText.setText(`${gameState.lives}`);
    this.waveText.setText(`Wave ${waveManager.currentWave}/${waveManager.getTotalWaves()}`);
    this.scoreText.setText(`Score: ${gameState.score}`);
    this.stageText.setText(`${stageIndex + 1}. ${stageName}`);
    this.stageText.setY(22);

    if (gameState.lives <= 5) {
      this.livesText.setColor('#ff2222');
    } else {
      this.livesText.setColor('#ff6666');
    }
  }

  _pulseText(textObj) {
    this.scene.tweens.add({
      targets: textObj,
      scale: { from: 1.3, to: 1 },
      duration: 200,
      ease: 'Sine.easeOut',
    });
  }
}
