<template>
  <div class="setting-container">
   <div class="setting-contain">
    <div class="greetings">Good MOring,Welcome to Haven</div> 
    <div class="line">|</div>   
    <el-icon class="setting" :class="{'setting-anima':showanimation}" :size="32" @mouseenter="showinformation" @mouseleave="closeinfor">
      <Setting style="color:black;"/>
    </el-icon>
    </div> 
    <div  class="setting-information" :class="{'show-information':showanimation}">
    <p @click="Open">修改资料</p>
    <p @click="Open2">修改密码</p>
    <p @click="logout">退出登录</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import {Setting} from '@element-plus/icons-vue'
import {ref} from 'vue'
import { useUserStore } from '@/stores/userinfo'
const showanimation=ref(false)
const router=useUserStore()
const logout=()=>{
    router.logout()
}
function showinformation(){
showanimation.value=true
}
function closeinfor(){
    setTimeout(()=>{
        showanimation.value=false
    },2000)
}
const emit=defineEmits<{open:[command:string]}>()
function Open(){
    emit('open','information')
}
function Open2(){
    emit('open','password')
}
</script>

<style scoped lang="scss">
.setting-container{
    width: fit-content;
    position: absolute;
    left: 85%;
    top: 2vh;
    z-index: 1000;
    .greetings{
    width: 10vw;    
    font-family: 'Dancing Script', cursive;
    font-size: 25px;
    animation: wrint 3s ease-in-out forwards;
    clip-path:inset( 0% 100% 0% 0%);
    cursor: default;
}
    .setting{
        cursor: pointer;
        background-color: transparent;
        transition: background-color 1s ease;
    }
    .setting-anima{
    background-color: rgb(222, 205, 205);
}
    .line{
        font-size: 25px;
        cursor: default;
    }
}
.setting-information{
    p{
        text-align: center;
        background-color: rgb(222, 205, 205);
        cursor: pointer;
        padding: 5px;
        font-weight: 800;
    }
    opacity: 0;
    transform: translateY(-6px);
    transition: opacity 1s ease,transform 1s ease;
    pointer-events: none;
    width: 5vw;
    height: fit-content;
    background-color: white;
    display: flex;
    flex-direction: column;
    gap: 1px;
    position: absolute;
    top: 67%;
    left: 62.5%;
    &.show-information{
    opacity: 1;
    transform: translateY(0px);
    pointer-events: auto;
}
}

@keyframes wrint{
   0% {clip-path: inset( 0% 100% 0% 0%);}
   50% {clip-path: inset(0% 50% 0% 0%);}
   100% {clip-path: inset(0% 0% 0% 0%);}
}
.setting-contain{
       display: flex;
       gap: 6px;
       justify-content: center;
       align-items: center;
    }
</style>