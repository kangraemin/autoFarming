import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;

    // 그라데이션 배경
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    bg.fillRect(0, 0, width, height);

    // 장식 원형 파티클
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const r = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.4);
      const dot = this.add.circle(x, y, r, 0xe0c872, alpha);

      this.tweens.add({
        targets: dot,
        alpha: { from: alpha, to: alpha * 0.3 },
        duration: Phaser.Math.Between(1500, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // 타이틀
    const title = this.add.text(width / 2, height * 0.35, 'Soul Tower Defense', {
      fontSize: '64px',
      color: '#e0c872',
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // 타이틀 글로우 애니메이션
    this.tweens.add({
      targets: title,
      alpha: { from: 0.85, to: 1 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 서브타이틀
    this.add.text(width / 2, height * 0.35 + 50, 'Defend your realm', {
      fontSize: '20px',
      color: '#8888aa',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // 시작 버튼
    const btnWidth = 220;
    const btnHeight = 55;
    const btnX = width / 2;
    const btnY = height * 0.6;

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xe0c872, 1);
    btnBg.fillRoundedRect(btnX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 12);

    const btnText = this.add.text(btnX, btnY, 'START GAME', {
      fontSize: '24px',
      color: '#1a1a2e',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 버튼 히트 영역
    const btnZone = this.add.zone(btnX, btnY, btnWidth, btnHeight).setInteractive({ useHandCursor: true });

    btnZone.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0xf0d882, 1);
      btnBg.fillRoundedRect(btnX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 12);
    });

    btnZone.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0xe0c872, 1);
      btnBg.fillRoundedRect(btnX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 12);
    });

    btnZone.on('pointerdown', () => {
      this.scene.start('StageSelectScene');
    });

    // 하단 크레딧
    this.add.text(width / 2, height - 30, 'Built with Phaser 3', {
      fontSize: '14px',
      color: '#555577',
      fontFamily: 'Arial'
    }).setOrigin(0.5);
  }
}
