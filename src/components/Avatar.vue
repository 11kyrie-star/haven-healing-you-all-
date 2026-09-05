<template>
    <div class="avatar-container" :style="styleposition">
        <div v-if="loading" class="avatar-state avatar-loading" role="status" aria-label="头像加载中">
            <span class="avatar-spinner"></span>
        </div>
        <div v-else-if="error" class="avatar-state avatar-error" role="alert" aria-label="头像加载失败">
            <div class="avatar-error-mark">!</div>
            <div class="avatar-error-text">网络异常</div>
        </div>
        <div v-else class="img" @click="Open">
            <img v-if="userstore.userinfo.avatar" :src=userstore.userinfo.avatar class="avatar-img">
            <img v-else src="@/assets/avatar.jpg" class="avatar-img">
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref ,computed,watch} from 'vue';
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
const loading=ref(true)
const error=ref(false)
const avatrUrl=computed(()=>userstore.userinfo.avatar)
let loadCount=0
function loadavatar(){
    const url=avatrUrl.value
    if(!url){
        loading.value=false
        error.value=false
        return
    }
    const current=++loadCount
    loading.value=true
    error.value=false
    const img=new Image()
    img.onload=()=>{
        if(current!==loadCount){return}
        loading.value=false
        error.value=false
    }
    img.onerror=()=>{
        if(current!==loadCount){return}
        loading.value=false
        error.value=true
    }
    img.src=url
}
watch(avatrUrl,loadavatar,{immediate:true})
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
    .avatar-state{
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        border-radius: inherit;
    }
    .avatar-loading{
        display: flex;
        align-items: center;
        justify-content: center;
        background:
            radial-gradient(circle at 25% 20%, rgba(255, 255, 255, 0.9) 0%, transparent 45%),
            linear-gradient(135deg, rgba(255, 243, 234, 0.95) 0%, rgba(240, 226, 224, 0.9) 45%, rgba(234, 215, 218, 0.8) 100%);
        box-shadow: inset 0 0 0 1px rgba(224, 128, 113, 0.1);
        &::after{
            content: '';
            position: absolute;
            inset: 0;
            transform: translateX(-100%);
            background: linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.7) 50%, transparent 60%);
            animation: avatar-loading-shimmer 1.35s ease-in-out infinite;
        }
        .avatar-spinner{
            position: relative;
            z-index: 1;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 3px solid rgba(227, 111, 93, 0.2);
            border-top-color: rgba(246, 224, 221, 0.95);
            box-shadow: 0 0 12px rgba(230, 146, 159, 0.22);
            animation: avatar-loading-spin 0.8s linear infinite;
        }
    }
    .avatar-error{
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        background:
            radial-gradient(circle at 25% 20%, rgba(255, 255, 255, 0.85) 0%, transparent 45%),
            linear-gradient(135deg, rgba(255, 238, 233, 0.95) 0%, rgba(255, 224, 220, 0.85) 100%);
        box-shadow: inset 0 0 0 1px rgba(219, 69, 35, 0.08);
        .avatar-error-mark{
            width: 34px;
            height: 34px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 21px;
            font-weight: 800;
            line-height: 1;
            color: #c6401f;
            background: linear-gradient(135deg, rgba(219, 69, 35, 0.14) 0%, rgba(250, 130, 145, 0.18) 100%);
            border: 1px solid rgba(219, 69, 35, 0.38);
            box-shadow: 0 3px 10px rgba(219, 69, 35, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }
        .avatar-error-text{
            font-size: 11px;
            line-height: 1;
            letter-spacing: 2px;
            color: rgba(198, 64, 31, 0.78);
            user-select: none;
        }
    }
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

@keyframes avatar-loading-spin{
    to{ transform: rotate(360deg); }
}

@keyframes avatar-loading-shimmer{
    0%{ transform: translateX(-100%); }
    100%{ transform: translateX(100%); }
}
</style>
