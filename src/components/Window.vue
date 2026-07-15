<template>
    <div v-if="visible" class="window-overlay" @click.self="emit('close')">
        <div class="window-card">
           <div class="window-img">
              <img src="@/assets/avatar.jpg">
           </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    visible:boolean
}>()
const emit=defineEmits<{
    close:[]
}>()
</script>
<style scoped lang="scss">
.window-overlay{
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(6px);
    display: flex;
    justify-content: center;
    align-items: center;
    .window-card{
        max-width: fit-content;
        max-height: fit-content;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        padding: 8px;
    }
    .window-img{
        img{
            width: 60vw;
            height: 50vw;
        }
    }
}
</style>