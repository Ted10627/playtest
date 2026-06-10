<script setup>
import { categories } from '@/data/places.js'

// 篩選按鈕列：受控元件。父層傳入 isActive 判斷函式與切換事件。
defineProps({
  isActive: { type: Function, required: true },
  count: { type: Number, default: 0 },
})

const emit = defineEmits(['toggle', 'set-all'])
</script>

<template>
  <div class="filter-bar">
    <div class="filter-buttons">
      <button
        v-for="cat in categories"
        :key="cat.key"
        class="filter-btn"
        :class="{ active: isActive(cat.key) }"
        :style="isActive(cat.key) ? { backgroundColor: cat.color, borderColor: cat.color } : {}"
        @click="emit('toggle', cat.key)"
      >
        <span class="ico">{{ cat.icon }}</span>{{ cat.label }}
      </button>
    </div>
    <div class="filter-meta">
      <span class="count">顯示 {{ count }} 個地點</span>
      <button class="link" @click="emit('set-all', true)">全選</button>
      <button class="link" @click="emit('set-all', false)">清除</button>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e9ecef;
}
.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1.5px solid #ced4da;
  border-radius: 999px;
  background: #f8f9fa;
  color: #495057;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.filter-btn.active {
  color: #fff;
  font-weight: 600;
}
.filter-btn:hover {
  transform: translateY(-1px);
}
.ico {
  font-size: 16px;
}
.filter-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #868e96;
}
.link {
  background: none;
  border: none;
  color: #1971c2;
  cursor: pointer;
  font-size: 13px;
  padding: 2px 4px;
}
.link:hover {
  text-decoration: underline;
}
</style>
