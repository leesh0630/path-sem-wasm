import hashlib,json,tarfile,pathlib,shutil,re
root=pathlib.Path(".")
out=root/"dist"
(out/"wasm").mkdir(parents=True,exist_ok=True)
shutil.copy2("index.html",out/"index.html")
needed=["quadprog","mnormt","pbivnorm","numDeriv","jsonlite","lavaan"]
items=[]
def dcf(text):
    data={}
    key=None
    for line in text.splitlines():
        if line[:1].isspace() and key:
            data[key]+=" "+line.strip()
        elif ":" in line:
            key,value=line.split(":",1)
            data[key]=value.strip()
    return data
for name in needed:
    files=list(pathlib.Path("build/binaries").glob(name+"_*.tgz"))
    if len(files)!=1: raise RuntimeError(f"{name}: expected one Wasm archive, got {files}")
    src=files[0]
    with tarfile.open(src,"r:gz") as tf:
        members=tf.getmembers()
        desc_member=next(m for m in members if m.name.lstrip("./")==name+"/DESCRIPTION")
        desc=dcf(tf.extractfile(desc_member).read().decode())
        built=desc.get("Built","")
        if "emscripten" not in built or not re.search(r"R 4[.]5[.]",built):
            raise RuntimeError(f"{name}: incompatible binary {built}")
        native=[m for m in members if re.search(r"/libs/.*[.]so$",m.name)]
        for m in native:
            if tf.extractfile(m).read(4)!=b"\0asm":
                raise RuntimeError(f"{name}: not a Wasm shared library: {m.name}")
        if name in ["quadprog","mnormt","pbivnorm","jsonlite"] and not native:
            raise RuntimeError(f"{name}: compiled library missing")
    shutil.copy2(src,out/"wasm"/src.name)
    items.append(dict(name=name,version=desc["Version"],file=src.name,
                      sha256=hashlib.sha256(src.read_bytes()).hexdigest(),built=built))
manifest=dict(schema=1,webR="0.5.4",rMinor="4.5",packages=items)
(out/"wasm/manifest.json").write_text(json.dumps(manifest,indent=2),encoding="utf-8")
shutil.copytree("build/sources",out/"package_sources",dirs_exist_ok=True,
                ignore=shutil.ignore_patterns("*"))
# Keep the original archives for license/source provenance, not unpacked build trees.
for src in pathlib.Path("build/sources").glob("*.tar.gz"):
    shutil.copy2(src,out/"package_sources"/src.name)
(out/"README.txt").write_text(
    "Upload index.html and the complete wasm/ directory to /lavaan/.\n"
    "package_sources contains original R package sources/licenses for provenance.\n"
    "Engine: webR 0.5.4 / R 4.5. Do not substitute CRAN sources for wasm binaries.\n",
    encoding="utf-8")
print(json.dumps(manifest,indent=2))
