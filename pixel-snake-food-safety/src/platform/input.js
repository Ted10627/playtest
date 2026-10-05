// 平台介接層：鍵盤（方向鍵／WASD）與畫面滑動。延伸至 App 時替換此層即可。
const KEYMAP = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
};

export function bindDirectionInput(scene, onDir, swipeArea) {
  scene.input.keyboard.on('keydown', (e) => {
    const d = KEYMAP[e.code];
    if (d) { e.preventDefault?.(); onDir(d); }
  });

  let start = null;
  scene.input.on('pointerdown', (p) => {
    if (swipeArea.contains(p.x, p.y)) start = { x: p.x, y: p.y };
  });
  scene.input.on('pointerup', (p) => {
    if (!start) return;
    const dx = p.x - start.x, dy = p.y - start.y;
    start = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    onDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });
}
