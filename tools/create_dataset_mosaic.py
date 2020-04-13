import os, argparse
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
parser = argparse.ArgumentParser()
parser.add_argument("-n", "--num", default=3, type=int)
parser.add_argument("--size", default=256, type=int)
parser.add_argument("--quality", default=80, type=int)
parser.add_argument("-O", "--output", default="../images/mosaic.jpg")
args = parser.parse_args()

filenames = os.listdir("data")
images = []
for fn in filenames:
    img = Image.open(f"data/{fn}")
    img = img.resize((args.size,args.size), resample=Image.LANCZOS)
    images.append(img)

mosaic_img = create_mosaic_strip(images)
#mosaic_img.show()
mosaic_img.save(args.output, quality=args.quality)
