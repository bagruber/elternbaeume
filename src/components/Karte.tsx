import { useEffect, useRef, useState } from "react";
import maplibregl, { type GeoJSONSource, type PaddingOptions, type StyleSpecification } from "maplibre-gl";
import { LEERER_STIL, ladeGrundkarte } from "@/lib/grundkarte";
import { ringSvg, sammelSvg } from "@/lib/zeichen";
import type { Stufe, Zustand } from "@/lib/auswahl";

export interface KartenBaum {
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** Zustand je Monat bei den eingestellten Reisetagen */
  jahr: Zustand[];
  stufe: Stufe;
}

interface Props {
  baeume: KartenBaum[];
  monat: number;
  gewaehlt: string | null;
  /** Was Blatt und Pult auf grossen Bildschirmen von der Karte verdecken */
  verdeckt: Partial<PaddingOptions>;
  onWaehlen: (id: string | null) => void;
  onAusschnitt: (ids: string[]) => void;
}

const ZUSTAND_TEXT: Record<Zustand, string> = {
  klon: "Klon möglich",
  samen: "nur Samen möglich",
  nichts: "im gewählten Monat nichts möglich",
};

interface Eintrag {
  marker: maplibregl.Marker;
  el: HTMLButtonElement;
  signatur: string;
}

function geo(baeume: KartenBaum[], monat: number, ohne: string | null) {
  return {
    type: "FeatureCollection" as const,
    features: baeume
      .filter((b) => b.id !== ohne)
      .map((b) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [b.lon, b.lat] },
        properties: { id: b.id, z: b.jahr[monat - 1] },
      })),
  };
}

function grenzen(baeume: KartenBaum[]): maplibregl.LngLatBoundsLike {
  const b = new maplibregl.LngLatBounds();
  for (const x of baeume) b.extend([x.lon, x.lat]);
  return b;
}

export function Karte({ baeume, monat, gewaehlt, verdeckt, onWaehlen, onAusschnitt }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const karte = useRef<maplibregl.Map | null>(null);
  const eintraege = useRef(new Map<string, Eintrag>());
  const [bereit, setBereit] = useState(false);

  // Die Karten-Callbacks lesen immer den neuesten Stand, ohne die Karte neu
  // aufzubauen, wenn sich Monat oder Auswahl aendern.
  const stand = useRef({ baeume, monat, gewaehlt, onWaehlen, onAusschnitt });
  stand.current = { baeume, monat, gewaehlt, onWaehlen, onAusschnitt };

  useEffect(() => {
    let abgebrochen = false;
    let map: maplibregl.Map | undefined;

    function meldeAusschnitt() {
      if (!map) return;
      const g = map.getBounds();
      stand.current.onAusschnitt(
        stand.current.baeume.filter((b) => g.contains([b.lon, b.lat])).map((b) => b.id),
      );
    }

    function zeichne() {
      if (!map || !map.getSource("baeume") || !map.isSourceLoaded("baeume")) return;
      const { baeume, monat, gewaehlt } = stand.current;
      const nachId = new Map(baeume.map((b) => [b.id, b]));
      const gesehen = new Set<string>();

      const setze = (schluessel: string, lngLat: [number, number], signatur: string, fuelle: (el: HTMLButtonElement) => void, klick: () => void) => {
        gesehen.add(schluessel);
        let e = eintraege.current.get(schluessel);
        if (!e) {
          const el = document.createElement("button");
          el.type = "button";
          el.className = "zeichen";
          el.addEventListener("click", (ev) => {
            ev.stopPropagation();
            klick();
          });
          e = { marker: new maplibregl.Marker({ element: el }).setLngLat(lngLat).addTo(map!), el, signatur: "" };
          eintraege.current.set(schluessel, e);
        }
        if (e.signatur !== signatur) {
          fuelle(e.el);
          e.signatur = signatur;
        }
      };

      const baumZeichen = (b: KartenBaum) => {
        const z = b.jahr[monat - 1];
        setze(
          b.id,
          [b.lon, b.lat],
          `${b.jahr.join()}|${monat}|${b.stufe}|${gewaehlt === b.id}`,
          (el) => {
            el.innerHTML = ringSvg(b.jahr, monat, b.stufe);
            el.classList.toggle("still", z === "nichts");
            el.classList.toggle("gewaehlt", gewaehlt === b.id);
            el.setAttribute("aria-label", `${b.name}: ${ZUSTAND_TEXT[z]}`);
          },
          () => stand.current.onWaehlen(b.id),
        );
      };

      for (const f of map.querySourceFeatures("baeume")) {
        const p = f.properties as Record<string, unknown>;
        const lngLat = (f.geometry as { coordinates: number[] }).coordinates as [number, number];
        if (p.cluster) {
          const id = p.cluster_id as number;
          const anzahl = p.point_count as number;
          const klon = p.klon as number;
          const samen = p.samen as number;
          setze(
            `sammel-${id}`,
            lngLat,
            `${anzahl}|${klon}|${samen}`,
            (el) => {
              el.innerHTML = sammelSvg(anzahl, klon, samen);
              el.setAttribute("aria-label", `${anzahl} Bäume, antippen zum Vergrößern`);
            },
            () => {
              (map!.getSource("baeume") as GeoJSONSource)
                .getClusterExpansionZoom(id)
                .then((zoom) => map!.easeTo({ center: lngLat, zoom: zoom + 0.5 }));
            },
          );
        } else {
          const b = nachId.get(p.id as string);
          if (b && !gesehen.has(b.id)) baumZeichen(b);
        }
      }

      // Der gewaehlte Baum sitzt ausserhalb der Clusterquelle und bleibt so
      // auch dann einzeln sichtbar, wenn seine Nachbarn zusammenfallen.
      const g = gewaehlt ? nachId.get(gewaehlt) : undefined;
      if (g) baumZeichen(g);

      for (const [schluessel, e] of eintraege.current) {
        if (!gesehen.has(schluessel)) {
          e.marker.remove();
          eintraege.current.delete(schluessel);
        }
      }
    }

    // Die Karte startet auf leerem Papier, damit die Zeichen sofort stehen.
    // Die Grundkarte kommt nach, sobald sie geladen ist: Unterwegs bei
    // schlechtem Netz waeren sonst bis zur letzten Kachel keine Baeume zu sehen.
    map = new maplibregl.Map({
      container: box.current!,
      style: LEERER_STIL,
      bounds: grenzen(stand.current.baeume),
      fitBoundsOptions: { padding: 48 },
      attributionControl: { compact: true, customAttribution: "Relief: Natural Earth" },
      dragRotate: false,
      pitchWithRotate: false,
    });
    map.touchZoomRotate.disableRotation();
    karte.current = map;
    // Die kompakte Attribution startet aufgeklappt und verdeckt am Handy die
    // halbe Karte. Zugeklappt bleibt sie ueber das i erreichbar.
    map.once("load", () => {
      const attrib = map!.getContainer().querySelector(".maplibregl-ctrl-attrib");
      attrib?.classList.remove("maplibregl-compact-show");
      attrib?.removeAttribute("open");
    });

    // Feuert beim Start und nach dem Wechsel auf die Grundkarte, die alle
    // Quellen ersetzt. Die Marker selbst sind HTML und bleiben stehen.
    map.on("style.load", () => {
      if (map!.getSource("baeume")) return;
      const { baeume, monat, gewaehlt } = stand.current;
      map!.addSource("baeume", {
        type: "geojson",
        data: geo(baeume, monat, gewaehlt),
        cluster: true,
        clusterRadius: 30,
        clusterMaxZoom: 17,
        clusterProperties: {
          klon: ["+", ["case", ["==", ["get", "z"], "klon"], 1, 0]],
          samen: ["+", ["case", ["==", ["get", "z"], "samen"], 1, 0]],
        },
      });
      // Unsichtbar: Die Quelle laedt nur, wenn eine Ebene sie benutzt.
      map!.addLayer({
        id: "baeume-anker",
        type: "circle",
        source: "baeume",
        paint: { "circle-radius": 1, "circle-opacity": 0 },
      });
      setBereit(true);
      meldeAusschnitt();
    });
    map.on("render", zeichne);
    map.on("moveend", meldeAusschnitt);
    map.on("click", () => stand.current.onWaehlen(null));

    // Ohne Grundkarte bleibt es beim Papier, die Baeume stehen trotzdem.
    ladeGrundkarte().then(
      (stil: StyleSpecification) => {
        if (!abgebrochen) map!.setStyle(stil, { diff: false });
      },
      () => {},
    );

    const ro = new ResizeObserver(() => karte.current?.resize());
    if (box.current) ro.observe(box.current);

    return () => {
      abgebrochen = true;
      ro.disconnect();
      map?.remove();
      karte.current = null;
      eintraege.current.clear();
    };
  }, []);

  // Neue Zustaende in die Clusterquelle; das loest ein Neuzeichnen aus.
  useEffect(() => {
    const src = karte.current?.getSource("baeume") as GeoJSONSource | undefined;
    src?.setData(geo(baeume, monat, gewaehlt));
    karte.current?.triggerRepaint();
  }, [bereit, baeume, monat, gewaehlt]);

  useEffect(() => {
    const map = karte.current;
    if (!map || !bereit || !gewaehlt) return;
    const b = baeume.find((x) => x.id === gewaehlt);
    if (!b) return;
    map.easeTo({
      center: [b.lon, b.lat],
      zoom: Math.max(map.getZoom(), 12),
      padding: { top: 0, bottom: 0, left: 0, right: 0, ...verdeckt },
      duration: 600,
    });
    // Nur beim Wechsel der Auswahl fliegen, nicht bei jedem neuen Zustand
  }, [gewaehlt, bereit]);

  // Eigene Huelle: MapLibre setzt auf den Container position: relative, und
  // das unlayered Stylesheet schlaegt die Tailwind-Klasse absolute.
  return (
    <div className={`absolute inset-0 ${gewaehlt ? "auswahl-aktiv" : ""}`} role="region" aria-label="Karte der Elternbäume">
      <div ref={box} className="h-full w-full" />
    </div>
  );
}
