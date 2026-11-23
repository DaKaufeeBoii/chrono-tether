shader_type spatial;
render_mode blend_add, unshaded, cull_disabled;

uniform vec4 core_color : source_color = vec4(1.0, 1.0, 1.0, 1.0);
uniform vec4 glow_color : source_color = vec4(0.1, 0.8, 1.0, 1.0);
uniform float pulse_speed : hint_range(1.0, 20.0) = 8.0;
uniform float tension : hint_range(0.0, 2.0) = 0.0;

void fragment() {
	float pulse = 0.8 + 0.2 * sin(TIME * pulse_speed);
	vec4 final_glow = mix(glow_color, vec4(1.0, 0.3, 0.1, 1.0), clamp(tension - 0.7, 0.0, 1.0));
	ALBEDO = mix(core_color.rgb, final_glow.rgb, 0.6) * pulse * 1.5;
	ALPHA = final_glow.a * pulse;
}
