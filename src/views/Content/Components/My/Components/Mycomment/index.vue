<template>
    <div class="post-container">
        <PostCard v-for="item in list" :item="item" :key="item.id"></PostCard>

        <!-- 空数据状态页：请求成功但没有任何数据时，请将 isEmpty 置为 true -->
        <div class="state-page" v-if="isEmpty" style="user-select: none;">
            <div class="state-illustration">
                <div class="halo halo-1"></div>
                <div class="halo halo-2"></div>
                <span class="sparkle s1">✦</span>
                <span class="sparkle s2">✧</span>
                <span class="sparkle s3">✦</span>
                <span class="sparkle s4">✧</span>
                <el-icon :size="42" class="state-icon"><ChatDotRound /></el-icon>
            </div>
            <p class="state-title" style="cursor: default;">还没有发表过评论</p>
            <p class="state-sub" style="cursor: default;">当你发表评论的时候，<br />会第一时间出现在这里</p>
            <div class="state-tip" style="cursor: default;">静待第一条评论</div>
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
            <p class="state-sub" style="cursor: default;">评论加载失败，请检查网络后<br />再试一次</p>
            <div class="state-tip" style="cursor: pointer;" @click="reload">刷新重试</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import PostCard from '@/views/Content/Components/My/Components/Mycomment/Components/PostCard.vue'
import type { myconmentitem } from '@/types/post';
import { getmycommentpost } from '@/api/aboutpost';
import { ref,onMounted } from 'vue';
import { ChatDotRound, WarningFilled } from '@element-plus/icons-vue'
const list=ref<myconmentitem[]>([])

const hasError=ref(false)     // 请求失败时置 true
const isEmpty=ref(false)
onMounted(async()=>{
    try{
    const res=await getmycommentpost({page:1,size:10})
    console.log(res)
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
.post-container{
    width: 40%;
    min-height: 80%;
    padding: 15px;
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
    display: flex;
    flex-direction: column;
    gap: 15px;
    align-items: center;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05),    /* 柔和外阴影 */
        0 10px 20px rgba(0, 0, 0, 0.08),   /* 中层阴影 */
        0 20px 40px rgba(0, 0, 0, 0.1);    /* 底层阴影 */

    .state-page {
        margin-top: 12vh;
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
                animation: state-float 4s ease-in-out infinite;
            }

            .halo-2 {
                inset: -13px;
                border: 1.5px dashed rgba(224, 128, 113, 0.38);
                animation: state-spin 20s linear infinite;
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
                animation: state-twinkle 2.6s ease-in-out infinite;
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

        .state-tip {
            margin-top: 6px;
            padding: 6px 18px;
            font-size: 0.82em;
            letter-spacing: 4px;
            color: #c6401f;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.78) 0%, rgba(255, 243, 234, 0.5) 100%);
            border: 1px solid rgba(224, 128, 113, 0.35);
            border-radius: 999px;
            box-shadow: 0 2px 8px rgba(224, 128, 113, 0.18);
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

@keyframes state-float {
    0%, 100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-9px);
    }
}

@keyframes state-spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

@keyframes state-twinkle {
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