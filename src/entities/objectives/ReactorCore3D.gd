extends StaticBody3D
class_name ReactorCore3D

@export var max_health: float = 120.0
@export var core_color: Color = Color(1.0, 0.4, 0.1, 1.0)

var current_health: float = 120.0
var is_overloaded: bool = false
var is_shielded: bool = true

var shield_ring: Node3D = null
var core_mesh: MeshInstance3D = null
var core_mat: StandardMaterial3D = null

signal core_damaged(current: float, max_val: float)
signal core_destroyed(pos: Vector3)

func _ready() -> void:
	current_health = max_health
	shield_ring = $ShieldRing if has_node("ShieldRing") else null
	core_mesh = $CoreMesh if has_node("CoreMesh") else null
	if is_instance_valid(core_mesh) and core_mesh.mesh is SphereMesh:
		var s_mesh = core_mesh.mesh as SphereMesh
		if is_instance_valid(s_mesh.material) and s_mesh.material is StandardMaterial3D:
			core_mat = s_mesh.material.duplicate() as StandardMaterial3D
			core_mesh.material_override = core_mat
			_update_shield_visuals()

func _update_shield_visuals() -> void:
	if not is_instance_valid(core_mat):
		return
	if is_shielded:
		core_mat.albedo_color = Color(0.2, 0.5, 0.9, 1.0)
		core_mat.emission = Color(0.1, 0.6, 1.0, 1.0)
		core_mat.emission_energy_multiplier = 1.8
	else:
		core_mat.albedo_color = Color(1.0, 0.35, 0.05, 1.0)
		core_mat.emission = Color(1.0, 0.45, 0.1, 1.0)
		core_mat.emission_energy_multiplier = 4.0

func lower_shield() -> void:
	if not is_shielded:
		return
	is_shielded = false
	_update_shield_visuals()
	SoundManager.play_sfx("boost", 1.6, 3.0)
	
	if is_instance_valid(shield_ring):
		var tween = create_tween()
		tween.tween_property(shield_ring, "scale", Vector3(1.4, 1.4, 1.4), 0.5).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

func _physics_process(delta: float) -> void:
	if is_instance_valid(shield_ring):
		var rot_speed = 3.5 if not is_shielded else 1.2
		shield_ring.rotate_y(delta * rot_speed)

func take_damage(amount: float, _hit_position: Vector3 = Vector3.ZERO, _impulse: Vector3 = Vector3.ZERO) -> void:
	if is_overloaded:
		return
	
	if is_shielded:
		SoundManager.play_sfx("clash", 1.6, 2.5)
		return
	
	current_health = maxf(0.0, current_health - amount)
	SoundManager.play_sfx("impact", 0.7, 3.0)
	core_damaged.emit(current_health, max_health)
	
	if current_health <= 0.0:
		_overload()

func _overload() -> void:
	is_overloaded = true
	SoundManager.play_sfx("shatter", 0.6, 5.0)
	SoundManager.play_sfx("boost", 1.8, 4.0)
	GameManager.add_score(1, 1500)
	core_destroyed.emit(global_position)
	queue_free()
