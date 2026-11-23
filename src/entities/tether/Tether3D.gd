extends Node3D
class_name Tether3D

@export var point_count: int = 12
@export var segment_length: float = 0.55
@export var constraint_iterations: int = 6
@export var damping: float = 0.98

var points: Array[Vector3] = []
var old_points: Array[Vector3] = []
var pinned_start: Vector3 = Vector3.ZERO
var pinned_end: Vector3 = Vector3.ZERO

var node_a: Node3D = null
var node_b: Node3D = null

var tension: float = 0.0
var max_length: float = 6.6

var mesh_instance: MeshInstance3D = null
var immediate_mesh: ImmediateMesh = null
var material: ShaderMaterial = null

func _ready() -> void:
	max_length = point_count * segment_length
	points.resize(point_count)
	old_points.resize(point_count)
	var start_pos = global_position
	for i in range(point_count):
		points[i] = start_pos + Vector3(i * segment_length, 0, 0)
		old_points[i] = points[i]
	
	_setup_rendering()

func _setup_rendering() -> void:
	mesh_instance = MeshInstance3D.new()
	immediate_mesh = ImmediateMesh.new()
	mesh_instance.mesh = immediate_mesh
	
	material = ShaderMaterial.new()
	var shader = load("res://src/shaders/tether_3d.gdshader")
	material.shader = shader
	mesh_instance.material_override = material
	
	add_child(mesh_instance)

func attach(a: Node3D, b: Node3D) -> void:
	node_a = a
	node_b = b

func _physics_process(_delta: float) -> void:
	if not is_instance_valid(node_a) or not is_instance_valid(node_b):
		return
	if not node_a.is_inside_tree() or not node_b.is_inside_tree():
		return
	
	pinned_start = node_a.global_position
	pinned_end = node_b.global_position
	
	_simulate_verlet()
	_apply_constraints()
	_calculate_tension()
	_render_tether()

func _simulate_verlet() -> void:
	for i in range(point_count):
		if i == 0 or i == point_count - 1:
			continue
		var velocity = (points[i] - old_points[i]) * damping
		old_points[i] = points[i]
		points[i] += velocity

func _apply_constraints() -> void:
	points[0] = pinned_start
	points[point_count - 1] = pinned_end
	
	for _iter in range(constraint_iterations):
		points[0] = pinned_start
		points[point_count - 1] = pinned_end
		
		for i in range(point_count - 1):
			var p1 = points[i]
			var p2 = points[i + 1]
			var delta_pos = p2 - p1
			var dist = delta_pos.length()
			if dist <= 0.0001:
				continue
			var diff = (dist - segment_length) / dist
			var offset = delta_pos * 0.5 * diff
			
			if i != 0:
				points[i] += offset
			if i + 1 != point_count - 1:
				points[i + 1] -= offset

func _calculate_tension() -> void:
	var current_distance = (pinned_start - pinned_end).length()
	tension = clampf((current_distance / max_length), 0.0, 2.0)
	if is_instance_valid(material):
		material.set_shader_parameter("tension", tension)

func apply_whip_pulse(direction: Vector3, strength: float) -> void:
	for i in range(1, point_count - 1):
		var factor = sin((float(i) / float(point_count)) * PI)
		points[i] += direction * strength * factor
	SoundManager.play_sfx("whip_crack", 1.2, 2.0)

func get_flail_pull_force() -> Vector3:
	var total_dir = (pinned_start - pinned_end)
	total_dir.y = 0.0
	var total_dist = total_dir.length()
	var rest_length = 3.5
	if total_dist > rest_length:
		var stretch = total_dist - rest_length
		var norm_dir = total_dir.normalized()
		
		var spring_force = norm_dir * (stretch * 160.0 + stretch * stretch * 25.0)
		
		if is_instance_valid(node_b) and node_b is RigidBody3D and is_instance_valid(node_a) and node_a is CharacterBody3D:
			var rel_vel = (node_b as RigidBody3D).linear_velocity - (node_a as CharacterBody3D).velocity
			var radial_vel = rel_vel.dot(norm_dir)
			spring_force -= norm_dir * (radial_vel * 12.0)
		
		return spring_force
	return Vector3.ZERO

func _render_tether() -> void:
	if not is_instance_valid(immediate_mesh) or points.size() < 2:
		return
	
	immediate_mesh.clear_surfaces()
	immediate_mesh.surface_begin(Mesh.PRIMITIVE_TRIANGLES)
	
	var half_w = 0.09 # 18cm thick visible glowing conduit
	for i in range(point_count - 1):
		var p1 = to_local(points[i])
		var p2 = to_local(points[i + 1])
		var seg_dir = (p2 - p1).normalized()
		if seg_dir == Vector3.ZERO:
			seg_dir = Vector3.FORWARD
		
		var side = seg_dir.cross(Vector3.UP).normalized() * half_w
		if side == Vector3.ZERO:
			side = Vector3.RIGHT * half_w
		var up_vec = Vector3.UP * half_w
		
		# Quad 1: Horizontal beam
		immediate_mesh.surface_add_vertex(p1 - side)
		immediate_mesh.surface_add_vertex(p1 + side)
		immediate_mesh.surface_add_vertex(p2 + side)
		
		immediate_mesh.surface_add_vertex(p1 - side)
		immediate_mesh.surface_add_vertex(p2 + side)
		immediate_mesh.surface_add_vertex(p2 - side)
		
		# Quad 2: Vertical beam (volumetric 3D cross)
		immediate_mesh.surface_add_vertex(p1 - up_vec)
		immediate_mesh.surface_add_vertex(p1 + up_vec)
		immediate_mesh.surface_add_vertex(p2 + up_vec)
		
		immediate_mesh.surface_add_vertex(p1 - up_vec)
		immediate_mesh.surface_add_vertex(p2 + up_vec)
		immediate_mesh.surface_add_vertex(p2 - up_vec)
	
	immediate_mesh.surface_end()
