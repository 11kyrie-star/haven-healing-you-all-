import {ref} from 'vue'
import { defineStore } from 'pinia'
import type { post } from '@/types/post'
export const usePostFeedStore=defineStore('postfeed',()=>{
    const newpost=ref<post | null>()
    function publish(p:post){
        newpost.value=p
    }
    function consume(){
        newpost.value=null
    }
    return {newpost,publish,consume}
})