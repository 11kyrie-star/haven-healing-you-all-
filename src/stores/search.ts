import { defineStore } from "pinia";
import { getsearchrecord,addrecordapi,delterecordall,delterecord,searchhot } from "@/api/search";
import type { searchhotlist } from "@/types/search";
import {ref} from 'vue'
import { ElMessage } from "element-plus";
export const useSearchStore=defineStore('search',()=>{
    const recordlist=ref<string[]>([])
    const hotlist=ref<searchhotlist[]>([])
    const error=ref(false)
    async function inintrecord(){
      try{
       const res=await getsearchrecord()
       if(res.status===0){
        recordlist.value=res.data.list
        error.value=false
       }}catch{
         error.value=true
       }
    }
    async function addrecord(data:string){
       const res=await addrecordapi(data)
       if(res.status===0){
        recordlist.value.push(data)
       }
    }
    async function deleteallrecord(){
      try{
      const res=await delterecordall()
      if(res.status===0){
         recordlist.value=[]
      }}catch{
         ElMessage.warning('网络异常')
      }
    }
    async function deltetherecord(keyword:string,index:number){
      try{
      const res=await delterecord(keyword)
      if(res.status===0){
         recordlist.value.splice(index,1)
      }}catch{
         error.value=true
      }
    }
    async function inithot(){
      try{
      const res=await searchhot()
      if(res.status===0){
         hotlist.value=res.data.list
         error.value=false
      }}catch{
         error.value=true
      }
    }
    return {inintrecord,addrecord,recordlist,deleteallrecord,deltetherecord,inithot,hotlist,error}
})