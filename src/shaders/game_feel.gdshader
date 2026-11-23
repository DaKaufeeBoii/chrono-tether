shader_type canvas_item;

uniform float hit_flash : hint_range(0.0, 1.0) = 0.0;
uniform float chromatic_aberration : hint_range(0.0, 0.05) = 0.0;
uniform float vignette_intensity : hint_range(0.0, 1.0) = 0.0;
uniform sampler2D screen_texture : hint_screen_texture, filter_linear_mipmap;

void fragment() {
	vec2 uv = SCREEN_UV;
	
	// Chromatic aberration offset
	vec2 r_offset = vec2(chromatic_aberration, 0.0);
	vec2 b_offset = vec2(-chromatic_aberration, 0.0);
	
	float r = texture(screen_texture, uv + r_offset).r;
	float g = texture(screen_texture, uv).g;
	float b = texture(screen_texture, uv + b_offset).b;
	vec3 col = vec3(r, g, b);
	
	// Hit flash pulse
	col = mix(col, vec3(1.0, 1.0, 1.0), hit_flash * 0.7);
	
	// Vignette shockwave
	float d = distance(uv, vec2(0.5, 0.5));
	col = mix(col, vec3(0.0), smoothstep(0.4, 0.9, d) * vignette_intensity);
	
	COLOR = vec4(col, 1.0);
}
