<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="layout">
    <header class="topbar">
      <RouterLink to="/" class="brand">🗺️ Vue 地圖示範</RouterLink>
      <nav class="nav">
        <RouterLink to="/leaflet">Leaflet</RouterLink>
        <RouterLink to="/google">Google Maps</RouterLink>
      </nav>
    </header>
    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 56px;
  background: #212529;
  color: #fff;
  flex-shrink: 0;
}
.brand {
  font-weight: 700;
  font-size: 17px;
  color: #fff;
  text-decoration: none;
}
.nav {
  display: flex;
  gap: 8px;
}
.nav a {
  padding: 6px 14px;
  border-radius: 8px;
  color: #ced4da;
  text-decoration: none;
  font-size: 14px;
}
.nav a:hover {
  background: #343a40;
  color: #fff;
}
.nav a.router-link-active {
  background: #1971c2;
  color: #fff;
}
.content {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
</style>
