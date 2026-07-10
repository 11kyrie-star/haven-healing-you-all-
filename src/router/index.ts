import { createRouter, createWebHistory } from 'vue-router'
import  Login from '@/Login/index.vue'
import Register from '@/Register/index.vue'
import Layout from '@/LayOut/index.vue'
import UserHome from '@/UserHome/index.vue'
import RegisterHome from '@/RegisterHome/index.vue'
const router = createRouter({
  history: createWebHistory(),
  routes: [
      {
        path:'/login',
        component:Login
      },
      {
        path:'/register',
        component:Register
      },
      {
        path:'/',
        component:Layout,
        redirect:(to)=>{
           const target=to.query.target
           return `/${target}`
        },
        children:[
          {
            path:'/user',
            component:UserHome
          },
          {
            path:'/register',
            component:Register
          }
        ]
      }
  ],
})

export default router
