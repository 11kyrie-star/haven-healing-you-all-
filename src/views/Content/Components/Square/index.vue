<template>
<div class="post-container">
    <div class="card-item" v-for="item in postlist" :key="item.id">
    <PostCard  :id="item.id" :user_id="item.user_id" :avatar="item.avatar" :username="item.username" :create_at="item.created_at" :content="item.content" :comment_count="item.comment_count" :view_count="item.view_count" :images="item.images" :like_count="item.like_count" :is_liked="item.is_liked"></PostCard>
    </div>
</div>
</template>

<script setup lang="ts">
import PostCard from '@/components/PostCard.vue';
import { getpostapi } from '@/api/aboutpost';
import {ref,onMounted,watch} from 'vue'
import type { getpost,postitem ,post} from '@/types/post';
import { usePostFeedStore } from '@/stores/postfeed';
const feedpost=usePostFeedStore()
let res=ref<getpost>()
let postlist=ref<postitem[]>([])
onMounted(async ()=>{
    const postres=await getpostapi({page:1,size:10})
    res.value=postres
    postlist.value=res.value.data.list
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
}
</style>