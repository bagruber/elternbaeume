"""Arten der Rekordbaeume aus Plants For A Future -> src/daten/arten-pfaf.json

Fuer jede Art in src/daten/rekorde.json, die nicht schon von Hand in
src/daten/arten.json steht, liest das Skript die PFAF-Seite: Winterhaerte,
Vermehrung und Reifezeit der Samen. Die Seiten werden in quellen/pfaf/
zwischengespeichert. Eine Erfolgsstufe wird nur gesetzt, wenn PFAF sie nennt,
sonst steht "offen".

Aufruf:  python etl/pfaf.py
"""

import html
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

WURZEL = Path(__file__).resolve().parent.parent
DATEN = WURZEL / "src" / "daten"
CACHE = WURZEL / "quellen" / "pfaf"
ZIEL = DATEN / "arten-pfaf.json"

MONATE = ["january", "february", "march", "april", "may", "june", "july",
          "august", "september", "october", "november", "december"]
JAHRESZEITEN = {"spring": [3, 4, 5], "summer": [6, 7, 8], "autumn": [9, 10, 11], "winter": [12, 1, 2]}

# Abmoosen, Absenker und Veredeln fehlen absichtlich: Sie gehen nicht auf Reisen
# oder nicht im eigenen Garten.
REGELN = [
    ("wurzelschnittling", re.compile(r"root cuttings", re.I)),
    ("schoessling", re.compile(r"suckers", re.I)),
    ("halbreif", re.compile(r"half-ripe|half ripe|semi-ripe", re.I)),
    ("gruensteckling", re.compile(r"softwood|soft wood|young shoots", re.I)),
    ("steckholz", re.compile(r"mature (?:terminal )?(?:wood|shoots)|hardwood|ripe wood|ripe terminal", re.I)),
]
# Diese drei sind Stecklinge: Der Satz muss auch davon handeln.
STECKLINGE = {"halbreif", "gruensteckling", "steckholz"}

ERFOLG = [
    ("kaum", re.compile(r"very difficult|low percentage|poor percentage|rarely successful", re.I)),
    ("leicht", re.compile(r"\beasy\b|good percentage|high percentage|roots easily|very good", re.I)),
    ("mittel", re.compile(r"fair percentage|fair to good", re.I)),
    ("schwer", re.compile(r"difficult", re.I)),
]


def slug(s):
    s = s.lower().replace("×", "x")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def lade(wiss):
    CACHE.mkdir(parents=True, exist_ok=True)
    datei = CACHE / f"{slug(wiss)}.html"
    if not datei.exists():
        name = wiss.replace("×", "x")
        url = "https://pfaf.org/user/Plant.aspx?" + urllib.parse.urlencode({"LatinName": name})
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (elternbaeume)"})
        with urllib.request.urlopen(req, timeout=30) as r:
            datei.write_bytes(r.read())
        time.sleep(1)
    return datei.read_text(encoding="utf-8", errors="replace")


def flach(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", s)))


def monate_in(satz):
    satz = satz.lower()
    # In der Reihenfolge des Texts: "from October to February" geht ueber Neujahr
    treffer = sorted((m.start(), i + 1) for i, name in enumerate(MONATE) for m in re.finditer(rf"\b{name}\b", satz))
    gefunden = [n for _, n in treffer]
    if gefunden:
        if len(gefunden) == 2 and re.search(r"\bto\b", satz):
            a, b = gefunden
            return list(range(a, b + 1)) if a <= b else list(range(a, 13)) + list(range(1, b + 1))
        return sorted(set(gefunden))
    for wort, ms in JAHRESZEITEN.items():
        if wort in satz:
            return ms
    return None


def lies(wiss):
    s = lade(wiss)
    t = flach(s)
    usda = re.search(r"USDA hardiness (\d+)-(\d+)", t)
    uk = re.search(r"hardy to UK zone (\d+)", t)
    if not usda and not uk:
        return None
    zonen = [int(usda.group(1))] if usda else []
    if uk:
        zonen.append(int(uk.group(1)))
    prop = re.search(r"Propagation</h2>(.*?)</div>", s, re.S)
    text = flach(prop.group(1)).split(" Other Names")[0].strip() if prop else ""
    reife = re.search(r"seeds ripen (?:from|in) ([^.]*)\.", t)
    reifemonate = monate_in(reife.group(1)) if reife else None

    methoden, samen, feucht, letzte = {}, [], False, None
    for satz in re.split(r"(?<=[.\]])\s+(?=[A-Z])", text):
        sl = satz.lower()
        if sl.startswith("seed") or ("seed" in sl and "sow" in sl):
            samen.append(satz)
            feucht = feucht or bool(re.search(r"not be allowed to (?:dry|become dry)|short viability|loses viability|quickly loses", sl))
            letzte = "samen"
            continue
        treffer = next((mid for mid, muster in REGELN
                        if muster.search(satz) and (mid not in STECKLINGE or "cutting" in sl)), None)
        if treffer and treffer not in methoden:
            eintrag = {"methode": treffer, "saetze": [satz]}
            ms = monate_in(satz)
            if ms and treffer != "schoessling":
                eintrag["monate"] = ms
            methoden[treffer] = eintrag
            letzte = treffer
        elif letzte in methoden:
            # Folgesaetze wie "Very easy." oder "Good percentage." gehoeren
            # zur Methode davor
            methoden[letzte]["saetze"].append(satz)
    if samen:
        mid = "samen_feucht" if feucht else "samen_trocken"
        methoden = {mid: {"methode": mid, "monate": reifemonate or [9, 10], "saetze": samen}, **methoden}
        if not reifemonate:
            methoden[mid]["hinweis"] = "Reifezeit bei PFAF nicht angegeben, Herbst angenommen."

    liste = []
    for m in methoden.values():
        saetze = m.pop("saetze")
        beleg = next(((e, s) for s in saetze for e, muster in ERFOLG if muster.search(s)), None)
        m["erfolg"] = beleg[0] if beleg else "offen"
        if beleg:
            m["erfolgBeleg"] = "PFAF: „" + re.sub(r"\[\w+\]", "", beleg[1]).strip()[:90] + "“"
        liste.append(m)
    return {
        "zone": max(zonen),
        "zoneHerkunft": "PFAF: " + ", ".join(
            ([f"USDA {usda.group(1)}–{usda.group(2)}"] if usda else []) + ([f"UK-Zone {uk.group(1)}"] if uk else [])),
        "methoden": liste,
        "quelle": "https://pfaf.org/user/Plant.aspx?" + urllib.parse.urlencode({"LatinName": wiss.replace("×", "x")}),
    }


def main():
    hand = json.loads((DATEN / "arten.json").read_text(encoding="utf-8"))
    bekannt = {a["wiss"] for a in hand.values()}
    rekorde = json.loads((DATEN / "rekorde.json").read_text(encoding="utf-8"))
    namen = {}
    for r in rekorde:
        namen.setdefault(r["wiss"], r["artName"])
    raus, ohne = {}, []
    for wiss, deutsch in sorted(namen.items()):
        if wiss in bekannt or "(sp.)" in wiss or "?" in wiss:
            continue
        daten = lies(wiss)
        if not daten or not daten["methoden"]:
            ohne.append(wiss)
            continue
        raus[slug(wiss)] = {"name": deutsch or wiss, "wiss": wiss, **daten}
    ZIEL.write_text(json.dumps(raus, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{len(raus)} Arten nach {ZIEL.relative_to(WURZEL)}, {len(ohne)} ohne PFAF-Daten:")
    print("  " + ", ".join(ohne))


if __name__ == "__main__":
    main()
