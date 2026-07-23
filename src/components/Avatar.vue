<template>
    <div class="avatar-container">
        <div class="img" @click="Open">
            <img v-if="userstore.userinfo.avatar" :src=userstore.userinfo.avatar class="avatar-img">
            <img v-else src="@/assets/avatar.jpg" class="avatar-img">
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore } from '@/stores/userinfo';
const userstore=useUserStore()
const emit=defineEmits<{
    open:[command:string]
}>()
function Open(){
   emit('open','img')
}
</script>

<style scoped lang="scss">
.avatar-container{
    width: 7%;
    height: 42%;
    position: absolute;
    border-radius: 8px;
    background-color: white;
    padding: 2px;
    left: 13%;
    top: 63%;
    z-index: 80;
    .img{
        width: 100%;
        height: 100%;
        border-radius: 8px;
        .avatar-img{
            width: 100%;
            height: 100%;
            border-radius: 8px;
            object-fit: cover;
            cursor: pointer;
        }
    }
}
</style>