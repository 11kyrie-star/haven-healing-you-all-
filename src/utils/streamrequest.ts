import { ElMessage } from "element-plus"
type MessageStatus='done' | 'pending' | 'stopped' | 'error'
type message={
id:number,
from:string,
content:string,
time:string,
status?:MessageStatus
}
export async function streamrequest(history:message[],addmessage:(message:string)=>void,signal:AbortSignal){
    const token=localStorage.getItem('token')
    if(!token){return}
    const requestMessages=history.filter((message)=>{
        if(message.from==='user'){return true}
        if(message.from==='ai'){return message.status==='done'}
        return false
    })
    const response=await fetch('http://127.0.0.1:3007/haven/ai/chat',{
        method:'POST',
        headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
        body:JSON.stringify({messages:requestMessages}),
        signal
    })
    if(!response.ok){
        return ElMessage.warning('网络或者服务器异常')
    }
    const reader=response.body!.getReader()
    const decoder=new TextDecoder()
    let buffer=''
    while(true){
        if(signal.aborted){
            reader.cancel()
            return
        }
        const {done,value}=await reader.read()
        if(done){break}
        buffer+=decoder.decode(value,{stream:true})
        const parts=buffer.split('\n\n')
        const last=parts.pop()
        if(last){buffer=last}else{
            buffer=''
        }
        for(const part of parts){
            const line=part.trim()
            if(!line.startsWith("data:")){continue}
            const msg:{type:string,content:string}=JSON.parse(line.slice(5).trimStart())
            if(msg.type==='delta'){
                addmessage(msg.content)
            }else if(msg.type==='done'){
                return
            }else{
                return ElMessage.warning('网络或者服务器异常')
            }
        }
    }
}