import { describe, expect, it } from "vitest";
import { ARTEN, BAEUME, METHODEN } from "./daten";

// Die Daten werden von Hand gepflegt. Diese Pruefung faengt Tippfehler in
// Schluesseln ab, bevor sie als leere Etikette auf der Karte landen.

const KATEGORIEN = ["europa", "land", "stadt", "selten", "historisch"];
const GEWISSHEIT = ["belegt", "geschaetzt", "ueberliefert", "unbekannt"];
const ERFOLG = ["leicht", "mittel", "schwer", "kaum"];
const monatOk = (m: number) => Number.isInteger(m) && m >= 1 && m <= 12;

describe("Methoden", () => {
  it.each(Object.entries(METHODEN))("%s ist vollstaendig", (_, m) => {
    expect(m.tage).toBeGreaterThan(0);
    expect(m.anleitung.length).toBeGreaterThan(0);
    expect(m.monate.every(monatOk)).toBe(true);
  });
});

describe("Arten", () => {
  it.each(Object.entries(ARTEN))("%s verweist nur auf bekannte Methoden", (_, art) => {
    expect(art.zone).toBeGreaterThanOrEqual(1);
    expect(art.quelle).toMatch(/^https:\/\//);
    for (const am of art.methoden) {
      const m = METHODEN[am.methode];
      expect(m, am.methode).toBeDefined();
      expect(ERFOLG).toContain(am.erfolg);
      const monate = am.monate ?? m.monate;
      // Samen haben kein Standardfenster, die Art muss eins setzen
      expect(monate.length, `${am.methode} ohne Monate`).toBeGreaterThan(0);
      expect(monate.every(monatOk)).toBe(true);
    }
  });
});

describe("Baeume", () => {
  it("haben eindeutige IDs", () => {
    const ids = BAEUME.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(BAEUME.map((b) => [b.id, b] as const))("%s ist gueltig", (_, b) => {
    expect(ARTEN[b.art], b.art).toBeDefined();
    expect(b.lat).toBeGreaterThan(34);
    expect(b.lat).toBeLessThan(72);
    expect(b.lon).toBeGreaterThan(-25);
    expect(b.lon).toBeLessThan(45);
    expect(b.kategorien.every((k) => KATEGORIEN.includes(k))).toBe(true);
    expect(GEWISSHEIT).toContain(b.alter.gewissheit);
    expect(b.quellen.length).toBeGreaterThan(0);
    expect(b.land).toMatch(/^[A-Z]{2}$/);
  });
});
