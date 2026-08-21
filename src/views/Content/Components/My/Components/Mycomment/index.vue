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
    gap: 15px;
    align-items: center;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05),    /* 柔和外阴影 */
        0 10px 20px rgba(0, 0, 0, 0.08),   /* 中层阴影 */
        0 20px 40px rgba(0, 0, 0, 0.1);    /* 底层阴影 */
}
</style>
