import { useCallback, useEffect, useMemo, useState } from "react";
import { Karte, type KartenBaum } from "./components/Karte";
import { Pult } from "./components/Pult";
import { Blatt } from "./components/Blatt";
import { Liste, type ListenBaum } from "./components/Liste";
import { Zeichenerklaerung } from "./components/Zeichenerklaerung";
import { ARTEN, BAEUME, REGIONEN } from "./lib/daten";
import { moosburgStufe, zustand } from "./lib/auswahl";

const HEUTE = new Date().getMonth() + 1;

type Ueberlagerung =
  | { art: "zeichen" }
  | { art: "regionen"; region: string | null }
  | { art: "sammlung"; ids: string[] };

// Die OePNV-Ebene bleibt beim naechsten Besuch so, wie sie war. Ohne
// Browser-Speicher (privates Fenster) startet sie einfach aus.
const OEPNV_SCHLUESSEL = "elternbaeume.oepnv";
function oepnvGespeichert(): boolean {
  try {
    return localStorage.getItem(OEPNV_SCHLUESSEL) === "an";
  } catch {
    return false;
  }
}

function ausAdresse(): string | null {
  const id = decodeURIComponent(location.hash.slice(1));
  return BAEUME.some((b) => b.id === id) ? id : null;
}

function useGross() {
  const abfrage = "(min-width: 1024px)";
  const [gross, setGross] = useState(() => matchMedia(abfrage).matches);
  useEffect(() => {
    const mq = matchMedia(abfrage);
    const f = () => setGross(mq.matches);
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);
  return gross;
}

export default function App() {
  const [monat, setMonat] = useState(HEUTE);
  const [tage, setTage] = useState(3);
  const [gewaehlt, setGewaehlt] = useState<string | null>(ausAdresse);
  const [ausschnitt, setAusschnitt] = useState<string[]>([]);
  const [oben, setOben] = useState<Ueberlagerung | null>(null);
  const [fokus, setFokus] = useState<{ lat: number; lon: number; zoom: number; n: number } | null>(null);
  const [oepnv, setOepnv] = useState(oepnvGespeichert);
  const gross = useGross();

  // Fuer jeden Baum das ganze Jahr bei den eingestellten Reisetagen. Ohne
  // Vermehrungsdaten zur Art bleibt der Baum grau.
  const kartenBaeume = useMemo<KartenBaum[]>(
    () =>
      BAEUME.map((b) => ({
        id: b.id,
        name: b.name,
        lat: b.lat,
        lon: b.lon,
        jahr: b.art ? Array.from({ length: 12 }, (_, i) => zustand(b, i + 1, tage)) : null,
        stufe: b.art ? moosburgStufe(ARTEN[b.art].zone) : null,
      })),
    [tage],
  );
  const nachId = useMemo(() => new Map(kartenBaeume.map((k) => [k.id, k])), [kartenBaeume]);

  const imAusschnitt = useMemo(() => {
    const drin = new Set(ausschnitt);
    const z = kartenBaeume.filter((b) => drin.has(b.id)).map((b) => (b.jahr ? b.jahr[monat - 1] : null));
    return {
      gesamt: z.length,
      klon: z.filter((x) => x === "klon").length,
      samen: z.filter((x) => x === "samen").length,
      ohneDaten: z.filter((x) => x === null).length,
    };
  }, [ausschnitt, kartenBaeume, monat]);

  const waehle = useCallback((id: string | null) => {
    setGewaehlt(id);
    history.replaceState(null, "", id ? `#${id}` : location.pathname + location.search);
  }, []);

  useEffect(() => {
    const f = () => setGewaehlt(ausAdresse());
    addEventListener("hashchange", f);
    return () => removeEventListener("hashchange", f);
  }, []);

  function schalteOepnv() {
    setOepnv((an) => {
      try {
        localStorage.setItem(OEPNV_SCHLUESSEL, an ? "aus" : "an");
      } catch {
        // ohne Speicher gilt die Einstellung nur bis zum Neuladen
      }
      return !an;
    });
  }

  const zeigeSammlung = useCallback((ids: string[]) => setOben({ art: "sammlung", ids }), []);

  const listenBaum = (id: string): ListenBaum => {
    const k = nachId.get(id)!;
    return { baum: BAEUME.find((b) => b.id === id)!, jahr: k.jahr, stufe: k.stufe };
  };

  function waehleRegion(id: string) {
    const r = REGIONEN.find((x) => x.id === id)!;
    setOben({ art: "regionen", region: id });
    setFokus((f) => ({ lat: r.lat, lon: r.lon, zoom: r.zoom, n: (f?.n ?? 0) + 1 }));
  }

  const baum = gewaehlt ? BAEUME.find((b) => b.id === gewaehlt) : undefined;
  const jahr = gewaehlt ? (nachId.get(gewaehlt)?.jahr ?? null) : null;
  const region = oben?.art === "regionen" && oben.region ? REGIONEN.find((r) => r.id === oben.region) : undefined;

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <div className="relative min-h-0 flex-1">
        <Karte
          baeume={kartenBaeume}
          monat={monat}
          gewaehlt={gewaehlt}
          verdeckt={gross ? { right: 460, left: 0 } : {}}
          fokus={fokus}
          oepnv={oepnv}
          onWaehlen={waehle}
          onAusschnitt={setAusschnitt}
          onSammlung={zeigeSammlung}
        />

        <header className="pointer-events-none absolute top-3 left-3 flex items-stretch gap-1.5 lg:top-4 lg:left-4">
          <h1 className="pointer-events-auto bg-flaeche/95 px-3 py-1.5 text-[17px] font-bold shadow-[0_1px_4px_rgb(29_31_28/0.18)]">
            Elternbäume
          </h1>
          <button
            type="button"
            onClick={() => setOben((o) => (o?.art === "regionen" ? null : { art: "regionen", region: null }))}
            aria-expanded={oben?.art === "regionen"}
            className="pointer-events-auto bg-flaeche/95 px-3 text-[14px] font-semibold shadow-[0_1px_4px_rgb(29_31_28/0.18)] hover:bg-papier"
          >
            Regionen
          </button>
          <button
            type="button"
            onClick={schalteOepnv}
            aria-pressed={oepnv}
            title="Bahn, U-Bahn und Tram einblenden"
            className={`pointer-events-auto px-3 text-[14px] font-semibold shadow-[0_1px_4px_rgb(29_31_28/0.18)] ${
              oepnv ? "bg-tinte text-flaeche" : "bg-flaeche/95 hover:bg-papier"
            }`}
          >
            ÖPNV
          </button>
        </header>

        {oben && (
          // Zwischen Kopf und Pult: am Handy waechst die Liste von unten bis
          // unter den Kopf, am Desktop von oben bis ueber das Pult.
          <div className="pointer-events-none absolute inset-x-3 top-16 bottom-3 z-10 flex flex-col justify-end lg:right-auto lg:bottom-[15.5rem] lg:left-4 lg:w-[380px] lg:justify-start [&>*]:pointer-events-auto">
            {oben.art === "zeichen" && <Zeichenerklaerung monat={monat} onSchliessen={() => setOben(null)} />}
            {oben.art === "sammlung" && (
              <Liste
                titel={`${oben.ids.length} Bäume an diesem Ort`}
                eintraege={oben.ids.filter((id) => nachId.has(id)).map(listenBaum)}
                monat={monat}
                onWaehlen={(id) => {
                  waehle(id);
                  setOben(null);
                }}
                onSchliessen={() => setOben(null)}
              />
            )}
            {oben.art === "regionen" && (
              <Liste
                titel={region ? `${region.name}` : "Regionen"}
                eintraege={region ? BAEUME.filter((b) => b.regionen.includes(region.id)).map((b) => listenBaum(b.id)) : []}
                monat={monat}
                leer={
                  region
                    ? "Hier steht noch kein Baum. Die Europa-Liste von Monumental Trees hat für diese Gegend keinen Eintrag."
                    : "Region wählen, die Karte fliegt hin."
                }
                kopf={
                  <div className="flex flex-wrap gap-1.5" role="group" aria-label="Region">
                    {REGIONEN.map((r) => {
                      const n = BAEUME.filter((b) => b.regionen.includes(r.id)).length;
                      const an = region?.id === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          aria-pressed={an}
                          onClick={() => waehleRegion(r.id)}
                          className={`border px-2 py-1 text-[13px] font-semibold ${
                            an ? "border-tinte bg-tinte text-flaeche" : "border-linie-stark hover:bg-papier"
                          } ${n === 0 && !an ? "text-tinte-weich" : ""}`}
                        >
                          {r.name} <span className={an ? "" : "text-tinte-weich"}>{n}</span>
                        </button>
                      );
                    })}
                  </div>
                }
                onWaehlen={(id) => {
                  waehle(id);
                  if (!gross) setOben(null);
                }}
                onSchliessen={() => setOben(null)}
              />
            )}
          </div>
        )}
      </div>

      {baum && (
        <div className="max-h-[62dvh] min-h-0 border-t border-linie shadow-[0_-2px_10px_rgb(29_31_28/0.10)] lg:absolute lg:top-4 lg:right-4 lg:bottom-11 lg:max-h-none lg:w-[440px] lg:border lg:shadow-[0_2px_14px_rgb(29_31_28/0.16)]">
          <Blatt baum={baum} jahr={jahr} monat={monat} tage={tage} onSchliessen={() => waehle(null)} />
        </div>
      )}

      <div className="lg:absolute lg:bottom-4 lg:left-4 lg:w-[380px]">
        <Pult
          monat={monat}
          heute={HEUTE}
          tage={tage}
          kompakt={!!baum && !gross}
          imAusschnitt={imAusschnitt}
          onMonat={setMonat}
          onTage={setTage}
          onZeichen={() => setOben((o) => (o?.art === "zeichen" ? null : { art: "zeichen" }))}
        />
      </div>
    </div>
  );
}
