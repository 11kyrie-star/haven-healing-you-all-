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
    const user=localStorage.getItem('user')
    let token=''
    if(user){
        token=JSON.parse(user as string).userinfo.token
    }
    const judge=isTokenExpired(token as string)
    if(!token && to.path!=='/'){
      return next('/')
    }
    if(token){
      if(judge){
        return next('/')
      }
      if(!judge && to.path==='/'){
        next('/layout')
      }
    }
    next()
})
export default router
