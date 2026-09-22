<template>
    <div class="post-container">
        <div class="detail-header">
            <span class="header-line"></span>
            <div class="header-title">
                <span class="title-main">详情</span>
                <span class="title-en">DETAIL</span>
            </div>
            <span class="header-line right"></span>
        </div>
        <div class="detail-ornament">
            <span class="ornament-line"></span>
            <span class="ornament-dot">✦</span>
            <span class="ornament-line right"></span>
        </div>
        <div class="detail-body">
            <PostCard v-if="post" :id="post.id" :user_id="post.user_id" :avatar="post.avatar" :username="post.username" :create_at="post.created_at" :content="post.content" :images="post.images" :view_count="post.view_count" :comment_count="post.comment_count" :like_count="post.like_count" :is_liked="post.is_liked"></PostCard>
        </div>
        <div class="detail-footer">
            <span class="footer-line"></span>
            <span class="footer-text">细细品读 · 慢慢回味</span>
            <span class="footer-line right"></span>
        </div>
    </div>
</template>

<style scoped lang="scss">
.post-container{
    width: 40%;
    min-height: 40%;
    position: relative;
    overflow: hidden;
    padding: 4vh 2.5vw 3vh;
    background: linear-gradient(
        135deg,
        rgba(224, 128, 113, 0.603) 0%,
        transparent 90%
    ),#f4e4df;
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.55);
    backdrop-filter: blur(6px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05),    /* 柔和外阴影 */
        0 10px 20px rgba(0, 0, 0, 0.08),   /* 中层阴影 */
        0 20px 40px rgba(0, 0, 0, 0.1);    /* 底层阴影 */
    &::before,
    &::after{
        content: '';
        position: absolute;
        z-index: 0;
        border-radius: 50%;
        pointer-events: none;
        filter: blur(2px);
    }
    &::before{
        top: -70px;
        right: -70px;
        width: 240px;
        height: 240px;
        background: radial-gradient(circle, rgba(233, 189, 124, 0.4) 0%, transparent 70%);
        animation: float-blob 9s ease-in-out infinite;
    }
    &::after{
        bottom: -90px;
        left: -50px;
        width: 280px;
        height: 280px;
        background: radial-gradient(circle, rgba(250, 130, 145, 0.32) 0%, transparent 70%);
        animation: float-blob 11s ease-in-out infinite reverse;
    }
    .detail-header{
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        gap: 14px;
        user-select: none;
        .header-line{
            width: 56px;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(198, 64, 31, 0.45));
            &.right{
                background: linear-gradient(270deg, transparent, rgba(198, 64, 31, 0.45));
            }
        }
        .header-title{
            display: flex;
            align-items: baseline;
            gap: 10px;
            .title-main{
                font-family: 'LXGW WenKai', sans-serif;
                font-size: 1.7em;
                font-weight: 700;
                letter-spacing: 0.35em;
                text-indent: 0.35em;
                color: #c6401f;
                text-shadow: 0 1px 0 rgba(255, 255, 255, 0.65);
            }
            .title-en{
                font-family: 'Dancing Script', cursive;
                font-size: 1.2em;
                color: rgba(198, 64, 31, 0.55);
            }
        }
    }
    .detail-ornament{
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 6px;
        user-select: none;
        .ornament-line{
            width: 70px;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(198, 64, 31, 0.35));
            &.right{
                transform: scaleX(-1);
            }
        }
        .ornament-dot{
            color: #e08071;
            font-size: 0.9em;
            animation: twinkle 2.4s ease-in-out infinite;
        }
    }
    .detail-body{
        position: relative;
        z-index: 1;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .detail-footer{
        position: relative;
        z-index: 1;
        margin-top: auto;
        padding-top: 2vh;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        user-select: none;
        .footer-line{
            width: 44px;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(198, 64, 31, 0.35));
            &.right{
                transform: scaleX(-1);
            }
        }
        .footer-text{
            font-family: 'LXGW WenKai', sans-serif;
            font-size: 0.85em;
            letter-spacing: 0.18em;
            color: rgba(198, 64, 31, 0.6);
        }
    }
}
@keyframes float-blob{
    0%, 100%{
        transform: translateY(0) scale(1);
    }
    50%{
        transform: translateY(-18px) scale(1.06);
    }
}
@keyframes twinkle{
    0%, 100%{
        opacity: 0.45;
        transform: scale(0.85) rotate(0deg);
    }
    50%{
        opacity: 1;
        transform: scale(1.15) rotate(45deg);
    }
}
</style>

<script setup lang="ts">
import PostCard from '@/components/PostCard.vue';
import { useRoute } from 'vue-router';
import { detailpostapi } from '@/api/aboutpost';
import type { detaildata } from '@/types/post';
import {ref,onMounted,watch} from 'vue'
const route=useRoute()
const post=ref<detaildata['data']>()
const reload=async(rowid:string | undefined | string[])=>{
if(rowid===undefined){return}
const id=Number(rowid)
const res=await detailpostapi(id)
if(res.status===0){
    post.value=res.data
}
}
onMounted( ()=>{
reload(route.params.id)
})
watch(()=>route.params.id,(newId)=>{reload(newId)})
</script>