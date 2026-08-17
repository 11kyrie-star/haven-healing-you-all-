<template>
    <div class="card-container" ref="cardRef">
        <div class="leave-word">
            <el-dropdown trigger="click">
               <span>
                <el-icon :size="20"><ArrowDown></ArrowDown></el-icon>
               </span>
               <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item>给作者留言</el-dropdown-item>
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
            <div v-for="(item,index) in props.images" :style="gridlayout.special && index===0?{gridRow:'1/3'}:{}">
              <img :src="item" alt="" style="width: 100%; height: 100%; object-fit: cover;cursor: pointer;">
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
                <Star  v-if="!islkied"/>
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
         <CommentItem :comment="item" @toggle-reply="getreply" @want-reply="findeditor"></CommentItem>
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
import {getpostcomment,getpostreply,starpost,cancelstarpost,addpostview} from '@/api/aboutpost.ts';
import type { post } from '@/types/post.ts';
import type { comment } from '@/types/post.ts';
import { computed } from 'vue';
import Editor from '@/components/Editor.vue';
import CommentItem from '@/components/CommentItem.vue';
import { ref,onBeforeUnmount } from 'vue';
import { ElMessage } from 'element-plus';
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
    index:number
}>()
const viewcount=ref(props.view_count)
const emit=defineEmits<{
    addpostagain:[post:post],
    deletelikepost:[index:number]
}>()
const islkied=ref(props.is_liked)
const likecount=ref(props.like_count)
const commentcount=ref(props.comment_count)
//取消点赞函数
const cancelstar=async()=>{
    const res=await cancelstarpost(props.id)
    if(res.status===1){
        return ElMessage.warning('网络异常')
    }else{
        islkied.value=res.data.is_liked
        likecount.value--
    }
    emit('deletelikepost',props.index)
}
const data=computed(()=>({
id:props.id,
user_id:props.user_id,
avatar:props.avatar,
username:props.username,
create_at:props.create_at,
content:props.content,
images:props.images,
view_count:props.view_count,
like_count:props.like_count,
comment_count:props.comment_count,
is_liked:props.is_liked
}))
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
const addcomment=(comment:comment)=>{
    if(comment.parent_id===null){
       commentList.value.unshift(comment)
       roots.value=biuldtree(commentList.value)
       commentcount.value++
    }else{
        const parent=findNode(roots.value,comment.parent_id!)
        if (parent) {
            parent.reply_count++ 
            commentcount.value++                   
            parent.children.unshift({
                ...comment,
                children: [],
                showreply: false
            })
            parent.showreply=true   
        }                    
    }
}
const commentList=ref<comment[]>([])
const roots=ref<commentnode[]>([])
const showcomment=ref(false)
const isCommentactive=ref(false) //控制按钮的状态
//点击评论按钮后的处理函数
const commenthandle=async ()=>{
if(commentcount.value===0){
    return
}
if(isCommentactive.value===false){
    isCommentactive.value=true
}else{
    isCommentactive.value=false
}
if(showcomment.value===false){
showcomment.value=true
const res=await getpostcomment(props.id)
commentList.value=res.data
roots.value=biuldtree(commentList.value)
}else{
    showcomment.value=false
}
}
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
//把后端返回了数据构建成树
function biuldtree(list:comment[]):commentnode[]{
    const map=new Map<number,commentnode>()
    const roots=ref<commentnode[]>([])
    for(const item of list){
        map.set(item.id,{...item,children:[],showreply:false})
    }
    for(const item of list){
        const node=map.get(item.id)
        if(item.parent_id===null){
            roots.value.push(node!)
        }else{
            const parent=map.get(item.parent_id)
            parent?.children.push(node!)
        }
    }
    return roots.value
}
//点到回复评论的函数
const getreply=async (commId:number)=>{
const node=findNode(roots.value,commId)
if(!node) return
if(node.children.length===0){
const replies=(await getpostreply(commId)).data
node.children.push(...replies.map((item:comment)=>({
...item,
children:[],
showreply:false
})))
}
node.showreply=true
}
//找到对应的节点
const findNode=(tree:commentnode[],id:number):commentnode | null=>{
   for(const node of tree){
    if(node.id===id){
        return node
    }
    if(node.children.length){
        const found=findNode(node.children,id)
        if(found) return found
    }
   }
   return null
}
const editref=ref<InstanceType<typeof Editor>>()
//点击回复以后定位评论框
const findeditor=(id:number,name:string)=>{
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
</script>

<style scoped lang="scss">
.card-container{
    width: 30vw;
    min-height: 40vh;
    margin-top: 3vh;
    background-color: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 12px;
    box-shadow:0 2px 12px rgba(0, 0, 0, 0.06);
    transition: box-shadow 0.3s ease, transform 0.3s ease;
    padding: 3%;
    position: relative;
    font-family: 'LXGW WenKai', 'Inter', sans-serif;
    color: rgba(50, 50, 50, 0.85);
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
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
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
}
</style>
