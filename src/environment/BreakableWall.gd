extends StaticBody2D
class_name BreakableWall

@export var max_health: float = 60.0
@export var wall_size: Vector2 = Vector2(64, 64)
@export var wall_color: Color = Color(0.4, 0.45, 0.5, 1.0)

var current_health: float = 60.0

signal wall_broken(pos: Vector2)

func _ready() -> void:
	current_health = max_health

func take_damage(amount: float, hit_position: Vector2 = Vector2.ZERO, impulse: Vector2 = Vector2.ZERO) -> void:
	current_health -= amount
	SoundManager.play_sfx("impact", 0.9, 1.0)
	
	if current_health <= 0.0:
		_break_apart()
	else:
		queue_redraw()

func _break_apart() -> void:
	SoundManager.play_sfx("shatter", 1.0, 3.0)
	wall_broken.emit(global_position)
	queue_free()

func _draw() -> void:
	var rect = Rect2(-wall_size * 0.5, wall_size)
	draw_rect(rect, wall_color)
	draw_rect(rect, Color(0.2, 0.22, 0.25, 1.0), false, 2.0)
	
	# Draw fracture cracks if damaged
	if current_health < max_health:
		var crack_ratio = 1.0 - (current_health / max_health)
		var p1 = -wall_size * 0.3
		var p2 = wall_size * 0.2
		draw_line(p1, p2, Color(1.0, 0.8, 0.2, crack_ratio), 2.0)
