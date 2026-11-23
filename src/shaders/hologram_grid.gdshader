shader_type spatial;
render_mode blend_add, cull_disabled;

uniform vec4 barrier_color : source_color = vec4(0.1, 0.7, 1.0, 0.4);
uniform float grid_scale : hint_range(1.0, 50.0) = 15.0;
uniform float scan_speed : hint_range(0.1, 10.0) = 2.0;

void fragment() {
	vec2 uv = UV * grid_scale;
	vec2 grid = abs(fract(uv - 0.5) - 0.5) / fwidth(uv);
	float line = min(grid.x, grid.y);
	float c = 1.0 - min(line, 1.0);
	
	float scanline = sin((UV.y - TIME * scan_speed * 0.1) * 30.0) * 0.5 + 0.5;
	
	ALBEDO = barrier_color.rgb * (1.5 + scanline * 0.5);
	ALPHA = clamp((c * 0.7 + scanline * 0.3) * barrier_color.a, 0.0, 1.0);
	EMISSION = barrier_color.rgb * (c + scanline * 0.5) * 1.2;
}
