<template>
    <div class="card-container">
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
            ,borderRadius:'8px',overflow:'hidden',marginTop:'10px',boxShadow:'box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08)'}" >
            <div v-for="(item,index) in props.images" :style="gridlayout.special && index===0?{gridRow:'1/3'}:{}">
              <img :src="item" alt="" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            </div>
        </div>
        <div class="icon">
        <div class="looking">
            <el-icon>
                <View style="color: rgba(128, 128, 128, 0.3);"></View>
            </el-icon>
            <div class="looking-number">{{ props.view_count }}</div>
        </div>
        <div class="icont-all">
            <div class="star">
            <el-icon :size="20"><Star /></el-icon>
            <div class="star-number" style="font-size: 0.3em;font-weight: 200;">{{ props.like_count }}</div>
            </div>
            <div class="commt">
            <el-icon :size="20"><ChatSquare /></el-icon>
            <div class="commt-number" style="font-size: 0.3em;font-weight:200;">{{ props.comment_count }}</div>
            </div>
        </div>
        </div>
        <div class="show-comment"></div>
        <div class="push-comment">
         <Editor margintop="3vh" :showeditor=false minheight="6vh" decide="comment"></Editor>   
        </div>
    </div>
</template>

<script setup lang="ts">
import {View,Star,ChatSquare} from '@element-plus/icons-vue'
import { formatPostTime } from '@/utils/time.ts';
import { computed } from 'vue';
import Editor from './Editor.vue';
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
    comment_count:number
}>()
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
</script>

<style scoped lang="scss">
.card-container{
    width: 30vw;
    min-height: 40vh;
    margin-top: 3vh;
    background-color:rgba(255, 255, 255, 0.792);
    border-radius: 12px;
    box-shadow:0 2px 12px rgba(0, 0, 0, 0.06);
    transition: box-shadow 0.3s,transform 0.3s;
    padding: 3%;
    position: relative;
    &:hover{
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
    }
    .name-avatar{
        width: fit-content;
        height: fit-content;
        display: flex;
                gap: 3%;
         .avatar{
        width: 4vw;
        height: 8vh;
        background-color: white;
        border-radius: 55%;
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
        .name{
          margin-top: 2px;  
          flex-shrink: 0;
          font-size: 1.2em;
       }
       .time{
        flex-shrink: 0;
        font-size: 0.8em;
        font-weight: 300;
       }
    }
    }
    .post-content{
        margin-top: 10px;
        cursor: default;
    }
    .icon{
         display: flex;
         align-items: center;   
         width: 100%;     
         .looking{
          width: fit-content;
          height: fit-content;  
          margin-top: 10px;
          display: flex;
          justify-content: center;
          align-items: center;
          .looking-number{
            cursor: default;
            font-size: 0.5em;
            color:rgba(128, 128, 128, 0.3) ;
          }
    }
    .icont-all{
        display: flex;
        margin-top: 8px;
        margin-left:80%;
        gap: 60%;

      .star{
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
      .commt{
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
    }
    }
    
}
</style>