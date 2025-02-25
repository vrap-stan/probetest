import * as THREE from 'three';

let _cubeRenderTarget;
let _cubeCamera;
export default (function () {
    if (_cubeCamera) return _cubeCamera;

    if (!_cubeRenderTarget) {
        _cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512, {
            format: THREE.RGBFormat,
            generateMipmaps: true,
            minFilter: THREE.LinearMipmapLinearFilter,
            magFilter: THREE.LinearFilter,
        });
    }

    _cubeCamera = new THREE.CubeCamera(0.1, 10, _cubeRenderTarget);
    return _cubeCamera;
})();