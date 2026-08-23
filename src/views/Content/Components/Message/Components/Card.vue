<template>
    <div class="card-container">
        <div class="notify-top">
            <div class="actor-avatar">
                <img :src="props.item.actor_avatar" alt="" />
            </div>
            <div class="notify-main">
                <div class="notify-text">
                    <el-icon :size="16" class="type-icon">
                        <component :is="typeIcon" />
                    </el-icon>
                    <span class="actor">{{ props.item.actor_name }}</span>
                    <span class="action">{{ actionText }}</span>
                </div>
                <div class="notify-content">{{ props.item.content }}</div>
                <div class="notify-time-row">
                    <span class="unread-dot" v-if="!props.item.is_read"></span>
                    <span class="notify-time">{{ timeStr }}</span>
                </div>
            </div>
        </div>
        <div class="post-block">
            <div class="namepic">
                <div class="avatar">
                    <img :src="props.item.post.avatar" alt="" />
                </div>
                <div class="name">{{ props.item.post.username }}</div>
            </div>
            <div class="content" v-html="props.item.post.content"></div>
            <div class="dots">·····</div>
            <div class="detail" @click="goDetail">详情</div>
        </div>
    </div>
</template>

<script lang="ts">
export type NotificationType = 'like' | 'comment' | 'reply' | 'message'

export interface NotificationItem {
    id: number
    type: NotificationType
    is_read: boolean
    create_at: string
    actor_name: string
    actor_avatar: string
    content: string
    target_id: number
    post: {
        id: number
        username: string
        avatar: string
        content: string
        images?: string[]
    }
}
</script>

<script setup lang="ts">
import { StarFilled, ChatSquare, ChatDotRound, Message } from '@element-plus/icons-vue'
import { formatPostTime } from '@/utils/time'
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import type { Component } from 'vue'

const props = defineProps<{ item: NotificationItem }>()

// 类型 -> 图标 映射表
const iconMap: Record<NotificationType, Component> = {
    like: StarFilled,
    comment: ChatSquare,
    reply: ChatDotRound,
    message: Message,
}

// 类型 -> 动作文案 映射表
const actionMap: Record<NotificationType, string> = {
    like: '赞了你的帖子',
    comment: '评论了你的帖子',
    reply: '回复了你的评论',
    message: '给你留了言',
}

const typeIcon = computed(() => iconMap[props.item.type] ?? ChatSquare)
const actionText = computed(() => actionMap[props.item.type] ?? '与你互动了')
const timeStr = computed(() => formatPostTime(props.item.create_at))

const router = useRouter()
const goDetail = () => {
    router.push(`/layout/content/detail/${props.item.post.id}`)
}
</script>

<style scoped lang="scss">
.card-container {
    width: 100%;
    min-height: 22vh;
    padding: 14px 16px;
    box-sizing: border-box;
    background:
        radial-gradient(circle at 90% 6%, rgba(233, 189, 124, 0.18) 0%, transparent 40%),
        linear-gradient(135deg, rgba(255, 255, 255, 0.74) 0%, rgba(255, 243, 234, 0.58) 100%);
    border: 1px solid rgba(224, 128, 113, 0.35);
    border-radius: 14px;
    box-shadow: 0 2px 10px rgba(120, 60, 40, 0.1), 0 8px 24px rgba(224, 128, 113, 0.14);
    backdrop-filter: blur(8px);
    transition: box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease;
    font-family: 'LXGW WenKai', 'Inter', sans-serif;
    color: rgba(50, 50, 50, 0.85);

    &:hover {
        transform: translateY(-3px);
        border-color: rgba(224, 128, 113, 0.5);
        box-shadow: 0 6px 18px rgba(224, 128, 113, 0.24), 0 14px 34px rgba(120, 60, 40, 0.16);
    }

    .notify-top {
        display: flex;
        align-items: flex-start;
        gap: 10px;

        .actor-avatar {
            width: 3vw;
            height: 6vh;
            min-width: 36px;
            min-height: 36px;
            border-radius: 50%;
            overflow: hidden;
            flex-shrink: 0;
            border: 2px solid rgba(255, 255, 255, 0.9);
            box-shadow: 0 2px 6px rgba(120, 60, 40, 0.15);

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
        }

        .notify-main {
            flex: 1;
            min-width: 0;

            .notify-text {
                font-size: 0.95em;
                line-height: 1.5;
                word-break: break-word;

                .type-icon {
                    color: #ff6b81;
                    margin-right: 2px;
                    vertical-align: -3px;
                }

                .actor {
                    font-weight: 700;
                    color: rgba(50, 50, 50, 0.9);
                }

                .action {
                    color: rgba(128, 128, 128, 0.7);
                }
            }

            .notify-content {
                margin-top: 6px;
                padding: 6px 10px;
                font-size: 0.85em;
                line-height: 1.6;
                color: rgba(80, 80, 80, 0.75);
                background-color: rgba(255, 255, 255, 0.55);
                border: 1px solid rgba(224, 167, 167, 0.18);
                border-radius: 8px;
                word-break: break-word;
            }

            .notify-time-row {
                margin-top: 6px;
                display: flex;
                align-items: center;
                gap: 6px;

                .notify-time {
                    font-size: 0.75em;
                    font-weight: 300;
                    color: rgba(128, 128, 128, 0.6);
                }

                .unread-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #ff8a5c, #ff6b81);
                    box-shadow: 0 0 6px rgba(255, 107, 129, 0.5);
                }
            }
        }
    }

    .post-block {
        position: relative;
        margin-top: 12px;
        padding: 12px 14px;
        border-radius: 10px;
        border: 1px solid rgba(224, 167, 167, 0.18);
        border-left: 3px solid rgba(224, 128, 113, 0.55);
        background:
            linear-gradient(135deg, rgba(219, 171, 164, 0.3) 0%, transparent 85%),
            rgba(255, 255, 255, 0.5);
        box-shadow: 0 2px 8px rgba(120, 60, 40, 0.05);

        .namepic {
            display: flex;
            align-items: center;
            gap: 8px;

            .avatar {
                width: 2.2vw;
                height: 4.4vh;
                min-width: 26px;
                min-height: 26px;
                border-radius: 50%;
                overflow: hidden;
                border: 2px solid rgba(255, 255, 255, 0.9);
                box-shadow: 0 2px 6px rgba(120, 60, 40, 0.15);

                img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
            }

            .name {
                font-size: 0.85em;
                font-weight: 700;
                color: rgba(50, 50, 50, 0.85);
            }
        }

        .content {
            margin-top: 6px;
            font-size: 0.88em;
            line-height: 1.6;
            color: rgba(50, 50, 50, 0.75);
            word-break: break-word;
        }

        .dots {
            margin-top: 2px;
            font-size: 0.8em;
            letter-spacing: 2px;
            color: rgba(128, 128, 128, 0.5);
        }

        .detail {
            position: absolute;
            left: 88%;
            top: 6%;
            cursor: pointer;
            font-size: 0.85em;
            font-weight: 500;
            color: #c6401f;
            transition: font-weight 0.2s ease;

            &:hover {
                font-weight: 700;
            }
        }
    }
}
</style>
