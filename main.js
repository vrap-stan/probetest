import * as THREE from "three";
import Utils from "utils"
import Loader from "loader"
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
const { kitchenBox, livingBox } = Loader;

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
        console.log(intersects[0]);
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

    let floor;
    let livingWall;
    scene.traverse(o => {
        if (o.isMesh) {
            if (o.name === "바닥") {
                floor = o;
            }

            if (o.name === "거실base_9") {
                livingWall = o;
            }
        }
    })

    if (!floor) {
        console.warn("바닥 없음");
        return;
    }

    const meshes = [
        floor, livingWall
    ]

    // console.log(floor);
    const livingCenter = livingBox.getCenter(new THREE.Vector3());
    const livingSize = livingBox.getSize(new THREE.Vector3());

    // add red sphere to livingCenter
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.1),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    sphere.position.copy(livingCenter);
    scene.add(sphere);

    // capture envmap

    cubeCamera.position.copy(livingCenter);
    cubeCamera.update(renderer, scene);
    const cubeTexture = cubeCamera.renderTarget.textures[0];;

    // const generator = new THREE.PMREMGenerator(renderer);
    // generator.compileCubemapShader();
    // generator.compileEquirectangularShader();
    // debugger;
    const generator = PmremGenerator(renderer);

    const envMap = generator.fromCubemap(cubeTexture).texture;

    console.log(cubeTexture, envMap)
    // debugger;
    
    meshes.forEach(mesh => {
        const mat = mesh.material
        mat.onBeforeCompile = shader => useBoxProjectedEnvMap(shader, livingCenter, livingSize);

        mat.envMap = envMap;
        // mat.envMap = cubeTexture;
        mat.metalness = 1.0;
        mat.roughness = 0.0;

        mat.needsUpdate = true;
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