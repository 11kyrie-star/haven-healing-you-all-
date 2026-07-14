<template>
    <div class="avatar-container">
        <div class="img">
            <img v-if="baseUrl" class="avatar-img" :src=baseUrl>
            <img v-else src="@/assets/avatar.jpg" class="avatar-img">
        </div>
        <input type="file" style="display: none;" >
        
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const baseUrl=ref('')
</script>

<style scoped lang="scss">
.avatar-container{
    width: fit-content;
    height: fit-content;
    position: absolute;
    border-radius: 8px;
    background-color: white;
    padding: 2px;
    box-shadow: 1px 2px #ee794e;
    left: 13%;
    top: 63%;
    .img{
        width: 110px;
        height: 110px;
        border-radius: 8px;
        .avatar-img{
            width: 100%;
            height: 100%;
            border-radius: 8px;
            object-fit: cover;
            cursor: pointer;
        }
    }
}
</style>