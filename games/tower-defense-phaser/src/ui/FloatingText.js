export default class FloatingText {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * 데미지 숫자 팝업
   */
  damage(x, y, amount, color = '#ffffff') {
    const text = this.scene.add.text(x, y - 10, `${amount}`, {
      fontSize: '13px',
      color,
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(15);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 30,
      alpha: 0,
      duration: 800,
      onComplete: () => text.destroy(),
    });
  }

  /**
   * +골드 팝업
   */
  gold(x, y, amount) {
    const text = this.scene.add.text(x, y - 10, `+${amount}g`, {
      fontSize: '14px',
      color: '#ffd700',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(15);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 40,
      alpha: 0,
      duration: 1000,
      onComplete: () => text.destroy(),
    });
  }

  /**
   * 특수 텍스트 (콤보, 스킬명 등)
   */
  special(x, y, message, color = '#ff8844', fontSize = '16px') {
    const text = this.scene.add.text(x, y - 20, message, {
      fontSize,
      color,
      fontFamily: 'Georgia, serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(15).setScale(0);

    this.scene.tweens.add({
      targets: text,
      scale: { from: 0, to: 1 },
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: text,
          y: text.y - 35,
          alpha: 0,
          duration: 1200,
          delay: 400,
          onComplete: () => text.destroy(),
        });
      },
    });
  }

  /**
   * 상태 텍스트 (슬로우, 동결 등)
   */
  status(x, y, message, color = '#88ccff') {
    const text = this.scene.add.text(x, y - 15, message, {
      fontSize: '12px',
      color,
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(15);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 25,
      alpha: 0,
      duration: 600,
      onComplete: () => text.destroy(),
    });
  }
}
