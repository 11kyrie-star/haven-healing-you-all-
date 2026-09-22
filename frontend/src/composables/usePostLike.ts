import { ElMessage } from "element-plus";
import { starpost,cancelstarpost } from "@/api/aboutpost";
import { ref } from "vue";
export function usePostLike(id:number,initlike:number,initcount:number){
const islkied=ref(initlike)
const likecount=ref(initcount)    
//点赞函数
let timer1:ReturnType<typeof setTimeout> | null=null
const togglelike=()=>{
    if(timer1){return}
    timer1=setTimeout(async()=>{
      try{  
       const res=await starpost(id)
    if(res.status===1){
        return ElMessage.warning('网络异常')
    }else{
        islkied.value=res.data.is_liked
        likecount.value++
    }}finally{
       clearTimeout(timer1!)
       timer1=null
    }
    },300)
}
//取消点赞
let timer2:ReturnType<typeof setTimeout> | null=null
const cancelstar=()=>{
    if(timer2){return}
    timer2=setTimeout(async()=>{
        try{
          const res=await cancelstarpost(id)
    if(res.status===1){
        return ElMessage.warning('网络异常')
    }else{
        islkied.value=res.data.is_liked
        likecount.value--
    }
        }finally{
            clearTimeout(timer2!)
            timer2=null
        }
    },300)
}
return {islkied,cancelstar,starpost,likecount,togglelike}
}