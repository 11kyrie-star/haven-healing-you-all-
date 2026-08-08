import { createRouter, createWebHistory } from "vue-router"
import { isTokenExpired } from "@/utils/token"

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

function getStoredToken(): string | null{
     const token=localStorage.getItem('token')
     return token
}

router.beforeEach((to, from, next) => {
  // login page always allowed
  if (to.path === '/') {
    return next()
  }

  const token = getStoredToken()
  const expired = isTokenExpired(token)

  if (!token || expired) {
    return next('/')
  }

  next()
})
export default router
