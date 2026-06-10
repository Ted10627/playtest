// 範例地點資料（台北市中心一帶座標）。
// 實務上這份資料通常來自後端 API；此處用靜態陣列示範。
// category 必須對應 categories 中的 key。

export const categories = [
  { key: 'food', label: '美食 Food', icon: '🍜', color: '#e8590c' },
  { key: 'parking', label: '停車 Parking', icon: '🅿️', color: '#1971c2' },
  { key: 'bus-stop', label: '公車站 Bus stop', icon: '🚌', color: '#2f9e44' },
]

export const places = [
  { id: 1, name: '永康牛肉麵', category: 'food', lat: 25.0329, lng: 121.5295 },
  { id: 2, name: '鼎泰豐 信義店', category: 'food', lat: 25.0331, lng: 121.5325 },
  { id: 3, name: '阜杭豆漿', category: 'food', lat: 25.0444, lng: 121.5247 },
  { id: 4, name: '誠品信義停車場', category: 'parking', lat: 25.0398, lng: 121.5654 },
  { id: 5, name: '大安森林公園地下停車場', category: 'parking', lat: 25.0297, lng: 121.5354 },
  { id: 6, name: '台北車站停車場', category: 'parking', lat: 25.0478, lng: 121.5170 },
  { id: 7, name: '捷運大安站(公車)', category: 'bus-stop', lat: 25.0335, lng: 121.5436 },
  { id: 8, name: '台大醫院站(公車)', category: 'bus-stop', lat: 25.0410, lng: 121.5170 },
  { id: 9, name: '市政府站(公車)', category: 'bus-stop', lat: 25.0410, lng: 121.5650 },
]

// 以 category key 快速取得設定
export const categoryMap = Object.fromEntries(
  categories.map((c) => [c.key, c]),
)

// 地圖預設中心與縮放
export const defaultCenter = { lat: 25.038, lng: 121.535 }
export const defaultZoom = 13
