var mainCanvas = document.getElementById("main-canvas");
var previewCanvas = document.getElementById("preview-canvas");

var compositorCanvas = document.createElement("canvas");
var targetCanvas = document.createElement("canvas");

var STORAGE_KEY = "targetImageData";
var STORAGE_KEY_DIFFICULTY = "difficultyLevel";

var SOURCE_ITEM_SIZE = 256;
var DATASET_CONFIG_URL = "config/backgrounds.json"
var FACE_REGION_ENLARGE_FACTOR = 1.1;

var BOTTOM_MARGIN = 100;

var datasetConfig = null;
var difficultyLevel = parseInt(localStorage.getItem(STORAGE_KEY_DIFFICULTY) || "1");


function debugBase64(base64URL){
    var win = window.open();
    win.document.write('<iframe src="' + base64URL  + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
}


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
        localStorage.setItem(STORAGE_KEY_DIFFICULTY, ""+level);
        let el = document.getElementById("refresh-button");
        el.click();
    }
}


function resizeCanvasToDisplaySize(canvas) {
   // look up the size the canvas is being displayed
   const width = canvas.clientWidth;
   const height = canvas.clientHeight;

   // If it's resolution does not match change it
   if (canvas.width !== width || canvas.height !== height) {
     canvas.width = width;
     canvas.height = height;
     return true;
   }

   return false;
}


function initPage()
{
    let el = document.getElementById("file-input");
    if (el != null) {
        el.addEventListener("change", (e) => { readURL(e.target); });
    }

    el = document.getElementById("refresh-button");
    if (el != null) {
        el.addEventListener("click", (e) => { location.reload(); });
    }

    el = document.getElementById(`dif-${difficultyLevel}`);
    el.click();
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


// Helper for localStorage
function getBase64ImageFromCanvas(canvas)
{
    var dataURL = canvas.toDataURL("image/png");
    return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
}


function getBase64Image(img)
{
    let canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    let ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    return getBase64ImageFromCanvas(canvas);
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


function prepareOnCompositorCanvasFromImage(img, itemIdx, dstCanvas)
{
    let sz = dstCanvas.width;
    let ctx = dstCanvas.getContext("2d");
    ctx.clearRect(0, 0, sz, sz);

    let g = createFalloff(ctx, sz);

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, sz, sz);

    ctx.globalCompositeOperation="source-in";
    ctx.drawImage(img, itemIdx*SOURCE_ITEM_SIZE, 0, SOURCE_ITEM_SIZE, SOURCE_ITEM_SIZE, 0, 0, sz, sz);
    ctx.globalCompositeOperation="source-over";
}


function prepareOnCompositorCanvasFromCanvas(srcCanvas, dstCanvas)
{
    let sz = dstCanvas.width;
    let ctx = dstCanvas.getContext("2d");
    ctx.clearRect(0, 0, sz, sz);

    let g = createFalloff(ctx, sz);

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, sz, sz);

    ctx.globalCompositeOperation="source-in";
    ctx.drawImage(srcCanvas, 0, 0, sz, sz);
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
        let numItems = img.width / SOURCE_ITEM_SIZE;
        let locs = getLocationsPoisson(mainCanvas.width, mainCanvas.height, sz/2);

        // location at index `targetPlacementIdx` will be the target image
        let targetPlacementIdx = Math.floor(locs.length * Math.random());
        for(let i=0; i<locs.length; i++)
        {
            // locs.cx/cy represent the center, so we adjust for that
            let x = locs[i].cx - sz/2;
            let y = locs[i].cy - sz/2;

            if (i == targetPlacementIdx) {
                prepareOnCompositorCanvasFromCanvas(targetCanvas, compositorCanvas);
            } else {
                let itemIdx = Math.floor(Math.random() * numItems);
                prepareOnCompositorCanvasFromImage(img, itemIdx, compositorCanvas);
            }
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
        ctx.drawImage(img, 0, 0, mainCanvas.width, mainCanvas.height);
        drawItems();

        document.getElementById("bg-source-link").href = sourceUrl;
    };
    img.src = imageUrl;
}

function generate()
{
    drawBackground();
}

function readURL(input) 
{
    if (input.files && input.files[0])
    {
        var reader = new FileReader();
        reader.onload = function(readerEvent)
        {
            var image = new Image();
            image.onload = function(imageEvent)
            {
                let success = extractFace(image, targetCanvas, FACE_REGION_ENLARGE_FACTOR);
                if (success) {
                    saveToLocalStorage(targetCanvas);
                    targetChanged();
                }
                generate();
            }
            image.src = readerEvent.target.result;
        }
        reader.readAsDataURL(input.files[0]);
    }
}


//function foo()
//{
//    //targetChanged();
//    loadFromLocalStorage(targetCanvas);
//}


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
