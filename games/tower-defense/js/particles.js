// Particle system
function createParticle(x, y, vx, vy, color, life, size) {
  if (state.particles.length >= 200) return;
  state.particles.push({ x, y, vx, vy, color, life, maxLife: life, size, alive: true });
}

function spawnExplosion(x, y, color, count = 12) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 50 + Math.random() * 90;
    createParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
      color, 0.3 + Math.random() * 0.4, 2 + Math.random() * 3);
  }
}

function spawnKillExplosion(x, y, color) {
  spawnExplosion(x, y, color, 18);
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 70;
    createParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
      '#fff', 0.5 + Math.random() * 0.3, 4 + Math.random() * 4);
  }
}

function spawnBossKillExplosion(x, y) {
  spawnKillExplosion(x, y, '#ff4444');
  spawnKillExplosion(x, y, '#ffaa00');
  spawnExplosion(x, y, '#ffffff', 24);
  state.screenShake = 18;
}

function spawnMuzzleFlash(x, y, color) {
  for (let i = 0; i < 5; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 20 + Math.random() * 40;
    createParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
      color, 0.1 + Math.random() * 0.1, 3 + Math.random() * 3);
  }
}

function spawnSmoke(x, y) {
  const gray = 120 + Math.floor(Math.random() * 60);
  createParticle(x, y,
    (Math.random() - 0.5) * 20, -25 - Math.random() * 25,
    `rgb(${gray},${gray},${gray})`,
    0.5 + Math.random() * 0.5,
    5 + Math.random() * 5);
}

function spawnTrail(x, y, color) {
  createParticle(x, y,
    (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15,
    color, 0.15, 2 + Math.random() * 2);
}

function spawnHitSpark(x, y, color) {
  for (let i = 0; i < 5; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 50;
    createParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
      color, 0.2 + Math.random() * 0.2, 2 + Math.random() * 2);
  }
}

function spawnIceShatter(x, y) {
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 60;
    createParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
      `hsl(${200 + Math.random() * 30},80%,${60 + Math.random() * 30}%)`,
      0.3 + Math.random() * 0.3, 3 + Math.random() * 3);
  }
}

function spawnGoldPopup(x, y, amount) {
  state.floatingTexts.push({
    x, y: y - 10,
    text: `+${amount}g`,
    color: '#ffd700',
    life: 1.2,
    maxLife: 1.2,
    vy: -50,
  });
}

function spawnSoulPopup(x, y) {
  state.floatingTexts.push({
    x, y: y - 10,
    text: '✦ SOUL',
    color: '#cc88ff',
    life: 1.5,
    maxLife: 1.5,
    vy: -40,
  });
}

function updateParticles(dt) {
  for (const p of state.particles) {
    if (!p.alive) continue;
    p.life -= dt;
    if (p.life <= 0) { p.alive = false; continue; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 80 * dt; // gravity
    p.vx *= 0.92;
    p.vy *= 0.98;
  }
  state.particles = state.particles.filter(p => p.alive);

  for (const ft of state.floatingTexts) {
    ft.life -= dt;
    ft.y += ft.vy * dt;
    ft.vy *= 0.96;
  }
  state.floatingTexts = state.floatingTexts.filter(ft => ft.life > 0);

  if (state.screenShake > 0) {
    state.screenShake *= 0.82;
    if (state.screenShake < 0.5) state.screenShake = 0;
  }
}
