<template>
<div class="bg">
    <Logo></Logo>
    <Avatar @open="trans"></Avatar>
    <Name></Name>
    <Setting @open="showinfor"></Setting>
</div>
</template>

<script setup lang="ts">
import Logo from '@/views/Background/Components/Logo/index.vue'
import Avatar from '@/components/Avatar.vue';
import Setting from '@/views/Background/Components/Setting/index.vue'
import Name from '@/views/Background/Components/Name/index.vue'
const emit= defineEmits<{
    open:[command:string]
}>()
function trans(command:string){
  emit('open',command)
}
function showinfor(command:string){
    emit('open',command)
}
</script>

<style scoped lang="scss">
.bg{
    width: 100%;
    height: 35vh;
    background: url('@/assets/bg.jpg') no-repeat center/cover;
    position: relative;
    filter: blur(3px);
    // &::before{
    //    content: '';
    //    position: absolute;
    //    inset: 0;
    //    pointer-events: none;
    //    background-color:  rgba(235, 235, 235, 0.1);
    //    animation: sun 3s ease-in-out;
    // }
    // @keyframes sun{
    //     0% {opacity: 0.5;}
    //     100% {opacity: 0.1;}
    // }
    animation: sharpen 2s ease-in-out forwards;
}
@keyframes sharpen{
    0% {filter:blur(3px) ;}
    50% {filter: blur(2px);}
    100% {filter: blur(0px);}
}
</style>
