// =====================================================================
//  SPILLET – skærme, sværhedsgrad, kollisioner og tegning
// =====================================================================

// ---------- Indstillinger (prøv at ændre dem!) ----------
const SETTINGS = {
  shortSide: 200,        // så mange "spil-pixels" er der på skærmens korte led
  shortSidePhone: 150,   // ... og på små skærme (telefon), så figurerne bliver større
  levelDuration: 20,     // sekunder pr. niveau
  bulletSpeed: 210,
  enemyBulletSpeed: 65,
  maxEnemies: 45,
  heartDropChance: 0.07, // chance for at en fjende efterlader et hjerte
};

const canvas = document.getElementById('screen');
const ctx = canvas.getContext('2d');

const ui = {
  hud: document.getElementById('hud'),
  score: document.getElementById('hud-score'),
  level: document.getElementById('hud-level'),
  banner: document.getElementById('banner'),
  controls: document.getElementById('controls'),
  startScreen: document.getElementById('start-screen'),
  overScreen: document.getElementById('gameover-screen'),
  startBtn: document.getElementById('start-btn'),
  restartBtn: document.getElementById('restart-btn'),
  muteBtn: document.getElementById('mute-btn'),
  startBest: document.getElementById('start-best'),
  finalScore: document.getElementById('final-score'),
  bestScore: document.getElementById('best-score'),
  newRecord: document.getElementById('new-record'),
};

const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
if (isTouch) document.body.classList.add('touch');

// Gem/hent små ting i browseren (rekord og lyd). Kan fejle i privat tilstand.
const storage = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* ignorer */ }
  },
};

// ---------------------------------------------------------------------
//  Spillets tilstand
// ---------------------------------------------------------------------
const game = {
  state: 'start',        // 'start' | 'playing' | 'gameover'
  W: 320,
  H: 200,
  safeLeft: 0,
  safeTop: 0,
  time: 0,
  level: 1,
  levelTimer: 0,
  score: 0,
  best: parseInt(storage.get('pixelSoldierBest', '0'), 10) || 0,
  player: null,
  enemies: [],
  bullets: [],
  enemyBullets: [],
  pickups: [],
  particles: [],
  texts: [],
  spawnTimer: 0,
  shake: 0,
  seenTypes: new Set(),

  shoot(p) {
    const len = Math.hypot(p.dirX, p.dirY) || 1;
    const vx = (p.dirX / len) * SETTINGS.bulletSpeed;
    const vy = (p.dirY / len) * SETTINGS.bulletSpeed;
    this.bullets.push(new Bullet(p.x + p.dirX * 7, p.y + 1 + p.dirY * 7, vx, vy, true));
    Sound.shoot();
  },

  enemyShoot(e, nx, ny) {
    const s = SETTINGS.enemyBulletSpeed * (1 + (this.level - 1) * 0.03);
    this.enemyBullets.push(new Bullet(e.x, e.y, nx * s, ny * s, false));
    Sound.enemyShot();
  },

  burst(x, y, colors, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, colors[i % colors.length]));
    }
  },
};

// ---------------------------------------------------------------------
//  Skærmstørrelse – spillet tilpasser sig både computer og iPad
// ---------------------------------------------------------------------
let background = null;

function resize() {
  // Telefon/iPad på højkant: knapperne får deres eget felt under spillet
  document.body.classList.toggle('portrait', isTouch && window.innerHeight > window.innerWidth);

  // Lærredet fylder det område, CSS giver det
  const vw = canvas.clientWidth || window.innerWidth;
  const vh = canvas.clientHeight || window.innerHeight;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  const scale = Math.min(vw, vh) / (small ? SETTINGS.shortSidePhone : SETTINGS.shortSide);
  game.W = Math.round(vw / scale);
  game.H = Math.round(vh / scale);

  // Plads til notch / afrundede hjørner (omregnet til spil-pixels)
  const probe = getComputedStyle(document.getElementById('safe-probe'));
  game.safeLeft = (parseFloat(probe.paddingLeft) || 0) / scale;
  game.safeTop = (parseFloat(probe.paddingTop) || 0) / scale;
  canvas.width = game.W;
  canvas.height = game.H;
  ctx.imageSmoothingEnabled = false;
  background = makeBackground(game.W, game.H);
  if (game.player) {
    game.player.x = Math.min(game.player.x, game.W - 6);
    game.player.y = Math.min(game.player.y, game.H - 8);
  }
}

// Græsbaggrund med små blomster og sten. Tegnes én gang og genbruges.
function makeBackground(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const b = c.getContext('2d');
  b.fillStyle = '#5a9e3c';
  b.fillRect(0, 0, w, h);

  let seed = 12345;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // Græsstrå
  for (let i = 0; i < (w * h) / 18; i++) {
    b.fillStyle = rnd() < 0.5 ? '#4f8f34' : '#68ad48';
    b.fillRect(Math.floor(rnd() * w), Math.floor(rnd() * h), 1, rnd() < 0.3 ? 2 : 1);
  }
  // Blomster
  const flowerColors = ['#ffffff', '#ffe066', '#ff8fb1'];
  for (let i = 0; i < (w * h) / 900; i++) {
    const x = Math.floor(rnd() * w);
    const y = Math.floor(rnd() * h);
    b.fillStyle = flowerColors[Math.floor(rnd() * flowerColors.length)];
    b.fillRect(x - 1, y, 1, 1);
    b.fillRect(x + 1, y, 1, 1);
    b.fillRect(x, y - 1, 1, 1);
    b.fillRect(x, y + 1, 1, 1);
    b.fillStyle = '#f5a623';
    b.fillRect(x, y, 1, 1);
  }
  // Små sten
  for (let i = 0; i < (w * h) / 2500; i++) {
    const x = Math.floor(rnd() * w);
    const y = Math.floor(rnd() * h);
    b.fillStyle = '#8c8c84';
    b.fillRect(x, y, 3, 2);
    b.fillStyle = '#b5b5ab';
    b.fillRect(x, y, 2, 1);
  }
  return c;
}

// ---------------------------------------------------------------------
//  Start / slut
// ---------------------------------------------------------------------
function startGame() {
  Sound.unlock();
  Input.reset();
  game.state = 'playing';
  game.time = 0;
  game.level = 1;
  game.levelTimer = 0;
  game.score = 0;
  game.player = new Player(game.W / 2, game.H / 2);
  game.enemies = [];
  game.bullets = [];
  game.enemyBullets = [];
  game.pickups = [];
  game.particles = [];
  game.texts = [];
  game.spawnTimer = 1.2;
  game.shake = 0;
  game.seenTypes = new Set(['slime']);

  ui.startScreen.classList.add('hidden');
  ui.overScreen.classList.add('hidden');
  ui.hud.classList.remove('hidden');
  if (isTouch) ui.controls.classList.remove('hidden');
  updateHud();
  showBanner('NIVEAU 1');
}

function gameOver() {
  game.state = 'gameover';
  Input.reset();
  Sound.gameOver();
  const p = game.player;
  game.burst(p.x, p.y, ['#ffffff', '#4c9a3e', '#ffe066'], 24);

  const isRecord = game.score > game.best;
  if (isRecord) {
    game.best = game.score;
    storage.set('pixelSoldierBest', String(game.best));
  }
  ui.controls.classList.add('hidden');

  // Vent lidt, så man kan nå at se hvad der skete
  setTimeout(() => {
    ui.finalScore.textContent = game.score;
    ui.bestScore.textContent = game.best;
    ui.startBest.textContent = game.best;
    ui.newRecord.classList.toggle('hidden', !isRecord);
    ui.hud.classList.add('hidden');
    ui.overScreen.classList.remove('hidden');
    // Undgå at man kommer til at starte igen med det samme, hvis man stadig trykker
    ui.restartBtn.disabled = true;
    setTimeout(() => { ui.restartBtn.disabled = false; }, 700);
  }, 1100);
}

function updateHud() {
  ui.score.textContent = game.score;
  ui.level.textContent = 'NIVEAU ' + game.level;
}

function showBanner(text) {
  ui.banner.textContent = text;
  ui.banner.classList.remove('show');
  void ui.banner.offsetWidth; // genstart animationen
  ui.banner.classList.add('show');
}

// ---------------------------------------------------------------------
//  Fjender dukker op
// ---------------------------------------------------------------------
function spawnInterval() {
  // Starter med en fjende hvert 1,6 sekund og bliver hurtigere
  return Math.max(0.32, 1.6 - (game.level - 1) * 0.13);
}

function pickEnemyType() {
  const available = Object.keys(ENEMY_TYPES).filter(k => game.level >= ENEMY_TYPES[k].minLevel);
  let total = 0;
  for (const k of available) total += ENEMY_TYPES[k].weight;
  let r = Math.random() * total;
  for (const k of available) {
    r -= ENEMY_TYPES[k].weight;
    if (r <= 0) return k;
  }
  return available[0];
}

function spawnEnemy(typeKey) {
  // Fjender kommer ind fra en tilfældig kant
  const side = Math.floor(Math.random() * 4);
  const m = 14;
  let x, y;
  if (side === 0) { x = Math.random() * game.W; y = -m; }
  else if (side === 1) { x = game.W + m; y = Math.random() * game.H; }
  else if (side === 2) { x = Math.random() * game.W; y = game.H + m; }
  else { x = -m; y = Math.random() * game.H; }
  game.enemies.push(new Enemy(typeKey, x, y, game.level));
}

function levelUp() {
  game.level += 1;
  game.levelTimer = 0;
  Sound.levelUp();
  updateHud();
  // Er der kommet en ny slags fjende?
  const newTypes = Object.keys(ENEMY_TYPES).filter(
    k => ENEMY_TYPES[k].minLevel === game.level && !game.seenTypes.has(k)
  );
  newTypes.forEach(k => game.seenTypes.add(k));
  if (newTypes.length > 0) {
    showBanner('NY FJENDE: ' + ENEMY_TYPES[newTypes[0]].name + '!');
    spawnEnemy(newTypes[0]); // vis den nye fjende med det samme
  } else {
    showBanner('NIVEAU ' + game.level);
  }
}

// ---------------------------------------------------------------------
//  Opdatering – køres mange gange i sekundet
// ---------------------------------------------------------------------
function hurtPlayer(pushFrom) {
  const p = game.player;
  if (p.invincible > 0) return;
  p.hearts -= 1;
  p.invincible = 1.5;
  game.shake = 0.25;
  Sound.hurt();
  game.burst(p.x, p.y, ['#ffffff', '#ff4d6d'], 10);
  if (pushFrom) {
    // Skub fjenden væk, så den ikke rammer igen med det samme
    const dx = pushFrom.x - p.x;
    const dy = pushFrom.y - p.y;
    const d = Math.hypot(dx, dy) || 1;
    pushFrom.kx += (dx / d) * 160;
    pushFrom.ky += (dy / d) * 160;
  }
  if (p.hearts <= 0) gameOver();
}

function defeatEnemy(e) {
  e.dead = true;
  Sound.pop();
  game.score += e.type.score;
  updateHud();
  game.burst(e.x, e.y, ['#ffffff', '#ffe066', '#bdf0ff'], 10);
  game.texts.push(new FloatText(e.x, e.y - 8, '+' + e.type.score));

  if (e.type.splitInto) {
    for (let i = 0; i < e.type.splitCount; i++) {
      const child = new Enemy(e.type.splitInto, e.x + (Math.random() - 0.5) * 12, e.y + (Math.random() - 0.5) * 12, game.level);
      const a = (i / e.type.splitCount) * Math.PI * 2;
      child.kx = Math.cos(a) * 120;
      child.ky = Math.sin(a) * 120;
      game.enemies.push(child);
    }
  }

  const p = game.player;
  if (p.hearts < p.maxHearts && Math.random() < SETTINGS.heartDropChance) {
    game.pickups.push(new Pickup(e.x, e.y));
  }
}

function update(dt) {
  game.time += dt;
  game.shake = Math.max(0, game.shake - dt);

  // Effekter fortsætter også efter game over
  game.particles.forEach(o => o.update(dt));
  game.texts.forEach(o => o.update(dt));
  game.particles = game.particles.filter(o => !o.dead);
  game.texts = game.texts.filter(o => !o.dead);
  if (game.state !== 'playing') return;

  // Niveau
  game.levelTimer += dt;
  if (game.levelTimer >= SETTINGS.levelDuration) levelUp();

  const p = game.player;
  p.update(dt, game);

  // Nye fjender
  game.spawnTimer -= dt;
  if (game.spawnTimer <= 0) {
    game.spawnTimer = spawnInterval();
    if (game.enemies.length < SETTINGS.maxEnemies) {
      spawnEnemy(pickEnemyType());
      // Senere kommer der ofte to ad gangen
      if (Math.random() < Math.min(0.5, (game.level - 1) * 0.06)) spawnEnemy(pickEnemyType());
    }
  }

  game.enemies.forEach(e => e.update(dt, game));
  game.bullets.forEach(b => b.update(dt, game));
  game.enemyBullets.forEach(b => b.update(dt, game));
  game.pickups.forEach(o => o.update(dt));

  // Soldatens skud rammer fjender
  for (const b of game.bullets) {
    if (b.dead) continue;
    for (const e of game.enemies) {
      if (e.dead || !overlaps(b, e)) continue;
      b.dead = true;
      const len = Math.hypot(b.vx, b.vy) || 1;
      if (e.hit(b.vx / len, b.vy / len)) defeatEnemy(e);
      else Sound.hit();
      break;
    }
  }

  // Fjender og fjendeskud rammer soldaten
  for (const e of game.enemies) {
    if (!e.dead && overlaps(p, e)) hurtPlayer(e);
  }
  for (const b of game.enemyBullets) {
    if (!b.dead && overlaps(p, b)) {
      b.dead = true;
      hurtPlayer(null);
    }
  }

  // Saml hjerter op
  for (const h of game.pickups) {
    if (!h.dead && overlaps(p, h)) {
      h.dead = true;
      p.hearts = Math.min(p.maxHearts, p.hearts + 1);
      Sound.pickup();
      game.texts.push(new FloatText(h.x, h.y - 8, '+1', '#ff8fb1'));
    }
  }

  // Ryd op
  game.enemies = game.enemies.filter(o => !o.dead);
  game.bullets = game.bullets.filter(o => !o.dead);
  game.enemyBullets = game.enemyBullets.filter(o => !o.dead);
  game.pickups = game.pickups.filter(o => !o.dead);
}

// ---------------------------------------------------------------------
//  Tegning
// ---------------------------------------------------------------------
function render() {
  ctx.save();
  if (game.shake > 0) {
    ctx.translate(Math.round((Math.random() - 0.5) * 4), Math.round((Math.random() - 0.5) * 4));
  }
  ctx.drawImage(background, 0, 0);

  if (game.state !== 'start') {
    game.pickups.forEach(o => o.draw(ctx));

    // Tegn figurer sorteret efter højde, så de der står længst nede er forrest
    const actors = game.enemies.slice();
    if (game.state === 'playing') actors.push(game.player);
    actors.sort((a, b) => a.y - b.y);
    actors.forEach(o => o.draw(ctx));

    game.bullets.forEach(o => o.draw(ctx));
    game.enemyBullets.forEach(o => o.draw(ctx));
    game.particles.forEach(o => o.draw(ctx));
    game.texts.forEach(o => o.draw(ctx));
  }
  ctx.restore();

  // Liv (hjerter) øverst til venstre
  if (game.state === 'playing') {
    const p = game.player;
    for (let i = 0; i < p.maxHearts; i++) {
      const spr = i < p.hearts ? Sprites.heart : Sprites.heartEmpty;
      if (i >= p.hearts && i >= 3) continue; // vis kun ekstra-hjerter hvis man har dem
      drawSprite(ctx, spr, 0, Math.round(game.safeLeft) + 8 + i * 9, Math.round(game.safeTop) + 8);
    }
  }
}

// ---------------------------------------------------------------------
//  Hovedløkken
// ---------------------------------------------------------------------
let lastTime = performance.now();
function loop(now) {
  // Begræns tidsskridtet, så intet hopper hvis fanen har været i baggrunden
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------
//  Opsætning
// ---------------------------------------------------------------------
function setMuted(m) {
  Sound.muted = m;
  ui.muteBtn.classList.toggle('muted', m);
  storage.set('pixelSoldierMuted', m ? '1' : '0');
}

function init() {
  initInput();
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);

  // Lille soldat på startskærmen
  const tc = document.getElementById('title-soldier');
  tc.getContext('2d').drawImage(Sprites.soldier.frames[0], 0, 0);

  ui.startBest.textContent = game.best;
  ui.startBtn.addEventListener('click', startGame);
  ui.restartBtn.addEventListener('click', startGame);
  ui.muteBtn.addEventListener('click', () => { Sound.unlock(); setMuted(!Sound.muted); ui.muteBtn.blur(); });
  setMuted(storage.get('pixelSoldierMuted', '0') === '1');

  // Tryk Enter/mellemrum for at starte på computer
  window.addEventListener('keydown', e => {
    if ((e.code === 'Enter' || e.code === 'Space') && game.state !== 'playing') {
      if (game.state === 'start' || (!ui.overScreen.classList.contains('hidden') && !ui.restartBtn.disabled)) {
        e.preventDefault();
        startGame();
      }
    }
  });

  requestAnimationFrame(loop);
}

init();
