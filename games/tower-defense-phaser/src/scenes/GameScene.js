import Phaser from 'phaser';
import { GRID_SIZE, COLS, ROWS, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig.js';
import { STAGES, generatePathForStage } from '../config/StageConfig.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.stageIndex = data.stageIndex || 0;
    this.stage = STAGES[this.stageIndex];
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

    // HUD
    this._createHUD();

    // 뒤로가기 버튼
    this._createBackButton();
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

    // 경로 타일 채우기
    pathGfx.fillStyle(0xddcc88, 0.25);
    for (const { col, row } of path) {
      pathGfx.fillRect(col * GRID_SIZE, row * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    }

    // 경로 중심선
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
    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x000000, 0.5);
    hudBg.fillRect(0, 0, GAME_WIDTH, 36);

    this.add.text(10, 8, `Stage ${this.stageIndex + 1}: ${this.stage.name}`, {
      fontSize: '16px',
      color: '#e0c872',
      fontFamily: 'Arial',
      fontStyle: 'bold',
    });

    this.add.text(GAME_WIDTH - 10, 8, `Gold: ${this.stage.startGold}`, {
      fontSize: '16px',
      color: '#ffd700',
      fontFamily: 'Arial',
    }).setOrigin(1, 0);

    this.add.text(GAME_WIDTH / 2, 8, `Waves: ${this.stage.waves}`, {
      fontSize: '16px',
      color: '#aaaacc',
      fontFamily: 'Arial',
    }).setOrigin(0.5, 0);
  }

  _createBackButton() {
    const btn = this.add.text(10, GAME_HEIGHT - 30, '← Back', {
      fontSize: '14px',
      color: '#aaaaaa',
      fontFamily: 'Arial',
    }).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor('#ffffff'));
    btn.on('pointerout', () => btn.setColor('#aaaaaa'));
    btn.on('pointerdown', () => {
      this.scene.start('StageSelectScene');
    });
  }
}
