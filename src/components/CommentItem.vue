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
           <CommentItem v-for="children in comment.children" :comment="children" :key="children.id" :depth="(depth??0)+1" @toggle-reply="(id:number)=>emit('toggleReply',id)" @want-reply="(id:number,reply:string)=>emit('wantReply',id,reply)"></CommentItem>
    </div>
</template>

<script setup lang="ts">
import {Star,ChatSquare,StarFilled} from '@element-plus/icons-vue'
import { commentstar ,cancelcomentstar} from '@/api/aboutpost';
import {ref} from 'vue'
import { formatPostTime } from '@/utils/time';
import { ElMessage } from 'element-plus';
import { id } from 'element-plus/es/locales.mjs';
const props= defineProps<{comment:commentnode,depth?:number}>()
const emit=defineEmits<{toggleReply:[commId:number],wantReply:[commId:number,reply:string]}>()
interface commentnode{
    id:number,
    post_id:number,
    user_id:number,
    parent_id:null | number,
    avatar:string,
    username:string,
    content:string,
    create_at:string,
    star_count:number,
    reply_count:number,
    images?:string[]
    children:commentnode[],
    showreply:boolean,
    is_liked:number
}
const isliked=ref(props.comment.is_liked)
const starcount=ref(props.comment.star_count)
const replycount=ref(props.comment.reply_count)
//点赞函数
const togglestar=async()=>{
const res=await commentstar(props.comment.id)
if(res.status===1){
    return ElMessage.warning('网络异常')
}else{
    starcount.value++
    isliked.value=res.data.is_liked
}
}
//取消点赞函数
const cancelstar=async()=>{
const res=await cancelcomentstar(props.comment.id)
if(res.status===1){
    return ElMessage.warning('网络异常')
}else{
    starcount.value--
    isliked.value=res.data.is_liked
}
}
//查看评论的回复
const handlereplyagain=(commId:number)=>{
    if(props.comment.reply_count===0){
        return
    }
    if(isactive.value===false){
    emit('toggleReply',commId)
    isactive.value=true
}else{
    isactive.value=false
    props.comment.showreply=false
}
}
const replyactive=ref(false)
//点击回复按钮
const handlereplebtn=()=>{
    if(replyactive.value===false){
      replyactive.value=true
      emit('wantReply',props.comment.id,'reply')
    }else{
      replyactive.value=false
    }
}
const isactive=ref(false)
let timestr=ref()
timestr.value=formatPostTime(props.comment.create_at)
</script>

<style scoped lang="scss">
.comment-container{
    width: 100%;
    min-height: 15vh;
    padding: 5px;
    background-color:rgba(244, 199, 199, 0.3);
    position: relative;
    &.nested{
        background-color: rgba(244, 199, 199, 0.3);
        zoom: 0.7;
        padding-left: 20px;
    }
    .reply-btn{
        position: absolute;
        left: 90%;
        top: 5%;
        cursor: pointer;
        transition: color 0.3s ease,font-size 0.3s ease,transform 0.3s ease,box-shadow 0.3s ease;
        &.active{
            color: #f34f67;
            font-size: 1em;
            transform: translateY(-3px);
            box-shadow: 0 4px 12px rgba(235, 182, 189, 0.25);
        }
    }
    .name{
        color: #2d2d2d;
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
        box-shadow: 0 2px 8px rgba(0,0,0,0.68);
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
        color: #555555;
        margin-top: 5px;
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
            font-size: 0.8em;
            user-select: none;
            cursor: pointer;
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
            font-size: 0.8em;
            user-select: none;
            cursor: pointer;
            &.active{
                :deep(.el-icon){
                    color:#ff6b81;
                }
            }
        }
    }
    .time{
        color: #999999;
        font-size: 0.8em;
        margin-top: 10px;
        user-select: none;
    }
    .picture{
        width: 120px;
        height: 120px;
        border-radius: 6px;
        overflow: hidden;
        margin-top: 10px;
        cursor: pointer;
        img{
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    }
}
@keyframes like-pop{
    0%   { transform: scale(1); }
    50%  { transform: scale(1.3); }
    100% { transform: scale(1); }
}
</style>