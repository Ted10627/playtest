import Phaser from 'phaser';
import { buildTextures } from '../art/pixelArt.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    buildTextures(this);
    this.scene.start('Game');
  }
}
