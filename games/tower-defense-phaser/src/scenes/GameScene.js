import Phaser from 'phaser';
import { GRID_SIZE, COLS, ROWS, GAME_WIDTH, GAME_HEIGHT, INITIAL_LIVES } from '../config/GameConfig.js';
import { STAGES, generatePathForStage, getStageStars, saveStageProgress } from '../config/StageConfig.js';
import { TOWER_TYPES } from '../config/TowerConfig.js';
import TowerManager from '../entities/TowerManager.js';
import EnemyManager from '../entities/EnemyManager.js';
import WaveManager from '../entities/WaveManager.js';
import ProjectileManager from '../entities/ProjectileManager.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.stageIndex = data.stageIndex || 0;
    this.stage = STAGES[this.stageIndex];

    this.gameState = {
      gold: this.stage.startGold,
      lives: INITIAL_LIVES,
      score: 0,
    };

    this.selectedTowerType = 'arrow';
    this.selectedTower = null;
  }

  create() {
    // 배경 그라데이션
    const bg = this.add.graphics();
    bg.fillGradientStyle(
      this.stage.bgColorA, this.stage.bgColorA,
      this.stage.bgColorB, this.stage.bgColorB, 1
    );
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 경로 생성
    const { path, pathSet } = generatePathForStage(this.stageIndex);
    this.pathData = path;
    this.pathSet = pathSet;

    // 그리드 렌더링
    this._drawGrid();

    // 경로 렌더링
    this._drawPath(path);

    // 시작/끝 마커
    if (path.length > 0) {
      this._drawMarker(path[0], 0x44ff44, 'START');
      this._drawMarker(path[path.length - 1], 0xff4444, 'END');
    }

    // 매니저 초기화
    this.towerManager = new TowerManager(this);
    this.enemyManager = new EnemyManager(this);
    this.waveManager = new WaveManager(this, this.enemyManager);
    this.waveManager.setStage(this.stageIndex);
    this.projectileManager = new ProjectileManager(this);

    // HUD
    this._createHUD();

    // 타워 선택 UI
    this._createTowerSelector();

    // 뒤로가기 버튼
    this._createBackButton();

    // 그리드 클릭: 타워 배치
    this.input.on('pointerdown', (pointer) => {
      if (pointer.y < 36 || pointer.y > GAME_HEIGHT - 60) return; // HUD 영역 무시

      const col = Math.floor(pointer.x / GRID_SIZE);
      const row = Math.floor(pointer.y / GRID_SIZE);

      // 기존 타워 선택
      const existingTower = this.towerManager.getTowerAt(col, row);
      if (existingTower) {
        this._selectTower(existingTower);
        return;
      }

      // 새 타워 배치
      if (this.selectedTower) {
        this._deselectTower();
      }
      const tower = this.towerManager.place(this.selectedTowerType, col, row, this.gameState);
      if (tower) {
        this._updateHUD();
      }
    });

    // 웨이브 시작 버튼
    this._createWaveButton();
  }

  update(time, delta) {
    const dt = delta / 1000;

    // 준비 단계 카운트다운
    this.waveManager.updatePrep(dt, this.gameState, this.pathData);

    // 적 업데이트
    this.enemyManager.update(dt);

    // 타워 업데이트 → 타겟 반환 → 투사체 발사
    const aliveEnemies = this.enemyManager.getAliveEnemies();
    const targets = this.towerManager.update(dt, aliveEnemies);

    for (const { tower, target } of targets) {
      this.projectileManager.fire(tower, target);
    }

    // 투사체 업데이트 (데미지/이펙트 처리 포함)
    this.projectileManager.update(dt, aliveEnemies, this.gameState);

    // 웨이브 종료 체크
    const result = this.waveManager.checkWaveEnd(this.gameState);
    if (result.ended) {
      if (result.gameOver) {
        this.scene.start('GameOverScene', {
          stageIndex: this.stageIndex,
          wave: this.waveManager.currentWave,
          score: this.gameState.score,
        });
        return;
      }
      if (result.stageClear) {
        const stars = getStageStars(this.gameState.lives);
        saveStageProgress(this.stageIndex, stars);
        this.scene.start('GameOverScene', {
          stageIndex: this.stageIndex,
          wave: this.waveManager.currentWave,
          score: this.gameState.score,
          stageClear: true,
          stars,
          lives: this.gameState.lives,
        });
        return;
      }
    }

    this._updateHUD();
  }

  _drawGrid() {
    const grid = this.add.graphics();
    grid.lineStyle(1, 0xffffff, 0.08);

    for (let col = 0; col <= COLS; col++) {
      grid.moveTo(col * GRID_SIZE, 0);
      grid.lineTo(col * GRID_SIZE, GAME_HEIGHT);
    }
    for (let row = 0; row <= ROWS; row++) {
      grid.moveTo(0, row * GRID_SIZE);
      grid.lineTo(GAME_WIDTH, row * GRID_SIZE);
    }
    grid.strokePath();
  }

  _drawPath(path) {
    const pathGfx = this.add.graphics();

    pathGfx.fillStyle(0xddcc88, 0.25);
    for (const { col, row } of path) {
      pathGfx.fillRect(col * GRID_SIZE, row * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    }

    if (path.length < 2) return;
    pathGfx.lineStyle(2, 0xddcc88, 0.5);
    pathGfx.beginPath();
    pathGfx.moveTo(
      path[0].col * GRID_SIZE + GRID_SIZE / 2,
      path[0].row * GRID_SIZE + GRID_SIZE / 2
    );
    for (let i = 1; i < path.length; i++) {
      pathGfx.lineTo(
        path[i].col * GRID_SIZE + GRID_SIZE / 2,
        path[i].row * GRID_SIZE + GRID_SIZE / 2
      );
    }
    pathGfx.strokePath();
  }

  _drawMarker(cell, color, label) {
    const cx = cell.col * GRID_SIZE + GRID_SIZE / 2;
    const cy = cell.row * GRID_SIZE + GRID_SIZE / 2;

    this.add.circle(cx, cy, GRID_SIZE * 0.4, color, 0.6);
    this.add.text(cx, cy, label, {
      fontSize: '10px',
      color: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  _createHUD() {
    this.hudBg = this.add.graphics();
    this.hudBg.fillStyle(0x000000, 0.5);
    this.hudBg.fillRect(0, 0, GAME_WIDTH, 36);
    this.hudBg.setDepth(10);

    this.hudStage = this.add.text(10, 8, '', {
      fontSize: '16px', color: '#e0c872', fontFamily: 'Arial', fontStyle: 'bold',
    }).setDepth(10);

    this.hudGold = this.add.text(GAME_WIDTH - 10, 8, '', {
      fontSize: '16px', color: '#ffd700', fontFamily: 'Arial',
    }).setOrigin(1, 0).setDepth(10);

    this.hudWave = this.add.text(GAME_WIDTH / 2, 8, '', {
      fontSize: '16px', color: '#aaaacc', fontFamily: 'Arial',
    }).setOrigin(0.5, 0).setDepth(10);

    this.hudLives = this.add.text(GAME_WIDTH - 200, 8, '', {
      fontSize: '16px', color: '#ff6666', fontFamily: 'Arial',
    }).setOrigin(1, 0).setDepth(10);

    this._updateHUD();
  }

  _updateHUD() {
    this.hudStage.setText(`Stage ${this.stageIndex + 1}: ${this.stage.name}`);
    this.hudGold.setText(`Gold: ${this.gameState.gold}`);
    this.hudWave.setText(`Wave: ${this.waveManager.currentWave}/${this.waveManager.getTotalWaves()}`);
    this.hudLives.setText(`Lives: ${this.gameState.lives}`);
  }

  _createTowerSelector() {
    const y = GAME_HEIGHT - 50;
    const types = Object.keys(TOWER_TYPES);
    const startX = GAME_WIDTH / 2 - (types.length * 70) / 2;

    this.towerButtons = {};

    types.forEach((type, i) => {
      const x = startX + i * 70 + 35;
      const template = TOWER_TYPES[type];

      const btnBg = this.add.graphics().setDepth(10);
      btnBg.fillStyle(type === this.selectedTowerType ? 0xe0c872 : 0x333355, 1);
      btnBg.fillRoundedRect(x - 28, y - 18, 56, 36, 6);

      const btnText = this.add.text(x, y - 4, template.icon, {
        fontSize: '20px',
      }).setOrigin(0.5).setDepth(10);

      const costText = this.add.text(x, y + 12, `${template.cost}g`, {
        fontSize: '10px',
        color: type === this.selectedTowerType ? '#1a1a2e' : '#aaaaaa',
        fontFamily: 'Arial',
      }).setOrigin(0.5).setDepth(10);

      const zone = this.add.zone(x, y, 56, 36).setInteractive({ useHandCursor: true }).setDepth(10);
      zone.on('pointerdown', () => {
        this._deselectTower();
        this.selectedTowerType = type;
        this._refreshTowerSelector();
      });

      this.towerButtons[type] = { btnBg, btnText, costText, x, y };
    });
  }

  _refreshTowerSelector() {
    for (const [type, btn] of Object.entries(this.towerButtons)) {
      const isSelected = type === this.selectedTowerType;
      btn.btnBg.clear();
      btn.btnBg.fillStyle(isSelected ? 0xe0c872 : 0x333355, 1);
      btn.btnBg.fillRoundedRect(btn.x - 28, btn.y - 18, 56, 36, 6);
      btn.costText.setColor(isSelected ? '#1a1a2e' : '#aaaaaa');
    }
  }

  _selectTower(tower) {
    this._deselectTower();
    this.selectedTower = tower;
    tower.showRange();
  }

  _deselectTower() {
    if (this.selectedTower) {
      this.selectedTower.hideRange();
      this.selectedTower = null;
    }
  }

  _createWaveButton() {
    const x = GAME_WIDTH - 80;
    const y = GAME_HEIGHT - 50;

    this.waveBtnBg = this.add.graphics().setDepth(10);
    this.waveBtnBg.fillStyle(0x44aa44, 1);
    this.waveBtnBg.fillRoundedRect(x - 35, y - 16, 70, 32, 8);

    this.waveBtnText = this.add.text(x, y, '▶ START', {
      fontSize: '12px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);

    const zone = this.add.zone(x, y, 70, 32).setInteractive({ useHandCursor: true }).setDepth(10);
    zone.on('pointerdown', () => {
      if (this.waveManager.phase === 'prep') {
        const result = this.waveManager.startWave(true, this.gameState, this.pathData);
        if (result.bonus > 0) {
          const bonusText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.4, `+${result.bonus}g 조기시작!`, {
            fontSize: '22px', color: '#ffd700', fontFamily: 'Arial', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3,
          }).setOrigin(0.5).setDepth(20);

          this.tweens.add({
            targets: bonusText,
            y: bonusText.y - 60,
            alpha: 0,
            duration: 1500,
            onComplete: () => bonusText.destroy(),
          });
        }
        this._updateHUD();
      }
    });
  }

  _createBackButton() {
    const btn = this.add.text(10, GAME_HEIGHT - 30, '← Back', {
      fontSize: '14px', color: '#aaaaaa', fontFamily: 'Arial',
    }).setInteractive({ useHandCursor: true }).setDepth(10);

    btn.on('pointerover', () => btn.setColor('#ffffff'));
    btn.on('pointerout', () => btn.setColor('#aaaaaa'));
    btn.on('pointerdown', () => {
      this.towerManager?.destroy();
      this.enemyManager?.destroy();
      this.projectileManager?.destroy();
      this.scene.start('StageSelectScene');
    });
  }
}
