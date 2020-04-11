// Set canvas resolution to match its displayed resolution
function resizeCanvasToDisplaySize(canvas) 
{
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


function drawScaledImage(img, canvas, f)
{
    let ctx = canvas.getContext("2d");
    let offx = 0.5*(canvas.width - f*img.width);
    let offy = 0.5*(canvas.height - f*img.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, offx, offy, f*img.width, f*img.height);
}


function drawImageScaleToFit(img, canvas)
{
    let f = Math.min(canvas.width/img.width, canvas.height/img.height);
    drawScaledImage(img, canvas, f);
}


function drawImageScaleToFill(img, canvas)
{
    let f = Math.max(canvas.width/img.width, canvas.height/img.height);
    drawScaledImage(img, canvas, f);
}


function drawImageToCanvasWithLimitedSize(img, canvas, maxSize)
{
    let f = Math.min(1.0, Math.min(maxSize/img.width, maxSize/img.height));

    //let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');

    canvas.width = f*img.width;
    canvas.height = f*img.height;

    ctx.drawImage(img, 0, 0, f*img.width, f*img.height);
    return canvas;
}


function drawCircle(canvas, x, y, r)
{
    let ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2*Math.PI, false);
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'lightgreen';
    ctx.stroke();
}


function getBase64ImageFromCanvas(canvas)
{
    var dataURL = canvas.toDataURL("image/png");
    return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
}


function getImageAsBase64(img)
{
    let canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    let ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    return getBase64ImageFromCanvas(canvas);
}


// display base64 encoded image in a new tab
function debugBase64(base64URL){
    var win = window.open();
    win.document.write('<iframe src="' + base64URL  + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
}


