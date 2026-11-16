// Node test for escape_engine.js, hand-traced from OpenDoor.cpp and Grabber.cpp (traces in the comments).
// Run: node web/static/escape_engine.test.mjs
import assert from 'node:assert/strict';
import { OpenDoor, massOnPlate, firstBodyInReach, reachLineEnd, Grabber } from './escape_engine.js';

// --- OpenDoor::TickComponent, ticks every 0.25 s (exact in binary floating point) ---------------------------------
// Trace: LastDoorOpenTime = 0. t = 0 .. 1.0: no mass; "t - 0 > 1.0" is false up to and including t = 1.0, so
// CloseDoor is first called at t = 1.25 and then on every tick while nothing is on the plate.
// 40 kg on the plate for t = 2.0 .. 2.75: OnOpenRequest broadcast on each of those 4 ticks, LastDoorOpenTime = 2.75.
// Plate empty from t = 3.0: "t - 2.75 > 1.0" is false at 3.0, 3.25, 3.5, 3.75 (exactly 1.0) and true at 4.0.
const d = new OpenDoor();
const closes = [], opens = [];
for (let i = 0; i <= 20; i++) {
  const t = i * 0.25, m = t >= 2.0 && t <= 2.75 ? 40 : 0;
  const ev = d.tick(t, m);
  if (ev.includes('OnOpenRequest.Broadcast()')) opens.push(t);
  if (ev.some(e => e.startsWith('CloseDoor'))) closes.push(t);
}
assert.deepEqual(opens, [2.0, 2.25, 2.5, 2.75]);
assert.deepEqual(closes, [1.25, 1.5, 1.75, 4.0, 4.25, 4.5, 4.75, 5.0]);
assert.equal(d.lastDoorOpenTime, 2.75);

// Threshold is strictly greater than 30 kg: exactly 30 does not open, 30.5 does.
const d2 = new OpenDoor();
assert.deepEqual(d2.tick(0.5, 30), []);
assert.deepEqual(d2.tick(0.6, 30.5), ['OnOpenRequest.Broadcast()']);
// While the mass stays, the door is never closed (LastDoorOpenTime is refreshed every tick).
for (let t = 0.7; t < 10; t += 0.1) assert.ok(!d2.tick(t, 31).some(e => e.startsWith('CloseDoor')));

// --- GetTotalMassOfActorsOnPlate: sum over overlapping actors ------------------------------------------------------
const plate = { x: 0, y: 0, w: 100, h: 100 };
const bodies = [{ x: 50, y: 50, r: 10, mass: 20 }, { x: 105, y: 50, r: 10, mass: 15 }, { x: 200, y: 50, r: 10, mass: 99 }];
assert.equal(massOnPlate(bodies, plate), 35);           // the third body is not on the plate
assert.equal(massOnPlate(bodies.slice(0, 1), plate), 20);

// --- Grabber: GetReachLineEnd = viewpoint + direction * Reach (100 cm) -------------------------------------------
const e = reachLineEnd({ x: 10, y: 20, dir: 90 });
assert.ok(Math.abs(e.x - 10) < 1e-9 && Math.abs(e.y - 120) < 1e-9);
// First physics body along the line: the nearer of two in the way; nothing beyond Reach.
const p = { x: 0, y: 0, dir: 0 };
const near = { x: 60, y: 0, r: 10 }, far = { x: 90, y: 0, r: 10 }, out = { x: 130, y: 0, r: 10 };
assert.equal(firstBodyInReach(p, [far, near, out]), near);
assert.equal(firstBodyInReach(p, [out]), null);
assert.equal(firstBodyInReach({ x: 0, y: 0, dir: 90 }, [near]), null);
// Grab then tick: the held body moves to the reach line end; Release drops it.
const g = new Grabber(), box = { x: 50, y: 5, r: 10 };
assert.equal(g.grab(p, [box]), box);
g.tick({ x: 0, y: 0, dir: 0 });
assert.deepEqual([box.x, box.y], [100, 0]);
g.release(); g.tick({ x: 0, y: 0, dir: 90 });
assert.deepEqual([box.x, box.y], [100, 0]);
console.log('escape engine ok (OpenDoor timing, mass threshold, plate overlap, Grabber reach traced from the C++)');
