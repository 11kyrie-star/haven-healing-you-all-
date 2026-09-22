<template>
<div class="bg">
    <Search></Search>
    <AiLogo></AiLogo>
    <Logo></Logo>
    <div class="avatar-wrap">
    <Avatar radius="8px"></Avatar>
    </div>
    <Name left="21%" top="81%" fontsize="2em"></Name>
    <Counts></Counts>
    <Setting @open="showinfor"></Setting>
</div>
</template>

<script setup lang="ts">
import Counts from '@/views/Background/Components/Counts/index.vue'
import Logo from '@/views/Background/Components/Logo/index.vue'
import Avatar from '@/components/Avatar.vue';
import Setting from '@/views/Background/Components/Setting/index.vue'
import Name from '@/views/Background/Components/Name/index.vue'
import Search from '@/views/Background/Components/Search/index.vue'
import AiLogo from '@/views/Background/Components/AiLogo/index.vue'
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
    height: 340px;
    background: url('@/assets/bg.jpg') no-repeat center/cover;
    filter: blur(3px);
    z-index: 10;
    position: relative;
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
