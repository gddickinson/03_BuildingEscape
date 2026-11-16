# INTERFACE.md - navigation map

## Unreal project (`BuildingEscape/`)
- `BuildingEscape.uproject` (engine 4.19), `Config/*.ini` (default map, input: "Grab" action, physics).
- `Source/BuildingEscape/OpenDoor.{h,cpp}` - UOpenDoor: pressure plate mass > 30 kg -> OnOpenRequest; close after 1 s.
- `Source/BuildingEscape/Grabber.{h,cpp}` - UGrabber: 100 cm reach line trace, physics handle grab/release.
- `Source/BuildingEscape/PositionReport.{h,cpp}` - logs position at BeginPlay. Module/game-mode boilerplate files.
- `Content/` - binary assets (map, door Blueprint, materials); not readable as text.

## Web interface
- `web/app.py`, `web/codebase.py`, `web/project.py` (text and citations); `web/static/escape_engine.js` (+ `.test.mjs`)
  JS port of OpenDoor/Grabber; `demo.js` (2D playground), `home.js`, `code.js`, `highlight.js`, `how.js`, `main.js`.
- `run_web.py` (port 8262), `scripts/build_static.py`, `scripts/screenshots.py`, `tests/test_web.py`.
