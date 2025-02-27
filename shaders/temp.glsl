// vertex
varying vec3 vViewPosition;

void main() {
    // vertex
    vec3 transformed = vec3(position);
    vec4 mvPosition = vec4(transformed, 1.0);
    mvPosition = modelViewMatrix * mvPosition;
    // model-view : 카메라 좌표계로 이동된 버텍스, 투영까지 하려면 projection 매트릭스도 곱해야함

    vViewPosition = -mvPosition.xyz;

    // frag
    vec3 geometryPosition = -vViewPosition; // mvPosition
    vec3 geometryNormal = normal;
    vec3 geometryViewDir = normalize(vViewPosition);
}
