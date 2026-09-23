import { defineStore } from "pinia";
import {ref} from 'vue'
export const useWindowStore=defineStore('window',()=>{
    const visible=ref(false)
    const decwindow=ref('')
    const postimg=ref('')
    const postid=ref<number>(0)
    function open(type:string,img?:string,id?:number){
        decwindow.value=type
        if(img!==undefined){
            postimg.value=img
        }
        if(id!==undefined){
            postid.value=id
        }
        visible.value=true
    }
    function close(){
        visible.value=false
        decwindow.value=''
        postimg.value=''
    }
    return {visible,open,close,decwindow,postimg,postid}
})