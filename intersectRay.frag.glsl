#version 300 es
precision highp float;

uniform vec2 uLines[100];  // 최대 50개의 선 (시작점, 끝점 쌍으로 저장)
uniform int uLineCount;    // 사용 중인 선 개수 (짝수여야 함)
uniform vec3 uRayOrigin;   // 광선의 시작점 (XZ 평면)
uniform vec3 uRayDirection; // 광선 방향 (XZ 평면)

out vec4 fragColor;

bool intersectRaySegment(vec2 p1, vec2 p2, vec2 ro, vec2 rd, out vec2 intersection) {
    vec2 v1 = ro - p1;
    vec2 v2 = p2 - p1;
    vec2 v3 = vec2(-rd.y, rd.x); // 광선의 법선 벡터

    float dotProduct = dot(v2, v3);
    if(abs(dotProduct) < 1e-6f)
        return false; // 광선과 선이 평행함

    float t1 = (v2.x * v1.y - v2.y * v1.x) / dotProduct;
    float t2 = dot(v1, v3) / dotProduct;

    if(t1 >= 0.0f && t2 >= 0.0f && t2 <= 1.0f) {
        intersection = ro + t1 * rd;
        return true;
    }
    return false;
}

void main() {
    vec2 rayOrigin = uRayOrigin.xz;
    vec2 rayDir = normalize(uRayDirection.xz);
    vec2 closestIntersection = vec2(1e6f, 1e6f);
    float minDist = 1e6f;

    for(int i = 0; i < uLineCount; i += 2) {
        vec2 start = uLines[i];
        vec2 end = uLines[i + 1];
        vec2 intersection;

        if(intersectRaySegment(start, end, rayOrigin, rayDir, intersection)) {
            float dist = length(intersection - rayOrigin);
            if(dist < minDist) {
                minDist = dist;
                closestIntersection = intersection;
            }
        }
    }

    if(minDist < 1e6f) {
        fragColor = vec4(closestIntersection, 0.0f, 1.0f); // 교차점 좌표 출력
    } else {
        fragColor = vec4(0.0f, 0.0f, 0.0f, 1.0f); // 교차 없음
    }
}
