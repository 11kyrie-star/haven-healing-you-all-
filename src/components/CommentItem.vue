<template>
    <div class="comment-container" :class="{nested:(depth??0)>0}">
        <div class="avatar">
            <img src='@/assets/avatar.jpg' alt="">
        </div>
        <div class="name">{{ comment.username }}</div>
        <div class="content">
            <div>{{ comment.content }}</div>
        </div>
        <div class="picture">
            <img src="@/assets/avatar.jpg" alt="">
        </div>
        <div class="reply-btn" style="user-select: none;">回复</div>
        <div class="time">{{ comment.create_at }}</div>
        <div class="icons-all">
            <div class="star">
                <el-icon :size="15"><Star></Star></el-icon>
                <div class="star-count" style="user-select: none;">{{ comment.star_count }}</div>
            </div>
            <div class="reply" @click="handlereplyagain(comment.id)" :class="{active:isactive}">
                <el-icon :size="15"><ChatSquare></ChatSquare></el-icon>
                <div class="reply-count" style="user-select: none;">{{ comment.reply_count }}</div>
            </div>
        </div>
    </div>
    <div v-if="comment.showreply && comment.children.length">
           <CommentItem v-for="children in comment.children" :comment="children" :key="children.id" :depth="(depth??0)+1"></CommentItem>
    </div>
</template>

<script setup lang="ts">
import {Star,ChatSquare} from '@element-plus/icons-vue'
import {ref} from 'vue'
const props= defineProps<{comment:commentnode,depth?:number}>()
const emit=defineEmits<{toggleReply:[commId:number]}>()
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
    children:commentnode[],
    showreply:boolean
}
const handlereplyagain=(commId:number)=>{
    if(isactive.value===false){
    emit('toggleReply',commId)
    isactive.value=true
}else{
    isactive.value=false
    props.comment.showreply=false
}
}
const isactive=ref(false)
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
        transform: scale(0.8);
        transform-origin: top left;
        margin-left: 20%;
        padding-left: 10px;
    }
    .reply-btn{
        position: absolute;
        left: 90%;
        top: 5%;
        cursor: pointer;
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
                    color: #409eff;
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
</style>