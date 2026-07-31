<template>
<div class="publish-container">
    <div class="avatar-wrap">
    <Avatar width="5vw" height="10vh" radius="50%"></Avatar>
    </div>
    <Name left="25%" top="2.9vh" fontsize="1.5em"></Name>
    <Editor margintop="2vh" minheight="20vh" decide="publish" :showeditor="true"></Editor>
</div>
</template>

<script setup lang="ts">
import Avatar from '@/components/Avatar.vue';
import Editor from '@/components/Editor.vue';
import Name from '@/views/Background/Components/Name/index.vue'
</script>

<style scoped lang="scss">
.publish-container{
    width: 30%;
    min-height: 40vh;
    padding: 5px;
    background: linear-gradient(
        135deg,
        rgba(224, 128, 113, 0.603) 0%,
        transparent 90%
    ),#f1e3e0;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05),    /* 柔和外阴影 */
        0 10px 20px rgba(0, 0, 0, 0.08),   /* 中层阴影 */
        0 20px 40px rgba(0, 0, 0, 0.1),    /* 底层阴影 */
        inset 0 0px 0 rgba(255, 255, 255, 0.8);
    border-radius: 8px;    
    margin-right: 3%;
    position: relative;
    align-self: flex-start;
}
</style>
