import { X } from "@phosphor-icons/react";
import { grauSvg, mitte, ringSvg } from "@/lib/zeichen";
import type { Zustand } from "@/lib/auswahl";
import { OEPNV_FARBEN } from "@/lib/oepnv";

// Ein Beispielbaum fuer die Erklaerung: im Fruehsommer Klon, im Herbst Samen.
const BEISPIEL: Zustand[] = [
  "nichts", "nichts", "nichts", "nichts", "klon", "klon",
  "klon", "klon", "samen", "samen", "nichts", "nichts",
];

function Punkt({ stufe }: { stufe: "ja" | "schutz" | "nein" }) {
  return (
    <svg width="18" height="18" viewBox="13 13 14 14" aria-hidden="true" dangerouslySetInnerHTML={{ __html: mitte(stufe, 5) }} />
  );
}

export function Zeichenerklaerung({ monat, onSchliessen }: { monat: number; onSchliessen: () => void }) {
  return (
    <div className="border border-linie bg-flaeche p-4 shadow-[0_2px_10px_rgb(29_31_28/0.12)]">
      <div className="flex items-start justify-between">
        <h2 className="text-[16px] font-bold">So liest man ein Zeichen</h2>
        <button type="button" onClick={onSchliessen} aria-label="Erklärung schließen" className="-m-1 p-1">
          <X size={18} weight="bold" />
        </button>
      </div>

      <div className="mt-3 flex gap-4">
        <span
          className="shrink-0"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: ringSvg(BEISPIEL, monat, "schutz", 84) }}
        />
        <ul className="space-y-1.5 text-[13px] leading-snug">
          <li>Zwölf Segmente sind die Monate, Januar oben, im Uhrzeigersinn.</li>
          <li>Der gewählte Monat steht nach außen vor.</li>
          <li>Gerechnet ist mit den eingestellten Tagen bis zuhause.</li>
        </ul>
      </div>

      <dl className="mt-3 grid grid-cols-[auto_1fr] items-center gap-x-2.5 gap-y-1.5 border-t border-linie pt-3 text-[13px]">
        <dt className="h-3 w-5" style={{ background: "var(--color-klon)" }} />
        <dd>Ein Klon geht: Steckling, Steckholz, Schössling</dd>
        <dt className="h-3 w-5" style={{ background: "var(--color-samen)" }} />
        <dd>Nur Samen gehen, das gibt Nachkommen</dd>
        <dt className="h-3 w-5" style={{ background: "var(--color-leer)" }} />
        <dd>Nichts, oder das Material hält die Reise nicht durch</dd>
        <dt><Punkt stufe="ja" /></dt>
        <dd>In Moosburg winterhart</dd>
        <dt><Punkt stufe="schutz" /></dt>
        <dd>Nur mit Winterschutz</dd>
        <dt><Punkt stufe="nein" /></dt>
        <dd>Nicht winterhart, nur im Kübel</dd>
        <dt>
          <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: grauSvg(20) }} />
        </dt>
        <dd>Art noch ohne Vermehrungsdaten</dd>
      </dl>

      <h3 className="mt-3 border-t border-linie pt-3 text-[13px] font-bold">ÖPNV, wenn eingeschaltet</h3>
      <dl className="mt-1.5 grid grid-cols-[auto_1fr] items-center gap-x-2.5 gap-y-1.5 text-[13px]">
        <dt className="h-[3px] w-5" style={{ background: OEPNV_FARBEN.bahn }} />
        <dd>Bahn und S-Bahn, Tunnel gestrichelt</dd>
        <dt className="h-[3px] w-5" style={{ background: OEPNV_FARBEN.ubahn }} />
        <dd>U-Bahn und Stadtbahn, wenn man näher kommt</dd>
        <dt className="h-[2px] w-5" style={{ background: OEPNV_FARBEN.tram }} />
        <dd>Tram, erst ganz nah. Busse nicht.</dd>
      </dl>
    </div>
  );
}
