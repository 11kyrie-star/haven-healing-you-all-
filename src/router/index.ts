import { createRouter, createWebHistory } from 'vue-router'
import  Login from '@/Login/index.vue'
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
            path:'/registerhome',
            component:RegisterHome
          }
        ]
      }
  ],
})

export default router
