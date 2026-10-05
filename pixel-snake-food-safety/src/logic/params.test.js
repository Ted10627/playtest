import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cloneParams, applyOverrides, DEFAULT_PARAMS } from '../config/params.js';

test('參數覆寫：巢狀路徑套用，不影響預設值', () => {
  const p = applyOverrides(cloneParams(), { 'fruitTypes.safe.score': 30, passTimeSec: 30 });
  assert.equal(p.fruitTypes.safe.score, 30);
  assert.equal(p.passTimeSec, 30);
  assert.equal(DEFAULT_PARAMS.fruitTypes.safe.score, 20);
});

test('參數覆寫：忽略不存在的參數與非數值', () => {
  const p = applyOverrides(cloneParams(), { 'no.such.path': 1, stepMs: 'abc', __proto__: 1 });
  assert.equal(p.stepMs, DEFAULT_PARAMS.stepMs);
  assert.equal(p.no, undefined);
});

test('圖示間隔最長值不小於最短值', () => {
  const p = applyOverrides(cloneParams(), { iconMinSec: 20, iconMaxSec: 5 });
  assert.equal(p.iconMaxSec, 20);
});
