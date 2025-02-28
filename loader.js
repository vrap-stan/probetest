import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

import u from "utils"
import CubeCamera from "CubeCamera";
const { base, withoutExtension, iter } = u;

let scene, camera, renderer, controls;
let gltfLoader, ktx;
const textureLoader = new THREE.TextureLoader();
// const textureLoader = new THREE.DataTextureLoader();

// 바닥좌표 네 개
const boxY = 2.38;

const coords = [
    {
        name: "kitchen",
        min: new THREE.Vector3(-2.7, 0, -4.0),
        max: new THREE.Vector3(1.13, 0, -0.1),
    },
    {
        name: "livingRoom",
        min: new THREE.Vector3(-3.5, 0, -0.1),
        max: new THREE.Vector3(1.12, 0, 4.4),
    },
    // {
    //     name: "masterMirror",
    //     min: new THREE.Vector3(-8.1, 0, 0.0),
    //     max: new THREE.Vector3(-4.35, 0, 1.18),
    // },
    // {
    //     name: "corridor",
    //     min: new THREE.Vector3(1.03, 0, 0.0),
    //     max: new THREE.Vector3(8.5, 0, 1.03),
    // }
];

export function getProbeBoxes() {

    const retval = coords.map((coord) => {
        const { min, max } = coord;
        max.y = boxY;
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
            // const models = [
            //     ...data.models.slice(47, 48),

            //     ...data.models.slice(5, 8),
            //     ...data.models.slice(15, 18),
            //     ...data.models.slice(33, 40),
            // ]

            return iter(models, (async (model, i) => {
                const { glb } = model

                onMsg?.(
                    `Loading [${i + 1}/${models.length}] ${withoutExtension(glb)}`
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
