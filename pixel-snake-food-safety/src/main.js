import Phaser from 'phaser';
import { W, H } from './config/layout.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { TutorialScene } from './scenes/TutorialScene.js';
import { GameScene } from './scenes/GameScene.js';
import { ResultScene } from './scenes/ResultScene.js';
import { DexScene } from './scenes/DexScene.js';
import { SkinScene } from './scenes/SkinScene.js';

window.__phaser = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: W,
  height: H,
  backgroundColor: '#1b1b1b',
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, TitleScene, TutorialScene, GameScene, ResultScene, DexScene, SkinScene],
});
