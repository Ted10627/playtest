# Google 地圖教學：多標記 + 按鈕篩選

## 一、這份範例包含什麼

```
Google地圖教學範例/
├── README.md
└── index.html
```

只有「一個 HTML 檔」，不需要安裝任何東西。打開它就能看到成品。

---

## 二、打開範例

範例已經內建一把免費的「測試金鑰」，**不用申請就能先跑跑看**。但請注意打開方式：

### 建議：用 VS Code 的 Live Server 打開

1. 安裝 [VS Code](https://code.visualstudio.com/)
2. 在 VS Code 的擴充功能（Extensions）搜尋 **Live Server**，安裝。
3. 用 VS Code 打開 `01_最小範例` 資料夾。
4. 在 `index.html` 上按右鍵 →「**Open with Live Server**」。
5. 瀏覽器會自動打開，看到地圖與三顆篩選按鈕。

---

## 三、關於「免費測試金鑰（Demo Key）」

範例 `index.html` 最底下這行，`key=` 後面那串就是金鑰：

```html
<script
  async
  src="https://maps.googleapis.com/maps/api/js?key=這裡是金鑰&callback=initMap"
></script>
```

- **是什麼**：Google 官方提供的試用金鑰，**免信用卡、免計費帳號**，只要 Google 帳號就能拿。
- **用途**：適合學習、做原型、驗證可行性。
- **限制**：有**每日用量上限**，超過會暫停 24 小時（不會扣款）；**不適合正式上線**。
- **取得自己的 demo key**（建議申請一把，避免撞到每日上限）： https://mapsplatform.google.com/intl/zh-TW_tw/maps-demo-key/

> 將來要正式上線時，再到 Google Cloud Console 申請「標準金鑰」並綁定計費帳號即可，程式不用改。

---

## 四、程式（對照 index.html）

程式其實只有三步，建議打開 `index.html` 邊看註解邊對照：

### 1️：準備資料

- `categories`：三種分類（food / parking / bus-stop），各自有顏色與文字。
- `places`：地點清單，每筆有「名稱、分類、緯度 lat、經度 lng」。

### 2️：把地圖和標記畫出來（`initMap`）

- `new google.maps.Map(...)`：建立地圖，設定中心點與縮放。注意地圖要帶 `mapId`，新版標記才能用。
- 用迴圈把每個地點變成一個 `new AdvancedMarkerElement(...)`，彩色圖釘用 `new PinElement(...)` 做，放上地圖。
- 點標記會跳出 `InfoWindow`（資訊小視窗）顯示名稱。

### 3️：按鈕篩選（`buildButtons` + `applyFilter`）

- 用一個 `Set`（`activeCategories`）記住「目前開著哪些分類」。
- 按按鈕 → 切換該分類的開/關 → 呼叫 `applyFilter()`。
- `applyFilter()` 逐一檢查每個標記：該分類有開就 `marker.map = map`（顯示），沒開就 `marker.map = null`（隱藏）。

> 「資料帶分類 → 按鈕切換要顯示的分類 → 重新決定每個標記顯示或隱藏。」

---

## 五、官方文件

| 主題                           | 對應範例的部分              | 官方文件                                                                                         |
| ------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------ |
| 放上第一張地圖                 | `initMap` 建立地圖          | https://developers.google.com/maps/documentation/javascript/adding-a-google-map                  |
| 新版標記 AdvancedMarkerElement | `new AdvancedMarkerElement` | https://developers.google.com/maps/documentation/javascript/advanced-markers/overview            |
| 彩色圖釘 PinElement            | `new PinElement`            | https://developers.google.com/maps/documentation/javascript/advanced-markers/basic-customization |
| 資訊視窗 InfoWindow            | 點標記跳視窗                | https://developers.google.com/maps/documentation/javascript/infowindows                          |
| 載入 API 的方式                | 最底下那行 `<script>`       | https://developers.google.com/maps/documentation/javascript/load-maps-js-api                     |

> 補充：
>
> - 範例已改用官方推薦的新版標記 **AdvancedMarkerElement**，舊版 `google.maps.Marker` 已標為 legacy，知道有這個歷史即可。新舊差異看這頁：https://developers.google.com/maps/documentation/javascript/advanced-markers/migration?hl=zh-tw
> - **標記群組 Marker Clustering**（地點上百個時用來合併顯示）：https://developers.google.com/maps/documentation/javascript/marker-clustering
