<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import FilterBar from '@/components/FilterBar.vue'
import { usePlaceFilters } from '@/composables/usePlaceFilters.js'
import { categoryMap, defaultCenter, defaultZoom } from '@/data/places.js'

const { isActive, toggle, setAll, filteredPlaces } = usePlaceFilters()

const mapEl = ref(null)
let map = null
let markerLayer = null

// 用 divIcon 製作彩色標記，避免打包時 Leaflet 預設圖示路徑問題。
function makeIcon(category) {
  const cat = categoryMap[category]
  return L.divIcon({
    className: 'custom-pin',
    html: `<div class="pin" style="background:${cat.color}">${cat.icon}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  })
}

function renderMarkers(list) {
  if (!markerLayer) return
  markerLayer.clearLayers()
  list.forEach((p) => {
    L.marker([p.lat, p.lng], { icon: makeIcon(p.category) })
      .bindPopup(`<strong>${p.name}</strong><br>${categoryMap[p.category].label}`)
      .addTo(markerLayer)
  })
}

onMounted(() => {
  map = L.map(mapEl.value).setView([defaultCenter.lat, defaultCenter.lng], defaultZoom)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)
  markerLayer = L.layerGroup().addTo(map)
  renderMarkers(filteredPlaces.value)
})

// 篩選結果變動 → 重畫標記
watch(filteredPlaces, (list) => renderMarkers(list))

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <div class="map-page">
    <FilterBar
      :is-active="isActive"
      :count="filteredPlaces.length"
      @toggle="toggle"
      @set-all="setAll"
    />
    <div ref="mapEl" class="map"></div>
  </div>
</template>

<style scoped>
.map-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.map {
  flex: 1;
  min-height: 0;
}
</style>

<style>
/* divIcon 的 html 不受 scoped 限制，故放在全域 */
.custom-pin .pin {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
  border: 2px solid #fff;
  font-size: 16px;
}
.custom-pin .pin > * {
  transform: rotate(45deg);
}
</style>
