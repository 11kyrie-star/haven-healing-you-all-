<template>
<div class="layout-wrapper">
<Background></Background>
<Content></Content>
</div>
</template>

<script setup lang="ts">
import Background from "@/views/Background/index.vue"
import Content from "@/views/Content/index.vue"
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
        z-index: 0;
        pointer-events: none;
        background: radial-gradient(ellipse 80% 50% at 70% 15%,rgba(231, 155, 34, 1) 0%,transparent 65%),
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
