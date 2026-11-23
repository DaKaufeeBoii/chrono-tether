extends Node3D
class_name WaypointArrow3D

var target_position: Vector3 = Vector3.ZERO
var has_target: bool = false
var pulse_time: float = 0.0

var arrow_mesh: MeshInstance3D = null
var arrow_material: StandardMaterial3D = null

func _ready() -> void:
	_create_arrow_mesh()
	visible = false

func _create_arrow_mesh() -> void:
	arrow_mesh = MeshInstance3D.new()
	var prism = PrismMesh.new()
	prism.size = Vector3(0.5, 0.7, 0.2)
	
	arrow_material = StandardMaterial3D.new()
	arrow_material.albedo_color = Color(1.0, 0.85, 0.1, 1.0)
	arrow_material.emission_enabled = true
	arrow_material.emission = Color(1.0, 0.8, 0.1, 1.0)
	arrow_material.emission_energy_multiplier = 2.5
	arrow_material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	
	prism.material = arrow_material
	arrow_mesh.mesh = prism
	
	# Rotate prism so apex points forward along -Z
	arrow_mesh.rotation_degrees = Vector3(-90, 0, 0)
	arrow_mesh.position = Vector3(0, 0.85, -1.2)
	add_child(arrow_mesh)

func set_target(pos: Vector3) -> void:
	target_position = pos
	has_target = true
	visible = true

func clear_target() -> void:
	has_target = false
	visible = false

func _process(delta: float) -> void:
	if not has_target:
		return
	
	pulse_time += delta * 4.0
	var look_dir = target_position - global_position
	look_dir.y = 0.0
	
	if look_dir.length_squared() > 0.01:
		var target_rot_y = atan2(-look_dir.x, -look_dir.z)
		rotation.y = lerp_angle(rotation.y, target_rot_y, 0.18)
	
	# Gentle hover bobbing and glow pulse
	if is_instance_valid(arrow_mesh):
		arrow_mesh.position.y = 0.85 + sin(pulse_time) * 0.08
	if is_instance_valid(arrow_material):
		arrow_material.emission_energy_multiplier = 2.2 + sin(pulse_time * 1.5) * 0.8
