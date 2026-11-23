extends StaticBody3D
class_name BreakableWall3D

@export var max_health: float = 65.0
@export var crate_size: Vector3 = Vector3(2.0, 2.0, 2.0)

var current_health: float = 65.0

signal wall_broken_3d(pos: Vector3)

func _ready() -> void:
	current_health = max_health

func take_damage(amount: float, _hit_position: Vector3 = Vector3.ZERO, _impulse: Vector3 = Vector3.ZERO) -> void:
	current_health -= amount
	SoundManager.play_sfx("impact", 0.9, 1.0)
	
	if current_health <= 0.0:
		_break_apart()

func _break_apart() -> void:
	SoundManager.play_sfx("shatter", 1.0, 3.0)
	wall_broken_3d.emit(global_position)
	queue_free()
