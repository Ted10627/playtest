import Phaser from 'phaser';
import { W, H } from '../config/layout.js';
import { button, header, text } from '../ui/widgets.js';
import { loadSave, writeSave } from '../platform/storage.js';
import { ALL_CARDS } from '../config/cards.js';

export class DexScene extends Phaser.Scene {
  constructor() { super('Dex'); }

  create() {
    this.save = loadSave();
    this.cameras.main.setBackgroundColor('#f1f8e9');
    header(this, '農安知識圖鑑', () => this.scene.start('Title'));
    text(this, W / 2, 115, `已收集 ${this.save.cards} / ${ALL_CARDS.length}`, 20, '#33691e').setOrigin(0.5);

    const cols = 4, cw = 120, ch = 150, x0 = W / 2 - (cols - 1) * cw / 2;
    ALL_CARDS.forEach((c, i) => {
      const x = x0 + (i % cols) * cw, y = 220 + Math.floor(i / cols) * (ch + 12);
      const limited = typeof c.no === 'string';
      const open = i < this.save.cards;
      const bg = this.add.rectangle(x, y, cw - 12, ch, open ? 0xfffde7 : 0xcfd8dc)
        .setStrokeStyle(3, limited ? 0xe65100 : 0x558b2f).setInteractive({ useHandCursor: open });
      text(this, x, y - ch / 2 + 14, limited ? '限定' : `No.${c.no}`, 15, limited ? '#e65100' : '#558b2f', { fontStyle: 'bold' }).setOrigin(0.5);
      if (open) {
        this.add.image(x, y - 10, c.icon).setScale(2);
        text(this, x, y + 46, c.title, 14, '#1b5e20', { align: 'center', wordWrap: { width: cw - 20, useAdvancedWrap: true } }).setOrigin(0.5);
        bg.on('pointerup', () => this.showDetail(c));
      } else {
        this.add.image(x, y + 4, 'lock').setScale(2.2);
      }
    });
  }

  showDetail(c) {
    const limited = typeof c.no === 'string';
    const m = this.add.container(0, 0).setDepth(10);
    m.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setInteractive());
    m.add(this.add.rectangle(W / 2, 470, 460, 640, 0xfffde7).setStrokeStyle(6, limited ? 0xe65100 : 0x558b2f));
    m.add(text(this, W / 2, 190, limited ? '限定卡' : `農安知識卡 No.${c.no}`, 20, '#6d4c41').setOrigin(0.5));
    m.add(text(this, W / 2, 235, c.title, 30, '#1b5e20', { fontStyle: 'bold' }).setOrigin(0.5));
    m.add(this.add.rectangle(W / 2, 360, 200, 180, 0x9ccc65).setStrokeStyle(3, 0x558b2f));
    m.add(this.add.image(W / 2, 360, c.icon).setScale(5));
    m.add(text(this, W / 2, 470, c.text, 21, '#333333', { lineSpacing: 8, wordWrap: { width: 400, useAdvancedWrap: true } }).setOrigin(0.5, 0));
    if (limited) {
      m.add(text(this, W / 2, 640, `特殊功能：${c.featureText}`, 18, '#e65100', { fontStyle: 'bold' }).setOrigin(0.5));
      const on = this.featureOn(c.feature);
      m.add(button(this, W / 2, 690, on ? '特殊功能：已開啟' : '特殊功能：已關閉', () => {
        this.toggleFeature(c.feature);
        m.destroy();
        this.showDetail(c);
      }, { w: 280, h: 52, size: 20, color: on ? 0xef6c00 : 0x9e9e9e }));
    }
    m.add(button(this, W / 2, 750, '關閉', () => m.destroy(), { w: 160, h: 50, size: 20 }));
  }

  featureOn(f) {
    const s = this.save;
    return f === 'skin2' ? s.skin === 'skin2' : f === 'bgNight' ? s.bg === 'night' : s.speedOn;
  }

  toggleFeature(f) {
    const s = this.save, on = this.featureOn(f);
    if (f === 'skin2') s.skin = on ? 'base' : 'skin2';
    else if (f === 'bgNight') s.bg = on ? 'field' : 'night';
    else s.speedOn = !on;
    writeSave(s);
  }
}
