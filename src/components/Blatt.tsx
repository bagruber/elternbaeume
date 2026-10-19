import { ArrowSquareOut, CaretDown, Info, Warning, X } from "@phosphor-icons/react";
import { ARTEN, type Baum } from "@/lib/daten";
import { entfernungKm, moosburgStufe, naechstes, optionen, type Option, type Zustand } from "@/lib/auswahl";
import { grauSvg, mitte, ringSvg } from "@/lib/zeichen";
import {
  ERFOLG_BALKEN,
  GEWISSHEIT_TEXT,
  KATEGORIE_TEXT,
  LAENDER,
  MONAT_KURZ,
  MONATE,
  STUFE_TEXT,
  ausserhalbEU,
} from "@/lib/texte";

interface Props {
  baum: Baum;
  jahr: Zustand[] | null;
  monat: number;
  tage: number;
  onSchliessen: () => void;
}

const SKALA_TAGE = 30;

const RAHMEN_GEWISSHEIT = {
  belegt: "border-solid",
  geschaetzt: "border-dashed",
  ueberliefert: "border-dotted",
  unbekannt: "border-dotted text-tinte-weich",
} as const;

function tageText(t: number) {
  return `${t} ${t === 1 ? "Tag" : "Tage"}`;
}

function Monatsstreifen({ monate, monat, farbe }: { monate: number[]; monat: number; farbe: string }) {
  return (
    <div className="grid grid-cols-12 gap-[2px]" aria-label={`Monate: ${monate.map((m) => MONATE[m - 1]).join(", ")}`} role="img">
      {MONAT_KURZ.map((_, i) => {
        const an = monate.includes(i + 1);
        const jetzt = i + 1 === monat;
        return (
          <span
            key={i}
            className={`h-2.5 ${jetzt ? "outline-2 outline-offset-1 outline-tinte" : ""}`}
            style={{ background: an ? farbe : "var(--color-leer)" }}
          />
        );
      })}
    </div>
  );
}

function Haltbarkeit({ o, tage }: { o: Option; tage: number }) {
  const breite = Math.min(o.methode.tage, SKALA_TAGE) / SKALA_TAGE;
  const marke = Math.min(tage, SKALA_TAGE) / SKALA_TAGE;
  const farbe = o.reicht ? "var(--color-tinte-weich)" : "var(--color-reicht-nicht)";
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-3 flex-1" role="img" aria-label={`hält ${o.methode.haelt}${o.reicht ? "" : `, reicht nicht für ${tageText(tage)}`}`}>
        <span className="absolute inset-x-0 top-1/2 h-px bg-linie" />
        <span className="absolute top-[3px] left-0 h-1.5" style={{ width: `${breite * 100}%`, background: farbe }} />
        {o.methode.tage > SKALA_TAGE && (
          <span className="absolute top-[1px] right-0 h-2.5 w-[2px]" style={{ background: farbe }} />
        )}
        <span className="absolute -top-0.5 h-4 w-[2px] bg-tinte" style={{ left: `calc(${marke * 100}% - 1px)` }} />
      </div>
      <span className={`w-[8.5rem] shrink-0 text-right text-[12px] ${o.reicht ? "text-tinte-weich" : "font-semibold text-reicht-nicht"}`}>
        {o.reicht ? `hält ${o.methode.haelt.split(",")[0]}` : "reicht nicht"}
      </span>
    </div>
  );
}

function Erfolg({ o }: { o: Option }) {
  const n = ERFOLG_BALKEN[o.am.erfolg];
  if (o.am.erfolg === "offen") {
    return (
      <span className="flex items-center gap-1.5 text-[12px]" title="Die Quelle nennt die Methode, aber keinen Erfolg">
        <span className="font-semibold">Erfolg offen</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-[12px]" title={o.am.erfolgBeleg ?? "eigene Einschätzung"}>
      <span className="flex items-end gap-[2px]" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span key={i} className="w-[4px]" style={{ height: 4 + i * 3, background: i <= n ? "var(--color-tinte)" : "var(--color-leer)" }} />
        ))}
      </span>
      <span className="font-semibold">{o.am.erfolg}</span>
      <span className="text-tinte-weich">{o.am.erfolgBeleg ? "PFAF" : "Einschätzung"}</span>
    </span>
  );
}

function Methode({ o, monat, tage }: { o: Option; monat: number; tage: number }) {
  const farbe = o.methode.klon ? "var(--color-klon)" : "var(--color-samen)";
  return (
    <details className={`group border-t border-linie ${o.gesperrt ? "opacity-55" : ""}`}>
      <summary className="cursor-pointer py-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="flex items-baseline gap-2">
            <span className="text-[15px] font-bold">{o.methode.name}</span>
            <span className="text-[12px] font-semibold" style={{ color: farbe }}>
              {o.methode.klon ? "Klon" : "Nachkomme"}
            </span>
          </span>
          <Erfolg o={o} />
        </div>
        <div className="mt-2">
          <Monatsstreifen monate={o.monate} monat={monat} farbe={farbe} />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1">
            <Haltbarkeit o={o} tage={tage} />
          </div>
          <CaretDown size={14} weight="bold" className="shrink-0 text-tinte-weich transition-transform group-open:rotate-180" aria-hidden="true" />
        </div>
        {o.gesperrt && <p className="mt-1.5 text-[13px] font-semibold">{o.gesperrt}</p>}
      </summary>

      <div className="pb-4 text-[14px] leading-relaxed">
        {o.am.hinweis && (
          <p>
            <span className="font-semibold">Bei dieser Art: </span>
            {o.am.hinweis}
          </p>
        )}
        <p className={o.am.hinweis ? "mt-2" : ""}>
          <span className="font-semibold">Unterwegs: </span>
          {o.methode.transport}
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 marker:text-tinte-weich">
          {o.methode.anleitung.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        {o.methode.alterBaum && (
          <p className="mt-2 text-tinte-weich">
            Alte Bäume bewurzeln schlechter. Triebe vom Stammfuß sind jünger und wurzeln besser.
          </p>
        )}
      </div>
    </details>
  );
}

function hinweise(baum: Baum) {
  const art = baum.art ? ARTEN[baum.art] : null;
  const liste: { text: string; warnung?: boolean }[] = [];
  if (baum.schutz?.includes("Botanischer Garten")) {
    liste.push({ text: "Botanischer Garten: Sammeln ist dort meist nicht gestattet. Der übliche Weg ist eine Anfrage bei der Gartenverwaltung." });
  } else if (baum.schutz) {
    liste.push({ text: `${baum.schutz}: Eingriffe am Baum sind in der Regel untersagt. Aufgelesene Samen oder eine Anfrage beim Eigentümer sind der übliche Weg.` });
  }
  if (ausserhalbEU(baum.land)) {
    liste.push({ text: "Außerhalb der EU: Seit 2019 brauchen Pflanzen und Samen aus Nicht-EU-Ländern meist ein Pflanzengesundheitszeugnis, auch im Reisegepäck. Vorher prüfen." });
  }
  if (baum.hinweis) liste.push({ text: baum.hinweis });
  if (art?.hinweis) liste.push({ text: art.hinweis });
  if (art?.boden) liste.push({ text: art.boden });
  if (art?.invasiv) liste.push({ text: `Invasiv: ${art.invasiv}`, warnung: true });
  if (art?.giftig) liste.push({ text: `Giftig: ${art.giftig}`, warnung: true });
  return liste;
}

export function Blatt({ baum, jahr, monat, tage, onSchliessen }: Props) {
  const art = baum.art ? ARTEN[baum.art] : null;
  const stufe = art ? moosburgStufe(art.zone) : null;
  const opts = optionen(baum, monat, tage);
  const beste = opts.find((o) => o.moeglich && o.am.erfolg !== "kaum");
  const spaeter = beste ? null : naechstes(baum, monat, tage);
  const km = Math.round(entfernungKm(baum.lat, baum.lon));

  return (
    <article className="blatt-scroll h-full overflow-y-auto bg-flaeche px-4 pt-4 pb-6 lg:px-5" aria-labelledby="blatt-titel">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 id="blatt-titel" className="text-[21px] leading-tight font-bold text-balance">
            {baum.name}
          </h2>
          <p className="mt-1 text-[14px]">
            <i>{baum.wiss}</i> {baum.artName && <span className="text-tinte-weich">· {baum.artName}</span>}
          </p>
          <p className="mt-0.5 text-[13px] text-tinte-weich">
            {baum.ort}, {LAENDER[baum.land]} · {km.toLocaleString("de-DE")} km von Moosburg
          </p>
          {baum.lageUngefaehr && (
            <p className="mt-1 text-[13px]">
              <span className="font-semibold">Lage ungefähr:</span> Ortspunkt von {baum.lageUngefaehr}. Die genaue Stelle steht bei der Quelle.
            </p>
          )}
        </div>
        <button type="button" onClick={onSchliessen} aria-label="Blatt schließen" className="-mr-1 shrink-0 p-1.5 hover:bg-papier">
          <X size={20} weight="bold" />
        </button>
      </header>

      {baum.kategorien.length > 0 && (
        <ul className="mt-2.5 flex flex-wrap gap-1.5">
          {baum.kategorien.map((k) => (
            <li key={k} className="border border-linie-stark px-1.5 py-0.5 text-[12px] font-semibold">
              {KATEGORIE_TEXT[k]}
            </li>
          ))}
        </ul>
      )}

      {art && jahr && stufe ? (
        <>
        <section className="mt-4 flex items-center gap-3.5 bg-papier p-3" aria-label="Was jetzt geht">
          <span className="shrink-0" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ringSvg(jahr, monat, stufe, 56) }} />
          <div className="min-w-0">
            {beste ? (
              <>
                <p className="text-[13px] font-semibold text-tinte-weich">
                  Im {MONATE[monat - 1]}, {tageText(tage)} bis zuhause
                </p>
                <p className="text-[18px] leading-snug font-bold">{beste.methode.name}</p>
                <p className="text-[13px]" style={{ color: beste.methode.klon ? "var(--color-klon)" : "var(--color-samen)" }}>
                  <span className="font-semibold">{beste.methode.klon ? "Klon" : "Nachkomme"}</span>
                  <span className="text-tinte-weich"> · Erfolg {beste.am.erfolg} · hält {beste.methode.haelt.split(",")[0]}</span>
                </p>
              </>
            ) : (
              <>
                <p className="text-[13px] font-semibold text-tinte-weich">
                  Im {MONATE[monat - 1]}, {tageText(tage)} bis zuhause
                </p>
                <p className="text-[18px] leading-snug font-bold">Jetzt geht nichts</p>
                <p className="text-[13px] text-tinte-weich">
                  {spaeter
                    ? `Ab ${MONATE[spaeter.monat - 1]}: ${spaeter.option.methode.name}`
                    : `Bei ${tageText(tage)} Reise geht hier das ganze Jahr nichts.`}
                </p>
              </>
            )}
          </div>
        </section>

        <p className="mt-3 flex items-center gap-2 text-[14px]">
          <svg width="18" height="18" viewBox="13 13 14 14" aria-hidden="true" dangerouslySetInnerHTML={{ __html: mitte(stufe, 5) }} />
          <span className="font-semibold">{STUFE_TEXT[stufe]}</span>
          <span className="text-[12px] text-tinte-weich">Zone {art.zone}, Moosburg 7a</span>
        </p>

        <section className="mt-5" aria-labelledby="vermehrung">
          <div className="flex items-baseline justify-between">
            <h3 id="vermehrung" className="text-[15px] font-bold">
              Was die Art hergibt
            </h3>
            <span className="flex items-center gap-1.5 text-[12px] text-tinte-weich">
              <span className="inline-block h-3.5 w-[2px] bg-tinte" aria-hidden="true" />
              deine Reise, {tageText(tage)}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-12 gap-[2px] text-center text-[10px] text-tinte-weich" aria-hidden="true">
            {MONAT_KURZ.map((k, i) => (
              <span key={i} className={i + 1 === monat ? "font-bold text-tinte" : ""}>
                {k}
              </span>
            ))}
          </div>
          <div className="mt-1">
            {opts.map((o) => (
              <Methode key={o.id} o={o} monat={monat} tage={tage} />
            ))}
          </div>
          <p className="border-t border-linie pt-2 text-[12px] text-tinte-weich">
            Haltbarkeit und Erfolg sind Richtwerte. „Einschätzung“ heißt: nicht aus einer Quelle belegt, „offen“: Die Quelle nennt die Methode, aber keinen Erfolg.
          </p>
        </section>
        </>
      ) : (
        <section className="mt-4 flex items-center gap-3.5 bg-papier p-3" aria-label="Keine Vermehrungsdaten">
          <span className="shrink-0" aria-hidden="true" dangerouslySetInnerHTML={{ __html: grauSvg(56) }} />
          <p className="text-[14px] leading-snug">
            Für diese Art gibt es noch keine Vermehrungsdaten. PFAF führt sie nicht, deshalb fehlen Zeitfenster, Methoden und Winterhärte.
          </p>
        </section>
      )}

      <section className="mt-6" aria-labelledby="geschichte">
        <h3 id="geschichte" className="text-[15px] font-bold">
          Warum dieser Baum
        </h3>
        <p className="mt-1.5 text-[14px] leading-relaxed">{baum.warum}</p>
        <p className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[14px]">
          <span className="font-semibold">Alter:</span>
          <span>{baum.alter.text}</span>
          <span className={`border px-1.5 text-[12px] font-semibold ${RAHMEN_GEWISSHEIT[baum.alter.gewissheit]}`}>
            {GEWISSHEIT_TEXT[baum.alter.gewissheit]}
          </span>
        </p>
      </section>

      {hinweise(baum).length > 0 && (
        <section className="mt-6" aria-labelledby="hinweise">
          <h3 id="hinweise" className="text-[15px] font-bold">
            Gut zu wissen
          </h3>
          <ul className="mt-1.5 space-y-2 text-[13px] leading-snug">
            {hinweise(baum).map((h) => (
              <li key={h.text} className="flex gap-2">
                {h.warnung ? (
                  <Warning size={16} weight="bold" className="mt-px shrink-0" aria-hidden="true" />
                ) : (
                  <Info size={16} weight="bold" className="mt-px shrink-0 text-tinte-weich" aria-hidden="true" />
                )}
                <span>{h.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 border-t border-linie pt-3" aria-labelledby="quellen">
        <h3 id="quellen" className="text-[13px] font-bold">
          Quellen
        </h3>
        <ul className="mt-1 space-y-1 text-[13px]">
          {[...baum.quellen, ...(art ? [{ titel: `PFAF: ${art.wiss}`, url: art.quelle }] : [])].map((q) => (
            <li key={q.url + q.titel}>
              <a href={q.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
                {q.titel}
                <ArrowSquareOut size={12} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
        {art && <p className="mt-2 text-[12px] text-tinte-weich">Zonenangabe: {art.zoneHerkunft}</p>}
      </section>
    </article>
  );
}
