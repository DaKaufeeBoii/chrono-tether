extends Area3D
class_name WarpGate3D

@export var is_open: bool = false

var col_shape: CollisionShape3D = null

signal player_escaped

func _ready() -> void:
	col_shape = $CollisionShape3D if has_node("CollisionShape3D") else null
	body_entered.connect(_on_body_entered)
	visible = is_open
	if is_instance_valid(col_shape):
		col_shape.disabled = not is_open

func open_gate() -> void:
	if is_open:
		return
	is_open = true
	visible = true
	if is_instance_valid(col_shape):
		col_shape.disabled = false
	
	scale = Vector3(0.05, 0.05, 0.05)
	var tween = create_tween()
	tween.tween_property(self, "scale", Vector3(1.0, 1.0, 1.0), 0.7).set_trans(Tween.TRANS_ELASTIC).set_ease(Tween.EASE_OUT)
	SoundManager.play_sfx("boost", 1.5, 4.0)

func _physics_process(delta: float) -> void:
	if is_open:
		rotate_y(delta * 2.0)

func _on_body_entered(body: Node) -> void:
	if not is_open:
		return
	if body is Drone3D:
		SoundManager.play_sfx("boost", 1.8, 4.0)
		player_escaped.emit()
