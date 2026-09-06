<template>
<div class="publish-container">
    <div class="avatar-wrap">
    <Avatar radius="50%" v-show="denoshow===0"></Avatar>
    <div class="noname-img" v-show="denoshow===1">
        <img src="@/assets/noname.webp" alt="">
    </div>
    </div>
    <span class="time">{{ time }}</span>
    <Name left="26%" top="7vh" fontsize="1.5em" v-show="denoshow===0"></Name>
    <div class="name" v-show="denoshow===1">匿名用户</div>
    <Editor ref="publisheditor" margintop="4vh" minheight="30vh" decide="publish" :showeditor="true" :deciname="denoshow" @newpost="addpost"></Editor>
    <el-checkbox v-model="checked" @change="noshow" class="show-name">匿名</el-checkbox>
</div>
</template>

<script setup lang="ts">
import Avatar from '@/components/Avatar.vue';
import Editor from '@/components/Editor.vue';
import Name from '@/views/Background/Components/Name/index.vue'
import { type post } from '@/types/post';
import { usePostFeedStore } from '@/stores/postfeed';
import { ref,onMounted,onUnmounted,inject,watch } from 'vue';
const feedpost=usePostFeedStore()
let time=ref()
//用于判断是否匿名
const denoshow=ref(0)
let timenum:null | number=null
const gettime=()=>{
    timenum=setInterval(()=>{time.value=new Date().toLocaleTimeString()},1000)
}
onMounted(()=>{gettime()})
onUnmounted(()=>{
    if(timenum!==null){
        clearInterval(timenum)
    }
    timenum=null
})
const checked=ref(false)
const noshow=()=>{
    if(!checked.value){
        denoshow.value=0
    }else{
        denoshow.value=1
    }
}
const addpost=(post:post)=>{
feedpost.publish(post)
}
</script>

<style scoped lang="scss">
.publish-container{
    min-width: 0;
    width: 30%;
    min-height: 40vh;
    padding: 5px;
    background:
        radial-gradient(circle at 12% 8%, rgba(233, 189, 124, 0.32) 0%, transparent 42%),
        radial-gradient(circle at 88% 92%, rgba(250, 130, 145, 0.22) 0%, transparent 48%),
        linear-gradient(
            135deg,
            rgba(224, 128, 113, 0.5) 0%,
            rgba(224, 128, 113, 0.1) 45%,
            transparent 92%
        ),
        #f4e4df;
    border: 1px solid rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05),    /* 柔和外阴影 */
        0 10px 20px rgba(0, 0, 0, 0.08),   /* 中层阴影 */
        0 20px 40px rgba(0, 0, 0, 0.1),    /* 底层阴影 */
        inset 0 0px 0 rgba(255, 255, 255, 0.8);
    border-radius: 8px;    
    margin-right: 3%;
    position: relative;
    align-self: flex-start;
    .time{
        position: absolute;
        left: 80%;
        top: 1vh;
    }
    .show-name{
        position: absolute;
        left: 83%;
        top: 10%;
    }
    .noname-img{
        position: relative;
        top: 25px;
        background-color: white;
        width: 90px;
        height: 90px;
        border-radius: 50%;
        padding: 2px;
        img{
            width: 100%;
            height: 100%;
            border-radius: inherit;
            object-fit: cover;
            cursor: default;
        }
    }
    .name{
        position: absolute;
        left: 26%;
        top: 7vh;
        cursor: default;
        font-weight: 800;
        font-size: 1.5em;
    }
}
</style>
