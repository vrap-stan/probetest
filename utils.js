// const base =
//     "https://vra-configurator-dev.s3.ap-northeast-2.amazonaws.com/models/lmedit/clipped/";
const base = "https://d1ru9emggadhd3.cloudfront.net/models/lmedit/clipped/";
const src1k = "clipped_1k/meta.json";
const src512 = "clipped_512/meta.json";
const srcMerged1 = "merged1/meta.json";
const src512png = "clipped_512_png/meta.json";
const src1024png = "clipped_1024_png/meta.json";

function withoutExtension(path) {
    // key.replace(/\.[^/.]+$/, "");
    return path.replace(/\.[^/.]+$/, "");
}

async function iter(arr, fn, forceAsync=true) {
    if (forceAsync) {
        return Promise.all(arr.map(fn));
    } else {
        for (let i = 0; i < arr.length; i++) {
            await fn(arr[i], i, arr);
        }
    }
}

export default {
    base,
    src1k,
    src512,
    srcMerged1,
    src512png,
    src1024png,
    withoutExtension,
    iter,
}