<template>
    <div class="myword-list">
        <div v-for="item in list" :key="item.my_message.id">
        <MyWordCard :item="item"></MyWordCard>
        </div>
    </div>
</template>

<style scoped lang="scss">
.myword-list {
    width: 100%;
    flex: 1;
    min-height: 52vh;
    padding: 14px;
    border-radius: 14px;
    background:
        linear-gradient(160deg, rgba(247, 140, 107, 0.14) 0%, rgba(243, 79, 103, 0.06) 60%, transparent 100%),
        rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.7);
    box-shadow: 0 2px 12px rgba(120, 60, 40, 0.06);
    display: flex;
    flex-direction: column;
    gap: 14px;
}
</style>

<script setup lang="ts">
import MyWordCard from '../MyWordCard.vue';
import { myleaveword } from '@/api/aboutpost.ts';
import type { myleaveworddata } from '@/types/post.ts';
import { onMounted,ref } from 'vue';
const list=ref<myleaveworddata[]>([])
onMounted(async()=>{
const res=await myleaveword({page:1,size:10})
if(res.status===0){
    list.value=res.data.list
}
})
onMounted
</script>
