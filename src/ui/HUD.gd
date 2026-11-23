extends CanvasLayer
class_name HUD

@onready var mode_label: Label = $TopBar/ModeLabel
@onready var phase_title_label: Label = $TopBar/MissionContainer/PhaseTitleLabel
@onready var objective_label: Label = $TopBar/MissionContainer/ObjectiveLabel
@onready var boss_bar_container: VBoxContainer = $TopBar/MissionContainer/BossBarContainer
@onready var boss_health_bar: ProgressBar = $TopBar/MissionContainer/BossBarContainer/BossHealthBar
@onready var score_label: Label = $TopBar/ScoreLabel

@onready var p1_status: VBoxContainer = $P1Status
@onready var p1_health_bar: ProgressBar = $P1Status/HealthBar
@onready var p1_boost_bar: ProgressBar = $P1Status/BoostBar

@onready var p2_status: VBoxContainer = $P2Status
@onready var p2_health_bar: ProgressBar = $P2Status/HealthBar
@onready var p2_boost_bar: ProgressBar = $P2Status/BoostBar

@onready var hints_label: Label = $BottomHints/HintsLabel

@onready var modal_overlay: CenterContainer = $ModalOverlay
@onready var modal_title: Label = $ModalOverlay/ModalPanel/VBox/ModalTitle
@onready var modal_subtitle: Label = $ModalOverlay/ModalPanel/VBox/ModalSubtitle
@onready var modal_prompt: Label = $ModalOverlay/ModalPanel/VBox/ModalPrompt

var p1_drone: Drone3D = null
var p2_drone: Drone3D = null

func _ready() -> void:
	GameManager.score_updated.connect(_on_score_updated)
	_setup_drones()
	_update_mode_text()

func _update_mode_text() -> void:
	match GameManager.current_mode:
		GameManager.GameMode.SINGLE_PLAYER:
			mode_label.text = "SOLO CAMPAIGN - SECTOR 1"
			phase_title_label.text = "PHASE 1/3: KINETIC OVERRIDE"
			objective_label.text = "[!] Strike the Security Pylon with Flail to drop blast gates"
			p2_status.visible = false
			hints_label.text = "[WASD] Fly  •  [Right Click] Slingshot Launch  •  [Left Click Hold] Reel & Orbit Shield  •  [Space] Boost"
		GameManager.GameMode.COOP:
			mode_label.text = "CO-OP CAMPAIGN - SECTOR 1"
			phase_title_label.text = "PHASE 1/3: KINETIC OVERRIDE"
			objective_label.text = "[!] Combine Flail strikes to breach security gates"
			p2_status.visible = true
			hints_label.text = "P1: [WASD + Mouse]  •  P2: [IJKL, / to Launch, ; to Orbit, . to Boost]"
		GameManager.GameMode.VERSUS:
			mode_label.text = "VERSUS ARENA (FIRST TO 3 WINS)"
			phase_title_label.text = "DEMOLITION DUEL"
			objective_label.text = "[!] Sling your flail to smash opponent drone!"
			p2_status.visible = true
			hints_label.text = "P1: [WASD + Mouse]  •  P2: [IJKL, / to Launch, ; to Orbit, . to Boost]"

func _setup_drones() -> void:
	var drones = get_tree().get_nodes_in_group("drones_3d")
	for d in drones:
		if d is Drone3D:
			if d.player_id == 1:
				p1_drone = d
				d.health_changed.connect(_on_p1_health_changed)
			elif d.player_id == 2:
				p2_drone = d
				d.health_changed.connect(_on_p2_health_changed)

func _process(_delta: float) -> void:
	if is_instance_valid(p1_drone):
		p1_boost_bar.value = p1_drone.boost_energy
	if is_instance_valid(p2_drone):
		p2_boost_bar.value = p2_drone.boost_energy

func _on_p1_health_changed(_id: int, current: float, max_val: float) -> void:
	p1_health_bar.value = (current / max_val) * 100.0

func _on_p2_health_changed(_id: int, current: float, max_val: float) -> void:
	p2_health_bar.value = (current / max_val) * 100.0

func _on_score_updated(_player_id: int, new_score: int) -> void:
	score_label.text = "SCORE: %06d" % new_score

func set_phase_info(title_text: String, objective_text: String) -> void:
	phase_title_label.text = title_text
	objective_label.text = objective_text

func show_boss_bar(show: bool, initial: float = 120.0, max_val: float = 120.0) -> void:
	boss_bar_container.visible = show
	if show:
		update_boss_bar(initial, max_val)

func update_boss_bar(current: float, max_val: float) -> void:
	boss_health_bar.value = clampf((current / max_val) * 100.0, 0.0, 100.0)

func show_victory_modal(final_score: int, elapsed_seconds: float) -> void:
	modal_overlay.visible = true
	modal_title.text = "MISSION ACCOMPLISHED!"
	modal_title.set("theme_override_colors/font_color", Color(1.0, 0.85, 0.2, 1.0))
	modal_subtitle.text = "Sector Cleared in %.1fs  •  Total Score: %06d" % [elapsed_seconds, final_score]
	modal_prompt.text = "Press [ENTER] or [SPACE] to Continue  •  [ESC] Main Menu"

func show_game_over_modal() -> void:
	modal_overlay.visible = true
	modal_title.text = "DRONE DESTROYED"
	modal_title.set("theme_override_colors/font_color", Color(1.0, 0.25, 0.2, 1.0))
	modal_subtitle.text = "The orbital vault defense overwhelmed your drone."
	modal_prompt.text = "Press [ENTER] to Retry  •  [ESC] Main Menu"

func show_versus_round_result(winner_id: int, p1_wins: int, p2_wins: int, is_match_over: bool) -> void:
	modal_overlay.visible = true
	if is_match_over:
		modal_title.text = "PLAYER %d IS THE ARENA CHAMPION!" % winner_id
		modal_title.set("theme_override_colors/font_color", Color(1.0, 0.85, 0.2, 1.0))
		modal_subtitle.text = "Final Match Score - P1: %d  |  P2: %d" % [p1_wins, p2_wins]
		modal_prompt.text = "Press [ENTER] to Rematch  •  [ESC] Main Menu"
	else:
		modal_title.text = "ROUND WON BY PLAYER %d!" % winner_id
		modal_title.set("theme_override_colors/font_color", Color(0.1, 0.9, 1.0, 1.0))
		modal_subtitle.text = "Current Score - P1: %d  |  P2: %d" % [p1_wins, p2_wins]
		modal_prompt.text = "Press [ENTER] for Next Round  •  [ESC] Main Menu"
