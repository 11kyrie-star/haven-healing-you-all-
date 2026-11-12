<template>
  <div class="setting-container">
   <div class="setting-contain">
    <div class="greetings">{{ greeting }}, Welcome to Haven</div> 
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
import {ref, computed} from 'vue'
import { useUserStore } from '@/stores/userinfo'
import { useWindowStore } from '@/stores/window'
const windowstore=useWindowStore()
const showanimation=ref(false)
const userstore=useUserStore()
// 按后端返回的登录时间（换算成本地时间）生成英文问候语
const greeting=computed(()=>{
    const loginTime=userstore.userinfo.login_time
    const date=loginTime ? new Date(loginTime) : new Date()
    const hour=Number.isNaN(date.getTime()) ? new Date().getHours() : date.getHours()
    if(hour>=5&&hour<12) return 'Good Morning'
    if(hour>=12&&hour<18) return 'Good Afternoon'
    if(hour>=18&&hour<23) return 'Good Evening'
    return 'Good Night'
})
const logout=()=>{
    userstore.logout()
}
function showinformation(){
showanimation.value=true
}
function closeinfor(){
    setTimeout(()=>{
        showanimation.value=false
    },3000)
}
function Open(){
    windowstore.open('information')
}
function Open2(){
    windowstore.open('password')
}

</script>

<style scoped lang="scss">
.setting-container{
    width: fit-content;
    position: absolute;
    user-select: none;
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
    background-color: rgba(0, 0, 0, 0.06);
    border-radius: 50%;
}
    .line{
        font-size: 25px;
        cursor: default;
    }
}
.setting-information{
    p{
        text-align: center;
        background-color: transparent;
        cursor: pointer;
        padding: 6px 6px;
        font-weight: 600;
        border-radius: 6px;
        margin: 2px 4px;
        transition: background-color 0.2s ease;
        &:hover{
            background-color: rgba(0, 0, 0, 0.06);
        }
    }
    opacity: 0;
    transform: translateY(-6px);
    transition: opacity 0.3s ease,transform 0.3s ease;
    pointer-events: none;
    width: 100px;
    height: fit-content;
    background-color: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.5);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 67%;
    left: 62%;
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