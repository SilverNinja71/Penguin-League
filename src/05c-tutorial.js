// =====================================================================
//  FIRST MINUTE — control hints that follow the player's device (keyboard,
//  gamepad or touch), key names for their keyboard layout, and the short
//  first-time tutorial (skippable) that leads into a Quick Play match
// =====================================================================

// ---------- which controls the player is using right now (hints follow it)
let inputDev = document.body.classList.contains('touch') ? 'touch' : 'kb';
const DEV_HOOKS = [];
function setDev(d) { if (d === inputDev) return; inputDev = d; for (const f of DEV_HOOKS) f(); }
addEventListener('keydown', () => setDev('kb'), true);
addEventListener('pointerdown', (e) => setDev(e.pointerType === 'touch' && document.body.classList.contains('touch') ? 'touch' : 'kb'), true);

// ---------- key names: the game reads physical keys (W is where W sits on a QWERTY board), so on AZERTY the
// same keys are Z Q S D. Chrome and Edge can tell us what is printed on them; elsewhere QWERTY names show.
const KEY_LABEL = { KeyW: 'W', KeyA: 'A', KeyS: 'S', KeyD: 'D', KeyF: 'F', KeyX: 'X', KeyC: 'C', KeyP: 'P' };
const kl = (code) => KEY_LABEL[code] || code;
try {
  if (navigator.keyboard && navigator.keyboard.getLayoutMap) {
    navigator.keyboard.getLayoutMap().then((m) => {
      for (const c in KEY_LABEL) { const v = m.get(c); if (v && v.length === 1) KEY_LABEL[c] = v.toUpperCase(); }
      for (const f of DEV_HOOKS) f();
    }).catch(() => {});
  }
} catch (e) { /* not allowed in this frame */ }

// ---------- the in-match control card (bottom left, first seconds of a match)
function hintHTML(dev) {
  if (dev === 'pad') return '<kbd>RT</kbd> <kbd>LT</kbd> drive &nbsp;<kbd>Left stick</kbd> steer &nbsp;<kbd>A</kbd> jump/dive &nbsp;<kbd>B</kbd> boost<br><kbd>RB</kbd> hold for a charged shot &nbsp;<kbd>X</kbd> powerslide &nbsp;<kbd>Y</kbd> ball cam &nbsp;<kbd>Start</kbd> pause';
  if (dev === 'touch') return '<b>Stick</b> drive and steer &nbsp;<b>JUMP</b> jump/dive &nbsp;<b>BOOST</b> jetpack<br><b>SHOT</b> hold for a charged shot &nbsp;<b>SLIDE</b> powerslide';
  return `<kbd>${kl('KeyW')} ${kl('KeyA')} ${kl('KeyS')} ${kl('KeyD')}</kbd> drive &nbsp;<kbd>Space</kbd> jump/dive &nbsp;<kbd>Shift</kbd> boost<br><kbd>${kl('KeyF')}</kbd> hold for a charged shot &nbsp;<kbd>${kl('KeyX')}</kbd> powerslide &nbsp;<kbd>${kl('KeyC')}</kbd> ball cam &nbsp;<kbd>${kl('KeyP')}</kbd> pause`;
}
function renderHint() { $('#hint').innerHTML = hintHTML(inputDev); }
DEV_HOOKS.push(renderHint);
renderHint();

// ---------- first-time tutorial: five quick goals in an empty rink, then a real match
const Tut = (() => {
  const box = $('#tut');
  const SCORE = 'Knock the ball into the <b class="o">orange goal</b>';
  const STEPS = [
    { t: 'Slide forward', kb: () => `Hold <kbd>${kl('KeyW')}</kbd>`, pad: 'Hold <kbd>RT</kbd>', touch: 'Push the stick up', done: (s) => s.dist > 12 },
    { t: 'Jetpack boost', kb: 'Hold <kbd>Shift</kbd> or the left mouse button', pad: 'Hold <kbd>B</kbd>', touch: 'Hold <b>BOOST</b>', done: (s) => s.boostT > 0.5 },
    { t: 'Jump', kb: 'Press <kbd>Space</kbd> (again in the air to dive)', pad: 'Press <kbd>A</kbd> (again in the air to dive)', touch: 'Tap <b>JUMP</b>', done: (s) => s.jumps > 0 },
    { t: 'Bonk the ball', kb: () => `Steer with <kbd>${kl('KeyA')}</kbd> <kbd>${kl('KeyD')}</kbd> and slide into it`, pad: 'Steer with the left stick and slide into it', touch: 'Steer with the stick and slide into it', done: (s) => s.touches > 0 },
    { t: 'Score a goal', kb: SCORE, pad: SCORE, touch: SCORE, done: (s) => s.goals > 0 },
  ];
  const TIP = { kb: () => `Tip: hold <kbd>${kl('KeyF')}</kbd> as you reach the ball for a power shot`, pad: 'Tip: hold <kbd>RB</kbd> as you reach the ball for a power shot', touch: 'Tip: hold <b>SHOT</b> as you reach the ball for a power shot' };
  let on = false, step = 0, base = null, stepT = 0, pass = 0, endT = 0;
  const cur = { dist: 0, boostT: 0, jumps: 0, touches: 0, goals: 0 };
  const txt = (v) => (typeof v === 'function' ? v() : v);
  function rebase() {
    base = { jumps: PRESSES.jump, touches: M.player ? M.player.stat.touches : 0, goals: M.score[0] };
    cur.dist = 0; cur.boostT = 0; stepT = 0;
  }
  function render() {
    if (!on) { box.hidden = true; return; }
    box.hidden = false;
    if (step >= STEPS.length) {
      box.className = 'end';
      box.innerHTML = `<div class="tut-title">Nice goal! You're ready.</div>
        <div class="tut-do">Next up: a 3 minute 1v1 against an Easy bot.</div>
        <button class="btn green" data-tut-play type="button">PLAY A MATCH${endT > 0 ? ` (${Math.ceil(endT)})` : ''}</button>`;
      return;
    }
    const S = STEPS[step];
    box.className = pass > 0 ? 'pass' : '';
    box.innerHTML = `<div class="tut-top"><span class="tut-step">TUTORIAL ${step + 1} / ${STEPS.length}</span><button class="btn white sm" data-tut-skip type="button">Skip</button></div>
      <div class="tut-title">${pass > 0 ? '✓ ' : ''}${S.t}</div>
      <div class="tut-do">${txt(S[inputDev])}</div>
      ${step === STEPS.length - 1 && stepT > 25 ? `<div class="tut-tip">${txt(TIP[inputDev])}</div>` : ''}
      <div class="tut-dots">${STEPS.map((_, i) => `<i class="${i < step || (i === step && pass > 0) ? 'on' : i === step ? 'cur' : ''}"></i>`).join('')}</div>`;
  }
  function start() {
    on = true; step = 0; pass = 0; endT = 0;
    UI.launch({ mode: '1v1', opp: 'easy', mate: 'easy', len: 1e9, tutorial: true });
    rebase(); render();
  }
  function stop() { on = false; render(); }
  function finish() { if (!save.tutorial) { save.tutorial = 1; persist(); } }
  FRAME_HOOKS.push((fdt) => {
    if (PAD.on && (PAD.prev.some((x) => x) || Math.abs(PAD.axes[0]) > 0.4 || Math.abs(PAD.axes[1]) > 0.4)) setDev('pad');
    if (!on) return;
    if (!M.cfg || !M.cfg.tutorial || M.demo) { stop(); return; }   // quit to the menu from the pause screen
    if (step >= STEPS.length) {
      if (endT > 0 && !M.paused) {
        const before = Math.ceil(endT); endT -= fdt;
        if (endT <= 0) { stop(); UI.quick(); return; }
        if (Math.ceil(endT) !== before) render();
      }
      return;
    }
    if (pass > 0) { pass -= fdt; if (pass <= 0) { step++; rebase(); if (step >= STEPS.length) { finish(); endT = 8; } render(); } return; }
    if (M.state !== 'play' && M.state !== 'goal') return;
    const p = M.player;
    cur.dist += Math.hypot(p.v.x, p.v.z) * fdt;
    if (p.boosting) cur.boostT += fdt;
    cur.jumps = PRESSES.jump - base.jumps; cur.touches = p.stat.touches - base.touches; cur.goals = M.score[0] - base.goals;
    const tipBefore = stepT > 25; stepT += fdt;
    if (STEPS[step].done(cur)) { pass = 0.8; Sfx.click(); render(); }
    else if (tipBefore !== stepT > 25) render();
  });
  DEV_HOOKS.push(render);
  return {
    start, stop,
    skip() { finish(); stop(); UI.quick(); },
    play() { stop(); UI.quick(); },
    get on() { return on; },
  };
})();
