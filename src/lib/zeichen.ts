import type { Stufe, Zustand } from "./auswahl";

/**
 * Das Kartenzeichen eines Baums: ein Jahresring aus zwoelf Monatssegmenten,
 * Januar oben, im Uhrzeigersinn. Der gewaehlte Monat steht nach aussen vor.
 * In der Mitte die Winterhaerte in Moosburg: voll, halb, leer.
 * Als SVG-Zeichenkette, weil die Zeichen als HTML-Marker auf der Karte sitzen.
 */

const FARBE: Record<Zustand, string> = {
  klon: "var(--color-klon)",
  samen: "var(--color-samen)",
  nichts: "var(--color-leer)",
};

const C = 20;

function punkt(r: number, grad: number): string {
  const a = ((grad - 90) * Math.PI) / 180;
  return `${(C + r * Math.cos(a)).toFixed(2)} ${(C + r * Math.sin(a)).toFixed(2)}`;
}

function segment(innen: number, aussen: number, von: number, bis: number): string {
  return [
    `M${punkt(aussen, von)}`,
    `A${aussen} ${aussen} 0 0 1 ${punkt(aussen, bis)}`,
    `L${punkt(innen, bis)}`,
    `A${innen} ${innen} 0 0 0 ${punkt(innen, von)}`,
    "Z",
  ].join("");
}

export function mitte(stufe: Stufe, r = 5.5): string {
  const kreis = `<circle cx="${C}" cy="${C}" r="${r}" fill="var(--color-flaeche)" stroke="var(--color-tinte)" stroke-width="1.6"/>`;
  if (stufe === "ja")
    return `<circle cx="${C}" cy="${C}" r="${r}" fill="var(--color-tinte)" stroke="var(--color-tinte)" stroke-width="1.6"/>`;
  if (stufe === "schutz")
    return `${kreis}<path d="M${C} ${C - r}A${r} ${r} 0 0 0 ${C} ${C + r}Z" fill="var(--color-tinte)"/>`;
  return kreis;
}

export function ringSvg(jahr: Zustand[], monat: number, stufe: Stufe, px = 34): string {
  const luecke = 3;
  const teile = jahr.map((z, i) => {
    const von = i * 30 + luecke / 2;
    const bis = (i + 1) * 30 - luecke / 2;
    const aktuell = i === monat - 1;
    const d = segment(aktuell ? 9.5 : 10.5, aktuell ? 19.5 : 16.5, von, bis);
    const rand = aktuell ? ` stroke="var(--color-tinte)" stroke-width="1.4"` : "";
    return `<path d="${d}" fill="${FARBE[z]}"${rand}/>`;
  });
  return `<svg width="${px}" height="${px}" viewBox="0 0 40 40" aria-hidden="true"><circle cx="${C}" cy="${C}" r="17.8" fill="var(--color-flaeche)"/>${teile.join("")}${mitte(stufe)}</svg>`;
}

/** Sammelzeichen fuer mehrere Baeume, die im Massstab aufeinanderfallen. */
export function sammelSvg(anzahl: number, klon: number, samen: number, px = 38): string {
  const rand = klon > 0 ? FARBE.klon : samen > 0 ? FARBE.samen : "var(--color-linie-stark)";
  return `<svg width="${px}" height="${px}" viewBox="0 0 40 40" aria-hidden="true"><circle cx="${C}" cy="${C}" r="16" fill="var(--color-flaeche)" stroke="${rand}" stroke-width="5"/><text x="${C}" y="${C + 5}" text-anchor="middle" font-size="14" font-weight="700" fill="var(--color-tinte)" font-family="var(--font-sans)">${anzahl}</text></svg>`;
}
