extends CharacterBody2D
class_name Drone

@export var player_id: int = 1
@export var base_speed: float = 380.0
@export var acceleration: float = 1400.0
@export var friction: float = 800.0
@export var boost_speed_mult: float = 1.7
@export var max_health: float = 100.0
@export var drone_color: Color = Color(1.0, 0.85, 0.1, 1.0) # Nano Banana Yellow

var current_health: float = 100.0
var is_boosting: bool = false
var whip_cooldown: float = 0.0
var boost_energy: float = 100.0
var max_boost_energy: float = 100.0

var tether: Tether = null
var flail: Flail = null

signal health_changed(player_id: int, current: float, max_val: float)
signal drone_destroyed(player_id: int)

func _ready() -> void:
	current_health = max_health
	_setup_flail_and_tether()
	_apply_player_palette()

func _apply_player_palette() -> void:
	match player_id:
		1:
			drone_color = Color(1.0, 0.82, 0.05, 1.0) # Golden Yellow (Nano Banana)
		2:
			drone_color = Color(0.1, 0.8, 1.0, 1.0)  # Cyan Blue
		3:
			drone_color = Color(1.0, 0.25, 0.3, 1.0)  # Neon Crimson
		4:
			drone_color = Color(0.3, 1.0, 0.4, 1.0)  # Emerald Green

func _setup_flail_and_tether() -> void:
	# Instantiate flail
	var flail_scene = load("res://src/entities/flail/Flail.tscn")
	flail = flail_scene.instantiate() as Flail
	flail.player_id = player_id
	flail.flail_color = drone_color
	flail.global_position = global_position + Vector2(-60.0, 0.0)
	get_parent().call_deferred("add_child", flail)
	
	# Instantiate tether
	tether = Tether.new()
	tether.line_color = drone_color
	get_parent().call_deferred("add_child", tether)
	
	# Connect references after deferred add
	call_deferred("_finalize_attachments")

func _finalize_attachments() -> void:
	if is_instance_valid(tether) and is_instance_valid(flail):
		tether.attach(self, flail)
		flail.set_tether(tether)

func _physics_process(delta: float) -> void:
	_handle_cooldowns(delta)
	_process_movement(delta)
	_process_actions()
	queue_redraw()

func _handle_cooldowns(delta: float) -> void:
	if whip_cooldown > 0.0:
		whip_cooldown -= delta
	
	if is_boosting:
		boost_energy = maxf(0.0, boost_energy - delta * 45.0)
		if boost_energy <= 0.0:
			is_boosting = false
	else:
		boost_energy = minf(max_boost_energy, boost_energy + delta * 25.0)

func _get_input_vector() -> Vector2:
	var input_vec = Vector2.ZERO
	if player_id == 1:
		input_vec.x = Input.get_axis("ui_left", "ui_right")
		input_vec.y = Input.get_axis("ui_up", "ui_down")
		# Also support WASD explicitly
		if input_vec == Vector2.ZERO:
			if Input.is_key_pressed(KEY_A): input_vec.x -= 1.0
			if Input.is_key_pressed(KEY_D): input_vec.x += 1.0
			if Input.is_key_pressed(KEY_W): input_vec.y -= 1.0
			if Input.is_key_pressed(KEY_S): input_vec.y += 1.0
	elif player_id == 2:
		if Input.is_key_pressed(KEY_LEFT): input_vec.x -= 1.0
		if Input.is_key_pressed(KEY_RIGHT): input_vec.x += 1.0
		if Input.is_key_pressed(KEY_UP): input_vec.y -= 1.0
		if Input.is_key_pressed(KEY_DOWN): input_vec.y += 1.0
	
	return input_vec.normalized()

func _process_movement(delta: float) -> void:
	var move_dir = _get_input_vector()
	var target_speed = base_speed * (boost_speed_mult if is_boosting else 1.0)
	
	if move_dir != Vector2.ZERO:
		velocity = velocity.move_toward(move_dir * target_speed, acceleration * delta)
		rotation = lerp_angle(rotation, move_dir.angle() + PI / 2.0, 0.18)
	else:
		velocity = velocity.move_toward(Vector2.ZERO, friction * delta)
	
	# Counter pull from tether tension
	if is_instance_valid(flail):
		var pull_dir = (flail.global_position - global_position)
		if pull_dir.length() > (tether.max_length if is_instance_valid(tether) else 140.0):
			velocity += pull_dir.normalized() * 180.0 * delta
	
	move_and_slide()

func _process_actions() -> void:
	# Boost trigger
	var boost_pressed: bool = false
	var whip_pressed: bool = false
	
	if player_id == 1:
		boost_pressed = Input.is_key_pressed(KEY_SPACE) or Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT)
		whip_pressed = Input.is_key_pressed(KEY_SHIFT) or Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT)
	elif player_id == 2:
		boost_pressed = Input.is_key_pressed(KEY_PERIOD) or Input.is_key_pressed(KEY_KP_0)
		whip_pressed = Input.is_key_pressed(KEY_SLASH) or Input.is_key_pressed(KEY_ENTER)
	
	if boost_pressed and boost_energy > 10.0:
		if not is_boosting:
			SoundManager.play_sfx("boost", 1.1, -2.0)
		is_boosting = true
	else:
		is_boosting = false
	
	if whip_pressed and whip_cooldown <= 0.0:
		_execute_whip_crack()

func _execute_whip_crack() -> void:
	if not is_instance_valid(flail) or not is_instance_valid(tether):
		return
	
	whip_cooldown = 0.55
	
	# Direction from drone to flail
	var to_flail = (flail.global_position - global_position).normalized()
	# The whip crack throws the flail in tangent or forward direction
	var whip_dir = velocity.normalized()
	if whip_dir == Vector2.ZERO:
		whip_dir = to_flail.rotated(PI * 0.4)
	
	tether.apply_whip_pulse(to_flail.orthogonal(), 45.0)
	flail.apply_whip_thrust(whip_dir, 950.0)
	
	# Small recoil push on drone
	velocity -= whip_dir * 180.0

func take_damage(amount: float, hit_position: Vector2 = Vector2.ZERO, impulse: Vector2 = Vector2.ZERO) -> void:
	current_health = maxf(0.0, current_health - amount)
	health_changed.emit(player_id, current_health, max_health)
	SoundManager.play_sfx("impact", 1.3, 1.0)
	
	if impulse != Vector2.ZERO:
		velocity += impulse * 0.5
	
	if current_health <= 0.0:
		_on_destroyed()

func _on_destroyed() -> void:
	SoundManager.play_sfx("shatter", 0.8, 3.0)
	drone_destroyed.emit(player_id)
	queue_free()

func _draw() -> void:
	# Main triangular sleek drone body
	var nose = Vector2(0, -18)
	var left_wing = Vector2(-15, 12)
	var right_wing = Vector2(15, 12)
	var cockpit = Vector2(0, -2)
	
	var hull_poly = PackedVector2Array([nose, right_wing, cockpit, left_wing])
	draw_colored_polygon(hull_poly, drone_color)
	
	# Dark inner mechanical armor
	var inner_poly = PackedVector2Array([Vector2(0, -10), Vector2(8, 8), cockpit, Vector2(-8, 8)])
	draw_colored_polygon(inner_poly, Color(0.15, 0.15, 0.2, 1.0))
	
	# Glowing cockpit visor
	draw_circle(cockpit + Vector2(0, -4), 4.0, Color(1.0, 1.0, 1.0, 0.9))
	
	# Thruster exhaust flame
	if is_boosting or velocity.length() > 50.0:
		var flame_len = 16.0 if is_boosting else 8.0
		var flame_p1 = Vector2(-7, 12)
		var flame_p2 = Vector2(0, 12 + flame_len + randf_range(-2.0, 2.0))
		var flame_p3 = Vector2(7, 12)
		draw_colored_polygon(PackedVector2Array([flame_p1, flame_p2, flame_p3]), Color(0.1, 0.9, 1.0, 0.9))
