# ScatterFace: A "face search" game

## Live on GitHub Pages

See it live [here](https://eguendelman.github.io/scatterface/)

## Description

* Find a target face among many distractor faces (can come from a user-selected image)
* Runs on client side, user-selected images are not uploaded anywhere

## TODO

* host on github pages if possible
* persistent storage (caching) for dataset and uploaded images
    https://stackoverflow.com/questions/19183180/how-to-save-an-image-to-localstorage-and-display-it-on-the-next-page
* row of buttons at bottom, for refresh, preview target image, etc.
* add credit line and links
* check on mobile devices
* if we create element without adding to DOM does it get garbage collected?

### Ideas for later...

* code refactor, more consistent use of async/then
* gameification - e.g. play a series of images and use timer for scoring
* allow search for multiple people in a single image
* multiuser
* better icon
* additional datasets (e.g. Peppa Pig faces, emoji)
* downselect distractor faces to those that are most similar to the target face ("hard mode")
* nicer background removal (in place of radial gradient)

## Credits

* **Concept** of personalized face search also available in print form here: https://www.putmeinthestory.com/ (look for "Find Me If You Can" book series)
* **Backgrounds** come from https://unsplash.com/ (hand selected some "busy" images)
* **Faces** come from https://www.thispersondoesnotexist.com/
  * https://generated.photos/faces is another interesting resource but not used
* **Face Detection** uses https://github.com/tehnokv/picojs
* **Scatter Arrangement** uses the javascript Poisson Disc Sampling code from https://github.com/MatthewPageUK/js-poisson-disc
