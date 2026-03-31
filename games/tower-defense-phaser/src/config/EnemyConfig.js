export const ENEMY_TYPES = {
  basic: {
    name: 'Goblin',
    hp: 30,
    speed: 1.5,
    reward: 10,
    color: 0x66cc66,
    size: 1.0,
    sprite: {
      walking: 'monster6_walking',
      dying: 'monster6_dying',
      frameCount: 18,
      scale: 0.08,
    },
  },
  fast: {
    name: 'Wolf',
    hp: 20,
    speed: 3.0,
    reward: 15,
    color: 0x66ccff,
    size: 1.0,
    sprite: {
      walking: 'monster8_walking',
      dying: 'monster8_dying',
      frameCount: 18,
      scale: 0.07,
    },
  },
  tank: {
    name: 'Golem',
    hp: 100,
    speed: 0.8,
    reward: 25,
    color: 0xcc9966,
    size: 1.0,
    sprite: {
      walking: 'monster10_walking',
      dying: 'monster10_dying',
      frameCount: 18,
      scale: 0.10,
    },
  },
  boss: {
    name: 'Dragon',
    hp: 300,
    speed: 1.0,
    reward: 100,
    color: 0xff6666,
    size: 1.5,
    sprite: {
      walking: 'monster1_fly',
      dying: 'monster1_dying',
      frameCount: 18,
      scale: 0.12,
    },
  },
};

export default ENEMY_TYPES;
