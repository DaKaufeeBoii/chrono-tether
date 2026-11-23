extends Node2D
class_name Tether

@export var point_count: int = 12
@export var segment_length: float = 12.0
@export var constraint_iterations: int = 6
@export var damping: float = 0.98
@export var line_color: Color = Color(0.1, 0.8, 1.0, 0.9)
@export var core_color: Color = Color(1.0, 1.0, 1.0, 1.0)
@export var line_width: float = 4.0

var points: Array[Vector2] = []
var old_points: Array[Vector2] = []
var pinned_start: Vector2 = Vector2.ZERO
var pinned_end: Vector2 = Vector2.ZERO

var node_a: Node2D = null
var node_b: Node2D = null

var tension: float = 0.0
var max_length: float = 0.0

func _ready() -> void:
	max_length = point_count * segment_length
	points.resize(point_count)
	old_points.resize(point_count)
	var start_pos = global_position
	for i in range(point_count):
		points[i] = start_pos + Vector2(i * segment_length, 0)
		old_points[i] = points[i]

func attach(a: Node2D, b: Node2D) -> void:
	node_a = a
	node_b = b

func _physics_process(delta: float) -> void:
	if not is_instance_valid(node_a) or not is_instance_valid(node_b):
		return
	
	pinned_start = node_a.global_position
	pinned_end = node_b.global_position
	
	_simulate_verlet(delta)
	_apply_constraints()
	_calculate_tension()
	queue_redraw()

func _simulate_verlet(delta: float) -> void:
	for i in range(point_count):
		if i == 0 or i == point_count - 1:
			continue
		var velocity = (points[i] - old_points[i]) * damping
		old_points[i] = points[i]
		points[i] += velocity

func _apply_constraints() -> void:
	points[0] = pinned_start
	points[point_count - 1] = pinned_end
	
	for _iter in range(constraint_iterations):
		points[0] = pinned_start
		points[point_count - 1] = pinned_end
		
		for i in range(point_count - 1):
			var p1 = points[i]
			var p2 = points[i + 1]
			var delta_pos = p2 - p1
			var dist = delta_pos.length()
			if dist <= 0.001:
				continue
			var diff = (dist - segment_length) / dist
			var offset = delta_pos * 0.5 * diff
			
			if i != 0:
				points[i] += offset
			if i + 1 != point_count - 1:
				points[i + 1] -= offset

func _calculate_tension() -> void:
	var current_distance = (pinned_start - pinned_end).length()
	tension = clampf((current_distance / max_length), 0.0, 2.0)

func apply_whip_pulse(direction: Vector2, strength: float) -> void:
	for i in range(1, point_count - 1):
		var factor = sin((float(i) / float(point_count)) * PI)
		points[i] += direction * strength * factor
	SoundManager.play_sfx("whip_crack", 1.2, 2.0)

func get_flail_pull_force() -> Vector2:
	if points.size() < 2:
		return Vector2.ZERO
	var dir = (points[point_count - 2] - pinned_end)
	var dist = dir.length()
	if dist > segment_length:
		return dir.normalized() * (dist - segment_length) * 450.0
	return Vector2.ZERO

func _draw() -> void:
	if points.size() < 2:
		return
	
	# Draw glowing outer plasma rope
	var local_points: PackedVector2Array = PackedVector2Array()
	for p in points:
		local_points.append(to_local(p))
	
	# Dynamic color based on tension
	var current_color = line_color.lerp(Color(1.0, 0.3, 0.1, 1.0), clampf(tension - 0.7, 0.0, 1.0))
	draw_polyline(local_points, current_color, line_width + (tension * 1.5), true)
	# Inner bright energy core
	draw_polyline(local_points, core_color, line_width * 0.4, true)
