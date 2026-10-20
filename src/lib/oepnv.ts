import type { ExpressionSpecification, LayerSpecification } from "maplibre-gl";

/**
 * Zuschaltbare OePNV-Ebene aus denselben OpenFreeMap-Kacheln wie die
 * Grundkarte, kein zweiter Dienst. Je naeher man kommt, desto mehr: erst die
 * Bahn, dann U-Bahn und Stadtbahn, zuletzt die Tram. Busse gar nicht, ihre
 * Haltestellen haben in den Kacheln eine eigene Klasse und bleiben draussen.
 * Abstellgleise, Weichen und Betriebshoefe tragen das Merkmal "service" und
 * fallen weg.
 *
 * Die Zoomstufen folgen den Kacheln: U-Bahn- und Tramstrecken stehen dort erst
 * ab Zoom 14 drin. Frueher eingeblendet gaebe es Stationen ohne Linie.
 */

const PAPIER = "#fafaf8";
const TINTE = "#1d1f1c";
const UBAHN = "#2b5c9e";
const TRAM = "#9b2f3b";

const QUELLE = { source: "openmaptiles" } as const;

function strecke(klasse: string, arten: string[], tunnel?: boolean): ExpressionSpecification {
  const teile: ExpressionSpecification[] = [
    ["==", ["get", "class"], klasse],
    ["match", ["get", "subclass"], arten, true, false],
    ["!", ["has", "service"]],
  ];
  if (tunnel !== undefined) teile.push([tunnel ? "==" : "!=", ["get", "brunnel"], "tunnel"]);
  return ["all", ...teile];
}

function halt(arten: string[]): ExpressionSpecification {
  return ["all", ["==", ["get", "class"], "railway"], ["match", ["get", "subclass"], arten, true, false]];
}

const breite = (...stufen: number[]): ExpressionSpecification => ["interpolate", ["linear"], ["zoom"], ...stufen];

const NAME: ExpressionSpecification = ["coalesce", ["get", "name:de"], ["get", "name"]];

function beschriftung(id: string, arten: string[], minzoom: number, farbe: string, groesse: number): LayerSpecification {
  return {
    id,
    type: "symbol",
    ...QUELLE,
    "source-layer": "poi",
    minzoom,
    filter: halt(arten),
    layout: {
      visibility: "none",
      "text-field": NAME,
      "text-font": ["Noto Sans Bold"],
      "text-size": groesse,
      "text-variable-anchor": ["left", "right", "top", "bottom"],
      "text-radial-offset": 0.75,
      "text-max-width": 8,
    },
    paint: { "text-color": farbe, "text-halo-color": PAPIER, "text-halo-width": 1.6 },
  };
}

function punkt(id: string, arten: string[], minzoom: number, farbe: string, radius: ExpressionSpecification): LayerSpecification {
  return {
    id,
    type: "circle",
    ...QUELLE,
    "source-layer": "poi",
    minzoom,
    filter: halt(arten),
    layout: { visibility: "none" },
    paint: { "circle-radius": radius, "circle-color": PAPIER, "circle-stroke-color": farbe, "circle-stroke-width": 1.6 },
  };
}

/** Strecken: kommen unter die Beschriftungen der Grundkarte. */
export const OEPNV_LINIEN: LayerSpecification[] = [
  {
    id: "oepnv-bahn-rand",
    type: "line",
    ...QUELLE,
    "source-layer": "transportation",
    minzoom: 6,
    filter: strecke("rail", ["rail", "narrow_gauge"], false),
    layout: { visibility: "none", "line-cap": "round" },
    paint: { "line-color": PAPIER, "line-width": breite(6, 2.4, 10, 3.6, 15, 6) },
  },
  {
    id: "oepnv-bahn-tunnel",
    type: "line",
    ...QUELLE,
    "source-layer": "transportation",
    minzoom: 6,
    filter: strecke("rail", ["rail", "narrow_gauge"], true),
    layout: { visibility: "none" },
    paint: { "line-color": TINTE, "line-opacity": 0.55, "line-width": breite(6, 0.8, 15, 2), "line-dasharray": [2, 1.5] },
  },
  {
    id: "oepnv-bahn",
    type: "line",
    ...QUELLE,
    "source-layer": "transportation",
    minzoom: 6,
    filter: strecke("rail", ["rail", "narrow_gauge"], false),
    layout: { visibility: "none", "line-cap": "round" },
    paint: { "line-color": TINTE, "line-width": breite(6, 0.9, 10, 1.5, 15, 3) },
  },
  {
    id: "oepnv-ubahn",
    type: "line",
    ...QUELLE,
    "source-layer": "transportation",
    minzoom: 14,
    filter: strecke("transit", ["subway", "light_rail", "monorail"]),
    layout: { visibility: "none", "line-cap": "round" },
    paint: { "line-color": UBAHN, "line-width": breite(14, 2, 17, 4) },
  },
  {
    id: "oepnv-tram",
    type: "line",
    ...QUELLE,
    "source-layer": "transportation",
    minzoom: 15,
    filter: strecke("transit", ["tram"]),
    layout: { visibility: "none", "line-cap": "round" },
    paint: { "line-color": TRAM, "line-width": breite(15, 1.4, 18, 2.8) },
  },
];

/** Halte und Namen: kommen ganz nach oben. */
export const OEPNV_HALTE: LayerSpecification[] = [
  punkt("oepnv-bahnhof", ["station", "halt"], 10, TINTE, breite(10, 2.5, 15, 5)),
  punkt("oepnv-ubahnhof", ["subway"], 14, UBAHN, breite(14, 3, 17, 5)),
  punkt("oepnv-tramhalt", ["tram_stop"], 15, TRAM, breite(15, 2.5, 18, 4)),
  beschriftung("oepnv-bahnhof-name", ["station", "halt"], 12, TINTE, 12),
  beschriftung("oepnv-ubahnhof-name", ["subway"], 14.5, UBAHN, 11.5),
  beschriftung("oepnv-tramhalt-name", ["tram_stop"], 16, TRAM, 11),
];

export const OEPNV_IDS = [...OEPNV_LINIEN, ...OEPNV_HALTE].map((l) => l.id);

export const OEPNV_FARBEN = { bahn: TINTE, ubahn: UBAHN, tram: TRAM };
