extends Node

enum GameMode {
	SINGLE_PLAYER,
	COOP,
	VERSUS
}

var current_mode: GameMode = GameMode.SINGLE_PLAYER
var player_scores: Dictionary = {1: 0, 2: 0, 3: 0, 4: 0}
var current_level_index: int = 1
var is_game_active: bool = false

signal score_updated(player_id: int, new_score: int)
signal game_over(winner_id: int)

func trigger_game_over(winner_id: int) -> void:
	game_over.emit(winner_id)

func set_mode(mode: GameMode) -> void:
	current_mode = mode
	reset_scores()

func reset_scores() -> void:
	player_scores = {1: 0, 2: 0, 3: 0, 4: 0}

func add_score(player_id: int, amount: int) -> void:
	if player_scores.has(player_id):
		player_scores[player_id] += amount
		score_updated.emit(player_id, player_scores[player_id])

func restart_current_scene() -> void:
	get_tree().reload_current_scene()

func go_to_main_menu() -> void:
	get_tree().change_scene_to_file("res://src/ui/MainMenu.tscn")

func start_level(level_path: String) -> void:
	is_game_active = true
	get_tree().change_scene_to_file(level_path)
