import { createRouter, createWebHistory } from "vue-router"
import { isTokenExpired } from "@/utils/token"
import { useCrumbStore } from "@/stores/crumb"

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
        redirect:'/layout/content/square',
        children:[{
          path:'square',
          component:()=>import('@/views/Content/Components/Square/index.vue')
        },
        {path:'help',component:()=>import('@/views/Content/Components/Help/index.vue')},
        {path:'text',component:()=>import('@/views/Content/Components/Text/index.vue')},
        {path:'daily',component:()=>import('@/views/Content/Components/Daily/index.vue')},
        {path:'mypost',component:()=>import('@/views/Content/Components/My/Components/Post/index.vue')},
        {path:'leaveword',component:()=>import('@/views/Content/Components/My/Components/Leaveword/index.vue'),
          redirect:'/layout/content/leaveword/myword',
          children:[{
            path:'myword',
            component:()=>import('@/views/Content/Components/My/Components/Leaveword/Components/MyWord/index.vue')
          },{path:'taword',component:()=>import('@/views/Content/Components/My/Components/Leaveword/Components/TaWord/index.vue')}]
        },
        {path:'mycomment',component:()=>import('@/views/Content/Components/My/Components/Mycomment/index.vue')},
        {path:'mylike',component:()=>import('@/views/Content/Components/My/Components/Like/index.vue')},
        {path:'detail/:id',component:()=>import('@/views/Content/Components/Detail/index.vue')},
        {path:'leaveban/:id',component:()=>import('@/views/Content/Components/LeaveWordBan/index.vue')}
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
//路由守卫
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
//面包屑历史栈
const labelMap:Record<string,string>={
  square:'广场',help:'求助',text:'文案',daily:'日常',mypost:'帖子',mylike:'喜欢',mycomment:'评论',leaveword:'留言',detail:'详情',leaveban:'留言板'
}
const toplevel=['square','help','text','daily','mylike','mycomment','mypost','leaveword']
router.afterEach((to)=>{
const store=useCrumbStore()
const pattern=to.matched[to.matched.length-1]?.path ?? ''
const key=pattern.split('/')[3]
const exist=store.stack.findIndex(c=>c.path===to.path)
if(exist!==-1){
  store.stack=store.stack.slice(0,exist+1)
  return
}
 if(toplevel.includes(key!)) {
  return store.stack=[{label:labelMap[key!]!,path:to.path,key:key!}]
}
const anexist=store.stack.findIndex(c=>c.key===key)
if(anexist!==-1){
  store.stack[anexist]!.path=to.path
  store.stack.slice(0,anexist+1)
  return
}
store.stack.push({label:labelMap[key!]!,path:to.path,key:key!})
})
export default router
