import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';

export default class GameManager {
  constructor(scene, waveManager) {
    this.scene = scene;
    this.waveManager = waveManager;
    this.D = 10;

    // Prep 카운트다운 텍스트
    this.prepText = scene.add.text(GAME_WIDTH / 2, 60, '', {
      fontSize: '28px', color: '#e0c872', fontFamily: 'Georgia, serif', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(this.D).setVisible(false);

    // 조기시작 버튼
    this.earlyBtnBg = scene.add.graphics().setDepth(this.D).setVisible(false);
    this.earlyBtnText = scene.add.text(GAME_WIDTH / 2, 100, '▶ 조기시작 (+골드)', {
      fontSize: '16px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(this.D).setVisible(false);

    this.earlyBtnZone = scene.add.zone(GAME_WIDTH / 2, 100, 200, 36)
      .setInteractive({ useHandCursor: true }).setDepth(this.D);
    this.earlyBtnZone.setVisible(false);

    this.onEarlyStart = null;
    this.earlyBtnZone.on('pointerdown', () => {
      if (this.onEarlyStart) this.onEarlyStart();
    });

    // 웨이브 클리어 배너
    this.bannerText = null;
  }

  setEarlyStartCallback(cb) {
    this.onEarlyStart = cb;
  }

  update() {
    const phase = this.waveManager.phase;
    const countdown = this.waveManager.prepCountdown;

    if (phase === 'prep' && countdown > 0) {
      this.prepText.setVisible(true);
      this.prepText.setText(`Next wave in ${Math.ceil(countdown)}s`);

      const bonus = Math.floor(countdown * 3);
      this.earlyBtnText.setText(`▶ 조기시작 (+${bonus}g)`);
      this._showEarlyBtn(true);
    } else {
      this.prepText.setVisible(false);
      this._showEarlyBtn(false);
    }
  }

  _showEarlyBtn(show) {
    this.earlyBtnBg.setVisible(show);
    this.earlyBtnText.setVisible(show);
    this.earlyBtnZone.setVisible(show);

    if (show) {
      this.earlyBtnBg.clear();
      this.earlyBtnBg.fillStyle(0x44aa44, 0.9);
      this.earlyBtnBg.fillRoundedRect(GAME_WIDTH / 2 - 100, 82, 200, 36, 8);
    }
  }

  showWaveClearBanner(waveNum, bonus) {
    if (this.bannerText) this.bannerText.destroy();

    this.bannerText = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.35,
      `Wave ${waveNum} Clear!  +${bonus}g`, {
        fontSize: '24px', color: '#44ff44', fontFamily: 'Arial', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(20);

    this.scene.tweens.add({
      targets: this.bannerText,
      y: this.bannerText.y - 40,
      alpha: 0,
      duration: 2000,
      onComplete: () => {
        if (this.bannerText) {
          this.bannerText.destroy();
          this.bannerText = null;
        }
      },
    });
  }

  showEarlyStartBonus(bonus) {
    const text = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.4, `+${bonus}g 조기시작!`, {
      fontSize: '22px', color: '#ffd700', fontFamily: 'Arial', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 60,
      alpha: 0,
      duration: 1500,
      onComplete: () => text.destroy(),
    });
  }
}
