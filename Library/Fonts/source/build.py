"""Сборка библиотеки шрифтов для nikalimp.ru.

Вход (в этой папке): fonts.jsonl (scrape.py), svgmap.json (svgmap.py), svg/ — превью названий, gf-metadata.json (fonts.google.com/metadata/fonts).
Выход: ../fonts.json — данные сайта; ../../../.site/public/font-previews/<slug>.svg; ../../../.site/public/font-files/<slug>/<w>[i].woff2 —
подмножество глифов для образца текста (только шрифты из Google Fonts: их файлы доступны для скачивания).

  python3 build.py [папка-с-svg]
"""
import json, os, re, shutil, sys, time, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(HERE, "../../../.site/public")
SVG_IN = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "svg")
SAMPLE = "Съешь же ещё этих мягких французских булок, да выпей чаю. АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz 0123456789 «»—–-!?.,:;()&%@#№"
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"}

def get(u, binary=False):
    for _ in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30) as r:
                d = r.read(); return d if binary else d.decode("utf8")
        except Exception: time.sleep(2)
    return None

raw = [json.loads(l) for l in open(os.path.join(HERE, "fonts.jsonl"))]
sm = json.load(open(os.path.join(HERE, "svgmap.json")))
t = open(os.path.join(HERE, "gf-metadata.json")).read(); gf = {f["family"].lower(): f for f in json.loads(t[t.find("{"):])["familyMetadataList"]}

def styles(faces):
    by = {}
    for f in faces:
        k = f["url"]
        if k not in by or (by[k]["w"] == 400 and f["w"] != 400): by[k] = f
    return sorted({(f["w"], f["i"]) for f in by.values()})

def clean(s): return re.sub(r"\s+", " ", s or "").strip()

os.makedirs(os.path.join(SITE, "font-previews"), exist_ok=True)
items = []
for d in raw:
    s = d["slug"]
    allow = d.get("allow", "")
    commercial = "оммерческ" in allow or "оммерческ" in d.get("license", "").split(";")[0]
    st = styles(d["faces"])
    g = gf.get(d["name"].lower())
    it = {"s": s, "n": clean(d["name"]), "c": commercial, "st": [[w, int(i)] for w, i in st],
          "about": clean(d.get("about")), "a": [{"n": clean(a["name"]), "u": a.get("url") or ""} for a in d.get("authors", []) if clean(a.get("name"))],
          "lic": clean(d.get("license")), "allow": clean(allow), "limit": clean(d.get("limit")), "zip": d.get("zip"),
          "pairs": d.get("pairs", []), "sim": d.get("similar", [])}
    src = os.path.join(SVG_IN, s + ".svg")
    if os.path.exists(src) and os.path.getsize(src) > 0:
        shutil.copy(src, os.path.join(SITE, "font-previews", s + ".svg")); it["svg"] = 1
    if g and "cyrillic" in g.get("subsets", []):
        it["g"] = g["family"]
        out = os.path.join(SITE, "font-files", s); os.makedirs(out, exist_ok=True); got = []
        for key in sorted(g.get("fonts", {})):
            m = re.fullmatch(r"(\d+)(i?)", key)
            if not m: continue
            w, ital = int(m.group(1)), m.group(2) == "i"
            name = f"{w}{'i' if ital else ''}"
            path = os.path.join(out, name + ".woff2")
            if not os.path.exists(path):
                fam = urllib.parse.quote(g["family"]) + (f":ital,wght@{int(ital)},{w}")
                css = get(f"https://fonts.googleapis.com/css2?family={fam}&text={urllib.parse.quote(SAMPLE + d['name'])}")
                u = re.search(r"url\((https://[^)]+)\)", css or "")
                data = get(u.group(1), True) if u else None
                if not data: continue
                open(path, "wb").write(data)
            got.append([w, int(ital)])
        if got: it["gw"] = got; it["st"] = sorted({tuple(x) for x in it["st"]} | {tuple(x) for x in got})
    items.append(it)

names = {i["s"] for i in items}
for i in items:
    i["pairs"] = [p for p in i["pairs"] if p in names and p != i["s"]]
    i["sim"] = [p for p in i["sim"] if p in names and p != i["s"]]
items.sort(key=lambda x: x["n"].lower())
json.dump({"updated": time.strftime("%Y-%m-%d"), "sample": SAMPLE, "items": items}, open(os.path.join(HERE, "../fonts.json"), "w"), ensure_ascii=False)
print(len(items), "шрифтов,", sum(1 for i in items if i.get("svg")), "с превью,", sum(1 for i in items if i.get("gw")), "с образцом текста")
