import { describe, expect, it } from "vitest";
import { entfernungKm, moosburgStufe, naechstes, optionen, zustand } from "./auswahl";
import { BAEUME } from "./daten";

const baum = (id: string) => {
  const b = BAEUME.find((x) => x.id === id);
  if (!b) throw new Error(`Baum ${id} fehlt in den Daten`);
  return b;
};

describe("moosburgStufe", () => {
  it("teilt an Zone 7 in ja, mit Schutz und nein", () => {
    expect(moosburgStufe(4)).toBe("ja");
    expect(moosburgStufe(6)).toBe("ja");
    expect(moosburgStufe(7)).toBe("schutz");
    expect(moosburgStufe(8)).toBe("nein");
  });
});

describe("zustand", () => {
  it("blendet den Gruensteckling aus, wenn die Reise laenger dauert als er haelt", () => {
    expect(zustand(baum("ginkgo-roedelheim"), 6, 1)).toBe("klon");
    expect(zustand(baum("ginkgo-roedelheim"), 6, 5)).toBe("nichts");
  });

  it("laesst Steckholz im Januar auch drei Wochen Reise zu", () => {
    expect(zustand(baum("eibe-balderschwang"), 1, 21)).toBe("klon");
  });

  it("nimmt den Klon vor dem Samen, auch wenn beide moeglich sind", () => {
    const opts = optionen(baum("robinie-viviani"), 12, 3).filter((o) => o.moeglich);
    expect(opts.map((o) => o.id)).toEqual(["schoessling", "wurzelschnittling", "samen_trocken"]);
    expect(zustand(baum("robinie-viviani"), 12, 3)).toBe("klon");
  });

  it("faellt auf Samen zurueck, wenn kein Klon geht", () => {
    expect(zustand(baum("femeiche"), 10, 7)).toBe("samen");
  });

  it("zaehlt einen Klon mit Erfolg „kaum“ nicht als Moeglichkeit", () => {
    // Zeder im November: Steckholz „kaum“, Samen „mittel“
    const opts = optionen(baum("zeder-jussieu"), 11, 3);
    expect(opts[0].id).toBe("samen_trocken");
    expect(zustand(baum("zeder-jussieu"), 11, 3)).toBe("samen");
  });

  it("sperrt Samen an einem maennlichen Baum", () => {
    const samen = optionen(baum("pistazie-vaillant"), 9, 1).find((o) => o.id === "samen_trocken");
    expect(samen?.gesperrt).toBeTruthy();
    expect(zustand(baum("pistazie-vaillant"), 9, 1)).toBe("nichts");
  });
});

describe("naechstes", () => {
  it("findet das naechste Fenster und springt dabei ueber den Jahreswechsel", () => {
    // Eibe im Maerz: halbreif erst im Juli
    expect(naechstes(baum("eibe-balderschwang"), 3, 3)).toMatchObject({ monat: 7 });
    // Platane im Dezember bei 5 Tagen: Samen im Januar
    const n = naechstes(baum("platane-buffon"), 12, 5);
    expect(n?.monat).toBe(1);
    expect(n?.option.id).toBe("samen_trocken");
  });

  it("meldet nichts, wenn das ganze Jahr nichts geht", () => {
    expect(naechstes(baum("pistazie-vaillant"), 1, 3)).toBeNull();
  });
});

describe("entfernungKm", () => {
  it("misst von Moosburg aus", () => {
    expect(entfernungKm(48.4697, 11.9381)).toBeCloseTo(0);
    // Obermarbach liegt laut Wikidata-Abfrage rund 34 km westlich
    expect(Math.round(entfernungKm(48.427312, 11.482496))).toBe(34);
  });
});
