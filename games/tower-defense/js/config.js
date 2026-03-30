const CONFIG = {
  GRID_SIZE: 40,
  COLS: 0, // computed on resize
  ROWS: 0,

  TOWER_TYPES: {
    arrow: {
      name: 'Arrow',
      icon: '🏹',
      cost: 50,
      damage: 10,
      range: 3,
      fireRate: 1.0, // shots per second
      projectileSpeed: 8,
      projectileColor: '#ffd700',
      color: '#4a9',
      upgradeCost: (level) => Math.floor(50 * Math.pow(1.5, level)),
      upgradeDamage: (level) => Math.floor(10 * Math.pow(1.3, level)),
    },
    cannon: {
      name: 'Cannon',
      icon: '💣',
      cost: 100,
      damage: 30,
      range: 2.5,
      fireRate: 0.5,
      projectileSpeed: 5,
      projectileColor: '#ff6b6b',
      splash: 1.2, // splash radius in grid units
      color: '#c55',
      upgradeCost: (level) => Math.floor(100 * Math.pow(1.5, level)),
      upgradeDamage: (level) => Math.floor(30 * Math.pow(1.3, level)),
    },
    ice: {
      name: 'Ice',
      icon: '❄️',
      cost: 75,
      damage: 5,
      range: 2.5,
      fireRate: 0.8,
      projectileSpeed: 6,
      projectileColor: '#88ccff',
      slow: 0.5, // speed multiplier
      slowDuration: 2.0,
      color: '#58c',
      upgradeCost: (level) => Math.floor(75 * Math.pow(1.5, level)),
      upgradeDamage: (level) => Math.floor(5 * Math.pow(1.3, level)),
    },
    lightning: {
      name: 'Lightning',
      icon: '⚡',
      cost: 150,
      damage: 20,
      range: 3.5,
      fireRate: 1.2,
      projectileSpeed: 15,
      projectileColor: '#ffee88',
      chain: 2, // number of chain targets
      color: '#cc8',
      upgradeCost: (level) => Math.floor(150 * Math.pow(1.5, level)),
      upgradeDamage: (level) => Math.floor(20 * Math.pow(1.3, level)),
    },
  },

  ENEMY_TYPES: {
    basic: { name: 'Goblin', hp: 30, speed: 1.5, reward: 10, color: '#6c6' },
    fast: { name: 'Wolf', hp: 20, speed: 3.0, reward: 15, color: '#6cf' },
    tank: { name: 'Golem', hp: 100, speed: 0.8, reward: 25, color: '#c96' },
    boss: { name: 'Dragon', hp: 300, speed: 1.0, reward: 100, color: '#f66', size: 1.5 },
  },
};
