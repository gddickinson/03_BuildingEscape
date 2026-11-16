# Session log

## 2026-11-16 - web interface (branch web-interface)
- Added README.md (none existed), INTERFACE.md, this log.
- Web interface (port 8262, Pages on `master`): code explorer (binary .uasset/.umap listed as left out), How it works
  (4 sections, 25 citations checked by the tests), About, and a 2D pressure-plate/grabber demo (JS port of OpenDoor and
  Grabber, node tests hand-traced from the C++).
- Observations, not changed: `LastDoorOpenTime` is not initialised in the class (UObjects start zeroed, so it is 0);
  `GetTotalMassOfActorsOnPlate` dereferences `FindComponentByClass<UPrimitiveComponent>()` without a null check;
  `CloseDoor()` runs every tick while the door is closed.
