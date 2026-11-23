extends Camera2D
class_name CameraTracker

@export var min_zoom: float = 0.65
@export var max_zoom: float = 1.25
@export var margin: Vector2 = Vector2(160, 160)
@export var smooth_speed: float = 6.0

var trauma: float = 0.0
var max_offset: float = 18.0
var max_roll: float = 0.05

func _ready() -> void:
	make_current()

func add_trauma(amount: float) -> void:
	trauma = clampf(trauma + amount, 0.0, 1.0)

func _physics_process(delta: float) -> void:
	_update_tracking(delta)
	_apply_screen_shake(delta)

func _update_tracking(delta: float) -> void:
	var targets = get_tree().get_nodes_in_group("drones")
	if targets.is_empty():
		return
	
	if targets.size() == 1:
		var target = targets[0] as Node2D
		if is_instance_valid(target):
			global_position = global_position.lerp(target.global_position, smooth_speed * delta)
			zoom = zoom.lerp(Vector2.ONE, smooth_speed * delta)
		return
	
	# Multi-target bounding box
	var min_pos = Vector2(INF, INF)
	var max_pos = Vector2(-INF, -INF)
	
	for t in targets:
		if is_instance_valid(t):
			var p = (t as Node2D).global_position
			min_pos.x = minf(min_pos.x, p.x)
			min_pos.y = minf(min_pos.y, p.y)
			max_pos.x = maxf(max_pos.x, p.x)
			max_pos.y = maxf(max_pos.y, p.y)
	
	var center = (min_pos + max_pos) * 0.5
	global_position = global_position.lerp(center, smooth_speed * delta)
	
	# Compute zoom to fit bounding box
	var vp_size = get_viewport_rect().size
	var size = (max_pos - min_pos) + margin * 2.0
	var z = minf(vp_size.x / maxf(size.x, 100.0), vp_size.y / maxf(size.y, 100.0))
	z = clampf(z, min_zoom, max_zoom)
	zoom = zoom.lerp(Vector2(z, z), smooth_speed * delta)

func _apply_screen_shake(delta: float) -> void:
	if trauma > 0.0:
		trauma = maxf(0.0, trauma - delta * 1.8)
		var shake = trauma * trauma
		offset.x = max_offset * shake * randf_range(-1.0, 1.0)
		offset.y = max_offset * shake * randf_range(-1.0, 1.0)
		rotation = max_roll * shake * randf_range(-1.0, 1.0)
	else:
		offset = Vector2.ZERO
		rotation = 0.0
