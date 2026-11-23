extends StaticBody2D
class_name Turret

@export var max_health: float = 75.0
@export var fire_rate: float = 2.2
@export var detection_range: float = 650.0

signal turret_destroyed

var current_health: float = 75.0
var fire_timer: float = 1.0
var target_drone: Drone = null

func _ready() -> void:
	current_health = max_health

func _physics_process(delta: float) -> void:
	_find_nearest_drone()
	
	if is_instance_valid(target_drone):
		var target_angle = (target_drone.global_position - global_position).angle()
		rotation = lerp_angle(rotation, target_angle, 0.08)
		
		fire_timer -= delta
		if fire_timer <= 0.0:
			fire_timer = fire_rate
			_fire_plasma()
	
	queue_redraw()

func _find_nearest_drone() -> void:
	var drones = get_tree().get_nodes_in_group("drones")
	var closest_dist = detection_range
	target_drone = null
	for d in drones:
		if is_instance_valid(d):
			var dist = global_position.distance_to(d.global_position)
			if dist < closest_dist:
				closest_dist = dist
				target_drone = d

func _fire_plasma() -> void:
	var proj_script = load("res://src/entities/enemies/PlasmaProjectile.gd")
	var proj = Area2D.new()
	proj.set_script(proj_script)
	
	var col = CollisionShape2D.new()
	var shape = CircleShape2D.new()
	shape.radius = 8.0
	col.shape = shape
	proj.add_child(col)
	
	proj.global_position = global_position + Vector2.RIGHT.rotated(rotation) * 28.0
	get_parent().add_child(proj)
	proj.launch(Vector2.RIGHT.rotated(rotation))
	SoundManager.play_sfx("whip_crack", 1.8, -4.0)

func take_damage(amount: float, hit_position: Vector2 = Vector2.ZERO, impulse: Vector2 = Vector2.ZERO) -> void:
	current_health -= amount
	SoundManager.play_sfx("impact", 1.1, 2.0)
	
	if current_health <= 0.0:
		_destroy()
	else:
		queue_redraw()

func _destroy() -> void:
	turret_destroyed.emit()
	SoundManager.play_sfx("shatter", 0.9, 4.0)
	GameManager.add_score(1, 250)
	queue_free()

func _draw() -> void:
	# Base hexagonal turret stand
	draw_circle(Vector2.ZERO, 20.0, Color(0.25, 0.25, 0.3, 1.0))
	draw_circle(Vector2.ZERO, 14.0, Color(0.8, 0.25, 0.2, 1.0))
	# Cannon barrel
	var barrel_rect = Rect2(Vector2(6, -5), Vector2(18, 10))
	draw_rect(barrel_rect, Color(0.15, 0.15, 0.2, 1.0))
