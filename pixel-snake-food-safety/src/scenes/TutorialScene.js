import Phaser from 'phaser';
import { W } from '../config/layout.js';
import { button, header, text } from '../ui/widgets.js';
import { loadSave, writeSave } from '../platform/storage.js';

// 分頁圖文教學；圖片使用遊戲內實際素材
const PAGES = [
  { title: '遊戲目標', imgs: ['head', 'body', 'body'],
    body: '操控小安在農場裡移動，吃蔬果累積分數。\n大約 2 分鐘後，場邊會出現「農場木門」撤退點，走進去就過關！\n\n小心：撞到柵欄或自己的身體就會失敗。' },
  { title: '移動操作', imgs: ['head'],
    body: '電腦：方向鍵或 W A S D。\n手機、平板：在場地上滑動，或按左下角的虛擬方向鍵。' },
  { title: '蔬果與計分', imgs: ['cabbage', 'carrot', 'tomato'],
    body: '一般蔬果：+10 分\n安全標章蔬果（有機、CAS、產銷履歷、QR）：+20 分\n風險蔬果（有噴霧點點）：−15 分\n\n認明標章，分數更高！' },
  { title: '雙計量條', imgs: ['wash', 'spray'],
    body: '檢驗能量條：吃一般 +1、標章 +2。\n農藥風險條：吃一般 +1、風險蔬果 +2。\n\n能量條滿 20 格 → 友情支援！\n風險條滿 20 格 → 風險事件！' },
  { title: '爸爸與媽媽', imgs: ['dad', 'mom'],
    body: '爸爸（磁鐵）：把周圍的蔬果吸過來。\n媽媽：把場上的風險蔬果全部清掉。\n\n用過一次後，要吃到場上的磁鐵／水滴圖示兩次才能再用。' },
  { title: '友情支援與風險事件', imgs: ['doctor', 'aci', 'ahong', 'eagle', 'weirdo', 'cat'],
    body: '友情支援：植物診療師、阿慈、阿鴻會來幫忙。\n風險事件：老鷹、怪人、貓咪會來搗亂，\n遇到貓爪要趕快閃開！' },
  { title: '圖鑑收集', imgs: ['lock'],
    body: '每過關一次，就能解鎖一張農安知識卡。\n集滿 10 張後，還有限定卡等你收集，\n可以解鎖新造型、新背景和特殊功能！' },
];

export class TutorialScene extends Phaser.Scene {
  constructor() { super('Tutorial'); }

  init(data) { this.thenPlay = !!data?.thenPlay; this.page = 0; }

  create() {
    this.cameras.main.setBackgroundColor('#f1f8e9');
    header(this, '遊玩教學', () => this.finish(false));
    this.layer = this.add.container(0, 0);
    this.dots = PAGES.map((_, i) => this.add.circle(W / 2 - (PAGES.length - 1) * 12 + i * 24, 780, 7, 0x9e9e9e));
    this.prevBtn = button(this, 130, 860, '上一頁', () => this.go(-1), { w: 200, color: 0x8d6e63 });
    this.nextBtn = button(this, W - 130, 860, '下一頁', () => this.go(1), { w: 200 });
    this.render();
  }

  go(d) {
    if (this.page + d >= PAGES.length) return this.finish(true);
    this.page = Math.max(0, this.page + d);
    this.render();
  }

  render() {
    const p = PAGES[this.page];
    this.layer.removeAll(true);
    this.layer.add(text(this, W / 2, 150, `${this.page + 1}. ${p.title}`, 34, '#33691e', { fontStyle: 'bold' }).setOrigin(0.5));
    const n = p.imgs.length, gap = Math.min(110, 460 / n);
    p.imgs.forEach((k, i) => {
      const x = W / 2 - (n - 1) * gap / 2 + i * gap;
      this.layer.add(this.add.rectangle(x, 300, gap - 12, gap - 12, 0x9ccc65).setStrokeStyle(3, 0x558b2f));
      this.layer.add(this.add.image(x, 300, k).setScale(Math.min(3, (gap - 24) / 30)));
    });
    this.layer.add(text(this, W / 2, 400, p.body, 22, '#333333', { align: 'center', lineSpacing: 10, wordWrap: { width: 470, useAdvancedWrap: true } }).setOrigin(0.5, 0));
    this.dots.forEach((d, i) => d.setFillStyle(i === this.page ? 0x33691e : 0xbdbdbd));
    this.prevBtn.setVisible(this.page > 0);
    this.nextBtn.list[this.nextBtn.list.length - 1].setText(this.page === PAGES.length - 1 ? (this.thenPlay ? '開始遊戲' : '完成') : '下一頁');
  }

  finish(completed) {
    if (completed) { const s = loadSave(); s.tutorialSeen = true; writeSave(s); }
    this.scene.start(completed && this.thenPlay ? 'Game' : 'Title');
  }
}
