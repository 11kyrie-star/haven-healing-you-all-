<template>
    <div class="post-container">
       <PostCard v-if="post" :id="post.id" :user_id="post.user_id" :avatar="post.avatar" :username="post.username" :create_at="post.created_at" :content="post.content" :images="post.images" :view_count="post.view_count" :comment_count="post.comment_count" :like_count="post.like_count" :is_liked="post.is_liked"></PostCard>
    </div>
</template>

<style scoped lang="scss">
.post-container{
    width: 40%;
    min-height: 80%;
    background: linear-gradient(
        135deg,
        rgba(224, 128, 113, 0.603) 0%,
        transparent 90%
    ),#f1e3e0;
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05),    /* 柔和外阴影 */
        0 10px 20px rgba(0, 0, 0, 0.08),   /* 中层阴影 */
        0 20px 40px rgba(0, 0, 0, 0.1),    /* 底层阴影 */
}
</style>

<script setup lang="ts">
import PostCard from '@/components/PostCard.vue';
import { useRoute } from 'vue-router';
import { detailpostapi } from '@/api/aboutpost';
import type { detaildata } from '@/types/post';
import {ref,onMounted} from 'vue'
const route=useRoute()
const id=Number(route.params.id)
const post=ref<detaildata['data']>()
onMounted(async ()=>{
const res=await detailpostapi(id)
if(res.status===0){
    post.value=res.data
}
})
</script>