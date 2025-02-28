import * as THREE from "three"


// credits for the box-projecting shader code go to codercat (https://codercat.tk)

const boxProjectDefinitions = /*glsl */`
#ifdef V_ENV_MAP
    varying vec3 vWorldPosition;
    
    vec3 parallaxCorrectNormal( vec3 v, vec3 cubeSize, vec3 cubePos ) {
        vec3 nDir = normalize( v );

        vec3 rbmax = ( .5 * cubeSize + cubePos - vWorldPosition ) / nDir;
        vec3 rbmin = ( -.5 * cubeSize + cubePos - vWorldPosition ) / nDir;

        vec3 rbminmax;

        rbminmax.x = ( nDir.x > 0. ) ? rbmax.x : rbmin.x;
        rbminmax.y = ( nDir.y > 0. ) ? rbmax.y : rbmin.y;
        rbminmax.z = ( nDir.z > 0. ) ? rbmax.z : rbmin.z;

        // 월드좌표의 반사벡터가 박스에서 얼마만한 강도로 반사될 지 정해주는 계수
        float correction = min( min( rbminmax.x, rbminmax.y ), rbminmax.z );
        vec3 boxIntersection = vWorldPosition + nDir * correction;
        // vec3 boxIntersection = vWorldPosition + nDir;
        
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

export default function useBoxProjectedEnvMap(shader, args) {

    const { uniforms, defines } = args;

    // defines
    shader.defines.V_ENV_MAP = true;

    // uniforms
    // shader.uniforms.envMapPosition = {
    //     value: envMapPosition
    // };

    // shader.uniforms.envMapSize = {
    //     value: envMapSize
    // };

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
            `
            #ifndef USE_ENVMAP
            vec4 worldPosition = modelMatrix * vec4( transformed, 1.0 );
            #endif
            #ifdef V_ENV_MAP
                vWorldPosition = worldPosition.xyz;
            #endif
            #include <worldpos_vertex>
            `
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

        #ifdef V_ENV_MAP
        
        // #define DST 1
        // samplerCube envMap = uProbe[DST].cubeTexture;
        // vec3 _envMapPosition = uProbe[DST].center;
        // vec3 probeSize = uProbe[DST].size;
        // mat3 _envMapRotation = mat3(1.0);


        float roughness = material.roughness;
        
        // iblIrradiance
        // if ( false ) {
        //     vec3 worldNormal = inverseTransformDirection( geometryNormal, viewMatrix );

        //     worldNormal = parallaxCorrectNormal( worldNormal, envMapSize, envMapPosition );
            
        //     vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
            
        //     vec3 iblIrradiance = PI * envMapColor.rgb * envMapIntensity;

        //     gl_FragColor.rgb = iblIrradiance;
        // }

        float weights[PROBE_COUNT];
        float wTotal = 0.0;

        
        vec3 worldReflectVec = reflect( - geometryViewDir, geometryNormal );

        worldReflectVec = normalize( mix( worldReflectVec, geometryNormal, roughness * roughness) );

        worldReflectVec = inverseTransformDirection( worldReflectVec, viewMatrix );

        float reflectWeight = 3.0;
        float distWeight = 0.00001;
        // float distWeight = 1.0;

        float dists[PROBE_COUNT];
        float distTotal = 0.0;
        for (int i = 0; i < PROBE_COUNT; i++) {
            vec3 probeCenter = uProbe[i].center;
            dists[i] = dot(vWorldPosition-probeCenter, vWorldPosition-probeCenter);
            distTotal += dists[i];
        }
        for (int i = 0; i < PROBE_COUNT; i++) {
            dists[i] /= distTotal;
        }
        
        // TODO : Dist가 아니고 상자로부터의 dist를 구해야겠다 또는 상자사이즈의 2/3


        for (int i = 0; i < PROBE_COUNT; i++) {
        
            // pick closest uProbe
            vec3 probeCenter = uProbe[i].center;
            
            float reflectFactor = dot(normalize(worldReflectVec), normalize(probeCenter));

            // reflectFactor = abs(clamp(reflectFactor, -1.0, 1.0));
            reflectFactor = clamp(reflectFactor, 0.0, 1.0);

            

            // 웨이트를 더 주기위해
            // float a = -.1;
            // float p = reflectFactor-1.;
            // reflectFactor = a*p*p + 1.0;
            // reflectFactor = reflectFactor*reflectFactor;

            float distFactor = 1.0 - dists[i];
            weights[i] = reflectWeight * reflectFactor;
            // weights[i] = distWeight * distFactor;
            wTotal += weights[i];

        }

        
        mat3 _envMapRotation = mat3(1.0);

        vec4 envMapColor = vec4(0.0);




        #pragma unroll_loop_start
        for (int i = 0; i < PROBE_COUNT; i++) {
            vec3 probeCenter = uProbe[i].center;
            vec3 probeSize = uProbe[i].size;

            vec3 localReflectVec = parallaxCorrectNormal( worldReflectVec, probeSize, probeCenter );

            float thisWeight = weights[i] / wTotal;

            if (false) {
                //reflectFactor : 프로브 반대방향으로 반사하면 색을 0
                vec3 viewDir = normalize(cameraPosition - vWorldPosition);

                vec3 reflectVec_ = reflect( - geometryViewDir, geometryNormal );
                reflectVec_ = normalize( mix( reflectVec_, geometryNormal, roughness * roughness) );
                reflectVec_ = inverseTransformDirection( reflectVec_, viewMatrix );

                float reflectFactor = dot(normalize(reflectVec_), normalize(probeCenter - vWorldPosition));

                reflectFactor = clamp(reflectFactor, 0.0, 1.0);

                float a = -.1;
                float p = reflectFactor-1.;
                reflectFactor = a*p*p + 1.0; 

                thisWeight *= reflectFactor;
                //!reflectFactor
            }

            if(i == 0){

                envMapColor += thisWeight * textureCube( uProbeTextures[0], _envMapRotation * localReflectVec, roughness );

            }
            #if PROBE_COUNT > 1
            else if( i == 1){

                envMapColor += thisWeight * textureCube( uProbeTextures[1], _envMapRotation * localReflectVec, roughness );

            }
            #endif
            #if PROBE_COUNT > 2
            else if( i == 2){

                envMapColor += thisWeight * textureCube( uProbeTextures[2], _envMapRotation * localReflectVec, roughness );

            }
            #endif
            #if PROBE_COUNT > 3
            else if( i == 3){

                envMapColor += thisWeight * textureCube( uProbeTextures[3], _envMapRotation * localReflectVec, roughness );

            }
            #endif
            #if PROBE_COUNT > 4
            else if( i == 4){

                envMapColor += thisWeight * textureCube( uProbeTextures[4], _envMapRotation * localReflectVec, roughness );

            }
            #endif
            #if PROBE_COUNT > 5
            else if( i == 5){

                envMapColor += thisWeight * textureCube( uProbeTextures[5], _envMapRotation * localReflectVec, roughness );

            }
            #endif
            else {

                envMapColor = vec4(0.0);
            }
        }
        #pragma unroll_loop_end

        float envMapIntensity = 1.0;
        gl_FragColor.rgb = envMapColor.rgb * envMapIntensity;

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