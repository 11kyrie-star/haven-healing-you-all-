<template>
<div class="navigation-container">
    <div class="navigation">
        <div v-for="item in ['广场','求助','文案','日常','我的']" @click="actvieTap=item;goto(item)" :class="{active:actvieTap===item}" :key="item" >{{ item }}</div>
    </div>
</div>
</template>

<script setup lang="ts">
import {ref} from 'vue'
import { useRouter } from 'vue-router';
const actvieTap=ref('广场')
const router=useRouter()
const goto=(item:string)=>{
const pathmap:Record<string,string>={
'广场':'square',
'求助':'help',
'文案':'text',
'日常':'daily',
'我的':'my'
}
router.push(`/layout/content/${pathmap[item]}`)
}
</script>

<style scoped lang="scss">
.navigation-container{
    width: 100%;
    height: 5vh;
    background-color: white;
    position: relative;
    animation: show 3s cubic-bezier(0.34, 1.56, 0.90, 1) forwards;
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
        div{
            cursor: pointer;
            &:hover{
                font-weight: 700;
            }
        }  
    }
    .active{
        font-weight: 700;
    }
}
@keyframes sun-light{
    0% {opacity: 0.4;}
    50% {opacity: 0.7;}
    100% {opacity: 1;}
}
@keyframes show{
    0% {
        clip-path: inset(0% 100% 0% 100%);
        opacity: 0;
    }
    50% {
        clip-path: inset(0% 50% 0% 50%);
        opacity: 0.6;
    }
    100% {
        clip-path: inset(0 0 0 0);
        opacity: 1;
    }

}
</style>