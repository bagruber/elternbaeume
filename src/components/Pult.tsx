import { useState } from "react";
import { MONAT_KURZ, MONATE, TAGE_STUFEN } from "@/lib/texte";

interface Props {
  monat: number;
  heute: number;
  tage: number;
  /** Am Handy bei offenem Blatt: eine Zeile, damit Karte und Blatt Platz haben */
  kompakt: boolean;
  imAusschnitt: { gesamt: number; klon: number; samen: number; ohneDaten: number };
  onMonat: (m: number) => void;
  onTage: (t: number) => void;
  onZeichen: () => void;
}

function Feld({ farbe }: { farbe: string }) {
  return <span className="inline-block h-2.5 w-2.5 rounded-[1px] align-[-1px]" style={{ background: farbe }} />;
}

export function Pult({ monat, heute, tage, kompakt, imAusschnitt, onMonat, onTage, onZeichen }: Props) {
  const [auf, setAuf] = useState(false);
  const stufe = Math.max(0, TAGE_STUFEN.indexOf(tage));
  const nichts = imAusschnitt.gesamt - imAusschnitt.klon - imAusschnitt.samen - imAusschnitt.ohneDaten;

  if (kompakt && !auf) {
    return (
      <section
        aria-label="Monat und Reisetage"
        className="flex items-center justify-between border-t border-linie bg-flaeche px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]"
      >
        <p className="text-[15px]">
          <span className="font-bold">{MONATE[monat - 1]}</span>
          <span className="text-tinte-weich"> · </span>
          <span className="font-bold">{tage === 30 ? "30+" : tage}</span>{" "}
          <span className="text-tinte-weich">{tage === 1 ? "Tag" : "Tage"} bis zuhause</span>
        </p>
        <button
          type="button"
          onClick={() => setAuf(true)}
          className="border border-linie-stark px-2.5 py-1.5 text-[13px] font-semibold hover:bg-papier"
        >
          Ändern
        </button>
      </section>
    );
  }

  return (
    <section
      aria-label="Monat und Reisetage"
      className="border-t border-linie bg-flaeche px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:border lg:shadow-[0_2px_10px_rgb(29_31_28/0.12)]"
    >
      <fieldset>
        <legend className="sr-only">Monat</legend>
        <div className="grid grid-cols-12 gap-[3px]">
          {MONAT_KURZ.map((k, i) => {
            const m = i + 1;
            const an = m === monat;
            return (
              <button
                key={m}
                type="button"
                onClick={() => onMonat(m)}
                aria-pressed={an}
                aria-label={MONATE[i] + (m === heute ? ", aktueller Monat" : "")}
                className={`relative h-10 text-[15px] font-semibold transition-colors duration-150 ${
                  an ? "bg-tinte text-flaeche" : "bg-papier text-tinte-weich hover:bg-linie/60"
                }`}
              >
                {k}
                {m === heute && (
                  <span
                    className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                      an ? "bg-flaeche" : "bg-tinte"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-3">
        <div className="flex items-baseline justify-between">
          <label htmlFor="tage" className="text-[14px] font-semibold text-tinte-weich">
            Tage bis zuhause
          </label>
          <output htmlFor="tage" className="text-[22px] leading-none font-bold">
            {tage === 30 ? "30+" : tage}
            <span className="ml-1 text-[14px] font-semibold text-tinte-weich">{tage === 1 ? "Tag" : "Tage"}</span>
          </output>
        </div>
        <input
          id="tage"
          type="range"
          className="lineal mt-1"
          min={0}
          max={TAGE_STUFEN.length - 1}
          step={1}
          value={stufe}
          onChange={(e) => onTage(TAGE_STUFEN[Number(e.target.value)])}
          aria-valuetext={`${tage} ${tage === 1 ? "Tag" : "Tage"}`}
        />
        <div className="-mt-1 grid text-[11px] text-tinte-weich" style={{ gridTemplateColumns: `repeat(${TAGE_STUFEN.length}, 1fr)` }} aria-hidden="true">
          {TAGE_STUFEN.map((t, i) => (
            <span
              key={t}
              className={`${i === 0 ? "text-left" : i === TAGE_STUFEN.length - 1 ? "text-right" : "text-center"} ${t === tage ? "font-bold text-tinte" : ""}`}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-linie pt-2.5 text-[13px]">
        <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-tinte-weich" aria-live="polite">
          <span>
            <span className="font-semibold text-tinte">{imAusschnitt.gesamt}</span> im Ausschnitt
          </span>
          <span className="flex items-center gap-1" aria-label={`${imAusschnitt.klon} Klon`}>
            <Feld farbe="var(--color-klon)" /> {imAusschnitt.klon}
          </span>
          <span className="flex items-center gap-1" aria-label={`${imAusschnitt.samen} nur Samen`}>
            <Feld farbe="var(--color-samen)" /> {imAusschnitt.samen}
          </span>
          <span className="flex items-center gap-1" aria-label={`${nichts} nichts`}>
            <Feld farbe="var(--color-leer)" /> {nichts}
          </span>
          {imAusschnitt.ohneDaten > 0 && (
            <span className="flex items-center gap-1" aria-label={`${imAusschnitt.ohneDaten} ohne Vermehrungsdaten`}>
              <span className="inline-block h-2.5 w-2.5 rounded-full border border-dashed border-linie-stark" /> {imAusschnitt.ohneDaten}
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={onZeichen}
          className="shrink-0 border border-linie-stark px-2.5 py-1.5 text-[13px] font-semibold hover:bg-papier"
        >
          Zeichen
        </button>
      </div>
    </section>
  );
}
