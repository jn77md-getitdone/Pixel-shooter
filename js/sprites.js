// =====================================================================
//  SPRITES – al pixelgrafik i spillet
// ---------------------------------------------------------------------
//  Hver figur er tegnet som tekstlinjer. Hvert tegn er én pixel.
//  '.' betyder gennemsigtig. Bogstaverne slås op i figurens palette.
//  Vil du ændre en figur, så ret bare bogstaverne herunder!
// =====================================================================

// Overkroppen på soldaten (fælles for begge gå-billeder)
const SOLDIER_TOP = [
  '...GGGGG....',
  '..GHHGGGG...',
  '.GGGGGGGGGG.',
  '..SSSSSES...',
  '..SSSSSSS...',
  '...SSSSS....',
  '..gggggdd...',
  '.gggggggSmMM',
  '.ggggggggm..',
  '..ggggggg...',
];

const SPRITE_DATA = {
  // Hovedpersonen: grøn hjelm, grøn trøje og bukser, sorte støvler, lille gevær
  soldier: {
    palette: {
      G: '#2f6e2c', H: '#4f9e45', S: '#f2c79a', E: '#1a1a1a',
      g: '#4c9a3e', d: '#3a7a31', D: '#2b5a23', K: '#141414',
      M: '#8a8f99', m: '#4a4d55',
    },
    frames: [
      SOLDIER_TOP.concat([
        '..DDDDDDD...',
        '..DDD.DDD...',
        '..DD...DD...',
        '..KK...KK...',
        '..KKK..KKK..',
      ]),
      SOLDIER_TOP.concat([
        '..DDDDDDD...',
        '...DD.DD....',
        '...DD.DD....',
        '...KK.KK....',
        '...KKK.KKK..',
      ]),
    ],
  },

  // Fjende 1: Slim – langsom og nem
  slime: {
    palette: { P: '#9b4fd1', p: '#c487f0', W: '#ffffff', E: '#1a1a1a' },
    frames: [
      [
        '...pppp...',
        '..pPPPPp..',
        '.pPPPPPPp.',
        '.PWEPPWEP.',
        'PPWEPPWEPP',
        'PPPPPPPPPP',
        'PPPPPPPPPP',
        '.PP.PP.PP.',
      ],
      [
        '..........',
        '...pppp...',
        '.pPPPPPPp.',
        'pPWEPPWEPp',
        'PPWEPPWEPP',
        'PPPPPPPPPP',
        'PPPPPPPPPP',
        'PPPPPPPPPP',
      ],
    ],
  },

  // Fjende 2: Bi – hurtig og flyver i bølger
  bee: {
    palette: { Y: '#ffd23f', K: '#2a2a2a', w: '#d8f3ff', E: '#000000' },
    frames: [
      [
        '..ww..ww..',
        '.wwww.www.',
        '..ww..ww..',
        '.YKYKYYYY.',
        'YYKYKYYEY.',
        'KYKYKYYYYY',
        '.YKYKYYYY.',
        '..........',
      ],
      [
        '..........',
        '..........',
        '..ww..ww..',
        '.YKYKYYYY.',
        'YYKYKYYEY.',
        'KYKYKYYYYY',
        '.YKYKYYYY.',
        '.www..www.',
      ],
    ],
  },

  // Fjende 3: Robot – langsom men tåler mange skud
  robot: {
    palette: { R: '#9aa3ad', r: '#5c636b', L: '#ff4d4d', l: '#7a2222', C: '#4fe3ff' },
    frames: [
      [
        '.....LL.....',
        '.....rr.....',
        '..RRRRRRRR..',
        '..RCCRRCCR..',
        '..RCCRRCCR..',
        '..RRRRRRRR..',
        '..RrrrrrrR..',
        '...RRRRRR...',
        '.rRRRRRRRRr.',
        '.r.RRRRRR.r.',
        '...rr..rr...',
        '..rrr..rrr..',
      ],
      [
        '.....ll.....',
        '.....rr.....',
        '..RRRRRRRR..',
        '..RCCRRCCR..',
        '..RCCRRCCR..',
        '..RRRRRRRR..',
        '..RrrrrrrR..',
        '...RRRRRR...',
        '.rRRRRRRRRr.',
        '.r.RRRRRR.r.',
        '....rr.rr...',
        '...rrr.rrr..',
      ],
    ],
  },

  // Fjende 4: Spøgelse – holder afstand og spytter slimkugler
  ghost: {
    palette: { W: '#eef4ff', w: '#b9c9e8', E: '#2a2a55', O: '#7a4a8a' },
    frames: [
      [
        '...wwww...',
        '..wWWWWw..',
        '.wWWWWWWw.',
        '.WWEWWEWW.',
        '.WWEWWEWW.',
        '.WWWWWWWW.',
        '.WWWOOWWW.',
        '.WWWWWWWW.',
        '.WWWWWWWW.',
        '.W.WW.WW.W',
      ],
      [
        '...wwww...',
        '..wWWWWw..',
        '.wWWWWWWw.',
        '.WWEWWEWW.',
        '.WWEWWEWW.',
        '.WWWWWWWW.',
        '.WWWOOWWW.',
        '.WWWWWWWW.',
        '.WWWWWWWW.',
        'W.WW.WW.W.',
      ],
    ],
  },

  // Hjerte – bruges både til liv-visning og som ting man kan samle op
  heart: {
    palette: { H: '#ff4d6d', h: '#ffb3c1' },
    frames: [[
      '.HH.HH.',
      'HhHHHHH',
      'HHHHHHH',
      '.HHHHH.',
      '..HHH..',
      '...H...',
    ]],
  },

  // Tomt hjerte (mistet liv)
  heartEmpty: {
    palette: { H: '#3a2a2e' },
    frames: [[
      '.HH.HH.',
      'HHHHHHH',
      'HHHHHHH',
      '.HHHHH.',
      '..HHH..',
      '...H...',
    ]],
  },
};

// Laver en tekst-figur om til et lille lærred (canvas), som er hurtigt at tegne.
// Hvis 'solidColor' er sat, bliver alle pixels den farve (bruges til hvidt blink).
function buildSpriteCanvas(rows, palette, solidColor) {
  const h = rows.length;
  const w = rows[0].length;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const cctx = c.getContext('2d');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (ch === '.' || ch === undefined) continue;
      cctx.fillStyle = solidColor || palette[ch] || '#ff00ff';
      cctx.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

// Sprites.navn = { frames: [canvas...], white: [canvas...], w, h }
const Sprites = {};
for (const name in SPRITE_DATA) {
  const d = SPRITE_DATA[name];
  Sprites[name] = {
    frames: d.frames.map(rows => buildSpriteCanvas(rows, d.palette)),
    white: d.frames.map(rows => buildSpriteCanvas(rows, d.palette, '#ffffff')),
    w: d.frames[0][0].length,
    h: d.frames[0].length,
  };
}

// Tegner en sprite centreret omkring (x, y).
// flip = spejlvend vandret, white = tegn helt hvid (når fjenden bliver ramt)
function drawSprite(ctx, sprite, frame, x, y, flip, white, scale) {
  scale = scale || 1;
  const list = white ? sprite.white : sprite.frames;
  const img = list[frame % list.length];
  const w = sprite.w * scale;
  const h = sprite.h * scale;
  const px = Math.round(x - w / 2);
  const py = Math.round(y - h / 2);
  if (flip) {
    ctx.save();
    ctx.translate(px + w, py);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, 0, w, h);
    ctx.restore();
  } else {
    ctx.drawImage(img, px, py, w, h);
  }
}

// ---------------------------------------------------------------------
//  Lille pixel-skrift (3x5) til tal, fx "+10" når en fjende forsvinder
// ---------------------------------------------------------------------
const PIXEL_FONT = {
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  '+': ['000', '010', '111', '010', '000'],
};

function drawPixelText(ctx, text, x, y, color) {
  const width = text.length * 4 - 1;
  let cx = Math.round(x - width / 2);
  const cy = Math.round(y);
  for (const ch of text) {
    const glyph = PIXEL_FONT[ch];
    if (glyph) {
      for (let gy = 0; gy < 5; gy++) {
        for (let gx = 0; gx < 3; gx++) {
          if (glyph[gy][gx] === '1') {
            ctx.fillStyle = '#000';
            ctx.fillRect(cx + gx + 1, cy + gy + 1, 1, 1);
            ctx.fillStyle = color;
            ctx.fillRect(cx + gx, cy + gy, 1, 1);
          }
        }
      }
    }
    cx += 4;
  }
}
