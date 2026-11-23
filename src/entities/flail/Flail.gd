extends RigidBody2D
class_name Flail

@export var player_id: int = 1
@export var base_damage: float = 35.0
@export var min_impact_speed: float = 180.0
@export var max_impact_speed: float = 900.0
@export var flail_radius: float = 16.0
@export var flail_color: Color = Color(0.9, 0.75, 0.1, 1.0) # Golden Nano Banana styling

var tether: Tether = null
var current_speed: float = 0.0

signal flail_impact(position: Vector2, speed: float)

func _ready() -> void:
	contact_monitor = true
	max_contacts_reported = 4
	mass = 3.5
	gravity_scale = 0.0
	linear_damp = 0.8
	body_entered.connect(_on_body_entered)

func set_tether(t: Tether) -> void:
	tether = t

func _physics_process(delta: float) -> void:
	current_speed = linear_velocity.length()
	if is_instance_valid(tether):
		var spring_force = tether.get_flail_pull_force()
		apply_central_force(spring_force)
	queue_redraw()

func _on_body_entered(body: Node) -> void:
	if current_speed < min_impact_speed:
		return
	
	var damage = (current_speed / max_impact_speed) * base_damage
	damage = clampf(damage, 10.0, 100.0)
	
	flail_impact.emit(global_position, current_speed)
	
	if body is Flail and body != self:
		# Mid-air flail clash
		SoundManager.play_sfx("clash", 1.0, 3.0)
		var bounce_dir = (global_position - body.global_position).normalized()
		apply_central_impulse(bounce_dir * current_speed * 0.8)
		return
	
	SoundManager.play_sfx("impact", clampf(1.4 - (current_speed / 1000.0), 0.6, 1.4), 2.0)
	
	if body.has_method("take_damage"):
		body.take_damage(damage, global_position, linear_velocity.normalized() * current_speed)
	elif body.has_method("on_hit_by_flail"):
		body.on_hit_by_flail(damage, linear_velocity)

func apply_whip_thrust(impulse_direction: Vector2, power: float) -> void:
	apply_central_impulse(impulse_direction * power)

func _draw() -> void:
	# Core metallic orb
	draw_circle(Vector2.ZERO, flail_radius, flail_color)
	draw_circle(Vector2.ZERO, flail_radius * 0.6, Color(1.0, 1.0, 1.0, 0.8))
	
	# Draw spikes along perimeter
	var spike_count: int = 8
	var spike_len: float = flail_radius * 0.6
	for i in range(spike_count):
		var angle = (float(i) / float(spike_count)) * TAU
		var dir = Vector2(cos(angle), sin(angle))
		var p1 = dir * flail_radius
		var p2 = dir * (flail_radius + spike_len)
		var p_left = Vector2(-dir.y, dir.x) * 4.0
		var spike_poly = PackedVector2Array([p1 - p_left, p2, p1 + p_left])
		draw_colored_polygon(spike_poly, Color(0.2, 0.2, 0.25, 1.0))
