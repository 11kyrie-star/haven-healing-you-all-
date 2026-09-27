<template>
    <div class="card-container" ref="cardRef">
        <div class="leave-word">
            <el-dropdown trigger="click">
               <span>
                <el-icon :size="20"><ArrowDown></ArrowDown></el-icon>
               </span>
               <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item @click="leave">给作者留言</el-dropdown-item>
                    <el-dropdown-item @click="reportPost">举报</el-dropdown-item>
                </el-dropdown-menu>
               </template>
            </el-dropdown>
        </div>
        <div class="name-avatar">
            <div class="avatar">
            <img :src=props.avatar alt="">
            </div>
            <div class="des">
            <div class="name">{{props.username }}</div>
            <div class="time">{{timestr}}</div> 
            </div>
        </div>
        <div class="post-content" v-html="props.content"></div>
        <div class="post-pic" v-if="props.images.length">
            <div class="image-grid"
            :style="{display:'grid',gridTemplateColumns:gridlayout.special? '2fr 1fr':`repeat(${gridlayout.cols},1fr)`,gridTemplateRows:
                gridlayout.special?'1fr 1fr':`repeat(${gridlayout.rows},1fr)`,gap:'4px',aspectRatio:gridlayout.special?'16/9':gridlayout.aspect
            ,borderRadius:'8px',overflow:'hidden',marginTop:'10px',boxShadow:'0 2px 12px rgba(120, 60, 40, 0.08)'}" >
            <div v-for="(item,index) in props.images" :key="index" :style="gridlayout.special && index===0?{gridRow:'1/3'}:{}">
              <img :src="item" alt="帖子图片" loading="lazy" decoding="async"  style="width: 100%; height: 100%; object-fit: cover;cursor: pointer;" @click="openWindow(item)">
            </div>
            </div>
        </div>
        <div class="icon">
        <div class="looking">
            <el-icon>
                <View style="color: rgba(128, 128, 128, 0.3);"></View>
            </el-icon>
            <div class="looking-number">{{ viewcount}}</div>
        </div>
        <div class="icont-all">
            <div class="star">
            <el-icon :size="20">
                <Star @click="togglelike" v-if="!islkied"/>
                <StarFilled v-else class="liked-star" @click="cancelstar"></StarFilled>
            </el-icon>
            <div class="star-number" style="font-size: 0.3em;font-weight: 200;">{{ likecount }}</div>
            </div>
            <div class="commt" @click="commenthandle" :class="{active:isCommentactive}">
            <el-icon :size="20"><ChatSquare /></el-icon>
            <div class="commt-number" style="font-size: 0.3em;font-weight:200;">{{ commentcount }}</div>
            </div>
        </div>
        </div>
        <div class="show-comment" v-if="showcomment">
        <div class="comment-item" v-for="item in roots" :key="item.id">    
         <CommentItem :comment="item" :activereplyid="activereplyid" @toggle-reply="openReplies" @load-more-reply="loadMoreReplies" @want-reply="findeditor" @cancel="change"></CommentItem>
        </div>     
        <!-- 加载更多评论 -->
        <div class="load-more-comments" v-if="hasMoreComments" @click="loadMoreComments" :class="{loading: commentsLoading, error: commentsError}" style="user-select: none;">
            <span v-if="commentsLoading" class="spinner"></span>
            <span style="cursor: default;">{{ commentsError ? '加载失败，点击重试' : (commentsLoading ? '评论加载中...' : '加载更多评论') }}</span>
            <el-icon :size="14" class="load-more-arrow" style="cursor: pointer;"><ArrowDown /></el-icon>
        </div>
        </div>
        <div class="push-comment">
         <Editor ref="editref" margintop="3vh" :showeditor=false minheight="6vh" decide="comment" :post_id="id" @newcomment="addcomment"></Editor>   
        </div>
    </div>
</template>

<script setup lang="ts">
import {View,Star,ChatSquare,ArrowDown,StarFilled} from '@element-plus/icons-vue'
import { useIntersectionObserver } from '@vueuse/core';
import { formatPostTime } from '@/utils/time.ts';
import {addpostview} from '@/api/aboutpost.ts';
import { computed } from 'vue';
import Editor from './Editor.vue';
import CommentItem from './CommentItem.vue';
import { ref,onBeforeUnmount } from 'vue';
import { usePostLike } from '@/composables/usePostLike.ts';
import { useRouter } from 'vue-router';
import { useWindowStore } from '@/stores/window.ts';
import { useCommentLoad } from '@/composables/useCommentLoad.ts';
const props=defineProps<{
    id:number,
    user_id:number,
    avatar:string,
    username:string,
    create_at:string,
    content:string,
    images:string[],
    view_count:number,
    like_count:number,
    comment_count:number,
    is_liked:number
}>()

const viewcount=ref(props.view_count)

//点赞逻辑
const {islkied,cancelstar,likecount,togglelike}=usePostLike(props.id,props.is_liked,props.like_count)
const gridlayout=computed(()=>{
    const n=props.images.length
    if(n===1)return {cols:1,rows:1,aspect:'16/9'}
    if(n===2)return {cols:2,rows:1,aspect:'16/9'}
    if(n===3)return {special:true}
    if(n===4)return {cols:2,rows:2,aspect:'16/9'}
    return {cols:3,rows:Math.ceil(n/3),aspect:'16/9'}
})
const timestr=computed(()=>{
    return formatPostTime(props.create_at)
})




const editref=ref<InstanceType<typeof Editor>>()
//点击回复以后定位评论框
const findeditor=(id:number,name:string)=>{
    activereplyid.value=id
const el=editref.value?.$el as HTMLElement | undefined
el?.scrollIntoView({behavior:'smooth',block:'center'})
editref.value?.flash(id,name)
}
//帖子浏览量+1
const cardRef=ref()
let countef=false
let time:number| null=null
const {stop}=useIntersectionObserver(cardRef,([entry])=>{
if(countef) return stop()
if(entry?.isIntersecting){
     time=window.setTimeout(async()=>{
          countef=true
          stop()
          const res=await addpostview(props.id)
          if(res.status===0){
            viewcount.value++
          }
     },3000)
}else{
    if(time){
        clearTimeout(time)
        time=null
    }
}
},{threshold:0.8})
onBeforeUnmount(()=>{
    if(time){
        clearTimeout(time)
        time=null
    }
    stop()
})
//用户第二次点击回复按钮
const change=()=>{
    editref.value?.Change()
    activereplyid.value=null
    const el=editref.value?.$el as HTMLElement | undefined
    el?.scrollIntoView({behavior:'smooth',block:'center'}) 
}
const router=useRouter()
//留言
const leave=()=>{
router.push(`/layout/content/leaveban/${props.id}`)
}

//点击照片打开弹窗
const windowstore=useWindowStore()
const openWindow=(img:string)=>{
windowstore.open('postimg',img)
}
//展示、加载、添加评论模块
const {roots,loadMoreComments,hasMoreComments,commentsError,commentsLoading,commenthandle,isCommentactive,showcomment,addcomment,activereplyid,commentcount,openReplies,loadMoreReplies}=useCommentLoad(props.id,props.comment_count)

//举报帖子
const reportPost=()=>{
    windowstore.open('report',undefined ,props.id)
}
</script>

<style scoped lang="scss">
.card-container{
    width: 30vw;
    min-height: 35vh;
    margin-top: 3vh;
    content-visibility: auto;
    contain-intrinsic-size: auto 35vh;
    background:
        radial-gradient(circle at 90% 6%, rgba(233, 189, 124, 0.18) 0%, transparent 40%),
        linear-gradient(135deg, rgba(255, 255, 255, 0.74) 0%, rgba(255, 243, 234, 0.58) 100%);
    border: 1px solid rgba(224, 128, 113, 0.35);
    border-radius: 14px;
    box-shadow: 0 2px 10px rgba(120, 60, 40, 0.1), 0 8px 24px rgba(224, 128, 113, 0.14);
    backdrop-filter: blur(8px);
    transition: box-shadow 0.3s ease, top 0.3s ease, border-color 0.3s ease;
    padding: 3%;
    position: relative;
    font-family: var(--font-main);
    color: rgba(50, 50, 50, 0.85);
    &::before{
        content: '';
        position: absolute;
        top: 0;
        left: 16px;
        right: 16px;
        height: 3px;
        border-radius: 0 0 6px 6px;
        background: linear-gradient(90deg, rgba(233, 189, 124, 0.6), rgba(224, 128, 113, 0.7), rgba(250, 130, 145, 0.55));
    }
    .leave-word{
        position: absolute;
        cursor: pointer;
        left: 90%;
        top: 15px;
        color: rgba(50, 50, 50, 0.55);
        transition: color 0.2s ease;
        &:hover{
            color: #c6401f;
        }
    }
    &:hover{
        top: -1px;
        border-color: rgba(224, 128, 113, 0.5);
        box-shadow: 0 6px 18px rgba(224, 128, 113, 0.24), 0 14px 34px rgba(120, 60, 40, 0.16);
    }
    .name-avatar{
        width: fit-content;
        height: fit-content;
        display: flex;
        align-items: center;
        gap: 10px;
         .avatar{
        width: 4vw;
        height: 8vh;
        background-color: white;
        border-radius: 55%;
        border: 2px solid rgba(255, 255, 255, 0.9);
        box-shadow: 0 2px 8px rgba(120, 60, 40, 0.15);
        user-select: none;
        img{
            width:100%;
            height:100%;
            border-radius: 55%;
            object-fit: cover;
        }
    }
    .des{
        width: fit-content;
        height: fit-content;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        .name{
          user-select: none;
          margin-top: 2px;  
          flex-shrink: 0;
          font-size: 1.05em;
          font-weight: 700;
          color: rgba(50, 50, 50, 0.9);
       }
       .time{
        user-select: none;
        flex-shrink: 0;
        font-size: 0.75em;
        font-weight: 300;
        color: rgba(128, 128, 128, 0.6);
       }
    }
    }
    .post-content{
        margin-top: 12px;
        cursor: default;
        font-size: 0.95em;
        line-height: 1.7;
        word-break: break-word;
    }
    .show-comment{
        margin-top: 10px;
    }
    .icon{
         display: flex;
         align-items: center;   
         width: 100%;
         user-select: none;     
         .looking{
          width: fit-content;
          height: fit-content;  
          margin-top: 10px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 4px;
          .looking-number{
            cursor: default;
            font-size: 0.8em;
            color:rgba(128, 128, 128, 0.45);
            user-select: none;
          }
    }
    .icont-all{
        display: flex;
        align-items: center;
        margin-top: 8px;
        margin-left: auto;
        gap: 24px;
        user-select: none;
      .star{
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        user-select: none;
        gap: 2px;
        color: rgba(50, 50, 50, 0.55);
        transition: color 0.2s ease;
        &:hover{
            color: #ff6b81;
        }
        .liked-star{
            color: #ff6b81;
            filter: drop-shadow(0 0 6px rgba(238, 107, 55, 0.5));
            animation: like-pop 0.3s ease;
        }
      }
      .commt{
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        user-select: none;
        gap: 2px;
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
    }
}
@keyframes like-pop{
    0%   { transform: scale(1); }
    50%  { transform: scale(1.3); }
    100% { transform: scale(1); }
}</style>
