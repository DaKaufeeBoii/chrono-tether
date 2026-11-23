extends Area2D
class_name PlasmaProjectile

@export var speed: float = 320.0
@export var damage: float = 20.0
@export var projectile_color: Color = Color(1.0, 0.3, 0.2, 1.0)

var velocity: Vector2 = Vector2.ZERO
var lifetime: float = 4.0

func _ready() -> void:
	body_entered.connect(_on_body_entered)

func launch(dir: Vector2) -> void:
	velocity = dir.normalized() * speed
	rotation = dir.angle()

func _physics_process(delta: float) -> void:
	position += velocity * delta
	lifetime -= delta
	if lifetime <= 0.0:
		queue_free()
	queue_redraw()

func _on_body_entered(body: Node) -> void:
	if body is Flail:
		# Deflected by the spinning flail!
		velocity = -velocity * 1.4
		projectile_color = Color(0.2, 0.9, 1.0, 1.0)
		SoundManager.play_sfx("clash", 1.3, 2.0)
		return
	
	if body is Drone:
		body.take_damage(damage, global_position, velocity)
		queue_free()
	elif body is BreakableWall:
		body.take_damage(damage, global_position)
		queue_free()
	elif body is StaticBody2D:
		queue_free()

func _draw() -> void:
	draw_circle(Vector2.ZERO, 6.0, projectile_color)
	draw_circle(Vector2.ZERO, 3.0, Color(1.0, 1.0, 1.0, 0.9))
