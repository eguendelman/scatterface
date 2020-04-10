import os, json

JSON_FILENAME = "../config/backgrounds.json"

with open("unsplash_ids.txt","r") as f:
    unsplash_ids = f.read().splitlines()

bgs = []
for id in unsplash_ids:
    bgs.append(dict(url=f"https://source.unsplash.com/{id}"))
    #bgs.append(dict(url=f"images/backgrounds/{fn}"))
    #bgs.append(dict(type="unsplash", id=fn.split("-")[-2]))

dataset = dict()
dataset['backgrounds'] = bgs

with open(JSON_FILENAME,"w") as f:
    json.dump(dataset, f)
