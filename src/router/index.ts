import { createRouter, createWebHistory } from "vue-router"
import { isTokenExpired } from "@/utils/token"
import { ElMessage } from "element-plus"
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
router.beforeEach((to,from,next)=>{
    const token=localStorage.getItem('token')
    const judge=isTokenExpired(token as string)
    if(!token){
      next('/')
    }
    if(to.path==='/'&& !judge){
      next('/layout')
    }
    if(to.path==='/' && from.path==='/layout'){
      next('/')
    }
})
export default router
