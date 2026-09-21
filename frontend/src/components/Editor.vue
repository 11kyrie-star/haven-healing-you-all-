<template>
<div class="editor-container" :style="{'margin-top':datafa.margintop}" :class="{flash:isflash}">
    <div class="editor-body">
       <div class="editor-input" contenteditable='true' @focus="focus" @blur="blur" @input="input" @keydown="onkeydown" ref="editorinput" :style="{'min-height':currentminheight}"></div>
       <span class="placeholder" v-show="showplaceholder && decide==='comment'">评论</span>
       <span class="placeholder" v-show="showplaceholder && decide==='publish'">说点什么...</span>
    </div>
    <div class="editor-tool" v-show="showtool">
        <div class="tool-container">
            <div class="face">
                <img src="@/assets/postface.svg" alt="" @mouseenter="enterface" @mousedown.prevent="show" :class="{showchange:showchange1}" ref="facebtn">
                <div class="emoji" ref="facetent"><emoji-picker v-if="showemoji" @select="insertemoji"></emoji-picker></div>
            </div>
            <div class="picture">
                <img src="@/assets/postpic.svg" alt="" @mousedown.prevent="triggerinput" :class="{showchange:showchange2}">
                <input type="file" ref="inpic" style="display: none;" @change="handfilechange" accept="image/*">
            </div>
            <div class="topic" v-show="decide==='publish'">
                <span @mousedown.prevent="tagfu" :class="{showchange:showchange3}" ref="tagbtn">#</span>
                <tag v-show="showtag" @select="inserttag" :decide="decide!" ref="tagtent"></tag>
            </div>
            <div class="button">
                <el-button type="primary" v-show="replybtn==='reply'" @click="sendreply" :loading="loadreply">回复</el-button>
                <el-button type="primary" v-show="showpublishbtn" @click="sendpost" :loading="load">发表</el-button>
            </div>
        </div>
    </div>
</div>
</template>

<style scoped lang="scss">
.editor-container{
    width: 100%;
    min-height: 6vh;
    border: 2px solid transparent;
    transition: border-color 0.3s ease;
    &.flash{
        border-color: #ef7d8e;
        box-shadow: 0 0 12px rgba(255, 107, 129, 0.5);
        animation: flash-border 1.2s ease;
    }
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
            word-break: break-all;
            overflow-wrap: break-word;
            transition: min-height 0.3s ease !important;
            [data-anchor]{
                display: block;
                width: 100%;
                font-size: 0;
                line-height: 0;
                user-select: none;
            }
            :deep(div){
                line-height: inherit;
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
        width: 100%;
        .tool-container{
            display: flex;
            align-items: center;
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
         .topic{
            align-self: center;
            height: fit-content;
            width: fit-content;
            margin-left: 3%;
            margin-bottom: 3%;
            cursor: pointer;
            position: relative;
            span{
                display: block;
                font-weight: 300;
                font-size: 1.5em;
            }
        }
    }
}
@keyframes flash-border{
    0%   { border-color: #ee788a; box-shadow: 0 0 16px rgba(255,107,129,0.6); }
    100% { border-color: transparent; box-shadow: none; }
}
</style>

<script setup lang="ts">
import  DOMPurify from 'dompurify';
import { onClickOutside } from '@vueuse/core';
import { ElMessage } from 'element-plus';
import {Close} from '@element-plus/icons-vue'
import { ref,computed,createVNode,render,defineAsyncComponent} from 'vue';
import { postpicApi,sendpostapi ,sendcomment,sendreplyapi} from '@/api/aboutpost.ts';
import type { post} from '@/types/post.ts';
import { findsensitvie } from '@/utils/sensitvie.ts';
import { compressimage } from '@/utils/compressimage.ts';
import type { EmojiExt } from 'vue3-emoji-picker';
import Tag from '@/components/Tag.vue';
import type { comment } from '@/types/post.ts';
import { useWindowStore } from '@/stores/window.ts';
let showplaceholder=ref(true)
const inpic=ref<HTMLInputElement>()
const showchange1=ref(false)
const showchange2=ref(false)
let showtool=ref(false)
let showtag=ref(false)
let showchange3=ref(false)
const showpublishbtn=ref(true)
//用于PostCard组件改变我们的编辑框状态,回复功能用
const replyId=ref<number | null>()
const replybtn=ref<string>()
const flash=(replyid:number,name:string)=>{
isflash.value=true
replyId.value=replyid
replybtn.value=name
showpublishbtn.value=false
currentminheight.value='10vh'
showtool.value=true
setTimeout(()=>{isflash.value=false},1200)
}
//预加载表情组件
const loademoji=()=>import('./EmojiPicker.vue')
const EmojiPicker=defineAsyncComponent(loademoji)
const emojichunkpreload=ref(false) //防止focus重复预加载
const preloademoji=()=>{
    if(emojichunkpreload.value){return}
    emojichunkpreload.value=true
    loademoji()
}
const enterface=()=>{
    preloademoji()
}
//从回复变回评论
const Change=()=>{
showpublishbtn.value=true
replybtn.value=''
blur()
}
defineExpose({flash,Change})
const isflash=ref(false)

const emit=defineEmits<{
    newcomment:[comment:comment],
    newpost:[post:post]
}>()
const tagfu=()=>{
    if(!showtag.value){
        showtag.value=true
        showchange3.value=true
    }else{
        showtag.value=false
        showchange3.value=false
    }
}
//如果点击表情列表和标签列表以外的地方就关闭
const facebtn=ref()
const facetent=ref()
const tagbtn=ref()
const tagtent=ref()
onClickOutside(facetent,()=>{
showemoji.value=false
showchange1.value=false
},{ignore:[facebtn]})
onClickOutside(tagtent,()=>{
    showtag.value=false
    showchange3.value=false
},{ignore:[tagbtn]})
//插入标签
const inserttag=(tag:string)=>{
const edit=editorinput.value
edit.focus()
showplaceholder.value=false
const selection=window.getSelection()
let range:Range
if(!selection){return}
if(selection?.rangeCount>0){
range=selection.getRangeAt(0)
}else{
    range=document.createRange()
    range.selectNodeContents(edit)
    range.collapse(false)
}
const hasSpan=document.createElement('span')
hasSpan.textContent='#'
hasSpan.style.color='#222'
hasSpan.style.fontWeight='700'
hasSpan.style.fontSize='1.5em'
hasSpan.contentEditable='false'
const tagSpan=document.createElement('span')
tagSpan.textContent=tag
tagSpan.style.color='#C5624D'
tagSpan.style.padding='1px 3px'
tagSpan.style.fontSize='1em'
tagSpan.style.fontWeight='500'
tagSpan.style.marginRight='3px'
tagSpan.contentEditable='false'
range.insertNode(hasSpan)
range.setStartAfter(hasSpan)
range.collapse(true)
range.insertNode(tagSpan)
range.setStartAfter(tagSpan)
range.collapse(true)
const space=document.createTextNode('\u200B')
range.insertNode(space)
range.setStartAfter(space)
range.collapse(true)
selection.removeAllRanges()
selection.addRange(range)
}
const props=defineProps<{
    margintop?:string,
    showeditor?:boolean,
    minheight?:string
    decide?:string,
    deciname?:number,
    post_id?:number
}>()
const currentminheight=ref(props.minheight)
const datafa=computed(()=>({
    margintop:props.margintop,
    showeditor:props.showeditor,
    minheight:props.minheight,
    decide:props.decide,
    deciname:props.deciname,
    post_id:props.post_id
}))
if(datafa.value.showeditor){
    showtool.value=true
}else{
    showtool.value=false
}
const editorinput=ref()
let isToolbar:boolean
//保存光标
const saveRange=ref<Range | null>(null)
//点击上传图片后的处理函数
const triggerinput=()=>{
    if(datafa.value.decide==='comment'&&urlList.value.length===1){
        return ElMessage.warning('最多上传一张图片')
    }
    if(replybtn.value==='reply'&&urlList.value.length===1){
        return ElMessage.warning('最多上传一张图片')
    }
    editorinput.value.focus()
    const sel=window.getSelection()
    if(sel && sel.rangeCount>0){
        saveRange.value=sel.getRangeAt(0).cloneRange()
    }
    inpic.value?.click()
    isToolbar=true
    if(!showchange2.value){
        showchange2.value=true
    }else{
        showchange2.value=false
    }
}
//按下某键的处理函数
const onkeydown=(e:KeyboardEvent)=>{
    if(e.key!=='Delete' && e.key!=='Backspace'){return}
    const sel=window.getSelection()
    if(!sel || sel.rangeCount===0){
        return
    }
    const range=sel.getRangeAt(0)
    if(e.key==='Delete' || e.key==='Backspace'){
        const node=range.endContainer
        const offset=range.endOffset
        if(node.nodeType===Node.TEXT_NODE && offset===node.textContent?.length){
            const next=node.parentElement?.nextElementSibling
            if(next?.getAttribute('data-image-grid')!==null){
                e.preventDefault()
                return
            }
        }
        const node2=range.startContainer
        const offset2=range.startOffset
        if(node2.nodeType===Node.TEXT_NODE && node2.textContent?.charAt(offset2-1)==='/u200B'){
            e.preventDefault()
            return
        }
    }
}
//存储图片地址的数组
const urlList=ref<string[]>([])
//选择图片后的处理函数
const handfilechange=async ()=>{    
const input=inpic.value
if(showplaceholder.value){
    showplaceholder.value=false
}
if(!input || !input.files || input.files.length===0){return}
const file=input.files[0]
const maxsize=10*1024*1024
if(file?.size!>maxsize){
    ElMessage.warning('图片大小不能超过10MB')
    return
}
if(!file?.type.startsWith('image/')){
    ElMessage.warning('请选择图片')
}
try{
    const newfile=await compressimage(file as File)
    const res=await postpicApi(newfile as File)
    const imageurl=res.data.url
    urlList.value.push(imageurl)
    buildgrid()
    showchange2.value=false
}catch{
    return
}
}

//构造九宫格容器
const buildgrid=()=>{
   const edit=editorinput.value
   if(!edit){return}
   edit.querySelectorAll('[data-anchor]').forEach((el:HTMLElement) => el.remove())
   const oldgrid=edit.querySelector('[data-image-grid]')
   if(oldgrid){
    oldgrid.querySelectorAll('.image-cell-close').forEach((item:HTMLElement)=>render(null,item))
    oldgrid.remove()}
   if(urlList.value.length===0){return}
   const layout=getgridstyle(urlList.value.length)
   const grid=document.createElement('div')
   grid.setAttribute('data-image-grid','')
   grid.contentEditable='false'
   grid.style.margin='5px 0'
   grid.style.borderRadius='8px'
   grid.style.overflow='hidden'
   if('special' in layout){
    grid.style.display='grid'
    grid.style.gridTemplateColumns='2fr 1fr'
    grid.style.gridTemplateRows='1fr 1fr'
    grid.style.gap='4px'
    grid.style.aspectRatio='4/3'
    urlList.value.forEach((item,index)=>{
        const cell=createimgcell(item,index)
        if(index===0){
            cell.style.gridRow='1/3'
        }
        grid.appendChild(cell)
    })
   }else{
    const {columns,rows,aspectRatio,gap}=getgridstyle(urlList.value.length)
    grid.style.display='grid'
    grid.style.gridTemplateColumns=`repeat(${columns},1fr)`
    grid.style.gridTemplateRows=`repeat(${rows},1fr)`
    grid.style.gap=gap!
    urlList.value.forEach((item,index)=>{
        const cell=createimgcell(item,index)
        cell.style.aspectRatio=aspectRatio!
        grid.appendChild(cell)
    })
   }
   let range:Range
   const selection = window.getSelection()
   if(saveRange.value && edit.contains(saveRange.value.commonAncestorContainer)){
    range=saveRange.value
    saveRange.value=null
   }else{
    saveRange.value=null
    if (!selection) { return }
    if (selection.rangeCount > 0) {
        range = selection.getRangeAt(0)
    } else {
        range = document.createRange()
        range.selectNodeContents(edit)
        range.collapse(false)
    }
   }
   range.insertNode(grid)
   const prev=grid.previousSibling
   if(!prev || (prev.nodeType===Node.TEXT_NODE && prev.textContent?.length===0)){
    const span=document.createElement('span')
    span.setAttribute('data-anchor','')
    span.textContent='\u2008'
    grid.before(span)
    range.setStart(span.firstChild!,0)
   }else{
    range.setStartAfter(grid)
   }
   range.collapse(true)
   selection!.removeAllRanges()
   selection!.addRange(range)
}
//获得九宫格样式
const getgridstyle=(num:number):{columns?:number,rows?:number,aspectRatio?:string,gap?:string,special?:string}=>{
   if(num===1){
    return {
        columns:1,
        rows:1,
        aspectRatio:'16/9',
        gap:'0px'
    }}
    if(num===2){
        return {
            columns:2,
            rows:1,
            aspectRatio:'1/1',
            gap:'4px'
        }
    }
    if(num===3){
        return {
            special:'layout3'
        }
    }
    if(num===4){
         return {
      columns: 2,
      rows: 2,
      aspectRatio: '1 / 1',
      gap: '4px'
    }
    }
     return {
    columns: 3,
    rows: Math.ceil(num / 3),
    aspectRatio: '1 / 1',
    gap: '4px'
  }
   }
const windowstore=useWindowStore()
//创建格子
const createimgcell=(url:string,index:number)=>{
const cell=document.createElement('div')
const closebtn=document.createElement('div')
cell.addEventListener('mouseenter',()=>closebtn.style.opacity='1')
cell.addEventListener('mouseleave',()=>closebtn.style.opacity='0')
Object.assign(closebtn.style,{
    position:'absolute',
    top: '6px',
    right: '6px',
    width:'22px',
    height:'22px',
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: '1',
    opacity: '0',
    transition: 'opacity 0.2s ease'
})
closebtn.className='image-cell-close'
const iconVNode=createVNode(Close,{style:{fontsize:'14px',color:'#fff'}})
render(iconVNode,closebtn)
closebtn.addEventListener('click',(e)=>{
   e.stopPropagation()
   urlList.value.splice(index,1)
   buildgrid()
})
cell.style.overflow='hidden'
cell.style.position='relative'
cell.appendChild(closebtn)
const img=document.createElement('img')
img.style.cursor='pointer'
img.addEventListener('click',()=>{
windowstore.open('postimg',url)
})
img.src=url
img.style.width='100%'
img.style.height='100%'
img.style.objectFit='cover'
img.style.display='block'
cell.appendChild(img)
return cell
}
//聚焦
const focus=()=>{
showplaceholder.value=false
showtool.value=true
if(props.decide==='comment'){
    currentminheight.value= '10vh'
}
preloademoji()
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
//按钮状态
const showemoji=ref(false)
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
//失焦
const blur=()=>{
    if(isToolbar){
        editorinput.value.focus()
        isToolbar=false
        return
    }
    const text=(editorinput.value?.innerText || '').trim()
    showplaceholder.value=(text.length===0)
    if(props.decide==='comment'){
        if(text.length || urlList.value.length){
            showtool.value=true
            currentminheight.value='10vh'
        }else{
        showtool.value=false
        currentminheight.value=datafa.value.minheight 
        }
    }
    showemoji.value=false
    showchange1.value=false
    showchange2.value=false
}
//输入
const input=()=>{
    const text=(editorinput.value?.innerText || '')
    showplaceholder.value=(text.length===0)    
}
//XSS过滤
const clean=(html:string):string=>{
   return DOMPurify.sanitize(html,{
    ALLOWED_TAGS:['br','span','div','img'],
    ALLOWED_ATTR:['src','alt','contenteditable','style','class']
   })
}
const load=ref(false) //按钮状态
//发帖/发表评论
const sendpost=async ()=>{
    if(datafa.value.decide==='publish'){
        const edit=editorinput.value
        if(!edit){return}
        const text=edit.textContent.replace(/\u2008/g,'').trim()
        if(text.length===0 && urlList.value.length===0){
            return ElMessage.warning('帖子内容不能为空')
        }
        const clone=edit.cloneNode(true) as HTMLElement
        const grid=clone.querySelector('[data-image-grid]')
        if(grid){grid.remove()}
        const data=clone.innerHTML
        const sensitive=findsensitvie(clone.textContent)
        if(sensitive){
            return ElMessage.warning('您的内容存在敏感词,无法发布')
        }
        const cleanhtml=clean(data)
        try{
            load.value=true
            const res=await sendpostapi({content:cleanhtml,images:urlList.value,is_anonymous:datafa.value.deciname})
            if(res.status===0){
                ElMessage.success('发帖成功')
                editorinput.value.innerHTML=''
                urlList.value=[]
                showplaceholder.value=true
                emit('newpost',res.data)
            }
        }finally{
            load.value=false
        }
    }
    if(datafa.value.decide==='comment'){
        const edit=editorinput.value
        if(!edit) return
        const text=edit.textContent.replace(/\u2008/g,'').trim()
        if(text.length===0 && urlList.value.length===0){
            currentminheight.value='10vh'
            return ElMessage.warning('评论不能为空')
        }
        const clone=edit.cloneNode(true) as HTMLElement
        const grid=clone.querySelector('[data-image-grid]')
        if(grid){grid.remove()}
        const data=clone.innerHTML
        const sensitive=findsensitvie(clone.textContent)
        if(sensitive){
            return ElMessage.warning('您的内容存在敏感词,无法发布')
        }
        const cleanhtml=clean(data)
        try{
            load.value=true
            const data={
                post_id:props.post_id!,
                content:cleanhtml,
                images:urlList.value
            }
            const res=await sendcomment(data)
            if(res.status===0){
                ElMessage.success('评论成功')
                editorinput.value.innerHTML=''
                urlList.value=[]
                showplaceholder.value=true
                emit('newcomment',res.data!)
            }
        }finally{
            load.value=false
        }
    }
}
const loadreply=ref(false)
//回复评论
const sendreply=async ()=>{
const edit=editorinput.value
        if(!edit) return
        const text=edit.textContent.replace(/\u2008/g,'').trim()
        if(text.length===0){
            currentminheight.value='10vh'
            return ElMessage.warning('回复不能为空')
        }
        const clone=edit.cloneNode(true) as HTMLElement
        const grid=clone.querySelector('[data-image-grid]')
        if(grid){grid.remove()}
        const data=clone.innerHTML
        const sensitive=findsensitvie(clone.textContent)
        if(sensitive){
            return ElMessage.warning('您的内容存在敏感词,无法发布')
        }
        const cleanhtml=clean(data)
        try{
        loadreply.value=true
        const res=await sendreplyapi(replyId.value!,cleanhtml,urlList.value)
        if(res.status===0){
            ElMessage.success('回复成功')
            urlList.value=[]
            editorinput.value.innerHTML=''
            replyId.value=null
            replybtn.value=''
            showpublishbtn.value=true
            showplaceholder.value=true
            emit('newcomment',res.data!)
        }
        }finally{
            loadreply.value=false
        }
}
</script>