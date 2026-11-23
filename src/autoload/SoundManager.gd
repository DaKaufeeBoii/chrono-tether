extends Node

var players: Array[AudioStreamPlayer] = []
var max_players: int = 8

var sample_rate: int = 22050
var sfx_library: Dictionary = {}

func _ready() -> void:
	for i in range(max_players):
		var p = AudioStreamPlayer.new()
		add_child(p)
		players.append(p)
	_generate_procedural_sfx()

func _generate_procedural_sfx() -> void:
	sfx_library["whip_crack"] = _create_whip_sound()
	sfx_library["impact"] = _create_impact_sound()
	sfx_library["clash"] = _create_clash_sound()
	sfx_library["shatter"] = _create_shatter_sound()
	sfx_library["boost"] = _create_boost_sound()

func play_sfx(sound_name: String, pitch_scale: float = 1.0, volume_db: float = 0.0) -> void:
	if not is_inside_tree() or not sfx_library.has(sound_name):
		return
	for p in players:
		if is_instance_valid(p) and p.is_inside_tree() and not p.playing:
			p.stream = sfx_library[sound_name]
			p.pitch_scale = clampf(pitch_scale + randf_range(-0.08, 0.08), 0.5, 2.0)
			p.volume_db = volume_db
			p.play()
			return
	if players.size() > 0 and is_instance_valid(players[0]) and players[0].is_inside_tree():
		players[0].stream = sfx_library[sound_name]
		players[0].pitch_scale = pitch_scale
		players[0].volume_db = volume_db
		players[0].play()

func _create_whip_sound() -> AudioStreamWAV:
	var duration: float = 0.25
	var num_samples: int = int(duration * sample_rate)
	var data: PackedByteArray = PackedByteArray()
	data.resize(num_samples)
	for i in range(num_samples):
		var t: float = float(i) / sample_rate
		var env: float = exp(-t * 22.0)
		var freq: float = 800.0 * (1.0 - t / duration) + 60.0
		var tone: float = sin(2.0 * PI * freq * t)
		var noise: float = (randf() * 2.0 - 1.0) * exp(-t * 30.0)
		var val: float = clampf((tone * 0.4 + noise * 0.8) * env, -1.0, 1.0)
		var sample_byte: int = clampi(int((val * 0.5 + 0.5) * 255.0), 0, 255)
		data[i] = sample_byte
	
	var wav: AudioStreamWAV = AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_8_BITS
	wav.mix_rate = sample_rate
	wav.stereo = false
	wav.data = data
	return wav

func _create_impact_sound() -> AudioStreamWAV:
	var duration: float = 0.35
	var num_samples: int = int(duration * sample_rate)
	var data: PackedByteArray = PackedByteArray()
	data.resize(num_samples)
	for i in range(num_samples):
		var t: float = float(i) / sample_rate
		var env: float = exp(-t * 12.0)
		var tone: float = sin(2.0 * PI * 110.0 * t) + 0.5 * sin(2.0 * PI * 55.0 * t)
		var click: float = (randf() * 2.0 - 1.0) * exp(-t * 80.0)
		var val: float = clampf((tone * 0.7 + click * 0.5) * env, -1.0, 1.0)
		var sample_byte: int = clampi(int((val * 0.5 + 0.5) * 255.0), 0, 255)
		data[i] = sample_byte
	
	var wav: AudioStreamWAV = AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_8_BITS
	wav.mix_rate = sample_rate
	wav.stereo = false
	wav.data = data
	return wav

func _create_clash_sound() -> AudioStreamWAV:
	var duration: float = 0.4
	var num_samples: int = int(duration * sample_rate)
	var data: PackedByteArray = PackedByteArray()
	data.resize(num_samples)
	for i in range(num_samples):
		var t: float = float(i) / sample_rate
		var env: float = exp(-t * 10.0)
		var metallic: float = sin(2.0 * PI * 880.0 * t) + sin(2.0 * PI * 1320.0 * t) + sin(2.0 * PI * 1760.0 * t)
		var val: float = clampf(metallic * 0.33 * env, -1.0, 1.0)
		var sample_byte: int = clampi(int((val * 0.5 + 0.5) * 255.0), 0, 255)
		data[i] = sample_byte
	
	var wav: AudioStreamWAV = AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_8_BITS
	wav.mix_rate = sample_rate
	wav.stereo = false
	wav.data = data
	return wav

func _create_shatter_sound() -> AudioStreamWAV:
	var duration: float = 0.3
	var num_samples: int = int(duration * sample_rate)
	var data: PackedByteArray = PackedByteArray()
	data.resize(num_samples)
	for i in range(num_samples):
		var t: float = float(i) / sample_rate
		var env: float = exp(-t * 14.0)
		var noise: float = (randf() * 2.0 - 1.0)
		var high_tone: float = sin(2.0 * PI * 2400.0 * t) * exp(-t * 25.0)
		var val: float = clampf((noise * 0.7 + high_tone * 0.4) * env, -1.0, 1.0)
		var sample_byte: int = clampi(int((val * 0.5 + 0.5) * 255.0), 0, 255)
		data[i] = sample_byte
	
	var wav: AudioStreamWAV = AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_8_BITS
	wav.mix_rate = sample_rate
	wav.stereo = false
	wav.data = data
	return wav

func _create_boost_sound() -> AudioStreamWAV:
	var duration: float = 0.2
	var num_samples: int = int(duration * sample_rate)
	var data: PackedByteArray = PackedByteArray()
	data.resize(num_samples)
	for i in range(num_samples):
		var t: float = float(i) / sample_rate
		var env: float = exp(-t * 10.0)
		var freq: float = 200.0 + 400.0 * (t / duration)
		var tone: float = sin(2.0 * PI * freq * t)
		var noise: float = (randf() * 2.0 - 1.0) * 0.3
		var val: float = clampf((tone * 0.5 + noise) * env, -1.0, 1.0)
		var sample_byte: int = clampi(int((val * 0.5 + 0.5) * 255.0), 0, 255)
		data[i] = sample_byte
	
	var wav: AudioStreamWAV = AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_8_BITS
	wav.mix_rate = sample_rate
	wav.stereo = false
	wav.data = data
	return wav
