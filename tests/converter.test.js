import test from "node:test";
import assert from "node:assert/strict";

import {
  ANALYTES,
  conversionFactor,
  convert,
  formatFactor,
  formatMeasurement,
  getAnalyte,
  getUnit,
  getUnits,
} from "../src/converter.js";

const closeTo = (actual, expected, tolerance = 1e-4) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be within ${tolerance} of ${expected}`,
  );
};

test("estradiol mass concentration converts through molecular mass", () => {
  const estradiol = getAnalyte("estradiol");
  closeTo(convert(100, estradiol, "pg_ml", "pmol_l"), 367.13415);
  closeTo(convert(100, estradiol, "pg_ml", "ng_l"), 100);
  closeTo(convert(1, estradiol, "ng_ml", "ng_dl"), 100);
});

test("total testosterone converts between ng/dL and nmol/L", () => {
  const testosterone = getAnalyte("testosterone");
  closeTo(convert(500, testosterone, "ng_dl", "nmol_l"), 17.33583);
  closeTo(convert(17.33583, testosterone, "nmol_l", "ng_dl"), 500, 0.001);
});

test("progesterone and DHEA-S use their own molecular masses", () => {
  const progesterone = getAnalyte("progesterone");
  const dheas = getAnalyte("dheas");
  closeTo(convert(10, progesterone, "ng_ml", "nmol_l"), 31.80055);
  closeTo(convert(200, dheas, "ug_dl", "umol_l"), 5.42756);
});

test("different estrogen molecules do not share an estradiol factor", () => {
  const estradiol = getAnalyte("estradiol");
  const estrone = getAnalyte("estrone");
  const e2Factor = conversionFactor(estradiol, "pg_ml", "pmol_l");
  const e1Factor = conversionFactor(estrone, "pg_ml", "pmol_l");
  assert.notEqual(e2Factor, e1Factor);
  closeTo(e1Factor, 1000 / 270.37);
});

test("prolactin supports an explicit assay factor", () => {
  const prolactin = getAnalyte("prolactin");
  closeTo(convert(20, prolactin, "ng_ml", "miu_l"), 424);
  closeTo(convert(20, prolactin, "ng_ml", "miu_l", { prolactinFactor: 18 }), 360);
  const customUnit = getUnit(prolactin, "ng_ml", { prolactinFactor: 18 });
  assert.equal(customUnit.toBase, 18);
});

test("gonadotropin IU formats remain dimensionally stable", () => {
  const lh = getAnalyte("lh");
  const fsh = getAnalyte("fsh");
  closeTo(convert(5, lh, "miu_ml", "iu_l"), 5);
  closeTo(convert(5, lh, "miu_ml", "miu_l"), 5000);
  closeTo(convert(1, fsh, "iu_ml", "iu_l"), 1000);
});

test("SHBG exposes molar units without unreliable protein mass conversion", () => {
  const shbg = getAnalyte("shbg");
  assert.deepEqual(
    getUnits(shbg).map((unit) => unit.id),
    ["nmol_l", "pmol_l", "umol_l"],
  );
  closeTo(convert(40, shbg, "nmol_l", "umol_l"), 0.04);
});

test("the catalog has unique ids, complete metadata, and valid defaults", () => {
  assert.equal(new Set(ANALYTES.map((analyte) => analyte.id)).size, ANALYTES.length);
  assert.equal(ANALYTES.length, 14);

  for (const analyte of ANALYTES) {
    const unitIds = analyte.units.map((unit) => unit.id);
    assert.equal(new Set(unitIds).size, unitIds.length, `${analyte.id} contains duplicate units`);
    assert.ok(unitIds.includes(analyte.defaultUnitId), `${analyte.id} has an invalid default unit`);
    assert.ok(
      unitIds.includes(analyte.defaultTargetUnitId),
      `${analyte.id} has an invalid default target unit`,
    );
    assert.ok(analyte.nameZh && analyte.nameEn && analyte.note, `${analyte.id} is incomplete`);
    for (const unit of analyte.units) {
      assert.ok(Number.isFinite(unit.toBase) && unit.toBase > 0);
      assert.ok([1, 2].includes(unit.tier));
      assert.ok(["mass", "molar", "iu"].includes(unit.kind));
    }
  }
});

test("invalid conversion requests fail loudly", () => {
  const estradiol = getAnalyte("estradiol");
  assert.throws(() => convert("abc", estradiol, "pg_ml", "pmol_l"), TypeError);
  assert.throws(() => convert(10, estradiol, "missing", "pmol_l"), RangeError);
  assert.throws(() => convert(10, estradiol, "pg_ml", "missing"), RangeError);
});

test("formatting uses significant digits without losing small measurements", () => {
  assert.equal(formatMeasurement(367.13415, 5), "367.13");
  assert.equal(formatMeasurement(0.000012345, 3), "1.23e-5");
  assert.equal(formatMeasurement(0, 5), "0");
  assert.equal(formatFactor(3.6713415), "3.67134");
});

test("every advertised unit pair round-trips within numerical tolerance", () => {
  for (const analyte of ANALYTES) {
    for (const fromUnit of analyte.units) {
      for (const toUnit of analyte.units) {
        const converted = convert(42.5, analyte, fromUnit.id, toUnit.id);
        const restored = convert(converted, analyte, toUnit.id, fromUnit.id);
        closeTo(restored, 42.5, 1e-8);
      }
    }
  }
});
