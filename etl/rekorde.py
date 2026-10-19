"""Monumental-Trees-Uebersicht "Die aeltesten Baeume in Europa" -> src/daten/rekorde.json

Die Seite steht hinter einer Bot-Sperre und wird deshalb von Hand im Browser
gespeichert, nach quellen/monumentaltrees/ (git-ignoriert). Dieses Skript liest
sie aus, behaelt nur Baeume in den Regionen aus src/daten/regionen.json und
geokodiert den Ort ueber OSM Nominatim. Die Koordinate ist damit nur auf
Ortsebene genau; die genaue Lage steht auf der verlinkten Baumseite.

Aufruf:  python etl/rekorde.py
"""

import html
import json
import math
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

WURZEL = Path(__file__).resolve().parent.parent
QUELLE = WURZEL / "quellen" / "monumentaltrees" / "Die ältesten Bäume in Europa.html"
CACHE = WURZEL / "quellen" / "geokodiert.json"
REGIONEN = json.loads((WURZEL / "src" / "daten" / "regionen.json").read_text(encoding="utf-8"))
ZIEL = WURZEL / "src" / "daten" / "rekorde.json"

LAND = {"deu": "DE", "aut": "AT", "gbr": "GB", "fra": "FR", "cze": "CZ", "hun": "HU"}

# Vorfilter ueber den Pfad der Baumseite (/de/<land>/<region>/...). Die Staedte
# werden danach auf ihren Umkreis geschnitten.
VORFILTER = {
    "deu": {"bayern", "badenwurttemberg", "berlin", "brandenburg", "nordrheinwestfalen"},
    "aut": None,
    "gbr": {"cityoflondon", "greaterlondon", "surrey", "kent", "berkshire", "essex",
            "hertfordshire", "buckinghamshire", "greatermanchester", "cheshire", "lancashire"},
    "fra": {"paris", "valdemarne", "essonne", "yvelines", "valdoise", "hautsdeseine",
            "seinesaintdenis", "seineetmarne"},
    "cze": {"praha", "stredocesky"},
    "hun": {"budapest", "pest"},
}
SUED = {"bayern", "badenwurttemberg"}

# Bei Stadtstaaten gehoert die Stadt in die Suche, sonst landet etwa
# "Landstrasse" (3. Bezirk) in einem gleichnamigen Ort in Niederoesterreich.
STADT = {"wien": "Wien", "berlin": "Berlin", "paris": "Paris", "cityoflondon": "London", "greaterlondon": "London"}

GARTEN = re.compile(r"botani|arboret|jardin des plantes|kew|wilhelma|mainau|späth|hermannshof|wisley|sichtungsgarten", re.I)


def text(x):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", x))).strip()


def lies():
    s = QUELLE.read_text(encoding="utf-8", errors="replace")
    tab = s[s.find('<table class="provw"'):]
    tab = tab[: tab.find("</table>")]
    art, platz = None, 0
    for z in re.findall(r"<tr>(.*?)</tr>", tab, re.S):
        zellen = re.findall(r"<td[^>]*>(.*?)</td>", z, re.S)
        if len(zellen) == 7:
            m = re.search(r'href="([^"]+)"[^>]*>\s*<i>(.*?)</i>\s*(?:\((.*?)\))?', zellen[1], re.S)
            art = {"wiss": text(m.group(2)), "artName": text(m.group(3) or "")}
            platz = 0
            zellen = zellen[2:]
        platz += 1
        alter, jahr, ort, _, messjahr = zellen
        a = re.match(r"(\d+)\s*(?:±\s*(\d+))?", text(alter))
        url = re.search(r'href="([^"]+)"', ort).group(1)
        name = re.search(r"<b>(.*?)</b>", ort)
        teile = [t.strip() for t in text(ort).split(",")]
        orte = teile[1:-1] if name else teile[:-1]
        yield {
            **art,
            "platz": platz,
            "alter": int(a.group(1)),
            "spanne": int(a.group(2)) if a.group(2) else None,
            "messjahr": text(messjahr),
            "baumName": text(name.group(1)) if name else None,
            "orte": orte,
            "pfad": url.split("/de/")[1].strip("/").split("/"),
            "url": url,
        }


def km(lat1, lon1, lat2, lon2):
    r = math.pi / 180
    a = math.sin((lat2 - lat1) * r / 2) ** 2 + math.cos(lat1 * r) * math.cos(lat2 * r) * math.sin((lon2 - lon1) * r / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(a))


def geokodiere(orte, land, stadt, cache):
    # Erst Strasse oder Flur mit Gemeinde, dann nur die Gemeinde, dann die
    # Gemeinde ohne "OT " (Ortsteil) und ohne Bindestrich-Ortsteil.
    zusatz = f", {stadt}" if stadt else ""
    gemeinde = orte[-1]
    versuche = [", ".join(orte[-2:]) + zusatz] if len(orte) >= 2 else []
    versuche.append(gemeinde + zusatz)
    ohne_ot = re.sub(r"^OT\s+", "", gemeinde)
    if ohne_ot != gemeinde:
        versuche.append(ohne_ot)
    if "-" in gemeinde:
        versuche.append(gemeinde.split("-")[0].strip())
    for q in versuche:
        schluessel = f"{land}|{q}"
        if schluessel not in cache:
            url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
                {"q": q, "countrycodes": land.lower(), "format": "json", "limit": 1})
            req = urllib.request.Request(url, headers={"User-Agent": "elternbaeume/0.1 (+https://github.com/bagruber/elternbaeume)"})
            with urllib.request.urlopen(req, timeout=30) as r:
                treffer = json.load(r)
            cache[schluessel] = [float(treffer[0]["lat"]), float(treffer[0]["lon"])] if treffer else None
            CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=1), encoding="utf-8")
            time.sleep(1.1)  # Nominatim erlaubt eine Anfrage pro Sekunde
        if cache[schluessel]:
            return cache[schluessel], q
    return None, None


def regionen(lat, lon, land, pfad):
    ids = []
    if land == "DE" and pfad[1] in SUED:
        ids.append("sueddeutschland")
    if land == "AT":
        ids.append("oesterreich")
    for r in REGIONEN:
        if "umkreisKm" in r and km(lat, lon, r["lat"], r["lon"]) <= r["umkreisKm"]:
            ids.append(r["id"])
    return ids


def slug(s):
    s = s.lower().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def schon_da():
    """Von Hand gepflegte Baeume als (wiss, lat, lon), um Doppelte zu erkennen."""
    arten = json.loads((WURZEL / "src" / "daten" / "arten.json").read_text(encoding="utf-8"))
    baeume = json.loads((WURZEL / "src" / "daten" / "baeume.json").read_text(encoding="utf-8"))
    return [(arten[b["art"]]["wiss"], b["lat"], b["lon"], b["id"]) for b in baeume]


def main():
    cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
    hand = schon_da()
    raus, fehlt, doppelt = [], [], []
    for e in lies():
        land3 = e["pfad"][0]
        if land3 not in VORFILTER:
            continue
        erlaubt = VORFILTER[land3]
        region = e["pfad"][2] if land3 == "gbr" else e["pfad"][1]
        if erlaubt is not None and region not in erlaubt:
            continue
        land = LAND[land3]
        punkt, gefunden = geokodiere(e["orte"], land, STADT.get(region), cache)
        if not punkt:
            fehlt.append(e["url"])
            continue
        ids = regionen(punkt[0], punkt[1], land, e["pfad"])
        if not ids:
            continue
        gleich = next((h[3] for h in hand if h[0] == e["wiss"] and km(h[1], h[2], *punkt) < 0.3), None)
        if gleich:
            doppelt.append(f"{e['url']} = {gleich}")
            continue
        nummer = e["pfad"][-1] if e["pfad"][-1].isdigit() else e["pfad"][-1].split("_")[0]
        # Inventarnummern botanischer Gaerten (Kew: "1996-1430") sind keine Namen
        baum_name = e["baumName"] if e["baumName"] and not re.fullmatch(r"[\d\s./-]+", e["baumName"]) else None
        unbestimmt = not e["wiss"].strip("? ")
        art_name = "Art unbestimmt" if unbestimmt else e["artName"]
        standard = f"Unbestimmter Baum in {e['orte'][-1]}" if unbestimmt else f"{art_name or e['wiss']} in {e['orte'][-1]}"
        raus.append({
            # Unbenannte Baeume teilen sich den Link ihres Orts, erst der Rang
            # in Europa macht die ID eindeutig
            "id": f"mt-{nummer}-{slug(e['wiss'])}-{e['platz']}",
            "name": baum_name or standard,
            "wiss": "unbestimmt" if unbestimmt else e["wiss"],
            "artName": art_name,
            "lat": round(punkt[0], 5),
            "lon": round(punkt[1], 5),
            "lageText": gefunden,
            "ort": ", ".join(e["orte"]),
            "land": land,
            "regionen": ids,
            "platzEuropa": e["platz"],
            "alter": e["alter"],
            "spanne": e["spanne"],
            "messjahr": e["messjahr"],
            "url": e["url"],
            **({"schutz": "Botanischer Garten oder Arboretum"} if GARTEN.search(", ".join(e["orte"])) else {}),
        })
    ZIEL.write_text(json.dumps(raus, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{len(raus)} Baeume nach {ZIEL.relative_to(WURZEL)}")
    for r in REGIONEN:
        print(f"  {r['name']:16} {sum(1 for x in raus if r['id'] in x['regionen'])}")
    for titel, liste in (("Orte nicht gefunden", fehlt), ("schon von Hand erfasst", doppelt)):
        if liste:
            print(f"{len(liste)} {titel}:")
            for u in liste:
                print("  ", u)


if __name__ == "__main__":
    main()
