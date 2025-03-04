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

export async function iter(arr, fn, parallel=true) {
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
    return boxArray.filter(box => !targetBox.intersect(box).isEmpty());
}