<template>
<div class="hottop-container">
    <div class="hot-title" style="user-select: none;">今日热榜</div>
    <div class="hot-contain" style="user-select: none;">
        <div class="hot-item" v-for="(item,index) in hotlist" :key="item.id"><div class="top">{{ index+1 }}</div><p class="hot-post" @click="pushdetail(item.id)">{{ limitHotText(item.content) }}</p><div class="hot-number">{{ item.hot_value }}</div><img src="@/assets/fire.svg" alt=""></div>
        <!-- 加载中 -->
        <div class="hot-state" v-if="loading">
            <span class="hot-spinner"></span>
            <p class="hot-state-title">热榜加载中...</p>
        </div>
        <!-- 空状态 -->
        <div class="hot-state" v-if="isEmpty" style="user-select: none;">
            <div class="hot-state-icon">
                <el-icon :size="34"><TrendCharts /></el-icon>
            </div>
            <p class="hot-state-title" style="cursor: default;">暂无热榜数据</p>
            <p class="hot-state-sub" style="cursor: default;">过一会儿再来看看吧</p>
        </div>
        <!-- 网络异常 -->
        <div class="hot-state hot-error" v-if="hasError" style="user-select: none;">
            <div class="hot-state-icon">
                <el-icon :size="34"><WarningFilled /></el-icon>
            </div>
            <p class="hot-state-title" style="cursor: default;">网络开小差了</p>
            <p class="hot-state-sub" style="cursor: default;">热榜加载失败，请检查网络后重试</p>
            <div class="hot-state-btn" style="cursor: pointer;" @click="reload">刷新重试</div>
        </div>
    </div>
</div>
</template>

<script setup lang="ts">
import { ref,onMounted } from 'vue';
import { gethotdata } from '@/api/hottop';
import type { hotlist } from '@/types/hot';
import { useThrottleFn } from '@vueuse/core';
import { useRouter } from 'vue-router';
import { TrendCharts, WarningFilled } from '@element-plus/icons-vue';
const router=useRouter()
const hotlist=ref<hotlist[]>([])
const hasError=ref(false)
const loading=ref(false)
const isEmpty=ref(false)
const loadhot=async()=>{
if(loading.value || isEmpty.value){return}
if(hasError.value){hasError.value=false}
loading.value=true
try{
const res=await gethotdata()
if(res.status===0){
hotlist.value=res.data.list
}
}catch{
hasError.value=true
}finally{
loading.value=false
}
}
onMounted(loadhot)
const reload=useThrottleFn(()=>{loadhot()},1000)
const pushdetail=(id:number)=>{
router.push(`/layout/content/detail/${id}`)
}
//限制热榜标题字数：最多 8 个字，达到 8 个字以上就加省略号
const limitHotText=(str:string,max:number=8)=>{
    const text=String(str||'').replace(/<[^>]+>/g,'') //去掉富文本里的HTML标签，避免把标签当字数
    return text.length>=max ? text.slice(0,max)+'...' : text
}
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
        width: fit-content;
        min-width: 32%;
        padding: 1.4% 6% 1.6%;
        box-sizing: border-box;
        background:
            radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.9) 0%, transparent 45%),
            linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(250, 205, 190, 0.32));
        border: 1px solid rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(6px);
        color: #c06553;
        align-self: center;
        text-align: center;
        border-radius: 999px;
        box-shadow: 0 2px 10px rgba(224, 128, 113, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
        font-weight: 700;
        font-size: 1.5em;
        text-shadow: 0 1px 2px rgba(255, 255, 255, 0.7);
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
            radial-gradient(ellipse 50% 90% at 50% 70%, #e8a79e 0%, transparent 70%),
            radial-gradient(ellipse 35% 80% at 50% 60%, #eec09a 0%, transparent 65%),
            radial-gradient(ellipse 20% 60% at 50% 45%, #f7e0c0 0%, transparent 55%),
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
        content-visibility: auto;
        contain-intrinsic-size: auto 10vh;
        &:nth-child(1) .top{
            color: #d95f4e;
        }
        &:nth-child(2) .top{
            color: #e08d5a;
        }
        &:nth-child(3) .top{
            color:#cfa04e;
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
            width: 100%;
            font-size: 1em;
            font-weight: 300;
            place-self: center;
            overflow: hidden;        /* 兜底：异常超长也不撑破布局 */
            white-space: nowrap;     /* 保持单行 */
            cursor: pointer;
        }
        .hot-number{
            place-self: center;
            margin-left: 40%;
            font-size: 1.3em;
            animation: plus 1.5s ease-in-out infinite,glow 3s ease-in-out infinite alternate;
            background: linear-gradient(180deg, #e06052, #f2a65e);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-family: 'LXGW WenKai', sans-serif;
            font-weight: 700;
            cursor: default;
        }
       }
        .hot-state{
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 30px 16px 40px;
            text-align: center;
            color: rgba(128, 110, 100, 0.6);

            .hot-spinner{
                width: 30px;
                height: 30px;
                border: 3px solid rgba(224, 128, 113, 0.2);
                border-top-color: rgba(224, 128, 113, 0.9);
                border-radius: 50%;
                animation: hot-spin 0.8s linear infinite;
            }
            .hot-state-icon{
                width: 72px;
                height: 72px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: rgba(224, 128, 113, 0.85);
                background:
                    radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.9) 0%, transparent 45%),
                    linear-gradient(135deg, rgba(233, 189, 124, 0.5), rgba(250, 130, 145, 0.38));
                border: 1px solid rgba(255, 255, 255, 0.7);
                box-shadow: 0 6px 16px rgba(120, 60, 40, 0.12),
                    inset 0 1px 0 rgba(255, 255, 255, 0.6);
                animation: hot-float 3s ease-in-out infinite;
            }
            .hot-state-title{
                font-size: 1em;
                font-weight: 700;
                letter-spacing: 2px;
                color: rgba(120, 90, 80, 0.8);
            }
            .hot-state-sub{
                font-size: 0.82em;
                line-height: 1.8;
                letter-spacing: 1px;
                color: rgba(128, 110, 100, 0.55);
            }
            .hot-state-btn{
                margin-top: 4px;
                padding: 6px 20px;
                font-size: 0.82em;
                letter-spacing: 3px;
                color: #c6401f;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(255, 243, 234, 0.5));
                border: 1px solid rgba(224, 128, 113, 0.35);
                border-radius: 999px;
                box-shadow: 0 2px 8px rgba(224, 128, 113, 0.18);
                transition: all 0.25s ease;
                &:hover{
                    color: #fff;
                    background: linear-gradient(135deg, rgba(224, 128, 113, 0.95), rgba(250, 130, 145, 0.9));
                    box-shadow: 0 4px 14px rgba(224, 128, 113, 0.35);
                }
            }
            &.hot-error{
                .hot-state-icon{
                    color: rgba(219, 69, 35, 0.9);
                    background:
                        radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.9) 0%, transparent 45%),
                        linear-gradient(135deg, rgba(250, 130, 145, 0.4), rgba(224, 128, 113, 0.35));
                    box-shadow: 0 6px 16px rgba(224, 128, 113, 0.18),
                        inset 0 1px 0 rgba(255, 255, 255, 0.6);
                }
            }
        }
    }
}

@keyframes hot-spin{
    to { transform: rotate(360deg); }
}

@keyframes hot-float{
    0%, 100%{ transform: translateY(0); }
    50%{ transform: translateY(-6px); }
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
    0%   { text-shadow: 0 0 4px #e08071; }
  100% { text-shadow: 0 0 12px #fa8291, 0 0 24px #e06052; }
}
@keyframes uncover{
    0%   { clip-path: inset(0 0 0 0); }
    100% { clip-path: inset(0 0 100% 0); }
}
</style>
