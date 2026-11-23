extends Area3D
class_name PlasmaProjectile3D

@export var speed: float = 16.0
@export var damage: float = 20.0

var velocity: Vector3 = Vector3.ZERO
var lifetime: float = 4.0
var is_deflected: bool = false

var projectile_mesh: MeshInstance3D = null

func _ready() -> void:
	body_entered.connect(_on_body_entered)

func launch(dir: Vector3) -> void:
	velocity = dir.normalized() * speed

func _physics_process(delta: float) -> void:
	global_position += velocity * delta
	lifetime -= delta
	if lifetime <= 0.0:
		queue_free()

func _on_body_entered(body: Node) -> void:
	if body is Flail3D:
		# Deflected by the spinning 3D flail!
		is_deflected = true
		velocity = -velocity * 1.5
		SoundManager.play_sfx("clash", 1.4, 2.5)
		_apply_deflected_visuals()
		return
	
	if body is Drone3D:
		if not is_deflected:
			body.take_damage(damage, global_position, velocity)
			queue_free()
		return
	
	if body is Turret3D:
		# Empowered return strike!
		var impact_dmg = damage * 2.5 if is_deflected else damage
		body.take_damage(impact_dmg, global_position, velocity)
		SoundManager.play_sfx("impact", 1.3, 3.0)
		queue_free()
		return
	
	if body is ReactorCore3D:
		body.take_damage(damage * 1.5, global_position, velocity)
		queue_free()
		return
	
	if body is BreakableWall3D:
		body.take_damage(damage, global_position)
		queue_free()
		return
	
	if body is StaticBody3D:
		queue_free()

func _apply_deflected_visuals() -> void:
	for child in get_children():
		if child is MeshInstance3D:
			var mat = StandardMaterial3D.new()
			mat.albedo_color = Color(0.1, 0.9, 1.0, 1.0)
			mat.emission_enabled = true
			mat.emission = Color(0.1, 0.9, 1.0, 1.0)
			mat.emission_energy_multiplier = 4.0
			child.material_override = mat
