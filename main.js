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
    removeTrailingThreeDigitNumber
} from "utils"
import Loader, { getProbeBoxes } from "loader"
import useBoxProjectedEnvMap from "BoxProjection"
import hash from "object-hash"

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


const createOnBeforeCompileFunc = (names, mat, mesh) => {
    const targetNames = [...names];
    // targetNames.sort();
    const namehash = hashStringArray(targetNames);
    console.log(mesh.name, mesh.material.name, "Hash : ", namehash, mat.id, targetNames);
    mat.defines = mat.defines ?? {};
    mat.defines.SHADER_NAME = removeTrailingThreeDigitNumber(mat.name) + namehash; // !중요 : 이름을 넣어주지 않으면 캐싱된 셰이더와 헷갈려함
    // mat.name = mat.name+namehash;

    const metas = probeMeta.filter(p => targetNames.includes(p.name));
    const metaUniform = metas.map(p => ({
        center: p.center,
        size: p.size
    }))
    const textures = metas.map(p => p.texture);

    // console.log("Names : ", targetNames, metaUniform);

    const uProbe = `_uProbe${namehash}`;
    const uProbeTextures = `_uProbeTextures${namehash}`;
    const uProbeIntensity = `_uProbeIntensity${namehash}`;

    const uniforms = {
        [uProbe]: {
            value: metaUniform
        },
        [uProbeTextures]: {
            value: textures
        },
        [uProbeIntensity]: {
            value: 1.0
        }
    };

    // console.log(uniforms);

    // if(metas.length === 0){
    //     debugger;
    // }

    const defines = {
        PROBE_COUNT: metas.length,
        uProbe,
        uProbeTextures,
        uProbeIntensity,
        SHADER_NAME: mat.name
    }

    if (mesh.name === "거실DP_2") {
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

const createProbeMeta = () => {
    const cubeCapture = (center/**THREE.Vector3 */, name) => {

        const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512, {
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

        // console.log(envMap);

        return {
            cubeTexture,
            // cubeTexture: envMap,
            // envTexture: envMap
        }
    }

    const now = performance.now();

    const showProbe = !true;
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
            sphere.position.copy(box.getCenter(new THREE.Vector3()));
            scene.add(sphere);
            scene.add(helper);
        });
    }


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


btnTest1.onclick = () => {
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

    scene.traverse(mesh => {



        if (mesh.isMesh) {
            const mat = mesh.material;



            if (false && mesh.name === "주방base_6") {
                const cloned = mesh.clone();
                cloned.material = cloned.material.clone();
                cloned.material.wireframe = true;
                // copy world position
                cloned.position.copy(mesh.position);
                cloned.rotation.copy(mesh.rotation);
                cloned.scale.copy(mesh.scale);
                clones.push(cloned);
            }

            if (mat) {

                // if (!cares.includes(mesh.name)) {
                //     // console.log("!", mesh.name)
                //     mat.visible = false;
                //     return;
                // }


                const box = new THREE.Box3();
                box.setFromObject(mesh);

                // const boxHelper = new THREE.Box3Helper(box);
                //     helpers.push(boxHelper);

                const overlappingBoxes = findOverlappingBoxes(box, probeBoxOnly);


                if (!true) {
                    if (overlappingBoxes.length >= 1) {
                        console.log(mesh.name, " : ", overlappingBoxes[0].probeName);
                        mat.onBeforeCompile = createOnBeforeCompileFunc(overlappingBoxes.map(b => b.probeName), mat, mesh);
                        // mat.transparent = true;
                        // mat.opacity = 0.0;
                        mat.needsUpdate = undefined;

                        // console.log(overlappingBoxes.length, "개 : ", overlappingBoxes.map(b => b.probeName).join(", "));

                    } else {
                        // mat.transparent = true;
                        // mat.opacity = 0.0;
                        // mat.visible = false;
                        // mat.needsUpdate = undefined;
                        mesh.visible = false;
                    }
                } else {
                    if (overlappingBoxes.length === 0) {
                        // throw new Error("No overlapping boxes");
                        const closestProbe = findClosestBox(box, probeBoxOnly);
                        console.log(mesh.name, " : ", closestProbe.probeName);

                        mat.onBeforeCompile = createOnBeforeCompileFunc([
                            closestProbe.probeName
                        ], mat, mesh);
                        mat.needsUpdate = undefined;

                        // console.log("근처 : ", closestProbe.probeName);
                    } else if (overlappingBoxes.length >= 1) {

                        console.log("Calling createOnBeforeCompileFunc", mat.name)
                        mat.onBeforeCompile = createOnBeforeCompileFunc(overlappingBoxes.map(b => b.probeName), mat, mesh);
                        // mat.transparent = true;
                        // mat.opacity = 0.0;
                        mat.needsUpdate = undefined;

                        // console.log(overlappingBoxes.length, "개 : ", overlappingBoxes.map(b => b.probeName).join(", "));

                    }
                }



            }
        }
    });


    const start = performance.now();
    status("Start probe...")
    renderer.compileAsync(scene, camera).then(()=>{
        const elapsed = performance.now() - start;
        console.log("elapsed", elapsed);
        status(`Probe : ${elapsed.toFixed(2)} ms`);
    })

    // clones.forEach(clone => {

    //     scene.add(clone);
    // });

    // console.log("Helpers : ", helpers.length)
    // helpers.forEach(helper => {
    //     scene.add(helper)
    // })
}


animate();