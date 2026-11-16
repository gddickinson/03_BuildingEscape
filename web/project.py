"""Project-specific content for the BuildingEscape showcase: excludes, tiles, the "How it works" sections (claims
cited to a file + a text that must occur on the cited line; resolved and checked by the tests) and About. The demo
runs entirely in the browser (web/static/escape_engine.js).
"""
from fastapi import FastAPI

TITLE = "Building Escape"
REPO = "03_BuildingEscape"
PORT = 8262
KICKER = "Unreal Engine 4.19 · C++ · course project"
DESCRIPTION = ("Unreal Engine 4 C++ course project - a room-escape level with physics-based door triggers (OpenDoor) "
               "and object grabbing (Grabber).")
DEMO = {"title": "Pressure plate demo",
        "blurb": "A top-down 2D port of the OpenDoor trigger and timing and the Grabber's reach: carry objects onto the "
                 "plate until it holds more than 30 kg."}

EXCLUDE = ("web/*", "scripts/*", "tests/*", "run_web.py", "requirements-web.txt", ".github/*", "docs/*",
           "SESSION_LOG.md", "INTERFACE.md", ".gitignore")
VENDORED = ()
NOT_CODE = ("Markdown", "Text", "INI", "XML", "JSON")

SRC = "BuildingEscape/Source/BuildingEscape/"
OD, ODH, GR, GRH = SRC + "OpenDoor.cpp", SRC + "OpenDoor.h", SRC + "Grabber.cpp", SRC + "Grabber.h"


def tiles(shown):
    comps = [f for f in shown if f["path"].startswith(SRC) and f["path"].endswith(".h") and "UCLASS" in f["text"]]
    return [[len(comps), "C++ actor components"], [sum(f["path"].endswith((".cpp", ".h")) for f in shown), ".cpp/.h files"]]


SVG = """<svg viewBox="0 0 780 200" role="img" aria-label="Each tick OpenDoor sums the mass of actors overlapping the
pressure plate; above 30 kg it broadcasts OnOpenRequest to the door Blueprint and records the time; more than one second
after the last such time it sets the door rotation back to zero">
<defs><marker id="arw" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
<path class="arh" d="M0 0L10 5L0 10z"/></marker></defs>
<rect class="bx3" x="5" y="70" width="150" height="60" rx="6"/><text class="t" x="80" y="96" text-anchor="middle">TickComponent</text><text class="tm" x="80" y="116" text-anchor="middle">every frame</text>
<path class="ar" d="M155 100H185"/>
<rect class="bx" x="188" y="60" width="200" height="80" rx="6"/><text class="t" x="288" y="88" text-anchor="middle">mass on plate</text>
<text class="tm" x="288" y="108" text-anchor="middle">Σ GetMass() of actors</text><text class="tm" x="288" y="124" text-anchor="middle">overlapping the trigger</text>
<path class="ar" d="M388 85L470 45"/><text class="tm" x="420" y="52" text-anchor="middle">&gt; 30 kg</text>
<rect class="bx2" x="473" y="15" width="300" height="56" rx="6"/><text class="t" x="623" y="38" text-anchor="middle">OnOpenRequest.Broadcast()</text>
<text class="tm" x="623" y="58" text-anchor="middle">Blueprint opens the door; LastDoorOpenTime = now</text>
<path class="ar" d="M388 115L470 155"/><text class="tm" x="430" y="170" text-anchor="middle">now − last &gt; 1 s</text>
<rect class="bx2" x="473" y="128" width="300" height="56" rx="6"/><text class="t" x="623" y="152" text-anchor="middle">CloseDoor()</text>
<text class="tm" x="623" y="172" text-anchor="middle">SetActorRotation(0, 0, 0)</text>
</svg>"""

HOW = [
    {"id": "opendoor", "title": "OpenDoor: a mass-triggered door", "svg": SVG,
     "caption": "What UOpenDoor::TickComponent does every frame.",
     "body": """<p><code>UOpenDoor</code> is an actor component placed on the door. In the editor it is given a trigger
volume, the <b>pressure plate</b>. Every tick it asks the plate for all overlapping actors and adds up the mass of each
one's primitive (physics) component. If the total is <b>more than 30 kg</b> it calls <code>OpenDoor()</code> and stores
the world time in <code>LastDoorOpenTime</code>. Independently, if more than <code>DoorCloseDelay</code> (1 s) has
passed since that time, it calls <code>CloseDoor()</code>, which sets the door's rotation straight back to 0.</p>
<p>So the door stays open as long as the plate is heavy enough, and closes one second after it stops being so. Because
the time keeps being refreshed while the weight is there, the close never fires early; and while the door is closed
<code>CloseDoor()</code> simply runs every tick. A missing plate is reported in <code>BeginPlay</code> and then treated
as 0 kg.</p>""",
     "cites": [
         {"file": OD, "find": "if (GetTotalMassOfActorsOnPlate() > 30.f)"},
         {"file": OD, "find": "LastDoorOpenTime = GetWorld()->GetTimeSeconds();"},
         {"file": OD, "find": "if (GetWorld()->GetTimeSeconds() - LastDoorOpenTime > DoorCloseDelay)"},
         {"file": OD, "find": "Owner->SetActorRotation(FRotator(0.0f, 0.0f, 0.0f));"},
         {"file": OD, "find": "PressurePlate->GetOverlappingActors(OUT OverlappingActors);"},
         {"file": OD, "find": "TotalMass += Actor->FindComponentByClass<UPrimitiveComponent>()->GetMass();"},
         {"file": ODH, "find": "float DoorCloseDelay = 1.0f;"},
         {"file": OD, "find": "missing pressure plate!"},
     ]},
    {"id": "blueprint", "title": "Opening is left to a Blueprint",
     "body": """<p>The C++ does not turn the door open itself: the line that set the rotation to <code>OpenAngle</code>
(90°) is commented out, and <code>OpenDoor()</code> broadcasts the <code>OnOpenRequest</code> event instead. The event
is declared as a dynamic multicast delegate and marked <code>BlueprintAssignable</code>, so the door's Blueprint
(<code>Openable_Door_BP.uasset</code>) can bind to it and animate the opening. That
Blueprint is a binary asset, so this site cannot show what it does; the demo stands in for it by turning the door to
90°. Closing, by contrast, is still a direct snap to 0 in C++.</p>""",
     "cites": [
         {"file": OD, "find": "// Owner->SetActorRotation(FRotator(0.0f, OpenAngle, 0.0f));"},
         {"file": OD, "find": "OnOpenRequest.Broadcast();"},
         {"file": ODH, "find": "DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnOpenRequest);"},
         {"file": ODH, "find": "UPROPERTY(BlueprintAssignable)"},
         {"file": ODH, "find": "float OpenAngle = 90.0f;"},
     ]},
    {"id": "grabber", "title": "Grabber: reach, line trace, physics handle",
     "body": """<p><code>UGrabber</code> sits on the player pawn. At <code>BeginPlay</code> it finds the pawn's
<code>UPhysicsHandleComponent</code> and input component, and binds the <b>Grab</b> action (Left Shift or the right
mouse button, in <code>DefaultInput.ini</code>) to <code>Grab</code> on press and <code>Release</code> on release.</p>
<p>The reach line starts at the player's viewpoint and ends <code>Reach</code> = 100 cm along the view direction.
<code>Grab()</code> line-traces along it for objects in the <b>PhysicsBody</b> channel, ignoring the player, and if it
hits one, grabs that component at its location with rotation allowed. Every tick, while something is held, the physics
handle's target is moved to the current end of the reach line, so the object follows the player's view;
<code>Release()</code> lets go. Each function returns early if the handle is missing, rather than crashing.</p>""",
     "cites": [
         {"file": GRH, "find": "float Reach = 100.0f;"},
         {"file": GR, "find": 'InputComponent->BindAction("Grab", IE_Pressed, this, &UGrabber::Grab);'},
         {"file": "BuildingEscape/Config/DefaultInput.ini", "find": 'ActionName="Grab",Key=LeftShift'},
         {"file": GR, "find": "FCollisionObjectQueryParams(ECollisionChannel::ECC_PhysicsBody),"},
         {"file": GR, "find": "FCollisionQueryParams TraceParameters(FName(TEXT(\"\")), false, GetOwner());"},
         {"file": GR, "find": "PhysicsHandle->SetTargetLocation(GetReachLineEnd());"},
         {"file": GR, "find": "return PlayerViewPointLocation + (PlayerViewPointRotation.Vector()*Reach);"},
         {"file": GR, "find": "if (!PhysicsHandle) { return; }"},
     ]},
    {"id": "project", "title": "The project around it",
     "body": """<p>The Unreal project targets engine 4.19 and has one runtime module, <code>BuildingEscape</code>. Its
default map is <code>NewMap</code> with a Blueprint game mode, and gravity is the default −980 cm/s². A third component,
<code>UPositionReport</code>, just logs its owner's name and position at start, an early exercise. The commit history
follows the course: position report, door rotation, trigger, time-delayed closing, grabber line trace, physics handle,
mass-based trigger, pointer protection and, last, the Blueprint-assignable door event.</p>""",
     "cites": [
         {"file": "BuildingEscape/BuildingEscape.uproject", "find": '"EngineAssociation": "4.19"'},
         {"file": "BuildingEscape/Config/DefaultEngine.ini", "find": "GameDefaultMap=/Game/Maps/NewMap.NewMap"},
         {"file": "BuildingEscape/Config/DefaultEngine.ini", "find": "DefaultGravityZ=-980.000000"},
         {"file": SRC + "PositionReport.cpp", "find": 'UE_LOG(LogTemp, Warning, TEXT("%s is at %s"), *ObjectName, *ObjectPos);'},
     ]},
]

ABOUT = {
    "port": PORT,
    "what": """<p>An Unreal Engine C++ project from 2018 (a course project): a small room-escape level where the
player picks up physics objects and stacks enough mass on a pressure plate to open the door. The C++ is two actor
components, <code>OpenDoor</code> and <code>Grabber</code> (plus a position logger); the level, materials and door
Blueprint are binary Unreal assets in <code>Content/</code>.</p>""",
    "needs": ["Unreal Engine 4.19 (the version in BuildingEscape.uproject) with a C++ toolchain (Visual Studio on "
              "Windows, Xcode on macOS)."],
    "run": ["Open <code>BuildingEscape/BuildingEscape.uproject</code>; the editor offers to build the module.",
            "Press Play; Left Shift or the right mouse button grabs (the Grab action in DefaultInput.ini)."],
    "credits": ["George Dickinson, following an Unreal Engine C++ course (the repository's description calls it a "
                "course project)."],
    "licence": "MIT (see LICENSE). Unreal Engine itself is under Epic Games' licence.",
}

EXTRA_ENDPOINTS = []


def register(app: FastAPI):
    """No extra routes: the demo runs entirely in the browser."""
