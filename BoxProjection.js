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

    float distanceToAABB(vec3 point, vec3 boxCenter, vec3 boxSize) {
        vec3 boxMin = boxCenter - boxSize * 0.5;
        vec3 boxMax = boxCenter + boxSize * 0.5;
        
        vec3 closestPoint = clamp(point, boxMin, boxMax);
        return length(point - closestPoint);
    }

    vec4 probeColor(int i, float roughness) {
        vec3 worldReflectVec = reflect( - geometryViewDir, geometryNormal );

        worldReflectVec = normalize(worldReflectVec);

        worldReflectVec = inverseTransformDirection( worldReflectVec, viewMatrix );

        vec3 localReflectVec = parallaxCorrectNormal( worldReflectVec, probeSize, probeCenter );

        mat3 _envMapRotation = mat3(1.0);

        vec4 envMapColor = vec4(0.0);

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
        #if PROBE_COUNT > 6
        else if( i == 6){

            envMapColor += thisWeight * textureCube( uProbeTextures[6], _envMapRotation * localReflectVec, roughness );

        }
        #endif
        #if PROBE_COUNT > 7
        else if( i == 7){

            envMapColor += thisWeight * textureCube( uProbeTextures[7], _envMapRotation * localReflectVec, roughness );

        }
        #endif
        #if PROBE_COUNT > 8
        else if( i == 8){

            envMapColor += thisWeight * textureCube( uProbeTextures[8], _envMapRotation * localReflectVec, roughness );

        }
        #endif
        #if PROBE_COUNT > 9
        else if( i == 9){

            envMapColor += thisWeight * textureCube( uProbeTextures[9], _envMapRotation * localReflectVec, roughness );

        }
        #endif
        #if PROBE_COUNT > 10
        else if( i == 10){

            envMapColor += thisWeight * textureCube( uProbeTextures[10], _envMapRotation * localReflectVec, roughness );

        }
        #endif
        #if PROBE_COUNT > 11
        else if( i == 11){

            envMapColor += thisWeight * textureCube( uProbeTextures[11], _envMapRotation * localReflectVec, roughness );

        }
        #endif
        #if PROBE_COUNT > 12
        else if( i == 12){

            envMapColor += thisWeight * textureCube( uProbeTextures[12], _envMapRotation * localReflectVec, roughness );

        }
        #endif
        #if PROBE_COUNT > 13
        else if( i == 13){

            envMapColor += thisWeight * textureCube( uProbeTextures[13], _envMapRotation * localReflectVec, roughness );

        }
        #endif
        #if PROBE_COUNT > 14
        else if( i == 14){

            envMapColor += thisWeight * textureCube( uProbeTextures[14], _envMapRotation * localReflectVec, roughness );

        }
        #endif
        #if PROBE_COUNT > 15
        else if( i == 15){

            envMapColor += thisWeight * textureCube( uProbeTextures[15], _envMapRotation * localReflectVec, roughness );

        }
        #endif
        #if PROBE_COUNT > 16
        else if( i == 16){

            envMapColor += thisWeight * textureCube( uProbeTextures[16], _envMapRotation * localReflectVec, roughness );

        }
        #endif
        // WebGL GLSL스펙 상 최대 텍스쳐 갯수는 16이므로 여기서 끝
        else {

            envMapColor = vec4(0.0);
        }
        return envMapColor;
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

    const { uniforms, defines, namehash, meshName, matName } = args;

    console.log("useBoxProjectedEnvMap", args)

    // defines

    shader.defines = shader.defines ?? {};
    shader.defines = {
        ...shader.defines,
        ...defines,
        V_ENV_MAP: 1
    }

    // uniforms
    // shader.uniforms.envMapPosition = {
    //     value: envMapPosition
    // };

    // shader.uniforms.envMapSize = {
    //     value: envMapSize
    // };


    shader.uniforms = shader.uniforms ?? {};
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
    shader.fragmentShader = shader.fragmentShader
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
        #ifdef V_ENV_MAP
        struct Probe {
            vec3 center;
            vec3 size;
            // samplerCube cubeTexture;
            // sampler2D envTexture;
        };
        uniform Probe _uProbe${namehash}[PROBE_COUNT];
        uniform samplerCube _uProbeTextures${namehash}[PROBE_COUNT];
        uniform float _uProbeIntensity${namehash};

        vec2 equirectUV(vec3 dir) {
            vec2 uv;
            uv.x = atan(-dir.z, dir.x) / (2.0 * 3.14159265359) + 0.5;
            uv.y = acos(dir.y) / 3.14159265359;
            return uv;
        }
        #endif

${boxProjectDefinitions}
void main()
        `
    ).replace("#include <lights_fragment_end>",
        /** glsl */`
    #ifdef V_ENV_MAP
        
        float roughness = material.roughness;
        
        float weights[PROBE_COUNT];
        float wTotal = 0.0;

        
        vec3 worldReflectVec = reflect( - geometryViewDir, geometryNormal );

        // worldReflectVec = normalize( mix( worldReflectVec, geometryNormal, roughness * roughness) );
        worldReflectVec = normalize(worldReflectVec);

        worldReflectVec = inverseTransformDirection( worldReflectVec, viewMatrix );

        float reflectWeight = 1.0;
        // float distWeight = 0.00001;
        float distWeight = 1.0;

        float dists[PROBE_COUNT];
        float floorDists[PROBE_COUNT];
        float distTotal = 0.0;
        float floorDistTotal = 0.0;

        // 거리를 계산
        #pragma unroll_loop_start
        for (int i = 0; i < PROBE_COUNT; i++) {
            vec3 probeCenter = uProbe[i].center;
            vec3 probeSize = uProbe[i].size;

            // float distFromCenter = dot(vWorldPosition-probeCenter, vWorldPosition-probeCenter);
            float distFromCenter = length(vWorldPosition-probeCenter);
            float distFromBox = distanceToAABB(vWorldPosition, probeCenter, probeSize);
            
            // dists[i] = distFromCenter + distFromBox;
            dists[i] = distFromBox;
            // dists[i] = distFromCenter;
            // dists[i] = distFromCenter * distFromCenter;
            
            distTotal += dists[i];

            floorDists[i] = dists[i];
            floorDistTotal += floorDists[i];
        }
        #pragma unroll_loop_end

        #pragma unroll_loop_start
        for (int i = 0; i < PROBE_COUNT; i++) {
            dists[i] /= distTotal;
        }
        #pragma unroll_loop_end

        int minIndex = -1;
        int secondMinIndex = -1;

        if ( true ) {
            // 가장 가까운 것만 고르기
            float minDist = 100000.0;
            #pragma unroll_loop_start
            for (int i = 0; i < PROBE_COUNT; i++) {
                if (dists[i] < minDist) {
                    minDist = dists[i];
                    secondMinIndex = minIndex;
                    minIndex = i;
                }
            }
            #pragma unroll_loop_end

            #pragma unroll_loop_start
            for (int i = 0; i < PROBE_COUNT; i++) {
                if (i == minIndex) {
                    dists[i] = 1.0;
                    distTotal = 1.0;
                } else {
                    dists[i] = 0.0;
                }
            }
            #pragma unroll_loop_end
        }
        
        vec4 envMapColor = vec4(0.0);

        // case #1. 바닥에 있는 경우
        if(vWorldPosition.y < 0.05) {

            float minDist = floorDists[minIndex];
            float secondMinDist = floorDists[secondMinIndex];

            if(secondMinDist > 0.5) {

                envMapColor = probeColor(minIndex, roughness);

            } else {
                // 박스 간의 거리가 가까운 지점, 거리에 따라 보간
                float total = minDist + secondMinDist + 0.00001;
                float minFactor = minDist / total;
                
                vec4 closestColor = probeColor(minIndex, roughness);
                vec4 secondClosestColor = probeColor(secondMinIndex, roughness);

                envMapColor = closestColor * minFactor + secondClosestColor * (1.0 - minFactor);
                
            }

        } else {
            // case #2. 바닥이 아닌 경우
            envMapColor = probeColor(minIndex, roughness);
        }


        // #pragma unroll_loop_start
        // for (int i = 0; i < PROBE_COUNT; i++) {
        
        //     // pick closest uProbe
        //     vec3 probeCenter = uProbe[i].center;
            
        //     float reflectFactor = dot(normalize(worldReflectVec), normalize(probeCenter));

        //     // reflectFactor = abs(clamp(reflectFactor, -1.0, 1.0));
        //     // reflectFactor = clamp(reflectFactor, 0.0, 1.0);
        //     reflectFactor = (clamp(reflectFactor, -0.5, 1.0));
        //     reflectFactor = reflectFactor*reflectFactor;

            

        //     // 웨이트를 더 주기위해
        //     // float a = -.1;
        //     // float p = reflectFactor-1.;
        //     // reflectFactor = a*p*p + 1.0;
        //     // reflectFactor = reflectFactor*reflectFactor;

        //     float distFactor = 1.0 - dists[i];

        //     if(true) {
        //         if(vWorldPosition.y < 0.05) {
        //             float minDist = floorDists[minIndex];
        //             float secondMinDist = floorDists[secondMinIndex];

        //             if(secondMinDist > 0.5) {
        //                 if(i == minIndex) {
        //                     weights[i] = 1.0;
        //                 } else {
        //                     weights[i] = 0.0;
        //                 }
        //             } else {
        //                 // 박스 간의 거리가 가까운 지점, 거리에 따라 보간
        //                 float total = minDist + secondMinDist + 0.00001;
        //                 float minFactor = (total - minDist) / total;
        //                 // float secondMinFactor = (total - secondMinDist) / total;
        //                 weights[i] = minFactor * reflectFactor;
        //             }

        //             // weights[i] = reflectWeight * reflectFactor;


        //         } else {
        //             // weights[i] = distWeight * distFactor;
        //             // // weights[i] = distWeight;
        //             if(i == minIndex) {
        //                 weights[i] = 1.0;
        //             } else {
        //                 weights[i] = 0.0;
        //             }
        //         }
        //     } else {
        //         if(i == minIndex) {
        //             weights[i] = 1.0;
        //         } else {
        //             weights[i] = 0.0;
        //         }
        //     }

        //     // weights[i] = reflectWeight * reflectFactor;
        //     // weights[i] = distWeight * distFactor;
        //     wTotal += weights[i];

        // }
        // #pragma unroll_loop_end

        radiance += clamp(envMapColor.rgb, 0.0, 1.0) * uProbeIntensity;
        // radiance = vWorldPosition;

        #endif
        ` + "#include <lights_fragment_end>"
    )

    const showVWorldPosition = false;
    if (showVWorldPosition) {
        shader.fragmentShader = shader.fragmentShader.replace("#include <dithering_fragment>", `#include <dithering_fragment>
        gl_FragColor.rgb = vWorldPosition;
        `)
    }


    // debugger;

    const downloadShader = () => {
        // download vertex & frament shader using a tag
        // const a = document.createElement("a");
        // a.href = URL.createObjectURL(new Blob([shader.vertexShader], { type: "text/plain" }));
        // a.download = "vertex.glsl";
        // a.click();

        const b = document.createElement("a");
        b.href = URL.createObjectURL(new Blob([shader.fragmentShader], { type: "text/plain" }));
        b.download = "fragment.glsl";
        b.click();
    }
    // downloadShader()
}