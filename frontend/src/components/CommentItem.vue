<template>
    <div class="comment-container" :class="{nested:(depth??0)>0}">
        <div class="avatar">
            <img :src=comment.avatar alt="">
        </div>
        <div class="name">{{ comment.username }}</div>
        <div class="content">
            <div v-html="comment.content"></div>
        </div>
        <div class="picture" v-if="comment.images?.length">
            <img :src=comment.images[0] alt="">
        </div>
        <div class="reply-btn" style="user-select: none;" @click="handlereplebtn" :class="{active:replyactive}">回复</div>
        <div class="time">{{ timestr }}</div>
        <div class="icons-all">
            <div class="star">
                <el-icon :size="15">
                    <Star v-if="!isliked" @click="togglestar"></Star>
                    <StarFilled v-else class="liked-star" @click="cancelstar"></StarFilled>
                </el-icon>
                <div class="star-count" style="user-select: none;">{{ starcount }}</div>
            </div>
            <div class="reply" @click="handlereplyagain(comment.id)" :class="{active:isactive}">
                <el-icon :size="15"><ChatSquare></ChatSquare></el-icon>
                <div class="reply-count" style="user-select: none;">{{props.comment.reply_count}}</div>
            </div>
        </div>
    </div>
    <div v-if="comment.showreply && comment.children.length">
      <CommentItem v-for="children in comment.children" :comment="children" :key="children.id" :activereplyid="activereplyid" :depth="(depth??0)+1" @toggle-reply="(id:number)=>emit('toggleReply',id)" @want-reply="(id:number,reply:string)=>emit('wantReply',id,reply)" @load-more-reply="(id:number)=>emit('loadMoreReply',id)"></CommentItem>
    <!-- 加载更多回复 -->
    <div class="load-more-comments" v-if="comment.replyHasMore" @click="loadMorereplys" :class="{loading: comment.replyLoading, error: comment.replyError}" style="user-select: none;">
      <span v-if="comment.replyLoading" class="spinner"></span>
      <span style="cursor: default;">{{ comment.replyError ? '加载失败，点击重试' : (comment.replyLoading ? '加载中...' : '加载更多回复') }}</span>
        <el-icon :size="14" class="load-more-arrow" style="cursor: pointer;"><ArrowDown /></el-icon>
    </div>
    </div>
</template>

<script setup lang="ts">
import {Star,ChatSquare,StarFilled,ArrowDown} from '@element-plus/icons-vue'
import { commentstar ,cancelcomentstar} from '@/api/aboutpost';
import {ref,computed} from 'vue'
import { formatPostTime } from '@/utils/time';
import { ElMessage } from 'element-plus';
import type { commentnode } from '@/types/post';
const props= defineProps<{comment:commentnode,depth?:number,activereplyid:number | null}>()
const emit=defineEmits<{toggleReply:[commId:number],wantReply:[commId:number,reply:string],cancel:[],loadMoreReply:[commId:number]}>()
const isliked=ref(props.comment.is_liked)
const starcount=ref(props.comment.star_count)
//点赞函数
let timer:ReturnType<typeof setTimeout> | null=null
const togglestar=()=>{
    if(timer){return}
    timer=setTimeout(async()=>{
        try{
          const res=await commentstar(props.comment.id)
if(res.status===1){
    return ElMessage.warning('网络异常')
}else{
    starcount.value++
    isliked.value=res.data.is_liked
}
        }finally{
            clearTimeout(timer!)
            timer=null
        }
    },300)
}
//取消点赞函数
let timer2:ReturnType<typeof setTimeout> | null =null
const cancelstar=()=>{
    if(timer2){return}
    timer2=setTimeout(async()=>{
        try{
          const res=await cancelcomentstar(props.comment.id)
if(res.status===1){
    return ElMessage.warning('网络异常')
}else{
    starcount.value--
    isliked.value=res.data.is_liked
}
        }finally{
            clearTimeout(timer2!)
            timer2=null
        }
    },300)

}
//查看评论的回复
const handlereplyagain=(commId:number)=>{
    if(props.comment.reply_count===0){
        return
    }
    // 展开/收起与首次加载统一交给父组件维护，避免直接修改 props
    emit('toggleReply',commId)
}
const replyactive=computed(()=>(props.activereplyid===props.comment.id))
//点击回复按钮
const handlereplebtn=()=>{
    if(!replyactive.value){
      emit('wantReply',props.comment.id,'reply')
    }else{
      emit('cancel')
    }
}
const isactive=computed(()=>props.comment.showreply && props.comment.children.length>0)


const timestr=ref()
timestr.value=formatPostTime(props.comment.create_at)
const loadMorereplys=()=>{
    emit('loadMoreReply',props.comment.id)
}
</script>

<style scoped lang="scss">
.comment-container{
    width: 100%;
    padding: 8px 10px;
    background-color: rgba(255, 255, 255, 0.65);
    border: 1px solid rgba(224, 167, 167, 0.18);
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(120, 60, 40, 0.05);
    position: relative;
    font-family: 'LXGW WenKai', 'Inter', sans-serif;
    color: rgba(50, 50, 50, 0.85);
    content-visibility: auto;
    contain-intrinsic-size: auto 20vh;
    &.nested{
        background-color: rgba(255, 255, 255, 0.5);
        zoom: 0.7;
        padding-left: 20px;
    }
    .reply-btn{
        position: absolute;
        left: 90%;
        top: 5%;
        cursor: pointer;
        font-size: 0.8em;
        font-weight: 600;
        color: rgba(50, 50, 50, 0.55);
        transition: color 0.3s ease, font-size 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
        &:hover{
            color: #c6401f;
        }
        &.active{
            color: #f34f67;
            font-size: 1em;
            transform: translateY(-3px);
            box-shadow: 0 4px 12px rgba(235, 182, 189, 0.25);
        }
    }
    .name{
        color: rgba(50, 50, 50, 0.9);
        font-size: 0.9em;
        font-weight: 700;
        position: absolute;
        left: 14%;
        top: 1.7vh;
        user-select: none;
    }
    .avatar{
        width: 45px;
        height: 45px;
        border-radius: 50%;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(120, 60, 40, 0.15);
        border: 2px solid rgba(255,255,255,0.9);
        position: relative;
        &::after{
           content: '';
           position: absolute;
           inset: 0;
           border-radius: inherit;
           box-shadow: inset 0 1px 3px rgba(255,255,255,0.5);
           pointer-events: none;
        }
        img{
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }
    .content{
        color: rgba(50, 50, 50, 0.75);
        font-size: 0.9em;
        line-height: 1.6;
        margin-top: 6px;
        cursor: default;
    }
    .icons-all{
        display: flex;
        gap: 20px;
        margin-top: 3px;
        margin-left: 80%;
        user-select: none;
        .star{
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 2px;
            font-size: 0.8em;
            user-select: none;
            cursor: pointer;
            color: rgba(50, 50, 50, 0.55);
            transition: color 0.2s ease;
            &:hover{
                color: #ff6b81;
            }
            .liked-star{
                color: #ff6b81;
                filter: drop-shadow(0 0 6px rgba(230, 97, 70, 0.5));
                animation: like-pop 0.3s ease;
            }
        }
        .reply{
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 2px;
            font-size: 0.8em;
            user-select: none;
            cursor: pointer;
            color: rgba(50, 50, 50, 0.55);
            transition: color 0.2s ease;
            &:hover{
                color: #ff6b81;
            }
            &.active{
                :deep(.el-icon){
                    color:#ff6b81;
                }
            }
        }
    }
    .time{
        color: rgba(128, 128, 128, 0.6);
        font-size: 0.75em;
        font-weight: 300;
        margin-top: 10px;
        user-select: none;
    }
    .picture{
        width: 120px;
        height: 120px;
        border-radius: 8px;
        overflow: hidden;
        margin-top: 10px;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(120, 60, 40, 0.12);
        img{
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }
        &:hover img{
            transform: scale(1.05);
        }
    }
}

/* 加载更多回复按钮 */
.load-more-comments{
    margin: 12px auto 2px;
    width: fit-content;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 6px 20px;
    font-size: 0.82em;
    letter-spacing: 1px;
    color: rgba(224, 128, 113, 0.85);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.72), rgba(255, 243, 234, 0.55));
    border: 1px solid rgba(224, 128, 113, 0.35);
    border-radius: 999px;
    cursor: pointer;
    user-select: none;
    box-shadow: 0 2px 8px rgba(224, 128, 113, 0.15);
    transition: all 0.25s ease;

    .spinner{
        width: 12px;
        height: 12px;
        flex-shrink: 0;
        border: 2px solid rgba(224, 128, 113, 0.2);
        border-top-color: rgba(224, 128, 113, 0.9);
        border-radius: 50%;
        animation: load-more-spin 0.8s linear infinite;
    }
    .load-more-arrow{
        transition: transform 0.25s ease;
    }
    &:hover{
        color: #fff;
        background: linear-gradient(135deg, rgba(224, 128, 113, 0.95), rgba(250, 130, 145, 0.9));
        border-color: rgba(224, 128, 113, 0.5);
        box-shadow: 0 4px 14px rgba(224, 128, 113, 0.35);
        transform: translateY(-1px);
        .load-more-arrow{
            transform: translateY(2px);
        }
    }
    &:active{
        transform: translateY(0);
        box-shadow: 0 2px 6px rgba(224, 128, 113, 0.25);
    }
    /* 加载中：转圈提示+禁用 */
    &.loading{
        color: rgba(224, 128, 113, 0.9);
        cursor: default;
        pointer-events: none;
    }
    /* 网络异常：加载失败可点击重试 */
    &.error{
        color: #c6401f;
        background: linear-gradient(135deg, rgba(255, 235, 232, 0.85), rgba(255, 243, 234, 0.6));
        border-color: rgba(219, 69, 35, 0.45);
        box-shadow: 0 2px 10px rgba(219, 69, 35, 0.2);
        .load-more-arrow{
            transform: translateY(2px);
        }
        &:hover{
            color: #fff;
            background: linear-gradient(135deg, rgba(219, 69, 35, 0.95), rgba(250, 130, 145, 0.9));
            border-color: rgba(219, 69, 35, 0.5);
            box-shadow: 0 4px 14px rgba(219, 69, 35, 0.35);
        }
    }
}
@keyframes load-more-spin{
    to { transform: rotate(360deg); }
}

@keyframes like-pop{
    0%   { transform: scale(1); }
    50%  { transform: scale(1.3); }
    100% { transform: scale(1); }
}
</style>
