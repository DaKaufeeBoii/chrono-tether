extends CharacterBody3D
class_name Drone3D

@export var player_id: int = 1
@export var base_speed: float = 19.0
@export var acceleration: float = 70.0
@export var friction: float = 45.0
@export var boost_speed_mult: float = 1.95
@export var max_health: float = 100.0

var current_health: float = 100.0
var is_boosting: bool = false
var is_spinning: bool = false
var spin_angle: float = 0.0
var whip_cooldown: float = 0.0
var boost_energy: float = 100.0
var max_boost_energy: float = 100.0

var tether: Tether3D = null
var flail: Flail3D = null
var waypoint_arrow: WaypointArrow3D = null

signal health_changed(player_id: int, current: float, max_val: float)
signal drone_destroyed(player_id: int)

func _ready() -> void:
	current_health = max_health
	_setup_flail_and_tether()
	_setup_waypoint_arrow()
	_apply_visual_styling()

func _apply_visual_styling() -> void:
	var body_mesh = $Model/BodyMesh as MeshInstance3D
	if is_instance_valid(body_mesh) and body_mesh.material_override is StandardMaterial3D:
		var mat = body_mesh.material_override.duplicate() as StandardMaterial3D
		match player_id:
			1:
				mat.albedo_color = Color(1.0, 0.82, 0.05, 1.0) # Golden Nano Banana
				mat.emission = Color(1.0, 0.7, 0.1, 1.0)
			2:
				mat.albedo_color = Color(0.1, 0.8, 1.0, 1.0)  # Cyan Echo
				mat.emission = Color(0.1, 0.7, 1.0, 1.0)
		body_mesh.material_override = mat

func _setup_waypoint_arrow() -> void:
	waypoint_arrow = WaypointArrow3D.new()
	add_child(waypoint_arrow)

func set_objective_waypoint(pos: Vector3) -> void:
	if is_instance_valid(waypoint_arrow):
		waypoint_arrow.set_target(pos)

func clear_objective_waypoint() -> void:
	if is_instance_valid(waypoint_arrow):
		waypoint_arrow.clear_target()

func _setup_flail_and_tether() -> void:
	var flail_scene = load("res://src/entities/flail/Flail3D.tscn")
	flail = flail_scene.instantiate() as Flail3D
	flail.player_id = player_id
	flail.position = position + Vector3(-2.2, 0.0, 0.0)
	get_parent().add_child.call_deferred(flail)
	
	tether = Tether3D.new()
	get_parent().add_child.call_deferred(tether)
	
	call_deferred("_finalize_attachments")

func _finalize_attachments() -> void:
	if is_instance_valid(flail) and flail.is_inside_tree():
		flail.global_position = global_position + Vector3(-2.2, 0.0, 0.0)
	if is_instance_valid(tether) and is_instance_valid(flail):
		tether.attach(self, flail)
		flail.set_tether(tether)

func _physics_process(delta: float) -> void:
	if not is_instance_valid(flail) or not flail.is_inside_tree() or not is_instance_valid(tether) or not tether.is_inside_tree():
		return
	
	_handle_cooldowns(delta)
	_process_actions(delta)
	_process_movement(delta)

func _handle_cooldowns(delta: float) -> void:
	if whip_cooldown > 0.0:
		whip_cooldown -= delta
	
	if is_boosting:
		boost_energy = maxf(0.0, boost_energy - delta * 45.0)
		if boost_energy <= 0.0:
			is_boosting = false
	else:
		boost_energy = minf(max_boost_energy, boost_energy + delta * 25.0)

func _get_input_vector() -> Vector3:
	var input_vec = Vector3.ZERO
	if player_id == 1:
		if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT): input_vec.x -= 1.0
		if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT): input_vec.x += 1.0
		if Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP): input_vec.z -= 1.0
		if Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN): input_vec.z += 1.0
	elif player_id == 2:
		if Input.is_key_pressed(KEY_J): input_vec.x -= 1.0
		if Input.is_key_pressed(KEY_L): input_vec.x += 1.0
		if Input.is_key_pressed(KEY_I): input_vec.z -= 1.0
		if Input.is_key_pressed(KEY_K): input_vec.z += 1.0
	
	return input_vec.normalized()

func _process_movement(delta: float) -> void:
	var move_dir = _get_input_vector()
	var target_speed = base_speed * (boost_speed_mult if is_boosting else 1.0)
	
	if move_dir != Vector3.ZERO:
		velocity.x = move_toward(velocity.x, move_dir.x * target_speed, acceleration * delta)
		velocity.z = move_toward(velocity.z, move_dir.z * target_speed, acceleration * delta)
		
		# Smooth yaw rotation toward movement direction
		var target_angle = atan2(-move_dir.x, -move_dir.z)
		rotation.y = lerp_angle(rotation.y, target_angle, 0.2)
		
		# Dynamic banking/roll when steering
		var roll_target = -move_dir.x * 0.35
		rotation.z = lerp_angle(rotation.z, roll_target, 0.15)
	else:
		velocity.x = move_toward(velocity.x, 0.0, friction * delta)
		velocity.z = move_toward(velocity.z, 0.0, friction * delta)
		rotation.z = lerp_angle(rotation.z, 0.0, 0.15)
	
	# Maintain hover plane height (Y = 1.0)
	velocity.y = (1.0 - global_position.y) * 12.0
	
	# Flail influence on drone: gentle damping when stretched, no chaotic tugging
	if is_instance_valid(flail) and flail.is_inside_tree() and not is_spinning:
		var pull_dir = (flail.global_position - global_position)
		pull_dir.y = 0.0
		var dist = pull_dir.length()
		var max_len = tether.max_length if is_instance_valid(tether) else 6.0
		if dist > max_len * 0.9:
			velocity += pull_dir.normalized() * ((dist - max_len * 0.9) * 4.0) * delta
	
	move_and_slide()

func _process_actions(delta: float) -> void:
	var boost_pressed: bool = false
	var whip_pressed: bool = false
	var spin_held: bool = false
	
	if player_id == 1:
		spin_held = Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT)
		boost_pressed = Input.is_key_pressed(KEY_SPACE)
		whip_pressed = Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT) or Input.is_key_pressed(KEY_SHIFT)
	elif player_id == 2:
		spin_held = Input.is_key_pressed(KEY_SEMICOLON)
		boost_pressed = Input.is_key_pressed(KEY_PERIOD) or Input.is_key_pressed(KEY_KP_0)
		whip_pressed = Input.is_key_pressed(KEY_SLASH) or Input.is_key_pressed(KEY_ENTER)
	
	# Boost logic
	if boost_pressed and boost_energy > 10.0:
		if not is_boosting:
			SoundManager.play_sfx("boost", 1.1, -2.0)
		is_boosting = true
	else:
		is_boosting = false
	
	# Spin / Buzzsaw / Recall logic
	if spin_held:
		is_spinning = true
		var flail_dist = global_position.distance_to(flail.global_position)
		if flail_dist > 3.2:
			# Magnetic recall mode
			flail.recall_towards(global_position, delta)
		else:
			# Orbital buzzsaw mode
			spin_angle += delta * 16.0
			var orbit_radius = 2.3
			var orbit_pos = global_position + Vector3(cos(spin_angle), 0, sin(spin_angle)) * orbit_radius
			var tangent_dir = Vector3(-sin(spin_angle), 0, cos(spin_angle))
			var tangent_speed = 16.0 * orbit_radius
			flail.set_orbit_mode(true, orbit_pos, tangent_dir * tangent_speed)
	else:
		if is_spinning:
			is_spinning = false
			flail.set_orbit_mode(false)
	
	# Precision Slingshot / Launch
	if whip_pressed and whip_cooldown <= 0.0:
		_execute_whip_crack()

func _execute_whip_crack() -> void:
	if not is_instance_valid(flail) or not flail.is_inside_tree() or not is_instance_valid(tether):
		return
	
	whip_cooldown = 0.35
	is_spinning = false
	flail.set_orbit_mode(false)
	
	var aim_target = _get_aim_target()
	var aim_dir = (aim_target - global_position).normalized()
	aim_dir.y = 0.0
	if aim_dir == Vector3.ZERO:
		aim_dir = -transform.basis.z.normalized()
	
	tether.apply_whip_pulse(aim_dir.cross(Vector3.UP), 2.5)
	flail.launch_ballistic(aim_dir, 52.0)
	velocity -= aim_dir * 3.5

func _get_aim_target() -> Vector3:
	if player_id == 1:
		var camera = get_viewport().get_camera_3d()
		if is_instance_valid(camera):
			var mouse_pos = get_viewport().get_mouse_position()
			var ray_origin = camera.project_ray_origin(mouse_pos)
			var ray_dir = camera.project_ray_normal(mouse_pos)
			if absf(ray_dir.y) > 0.001:
				var t = (1.0 - ray_origin.y) / ray_dir.y
				if t > 0.0:
					return ray_origin + ray_dir * t
	
	return global_position - transform.basis.z * 10.0

func take_damage(amount: float, _hit_position: Vector3 = Vector3.ZERO, impulse: Vector3 = Vector3.ZERO) -> void:
	current_health = maxf(0.0, current_health - amount)
	health_changed.emit(player_id, current_health, max_health)
	SoundManager.play_sfx("impact", 1.3, 1.0)
	
	if impulse != Vector3.ZERO:
		velocity += impulse * 0.4
	
	if current_health <= 0.0:
		_on_destroyed()

func _on_destroyed() -> void:
	SoundManager.play_sfx("shatter", 0.8, 3.0)
	drone_destroyed.emit(player_id)
	queue_free()
