export function formatPostTime(time:string){
    const date=new Date(time)
    const now=new Date()
    const today=new Date(now.getFullYear(),now.getMonth(),now.getDate())
    const target=new Date(date.getFullYear(),date.getMonth(),date.getDate())
    const diffdays=(today.getTime()-target.getTime())/(1000*60*60*24)
    const hours=date.getHours().toString().padStart(2,'0')
    const minute=date.getMinutes().toString().padStart(2,'0')
    const timestr=`${hours}:${minute}`
    if(diffdays===0){
        return `今天 ${timestr}`
    }
    if(diffdays===1){
        return `昨天 ${timestr}`
    }
    if(diffdays===2){
        return `前天 ${timestr}`
    }
    if(date.getFullYear()===now.getFullYear()){
        return `${date.getMonth()+1}月${date.getDate()}日`
    }
    return `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日`
}