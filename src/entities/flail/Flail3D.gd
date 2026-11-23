extends RigidBody3D
class_name Flail3D

@export var player_id: int = 1
@export var base_damage: float = 50.0
@export var min_impact_speed: float = 4.0
@export var max_impact_speed: float = 40.0
@export var flail_radius: float = 0.65

enum State { TOW, ORBIT, LAUNCHED, RECALL }
var current_state: State = State.TOW

var tether: Tether3D = null
var current_speed: float = 0.0
var ballistic_time: float = 0.0
var orbit_target_pos: Vector3 = Vector3.ZERO
var orbit_tangent_vel: Vector3 = Vector3.ZERO

var core_mesh: MeshInstance3D = null
var base_material: StandardMaterial3D = null

signal flail_impact_3d(pos: Vector3, speed: float)

func _ready() -> void:
	contact_monitor = true
	max_contacts_reported = 4
	mass = 3.0
	gravity_scale = 0.0
	linear_damp = 0.45
	angular_damp = 0.6
	continuous_cd = true
	axis_lock_linear_y = true
	axis_lock_angular_x = true
	axis_lock_angular_z = true
	
	var phys_mat = PhysicsMaterial.new()
	phys_mat.bounce = 0.55
	phys_mat.friction = 0.15
	physics_material_override = phys_mat
	
	body_entered.connect(_on_body_entered)
	_setup_visuals()

func _setup_visuals() -> void:
	core_mesh = $CoreMesh as MeshInstance3D
	if is_instance_valid(core_mesh) and core_mesh.mesh is SphereMesh:
		var s_mesh = core_mesh.mesh as SphereMesh
		if is_instance_valid(s_mesh.material) and s_mesh.material is StandardMaterial3D:
			base_material = s_mesh.material.duplicate() as StandardMaterial3D
			match player_id:
				1:
					base_material.albedo_color = Color(1.0, 0.8, 0.1, 1.0)
					base_material.emission = Color(1.0, 0.65, 0.05, 1.0)
				2:
					base_material.albedo_color = Color(0.1, 0.85, 1.0, 1.0)
					base_material.emission = Color(0.1, 0.75, 1.0, 1.0)
			core_mesh.material_override = base_material

func set_tether(t: Tether3D) -> void:
	tether = t

func set_orbit_mode(active: bool, target_pos: Vector3 = Vector3.ZERO, target_vel: Vector3 = Vector3.ZERO) -> void:
	if active:
		current_state = State.ORBIT
		orbit_target_pos = target_pos
		orbit_tangent_vel = target_vel
		if is_instance_valid(base_material):
			base_material.emission_energy_multiplier = 3.5
	else:
		if current_state == State.ORBIT:
			current_state = State.TOW
			if is_instance_valid(base_material):
				base_material.emission_energy_multiplier = 1.0

func launch_ballistic(aim_dir: Vector3, launch_speed: float) -> void:
	current_state = State.LAUNCHED
	ballistic_time = 0.4
	linear_velocity = aim_dir * launch_speed
	if is_instance_valid(base_material):
		base_material.emission_energy_multiplier = 5.0
	SoundManager.play_sfx("whip_crack", 1.3, 3.0)

func recall_towards(target_drone_pos: Vector3, delta: float) -> void:
	current_state = State.RECALL
	var to_drone = (target_drone_pos - global_position)
	to_drone.y = 0.0
	var dist = to_drone.length()
	
	if dist < 2.5:
		current_state = State.ORBIT
	else:
		linear_velocity = linear_velocity.move_toward(to_drone.normalized() * 32.0, 75.0 * delta)
		if is_instance_valid(base_material):
			base_material.emission_energy_multiplier = 2.8

func _physics_process(delta: float) -> void:
	current_speed = linear_velocity.length()
	
	match current_state:
		State.ORBIT:
			# Direct orbital tracking: eliminates spring oscillation fighting
			var offset_err = (orbit_target_pos - global_position)
			offset_err.y = 0.0
			linear_velocity = orbit_tangent_vel + offset_err * 24.0
		
		State.LAUNCHED:
			ballistic_time -= delta
			if ballistic_time <= 0.0:
				current_state = State.TOW
				if is_instance_valid(base_material):
					base_material.emission_energy_multiplier = 1.0
		
		State.RECALL:
			pass
		
		State.TOW:
			if is_instance_valid(tether):
				var spring_force = tether.get_flail_pull_force()
				apply_central_force(spring_force)
			if is_instance_valid(base_material) and base_material.emission_energy_multiplier > 1.0:
				base_material.emission_energy_multiplier = move_toward(base_material.emission_energy_multiplier, 1.0, delta * 3.0)

func _on_body_entered(body: Node) -> void:
	if current_speed < min_impact_speed:
		return
	
	var is_critical: bool = (current_state == State.LAUNCHED or current_speed > 28.0)
	var speed_ratio = clampf(current_speed / max_impact_speed, 0.1, 1.6)
	var damage = speed_ratio * base_damage * (1.6 if is_critical else 1.0)
	damage = clampf(damage, 15.0, 150.0)
	
	flail_impact_3d.emit(global_position, current_speed)
	_trigger_hit_stop(0.045 if is_critical else 0.03)
	
	if body is Flail3D and body != self:
		SoundManager.play_sfx("clash", 1.0, 4.0)
		var bounce_dir = (global_position - body.global_position).normalized()
		apply_central_impulse(bounce_dir * current_speed * 0.9)
		return
	
	var pitch = clampf(1.4 - (current_speed / 45.0), 0.6, 1.4)
	SoundManager.play_sfx("impact", pitch, 3.0 if is_critical else 2.0)
	
	var impulse = linear_velocity.normalized() * current_speed
	if body.has_method("take_damage"):
		body.take_damage(damage, global_position, impulse)
	elif body.has_method("on_hit_by_flail"):
		body.on_hit_by_flail(damage, linear_velocity)
	
	# If launched, hitting an obstacle immediately consumes ballistic momentum
	if current_state == State.LAUNCHED:
		current_state = State.TOW

func _trigger_hit_stop(duration: float) -> void:
	Engine.time_scale = 0.12
	var timer = get_tree().create_timer(duration, true, false, true)
	timer.timeout.connect(func(): Engine.time_scale = 1.0)

func apply_whip_thrust(impulse_direction: Vector3, power: float) -> void:
	apply_central_impulse(impulse_direction * power)
