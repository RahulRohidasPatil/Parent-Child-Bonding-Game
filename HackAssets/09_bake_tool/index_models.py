import os, json, sys
ROOT = sys.argv[1]
SRC = {
    "F": "dl/k/furniturekit_updated/Models/GLTF format", "NA": "dl/k/kenney_natureKit_2.1/Models/GLTF format",
    "GV": "dl/k/kenney_graveyardkit_3/Models/GLTF format", "HO": "dl/k/kenney_holidaypack/Models/GLTF format",
    "HX": "dl/k/kenney_hexagonkit_1/Models/GLTF format", "PI": "dl/k/kenney_piratekit_1.1/Models/glTF format",
    "SP": "dl/k/space-kit-1.0/Models", "CA": "dl/k/castle-kit-1.0/Models",
    "KF": "kk/Furniture-Bits", "KD": "kk/Dungeon-Remastered", "KR": "kk/Restaurant-Bits", "KP": "kk/Prototype-Bits",
    "KC": "kk/City-Builder-Bits", "KH": "kk/Halloween-Bits", "KS": "kk/Space-Base-Bits",
}
out = {}
for p, d in SRC.items():
    for dp, _, fs in os.walk(os.path.join(ROOT, d)):
        if "/.git" in dp:
            continue
        for f in fs:
            name, ext = None, None
            for e in (".gltf.glb", ".glb", ".gltf", ".obj"):
                if f.endswith(e):
                    name, ext = f[: -len(e)], e
                    break
            if not name or (p in ("SP", "CA") and ext != ".obj"):
                continue
            rel = os.path.relpath(os.path.join(dp, f), ROOT).replace(" ", "%20")
            out.setdefault("%s:%s" % (p, name), "/" + rel)
json.dump(out, open(os.path.join(ROOT, "bake/models.json"), "w"), indent=0)
print(len(out))
