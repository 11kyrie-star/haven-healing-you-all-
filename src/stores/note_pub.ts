import { defineStore } from "pinia";
import type { NotificationItem } from "@/types/note";
import {ref} from 'vue'
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
    return {list,unread,MarkAllread,init,add,connect}
})