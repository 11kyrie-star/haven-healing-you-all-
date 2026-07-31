<template>
<div class="publish-container">
    <Avatar></Avatar>
    <Editor></Editor>
</div>
</template>

<script setup lang="ts">
import Avatar from '@/components/Avatar.vue';
import Editor from '@/components/Editor.vue';
</script>

<style scoped lang="scss">
.publish-container{
    width: 25%;
    height: 30vh;
    background-color: white;
    margin-right: 3%;
}
</style>