var canvas = document.getElementById("my-canvas");
var ctx = canvas.getContext("2d");

var SOURCE_ITEM_SIZE = 256;
var NUM_DRAWN_ITEMS = 500;
var DRAWN_ITEM_SIZE = 64;
var DATASET_CONFIG_URL = "dataset.json"

var datasetConfig = null;

function getLocations1(width, height, n)
{
    let locs = Array();
    for (let i=0; i<n; i++) {
        let x = Math.round(Math.random() * width);
        let y = Math.round(Math.random() * height);
        locs.push({x: x, y: y});
    }
    return locs
}

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
            let x = (col+0.5) * cellSize + xp;

            let yp = maxPerturb * (2*Math.random() - 1);
            let y = (row+0.5) * cellSize + yp;

            locs.push({x: x, y: y});
        }
    }
    return locs
}

function drawItems()
{
    let img = new Image();
    img.onload = function () {
        let numItems = img.width / SOURCE_ITEM_SIZE;
        locs = getLocations(canvas.width, canvas.height, NUM_DRAWN_ITEMS);
        for(let i=0; i<NUM_DRAWN_ITEMS; i++)
        {
            let itemIdx = Math.floor(Math.random() * numItems);
            // locs.x/y represent the center, so we adjust for that
            ctx.drawImage(img, itemIdx*SOURCE_ITEM_SIZE, 0, SOURCE_ITEM_SIZE, SOURCE_ITEM_SIZE,
                          locs[i].x - DRAWN_ITEM_SIZE/2, locs[i].y - DRAWN_ITEM_SIZE/2,
                          DRAWN_ITEM_SIZE, DRAWN_ITEM_SIZE);
        }
    };
    img.src = 'images/mosaic.jpg';
}

function drawBackground()
{
    console.log(datasetConfig);

    let numBackgrounds = datasetConfig.backgrounds.length;
    let bgIdx = Math.floor(numBackgrounds * Math.random());

    let img = new Image();
    img.onload = function () {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        drawItems();
    };
    //img.src = 'images/bg1.jpg';
    img.src = datasetConfig.backgrounds[bgIdx].url;
}

function generate()
{
    drawBackground();
}

fetch(DATASET_CONFIG_URL)
.then(res => res.json())
.then((out) => {
    datasetConfig = out;
    generate();
})
.catch(err => { throw err });
