var MAX_IMAGE_SIZE = 2048;

var cascadeurl = 'https://raw.githubusercontent.com/nenadmarkus/pico/c2e81f9d23cc11d1a612fd21e4f9de0921a5d0d9/rnt/cascades/facefinder';
var facefinder_classify_region = function(r, c, s, pixels, ldim) {return -1.0;};


function getScaledDimensions(width, height, maxSize)
{
    let f = 1.0;
    if(width>height) {
        f = Math.min(maxSize/width, 1.0);
    } else {
        f = Math.min(maxSize/height, 1.0);
    }
    return {width: f*width, height: f*height};
}


function rgba_to_grayscale(rgba, nrows, ncols) 
{
    let gray = new Uint8Array(nrows*ncols);
    for(let r=0; r<nrows; ++r)
    {
        for(let c=0; c<ncols; ++c)
        {
            // gray = 0.2*red + 0.7*green + 0.1*blue
            gray[r*ncols + c] = (2*rgba[r*4*ncols+4*c+0]+7*rgba[r*4*ncols+4*c+1]+1*rgba[r*4*ncols+4*c+2])/10;
        }
    }
    return gray;
}


// Draws image onto canvas at a clipped max size
function drawResizedImage(img)
{
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');

    let newDims = getScaledDimensions(img.width, img.height, MAX_IMAGE_SIZE);

    canvas.width = newDims.width;
    canvas.height = newDims.height;

    ctx.drawImage(img, 0, 0, newDims.width, newDims.height);
    return canvas;
}


function findFaceInCanvas(canvas, enlargeFactor)
{
    params = {
        "shiftfactor": 0.1, // move the detection window by 10% of its size
        "minsize": 100,     // minimum size of a face
        "maxsize": 1000,    // maximum size of a face
        "scalefactor": 1.1  // for multiscale processing: resize the detection window by 10% when moving to the higher scale
    }

    // Extract pixels and convert to grayscale
    let ctx = canvas.getContext("2d");
    let rgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let pixels = rgba_to_grayscale(rgba, canvas.height, canvas.width);

    let imageInfo = {
        "pixels": pixels,
        "nrows": canvas.height,
        "ncols": canvas.width,
        "ldim": canvas.width
    }
    dets = pico.run_cascade(imageInfo, facefinder_classify_region, params);

    console.log(dets);
    dets = pico.cluster_detections(dets, 0.2); // set IoU threshold to 0.2
    console.log(dets);

    // TODO: fix this silly threshold
    if(dets.length > 0 && dets[0][3]>1.0)
    {
        result = {cx: dets[0][1], cy: dets[0][0], r: enlargeFactor*dets[0][2]/2};
        return result;
    }
    else
    {
        return null;
    }
}


function initFaceDetector()
{
    const request = async() => {
        const response = await fetch(cascadeurl);
        const buffer = await response.arrayBuffer();
        let bytes = new Int8Array(buffer);
        facefinder_classify_region = pico.unpack_cascade(bytes);
        console.log('* facefinder loaded');
    }

    request();
}
