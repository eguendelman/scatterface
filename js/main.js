var mainCanvas = document.getElementById("main-canvas");
var previewCanvas = document.getElementById("preview-canvas");

var compositorCanvas = document.createElement("canvas");
var targetCanvas = document.createElement("canvas");

var STORAGE_KEY = "targetImageData";
var STORAGE_KEY_DIFFICULTY = "difficultyLevel";

var FACE_DETECT_MAX_IMAGE_SIZE = 2048;
var FACE_DETECT_ENLARGE_FACTOR = 1.2;

var DATASET_CONFIG_URL = "config/backgrounds.json"

var datasetConfig = null;
var difficultyLevel = parseInt(localStorage.getItem(STORAGE_KEY_DIFFICULTY) || "1");


function getDrawnItemSize()
{
    let factor = 1;
    if (difficultyLevel == 1) { factor = 10; }
    else if (difficultyLevel == 2) { factor = 20; }
    else if (difficultyLevel == 3) { factor = 35; }
    else if (difficultyLevel == 4) { factor = 45; }
    return mainCanvas.width/factor;
}


function setDifficultyLevel(level)
{
    if (level != difficultyLevel)
    {
        difficultyLevel = level;
        localStorage.setItem(STORAGE_KEY_DIFFICULTY, ""+level);
        generate();
    }
}


function initPage()
{
    let el = document.getElementById("change-target-file-input");
    if (el != null) {
        el.onchange = function (e) {
          loadImage(e.target.files[0], onImageLoad, { maxWidth: FACE_DETECT_MAX_IMAGE_SIZE, orientation: true });
        }
    }

    el = document.getElementById("refresh-button");
    if (el != null) {
        el.onclick = function(e) { generate(); }
    }

    el = document.getElementById(`dif-${difficultyLevel}`);
    el.checked = true;
    el.classList.add("active");
}


function refreshLayout()
{
    resizeCanvasToDisplaySize(mainCanvas);
    resizeCanvasToDisplaySize(previewCanvas);
}


function targetChanged()
{
    let canvas = previewCanvas;
    let sz = Math.min(canvas.width, canvas.height);
    //canvas.width = sz;
    //canvas.height = sz;
    console.log("Drawing image from target canvas");
    console.log(sz);
    canvas.getContext("2d").drawImage(targetCanvas, (canvas.width-sz)/2, 0, sz, sz);
}


function saveToLocalStorage(canvas)
{
    let data = getBase64ImageFromCanvas(canvas);
    console.log("Saving to local storage");
    let full_data = {data:data, width:canvas.width, height:canvas.height}; 
    localStorage.setItem(STORAGE_KEY, JSON.stringify(full_data));
}


function loadFromLocalStorage(canvas)
{
    console.log("Loading from local storage");

    let full_data = localStorage.getItem(STORAGE_KEY);
    if (full_data == null) {
        return false;
    }

    full_data = JSON.parse(full_data);
    //console.log(full_data);

    img = new Image();
    img.src = "data:image/png;base64," + full_data.data;

    canvas.width = full_data.width;
    canvas.height = full_data.height;
    let ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    return true;
}


function loadSavedData()
{
    if(loadFromLocalStorage(targetCanvas))
    {
        targetChanged();
    }
}


function getLocationsPoisson(width, height, radius)
{
    let k = 500;
    let margin = radius;
    let myPoisson = new PoissonDisc(width+2*margin, height+2*margin, 2*radius, k, 2);
    myPoisson.run();
    console.log(myPoisson);

    locs = Array();
    for (let i=0; i<myPoisson.points.length; i++) {
        let pt = myPoisson.points[i];
        pt.px -= margin;
        pt.py -= margin;
        if (radius < pt.px && pt.px < width-radius && radius < pt.py && pt.py < height-radius) {
            locs.push({cx: pt.px, cy: pt.py});
        }
    }
    return locs;
}


function createFalloff(ctx, sz)
{
    let cx = sz/2;
    let cy = sz/2;
    let r1 = Math.floor(0.3*sz);
    let r2 = Math.floor(0.5*sz);

    var g = ctx.createRadialGradient(cx, cy, r1, cx, cy, r2);
    g.addColorStop(0.00,"rgba(0,0,0,1.00)");
    g.addColorStop(1.00,"rgba(0,0,0,0.00)");

    return g;
}


// srcInfo is an object with fields defining the source image/canvas and offsets
function prepareOnCompositorCanvas(srcInfo, dstCanvas)
{
    let sz = dstCanvas.width;
    let ctx = dstCanvas.getContext("2d");
    ctx.clearRect(0, 0, sz, sz);

    let g = createFalloff(ctx, sz);

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, sz, sz);

    ctx.globalCompositeOperation="source-in";
    if (srcInfo.sx != undefined) {
        ctx.drawImage(srcInfo.img, srcInfo.sx, srcInfo.sy, srcInfo.swidth, srcInfo.sheight, 0, 0, sz, sz);
    } else {
        ctx.drawImage(srcInfo.img, 0, 0, sz, sz);
    }
    ctx.globalCompositeOperation="source-over";
}


function drawItems()
{
    let ctx = mainCanvas.getContext("2d");

    let sz = getDrawnItemSize();
    compositorCanvas.width = sz;
    compositorCanvas.height = sz;

    let img = new Image();
    img.onload = function () {
        // assumes the mosaic is a horizontal stacking (no padding) of square images
        let srcItemSize = img.height;
        let numItems = img.width / srcItemSize;
        let locs = getLocationsPoisson(mainCanvas.width, mainCanvas.height, sz/2);

        document.getElementById("face-count-label").innerText = locs.length;

        // location at index `targetPlacementIdx` will be the target image
        let targetPlacementIdx = Math.floor(locs.length * Math.random());
        for(let i=0; i<locs.length; i++)
        {
            // locs.cx/cy represent the center, so we adjust for that
            let x = locs[i].cx - sz/2;
            let y = locs[i].cy - sz/2;

            let srcInfo = null;
            if (i == targetPlacementIdx) {
                srcInfo = {img: targetCanvas};
            } else {
                let itemIdx = Math.floor(Math.random() * numItems);
                srcInfo = {img: img, sx: itemIdx*srcItemSize, sy: 0, swidth: srcItemSize, sheight: srcItemSize};
            }
            prepareOnCompositorCanvas(srcInfo, compositorCanvas);
            ctx.drawImage(compositorCanvas, x, y);
        }
    };
    img.src = 'images/mosaic.jpg';
}


function drawBackground()
{
    let ctx = mainCanvas.getContext("2d");
    let numBackgrounds = datasetConfig.backgrounds.length;
    let bgIdx = Math.floor(numBackgrounds * Math.random());
    let imageUrl = datasetConfig.backgrounds[bgIdx].imageUrl;
    let sourceUrl = datasetConfig.backgrounds[bgIdx].sourceUrl;

    let img = new Image();
    img.onload = function () {
        document.getElementById("bg-source-link").href = sourceUrl;

        ctx.drawImage(img, 0, 0, mainCanvas.width, mainCanvas.height);
        drawItems();
    };
    img.src = imageUrl;
}


function generate()
{
    drawBackground();
}


function extractFace(result, srcCanvas, dstCanvas)
{
    let x = result.cx - result.r;
    let y = result.cy - result.r;
    let sz = 2*result.r;

    dstCanvas.width = sz;
    dstCanvas.height = sz;

    // Draw extracted face onto this new canvas
    let ctx = dstCanvas.getContext("2d");
    ctx.clearRect(0, 0, sz, sz);
    ctx.drawImage(srcCanvas, x, y, sz, sz, 0, 0, sz, sz);
    return true;
}


function onImageLoad(img)
{
    let tmpCanvas = document.createElement("canvas");
    let previewCanvas = document.getElementById("change-target-image-preview-canvas");

    drawImageToCanvasWithLimitedSize(img, tmpCanvas, FACE_DETECT_MAX_IMAGE_SIZE);
    drawImageToCanvasWithLimitedSize(img, previewCanvas, FACE_DETECT_MAX_IMAGE_SIZE);

    let result = findFaceInCanvas(tmpCanvas, FACE_DETECT_ENLARGE_FACTOR);

    if (result != null)
    {
        let el = document.getElementById("detection-result-alert");
        el.classList.remove("alert-warning");
        el.classList.add("alert-success");
        el.innerText = "Found face";

        $('#change-target-accept')
            .prop('disabled',false)
            .on('click', function(e) {
                extractFace(result, tmpCanvas, targetCanvas);
                saveToLocalStorage(targetCanvas);
                targetChanged();
                generate();
            });

        console.log(result);
        drawCircle(previewCanvas, result.cx, result.cy, result.r);
    }
    else
    {
        let el = document.getElementById("detection-result-alert");
        el.classList.remove("alert-success");
        el.classList.add("alert-danger");
        el.innerText = "Could not find face";

        $('#change-target-accept').prop('disabled',true);
    }

    $('#change-target-modal').modal('show');
}


fetch(DATASET_CONFIG_URL)
.then(res => res.json())
.then((out) => {
    datasetConfig = out;
    initFaceDetector();
    initPage();
    refreshLayout();
    loadSavedData();
    generate();
})
.catch(err => { throw err });
