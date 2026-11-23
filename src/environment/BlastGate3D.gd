extends StaticBody3D
class_name BlastGate3D

@export var gate_color: Color = Color(1.0, 0.2, 0.2, 0.85)

var is_open: bool = false
var mesh_instance: MeshInstance3D = null
var collision_shape: CollisionShape3D = null

func _ready() -> void:
	add_to_group("blast_gates")
	collision_shape = $CollisionShape3D if has_node("CollisionShape3D") else null
	mesh_instance = $MeshInstance3D if has_node("MeshInstance3D") else null
	_setup_visuals()

func _setup_visuals() -> void:
	if not is_instance_valid(mesh_instance):
		mesh_instance = MeshInstance3D.new()
		var box = BoxMesh.new()
		box.size = Vector3(1.0, 4.0, 10.0)
		mesh_instance.mesh = box
		add_child(mesh_instance)
	
	if not is_instance_valid(collision_shape):
		collision_shape = CollisionShape3D.new()
		var box_shape = BoxShape3D.new()
		box_shape.size = Vector3(1.0, 4.0, 10.0)
		collision_shape.shape = box_shape
		add_child(collision_shape)
	
	var mat = StandardMaterial3D.new()
	mat.albedo_color = gate_color
	mat.emission_enabled = true
	mat.emission = gate_color
	mat.emission_energy_multiplier = 2.5
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mesh_instance.material_override = mat

func open_gate() -> void:
	if is_open:
		return
	is_open = true
	SoundManager.play_sfx("shatter", 1.4, 3.0)
	
	var tween = create_tween()
	tween.tween_property(self, "position:y", -3.5, 0.6).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_IN)
	tween.tween_callback(func():
		if is_instance_valid(collision_shape):
			collision_shape.disabled = true
	)
