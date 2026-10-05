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
    this.state = 'playing'; // playing | dead | passed
    this.deathCause = null;
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
    this.stepAcc += dtMs;
    while (this.stepAcc >= this.p.stepMs && this.state === 'playing') {
      this.stepAcc -= this.p.stepMs;
      events.push(...this.step());
    }
    return events;
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
      const def = this.p.fruitTypes[fruit.type];
      this.score = Math.max(0, this.score + def.score);
      this.grow += 1;
      events.push({ type: 'eat', fruit, def });
      this.spawnFruit();
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
    const types = Object.entries(this.p.fruitTypes);
    const total = types.reduce((a, [, t]) => a + t.weight, 0);
    let r = this.rng() * total;
    for (const [k, t] of types) { if ((r -= t.weight) < 0) return k; }
    return types[0][0];
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
