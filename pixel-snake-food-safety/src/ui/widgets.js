// 共用 UI 元件
import { FONT, W } from '../config/layout.js';

export function button(scene, x, y, label, onClick, { w = 300, h = 64, color = 0x7cb342, size = 26, icon = null } = {}) {
  const c = scene.add.container(x, y);
  const bg = scene.add.rectangle(0, 0, w, h, color).setStrokeStyle(4, 0xffffff).setInteractive({ useHandCursor: true });
  const parts = [bg];
  const text = scene.add.text(icon ? 18 : 0, 0, label, { fontFamily: FONT, fontSize: `${size}px`, color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
  if (icon) parts.push(scene.add.image(text.x - text.width / 2 - 26, 0, icon).setScale(1.2));
  parts.push(text);
  c.add(parts);
  bg.on('pointerdown', () => c.setScale(0.95));
  bg.on('pointerout', () => c.setScale(1));
  bg.on('pointerup', () => { c.setScale(1); onClick(); });
  return c;
}

export function header(scene, title, onBack) {
  scene.add.rectangle(W / 2, 45, W, 90, 0x33691e);
  scene.add.text(W / 2, 45, title, { fontFamily: FONT, fontSize: '32px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
  if (onBack) {
    const b = scene.add.image(45, 45, 'house').setScale(1.6).setInteractive({ useHandCursor: true });
    b.on('pointerup', onBack);
  }
}

export function text(scene, x, y, str, size = 22, color = '#ffffff', extra = {}) {
  return scene.add.text(x, y, str, { fontFamily: FONT, fontSize: `${size}px`, color, ...extra });
}
