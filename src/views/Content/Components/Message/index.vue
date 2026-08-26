<template>
    <div class="message-container">
        <div class="message-list">
            <Card v-for="item in store.list" :key="item.id" :item="item" />
            <div class="empty" v-if="empty && !loading" style="user-select: none;">
                <div class="empty-illustration">
                    <div class="halo halo-1"></div>
                    <div class="halo halo-2"></div>
                    <span class="sparkle s1">✦</span>
                    <span class="sparkle s2">✧</span>
                    <span class="sparkle s3">✦</span>
                    <span class="sparkle s4">✧</span>
                    <el-icon :size="42" class="empty-icon"><Bell /></el-icon>
                </div>
                <p class="empty-title" style="cursor: default;">暂无消息通知</p>
                <p class="empty-sub" style="cursor: default;">当有人点赞、评论或回复你时，<br />会第一时间在这里提醒你</p>
                <div class="empty-tip" style="cursor: default;">静候佳音</div>
            </div>

            <!-- 网络异常状态页：请求失败时，请将 hasError 置为 true -->
            <div class="empty state-error" v-if="store.connect" style="user-select: none;">
                <div class="empty-illustration">
                    <div class="halo halo-1"></div>
                    <div class="halo halo-2"></div>
                    <span class="sparkle s1">✦</span>
                    <span class="sparkle s2">✧</span>
                    <span class="sparkle s3">✦</span>
                    <span class="sparkle s4">✧</span>
                    <el-icon :size="42" class="empty-icon"><WarningFilled /></el-icon>
                </div>
                <p class="empty-title" style="cursor: default;">网络开小差了</p>
                <p class="empty-sub" style="cursor: default;">通知加载失败，请检查网络后<br />再试一次</p>
                <div class="empty-tip" style="cursor: default;" @click="reload">刷新重试</div>
            </div>
        <div ref="sentry" v-if="hasMore" class="load-more" style="cursor: default; user-select: none;">
            <span v-if="loading" class="spinner"></span>
            {{ loading?'加载中...':'上拉加载更多' }}
        </div>
        <div v-else-if="!empty &&!hasMore" class="load-more" style="cursor: default; user-select: none;">到底啦....</div>
        </div>
    </div>
</template>

<script setup lang="ts">import Card from './Components/Card.vue'
import type { NotificationItem } from '@/types/note.ts';
import { Bell, WarningFilled } from '@element-plus/icons-vue'
import { useNotificationStore } from '@/stores/note_pub.ts';
import { getunreadnote } from '@/api/note.ts';
import { useIntersectionObserver } from '@vueuse/core';
import { ref,onMounted } from 'vue';
const store=useNotificationStore()
const empty=ref(false)
const hasMore=ref(true)
const loading=ref(false)
const sentry=ref<HTMLElement | null>()
const page=ref(1)
const size=10
const loadmore=async()=>{
if(loading.value || !hasMore.value){return}
if(store.connect){store.connect=false}
loading.value=true
try{
    const res=await getunreadnote({page:page.value,size:size})
    if(res.status===0){
        if(page.value===1){
            store.init(res.data.list)
            if(store.list.length===0){
                empty.value=true
            }
        }else{
            store.list.push(...res.data.list)
        }
        hasMore.value=res.data.hasMore
        page.value++
    }
}catch{
    store.connect=true
}finally{
    loading.value=false
}
}
onMounted(()=>{
    loadmore()
    store.MarkAllread()
})
useIntersectionObserver(sentry,([entry])=>{
if(entry?.isIntersecting){loadmore()}
},{rootMargin:'0px 0px 40% 0px'})
const reload=()=>{
    window.location.reload()
}</script>

<style scoped lang="scss">
.message-container {
    width: 30%;
    min-width: 0;
    min-height: 90vh;
    box-sizing: border-box;
    padding: 18px 16px;
    background:
        radial-gradient(circle at 12% 8%, rgba(233, 189, 124, 0.3) 0%, transparent 42%),
        radial-gradient(circle at 88% 92%, rgba(250, 130, 145, 0.22) 0%, transparent 48%),
        linear-gradient(135deg, rgba(224, 128, 113, 0.42) 0%, rgba(224, 128, 113, 0.08) 45%, transparent 92%),
        #f4e4df;
    border: 1px solid rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(8px);
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 20px rgba(0, 0, 0, 0.08), 0 20px 40px rgba(0, 0, 0, 0.1);
    margin-right: 3%;
    align-self: flex-start;
    font-family: 'LXGW WenKai', 'Inter', sans-serif;
    color: rgba(50, 50, 50, 0.85);

    .message-list {
        margin-top: 14px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        max-height: 74vh;
        overflow-y: auto;
        padding-right: 6px;

        &::-webkit-scrollbar {
            width: 6px;
        }

        &::-webkit-scrollbar-thumb {
            background: rgba(224, 128, 113, 0.4);
            border-radius: 999px;
        }

        &::-webkit-scrollbar-track {
            background: transparent;
        }
    .load-more{
        width: 100%;
        padding: 20px 0 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 13px;
        color: rgba(224, 128, 113, 0.85);
        letter-spacing: 2px;
        user-select: none;
        flex-shrink: 0;
        .spinner{
            width: 14px;
            height: 14px;
            border: 2px solid rgba(224, 128, 113, 0.2);
            border-top-color: rgba(224, 128, 113, 0.9);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        &.end{
            color: rgba(128, 128, 128, 0.45);
            font-size: 12px;
            letter-spacing: 3px;
        }
    }
    }

    .empty {
        margin-top: 13vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        text-align: center;
        color: rgba(128, 128, 128, 0.6);

        .empty-illustration {
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
                animation: empty-float 4s ease-in-out infinite;
            }

            .halo-2 {
                inset: -13px;
                border: 1.5px dashed rgba(224, 128, 113, 0.38);
                animation: halo-spin 20s linear infinite;
            }

            .empty-icon {
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
                animation: sparkle-twinkle 2.6s ease-in-out infinite;
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

        .empty-title {
            font-size: 1.05em;
            font-weight: 700;
            letter-spacing: 2px;
            color: rgba(80, 80, 80, 0.82);
        }

        .empty-sub {
            font-size: 0.85em;
            line-height: 1.8;
            letter-spacing: 1px;
            color: rgba(128, 128, 128, 0.62);
        }

        .empty-tip {
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

            .empty-icon {
                filter: drop-shadow(0 4px 8px rgba(219, 69, 35, 0.5));
            }

            .empty-tip {
                color: #c6401f;
                border-color: rgba(219, 69, 35, 0.4);
                box-shadow: 0 2px 8px rgba(219, 69, 35, 0.2);
            }
        }
    }
}

@keyframes spin{
    to { transform: rotate(360deg); }
}
@keyframes empty-float {
    0%, 100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-9px);
    }
}

@keyframes halo-spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

@keyframes sparkle-twinkle {
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
