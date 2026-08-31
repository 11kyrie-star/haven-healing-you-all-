<template>
<div class="bg">
    <Logo></Logo>
    <div class="avatar-wrap">
    <Avatar width="6vw" height="12.5vh" radius="8px"></Avatar>
    </div>
    <Name left="21%" top="75%" fontsize="2em"></Name>
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
    z-index: 3;
    animation: sharpen 2s ease-in-out forwards;
    .avatar-wrap{
        width: fit-content;
        height: fit-content;
        position: absolute;
        left: 14%;
        top: 70%;
    }
}
@keyframes sharpen{
    0% {filter:blur(3px) ;}
    50% {filter: blur(2px);}
    100% {filter: blur(0px);}
}
</style>
