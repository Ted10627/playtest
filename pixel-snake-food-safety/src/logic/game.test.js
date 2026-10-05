import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from './game.js';
import { cloneParams } from '../config/params.js';

const mk = (over = {}) => {
  const p = Object.assign(cloneParams(), over);
  const g = new Game(p, () => 0.5);
  g.fruits = []; // 測試時自行擺放蔬果
  return g;
};

test('蛇依方向前進一格', () => {
  const g = mk();
  const { x, y } = g.head;
  g.step();
  assert.deepEqual(g.head, { x, y: y - 1 });
  assert.equal(g.snake.length, 3);
});

test('不可直接反向', () => {
  const g = mk();
  g.setDirection('down');
  g.step();
  assert.equal(g.dir, 'up');
});

test('撞到柵欄死亡', () => {
  const g = mk();
  g.snake = [{ x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }];
  g.dir = 'left';
  const ev = g.step();
  assert.equal(g.state, 'dead');
  assert.equal(g.deathCause, 'fence');
  assert.ok(ev.some(e => e.type === 'die'));
});

test('撞到自己身體死亡', () => {
  const g = mk();
  g.snake = [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 6, y: 5 }, { x: 6, y: 4 }];
  g.dir = 'up';
  g.setDirection('right');
  g.step();
  assert.equal(g.deathCause, 'self');
});

test('可以跟著自己的尾巴走（尾巴同步移開）', () => {
  const g = mk();
  g.snake = [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 6, y: 5 }];
  g.dir = 'up';
  g.setDirection('right');
  g.step();
  assert.equal(g.state, 'playing');
});

test('吃到各類蔬果：計分、成長並補生', () => {
  const g = mk();
  const h = g.head;
  g.fruits = [{ x: h.x, y: h.y - 1, type: 'safe', veg: 'carrot', label: 'CAS' }];
  const ev = g.step();
  assert.equal(g.score, 20);
  assert.ok(ev.some(e => e.type === 'eat' && e.fruit.type === 'safe'));
  assert.equal(g.fruits.length, 1); // 已補生
  g.fruits = [];
  g.step();
  assert.equal(g.snake.length, 4);
});

test('分數不低於 0', () => {
  const g = mk();
  const h = g.head;
  g.fruits = [{ x: h.x, y: h.y - 1, type: 'risk', veg: 'tomato', label: null }];
  g.step();
  assert.equal(g.score, 0);
});

test('通關時間到開啟撤退點，進入即過關', () => {
  const g = mk({ passTimeSec: 1, stepMs: 100000 });
  const ev = g.update(1000);
  assert.ok(ev.some(e => e.type === 'gateOpen'));
  assert.ok(g.gate);
  // 把蛇放在撤退點內側並朝向它
  const gt = g.gate;
  const inside = { x: Math.min(Math.max(gt.x, 0), g.p.cols - 1), y: Math.min(Math.max(gt.y, 0), g.p.rows - 1) };
  const dir = gt.y < 0 ? 'up' : gt.y >= g.p.rows ? 'down' : gt.x < 0 ? 'left' : 'right';
  g.snake = [inside, inside, inside];
  g.dir = dir;
  g.step();
  assert.equal(g.state, 'passed');
});

test('補生避開蛇身與蛇頭前方', () => {
  const g = mk({ cols: 3, rows: 3, spawnSafeAhead: 2 });
  g.snake = [{ x: 1, y: 2 }, { x: 0, y: 2 }, { x: 2, y: 2 }];
  g.dir = 'up';
  for (let i = 0; i < 20; i++) {
    g.fruits = [];
    const f = g.spawnFruit('normal');
    assert.ok(f.y !== 2 && !(f.x === 1 && f.y <= 1));
  }
});
