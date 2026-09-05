<template>
    <Transition name="top-fade">
        <div v-show="visible" class="back-top" @click="backToTop" title="返回顶部">
            <svg class="back-top-arrow" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                <path d="M12 4.5l7.5 7.2a1 1 0 0 1-1.4 1.42L13 8.3V19a1 1 0 1 1-2 0V8.3l-5.1 4.82a1 1 0 0 1-1.4-1.42L12 4.5z" fill="currentColor"/>
            </svg>
            <span class="back-top-text">返回顶部</span>
        </div>
    </Transition>
</template>

<script setup lang="ts">
import {ref,onMounted,onUnmounted} from 'vue'
const visible=ref(false)
const handlescroll=()=>{
    visible.value=window.scrollY>300
}
onMounted(()=>{
    window.addEventListener('scroll',handlescroll)
})
onUnmounted(()=>{
    window.removeEventListener('scroll',handlescroll)
})
const backToTop=()=>{
    window.scrollTo({top:0,behavior:'smooth'})
}
</script>

<style scoped lang="scss">
.back-top{
    position: fixed;
    right: 44px;
    bottom: 44px;
    z-index: 11;
    padding: 0 22px;
    height: 56px;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.55);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(224, 167, 167, 0.4);
    box-shadow: 0 6px 18px rgba(120, 60, 40, 0.16), 0 2px 6px rgba(120, 60, 40, 0.08);
    color: rgba(50, 50, 50, 0.85);
    cursor: pointer;
    font-family: 'LXGW WenKai', 'Inter', sans-serif;
    user-select: none;
    transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease, color 0.25s ease, border-color 0.25s ease;
    .back-top-arrow{
        display: block;
        transition: transform 0.25s ease;
    }
    .back-top-text{
        font-size: 1rem;
        font-weight: 600;
        letter-spacing: 1px;
        line-height: 1;
    }
    &:hover{
        transform: translateY(-2px);
        background: linear-gradient(135deg, #f78c6b 0%, #f34f67 100%);
        border-color: transparent;
        color: #ffffff;
        box-shadow: 0 10px 22px rgba(243, 79, 103, 0.35), 0 4px 10px rgba(120, 60, 40, 0.18);
        .back-top-arrow{
            transform: translateY(-1px);
        }
    }
    &:active{
        transform: translateY(0) scale(0.96);
        box-shadow: 0 4px 12px rgba(120, 60, 40, 0.2);
    }
}
.top-fade-enter-active,
.top-fade-leave-active{
    transition: opacity 0.25s ease, transform 0.25s ease;
    transform-origin: center center;
}
.top-fade-enter-from,
.top-fade-leave-to{
    opacity: 0;
    transform: translateY(10px) scale(0.85);
}
</style>
