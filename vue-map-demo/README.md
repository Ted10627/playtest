# vue-map-demo

Vue 3 + Vite 示範專案：**網頁嵌入地圖、同時放多個地點標記，並透過網頁按鈕互動篩選**（food / parking / bus-stop）。

提供兩種地圖實作互相對照：

| 頁面 | 服務 | 是否需要金鑰 |
| --- | --- | --- |
| `/leaflet` | Leaflet + OpenStreetMap | ❌ 免金鑰，開箱即用 |
| `/google` | Google Maps JavaScript API | ✅ 需 API Key |

## 快速開始

```bash
cd vue-map-demo
npm install
npm run dev
```

打開終端機顯示的網址（預設 http://localhost:5173 ）。

- 先看 **Leaflet** 頁，免任何設定即可看到多標記 + 篩選按鈕。
- 想看 **Google Maps** 頁，請設定 API Key（見下）。

## 設定 Google Maps API Key

```bash
cp .env.example .env
```

編輯 `.env`：

```
VITE_GOOGLE_MAPS_API_KEY=你的金鑰
```

金鑰取得：Google Cloud Console → 啟用「Maps JavaScript API」→ 建立 API 金鑰 → 綁定計費帳號。
（`.env` 已被 `.gitignore` 排除，不會進版控。）

## 核心架構

```
src/
├── data/places.js              # 地點資料 + 分類設定（食/停/公車）
├── composables/
│   └── usePlaceFilters.js      # 篩選邏輯：啟用分類 → filteredPlaces
├── components/
│   └── FilterBar.vue           # 篩選按鈕列
├── views/
│   ├── HomeView.vue
│   ├── LeafletView.vue         # Leaflet 地圖實作
│   └── GoogleMapView.vue       # Google Maps 實作
├── router/index.js
├── App.vue
└── main.js
```

**運作原理（兩種地圖共用同一套思路）：**

1. 地點資料每筆帶 `category`。
2. `usePlaceFilters` 維護「啟用中的分類集合」，算出 `filteredPlaces`。
3. 按鈕切換分類 → `watch(filteredPlaces)` 觸發 → 清掉舊標記、依新清單重畫。

把 `places.js` 換成你自己的後端 API 資料，即可套用到實際專案。

## 指令

| 指令 | 說明 |
| --- | --- |
| `npm run dev` | 啟動開發伺服器 |
| `npm run build` | 打包到 `dist/` |
| `npm run preview` | 本機預覽打包結果 |
