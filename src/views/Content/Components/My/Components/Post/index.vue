<template>
<div class="post-container">
    <div class="card-item" v-for="(item,index) in postlist" :key="item.id">
    <PostCard  @delete="deletepost" :id="item.id" :user_id="item.user_id" :avatar="item.avatar" :username="item.username" :create_at="item.created_at" :content="item.content" :comment_count="item.comment_count" :view_count="item.view_count" :images="item.images" :like_count="item.like_count" :is_liked="item.is_liked" :is_public="item.is_public" :index="index"></PostCard>
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
            <el-icon :size="42" class="state-icon"><Document /></el-icon>
        </div>
        <p class="state-title" style="cursor: default;">还没有发布帖子</p>
        <p class="state-sub" style="cursor: default;">当你发布帖子时，<br />会第一时间出现在这里</p>
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
        <div class="state-tip" style="cursor: pointer;" @click="reload">刷新重试</div>
    </div>
</div>
</template>

<script setup lang="ts">
import PostCard from '@/views/Content/Components/My/Components/Post/Components/PostCard.vue';
import { getmypost } from '@/api/aboutpost';
import {ref,onMounted,watch} from 'vue'
import type { getpost,postitem ,post} from '@/types/post';
import { usePostFeedStore } from '@/stores/postfeed';
import { Document, WarningFilled } from '@element-plus/icons-vue'
const feedpost=usePostFeedStore()
let res=ref<getpost>()
let postlist=ref<postitem[]>([])

// 状态页开关（初始均为 false，默认不展示，请自行编写切换逻辑）：
const isEmpty=ref(false)      // 请求成功且 postlist 为空时置 true
const hasError=ref(false)     // 请求失败时置 true

onMounted(async ()=>{
    try{
    const postres=await getmypost({page:1,size:10})
    if(postres.status===0){
    res.value=postres
    postlist.value=res.value.data.list
    if(postlist.value.length===0){
        isEmpty.value=true
    }
    }
    }catch{
        hasError.value=true
    }
})
const addpost=(post:post)=>{
    postlist.value.unshift(post)
}
watch(()=>feedpost.newpost,(P)=>{
    if(P){
        addpost(P)
        feedpost.consume()
    }
})
const deletepost=(index:number)=>{
    postlist.value.splice(index,1)
}
const reload=()=>{
    window.location.reload()
}
</script>

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
                animation: post-float 4s ease-in-out infinite;
            }

            .halo-2 {
                inset: -13px;
                border: 1.5px dashed rgba(224, 128, 113, 0.38);
                animation: post-spin 20s linear infinite;
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
                animation: post-twinkle 2.6s ease-in-out infinite;
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

@keyframes post-float {
    0%, 100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-9px);
    }
}

@keyframes post-spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

@keyframes post-twinkle {
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