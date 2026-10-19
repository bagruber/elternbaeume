# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Vite, React, MapLibre und Tailwind 4 wie im Nachbar-Repo `baumkarte`. Grund: Der gemeinsame pnpm-Store dedupliziert nur bei gleichen Versionen, die Zielversionen stehen in `hausbasis/baseline.json`. Deploy auf GitHub Pages unter `/elternbaeume/`.

## Users

Eine Person: wer die Seite betreibt. Gezogen werden Ableger von alten, seltenen oder geschichtlich bedeutsamen Bäumen, das Material kommt meist von Reisen. Genutzt wird die Seite vor allem unterwegs am Handy, vor dem Baum oder auf dem Weg dorthin. Die Seite ist öffentlich, weil GitHub Pages das so macht, gestaltet wird aber für diese eine Person.

## Product Purpose

Die Karte beantwortet eine Frage: Ich bin an diesem Baum, heute, in so vielen Tagen zuhause. Was kann ich mitnehmen, überlebt es die Reise, und wächst es in Moosburg an der Isar? Erfolg heißt, dass vor Ort in Sekunden klar ist, welche Methode geht, wie das Material reist und was zuhause damit passiert.

## Positioning

Andere Karten alter Bäume, etwa Monumental Trees oder die Listen der Deutschen Dendrologischen Gesellschaft, zeigen Rekorde. Diese Karte verbindet den Baum mit der Biologie seiner Art: Vermehrungsmethode, Zeitfenster und Haltbarkeit unterwegs, gegen die Reisetage und die Winterhärte am eigenen Garten gerechnet.

## Operating Context

- Unterwegs, oft im Freien, am Handy, manchmal mit schlechtem Netz.
- Material kommt in Gefrierbeuteln, feuchtem Papier und Kühltaschen nach Hause. Entscheidend ist, wie viele Tage es bis zur Erde oder zum Wasser übersteht.
- Der Garten liegt in Moosburg an der Isar, Winterhärtezone 7a. Gerechnet ist das aus den DWD-Tagesminima der Station Weihenstephan-Dürnast: Mittel 1991–2020 −16,0 °C, Ausreißer 2000 mit −23,2 °C.
- Das Versuchsprotokoll (was wann genommen wurde, was angewachsen ist) bleibt lokal und gehört nicht auf die öffentliche Seite.

## Capabilities and Constraints

- Drei Datenebenen: Methode (Anleitung, Transport, Haltbarkeit) ← Art (Methoden mit Monaten und Erfolgsstufe, Zone) ← Baum (Ort, Geschichte, Alter mit Gewissheit, Quellen). Gepflegt von Hand als JSON in `src/daten/`.
- Methoden: Grünsteckling, halbreifer Steckling, Steckholz, Wurzelschnittling, Wurzelschössling, Samen trocken lagerbar, Samen nicht austrocknen lassen. Edelreiser sind bewusst ausgeschlossen, weil sie im eigenen Garten nicht umsetzbar sind.
- Rangfolge: Klon vor Sämling, Sämling vor nichts. Ein Klon mit Erfolg „kaum“ zählt nicht als Möglichkeit.
- Winterhärte in drei Stufen: ja, nur mit Schutz, nein. Zone ≤ 6 heißt ja, Zone 7 mit Schutz, Zone ≥ 8 nein. Bei widersprüchlichen Quellenangaben gilt der vorsichtigere Wert.
- Erfolgsstufen: leicht, mittel, schwer, kaum. Keine Prozentzahlen. Jede Stufe ist entweder mit Quelle belegt (meist PFAF) oder als Einschätzung gekennzeichnet.
- Altersangaben tragen eine Gewissheit: belegt, geschätzt, überliefert, unbekannt.
- Beim Öffnen steht der Monat auf dem aktuellen.

## Brand Commitments

- Name: Elternbäume.
- Ton: vorsichtig formuliert. Methoden sind Eigenschaften einer Art („lässt sich über Steckholz vermehren“), keine Aufforderung an einem bestimmten Baum. Rechtliches steht als Hinweis da (Naturdenkmal, botanischer Garten, Pflanzengesundheit außerhalb der EU) und schließt nie etwas aus.
- Deutsch.

## Evidence on Hand

- 24 Bäume, 15 Arten, 7 Methoden in `src/daten/`, jede Angabe mit Quelle: Wikipedia, Stadt Wien Open Data (Naturdenkmäler), das Faltblatt „Histoires d’arbres“ des Jardin des Plantes, PFAF, OpenStreetMap, Wikidata.
- Keine Fotos der Bäume. Keine eigenen Versuchsergebnisse bisher. Beides darf nicht erfunden werden.

## Product Principles

1. Die Frage vor dem Baum zuerst: was jetzt geht. Alles andere ist zweite Ebene.
2. Ehrlich über Gewissheit: belegt, geschätzt und überliefert sind sichtbar verschieden, Einschätzungen sind als solche markiert.
3. Wenig Lesen, viel Sehen: Zeitfenster, Haltbarkeit und Winterhärte werden gezeigt, nicht beschrieben. Text nur dort, wo gehandelt wird (Anleitung, Transport).
4. Unterwegs tauglich: am Handy mit einer Hand bedienbar, auch bei schlechtem Netz lesbar.

## Accessibility & Inclusion

Draußen bei Tageslicht am Handy: hohe Kontraste, Zustände nie nur über Farbe unterscheidbar.
