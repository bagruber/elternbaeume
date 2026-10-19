import type { LayerSpecification, StyleSpecification } from "maplibre-gl";

/**
 * Grundkarte: OpenFreeMap Positron, ohne API-Schluessel und damit auf GitHub
 * Pages lauffaehig. Zurueckgenommen auf Papier und Grau, damit nur die
 * Jahresringe Farbe tragen, dazu deutsche Ortsnamen und eine entsaettigte
 * Reliefschummerung fuer die kleinen Massstaebe, in denen Europa zu sehen ist.
 */
const STIL_URL = "https://tiles.openfreemap.org/styles/positron";

const PAPIER = "#fafaf8";

const FARBEN: Record<string, Partial<Record<string, string>>> = {
  background: { "background-color": PAPIER },
  water: { "fill-color": "#dfe6e9" },
  waterway: { "line-color": "#cbd7dc" },
  park: { "fill-color": "#eef0e7" },
  landcover_wood: { "fill-color": "#eceee4" },
  landuse_residential: { "fill-color": "#f1f1ed" },
  building: { "fill-color": "#e7e7e2" },
  boundary_2: { "line-color": "#b4b6ae" },
  boundary_3: { "line-color": "#cfd0c9" },
};

const RELIEF: LayerSpecification = {
  id: "relief",
  type: "raster",
  source: "ne2_shaded",
  maxzoom: 9,
  paint: {
    "raster-saturation": -1,
    "raster-contrast": 0.1,
    "raster-opacity": ["interpolate", ["linear"], ["zoom"], 3, 0.32, 8, 0],
  },
};

export const LEERER_STIL: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": PAPIER } }],
};

export async function ladeGrundkarte(): Promise<StyleSpecification> {
  const stil = (await (await fetch(STIL_URL)).json()) as StyleSpecification;
  const layers: LayerSpecification[] = [];
  for (const layer of stil.layers) {
    const farben = FARBEN[layer.id];
    if (farben && "paint" in layer) layer.paint = { ...layer.paint, ...farben } as never;
    if (layer.type === "symbol") {
      const sl = (layer as { "source-layer"?: string })["source-layer"];
      if (sl === "place" || sl === "water_name") {
        layer.layout = { ...layer.layout, "text-field": ["coalesce", ["get", "name:de"], ["get", "name"]] };
      }
      layer.paint = {
        ...layer.paint,
        "text-color": "#6c6f67",
        "text-halo-color": PAPIER,
        "text-halo-width": 1.4,
      };
    }
    layers.push(layer);
    if (layer.id === "background") layers.push(RELIEF);
  }
  return { ...stil, layers };
}
