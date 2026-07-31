<template>
<div class="editor-container">
    <div class="editor-body">
       <div class="editor-input" contenteditable='true' @focus="focus" @blur="blur" @input="input" ref="editorinput"></div>
       <span class="placeholder" v-show="showplaceholder">评论</span>
       <span class="placeholder" v-show="false">说点什么...</span>
    </div>
    <div class="editor-tool" v-show="showtool">
        <div class="tool-container">
            <div class="face">
                <img src="@/assets/postface.svg" alt="" @mousedown.prevent="show" :class="{showchange:showchange}">
                <div class="emoji"><emoji-picker :showemoji="showemoji" @select="insertemoji"></emoji-picker></div>
            </div>
            <div class="picture">
                <img src="@/assets/postpic.svg" alt="" @mousedown.prevent="triggerinput">
                <input type="file" ref="inpic" style="display: none;" @change="handfilechange" accept="image/*" >
            </div>
            <div class="button">
                <el-button type="primary">发表</el-button>
            </div>
        </div>
    </div>
</div>
</template>

<style scoped lang="scss">
.editor-container{
    margin-top: 3vh;
    width: 100%;
    min-height: 6vh;
    .editor-body{
        width: 100%;
        height: fit-content;
        position: relative;
        background-color: white;
        .editor-input{
            width: 100%;
            min-height: 6vh;
            font-size: 0.8em;
            line-height: 4vh;
            caret-color: #333;
            outline: none;
            transition: min-height 0.3s ease;
            &:focus{
                min-height: 10vh;
            }
        }
        .placeholder{
              position: absolute;  
              color: #bbb;
              left: 1%;
              top: 1vh;
              pointer-events: none;
            }
    }
    .editor-tool{
        margin-top: 2vh;
        .tool-container{
            display: flex;
        }
        .face{
            width: fit-content;
            height: fit-content;
            cursor: pointer;
            position: relative;
        }
        .picture{
            width: fit-content;
            height: fit-content;
            cursor: pointer;
        }
        img.showchange{
            width: 3vw;
            height: 3vh;
        }
        img{
            width: 2.5vw;
            height: 2.5vh;
            transition: width 0.3s ease,height 0.3s ease;
            
        }
        .button{
            margin-left: 65%;
        }
    }
}
</style>

<script setup lang="ts">
import { ref,defineAsyncComponent } from 'vue';
import type { EmojiExt } from 'vue3-emoji-picker';
const EmojiPicker=defineAsyncComponent(()=>import('./EmojiPicker.vue'))
let showplaceholder=ref(true)
const showemoji=ref(false)
const inpic=ref<HTMLInputElement>()
const showchange=ref(false)
let showtool=ref(false)
const editorinput=ref()
const ZWSP = '\u200B' 
//触发上传照片功能
const triggerinput=()=>{
    inpic.value?.click()
}
const handfilechange=()=>{

}
const focus=()=>{
showplaceholder.value=false
showtool.value=true
if(editorinput.value){
    if(editorinput.value.innerText.trim()===''){
        editorinput.value.innerText=ZWSP
    }
}
}
//插入表情
const insertemoji=(emoji:EmojiExt)=>{
const emojichar=emoji.i
const edit=editorinput.value
edit.focus()
const slection=window.getSelection()
if(!slection){
    return
}
let range:Range
if(slection?.rangeCount>0){
range=slection.getRangeAt(0)
}else{
    range=document.createRange()
    range.selectNodeContents(edit)
    range.collapse(false)
}
const textnode=document.createTextNode(emojichar)
range.insertNode(textnode)
range.setStartAfter(textnode)
range.collapse(true)
slection.removeAllRanges()
slection.addRange(range)
}
//决定表情按钮的状态
const show=()=>{
    if(!showchange.value){
        showchange.value=true
    }else{
        showchange.value=false
    }
    if(showemoji.value){
        showemoji.value=false
    }else{
        showemoji.value=true
    }
}
//输入框失焦的函数
const blur=()=>{
    const text=(editorinput.value?.innerText || '').replace(new RegExp(ZWSP,'g'),'').trim()
    showplaceholder.value=(text.length===0)  
    showtool.value=false  
    showemoji.value=false
    showchange.value=false
}
//输入框输入变化的函数
const input=()=>{
    const text=(editorinput.value?.innerText || '').replace(new RegExp(ZWSP,'g'),'').trim()
    showplaceholder.value=(text.length===0)    
}
</script>