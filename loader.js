import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

import { base, withoutExtension, iter } from "utils"
import CubeCamera from "CubeCamera";

let scene, camera, renderer, controls;
let gltfLoader, ktx;
const textureLoader = new THREE.TextureLoader();
// const textureLoader = new THREE.DataTextureLoader();

// 바닥좌표 네 개
const boxY = 2.38;

const coords = [
    // {
    //     name: "kitchen",
    //     min: new THREE.Vector3(-2.7, 0, -4.0),
    //     max: new THREE.Vector3(1.13, 0, -0.1),
    // },
    // {
    //     name: "livingRoom",
    //     min: new THREE.Vector3(-3.5, 0, -0.1),
    //     max: new THREE.Vector3(1.12, 0, 4.4),
    // },
    {
        name: "kitchen&livingroom",
        min: new THREE.Vector3(-3.5, 0, -4.0),
        max: new THREE.Vector3(1.12, 0, 4.4),
    },

    {
        name: "master",
        min: new THREE.Vector3(-8.1, 0, 2),
        max: new THREE.Vector3(-4.17, 0, 4.71),
    },
    {
        name: "masterMirror",
        min: new THREE.Vector3(-8.1, 0, 0.0),
        max: new THREE.Vector3(-4.35, 0, 1.18),
    },
    {
        name: "entrance",
        min: new THREE.Vector3(7.45, 0, -2.41),
        max: new THREE.Vector3(8.50, 0, 1.01),
    },
    {
        name: "corridor",
        min: new THREE.Vector3(1.03, 0, 0.0),
        max: new THREE.Vector3(7.37, 0, 1.03),
    },

    {
        name: "alpha",
        min: new THREE.Vector3(1.36, 0, 1.25),
        max: new THREE.Vector3(3.36, 0, 4.7),
    },
    {
        name: "room1",
        min: new THREE.Vector3(3.7, 0, 1.25),
        max: new THREE.Vector3(6.3, 0, 4.7),
    },
    {
        name: "room2",
        min: new THREE.Vector3(6.5, 0, 1.25),
        max: new THREE.Vector3(9.4, 0, 4.7),
    },
    
    {
        name: "toilet1",
        min: new THREE.Vector3(3.19, 0, -1.80),
        max: new THREE.Vector3(5.25, 2.23, -0.31),
    },
    {
        name: "toilet2-1",
        min: new THREE.Vector3(-5.29, 0, -1.78),
        max: new THREE.Vector3(-3.90, 0, -0.49),
    },
    {
        name: "toilet2-2",
        min: new THREE.Vector3(-5.32, 0, -2.68),
        max: new THREE.Vector3(-4.27, 0, -1.86),
    },
    {
        name: "masterdress",
        min: new THREE.Vector3(-9.37, 0, -2.78),
        max: new THREE.Vector3(-5.60, 0, -0.38),
    },
];

export function getProbeBoxes() {

    const retval = coords.map((coord) => {
        const { min, max } = coord;
        if (max.y < 0.1) {
            max.y = boxY;
        }
        return {
            name: coord.name,
            box: new THREE.Box3(min, max)
        };
    }
    );

    return retval;
}


function init(onMsg) {
    scene = new THREE.Scene();

    scene.add(CubeCamera);

    // const gridHelper = new THREE.GridHelper(20, 20);
    // scene.add(gridHelper);

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 2, 5);

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        premultipliedAlpha: true,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference: "high-performance",
        depth: true,
        failIfMajorPerformanceCaveat: false,
        toneMappingExposure: 1,
        localClippingEnabled: false,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    theContainer.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);

    if (!ktx) {
        ktx = new KTX2Loader();
        ktx.setTranscoderPath(
            "https://unpkg.com/three@0.170.0/examples/jsm/libs/basis/"
        );
        ktx.detectSupport(renderer);
        const maxWorker = navigator.hardwareConcurrency || 4;
        onMsg?.(
            `Worker limit : ${maxWorker}/${navigator.hardwareConcurrency}`
        );
        ktx.setWorkerLimit(maxWorker);
    }

    if (!gltfLoader) {
        gltfLoader = new GLTFLoader();
        const draco = new DRACOLoader();
        draco.setDecoderPath(
            "https://www.gstatic.com/draco/versioned/decoders/1.5.7/"
        );
        gltfLoader.setDRACOLoader(draco);
        gltfLoader.setKTX2Loader(ktx);
        gltfLoader.setMeshoptDecoder(MeshoptDecoder);
    }
}
init()


async function loadModel(model, path, onMsg) {
    const { glb, lightmap, lightmapIntensity } = model;

    // glb는 clipped_1k에만 올려놨음
    const glbPath = path.includes("clipped") ? "clipped_1k/" : path;
    return gltfLoader.loadAsync(base + glbPath + glb).then((gltf) => {
        scene.add(gltf.scene);

        // gltf.scene.traverse((obj) => {
        //     if (obj.isMesh) {
        //         const mat = obj.material;
        //         if (mat) {
        //             for (const key of Object.keys(mat)) {
        //                 const value = mat[key];
        //                 if (
        //                     value &&
        //                     typeof value === "object" &&
        //                     "minFilter" in value &&
        //                     "magFilter" in value &&
        //                     "anisotropy" in value
        //                 ) {
        //                     value.minFilter = THREE.LinearMipmapLinearFilter;
        //                     value.magFilter = THREE.LinearFilter;
        //                     value.anisotropy = renderer.capabilities.getMaxAnisotropy();
        //                 }
        //             }
        //         }
        //     }
        // });

        if (lightmap) {
            if (!lightmapIntensity) {
                debugger;
            }
            if (lightmap.endsWith(".ktx2")) {
                ktx.load(base + path + lightmap, (texture) => {
                    texture.flipY = false;
                    texture.channel = 1;
                    texture.minFilter = THREE.LinearMipmapLinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    texture.anisotropy =
                        renderer.capabilities.getMaxAnisotropy();
                    texture.needsUpdate = true;

                    gltf.scene.traverse((obj) => {

                        if (obj.isMesh) {

                            obj.material.lightMap = texture;
                            obj.material.lightMapIntensity = lightmapIntensity ?? 1;
                            if (lightmapIntensity) {
                                obj.material.userData.lightmapIntensity =
                                    lightmapIntensity;
                            }
                            obj.material.needsUpdate = true;
                        }
                    });
                });
            } else {
                textureLoader.load(base + path + lightmap, (texture) => {

                    texture.flipY = false;
                    texture.minFilter = THREE.LinearMipmapLinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    texture.anisotropy =
                        renderer.capabilities.getMaxAnisotropy();
                    texture.channel = 1;
                    texture.needsUpdate = true;


                    gltf.scene.traverse((obj) => {
                        if (obj.isMesh) {

                            obj.material.lightMap = texture;
                            obj.material.lightMapIntensity = lightmapIntensity ?? 1;
                            if (lightmapIntensity) {
                                obj.material.userData.lightmapIntensity =
                                    lightmapIntensity;
                            }
                            obj.material.needsUpdate = true;
                        }
                    });
                });
            }
        }
    });
}


function theLoader(remoteSrc, path, onMsg) {
    const start = performance.now();

    fetch(remoteSrc)
        .then((res) => res.json())
        .then(async (data) => {
            const models = data.models;
            const filtered = [
                ...data.models.slice(47, 48),

                ...data.models.slice(5, 8),
                ...data.models.slice(15, 18),
                ...data.models.slice(33, 40),
            ]

            // const filtered = models.slice(1);
            // const filtered = models.slice(0,3);
            // const filtered = models;

            return iter(filtered, (async (model, i) => {
                const { glb } = model

                onMsg?.(
                    `Loading [${i + 1}/${filtered.length}] ${withoutExtension(glb)}`
                );
                return loadModel(model, path);
            }), !false)

        })
        .finally(() => {
            const elapsed = performance.now() - start;
            onMsg?.(`Loaded in ${elapsed.toFixed(2)} ms`);
        });
}


export default {
    scene, camera, renderer, controls,
    gltfLoader, ktx,
    textureLoader,
    theLoader,
    init,
}
