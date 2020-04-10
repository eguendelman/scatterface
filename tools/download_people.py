import os, time, requests, argparse
from io import BytesIO
from PIL import Image

URL = "https://www.thispersondoesnotexist.com/image"
SLEEP = 1
OUTPUT_FILENAME_PATTERN = "data/person_{:03d}.jpg"

fileidx = 1

def get_available_filename():
    global fileidx
    while os.path.isfile(OUTPUT_FILENAME_PATTERN.format(fileidx)):
        fileidx += 1
    return OUTPUT_FILENAME_PATTERN.format(fileidx)

#############################################################################
# MAIN
#############################################################################
parser = argparse.ArgumentParser()
parser.add_argument("-n", "--num", default=3, type=int)
args = parser.parse_args()

print(f"Will download {args.num} image(s)")
for i in range(args.num):
    print("Fetching another...")
    r = requests.get(URL, headers={'User-Agent': 'My User Agent 1.0'})
    i = Image.open(BytesIO(r.content))

    filename = get_available_filename()
    print(f"Saving to {filename}")
    i.save(filename)
    print(f"Sleeping {SLEEP} second(s)")
    time.sleep(SLEEP)
