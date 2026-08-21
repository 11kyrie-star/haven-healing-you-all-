<template>
<div class="navigation-container">
    <div class="navigation">
        <div v-for="item in ['广场','求助','文案','日常']" @click="goto(item)" :class="{active:actvieTap===item}" :key="item" >{{ item }}</div>
        <div @click="toggleMenu"><span  style="user-select: none;" :class="{active:actvieTap==='我的'}">{{ mylabel }}</span><el-icon :size="15" class="arrow" :class="{'arrow-open':menuVisible}"><ArrowDown></ArrowDown></el-icon></div>
        <Transition name="menu-drop">
            <div v-show="menuVisible" class="menu" style="user-select: none;">
                <div class="item" v-for="item in ['留言','帖子','喜欢','评论']" @click="ChangeMy(item)">{{ item }}</div>
            </div>
        </Transition>
    </div>
</div>
</template>

<script setup lang="ts">
import {ref,computed} from 'vue'
import { useRouter,useRoute } from 'vue-router';
import {ArrowDown} from '@element-plus/icons-vue'
const router=useRouter()
const route=useRoute()
const menuVisible=ref(false)
const toggleMenu=()=>{
    menuVisible.value=!menuVisible.value
}
const pathmap:Record<string,string>={
'广场':'square',
'求助':'help',
'文案':'text',
'日常':'daily',
'留言':'leaveword',
'帖子':'mypost',
'喜欢':'mylike',
'评论':'mycomment'
}
const goto=(item:string)=>{
router.push(`/layout/content/${pathmap[item]}`)
}
const ChangeMy=(item:string)=>{
    router.push(`/layout/content/${pathmap[item]}`)
    menuVisible.value=!menuVisible.value
}
const mypages=['leaveword','mypost','mylike','mycomment']
const currentkey=computed(()=>(
route.path.split('/').pop() || 'square'
))
//将pathmap进行对调
const labelmap=Object.fromEntries(Object.entries(pathmap).map(([label,path])=>[path,label]))
const actvieTap=computed(()=>(mypages.includes(currentkey.value)?'我的':labelmap[currentkey.value] || '广场'))
const mylabel=computed(()=>(mypages.includes(currentkey.value)?labelmap[currentkey.value]:'我的'))
</script>

<style scoped lang="scss">
.navigation-container{
    width: 100%;
    height: 5vh;
    background-color: white;
    user-select: none;
    position: relative;
    z-index: 10;
    &::before{
        content: '';
        position: absolute;
        left: 0;
        bottom: 0;
        width: 35%;
        height: 200%;
        background: radial-gradient(
            circle at bottom left,
             rgba(219, 69, 35, 0.35)  0%,
            transparent 70%              
        );
        pointer-events: none;
        animation: sun-light 2s ease-in-out forwards;
    }
    &::after{
        content: '';
        position: absolute;
        right: 0;
        bottom: 0;
        width: 35%;
        height: 200%;
        background: radial-gradient(
            circle at bottom right,
             rgba(229, 70, 35, 0.35) 0%,
            transparent 70%              
        );
        animation: sun-light 2s ease-in-out forwards;
        pointer-events: none;
    }
    .navigation{
        width: 40%;
        height: 100%;
        display: flex;
        justify-content: space-around;
        align-items: center;
        margin-left: 48%;
        transform: translateX(-50%);
        font-size: 1.3em;
        font-family: 'LXGW WenKai', 'Inter', sans-serif;
        text-shadow: 0 0 1px rgba(224, 167, 167, 0.1);  
        color: rgba(50, 50, 50, 0.85);
        position: relative;
        >div:not(.menu){
            cursor: pointer;
            &:hover{
                font-weight: 700;
            }
        }
        .arrow{
            transition: transform 0.25s ease;
            &.arrow-open{
                transform: rotate(180deg);
            }
        }
        .menu{
           position: absolute;
           top: 100%;
           left: 83%;
           z-index: 12;
           width: fit-content;
           min-width: 7em;
           display: flex;
           flex-direction: column;
           gap: 2px;
           padding: 6px;
           background-color: rgba(255, 255, 255, 0.85);
           backdrop-filter: blur(10px);
           border: 1px solid rgba(224, 167, 167, 0.28);
           border-radius: 12px;
           box-shadow: 0 10px 28px rgba(120, 60, 40, 0.18), 0 2px 8px rgba(120, 60, 40, 0.08);
           .item{
              font-size: 1em;
              text-align: center;
              font-family: 'LXGW WenKai', 'Inter', sans-serif;
              text-shadow: 0 0 1px rgba(224, 167, 167, 0.1);  
              color: rgba(50, 50, 50, 0.85);
              cursor: pointer;
              padding: 7px 18px;
              border-radius: 8px;
              transition: background-color 0.2s ease, color 0.2s ease, font-weight 0.2s ease, transform 0.15s ease;
              &:hover{
                font-weight: 700;
                color: #c6401f;
                background-color: rgba(219, 69, 35, 0.1);
              }
              &:active{
                background-color: rgba(219, 69, 35, 0.2);
                transform: scale(0.96);
              }
           }
        }  
    }
    .active{
        font-weight: 700;
    }
}
.menu-drop-enter-active,
.menu-drop-leave-active{
    transition: opacity 0.22s ease, transform 0.22s ease;
    transform-origin: top center;
}
.menu-drop-enter-from,
.menu-drop-leave-to{
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
}
@keyframes sun-light{
    0% {opacity: 0.4;}
    50% {opacity: 0.7;}
    100% {opacity: 1;}
}
</style>
