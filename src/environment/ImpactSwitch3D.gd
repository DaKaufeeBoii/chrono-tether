extends StaticBody3D
class_name ImpactSwitch3D

@export var is_active: bool = false
@export var switch_color_inactive: Color = Color(0.9, 0.2, 0.2, 1.0)
@export var switch_color_active: Color = Color(0.1, 0.95, 0.3, 1.0)

signal switch_activated_3d

func on_hit_by_flail(_damage: float, velocity: Vector3) -> void:
	if is_active:
		return
	
	if velocity.length() > 7.0:
		_activate()

func take_damage(_amount: float, _hit_position: Vector3 = Vector3.ZERO, _impulse: Vector3 = Vector3.ZERO) -> void:
	if not is_active:
		_activate()

func _activate() -> void:
	is_active = true
	SoundManager.play_sfx("clash", 1.4, 2.0)
	switch_activated_3d.emit()
	
	var ring_mesh = $RingMesh as MeshInstance3D
	if is_instance_valid(ring_mesh):
		var mat = StandardMaterial3D.new()
		mat.albedo_color = switch_color_active
		mat.emission_enabled = true
		mat.emission = switch_color_active
		mat.emission_energy_multiplier = 3.0
		ring_mesh.material_override = mat
