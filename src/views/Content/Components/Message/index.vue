<template>
    <div class="message-container" :class="{ 'has-messages': store.list.length }">
        <div class="message-list">
            <div class="message-toolbar" v-if="store.list.length">
                <div class="message-heading">
                    <span class="message-heading-icon">
                        <el-icon :size="16"><Bell /></el-icon>
                    </span>
                    <span class="message-heading-title">消息通知</span>
                    <span class="message-count">{{ store.unread }}</span>
                </div>
                <button class="clear-button" type="button" aria-label="清空消息" @click="clearmsg">
                    <span class="clear-button-icon" aria-hidden="true">×</span>
                    <span>清空</span>
                </button>
            </div>
            <Card v-for="item in store.list" :key="item.id" :item="item" />
            <div class="empty" v-if="(empty && !loading) || store.list.length===0" style="user-select: none;">
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
        <div v-else-if="(!empty &&!hasMore) || store.list.length" class="load-more" style="cursor: default; user-select: none;">到底啦....</div>
        </div>
    </div>
</template>

<script setup lang="ts">import Card from './Components/Card.vue'
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
onMounted(async ()=>{
    await loadmore()
    store.MarkAllread()
})
useIntersectionObserver(sentry,([entry])=>{
if(entry?.isIntersecting){loadmore()}
},{rootMargin:'0px 0px 40% 0px'})
const reload=()=>{
    window.location.reload()
}
//清空通知
let timer1:ReturnType<typeof setTimeout> | null=null
const clearmsg=()=>{
    if(timer1){return}
    timer1=setTimeout(()=>{
        store.clearmessage()
        timer1=null
    },1000)
}
</script>

<style scoped lang="scss">
.message-container {
    width: 30%;
    min-width: 0;
    min-height: 90vh;
    box-sizing: border-box;
    position: relative;
    padding: 18px 16px;
    background-color: #f4e4df;
    background-image:
        linear-gradient(135deg, rgba(255, 255, 255, 0.34) 0%, transparent 46%),
        repeating-linear-gradient(0deg, rgba(120, 60, 40, 0.035) 0 1px, transparent 1px 18px),
        repeating-linear-gradient(90deg, rgba(120, 60, 40, 0.035) 0 1px, transparent 1px 18px),
        linear-gradient(145deg, #f6e5df 0%, #f1dfe2 52%, #eadfe7 100%);
    background-blend-mode: soft-light, normal, normal, normal;
    background-size: auto, 18px 18px, 18px 18px, auto;
    border: 1px solid rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(8px);
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 20px rgba(0, 0, 0, 0.08), 0 20px 40px rgba(0, 0, 0, 0.1);
    margin-right: 3%;
    align-self: flex-start;
    font-family: 'LXGW WenKai', 'Inter', sans-serif;
    color: rgba(50, 50, 50, 0.85);
    overflow: hidden;
    isolation: isolate;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background:
            linear-gradient(115deg, transparent 0 68%, rgba(255, 255, 255, 0.18) 68% 69%, transparent 69% 100%),
            linear-gradient(295deg, transparent 0 76%, rgba(250, 130, 145, 0.08) 76% 77%, transparent 77% 100%);
        opacity: 0.55;
    }

    &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 22px;
        right: 22px;
        z-index: 1;
        height: 3px;
        border-radius: 0 0 4px 4px;
        background: linear-gradient(90deg, rgba(233, 189, 124, 0.9), rgba(224, 128, 113, 0.9), rgba(250, 130, 145, 0.75));
        box-shadow: 0 2px 8px rgba(224, 128, 113, 0.2);
        pointer-events: none;
    }

    &.has-messages {
        background-image:
            linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, transparent 44%),
            repeating-linear-gradient(0deg, rgba(120, 60, 40, 0.045) 0 1px, transparent 1px 18px),
            repeating-linear-gradient(90deg, rgba(120, 60, 40, 0.045) 0 1px, transparent 1px 18px),
            linear-gradient(145deg, #fae9e1 0%, #f2dce3 52%, #e9ddeb 100%);

        &::before {
            opacity: 1;
        }
    }

    .message-toolbar {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 2px 2px 12px;
        border-bottom: 1px solid rgba(224, 167, 167, 0.28);

        .message-heading {
            display: flex;
            min-width: 0;
            align-items: center;
            gap: 8px;
        }

        .message-heading-icon {
            display: grid;
            flex: 0 0 28px;
            width: 28px;
            height: 28px;
            place-items: center;
            border-radius: 8px;
            color: #c6401f;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(247, 199, 190, 0.5));
            box-shadow: inset 0 0 0 1px rgba(224, 128, 113, 0.16), 0 2px 6px rgba(120, 60, 40, 0.08);
        }

        .message-heading-title {
            overflow: hidden;
            font-size: 0.92em;
            font-weight: 700;
            color: rgba(80, 50, 45, 0.86);
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .message-count {
            display: flex;
            min-width: 20px;
            height: 20px;
            padding: 0 6px;
            box-sizing: border-box;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            color: #b9465a;
            background: rgba(243, 79, 103, 0.12);
            font-size: 0.72em;
            font-weight: 700;
        }

        .clear-button {
            display: flex;
            align-items: center;
            gap: 4px;
            flex-shrink: 0;
            padding: 5px 11px;
            border: 1px solid rgba(224, 128, 113, 0.25);
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.5);
            color: rgba(120, 60, 40, 0.72);
            font-family: inherit;
            font-size: 0.76em;
            font-weight: 700;
            line-height: 1;
            cursor: pointer;
            transition: color 0.22s ease, background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s ease;

            &:hover {
                color: #fff;
                background: linear-gradient(135deg, #f78c6b 0%, #f34f67 100%);
                border-color: transparent;
                box-shadow: 0 4px 12px rgba(243, 79, 103, 0.3);
                transform: translateY(-1px);
            }

            &:active {
                transform: translateY(0) scale(0.96);
                box-shadow: 0 2px 6px rgba(243, 79, 103, 0.24);
            }
        }

        .clear-button-icon {
            font-size: 1.15em;
            line-height: 1;
        }
    }

    .message-list {
        position: relative;
        z-index: 1;
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
