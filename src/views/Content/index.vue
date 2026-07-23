<template>
    <div class="content-container">
       <Navigation></Navigation>
       <div class="content">
        <Hottop></Hottop>
        <Post></Post>
        <Publish></Publish>
       </div>
    </div>
</template>

<script setup lang="ts">
import Navigation from '@/views/Content/Components/Navigation/index.vue'
import Hottop from '@/views/Content/Components/Hottop/index.vue'
import Post from '@/views/Content/Components/Post/index.vue'
import Publish from '@/views/Content/Components/Publish/index.vue'
</script>

<style scoped lang="scss">
.content-container{
    width: 100%;
    min-height: 65vh;
    position: relative;
    z-index: 1;
    .content{
        width: 100%;
        min-height: 90%;
        display: flex;
        gap: 10%;
    }
}
</style>