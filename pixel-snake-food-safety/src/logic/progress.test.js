import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSave, applyResult, normalizeSave, isSkinUnlocked, isBgUnlocked, stepMsFor } from './progress.js';

test('過關依序解鎖知識卡 1–10，之後為限定卡', () => {
  let s = newSave();
  const got = [];
  for (let i = 0; i < 14; i++) {
    const r = applyResult(s, { passed: true, score: 10 });
    s = r.save;
    got.push(...r.newCards.map(c => c.no));
  }
  assert.deepEqual(got, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'L1', 'L2', 'L3']); // 第 14 次已無新卡
  assert.equal(s.clears, 14);
});

test('失敗不解鎖卡片，但更新最高分', () => {
  const r = applyResult(newSave(), { passed: false, score: 80 });
  assert.equal(r.newCards.length, 0);
  assert.equal(r.save.best, 80);
  assert.ok(r.newBest);
  assert.ok(!applyResult(r.save, { passed: false, score: 50 }).newBest);
});

test('造型與背景依卡片數解鎖', () => {
  const s = { ...newSave(), cards: 5 };
  assert.ok(isBgUnlocked(s, 'soil'));
  assert.ok(!isBgUnlocked(s, 'night'));
  assert.ok(!isSkinUnlocked(s, 'skin1'));
  assert.ok(isSkinUnlocked({ ...s, cards: 11 }, 'skin2'));
});

test('加速功能需取得限定卡 L3 且開啟', () => {
  assert.equal(stepMsFor({ ...newSave(), cards: 13, speedOn: true }, 170), 136);
  assert.equal(stepMsFor({ ...newSave(), cards: 12, speedOn: true }, 170), 170);
  assert.equal(stepMsFor({ ...newSave(), cards: 13, speedOn: false }, 170), 170);
});

test('存檔損毀或越界時自動校正', () => {
  assert.deepEqual(normalizeSave(null), newSave());
  const s = normalizeSave({ cards: 99, skin: 'skin2', bg: 'night' });
  assert.equal(s.cards, 13);
  assert.equal(normalizeSave({ cards: 2, skin: 'skin2' }).skin, 'base'); // 未解鎖的造型回到預設
});
