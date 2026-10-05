// 遊戲邏輯層：不依賴任何畫面或平台 API，可於 Node 直接測試
export const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

export const VEGGIES = ['cabbage', 'carrot', 'tomato'];
export const SAFE_LABELS = ['有機', 'CAS', '產銷履歷', 'QR'];

export class Game {
  constructor(params, rng = Math.random) {
    this.p = params;
    this.rng = rng;
    this.reset();
  }

  reset() {
    const { cols, rows } = this.p;
    const cx = Math.floor(cols / 2), cy = Math.floor(rows / 2) + 2;
    this.snake = [{ x: cx, y: cy }, { x: cx, y: cy + 1 }, { x: cx, y: cy + 2 }];
    this.dir = 'up';
    this.dirQueue = [];
    this.grow = 0;
    this.score = 0;
    this.elapsedMs = 0;
    this.stepAcc = 0;
    this.gate = null;       // 撤退點 { x, y }，位於柵欄格（場地外一圈）
    this.state = 'playing'; // playing | event（等待過場動畫）| dead | passed
    this.deathCause = null;
    this.energy = 0;        // 檢驗能量條
    this.riskBar = 0;       // 農藥風險條
    this.pending = null;    // 待套用之事件
    this.effects = {};      // 進行中之限時效果：weirdo / cat / ahong
    this.fruits = [];
    for (let i = 0; i < this.p.fruitCount; i++) this.spawnFruit();
  }

  get head() { return this.snake[0]; }

  inBounds(x, y) { return x >= 0 && y >= 0 && x < this.p.cols && y < this.p.rows; }

  // 方向輸入：最多緩衝兩次，禁止直接反向
  setDirection(d) {
    if (!DIRS[d] || this.state !== 'playing') return;
    const last = this.dirQueue.length ? this.dirQueue[this.dirQueue.length - 1] : this.dir;
    if (d === last || d === OPPOSITE[last] || this.dirQueue.length >= 2) return;
    this.dirQueue.push(d);
  }

  // 依經過時間推進遊戲，回傳本次發生的事件
  update(dtMs) {
    const events = [];
    if (this.state !== 'playing') return events;
    this.elapsedMs += dtMs;
    if (!this.gate && this.elapsedMs >= this.p.passTimeSec * 1000) {
      this.gate = this.pickGateCell();
      events.push({ type: 'gateOpen', gate: this.gate });
    }
    events.push(...this.tickEffects(dtMs));
    this.stepAcc += dtMs;
    while (this.stepAcc >= this.p.stepMs && this.state === 'playing') {
      this.stepAcc -= this.p.stepMs;
      events.push(...this.step());
      events.push(...this.checkCat());
    }
    return events;
  }

  // ---------- 計量條與事件 ----------
  addBars(energy, risk, events) {
    const max = this.p.barMax;
    this.energy = Math.min(max, this.energy + energy);
    this.riskBar = Math.min(max, this.riskBar + risk);
    // 同時滿格時，風險事件優先
    if (this.riskBar >= max) this.trigger('risk', events);
    else if (this.energy >= max) this.trigger('support', events);
  }

  trigger(group, events) {
    const table = group === 'risk' ? this.p.riskEvents : this.p.supportEvents;
    const kind = this.pickWeighted(table);
    if (this.p.resetBarOnTrigger) { if (group === 'risk') this.riskBar = 0; else this.energy = 0; }
    this.pending = kind;
    this.state = 'event';
    events.push({ type: 'trigger', group, kind });
  }

  // 過場動畫結束後由畫面層呼叫，套用事件效果
  resolvePending() {
    const events = [];
    const kind = this.pending;
    if (!kind) return events;
    this.pending = null;
    this.state = 'playing';
    const fx = this.effects;
    if (kind === 'eagle') {
      const taken = this.fruits.filter(f => f.type === 'safe');
      this.fruits = this.fruits.filter(f => f.type !== 'safe');
      events.push({ type: 'eagle', taken });
      while (this.fruits.length < this.p.fruitCount) this.spawnFruit(this.pickWeighted({ normal: 2, risk: 1 }));
    } else if (kind === 'weirdo') {
      if (!fx.weirdo) for (const f of this.fruits) { f.orig = f.type; f.type = 'risk'; }
      fx.weirdo = { ms: this.p.weirdoSec * 1000 };
    } else if (kind === 'cat') {
      fx.cat = { ...this.farthestCorner(), ms: this.p.catSec * 1000, acc: 0 };
    } else if (kind === 'doctor') {
      for (const f of this.fruits) if (f.type === 'risk') {
        f.type = this.rng() < this.p.doctorSafeRatio ? 'safe' : 'normal';
        if (f.type === 'safe') f.label = SAFE_LABELS[Math.floor(this.rng() * SAFE_LABELS.length)];
        delete f.orig;
      }
    } else if (kind === 'aci') {
      for (let i = 0; i < this.p.aciExtraSafe; i++) this.spawnFruit('safe');
    } else if (kind === 'ahong') {
      fx.ahong = { ms: this.p.ahongSec * 1000 };
    }
    events.push({ type: 'applied', kind });
    return events;
  }

  tickEffects(dtMs) {
    const events = [];
    const fx = this.effects;
    if (fx.weirdo && (fx.weirdo.ms -= dtMs) <= 0) {
      delete fx.weirdo;
      for (const f of this.fruits) if (f.orig) { f.type = f.orig; delete f.orig; }
      events.push({ type: 'effectEnd', kind: 'weirdo' });
    }
    if (fx.ahong && (fx.ahong.ms -= dtMs) <= 0) {
      delete fx.ahong;
      events.push({ type: 'effectEnd', kind: 'ahong' });
    }
    if (fx.cat) {
      fx.cat.ms -= dtMs;
      if (fx.cat.ms <= 0) {
        delete fx.cat;
        events.push({ type: 'effectEnd', kind: 'cat' });
      } else {
        fx.cat.acc += dtMs;
        while (fx.cat.acc >= this.p.catStepMs) {
          fx.cat.acc -= this.p.catStepMs;
          const dx = Math.sign(this.head.x - fx.cat.x), dy = Math.sign(this.head.y - fx.cat.y);
          // 每次朝距離較遠的軸向移動一格
          if (Math.abs(this.head.x - fx.cat.x) >= Math.abs(this.head.y - fx.cat.y)) fx.cat.x += dx; else fx.cat.y += dy;
          events.push({ type: 'catMove' });
        }
        events.push(...this.checkCat());
      }
    }
    return events;
  }

  checkCat() {
    const c = this.effects.cat;
    if (c && this.state === 'playing' && c.x === this.head.x && c.y === this.head.y) {
      const events = [];
      this.die('cat', events);
      return events;
    }
    return [];
  }

  farthestCorner() {
    const { cols, rows } = this.p;
    const corners = [{ x: 0, y: 0 }, { x: cols - 1, y: 0 }, { x: 0, y: rows - 1 }, { x: cols - 1, y: rows - 1 }];
    const d = c => Math.abs(c.x - this.head.x) + Math.abs(c.y - this.head.y);
    return corners.reduce((a, b) => (d(b) > d(a) ? b : a));
  }

  pickWeighted(table) {
    const entries = Object.entries(table).filter(([, w]) => w > 0);
    const total = entries.reduce((a, [, w]) => a + w, 0);
    let r = this.rng() * total;
    for (const [k, w] of entries) { if ((r -= w) < 0) return k; }
    return entries[entries.length - 1][0];
  }

  step() {
    const events = [];
    if (this.dirQueue.length) this.dir = this.dirQueue.shift();
    const d = DIRS[this.dir];
    const nx = this.head.x + d.x, ny = this.head.y + d.y;

    if (!this.inBounds(nx, ny)) {
      if (this.gate && this.gate.x === nx && this.gate.y === ny) {
        this.snake.unshift({ x: nx, y: ny });
        this.snake.pop();
        this.state = 'passed';
        events.push({ type: 'pass' });
      } else {
        this.die('fence', events);
      }
      return events;
    }
    // 尾巴這一步會移走（未成長時），因此可以跟著尾巴走
    const body = this.grow > 0 ? this.snake : this.snake.slice(0, -1);
    if (body.some(s => s.x === nx && s.y === ny)) {
      this.die('self', events);
      return events;
    }

    this.snake.unshift({ x: nx, y: ny });
    if (this.grow > 0) this.grow--; else this.snake.pop();

    const fi = this.fruits.findIndex(f => f.x === nx && f.y === ny);
    if (fi >= 0) {
      const fruit = this.fruits.splice(fi, 1)[0];
      let def = this.p.fruitTypes[fruit.type];
      // 阿鴻無敵：吃到風險蔬果不扣分，能量反而增加
      if (fruit.type === 'risk' && this.effects.ahong) def = { score: 0, energy: this.p.ahongRiskEnergy, risk: 0 };
      this.score = Math.max(0, this.score + def.score);
      this.grow += 1;
      events.push({ type: 'eat', fruit, def });
      if (this.fruits.length < this.p.fruitCount) {
        const nf = this.spawnFruit();
        if (nf && this.effects.weirdo) { nf.orig = nf.type; nf.type = 'risk'; }
      }
      events.push({ type: 'move' });
      this.addBars(def.energy, def.risk, events);
      return events;
    }
    events.push({ type: 'move' });
    return events;
  }

  die(cause, events) {
    this.state = 'dead';
    this.deathCause = cause;
    events.push({ type: 'die', cause });
  }

  occupied(x, y) {
    return this.snake.some(s => s.x === x && s.y === y) || this.fruits.some(f => f.x === x && f.y === y);
  }

  freeCells() {
    const d = DIRS[this.dir];
    const ahead = new Set();
    for (let i = 1; i <= this.p.spawnSafeAhead; i++) ahead.add(`${this.head.x + d.x * i},${this.head.y + d.y * i}`);
    const cells = [];
    for (let y = 0; y < this.p.rows; y++)
      for (let x = 0; x < this.p.cols; x++)
        if (!this.occupied(x, y) && !ahead.has(`${x},${y}`)) cells.push({ x, y });
    return cells;
  }

  pickType() {
    return this.pickWeighted(Object.fromEntries(Object.entries(this.p.fruitTypes).map(([k, t]) => [k, t.weight])));
  }

  spawnFruit(type = this.pickType()) {
    const cells = this.freeCells();
    if (!cells.length) return null;
    const c = cells[Math.floor(this.rng() * cells.length)];
    const fruit = {
      x: c.x, y: c.y, type,
      veg: VEGGIES[Math.floor(this.rng() * VEGGIES.length)],
      label: type === 'safe' ? SAFE_LABELS[Math.floor(this.rng() * SAFE_LABELS.length)] : null,
    };
    this.fruits.push(fruit);
    return fruit;
  }

  // 撤退點：隨機選一個柵欄邊（不含四角）
  pickGateCell() {
    const { cols, rows } = this.p;
    const side = Math.floor(this.rng() * 4);
    const along = (n) => 1 + Math.floor(this.rng() * (n - 2));
    if (side === 0) return { x: along(cols), y: -1 };
    if (side === 1) return { x: along(cols), y: rows };
    if (side === 2) return { x: -1, y: along(rows) };
    return { x: cols, y: along(rows) };
  }

  get remainingSec() {
    return Math.max(0, this.p.passTimeSec - this.elapsedMs / 1000);
  }
}
