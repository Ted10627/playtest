import Phaser from 'phaser';
import { Game } from '../logic/game.js';
import { cloneParams } from '../config/params.js';
import { CELL } from '../art/pixelArt.js';
import { bindDirectionInput } from '../platform/input.js';
import { FONT, W } from '../config/layout.js';
import { EVENT_CONTENT } from '../config/eventContent.js';

const BOARD_Y = 100;                 // 場地（含柵欄）上緣
const ANGLE = { up: 0, right: 90, down: 180, left: -90 };
const DEATH_TEXT = { fence: '撞到柵欄了', self: '撞到自己了', cat: '被貓爪抓到了' };
const CUTSCENE_MS = 2600;

export class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    this.params = cloneParams();
    this.game_ = new Game(this.params);
    const { cols, rows } = this.params;
    // 場地格 (x,y) 的畫面中心；柵欄在場地外一圈
    this.cellPos = (x, y) => ({ x: (x + 1) * CELL + CELL / 2, y: BOARD_Y + (y + 1) * CELL + CELL / 2 });

    this.drawBoard(cols, rows);
    this.sprayOverlay = this.add.rectangle(W / 2, BOARD_Y + (rows + 2) * CELL / 2, cols * CELL, rows * CELL, 0x8e24aa, 0.18)
      .setDepth(0.5).setVisible(false);
    this.fruitSprites = new Map();
    this.snakeSprites = [];
    this.gateSprite = null;
    this.cutscene = null;
    this.catSprite = null;
    this.drawHud();
    this.drawDpad();

    const boardRect = new Phaser.Geom.Rectangle(0, BOARD_Y, W, (rows + 2) * CELL);
    bindDirectionInput(this, (d) => this.game_.setDirection(d), boardRect);

    this.syncFruits();
    this.syncSnake();
    window.__demo = { scene: this, game: this.game_ };
  }

  drawBoard(cols, rows) {
    for (let y = -1; y <= rows; y++) {
      for (let x = -1; x <= cols; x++) {
        const { x: px, y: py } = this.cellPos(x, y);
        const fence = x < 0 || y < 0 || x >= cols || y >= rows;
        const key = fence ? 'fence' : ((x + y) % 2 ? 'grass1' : 'grass2');
        const s = this.add.image(px, py, key);
        if (fence) { s.setData('cell', `${x},${y}`); if (x < 0 || x >= cols) s.setAngle(90); }
      }
    }
  }

  drawHud() {
    this.add.rectangle(W / 2, 50, W, 100, 0x33691e);
    this.scoreText = this.add.text(16, 8, '', { fontFamily: FONT, fontSize: '26px', color: '#ffffff', fontStyle: 'bold' });
    this.timeText = this.add.text(W - 16, 8, '', { fontFamily: FONT, fontSize: '26px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(1, 0);
    this.fxText = this.add.text(W / 2, 12, '', { fontFamily: FONT, fontSize: '18px', color: '#fff59d', fontStyle: 'bold' }).setOrigin(0.5, 0);
    // 雙計量條：左「檢驗能量」、右「農藥風險」，各 barMax 格
    const mkBar = (x0, label, color) => {
      this.add.text(x0, 48, label, { fontFamily: FONT, fontSize: '16px', color: '#ffffff' });
      const segs = [];
      for (let i = 0; i < this.params.barMax; i++) {
        segs.push(this.add.rectangle(x0 + 72 + i * 9, 58, 7, 18, 0x1b2e0f).setOrigin(0, 0.5));
      }
      return { segs, color };
    };
    this.energyBar = mkBar(12, '檢驗能量', 0x42a5f5);
    this.riskBarUi = mkBar(282, '農藥風險', 0xff7043);
    this.add.text(W / 2, 80, '吃標章蔬果累積能量，避開風險蔬果', { fontFamily: FONT, fontSize: '13px', color: '#c5e1a5' }).setOrigin(0.5, 0);
    this.toast = this.add.text(W / 2, BOARD_Y + 40, '', {
      fontFamily: FONT, fontSize: '24px', color: '#ffffff', backgroundColor: '#000000aa', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(10).setVisible(false);
  }

  drawDpad() {
    const cx = 130, cy = 860, d = 72;
    const dirs = { up: [0, -1, '▲'], down: [0, 1, '▼'], left: [-1, 0, '◀'], right: [1, 0, '▶'] };
    for (const [dir, [dx, dy, label]] of Object.entries(dirs)) {
      const btn = this.add.rectangle(cx + dx * d, cy + dy * d, 66, 66, 0xffffff, 0.85).setStrokeStyle(3, 0x33691e).setInteractive();
      this.add.text(btn.x, btn.y, label, { fontFamily: FONT, fontSize: '28px', color: '#33691e' }).setOrigin(0.5);
      btn.on('pointerdown', () => { this.game_.setDirection(dir); btn.setFillStyle(0xc5e1a5, 1); });
      btn.on('pointerup', () => btn.setFillStyle(0xffffff, 0.85));
      btn.on('pointerout', () => btn.setFillStyle(0xffffff, 0.85));
    }
  }

  update(_t, dt) {
    if (!this.cutscene) this.handleEvents(this.game_.update(Math.min(dt, 100)));
    const g = this.game_;
    this.scoreText.setText(`分數 ${g.score}`);
    const r = Math.ceil(g.remainingSec);
    this.timeText.setText(g.gate ? '前往撤退點！' : `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`);
    this.paintBar(this.energyBar, g.energy);
    this.paintBar(this.riskBarUi, g.riskBar);
    const fx = g.effects, parts = [];
    if (fx.weirdo) parts.push(`農藥噴灑中 ${Math.ceil(fx.weirdo.ms / 1000)}s`);
    if (fx.ahong) parts.push(`無敵 ${Math.ceil(fx.ahong.ms / 1000)}s`);
    if (fx.cat) parts.push(`貓爪追擊 ${Math.ceil(fx.cat.ms / 1000)}s`);
    this.fxText.setText(parts.join('｜'));
    this.sprayOverlay.setVisible(!!fx.weirdo);
    if (this.snakeSprites[0]) {
      if (fx.ahong) this.snakeSprites[0].setTint(Math.floor(this.time.now / 120) % 2 ? 0xfff176 : 0xffffff);
      else this.snakeSprites[0].clearTint();
    }
  }

  handleEvents(events) {
    for (const e of events) {
      if (e.type === 'gateOpen') this.openGate(e.gate);
      if (e.type === 'eat') this.onEat(e);
      if (e.type === 'trigger') this.playCutscene(e.kind);
      if (e.type === 'eagle') this.flyAway(e.taken);
      if (e.type === 'die') this.showResult(false, DEATH_TEXT[e.cause]);
      if (e.type === 'pass') this.showResult(true, '成功抵達撤退點');
    }
    if (events.length) { this.syncFruits(); this.syncSnake(); this.syncCat(); }
  }

  paintBar(bar, value) {
    bar.segs.forEach((s, i) => s.setFillStyle(i < value ? bar.color : 0x1b2e0f));
  }

  // 過場小動畫：遊戲暫停，點擊可略過
  playCutscene(kind) {
    const c = EVENT_CONTENT[kind];
    const H = this.scale.height, risk = c.group === 'risk';
    const layer = this.add.container(0, 0).setDepth(30);
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setInteractive();
    const band = this.add.rectangle(W / 2, 430, W, 300, risk ? 0x4a148c : 0x1b5e20, 0.95);
    const tag = this.add.text(W / 2, 300, risk ? '⚠ 風險事件' : '★ 友情支援', {
      fontFamily: FONT, fontSize: '22px', color: risk ? '#ffab91' : '#fff59d', fontStyle: 'bold',
    }).setOrigin(0.5);
    const pic = this.add.image(-80, 420, c.sprite).setScale(4);
    // 文字區位於角色右側（x 200–520），自動換行
    const title = this.add.text(360, 370, c.title, { fontFamily: FONT, fontSize: '34px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setAlpha(0);
    const tip = this.add.text(360, 460, c.tip.replace('\n', ''), {
      fontFamily: FONT, fontSize: '19px', color: '#ffffff', align: 'center', lineSpacing: 6,
      wordWrap: { width: 310, useAdvancedWrap: true },
    }).setOrigin(0.5).setAlpha(0);
    const skip = this.add.text(W - 20, 560, '點擊略過 ▶', { fontFamily: FONT, fontSize: '16px', color: '#cccccc' }).setOrigin(1, 0.5);
    layer.add([bg, band, tag, pic, title, tip, skip]);
    this.tweens.add({ targets: pic, x: 110, duration: 450, ease: 'Back.Out' });
    this.tweens.add({ targets: [title, tip], alpha: 1, delay: 250, duration: 300 });
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      layer.destroy();
      this.cutscene = null;
      this.handleEvents(this.game_.resolvePending());
      if (kind === 'cat') this.showToast('快閃開貓爪！');
    };
    bg.on('pointerup', finish);
    this.cutscene = this.time.delayedCall(CUTSCENE_MS, finish);
  }

  flyAway(taken) {
    for (const f of taken) {
      const c = this.fruitSprites.get(f);
      if (!c) continue;
      this.fruitSprites.delete(f);
      this.tweens.add({ targets: c.obj, y: -40, angle: 180, alpha: 0, duration: 700, onComplete: () => c.obj.destroy() });
    }
  }

  syncCat() {
    const cat = this.game_.effects.cat;
    if (!cat) { this.catSprite?.destroy(); this.catSprite = null; return; }
    const p = this.cellPos(cat.x, cat.y);
    if (!this.catSprite) this.catSprite = this.add.image(p.x, p.y, 'paw').setDepth(6).setScale(1.3);
    this.tweens.add({ targets: this.catSprite, x: p.x, y: p.y, duration: 120 });
  }

  syncSnake() {
    const g = this.game_;
    while (this.snakeSprites.length < g.snake.length) this.snakeSprites.push(this.add.image(0, 0, 'body').setDepth(2));
    this.snakeSprites.forEach((s, i) => {
      const seg = g.snake[i];
      s.setVisible(!!seg);
      if (!seg) return;
      const p = this.cellPos(seg.x, seg.y);
      s.setPosition(p.x, p.y);
      if (i === 0) s.setTexture('head').setAngle(ANGLE[g.dir]).setDepth(3);
      else s.setTexture('body').setAngle(0).setDepth(2);
    });
  }

  syncFruits() {
    const alive = new Set(this.game_.fruits);
    // 已不在場上，或類型被事件改變（怪人／植醫）者重繪
    for (const [f, c] of this.fruitSprites) {
      if (!alive.has(f) || c.type !== f.type) { c.obj.destroy(); this.fruitSprites.delete(f); }
    }
    for (const f of this.game_.fruits) {
      if (this.fruitSprites.has(f)) continue;
      const p = this.cellPos(f.x, f.y);
      const parts = [this.add.image(0, 0, f.veg)];
      if (f.type === 'risk') { parts[0].setTint(0xc8b6d6); parts.push(this.add.image(0, 0, 'spray')); }
      if (f.type === 'safe') {
        parts.push(this.add.text(0, 11, f.label, {
          fontFamily: FONT, fontSize: '11px', color: '#1b5e20', backgroundColor: '#fff59d', padding: { x: 2, y: 0 }, fontStyle: 'bold',
        }).setOrigin(0.5, 0));
      }
      const c = this.add.container(p.x, p.y, parts).setDepth(1);
      this.tweens.add({ targets: c, scale: { from: 0.3, to: 1 }, duration: 200 });
      this.fruitSprites.set(f, { obj: c, type: f.type });
    }
  }

  onEat({ fruit, def }) {
    const p = this.cellPos(fruit.x, fruit.y);
    const t = this.add.text(p.x, p.y - 10, `${def.score > 0 ? '+' : ''}${def.score}`, {
      fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: def.score >= 0 ? '#ffffff' : '#ff8a80', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(9);
    this.tweens.add({ targets: t, y: p.y - 50, alpha: 0, duration: 700, onComplete: () => t.destroy() });
  }

  openGate(gate) {
    const p = this.cellPos(gate.x, gate.y);
    const glow = this.add.circle(p.x, p.y, CELL, 0xfff176, 0.7).setDepth(4);
    this.tweens.add({ targets: glow, scale: { from: 0.8, to: 1.6 }, alpha: { from: 0.8, to: 0 }, repeat: -1, duration: 900 });
    this.gateSprite = this.add.image(p.x, p.y, 'gate').setDepth(5);
    this.tweens.add({ targets: this.gateSprite, scale: { from: 1, to: 1.25 }, yoyo: true, repeat: -1, duration: 400 });
    this.showToast('撤退點出現了！前往農場木門');
  }

  showToast(msg, ms = 2000) {
    this.toast.setText(msg).setVisible(true);
    this.time.delayedCall(ms, () => this.toast.setVisible(false));
  }

  showResult(passed, reason) {
    const H = this.scale.height;
    const layer = this.add.container(0, 0).setDepth(20);
    layer.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6));
    layer.add(this.add.text(W / 2, 330, passed ? '過關！' : '挑戰失敗', {
      fontFamily: FONT, fontSize: '56px', fontStyle: 'bold', color: passed ? '#c5e1a5' : '#ffab91',
    }).setOrigin(0.5));
    layer.add(this.add.text(W / 2, 410, `${reason}\n本局分數 ${this.game_.score}`, {
      fontFamily: FONT, fontSize: '28px', color: '#ffffff', align: 'center', lineSpacing: 10,
    }).setOrigin(0.5));
    const btn = this.add.rectangle(W / 2, 530, 240, 70, 0x7cb342).setStrokeStyle(4, 0xffffff).setInteractive();
    layer.add(btn);
    layer.add(this.add.text(W / 2, 530, '再玩一次', { fontFamily: FONT, fontSize: '30px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5));
    btn.on('pointerup', () => this.scene.restart());
  }
}
