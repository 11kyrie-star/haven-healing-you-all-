<template>
    <div class="avatar-container" :style="styleposition">
        <div class="img" @click="Open">
            <img v-if="userstore.userinfo.avatar" :src=userstore.userinfo.avatar class="avatar-img">
            <img v-else src="@/assets/avatar.jpg" class="avatar-img">
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref ,computed} from 'vue';
import { useUserStore } from '@/stores/userinfo';
import { useWindowStore } from '@/stores/window';
const userstore=useUserStore()
const windowstore=useWindowStore()
function Open(){
   windowstore.open('img')
}
const props=withDefaults(defineProps<{
    radius?:string
}>(),{
    radius:'50%'
})
// 固定头像尺寸，不随视口 vw/vh 变化
const avatarSize='90px'
const styleposition=computed(()=>({
width:avatarSize,
height:avatarSize,
borderRadius:props.radius
}))
</script>

<style scoped lang="scss">
.avatar-container{
    background-color: white;
    padding: 2px;
    z-index: 80;
    position: relative;
    top: 25px;
    .img{
        width: 100%;
        height: 100%;
        border-radius:inherit;
        .avatar-img{
            width: 100%;
            height: 100%;
            border-radius:inherit;
            object-fit: cover;
            cursor: pointer;
        }
    }
}
</style>
