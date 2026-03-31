import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';
import { TOWER_TYPES } from '../config/TowerConfig.js';

export default class TowerShop {
  constructor(scene, onSelect) {
    this.scene = scene;
    this.onSelect = onSelect;
    this.selectedType = 'arrow';
    this.buttons = {};

    const D = 10;
    const types = Object.keys(TOWER_TYPES);
    const panelH = 56;
    const panelY = GAME_HEIGHT - panelH;

    // 패널 배경
    this.panelBg = scene.add.graphics().setDepth(D);
    this.panelBg.fillStyle(0x111122, 0.85);
    this.panelBg.fillRect(0, panelY, GAME_WIDTH, panelH);
    this.panelBg.lineStyle(1, 0x333366, 1);
    this.panelBg.lineBetween(0, panelY, GAME_WIDTH, panelY);

    const btnW = 80;
    const gap = 8;
    const totalW = types.length * btnW + (types.length - 1) * gap;
    const startX = (GAME_WIDTH - totalW) / 2;
    const btnY = panelY + panelH / 2;

    types.forEach((type, i) => {
      const x = startX + i * (btnW + gap) + btnW / 2;
      const template = TOWER_TYPES[type];

      const btnBg = scene.add.graphics().setDepth(D);
      const icon = scene.add.text(x - 14, btnY - 8, template.icon, {
        fontSize: '18px',
      }).setOrigin(0.5).setDepth(D);

      const nameText = scene.add.text(x + 8, btnY - 12, template.name, {
        fontSize: '11px', color: '#ffffff', fontFamily: 'Arial',
      }).setOrigin(0, 0.5).setDepth(D);

      const costText = scene.add.text(x, btnY + 12, `${template.cost}g`, {
        fontSize: '11px', color: '#aaaaaa', fontFamily: 'Arial',
      }).setOrigin(0.5).setDepth(D);

      const zone = scene.add.zone(x, btnY, btnW, panelH - 8)
        .setInteractive({ useHandCursor: true }).setDepth(D);

      zone.on('pointerdown', (pointer) => {
        pointer.event?.stopPropagation();
        this.selectedType = type;
        this._refresh();
        if (this.onSelect) this.onSelect(type);
      });

      this.buttons[type] = { btnBg, icon, nameText, costText, x, btnY, btnW };
    });

    this._refresh();
  }

  _refresh(gold) {
    for (const [type, btn] of Object.entries(this.buttons)) {
      const isSelected = type === this.selectedType;
      const template = TOWER_TYPES[type];
      const affordable = gold === undefined || gold >= template.cost;

      btn.btnBg.clear();
      if (isSelected) {
        btn.btnBg.fillStyle(0xe0c872, 0.3);
        btn.btnBg.lineStyle(2, 0xe0c872, 1);
      } else {
        btn.btnBg.fillStyle(0x222244, 0.5);
        btn.btnBg.lineStyle(1, 0x444466, 0.5);
      }
      btn.btnBg.fillRoundedRect(btn.x - btn.btnW / 2, btn.btnY - 22, btn.btnW, 44, 6);
      btn.btnBg.strokeRoundedRect(btn.x - btn.btnW / 2, btn.btnY - 22, btn.btnW, 44, 6);

      btn.costText.setColor(isSelected ? '#e0c872' : affordable ? '#aaaaaa' : '#ff4444');
      btn.nameText.setAlpha(affordable ? 1 : 0.4);
      btn.icon.setAlpha(affordable ? 1 : 0.4);
    }
  }

  update(gold) {
    this._refresh(gold);
  }

  getSelectedType() {
    return this.selectedType;
  }
}
