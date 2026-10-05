import Phaser from 'phaser';
import { W, H } from './config/layout.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { TutorialScene } from './scenes/TutorialScene.js';
import { GameScene } from './scenes/GameScene.js';
import { ResultScene } from './scenes/ResultScene.js';
import { DexScene } from './scenes/DexScene.js';
import { SkinScene } from './scenes/SkinScene.js';
import { unlockAudio, setAudioPrefs, bgmPlaying } from './platform/audio.js';
import { loadSave } from './platform/storage.js';

// 行動裝置自動播放限制：於使用者第一次觸控或按鍵後啟用音訊
const save = loadSave();
setAudioPrefs({ music: save.music, sfx: save.sfx });
window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('keydown', unlockAudio);
window.__audio = { bgmPlaying }; // 測試用

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
