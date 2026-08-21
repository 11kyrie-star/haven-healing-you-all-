<template>
<div class="hottop-container">
    <div class="hot-title" style="user-select: none;">今日热榜</div>
    <div class="hot-contain" style="user-select: none;">
        <div class="hot-item" v-for="item in hotlist" :key="item.id"><div class="top">{{ item.id }}</div><p class="hot-post">{{ item.post }}</p><div class="hot-number">{{ item.hot }}</div><img src="@/assets/fire.svg" alt=""></div>
    </div>      
</div>
</template>

<script setup lang="ts">
import { ref,onMounted } from 'vue';
import { gethotdata } from '@/api/hottop';
import type { hotdatares } from '@/types/hot';
let hotlist=ref<hotdatares[]>([])
onMounted(async()=>{
const res=await gethotdata()
hotlist.value=res.data
console.log(res)
})
</script>

<style scoped lang="scss">
.hottop-container{
    position: relative;
    width: 25%;
    height: 90vh;
    margin-left: 3%;
    border-radius: 8px;
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
        inset 0 1px 0 rgba(255, 255, 255, 0.8);
        display: flex;
        flex-direction: column;
    .hot-title{
        cursor: default;
        margin-top: 4%;
        width: 35%;
        height: 8%;
        background-color: rgb(230, 30, 30);
        color: #ff8c00;
        align-self: center;
        text-align: center;
        border-radius: 12px;
        box-shadow:
        0 4px 0 #8b1a1a,                    // 底部厚阴影，模仿"块"的厚度
        0 6px 15px rgba(230, 57, 70, 0.4);  
        padding-top: 3%;
        font-weight: 700;
        font-size: 1.5em;
        text-shadow: 0 2px 3px rgba(0, 0, 0, 0.3); // 文字凹陷感
        letter-spacing: 3px;
        position: relative;
        &::before,
        &::after {
        content: '';
        position: absolute;
        top: 50%;
        width: 50%;
        height:10%;
        transform: translateY(-50%);
        background:
            radial-gradient(ellipse 50% 90% at 50% 70%, #e63946 0%, transparent 70%),
            radial-gradient(ellipse 35% 80% at 50% 60%, #ff8c00 0%, transparent 65%),
            radial-gradient(ellipse 20% 60% at 50% 45%, #ffd700 0%, transparent 55%),
            radial-gradient(ellipse 10% 35% at 50% 30%, #fff 0%, transparent 50%);
    }
    &::before { right: 100%; margin-right: 10px; }
    &::after  { left: 100%;  margin-left: 10px; }
    }
    .hot-contain{
        position: relative;
        margin-top: 8%;
        border-radius: 8px 8px 0 0;
        width: 100%;
        flex: 1fr;
        display: flex;
        flex-direction: column;
        gap: 2.3%;
        // 遮盖层
        &::before{
          content: '';
          position: absolute;
          inset: 0;
          z-index: 10;
          border-radius: 8px 8px 0 0;
          background-color:rgba(235, 195, 180, 0.85);
          pointer-events: none;
          animation: uncover 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          animation-delay: 0.3s;
        }
       .hot-item{
        &:nth-child(1) .top{
            color: #ff4500;
        }
        &:nth-child(2) .top{
            color:  #ff8c00;
        }
        &:nth-child(3) .top{
            color:#ffa500;
        }
        width: 100%;
        flex: 0.8fr;
        display: grid;
        grid-template-columns: 0.8fr 4fr 2fr 0.1fr;
        background:rgba(255, 250, 245, 0.7) ;
        backdrop-filter: blur(0.6);
        img{
            width: 2.5vw;
            height: 3vh;
            place-self:center ;
            animation: float 2s ease-in-out infinite;
        }
        .top{
            font-size: 2em;
            font-weight: 900;
            place-self: center;
            cursor: default;
            color:#6b4e31 ;
        }
        .hot-post{
            font-size: 1em;
            font-weight: 300;
            place-self: center;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            cursor: pointer;
        }
        .hot-number{
            place-self: center;
            margin-left: 40%;
            font-size: 1.3em;
            animation: plus 1.5s ease-in-out infinite,glow 3s ease-in-out infinite alternate;
            background: linear-gradient(180deg,#ff4500, #ff8c00);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-family: 'LXGW WenKai', sans-serif;
            font-weight: 700;
            cursor: default;
        }
       }
    }
}

@keyframes plus{
    0%,100% {transform: scale(1);}
    50%{transform: scale(1.15);}
}
@keyframes float{
    0%,100%{transform: translateY(0);}
    50% {transform: translateY(-4px);}
}
@keyframes glow{
    0%   { text-shadow: 0 0 4px #ff4500; }
  100% { text-shadow: 0 0 12px #ff6347, 0 0 24px #ff4500; }
}
@keyframes uncover{
    0%   { clip-path: inset(0 0 0 0); }
    100% { clip-path: inset(0 0 100% 0); }
}
</style>
