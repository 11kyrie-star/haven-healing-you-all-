export function isTokenExpired(token:string|null):boolean{
    if(!token || !token.includes('.')){
        return true
    }
    const base64=token?.split('.')[1]
    if(!base64){
        return true
    }
    try{
    const tokenob=JSON.parse(atob(base64 as string))
    if(tokenob.exp*1000<Date.now()){
        return true
    }
}catch{
    return true
}
    return false
}