<template>
    <div class="content-container">
        <Navigation></Navigation>
        <Nav :data="cumbs"></Nav>
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
import { useCrumbStore } from '@/stores/crumb'
import {computed} from 'vue'
const store=useCrumbStore()
const cumbs=computed(()=>(store.stack))
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