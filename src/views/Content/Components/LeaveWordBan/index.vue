<template>
    <div class="post-container">
      <Ban></Ban>
    </div>
</template>

<style scoped lang="scss">
.post-container{
    width: 40%;
    min-height: 80%;
    padding: 15px;
    background: linear-gradient(
        135deg,
        rgba(224, 128, 113, 0.603) 0%,
        transparent 90%
    ),#f1e3e0;
    display: flex;
    flex-direction: column;
    gap: 15px;
    align-items: center;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05),    /* 柔和外阴影 */
        0 10px 20px rgba(0, 0, 0, 0.08),   /* 中层阴影 */
        0 20px 40px rgba(0, 0, 0, 0.1),    /* 底层阴影 */
}
</style>

<script setup lang="ts">
import Ban from './Components/Ban.vue';
</script>
