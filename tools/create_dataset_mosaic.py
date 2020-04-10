import os
from PIL import Image

def create_mosaic_strip(images):
    widths, heights = zip(*(i.size for i in images))

    total_width = sum(widths)
    max_height = max(heights)

    new_im = Image.new('RGB', (total_width, max_height))

    x_offset = 0
    for im in images:
        new_im.paste(im, (x_offset,0))
        x_offset += im.size[0]

    return new_im


#############################################################################
# MAIN
#############################################################################
output_filename = "../images/mosaic.jpg"

filenames = os.listdir("data")
images = []
for fn in filenames:
    img = Image.open(f"data/{fn}")
    img = img.resize((256,256), resample=Image.LANCZOS)
    images.append(img)

mosaic_img = create_mosaic_strip(images)
#mosaic_img.show()
mosaic_img.save(output_filename)
