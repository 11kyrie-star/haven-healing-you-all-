<template>
    <div class="card-container" ref="cardRef">
        <div class="card-actions">
            <div class="post-state-badges">
                <div class="post-state-badge privacy-badge" v-show="!status && props.report_status!==3" role="status" aria-label="当前帖子仅自己可见">
                    <span class="state-symbol" aria-hidden="true">
                        <el-icon :size="11"><Lock></Lock></el-icon>
                    </span>
                    <span>私密</span>
                </div>
                <!-- 下架状态：接入 report_status 后，替换这里的 v-if 条件 -->
                <div class="post-state-badge offline-badge" v-if="props.report_status===3" role="status" aria-label="当前帖子已下架">
                    <span class="state-symbol offline-symbol" aria-hidden="true">×</span>
                    <span>已下架</span>
                </div>
            </div>
            <el-dropdown trigger="click">
               <button class="more-trigger" type="button" aria-label="帖子操作">
                <el-icon :size="18"><ArrowDown></ArrowDown></el-icon>
               </button>
               <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item @click="deletepost">删除</el-dropdown-item>
                    <el-dropdown-item @click="Changestatus" v-if="status">私密</el-dropdown-item>
                    <el-dropdown-item @click="Changepublic" v-if="!status">公开</el-dropdown-item>
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
              <img :src="item" alt="" style="width: 100%; height: 100%; object-fit: cover;cursor: pointer;" loading="lazy" decoding="async" @click="openwindow(item)">
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
import {View,Star,ChatSquare,ArrowDown,StarFilled,Lock} from '@element-plus/icons-vue'
import { useIntersectionObserver } from '@vueuse/core';
import { formatPostTime } from '@/utils/time.ts';
import {addpostview,changepoststatus,deletepostapi} from '@/api/aboutpost.ts';
import type { post } from '@/types/post.ts';
import { useWindowStore } from '@/stores/window';
import { computed } from 'vue';
import Editor from '@/components/Editor.vue';
import CommentItem from '@/components/CommentItem.vue';
import { ref,onBeforeUnmount } from 'vue';
import { usePostLike } from '@/composables/usePostLike';
import { useCommentLoad } from '@/composables/useCommentLoad';
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
    is_liked:number,
    is_public:1 |0,
    index:number,
    report_status:number | undefined
}>()
//打开弹窗显示照片
const windowstore=useWindowStore()
const openwindow=(postimg:string)=>{
    windowstore.open('postimg',postimg)
}

const viewcount=ref(props.view_count)
const emit=defineEmits<{
    addpostagain:[post:post],
    delete:[id:number]
}>()


//点赞模块
const {cancelstar,togglelike,islkied,likecount}=usePostLike(props.id,props.is_liked,props.like_count)

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
//用户第二次点击回复按钮
const change=()=>{
    editref.value?.Change()
    const el=editref.value?.$el as HTMLElement | undefined
    el?.scrollIntoView({behavior:'smooth',block:'center'}) 
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
//改变帖子为私密状态状态
const status=ref(props.is_public)
let timer5:ReturnType<typeof setTimeout> | null=null
const Changestatus=()=>{
    if(timer5){return}
    timer5=setTimeout(async()=>{
        try{
          const res=await changepoststatus(props.id,0)
         if(res.status===0){
            status.value=0
          }
        }finally{
            clearTimeout(timer5!)
            timer5=null
        }
    },300)
}
//改变帖子为公开状态
let timer4:ReturnType<typeof setTimeout> | null=null
const Changepublic=()=>{
    if(timer4){return}
    timer4=setTimeout(async()=>{
        try{
      const res=await changepoststatus(props.id,1)
    if(res.status===0){
        status.value=1
    }}finally{
        clearTimeout(timer4!)
        timer4=null
    }
    },300) 
}
//删除帖子
let timer3:ReturnType<typeof setTimeout> | null =null
const deletepost=()=>{
    if(timer3){return}
    timer3=setTimeout(async()=>{
        try{
       const res=await deletepostapi(props.id)
   if(res.status===0){
    emit('delete',props.index)
    }}finally{
        clearTimeout(timer3!)
        timer3=null
    }
    },300)
}
//展示、加载、添加评论模块
const {roots,loadMoreComments,hasMoreComments,commentsError,commentsLoading,commenthandle,isCommentactive,showcomment,addcomment,activereplyid,commentcount,openReplies,loadMoreReplies}=useCommentLoad(props.id,props.comment_count)

</script>

<style scoped lang="scss">
.card-container{
    width: 30vw;
    min-height: 40vh;
    margin-top: 3vh;
    content-visibility: auto;
    contain-intrinsic-size: auto 40vh;
    background:
        radial-gradient(circle at 90% 6%, rgba(233, 189, 124, 0.18) 0%, transparent 40%),
        linear-gradient(135deg, rgba(255, 255, 255, 0.74) 0%, rgba(255, 243, 234, 0.58) 100%);
    border: 1px solid rgba(224, 128, 113, 0.35);
    border-radius: 14px;
    box-shadow: 0 2px 10px rgba(120, 60, 40, 0.1), 0 8px 24px rgba(224, 128, 113, 0.14);
    backdrop-filter: blur(8px);
    transition: box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease;
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
    .card-actions{
        position: absolute;
        top: 14px;
        right: 16px;
        z-index: 2;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .post-state-badges{
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 6px;
    }

    .post-state-badge{
        position: relative;
        height: 26px;
        padding: 0 9px 0 5px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        box-sizing: border-box;
        border-radius: 8px;
        font-size: 0.72em;
        font-weight: 700;
        line-height: 1;
        white-space: nowrap;
        user-select: none;
        backdrop-filter: $glass-blur-mini;
    }

    .state-symbol{
        width: 16px;
        height: 16px;
        display: grid;
        flex: 0 0 16px;
        place-items: center;
        border-radius: 5px;
        font-size: 0.86em;
        font-weight: 800;
        line-height: 1;
    }

    .privacy-badge{
        color: #8b5e55;
        background: linear-gradient(135deg, rgba(255, 252, 249, 0.92), rgba(247, 226, 218, 0.78));
        border: 1px solid rgba(184, 118, 104, 0.26);
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.82),
            0 3px 10px rgba(120, 60, 40, 0.1);

        .state-symbol{
            color: #fff;
            background: linear-gradient(135deg, #cd8b78, #ad665b);
            box-shadow: 0 2px 5px rgba(173, 102, 91, 0.22);
        }
    }

    .offline-badge{
        color: #6f625f;
        background: linear-gradient(135deg, rgba(249, 248, 247, 0.94), rgba(225, 220, 218, 0.82));
        border: 1px solid rgba(105, 92, 88, 0.24);
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.84),
            0 3px 10px rgba(70, 58, 55, 0.1);

        .offline-symbol{
            color: #fff;
            background: linear-gradient(135deg, #8d7d78, #6b5c58);
            box-shadow: 0 2px 5px rgba(78, 65, 61, 0.24);
        }
    }
    .more-trigger{
        width: 28px;
        height: 28px;
        padding: 0;
        display: grid;
        place-items: center;
        color: $color-ink;
        background: rgba(255, 255, 255, 0.62);
        border: 1px solid $color-warm-soft;
        border-radius: $radius-circle;
        box-shadow: 0 2px 8px rgba(224, 128, 113, 0.14);
        backdrop-filter: $glass-blur-mini;
        cursor: pointer;
        transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        &:hover{
            color: $color-warm-pink;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 236, 230, 0.8));
            border-color: $color-warm-mid;
            box-shadow: 0 4px 12px rgba(224, 128, 113, 0.24);
            transform: translateY(-1px);
        }
        &:active{
            transform: translateY(0);
            box-shadow: 0 2px 6px rgba(224, 128, 113, 0.18);
        }
        &:focus-visible{
            outline: 2px solid $color-pink-soft;
            outline-offset: 2px;
        }
    }
    &:hover{
        transform: translateY(-1px);
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
    /* 加载更多评论按钮 */
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
@keyframes load-more-spin{
    to { transform: rotate(360deg); }
}

@keyframes like-pop{
    0%   { transform: scale(1); }
    50%  { transform: scale(1.3); }
    100% { transform: scale(1); }
}</style>
