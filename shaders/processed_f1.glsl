#version 300 es
#define varying in
layout(location = 0) out highp vec4 pc_fragColor;
#define gl_FragColor pc_fragColor
#define gl_FragDepthEXT gl_FragDepth
#define texture2D texture
#define textureCube texture
#define texture2DProj textureProj
#define texture2DLodEXT textureLod
#define texture2DProjLodEXT textureProjLod
#define textureCubeLodEXT textureLod
#define texture2DGradEXT textureGrad
#define texture2DProjGradEXT textureProjGrad
#define textureCubeGradEXT textureGrad
precision highp float;
precision highp int;
precision highp sampler2D;
precision highp samplerCube;
precision highp sampler3D;
precision highp sampler2DArray;
precision highp sampler2DShadow;
precision highp samplerCubeShadow;
precision highp sampler2DArrayShadow;
precision highp isampler2D;
precision highp isampler3D;
precision highp isamplerCube;
precision highp isampler2DArray;
precision highp usampler2D;
precision highp usampler3D;
precision highp usamplerCube;
precision highp usampler2DArray;
#define HIGH_PRECISION
#define SHADER_TYPE MeshPhysicalMaterial
#define SHADER_NAME Marble.001
#define STANDARD 
#define PHYSICAL 
#define BOX_PROJECTED_ENV_MAP true
#define USE_MAP
#define USE_ENVMAP
#define ENVMAP_TYPE_CUBE_UV
#define ENVMAP_MODE_REFLECTION
#define ENVMAP_BLENDING_NONE
#define CUBEUV_TEXEL_WIDTH 0.0006510416666666666
#define CUBEUV_TEXEL_HEIGHT 0.00048828125
#define CUBEUV_MAX_MIP 9.0
#define USE_LIGHTMAP
#define USE_NORMALMAP
#define USE_NORMALMAP_TANGENTSPACE
#define USE_ROUGHNESSMAP
#define USE_METALNESSMAP
#define USE_UV1
#define DOUBLE_SIDED
uniform mat4 viewMatrix;
uniform vec3 cameraPosition;
uniform bool isOrthographic;
#define OPAQUE
vec4 LinearTransferOETF( in vec4 value ) {
    return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
    return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
    return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}
vec4 linearToOutputTexel( vec4 value ) {
    return sRGBTransferOETF( vec4( value.rgb * mat3( 1.0000, -0.0000, -0.0000, -0.0000, 1.0000, 0.0000, 0.0000, 0.0000, 1.0000 ), value.a ) );
}
float luminance( const in vec3 rgb ) {
    const vec3 weights = vec3( 0.2126, 0.7152, 0.0722 );
    return dot( weights, rgb );
}
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

#define STANDARD
    #define IOR
    #define USE_SPECULAR
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
    uniform float ior;
    uniform float specularIntensity;
    uniform vec3 specularColor;
varying vec3 vViewPosition;
#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) {
    return x*x;
}
vec3 pow2( const in vec3 x ) {
    return x*x;
}
float pow3( const in float x ) {
    return x*x*x;
}
float pow4( const in float x ) {
    float x2 = x*x;
    return x2*x2;
}
float max3( const in vec3 v ) {
    return max( max( v.x, v.y ), v.z );
}
float average( const in vec3 v ) {
    return dot( v, vec3( 0.3333333 ) );
}
highp float rand( const in vec2 uv ) {
    const highp float a = 12.9898, b = 78.233, c = 43758.5453;
    highp float dt = dot( uv.xy, vec2( a, b ) ), sn = mod( dt, PI );
    return fract( sin( sn ) * c );
}
    float precisionSafeLength( vec3 v ) {
        return length( v );
    }
#else
    float precisionSafeLength( vec3 v ) {
        float maxComponent = max3( abs( v ) );
        return length( v / maxComponent ) * maxComponent;
    }
struct IncidentLight {
    vec3 color;
    vec3 direction;
    bool visible;
};
struct ReflectedLight {
    vec3 directDiffuse;
    vec3 directSpecular;
    vec3 indirectDiffuse;
    vec3 indirectSpecular;
};
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
    return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
    return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
    mat3 tmp;
    tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
    tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
    tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
    return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
    return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
    float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
    float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
    return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
    return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
    float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
    return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
    float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
    return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
// validated
vec3 packNormalToRGB( const in vec3 normal ) {
    return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
    return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;
const float UnpackDownscale = 255. / 256.;
const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
    if( v <= 0.0 )
    return vec4( 0., 0., 0., 0. );
    if( v >= 1.0 )
    return vec4( 1., 1., 1., 1. );
    float vuf;
    float af = modf( v * PackFactors.a, vuf );
    float bf = modf( vuf * ShiftRight8, vuf );
    float gf = modf( vuf * ShiftRight8, vuf );
    return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
    if( v <= 0.0 )
    return vec3( 0., 0., 0. );
    if( v >= 1.0 )
    return vec3( 1., 1., 1. );
    float vuf;
    float bf = modf( v * PackFactors.b, vuf );
    float gf = modf( vuf * ShiftRight8, vuf );
    return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
    if( v <= 0.0 )
    return vec2( 0., 0. );
    if( v >= 1.0 )
    return vec2( 1., 1. );
    float vuf;
    float gf = modf( v * 256., vuf );
    return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
    return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
    return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
    return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
    vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
    return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
    return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
    return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
    return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
    return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
    return ( near * far ) / ( ( far - near ) * depth - far );
}
    varying vec2 vMapUv;
    varying vec2 vLightMapUv;
    varying vec2 vNormalMapUv;
    varying vec2 vMetalnessMapUv;
    varying vec2 vRoughnessMapUv;
    uniform sampler2D map;
    uniform sampler2D lightMap;
    uniform float lightMapIntensity;
    #define cubeUV_minMipLevel 4.0
    #define cubeUV_minTileSize 16.0
    float getFace( vec3 direction ) {
        vec3 absDirection = abs( direction );
        float face = - 1.0;
        if ( absDirection.x > absDirection.z ) {
            if ( absDirection.x > absDirection.y )
            face = direction.x > 0.0 ? 0.0 : 3.0;
            else
            face = direction.y > 0.0 ? 1.0 : 4.0;
        }
        else {
            if ( absDirection.z > absDirection.y )
            face = direction.z > 0.0 ? 2.0 : 5.0;
            else
            face = direction.y > 0.0 ? 1.0 : 4.0;
        }
        return face;
    }
    vec2 getUV( vec3 direction, float face ) {
        vec2 uv;
        if ( face == 0.0 ) {
            uv = vec2( direction.z, direction.y ) / abs( direction.x );
        }
        else if ( face == 1.0 ) {
            uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
        }
        else if ( face == 2.0 ) {
            uv = vec2( - direction.x, direction.y ) / abs( direction.z );
        }
        else if ( face == 3.0 ) {
            uv = vec2( - direction.z, direction.y ) / abs( direction.x );
        }
        else if ( face == 4.0 ) {
            uv = vec2( - direction.x, direction.z ) / abs( direction.y );
        }
        else {
            uv = vec2( direction.x, direction.y ) / abs( direction.z );
        }
        return 0.5 * ( uv + 1.0 );
    }
    vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
        float face = getFace( direction );
        float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
        mipInt = max( mipInt, cubeUV_minMipLevel );
        float faceSize = exp2( mipInt );
        highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
        if ( face > 2.0 ) {
            uv.y += faceSize;
            face -= 3.0;
        }
        uv.x += face * faceSize;
        uv.x += filterInt * 3.0 * cubeUV_minTileSize;
        uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
        uv.x *= CUBEUV_TEXEL_WIDTH;
        uv.y *= CUBEUV_TEXEL_HEIGHT;
            return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
        #else
            return texture2D( envMap, uv ).rgb;
    }
    #define cubeUV_r0 1.0
    #define cubeUV_m0 - 2.0
    #define cubeUV_r1 0.8
    #define cubeUV_m1 - 1.0
    #define cubeUV_r4 0.4
    #define cubeUV_m4 2.0
    #define cubeUV_r5 0.305
    #define cubeUV_m5 3.0
    #define cubeUV_r6 0.21
    #define cubeUV_m6 4.0
    float roughnessToMip( float roughness ) {
        float mip = 0.0;
        if ( roughness >= cubeUV_r1 ) {
            mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
        }
        else if ( roughness >= cubeUV_r4 ) {
            mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
        }
        else if ( roughness >= cubeUV_r5 ) {
            mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
        }
        else if ( roughness >= cubeUV_r6 ) {
            mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
        }
        else {
            mip = - 2.0 * log2( 1.16 * roughness );
        }
        return mip;
    }
    vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
        float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
        float mipF = fract( mip );
        float mipInt = floor( mip );
        vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
        if ( mipF == 0.0 ) {
            return vec4( color0, 1.0 );
        }
        else {
            vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
            return vec4( mix( color0, color1, mipF ), 1.0 );
        }
    
    }
    uniform float envMapIntensity;
    uniform float flipEnvMap;
    uniform mat3 envMapRotation;
    
    vec3 getIBLIrradiance( const in vec3 normal ) {
            vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
                worldNormal = parallaxCorrectNormal( worldNormal, envMapSize, envMapPosition );
            
            
            vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
            return PI * envMapColor.rgb * envMapIntensity;
        #else
            return vec3( 0.0 );
    }
    vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
            vec3 reflectVec = reflect( - viewDir, normal );
            reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
            reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
                reflectVec = parallaxCorrectNormal( reflectVec, envMapSize, envMapPosition );
            
            
            vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
            return envMapColor.rgb * envMapIntensity;
        #else
            return vec3( 0.0 );
    }
                vec3 bentNormal = cross( bitangent, viewDir );
                bentNormal = normalize( cross( bentNormal, bitangent ) );
                bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
                return getIBLRadiance( viewDir, bentNormal, roughness );
            #else
                return vec3( 0.0 );
        }
uniform bool receiveShadow;
uniform vec3 ambientLightColor;
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
    float x = normal.x, y = normal.y, z = normal.z;
    vec3 result = shCoefficients[ 0 ] * 0.886227;
    result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
    result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
    result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
    result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
    result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
    result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
    result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
    result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
    return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
    vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
    vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
    return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
    vec3 irradiance = ambientLightColor;
    return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
    float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
    if ( cutoffDistance > 0.0 ) {
        distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
    }
    return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
    return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
    varying vec3 vNormal;
struct PhysicalMaterial {
    vec3 diffuseColor;
    float roughness;
    vec3 specularColor;
    float specularF90;
    float dispersion;
        float ior;
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
    float a2 = pow2( alpha );
    float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
    float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
    return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
    float a2 = pow2( alpha );
    float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
    return RECIPROCAL_PI * a2 / pow2( denom );
}
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
    vec3 f0 = material.specularColor;
    float f90 = material.specularF90;
    float roughness = material.roughness;
    float alpha = pow2( roughness );
    vec3 halfDir = normalize( lightDir + viewDir );
    float dotNL = saturate( dot( normal, lightDir ) );
    float dotNV = saturate( dot( normal, viewDir ) );
    float dotNH = saturate( dot( normal, halfDir ) );
    float dotVH = saturate( dot( viewDir, halfDir ) );
    vec3 F = F_Schlick( f0, f90, dotVH );
    return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
    const float LUT_SIZE = 64.0;
    const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
    const float LUT_BIAS = 0.5 / LUT_SIZE;
    float dotNV = saturate( dot( N, V ) );
    vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
    uv = uv * LUT_SCALE + LUT_BIAS;
    return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
    float l = length( f );
    return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
    float x = dot( v1, v2 );
    float y = abs( x );
    float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
    float b = 3.4175940 + ( 4.1616724 + y ) * y;
    float v = a / b;
    float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
    return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
    vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
    vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
    vec3 lightNormal = cross( v1, v2 );
    if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
    vec3 T1, T2;
    T1 = normalize( V - N * dot( V, N ) );
    T2 = - cross( N, T1 );
    mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
    vec3 coords[ 4 ];
    coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
    coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
    coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
    coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
    coords[ 0 ] = normalize( coords[ 0 ] );
    coords[ 1 ] = normalize( coords[ 1 ] );
    coords[ 2 ] = normalize( coords[ 2 ] );
    coords[ 3 ] = normalize( coords[ 3 ] );
    vec3 vectorFormFactor = vec3( 0.0 );
    vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
    vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
    vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
    vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
    float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
    return vec3( result );
}
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
    float dotNV = saturate( dot( normal, viewDir ) );
    float r2 = roughness * roughness;
    float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
    float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
    float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
    return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
    float dotNV = saturate( dot( normal, viewDir ) );
    const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
    const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
    vec4 r = roughness * c0 + c1;
    float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
    vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
    return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
    vec2 fab = DFGApprox( normal, viewDir, roughness );
    return specularColor * fab.x + specularF90 * fab.y;
}
    vec2 fab = DFGApprox( normal, viewDir, roughness );
    vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
    float Ess = fab.x + fab.y;
    float Ems = 1.0 - Ess;
    vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;
    vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
    singleScatter += FssEss;
    multiScatter += Fms * Ems;
}
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
    float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
    vec3 irradiance = dotNL * directLight.color;
    reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
    reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
    reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
    vec3 singleScattering = vec3( 0.0 );
    vec3 multiScattering = vec3( 0.0 );
    vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
    vec3 totalScattering = singleScattering + multiScattering;
    vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
    reflectedLight.indirectSpecular += radiance * singleScattering;
    reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
    reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
    return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}
    uniform vec2 transmissionSamplerSize;
    uniform sampler2D transmissionSamplerMap;
    uniform mat4 modelMatrix;
    uniform mat4 projectionMatrix;
    varying vec3 vWorldPosition;
    float w0( float a ) {
        return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
    }
    float w1( float a ) {
        return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
    }
    float w2( float a ) {
        return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
    }
    float w3( float a ) {
        return ( 1.0 / 6.0 ) * ( a * a * a );
    }
    float g0( float a ) {
        return w0( a ) + w1( a );
    }
    float g1( float a ) {
        return w2( a ) + w3( a );
    }
    float h0( float a ) {
        return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
    }
    float h1( float a ) {
        return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
    }
    vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
        uv = uv * texelSize.zw + 0.5;
        vec2 iuv = floor( uv );
        vec2 fuv = fract( uv );
        float g0x = g0( fuv.x );
        float g1x = g1( fuv.x );
        float h0x = h0( fuv.x );
        float h1x = h1( fuv.x );
        float h0y = h0( fuv.y );
        float h1y = h1( fuv.y );
        vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
        vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
        vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
        vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
        return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
        g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
    }
    vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
        vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
        vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
        vec2 fLodSizeInv = 1.0 / fLodSize;
        vec2 cLodSizeInv = 1.0 / cLodSize;
        vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
        vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
        return mix( fSample, cSample, fract( lod ) );
    }
    vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
        vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
        vec3 modelScale;
        modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
        modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
        modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
        return normalize( refractionVector ) * thickness * modelScale;
    }
    float applyIorToRoughness( const in float roughness, const in float ior ) {
        return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
    }
    vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
        float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
        return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
    }
    vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
        if ( isinf( attenuationDistance ) ) {
            return vec3( 1.0 );
        }
        else {
            vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
            vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );
            return transmittance;
        }
    
    }
    vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor, const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix, const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness, const in vec3 attenuationColor, const in float attenuationDistance ) {
        vec4 transmittedLight;
        vec3 transmittance;
        vec3 attenuatedColor = transmittance * transmittedLight.rgb;
        vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
        float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
        return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
    }
    float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
        return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
    }
    vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
        return unpackRGBATo2Half( texture2D( shadow, uv ) );
    }
    float VSMShadow (sampler2D shadow, vec2 uv, float compare ) {
        float occlusion = 1.0;
        vec2 distribution = texture2DDistribution( shadow, uv );
        float hard_shadow = step( compare, distribution.x );
        if (hard_shadow ! = 1.0 ) {
            float distance = compare - distribution.x ;
            float variance = max( 0.00000, distribution.y * distribution.y );
            float softness_probability = variance / (variance + distance * distance );
            softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );
            occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
        }
        return occlusion;
    }
    float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
        float shadow = 1.0;
        shadowCoord.xyz /= shadowCoord.w;
        shadowCoord.z += shadowBias;
        bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
        bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
        if ( frustumTest ) {
        }
        return mix( 1.0, shadow, shadowIntensity );
    }
    vec2 cubeToUV( vec3 v, float texelSizeY ) {
        vec3 absV = abs( v );
        float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
        absV *= scaleToCube;
        v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
        vec2 planar = v.xy;
        float almostATexel = 1.5 * texelSizeY;
        float almostOne = 1.0 - almostATexel;
        if ( absV.z >= almostOne ) {
            if ( v.z > 0.0 )
            planar.x = 4.0 - v.x;
        }
        else if ( absV.x >= almostOne ) {
            float signX = sign( v.x );
            planar.x = v.z * signX + 2.0 * signX;
        }
        else if ( absV.y >= almostOne ) {
            float signY = sign( v.y );
            planar.x = v.x + 2.0 * signY + 2.0;
            planar.y = v.z * signY - 2.0;
        }
        return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
    }
    float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
        float shadow = 1.0;
        vec3 lightToPosition = shadowCoord.xyz;
        float lightToPositionLength = length( lightToPosition );
        if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
            float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );
            dp += shadowBias;
            vec3 bd3D = normalize( lightToPosition );
            vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
        }
        return mix( 1.0, shadow, shadowIntensity );
    }
    uniform sampler2D normalMap;
    uniform vec2 normalScale;
    uniform sampler2D roughnessMap;
    uniform sampler2D metalnessMap;
void main() {
    vec4 diffuseColor = vec4( diffuse, opacity );
            diffuseColor.a *= clipOpacity;
            if ( diffuseColor.a == 0.0 ) discard;
        #else
            
    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
    vec3 totalEmissiveRadiance = emissive;
        vec4 sampledDiffuseColor = texture2D( map, vMapUv );
        diffuseColor *= sampledDiffuseColor;
    float roughnessFactor = roughness;
        vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
        roughnessFactor *= texelRoughness.g;
    float metalnessFactor = metalness;
        vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
        metalnessFactor *= texelMetalness.b;
    float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
            normal *= faceDirection;
            );
    vec3 nonPerturbedNormal = normal;
            normal = normal * faceDirection;
        normal = normalize( normalMatrix * normal );
        #elif defined( USE_NORMALMAP_TANGENTSPACE )
        vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
        mapN.xy *= normalScale;
        normal = normalize( tbn * mapN );
        #elif defined( USE_BUMPMAP )
        normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
        totalEmissiveRadiance *= emissiveColor.rgb;
    PhysicalMaterial material;
    material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
    vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
    float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
    material.roughness = max( roughnessFactor, 0.0525 );
    material.roughness += geometryRoughness;
    material.roughness = min( material.roughness, 1.0 );
        material.ior = ior;
            float specularIntensityFactor = specularIntensity;
            vec3 specularColorFactor = specularColor;
            material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
        #else
            float specularIntensityFactor = 1.0;
            vec3 specularColorFactor = vec3( 1.0 );
            material.specularF90 = 1.0;
        material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
    #else
        material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
        material.specularF90 = 1.0;
        material.clearcoat = saturate( material.clearcoat );
        material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
        material.clearcoatRoughness += geometryRoughness;
        material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
        material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
        material.anisotropy = length( anisotropyV );
        if( material.anisotropy == 0.0 ) {
            anisotropyV = vec2( 1.0, 0.0 );
        }
        else {
            anisotropyV /= material.anisotropy;
            material.anisotropy = saturate( material.anisotropy );
        }
        material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
        material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
        material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
    
    vec3 geometryPosition = - vViewPosition;
    vec3 geometryNormal = normal;
    vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
    vec3 geometryClearcoatNormal = vec3( 0.0 );
    IncidentLight directLight;
        
        
        
            vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
            vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
            irradiance += lightMapIrradiance;
    vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
    vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
        vec3 pos = vWorldPosition;
        vec3 v = normalize( cameraPosition - pos );
        vec3 n = inverseTransformDirection( normal, viewMatrix );
        vec4 transmitted = getIBLVolumeRefraction(
        n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90, pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness, material.attenuationColor, material.attenuationDistance );
        material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
        totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
    vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
        diffuseColor.a = 1.0;
    gl_FragColor = vec4( outgoingLight, diffuseColor.a );
    gl_FragColor = linearToOutputTexel( gl_FragColor );
        gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
}
