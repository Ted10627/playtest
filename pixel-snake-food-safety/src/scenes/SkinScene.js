import Phaser from 'phaser';
import { W } from '../config/layout.js';
import { header, text } from '../ui/widgets.js';
import { loadSave, writeSave } from '../platform/storage.js';
import { SKINS, BACKGROUNDS } from '../config/cards.js';
import { isSkinUnlocked, isBgUnlocked } from '../logic/progress.js';
import { BG_TILES } from '../art/pixelArt.js';

export class SkinScene extends Phaser.Scene {
  constructor() { super('Skin'); }

  create() {
    this.cameras.main.setBackgroundColor('#f1f8e9');
    header(this, '造型設定', () => this.scene.start('Title'));
    this.layer = this.add.container(0, 0);
    this.render();
  }

  render() {
    const s = loadSave();
    this.layer.removeAll(true);
    const row = (title, y, items, isOn, unlocked, preview, pick) => {
      this.layer.add(text(this, 30, y - 145, title, 24, '#33691e', { fontStyle: 'bold' }));
      items.forEach((it, i) => {
        const x = W / 2 + (i - 1) * 165, open = unlocked(s, it.id), sel = isOn(s, it.id);
        const bg = this.add.rectangle(x, y, 150, 190, sel ? 0xfff59d : 0xffffff)
          .setStrokeStyle(sel ? 6 : 3, sel ? 0xef6c00 : 0x9e9e9e).setInteractive({ useHandCursor: open });
        this.layer.add(bg);
        const pv = preview(it, x, y - 30);
        if (!open) pv.forEach(o => o.setTint(0x777777));
        this.layer.add(pv);
        this.layer.add(text(this, x, y + 50, it.name, 17, '#333333', { fontStyle: 'bold' }).setOrigin(0.5));
        if (open) {
          bg.on('pointerup', () => { pick(s, it.id); writeSave(s); this.render(); });
          if (sel) this.layer.add(text(this, x, y + 78, '使用中', 15, '#ef6c00', { fontStyle: 'bold' }).setOrigin(0.5));
        } else {
          this.layer.add(this.add.image(x + 45, y - 70, 'lock').setScale(1.4));
          this.layer.add(text(this, x, y + 78, it.cond, 13, '#757575', { align: 'center', wordWrap: { width: 140, useAdvancedWrap: true } }).setOrigin(0.5));
        }
      });
    };
    row('角色造型（小安）', 330, SKINS, (s, id) => s.skin === id, isSkinUnlocked,
      (it, x, y) => [this.add.image(x, y, it.texture).setScale(3)], (s, id) => { s.skin = id; });
    row('關卡背景', 650, BACKGROUNDS, (s, id) => s.bg === id, isBgUnlocked,
      (it, x, y) => {
        const t = BG_TILES[it.id];
        const tiles = [];
        for (let i = 0; i < 9; i++) {
          const img = this.add.image(x - 30 + (i % 3) * 30, y - 30 + Math.floor(i / 3) * 30, t.keys[i % 2]);
          if (t.tint) img.setTint(t.tint);
          tiles.push(img);
        }
        return tiles;
      }, (s, id) => { s.bg = id; });
    this.layer.add(text(this, W / 2, 900, '選擇後即時套用並存檔', 18, '#757575').setOrigin(0.5));
  }
}
