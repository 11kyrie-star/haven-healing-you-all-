<template>
    <div class="card-container report-card" v-if="isReportNotification" style="user-select: none;">
        <div class="report-top">
            <div class="report-badge">
                <el-icon :size="18"><Flag /></el-icon>
            </div>
            <div class="report-main">
                <div class="report-title-row">
                    <span class="report-title">举报处理通知</span>
                    <span class="report-status" :class="statusClass">
                        <el-icon :size="12"><component :is="statusIcon" /></el-icon>
                        {{ statusText }}
                    </span>
                </div>
                <div class="report-greeting">{{ reportGreeting }}</div>
                <div class="report-message" v-if="props.item.content">{{ props.item.content }}</div>
                <div class="report-time-row">
                    <span class="unread-dot" v-if="!props.item.is_read"></span>
                    <span class="notify-time">{{ timeStr }}</span>
                </div>
            </div>
        </div>

        <div class="report-details">
            <div class="report-section reason-section">
                <div class="report-section-label">
                    <el-icon :size="14"><WarningFilled /></el-icon>
                    <span>举报原因</span>
                </div>
                <div class="reason-list" v-if="reportReasons.length">
                    <span class="reason-tag" v-for="reason in reportReasons" :key="reason">{{ reason }}</span>
                </div>
                <div class="reason-empty" v-else>未填写具体举报原因</div>
            </div>

            <div class="report-section result-section">
                <div class="report-section-label">
                    <el-icon :size="14"><component :is="statusIcon" /></el-icon>
                    <span>处理结果</span>
                </div>
                <p class="result-text">{{ handleResult }}</p>
            </div>
        </div>

        <div class="post-block report-post-block">
            <div class="report-post-heading-row">
                <div class="report-post-heading">{{ reportPostTitle }}</div>
                <button class="report-detail-button" type="button" @click="goDetail">查看详情</button>
            </div>
            <div class="report-post-author">
                <span class="report-post-author-label">作者</span>
                <span class="report-post-author-name">{{ props.item.post.username }}</span>
            </div>
            <div class="report-post-content" v-html="props.item.post.content"></div>
            <div class="dots">·····</div>
        </div>
    </div>
    <div class="card-container" v-else>
        <div class="notify-top">
            <div class="actor-avatar">
                <img :src="props.item.actor_avatar as string" alt="" />
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
            <div class="post-footer">
                <div class="dots">·····</div>
                <button class="detail" type="button" @click="goDetail">查看详情</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import {
    StarFilled,
    ChatSquare,
    ChatDotRound,
    Message,
    Flag,
    WarningFilled,
    CircleCheckFilled,
    CircleCloseFilled,
    InfoFilled,
} from '@element-plus/icons-vue'
import { formatPostTime } from '@/utils/time'
import { useRouter } from 'vue-router'
import type { Component } from 'vue'
import type { NotificationType, NotificationItem } from '@/types/note'
const props = defineProps<{ item: NotificationItem }>()
const isReportNotification =
    props.item.type === 'report_result' || props.item.role !== undefined || Array.isArray(props.item.reasons)

// 类型 -> 图标 映射表
const iconMap: Record<NotificationType, Component> = {
    like: StarFilled,
    comment: ChatSquare,
    reply: ChatDotRound,
    message: Message,
    report_result: Flag,
}

// 类型 -> 动作文案 映射表
const actionMap: Record<NotificationType, string> = {
    like: '赞了你的帖子',
    comment: '评论了你的帖子',
    reply: '回复了你的评论',
    message: '给你留了言',
    report_result: '举报处理结果',
}

const reportReasonMap: Record<string, string> = {
    spam: '垃圾广告或营销推广',
    porn: '色情低俗内容',
    abuse: '辱骂或人身攻击',
    misinformation: '虚假不实信息',
    illegal: '违法违规内容',
    infringement: '侵权、抄袭或骚扰',
}

function getStatusText(isSuccess?: boolean) {
    if (isSuccess === true) {
        return '举报成立'
    }
    if (isSuccess === false) {
        return '举报未通过'
    }
    return '已处理'
}

function getStatusClass(isSuccess?: boolean) {
    if (isSuccess === true) {
        return 'is-success'
    }
    if (isSuccess === false) {
        return 'is-rejected'
    }
    return 'is-pending'
}

function getStatusIcon(isSuccess?: boolean): Component {
    if (isSuccess === true) {
        return CircleCheckFilled
    }
    if (isSuccess === false) {
        return CircleCloseFilled
    }
    return InfoFilled
}

const reportRole = props.item.role ?? 'unknown'
const typeIcon = iconMap[props.item.type] ?? ChatSquare
const actionText = actionMap[props.item.type] ?? '与你互动了'
const timeStr = formatPostTime(props.item.create_at)
const reportReasons = (props.item.reasons ?? [])
    .map((reason) => reportReasonMap[reason] ?? reason)
    .filter(Boolean)
const reportPostImages = props.item.post.images ?? []
const reportPostTitle =
    reportRole === 'reporter' ? '你举报的帖子' : reportRole === 'author' ? '你的帖子' : '相关帖子'
const handleResult = props.item.handle_result?.trim() || '平台已完成处理，请以最终处理结果为准。'
const statusText = getStatusText(props.item.is_success)
const statusClass = getStatusClass(props.item.is_success)
const statusIcon = getStatusIcon(props.item.is_success)
const reportGreeting =
    reportRole === 'reporter'
        ? '举报人，你好。你提交的举报已有处理结果'
        : reportRole === 'author'
          ? '作者，你好。你发布的帖子已有举报处理结果'
          : '你好，平台已更新一条举报的处理结果'

const router = useRouter()
const goDetail = () => {
    router.push(`/layout/content/detail/${props.item.post.id}`)
}
</script>

<style scoped lang="scss">
.card-container {
    width: 100%;
    height: auto;
    padding: 14px 16px;
    box-sizing: border-box;
    flex-shrink: 0;
    overflow: visible;
    background:
        radial-gradient(circle at 90% 6%, rgba(233, 189, 124, 0.18) 0%, transparent 40%),
        linear-gradient(135deg, rgba(255, 255, 255, 0.74) 0%, rgba(255, 243, 234, 0.58) 100%);
    border: 1px solid rgba(224, 128, 113, 0.35);
    border-radius: 14px;
    box-shadow: 0 2px 10px rgba(120, 60, 40, 0.1), 0 8px 24px rgba(224, 128, 113, 0.14);
    backdrop-filter: blur(8px);
    transition: box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease;
    font-family: var(--font-main);
    color: rgba(50, 50, 50, 0.85);

    &:hover {
        transform: translateY(-3px);
        border-color: rgba(224, 128, 113, 0.5);
        box-shadow: 0 6px 18px rgba(224, 128, 113, 0.24), 0 14px 34px rgba(120, 60, 40, 0.16);
    }

    &.report-card {
        background:
            radial-gradient(circle at 94% 4%, rgba(198, 64, 31, 0.14) 0%, transparent 38%),
            linear-gradient(145deg, rgba(255, 252, 247, 0.86) 0%, rgba(250, 232, 224, 0.68) 100%);
        border-color: rgba(198, 64, 31, 0.28);

        &:hover {
            border-color: rgba(198, 64, 31, 0.46);
            box-shadow: 0 6px 18px rgba(198, 64, 31, 0.18), 0 14px 34px rgba(120, 60, 40, 0.14);
        }

        .report-top {
            display: flex;
            align-items: flex-start;
            gap: 10px;

            .report-badge {
                display: grid;
                flex: 0 0 38px;
                width: 38px;
                height: 38px;
                place-items: center;
                border-radius: 10px;
                color: #c6401f;
                background:
                    linear-gradient(145deg, rgba(255, 255, 255, 0.94), rgba(247, 199, 190, 0.66));
                box-shadow:
                    inset 0 0 0 1px rgba(198, 64, 31, 0.15),
                    0 4px 10px rgba(120, 60, 40, 0.1);
            }

            .report-main {
                flex: 1;
                min-width: 0;
            }

            .report-title-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
            }

            .report-title {
                font-size: 0.95em;
                font-weight: 700;
                color: rgba(80, 50, 45, 0.9);
            }

            .report-status {
                display: inline-flex;
                flex-shrink: 0;
                align-items: center;
                gap: 3px;
                padding: 3px 7px;
                border-radius: 999px;
                font-size: 0.68em;
                font-weight: 700;
                line-height: 1;

                &.is-success {
                    color: #a64324;
                    background: rgba(233, 189, 124, 0.28);
                    box-shadow: inset 0 0 0 1px rgba(198, 64, 31, 0.13);
                }

                &.is-rejected {
                    color: rgba(104, 93, 91, 0.88);
                    background: rgba(187, 178, 176, 0.2);
                    box-shadow: inset 0 0 0 1px rgba(104, 93, 91, 0.12);
                }

                &.is-pending {
                    color: #9b6b25;
                    background: rgba(233, 189, 124, 0.2);
                    box-shadow: inset 0 0 0 1px rgba(155, 107, 37, 0.14);
                }
            }

            .report-greeting {
                margin-top: 5px;
                font-size: 0.84em;
                line-height: 1.55;
                color: rgba(80, 60, 56, 0.82);
            }

            .report-message {
                margin-top: 7px;
                padding: 7px 9px;
                border-left: 3px solid rgba(198, 64, 31, 0.42);
                border-radius: 0 7px 7px 0;
                color: rgba(80, 80, 80, 0.75);
                background: rgba(255, 255, 255, 0.52);
                font-size: 0.8em;
                line-height: 1.6;
                word-break: break-word;
            }

            .report-time-row {
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

        .report-details {
            display: grid;
            gap: 8px;
            margin-top: 12px;
        }

        .report-section {
            padding: 9px 11px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.46);
            box-shadow: inset 0 0 0 1px rgba(224, 167, 167, 0.16);
        }

        .reason-section {
            border-left: 3px solid rgba(198, 64, 31, 0.46);
        }

        .result-section {
            border-left: 3px solid rgba(233, 189, 124, 0.72);
        }

        .report-section-label {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 0.75em;
            font-weight: 700;
            color: rgba(102, 72, 65, 0.82);
        }

        .reason-list {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 7px;
        }

        .reason-tag {
            padding: 3px 8px;
            border: 1px solid rgba(198, 64, 31, 0.18);
            border-radius: 999px;
            color: #a64324;
            background: rgba(247, 199, 190, 0.32);
            font-size: 0.72em;
            line-height: 1.35;
            word-break: break-word;
        }

        .reason-empty {
            margin-top: 6px;
            font-size: 0.78em;
            color: rgba(128, 128, 128, 0.66);
        }

        .result-text {
            margin-top: 6px;
            font-size: 0.8em;
            line-height: 1.65;
            color: rgba(65, 65, 65, 0.78);
            word-break: break-word;
        }

        .report-post-block {
            padding: 12px 14px;
            overflow: visible;
            margin-top: 10px;
        }

        .report-post-heading-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
        }

        .report-post-heading {
            font-size: 0.72em;
            font-weight: 700;
            letter-spacing: 1px;
            color: rgba(120, 60, 40, 0.62);
        }

        .report-detail-button {
            flex-shrink: 0;
            padding: 5px 10px;
            border: 1px solid rgba(198, 64, 31, 0.24);
            border-radius: 999px;
            color: #a64324;
            background: rgba(255, 255, 255, 0.62);
            font-family: inherit;
            font-size: 0.72em;
            font-weight: 700;
            line-height: 1;
            cursor: pointer;
            transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease;

            &:hover {
                color: #fff;
                border-color: transparent;
                background: linear-gradient(135deg, #f78c6b 0%, #f34f67 100%);
            }
        }

        .report-post-author {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 9px;
            font-size: 0.76em;
        }

        .report-post-author-label {
            color: rgba(128, 128, 128, 0.68);
        }

        .report-post-author-name {
            font-weight: 700;
            color: rgba(50, 50, 50, 0.82);
        }

        .report-post-content {
            margin-top: 8px;
            max-height: none;
            overflow: visible;
            white-space: normal;
            overflow-wrap: anywhere;
            color: rgba(50, 50, 50, 0.76);
            font-size: 0.86em;
            line-height: 1.65;

            :deep(p) {
                margin: 0 0 6px;

                &:last-child {
                    margin-bottom: 0;
                }
            }

            :deep(img) {
                display: block;
                max-width: 100%;
                height: auto;
                margin: 7px 0;
                border-radius: 7px;
            }

            :deep(a) {
                color: #a64324;
            }
        }

        .report-post-images {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 8px;

            img {
                width: 64px;
                height: 64px;
                border: 1px solid rgba(224, 167, 167, 0.18);
                border-radius: 7px;
                background: rgba(255, 255, 255, 0.48);
                object-fit: cover;
            }
        }
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

        .post-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-top: 4px;

            .dots {
                margin-top: 0;
            }
        }

        .detail {
            flex-shrink: 0;
            padding: 4px 9px;
            border: 1px solid rgba(198, 64, 31, 0.22);
            border-radius: 999px;
            cursor: pointer;
            font-family: inherit;
            font-size: 0.85em;
            font-weight: 500;
            color: #c6401f;
            background: rgba(255, 255, 255, 0.62);
            transition: font-weight 0.2s ease, color 0.2s ease, background 0.2s ease, border-color 0.2s ease;

            &:hover {
                font-weight: 700;
                color: #a64324;
                border-color: transparent;
                background: rgba(247, 199, 190, 0.52);
            }
        }
    }
}
</style>
