var canvas = document.getElementById("my-canvas");
var offCanvas = null;
var offCanvasTarget = null;

var SOURCE_ITEM_SIZE = 256;
var NUM_DRAWN_ITEMS = 100;
var DRAWN_ITEM_SIZE = 32;
var DATASET_CONFIG_URL = "dataset.json"

var datasetConfig = null;

function createOffscreenCanvas() 
{
    offCanvas = document.createElement('canvas');
    offCanvas.width = DRAWN_ITEM_SIZE;
    offCanvas.height = DRAWN_ITEM_SIZE;

    offCanvasTarget = document.createElement('canvas');
    offCanvasTarget.width = DRAWN_ITEM_SIZE;
    offCanvasTarget.height = DRAWN_ITEM_SIZE;
}

function getLocations1(width, height, n)
{
    let locs = Array();
    for (let i=0; i<n; i++) {
        let cx = Math.round(Math.random() * width);
        let cy = Math.round(Math.random() * height);
        locs.push({cx: x, cy: y});
    }
    return locs
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

// Returns center locations
function getLocations(width, height, n)
{
    let cellSize = 80;
    let maxPerturb = 20;
    let locs = Array();
    for (let row=0; row<height/cellSize; row++)
    {
        for (let col=0; col<width/cellSize; col++)
        {
            let xp = maxPerturb * (2*Math.random() - 1);
            let cx = (col+0.5) * cellSize + xp;

            let yp = maxPerturb * (2*Math.random() - 1);
            let cy = (row+0.5) * cellSize + yp;

            locs.push({cx: cx, cy: cy});
        }
    }
    return locs
}

function prepareOnComputeCanvas(img, itemIdx)
{
    let ctx = offCanvas.getContext("2d");

    let sz = DRAWN_ITEM_SIZE;
    ctx.clearRect(0, 0, sz, sz);

    let cx = sz/2;
    let cy = sz/2;
    let r1 = sz/3;
    let r2 = sz/2;

    var g1=ctx.createRadialGradient(cx, cy, r1, cx, cy, r2);
    g1.addColorStop(0.00,"rgba(0,0,0,1.00)");
    g1.addColorStop(1.00,"rgba(0,0,0,0.00)");

    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, sz, sz);

    ctx.globalCompositeOperation="source-in";
    ctx.drawImage(img, itemIdx*SOURCE_ITEM_SIZE, 0, SOURCE_ITEM_SIZE, SOURCE_ITEM_SIZE, 0, 0, sz, sz);
    ctx.globalCompositeOperation="source-over";
}

function drawItems()
{
    let ctx = canvas.getContext("2d");

    let sz = DRAWN_ITEM_SIZE;

    let img = new Image();
    img.onload = function () {
        let numItems = img.width / SOURCE_ITEM_SIZE;
        //locs = getLocations(canvas.width, canvas.height, NUM_DRAWN_ITEMS);
        locs = getLocationsPoisson(canvas.width, canvas.height, DRAWN_ITEM_SIZE);
        let targetPlacementIdx = Math.floor(locs.length * Math.random());
        for(let i=0; i<locs.length; i++)
        {
            // locs.cx/cy represent the center, so we adjust for that
            let x = locs[i].cx - sz/2;
            let y = locs[i].cy - sz/2;

            let sourceCanvas = offCanvas;
            if (i == targetPlacementIdx) {
                sourceCanvas = offCanvasTarget;
            } else {
                let itemIdx = Math.floor(Math.random() * numItems);
                prepareOnComputeCanvas(img, itemIdx);
            }
            ctx.drawImage(sourceCanvas, x, y);
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


function readURL(input) 
{
    console.log(input);
    console.log(input.files);

    if (input.files && input.files[0])
    {
        var reader = new FileReader();
        reader.onload = function(readerEvent)
        {
            var image = new Image();
            image.onload = function(imageEvent)
            {
                // Resize the image
                var canvas = document.getElementById("canvas2");
                canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
                offCanvasTarget.getContext('2d').drawImage(image, 0, 0, offCanvasTarget.width, offCanvasTarget.height);
                generate();
            }
            image.src = readerEvent.target.result;
        }
        reader.readAsDataURL(input.files[0]);
    }
}


document.getElementById("file-input").addEventListener("change", (e) => { readURL(e.target); });


fetch(DATASET_CONFIG_URL)
.then(res => res.json())
.then((out) => {
    datasetConfig = out;
    createOffscreenCanvas();
    generate();
})
.catch(err => { throw err });
