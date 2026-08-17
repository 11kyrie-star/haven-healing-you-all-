<template>
    <div class="post-container">
        <PostCard v-for="item in list" :item="item" :key="item.id"></PostCard>
    </div>
</template>

<script setup lang="ts">
import PostCard from '@/views/Content/Components/My/Components/Mycomment/Components/PostCard.vue'
import type { myconmentitem } from '@/types/post';
import { getmycommentpost } from '@/api/aboutpost';
import { ref,onMounted } from 'vue';
const list=ref<myconmentitem[]>([])
onMounted(async()=>{
    const res=await getmycommentpost({page:1,size:10})
    console.log(res)
    if(res.status===0){
        list.value=res.data.list
    }
})
</script>

<style scoped lang="scss">
.post-container{
    width: 40%;
    min-height: 80%;
    padding: 15px;
    background: linear-gradient(
        135deg,
        rgba(224, 128, 113, 0.603) 0%,
        transparent 90%
    ),#f1e3e0;
    display: flex;
    flex-direction: column;
    gap: 15px;
    align-items: center;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05),    /* 柔和外阴影 */
        0 10px 20px rgba(0, 0, 0, 0.08),   /* 中层阴影 */
        0 20px 40px rgba(0, 0, 0, 0.1),    /* 底层阴影 */
}
</style>
