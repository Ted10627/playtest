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

  // 雙計量條
  barMax: 20,
  resetBarOnTrigger: true, // 觸發事件後該計量條歸零（暫定）
  riskEvents: { eagle: 1, weirdo: 1, cat: 1 },        // 風險事件權重
  supportEvents: { doctor: 1, aci: 1, ahong: 1 },     // 友情支援權重

  weirdoSec: 4.5,         // 怪人噴藥：蔬果轉為風險蔬果之秒數（規範書 4–5 秒）
  catSec: 6,              // 貓咪入侵：貓爪追擊秒數（暫定）
  catStepMs: 340,         // 貓爪每移動一格的毫秒數（暫定，約為蛇速一半）
  doctorSafeRatio: 0.3,   // 植醫：風險蔬果轉為標章蔬果之比例，其餘轉為一般蔬果
  aciExtraSafe: 3,        // 阿慈：額外增加之標章蔬果數（暫定）
  ahongSec: 4,            // 阿鴻：無敵秒數（規範書 3–5 秒）
  ahongRiskEnergy: 1,     // 阿鴻無敵期間吃到風險蔬果之能量增加值
};

export function cloneParams(p = DEFAULT_PARAMS) {
  return JSON.parse(JSON.stringify(p));
}
