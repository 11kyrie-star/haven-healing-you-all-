import {ref} from 'vue'
import type { comment, commentnode } from '@/types/post'
import { getpostcomment, getpostreply } from '@/api/aboutpost'

function createCommentNode(item: comment): commentnode {
    return {
        ...item,
        children: [],
        showreply: false,
        replyPage: 1,
        replyHasMore: true,
        replyLoading: false,
        replyError: false
    }
}
export function useCommentLoad(id:number,commcount:number){
    let page=ref(1)
    const activereplyid=ref<number | null>(null)
    const commentcount=ref(commcount)
    const isCommentactive=ref(false)
    const showcomment=ref(false)
    const size=10
    const commentsLoading=ref(false)
    const commentsError=ref(false)
    const hasMoreComments=ref(true)
    const commentList=ref<comment[]>([])
    const roots=ref<commentnode[]>([])
    function biuldtree(list:comment[]):commentnode[]{
    const map=new Map<number,commentnode>()
    const roots=ref<commentnode[]>([])
    for(const item of list){
        map.set(item.id,createCommentNode(item))
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
//加载评论函数
    const loadMoreComments=async()=>{
    if(commentsLoading.value || !hasMoreComments.value){return}
    if(commentsError.value){commentsError.value=false}
    commentsLoading.value=true
    try{
        const res=await getpostcomment(id,page.value,size)
        if(res.status===0){
        commentList.value=res.data.list
        roots.value=biuldtree(commentList.value)
        page.value++
        hasMoreComments.value=res.data.hasMore
        }
    }catch{
        commentsError.value=true
    }finally{
        commentsLoading.value=false
    }
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
// 首次展开评论时加载第一页，加载更多时按该评论自己的页码继续
const replysize=10
const requestReplies=async (node:commentnode,openAfterLoad:boolean)=>{
    node.replyLoading=true
    node.replyError=false
    try{
        const res=await getpostreply(node.id,node.replyPage,replysize)
        if(res.status===0){
            node.children.push(...res.data.list.map(createCommentNode))
            node.replyPage++
            node.replyHasMore=res.data.hasMore
        }
    }catch{
        node.replyError=true
    }finally{
        node.replyLoading=false
        if(openAfterLoad){
            node.showreply=true
        }
    }
}
const openReplies=async (commId:number)=>{
    const node=findNode(roots.value,commId)
    if(!node || node.replyLoading) return
    if(node.children.length>0){
        node.showreply=true
        return
    }
    await requestReplies(node,true)
}
const loadMoreReplies=async (commId:number)=>{
    const node=findNode(roots.value,commId)
    if(!node || node.replyLoading || node.children.length===0 || !node.replyHasMore) return
    await requestReplies(node,false)
}
//点击评论以后的处理函数
const commenthandle=()=>{
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
loadMoreComments()
}else{
    showcomment.value=false
}
}
//添加评论函数
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
            parent.children.unshift(createCommentNode(comment))
            parent.showreply=true   
        }                    
    }
    activereplyid.value=null
}
return {roots,loadMoreComments,hasMoreComments,commentList,commentsError,commentsLoading,commenthandle,isCommentactive,showcomment,addcomment,activereplyid,findNode,commentcount,openReplies,loadMoreReplies}
}
