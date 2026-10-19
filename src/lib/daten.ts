import methodenRoh from "@/daten/methoden.json";
import artenRoh from "@/daten/arten.json";
import artenPfafRoh from "@/daten/arten-pfaf.json";
import baeumeRoh from "@/daten/baeume.json";
import rekordeRoh from "@/daten/rekorde.json";
import regionenRoh from "@/daten/regionen.json";

export type MethodeId =
  | "gruensteckling"
  | "halbreif"
  | "steckholz"
  | "wurzelschnittling"
  | "schoessling"
  | "samen_trocken"
  | "samen_feucht";

/** "offen": Die Quelle nennt die Methode, sagt aber nichts zum Erfolg. */
export type Erfolg = "leicht" | "mittel" | "schwer" | "kaum" | "offen";
export type Gewissheit = "belegt" | "geschaetzt" | "ueberliefert" | "unbekannt";
export type Kategorie = "europa" | "land" | "stadt" | "selten" | "historisch";

export interface Methode {
  name: string;
  kurz: string;
  klon: boolean;
  /** Standardfenster. Samen haben keins, dort zaehlt die Reife der Art. */
  monate: number[];
  /** Vorsichtiger Richtwert: so viele Tage uebersteht das Material unterwegs. */
  tage: number;
  haelt: string;
  transport: string;
  anleitung: string[];
  /** Gilt der Hinweis, dass alte Baeume schlechter bewurzeln? */
  alterBaum: boolean;
}

export interface ArtMethode {
  methode: MethodeId;
  monate?: number[];
  erfolg: Erfolg;
  /** Fehlt das Feld, ist die Erfolgsstufe eine eigene Einschaetzung. */
  erfolgBeleg?: string;
  hinweis?: string;
}

export interface Art {
  name: string;
  wiss: string;
  zone: number;
  zoneHerkunft: string;
  hinweis?: string;
  invasiv?: string;
  giftig?: string;
  boden?: string;
  methoden: ArtMethode[];
  quelle: string;
}

export interface Region {
  id: string;
  name: string;
  lat: number;
  lon: number;
  zoom: number;
  umkreisKm?: number;
}

export interface Baum {
  id: string;
  name: string;
  /** Schluessel in ARTEN, oder null, wenn es zur Art noch keine Vermehrungsdaten gibt */
  art: string | null;
  wiss: string;
  artName: string;
  lat: number;
  lon: number;
  ort: string;
  land: string;
  regionen: string[];
  kategorien: Kategorie[];
  warum: string;
  alter: { text: string; gewissheit: Gewissheit };
  /** Geschaetztes Alter als Zahl, wo die Quelle eins nennt (Rekordlisten) */
  alterJahre?: number;
  /** Nur auf Ortsebene bekannt: wonach geokodiert wurde */
  lageUngefaehr?: string;
  schutz?: string;
  hinweis?: string;
  keineSamen?: string;
  quellen: { titel: string; url: string }[];
}

/** So schreibt etl/rekorde.py die Monumental-Trees-Rekorde. */
interface Rekord {
  id: string;
  name: string;
  wiss: string;
  artName: string;
  lat: number;
  lon: number;
  lageText: string;
  ort: string;
  land: string;
  regionen: string[];
  platzEuropa: number;
  alter: number;
  spanne: number | null;
  messjahr: string;
  url: string;
  schutz?: string;
}

type HandBaum = Omit<Baum, "art" | "wiss" | "artName" | "regionen"> & { art: string; regionen?: string[] };

export const METHODEN = methodenRoh as Record<MethodeId, Methode>;

// Von Hand gepflegte Arten haben Vorrang vor den aus PFAF gelesenen
export const ARTEN: Record<string, Art> = {
  ...(artenPfafRoh as Record<string, Art>),
  ...(artenRoh as Record<string, Art>),
};

export const REGIONEN = regionenRoh as Region[];

const ART_NACH_WISS = new Map(Object.entries(ARTEN).map(([id, a]) => [a.wiss, id]));

const PLATZ = ["der älteste", "der zweitälteste", "der drittälteste"];

function ausRekord(r: Rekord): Baum {
  return {
    id: r.id,
    name: r.name,
    art: ART_NACH_WISS.get(r.wiss) ?? null,
    wiss: r.wiss,
    artName: r.artName,
    lat: r.lat,
    lon: r.lon,
    ort: r.ort,
    land: r.land,
    regionen: r.regionen,
    kategorien: ["europa"],
    warum: `Laut Monumental Trees ${PLATZ[r.platzEuropa - 1]} bekannte Baum seiner Art in Europa.`,
    alter: {
      text: `rund ${r.alter.toLocaleString("de-DE")} Jahre${r.spanne ? ` (± ${r.spanne})` : ""}, Stand ${r.messjahr}`,
      gewissheit: "geschaetzt",
    },
    alterJahre: r.alter,
    lageUngefaehr: r.lageText,
    schutz: r.schutz,
    quellen: [{ titel: "Monumental Trees", url: r.url }],
  };
}

export const BAEUME: Baum[] = [
  ...(baeumeRoh as HandBaum[]).map((b) => ({
    ...b,
    wiss: ARTEN[b.art].wiss,
    artName: ARTEN[b.art].name,
    regionen: b.regionen ?? [],
  })),
  ...(rekordeRoh as Rekord[]).map(ausRekord),
];
