extends Control

@onready var btn_single: Button = $VBoxContainer/BtnSingle
@onready var btn_coop: Button = $VBoxContainer/BtnCoop
@onready var btn_versus: Button = $VBoxContainer/BtnVersus
@onready var btn_settings: Button = $VBoxContainer/BtnSettings
@onready var btn_quit: Button = $VBoxContainer/BtnQuit
@onready var settings_menu: Control = $SettingsMenu

func _ready() -> void:
	btn_single.pressed.connect(_on_single_pressed)
	btn_coop.pressed.connect(_on_coop_pressed)
	btn_versus.pressed.connect(_on_versus_pressed)
	btn_settings.pressed.connect(_on_settings_pressed)
	btn_quit.pressed.connect(_on_quit_pressed)
	settings_menu.visible = false

func _on_settings_pressed() -> void:
	SoundManager.play_sfx("clash", 1.2, 0.0)
	settings_menu.visible = true

func _on_single_pressed() -> void:
	SoundManager.play_sfx("whip_crack", 1.2, 0.0)
	GameManager.set_mode(GameManager.GameMode.SINGLE_PLAYER)
	GameManager.start_level("res://src/levels/Level3D_Campaign.tscn")

func _on_coop_pressed() -> void:
	SoundManager.play_sfx("whip_crack", 1.2, 0.0)
	GameManager.set_mode(GameManager.GameMode.COOP)
	GameManager.start_level("res://src/levels/Level3D_Coop.tscn")

func _on_versus_pressed() -> void:
	SoundManager.play_sfx("whip_crack", 1.2, 0.0)
	GameManager.set_mode(GameManager.GameMode.VERSUS)
	GameManager.start_level("res://src/levels/Level3D_Versus.tscn")

func _on_quit_pressed() -> void:
	get_tree().quit()
