import Phaser from 'phaser';
import { W } from '../config/layout.js';
import { button, text } from '../ui/widgets.js';

export class ResultScene extends Phaser.Scene {
  constructor() { super('Result'); }

  create({ passed, reason, score, best, newBest, newCards }) {
    this.cameras.main.setBackgroundColor(passed ? '#33691e' : '#4e342e');
    text(this, W / 2, 130, passed ? '過關！' : '挑戰失敗', 64, passed ? '#fff59d' : '#ffab91', { fontStyle: 'bold' }).setOrigin(0.5);
    text(this, W / 2, 200, reason, 26).setOrigin(0.5);

    this.add.rectangle(W / 2, 320, 440, 150, 0x000000, 0.25).setStrokeStyle(2, 0xffffff, 0.5);
    text(this, W / 2, 280, `本局分數　${score}`, 34, '#ffffff', { fontStyle: 'bold' }).setOrigin(0.5);
    text(this, W / 2, 345, `歷史最高分　${best}`, 26).setOrigin(0.5);
    if (newBest) text(this, W / 2 + 150, 345, 'NEW!', 20, '#ffeb3b', { fontStyle: 'bold' }).setOrigin(0.5);

    text(this, W / 2, 440, '本局新解鎖', 22, '#c5e1a5').setOrigin(0.5);
    if (newCards.length) {
      const c = newCards[0];
      const card = this.add.container(W / 2, 540);
      card.add(this.add.rectangle(0, 0, 300, 130, 0xfffde7).setStrokeStyle(4, typeof c.no === 'string' ? 0xe65100 : 0x558b2f));
      card.add(this.add.image(-100, 0, c.icon).setScale(2.4));
      card.add(text(this, 20, -30, typeof c.no === 'string' ? '限定卡' : `知識卡 No.${c.no}`, 18, '#6d4c41').setOrigin(0.5));
      card.add(text(this, 20, 12, c.title, 22, '#1b5e20', { fontStyle: 'bold', wordWrap: { width: 180, useAdvancedWrap: true }, align: 'center' }).setOrigin(0.5));
      this.tweens.add({ targets: card, scaleX: { from: 0, to: 1 }, duration: 400, ease: 'Back.Out' });
    } else {
      text(this, W / 2, 540, passed ? '已收集全部卡片！' : '過關就能解鎖新的知識卡', 20, '#ffffff').setOrigin(0.5);
    }

    button(this, W / 2, 700, '再玩一次', () => this.scene.start('Game'), { w: 320, h: 72, size: 30, color: 0xef6c00 });
    button(this, W / 2 - 85, 800, '查看圖鑑', () => this.scene.start('Dex'), { w: 160, size: 22 });
    button(this, W / 2 + 85, 800, '回標題', () => this.scene.start('Title'), { w: 160, size: 22, icon: 'house', color: 0x8d6e63 });
  }
}
