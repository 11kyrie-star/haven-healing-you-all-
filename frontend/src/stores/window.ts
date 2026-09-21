import { defineStore } from "pinia";
import {ref} from 'vue'
export const useWindowStore=defineStore('window',()=>{
    const visible=ref(false)
    const decwindow=ref('')
    const postimg=ref('')
    function open(type:string,img?:string){
        decwindow.value=type
        if(img!==undefined){
            postimg.value=img
        }
        visible.value=true
    }
    function close(){
        visible.value=false
        decwindow.value=''
        postimg.value=''
    }
    return {visible,open,close,decwindow,postimg}
})