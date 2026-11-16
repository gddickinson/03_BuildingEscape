// Top-down 2D playground for the OpenDoor and Grabber logic (escape_engine.js, hand-traced from the C++ in the tests).
// Move with W/S or arrow keys, turn with A/D or left/right, hold Shift (or the Grab button) to grab. Push enough mass
// onto the pressure plate (> 30 kg) to fire OnOpenRequest; the door closes 1 s after the plate stops being heavy enough.
import { route, app, esc, list, animate } from './core.js';
import { OpenDoor, Grabber, massOnPlate, reachLineEnd, REACH, MASS_THRESHOLD, DOOR_CLOSE_DELAY } from './escape_engine.js';

const ROOM = { w: 800, h: 560 }, PLATE = { x: 340, y: 230, w: 120, h: 100 }, HINGE = { x: 800, y: 200 }, DOOR_LEN = 120;

route('demo', async () => {
  const bodies = [
    { name: 'crate', x: 160, y: 140, r: 22, mass: 20 }, { name: 'barrel', x: 180, y: 420, r: 18, mass: 15 },
    { name: 'statue', x: 600, y: 440, r: 26, mass: 10 }];
  const player = { x: 120, y: 280, dir: 0 };
  const door = new OpenDoor(), grabber = new Grabber();
  let t = 0, last = null, grabbing = false;
  const keys = new Set();
  app().innerHTML = `<p class="kicker">Interactive demo</p><h1>Pressure plate and grabber</h1>
  <p class="lead">The door trigger and the grabber of the Unreal project, ported to a top-down 2D world (1 px = 1 cm).
  The timing and the 30 kg rule are the C++ logic; the 2D overlap and line tests stand in for Unreal's trigger volume and
  physics line trace, and the masses below are set here (the level's real objects live in the binary map file).</p>
  <div class="demo-grid wide-left">
    <div class="stage"><canvas id="e-cv" width="${ROOM.w}" height="${ROOM.h}" tabindex="0" aria-label="Top-down room: player, objects, pressure plate and door. Focus and use W A S D and Shift."></canvas></div>
    <div class="panel">
      <div class="kvs" id="e-kv"></div>
      <div class="row pad"><button type="button" id="b-f">Forward</button><button type="button" id="b-b" class="alt">Back</button>
        <button type="button" id="b-l" class="alt">Turn left</button><button type="button" id="b-r" class="alt">Turn right</button>
        <button type="button" id="b-g">Grab</button></div>
      <p class="small mute">Keyboard (click the room first): W/S or ↑/↓ move, A/D or ←/→ turn, hold Shift to grab (the
      project maps "Grab" to Left Shift and the right mouse button).</p>
      <h3>Object masses (demo values)</h3><div id="e-m"></div>
      <h3>Last OpenDoor tick</h3><pre id="e-ev" class="out"></pre>
    </div>
  </div>
  <p class="small mute">Door: the C++ only broadcasts OnOpenRequest; the Blueprint that animates the door is a binary
  asset, so here the door simply turns to OpenAngle = 90° (the value of the commented-out C++ line) when the request
  fires, and CloseDoor() sets it back to 0.</p>`;
  const $ = id => document.getElementById(id), cv = $('e-cv'), g = cv.getContext('2d');
  $('e-m').innerHTML = list(bodies, (b, i) => `<div class="ctl"><label for="m${i}">${esc(b.name)} <b id="mv${i}">${b.mass} kg</b></label>
    <input type="range" id="m${i}" min="0" max="50" step="1" value="${b.mass}"></div>`);
  bodies.forEach((b, i) => $('m' + i).addEventListener('input', e => { b.mass = +e.target.value; $('mv' + i).textContent = b.mass + ' kg'; }));

  const move = (fwd, turn) => {
    player.dir = (player.dir + turn + 360) % 360;
    const a = player.dir * Math.PI / 180;
    player.x = Math.max(15, Math.min(ROOM.w - 15, player.x + Math.cos(a) * fwd));
    player.y = Math.max(15, Math.min(ROOM.h - 15, player.y + Math.sin(a) * fwd));
  };
  const setGrab = on => {
    if (on && !grabbing) { grabbing = true; grabber.grab(player, bodies); }
    if (!on && grabbing) { grabbing = false; grabber.release(); }
    $('b-g').textContent = grabbing ? 'Release' : 'Grab';
  };
  cv.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) { keys.add(k); e.preventDefault(); }
    if (k === 'shift') setGrab(true);
  });
  cv.addEventListener('keyup', e => { const k = e.key.toLowerCase(); keys.delete(k); if (k === 'shift') setGrab(false); });
  cv.addEventListener('blur', () => { keys.clear(); });
  $('b-f').onclick = () => move(30, 0); $('b-b').onclick = () => move(-30, 0);
  $('b-l').onclick = () => move(0, -15); $('b-r').onclick = () => move(0, 15);
  $('b-g').onclick = () => setGrab(!grabbing);

  function draw() {
    g.fillStyle = '#05070e'; g.fillRect(0, 0, ROOM.w, ROOM.h);
    g.strokeStyle = '#212c4c'; g.lineWidth = 1;
    for (let x = 0; x < ROOM.w; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, ROOM.h); g.stroke(); }
    for (let y = 0; y < ROOM.h; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(ROOM.w, y); g.stroke(); }
    const m = massOnPlate(bodies, PLATE);
    g.fillStyle = m > MASS_THRESHOLD ? 'rgba(255,191,61,.35)' : 'rgba(255,191,61,.12)';
    g.fillRect(PLATE.x, PLATE.y, PLATE.w, PLATE.h); g.strokeStyle = '#ffbf3d'; g.strokeRect(PLATE.x, PLATE.y, PLATE.w, PLATE.h);
    g.fillStyle = '#ffbf3d'; g.font = '13px monospace'; g.fillText(`pressure plate ${m} kg`, PLATE.x, PLATE.y - 8);
    g.strokeStyle = door.rotation ? '#3dff8f' : '#ff4f6d'; g.lineWidth = 8; g.beginPath();
    g.moveTo(HINGE.x - 4, HINGE.y);
    g.lineTo(HINGE.x - 4 + Math.sin(door.rotation * Math.PI / 180) * -DOOR_LEN, HINGE.y + Math.cos(door.rotation * Math.PI / 180) * DOOR_LEN);
    g.stroke(); g.lineWidth = 1;
    g.fillStyle = '#94a3c6'; g.fillText(`door ${door.rotation}°`, HINGE.x - 90, HINGE.y - 10);
    for (const b of bodies) {
      g.fillStyle = b === grabber.held ? '#3dd6ff' : '#5b6b94'; g.beginPath(); g.arc(b.x, b.y, b.r, 0, 2 * Math.PI); g.fill();
      g.fillStyle = '#e8f1ff'; g.fillText(`${b.name} ${b.mass}`, b.x - b.r, b.y - b.r - 5);
    }
    const end = reachLineEnd(player);
    g.strokeStyle = '#ff3f3f'; g.lineWidth = 2; g.beginPath(); g.moveTo(player.x, player.y); g.lineTo(end.x, end.y); g.stroke();
    g.fillStyle = '#ff9f43'; g.beginPath(); g.arc(player.x, player.y, 14, 0, 2 * Math.PI); g.fill();
    g.fillStyle = '#94a3c6'; g.fillText(`reach ${REACH} cm`, end.x + 4, end.y);
    return m;
  }
  animate(now => {
    const dt = last === null ? 0 : Math.min(0.1, (now - last) / 1000); last = now; t += dt;
    const sp = 160 * dt, tr = 120 * dt;
    if (keys.has('w') || keys.has('arrowup')) move(sp, 0);
    if (keys.has('s') || keys.has('arrowdown')) move(-sp, 0);
    if (keys.has('a') || keys.has('arrowleft')) move(0, -tr);
    if (keys.has('d') || keys.has('arrowright')) move(0, tr);
    grabber.tick(player);
    const m = draw();
    const ev = door.tick(t, m);
    const since = t - door.lastDoorOpenTime;
    $('e-kv').innerHTML = list([[`${m} kg`, `mass on plate (opens when > ${MASS_THRESHOLD})`], [door.openRequests, 'OnOpenRequest broadcasts'],
      [door.openRequests ? `${since.toFixed(2)} s` : '-', `since last open (closes after ${DOOR_CLOSE_DELAY} s)`],
      [grabber.held ? grabber.held.name : 'nothing', 'held by the grabber']], ([v, k]) => `<div><b>${esc(String(v))}</b><span>${esc(k)}</span></div>`);
    $('e-ev').textContent = ev.length ? ev.join('\n') : '(no calls this tick)';
  });
});
