extends Node3D
class_name Reticle3D

var aim_line_mesh: MeshInstance3D = null
var immediate_mesh: ImmediateMesh = null
var line_material: StandardMaterial3D = null

func _ready() -> void:
	aim_line_mesh = MeshInstance3D.new()
	immediate_mesh = ImmediateMesh.new()
	aim_line_mesh.mesh = immediate_mesh
	
	line_material = StandardMaterial3D.new()
	line_material.albedo_color = Color(0.1, 0.9, 1.0, 0.5)
	line_material.emission_enabled = true
	line_material.emission = Color(0.1, 0.85, 1.0, 1.0)
	line_material.emission_energy_multiplier = 2.0
	line_material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	line_material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	aim_line_mesh.material_override = line_material
	
	add_child(aim_line_mesh)

func _physics_process(delta: float) -> void:
	var camera = get_viewport().get_camera_3d()
	if not is_instance_valid(camera):
		return
	
	var mouse_pos = get_viewport().get_mouse_position()
	var ray_origin = camera.project_ray_origin(mouse_pos)
	var ray_dir = camera.project_ray_normal(mouse_pos)
	
	if absf(ray_dir.y) > 0.001:
		var t = (1.0 - ray_origin.y) / ray_dir.y
		if t > 0.0:
			global_position = ray_origin + ray_dir * t
			rotate_y(delta * 2.0)
	
	_update_aim_line()

func _update_aim_line() -> void:
	if not is_instance_valid(immediate_mesh):
		return
	
	var drones = get_tree().get_nodes_in_group("drones_3d")
	if drones.is_empty():
		immediate_mesh.clear_surfaces()
		return
	
	var p1: Drone3D = null
	for d in drones:
		if d is Drone3D and d.player_id == 1:
			p1 = d
			break
	
	if not is_instance_valid(p1) or not p1.is_inside_tree():
		immediate_mesh.clear_surfaces()
		return
	
	immediate_mesh.clear_surfaces()
	immediate_mesh.surface_begin(Mesh.PRIMITIVE_LINES)
	
	var local_start = to_local(p1.global_position)
	var local_end = to_local(global_position)
	
	immediate_mesh.surface_add_vertex(local_start)
	immediate_mesh.surface_add_vertex(local_end)
	
	immediate_mesh.surface_end()
