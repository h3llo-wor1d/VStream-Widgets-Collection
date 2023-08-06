import io
import zipfile
import requests
import glob
import json

def createJson(i):
    o = {}
    lines = [i.strip().replace(",", "") for i in i.split("\n")]
    for line in lines:
        if line != "{" and line != "}":
            kv = line.split(":")
            o[kv[0]] = kv[1].replace("\"", "").strip()
    return o
        
def makeOptionChange(new, old):
    oLines = createJson(old.split("document.styleOptions = ")[1])
    out = createJson(old.split("document.styleOptions = ")[1])
    nLines = createJson(new.split("document.styleOptions = ")[1])
    
    for key, value in nLines.items():
        if key not in list(oLines.keys()):
            out[key] = value
    if out != oLines:
        file = f"document.styleOptions = {json.dumps(oLines, indent=4)}"
        return file
    else:
        return False
    
resp = requests.get("https://github.com/h3llo-wor1d/VStream-Widgets-Collection/archive/refs/heads/main.zip", stream=True)
resp.raise_for_status()
z = zipfile.ZipFile(io.BytesIO(resp.content))
zContents = [i for i in z.namelist() if "." in i and not i.endswith((".lnk", ".png", ".mp3", ".ttf", ".otf", ".py"))]
currentFiles = [i.replace("\\", "/") for i in glob.glob("**", recursive=True) if "." in i and not i.endswith((".lnk", ".png", ".mp3", ".ttf", ".otf", ".py"))]

print(zContents)

for i in range(len(zContents)-1):
    print(f"Progress: {i+1}/{len(zContents)-1}")
    print(zContents[i])
    if (zContents[i].replace('VStream-Widgets-Collection-main/', '') in currentFiles):
        new = z.read(zContents[i]).decode("utf-8")
        old = open(zContents[i].replace('VStream-Widgets-Collection-main/', ''), "r").read()
        if old.startswith(" "):
            old = old[1:]
        if new != old:
            if zContents[i].endswith("options.js"):
                changed = makeOptionChange(new, old)
                if (changed):
                    open(zContents[i].replace('VStream-Widgets-Collection-main/', ''), "w+").write(changed)
                    continue
        else:
            continue
    else:
        new = z.read(zContents[i]).decode("utf-8")
        print(f"New file found or old file updated (name: {zContents[i].replace('VStream-Widgets-Collection-main/', '')}")
        open(zContents[i].replace('VStream-Widgets-Collection-main/', ''), "w+").write(new)
