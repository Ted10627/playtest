import Phaser from 'phaser';
import { W, FONT } from '../config/layout.js';
import { button, text } from '../ui/widgets.js';
import { loadSave, writeSave } from '../platform/storage.js';
import { SKINS } from '../config/cards.js';
import { startBgm, setAudioPrefs } from '../platform/audio.js';
import { openParamPanel } from '../ui/paramPanel.js';

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    const save = loadSave();
    // 背景：草地格
    for (let y = 0; y < 32; y++) for (let x = 0; x < 18; x++) {
      this.add.image(x * 30 + 15, y * 30 + 15, (x + y) % 2 ? 'grass1' : 'grass2');
    }
    this.add.rectangle(W / 2, 480, W, 960, 0x000000, 0.25);

    text(this, W / 2, 130, '食在安心', 64, '#fff59d', { fontStyle: 'bold', stroke: '#33691e', strokeThickness: 10 }).setOrigin(0.5);
    text(this, W / 2, 205, '像素大冒險', 48, '#ffffff', { fontStyle: 'bold', stroke: '#33691e', strokeThickness: 8 }).setOrigin(0.5);
    text(this, W / 2, 255, '遊戲功能展示 Demo', 18, '#e8f5e9').setOrigin(0.5);

    // 小安帶著蔬果籃走過
    const headTex = SKINS.find(s => s.id === save.skin).texture;
    const parade = this.add.container(-120, 330, [
      this.add.image(90, 0, headTex).setAngle(90).setScale(1.5),
      this.add.image(45, 0, 'body').setScale(1.5),
      this.add.image(0, 0, 'body').setScale(1.5),
    ]);
    this.tweens.add({ targets: parade, x: W + 120, duration: 5000, repeat: -1 });
    ['cabbage', 'carrot', 'tomato'].forEach((k, i) => this.add.image(170 + i * 100, 390, k).setScale(1.6));

    const start = () => this.scene.start(save.tutorialSeen ? 'Game' : 'Tutorial', { thenPlay: true });
    button(this, W / 2, 490, '開始遊戲', start, { w: 320, h: 76, size: 32, color: 0xef6c00 });
    button(this, W / 2, 585, '遊玩教學', () => this.scene.start('Tutorial'));
    button(this, W / 2, 665, '圖鑑', () => this.scene.start('Dex'));
    button(this, W / 2, 745, '造型設定', () => this.scene.start('Skin'));
    button(this, W / 2, 825, '排行榜（正式版提供）', () => {}, { color: 0x9e9e9e, size: 22 });

    text(this, W / 2, 900, `歷史最高分 ${save.best}　｜　已收集卡片 ${save.cards} / 13`, 18, '#ffffff').setOrigin(0.5);
    text(this, W / 2, 935, '畫面為像素佔位美術，正式版依《食農探險繪本》角色重繪', 13, '#c5e1a5', { fontFamily: FONT }).setOrigin(0.5);

    // 音樂、音效分別開關（存檔保存）
    const toggle = (x, key, label) => {
      const t = text(this, x, 24, '', 17, '#ffffff', { backgroundColor: '#00000066', padding: { x: 8, y: 4 } })
        .setOrigin(1, 0).setInteractive({ useHandCursor: true });
      const paint = () => t.setText(`${label}：${save[key] ? '開' : '關'}`);
      t.on('pointerup', () => {
        save[key] = !save[key];
        writeSave(save);
        setAudioPrefs({ music: save.music, sfx: save.sfx });
        paint();
      });
      paint();
    };
    toggle(W - 16, 'sfx', '音效');
    toggle(W - 120, 'music', '音樂');

    // 展示用參數面板（模擬管理後台之遊戲參數調整）
    const pp = text(this, 16, 24, '⚙ 參數調整', 17, '#ffffff', { backgroundColor: '#00000066', padding: { x: 8, y: 4 } })
      .setInteractive({ useHandCursor: true });
    pp.on('pointerup', openParamPanel);

    startBgm();
  }
}
