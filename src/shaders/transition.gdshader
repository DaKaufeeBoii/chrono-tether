shader_type canvas_item;

uniform float progress : hint_range(0.0, 1.0) = 0.0;
uniform float diamond_size : hint_range(10.0, 100.0) = 40.0;
uniform vec4 transition_color : source_color = vec4(0.06, 0.07, 0.09, 1.0);

void fragment() {
	vec2 uv = SCREEN_UV;
	float x_fract = fract(uv.x * (1.0 / (diamond_size * SCREEN_PIXEL_SIZE.x)));
	float y_fract = fract(uv.y * (1.0 / (diamond_size * SCREEN_PIXEL_SIZE.y)));
	
	float dist = abs(x_fract - 0.5) + abs(y_fract - 0.5);
	if (dist < progress * 1.5) {
		COLOR = transition_color;
	} else {
		COLOR = vec4(0.0);
	}
}
