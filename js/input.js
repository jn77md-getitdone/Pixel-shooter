// =====================================================================
//  STYRING – tastatur (computer) og touch-knapper (iPad)
// ---------------------------------------------------------------------
//  Resten af spillet læser bare Input.dx, Input.dy (-1, 0 eller 1)
//  og Input.fire (true/false).
// =====================================================================

const Input = {
  keys: new Set(),
  touchDx: 0,
  touchDy: 0,
  touchFire: false,

  get dx() {
    let d = this.touchDx;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) d -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) d += 1;
    return Math.max(-1, Math.min(1, d));
  },
  get dy() {
    let d = this.touchDy;
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) d -= 1;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) d += 1;
    return Math.max(-1, Math.min(1, d));
  },
  get fire() {
    return this.touchFire || this.keys.has('Space') || this.keys.has('KeyJ');
  },

  reset() {
    this.keys.clear();
    this.touchDx = 0;
    this.touchDy = 0;
    this.touchFire = false;
    document.querySelectorAll('.arrow.active, #fire-btn.active')
      .forEach(el => el.classList.remove('active'));
  },
};

function initInput() {
  // ---------- Tastatur ----------
  const gameKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'];
  window.addEventListener('keydown', e => {
    if (gameKeys.includes(e.code)) e.preventDefault();
    Input.keys.add(e.code);
  });
  window.addEventListener('keyup', e => Input.keys.delete(e.code));
  window.addEventListener('blur', () => Input.reset());

  // ---------- Pileknapper (d-pad) ----------
  // Hele krydset er ét felt: vi ser på, hvor fingeren er i forhold til midten.
  // Så kan man glide fingeren rundt og også gå på skrå.
  const dpad = document.getElementById('dpad');
  const arrows = {
    up: dpad.querySelector('.up'),
    down: dpad.querySelector('.down'),
    left: dpad.querySelector('.left'),
    right: dpad.querySelector('.right'),
  };
  let dpadPointer = null;

  function setDpad(dx, dy) {
    Input.touchDx = dx;
    Input.touchDy = dy;
    arrows.left.classList.toggle('active', dx < 0);
    arrows.right.classList.toggle('active', dx > 0);
    arrows.up.classList.toggle('active', dy < 0);
    arrows.down.classList.toggle('active', dy > 0);
  }

  function updateDpad(e) {
    const r = dpad.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    if (Math.hypot(x, y) < 0.2) { setDpad(0, 0); return; } // død zone i midten
    // Del cirklen op i 8 retninger
    const sector = Math.round(Math.atan2(y, x) / (Math.PI / 4));
    const angle = sector * Math.PI / 4;
    setDpad(Math.round(Math.cos(angle)), Math.round(Math.sin(angle)));
  }

  function releaseDpad(e) {
    if (e.pointerId !== dpadPointer) return;
    dpadPointer = null;
    setDpad(0, 0);
  }

  dpad.addEventListener('pointerdown', e => {
    e.preventDefault();
    dpadPointer = e.pointerId;
    dpad.setPointerCapture(e.pointerId);
    updateDpad(e);
  });
  dpad.addEventListener('pointermove', e => {
    if (e.pointerId === dpadPointer) updateDpad(e);
  });
  dpad.addEventListener('pointerup', releaseDpad);
  dpad.addEventListener('pointercancel', releaseDpad);
  dpad.addEventListener('lostpointercapture', releaseDpad);

  // ---------- Skydeknap ----------
  const fireBtn = document.getElementById('fire-btn');
  let firePointer = null;
  function releaseFire(e) {
    if (e.pointerId !== firePointer) return;
    firePointer = null;
    Input.touchFire = false;
    fireBtn.classList.remove('active');
  }
  fireBtn.addEventListener('pointerdown', e => {
    e.preventDefault();
    firePointer = e.pointerId;
    fireBtn.setPointerCapture(e.pointerId);
    Input.touchFire = true;
    fireBtn.classList.add('active');
  });
  fireBtn.addEventListener('pointerup', releaseFire);
  fireBtn.addEventListener('pointercancel', releaseFire);
  fireBtn.addEventListener('lostpointercapture', releaseFire);

  // Stop iPad i at zoome, markere tekst eller vise forstørrelsesglas
  const controls = document.getElementById('controls');
  controls.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('contextmenu', e => e.preventDefault());
}
