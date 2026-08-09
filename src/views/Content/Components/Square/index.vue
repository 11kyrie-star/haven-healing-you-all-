<template>
<div class="post-container">
    <div class="card-item" v-for="item in postlist">
    <PostCard :id="item.id" :user_id="item.user_id" :avatar="item.avatar" :username="item.username" :create_at="item.created_at" :content="item.content" :comment_count="item.comment_count" :view_count="item.view_count" :images="item.images" :like_count="item.like_count"></PostCard>
    </div>
</div>
</template>

<script setup lang="ts">
import PostCard from '@/components/PostCard.vue';
import { getpostapi } from '@/api/aboutpost';
import {ref,onMounted} from 'vue'
import type { getpost,postitem } from '@/types/post';
let res=ref<getpost>()
let postlist=ref<postitem[]>([])
onMounted(async ()=>{
    const postres=await getpostapi({page:1,size:10})
    res.value=postres
    postlist.value=res.value.data.list
})

</script>

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