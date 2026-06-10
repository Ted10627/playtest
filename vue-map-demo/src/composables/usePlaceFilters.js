import { computed, ref } from 'vue'
import { categories, places } from '@/data/places.js'

/**
 * 共用的篩選邏輯：被 Leaflet 與 Google Maps 兩個頁面共用。
 * 維護一組「啟用中的分類」，並依此產出 filteredPlaces。
 */
export function usePlaceFilters() {
  // 預設全部開啟
  const activeCategories = ref(new Set(categories.map((c) => c.key)))

  function isActive(key) {
    return activeCategories.value.has(key)
  }

  function toggle(key) {
    // 以建立新的 Set 觸發 Vue 的反應性更新
    const next = new Set(activeCategories.value)
    next.has(key) ? next.delete(key) : next.add(key)
    activeCategories.value = next
  }

  function setAll(on) {
    activeCategories.value = on
      ? new Set(categories.map((c) => c.key))
      : new Set()
  }

  const filteredPlaces = computed(() =>
    places.filter((p) => activeCategories.value.has(p.category)),
  )

  return { activeCategories, isActive, toggle, setAll, filteredPlaces }
}
