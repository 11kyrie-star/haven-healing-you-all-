<template>
    <div class="post-container">
      <Ban></Ban>
      <Bubbles></Bubbles>
    </div>
</template>

<style scoped lang="scss">
.post-container{
    width: 40%;
    min-height: 80%;
    padding: 15px;
    background:
        radial-gradient(circle at 12% 8%, rgba(233, 189, 124, 0.32) 0%, transparent 42%),
        radial-gradient(circle at 88% 92%, rgba(250, 130, 145, 0.22) 0%, transparent 48%),
        linear-gradient(
            135deg,
            rgba(224, 128, 113, 0.5) 0%,
            rgba(224, 128, 113, 0.1) 45%,
            transparent 92%
        ),
        #f4e4df;
    border: 1px solid rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(8px);
    display: flex;
    flex-direction: column;
    gap: 15px;
    align-items: center;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05),    /* 柔和外阴影 */
        0 10px 20px rgba(0, 0, 0, 0.08),   /* 中层阴影 */
        0 20px 40px rgba(0, 0, 0, 0.1);    /* 底层阴影 */
}
</style>

<script setup lang="ts">
import Ban from './Components/Ban.vue';
import Bubbles from './Components/Bubbles.vue';
</script>
