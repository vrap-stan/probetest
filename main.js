import * as THREE from "three";
import Utils from "utils"
import Loader, { getProbeBoxes } from "loader"
import useBoxProjectedEnvMap from "BoxProjection"
import cubeCamera from "CubeCamera";
import PmremGenerator from "PmremGenerator";

const {
    base,
    src1k,
    src512,
    srcMerged1,
    src512png,
    src1024png,
    withoutExtension,
} = Utils

const {
    scene, camera, renderer, controls,
    gltfLoader, ktx,
    textureLoader,
    theLoader,
    init
} = Loader;


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

    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        // console.log(intersects[0]);
        console.log(intersects[0].point, intersects[0],);
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

document.getElementById("btnApplyMirror").addEventListener("click", () => {

    const names = [
        "거실base_9",
        "바닥",
        // "주방DP_냉장고수납장_1",
        // "주방DP_식탁_1",
        "거실base_1"
    ]

    const meshes = []

    scene.traverse(o => {
        if (o.isMesh && names.includes(o.name)) {
            meshes.push(o);
        }
    })

    if (meshes.length !== names.length) {
        console.warn("못 찾은 메쉬가 있습니다.");
        console.warn(names)
        console.warn(meshes.map(o => o.name))
        return;
    }

    // console.log(floor);
    const calcBox = (box, color) => {
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // add red sphere to center
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.05),
            new THREE.MeshBasicMaterial({ color })
        );
        sphere.position.copy(center);
        scene.add(sphere);

        return {
            center, size
        }
    }

    const cubeCapture = (center/**THREE.Vector3 */) => {
        const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
            format: THREE.RGBFormat,
            generateMipmaps: true,
            minFilter: THREE.LinearMipmapLinearFilter,
            magFilter: THREE.LinearFilter,
        });
        const cubeCamera = new THREE.CubeCamera(0.1, 10, cubeRenderTarget);
        cubeCamera.position.copy(center);
        cubeCamera.update(renderer, scene);
        const cubeTexture = cubeCamera.renderTarget.textures[0];

        // const generator = new THREE.PMREMGenerator(renderer);
        // generator.compileCubemapShader();
        // generator.compileEquirectangularShader();
        // debugger;
        // const generator = PmremGenerator(renderer);

        // const envMap = generator.fromCubemap(cubeTexture).texture;

        return {
            cubeTexture,
            // envTexture: envMap
        }
    }

    const now = performance.now();

    // [ { name : string; box: THREE.Box3 },  ]
    const probeBoxes = getProbeBoxes();
    const probeMeta = probeBoxes.map(probe => {
        return {
            center: probe.box.getCenter(new THREE.Vector3()),
            size: probe.box.getSize(new THREE.Vector3())
        }
    })

    const textures = probeBoxes.map(probe => {
        return cubeCapture(probe.box.getCenter(new THREE.Vector3())).cubeTexture
    });

    const elapsed = performance.now() - now;

    console.log("elapsed", elapsed);

    probeMeta.forEach((prove, i) => {
        const colorFromI = new THREE.Color().setHSL(i / probeMeta.length, 1.0, 0.5);
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.05),
            new THREE.MeshBasicMaterial({ color: colorFromI })
        );
        sphere.position.copy(prove.center);
        scene.add(sphere);
    })

    const uniforms = {
        uProbe: {
            value: probeMeta
        },
        uProbeTextures: {
            value: textures
        }
    }

    const defines = {
        PROBE_COUNT: probeBoxes.length
    }

    // debugger;

    // debugger;


    scene.traverse(mesh => {
        // meshes.forEach(mesh=>{
        if (mesh.isMesh) {
            const mat = mesh.material;

            if (typeof mat.roughness !== "undefined") {
                mat.defines = {
                    ...(mat.defines ?? {}),
                    ...defines
                }

                mat.metalness = 1.0;
                mat.roughness = 0.0;

                mat.onBeforeCompile = shader => useBoxProjectedEnvMap(shader, {
                    uniforms,
                });

                // mat.envMap = livingTex.cubeTexture;
                // mat.envMap = cubeTexture;


                mat.needsUpdate = true;
            }


        }

    })


})

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('pointermove', onPointerMove);
window.addEventListener('click', onPointerClick);



animate();