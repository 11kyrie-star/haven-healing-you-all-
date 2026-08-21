<template>
    <div class="taword-list">
        <div v-for="item in list" :key="item.id">
        <TaWordCard :item="item"></TaWordCard>
        </div>
    </div>
</template>

<style scoped lang="scss">
.taword-list {
    width: 100%;
    flex: 1;
    min-height: 52vh;
    padding: 14px;
    border-radius: 14px;
    background:
        linear-gradient(160deg, rgba(245, 169, 98, 0.14) 0%, rgba(224, 99, 61, 0.06) 60%, transparent 100%),
        rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.7);
    box-shadow: 0 2px 12px rgba(120, 60, 40, 0.06);
    display: flex;
    flex-direction: column;
    gap: 14px;
}
</style>

<script setup lang="ts">
import TaWordCard from '../TaWordCard.vue';
import {ref,onMounted} from 'vue'
import { taleaveword } from '@/api/aboutpost.ts';
import type { taleaveworddata } from '@/types/post.ts';
const list=ref<taleaveworddata[]>([])
onMounted(async()=>{
const res=await taleaveword({page:1,size:10})
console.log(res)
if(res.status===0){
    list.value=res.data.list
}
})
</script>

