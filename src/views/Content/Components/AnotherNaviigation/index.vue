<template>
    <div class="nav-container" v-if="props.show">
        <div class="comment" @click="back">评论</div>
        <div style="cursor: default;">></div>
        <div style="cursor: default; font-weight: 700;">详情</div>
    </div>
</template>

<style scoped lang="scss">
.nav-container{
    display: flex;
    width: fit-content;
    height: fit-content;
    position: absolute;
    left: 31%;
    gap: 10px;
    top: 6%;
    font-family: 'LXGW WenKai', 'Inter', sans-serif;
    font-size: 1.1em;
    user-select: none;
    .comment{
        cursor: pointer;
        &:hover{
            font-weight: 700;
        }
    }
}
</style>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import {ref} from 'vue'
const router=useRouter()
const back=()=>{
    router.push('/layout/content/mycomment')
}
const props=defineProps<{show:boolean}>()
</script>