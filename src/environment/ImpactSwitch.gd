extends StaticBody2D
class_name ImpactSwitch

@export var is_active: bool = false
@export var switch_color_inactive: Color = Color(0.8, 0.2, 0.2, 1.0)
@export var switch_color_active: Color = Color(0.1, 0.9, 0.3, 1.0)

signal switch_activated

func on_hit_by_flail(damage: float, velocity: Vector2) -> void:
	if is_active:
		return
	
	if velocity.length() > 220.0:
		is_active = true
		SoundManager.play_sfx("clash", 1.4, 2.0)
		switch_activated.emit()
		queue_redraw()

func take_damage(amount: float, hit_position: Vector2 = Vector2.ZERO, impulse: Vector2 = Vector2.ZERO) -> void:
	if not is_active:
		is_active = true
		SoundManager.play_sfx("clash", 1.4, 2.0)
		switch_activated.emit()
		queue_redraw()

func _draw() -> void:
	var color = switch_color_active if is_active else switch_color_inactive
	draw_circle(Vector2.ZERO, 22.0, Color(0.2, 0.2, 0.25, 1.0))
	draw_circle(Vector2.ZERO, 16.0, color)
	draw_circle(Vector2.ZERO, 8.0, Color(1.0, 1.0, 1.0, 0.8 if is_active else 0.3))
