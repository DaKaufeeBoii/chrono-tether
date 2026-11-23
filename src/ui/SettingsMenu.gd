extends PanelContainer
class_name SettingsMenu

@onready var master_slider: HSlider = $VBox/AudioGrid/MasterSlider
@onready var sfx_slider: HSlider = $VBox/AudioGrid/SFXSlider
@onready var fullscreen_check: CheckBox = $VBox/DisplayGrid/FullscreenCheck
@onready var vsync_check: CheckBox = $VBox/DisplayGrid/VsyncCheck
@onready var btn_close: Button = $VBox/BtnClose

func _ready() -> void:
	master_slider.value_changed.connect(_on_master_volume_changed)
	sfx_slider.value_changed.connect(_on_sfx_volume_changed)
	fullscreen_check.toggled.connect(_on_fullscreen_toggled)
	vsync_check.toggled.connect(_on_vsync_toggled)
	btn_close.pressed.connect(_on_close_pressed)

func _on_master_volume_changed(val: float) -> void:
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Master"), linear_to_db(val / 100.0))

func _on_sfx_volume_changed(val: float) -> void:
	SoundManager.play_sfx("clash", 1.0, linear_to_db(val / 100.0))

func _on_fullscreen_toggled(button_pressed: bool) -> void:
	if button_pressed:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
	else:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)

func _on_vsync_toggled(button_pressed: bool) -> void:
	DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_ENABLED if button_pressed else DisplayServer.VSYNC_DISABLED)

func _on_close_pressed() -> void:
	visible = false
