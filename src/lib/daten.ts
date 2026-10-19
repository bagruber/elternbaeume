import methodenRoh from "@/daten/methoden.json";
import artenRoh from "@/daten/arten.json";
import baeumeRoh from "@/daten/baeume.json";

export type MethodeId =
  | "gruensteckling"
  | "halbreif"
  | "steckholz"
  | "wurzelschnittling"
  | "schoessling"
  | "samen_trocken"
  | "samen_feucht";

export type Erfolg = "leicht" | "mittel" | "schwer" | "kaum";
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

export interface Baum {
  id: string;
  name: string;
  art: string;
  lat: number;
  lon: number;
  ort: string;
  land: string;
  kategorien: Kategorie[];
  warum: string;
  alter: { text: string; gewissheit: Gewissheit };
  schutz?: string;
  hinweis?: string;
  keineSamen?: string;
  quellen: { titel: string; url: string }[];
}

export const METHODEN = methodenRoh as Record<MethodeId, Methode>;
export const ARTEN = artenRoh as Record<string, Art>;
export const BAEUME = baeumeRoh as Baum[];
