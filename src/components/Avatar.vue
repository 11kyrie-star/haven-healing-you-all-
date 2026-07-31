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
const userstore=useUserStore()
const emit=defineEmits<{
    open:[command:string]
}>()
function Open(){
   emit('open','img')
}
const props=defineProps<{
    width?:string,
    height?:string,
    radius?:string
}>()
const styleposition=computed(()=>({
width:props.width,
height:props.height,
borderRadius:props.radius
}))
</script>

<style scoped lang="scss">
.avatar-container{
    background-color: white;
    padding: 2px;
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