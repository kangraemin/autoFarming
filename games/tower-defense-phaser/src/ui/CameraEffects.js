import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';

export default class CameraEffects {
  constructor(scene) {
    this.scene = scene;

    // Close call red flash overlay
    this.flashOverlay = scene.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0xff1e1e, 0
    ).setDepth(25).setVisible(false);
  }

  /**
   * 적이 끝에 도달했을 때 빨간 플래시
   * @param {number} leaked - 도달한 적 수
   */
  closeCallFlash(leaked) {
    if (leaked <= 0) return;

    const intensity = Math.min(0.15 + leaked * 0.1, 0.45);
    this.flashOverlay.setAlpha(intensity).setVisible(true);

    this.scene.tweens.add({
      targets: this.flashOverlay,
      alpha: 0,
      duration: 400,
      onComplete: () => this.flashOverlay.setVisible(false),
    });

    // 흔들림도 함께
    const shakeIntensity = Math.min(0.003 + leaked * 0.002, 0.01);
    this.scene.cameras.main.shake(200, shakeIntensity);
  }
}
