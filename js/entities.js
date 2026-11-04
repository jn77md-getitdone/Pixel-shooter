// =====================================================================
//  FIGURER – soldaten, fjender, skud, hjerter og effekter
// =====================================================================

// ---------------------------------------------------------------------
//  FJENDETYPER
//  Vil du lave en ny fjende? Tegn en sprite i sprites.js og tilføj en
//  linje her. 'minLevel' bestemmer, hvornår den dukker op første gang.
//
//  behavior:  'chase'   = går direkte mod soldaten
//             'wobble'  = flyver mod soldaten i bølger
//             'shooter' = holder afstand og skyder
//  splitInto: når den bliver skudt, deler den sig i mindre fjender
// ---------------------------------------------------------------------
const ENEMY_TYPES = {
  slime:    { name: 'SLIM',      sprite: 'slime', hp: 1, speed: 24, score: 10, minLevel: 1, weight: 6, behavior: 'chase',   anim: 4 },
  bee:      { name: 'BI',        sprite: 'bee',   hp: 1, speed: 48, score: 15, minLevel: 2, weight: 4, behavior: 'wobble',  anim: 14 },
  robot:    { name: 'ROBOT',     sprite: 'robot', hp: 4, speed: 16, score: 30, minLevel: 3, weight: 3, behavior: 'chase',   anim: 3 },
  ghost:    { name: 'SPØGELSE',  sprite: 'ghost', hp: 2, speed: 28, score: 40, minLevel: 5, weight: 2, behavior: 'shooter', anim: 3 },
  bigSlime: { name: 'KÆMPESLIM', sprite: 'slime', hp: 6, speed: 13, score: 60, minLevel: 7, weight: 1, behavior: 'chase',   anim: 3, scale: 2, splitInto: 'slime', splitCount: 3 },
};

// Hjælpefunktion: overlapper to kasser?
function overlaps(a, b) {
  return Math.abs(a.x - b.x) * 2 < a.hw * 2 + b.hw * 2 &&
         Math.abs(a.y - b.y) * 2 < a.hh * 2 + b.hh * 2;
}

function drawShadow(ctx, x, y, width) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(Math.round(x - width / 2), Math.round(y), width, 2);
}

// ---------------------------------------------------------------------
//  SOLDATEN
// ---------------------------------------------------------------------
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.hw = 4;          // halv bredde (til kollision)
    this.hh = 6;          // halv højde
    this.speed = 75;      // pixels pr. sekund
    this.dirX = 1;        // den retning der skydes i
    this.dirY = 0;
    this.faceLeft = false;
    this.cooldown = 0;
    this.fireRate = 0.2;  // sekunder mellem skud
    this.hearts = 3;
    this.maxHearts = 5;
    this.invincible = 0;  // kort usårlighed efter at være ramt
    this.walkTime = 0;
    this.moving = false;
  }

  update(dt, game) {
    const dx = Input.dx;
    const dy = Input.dy;
    this.moving = dx !== 0 || dy !== 0;
    if (this.moving) {
      const len = Math.hypot(dx, dy);
      this.x += (dx / len) * this.speed * dt;
      this.y += (dy / len) * this.speed * dt;
      this.dirX = dx;
      this.dirY = dy;
      if (dx !== 0) this.faceLeft = dx < 0;
      this.walkTime += dt;
    }
    // Bliv inden for skærmen
    this.x = Math.max(this.hw + 2, Math.min(game.W - this.hw - 2, this.x));
    this.y = Math.max(this.hh + 14, Math.min(game.H - this.hh - 2, this.y));

    this.cooldown -= dt;
    this.invincible -= dt;
    if (Input.fire && this.cooldown <= 0) {
      this.cooldown = this.fireRate;
      game.shoot(this);
    }
  }

  draw(ctx) {
    drawShadow(ctx, this.x, this.y + 7, 8);
    // Blink når soldaten er usårlig
    if (this.invincible > 0 && Math.floor(this.invincible * 12) % 2 === 0) return;
    const frame = this.moving ? Math.floor(this.walkTime * 8) % 2 : 0;
    drawSprite(ctx, Sprites.soldier, frame, this.x, this.y, this.faceLeft);
  }
}

// ---------------------------------------------------------------------
//  SKUD (både soldatens og fjendernes)
// ---------------------------------------------------------------------
class Bullet {
  constructor(x, y, vx, vy, friendly) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.friendly = friendly;
    this.hw = friendly ? 2 : 2;
    this.hh = friendly ? 2 : 2;
    this.dead = false;
  }

  update(dt, game) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < -10 || this.y < -10 || this.x > game.W + 10 || this.y > game.H + 10) {
      this.dead = true;
    }
  }

  draw(ctx) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    if (this.friendly) {
      ctx.fillStyle = '#ffb000';
      ctx.fillRect(x - 1, y - 1, 3, 3);
      ctx.fillStyle = '#fff6a0';
      ctx.fillRect(x, y, 1, 1);
    } else {
      ctx.fillStyle = '#c04ad8';
      ctx.fillRect(x - 2, y - 1, 4, 2);
      ctx.fillRect(x - 1, y - 2, 2, 4);
      ctx.fillStyle = '#f0b0ff';
      ctx.fillRect(x - 1, y - 1, 1, 1);
    }
  }
}

// ---------------------------------------------------------------------
//  FJENDE
// ---------------------------------------------------------------------
class Enemy {
  constructor(typeKey, x, y, level) {
    const t = ENEMY_TYPES[typeKey];
    this.typeKey = typeKey;
    this.type = t;
    this.sprite = Sprites[t.sprite];
    this.scale = t.scale || 1;
    this.x = x;
    this.y = y;
    this.hw = (this.sprite.w * this.scale) / 2 - 1;
    this.hh = (this.sprite.h * this.scale) / 2 - 1;
    this.hp = t.hp;
    // Fjenderne bliver lidt hurtigere for hvert niveau
    this.speed = t.speed * (1 + (level - 1) * 0.06);
    this.age = Math.random() * 10;
    this.flash = 0;
    this.kx = 0;            // skub-tilbage når den bliver ramt
    this.ky = 0;
    this.faceLeft = false;
    this.shootTimer = 1.5 + Math.random() * 1.5;
    this.circleDir = Math.random() < 0.5 ? 1 : -1;
    this.dead = false;
  }

  update(dt, game) {
    this.age += dt;
    this.flash -= dt;
    const p = game.player;
    const dx = p.x - this.x;
    const dy = p.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;
    let vx = nx * this.speed;
    let vy = ny * this.speed;

    if (this.type.behavior === 'wobble') {
      const w = Math.sin(this.age * 5) * this.speed * 0.9;
      vx += -ny * w;
      vy += nx * w;
    } else if (this.type.behavior === 'shooter') {
      if (dist < 75) {
        // Cirkl rundt om soldaten og hold afstand
        vx = -ny * this.speed * this.circleDir;
        vy = nx * this.speed * this.circleDir;
        if (dist < 55) { vx -= nx * this.speed; vy -= ny * this.speed; }
      }
      this.shootTimer -= dt;
      const onScreen = this.x > 0 && this.x < game.W && this.y > 0 && this.y < game.H;
      if (this.shootTimer <= 0 && onScreen) {
        this.shootTimer = 2.4;
        game.enemyShoot(this, nx, ny);
      }
    }

    this.x += (vx + this.kx) * dt;
    this.y += (vy + this.ky) * dt;
    const damp = Math.pow(0.002, dt);
    this.kx *= damp;
    this.ky *= damp;
    if (Math.abs(vx) > 1) this.faceLeft = vx < 0;
  }

  // Returnerer true hvis fjenden er besejret
  hit(pushX, pushY) {
    this.hp -= 1;
    this.flash = 0.08;
    const push = this.scale > 1 ? 40 : 110;
    this.kx += pushX * push;
    this.ky += pushY * push;
    return this.hp <= 0;
  }

  draw(ctx) {
    const h = this.sprite.h * this.scale;
    drawShadow(ctx, this.x, this.y + h / 2 - 1, this.sprite.w * this.scale - 2);
    let y = this.y;
    if (this.type.behavior === 'wobble' || this.type.behavior === 'shooter') {
      y += Math.sin(this.age * 4) * 2 - 2; // svæver lidt op og ned
    }
    const frame = Math.floor(this.age * this.type.anim) % 2;
    drawSprite(ctx, this.sprite, frame, this.x, y, this.faceLeft, this.flash > 0, this.scale);
  }
}

// ---------------------------------------------------------------------
//  HJERTE man kan samle op
// ---------------------------------------------------------------------
class Pickup {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.hw = 4;
    this.hh = 4;
    this.life = 8;
    this.dead = false;
  }
  update(dt) {
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }
  draw(ctx) {
    // Blink de sidste 2 sekunder
    if (this.life < 2 && Math.floor(this.life * 8) % 2 === 0) return;
    const bob = Math.sin(this.life * 6) * 1.5;
    drawSprite(ctx, Sprites.heart, 0, this.x, this.y + bob);
  }
}

// ---------------------------------------------------------------------
//  EFFEKTER – små stjerner/pust og flydende point-tal
// ---------------------------------------------------------------------
class Particle {
  constructor(x, y, color) {
    const a = Math.random() * Math.PI * 2;
    const s = 20 + Math.random() * 50;
    this.x = x;
    this.y = y;
    this.vx = Math.cos(a) * s;
    this.vy = Math.sin(a) * s;
    this.life = 0.3 + Math.random() * 0.35;
    this.color = color;
    this.size = Math.random() < 0.3 ? 2 : 1;
    this.dead = false;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= Math.pow(0.05, dt);
    this.vy *= Math.pow(0.05, dt);
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }
  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(Math.round(this.x), Math.round(this.y), this.size, this.size);
  }
}

class FloatText {
  constructor(x, y, text, color) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color || '#ffe066';
    this.life = 0.8;
    this.dead = false;
  }
  update(dt) {
    this.y -= 18 * dt;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }
  draw(ctx) {
    drawPixelText(ctx, this.text, this.x, this.y, this.color);
  }
}
