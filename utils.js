import * as THREE from "three";

// const base =
//     "https://vra-configurator-dev.s3.ap-northeast-2.amazonaws.com/models/lmedit/clipped/";
export const base = "https://d1ru9emggadhd3.cloudfront.net/models/lmedit/clipped/";
export const src1k = "clipped_1k/meta.json";
export const src512 = "clipped_512/meta.json";
export const srcMerged1 = "merged1/meta.json";
export const src512png = "clipped_512_png/meta.json";
export const src1024png = "clipped_1024_png/meta.json";

export function withoutExtension(path) {
    // key.replace(/\.[^/.]+$/, "");
    return path.replace(/\.[^/.]+$/, "");
}

export async function iter(arr, fn, parallel = true) {
    if (parallel) {
        return Promise.all(arr.map(fn));
    } else {
        for (let i = 0; i < arr.length; i++) {
            await fn(arr[i], i, arr);
        }
    }
}

// 부피의 95% 이상 겹쳤는지 확인
export function isBoxOverlapped(boxA, boxB, threshold = 0.95) {
    // Clone the boxes to avoid modifying originals
    const intersection = new THREE.Box3().copy(boxA).intersect(boxB);

    // If there's no intersection, return false
    if (intersection.isEmpty()) {
        return false;
    }

    // Calculate volumes
    const volumeA = (boxA.max.x - boxA.min.x) * (boxA.max.y - boxA.min.y) * (boxA.max.z - boxA.min.z);
    const volumeIntersection = (intersection.max.x - intersection.min.x) *
        (intersection.max.y - intersection.min.y) *
        (intersection.max.z - intersection.min.z);

    // Check if overlap is greater than or equal to 95% (or custom threshold)
    return (volumeIntersection / volumeA) >= threshold;
}

export function findOverlappingBoxes(targetBox, boxArray) {
    return boxArray.filter(box => !new THREE.Box3().copy(targetBox).intersect(box).isEmpty());
}

export function findClosestBox(targetBox, boxArray) {
    if (boxArray.length === 0) return null;

    let closestBox = null;
    let minDistance = Infinity;

    boxArray.forEach(box => {
        const distance = getBoxDistance(targetBox, box);
        if (distance < minDistance) {
            minDistance = distance;
            closestBox = box;
        }
    });

    return closestBox;
}

export function getBoxDistance(boxA, boxB) {
    // Get the closest points between the two boxes
    const closestPointA = new THREE.Vector3();
    const closestPointB = new THREE.Vector3();

    boxA.clampPoint(boxB.min, closestPointA);
    boxB.clampPoint(boxA.min, closestPointB);

    // Compute Euclidean distance
    return closestPointA.distanceTo(closestPointB);
}

export function removeTrailingThreeDigitNumber(str) {
    return str.replace(/\.\d{3}$/, '');
}


// Function to convert CubeTexture to EquirectangularTexture
export function convertCubeToEquirect(cubeTexture, resolution = 1024) {
    // Create a WebGLRenderTarget for the equirectangular texture
    const renderTarget = new THREE.WebGLRenderTarget(resolution, resolution / 2, {
        format: THREE.RGBAFormat,
        magFilter: THREE.LinearFilter,
        minFilter: THREE.LinearMipmapLinearFilter,
        generateMipmaps: true
    });

    // Create a scene with a sphere to project the cube texture
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const geometry = new THREE.PlaneGeometry(2, 1);
    const material = new THREE.ShaderMaterial({
        uniforms: {
            envMap: { value: cubeTexture }
        },
        vertexShader: `
            varying vec3 vDirection;
            void main() {
                vec2 uv = position.xy;
                float phi = uv.y * 3.14159265359;
                float theta = uv.x * 2.0 * 3.14159265359;
                vDirection = vec3(
                    cos(phi) * cos(theta),
                    sin(phi),
                    cos(phi) * sin(theta)
                );
                gl_Position = vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform samplerCube envMap;
            varying vec3 vDirection;
            void main() {
                gl_FragColor = textureCube(envMap, normalize(vDirection));
            }
        `,
        side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Create a WebGLRenderer for rendering to texture
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(resolution, resolution / 2);
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);

    return renderTarget.texture;
}

// scene : THREE.Scene
// boxes : (THREE.Box3 & probeName)[]
export const _detectWallOnScene = async (scene, boxes, step = 0.1,) => {

    const meshes = [];
    scene.traverse((child) => {
        if (child.isMesh) {
            meshes.push(child);
        }
    });

    // normal : 박스 바깥방향
    // { start:THREE.Vector3; end:THREE.Vector3; normal:THREE.Vector3; name:string; }
    const wallCandidates = [];


    boxes.forEach((box, i) => {
        const min = box.min;
        const max = box.max;
        const probeName = box.probeName;

        // 중점
        const y = (max.y + min.y) * 0.5;

        // leftbottom
        const lb = new THREE.Vector3(min.x, y, min.z);
        // rightbottom
        const rb = new THREE.Vector3(max.x, y, min.z);
        // lefttop
        const lt = new THREE.Vector3(min.x, y, max.z);
        // righttop
        const rt = new THREE.Vector3(max.x, y, max.z);

        const lineBottom = {
            start: lb,
            end: rb,
            normal: new THREE.Vector3(0, 0, -1),
            name: probeName,
        };

        const lineTop = {
            start: lt,
            end: rt,
            name: probeName,
            normal: new THREE.Vector3(0, 0, 1),
        };

        const lineLeft = {
            start: lb,
            end: lt,
            name: probeName,
            normal: new THREE.Vector3(-1, 0, 0),
        };

        const lineRight = {
            start: rb,
            end: rt,
            name: probeName,
            normal: new THREE.Vector3(1, 0, 0),
        }

        wallCandidates.push(lineBottom);
        wallCandidates.push(lineTop);
        wallCandidates.push(lineLeft);
        wallCandidates.push(lineRight);

    })

    // test
    if (false) {
        wallCandidates.forEach((wall, i) => {
            const { start, end, normal, name } = wall;
            // add line from start to end, then add arrow on middle point using normal

            const points = [];
            points.push(start);
            points.push(end);

            const geometry = new THREE.BufferGeometry().setFromPoints(points);

            // hsl color from index
            const color = new THREE.Color();
            color.setHSL(i / wallCandidates.length, 1.0, 0.5);

            const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color }));

            scene.add(line);

            const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
            const arrowHelper = new THREE.ArrowHelper(normal, mid, 0.5, color);
            scene.add(arrowHelper);
        })
    }


}

// walls : { start:THREE.Vector3; end:THREE.Vector3; normal:THREE.Vector3; name:string; }[]
export const drawWalls = (walls, scene, normalLength = 0.5) => {
    walls.forEach((wall, i) => {
        const { start, end, normal, name } = wall;
        // add line from start to end, then add arrow on middle point using normal

        const points = [];
        points.push(start);
        points.push(end);

        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        // hsl color from index
        const color = new THREE.Color();
        color.setHSL(i / walls.length, 1.0, 0.5);

        const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color }));

        scene.add(line);

        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

        const arrowHelper = new THREE.ArrowHelper(normal, mid, normalLength, color);

        scene.add(arrowHelper);
    })
}

// scene : THREE.Scene
// boxes : (THREE.Box3 & probeName)[]
// return { start:THREE.Vector3; end:THREE.Vector3; normal:THREE.Vector3; name:string; }[]
export const detectWallOnScene = (scene, boxes, step = 0.1, detectDist = 0.5) => {

    const meshes = [];
    scene.traverse((child) => {
        if (child.isMesh) {
            meshes.push(child);
        }
    });

    // normal : 박스 바깥방향
    // { start:THREE.Vector3; end:THREE.Vector3; normal:THREE.Vector3; name:string; }
    const wallCandidates = [];

    const start = performance.now();
    boxes.forEach((box, i) => {
        console.log(`[${i + 1}/${boxes.length}]`);
        const min = box.min;
        const max = box.max;
        const probeName = box.probeName;

        // 중점
        const y = (max.y + min.y) * 0.5;

        // leftbottom
        const lb = new THREE.Vector3(min.x, y, min.z);
        // rightbottom
        const rb = new THREE.Vector3(max.x, y, min.z);
        // lefttop
        const lt = new THREE.Vector3(min.x, y, max.z);
        // righttop
        const rt = new THREE.Vector3(max.x, y, max.z);

        // const lineBottom = {
        //     start: lb,
        //     end: rb,
        //     normal: new THREE.Vector3(0, 0, -1),
        //     name: probeName,
        // };

        // const lineTop = {
        //     start: lt,
        //     end: rt,
        //     name: probeName,
        //     normal: new THREE.Vector3(0, 0, 1),
        // };

        // const lineLeft = {
        //     start: lb,
        //     end: lt,
        //     name: probeName,
        //     normal: new THREE.Vector3(-1, 0, 0),
        // };

        // const lineRight = {
        //     start: rb,
        //     end: rt,
        //     name: probeName,
        //     normal: new THREE.Vector3(1, 0, 0),
        // }

        // wallCandidates.push(lineBottom);
        // wallCandidates.push(lineTop);
        // wallCandidates.push(lineLeft);
        // wallCandidates.push(lineRight);



        // lb - rb
        if (!false) {
            let curx = min.x;
            let normal = new THREE.Vector3(0, 0, -1);
            let wallStart = null;
            while (curx < max.x) {
                const origin = new THREE.Vector3(curx, y, min.z);
                const raycaster = new THREE.Raycaster(origin, normal, 0, detectDist);
                const intersects = raycaster.intersectObjects(meshes);

                // 벽이 있음
                if (intersects.length > 0) {
                    if (wallStart === null) {
                        wallStart = origin;
                    }
                } else {
                    // 벽이 없음
                    if (wallStart !== null) {
                        //이전에 벽이 있었으니 벽이 끝난 경우
                        wallCandidates.push({
                            start: wallStart,
                            end: new THREE.Vector3(curx, y, min.z),
                            normal,
                            name: probeName,
                        });
                        wallStart = null;
                    }
                }
                curx += step;
            }
            // handle max.x
            if (wallStart !== null) {
                wallCandidates.push({
                    start: wallStart,
                    end: new THREE.Vector3(max.x, y, min.z),
                    normal,
                    name: probeName,
                });
            }
        }

        // rb - rt
        if (!false) {
            let curz = min.z;
            let normal = new THREE.Vector3(1, 0, 0);
            let wallStart = null;
            while (curz < max.z) {
                const origin = new THREE.Vector3(max.x, y, curz);
                const raycaster = new THREE.Raycaster(origin, normal, 0, detectDist);
                const intersects = raycaster.intersectObjects(meshes);

                // {
                //     const points = [];
                //     points.push(origin);
                //     points.push(origin.clone().add(normal.clone().multiplyScalar(detectDist)));

                //     const geometry = new THREE.BufferGeometry().setFromPoints(points);

                //     // hsl color from index
                //     const color = new THREE.Color();
                //     color.setHSL(i / boxes.length, 1.0, 0.5);

                //     const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color }));

                //     scene.add(line)
                // }

                // 벽이 있음
                if (intersects.length > 0) {

                    if (wallStart === null) {
                        wallStart = origin;
                    }
                    // 이 외의 경우는 벽이 지속되는 경우

                } else {
                    // 벽이 없음
                    if (wallStart !== null) {
                        //이전에 벽이 있었으니 벽이 끝난 경우
                        wallCandidates.push({
                            start: wallStart,
                            end: new THREE.Vector3(max.x, y, curz),
                            normal,
                            name: probeName,
                        });
                        wallStart = null;
                    }
                    // 이 외의 경우는 벽이 없음이 지속되는 경우
                }
                curz += step;
            }
            // handle max.z
            if (wallStart !== null) {
                wallCandidates.push({
                    start: wallStart,
                    end: new THREE.Vector3(max.x, y, max.z),
                    normal,
                    name: probeName,
                });
            }
        }

        // rt - lt
        if (!false) {
            let curx = max.x;
            let normal = new THREE.Vector3(0, 0, 1);
            let wallStart = null;
            while (curx > min.x) {
                const origin = new THREE.Vector3(curx, y, max.z);
                const raycaster = new THREE.Raycaster(origin, normal, 0, detectDist);
                const intersects = raycaster.intersectObjects(meshes);

                // 벽이 있음
                if (intersects.length > 0) {
                    if (wallStart === null) {
                        wallStart = origin;
                    }
                } else {
                    // 벽이 없음
                    if (wallStart !== null) {
                        //이전에 벽이 있었으니 벽이 끝난 경우
                        wallCandidates.push({
                            start: wallStart,
                            end: new THREE.Vector3(curx, y, max.z),
                            normal,
                            name: probeName,
                        });
                        wallStart = null;
                    }
                }
                curx -= step;
            }
            // handle min.x
            if (wallStart !== null) {
                wallCandidates.push({
                    start: wallStart,
                    end: new THREE.Vector3(min.x, y, max.z),
                    normal,
                    name: probeName,
                });
            }
        }

        // lt - lb
        if (!false) {
            let curz = max.z;
            let normal = new THREE.Vector3(-1, 0, 0);
            let wallStart = null;
            while (curz > min.z) {
                const origin = new THREE.Vector3(min.x, y, curz);
                const raycaster = new THREE.Raycaster(origin, normal, 0, detectDist);
                const intersects = raycaster.intersectObjects(meshes);

                // 벽이 있음
                if (intersects.length > 0) {
                    if (wallStart === null) {
                        wallStart = origin;
                    }
                } else {
                    // 벽이 없음
                    if (wallStart !== null) {
                        //이전에 벽이 있었으니 벽이 끝난 경우
                        wallCandidates.push({
                            start: wallStart,
                            end: new THREE.Vector3(min.x, y, curz),
                            normal,
                            name: probeName,
                        });
                        wallStart = null;
                    }
                }
                curz -= step;
            }
            // handle min.z
            if (wallStart !== null) {
                wallCandidates.push({
                    start: wallStart,
                    end: new THREE.Vector3(min.x, y, min.z),
                    normal,
                    name: probeName,
                });
            }
        }


    })

    const elapsed = performance.now() - start;
    console.log(`elapsed time : ${elapsed} ms`);

    return wallCandidates;
}

export function serializeVector3(vector) {
    return { x: vector.x, y: vector.y, z: vector.z };
}

export function serializeArray(data) {
    return JSON.stringify(data.map(item => ({
        start: serializeVector3(item.start),
        end: serializeVector3(item.end),
        normal: serializeVector3(item.normal),
        name: item.name
    })));
}

export function deserializeVector3(obj) {
    return new THREE.Vector3(obj.x, obj.y, obj.z);
}

export function deserializeArray(jsonobj) {
    return jsonobj.map(item => ({
        start: deserializeVector3(item.start),
        end: deserializeVector3(item.end),
        normal: deserializeVector3(item.normal),
        name: item.name
    }));
}
