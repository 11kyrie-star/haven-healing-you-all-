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
      children:[{
        path:'content',
        component:()=>import('@/views/Content/index.vue'),
        redirect:'layout/content/square',
        children:[{
          path:'square',
          component:()=>import('@/views/Content/Components/Square/index.vue')
        },
        {path:'help',component:()=>import('@/views/Content/Components/Help/index.vue')},
        {path:'text',component:()=>import('@/views/Content/Components/Text/index.vue')},
        {path:'daily',component:()=>import('@/views/Content/Components/Daily/index.vue')},
        {path:'mypost',component:()=>import('@/views/Content/Components/My/Components/Post/index.vue')},
        {path:'leaveword',component:()=>import('@/views/Content/Components/My/Components/Leaveword/index.vue')},
        {path:'mycomment',component:()=>import('@/views/Content/Components/My/Components/Mycomment/index.vue')},
        {path:'mylike',component:()=>import('@/views/Content/Components/My/Components/Like.vue')}
      ]
      }
      ]
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
