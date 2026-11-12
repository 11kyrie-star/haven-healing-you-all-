import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { loadsensitive } from './utils/sensitvie.ts'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import '@/styles/reset.scss'
import '@/styles/font.scss'

const wenkaiFallback =
    '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", system-ui, sans-serif'
// 首帧先用系统字体，字体 CSS 挪到挂载之后再加载
document.documentElement.style.setProperty('--font-main', wenkaiFallback)

// 注意：?subsets 模块内部已经自带 CSS 副作用导入，import 它就会加载字体 CSS，
// 不需要再单独 import 一个 css 文件
const loadfont = async () => {
    try {
        const { css } = await import('@/assets/fonts/LXGWWenKai-Regular.ttf?subsets')
        document.documentElement.style.setProperty(
            '--font-main',
            `"${css.family}",${wenkaiFallback}`
        )
    } catch (e) {
        console.warn('字体加载失败', e)
    }
}

// 首屏 loading 写在 index.html 里，应用挂载后淡出并移除
function removeLoading() {
    const el = document.getElementById('app-loading')
    if (!el) return
    el.classList.add('is-hidden')
    setTimeout(() => el.remove(), 300)
}

async function prepareapp(){
if(import.meta.env.DEV){
    // MSW 只影响 mock 接口，放到后台启动，避免它卡住时把首屏 loading 也一起卡死
    import('@/mocks/browers.ts')
       .then(({work})=>work.start())
       .catch(e=>console.warn("ws启动失败",e))
}
const app = createApp(App)
app.use(createPinia().use(piniaPluginPersistedstate))
app.use(router)
app.mount('#app')

// 初始路由（含懒加载页面组件）就绪后移除首屏 loading，避免弱网下长时间白屏
router.isReady().catch(() => {}).then(removeLoading)

// 挂载之后再拉字体：此时首屏已绘制，字体 CSS 不再阻塞 FCP
if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => { loadfont() }, { timeout: 2000 })
} else {
    setTimeout(loadfont, 200)
}

try{await loadsensitive()}catch(e){console.warn("敏感词库拉取失败",e)}
}
prepareapp()