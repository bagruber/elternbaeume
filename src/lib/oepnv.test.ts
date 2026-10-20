import { describe, expect, it } from "vitest";
import { OEPNV_HALTE, OEPNV_IDS, OEPNV_LINIEN } from "./oepnv";

const ebene = (id: string) => [...OEPNV_LINIEN, ...OEPNV_HALTE].find((l) => l.id === id)!;

describe("OePNV-Ebene", () => {
  it("zeigt keine Busse", () => {
    for (const l of [...OEPNV_LINIEN, ...OEPNV_HALTE]) {
      expect(JSON.stringify("filter" in l ? l.filter : null), l.id).not.toMatch(/bus/);
    }
  });

  it("laesst Abstellgleise und Betriebshoefe weg", () => {
    for (const l of OEPNV_LINIEN) expect(JSON.stringify("filter" in l ? l.filter : null), l.id).toContain('"service"');
  });

  it("zeigt beim Hineinzoomen mehr: Bahn, dann U-Bahn, dann Tram", () => {
    expect(ebene("oepnv-bahn").minzoom).toBeLessThan(ebene("oepnv-ubahn").minzoom!);
    expect(ebene("oepnv-ubahn").minzoom).toBeLessThan(ebene("oepnv-tram").minzoom!);
    expect(ebene("oepnv-bahnhof").minzoom).toBeLessThan(ebene("oepnv-tramhalt").minzoom!);
  });

  it("startet ausgeblendet", () => {
    for (const l of [...OEPNV_LINIEN, ...OEPNV_HALTE]) expect(l.layout?.visibility, l.id).toBe("none");
    expect(new Set(OEPNV_IDS).size).toBe(OEPNV_IDS.length);
  });
});
