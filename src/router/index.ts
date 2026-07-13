import { createRouter, createWebHistory } from 'vue-router'
import  Login from '@/views/Login/index.vue'
import Layout from '@/views/LayOut/index.vue'
const router = createRouter({
  history: createWebHistory(),
  routes: [
      {
        path:'/',
        component:Login
      },
      {
        path:'/layout',
        component:Layout
      }
  ],
})

export default router
