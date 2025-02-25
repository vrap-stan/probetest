import * as THREE from 'three';

let _generator;
let _renderer;

export default (function () {
    if (_generator) return _generator;

    if (!_renderer) {
        _renderer = new THREE.WebGLRenderer();
    }

    _generator = new THREE.PMREMGenerator(_renderer);
    _generator.compileCubemapShader();
    _generator.compileEquirectangularShader();
    return _generator;
})();