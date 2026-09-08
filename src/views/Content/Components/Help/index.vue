<template>
<div class="post-container">
    <div class="card-item" v-for="item in postlist" :key="item.id">
    <PostCard :id="item.id" :user_id="item.user_id" :avatar="item.avatar" :username="item.username" :create_at="item.created_at" :content="item.content" :comment_count="item.comment_count" :view_count="item.view_count" :images="item.images" :like_count="item.like_count" :is_liked="item.is_liked"></PostCard>
    </div>
    <!-- 空状态：还没有帖子 -->
    <div v-if="empty" class="empty-state" style="user-select: none;">
        <div class="empty-icon">
            <el-icon :size="30"><HelpFilled /></el-icon>
        </div>
        <div class="empty-title" style="cursor: default;">还没有求助帖</div>
        <div class="empty-desc" style="cursor: default;">遇到难题？发布一条求助动态吧</div>
    </div>
    <!-- 网络异常 -->
    <div v-else-if="error" class="error-state" style="user-select: none;">
        <div class="error-icon">
            <el-icon :size="30"><WarningFilled /></el-icon>
        </div>
        <div class="error-title" style="cursor: default;">网络开小差了</div>
        <div class="error-desc" style="cursor: default;">加载失败，请检查网络后重试</div>
        <button class="retry-btn" @click="loadmore" style="cursor: pointer;">重新加载</button>
    </div>
    <div ref="sentry" v-if="hasMore" class="load-more" style="cursor: default; user-select: none;">
        <span v-if="loading" class="spinner"></span>
        {{ loading?'加载中...':'上拉加载更多' }}
    </div>
    <div v-else-if="!empty&&!hasMore" class="load-more" style="cursor: default; user-select: none;">到底啦....</div>
</div>
</template>

<script setup lang="ts">
import PostCard from '@/components/PostCard.vue';
import { HelpFilled, WarningFilled } from '@element-plus/icons-vue';
import { getposthelpapi } from '@/api/aboutpost';
import {ref,onMounted} from 'vue'
import { useIntersectionObserver } from '@vueuse/core';
import { usePostFeed } from '@/composables/usePostFeed';
const sentry=ref<HTMLElement | null>()
const {loading,loadmore,error,empty,hasMore,postlist}=usePostFeed(getposthelpapi)
onMounted(loadmore)
useIntersectionObserver(sentry,([entry])=>{
if(entry?.isIntersecting){loadmore()}
},{rootMargin:'0px 0px 40% 0px'})
</script>

<style scoped lang="scss">
.post-container{
    width: 40%;
    min-height: 80%;
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
    align-items: center;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05),    /* 柔和外阴影 */
        0 10px 20px rgba(0, 0, 0, 0.08),   /* 中层阴影 */
        0 20px 40px rgba(0, 0, 0, 0.1);    /* 底层阴影 */
    /* 空状态：还没有帖子 */
    .empty-state{
        width: 100%;
        padding: 80px 20px 70px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        user-select: none;
        .empty-icon{
            width: 68px;
            height: 68px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(224, 128, 113, 0.85);
            background:
                radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.9) 0%, transparent 45%),
                linear-gradient(135deg, rgba(233, 189, 124, 0.45), rgba(250, 130, 145, 0.35));
            border: 1px solid rgba(255, 255, 255, 0.7);
            box-shadow: 0 6px 16px rgba(120, 60, 40, 0.12),
                inset 0 1px 0 rgba(255, 255, 255, 0.6);
            animation: floaty 3s ease-in-out infinite;
        }
        .empty-title{
            font-size: 15px;
            font-weight: 500;
            color: rgba(120, 90, 80, 0.8);
            letter-spacing: 2px;
        }
        .empty-desc{
            font-size: 12px;
            color: rgba(128, 110, 100, 0.55);
            letter-spacing: 1px;
        }
    }
    /* 网络异常状态 */
    .error-state{
        width: 100%;
        padding: 80px 20px 70px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        user-select: none;
        .error-icon{
            width: 68px;
            height: 68px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(224, 128, 113, 0.9);
            background:
                radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.9) 0%, transparent 45%),
                linear-gradient(135deg, rgba(250, 130, 145, 0.4), rgba(224, 128, 113, 0.35));
            border: 1px solid rgba(255, 255, 255, 0.7);
            box-shadow: 0 6px 16px rgba(224, 128, 113, 0.18),
                inset 0 1px 0 rgba(255, 255, 255, 0.6);
        }
        .error-title{
            font-size: 15px;
            font-weight: 500;
            color: rgba(120, 90, 80, 0.8);
            letter-spacing: 2px;
        }
        .error-desc{
            font-size: 12px;
            color: rgba(128, 110, 100, 0.55);
            letter-spacing: 1px;
        }
        .retry-btn{
            margin-top: 8px;
            padding: 8px 32px;
            font-size: 13px;
            letter-spacing: 3px;
            color: #fff;
            background: linear-gradient(135deg, rgba(224, 128, 113, 0.95), rgba(250, 130, 145, 0.9));
            border: none;
            border-radius: 20px;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(224, 128, 113, 0.35),
                inset 0 1px 0 rgba(255, 255, 255, 0.35);
            transition: all 0.25s ease;
            &:hover{
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(224, 128, 113, 0.45),
                    inset 0 1px 0 rgba(255, 255, 255, 0.35);
            }
            &:active{
                transform: translateY(0);
                box-shadow: 0 2px 8px rgba(224, 128, 113, 0.3);
            }
        }
    }
    .load-more{
    width: 100%;
    padding: 20px 0 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 13px;
    color: rgba(224, 128, 113, 0.85);
    letter-spacing: 2px;
    user-select: none;
    flex-shrink: 0;

    /* 加载中的旋转小圆点 */
    .spinner{
        width: 14px;
        height: 14px;
        border: 2px solid rgba(224, 128, 113, 0.2);
        border-top-color: rgba(224, 128, 113, 0.9);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    /* 没有更多数据时的弱化样式 */
    &.end{
        color: rgba(128, 128, 128, 0.45);
        font-size: 12px;
        letter-spacing: 3px;
    }
}
    @keyframes spin{
    to { transform: rotate(360deg); }
}
    @keyframes floaty{
        0%, 100%{
            transform: translateY(0);
        }
        50%{
            transform: translateY(-6px);
        }
    }
}
</style>