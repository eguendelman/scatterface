import os, json

JSON_FILENAME = "../config/backgrounds.json"

with open("picsum_ids.txt","r") as f:
    picsum_ids = f.read().splitlines()

bgs = []
for id in picsum_ids:
    bgs.append(dict(imageUrl=f"https://picsum.photos/id/{id}/1920/1080", sourceUrl=f"https://picsum.photos/id/{id}/info"))
    #bgs.append(dict(url=f"images/backgrounds/{fn}"))
    #bgs.append(dict(type="unsplash", id=fn.split("-")[-2]))

dataset = dict()
dataset['backgrounds'] = bgs

with open(JSON_FILENAME,"w") as f:
    json.dump(dataset, f)
