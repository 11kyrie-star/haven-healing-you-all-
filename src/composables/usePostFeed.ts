import {ref} from 'vue'
import type { getpost,postitem ,post} from '@/types/post';
type FeedFetcher=(params:{page:number,size:number})=>Promise<getpost>
export function usePostFeed(fetcher:FeedFetcher){
//接口返回的帖子的信息
let res=ref<getpost>()
//帖子的数据
let postlist=ref<postitem[]>([])
//用于向后端的拿数据
let page=ref(1)
const size=10
//用于判断页面的状态
const error=ref(false)
const empty=ref(false)
const loading=ref(false)
const hasMore=ref(true)
//数据加载函数
const loadmore=async()=>{
if(loading.value || !hasMore.value){return}
if(error.value){error.value=false}
loading.value=true
try{
const postres=await fetcher({page:page.value,size:size})
    if(postres.status===0){
       res.value=postres
       postlist.value.push(...res.value.data.list)
       page.value++
       hasMore.value=res.value.data.hasMore
       if(postlist.value.length===0){
        empty.value=true
       }
    }
}catch{
    error.value=true
}finally{
    loading.value=false
}
}
//添加帖子
const addpost=(post:post)=>{
    postlist.value.unshift(post)
}
return {postlist,error,empty,loading,hasMore,loadmore,addpost}
}