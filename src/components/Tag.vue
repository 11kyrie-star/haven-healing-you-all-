<template>
<div class="tag-container">
    <div class="tag-input" v-show="showinput">
        <input type="text" placeholder="请输入要添加的标签" ref="taginput">
        <el-button type="primary" @mousedown.prevent="readdtag" :loading="showload">添加</el-button>
    </div>
    <div class="tag-list">
        <div class="tag-item" v-for="item in tagsList" :key="item" @mousedown.prevent="$emit('select',item)">#{{ item }}</div>
        <div class="tag-item" @mousedown.prevent="addtag">+自定义标签</div>
    </div>
    <div class="own-tagtitle">自定义标签</div>
    <div class="no-owntag" v-show="owntagList.length===0">无自定义标签</div>
    <div class="own-list">
        <div class="tag-item" v-for="(item,index) in owntagList" :key="item" @mousedown.stop.prevent="$emit('select',item)">
            <span>#{{ item }}</span>
            <div class="close">
                <Close @click.self="delowntags(index)"></Close>
            </div>
        </div>
    </div>
</div>
</template>

<style scoped lang="scss">
.tag-container{
    position: absolute;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    padding: 8px;
    min-width: 20vw;
    cursor: default;
    .no-owntag{
        padding: 12px 0;
        text-align: center;
        font-size: 0.8em;
        color: #cba79e;
        background:rgba(197, 98, 77, 0.04);
        border: 1px dashed rgba(197, 98, 77, 0.2);
        border-radius: 4px;
        cursor: default;
    }
    .tag-input{
        display: flex;
        gap: 6px;
        input{
            flex: 1;
            border: 1px solid #e0d0cc;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 0.8em;
            background:rgba(197, 98, 77, 0.06);
            outline: none;
            &:focus{
                border-color: #C5624D;
                background: #fff;
            }
            &::placeholder{
                color: #cba79e;
            }
        }
    }
    .own-tagtitle{
        cursor: default;
        font-size: 1em;
        margin-top: 6px;
        margin-bottom: 6px;
    }
    .tag-list{
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        .tag-item{
            padding: 4px 10px;
            font-size: 0.8em;
            color:#C5624D ;
            background: rgba(197, 98, 77, 0.08);
            border-radius: 4px;
            cursor: pointer;
            white-space: nowrap;
            transition: background 0.2s;
            &:hover{
                background: rgba(197, 98, 77, 0.18);
            }
        }
    }
    .own-list{
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        .tag-item{
            position: relative;
            display: flex;
            padding: 1px 10px;
            font-size: 0.8em;
            color:#C5624D ;
            background: rgba(197, 98, 77, 0.08);
            border-radius: 4px;
            cursor: pointer;
            white-space: nowrap;
            transition: background 0.2s;
            .close{
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                right: 4px;
                width: 16px;
                height: 12px;
                vertical-align: middle; 
                opacity: 0;
                transition: opacity 0.2s;
            }
            &:hover{
                background: rgba(197, 98, 77, 0.18);
                padding-right: 22px;
                .close{
                    opacity: 1;
                }
            }
        }
    }
}
</style>

<script setup lang="ts">
import {ref,onMounted} from 'vue'
import { gettagsapi,getowntagsapi,updateowntag} from '@/api/aboutpost';
import {Close} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus';
import { findsensitvie } from '@/utils/sensitvie';
const props=defineProps<{
    decide:string
}>()
const tagsList=ref<string[]>([])
const owntagList=ref<string[]>([])
const showinput=ref(false)
const taginput=ref()
const addtag=()=>{
    showinput.value=true
}
const showload=ref(false)
//添加自定义标签部分
const anowntaglist=ref<string[]>([])
anowntaglist.value=owntagList.value
const readdtag=async()=>{
showload.value=true    
const clean=taginput.value.value.replace(/#/g,'')
if(!clean.trim()){
    return ElMessage.warning('自定义标签内容不能为空')
}
const decide=findsensitvie(clean)
if(decide){
    return ElMessage.warning('标签不能包含敏感词汇')
}
if(/[\s,，、；;。]/.test(clean)){
    return ElMessage.warning('一次只能添加一个标签,标签不能包含符号')
}
if(owntagList.value.includes(clean)){
    return ElMessage.warning('该标签已存在,请勿重复添加')
}
anowntaglist.value.push(clean)
try{
const res=await updateowntag(anowntaglist.value)
console.log(res)
if(res.status===0){
    owntagList.value=anowntaglist.value
    taginput.value.value=''
    return ElMessage.success('添加成功')
}else{
    return ElMessage.warning(res.msg)
}
}finally{
    showload.value=false
}
}
onMounted(async()=>{
if(props.decide==='publish'){    
const res=await gettagsapi()
const ownres=await getowntagsapi()
tagsList.value=res.data.tags
owntagList.value=ownres.data.tags
}else{
    return
}
})
//删除自定义标签部分
const aginowntaglist=ref<string[]>([])
aginowntaglist.value=owntagList.value
const delowntags=async(index:number)=>{
aginowntaglist.value.splice(index,1)
try{
const res=await updateowntag(aginowntaglist.value)
if(res.status===0){
    owntagList.value.splice(index,1)
}
}catch{
    return
}
}
defineEmits<{select:[item:string]}>()
</script>