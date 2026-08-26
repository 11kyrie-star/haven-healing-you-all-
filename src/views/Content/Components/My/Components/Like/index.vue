<template>
<div class="post-container">
    <div class="card-item" v-for="(item,index) in postlist" :key="item.id">
    <PostCard @deletelikepost="deletepost" :id="item.id" :user_id="item.user_id" :avatar="item.avatar" :username="item.username" :create_at="item.created_at" :content="item.content" :comment_count="item.comment_count" :view_count="item.view_count" :images="item.images" :like_count="item.like_count" :is_liked="item.is_liked" :is_public="item.is_public" :index="index"></PostCard>
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
            <el-icon :size="42" class="state-icon"><StarFilled /></el-icon>
        </div>
        <p class="state-title" style="cursor: default;">还没有赞过的帖子</p>
        <p class="state-sub" style="cursor: default;">当你点赞喜欢的帖子时，<br />会第一时间出现在这里</p>
        <div class="state-tip" @click="push" style="cursor: pointer;">去逛逛</div>
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
        <p class="state-sub" style="cursor: default;">帖子加载失败，请检查网络后<br />再试一次</p>
        <div class="state-tip" @click="reload" style="cursor: pointer;">刷新重试</div>
    </div>
    <div ref="sentry" v-if="hasMore" class="load-more" style="cursor: default; user-select: none;">
        <span v-if="loading" class="spinner"></span>
        {{ loading?'加载中...':'上拉加载更多' }}
    </div>
    <div v-else-if="!isEmpty&&!hasMore" class="load-more" style="cursor: default; user-select: none;">到底啦....</div>
</div>
</template>

<script setup lang="ts">import PostCard from '@/views/Content/Components/My/Components/Like/Components/PostCard.vue';
import { getlikepost } from '@/api/aboutpost';
import {ref,onMounted} from 'vue'
import { useRouter } from 'vue-router';
import { useIntersectionObserver } from '@vueuse/core';
import type { getpost,postitem ,post} from '@/types/post';
import { StarFilled, WarningFilled } from '@element-plus/icons-vue'
let res=ref<getpost>()
let postlist=ref<postitem[]>([])
const router=useRouter()
// 状态页开关（初始均为 false，默认不展示，请自行编写切换逻辑）：
const isEmpty=ref(false)      // 请求成功且 postlist 为空时置 true
const hasError=ref(false)     // 请求失败时置 true
const hasMore=ref(true)
const loading=ref(false)
const sentry=ref<HTMLElement | null>()
const page=ref(1)
const size=10
const loadmore=async()=>{
if(loading.value || !hasMore.value){return}
if(hasError.value){hasError.value=false}
loading.value=true
try{
    const postres=await getlikepost({page:page.value,size:size})
    if(postres.status===0){
       res.value=postres
       postlist.value.push(...res.value.data.list)
       hasMore.value=res.value.data.list.length===size
       page.value++
       if(postlist.value.length===0){
        isEmpty.value=true
       }
    }
}catch{
    hasError.value=true
}finally{
    loading.value=false
}
}
onMounted(loadmore)
useIntersectionObserver(sentry,([entry])=>{
if(entry?.isIntersecting){loadmore()}
},{rootMargin:'0px 0px 40% 0px'})
const deletepost=(index:number)=>{
    postlist.value.splice(index,1)
}
const reload=()=>{
    window.location.reload()
}
const push=()=>{
    router.push('/layout/content/square')
}</script>

<style scoped lang="scss">
.post-container{
    width: 40%;
    min-height: 80%;
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
                animation: like-float 4s ease-in-out infinite;
            }

            .halo-2 {
                inset: -13px;
                border: 1.5px dashed rgba(224, 128, 113, 0.38);
                animation: like-spin 20s linear infinite;
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
                animation: like-twinkle 2.6s ease-in-out infinite;
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

@keyframes spin{
    to { transform: rotate(360deg); }
}
@keyframes like-float {
    0%, 100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-9px);
    }
}

@keyframes like-spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

@keyframes like-twinkle {
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