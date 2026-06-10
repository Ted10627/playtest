<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Loader } from '@googlemaps/js-api-loader'
import FilterBar from '@/components/FilterBar.vue'
import { usePlaceFilters } from '@/composables/usePlaceFilters.js'
import { categoryMap, defaultCenter, defaultZoom } from '@/data/places.js'

const { isActive, toggle, setAll, filteredPlaces } = usePlaceFilters()

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const mapEl = ref(null)
const status = ref(apiKey ? 'loading' : 'no-key') // no-key | loading | ready | error
const errorMsg = ref('')

let map = null
let markers = []
let infoWindow = null

// 用 SVG data URI 製作彩色標記圖示
function pinSvg(color, icon) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
    <path d="M20 0C9 0 0 9 0 20c0 14 20 28 20 28s20-14 20-28C40 9 31 0 20 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
    <circle cx="20" cy="19" r="13" fill="#fff"/>
    <text x="20" y="25" font-size="15" text-anchor="middle">${icon}</text>
  </svg>`
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
}

function clearMarkers() {
  markers.forEach((m) => m.setMap(null))
  markers = []
}

function renderMarkers(list) {
  if (!map) return
  clearMarkers()
  list.forEach((p) => {
    const cat = categoryMap[p.category]
    const marker = new google.maps.Marker({
      position: { lat: p.lat, lng: p.lng },
      map,
      title: p.name,
      icon: {
        url: pinSvg(cat.color, cat.icon),
        scaledSize: new google.maps.Size(40, 48),
        anchor: new google.maps.Point(20, 48),
      },
    })
    marker.addListener('click', () => {
      infoWindow.setContent(`<strong>${p.name}</strong><br>${cat.label}`)
      infoWindow.open(map, marker)
    })
    markers.push(marker)
  })
}

onMounted(async () => {
  if (!apiKey) return
  try {
    const loader = new Loader({ apiKey, version: 'weekly' })
    await loader.importLibrary('maps')
    await loader.importLibrary('marker')
    map = new google.maps.Map(mapEl.value, {
      center: defaultCenter,
      zoom: defaultZoom,
      mapTypeControl: false,
      streetViewControl: false,
    })
    infoWindow = new google.maps.InfoWindow()
    renderMarkers(filteredPlaces.value)
    status.value = 'ready'
  } catch (e) {
    status.value = 'error'
    errorMsg.value = e?.message || String(e)
  }
})

watch(filteredPlaces, (list) => {
  if (status.value === 'ready') renderMarkers(list)
})

onBeforeUnmount(() => {
  clearMarkers()
  map = null
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

    <div v-if="status === 'no-key'" class="notice">
      <h3>尚未設定 Google Maps API Key</h3>
      <p>
        在 <code>vue-map-demo/</code> 建立 <code>.env</code> 檔並填入：
      </p>
      <pre>VITE_GOOGLE_MAPS_API_KEY=你的金鑰</pre>
      <p class="muted">
        金鑰需在 Google Cloud Console 啟用「Maps JavaScript API」並綁定計費帳號。<br />
        不想申請金鑰的話，左上可切到 <strong>Leaflet</strong> 頁，免金鑰即可體驗相同的「多標記 + 篩選」功能。
      </p>
    </div>

    <div v-else-if="status === 'error'" class="notice error">
      <h3>Google Maps 載入失敗</h3>
      <pre>{{ errorMsg }}</pre>
      <p class="muted">常見原因：金鑰未啟用 Maps JavaScript API、未綁定計費、或網域限制設定。</p>
    </div>

    <div v-show="status === 'loading' || status === 'ready'" ref="mapEl" class="map"></div>
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
.notice {
  margin: 24px;
  padding: 20px 24px;
  background: #fff9db;
  border: 1px solid #ffe066;
  border-radius: 10px;
  max-width: 640px;
}
.notice.error {
  background: #fff5f5;
  border-color: #ffc9c9;
}
.notice h3 {
  margin-top: 0;
}
.notice pre {
  background: #f1f3f5;
  padding: 10px 12px;
  border-radius: 6px;
  overflow-x: auto;
}
.muted {
  color: #868e96;
  font-size: 14px;
}
</style>
