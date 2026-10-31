import test from "node:test";
import assert from "node:assert/strict";
import { evaluateRow, worksheetCsv } from "../src/worksheet.js";

const row = (patch = {}) => ({ analyteId: "estradiol", value: "100", fromUnitId: "pg_ml", toUnitId: "pmol_l", ...patch });

test("mixed worksheet uses each analyte's own units and custom PRL factor", () => {
  assert.ok(Math.abs(evaluateRow(row()).result - 367.13415) < .0001);
  assert.equal(evaluateRow(row({ analyteId: "prolactin", fromUnitId: "ng_ml", toUnitId: "miu_l", value: "2" }), { prolactinFactor: 20 }).result, 40);
  assert.equal(evaluateRow(row({ value: "0" })).result, 0);
  assert.ok(evaluateRow(row({ value: "1e2" })).result > 367);
});

test("worksheet rejects invalid analytes, missing values, negative values and overflow", () => {
  for (const patch of [{ analyteId: "unknown" }, { value: "" }, { value: " " },
    { value: "Infinity" }, { value: "-2" }, { fromUnitId: "IU" }, { value: "1e308" }]) {
    assert.ok(evaluateRow(row(patch)).error);
  }
});

test("CSV preserves source and results and refuses partial invalid export", () => {
  const csv = worksheetCsv([row(), row({ analyteId: "prolactin", value: "2", fromUnitId: "ng_ml", toUnitId: "miu_l" })], { prolactinFactor: 20 });
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"2","ng/mL","40","mIU/L","20"'));
  assert.throws(() => worksheetCsv([row(), row({ value: "" })]));
  assert.throws(() => worksheetCsv([]));
  assert.throws(() => worksheetCsv(Array.from({ length: 51 }, () => row())));
});
