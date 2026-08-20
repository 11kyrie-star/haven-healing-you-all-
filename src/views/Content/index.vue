<template>
    <div class="content-container">
        <Navigation></Navigation>
        <Nav :show="detail==='detail'"></Nav>
       <div class="content">
        <Hottop></Hottop>
        <RouterView></RouterView>
        <Publish></Publish>
       </div>
    </div>
</template>

<script setup lang="ts">
import Navigation from '@/views/Content/Components/Navigation/index.vue'
import Hottop from '@/views/Content/Components/Hottop/index.vue'
import Publish from '@/views/Content/Components/Publish/index.vue'
import Nav from '@/views/Content/Components/AnotherNaviigation/index.vue'
import { useRoute } from 'vue-router';
import {computed,provide} from 'vue'
const route=useRoute()
const detail=computed(()=>{
const arr=route.path.split('/').filter(Boolean)
return arr.length>=2? arr.at(-2) : ''
})
</script>

<style scoped lang="scss">
.content-container{
    width: 100%;
    min-height: 65vh;
    position: relative;
    z-index: 1;
    .content{
        width: 100%;
        min-height: 80%;
        display: flex;
        gap: 7%;
        margin-top: 3%;
    }
}
</style>