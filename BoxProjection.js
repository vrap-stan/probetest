import * as THREE from "three"
import Frag from "Frag";


// credits for the box-projecting shader code go to codercat (https://codercat.tk)

const worldposReplace = /* glsl */`
#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP )
    vec4 worldPosition = modelMatrix * vec4( transformed, 1.0 );

    #ifdef BOX_PROJECTED_ENV_MAP
        vWorldPosition = worldPosition.xyz;
    #endif
#endif
`;

const boxProjectDefinitions = /*glsl */`
#ifdef BOX_PROJECTED_ENV_MAP
    uniform vec3 envMapSize;
    uniform vec3 envMapPosition;
    varying vec3 vWorldPosition;
    
    vec3 parallaxCorrectNormal( vec3 v, vec3 cubeSize, vec3 cubePos ) {
        vec3 nDir = normalize( v );

        vec3 rbmax = ( .5 * cubeSize + cubePos - vWorldPosition ) / nDir;
        vec3 rbmin = ( -.5 * cubeSize + cubePos - vWorldPosition ) / nDir;

        vec3 rbminmax;

        rbminmax.x = ( nDir.x > 0. ) ? rbmax.x : rbmin.x;
        rbminmax.y = ( nDir.y > 0. ) ? rbmax.y : rbmin.y;
        rbminmax.z = ( nDir.z > 0. ) ? rbmax.z : rbmin.z;

        float correction = min( min( rbminmax.x, rbminmax.y ), rbminmax.z );
        vec3 boxIntersection = vWorldPosition + nDir * correction;
        
        vec3 retval = boxIntersection - cubePos;
        // retval.x = -retval.x;

        return retval;
    }
#endif
`;

// will be inserted after "vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );"
const getIBLIrradiance_patch = /* glsl */`
#ifdef BOX_PROJECTED_ENV_MAP
    worldNormal = parallaxCorrectNormal( worldNormal, envMapSize, envMapPosition );
#endif
`;

// will be inserted after "reflectVec = inverseTransformDirection( reflectVec, viewMatrix );"
const getIBLRadiance_patch = /* glsl */`
#ifdef BOX_PROJECTED_ENV_MAP
    reflectVec = parallaxCorrectNormal( reflectVec, envMapSize, envMapPosition );
#endif
`;

export default function useBoxProjectedEnvMap(shader, envMapPosition, envMapSize, args) {

    const { uniforms, defines } = args;

    // defines
    shader.defines.BOX_PROJECTED_ENV_MAP = true;

    // uniforms
    shader.uniforms.envMapPosition = {
        value: envMapPosition
    };

    shader.uniforms.envMapSize = {
        value: envMapSize
    };

    shader.uniforms = {
        ...shader.uniforms,
        ...uniforms,
        // myenv1:{
        //     value:uniforms["probe"].value[0].cubeTexture
        // },
        // myenv2:{
        //     value:uniforms["probe"].value[1].cubeTexture
        // }
    }

    // vertex shader
    shader.vertexShader = "varying vec3 vWorldPosition;\n" + shader.vertexShader
        .replace(
            "#include <worldpos_vertex>",
            worldposReplace
        );

    // fragment shader
    shader.fragmentShader = boxProjectDefinitions + "\n" + shader.fragmentShader
        .replace(
            "#include <envmap_physical_pars_fragment>",
            THREE.ShaderChunk.envmap_physical_pars_fragment
        )
        .replace(
            "vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );",
            `
            vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
            #ifdef BOX_PROJECTED_ENV_MAP
                worldNormal = parallaxCorrectNormal( worldNormal, envMapSize, envMapPosition );
            #endif
            `
        )
        .replace(
            "reflectVec = inverseTransformDirection( reflectVec, viewMatrix );",
            `
            reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
            #ifdef BOX_PROJECTED_ENV_MAP
                reflectVec = parallaxCorrectNormal( reflectVec, envMapSize, envMapPosition );
            #endif
            `
        );


    shader.fragmentShader = shader.fragmentShader.replace("void main()", 
        `
        struct Probe {
            vec3 center;
            vec3 size;
            // samplerCube cubeTexture;
            // sampler2D envTexture;
        };
        uniform Probe uProbe[PROBE_COUNT];
        uniform samplerCube uProbeTextures[PROBE_COUNT];
        // uniform sampler2D myenv1;
        // uniform sampler2D myenv2;
void main()
        `
    ).replace("#include <dithering_fragment>",
        /** glsl */`#include <dithering_fragment>

        #ifdef BOX_PROJECTED_ENV_MAP
        
        // #define DST 1
        // samplerCube envMap = uProbe[DST].cubeTexture;
        // vec3 _envMapPosition = uProbe[DST].center;
        // vec3 _envMapSize = uProbe[DST].size;
        // mat3 _envMapRotation = mat3(1.0);


        float roughness = material.roughness;
        
        // iblIrradiance
        if ( false ) {
            vec3 worldNormal = inverseTransformDirection( geometryNormal, viewMatrix );

            worldNormal = parallaxCorrectNormal( worldNormal, envMapSize, envMapPosition );
            
            vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
            
            vec3 iblIrradiance = PI * envMapColor.rgb * envMapIntensity;

            gl_FragColor.rgb = iblIrradiance;
        }

        float dist = 9999.0;
        int probeIndex = -1;
        for (int i = 0; i < PROBE_COUNT; i++) {
        
            // pick closest uProbe
            vec3 probeCenter = uProbe[i].center;
            vec3 probeSize = uProbe[i].size;
            float _dist = distance(probeCenter, vWorldPosition);

            if (_dist < dist) {
                dist = _dist;
                probeIndex = i;
            }
        }

        vec3 _envMapPosition = uProbe[probeIndex].center;
        vec3 _envMapSize = uProbe[probeIndex].size;
        mat3 _envMapRotation = mat3(1.0);

        if ( true ) {

            // geometryViewDir, geometryNormal, material.roughness

            vec3 reflectVec = reflect( - geometryViewDir, geometryNormal );

            reflectVec = normalize( mix( reflectVec, geometryNormal, roughness * roughness) );

            reflectVec = inverseTransformDirection( reflectVec, viewMatrix );

            reflectVec = parallaxCorrectNormal( reflectVec, _envMapSize, _envMapPosition );
            
            // vec4 envMapColor = textureCubeUV( envMap, _envMapRotation * reflectVec, roughness );
            
            vec4 envMapColor = vec4(0.0);

            if(probeIndex==0){
                envMapColor = textureCube( uProbeTextures[0], _envMapRotation * reflectVec, roughness );
            } else if(probeIndex==1){
                envMapColor = textureCube( uProbeTextures[1], _envMapRotation * reflectVec, roughness );
            } else {
                envMapColor = vec4(0.0);
            }

            // vec4 envMapColor = textureCubeUV( myenv2, _envMapRotation * reflectVec, roughness );

            gl_FragColor.rgb = envMapColor.rgb * envMapIntensity;
            // gl_FragColor.rgb = normalize(_envMapPosition);
        }

        #endif
        


        `)

    const downloadShader = () => {
        // download vertex & frament shader using a tag
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([shader.vertexShader], { type: "text/plain" }));
        a.download = "vertex.glsl";
        a.click();

        const b = document.createElement("a");
        b.href = URL.createObjectURL(new Blob([shader.fragmentShader], { type: "text/plain" }));
        b.download = "fragment.glsl";
        b.click();
    }

}