import { useCallback, useEffect, useMemo, useState } from "react";
import { Karte, type KartenBaum } from "./components/Karte";
import { Pult } from "./components/Pult";
import { Blatt } from "./components/Blatt";
import { Zeichenerklaerung } from "./components/Zeichenerklaerung";
import { ARTEN, BAEUME } from "./lib/daten";
import { moosburgStufe, zustand } from "./lib/auswahl";

const HEUTE = new Date().getMonth() + 1;

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
  const [zeichenOffen, setZeichenOffen] = useState(false);
  const gross = useGross();

  // Fuer jeden Baum das ganze Jahr bei den eingestellten Reisetagen
  const kartenBaeume = useMemo<KartenBaum[]>(
    () =>
      BAEUME.map((b) => ({
        id: b.id,
        name: b.name,
        lat: b.lat,
        lon: b.lon,
        jahr: Array.from({ length: 12 }, (_, i) => zustand(b, i + 1, tage)),
        stufe: moosburgStufe(ARTEN[b.art].zone),
      })),
    [tage],
  );

  const imAusschnitt = useMemo(() => {
    const drin = new Set(ausschnitt);
    const z = kartenBaeume.filter((b) => drin.has(b.id)).map((b) => b.jahr[monat - 1]);
    return {
      gesamt: z.length,
      klon: z.filter((x) => x === "klon").length,
      samen: z.filter((x) => x === "samen").length,
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

  const baum = gewaehlt ? BAEUME.find((b) => b.id === gewaehlt) : undefined;
  const jahr = kartenBaeume.find((b) => b.id === gewaehlt)?.jahr;

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <div className="relative min-h-0 flex-1">
        <Karte
          baeume={kartenBaeume}
          monat={monat}
          gewaehlt={gewaehlt}
          verdeckt={gross ? { right: 460, left: 0 } : {}}
          onWaehlen={waehle}
          onAusschnitt={setAusschnitt}
        />

        <header className="pointer-events-none absolute top-3 left-3 lg:top-4 lg:left-4">
          <h1 className="pointer-events-auto bg-flaeche/95 px-3 py-1.5 text-[17px] font-bold shadow-[0_1px_4px_rgb(29_31_28/0.18)]">
            Elternbäume
          </h1>
        </header>

        {zeichenOffen && (
          <div className="absolute inset-x-3 bottom-3 z-10 lg:top-16 lg:right-auto lg:bottom-auto lg:left-4 lg:w-[380px]">
            <Zeichenerklaerung monat={monat} onSchliessen={() => setZeichenOffen(false)} />
          </div>
        )}
      </div>

      {baum && jahr && (
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
          onZeichen={() => setZeichenOffen((x) => !x)}
        />
      </div>
    </div>
  );
}
