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
    var gray = new Uint8Array(nrows*ncols);
    for(var r=0; r<nrows; ++r)
    {
        for(var c=0; c<ncols; ++c)
        {
            // gray = 0.2*red + 0.7*green + 0.1*blue
            gray[r*ncols + c] = (2*rgba[r*4*ncols+4*c+0]+7*rgba[r*4*ncols+4*c+1]+1*rgba[r*4*ncols+4*c+2])/10;
        }
    }
    return gray;
}


function extractImageData(img)
{
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');

    canvas.width = MAX_IMAGE_SIZE;
    canvas.height = MAX_IMAGE_SIZE;

    let newDims = getScaledDimensions(img.width, img.height, MAX_IMAGE_SIZE);

    ctx.drawImage(img, 0, 0, newDims.width, newDims.height);
    return ctx.getImageData(0, 0, img.width, img.height);
}

function findFace(img)
{
    params = {
        "shiftfactor": 0.1, // move the detection window by 10% of its size
        "minsize": 100,     // minimum size of a face
        "maxsize": 1000,    // maximum size of a face
        "scalefactor": 1.1  // for multiscale processing: resize the detection window by 10% when moving to the higher scale
    }

    let rgba = extractImageData(img).data;
    let pixels = rgba_to_grayscale(rgba, img.height, img.width);

    image = {
        "pixels": pixels,
        "nrows": img.height,
        "ncols": img.width,
        "ldim": img.width
    }
    dets = pico.run_cascade(image, facefinder_classify_region, params);
    console.log(dets);
    dets = pico.cluster_detections(dets, 0.2); // set IoU threshold to 0.2
    console.log(dets);
    return dets;
}

fetch(cascadeurl).then(function(response) {
    response.arrayBuffer().then(function(buffer) {
        var bytes = new Int8Array(buffer);
        facefinder_classify_region = pico.unpack_cascade(bytes);
        console.log('* facefinder loaded');

        let img = new Image();
        img.onload = function () {
            let dets = findFace(img);
            var canvas = document.getElementById("test-canvas");
            let ctx = canvas.getContext("2d");

            //let data = extractImageData(img);
            //ctx.drawImage(data, 0, 0);

            let newDims = getScaledDimensions(img.width, img.height, canvas.width);
            console.log(img.width);
            console.log(img.height);
            console.log(newDims);
            ctx.drawImage(img, 0, 0, newDims.width, newDims.height);
            //ctx.drawImage(img, 0, 0, img.width, img.height);

            for(i=0; i<dets.length; ++i)
            {
                // check the detection score
                // if it's above the threshold, draw it
                // (the constant 50.0 is empirical: other cascades might require a different one)
                if(dets[i][3]>50.0)
                {
                    var r, c, s;
                    //
                    ctx.beginPath();
                    ctx.arc(dets[i][1], dets[i][0], dets[i][2]/2, 0, 2*Math.PI, false);
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = 'red';
                    ctx.stroke();
                }
			}
        };

        //img.src = "/images/testface.jpg";
        //img.src = "/photos/t.jpg";
        img.src = "/photos/IMG_20200408_185550.jpg";
    })
})
