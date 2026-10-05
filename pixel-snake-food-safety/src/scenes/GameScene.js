import Phaser from 'phaser';
import { Game } from '../logic/game.js';
import { cloneParams } from '../config/params.js';
import { CELL, BG_TILES } from '../art/pixelArt.js';
import { bindDirectionInput } from '../platform/input.js';
import { loadSave, writeSave } from '../platform/storage.js';
import { applyResult, stepMsFor } from '../logic/progress.js';
import { FONT, W } from '../config/layout.js';
import { EVENT_CONTENT } from '../config/eventContent.js';
import { SKINS } from '../config/cards.js';

const BOARD_Y = 100;                 // 場地（含柵欄）上緣
const ANGLE = { up: 0, right: 90, down: 180, left: -90 };
const DEATH_TEXT = { fence: '撞到柵欄了', self: '撞到自己了', cat: '被貓爪抓到了' };
const CUTSCENE_MS = 2600;

export class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    this.save = loadSave();
    this.params = cloneParams();
    this.params.stepMs = stepMsFor(this.save, this.params.stepMs);
    this.headTex = SKINS.find(s => s.id === this.save.skin).texture;
    this.ended = false;
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
    this.iconSprites = new Map();
    this.magnetRing = this.add.circle(0, 0, (this.params.magnetRadius + 0.5) * CELL, 0xef5350, 0.12)
      .setStrokeStyle(3, 0xef5350, 0.8).setDepth(0.6).setVisible(false);
    this.drawHud();
    this.drawDpad();
    this.drawSkillButtons();

    const boardRect = new Phaser.Geom.Rectangle(0, BOARD_Y, W, (rows + 2) * CELL);
    bindDirectionInput(this, (d) => this.game_.setDirection(d), boardRect);

    this.syncFruits();
    this.syncSnake();
    window.__demo = { scene: this, game: this.game_ };
  }

  drawBoard(cols, rows) {
    const bg = BG_TILES[this.save.bg];
    for (let y = -1; y <= rows; y++) {
      for (let x = -1; x <= cols; x++) {
        const { x: px, y: py } = this.cellPos(x, y);
        const fence = x < 0 || y < 0 || x >= cols || y >= rows;
        const s = this.add.image(px, py, fence ? 'fence' : bg.keys[(x + y) % 2]);
        if (fence && (x < 0 || x >= cols)) s.setAngle(90);
        const tint = fence ? bg.fenceTint : bg.tint;
        if (tint) s.setTint(tint);
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

  // 右下角爸爸／媽媽常駐按鈕；桌機另支援 Q／E 鍵
  drawSkillButtons() {
    const defs = [
      { skill: 'dad', x: 345, name: '爸爸', desc: '磁鐵', key: 'Q' },
      { skill: 'mom', x: 470, name: '媽媽', desc: '清除風險', key: 'E' },
    ];
    this.skillUi = {};
    for (const d of defs) {
      const y = 860;
      const bg = this.add.rectangle(d.x, y, 112, 150, 0xffffff, 0.9).setStrokeStyle(4, 0x33691e).setInteractive();
      const pic = this.add.image(d.x, y - 38, d.skill).setScale(1.8);
      this.add.text(d.x, y + 14, `${d.name}\n${d.desc}`, {
        fontFamily: FONT, fontSize: '15px', color: '#33691e', fontStyle: 'bold', align: 'center', lineSpacing: 2,
      }).setOrigin(0.5);
      const pips = [0, 1].map(i => this.add.circle(d.x - 12 + i * 24, y + 52, 8, 0x33691e));
      const full = this.add.text(d.x, y + 52, 'FULL', { fontFamily: FONT, fontSize: '16px', color: '#ffffff', backgroundColor: '#e65100', padding: { x: 6, y: 1 }, fontStyle: 'bold' }).setOrigin(0.5);
      this.add.text(d.x + 48, y - 66, d.key, { fontFamily: FONT, fontSize: '13px', color: '#9e9e9e' }).setOrigin(1, 0);
      bg.on('pointerdown', () => this.useSkill(d.skill));
      this.skillUi[d.skill] = { bg, pic, pips, full };
    }
    this.input.keyboard.on('keydown-Q', () => this.useSkill('dad'));
    this.input.keyboard.on('keydown-E', () => this.useSkill('mom'));
  }

  useSkill(skill) {
    if (this.cutscene) return;
    this.handleEvents(this.game_.useSkill(skill));
  }

  paintSkills() {
    const max = this.params.skillCharges;
    for (const [skill, ui] of Object.entries(this.skillUi)) {
      const c = this.game_.skills[skill], ready = c >= max;
      ui.full.setVisible(ready);
      ui.pips.forEach((p, i) => p.setVisible(!ready).setFillStyle(i < c ? 0xffa000 : 0xbdbdbd));
      ui.bg.setFillStyle(ready ? 0xfff8e1 : 0xe0e0e0, 0.95);
      ui.pic.setAlpha(ready ? 1 : 0.45);
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
    if (fx.magnet) parts.push(`磁鐵 ${Math.ceil(fx.magnet.ms / 1000)}s`);
    this.fxText.setText(parts.join('｜'));
    this.sprayOverlay.setVisible(!!fx.weirdo);
    this.magnetRing.setVisible(!!fx.magnet);
    if (fx.magnet) { const p = this.cellPos(g.head.x, g.head.y); this.magnetRing.setPosition(p.x, p.y); }
    this.paintSkills();
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
      if (e.type === 'cleared') this.washAway(e.removed);
      if (e.type === 'skillUsed') this.showToast(e.skill === 'dad' ? '爸爸的磁鐵：吸引周圍蔬果！' : '媽媽出手：風險蔬果清潔溜溜！', 1500);
      if (e.type === 'iconEaten') this.showToast(`${e.icon.skill === 'dad' ? '爸爸' : '媽媽'}充能 ${e.charge}/${this.params.skillCharges}`, 1000);
      if (e.type === 'die') this.showResult(false, DEATH_TEXT[e.cause]);
      if (e.type === 'pass') this.showResult(true, '成功抵達撤退點');
    }
    if (events.length) { this.syncFruits(); this.syncSnake(); this.syncCat(); this.syncIcons(); }
  }

  syncIcons() {
    const alive = new Set(this.game_.icons);
    for (const [i, s] of this.iconSprites) if (!alive.has(i)) { s.destroy(); this.iconSprites.delete(i); }
    for (const i of this.game_.icons) {
      if (this.iconSprites.has(i)) continue;
      const p = this.cellPos(i.x, i.y);
      const s = this.add.image(p.x, p.y, i.skill === 'dad' ? 'magnet' : 'wash').setDepth(1);
      this.tweens.add({ targets: s, y: p.y - 4, yoyo: true, repeat: -1, duration: 400 });
      this.iconSprites.set(i, s);
    }
  }

  washAway(removed) {
    for (const f of removed) {
      const c = this.fruitSprites.get(f);
      if (!c) continue;
      this.fruitSprites.delete(f);
      const drop = this.add.image(c.obj.x, c.obj.y, 'wash').setDepth(7);
      this.tweens.add({ targets: drop, scale: 1.6, alpha: 0, duration: 500, onComplete: () => drop.destroy() });
      this.tweens.add({ targets: c.obj, alpha: 0, scale: 0.2, duration: 400, onComplete: () => c.obj.destroy() });
    }
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
      if (i === 0) s.setTexture(this.headTex).setAngle(ANGLE[g.dir]).setDepth(3);
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
      const existing = this.fruitSprites.get(f);
      if (existing) {
        // 被磁鐵吸動的蔬果：平滑移到新位置
        const p = this.cellPos(f.x, f.y);
        if (existing.obj.x !== p.x || existing.obj.y !== p.y) this.tweens.add({ targets: existing.obj, x: p.x, y: p.y, duration: 120 });
        continue;
      }
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

  // 結算：更新存檔（最高分、卡片解鎖）後進入結算畫面
  showResult(passed, reason) {
    if (this.ended) return;
    this.ended = true;
    const score = this.game_.score;
    const { save, newCards, newBest } = applyResult(this.save, { passed, score });
    writeSave(save);
    this.showToast(passed ? '過關！' : reason, 800);
    this.time.delayedCall(900, () => this.scene.start('Result', { passed, reason, score, best: save.best, newBest, newCards }));
  }
}
