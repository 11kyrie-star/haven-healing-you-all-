<template>
    <div class="postcard-container">
        <div class="myword">
        <div class="name" style="cursor: default;"><span class="me">我</span>:</div>
        <div class="content">
            <div class="text" style="cursor: default;" v-html="props.item.my_comment.content" v-show="props.item.my_comment.content.trim().length"></div>
            <div class="img"><img :src=props.item.my_comment.images[0] alt="" @click="opnewindow"></div>
        </div>
        <div class="time" style="cursor: default;">{{ commenttimestr }}</div>
        </div>
        <div class="post">
            <div class="namepic">
             <div class="avatar">
                <img :src=props.item.avatar alt="">
             </div>
             <div class="name" style="cursor: default;">{{ props.item.username }}</div>
            </div>
            <div class="content" style="cursor: default;" v-html="props.item.content"></div>
            <div>.....</div>
            <div class="time" style="cursor: default;">{{ posttimestr }}</div>
            <div class="detail" @click="pushdetail">详情</div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.postcard-container{
    width: 100%;
    min-height: 20vh;
    padding: 14px 16px;
    content-visibility: auto;
    contain-intrinsic-size: auto 20vh;
    background-color: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    font-family: var(--font-main);
    color: rgba(50, 50, 50, 0.85);
    transition: box-shadow 0.3s ease, transform 0.3s ease;
    &:hover{
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
    }
    .myword{
        display: flex;
        align-items: flex-start;
        gap: 8px;
        position: relative;
        .time{
        position: absolute;    
        font-size: 0.75em;
        font-weight: 300;
        color: rgba(128, 128, 128, 0.6);
        left: 85%;
        top: 5px;
        }
        .name,
        .another{
            display: flex;
            align-items: center;
            gap: 4px;
            flex-shrink: 0;
            color: rgba(50, 50, 50, 0.8);
            font-size: 0.95em;
            .me{
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 1.6em;
                height: 1.6em;
                padding: 0 0.4em;
                border-radius: 999px;
                background: linear-gradient(135deg, #ee9473 0%, #e2668b 100%);
                color: #fff;
                font-size: 1em;
                font-weight: 700;
                box-shadow: 0 2px 6px rgba(226, 102, 139, 0.35);
            }
        }
        .another{
            .reply{
                color: rgba(128, 128, 128, 0.6);
            }
            .outhor{
                color: #c6401f;
                font-weight: 700;
            }
        }
        .content{
            flex-grow: 1;
            width: 80%;
            background-color: rgba(255, 255, 255, 0.72);
            border: 1px solid rgba(224, 167, 167, 0.22);
            border-radius: 12px;
            padding: 10px 12px 12px;
            box-shadow: 0 2px 8px rgba(120, 60, 40, 0.06);
            .text{
                font-size: 0.95em;
                line-height: 1.7;
                color: rgba(50, 50, 50, 0.85);
                word-break: break-word;
            }
            .img{
                width: 30%;
                min-width: 110px;
                max-width: 200px;
                height: 16vh;
                margin-top: 8px;
                overflow: hidden;
                border-radius: 8px;
                box-shadow: 0 2px 6px rgba(120, 60, 40, 0.12);
                cursor: pointer;
                img{
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.3s ease;
                }
                &:hover img{
                    transform: scale(1.06);
                }
            }
        }
    }
    .post{
        position: relative;
        margin-top: 12px;
        padding: 12px 14px;
        border-radius: 10px;
        border: 1px solid rgba(224, 167, 167, 0.18);
        border-left: 3px solid rgba(224, 128, 113, 0.55);
        background: linear-gradient(
            135deg,
            rgba(219, 171, 164, 0.3) 0%,
            transparent 85%
        ), rgba(255, 255, 255, 0.5);
        box-shadow: 0 2px 8px rgba(120, 60, 40, 0.05);
        .detail{
            position: absolute;
            left: 90%;
            top: 5%;
            cursor: pointer;
            &:hover{
                font-weight: 700;
            }
        }
        .namepic{
            display: flex;
            align-items: center;
            gap: 8px;
            .avatar{
                width: 2.6vw;
                height: 5.2vh;
                min-width: 28px;
                min-height: 28px;
                border-radius: 50%;
                overflow: hidden;
                border: 2px solid rgba(255, 255, 255, 0.9);
                box-shadow: 0 2px 6px rgba(120, 60, 40, 0.15);
                img{
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
            }
            .name{
                font-size: 0.9em;
                font-weight: 700;
                color: rgba(50, 50, 50, 0.85);
            }
        }
        .content{
            margin-top: 6px;
            font-size: 0.9em;
            line-height: 1.6;
            color: rgba(50, 50, 50, 0.75);
        }
        > div:nth-child(3){
            margin-top: 2px;
            font-size: 0.8em;
            letter-spacing: 2px;
            color: rgba(128, 128, 128, 0.5);
        }
        .time{
            margin-top: 8px;
            text-align: right;
            font-size: 0.75em;
            font-weight: 300;
            color: rgba(128, 128, 128, 0.6);
        }
    }
}
</style>

<script setup lang="ts">
import type { myconmentitem } from '@/types/post';
import {formatPostTime} from '@/utils/time'
import { useRouter } from 'vue-router';
import { useWindowStore } from '@/stores/window';
import { ref } from 'vue';
const windowstore=useWindowStore()
const props=defineProps<{item:myconmentitem}>()
const commenttime=ref(props.item.my_comment.create_at)
const commenttimestr=formatPostTime(commenttime.value)
const posttime=ref(props.item.created_at)
const posttimestr=formatPostTime(posttime.value)
const router=useRouter()
const pushdetail=()=>{
    router.push(`/layout/content/detail/${props.item.id}`)
}
const opnewindow=()=>{
    if(props.item.my_comment.images[0]===undefined){return}
    windowstore.open('postimg',props.item.my_comment.images[0])
}
</script>