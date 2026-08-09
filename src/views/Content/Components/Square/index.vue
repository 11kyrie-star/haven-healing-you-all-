<template>
<div class="post-container">
    <div class="card-item">
    <PostCard></PostCard>
    </div>
</div>
</template>

<script setup lang="ts">
import PostCard from '@/components/PostCard.vue';
import { getpostapi } from '@/api/aboutpost';
import {ref} from 'vue'
import type { getpost,postitem } from '@/types/post';
let res=ref<getpost>()
let postlist=ref<postitem[]>([])

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