<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="home">
    <h1>網頁嵌入地圖 + 多標記 + 按鈕篩選</h1>
    <p class="lead">
      這個 Vue 3 示範回答的問題是：<br />
      「網頁嵌入地圖，同時存有多個地點標記，並能跟網頁按鈕互動（如 food / parking / bus-stop 篩選）。」
    </p>

    <div class="cards">
      <RouterLink to="/leaflet" class="card">
        <div class="emoji">🗺️</div>
        <h2>Leaflet + OpenStreetMap</h2>
        <p>免金鑰、開源。打開即可看到多標記與篩選按鈕互動。建議先看這個。</p>
        <span class="badge ok">免 API Key</span>
      </RouterLink>

      <RouterLink to="/google" class="card">
        <div class="emoji">📍</div>
        <h2>Google Maps</h2>
        <p>使用 Google Maps JavaScript API。需設定 API Key（見 .env.example）。</p>
        <span class="badge warn">需 API Key</span>
      </RouterLink>
    </div>

    <div class="how">
      <h3>核心做法（兩種地圖共用）</h3>
      <ol>
        <li>地點資料集中放在 <code>src/data/places.js</code>，每筆含 <code>category</code>（food/parking/bus-stop）。</li>
        <li>篩選邏輯抽成 <code>usePlaceFilters</code> composable，維護「啟用中的分類」並算出 <code>filteredPlaces</code>。</li>
        <li>按鈕列 <code>FilterBar.vue</code> 切換分類；<code>watch(filteredPlaces)</code> 變動時重畫地圖標記。</li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.home {
  max-width: 860px;
  margin: 0 auto;
  padding: 32px 24px;
}
h1 {
  font-size: 28px;
}
.lead {
  color: #495057;
  line-height: 1.7;
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
  margin: 24px 0;
}
.card {
  display: block;
  padding: 20px;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: all 0.15s ease;
  background: #fff;
}
.card:hover {
  border-color: #4dabf7;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}
.emoji {
  font-size: 32px;
}
.card h2 {
  font-size: 18px;
  margin: 8px 0;
}
.card p {
  color: #868e96;
  font-size: 14px;
  margin: 0 0 12px;
}
.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.badge.ok {
  background: #d3f9d8;
  color: #2b8a3e;
}
.badge.warn {
  background: #ffe8cc;
  color: #d9480f;
}
.how {
  margin-top: 32px;
  padding: 20px 24px;
  background: #f8f9fa;
  border-radius: 12px;
}
.how li {
  line-height: 1.9;
}
code {
  background: #e9ecef;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 13px;
}
</style>
