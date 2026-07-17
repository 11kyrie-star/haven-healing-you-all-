import { createRouter, createWebHistory } from "vue-router"

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/views/Login/index.vue"),
    },
    {
      path: "/layout",
      component: () => import("@/views/LayOut/index.vue"),
    },
  ],
})

export default router
