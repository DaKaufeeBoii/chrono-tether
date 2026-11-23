extends Node3D
class_name LevelController3D

@onready var camera: CameraTracker3D = $CameraTracker3D
@onready var hud: HUD = $HUD

enum CampaignPhase { PHASE_1_SWITCH, PHASE_2_TURRETS, PHASE_3_REACTOR, EXTRACTION, COMPLETED }
var current_phase: CampaignPhase = CampaignPhase.PHASE_1_SWITCH

var drones: Array[Drone3D] = []
var impact_switches: Array[ImpactSwitch3D] = []
var blast_gates: Array[BlastGate3D] = []
var turrets: Array[Turret3D] = []
var reactor_core: ReactorCore3D = null
var warp_gate: WarpGate3D = null

var turrets_remaining: int = 0
var level_start_time: float = 0.0
var elapsed_time: float = 0.0
var is_game_over: bool = false
var is_victory: bool = false

# Versus mode state
var p1_round_wins: int = 0
var p2_round_wins: int = 0

func _ready() -> void:
	level_start_time = Time.get_ticks_msec() / 1000.0
	_discover_entities()
	_initialize_game_mode()

func _discover_entities() -> void:
	for child in get_children():
		if child is Drone3D:
			drones.append(child)
			child.add_to_group("drones_3d")
			child.drone_destroyed.connect(_on_drone_destroyed)
		elif child is ImpactSwitch3D:
			impact_switches.append(child)
			child.switch_activated_3d.connect(_on_switch_activated)
		elif child is BlastGate3D:
			blast_gates.append(child)
		elif child is Turret3D:
			turrets.append(child)
			turrets_remaining += 1
			child.turret_destroyed_3d.connect(_on_turret_destroyed)
		elif child is ReactorCore3D:
			reactor_core = child
			child.core_damaged.connect(_on_core_damaged)
			child.core_destroyed.connect(_on_core_destroyed)
		elif child is WarpGate3D:
			warp_gate = child
			child.player_escaped.connect(_on_player_escaped)

func _initialize_game_mode() -> void:
	if GameManager.current_mode == GameManager.GameMode.VERSUS:
		_setup_versus_mode()
	else:
		_setup_campaign_mode()

func _setup_campaign_mode() -> void:
	current_phase = CampaignPhase.PHASE_1_SWITCH
	hud.set_phase_info(
		"PHASE 1/3: KINETIC OVERRIDE",
		"[!] Strike the Security Pylon with Flail to drop blast gates"
	)
	
	if not impact_switches.is_empty():
		_set_drones_waypoint(impact_switches[0].global_position)

func _setup_versus_mode() -> void:
	hud.set_phase_info(
		"ARENA DEMOLITION DUEL",
		"[!] Sling flail with maximum force to smash opponent!"
	)

func _process(delta: float) -> void:
	if not is_game_over and not is_victory:
		elapsed_time += delta

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed:
		if event.keycode == KEY_ESCAPE:
			GameManager.go_to_main_menu()
		elif event.keycode == KEY_R and not (is_game_over or is_victory):
			get_tree().reload_current_scene()
		elif (event.keycode == KEY_ENTER or event.keycode == KEY_KP_ENTER or event.keycode == KEY_SPACE) and (is_game_over or is_victory):
			get_tree().reload_current_scene()

func _on_switch_activated() -> void:
	if current_phase != CampaignPhase.PHASE_1_SWITCH:
		return
	
	current_phase = CampaignPhase.PHASE_2_TURRETS
	if is_instance_valid(camera):
		camera.add_trauma(0.5)
	
	# Drop all security blast gates
	for gate in blast_gates:
		if is_instance_valid(gate):
			gate.open_gate()
	
	# Also lower any security crates in group "security_crates"
	for crate in get_tree().get_nodes_in_group("security_crates"):
		if is_instance_valid(crate) and crate.has_method("take_damage"):
			crate.take_damage(999.0)
	
	SoundManager.play_sfx("boost", 1.4, 3.0)
	GameManager.add_score(1, 500)
	
	hud.set_phase_info(
		"PHASE 2/3: DEFENSE SUPPRESSION",
		"[!] Eliminate Automated Sentries (%d remaining)" % turrets_remaining
	)
	
	_update_waypoint_to_nearest_turret()

func _on_turret_destroyed() -> void:
	turrets_remaining = max(0, turrets_remaining - 1)
	if is_instance_valid(camera):
		camera.add_trauma(0.4)
	
	if current_phase == CampaignPhase.PHASE_2_TURRETS:
		if turrets_remaining > 0:
			hud.set_phase_info(
				"PHASE 2/3: DEFENSE SUPPRESSION",
				"[!] Eliminate Automated Sentries (%d remaining)" % turrets_remaining
			)
			_update_waypoint_to_nearest_turret()
		else:
			_advance_to_reactor_phase()

func _advance_to_reactor_phase() -> void:
	current_phase = CampaignPhase.PHASE_3_REACTOR
	if is_instance_valid(reactor_core):
		reactor_core.lower_shield()
		_set_drones_waypoint(reactor_core.global_position)
		hud.show_boss_bar(true, reactor_core.current_health, reactor_core.max_health)
	
	hud.set_phase_info(
		"PHASE 3/3: DESTROY VAULT REACTOR",
		"[!] SHATTER THE VAULT REACTOR CORE WITH FLAIL!"
	)
	SoundManager.play_sfx("boost", 1.6, 4.0)

func _on_core_damaged(current: float, max_val: float) -> void:
	hud.update_boss_bar(current, max_val)
	if is_instance_valid(camera):
		camera.add_trauma(0.3)

func _on_core_destroyed(_pos: Vector3) -> void:
	current_phase = CampaignPhase.EXTRACTION
	hud.show_boss_bar(false)
	
	if is_instance_valid(camera):
		camera.add_trauma(1.0)
	
	if is_instance_valid(warp_gate):
		warp_gate.open_gate()
		_set_drones_waypoint(warp_gate.global_position)
	
	hud.set_phase_info(
		"CRITICAL: REACTOR OVERLOAD!",
		"[►►] ESCAPE THROUGH THE EXTRACTION WARP GATE!"
	)

func _on_player_escaped() -> void:
	if is_victory:
		return
	is_victory = true
	current_phase = CampaignPhase.COMPLETED
	
	var time_bonus = max(0, int((90.0 - elapsed_time) * 20.0))
	GameManager.add_score(1, 2000 + time_bonus)
	
	hud.show_victory_modal(GameManager.score_p1, elapsed_time)
	SoundManager.play_sfx("boost", 1.8, 5.0)

func _on_drone_destroyed(player_id: int) -> void:
	if is_instance_valid(camera):
		camera.add_trauma(0.8)
	
	if GameManager.current_mode == GameManager.GameMode.VERSUS:
		var winner_id = 2 if player_id == 1 else 1
		if winner_id == 1:
			p1_round_wins += 1
		else:
			p2_round_wins += 1
		
		var is_match_over = (p1_round_wins >= 3 or p2_round_wins >= 3)
		hud.show_versus_round_result(winner_id, p1_round_wins, p2_round_wins, is_match_over)
	else:
		# Check if any drones are still alive
		var any_alive = false
		for d in drones:
			if is_instance_valid(d) and d.current_health > 0:
				any_alive = true
				break
		
		if not any_alive and not is_victory:
			is_game_over = true
			hud.show_game_over_modal()

func _update_waypoint_to_nearest_turret() -> void:
	var live_turret: Turret3D = null
	for t in turrets:
		if is_instance_valid(t) and t.current_health > 0:
			live_turret = t
			break
	
	if is_instance_valid(live_turret):
		_set_drones_waypoint(live_turret.global_position)
	elif is_instance_valid(reactor_core):
		_set_drones_waypoint(reactor_core.global_position)

func _set_drones_waypoint(target_pos: Vector3) -> void:
	for d in drones:
		if is_instance_valid(d) and d.has_method("set_objective_waypoint"):
			d.set_objective_waypoint(target_pos)
