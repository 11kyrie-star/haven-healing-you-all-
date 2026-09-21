<template>
    <p :style="styleposition">{{ userstore.userinfo?.username }}</p>
</template>

<style scoped lang="scss">
p{
    width: fit-content;
    font-weight: 800;
    position: absolute;
    background: linear-gradient(135deg, #D4A843 0%, #6B3FA0 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    cursor: default;
}
</style>

<script setup lang="ts">
import { useUserStore } from '@/stores/userinfo';
import { computed } from 'vue';
const userstore=useUserStore()
const props=defineProps<{
    left?:string,
    top?:string,
    fontsize?:string
}>()
const styleposition=computed(()=>({
   left:props.left,
   top:props.top,
   fontSize:props.fontsize
}))
</script>