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

// ---------- P2：雙計量條與事件 ----------
const eatAhead = (g, type) => {
  const h = g.head, d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[g.dir];
  g.fruits.push({ x: h.x + d[0], y: h.y + d[1], type, veg: 'cabbage', label: type === 'safe' ? 'CAS' : null });
  const ev = g.step();
  g.fruits = g.fruits.filter(f => !(f.x === h.x + d[0] && f.y === h.y + d[1]));
  return ev;
};

test('蔬果依類型增減計量條', () => {
  const g = mk();
  eatAhead(g, 'normal'); eatAhead(g, 'safe'); eatAhead(g, 'risk');
  assert.equal(g.energy, 3);
  assert.equal(g.riskBar, 3);
});

test('農藥風險條滿格觸發風險事件並暫停，套用後恢復', () => {
  const g = mk();
  g.riskBar = 19;
  const ev = eatAhead(g, 'risk');
  const t = ev.find(e => e.type === 'trigger');
  assert.equal(t.group, 'risk');
  assert.ok(['eagle', 'weirdo', 'cat'].includes(t.kind));
  assert.equal(g.state, 'event');
  assert.equal(g.riskBar, 0);
  assert.deepEqual(g.update(1000), []); // 過場期間不推進
  g.resolvePending();
  assert.equal(g.state, 'playing');
});

test('檢驗能量條滿格觸發友情支援事件', () => {
  const g = mk();
  g.energy = 19;
  const ev = eatAhead(g, 'safe');
  assert.equal(ev.find(e => e.type === 'trigger').group, 'support');
});

const force = (g, kind) => { g.pending = kind; g.state = 'event'; return g.resolvePending(); };

test('老鷹：抓走所有標章蔬果', () => {
  const g = mk();
  g.fruits = [{ x: 1, y: 1, type: 'safe' }, { x: 2, y: 1, type: 'normal' }, { x: 3, y: 1, type: 'safe' }];
  const ev = force(g, 'eagle');
  assert.equal(ev.find(e => e.type === 'eagle').taken.length, 2);
  assert.ok(!g.fruits.some(f => f.type === 'safe'));
  assert.equal(g.fruits.length, g.p.fruitCount);
});

test('怪人：蔬果暫時轉為風險蔬果，時間到恢復', () => {
  const g = mk({ stepMs: 100000 });
  g.fruits = [{ x: 1, y: 1, type: 'safe' }, { x: 2, y: 1, type: 'normal' }];
  force(g, 'weirdo');
  assert.ok(g.fruits.every(f => f.type === 'risk'));
  g.update(g.p.weirdoSec * 1000 + 1);
  assert.deepEqual(g.fruits.map(f => f.type), ['safe', 'normal']);
});

test('貓咪：貓爪追擊，抓到即死亡；時間到消失', () => {
  const g = mk({ stepMs: 100000, catStepMs: 10 });
  force(g, 'cat');
  assert.ok(g.effects.cat);
  g.update(2000);
  assert.equal(g.deathCause, 'cat');

  const g2 = mk({ stepMs: 100000, catStepMs: 100000 });
  force(g2, 'cat');
  g2.update(g2.p.catSec * 1000 + 1);
  assert.equal(g2.effects.cat, undefined);
  assert.equal(g2.state, 'playing');
});

test('植醫：風險蔬果全部轉為一般或標章蔬果', () => {
  const g = mk();
  g.fruits = [1, 2, 3, 4].map(x => ({ x, y: 1, type: 'risk' }));
  force(g, 'doctor');
  assert.ok(g.fruits.every(f => f.type === 'normal' || f.type === 'safe'));
});

test('阿慈：增加標章蔬果', () => {
  const g = mk();
  force(g, 'aci');
  assert.equal(g.fruits.filter(f => f.type === 'safe').length, g.p.aciExtraSafe);
});

test('阿鴻：無敵期間吃風險蔬果不扣分且能量 +1', () => {
  const g = mk();
  g.score = 50;
  force(g, 'ahong');
  eatAhead(g, 'risk');
  assert.equal(g.score, 50);
  assert.equal(g.energy, 1);
  assert.equal(g.riskBar, 0);
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
