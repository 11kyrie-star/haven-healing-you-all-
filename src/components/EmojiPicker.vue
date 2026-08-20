<template>
    <div class="emoji-container" v-if="showemoji" @mousedown.prevent>
        <EmojiPicker :native="true" :hide-search="true" :display-recent="true" @select="insert"></EmojiPicker>
    </div>
</template>

<style scoped lang="scss">
.emoji-container{
    position: absolute;
    z-index: 9999;
}
</style>

<script setup lang="ts">
import EmojiPicker from 'vue3-emoji-picker'
import type { EmojiExt } from 'vue3-emoji-picker';
import '../../node_modules/vue3-emoji-picker/dist/style.css'
import { ref } from 'vue';
const props=defineProps<{showemoji:boolean}>()
const emit=defineEmits<{
    select:[eomji:EmojiExt]
}>()
const insert=(emoji:EmojiExt)=>{
    emit('select',emoji)
}
</script>
