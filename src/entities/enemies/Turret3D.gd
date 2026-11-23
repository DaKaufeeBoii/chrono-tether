extends StaticBody3D
class_name Turret3D

@export var max_health: float = 80.0
@export var fire_rate: float = 2.2
@export var detection_range: float = 30.0

signal turret_destroyed_3d

var current_health: float = 80.0
var fire_timer: float = 1.0
var target_drone: Drone3D = null

func _ready() -> void:
	current_health = max_health

func _physics_process(delta: float) -> void:
	_find_nearest_drone()
	
	if is_instance_valid(target_drone):
		var target_pos = target_drone.global_position
		target_pos.y = global_position.y
		var look_dir = (target_pos - global_position).normalized()
		if look_dir != Vector3.ZERO:
			var target_rot = atan2(-look_dir.x, -look_dir.z)
			rotation.y = lerp_angle(rotation.y, target_rot, 0.08)
		
		fire_timer -= delta
		if fire_timer <= 0.0:
			fire_timer = fire_rate
			_fire_plasma()

func _find_nearest_drone() -> void:
	var drones = get_tree().get_nodes_in_group("drones_3d")
	var closest_dist = detection_range
	target_drone = null
	for d in drones:
		if is_instance_valid(d):
			var dist = global_position.distance_to(d.global_position)
			if dist < closest_dist:
				closest_dist = dist
				target_drone = d

func _fire_plasma() -> void:
	var proj = Area3D.new()
	var proj_script = load("res://src/entities/enemies/PlasmaProjectile3D.gd")
	proj.set_script(proj_script)
	
	var col = CollisionShape3D.new()
	var shape = SphereShape3D.new()
	shape.radius = 0.35
	col.shape = shape
	proj.add_child(col)
	
	var mesh = MeshInstance3D.new()
	var sphere = SphereMesh.new()
	sphere.radius = 0.35
	sphere.height = 0.7
	var mat = StandardMaterial3D.new()
	mat.albedo_color = Color(1.0, 0.25, 0.2, 1.0)
	mat.emission_enabled = true
	mat.emission = Color(1.0, 0.3, 0.2, 1.0)
	mat.emission_energy_multiplier = 2.5
	sphere.material = mat
	mesh.mesh = sphere
	proj.add_child(mesh)
	
	var forward = -transform.basis.z.normalized()
	get_parent().add_child(proj)
	proj.global_position = global_position + forward * 1.5 + Vector3(0, 0.4, 0)
	proj.launch(forward)
	SoundManager.play_sfx("whip_crack", 1.8, -4.0)

func take_damage(amount: float, _hit_position: Vector3 = Vector3.ZERO, _impulse: Vector3 = Vector3.ZERO) -> void:
	current_health -= amount
	SoundManager.play_sfx("impact", 1.1, 2.0)
	
	if current_health <= 0.0:
		_destroy()

func _destroy() -> void:
	turret_destroyed_3d.emit()
	SoundManager.play_sfx("shatter", 0.9, 4.0)
	GameManager.add_score(1, 250)
	queue_free()
