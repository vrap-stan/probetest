
#ifdef BOX_PROJECTED_ENV_MAP
uniform vec3 envMapSize;
uniform vec3 envMapPosition;
varying vec3 vWorldPosition;

vec3 parallaxCorrectNormal(vec3 v, vec3 cubeSize, vec3 cubePos) {
	vec3 nDir = normalize(v);

	vec3 rbmax = (.5 * cubeSize + cubePos - vWorldPosition) / nDir;
	vec3 rbmin = (-.5 * cubeSize + cubePos - vWorldPosition) / nDir;

	vec3 rbminmax;

	rbminmax.x = (nDir.x > 0.) ? rbmax.x : rbmin.x;
	rbminmax.y = (nDir.y > 0.) ? rbmax.y : rbmin.y;
	rbminmax.z = (nDir.z > 0.) ? rbmax.z : rbmin.z;

	float correction = min(min(rbminmax.x, rbminmax.y), rbminmax.z);
	vec3 boxIntersection = vWorldPosition + nDir * correction;

	vec3 retval = boxIntersection - cubePos;
        // retval.x = -retval.x;

	return retval;
}
#endif

#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
uniform float ior;
#endif
#ifdef USE_SPECULAR
uniform float specularIntensity;
uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
uniform float clearcoat;
uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
uniform float iridescence;
uniform float iridescenceIOR;
uniform float iridescenceThicknessMinimum;
uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
uniform vec3 sheenColor;
uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#ifdef USE_ENVMAP
vec3 getIBLIrradiance(const in vec3 normal) {
		#ifdef ENVMAP_TYPE_CUBE_UV

	vec3 worldNormal = inverseTransformDirection(normal, viewMatrix);

#ifdef BOX_PROJECTED_ENV_MAP
	worldNormal = parallaxCorrectNormal(worldNormal, envMapSize, envMapPosition);
#endif

	vec4 envMapColor = textureCubeUV(envMap, envMapRotation * worldNormal, 1.0);
	return PI * envMapColor.rgb * envMapIntensity;
		#else
	return vec3(0.0);
		#endif
}
vec3 getIBLRadiance(const in vec3 viewDir, const in vec3 normal, const in float roughness) {
		#ifdef ENVMAP_TYPE_CUBE_UV
	vec3 reflectVec = reflect(-viewDir, normal);
	reflectVec = normalize(mix(reflectVec, normal, roughness * roughness));

	reflectVec = inverseTransformDirection(reflectVec, viewMatrix);

#ifdef BOX_PROJECTED_ENV_MAP
	reflectVec = parallaxCorrectNormal(reflectVec, envMapSize, envMapPosition);
#endif

	vec4 envMapColor = textureCubeUV(envMap, envMapRotation * reflectVec, roughness);
	return envMapColor.rgb * envMapIntensity;
		#else
	return vec3(0.0);
		#endif
}
	#ifdef USE_ANISOTROPY
vec3 getIBLAnisotropyRadiance(const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy) {
			#ifdef ENVMAP_TYPE_CUBE_UV
	vec3 bentNormal = cross(bitangent, viewDir);
	bentNormal = normalize(cross(bentNormal, bitangent));
	bentNormal = normalize(mix(bentNormal, normal, pow2(pow2(1.0 - anisotropy * (1.0 - roughness)))));
	return getIBLRadiance(viewDir, bentNormal, roughness);
			#else
	return vec3(0.0);
			#endif
}
	#endif
#endif
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4(diffuse, opacity);
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight(vec3(0.0), vec3(0.0), vec3(0.0), vec3(0.0));
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
	float sheenEnergyComp = 1.0 - 0.157 * max3(material.sheenColor);
	outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
	float dotNVcc = saturate(dot(geometryClearcoatNormal, geometryViewDir));
	vec3 Fcc = F_Schlick(material.clearcoatF0, material.clearcoatF90, dotNVcc);
	outgoingLight = outgoingLight * (1.0 - material.clearcoat * Fcc) + (clearcoatSpecularDirect + clearcoatSpecularIndirect) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}