import Phaser from 'phaser';
import { GRID_SIZE, COLS, ROWS, GAME_WIDTH, GAME_HEIGHT, INITIAL_LIVES } from '../config/GameConfig.js';
import { STAGES, generatePathForStage, getStageStars, saveStageProgress } from '../config/StageConfig.js';
import { TOWER_TYPES } from '../config/TowerConfig.js';
import TowerManager from '../entities/TowerManager.js';
import EnemyManager from '../entities/EnemyManager.js';
import WaveManager from '../entities/WaveManager.js';
import ProjectileManager from '../entities/ProjectileManager.js';
import HUD from '../ui/HUD.js';
import TowerShop from '../ui/TowerShop.js';
import UpgradePopup from '../ui/UpgradePopup.js';
import GameManager from '../ui/GameManager.js';
import SpeedControl from '../ui/SpeedControl.js';

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

    // 그리드 + 경로 렌더링
    this._drawGrid();
    this._drawPath(path);

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

    // UI 초기화
    this.hud = new HUD(this);
    this.towerShop = new TowerShop(this, (type) => {
      this._closeUpgradePopup();
    });
    this.upgradePopup = new UpgradePopup(this);
    this.gameManager = new GameManager(this, this.waveManager);
    this.speedControl = new SpeedControl(this);

    // 조기시작 콜백
    this.gameManager.setEarlyStartCallback(() => {
      if (this.waveManager.phase === 'prep') {
        const result = this.waveManager.startWave(true, this.gameState, this.pathData);
        if (result.bonus > 0) {
          this.gameManager.showEarlyStartBonus(result.bonus);
        }
      }
    });

    // 타워 배치 프리뷰
    this.previewSprite = null;
    this.previewRange = this.add.graphics().setDepth(8);
    this._setupPlacementPreview();

    // 뒤로가기
    this._createBackButton();

    // 그리드 클릭
    this.input.on('pointerdown', (pointer) => {
      if (pointer.y < 36 || pointer.y > GAME_HEIGHT - 60) return;

      const col = Math.floor(pointer.x / GRID_SIZE);
      const row = Math.floor(pointer.y / GRID_SIZE);

      // 기존 타워 클릭 → 업그레이드 팝업
      const existingTower = this.towerManager.getTowerAt(col, row);
      if (existingTower) {
        this._showUpgradePopup(existingTower);
        return;
      }

      // 빈 칸 → 타워 배치
      this._closeUpgradePopup();
      const type = this.towerShop.getSelectedType();
      const tower = this.towerManager.place(type, col, row, this.gameState);
      if (tower) {
        // 배치 성공
      }
    });
  }

  update(time, delta) {
    const speedMult = this.speedControl.getSpeed();
    const dt = (delta / 1000) * speedMult;

    // 준비 단계 카운트다운
    this.waveManager.updatePrep(dt, this.gameState, this.pathData);

    // 적 업데이트
    this.enemyManager.update(dt);

    // 타워 → 투사체
    const aliveEnemies = this.enemyManager.getAliveEnemies();
    const targets = this.towerManager.update(dt, aliveEnemies);
    for (const { tower, target } of targets) {
      this.projectileManager.fire(tower, target);
    }
    this.projectileManager.update(dt, aliveEnemies, this.gameState);

    // 웨이브 종료 체크
    const result = this.waveManager.checkWaveEnd(this.gameState);
    if (result.ended) {
      if (result.gameOver) {
        this._goToGameOver(false);
        return;
      }
      if (result.stageClear) {
        const stars = getStageStars(this.gameState.lives);
        saveStageProgress(this.stageIndex, stars);
        this._goToGameOver(true, stars);
        return;
      }
      if (result.bonus > 0) {
        this.gameManager.showWaveClearBanner(this.waveManager.currentWave - 1, result.bonus);
      }
    }

    // UI 업데이트
    this.hud.update(this.gameState, this.waveManager, this.stageIndex, this.stage.name);
    this.towerShop.update(this.gameState.gold);
    this.gameManager.update();
  }

  _goToGameOver(stageClear, stars) {
    const totalKills = this.towerManager.towers.reduce((sum, t) => sum + t.kills, 0);
    this.scene.start('GameOverScene', {
      stageIndex: this.stageIndex,
      wave: this.waveManager.currentWave,
      score: this.gameState.score,
      stageClear,
      stars: stars || 0,
      lives: this.gameState.lives,
      totalKills,
      towersBuilt: this.towerManager.towers.length,
    });
  }

  _showUpgradePopup(tower) {
    this._closeUpgradePopup();
    this.selectedTower = tower;
    tower.showRange();

    this.upgradePopup.show(tower, this.gameState,
      // 업그레이드
      (t) => {
        if (this.towerManager.upgrade(t, this.gameState)) {
          this._showUpgradePopup(t); // 갱신
        }
      },
      // 판매
      (t) => {
        this.towerManager.sell(t, this.gameState);
        this._closeUpgradePopup();
      }
    );
  }

  _closeUpgradePopup() {
    this.upgradePopup.hide();
    if (this.selectedTower) {
      this.selectedTower.hideRange();
      this.selectedTower = null;
    }
  }

  _setupPlacementPreview() {
    this.input.on('pointermove', (pointer) => {
      if (pointer.y < 36 || pointer.y > GAME_HEIGHT - 60) {
        this._hidePreview();
        return;
      }

      const col = Math.floor(pointer.x / GRID_SIZE);
      const row = Math.floor(pointer.y / GRID_SIZE);
      if (col < 0 || col >= COLS || row < 0 || row >= ROWS) {
        this._hidePreview();
        return;
      }

      const type = this.towerShop.getSelectedType();
      const template = TOWER_TYPES[type];
      const cx = col * GRID_SIZE + GRID_SIZE / 2;
      const cy = row * GRID_SIZE + GRID_SIZE / 2;
      const canPlace = this.towerManager.canPlace(col, row);

      // 프리뷰 스프라이트
      if (!this.previewSprite) {
        this.previewSprite = this.add.image(cx, cy, 'stone_base')
          .setDisplaySize(GRID_SIZE, GRID_SIZE)
          .setAlpha(0.5)
          .setDepth(8);
      } else {
        this.previewSprite.setPosition(cx, cy).setVisible(true);
      }

      if (canPlace) {
        this.previewSprite.clearTint();
      } else {
        this.previewSprite.setTint(0xff4444);
      }

      // 사거리 원 프리뷰
      this.previewRange.clear();
      this.previewRange.lineStyle(1, canPlace ? 0xffffff : 0xff4444, 0.3);
      this.previewRange.strokeCircle(cx, cy, template.range * GRID_SIZE);
      this.previewRange.setVisible(true);
    });
  }

  _hidePreview() {
    if (this.previewSprite) {
      this.previewSprite.setVisible(false);
    }
    if (this.previewRange) {
      this.previewRange.clear();
      this.previewRange.setVisible(false);
    }
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
    pathGfx.moveTo(path[0].col * GRID_SIZE + GRID_SIZE / 2, path[0].row * GRID_SIZE + GRID_SIZE / 2);
    for (let i = 1; i < path.length; i++) {
      pathGfx.lineTo(path[i].col * GRID_SIZE + GRID_SIZE / 2, path[i].row * GRID_SIZE + GRID_SIZE / 2);
    }
    pathGfx.strokePath();
  }

  _drawMarker(cell, color, label) {
    const cx = cell.col * GRID_SIZE + GRID_SIZE / 2;
    const cy = cell.row * GRID_SIZE + GRID_SIZE / 2;
    this.add.circle(cx, cy, GRID_SIZE * 0.4, color, 0.6);
    this.add.text(cx, cy, label, {
      fontSize: '10px', color: '#ffffff', fontFamily: 'Arial', fontStyle: 'bold',
    }).setOrigin(0.5);
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
