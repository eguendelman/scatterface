import os, json

BG_DIR = "../images/backgrounds"
JSON_FILENAME = "../dataset.json"

filenames = os.listdir(BG_DIR)
bgs = []
for fn in filenames:
    bgs.append(dict(url=f"images/backgrounds/{fn}"))

dataset = dict()
dataset['backgrounds'] = bgs

with open(JSON_FILENAME,"w") as f:
    json.dump(dataset, f)
