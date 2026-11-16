// JS port of the two gameplay components of BuildingEscape (UE4 C++), reduced to a top-down 2D world in cm:
//   OpenDoor (OpenDoor.cpp): every tick, if the total mass on the pressure plate is > 30 kg, broadcast OnOpenRequest
//     and remember the time; if more than DoorCloseDelay (1 s) has passed since then, set the door's rotation to 0.
//   Grabber (Grabber.cpp): a line from the player's viewpoint, Reach (100 cm) long in the view direction; Grab picks the
//     first physics body the line hits and holds it; every tick a held body is moved to the end of the line.
// Hand-traced against the C++ in escape_engine.test.mjs. What is NOT from the C++ is marked: the 2D overlap and line
// tests stand in for Unreal's trigger volume and physics line trace, and the door's opening animation lives in a
// Blueprint (binary .uasset), so the demo shows it as a turn to OpenAngle (90°), the value of the commented-out C++ line.

export const MASS_THRESHOLD = 30;     // OpenDoor.cpp: GetTotalMassOfActorsOnPlate() > 30.f
export const OPEN_ANGLE = 90;         // OpenDoor.h: OpenAngle = 90.0f (used only by the commented-out line)
export const DOOR_CLOSE_DELAY = 1.0;  // OpenDoor.h: DoorCloseDelay = 1.0f
export const REACH = 100;             // Grabber.h: Reach = 100.0f (cm)

export class OpenDoor {
  constructor({ closeDelay = DOOR_CLOSE_DELAY, threshold = MASS_THRESHOLD } = {}) {
    this.closeDelay = closeDelay; this.threshold = threshold;
    this.lastDoorOpenTime = 0;          // uninitialised float member in the C++; UObject memory starts zeroed
    this.rotation = 0; this.openRequests = 0; this.closeCalls = 0; this.log = [];
  }
  // One TickComponent at world time `now` (seconds) with `mass` kg overlapping the plate.
  tick(now, mass) {
    const ev = [];
    if (mass > this.threshold) {
      this.openRequests++; ev.push('OnOpenRequest.Broadcast()');
      this.rotation = OPEN_ANGLE;      // demo stand-in for the Blueprint's response (see header)
      this.lastDoorOpenTime = now;
    }
    if (now - this.lastDoorOpenTime > this.closeDelay) {
      this.closeCalls++; ev.push('CloseDoor(): SetActorRotation(0)');
      this.rotation = 0;
    }
    return ev;
  }
}

// Total mass of bodies overlapping the plate (2D stand-in: circle-rectangle overlap).
export function massOnPlate(bodies, plate) {
  let total = 0;
  for (const b of bodies) {
    const cx = Math.max(plate.x, Math.min(b.x, plate.x + plate.w)), cy = Math.max(plate.y, Math.min(b.y, plate.y + plate.h));
    if ((b.x - cx) ** 2 + (b.y - cy) ** 2 < b.r ** 2) total += b.mass;
  }
  return total;
}

// GetReachLineEnd: viewpoint + direction * Reach (direction in degrees, 0 = +x).
export function reachLineEnd(player, reach = REACH) {
  const a = player.dir * Math.PI / 180;
  return { x: player.x + Math.cos(a) * reach, y: player.y + Math.sin(a) * reach };
}

// GetFirstPhysicsBodyInReach: first body (smallest distance along the line) the segment start..end touches, or null.
export function firstBodyInReach(player, bodies, reach = REACH) {
  const e = reachLineEnd(player, reach), dx = e.x - player.x, dy = e.y - player.y, L2 = dx * dx + dy * dy;
  let best = null, bestT = Infinity;
  for (const b of bodies) {
    const fx = player.x - b.x, fy = player.y - b.y;
    const B = 2 * (fx * dx + fy * dy), C = fx * fx + fy * fy - b.r * b.r, disc = B * B - 4 * L2 * C;
    if (disc < 0) continue;
    const s = Math.sqrt(disc), t1 = (-B - s) / (2 * L2), t2 = (-B + s) / (2 * L2);
    const t = t1 >= 0 ? t1 : (t2 >= 0 ? 0 : -1);   // starting inside a body counts as a hit at 0
    if (t >= 0 && t <= 1 && t < bestT) { bestT = t; best = b; }
  }
  return best;
}

export class Grabber {
  constructor(reach = REACH) { this.reach = reach; this.held = null; }
  grab(player, bodies) {                 // Grab(): bound to the "Grab" action (pressed)
    const hit = firstBodyInReach(player, bodies, this.reach);
    if (hit) this.held = hit;
    return hit;
  }
  release() { this.held = null; }       // Release(): "Grab" released
  tick(player) {                         // TickComponent: move the held body to the reach line end
    if (this.held) Object.assign(this.held, reachLineEnd(player, this.reach));
  }
}
