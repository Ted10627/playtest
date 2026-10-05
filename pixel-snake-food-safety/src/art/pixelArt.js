// 像素佔位美術：以字元陣列定義，啟動時繪製成材質。正式版替換為美術定稿素材。
export const CELL = 30;   // 場地每格像素（10x10 圖 × 3 倍）
const PX = 3;

const PAL = {
  k: '#2b2b2b', w: '#ffffff', s: '#ffcc99', c: '#f48fb1', r: '#e53935', R: '#b71c1c',
  g: '#4caf50', G: '#2e7d32', l: '#a5d6a7', o: '#fb8c00', O: '#e65100', y: '#fdd835',
  b: '#a1887f', B: '#6d4c41', D: '#4e342e', M: '#8bc34a', L: '#9ccc65', p: '#8e24aa', P: '#ce93d8',
};

const SPRITES = {
  // 小安（蛇頭，朝上）
  head: [
    '...kkkk...',
    '..kGGGGk..',
    '.kggggggk.',
    'kGGGGGGGGk',
    'kssssssssk',
    'kskssssksk',
    'kcssssssck',
    'ksssrrsssk',
    '.kssssssk.',
    '..kkkkkk..',
  ],
  // 蛇身：蔬果籃（暫定）
  body: [
    '.kkkkkkkk.',
    'kbbBbbBbbk',
    'kBBBBBBBBk',
    'kbBbbBbbBk',
    'kBBBBBBBBk',
    'kbbBbbBbbk',
    'kBBBBBBBBk',
    'kbBbbBbbBk',
    'kBBBBBBBBk',
    '.kkkkkkkk.',
  ],
  grass1: [
    'MMMMMMMMMM', 'MMMMMMMLMM', 'MLMMMMMMMM', 'MMMMMMMMMM', 'MMMMLMMMMM',
    'MMMMMMMMMM', 'MMMMMMMMLM', 'MMLMMMMMMM', 'MMMMMMMMMM', 'MMMMMMLMMM',
  ],
  grass2: [
    'LLLLLLLLLL', 'LLLLMLLLLL', 'LLLLLLLLLL', 'LMLLLLLLML', 'LLLLLLLLLL',
    'LLLLLLLLLL', 'LLLLLLMLLL', 'LLLLLLLLLL', 'LLMLLLLLLL', 'LLLLLLLLLL',
  ],
  fence: [
    'DBBBBBBBBD', 'DbbbbbbbbD', 'DBBBBBBBBD', 'DDDDDDDDDD', 'DBBBBBBBBD',
    'DbbbbbbbbD', 'DBBBBBBBBD', 'DDDDDDDDDD', 'DBBBBBBBBD', 'DbbbbbbbbD',
  ],
  // 撤退點：農場木門
  gate: [
    '.kkkkkkkk.',
    'kyyyyyyyyk',
    'kBbBbbBbBk',
    'kBbBbbBbBk',
    'kBbBbbBbBk',
    'kBbBkkBbBk',
    'kBbBkkBbBk',
    'kBbBbbBbBk',
    'kBbBbbBbBk',
    'kkkkkkkkkk',
  ],
  cabbage: [
    '....GG....',
    '..GgggG...',
    '.GglgglgG.',
    'GglggggglG',
    'GgggllgggG',
    'GglgggglgG',
    'GgggggggGG',
    '.GglgglgG.',
    '..GGgggG..',
    '....GG....',
  ],
  carrot: [
    '...g..g...',
    '....gg.g..',
    '...ggGg...',
    '...OooO...',
    '...oooo...',
    '...OooO...',
    '....oo....',
    '....Oo....',
    '....oo....',
    '.....O....',
  ],
  tomato: [
    '....gG....',
    '...GggG...',
    '..rRgGRr..',
    '.rrrrrrrr.',
    'rrwrrrrrrR',
    'rwrrrrrrrR',
    'rrrrrrrrrR',
    '.rrrrrrRR.',
    '..RRRRRR..',
    '..........',
  ],
  // ---- 事件角色（佔位）----
  eagle: [
    '..........',
    'B.......B.',
    'BB.....BB.',
    'BBB.kk.BBB',
    '.BBBwkBBB.',
    '..BBByyB..',
    '...BBBB...',
    '...BbbB...',
    '....yy....',
    '...y..y...',
  ],
  weirdo: [
    '..kkkkkk..',
    '.kppppppk.',
    '.kpwkpwkk.',
    '.kPPPPPPk.',
    '..kPPPPk..',
    '.kpppppppk',
    'kpppppppgk',
    'kppkppkggk',
    '.kk.kk.kk.',
    '.k...k....',
  ],
  cat: [
    'o.......o.',
    'oo.....oo.',
    'ooooooooo.',
    'okwoooowko',
    'ooooooooo.',
    'ooookoooo.',
    '.oowwwoo..',
    '..ooooo...',
    '..........',
    '..........',
  ],
  paw: [
    '.oo....oo.',
    'oOOo..oOOo',
    'oOOo..oOOo',
    '.oo.oo.oo.',
    '...oOOo...',
    '..oooooo..',
    '.oooooooo.',
    '.oowwwwoo.',
    '..oooooo..',
    '...oooo...',
  ],
  doctor: [
    '..kkkkkk..',
    '.kDDDDDDk.',
    '.kssssssk.',
    '.kskssksk.',
    '..kssssk..',
    '.kwwrwwwk.',
    'kwwwrwwwwk',
    'kwwrrrwwwk',
    'kwwwwwwwwk',
    '.kk....kk.',
  ],
  aci: [
    '..kDDDDk..',
    '.kDDDDDDk.',
    '.kDssssDk.',
    '.kskssksk.',
    '..kscsck..',
    '.kyyyyyyk.',
    'kyggggggyk',
    'kygGGGGgyk',
    '.kggggggk.',
    '..kk..kk..',
  ],
  ahong: [
    '...yyyy...',
    'yyyyyyyyyy',
    '.kssssssk.',
    '.kskssksk.',
    '..kssssk..',
    '.kGGGGGGk.',
    'kGgGGGGgGk',
    'kGGGGGGGGk',
    '.kBBBBBBk.',
    '..kk..kk..',
  ],
  // 風險蔬果之農藥噴霧標記（疊加於蔬果上）
  spray: [
    'P.....p...',
    '.p.......P',
    '....P.....',
    'p.........',
    '.......p..',
    '..p.......',
    '.........p',
    'P....P....',
    '..........',
    '.p......P.',
  ],
};

export function buildTextures(scene) {
  for (const [key, rows] of Object.entries(SPRITES)) {
    if (scene.textures.exists(key)) continue;
    const tex = scene.textures.createCanvas(key, rows[0].length * PX, rows.length * PX);
    const ctx = tex.getContext();
    rows.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === '.') return;
      ctx.fillStyle = PAL[ch];
      ctx.fillRect(x * PX, y * PX, PX, PX);
    }));
    tex.refresh();
  }
}
