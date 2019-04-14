# Convert a TSV file to a JSON file
import json
data = []
with open('ingreedy_food.json', 'w') as outfile, open("ingreedy_food.tsv","r") as f:
    firstline = f.readline().strip()
    columns = firstline.split('\t')
    lines = f.readlines()
    for line in lines:
        values = line.strip().split('\t')
        entry = dict(zip(columns, values))
        data.append(entry)
    json.dump(data, outfile, indent=2)
