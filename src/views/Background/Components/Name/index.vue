<template>
    <p>{{ userstore.userinfo?.username }}</p>
</template>

<style scoped lang="scss">
p{
    width: fit-content;
    font-weight: 800;
    position: absolute;
    left: 21%;
    top: 75%;
    font-size: 2rem;
    background: linear-gradient(135deg, #D4A843 0%, #6B3FA0 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    cursor: default;
}
</style>

<script setup lang="ts">
import { useUserStore } from '@/stores/userinfo';
const userstore=useUserStore()
</script>