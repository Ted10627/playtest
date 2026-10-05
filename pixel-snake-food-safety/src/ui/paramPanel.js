// 展示用參數面板：模擬管理後台「遊戲參數調整」，儲存後於下一局開始時套用
import { DEFAULT_PARAMS, getPath as get } from '../config/params.js';
import { loadParamOverrides, writeParamOverrides } from '../platform/storage.js';

const FIELDS = [
  ['通關時間（秒）', 'passTimeSec', 10, 300, 5],
  ['移動間隔（毫秒，越小越快）', 'stepMs', 80, 400, 10],
  ['一般蔬果分數', 'fruitTypes.normal.score', -50, 50, 1],
  ['標章蔬果分數', 'fruitTypes.safe.score', -50, 50, 1],
  ['風險蔬果分數', 'fruitTypes.risk.score', -50, 50, 1],
  ['一般蔬果：能量／風險', ['fruitTypes.normal.energy', 'fruitTypes.normal.risk'], 0, 5, 1],
  ['標章蔬果：能量', 'fruitTypes.safe.energy', 0, 5, 1],
  ['風險蔬果：風險', 'fruitTypes.risk.risk', 0, 5, 1],
  ['標章／風險蔬果出現權重', ['fruitTypes.safe.weight', 'fruitTypes.risk.weight'], 0, 100, 1],
  ['計量條格數', 'barMax', 5, 40, 1],
  ['怪人噴藥秒數', 'weirdoSec', 1, 10, 0.5],
  ['貓爪追擊秒數', 'catSec', 1, 15, 1],
  ['阿鴻無敵秒數', 'ahongSec', 1, 10, 0.5],
  ['爸爸磁鐵秒數', 'magnetSec', 1, 10, 0.5],
  ['充能圖示間隔（最短／最長秒）', ['iconMinSec', 'iconMaxSec'], 1, 60, 1],
];

export function openParamPanel() {
  if (document.getElementById('param-panel')) return;
  const ov = loadParamOverrides();
  const cur = path => ov[path] ?? get(DEFAULT_PARAMS, path);
  const wrap = document.createElement('div');
  wrap.id = 'param-panel';
  wrap.innerHTML = `
    <div class="pp-box">
      <h2>遊戲參數調整 <small>展示用（模擬管理後台）</small></h2>
      <p class="pp-note">儲存後於下一局開始時套用，無須改版。</p>
      <div class="pp-grid">
        ${FIELDS.map(([label, paths, min, max, step]) => `
          <label>${label}</label>
          <div>${[].concat(paths).map(p => `<input type="number" data-path="${p}" min="${min}" max="${max}" step="${step}" value="${cur(p)}">`).join('')}</div>`).join('')}
      </div>
      <div class="pp-actions">
        <button data-act="save">儲存</button><button data-act="reset">恢復預設</button><button data-act="close">關閉</button>
      </div>
    </div>`;
  const style = document.createElement('style');
  style.textContent = `
    #param-panel { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center;
      z-index: 10; font-family: 'Noto Sans TC','Microsoft JhengHei',sans-serif; touch-action: auto; }
    .pp-box { background: #f1f8e9; color: #1b2e0f; width: min(480px, calc(100vw - 32px)); max-height: calc(100vh - 32px); overflow: auto;
      border: 4px solid #33691e; border-radius: 8px; padding: 16px; box-sizing: border-box; }
    .pp-box h2 { margin: 0 0 4px; font-size: 20px; } .pp-box h2 small { font-size: 13px; color: #6d4c41; font-weight: normal; }
    .pp-note { margin: 0 0 12px; font-size: 13px; color: #555; }
    .pp-grid { display: grid; grid-template-columns: 1fr auto; gap: 8px 12px; align-items: center; font-size: 14px; }
    .pp-grid input { width: 64px; margin-left: 4px; padding: 4px; font-size: 14px; }
    .pp-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
    .pp-actions button { padding: 8px 14px; font-size: 15px; border: 0; border-radius: 4px; background: #7cb342; color: #fff; cursor: pointer; }
    .pp-actions button[data-act="reset"] { background: #8d6e63; } .pp-actions button[data-act="close"] { background: #9e9e9e; }`;
  wrap.appendChild(style);
  document.body.appendChild(wrap);
  // 面板輸入時不讓鍵盤事件傳到遊戲
  wrap.addEventListener('keydown', e => e.stopPropagation());
  wrap.addEventListener('click', (e) => {
    const act = e.target.dataset?.act;
    if (act === 'save') {
      const out = {};
      wrap.querySelectorAll('input').forEach(i => {
        const v = Number(i.value);
        if (Number.isFinite(v) && v !== get(DEFAULT_PARAMS, i.dataset.path)) out[i.dataset.path] = v;
      });
      writeParamOverrides(out);
      wrap.remove();
    } else if (act === 'reset') {
      writeParamOverrides({});
      wrap.remove();
    } else if (act === 'close' || e.target === wrap) {
      wrap.remove();
    }
  });
}
