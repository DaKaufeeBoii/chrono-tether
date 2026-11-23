extends Camera3D
class_name CameraTracker3D

@export var min_distance: float = 18.0
@export var max_distance: float = 38.0
@export var pitch_angle: float = -58.0
@export var smooth_speed: float = 5.5

var trauma: float = 0.0
var max_shake_offset: float = 0.8
var max_shake_rot: float = 0.04

func _ready() -> void:
	current = true

func add_trauma(amount: float) -> void:
	trauma = clampf(trauma + amount, 0.0, 1.0)

func _physics_process(delta: float) -> void:
	_update_tracking(delta)
	_apply_screen_shake(delta)

func _update_tracking(delta: float) -> void:
	var targets = get_tree().get_nodes_in_group("drones_3d")
	if targets.is_empty():
		return
	
	var center = Vector3.ZERO
	var span = 0.0
	
	if targets.size() == 1:
		var target = targets[0] as Node3D
		if is_instance_valid(target):
			center = target.global_position
			span = 0.0
	else:
		var min_pos = Vector3(INF, 0, INF)
		var max_pos = Vector3(-INF, 0, -INF)
		for t in targets:
			if is_instance_valid(t):
				var p = (t as Node3D).global_position
				min_pos.x = minf(min_pos.x, p.x)
				min_pos.z = minf(min_pos.z, p.z)
				max_pos.x = maxf(max_pos.x, p.x)
				max_pos.z = maxf(max_pos.z, p.z)
		center = (min_pos + max_pos) * 0.5
		span = max_pos.distance_to(min_pos)
	
	var dist = clampf(min_distance + span * 0.75, min_distance, max_distance)
	var desired_cam_pos = center + Vector3(0, dist * 0.9, dist * 0.55)
	global_position = global_position.lerp(desired_cam_pos, smooth_speed * delta)
	look_at(center + Vector3(0, 1.0, 0), Vector3.UP)

func _apply_screen_shake(delta: float) -> void:
	if trauma > 0.0:
		trauma = maxf(0.0, trauma - delta * 1.8)
		var shake = trauma * trauma
		h_offset = max_shake_offset * shake * randf_range(-1.0, 1.0)
		v_offset = max_shake_offset * shake * randf_range(-1.0, 1.0)
	else:
		h_offset = 0.0
		v_offset = 0.0
