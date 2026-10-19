import type { Erfolg, Gewissheit } from "./daten";
import type { Stufe } from "./auswahl";

export const MONATE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];
export const MONAT_KURZ = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

/** Stufen des Reisetage-Reglers. Feiner am Anfang, wo Stecklinge kippen. */
export const TAGE_STUFEN = [1, 2, 3, 5, 7, 14, 21, 30];

export const LAENDER: Record<string, string> = {
  AT: "Österreich",
  CH: "Schweiz",
  DE: "Deutschland",
  DK: "Dänemark",
  FR: "Frankreich",
  GB: "Vereinigtes Königreich",
  GR: "Griechenland",
  IT: "Italien",
  PT: "Portugal",
};

const EU = new Set(["AT", "DE", "DK", "FR", "GR", "IT", "PT"]);
export const ausserhalbEU = (land: string) => !EU.has(land);

export const STUFE_TEXT: Record<Stufe, string> = {
  ja: "In Moosburg winterhart",
  schutz: "In Moosburg nur mit Schutz",
  nein: "In Moosburg nicht winterhart",
};

export const GEWISSHEIT_TEXT: Record<Gewissheit, string> = {
  belegt: "belegt",
  geschaetzt: "geschätzt",
  ueberliefert: "überliefert",
  unbekannt: "unbekannt",
};

export const ERFOLG_BALKEN: Record<Erfolg, number> = { leicht: 3, mittel: 2, schwer: 1, kaum: 0, offen: 0 };

export const KATEGORIE_TEXT = {
  europa: "Rekord in Europa",
  land: "Rekord im Land",
  stadt: "Besonders in der Stadt",
  selten: "Selten",
  historisch: "Geschichte",
} as const;
