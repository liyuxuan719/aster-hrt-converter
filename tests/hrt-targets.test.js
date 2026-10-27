import test from "node:test";
import assert from "node:assert/strict";

import {
  HRT_FEMINIZATION_TARGETS,
  HRT_TARGET_SOURCES,
  getHrtFeminizationTarget,
} from "../src/hrt-targets.js";

test("estradiol target exposes the commonly cited 100-200 pg/mL band", () => {
  const target = getHrtFeminizationTarget("estradiol");
  assert.equal(target.unitId, "pg_ml");
  assert.equal(target.min, 100);
  assert.equal(target.max, 200);
  assert.ok(target.sources.length >= 3);
});

test("testosterone target exposes a below-50 ng/dL monitoring ceiling", () => {
  const target = getHrtFeminizationTarget("testosterone");
  assert.equal(target.unitId, "ng_dl");
  assert.equal(target.min, null);
  assert.equal(target.max, 50);
});

test("unsupported analytes do not receive invented feminizing targets", () => {
  for (const analyteId of ["progesterone", "prolactin", "lh", "fsh", "shbg", "estriol"]) {
    assert.equal(getHrtFeminizationTarget(analyteId), null);
  }
});

test("every monitoring target cites a traceable source", () => {
  for (const target of Object.values(HRT_FEMINIZATION_TARGETS)) {
    assert.ok(target.sources === undefined || target.sourceKeys.length > 0);
    for (const sourceKey of target.sourceKeys) {
      assert.ok(HRT_TARGET_SOURCES[sourceKey], `Missing source: ${sourceKey}`);
      assert.match(HRT_TARGET_SOURCES[sourceKey].url, /^https:\/\//);
    }
  }
});

test("monitoring language distinguishes target from guaranteed outcomes", () => {
  for (const target of Object.values(HRT_FEMINIZATION_TARGETS)) {
    assert.match(target.caveat, /不等于/);
    assert.match(target.note, /具体|不同/);
  }
});
