type Handler=(msg:any)=>void

class WsClient{
    private ws:WebSocket | null =null //是否已经连接
    private handlers=new Set<Handler>() //处理消息的函数集合，便于后续直接全部通知
    private heartbeatTimer:number | undefined //用于清空定时发送给服务器消息避免浏览器掐断websoket的定时器
    private reconnectTimer:number | undefined //用于清空重连的定时器
    private retryCount=0 //用于记录重连的次数
    private closedByUser=false //判断是否是我们自己断连
    connect(){
        const token=localStorage.getItem('token')
        if(!token || this.ws?.readyState===WebSocket.OPEN){return}
        this.closedByUser=false
        this.ws=new WebSocket(`ws://127.0.0.1:3007/ws?token=${encodeURIComponent(token)}`)
        this.ws.onopen=()=>{
            this.retryCount=0
            this.heartbeatTimer=setInterval(()=>{
                this.ws?.send(JSON.stringify({type:'ping'}))
            },25000)
        }
        this.ws.onmessage=(e)=>{
        const msg=JSON.parse(e.data)
        this.handlers.forEach((h)=>h(msg))
        }
        this.ws.onclose=()=>{
            this.Reconnect()
        }
        this.ws.onerror=()=>{
            this.ws?.close()
        }
    }
    private Reconnect=()=>{
        clearInterval(this.heartbeatTimer)
        if(this.closedByUser){return}
        const delay=Math.min(1000*2**this.retryCount,30000)
        this.retryCount++
        this.reconnectTimer=window.setTimeout(()=>{
           this.connect()
        },delay)
    }
    onMessage(handler:Handler){
        this.handlers.add(handler)
        return ()=>this.handlers.delete(handler)
    }
    close(){
        this.closedByUser=true
        clearTimeout(this.reconnectTimer)
        this.ws?.close()
    }
}
export const ws=new WsClient()