var canvas = document.getElementById("my-canvas");
var offCanvas = null;

var SOURCE_ITEM_SIZE = 256;
var NUM_DRAWN_ITEMS = 100;
var DRAWN_ITEM_SIZE = 100;
var DATASET_CONFIG_URL = "dataset.json"
var ENLARGE_FACTOR = 1.5;

var BOTTOM_MARGIN = 128;

var datasetConfig = null;

var targetCanvas = document.createElement('canvas');

function initLayout()
{
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - BOTTOM_MARGIN;

    let el = document.getElementById("file-input");
    if (el != null) {
        el.addEventListener("change", (e) => { readURL(e.target); });
    }
}

function createOffscreenCanvas() 
{
    offCanvas = document.createElement('canvas');
    offCanvas.width = DRAWN_ITEM_SIZE;
    offCanvas.height = DRAWN_ITEM_SIZE;
}

function getLocationsPoisson(width, height, spacing)
{
    let k = 100;
    let myPoisson = new PoissonDisc(width, height, spacing, k, 2);
    myPoisson.run();
    console.log(myPoisson);

    locs = Array();
    for (let i=0; i<myPoisson.points.length; i++) {
        let pt = myPoisson.points[i];
        if (spacing < pt.px && pt.px < width-spacing && spacing < pt.py && pt.py < height-spacing) {
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


function prepareOnComputeCanvas(img, itemIdx)
{
    let sz = DRAWN_ITEM_SIZE;
    let ctx = offCanvas.getContext("2d");
    ctx.clearRect(0, 0, sz, sz);

    let g = createFalloff(ctx, sz);

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, sz, sz);

    ctx.globalCompositeOperation="source-in";
    ctx.drawImage(img, itemIdx*SOURCE_ITEM_SIZE, 0, SOURCE_ITEM_SIZE, SOURCE_ITEM_SIZE, 0, 0, sz, sz);
    ctx.globalCompositeOperation="source-over";
}


function prepareOnComputeCanvas2(srcCanvas)
{
    let sz = DRAWN_ITEM_SIZE;
    let ctx = offCanvas.getContext("2d");
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
    let ctx = canvas.getContext("2d");

    let sz = DRAWN_ITEM_SIZE;

    let img = new Image();
    img.onload = function () {
        let numItems = img.width / SOURCE_ITEM_SIZE;
        let locs = getLocationsPoisson(canvas.width, canvas.height, DRAWN_ITEM_SIZE);
        let targetPlacementIdx = Math.floor(locs.length * Math.random());
        for(let i=0; i<locs.length; i++)
        {
            // locs.cx/cy represent the center, so we adjust for that
            let x = locs[i].cx - sz/2;
            let y = locs[i].cy - sz/2;

            if (i == targetPlacementIdx) {
                prepareOnComputeCanvas2(targetCanvas);
            } else {
                let itemIdx = Math.floor(Math.random() * numItems);
                prepareOnComputeCanvas(img, itemIdx);
            }
            ctx.drawImage(offCanvas, x, y);
        }
    };
    img.src = 'images/mosaic.png';
}

function drawBackground()
{
    ctx = canvas.getContext("2d");
    console.log(datasetConfig);

    let numBackgrounds = datasetConfig.backgrounds.length;
    let bgIdx = Math.floor(numBackgrounds * Math.random());

    let img = new Image();
    img.onload = function () {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawItems();
    };
    img.src = datasetConfig.backgrounds[bgIdx].url;
}

function generate()
{
    drawBackground();
}

function debugBase64(base64URL){
    var win = window.open();
    win.document.write('<iframe src="' + base64URL  + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
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
                let success = extractFace(image, targetCanvas, ENLARGE_FACTOR);
                if (success) {
                    var canvas = document.getElementById("preview-canvas");
                    var sz = Math.min(canvas.width, canvas.height);
                    canvas.width = sz;
                    canvas.height = sz;
                    canvas.getContext("2d").drawImage(targetCanvas, 0, 0, canvas.width, canvas.height);
                }
                generate();
            }
            image.src = readerEvent.target.result;
        }
        reader.readAsDataURL(input.files[0]);
    }
}


fetch(DATASET_CONFIG_URL)
.then(res => res.json())
.then((out) => {
    datasetConfig = out;
    initFaceDetector();
    initLayout();
    createOffscreenCanvas();
    generate();
})
.catch(err => { throw err });
