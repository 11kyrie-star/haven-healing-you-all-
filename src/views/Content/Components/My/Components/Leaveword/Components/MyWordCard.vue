<template>
    <div class="wordcard-container">
        <div class="msg">
            <span class="chip">我</span>
            <div class="msg-content">
                <div class="text" v-html="item.my_message.content"></div>
            </div>
            <span class="time">{{ mywordtime }}</span>
        </div>
        <div class="post">
            <div class="namepic">
                <div class="avatar">
                    <img :src=item.avatar alt="TA的头像" />
                </div>
                <div class="name">{{ item.username }}</div>
            </div>
            <div class="content" v-html="item.content"></div>
            <div class="ellipsis">......</div>
            <div class="time">{{ posttime }}</div>
            <div class="detail">详情</div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.wordcard-container {
    width: 100%;
    min-height: 20vh;
    padding: 14px 16px;
    background-color: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(120, 60, 40, 0.06);
    font-family: 'LXGW WenKai', 'Inter', sans-serif;
    color: rgba(50, 50, 50, 0.85);
    transition: box-shadow 0.3s ease, transform 0.3s ease;

    &:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(120, 60, 40, 0.12);
    }

    .msg {
        position: relative;
        display: flex;
        align-items: flex-start;
        gap: 8px;

        .chip {
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 1.7em;
            height: 1.7em;
            padding: 0 0.45em;
            border-radius: 999px;
            background: linear-gradient(135deg, #ee9473, #e2668b);
            color: #ffffff;
            font-size: 0.9em;
            font-weight: 700;
            box-shadow: 0 2px 6px rgba(226, 102, 139, 0.35);
        }

        .msg-content {
            position: relative;
            flex: 1;
            min-width: 0;
            padding: 10px 12px;
            background-color: rgba(255, 255, 255, 0.72);
            border: 1px solid rgba(224, 167, 167, 0.22);
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(120, 60, 40, 0.06);

            &::before {
                content: '';
                position: absolute;
                left: -6px;
                top: 14px;
                width: 10px;
                height: 10px;
                background-color: rgba(255, 255, 255, 0.72);
                border-left: 1px solid rgba(224, 167, 167, 0.22);
                border-bottom: 1px solid rgba(224, 167, 167, 0.22);
                transform: rotate(45deg);
            }

            .text {
                font-size: 0.95em;
                line-height: 1.7;
                word-break: break-word;
                cursor: default;
            }
        }

        .time {
            flex-shrink: 0;
            margin-top: 2px;
            font-size: 0.75em;
            font-weight: 300;
            color: rgba(128, 128, 128, 0.6);
            user-select: none;
            cursor: default;
        }
    }

    .post {
        position: relative;
        margin-top: 12px;
        padding: 12px 14px;
        border-radius: 10px;
        border: 1px solid rgba(224, 167, 167, 0.18);
        border-left: 3px solid rgba(243, 79, 103, 0.55);
        background:
            linear-gradient(135deg, rgba(224, 128, 113, 0.25) 0%, transparent 85%),
            rgba(255, 255, 255, 0.5);
        box-shadow: 0 2px 8px rgba(120, 60, 40, 0.05);

        .namepic {
            display: flex;
            align-items: center;
            gap: 8px;
            padding-right: 64px;

            .avatar {
                width: 2.6vw;
                height: 5.2vh;
                min-width: 28px;
                min-height: 28px;
                border-radius: 50%;
                overflow: hidden;
                border: 2px solid rgba(255, 255, 255, 0.9);
                box-shadow: 0 2px 6px rgba(120, 60, 40, 0.15);
                user-select: none;

                img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
            }

            .name {
                font-size: 0.9em;
                font-weight: 700;
                color: rgba(50, 50, 50, 0.85);
                user-select: none;
            }
        }

        .content {
            margin-top: 6px;
            font-size: 0.9em;
            line-height: 1.6;
            color: rgba(50, 50, 50, 0.75);
            word-break: break-word;
            cursor: default;
        }

        .ellipsis {
            margin-top: 2px;
            font-size: 0.8em;
            letter-spacing: 2px;
            color: rgba(128, 128, 128, 0.5);
            cursor: default;
            user-select: none;
        }

        .time {
            margin-top: 8px;
            text-align: right;
            font-size: 0.75em;
            font-weight: 300;
            color: rgba(128, 128, 128, 0.6);
            cursor: default;
            user-select: none;
        }

        .detail {
            position: absolute;
            right: 12px;
            top: 10px;
            cursor: pointer;
            user-select: none;
            padding: 3px 14px;
            border-radius: 999px;
            font-size: 0.78em;
            letter-spacing: 1px;
            color: #e0526b;
            border: 1px solid rgba(243, 79, 103, 0.4);
            transition: all 0.25s ease;

            &::after {
                content: '›';
                display: inline-block;
                margin-left: 4px;
                transition: transform 0.25s ease;
            }

            &:hover {
                color: #ffffff;
                background: linear-gradient(135deg, #f78c6b, #f34f67);
                border-color: transparent;
                box-shadow: 0 4px 12px rgba(243, 79, 103, 0.35);

                &::after {
                    transform: translateX(3px);
                }
            }
        }
    }
}
</style>

<script setup lang="ts">
import type { myleaveworddata } from '@/types/post';
import { formatPostTime } from '@/utils/time';
import { ref } from 'vue';
const props=defineProps<{item:myleaveworddata}>()
const mywordtime=ref(formatPostTime(props.item.my_message.create_at))
const posttime=ref(formatPostTime(props.item.created_at))
</script>
