import { defineStore } from "pinia";
import type { NotificationItem } from "@/types/note";
import { clear } from "@/api/note";
import {ref} from 'vue'
import { ElMessage } from "element-plus";
export const useNotificationStore=defineStore('notification',()=>{
    const list=ref<NotificationItem[]>([])
    const connect=ref<boolean>(false)
    const unread=ref(0)
    function add(item:NotificationItem){
        unread.value++
        list.value.unshift(item)
    }
    function MarkAllread(){
        unread.value=0
    }
    function init(items:NotificationItem[]){
        list.value=items
        unread.value=items.filter((item)=>!item.is_read).length
    }
    async function clearmessage(){
        try{
        const res=await clear()
        if(res.status===0){
            ElMessage.success(res.msg)
            list.value=[]
            unread.value=0
        }}catch{
            ElMessage.warning('服务器或者网络异常')
        }
    }
    return {list,unread,MarkAllread,init,add,connect,clearmessage}
})