import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
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

async function prepareapp(){
if(import.meta.env.DEV){
    const work=await import('@/mocks/browers.ts')
    await work.work.start()
}
loadsensitive()
const app = createApp(App)
app.use(createPinia().use(piniaPluginPersistedstate))
app.use(router)
app.mount('#app')
}
prepareapp()