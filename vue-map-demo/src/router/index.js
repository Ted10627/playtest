import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    {
      path: '/leaflet',
      name: 'leaflet',
      // 路由層級 code-splitting：地圖頁較重，按需載入
      component: () => import('@/views/LeafletView.vue'),
    },
    {
      path: '/google',
      name: 'google',
      component: () => import('@/views/GoogleMapView.vue'),
    },
  ],
})

export default router
