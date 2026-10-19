import type { ReactNode } from "react";
import { X } from "@phosphor-icons/react";
import type { Baum } from "@/lib/daten";
import type { Stufe, Zustand } from "@/lib/auswahl";
import { zeichenSvg } from "@/lib/zeichen";

export interface ListenBaum {
  baum: Baum;
  jahr: Zustand[] | null;
  stufe: Stufe | null;
}

interface Props {
  titel: string;
  eintraege: ListenBaum[];
  monat: number;
  leer?: string;
  kopf?: ReactNode;
  onWaehlen: (id: string) => void;
  onSchliessen: () => void;
}

/** Baeume einer Region oder eines Sammelpunkts, nach Art sortiert, wie die
 *  Rekordlisten von Monumental Trees. */
export function Liste({ titel, eintraege, monat, leer, kopf, onWaehlen, onSchliessen }: Props) {
  const sortiert = [...eintraege].sort(
    (a, b) => (a.baum.artName || a.baum.wiss).localeCompare(b.baum.artName || b.baum.wiss, "de"),
  );
  return (
    <div className="flex max-h-full min-h-0 flex-col border border-linie bg-flaeche shadow-[0_2px_10px_rgb(29_31_28/0.12)]">
      <div className="flex items-start justify-between px-4 pt-3.5">
        <h2 className="text-[16px] font-bold">{titel}</h2>
        <button type="button" onClick={onSchliessen} aria-label="Liste schließen" className="-m-1 p-1">
          <X size={18} weight="bold" />
        </button>
      </div>
      {kopf && <div className="px-4 pt-2.5">{kopf}</div>}
      <div className="blatt-scroll mt-2 min-h-0 overflow-y-auto border-t border-linie">
        {sortiert.length === 0 && leer && <p className="px-4 py-4 text-[14px] text-tinte-weich">{leer}</p>}
        <ul>
          {sortiert.map(({ baum, jahr, stufe }) => (
            <li key={baum.id} className="border-b border-linie last:border-b-0">
              <button
                type="button"
                onClick={() => onWaehlen(baum.id)}
                className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-papier"
              >
                <span className="shrink-0" aria-hidden="true" dangerouslySetInnerHTML={{ __html: zeichenSvg(jahr, monat, stufe, 30) }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold">{baum.name}</span>
                  <span className="block truncate text-[12px] text-tinte-weich">
                    {baum.artName || <i>{baum.wiss}</i>}
                    {baum.lageUngefaehr ? " · Lage ungefähr" : ""}
                  </span>
                </span>
                {baum.alterJahre && (
                  <span className="shrink-0 text-[13px] font-semibold">
                    ~{baum.alterJahre.toLocaleString("de-DE")} J.
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
