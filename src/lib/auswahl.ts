import { ARTEN, METHODEN, type ArtMethode, type Baum, type Erfolg, type Methode } from "./daten";

/**
 * Moosburg an der Isar liegt in Zone 7a. Gerechnet aus den Tagesminima der
 * DWD-Station Weihenstephan-Duernast (05404, rund 15 km entfernt): Mittel der
 * Jahresminima 1991-2020 bei -16,0 °C, kaeltestes Jahr 2000 mit -23,2 °C.
 */
export const MOOSBURG = { lat: 48.4697, lon: 11.9381, zone: 7 };

export type Stufe = "ja" | "schutz" | "nein";

export function moosburgStufe(zone: number): Stufe {
  // Zone 6 reicht bis -23,3 °C und deckt damit auch den Winter 2000. Eine
  // Zone-7-Art uebersteht den Durchschnitt, aber nicht jeden Ausreisser.
  if (zone < MOOSBURG.zone) return "ja";
  if (zone === MOOSBURG.zone) return "schutz";
  return "nein";
}

const RANG: Record<Erfolg, number> = { leicht: 3, mittel: 2, schwer: 1, kaum: 0 };

export interface Option {
  id: ArtMethode["methode"];
  am: ArtMethode;
  methode: Methode;
  monate: number[];
  imMonat: boolean;
  /** Uebersteht das Material die angegebenen Reisetage? */
  reicht: boolean;
  /** Grund, warum die Methode an genau diesem Baum ausfaellt. */
  gesperrt?: string;
  moeglich: boolean;
}

/**
 * Klon vor Saemling, Saemling vor nichts. Ein Klon mit „kaum“ rutscht hinter
 * die Samen: Wer am Baum steht, soll zuerst sehen, was realistisch klappt.
 */
function stufe(o: Option): number {
  if (o.am.erfolg === "kaum") return 0;
  return o.methode.klon ? 2 : 1;
}

export function optionen(baum: Baum, monat: number, reisetage: number): Option[] {
  return ARTEN[baum.art].methoden
    .map((am) => {
      const methode = METHODEN[am.methode];
      const monate = am.monate ?? methode.monate;
      const imMonat = monate.includes(monat);
      const reicht = methode.tage >= reisetage;
      const gesperrt = !methode.klon ? baum.keineSamen : undefined;
      return {
        id: am.methode,
        am,
        methode,
        monate,
        imMonat,
        reicht,
        gesperrt,
        moeglich: imMonat && reicht && !gesperrt,
      };
    })
    .sort((a, b) => stufe(b) - stufe(a) || RANG[b.am.erfolg] - RANG[a.am.erfolg]);
}

export type Zustand = "klon" | "samen" | "nichts";

/** Was geht an diesem Baum im Monat bei so vielen Tagen bis nach Hause? */
export function zustand(baum: Baum, monat: number, reisetage: number): Zustand {
  const beste = optionen(baum, monat, reisetage).find(
    (o) => o.moeglich && o.am.erfolg !== "kaum",
  );
  if (!beste) return "nichts";
  return beste.methode.klon ? "klon" : "samen";
}

/**
 * Ab welchem Monat geht an diesem Baum wieder etwas, und was? Sucht in den
 * kommenden elf Monaten, der laufende zaehlt nicht mit.
 */
export function naechstes(
  baum: Baum,
  monat: number,
  reisetage: number,
): { monat: number; option: Option } | null {
  for (let i = 1; i < 12; i++) {
    const m = ((monat - 1 + i) % 12) + 1;
    const option = optionen(baum, m, reisetage).find(
      (o) => o.moeglich && o.am.erfolg !== "kaum",
    );
    if (option) return { monat: m, option };
  }
  return null;
}

export function entfernungKm(lat: number, lon: number): number {
  const r = Math.PI / 180;
  const a =
    Math.sin(((lat - MOOSBURG.lat) * r) / 2) ** 2 +
    Math.cos(MOOSBURG.lat * r) * Math.cos(lat * r) * Math.sin(((lon - MOOSBURG.lon) * r) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}
