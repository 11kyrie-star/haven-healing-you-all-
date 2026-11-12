import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import AutoImport from 'unplugin-auto-import/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'
import ElementPlus from 'unplugin-element-plus/vite' 
import Font from 'vite-plugin-font'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Icons from 'unplugin-icons/vite'
import Inspect from 'vite-plugin-inspect'
import path from 'path'
const pathSrc = path.resolve(__dirname, 'src')
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    // 轻量分包：只打包源码中实际用到的字，避免 315 份全量分片
    Font.vite({
      scanFiles: ['src/**/*.{vue,ts,tsx,js,jsx}'],
    }),
    AutoImport({
      resolvers: [ElementPlusResolver(),
       IconsResolver({
          prefix: 'Icon',
        }),
      ],
      dts: path.resolve(pathSrc, 'auto-imports.d.ts'),
    }),
    Components({
      resolvers: [ElementPlusResolver(),
        IconsResolver({
          enabledCollections: ['ep'],
        }),
      ],
      dts: path.resolve(pathSrc, 'components.d.ts'),
    }),
    Icons({
      autoInstall: true,
    }),
    ElementPlus({
      useSource: true, 
    }),
    Inspect()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css:{
    preprocessorOptions:{
      scss:{
        additionalData:`
        @use "@/styles/variables" as *;
        `
      }
    }
  }
})
