import * as THREE from "three";
import {
    base,
    src1k,
    src512,
    srcMerged1,
    src512png,
    src1024png,
    withoutExtension,
    findClosestBox,
    findOverlappingBoxes,
    removeTrailingThreeDigitNumber,
    convertCubeToEquirect,
    detectWallOnScene,
    deserializeArray,
    serializeArray,
    drawWalls
} from "utils"
import Loader, { getProbeBoxes } from "loader"
import useBoxProjectedEnvMap from "BoxProjection"
import hash from "object-hash"

const probeResolution = 256;

const {
    scene, camera, renderer, controls,
    gltfLoader, ktx,
    textureLoader,
    theLoader,
    init
} = Loader;

const shaders = [];
// [ { name:string; box:THREE.Box3; } ]
const probeBoxes = getProbeBoxes();

// [ THREE.Box3 & { probeName: string; } ]
const probeBoxOnly = probeBoxes.map(p => {
    const box = p.box;
    box.probeName = p.name;
    return box;
});

// [ {
//      name:string;
//      box:THREE.Box3;
//      texture:THREE.CubeTexture;
//      center:THREE.Vector3;
//      size: THREE.Vector3
//  } ]
let probeMeta;
let showProbe = true;

// const base = "https://d1ru9emggadhd3.cloudfront.net/models/lmedit/";

function status(msg) {
    st.innerHTML = msg;
}

function camdir(vec) {
    camDirection.innerHTML = `Camera Direction: ${vec.x.toFixed(2)}, ${vec.y.toFixed(2)}, ${vec.z.toFixed(2)}`;
}

function campos(vec) {
    camPosition.innerHTML = `Camera Position: ${vec.x.toFixed(2)}, ${vec.y.toFixed(2)}, ${vec.z.toFixed(2)}`;
}

function matworld(mat) {
    matWorld.innerHTML = `Matrix World: ${mat.elements.map((e) => e.toFixed(2)).join(", ")}`;
}

const camDir = new THREE.Vector3(0, 0, 1);
const camPos = new THREE.Vector3(0, 0, 0);
const matrixWorld = new THREE.Matrix4();

function unselectAll(except) {
    scene.traverse((o) => {
        if (o.isMesh) {
            if (o.name === except) {
                return;
            }
            const mat = o.material;
            if (mat) {
                mat.wireframe = false;
            }
        }
    });
}

function toggleSelect(name) {

    unselectAll(name);

    scene.traverse((o) => {
        if (o.isMesh) {
            if (o.material && o.name === name) {
                o.material.wireframe = !o.material.wireframe;
            }
        }
    });

}

const wallFileName = "walls.json"
const getWalls = async () => {
    return fetch("/" + wallFileName).then(res => res.json()).then(deserializeArray).catch(e => {
        // no such file

        console.error(e);

        const walls = detectWallOnScene(scene, probeBoxOnly, 0.05);

        const jsonobj = serializeArray(walls);

        // save it
        const filanme = wallFileName;
        const a = document.createElement("a");
        const file = new Blob([jsonobj], { type: "application/json" });
        a.href = URL.createObjectURL(file);
        a.download = filanme;
        a.click();

        return walls;
    })
}

function animate() {
    requestAnimationFrame(animate);

    camera.getWorldDirection(camDir);
    camera.getWorldPosition(camPos);
    camera.matrixWorld.copy(matrixWorld)

    camdir(camDir);
    campos(camPos);
    matworld(matrixWorld);

    renderer.render(scene, camera);
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function onPointerMove(event) {

    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components

    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

}

function onPointerClick(event) {
    raycaster.setFromCamera(pointer, camera);

    let intersects = raycaster.intersectObjects(scene.children, true).filter(i => {
        return !["Box3Helper"].includes(i.object.type)
    })

    intersects = intersects.filter(i => {
        return i.object.visible;
    });

    if (intersects.length > 0) {
        console.log(intersects[0]);
        // console.log(intersects[0].point, intersects[0],);
        console.log(intersects[0].point.x, intersects[0].point.y, intersects[0].point.z, intersects[0]?.object?.name);
    }

    if (intersects.length > 0 && intersects[0]?.object?.name) {
        // toggleSelect(intersects[0].object.name);
    }
}

document.getElementById("load512png").addEventListener("click", () => {
    theLoader(base + src512png, "clipped_512_png/", status);
});

document.getElementById("exposure").addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    scene.traverse((o) => {
        if (o.isMesh) {
            const mat = o.material;
            if (mat) {
                if (mat.userData.lightmapIntensity) {
                    mat.lightMapIntensity = mat.userData.lightmapIntensity * val;
                }
            }
        }
    });
});

document.getElementById("metalness").addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    scene.traverse((o) => {
        if (o.isMesh) {
            const mat = o.material;
            if (mat) {
                mat.metalness = val;
            }
        }
    });
});

// roughness
document.getElementById("roughness").addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    scene.traverse((o) => {
        if (o.isMesh) {
            const mat = o.material;
            if (mat) {
                mat.roughness = val;
            }
        }
    });
});

//probeBlend
document.getElementById("probeBlend").addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);

    shaders.forEach(shader => {
        shader.uniforms.uProbeBlendDist.value = val;
    })
});

//probeIntensity
document.getElementById("probeIntensity").addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);

    shaders.forEach(shader => {
        const keys = Object.keys(shader.uniforms);
        const theKey = keys.find(k => k.includes("uProbeIntensity"));
        shader.uniforms[theKey].value = val;
    })

    // function obc(shader) {
    //     onBeforeCompileFunc(shader);
    //     shader.uniforms = {
    //         ...shader.uniforms,
    //         uProbeIntensity: {
    //             value: val
    //         }
    //     }
    //     console.log(shader.uniforms.uProbeIntensity);
    // };;

    // scene.traverse((o) => {
    //     if (o.isMesh) {
    //         const mat = o.material;
    //         if (mat) {
    //             // uniform
    //             mat.onBeforeCompile = obc
    //             mat.needsUpdate = undefined;
    //         }
    //     }
    // });
});

function hashStringArray(arr) {
    let hash = 0;
    const prime = 31; // 작은 소수를 사용하여 충돌을 줄임

    for (let str of arr) {
        for (let i = 0; i < str.length; i++) {
            hash = (hash * prime + str.charCodeAt(i)) % 1_000_000_007;
        }
    }

    return hash.toString(16); // 16진수 문자열로 변환
}

const hashmap = new Map();

/** @type { null | { start:THREE.Vector3; end:THREE.Vector3; normal:THREE.Vector3; name:string }[] } */
let _walls = null;

const createOnBeforeCompileFunc = async (names, mat, mesh) => {

    if (!_walls) {
        _walls = await getWalls();
    }

    /** @type { { start:THREE.Vector3; end:THREE.Vector3; normal:THREE.Vector3; name:string }[] }*/
    const allWalls = [..._walls];

    const targetNames = [...names];
    // targetNames.sort();
    const namehash = hashStringArray(targetNames);
    console.log(mesh.name, mesh.material.name, "Hash : ", namehash, mat.id, targetNames);
    mat.defines = mat.defines ?? {};
    hashmap.set(namehash, targetNames);

    const SHADER_NAME = removeTrailingThreeDigitNumber(mat.name) + namehash; // !중요 : 이름을 넣어주지 않으면 캐싱된 셰이더와 헷갈려함

    mat.defines.SHADER_NAME = SHADER_NAME
    // mat.name = mat.name+namehash;

    const metas = probeMeta.filter(p => targetNames.includes(p.name));

    /** @type { { start:THREE.Vector3; end:THREE.Vector3; index:number }[] } */
    const targetWalls = allWalls.filter(w => targetNames.includes(w.name)).map((wall) => ({
        start: wall.start,
        end: wall.end,
        index: targetNames.indexOf(wall.name)
    }));

    // const wallCounts = targetWalls.reduce((acc, w) => {
    //     if (acc[w.index] === undefined) {
    //         acc.push(1);
    //     } else {
    //         acc[w.index]++;
    //     }
    //     return acc;
    // }, []);



    // if(wallCounts.length>1){
    //     debugger;
    // }

    /** @type { {center:THREE.Vector3; size:THREE.Vector3; }[] } */
    const metaUniform = metas.map((p, index) => ({
        center: p.center,
        size: p.size,
    }))
    const textures = metas.map(p => p.texture);


    // console.log("Names : ", targetNames, metaUniform);

    const uProbe = `_uProbe${namehash}`;
    const uProbeTextures = `_uProbeTextures${namehash}`;
    const uProbeIntensity = `_uProbeIntensity${namehash}`;
    const uWall = `_uWall${namehash}`;

    const uniforms = {
        [uProbe]: {
            value: metaUniform
        },
        [uProbeTextures]: {
            value: textures
        },
        [uProbeIntensity]: {
            value: 1.0
        },
        [uWall]: {
            value: targetWalls
        },
        uProbeBlendDist: {
            value: 8.0
        }
    };

    // console.log(uniforms);

    // if(metas.length === 0){
    //     debugger;
    // }

    const defines = {
        PROBE_COUNT: metas.length,
        WALL_COUNT: targetWalls.length,
        uProbe,
        uProbeTextures,
        uProbeIntensity,
        uWall,
        SHADER_NAME: mat.name
        // SHADER_NAME
    }

    if (mesh.name === "거실DP_2") {
        // debugger;
    }

    if (mesh.name === "현관_BASE_4") {
        // debugger;
    }

    return shader => {
        useBoxProjectedEnvMap(shader, {
            uniforms,
            defines,
            namehash,
            meshName: mesh.name,
            matName: mat.name
        });
        shaders.push(shader);
    }
}

const toggleProbe = () => {
    if (showProbe) {
        probeBoxes.forEach((probe, i) => {
            const color = new THREE.Color().setHSL(i / probeBoxes.length, 1.0, 0.5);

            const box = probe.box;
            const helper = new THREE.Box3Helper(box, color);
            helper.name = probe.name;

            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 32, 32),
                new THREE.MeshBasicMaterial({ color: color })
            );
            helper.userData.isProbe = true;
            sphere.userData.isProbe = true;
            sphere.position.copy(box.getCenter(new THREE.Vector3()));
            scene.add(sphere);
            scene.add(helper);
        });
    } else {
        const toRemoves = [];
        scene.traverse(o => {
            if (o.userData.isProbe) {
                toRemoves.push(o);
            }
        });
        toRemoves.forEach(o => o.removeFromParent());
    }
    showProbe = !showProbe;
}

const createProbeMeta = () => {
    const cubeCapture = (center/**THREE.Vector3 */, name) => {

        const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(probeResolution, {
            format: THREE.RGBFormat,
            generateMipmaps: true,
            minFilter: THREE.LinearMipmapLinearFilter,
            magFilter: THREE.LinearFilter,
        });
        const cubeCamera = new THREE.CubeCamera(0.1, 10, cubeRenderTarget);

        cubeCamera.position.copy(center);
        cubeCamera.update(renderer, scene);
        const cubeTexture = cubeCamera.renderTarget.textures[0];
        cubeTexture.name = name;

        // const generator = new THREE.PMREMGenerator(renderer);
        // generator.compileCubemapShader();
        // // generator.compileEquirectangularShader();

        // const envMap = generator.fromCubemap(cubeTexture).texture;

        // const envMap = convertCubeToEquirect(cubeTexture, probeResolution);

        // dispose
        // cubeRenderTarget.dispose();
        // cubeCamera.dispose();

        // console.log(envMap);

        return {
            cubeTexture,
            // cubeTexture: envMap,
            // envTexture: envMap
        }
    }

    const now = performance.now();

    // [ { name : string; box: THREE.Box3 },  ]
    probeMeta = probeBoxes.map(probe => {
        return {
            name: probe.name,
            box: probe.box,
            center: probe.box.getCenter(new THREE.Vector3()),
            size: probe.box.getSize(new THREE.Vector3()),
            texture: cubeCapture(probe.box.getCenter(new THREE.Vector3()), probe.name).cubeTexture
        }
    })

    const elapsed = performance.now() - now;
    console.log("elapsed", elapsed);
};


document.getElementById("btnCaptureProbe").addEventListener("click", createProbeMeta);

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('pointermove', onPointerMove);
window.addEventListener('click', onPointerClick);
window.addEventListener('keydown', (e) => {
    // unselect all on esc
    if (e.key === "Escape") {
        unselectAll();
    }
});

const color0 = new THREE.Color().setHSL(0.0, 1.0, 0.5);
const color1 = new THREE.Color().setHSL(0.1, 1.0, 0.5);
const color2 = new THREE.Color().setHSL(0.2, 1.0, 0.5);
const color3 = new THREE.Color().setHSL(0.3, 1.0, 0.5);
const color4 = new THREE.Color().setHSL(0.4, 1.0, 0.5);
const color5 = new THREE.Color().setHSL(0.5, 1.0, 0.5);
const color6 = new THREE.Color().setHSL(0.6, 1.0, 0.5);
const color7 = new THREE.Color().setHSL(0.7, 1.0, 0.5);
const color8 = new THREE.Color().setHSL(0.8, 1.0, 0.5);
const color9 = new THREE.Color().setHSL(0.9, 1.0, 0.5);


btnTest1.onclick = async () => {
    const helpers = [];
    const clones = [];

    const cares = [
        "거실DP_2",
        // "거실base_1",
        "프레임",
        // "바닥",
        // "화장실1_BASE_1",
        // "화장실1_BASE_2",
        // "화장실1_BASE_3",
        // "화장실1_BASE2_1",
        // "화장실1_BASE2_2",
        // "화장실1_BASE2_3",
        // "화장실1_BASE2_4",
        // "화장실1_BASE2_5",
        // "화장실1_BASE2_6",
        // "화장실1_BASE2_7",
        // "화장실1_BASE2_8",
        // "화장실1_BASE2_9",
        "화장실1_BASE2_10",
        // "화장실1_BASE2_11",
        // "화장실1_BASE2_12",
        // "화장실1_BASE2_13",
        // "화장실1_BASE2_14",
        // "화장실1_BASE2_15",
        // "화장실1_BASE2_16",

    ];

    const proms = [];

    scene.traverse(async (mesh) => {

        if (mesh.isMesh) {
            const mat = mesh.material;

            if (!mat) {
                return;
            }

            const box = new THREE.Box3();
            box.setFromObject(mesh);

            const overlappingBoxes = findOverlappingBoxes(box, probeBoxOnly);

            if (overlappingBoxes.length === 0) {
                // throw new Error("No overlapping boxes");
                const closestProbe = findClosestBox(box, probeBoxOnly);
                console.log(mesh.name, " : ", closestProbe.probeName);

                const prom = createOnBeforeCompileFunc([
                    closestProbe.probeName
                ], mat, mesh).then(func => {
                    mat.onBeforeCompile = func;
                    mat.needsUpdate = undefined;
                    return true;
                })

                proms.push(prom);

            } else if (overlappingBoxes.length >= 1) {

                // console.log("Calling createOnBeforeCompileFunc", mat.name)

                const prom = createOnBeforeCompileFunc(overlappingBoxes.map(b => b.probeName), mat, mesh).then(func => {
                    mat.onBeforeCompile = func;

                    // mat.program = null;
                    // mat.needsUpdate = true;
                    mat.needsUpdate = undefined;
                    return true;
                })

                proms.push(prom);


            }
        }
    });

    Promise.all(proms).then(() => {
        const start = performance.now();
        status("Start probe...")
        renderer.compileAsync(scene, camera).then(() => {
            const elapsed = performance.now() - start;
            console.log("elapsed", elapsed);
            status(`Probe : ${elapsed.toFixed(2)} ms`);

            console.log(hashmap);
        })

        clones.forEach(clone => {

            scene.add(clone);
        });

        console.log("Helpers : ", helpers.length)
        helpers.forEach(helper => {
            scene.add(helper)
        })
    })


}

btnDetectWall.onclick = () => {
    getWalls().then(walls => {
        drawWalls(walls, scene)
    })
}

btnShowProbe.onclick = toggleProbe;


animate();