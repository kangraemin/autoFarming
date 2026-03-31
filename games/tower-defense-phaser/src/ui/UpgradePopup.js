import { GRID_SIZE, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';
import { TOWER_TYPES } from '../config/TowerConfig.js';

export default class UpgradePopup {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.tower = null;
  }

  show(tower, gameState, onUpgrade, onSell) {
    this.hide();
    this.tower = tower;

    const template = TOWER_TYPES[tower.towerType];
    const upgradeCost = tower.getUpgradeCost();
    const sellRefund = tower.getSellRefund();
    const canUpgrade = gameState.gold >= upgradeCost;

    const D = 20;
    const popW = 170;
    const popH = 160;

    // 팝업 위치: 타워 근처 앵커링
    let px = tower.x + GRID_SIZE;
    let py = tower.y - popH / 2;
    if (px + popW > GAME_WIDTH) px = tower.x - GRID_SIZE - popW;
    if (py < 40) py = 40;
    if (py + popH > GAME_HEIGHT - 60) py = GAME_HEIGHT - 60 - popH;

    this.container = this.scene.add.container(0, 0).setDepth(D);

    // 배경
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(px, py, popW, popH, 10);
    bg.lineStyle(2, 0xe0c872, 1);
    bg.strokeRoundedRect(px, py, popW, popH, 10);
    this.container.add(bg);

    // 타워 이름 + 레벨
    const title = this.scene.add.text(px + popW / 2, py + 14, `${template.icon} ${template.name} Lv.${tower.level}`, {
      fontSize: '13px', color: '#e0c872', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.container.add(title);

    // 스탯
    const stats = [
      `DMG: ${tower.damage}`,
      `Range: ${tower.range.toFixed(1)}`,
      `Speed: ${tower.fireRate.toFixed(1)}/s`,
      `Kills: ${tower.kills}`,
    ];
    stats.forEach((line, i) => {
      const t = this.scene.add.text(px + 12, py + 34 + i * 16, line, {
        fontSize: '11px', color: '#aaaacc', fontFamily: 'Arial',
      });
      this.container.add(t);
    });

    // 업그레이드 버튼
    const btnY = py + popH - 46;
    const upgBg = this.scene.add.graphics();
    upgBg.fillStyle(canUpgrade ? 0x44aa44 : 0x444444, 1);
    upgBg.fillRoundedRect(px + 8, btnY, popW / 2 - 12, 24, 5);
    this.container.add(upgBg);

    const upgText = this.scene.add.text(px + 8 + (popW / 2 - 12) / 2, btnY + 12, `⬆ ${upgradeCost}g`, {
      fontSize: '11px', color: canUpgrade ? '#ffffff' : '#888888', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(upgText);

    if (canUpgrade) {
      const upgZone = this.scene.add.zone(px + 8 + (popW / 2 - 12) / 2, btnY + 12, popW / 2 - 12, 24)
        .setInteractive({ useHandCursor: true }).setDepth(D);
      upgZone.on('pointerdown', (pointer) => {
        pointer.event?.stopPropagation();
        if (onUpgrade) onUpgrade(tower);
      });
      this.container.add(upgZone);
    }

    // 판매 버튼
    const sellBg = this.scene.add.graphics();
    sellBg.fillStyle(0xcc4444, 1);
    sellBg.fillRoundedRect(px + popW / 2 + 4, btnY, popW / 2 - 12, 24, 5);
    this.container.add(sellBg);

    const sellText = this.scene.add.text(px + popW / 2 + 4 + (popW / 2 - 12) / 2, btnY + 12, `💰 ${sellRefund}g`, {
      fontSize: '11px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(sellText);

    const sellZone = this.scene.add.zone(px + popW / 2 + 4 + (popW / 2 - 12) / 2, btnY + 12, popW / 2 - 12, 24)
      .setInteractive({ useHandCursor: true }).setDepth(D);
    sellZone.on('pointerdown', (pointer) => {
      pointer.event?.stopPropagation();
      if (onSell) onSell(tower);
    });
    this.container.add(sellZone);

    // 닫기 버튼
    const closeText = this.scene.add.text(px + popW - 8, py + 4, '✕', {
      fontSize: '14px', color: '#888888', fontFamily: 'Arial',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    closeText.on('pointerdown', (pointer) => {
      pointer.event?.stopPropagation();
      this.hide();
    });
    this.container.add(closeText);
  }

  hide() {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
    if (this.tower) {
      this.tower.hideRange();
      this.tower = null;
    }
  }

  isVisible() {
    return this.container !== null;
  }
}
