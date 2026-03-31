import { GRID_SIZE, COLS, ROWS } from '../config/GameConfig.js';
import { TOWER_TYPES } from '../config/TowerConfig.js';
import Tower from './Tower.js';

export default class TowerManager {
  constructor(scene) {
    this.scene = scene;
    this.towers = [];
    this.occupied = new Set();
  }

  canPlace(col, row) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
    if (this.occupied.has(`${col},${row}`)) return false;
    if (this.scene.pathSet?.has(`${col},${row}`)) return false;
    return true;
  }

  place(type, col, row, gameState) {
    const template = TOWER_TYPES[type];
    if (!template) return null;
    if (gameState.gold < template.cost) return null;
    if (!this.canPlace(col, row)) return null;

    gameState.gold -= template.cost;
    const tower = new Tower(this.scene, type, col, row);
    this.towers.push(tower);
    this.occupied.add(`${col},${row}`);

    return tower;
  }

  upgrade(tower, gameState) {
    const cost = tower.getUpgradeCost();
    if (gameState.gold < cost) return false;

    gameState.gold -= cost;
    tower.upgrade();
    return true;
  }

  sell(tower, gameState) {
    const refund = tower.getSellRefund();
    gameState.gold += refund;
    this.occupied.delete(`${tower.col},${tower.row}`);
    this.towers = this.towers.filter(t => t !== tower);
    tower.destroy();
    return refund;
  }

  getTowerAt(col, row) {
    return this.towers.find(t => t.col === col && t.row === row) || null;
  }

  update(dt, enemies) {
    const targets = [];
    for (const tower of this.towers) {
      const target = tower.update(dt, enemies);
      if (target) {
        targets.push({ tower, target });
      }
    }
    return targets;
  }

  destroy() {
    for (const tower of this.towers) {
      tower.destroy();
    }
    this.towers = [];
    this.occupied.clear();
  }
}
