<template>
<div class="bg">
    <Logo></Logo>
</div>
</template>

<script setup lang="ts">
import Logo from '@/views/Background/Components/Logo/index.vue'
</script>

<style scoped lang="scss">
.bg{
    width: 100%;
    height: 35vh;
    background: url('@/assets/bg.jpg') no-repeat center/cover;
    position: relative;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.1);}
}
</style>