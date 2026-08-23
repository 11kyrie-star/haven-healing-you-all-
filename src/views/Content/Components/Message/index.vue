<template>
    <div class="message-container">
        <div class="message-list">
            <Card v-for="item in store.list" :key="item.id" :item="item" />
            <div class="empty" v-if="!store.list.length">
                <el-icon :size="36" class="empty-icon"><Bell /></el-icon>
                <p>暂无消息通知</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import Card from './Components/Card.vue'
import type { NotificationItem } from '@/types/note.ts';
import { Bell } from '@element-plus/icons-vue'
import { useNotificationStore } from '@/stores/note_pub.ts';
const store=useNotificationStore()
</script>

<style scoped lang="scss">
.message-container {
    width: 30%;
    min-width: 0;
    min-height: 90vh;
    box-sizing: border-box;
    padding: 18px 16px;
    background:
        radial-gradient(circle at 12% 8%, rgba(233, 189, 124, 0.3) 0%, transparent 42%),
        radial-gradient(circle at 88% 92%, rgba(250, 130, 145, 0.22) 0%, transparent 48%),
        linear-gradient(135deg, rgba(224, 128, 113, 0.42) 0%, rgba(224, 128, 113, 0.08) 45%, transparent 92%),
        #f4e4df;
    border: 1px solid rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(8px);
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 20px rgba(0, 0, 0, 0.08), 0 20px 40px rgba(0, 0, 0, 0.1);
    margin-right: 3%;
    align-self: flex-start;
    font-family: 'LXGW WenKai', 'Inter', sans-serif;
    color: rgba(50, 50, 50, 0.85);

    .message-list {
        margin-top: 14px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        max-height: 74vh;
        overflow-y: auto;
        padding-right: 6px;

        &::-webkit-scrollbar {
            width: 6px;
        }

        &::-webkit-scrollbar-thumb {
            background: rgba(224, 128, 113, 0.4);
            border-radius: 999px;
        }

        &::-webkit-scrollbar-track {
            background: transparent;
        }
    }

    .empty {
        margin-top: 20vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        color: rgba(128, 128, 128, 0.55);

        .empty-icon {
            opacity: 0.5;
        }

        p {
            font-size: 0.95em;
            letter-spacing: 1px;
        }
    }
}
</style>
