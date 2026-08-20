<template>
    <div class="taword-list">
        <TaWordCard></TaWordCard>
    </div>
</template>

<style scoped lang="scss">
.taword-list {
    width: 100%;
    flex: 1;
    min-height: 52vh;
    padding: 14px;
    border-radius: 14px;
    background:
        linear-gradient(160deg, rgba(245, 169, 98, 0.14) 0%, rgba(224, 99, 61, 0.06) 60%, transparent 100%),
        rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.7);
    box-shadow: 0 2px 12px rgba(120, 60, 40, 0.06);
    display: flex;
    flex-direction: column;
    gap: 14px;
}
</style>

<script setup lang="ts">
import TaWordCard from '../TaWordCard.vue';
</script>

