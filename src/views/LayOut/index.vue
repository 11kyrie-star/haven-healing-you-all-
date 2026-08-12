<template>
<div class="layout-wrapper">
<Background @open="avatarway"></Background>
<RouterView></RouterView>
<Window :visible="showvisible" :decwindow="decwindow" @close="showvisible=false"></Window>
</div>
</template>

<script setup lang="ts">
import Background from "@/views/Background/index.vue"
import Window from "@/components/Window.vue";
import { getTime } from "@/utils/token";
import { ref ,onMounted,onUnmounted} from "vue";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";

let time = 0
const route = useRouter()
let timenum: ReturnType<typeof setTimeout> | null = null

function getTokenSafe(): string {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return ''
    const parsed = JSON.parse(raw)
    return parsed?.userinfo?.token || ''
  } catch {
    return ''
  }
}

onMounted(() => {
  const token = getTokenSafe()
  if (!token) {
    ElMessage({ message: '登录失效', type: 'warning' })
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    route.push('/')
    return
  }

  time = getTime(token)
  if (time < 0) {
    ElMessage({ message: '登录失效', type: 'warning' })
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    route.push('/')
    return
  }

  timenum = setTimeout(() => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    ElMessage({ message: '登录失效', type: 'warning' })
    route.push('/')
  }, time)
})

onUnmounted(() => {
  if (timenum !== null) {
    clearTimeout(timenum)
    timenum = null
  }
})

const showvisible = ref(false)
const decwindow = ref('')
function avatarway(command: string) {
  showvisible.value = true
  decwindow.value = command
}
</script>

<style scoped lang="scss">
.layout-wrapper{
    position: relative;
    width: 100%;
    min-height: 100vh;
    &::before{
        content: '';
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        min-height:100vh;
        background: radial-gradient(ellipse 80% 50% at 70% 15%,rgb(231, 175, 84) 0%,transparent 65%),
         radial-gradient(ellipse 60% 40% at 70%% 35%, rgba(220, 120, 78, 0.18) 0%, transparent 60%),
         linear-gradient(
                180deg,
                rgba(255, 185, 110, 0.12) 0%,
                rgba(255, 155, 125, 0.18) 30%,
                rgba(250, 130, 145, 0.2) 55%,
                rgba(210, 140, 170, 0.15) 80%,
                rgba(205, 160, 231, 0.3) 100%
            );
            animation: sunBreath 2s ease-in-out;
    }
    @keyframes sunBreath{
        0% {opacity: 0.3;}
        50% {opacity: 0.5;}
        100% {opacity: 1;}
    }
}
</style>
