import test from "node:test";
import assert from "node:assert/strict";

import { ANALYTES, getUnit } from "../src/converter.js";
import {
  FEMALE_REFERENCE_RANGES,
  REFERENCE_CONTEXT_NOTE,
  getFemaleReference,
} from "../src/female-ranges.js";

test("every reference profile belongs to a known analyte", () => {
  const analyteIds = new Set(ANALYTES.map((analyte) => analyte.id));
  for (const analyteId of Object.keys(FEMALE_REFERENCE_RANGES)) {
    assert.ok(analyteIds.has(analyteId), `Unknown reference analyte: ${analyteId}`);
  }
});

test("reference rows use valid units and ordered bounds", () => {
  for (const analyte of ANALYTES) {
    const reference = getFemaleReference(analyte.id);
    assert.ok(reference.title);
    assert.ok(Array.isArray(reference.rows));

    for (const row of reference.rows) {
      assert.ok(row.label);
      assert.ok(getUnit(analyte, row.unitId), `${analyte.id} has an invalid reference unit`);
      assert.ok(row.min === null || Number.isFinite(row.min));
      assert.ok(row.max === null || Number.isFinite(row.max));
      if (row.min !== null && row.max !== null) {
        assert.ok(row.min <= row.max, `${analyte.id}/${row.label} has inverted bounds`);
      }
    }
  }
});

test("cycle-sensitive HRT analytes expose multiple female contexts", () => {
  for (const analyteId of ["estradiol", "progesterone", "lh", "fsh"]) {
    const reference = getFemaleReference(analyteId);
    assert.ok(reference.rows.length >= 4);
    assert.ok(reference.rows.some((row) => row.label.includes("卵泡期")));
    assert.ok(reference.rows.some((row) => row.label.includes("绝经后")));
  }
});

test("synthetic and pregnancy-focused estrogens do not invent general female bands", () => {
  assert.equal(getFemaleReference("ethinylestradiol").rows.length, 0);
  assert.equal(getFemaleReference("estriol").rows.length, 0);
});

test("unknown analytes receive a safe non-diagnostic fallback", () => {
  const reference = getFemaleReference("not-an-analyte");
  assert.equal(reference.rows.length, 0);
  assert.match(reference.note, /没有足够稳定/);
  assert.match(REFERENCE_CONTEXT_NOTE, /不是诊断阈值/);
});
