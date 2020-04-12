# ScatterFace: A "face search" game

## Live on GitHub Pages

See it live [here](https://scatterface.eg42.net)

## Description

* Find a target face among many distractor faces (can come from a user-selected image)
* Runs on client side, user-selected images are not uploaded anywhere

## TODO

### Ideas for later...

* consider DPI when determining sizes for difficulty levels
* code refactor, more consistent use of async/then
* gameification - e.g. play a series of images and use timer for scoring
* allow search for multiple people in a single image
* multiuser
* better icon
* additional datasets (e.g. Peppa Pig faces, emoji)
* downselect distractor faces to those that are most similar to the target face ("hard mode")
* nicer background removal (in place of radial gradient)
* make the main canvas zoomable and scrollable while keeping bottom toolbar fixed
* faces appear pixelated on ipad when small

## Credits

* **Concept** of personalized face search also available in print form here: https://www.putmeinthestory.com/ (look for "Find Me If You Can" book series)
* **Backgrounds** come from https://unsplash.com/ (hand selected some "busy" images)
* **Faces** come from https://www.thispersondoesnotexist.com/
  * https://generated.photos/faces is another interesting resource but not used
* **Face Detection** uses https://github.com/tehnokv/picojs
* **Scatter Arrangement** uses the javascript Poisson Disc Sampling code from https://github.com/MatthewPageUK/js-poisson-disc
* **Image Orientation Fix** uses https://github.com/blueimp/JavaScript-Load-Image
