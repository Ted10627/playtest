// 遊戲參數：預設值依需求規範書；規範書未定義者為暫定值，正式版由管理後台調整
export const DEFAULT_PARAMS = {
  cols: 16,
  rows: 20,
  stepMs: 170,            // 蛇每前進一格的毫秒數
  passTimeSec: 120,       // 基本通關時間，時間到出現撤退點
  fruitCount: 5,          // 場上同時存在的蔬果數

  // 蔬果類型：出現權重、分數、檢驗能量條、農藥風險條增減
  fruitTypes: {
    normal: { weight: 60, score: 10, energy: 1, risk: 1 },
    safe:   { weight: 25, score: 20, energy: 2, risk: 0 },
    risk:   { weight: 15, score: -15, energy: 0, risk: 2 },
  },
  spawnSafeAhead: 2,      // 補生時避開蛇頭前方格數
};

export function cloneParams(p = DEFAULT_PARAMS) {
  return JSON.parse(JSON.stringify(p));
}
