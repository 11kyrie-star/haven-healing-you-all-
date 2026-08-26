<template>
    <div class="myword-list">
        <div v-for="item in list" :key="item.my_message.id">
        <MyWordCard :item="item"></MyWordCard>
        </div>

        <!-- 空数据状态页：请求成功但没有任何数据时，请将 isEmpty 置为 true -->
        <div class="state-page" v-if="isEmpty" style="user-select: none;">
            <div class="state-illustration">
                <div class="halo halo-1"></div>
                <div class="halo halo-2"></div>
                <span class="sparkle s1">✦</span>
                <span class="sparkle s2">✧</span>
                <span class="sparkle s3">✦</span>
                <span class="sparkle s4">✧</span>
                <el-icon :size="42" class="state-icon"><ChatSquare /></el-icon>
            </div>
            <p class="state-title" style="cursor: default;">还没有发布留言</p>
            <p class="state-sub" style="cursor: default;">当你给友友留言时，<br />会在这里看到你留下的足迹</p>
        </div>

        <!-- 网络异常状态页：请求失败时，请将 hasError 置为 true -->
        <div class="state-page state-error" v-if="hasError" style="user-select: none;">
            <div class="state-illustration">
                <div class="halo halo-1"></div>
                <div class="halo halo-2"></div>
                <span class="sparkle s1">✦</span>
                <span class="sparkle s2">✧</span>
                <span class="sparkle s3">✦</span>
                <span class="sparkle s4">✧</span>
                <el-icon :size="42" class="state-icon"><WarningFilled /></el-icon>
            </div>
            <p class="state-title" style="cursor: default;">网络开小差了</p>
            <p class="state-sub" style="cursor: default;">留言加载失败，请检查网络后<br />再试一次</p>
            <p class="state-tip" @click="reload" style="cursor: pointer;">刷新重试</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import MyWordCard from '../MyWordCard.vue';
import { myleaveword } from '@/api/aboutpost.ts';
import type { myleaveworddata } from '@/types/post.ts';
import { onMounted,ref } from 'vue';
import { ChatSquare, WarningFilled } from '@element-plus/icons-vue'
const list=ref<myleaveworddata[]>([])

// 状态页开关（初始均为 false，默认不展示，请自行编写切换逻辑）：
const isEmpty=ref(false)      // 请求成功且 list 为空时置 true
const hasError=ref(false)     // 请求失败时置 true

onMounted(async()=>{
try{    
const res=await myleaveword({page:1,size:10})
if(res.status===0){
    list.value=res.data.list
    if(list.value.length===0){
        isEmpty.value=true
    }
}}catch{
        hasError.value=true
}
})
const reload=()=>{
    window.location.reload()
}
</script>

<style scoped lang="scss">
.myword-list {
    width: 100%;
    flex: 1;
    min-height: 52vh;
    padding: 14px;
    border-radius: 14px;
    background:
        linear-gradient(160deg, rgba(247, 140, 107, 0.14) 0%, rgba(243, 79, 103, 0.06) 60%, transparent 100%),
        rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.7);
    box-shadow: 0 2px 12px rgba(120, 60, 40, 0.06);
    display: flex;
    flex-direction: column;
    gap: 14px;

    .state-page {
        margin-top: 8vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        text-align: center;
        color: rgba(128, 128, 128, 0.6);

        .state-illustration {
            position: relative;
            width: 116px;
            height: 116px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 4px;

            .halo {
                position: absolute;
                border-radius: 50%;
            }

            .halo-1 {
                inset: 0;
                background:
                    radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.9) 0%, transparent 55%),
                    linear-gradient(135deg, rgba(233, 189, 124, 0.6) 0%, rgba(250, 130, 145, 0.42) 100%);
                box-shadow:
                    inset 0 0 0 1px rgba(255, 255, 255, 0.65),
                    0 10px 28px rgba(224, 128, 113, 0.3);
                animation: myword-float 4s ease-in-out infinite;
            }

            .halo-2 {
                inset: -13px;
                border: 1.5px dashed rgba(224, 128, 113, 0.38);
                animation: myword-spin 20s linear infinite;
            }

            .state-icon {
                position: relative;
                color: #fff;
                filter: drop-shadow(0 4px 8px rgba(224, 128, 113, 0.5));
            }

            .sparkle {
                position: absolute;
                font-size: 0.85em;
                line-height: 1;
                color: rgba(233, 189, 124, 0.95);
                pointer-events: none;
                animation: myword-twinkle 2.6s ease-in-out infinite;
            }

            .s1 {
                top: -4px;
                right: 8px;
            }

            .s2 {
                bottom: 6px;
                left: -6px;
                color: rgba(250, 130, 145, 0.9);
                animation-delay: 0.8s;
            }

            .s3 {
                top: 22px;
                left: -16px;
                animation-delay: 1.5s;
            }

            .s4 {
                bottom: -10px;
                right: 12px;
                color: rgba(250, 130, 145, 0.75);
                animation-delay: 2.1s;
            }
        }

        .state-title {
            font-size: 1.05em;
            font-weight: 700;
            letter-spacing: 2px;
            color: rgba(80, 80, 80, 0.82);
        }

        .state-sub {
            font-size: 0.85em;
            line-height: 1.8;
            letter-spacing: 1px;
            color: rgba(128, 128, 128, 0.62);
        }


        &.state-error {
            .halo-1 {
                background:
                    radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.9) 0%, transparent 55%),
                    linear-gradient(135deg, rgba(219, 69, 35, 0.7) 0%, rgba(250, 130, 145, 0.5) 100%);
                box-shadow:
                    inset 0 0 0 1px rgba(255, 255, 255, 0.65),
                    0 10px 28px rgba(219, 69, 35, 0.3);
            }

            .halo-2 {
                border-color: rgba(219, 69, 35, 0.4);
            }

            .state-icon {
                filter: drop-shadow(0 4px 8px rgba(219, 69, 35, 0.5));
            }

            .state-tip {
                color: #c6401f;
                border-color: rgba(219, 69, 35, 0.4);
                box-shadow: 0 2px 8px rgba(219, 69, 35, 0.2);
            }
        }
    }
}

@keyframes myword-float {
    0%, 100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-9px);
    }
}

@keyframes myword-spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

@keyframes myword-twinkle {
    0%, 100% {
        opacity: 0.3;
        transform: scale(0.75);
    }
    50% {
        opacity: 1;
        transform: scale(1.15);
    }
}
</style>