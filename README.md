# Elternbäume

Karte alter, seltener und geschichtlich bedeutsamer Bäume, von denen sich Ableger ziehen
lassen. Für jeden Baum steht, welche Vermehrung seine Art erlaubt, in welchen Monaten, wie
lange das Material unterwegs durchhält und ob die Art in Moosburg an der Isar winterhart ist.

## Daten

Unter `src/daten/`, von Hand gepflegt:

| Datei | Inhalt |
|---|---|
| `methoden.json` | Vermehrungsmethoden: Anleitung, Transport, Haltbarkeit in Tagen, Klon oder Nachkomme |
| `arten.json` | Arten: Winterhärtezone, welche Methoden in welchen Monaten, Erfolgsstufe, Quelle |
| `baeume.json` | Einzelne Bäume: Ort, Geschichte, Alter mit Gewissheit, Schutzstatus, Quellen |
| `regionen.json` | Regionen für die Liste; Städte mit Umkreis in km |

Erzeugt von den Skripten in `etl/`, nicht von Hand ändern:

| Datei | Skript | Inhalt |
|---|---|---|
| `rekorde.json` | `python etl/rekorde.py` | Alterrekorde aus Monumental Trees in den Regionen, Ort geokodiert |
| `arten-pfaf.json` | `python etl/pfaf.py` | Arten dieser Rekorde aus PFAF: Zone, Methoden, Reifemonate |

Monumental Trees steht hinter einer Bot-Sperre. Die Übersicht „Die ältesten Bäume in
Europa“ wird deshalb von Hand im Browser gespeichert, nach `quellen/monumentaltrees/`.
`quellen/` ist git-ignoriert, dort liegen auch die Caches für Nominatim und PFAF. Die
Koordinaten der Rekorde sind nur auf Ortsebene genau, die Baumseite ist verlinkt.
Arten, die PFAF nicht führt, bleiben grau: Der Baum steht auf der Karte, aber ohne
Jahresring.

Ein Baum verweist auf seine Art, eine Art auf ihre Methoden. Anleitungen gibt es deshalb
pro Methode und nicht pro Baum. Ein neuer Baum braucht nur Ort, Art und Geschichte.

Konventionen:

- **Erfolg** ist `leicht`, `mittel`, `schwer` oder `kaum`, keine Prozentzahlen. Steht ein
  `erfolgBeleg` dabei, kommt die Stufe aus der Quelle, sonst ist sie eine Einschätzung.
  `offen` heißt: Die Quelle nennt die Methode, sagt aber nichts zum Erfolg.
- **Alter** trägt eine Gewissheit: `belegt`, `geschaetzt`, `ueberliefert`, `unbekannt`.
- **Zone** ist die USDA-Winterhärtezone. Nennt PFAF zwei Werte, gilt der vorsichtigere.
- **Methoden** sind Eigenschaften der Art. Rechtliches (`schutz`, `hinweis`) ist ein
  Hinweis und schließt nichts aus.

`pnpm test` prüft die Verweise zwischen den Dateien.

## Moosburg

Zone 7a, gerechnet aus den DWD-Tagesminima der Station Weihenstephan-Dürnast (05404):
Mittel der Jahresminima 1991–2020 bei −16,0 °C, kältestes Jahr 2000 mit −23,2 °C.
Zone ≤ 6 heißt winterhart, Zone 7 nur mit Schutz, Zone ≥ 8 nein.

## Entwickeln

```bash
pnpm install
pnpm dev
pnpm test
```

Deploy über GitHub Actions auf Pages (`.github/workflows/pages.yml`), Pfad `/elternbaeume/`.

## Quellen

Bäume: Wikipedia, Wikidata (CC0), OpenStreetMap (ODbL), Stadt Wien Open Data
(Naturdenkmäler, CC BY 4.0), Jardin des Plantes „Histoires d’arbres“,
[Monumental Trees](https://www.monumentaltrees.com) (Alterrekorde, je Baum verlinkt).
Geokodierung: OpenStreetMap Nominatim.
Arten und Methoden: [Plants For A Future](https://pfaf.org).
Klima: Deutscher Wetterdienst, Climate Data Center.
