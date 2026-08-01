<template>
<div class="editor-container" :style="{'margin-top':datafa.margintop}">
    <div class="editor-body">
       <div class="editor-input" contenteditable='true' @focus="focus" @blur="blur" @input="input" ref="editorinput" :style="{'min-height':currentminheight}"></div>
       <span class="placeholder" v-show="showplaceholder && decide==='comment'">评论</span>
       <span class="placeholder" v-show="showplaceholder && decide==='publish'">说点什么..</span>
    </div>
    <div class="editor-tool" v-show="showtool">
        <div class="tool-container">
            <div class="face">
                <img src="@/assets/postface.svg" alt="" @mousedown.prevent="show" :class="{showchange:showchange1}">
                <div class="emoji"><emoji-picker :showemoji="showemoji" @select="insertemoji"></emoji-picker></div>
            </div>
            <div class="picture">
                <img src="@/assets/postpic.svg" alt="" @mousedown.prevent="triggerinput" :class="{showchange:showchange2}">
                <input type="file" ref="inpic" style="display: none;" @change="handfilechange" accept="image/*">
            </div>
            <div class="button">
                <el-button type="primary">发布</el-button>
            </div>
        </div>
    </div>
</div>
</template>

<style scoped lang="scss">
.editor-container{
    width: 100%;
    min-height: 6vh;
    .editor-body{
        width: 100%;
        height: fit-content;
        position: relative;
        background-color: white;
        .editor-input{
            width: 100%;
            font-size: 0.8em;
            line-height: 4vh;
            caret-color: #333;
            outline: none;
            transition: min-height 0.3s ease !important;
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
        width: 100%;
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
            margin-left: auto;
        }
    }
}
</style>

<script setup lang="ts">
import { ref,defineAsyncComponent,computed } from 'vue';
import type { EmojiExt } from 'vue3-emoji-picker';
const EmojiPicker=defineAsyncComponent(()=>import('./EmojiPicker.vue'))
let showplaceholder=ref(true)
const showemoji=ref(false)
const inpic=ref<HTMLInputElement>()
const showchange1=ref(false)
const showchange2=ref(false)
let showtool=ref(false)
const props=defineProps<{
    margintop?:string,
    showeditor?:boolean,
    minheight?:string
    decide?:string
}>()
const currentminheight=ref(props.minheight)
const datafa=computed(()=>({
    margintop:props.margintop,
    showeditor:props.showeditor,
    minheight:props.minheight,
    decide:props.decide
}))
if(datafa.value.showeditor){
    showtool.value=true
}else{
    showtool.value=false
}
const editorinput=ref()
const ZWSP = '\u200B' 
let isToolbar:boolean
//用于触发上传头像的功能和图片按钮的状态
const triggerinput=()=>{
    inpic.value?.click()
    isToolbar=true
    if(!showchange2.value){
        showchange2.value=true
    }else{
        showchange2.value=false
    }
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
if(props.decide==='comment'){
    currentminheight.value= '10vh'
}
}
//用于插入表情
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
//用于决定表情按钮状态的变化
const show=()=>{
    if(!showchange1.value){
        showchange1.value=true
    }else{
        showchange1.value=false
    }
    if(showemoji.value){
        showemoji.value=false
    }else{
        showemoji.value=true
    }
}
//失去焦点的处理函数
const blur=()=>{
    if(isToolbar){
        isToolbar=false
        return
    }
    const text=(editorinput.value?.innerText || '').replace(new RegExp(ZWSP,'g'),'').trim()
    showplaceholder.value=(text.length===0)
    if(props.decide==='comment'){
        showtool.value=false
        currentminheight.value=datafa.value.minheight 
    }
    showemoji.value=false
    showchange1.value=false
    showchange2.value=false
}
//输入时的处理函数
const input=()=>{
    const text=(editorinput.value?.innerText || '').replace(new RegExp(ZWSP,'g'),'').trim()
    showplaceholder.value=(text.length===0)    
}
</script>