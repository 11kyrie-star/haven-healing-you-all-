<template>
<div class="post-container">
    <div class="card-item" v-for="item in postlist" :key="item.id">
    <PostCard  :id="item.id" :user_id="item.user_id" :avatar="item.avatar" :username="item.username" :create_at="item.created_at" :content="item.content" :comment_count="item.comment_count" :view_count="item.view_count" :images="item.images" :like_count="item.like_count" :is_liked="item.is_liked"></PostCard>
    </div>
    <div ref="sentry" v-if="hasMore" class="load-more">
        <span v-if="loading" class="spinner"></span>
        {{ loading?'加载中...':'上拉加载更多' }}
    </div>
    <div v-else-if="!hasMore" class="load-more">到底啦....</div>
</div>
</template>

<script setup lang="ts">
import PostCard from '@/components/PostCard.vue';
import { getpostapi } from '@/api/aboutpost';
import {ref,onMounted,watch} from 'vue'
import { useIntersectionObserver } from '@vueuse/core';
import type { getpost,postitem ,post} from '@/types/post';
import { usePostFeedStore } from '@/stores/postfeed';
const feedpost=usePostFeedStore()
let res=ref<getpost>()
let postlist=ref<postitem[]>([])
let page=ref(1)
const size=10
const sentry=ref<HTMLElement | null>()
//数据加载
const loading=ref(false)
const hasMore=ref(true)
const loadmore=async()=>{
if(loading.value || !hasMore){return}
loading.value=true
try{
const postres=await getpostapi({page:page.value,size:size})
    if(postres.status===0){
       res.value=postres
       postlist.value.push(...res.value.data.list)
       page.value++
       hasMore.value=res.value.data.hasMore
    }
}catch{

}finally{
    loading.value=false
}
}
onMounted(loadmore)

const addpost=(post:post)=>{
    postlist.value.unshift(post)
}
watch(()=>feedpost.newpost,(P)=>{
    if(P){
        addpost(P)
        feedpost.consume()
    }
})
//检测某个元素是否到指定位置
useIntersectionObserver(sentry,([entry])=>{
if(entry?.isIntersecting){loadmore()}
},{rootMargin:'0px 0px 40% 0px'})
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

    /* 加载中的旋转小圆点 */
    .spinner{
        width: 14px;
        height: 14px;
        border: 2px solid rgba(224, 128, 113, 0.2);
        border-top-color: rgba(224, 128, 113, 0.9);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    /* 没有更多数据时的弱化样式 */
    &.end{
        color: rgba(128, 128, 128, 0.45);
        font-size: 12px;
        letter-spacing: 3px;
    }
}

@keyframes spin{
    to { transform: rotate(360deg); }
}
}
</style>