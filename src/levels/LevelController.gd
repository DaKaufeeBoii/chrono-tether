extends Node2D
class_name LevelController

@onready var camera: CameraTracker = $CameraTracker
@onready var hud: HUD = $HUD

var targets_remaining: int = 0
var level_completed: bool = false

func _ready() -> void:
	# Add drones to "drones" group if not already added
	for child in get_children():
		if child is Drone:
			child.add_to_group("drones")
			child.drone_destroyed.connect(_on_drone_destroyed)
		elif child is Turret:
			targets_remaining += 1
			child.turret_destroyed.connect(_on_target_destroyed)
		elif child is ImpactSwitch:
			child.switch_activated.connect(_on_switch_activated)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel") or (event is InputEventKey and event.pressed and event.keycode == KEY_ESCAPE):
		GameManager.go_to_main_menu()

func _on_switch_activated() -> void:
	if is_instance_valid(camera):
		camera.add_trauma(0.4)
	SoundManager.play_sfx("clash", 1.2, 2.0)

func _on_target_destroyed() -> void:
	targets_remaining = max(0, targets_remaining - 1)
	if is_instance_valid(camera):
		camera.add_trauma(0.5)
	
	if targets_remaining == 0 and not level_completed:
		level_completed = true
		_on_victory()

func _on_drone_destroyed(player_id: int) -> void:
	if is_instance_valid(camera):
		camera.add_trauma(0.8)
	
	if GameManager.current_mode == GameManager.GameMode.VERSUS:
		var winner_id = 2 if player_id == 1 else 1
		hud.objective_label.text = "PLAYER %d WINS THE ARENA!" % winner_id
	else:
		hud.objective_label.text = "DRONE DESTROYED - PRESS ESC TO EXIT"

func _on_victory() -> void:
	hud.objective_label.text = "MISSION COMPLETE! SECTOR SECURED"
	SoundManager.play_sfx("boost", 1.4, 3.0)
