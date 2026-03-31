import { STAGES } from '../config/StageConfig.js';

export default class WaveManager {
  constructor(scene, enemyManager) {
    this.scene = scene;
    this.enemyManager = enemyManager;
    this.currentWave = 0;
    this.phase = 'prep'; // prep | wave | stageclear | gameover
    this.prepCountdown = 15;
    this.stageIndex = 0;
  }

  setStage(stageIndex) {
    this.stageIndex = stageIndex;
    this.currentWave = 0;
    this.phase = 'prep';
    this.prepCountdown = 15;
  }

  getStage() {
    return STAGES[this.stageIndex];
  }

  getTotalWaves() {
    return this.getStage().waves;
  }

  /**
   * 웨이브 구성 생성 (기존 _buildWaveComposition 포트)
   */
  _buildWaveComposition(waveNum) {
    const baseCount = 5 + waveNum * 2;
    const types = [];

    for (let i = 0; i < baseCount; i++) {
      if (waveNum % 5 === 0 && i === baseCount - 1) {
        types.push('boss');
      } else if (waveNum >= 5 && i % 5 === 4) {
        types.push('tank');
      } else if (waveNum >= 3 && i % 3 === 2) {
        types.push('fast');
      } else {
        types.push('basic');
      }
    }

    return types;
  }

  /**
   * 다음 웨이브 프리뷰 (적 종류별 카운트)
   */
  getNextWavePreview() {
    const types = this._buildWaveComposition(this.currentWave + 1);
    const counts = { basic: 0, fast: 0, tank: 0, boss: 0 };
    for (const t of types) counts[t]++;

    return Object.entries(counts)
      .filter(([, n]) => n > 0)
      .map(([type, count]) => ({ type, count }));
  }

  /**
   * 웨이브 시작
   * @param {boolean} earlyStart 조기시작 여부
   * @param {object} gameState { gold, score }
   * @param {Array} path 경로 데이터
   * @returns {{ bonus: number }} 조기시작 보너스
   */
  startWave(earlyStart, gameState, path) {
    if (this.phase !== 'prep') return { bonus: 0 };

    let bonus = 0;
    if (earlyStart && this.prepCountdown > 0) {
      bonus = Math.floor(this.prepCountdown * 3);
      gameState.gold += bonus;
      gameState.score += bonus;
    }

    this.prepCountdown = 0;
    this.currentWave++;
    this.phase = 'wave';

    // 적 스폰
    const types = this._buildWaveComposition(this.currentWave);
    const hpScale = 1 + (this.currentWave - 1) * 0.3;
    const stageScale = this.getStage().enemyScale || 1.0;
    const hpMultiplier = hpScale * stageScale;

    for (let i = 0; i < types.length; i++) {
      this.enemyManager.spawn(types[i], path, i * 0.6, hpMultiplier);
    }

    return { bonus, isBossWave: this.currentWave % 5 === 0 };
  }

  /**
   * 준비 카운트다운 업데이트
   * @returns {boolean} 자동 시작 여부
   */
  updatePrep(dt, gameState, path) {
    if (this.phase !== 'prep' || this.prepCountdown <= 0) return false;

    this.prepCountdown -= dt;

    if (this.prepCountdown <= 0) {
      this.prepCountdown = 0;
      this.startWave(false, gameState, path);
      return true;
    }
    return false;
  }

  /**
   * 웨이브 종료 체크
   * @returns {{ ended: boolean, leaked: number, stageClear: boolean, bonus: number }}
   */
  checkWaveEnd(gameState) {
    if (this.phase !== 'wave') return { ended: false };

    if (!this.enemyManager.isAllDone()) return { ended: false };

    // 누수된 적 처리
    const leaked = this.enemyManager.removeReached();
    gameState.lives -= leaked;

    // 남은 적 정리
    this.enemyManager.clear();

    if (gameState.lives <= 0) {
      gameState.lives = 0;
      this.phase = 'gameover';
      return { ended: true, leaked, stageClear: false, gameOver: true, bonus: 0 };
    }

    // 스테이지 클리어 체크
    if (this.currentWave >= this.getTotalWaves()) {
      this.phase = 'stageclear';
      return { ended: true, leaked, stageClear: true, gameOver: false, bonus: 0 };
    }

    // 웨이브 클리어 보너스
    const bonus = this.currentWave * 20;
    gameState.gold += bonus;
    gameState.score += bonus;

    // 다음 웨이브 준비
    this.phase = 'prep';
    this.prepCountdown = Math.max(10, 18 - this.currentWave * 0.5);

    return { ended: true, leaked, stageClear: false, gameOver: false, bonus };
  }
}
