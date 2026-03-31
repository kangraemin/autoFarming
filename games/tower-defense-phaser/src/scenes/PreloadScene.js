import Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  init() {
    const { width, height } = this.scale;

    // 배경
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // 프로그레스바 배경
    const barBg = this.add.rectangle(width / 2, height / 2 + 40, 400, 30, 0x333333);
    barBg.setOrigin(0.5);

    // 프로그레스바
    const barFill = this.add.rectangle(width / 2 - 198, height / 2 + 40, 0, 26, 0xe0c872);
    barFill.setOrigin(0, 0.5);

    // 로딩 텍스트
    const loadingText = this.add.text(width / 2, height / 2 - 20, 'Loading Assets...', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // 퍼센트 텍스트
    const percentText = this.add.text(width / 2, height / 2 + 80, '0%', {
      fontSize: '16px',
      color: '#aaaaaa',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      barFill.width = 396 * value;
      percentText.setText(`${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      loadingText.setText('Complete!');
      percentText.setText('100%');
    });
  }

  preload() {
    const base = 'assets';

    // --- Monster_1 (Flying boss): Fly + Dying ---
    this._loadFrames(`${base}/enemies/monster/Monster_1/PNG/PNG Sequences/Fly`, 'monster1_fly', 18);
    this._loadFrames(`${base}/enemies/monster/Monster_1/PNG/PNG Sequences/Dying`, 'monster1_dying', 18);

    // --- Monster_6 (Walking goblin): Walking + Dying ---
    this._loadFrames(`${base}/enemies/monster/Monster_6/PNG/PNG Sequences/Walking`, 'monster6_walking', 18);
    this._loadFrames(`${base}/enemies/monster/Monster_6/PNG/PNG Sequences/Dying`, 'monster6_dying', 18);

    // --- Monster_8 (Walking wolf): Walking + Dying ---
    this._loadFrames(`${base}/enemies/monster/Monster_8/PNG/PNG Sequences/Walking`, 'monster8_walking', 18);
    this._loadFrames(`${base}/enemies/monster/Monster_8/PNG/PNG Sequences/Dying`, 'monster8_dying', 18);

    // --- Monster_10 (Walking golem): Walking + Dying ---
    this._loadFrames(`${base}/enemies/monster/Monster_10/PNG/PNG Sequences/Walking`, 'monster10_walking', 18);
    this._loadFrames(`${base}/enemies/monster/Monster_10/PNG/PNG Sequences/Dying`, 'monster10_dying', 18);

    // --- Archer tower: Unit 1/2/3 Idle ---
    for (let unit = 1; unit <= 3; unit++) {
      this.load.image(`archer_unit${unit}_idle_s`, `${base}/towers/archer/3 Units/${unit}/S_Idle.png`);
      this.load.image(`archer_unit${unit}_idle_d`, `${base}/towers/archer/3 Units/${unit}/D_Idle.png`);
      this.load.image(`archer_unit${unit}_idle_u`, `${base}/towers/archer/3 Units/${unit}/U_Idle.png`);
    }

    // --- Arrow 투사체 ---
    this.load.image('arrow_1', `${base}/towers/archer/3 Units/Arrow/1.png`);

    // --- Stone tower base ---
    this.load.image('stone_base', `${base}/towers/stone/PNG/1.png`);

    // --- Archer tower upgrade levels (idle base) ---
    for (let level = 1; level <= 7; level++) {
      this.load.image(`archer_level_${level}`, `${base}/towers/archer/2 Idle/${level}.png`);
    }
  }

  /**
   * 시퀀스 프레임 로드 헬퍼
   * 파일 패턴: 0_Monster_<Action>_000.png ~ 0_Monster_<Action>_0NN.png
   */
  _loadFrames(folderPath, keyPrefix, frameCount) {
    const action = folderPath.split('/').pop();
    for (let i = 0; i < frameCount; i++) {
      const idx = String(i).padStart(3, '0');
      this.load.image(
        `${keyPrefix}_${i}`,
        `${folderPath}/0_Monster_${action}_${idx}.png`
      );
    }
  }

  create() {
    this.time.delayedCall(300, () => {
      this.scene.start('MenuScene');
    });
  }
}
