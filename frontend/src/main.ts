import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { onMounted } from 'vue'
import router from './router'
import { loadsensitive } from './utils/sensitvie.ts'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import '@/styles/reset.scss'
import '@/styles/font.scss'
import {css as wenkaiCss} from '@/assets/fonts/LXGWWenKai-Regular.ttf'

const wenkaiFallback =
    '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", system-ui, sans-serif'
document.documentElement.style.setProperty(
    '--font-main',
    `"${wenkaiCss.family}",${wenkaiFallback}`
)

// 首屏 loading 写在 index.html 里，应用挂载后淡出并移除
function removeLoading() {
    const el = document.getElementById('app-loading')
    if (!el) return
    el.classList.add('is-hidden')
    setTimeout(() => el.remove(), 300)
}

async function prepareapp(){
if(import.meta.env.DEV){
    try{
       const work=await import('@/mocks/browers.ts')
       await work.work.start()
    }catch(e){
        console.warn("ws启动失败",e)
    }
    
}
const app = createApp(App)
app.use(createPinia().use(piniaPluginPersistedstate))
app.use(router)
app.mount('#app')

// 初始路由（含懒加载页面组件）就绪后移除首屏 loading，避免弱网下长时间白屏
router.isReady().catch(() => {}).then(removeLoading)

try{await loadsensitive()}catch(e){console.warn("敏感词库拉取失败",e)}
}
prepareapp()